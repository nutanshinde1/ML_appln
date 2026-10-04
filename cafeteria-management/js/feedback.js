/* =====================================================================
 * feedback.js  -  feedback.html (rating + message)
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  if (PAGE !== "feedback") return;
  const user = requireLogin();
  if (!user) return;
  const form = document.getElementById("feedbackForm");
  form.fullName.value = user.name; form.email.value = user.email;

  const stars = [...document.querySelectorAll(".star-rating label")];
  const paint = (n) => stars.forEach((l, i) => l.classList.toggle("on", i < n));
  form.querySelectorAll("[name=rating]").forEach((r) => r.addEventListener("change", () => { paint(Number(r.value)); document.getElementById("ratingError").classList.add("d-none"); }));

  async function loadList() {
    // TODO: Replace with Spring Boot REST API (GET /api/feedback)
    const list = (await getFeedback()).slice(0, 5);
    document.getElementById("feedbackList").innerHTML = list.map((f) => `
      <div class="card mb-3"><div class="card-body">
        <div class="d-flex justify-content-between"><strong>${esc(f.name)}</strong><span class="text-warning">${"★".repeat(f.rating)}<span class="text-muted opacity-50">${"★".repeat(5 - f.rating)}</span></span></div>
        <p class="mb-1 mt-2">${esc(f.message)}</p><small class="text-muted">${fmtDay(f.date)}</small>
      </div></div>`).join("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rating = form.querySelector("[name=rating]:checked");
    document.getElementById("ratingError").classList.toggle("d-none", !!rating);
    if (!validateForm(form) || !rating) return;
    // TODO: Replace with Spring Boot REST API (POST /api/feedback)
    await submitFeedback({ userId: user.id, name: user.name, rating: rating.value, message: form.message.value });
    form.message.value = ""; form.querySelectorAll("[name=rating]").forEach((r) => (r.checked = false)); paint(0);
    form.classList.remove("was-validated");
    showToast("Thank you! Your feedback has been submitted.");
    loadList();
  });
  loadList();
});
