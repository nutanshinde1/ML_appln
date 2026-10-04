/* =====================================================================
 * orders.js  -  customer order history (orders.html)
 * Also exports orderDetailHtml(), reused by the admin order modal.
 * ===================================================================== */

function orderDetailHtml(o) {
  return `
    <div class="row g-3 mb-3">
      <div class="col-6"><div class="small text-muted">Order ID</div><div class="fw-bold">${esc(o.id)}</div></div>
      <div class="col-6"><div class="small text-muted">Date</div><div>${fmtDate(o.date)}</div></div>
      <div class="col-6"><div class="small text-muted">Customer</div><div>${esc(o.customerName)}<br><span class="small text-muted">${esc(o.phone || "")}</span></div></div>
      <div class="col-6"><div class="small text-muted">Payment</div><div>${esc(o.paymentMethod)} ${statusBadge(o.paymentStatus)}</div></div>
      <div class="col-6"><div class="small text-muted">Order status</div><div>${statusBadge(o.status)}</div></div>
      ${o.pickup ? `<div class="col-6"><div class="small text-muted">Pickup</div><div>${esc(o.pickup)}</div></div>` : ""}
    </div>
    <div class="table-responsive"><table class="table table-sm align-middle mb-0">
      <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-end">Amount</th></tr></thead>
      <tbody>${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td class="text-center">${i.qty}</td><td class="text-end">${fmtINR(i.price * i.qty)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><th colspan="2" class="text-end">Total</th><th class="text-end">${fmtINR(o.total)}</th></tr></tfoot>
    </table></div>
    ${o.notes ? `<p class="small text-muted mt-3 mb-0"><i class="bi bi-sticky me-1"></i>${esc(o.notes)}</p>` : ""}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  if (PAGE !== "orders") return;
  const user = requireLogin();
  if (!user) return;

  // TODO: Replace with Spring Boot REST API (GET /api/orders/my)
  const orders = await getOrders(user.id);
  const body = document.getElementById("ordersBody");
  const modalBody = document.getElementById("orderModalBody");
  const modal = new bootstrap.Modal(document.getElementById("orderModal"));
  let filter = "All";

  function render() {
    const list = orders.filter((o) => filter === "All" || o.status === filter);
    document.getElementById("ordersEmpty").classList.toggle("d-none", orders.length > 0);
    document.getElementById("ordersTableWrap").classList.toggle("d-none", orders.length === 0);
    body.innerHTML = list.length ? list.map((o) => `
      <tr>
        <td class="fw-semibold">${esc(o.id)}</td><td>${fmtDate(o.date)}</td>
        <td class="d-none d-md-table-cell small text-muted">${esc(o.items.map((i) => `${i.name} ×${i.qty}`).join(", "))}</td>
        <td>${fmtINR(o.total)}</td><td>${statusBadge(o.status)}</td>
        <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-view="${esc(o.id)}">Details</button></td>
      </tr>`).join("") : `<tr><td colspan="6" class="text-center text-muted py-4">No ${filter.toLowerCase()} orders.</td></tr>`;
  }
  document.getElementById("statusFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    filter = b.dataset.status;
    document.querySelectorAll("#statusFilter button").forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
  body.addEventListener("click", (e) => {
    const b = e.target.closest("[data-view]"); if (!b) return;
    modalBody.innerHTML = orderDetailHtml(orders.find((o) => o.id === b.dataset.view));
    modal.show();
  });
  render();
});
