/* =====================================================================
 * checkout.js  -  checkout.html (Pay First flow) and order-success.html
 * Flow: validate details -> choose payment -> mock payment verification
 *       -> createOrder() -> order-success.html
 * No real payment gateway is used. Never enter real card details.
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (PAGE === "checkout") initCheckout();
  if (PAGE === "success") initSuccess();
});

async function initCheckout() {
  const user = requireLogin();
  if (!user) return;
  const cart = await refreshCart();
  if (!cart.length) { location.replace("cart.html"); return; }

  const form = document.getElementById("checkoutForm");
  form.fullName.value = user.name; form.phone.value = user.phone; form.email.value = user.email;

  document.getElementById("orderSummary").innerHTML = cart.map((i) =>
    `<li class="d-flex justify-content-between py-2 border-bottom"><span>${esc(i.name)} <span class="text-muted">× ${i.qty}</span></span><span>${fmtINR(i.price * i.qty)}</span></li>`).join("");
  const total = cartTotal();
  document.getElementById("coTotal").textContent = fmtINR(total);
  document.getElementById("payBtnAmount").textContent = fmtINR(total);

  // Show only the payment panel for the selected method
  const panels = { UPI: "upiPanel", Card: "cardPanel", Wallet: "walletPanel" };
  const cardFields = ["cardNumber", "cardExpiry", "cardCvv"].map((n) => form[n]);
  function syncPanels() {
    const method = form.paymentMethod.value;
    Object.entries(panels).forEach(([m, id]) => document.getElementById(id).classList.toggle("d-none", m !== method));
    cardFields.forEach((f) => { f.required = method === "Card"; });
    form.upiId.required = method === "UPI";
  }
  form.querySelectorAll("[name=paymentMethod]").forEach((r) => r.addEventListener("change", syncPanels));
  syncPanels();

  // Light input formatting for the demo card fields (nothing is stored)
  form.cardNumber.addEventListener("input", () => { form.cardNumber.value = form.cardNumber.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); });
  form.cardExpiry.addEventListener("input", () => { let v = form.cardExpiry.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); form.cardExpiry.value = v; });
  form.cardCvv.addEventListener("input", () => { form.cardCvv.value = form.cardCvv.value.replace(/\D/g, "").slice(0, 3); });

  const payModalEl = document.getElementById("payModal");
  const payModal = new bootstrap.Modal(payModalEl);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const msg = document.getElementById("payMsg"), spinner = document.getElementById("paySpinner"), done = document.getElementById("payDone");
    spinner.classList.remove("d-none"); done.classList.add("d-none"); msg.textContent = "Contacting payment provider…";
    payModal.show();

    // MOCK PAYMENT: wait, then "verify". The synopsis requires the order to be
    // stored ONLY after payment verification succeeds.
    // TODO: Replace with real flow: POST /api/payments/initiate -> gateway -> POST /api/payments/verify
    await new Promise((r) => setTimeout(r, 1300));
    msg.textContent = "Verifying payment…";
    await new Promise((r) => setTimeout(r, 1000));
    spinner.classList.add("d-none"); done.classList.remove("d-none"); msg.textContent = "Payment verified! Creating your order…";

    try {
      // TODO: Replace with Spring Boot REST API (POST /api/orders)
      const order = await createOrder({
        userId: user.id, customerName: form.fullName.value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
        items: getCart().map(({ id, name, price, qty }) => ({ id, name, price, qty })),
        paymentMethod: form.paymentMethod.value, pickup: form.pickup.value, notes: form.notes.value.trim(),
      });
      clearCart();
      setTimeout(() => { location.href = `order-success.html?id=${order.id}`; }, 700);
    } catch (err) {
      payModal.hide(); showToast(err.message, "danger");
    }
  });
}

/* ---------- order-success.html ---------- */
async function initSuccess() {
  const user = requireLogin();
  if (!user) return;
  const box = document.getElementById("successBox");
  try {
    const order = await getOrderById(new URLSearchParams(location.search).get("id"));
    if (order.userId !== user.id) throw new Error("Not your order");
    box.innerHTML = `
      <div class="text-center mb-4">
        <div class="success-tick"><i class="bi bi-check-lg"></i></div>
        <h1 class="h2 mt-3">Order confirmed!</h1>
        <p class="text-muted mb-0">Payment received. Show your order ID at the counter when collecting.</p>
      </div>
      <div class="card bill-card"><div class="card-body p-4">
        <div class="row g-3 mb-3">
          <div class="col-6 col-md-3"><div class="small text-muted">Order ID</div><div class="fw-bold">${esc(order.id)}</div></div>
          <div class="col-6 col-md-3"><div class="small text-muted">Date &amp; time</div><div>${fmtDate(order.date)}</div></div>
          <div class="col-6 col-md-3"><div class="small text-muted">Payment</div><div>${esc(order.paymentMethod)} ${statusBadge(order.paymentStatus)}</div></div>
          <div class="col-6 col-md-3"><div class="small text-muted">Status</div><div>${statusBadge(order.status)}</div></div>
        </div>
        <div class="table-responsive"><table class="table align-middle mb-0">
          <thead><tr><th>Item</th><th class="text-end">Price</th><th class="text-center">Qty</th><th class="text-end">Amount</th></tr></thead>
          <tbody>${order.items.map((i) => `<tr><td>${esc(i.name)}</td><td class="text-end">${fmtINR(i.price)}</td><td class="text-center">${i.qty}</td><td class="text-end">${fmtINR(i.price * i.qty)}</td></tr>`).join("")}</tbody>
          <tfoot><tr><th colspan="3" class="text-end">Total paid</th><th class="text-end fs-5">${fmtINR(order.total)}</th></tr></tfoot>
        </table></div>
        ${order.notes ? `<p class="small text-muted mt-3 mb-0"><i class="bi bi-sticky me-1"></i>Note: ${esc(order.notes)}</p>` : ""}
      </div></div>
      <div class="d-flex flex-wrap justify-content-center gap-2 mt-4 no-print">
        <a href="menu.html" class="btn btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Back to menu</a>
        <a href="orders.html" class="btn btn-primary"><i class="bi bi-receipt me-1"></i>View my orders</a>
        <button class="btn btn-outline-dark" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print bill</button>
      </div>`;
  } catch (err) {
    box.innerHTML = `<div class="text-center py-5"><i class="bi bi-emoji-frown display-3 text-muted"></i><h3 class="mt-3">Order not found</h3><a href="orders.html" class="btn btn-primary mt-2">Go to my orders</a></div>`;
  }
}
