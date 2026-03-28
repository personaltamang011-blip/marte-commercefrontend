/* ================= CONFIG ================= */
// Base API URL for local or Render hosting
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://mart-backend-o7xd.onrender.com";

/* ================= PRODUCTS ================= */
const products = [
  { name: "Rice", price: 1200, image: "images/rice.jpg" },
  { name: "Oil", price: 300, image: "images/oil.jpg" },
  { name: "Sugar", price: 150, image: "images/sugar.jpg" }
];

let cart = {};

/* ================= ROUTING ================= */
function loadPage() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || "home";
  const content = document.getElementById("content");

  if (page === "home") {
    content.innerHTML = `
      <h1>🛒 My Supermarket</h1>
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
    showProducts();
    renderCart();
  } else if (page === "contact") {
    content.innerHTML = `
      <h1>Contact Us</h1>
      <p>📞 Phone: 98XXXXXXXX</p>
      <p>📧 Email: mart@gmail.com</p>
    `;
  } else if (page === "about") {
    content.innerHTML = `
      <h1>About Us</h1>
      <p>This is a supermarket project built using Node.js and MongoDB.</p>
    `;
  } else if (page === "admin") {
    content.innerHTML = `
      <h1>📦 Admin Panel</h1>
      <button onclick="loadOrders()">Load Orders</button>
      <div id="orders"></div>
    `;
  }
}

/* ================= LOAD ORDERS ================= */
async function loadOrders() {
  const orderDiv = document.getElementById("orders");
  orderDiv.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const data = await res.json();
    const orders = data.data || data;

    if (!orders.length) {
      orderDiv.innerHTML = "No orders found";
      return;
    }

    orderDiv.innerHTML = "";

    orders.forEach(order => {
      const div = document.createElement("div");
      div.style.border = "1px solid #ccc";
      div.style.margin = "10px";
      div.style.padding = "10px";

      let itemsHTML = "";
      (order.items || []).forEach(item => {
        itemsHTML += `<li>${item.name} - ${item.qty}</li>`;
      });

      const status = order.status || "Pending";

      div.innerHTML = `
        <h3>👤 ${order.customer}</h3>
        <p>📞 ${order.phone}</p>
        <ul>${itemsHTML}</ul>
        <p><strong>Total: Rs ${order.total}</strong></p>
        <p>Status: 
          <span style="color:${status === "Pending" ? "orange" : "green"}">
            ${status}
          </span>
        </p>
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

/* ================= PRODUCTS ================= */
function showProducts() {
  const productDiv = document.getElementById("products");
  productDiv.innerHTML = "";

  products.forEach((product, index) => {
    const div = document.createElement("div");
    div.className = "product";

    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>Rs ${product.price}</p>
      <input type="number" id="qty-${index}" value="1" min="1">
      <button onclick="addToCart(${index})">Add to Cart</button>
    `;

    productDiv.appendChild(div);
  });
}

/* ================= CART ================= */
function addToCart(index) {
  const product = products[index];
  const qty = parseInt(document.getElementById(`qty-${index}`).value);

  if (!qty || qty <= 0) {
    alert("Enter valid quantity");
    return;
  }

  if (cart[product.name]) {
    cart[product.name].qty += qty;
  } else {
    cart[product.name] = { ...product, qty };
  }

  renderCart();
}

function removeItem(name) {
  delete cart[name];
  renderCart();
}

function renderCart() {
  const cartList = document.getElementById("cart");
  const totalSpan = document.getElementById("total");

  if (!cartList) return;

  cartList.innerHTML = "";
  let total = 0;

  Object.values(cart).forEach(item => {
    total += item.price * item.qty;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - Rs ${item.price} x ${item.qty}
      <button onclick="removeItem('${item.name}')">❌</button>
    `;
    cartList.appendChild(li);
  });

  totalSpan.textContent = total;
}

/* ================= PLACE ORDER ================= */
async function placeOrder() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  if (!Object.keys(cart).length) {
    alert("Cart is empty");
    return;
  }

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

/* ================= DELETE ================= */
async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;

  try {
    await fetch(`${API_BASE}/order/${id}`, { method: "DELETE" });
    alert("Order deleted!");
    loadOrders();
  } catch (err) {
    console.error(err);
    alert("Error deleting order");
  }
}

/* ================= UPDATE STATUS ================= */
async function updateStatus(id, status) {
  try {
    await fetch(`${API_BASE}/order/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    alert("Status updated!");
    loadOrders();
  } catch (err) {
    console.error(err);
    alert("Error updating status");
  }
}

/* ================= INIT ================= */
loadPage();
window.addEventListener("popstate", loadPage);