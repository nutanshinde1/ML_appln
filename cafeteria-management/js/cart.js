/* =====================================================================
 * cart.js  -  shopping cart (store + cart.html page)
 * The cart lives in the browser (localStorage). When the backend is
 * added, the cart can stay client-side; only createOrder() in api.js
 * sends it to the server at checkout.
 * ===================================================================== */

const CART_KEY = "cms_cart";
const MAX_QTY = 20;

const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };
const saveCart = (cart) => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); };
const cartCount = () => getCart().reduce((n, i) => n + i.qty, 0);
const cartTotal = () => getCart().reduce((s, i) => s + i.price * i.qty, 0);   // Total = Σ (price × quantity)
const clearCart = () => saveCart([]);

function updateCartBadge() {
  const n = cartCount();
  document.querySelectorAll(".cart-count").forEach((b) => { b.textContent = n; b.classList.toggle("d-none", n === 0); });
}

function addToCart(item, qty = 1) {
  if (item.status !== "Available") { showToast(`${item.name} is currently unavailable.`, "warning"); return false; }
  const cart = getCart();
  const line = cart.find((c) => c.id === item.id);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
  else cart.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, image: item.image, qty: Math.min(MAX_QTY, qty) });
  saveCart(cart);
  showToast(`${qty} × ${item.name} added to cart`);
  return true;
}
function setQty(id, qty) {
  const cart = getCart();
  const line = cart.find((c) => c.id === id);
  if (!line) return;
  line.qty = Math.max(1, Math.min(MAX_QTY, qty));
  saveCart(cart);
}
function removeFromCart(id) { saveCart(getCart().filter((c) => c.id !== id)); }

// Re-sync cart with current menu (price changes / items removed by admin)
async function refreshCart() {
  const menu = await getFoodItems();
  const cart = getCart().filter((c) => menu.some((m) => m.id === c.id && m.status === "Available"))
    .map((c) => { const m = menu.find((x) => x.id === c.id); return { ...c, name: m.name, price: m.price, emoji: m.emoji, image: m.image }; });
  saveCart(cart);
  return cart;
}

/* ---------- cart.html ---------- */
async function renderCartPage() {
  const list = document.getElementById("cartList");
  const cart = await refreshCart();
  document.getElementById("clearCartBtn").classList.toggle("d-none", !cart.length);
  document.getElementById("checkoutBtn").classList.toggle("disabled", !cart.length);

  if (!cart.length) {
    list.innerHTML = `<div class="empty-state card card-body text-center py-5">
      <i class="bi bi-cart-x display-3 text-muted"></i><h4 class="mt-3">Your cart is empty</h4>
      <p class="text-muted">Pick something tasty from the menu.</p>
      <div><a href="menu.html" class="btn btn-primary">Browse menu</a></div></div>`;
  } else {
    list.innerHTML = cart.map((i) => `
      <div class="card cart-line mb-3"><div class="card-body">
        <div class="d-flex gap-3 align-items-center flex-wrap flex-sm-nowrap">
          ${foodThumb(i, "food-media-sm")}
          <div class="flex-grow-1">
            <h6 class="mb-1">${esc(i.name)}</h6><div class="text-muted small">${fmtINR(i.price)} each</div>
          </div>
          <div class="input-group input-group-sm qty-group" style="width:120px">
            <button class="btn btn-outline-secondary" data-act="dec" data-id="${i.id}" aria-label="Decrease"><i class="bi bi-dash"></i></button>
            <input type="text" class="form-control text-center" value="${i.qty}" readonly aria-label="Quantity">
            <button class="btn btn-outline-secondary" data-act="inc" data-id="${i.id}" aria-label="Increase"><i class="bi bi-plus"></i></button>
          </div>
          <div class="fw-semibold text-end line-total">${fmtINR(i.price * i.qty)}</div>
          <button class="btn btn-sm btn-outline-danger" data-act="rm" data-id="${i.id}" aria-label="Remove ${esc(i.name)}"><i class="bi bi-trash"></i></button>
        </div></div></div>`).join("");
  }
  const total = cartTotal();
  document.getElementById("sumItems").textContent = cartCount();
  document.getElementById("sumSubtotal").textContent = fmtINR(total);
  document.getElementById("sumTotal").textContent = fmtINR(total);
}

document.addEventListener("DOMContentLoaded", () => {
  if (PAGE !== "cart") return;
  renderCartPage();
  document.getElementById("cartList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const line = getCart().find((c) => c.id === id);
    if (btn.dataset.act === "inc") setQty(id, line.qty + 1);
    if (btn.dataset.act === "dec") setQty(id, line.qty - 1);
    if (btn.dataset.act === "rm") { removeFromCart(id); showToast("Item removed", "info"); }
    renderCartPage();
  });
  document.getElementById("clearCartBtn").addEventListener("click", () => { clearCart(); renderCartPage(); showToast("Cart cleared", "info"); });
});
