/* =====================================================================
 * auth.js  -  customer login & signup pages
 * Validation here is for user experience only. Real validation and
 * password hashing will be done by Spring Boot later.
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (PAGE === "login") initLogin();
  if (PAGE === "signup") initSignup();
});

function initLogin() {
  if (getCurrentUser()) { location.replace("menu.html"); return; }
  const form = document.getElementById("loginForm");
  const msgBox = document.getElementById("formMessage");
  const params = new URLSearchParams(location.search);

  if (params.get("msg") === "loggedout") msgBox.innerHTML = `<div class="alert alert-info">You have been logged out.</div>`;
  if (params.get("msg") === "registered") msgBox.innerHTML = `<div class="alert alert-success">Account created! Please log in.</div>`;
  if (params.get("email")) form.email.value = params.get("email");

  document.getElementById("fillDemo").addEventListener("click", () => {
    form.email.value = "student@cafeteria.com"; form.password.value = "student123";
    form.classList.remove("was-validated");
  });
  document.getElementById("togglePw").addEventListener("click", (e) => {
    const show = form.password.type === "password";
    form.password.type = show ? "text" : "password";
    e.currentTarget.innerHTML = `<i class="bi ${show ? "bi-eye-slash" : "bi-eye"}"></i>`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    try {
      // TODO: Replace mock login with Spring Boot REST API (POST /api/auth/login)
      await loginUser(form.email.value, form.password.value, form.remember.checked);
      const next = params.get("next");
      location.href = next && /^[\w\-]+\.html/.test(next) ? next : "menu.html";
    } catch (err) { showAlert(msgBox, err.message); }
  });

  // Forgot password: UI only
  document.getElementById("forgotForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (!validateForm(f)) return;
    bootstrap.Modal.getInstance(document.getElementById("forgotModal")).hide();
    showToast("Demo: a reset link would be emailed to " + f.resetEmail.value, "info");
    f.reset(); f.classList.remove("was-validated");
  });
}

function initSignup() {
  if (getCurrentUser()) { location.replace("menu.html"); return; }
  const form = document.getElementById("signupForm");
  const msgBox = document.getElementById("formMessage");

  const checkMatch = () => form.confirm.setCustomValidity(form.confirm.value === form.password.value ? "" : "Passwords do not match");
  form.password.addEventListener("input", checkMatch);
  form.confirm.addEventListener("input", checkMatch);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    checkMatch();
    if (!validateForm(form)) return;
    try {
      // TODO: Replace mock registration with Spring Boot REST API (POST /api/auth/register)
      const user = await registerUser({ name: form.fullName.value, email: form.email.value, phone: form.phone.value, password: form.password.value });
      location.href = `login.html?msg=registered&email=${encodeURIComponent(user.email)}`;
    } catch (err) { showAlert(msgBox, err.message); }
  });
}
