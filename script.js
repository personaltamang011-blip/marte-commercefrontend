const products = [
  {
    name: "Rice",
    price: 1200,
    image: "images/rice.jpg"
  },
  {
    name: "Oil",
    price: 300,
    image: "images/oil.jpg"
  },
  {
    name: "Sugar",
    price: 150,
    image: "images/sugar.jpg"
  }
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
  <img src="${product.image}" alt="${product.name}">
  <h3>${product.name}</h3>
  <p>Rs ${product.price}</p>

  <input type="number" id="qty-${index}" value="1" min="1">

  <button onclick="addToCart(${index})">Add to Cart</button>
`;
  productDiv.appendChild(div);
});

// Add to cart (with quantity)
function addToCart(index) {
  const product = products[index];

  // 👉 Get quantity from input
  const qtyInput = document.getElementById(`qty-${index}`);
  const qty = parseInt(qtyInput.value);

  if (qty <= 0 || isNaN(qty)) {
    alert("Enter valid quantity");
    return;
  }

  // 👉 Add to cart
  if (cart[product.name]) {
    cart[product.name].qty += qty;
  } else {
    cart[product.name] = { ...product, qty: qty };
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
    const res = await fetch("https://mart-backend-o7xd.onrender.com/place-order", {
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