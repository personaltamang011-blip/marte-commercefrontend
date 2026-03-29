/* ================= CONFIG ================= */
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://mart-backend-o7xd.onrender.com";

/* ================= PRODUCTS ================= */
let products = [];
let cart = {};

function makeId(name) {
  return name.replace(/\s+/g, "-").toLowerCase();
}

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    products = await res.json();
    loadFilters();
    showProducts();
  } catch (err) {
    console.error("Product load error:", err);
  }
}

/* ================= ROUTING ================= */
function loadPage() {
  const page = new URLSearchParams(window.location.search).get("page") || "home";
  const content = document.getElementById("content");

  if (page === "home") {
    content.innerHTML = `
      <h1>🛒 My Supermarket</h1>

      <input type="text" id="searchInput" placeholder="🔍 Search..." oninput="filterProducts()">

      <select id="mainFilter" onchange="filterProducts()"><option value="">Main</option></select>
      <select id="subFilter" onchange="filterProducts()"><option value="">Sub</option></select>
      <select id="typeFilter" onchange="filterProducts()"><option value="">Type</option></select>

      <div id="products"></div>

      <h2>Cart</h2>
      <ul id="cart"></ul>
      <h3>Total: Rs <span id="total">0</span></h3>

      <input id="name" placeholder="Name">
      <input id="phone" placeholder="Phone">

      <button onclick="placeOrder()">Place Order</button>
    `;

    loadProducts();
    renderCart();
  }

  else if (page === "admin") {
    content.innerHTML = `
      <h1>📦 Admin Panel</h1>
      <button onclick="loadOrders()">Load Orders</button>
      <div id="orders"></div>
    `;
  }
}

/* ================= FILTER ================= */
function loadFilters() {
  const main = document.getElementById("mainFilter");
  const sub = document.getElementById("subFilter");
  const type = document.getElementById("typeFilter");

  main.innerHTML = `<option value="">Main</option>`;
  sub.innerHTML = `<option value="">Sub</option>`;
  type.innerHTML = `<option value="">Type</option>`;

  const m = new Set(), s = new Set(), t = new Set();

  products.forEach(p => {
    m.add(p.main);
    s.add(p.sub);
    t.add(p.type);
  });

  m.forEach(v => main.innerHTML += `<option>${v}</option>`);
  s.forEach(v => sub.innerHTML += `<option>${v}</option>`);
  t.forEach(v => type.innerHTML += `<option>${v}</option>`);
}

function filterProducts() {
  const main = document.getElementById("mainFilter").value;
  const sub = document.getElementById("subFilter").value;
  const type = document.getElementById("typeFilter").value;
  const search = document.getElementById("searchInput").value.toLowerCase();

  const filtered = products.filter(p =>
    (!main || p.main === main) &&
    (!sub || p.sub === sub) &&
    (!type || p.type === type) &&
    (!search || p.name.toLowerCase().includes(search))
  );

  showProducts(filtered);
}

/* ================= PRODUCTS ================= */
function showProducts(list = products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  list.forEach(p => {
    const id = makeId(p.name);

    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.main} → ${p.sub} → ${p.type}</p>
      <p>Rs ${p.price}</p>

      <div class="cart-controls">
        <input type="number" id="qty-${id}" value="1" min="1">
        <button onclick="addToCart('${p.name}')">Add</button>
      </div>
    `;

    container.appendChild(div);
  });
}

/* ================= CART ================= */
function addToCart(name) {
  const p = products.find(x => x.name === name);
  const id = makeId(name);
  const qty = parseInt(document.getElementById(`qty-${id}`).value);

  if (!qty || qty <= 0) return alert("Invalid qty");

  if (cart[name]) cart[name].qty += qty;
  else cart[name] = { ...p, qty };

  renderCart();
}

function removeItem(name) {
  delete cart[name];
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cart");
  const totalEl = document.getElementById("total");

  if (!list) return;

  list.innerHTML = "";
  let total = 0;

  Object.values(cart).forEach(i => {
    total += i.price * i.qty;

    list.innerHTML += `
      <li>${i.name} x ${i.qty} 
      <button onclick="removeItem('${i.name}')">❌</button></li>
    `;
  });

  totalEl.textContent = total;
}

/* ================= ORDER ================= */
async function placeOrder() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  if (!name || !phone) return alert("Fill details");
  if (!Object.keys(cart).length) return alert("Cart empty");

  const order = {
    customer: name,
    phone,
    items: Object.values(cart),
    total: Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0)
  };

  try {
    const res = await fetch(`${API_BASE}/place-order`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(order)
    });

    if (!res.ok) throw new Error();

    alert("Order placed!");
    cart = {};
    renderCart();

  } catch {
    alert("Error placing order");
  }
}

/* ================= ADMIN ================= */
async function loadOrders() {
  const div = document.getElementById("orders");
  div.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const orders = data.data || data;

    if (!orders.length) {
      div.innerHTML = "No orders";
      return;
    }

    div.innerHTML = "";

    orders.forEach(o => {
      const status = o.status || "Pending";

      let items = "";
      o.items.forEach(i => items += `<li>${i.name} (${i.qty})</li>`);

      div.innerHTML += `
        <div class="order-box">
          <h3>${o.customer}</h3>
          <p>${o.phone}</p>
          <ul>${items}</ul>
          <p>Total: Rs ${o.total}</p>

          <p>Status: 
            <span style="color:${status==="Pending"?"orange":"green"}">
              ${status}
            </span>
          </p>

          ${
            status === "Pending"
            ? `<button onclick="updateStatus('${o._id}','Delivered')">Mark Delivered</button>`
            : `<button disabled>Delivered</button>`
          }

          <button onclick="deleteOrder('${o._id}')">Delete</button>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    div.innerHTML = "Error loading orders";
  }
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/order/${id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status })
    });

    if (!res.ok) throw new Error();

    alert("Updated!");
    loadOrders();

  } catch {
    alert("Update failed");
  }
}

async function deleteOrder(id) {
  if (!confirm("Delete?")) return;

  try {
    const res = await fetch(`${API_BASE}/order/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error();

    alert("Deleted!");
    loadOrders();

  } catch {
    alert("Delete failed");
  }
}

/* ================= INIT ================= */
loadPage();
window.addEventListener("popstate", loadPage);