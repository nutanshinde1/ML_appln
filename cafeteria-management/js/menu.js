/* =====================================================================
 * menu.js  -  home page sections, menu.html and food-details.html
 * Data comes from api.js (getFoodItems / getCategories).
 * ===================================================================== */

const PAGE_SIZE = 8;

function foodCard(item, catName) {
  const soldOut = item.status !== "Available";
  return `
  <div class="col-sm-6 col-lg-4 col-xl-3">
    <div class="card food-card h-100 ${soldOut ? "sold-out" : ""}">
      <a href="food-details.html?id=${item.id}" class="text-decoration-none">${foodThumb(item)}</a>
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-1 gap-2">
          <span class="badge rounded-pill cat-pill">${esc(catName || "")}</span>
          ${soldOut ? '<span class="badge text-bg-secondary">Sold out</span>' : item.popular ? '<span class="badge text-bg-warning"><i class="bi bi-star-fill"></i> Popular</span>' : ""}
        </div>
        <h5 class="card-title mb-1"><a href="food-details.html?id=${item.id}" class="stretched-none text-reset text-decoration-none">${esc(item.name)}</a></h5>
        <p class="card-text small text-muted clamp-2 flex-grow-1">${esc(item.description)}</p>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <span class="price">${fmtINR(item.price)}</span>
          <button class="btn btn-sm btn-primary" data-add="${item.id}" ${soldOut ? "disabled" : ""}><i class="bi bi-cart-plus me-1"></i>Add</button>
        </div>
      </div>
    </div>
  </div>`;
}

// One handler for every "Add" button on the page
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  const qtyInput = document.getElementById("detailQty");
  const qty = qtyInput ? Number(qtyInput.value) || 1 : 1;
  addToCart(await getFoodItem(btn.dataset.add), qty);
});

document.addEventListener("DOMContentLoaded", () => {
  if (PAGE === "home") initHome();
  if (PAGE === "menu") initMenu();
  if (PAGE === "details") initDetails();
});

/* ---------- index.html ---------- */
async function initHome() {
  const [items, cats] = await Promise.all([getFoodItems(), getCategories()]);
  const catName = (id) => cats.find((c) => c.id === id)?.name;
  const featured = items.filter((i) => i.popular && i.status === "Available").slice(0, 4);
  document.getElementById("featuredGrid").innerHTML = featured.map((i) => foodCard(i, catName(i.categoryId))).join("");
  document.getElementById("categoryTiles").innerHTML = cats.filter((c) => c.status === "Active").map((c) => {
    const n = items.filter((i) => i.categoryId === c.id).length;
    return `<div class="col-6 col-md-4 col-lg"><a class="cat-tile" href="menu.html?category=${c.id}">
      <i class="bi ${esc(c.icon)}"></i><strong>${esc(c.name)}</strong><span class="small text-muted">${n} item${n === 1 ? "" : "s"}</span></a></div>`;
  }).join("");
}

/* ---------- menu.html ---------- */
async function initMenu() {
  const [items, cats] = await Promise.all([getFoodItems(), getCategories()]);
  const grid = document.getElementById("menuGrid");
  const params = new URLSearchParams(location.search);
  const state = { category: Number(params.get("category")) || 0, search: "", sort: "default", page: 1 };
  const catName = (id) => cats.find((c) => c.id === id)?.name;

  const pills = document.getElementById("categoryPills");
  pills.innerHTML = [`<button class="btn btn-pill" data-cat="0">All</button>`]
    .concat(cats.filter((c) => c.status === "Active").map((c) => `<button class="btn btn-pill" data-cat="${c.id}"><i class="bi ${esc(c.icon)} me-1"></i>${esc(c.name)}</button>`)).join("");

  function render() {
    pills.querySelectorAll("button").forEach((b) => b.classList.toggle("active", Number(b.dataset.cat) === state.category));
    let list = items.filter((i) => (!state.category || i.categoryId === state.category)
      && (i.name + " " + i.description).toLowerCase().includes(state.search.toLowerCase()));
    const sorters = {
      "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name), popular: (a, b) => Number(b.popular) - Number(a.popular),
    };
    if (sorters[state.sort]) list = [...list].sort(sorters[state.sort]);

    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    document.getElementById("resultCount").textContent = `${list.length} item${list.length === 1 ? "" : "s"} found`;
    grid.innerHTML = slice.length ? slice.map((i) => foodCard(i, catName(i.categoryId))).join("")
      : `<div class="col-12"><div class="card card-body text-center py-5"><i class="bi bi-search display-4 text-muted"></i><h5 class="mt-3">No items match your search</h5><p class="text-muted mb-0">Try another keyword or category.</p></div></div>`;

    let pg = "";
    if (pages > 1) for (let p = 1; p <= pages; p++) pg += `<li class="page-item ${p === state.page ? "active" : ""}"><button class="page-link" data-page="${p}">${p}</button></li>`;
    document.getElementById("pagination").innerHTML = pg;
  }

  pills.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { state.category = Number(b.dataset.cat); state.page = 1; render(); } });
  document.getElementById("searchInput").addEventListener("input", (e) => { state.search = e.target.value; state.page = 1; render(); });
  document.getElementById("sortSelect").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  document.getElementById("pagination").addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b) { state.page = Number(b.dataset.page); render(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
  render();
}

/* ---------- food-details.html ---------- */
async function initDetails() {
  const id = new URLSearchParams(location.search).get("id");
  const box = document.getElementById("detailBox");
  try {
    const [item, cats, all] = await Promise.all([getFoodItem(id), getCategories(), getFoodItems()]);
    const cat = cats.find((c) => c.id === item.categoryId);
    document.title = `${item.name} | Campus Café`;
    const soldOut = item.status !== "Available";
    box.innerHTML = `
      <div class="col-md-6">${foodThumb(item, "food-media-lg")}</div>
      <div class="col-md-6">
        <nav aria-label="breadcrumb"><ol class="breadcrumb small">
          <li class="breadcrumb-item"><a href="menu.html">Menu</a></li>
          <li class="breadcrumb-item"><a href="menu.html?category=${item.categoryId}">${esc(cat?.name || "")}</a></li>
          <li class="breadcrumb-item active">${esc(item.name)}</li></ol></nav>
        <h1 class="display-6 fw-bold">${esc(item.name)}</h1>
        <div class="mb-3">${statusBadge(item.status)} ${item.popular ? '<span class="badge text-bg-warning"><i class="bi bi-star-fill"></i> Popular</span>' : ""}</div>
        <p class="lead text-muted">${esc(item.description)}</p>
        <div class="price fs-2 my-3">${fmtINR(item.price)}</div>
        <div class="d-flex flex-wrap gap-3 align-items-center">
          <div class="input-group qty-group" style="width:150px">
            <button class="btn btn-outline-secondary" type="button" id="qtyMinus" aria-label="Decrease"><i class="bi bi-dash"></i></button>
            <input type="number" id="detailQty" class="form-control text-center" value="1" min="1" max="${MAX_QTY}" aria-label="Quantity">
            <button class="btn btn-outline-secondary" type="button" id="qtyPlus" aria-label="Increase"><i class="bi bi-plus"></i></button>
          </div>
          <button class="btn btn-primary btn-lg" data-add="${item.id}" ${soldOut ? "disabled" : ""}><i class="bi bi-cart-plus me-2"></i>Add to cart</button>
        </div>
        <ul class="list-unstyled small text-muted mt-4 mb-0">
          <li><i class="bi bi-lightning-charge me-2"></i>Pay first, collect fresh from the counter</li>
          <li><i class="bi bi-clock me-2"></i>Usually ready in 10–15 minutes</li></ul>
      </div>`;
    const qty = document.getElementById("detailQty");
    const clamp = () => { qty.value = Math.max(1, Math.min(MAX_QTY, Number(qty.value) || 1)); };
    document.getElementById("qtyMinus").onclick = () => { qty.value = Number(qty.value) - 1; clamp(); };
    document.getElementById("qtyPlus").onclick = () => { qty.value = Number(qty.value) + 1; clamp(); };
    qty.addEventListener("change", clamp);

    const related = all.filter((i) => i.categoryId === item.categoryId && i.id !== item.id).slice(0, 4);
    document.getElementById("relatedWrap").classList.toggle("d-none", !related.length);
    document.getElementById("relatedGrid").innerHTML = related.map((i) => foodCard(i, cat?.name)).join("");
  } catch (err) {
    box.innerHTML = `<div class="col-12 text-center py-5"><i class="bi bi-emoji-frown display-3 text-muted"></i><h3 class="mt-3">Item not found</h3><a href="menu.html" class="btn btn-primary mt-2">Back to menu</a></div>`;
  }
}
