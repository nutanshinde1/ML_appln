/* =====================================================================
 * admin.js  -  all admin pages (login, dashboard, items, orders,
 *              users, categories)
 * FRONTEND DEMO ONLY: the admin login is a demo credential, not secure
 * authentication. Real admin auth (JWT + roles) comes with Spring Boot.
 * ===================================================================== */

const ADMIN_SIZE = 6; // rows per page in admin tables

/* ---------- Shared layout: sidebar + top bar ---------- */
const ADMIN_NAV = [
  ["admin-dashboard", "admin-dashboard.html", "bi-speedometer2", "Dashboard"],
  ["admin-items", "admin-items.html", "bi-egg-fried", "Food Items"],
  ["admin-categories", "admin-categories.html", "bi-tags", "Categories"],
  ["admin-orders", "admin-orders.html", "bi-receipt", "Orders"],
  ["admin-users", "admin-users.html", "bi-people", "Customers"],
];

function adminNavHtml() {
  return `<div class="px-3 py-4 brand fs-5 text-white"><i class="bi bi-cup-hot-fill me-2"></i>Café Admin</div>
    <nav class="nav flex-column px-2">${ADMIN_NAV.map(([key, href, icon, label]) =>
      `<a class="nav-link ${PAGE === key ? "active" : ""}" href="${href}"><i class="bi ${icon} me-2"></i>${label}</a>`).join("")}</nav>
    <div class="mt-auto p-3 small">
      <a class="nav-link px-2" href="../index.html" target="_blank"><i class="bi bi-box-arrow-up-right me-2"></i>View customer site</a>
      <button class="nav-link px-2 btn btn-link text-start w-100 admin-logout"><i class="bi bi-box-arrow-left me-2"></i>Logout</button>
    </div>`;
}

function renderAdminShell(admin) {
  document.getElementById("adminSidebar").innerHTML = adminNavHtml();
  const title = document.body.dataset.title || "Admin";
  document.getElementById("adminTopbar").innerHTML = `
    <div class="admin-topbar d-flex align-items-center gap-3 px-3 px-lg-4 py-3">
      <button class="btn btn-outline-secondary d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#adminOffcanvas" aria-label="Open menu"><i class="bi bi-list"></i></button>
      <h1 class="h4 mb-0 flex-grow-1">${esc(title)}</h1>
      <span class="small text-muted d-none d-sm-inline"><i class="bi bi-person-circle me-1"></i>${esc(admin.name)}</span>
    </div>`;
  const oc = document.createElement("div");
  oc.className = "offcanvas offcanvas-start admin-sidebar-oc"; oc.id = "adminOffcanvas"; oc.tabIndex = -1;
  oc.innerHTML = `<div class="offcanvas-body p-0 d-flex flex-column">${adminNavHtml()}</div>`;
  document.body.appendChild(oc);
  document.querySelectorAll(".admin-logout").forEach((b) => b.addEventListener("click", () => { adminLogout(); location.href = "admin-login.html"; }));
}

/* ---------- Small helpers ---------- */
function renderPager(el, total, page, onPage) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_SIZE));
  el.innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) =>
    `<li class="page-item ${i + 1 === page ? "active" : ""}"><button class="page-link" data-p="${i + 1}">${i + 1}</button></li>`).join("") : "";
  el.onclick = (e) => { const b = e.target.closest("[data-p]"); if (b) onPage(Number(b.dataset.p)); };
  return Math.min(page, pages);
}
const paged = (list, page) => list.slice((page - 1) * ADMIN_SIZE, page * ADMIN_SIZE);
const emptyRow = (cols, text) => `<tr><td colspan="${cols}" class="text-center text-muted py-4">${text}</td></tr>`;

document.addEventListener("DOMContentLoaded", () => {
  if (PAGE === "admin-login") return initAdminLogin();
  const admin = requireAdmin();
  if (!admin) return;
  renderAdminShell(admin);
  ({ "admin-dashboard": initDashboard, "admin-items": initItems, "admin-categories": initCategories, "admin-orders": initAdminOrders, "admin-users": initUsers })[PAGE]?.();
});

/* ---------- admin-login.html ---------- */
function initAdminLogin() {
  if (getAdminSession()) { location.replace("admin-dashboard.html"); return; }
  const form = document.getElementById("adminLoginForm"), box = document.getElementById("formMessage");
  document.getElementById("fillAdmin").addEventListener("click", () => { form.email.value = "admin@cafeteria.com"; form.password.value = "admin123"; });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    try {
      // TODO: Replace mock admin login with Spring Boot REST API (POST /api/admin/auth/login)
      await adminLogin(form.email.value, form.password.value);
      location.href = "admin-dashboard.html";
    } catch (err) { showAlert(box, err.message); }
  });
}

/* ---------- admin-dashboard.html ---------- */
async function initDashboard() {
  // TODO: Replace with Spring Boot REST API (GET /api/admin/dashboard)
  const d = await getAdminDashboard();
  const stats = [
    ["Total Orders", d.totalOrders, "bi-receipt", "stat-brand"], ["Customers", d.totalCustomers, "bi-people", "stat-leaf"],
    ["Food Items", d.totalFoodItems, "bi-egg-fried", "stat-gold"], ["Revenue", fmtINR(d.totalRevenue), "bi-currency-rupee", "stat-ink"],
    ["Pending Orders", d.pendingOrders, "bi-hourglass-split", "stat-red"],
  ];
  document.getElementById("statCards").innerHTML = stats.map(([label, val, icon, cls]) => `
    <div class="col-6 col-xl"><div class="card stat-card ${cls} h-100"><div class="card-body">
      <i class="bi ${icon} stat-icon"></i><div class="small text-muted">${label}</div><div class="stat-value">${val}</div></div></div></div>`).join("");

  document.getElementById("recentBody").innerHTML = d.recentOrders.map((o) => `
    <tr><td class="fw-semibold">${esc(o.id)}</td><td>${esc(o.customerName)}</td><td>${fmtINR(o.total)}</td><td>${statusBadge(o.status)}</td></tr>`).join("");

  const max = Math.max(...d.popularItems.map((p) => p.qty), 1);
  document.getElementById("popularList").innerHTML = d.popularItems.map((p) => `
    <div class="mb-3"><div class="d-flex justify-content-between small"><span>${esc(p.name)}</span><span class="text-muted">${p.qty} sold</span></div>
    <div class="progress" style="height:8px"><div class="progress-bar" style="width:${(p.qty / max) * 100}%"></div></div></div>`).join("") || '<p class="text-muted">No sales yet.</p>';

  const maxRev = Math.max(...d.revenueByDay.map((r) => r.revenue), 1);
  document.getElementById("revenueChart").innerHTML = d.revenueByDay.map((r) => `
    <div class="bar-col" title="${fmtINR(r.revenue)}"><div class="bar-val small">${r.revenue ? fmtINR(r.revenue) : ""}</div>
    <div class="bar" style="height:${Math.max(4, (r.revenue / maxRev) * 100)}%"></div><div class="small text-muted">${r.label}</div></div>`).join("");

  document.getElementById("resetDemo").addEventListener("click", () => {
    if (confirm("Reset all demo data (items, orders, users, feedback) back to the original sample data?")) {
      const session = sessionStorage.getItem("cms_admin_session");
      resetDemoData(); sessionStorage.setItem("cms_admin_session", session); location.reload();
    }
  });
}

/* ---------- admin-items.html ---------- */
async function initItems() {
  const cats = await getCategories();
  let items = await getFoodItems();
  const st = { search: "", cat: "", status: "", page: 1 };
  const catName = (id) => cats.find((c) => c.id === id)?.name || "—";
  const form = document.getElementById("itemForm");
  const itemModal = new bootstrap.Modal(document.getElementById("itemModal"));
  const delModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  let deleteId = null;

  const opts = cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  form.categoryId.innerHTML = `<option value="">Select category</option>` + opts;
  document.getElementById("itemCatFilter").innerHTML = `<option value="">All categories</option>` + opts;

  function render() {
    const q = st.search.toLowerCase();
    const list = items.filter((i) => i.name.toLowerCase().includes(q) && (!st.cat || i.categoryId === Number(st.cat)) && (!st.status || i.status === st.status));
    st.page = renderPager(document.getElementById("itemsPager"), list.length, st.page, (p) => { st.page = p; render(); });
    document.getElementById("itemsBody").innerHTML = paged(list, st.page).map((i) => `
      <tr><td><div class="d-flex align-items-center gap-2">${foodThumb(i, "food-media-xs")}<div><div class="fw-semibold">${esc(i.name)}</div><div class="small text-muted d-none d-md-block clamp-1">${esc(i.description)}</div></div></div></td>
        <td class="d-none d-md-table-cell">${esc(catName(i.categoryId))}</td><td>${fmtINR(i.price)}</td><td>${statusBadge(i.status)}</td>
        <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-edit="${i.id}" aria-label="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-del="${i.id}" aria-label="Delete"><i class="bi bi-trash"></i></button></td></tr>`).join("") || emptyRow(5, "No food items found.");
    document.getElementById("itemsCount").textContent = `${list.length} item${list.length === 1 ? "" : "s"}`;
  }
  async function reload() { items = await getFoodItems(); render(); }

  document.getElementById("itemSearch").addEventListener("input", (e) => { st.search = e.target.value; st.page = 1; render(); });
  document.getElementById("itemCatFilter").addEventListener("change", (e) => { st.cat = e.target.value; st.page = 1; render(); });
  document.getElementById("itemStatusFilter").addEventListener("change", (e) => { st.status = e.target.value; st.page = 1; render(); });

  document.getElementById("addItemBtn").addEventListener("click", () => {
    form.reset(); form.classList.remove("was-validated"); form.itemId.value = "";
    document.getElementById("itemModalTitle").textContent = "Add food item"; itemModal.show();
  });
  document.getElementById("itemsBody").addEventListener("click", (e) => {
    const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
    if (ed) {
      const i = items.find((x) => x.id === Number(ed.dataset.edit));
      form.classList.remove("was-validated");
      form.itemId.value = i.id; form.name.value = i.name; form.categoryId.value = i.categoryId; form.price.value = i.price;
      form.emoji.value = i.emoji || ""; form.status.value = i.status; form.popular.checked = !!i.popular; form.description.value = i.description;
      document.getElementById("itemModalTitle").textContent = "Edit food item"; itemModal.show();
    }
    if (del) { deleteId = Number(del.dataset.del); document.getElementById("delName").textContent = items.find((x) => x.id === deleteId).name; delModal.show(); }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const data = { name: form.name.value.trim(), categoryId: Number(form.categoryId.value), price: Number(form.price.value), emoji: form.emoji.value.trim() || "🍽️", status: form.status.value, popular: form.popular.checked, description: form.description.value.trim() };
    try {
      // TODO: Replace with Spring Boot REST API (POST /api/admin/food-items or PUT /api/admin/food-items/{id})
      if (form.itemId.value) { await updateFoodItem(form.itemId.value, data); showToast("Food item updated"); }
      else { await addFoodItem(data); showToast("Food item added"); }
      itemModal.hide(); reload();
    } catch (err) { showToast(err.message, "danger"); }
  });
  document.getElementById("confirmDelete").addEventListener("click", async () => {
    // TODO: Replace with Spring Boot REST API (DELETE /api/admin/food-items/{id})
    await deleteFoodItem(deleteId); delModal.hide(); showToast("Food item deleted", "info"); reload();
  });
  render();
}

/* ---------- admin-categories.html ---------- */
async function initCategories() {
  let cats = await getCategories();
  const form = document.getElementById("catForm");
  const catModal = new bootstrap.Modal(document.getElementById("catModal"));
  const delModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  let deleteId = null;

  async function render() {
    const items = await getFoodItems();
    document.getElementById("catBody").innerHTML = cats.map((c) => `
      <tr><td><i class="bi ${esc(c.icon)} fs-5 me-2 text-primary"></i><span class="fw-semibold">${esc(c.name)}</span></td>
        <td class="d-none d-md-table-cell text-muted">${esc(c.description || "")}</td>
        <td>${items.filter((i) => i.categoryId === c.id).length}</td><td>${statusBadge(c.status)}</td>
        <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-edit="${c.id}" aria-label="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-del="${c.id}" aria-label="Delete"><i class="bi bi-trash"></i></button></td></tr>`).join("") || emptyRow(5, "No categories yet.");
  }
  async function reload() { cats = await getCategories(); render(); }

  document.getElementById("addCatBtn").addEventListener("click", () => {
    form.reset(); form.classList.remove("was-validated"); form.catId.value = "";
    document.getElementById("catModalTitle").textContent = "Add category"; catModal.show();
  });
  document.getElementById("catBody").addEventListener("click", (e) => {
    const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
    if (ed) {
      const c = cats.find((x) => x.id === Number(ed.dataset.edit));
      form.classList.remove("was-validated");
      form.catId.value = c.id; form.name.value = c.name; form.icon.value = c.icon; form.status.value = c.status; form.description.value = c.description || "";
      document.getElementById("catModalTitle").textContent = "Edit category"; catModal.show();
    }
    if (del) { deleteId = Number(del.dataset.del); document.getElementById("delName").textContent = cats.find((x) => x.id === deleteId).name; delModal.show(); }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const data = { name: form.name.value.trim(), icon: form.icon.value, status: form.status.value, description: form.description.value.trim() };
    try {
      // TODO: Replace with Spring Boot REST API (POST /api/admin/categories or PUT /api/admin/categories/{id})
      if (form.catId.value) { await updateCategory(form.catId.value, data); showToast("Category updated"); }
      else { await addCategory(data); showToast("Category added"); }
      catModal.hide(); reload();
    } catch (err) { showToast(err.message, "danger"); }
  });
  document.getElementById("confirmDelete").addEventListener("click", async () => {
    try { await deleteCategory(deleteId); showToast("Category deleted", "info"); } catch (err) { showToast(err.message, "danger"); }
    delModal.hide(); reload();
  });
  render();
}

/* ---------- admin-orders.html ---------- */
async function initAdminOrders() {
  // TODO: Replace with Spring Boot REST API (GET /api/admin/orders)
  let orders = await getOrders();
  const st = { search: "", status: "", page: 1 };
  const modal = new bootstrap.Modal(document.getElementById("orderModal"));
  const statusOpts = (cur) => ORDER_STATUSES.map((s) => `<option ${s === cur ? "selected" : ""}>${s}</option>`).join("");
  let openId = null;

  function render() {
    const q = st.search.toLowerCase();
    const list = orders.filter((o) => (o.id + " " + o.customerName).toLowerCase().includes(q) && (!st.status || o.status === st.status));
    st.page = renderPager(document.getElementById("ordersPager"), list.length, st.page, (p) => { st.page = p; render(); });
    document.getElementById("ordersBody").innerHTML = paged(list, st.page).map((o) => `
      <tr><td class="fw-semibold">${esc(o.id)}</td><td>${esc(o.customerName)}</td>
        <td class="d-none d-lg-table-cell small text-muted">${esc(o.items.map((i) => `${i.name} ×${i.qty}`).join(", "))}</td>
        <td>${fmtINR(o.total)}</td><td class="d-none d-md-table-cell">${fmtDay(o.date)}</td>
        <td><select class="form-select form-select-sm status-select" data-id="${esc(o.id)}" aria-label="Order status">${statusOpts(o.status)}</select></td>
        <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-view="${esc(o.id)}">View</button></td></tr>`).join("") || emptyRow(7, "No orders found.");
  }
  async function setStatus(id, status) {
    // TODO: Replace with Spring Boot REST API (PATCH /api/admin/orders/{id}/status)
    await updateOrderStatus(id, status);
    orders = await getOrders(); render(); showToast(`${id} marked as ${status}`);
  }
  document.getElementById("orderSearch").addEventListener("input", (e) => { st.search = e.target.value; st.page = 1; render(); });
  document.getElementById("orderStatusFilter").addEventListener("change", (e) => { st.status = e.target.value; st.page = 1; render(); });
  document.getElementById("ordersBody").addEventListener("change", (e) => { const s = e.target.closest(".status-select"); if (s) setStatus(s.dataset.id, s.value); });
  document.getElementById("ordersBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]"); if (!b) return;
    openId = b.dataset.view; const o = orders.find((x) => x.id === openId);
    document.getElementById("orderModalBody").innerHTML = orderDetailHtml(o);
    document.getElementById("modalStatus").innerHTML = statusOpts(o.status); modal.show();
  });
  document.getElementById("saveStatus").addEventListener("click", async () => { await setStatus(openId, document.getElementById("modalStatus").value); modal.hide(); });
  render();
}

/* ---------- admin-users.html ---------- */
async function initUsers() {
  // TODO: Replace with Spring Boot REST API (GET /api/admin/users)
  let users = await getUsers();
  const orders = await getOrders();
  const st = { search: "", status: "", page: 1 };

  function render() {
    const q = st.search.toLowerCase();
    const list = users.filter((u) => (u.name + u.email + u.phone).toLowerCase().includes(q) && (!st.status || u.status === st.status));
    st.page = renderPager(document.getElementById("usersPager"), list.length, st.page, (p) => { st.page = p; render(); });
    document.getElementById("usersBody").innerHTML = paged(list, st.page).map((u) => `
      <tr><td class="fw-semibold">${esc(u.name)}</td><td>${esc(u.email)}</td><td class="d-none d-md-table-cell">${esc(u.phone)}</td>
        <td class="d-none d-lg-table-cell">${fmtDay(u.registeredOn)}</td><td class="d-none d-md-table-cell">${orders.filter((o) => o.userId === u.id).length}</td><td>${statusBadge(u.status)}</td>
        <td class="text-end"><button class="btn btn-sm ${u.status === "Active" ? "btn-outline-danger" : "btn-outline-success"}" data-toggle="${u.id}">${u.status === "Active" ? "Block" : "Activate"}</button></td></tr>`).join("") || emptyRow(7, "No customers found.");
    document.getElementById("usersCount").textContent = `${list.length} customer${list.length === 1 ? "" : "s"}`;
  }
  document.getElementById("userSearch").addEventListener("input", (e) => { st.search = e.target.value; st.page = 1; render(); });
  document.getElementById("userStatusFilter").addEventListener("change", (e) => { st.status = e.target.value; st.page = 1; render(); });
  document.getElementById("usersBody").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-toggle]"); if (!b) return;
    const u = users.find((x) => x.id === Number(b.dataset.toggle));
    // TODO: Replace with Spring Boot REST API (PATCH /api/admin/users/{id}/status)
    await updateUserStatus(u.id, u.status === "Active" ? "Blocked" : "Active");
    users = await getUsers(); render(); showToast(`${u.name} is now ${u.status === "Active" ? "Blocked" : "Active"}`, "info");
  });
  render();
}
