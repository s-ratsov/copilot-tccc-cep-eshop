# copilot-tccc-cep (Automobile Parts Shop)

This repository contains a small e-shop challenge implementation: a TypeScript HTTP API built with `h3` and a minimal frontend that consumes the API. The project focuses on an automobile parts catalog and a shop cart with full create/read/update/delete (CRUD) support and resilience patterns.

Contents
- `automobileParts.json` — sample product catalog used by the API.
- `src/` — TypeScript source code:
	- `src/app.ts` — main h3 app, API routes and static file serving.
	- `src/server.ts` — node server entrypoint.
	- `src/data/catalog.ts` — loads `automobileParts.json`.
	- `src/service/shopCartService.ts` — core data and cart logic.
	- `src/manager/shopCartManager.ts` — input validation and business rules.
	- `src/resilience/shopCartResilience.ts` — Bottleneck limiter, opossum circuit breaker, p-retry retries.
	- `src/types/` — DTO and type definitions.
	- `src/web/` — minimal frontend (HTML/CSS/JS) served at `/`.
- `test/` — integration tests (Vitest + Supertest).
- `package.json`, `tsconfig.json`, `vitest.config.ts` — build and test configuration.

Features
- Product catalog endpoints with paging, search and filtering.
- Product detail endpoint.
- Shop cart endpoints (GET cart, POST add item, PUT update item quantity, DELETE remove item).
- Resilience: throttling/bulkhead (`bottleneck`), circuit breaker (`opossum`), retry/backoff (`p-retry`).
- Minimal single-page frontend with product list, search, manufacturer filter, price slider, product detail navigation, and live cart panel.

API
Base URL: `http://localhost:3000`

Products
- `GET /api/cart/products?offset=&limit=&search=&manufacturer=&minPrice=&maxPrice=` — list products (supports paging and filters). Default `offset=0`, `limit=10`.
- `GET /api/cart/products/:id` — get product detail by id.

Cart
- `GET /api/cart` — get current cart contents, totals.
- `POST /api/cart` — add item to cart. Body: `{ "partId": number, "quantity": number }`.
- `PUT /api/cart/:id` — update item quantity. Body: `{ "quantity": number }`. Setting `quantity` to `0` removes the item.
- `DELETE /api/cart/:id` — remove item from cart.

Frontend
- Open `http://localhost:3000/` to view the catalog. The frontend uses the API endpoints above to read products and manage the cart.
- Search bar filters by name, description, manufacturer, and price.
- Manufacturer dropdown filters available manufacturers.
- Price slider filters by maximum price.
- Click "Details" on any product to open the product page (`/product/:id`).
- Add items to cart from the list or detail page. The cart panel shows live totals and allows increment/decrement or removal.

Setup & Run
1. Install dependencies:

```bash
npm install
```

2. Run the dev server (hot reload via `tsx`):

```bash
npm run dev
```

3. Build (TypeScript):

```bash
npm run build
```

4. Run tests:

```bash
npm test
```

Notes
- The project includes TypeScript type definitions for third-party libs where needed.
- Resilience libraries may declare engine requirements; you may see an `EBADENGINE` npm warning on very new Node versions — the code still runs on Node 18/20/22+.

Next steps (optional)
- Add pagination controls in the frontend to use `offset/limit` instead of loading all products at once.
- Persist cart server-side (right now it's in-memory per server instance).
- Add authentication and per-user carts.

If you'd like, I can add any of those improvements next.
