const root = document.getElementById("app-root");

if (!root) {
  throw new Error("Missing app root element");
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

function sanitize(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function renderCart(container) {
  const cart = await fetchJson("/api/cart");

  const itemsHtml = cart.items
    .map(
      (item) => `
      <div class="cart-item">
        <div class="cart-item-top">
          <strong>${sanitize(item.product.name)}</strong>
          <span>${currency.format(item.lineTotal)}</span>
        </div>
        <div class="qty-actions">
          <button data-action="decrement" data-id="${item.partId}">-</button>
          <span>${item.quantity}</span>
          <button data-action="increment" data-id="${item.partId}">+</button>
          <button data-action="remove" data-id="${item.partId}">Remove</button>
        </div>
      </div>
    `
    )
    .join("");

  container.innerHTML = `
    <h2>Cart <span class="badge">${cart.totalQuantity} items</span></h2>
    ${itemsHtml || '<div class="empty-state">Your cart is empty</div>'}
    <div class="cart-total">Total: ${currency.format(cart.totalPrice)}</div>
  `;

  container.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const target = event.currentTarget;
      const id = Number(target.getAttribute("data-id"));
      const action = target.getAttribute("data-action");

      if (action === "remove") {
        await fetchJson(`/api/cart/${id}`, { method: "DELETE" });
      }

      if (action === "increment") {
        const existing = cart.items.find((item) => item.partId === id);
        const quantity = (existing?.quantity ?? 0) + 1;
        await fetchJson(`/api/cart/${id}`, {
          method: "PUT",
          body: JSON.stringify({ quantity })
        });
      }

      if (action === "decrement") {
        const existing = cart.items.find((item) => item.partId === id);
        const quantity = Math.max(0, (existing?.quantity ?? 0) - 1);
        await fetchJson(`/api/cart/${id}`, {
          method: "PUT",
          body: JSON.stringify({ quantity })
        });
      }

      await boot();
    });
  });
}

async function renderProductPage(productId) {
  const product = await fetchJson(`/api/cart/products/${productId}`);

  root.innerHTML = `
    <section class="panel detail-layout">
      <a class="back-link" href="/"><- Back to catalog</a>
      <h1>${sanitize(product.name)}</h1>
      <p>${sanitize(product.description)}</p>
      <div class="meta-grid">
        <div class="meta-box"><strong>Manufacturer</strong><div>${sanitize(product.manufacturer)}</div></div>
        <div class="meta-box"><strong>Part Number</strong><div>${sanitize(product.part_number)}</div></div>
        <div class="meta-box"><strong>Stock</strong><div>${product.stock}</div></div>
        <div class="meta-box"><strong>Price</strong><div>${currency.format(product.price)}</div></div>
      </div>
      <button class="primary" id="add-detail-item">Add to cart</button>
    </section>
  `;

  document.getElementById("add-detail-item")?.addEventListener("click", async () => {
    await fetchJson("/api/cart", {
      method: "POST",
      body: JSON.stringify({ partId: product.id, quantity: 1 })
    });
    window.location.href = "/";
  });
}

async function renderCatalogPage() {
  const productResponse = await fetchJson("/api/cart/products?offset=0&limit=1000");
  const products = productResponse.items;
  const maxPrice = Math.ceil(Math.max(...products.map((p) => p.price), 0));

  root.innerHTML = `
    <main class="left-column panel">
      <div class="hero">
        <h1>Automobile Parts Shop Cart</h1>
        <small>Powered by h3 + TypeScript</small>
      </div>
      <div class="controls">
        <input class="input" id="search-input" placeholder="Search by name, description, maker, price" />
        <select id="manufacturer-select">
          <option value="">All manufacturers</option>
        </select>
      </div>
      <div class="slider-row">
        <input id="price-slider" type="range" min="0" max="${maxPrice}" value="${maxPrice}" />
        <span id="price-value">Max: ${currency.format(maxPrice)}</span>
      </div>
      <div class="product-grid" id="product-grid"></div>
    </main>
    <aside class="cart-panel panel" id="cart-panel"></aside>
  `;

  const searchInput = document.getElementById("search-input");
  const manufacturerSelect = document.getElementById("manufacturer-select");
  const priceSlider = document.getElementById("price-slider");
  const priceValue = document.getElementById("price-value");
  const productGrid = document.getElementById("product-grid");
  const cartPanel = document.getElementById("cart-panel");

  const manufacturers = [...new Set(products.map((item) => item.manufacturer))].sort();
  manufacturers.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    manufacturerSelect.appendChild(option);
  });

  const renderProducts = () => {
    const searchTerm = (searchInput.value || "").toLowerCase().trim();
    const selectedManufacturer = manufacturerSelect.value;
    const selectedMaxPrice = Number(priceSlider.value);

    priceValue.textContent = `Max: ${currency.format(selectedMaxPrice)}`;

    const visibleProducts = products.filter((product) => {
      const textMatch =
        searchTerm.length === 0 ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.manufacturer.toLowerCase().includes(searchTerm) ||
        String(product.price).includes(searchTerm);

      const manufacturerMatch =
        selectedManufacturer.length === 0 || product.manufacturer === selectedManufacturer;

      return textMatch && manufacturerMatch && product.price <= selectedMaxPrice;
    });

    productGrid.innerHTML = visibleProducts
      .map(
        (product, index) => `
        <article class="product-card" style="animation-delay:${Math.min(index * 0.02, 0.4)}s">
          <h3>${sanitize(product.name)}</h3>
          <p>${sanitize(product.description)}</p>
          <div class="price">${currency.format(product.price)}</div>
          <div class="card-actions">
            <button class="primary" data-action="add" data-id="${product.id}">Add</button>
            <button data-action="details" data-id="${product.id}">Details</button>
          </div>
        </article>
      `
      )
      .join("");

    productGrid.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const target = event.currentTarget;
        const action = target.getAttribute("data-action");
        const id = Number(target.getAttribute("data-id"));

        if (action === "add") {
          await fetchJson("/api/cart", {
            method: "POST",
            body: JSON.stringify({ partId: id, quantity: 1 })
          });
          await renderCart(cartPanel);
          return;
        }

        if (action === "details") {
          window.location.href = `/product/${id}`;
        }
      });
    });
  };

  [searchInput, manufacturerSelect, priceSlider].forEach((element) => {
    element.addEventListener("input", renderProducts);
    element.addEventListener("change", renderProducts);
  });

  renderProducts();
  await renderCart(cartPanel);
}

async function boot() {
  const match = window.location.pathname.match(/^\/product\/(\d+)$/);
  if (match) {
    await renderProductPage(Number(match[1]));
    return;
  }

  await renderCatalogPage();
}

boot().catch((error) => {
  root.innerHTML = `<section class="panel detail-layout"><h1>Something went wrong</h1><p>${sanitize(error.message)}</p></section>`;
});
