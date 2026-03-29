/* ================= CONFIG ================= */
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://mart-backend-o7xd.onrender.com";

/* ================= PRODUCTS ================= */
let products = [];
let cart = {};

// Load products.json
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    products = await res.json();
    loadFilters();
    showProducts();
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

/* ================= ROUTING ================= */
function loadPage() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || "home";
  const content = document.getElementById("content");

  if (page === "home") {
    content.innerHTML = `
      <h1>🛒 My Supermarket</h1>
      <input type="text" id="searchInput" placeholder="🔍 Search product..." oninput="filterProducts()">
      
      <select id="mainFilter" onchange="filterProducts()">
        <option value="">Main Category</option>
      </select>
      <select id="subFilter" onchange="filterProducts()">
        <option value="">Sub Category</option>
      </select>
      <select id="typeFilter" onchange="filterProducts()">
        <option value="">Type</option>
      </select>

      <div id="products"></div>

      <h2>Cart</h2>
      <ul id="cart"></ul>
      <h3>Total: Rs <span id="total">0</span></h3>

      <h2>Customer Details</h2>
      <input type="text" id="name" placeholder="Your Name">
      <input type="text" id="phone" placeholder="Phone Number">

      <br><br>
      <button onclick="placeOrder()">Place Order</button>
    `;
    loadProducts();
    renderCart();
  }
  else if (page === "contact") {
    content.innerHTML = `
      <h1>Contact Us</h1>
      <p>📞 Phone: 98XXXXXXXX</p>
      <p>📧 Email: mart@gmail.com</p>
    `;
  }
  else if (page === "about") {
    content.innerHTML = `
      <h1>About Us</h1>
      <p>This is a supermarket project built using Node.js and MongoDB.</p>
    `;
  }
  else if (page === "admin") {
    content.innerHTML = `
      <h1>📦 Admin Panel</h1>
      <button onclick="loadOrders()">Load Orders</button>
      <div id="orders"></div>
    `;
  }
}

/* ================= FILTERS ================= */
function loadFilters() {
  const mainFilter = document.getElementById("mainFilter");
  const subFilter = document.getElementById("subFilter");
  const typeFilter = document.getElementById("typeFilter");

  mainFilter.innerHTML = `<option value="">Main Category</option>`;
  subFilter.innerHTML = `<option value="">Sub Category</option>`;
  typeFilter.innerHTML = `<option value="">Type</option>`;

  const mainSet = new Set();
  const subSet = new Set();
  const typeSet = new Set();

  products.forEach(p => {
    mainSet.add(p.main);
    subSet.add(p.sub);
    typeSet.add(p.type);
  });

  mainSet.forEach(val => mainFilter.innerHTML += `<option value="${val}">${val}</option>`);
  subSet.forEach(val => subFilter.innerHTML += `<option value="${val}">${val}</option>`);
  typeSet.forEach(val => typeFilter.innerHTML += `<option value="${val}">${val}</option>`);
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

/* ================= DISPLAY PRODUCTS ================= */
function showProducts(list = products) {
  const productDiv = document.getElementById("products");
  productDiv.innerHTML = "";

  list.forEach(product => {
    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
      <img src="${product.image}" width="150">
      <h3>${product.name}</h3>
      <p>${product.main} → ${product.sub} → ${product.type}</p>
      <p>Rs ${product.price}</p>
      <input type="number" id="qty-${product.name}" value="1" min="1">
      <button onclick="addToCart('${product.name}')">Add to Cart</button>
    `;

    productDiv.appendChild(div);
  });
}

/* ================= CART ================= */
function addToCart(name) {
  const product = products.find(p => p.name === name);
  const qty = parseInt(document.getElementById(`qty-${name}`).value);

  if (!qty || qty <= 0) { alert("Enter valid quantity"); return; }

  if (cart[name]) cart[name].qty += qty;
  else cart[name] = { ...product, qty };

  renderCart();
}

function removeItem(name) {
  delete cart[name];
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cart");
  const totalSpan = document.getElementById("total");
  cartList.innerHTML = "";

  let total = 0;
  Object.values(cart).forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement("li");
    li.innerHTML = `${item.name} - Rs ${item.price} x ${item.qty} <button onclick="removeItem('${item.name}')">❌</button>`;
    cartList.appendChild(li);
  });

  totalSpan.textContent = total;
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  if (!name || !phone) { alert("Please enter name and phone"); return; }
  if (!Object.keys(cart).length) { alert("Cart is empty"); return; }

  const order = {
    customer: name,
    phone: phone,
    items: Object.values(cart),
    total: Object.values(cart).reduce((sum, i) => sum + i.price * i.qty, 0)
  };

  try {
    await fetch(`${API_BASE}/place-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    alert("✅ Order saved!");
    cart = {};
    renderCart();
  } catch (err) {
    console.error(err);
    alert("❌ Error saving order");
  }
}

/* ================= ADMIN ORDERS ================= */
async function loadOrders() {
  const orderDiv = document.getElementById("orders");
  orderDiv.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const orders = data.data || data;

    if (!orders.length) { orderDiv.innerHTML = "No orders found"; return; }

    orderDiv.innerHTML = "";
    orders.forEach(order => {
      const itemsHTML = (order.items || []).map(i => `<li>${i.name} - ${i.qty}</li>`).join("");
      const status = order.status || "Pending";

      const div = document.createElement("div");
      div.style.border = "1px solid #ccc";
      div.style.margin = "10px";
      div.style.padding = "10px";

      div.innerHTML = `
        <h3>👤 ${order.customer}</h3>
        <p>📞 ${order.phone}</p>
        <ul>${itemsHTML}</ul>
        <p><strong>Total: Rs ${order.total}</strong></p>
        <p>Status: <span style="color:${status === "Pending" ? "orange" : "green"}">${status}</span></p>
        <button onclick="updateStatus('${order._id}', 'Delivered')">✅ Mark Delivered</button>
        <button onclick="deleteOrder('${order._id}')">❌ Delete</button>
      `;

      orderDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    orderDiv.innerHTML = "Error loading orders";
  }
}

async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;
  try {
    const res = await fetch(`${API_BASE}/order/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    alert("🗑️ Order deleted!");
    loadOrders();
  } catch (err) {
    console.error(err);
    alert("❌ Error deleting order");
  }
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/order/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Update failed");
    alert("✅ Status updated!");
    loadOrders();
  } catch (err) {
    console.error(err);
    alert("❌ Error updating status");
  }
}

/* ================= INIT ================= */
loadPage();
window.addEventListener("popstate", loadPage);