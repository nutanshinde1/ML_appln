/* =====================================================================
 * api.js  -  THE ONLY FILE THAT TALKS TO "THE SERVER"
 * ---------------------------------------------------------------------
 * Every page calls these async functions and never touches localStorage
 * directly. Today they read/write localStorage (mock mode). In the next
 * phase, set USE_MOCK = false and replace each function body with a
 * fetch() call to the Java Spring Boot REST API - the UI stays the same.
 *
 *   Frontend (HTML + Bootstrap + JS)
 *        -> api.js  -> REST API -> Spring Boot -> MySQL
 *
 * NOTE: localStorage here is a DEMO substitute, not a real database,
 * and the demo logins below are NOT real authentication.
 * ===================================================================== */

const USE_MOCK = true;
const API_BASE_URL = "http://localhost:8080/api"; // Future Spring Boot server

/* ---------- Future real-API helper (used when USE_MOCK = false) ---------- */
async function apiRequest(method, path, body) {
  // TODO: Replace mock logic with this once Spring Boot is running.
  // JWT/session token handling will be added here.
  const res = await fetch(API_BASE_URL + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Request failed");
  return res.json();
}

/* ---------- Mock storage helpers (localStorage) ---------- */
const DB_KEYS = ["users", "categories", "foodItems", "orders", "feedback"];
const SEED_FLAG = "cms_seeded_v1";

function dbGet(name) {
  try { return JSON.parse(localStorage.getItem("cms_" + name)) || []; } catch (e) { return []; }
}
function dbSet(name, value) { localStorage.setItem("cms_" + name, JSON.stringify(value)); }

function initMockData() {
  if (localStorage.getItem(SEED_FLAG)) return;
  DB_KEYS.forEach((k) => dbSet(k, MOCK_DATA[k]));
  localStorage.setItem(SEED_FLAG, "1");
}
function resetDemoData() {
  Object.keys(localStorage).filter((k) => k.startsWith("cms_")).forEach((k) => localStorage.removeItem(k));
  sessionStorage.removeItem("cms_session");
  initMockData();
}
initMockData();

const nextId = (list) => list.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
const stripPassword = ({ password, ...safe }) => safe;
const fail = (msg) => Promise.reject(new Error(msg));

/* =====================================================================
 * AUTH (customer)
 * ===================================================================== */

// Future API: POST /api/auth/login  { email, password }  -> { token, user }
async function loginUser(email, password, remember = false) {
  const user = dbGet("users").find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) return fail("Invalid email or password.");
  if (user.status === "Blocked") return fail("This account has been blocked. Please contact the cafeteria admin.");
  const store = remember ? localStorage : sessionStorage;
  localStorage.removeItem("cms_session"); sessionStorage.removeItem("cms_session");
  store.setItem("cms_session", JSON.stringify({ userId: user.id }));
  return stripPassword(user);
}

// Future API: POST /api/auth/register  { name, email, phone, password }
async function registerUser({ name, email, phone, password }) {
  const users = dbGet("users");
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return fail("An account with this email already exists.");
  const user = { id: nextId(users), name: name.trim(), email: email.trim(), phone: phone.trim(), password, registeredOn: new Date().toISOString(), status: "Active" };
  users.push(user);
  dbSet("users", users);
  return stripPassword(user);
}

// Future API: POST /api/auth/logout  (or just discard the JWT on the client)
function logoutUser() {
  localStorage.removeItem("cms_session"); sessionStorage.removeItem("cms_session");
}

// Future API: GET /api/auth/me
function getCurrentUser() {
  const raw = sessionStorage.getItem("cms_session") || localStorage.getItem("cms_session");
  if (!raw) return null;
  try {
    const user = dbGet("users").find((u) => u.id === JSON.parse(raw).userId);
    return user && user.status !== "Blocked" ? stripPassword(user) : null;
  } catch (e) { return null; }
}

/* =====================================================================
 * MENU
 * ===================================================================== */

// Future API: GET /api/categories
async function getCategories() { return dbGet("categories"); }

// Future API: GET /api/food-items?categoryId=&search=
async function getFoodItems() { return dbGet("foodItems"); }

// Future API: GET /api/food-items/{id}
async function getFoodItem(id) {
  const item = dbGet("foodItems").find((f) => f.id === Number(id));
  return item || fail("Food item not found.");
}

/* =====================================================================
 * ORDERS & PAYMENT
 * ===================================================================== */

// Future API: POST /api/orders   (backend must recalculate the total and
// verify the payment before saving - never trust the browser's total).
async function createOrder({ userId, customerName, phone, email, items, paymentMethod, pickup, notes }) {
  const orders = dbGet("orders");
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order = {
    id: "ORD-" + (1000 + nextId(orders.map((o) => ({ id: o.id.replace("ORD-", "") - 1000 })))),
    userId, customerName, phone, email, items, total, paymentMethod,
    paymentStatus: "Paid", // Pay First: order is only created after payment succeeds
    status: "Pending", pickup, notes, date: new Date().toISOString(),
  };
  orders.push(order);
  dbSet("orders", orders);
  return order;
}

// Future API: GET /api/orders            (admin: all orders)
//             GET /api/orders/my         (customer: own orders)
async function getOrders(userId = null) {
  const list = dbGet("orders").sort((a, b) => new Date(b.date) - new Date(a.date));
  return userId ? list.filter((o) => o.userId === userId) : list;
}

// Future API: GET /api/orders/{id}
async function getOrderById(id) {
  return dbGet("orders").find((o) => o.id === id) || fail("Order not found.");
}

// Future API: PATCH /api/admin/orders/{id}/status  { status }
async function updateOrderStatus(id, status) {
  const orders = dbGet("orders");
  const order = orders.find((o) => o.id === id);
  if (!order) return fail("Order not found.");
  order.status = status;
  dbSet("orders", orders);
  return order;
}

/* =====================================================================
 * FEEDBACK
 * ===================================================================== */

// Future API: POST /api/feedback  { rating, message }
async function submitFeedback({ userId, name, rating, message }) {
  const list = dbGet("feedback");
  const entry = { id: nextId(list), userId, name, rating: Number(rating), message: message.trim(), date: new Date().toISOString() };
  list.push(entry);
  dbSet("feedback", list);
  return entry;
}
// Future API: GET /api/feedback
async function getFeedback() { return dbGet("feedback").sort((a, b) => new Date(b.date) - new Date(a.date)); }

/* =====================================================================
 * ADMIN
 * ===================================================================== */

// Future API: POST /api/admin/auth/login
async function adminLogin(email, password) {
  if (email.trim().toLowerCase() !== MOCK_DATA.admin.email || password !== MOCK_DATA.admin.password) return fail("Invalid admin credentials.");
  sessionStorage.setItem("cms_admin_session", JSON.stringify({ name: MOCK_DATA.admin.name, email: MOCK_DATA.admin.email }));
  return { name: MOCK_DATA.admin.name, email: MOCK_DATA.admin.email };
}
function adminLogout() { sessionStorage.removeItem("cms_admin_session"); }
function getAdminSession() {
  try { return JSON.parse(sessionStorage.getItem("cms_admin_session")); } catch (e) { return null; }
}

// Future API: GET /api/admin/dashboard
async function getAdminDashboard() {
  const orders = dbGet("orders");
  const valid = orders.filter((o) => o.status !== "Cancelled");
  const popular = {};
  valid.forEach((o) => o.items.forEach((i) => { popular[i.name] = (popular[i.name] || 0) + i.qty; }));
  const days = [];
  for (let n = 6; n >= 0; n--) {
    const d = new Date(); d.setDate(d.getDate() - n);
    const key = d.toDateString();
    days.push({ label: d.toLocaleDateString("en-IN", { weekday: "short" }), revenue: valid.filter((o) => new Date(o.date).toDateString() === key).reduce((s, o) => s + o.total, 0) });
  }
  return {
    totalOrders: orders.length,
    totalCustomers: dbGet("users").length,
    totalFoodItems: dbGet("foodItems").length,
    totalRevenue: valid.reduce((s, o) => s + o.total, 0),
    pendingOrders: orders.filter((o) => o.status === "Pending").length,
    recentOrders: [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    popularItems: Object.entries(popular).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5),
    revenueByDay: days,
  };
}

// Future API: POST /api/admin/food-items
async function addFoodItem(data) {
  const items = dbGet("foodItems");
  const item = { id: nextId(items), image: "", popular: false, ...data };
  items.push(item); dbSet("foodItems", items); return item;
}
// Future API: PUT /api/admin/food-items/{id}
async function updateFoodItem(id, data) {
  const items = dbGet("foodItems");
  const idx = items.findIndex((f) => f.id === Number(id));
  if (idx < 0) return fail("Food item not found.");
  items[idx] = { ...items[idx], ...data };
  dbSet("foodItems", items); return items[idx];
}
// Future API: DELETE /api/admin/food-items/{id}
async function deleteFoodItem(id) {
  dbSet("foodItems", dbGet("foodItems").filter((f) => f.id !== Number(id)));
  return true;
}

// Future API: POST /api/admin/categories
async function addCategory(data) {
  const list = dbGet("categories");
  if (list.some((c) => c.name.toLowerCase() === data.name.trim().toLowerCase())) return fail("A category with this name already exists.");
  const cat = { id: nextId(list), icon: "bi-tag", status: "Active", ...data };
  list.push(cat); dbSet("categories", list); return cat;
}
// Future API: PUT /api/admin/categories/{id}
async function updateCategory(id, data) {
  const list = dbGet("categories");
  const idx = list.findIndex((c) => c.id === Number(id));
  if (idx < 0) return fail("Category not found.");
  list[idx] = { ...list[idx], ...data };
  dbSet("categories", list); return list[idx];
}
// Future API: DELETE /api/admin/categories/{id}
async function deleteCategory(id) {
  if (dbGet("foodItems").some((f) => f.categoryId === Number(id))) return fail("This category still has food items. Move or delete them first.");
  dbSet("categories", dbGet("categories").filter((c) => c.id !== Number(id)));
  return true;
}

// Future API: GET /api/admin/users
async function getUsers() { return dbGet("users").map(stripPassword); }
// Future API: PATCH /api/admin/users/{id}/status  { status }
async function updateUserStatus(id, status) {
  const users = dbGet("users");
  const u = users.find((x) => x.id === Number(id));
  if (!u) return fail("User not found.");
  u.status = status; dbSet("users", users); return stripPassword(u);
}
