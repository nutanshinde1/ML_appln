/* =====================================================================
 * ui.js  -  shared UI helpers used by every page
 * (navbar, footer, toasts, formatting, validation, route guards)
 * ===================================================================== */

// "" for pages in the project root, "../" for pages inside /admin
const ROOT = document.body.dataset.root || "";
const PAGE = document.body.dataset.page || "";

/* ---------- Formatting ---------- */
const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtDay = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
// Escape user-entered text before putting it in innerHTML
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Badges ---------- */
const BADGE_CLASS = {
  Pending: "text-bg-warning", Preparing: "text-bg-info", Ready: "text-bg-primary", Completed: "text-bg-success", Cancelled: "text-bg-danger",
  Available: "text-bg-success", Unavailable: "text-bg-secondary", Active: "text-bg-success", Blocked: "text-bg-danger", Paid: "text-bg-success",
};
const statusBadge = (s) => `<span class="badge rounded-pill ${BADGE_CLASS[s] || "text-bg-secondary"}">${esc(s)}</span>`;

/* ---------- Food image (photo if it exists, otherwise emoji tile) ---------- */
function foodThumb(item, extraClass = "") {
  const inner = item.image
    ? `<img src="${ROOT}${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" data-emoji="${esc(item.emoji || "🍽️")}">`
    : `<div class="food-emoji">${item.emoji || "🍽️"}</div>`;
  return `<div class="food-media ${extraClass}">${inner}</div>`;
}
// If a photo file is missing, swap it for the emoji tile (error events don't bubble, so capture)
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName === "IMG" && img.dataset.emoji) {
    const div = document.createElement("div");
    div.className = "food-emoji"; div.textContent = img.dataset.emoji;
    img.replaceWith(div);
  }
}, true);

/* ---------- Toasts ---------- */
function showToast(message, type = "success") {
  let box = document.getElementById("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox"; box.className = "toast-container position-fixed bottom-0 end-0 p-3"; box.style.zIndex = 2000;
    document.body.appendChild(box);
  }
  const icon = { success: "bi-check-circle-fill", danger: "bi-exclamation-triangle-fill", info: "bi-info-circle-fill", warning: "bi-exclamation-circle-fill" }[type] || "bi-info-circle-fill";
  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.setAttribute("role", "alert");
  el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${icon} me-2"></i>${esc(message)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  box.appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 2800 });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  t.show();
}

/* Inline Bootstrap alert inside a container element */
function showAlert(container, message, type = "danger") {
  container.innerHTML = `<div class="alert alert-${type} d-flex align-items-center" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i><div>${esc(message)}</div></div>`;
}

/* ---------- Form validation (Bootstrap classes) ---------- */
function validateForm(form) {
  form.classList.add("was-validated");
  const ok = form.checkValidity();
  if (!ok) form.querySelector(":invalid")?.focus();
  return ok;
}

/* ---------- Route guards ---------- */
// NOTE: client-side only. Real protection comes from the Spring Boot backend later.
function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    const next = location.pathname.split("/").pop() + location.search;
    location.replace(`${ROOT}login.html?next=${encodeURIComponent(next)}`);
    return null;
  }
  return user;
}
function requireAdmin() {
  const admin = getAdminSession();
  if (!admin) { location.replace(`${ROOT}admin/admin-login.html`); return null; }
  return admin;
}

/* ---------- Customer navbar + footer ---------- */
function renderNavbar() {
  const mount = document.getElementById("site-navbar");
  if (!mount) return;
  const user = getCurrentUser();
  const link = (href, label, key) => `<li class="nav-item"><a class="nav-link ${PAGE === key ? "active" : ""}" href="${ROOT}${href}">${label}</a></li>`;
  const account = user
    ? `<div class="dropdown">
         <button class="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-person-circle me-1"></i>${esc(user.name.split(" ")[0])}</button>
         <ul class="dropdown-menu dropdown-menu-end">
           <li><span class="dropdown-item-text small text-muted">${esc(user.email)}</span></li><li><hr class="dropdown-divider"></li>
           <li><a class="dropdown-item" href="${ROOT}orders.html"><i class="bi bi-receipt me-2"></i>My Orders</a></li>
           <li><a class="dropdown-item" href="${ROOT}feedback.html"><i class="bi bi-chat-heart me-2"></i>Feedback</a></li>
           <li><hr class="dropdown-divider"></li>
           <li><button class="dropdown-item text-danger" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</button></li>
         </ul></div>`
    : `<a class="btn btn-outline-light btn-sm" href="${ROOT}login.html">Login</a>
       <a class="btn btn-primary btn-sm" href="${ROOT}signup.html">Sign up</a>`;
  mount.innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark site-nav sticky-top">
    <div class="container">
      <a class="navbar-brand brand" href="${ROOT}index.html"><i class="bi bi-cup-hot-fill me-2"></i>Campus Café</a>
      <div class="d-flex align-items-center gap-2 order-lg-last">
        <a class="btn btn-outline-light btn-sm position-relative" href="${ROOT}cart.html" aria-label="Cart"><i class="bi bi-cart3"></i>
          <span class="cart-count badge rounded-pill bg-primary position-absolute top-0 start-100 translate-middle d-none">0</span></a>
        <div class="d-none d-lg-flex gap-2 align-items-center">${account}</div>
        <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Menu"><span class="navbar-toggler-icon"></span></button>
      </div>
      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav mx-auto">
          ${link("index.html", "Home", "home")}${link("menu.html", "Menu", "menu")}${link("orders.html", "My Orders", "orders")}${link("feedback.html", "Feedback", "feedback")}
          <li class="nav-item"><a class="nav-link" href="${ROOT}index.html#contact">Contact</a></li>
        </ul>
        <div class="d-lg-none d-flex gap-2 pb-2">${account.replace('id="logoutBtn"', 'id="logoutBtnMobile"')}</div>
      </div>
    </div>
  </nav>`;
  ["logoutBtn", "logoutBtnMobile"].forEach((id) => document.getElementById(id)?.addEventListener("click", () => {
    logoutUser(); location.href = ROOT + "login.html?msg=loggedout";
  }));
  updateCartBadge();
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.innerHTML = `
  <footer class="site-footer">
    <div class="container py-5">
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="brand fs-4 mb-2"><i class="bi bi-cup-hot-fill me-2"></i>Campus Café</div>
          <p class="small opacity-75 mb-0">A web-based cafeteria management system: browse the menu, pay first, skip the queue.</p>
        </div>
        <div class="col-6 col-lg-2"><h6>Explore</h6><ul class="list-unstyled small">
          <li><a href="${ROOT}menu.html">Menu</a></li><li><a href="${ROOT}cart.html">Cart</a></li><li><a href="${ROOT}orders.html">My Orders</a></li><li><a href="${ROOT}feedback.html">Feedback</a></li></ul></div>
        <div class="col-6 col-lg-2"><h6>Account</h6><ul class="list-unstyled small">
          <li><a href="${ROOT}login.html">Login</a></li><li><a href="${ROOT}signup.html">Sign up</a></li><li><a href="${ROOT}admin/admin-login.html">Admin panel</a></li></ul></div>
        <div class="col-lg-4"><h6>Project</h6>
          <p class="small opacity-75 mb-0">B.Tech Review 2 · Group GC14<br>Dept. of E&amp;TC Engineering, PCCOE Pune<br>Guide: Mr. Atul Pawar · A.Y. 2026-27</p></div>
      </div>
      <hr class="opacity-25 mt-4">
      <div class="small opacity-75 d-flex flex-wrap justify-content-between gap-2">
        <span>&copy; 2026 Cafeteria Management System. Frontend demo build.</span>
        <span>Payments and logins in this build are simulated.</span>
      </div>
    </div>
  </footer>`;
}

renderNavbar();
renderFooter();
