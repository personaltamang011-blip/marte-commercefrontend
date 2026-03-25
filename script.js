const products = [
  { name: "Rice", price: 1200 },
  { name: "Oil", price: 300 },
  { name: "Sugar", price: 150 }
];

let cart = {};

const productDiv = document.getElementById("products");
const cartList = document.getElementById("cart");
const totalSpan = document.getElementById("total");

// Show products
products.forEach((product, index) => {
  const div = document.createElement("div");
  div.className = "product";

  div.innerHTML = `
    <h3>${product.name}</h3>
    <p>Rs ${product.price}</p>
    <button onclick="addToCart(${index})">Add to Cart</button>
  `;

  productDiv.appendChild(div);
});

// Add to cart (with quantity)
function addToCart(index) {
  const product = products[index];

  if (cart[product.name]) {
    cart[product.name].qty++;
  } else {
    cart[product.name] = { ...product, qty: 1 };
  }

  renderCart();
}

// Remove item
function removeItem(name) {
  delete cart[name];
  renderCart();
}

// Render cart
function renderCart() {
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

// Place order
async function placeOrder() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  if (Object.keys(cart).length === 0) {
    alert("Cart is empty");
    return;
  }

  const order = {
    customer: name,
    phone: phone,
    items: Object.values(cart),
    total: Number(totalSpan.textContent)
  };

  try {
    const res = await fetch("https://supermarket-backend-n3rl.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    const data = await res.json();

    alert("Order saved to database!");

    cart = {};
    renderCart();

  } catch (err) {
    console.error(err);
    alert("Error saving order");
  }
}

