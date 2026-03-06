import {
  H3Event,
  createApp,
  createError,
  createRouter,
  eventHandler,
  getQuery,
  setHeader,
  readBody,
  toNodeListener
} from "h3";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ShopCartService } from "./service/shopCartService.js";
import { ShopCartManager } from "./manager/shopCartManager.js";
import { ShopCartResilience } from "./resilience/shopCartResilience.js";
import { AddCartItemRequest, ProductListQuery, UpdateCartItemRequest } from "./types/dto.js";

const service = new ShopCartService();
const manager = new ShopCartManager(service);
const resilience = new ShopCartResilience(manager);

const webDir = join(process.cwd(), "src", "web");
const indexHtml = readFileSync(join(webDir, "index.html"), "utf-8");
const stylesCss = readFileSync(join(webDir, "styles.css"), "utf-8");
const appJs = readFileSync(join(webDir, "app.js"), "utf-8");

function getIdParam(event: H3Event): number {
  const id = Number(event.context.params?.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "id must be a positive integer" });
  }
  return id;
}

function getProductListQuery(event: H3Event): ProductListQuery {
  const query = getQuery(event);

  const offset = query.offset === undefined ? undefined : Number(query.offset);
  const limit = query.limit === undefined ? undefined : Number(query.limit);
  const minPrice = query.minPrice === undefined ? undefined : Number(query.minPrice);
  const maxPrice = query.maxPrice === undefined ? undefined : Number(query.maxPrice);

  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    throw createError({ statusCode: 400, statusMessage: "offset must be a non-negative integer" });
  }

  if (limit !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    throw createError({ statusCode: 400, statusMessage: "limit must be a positive integer" });
  }

  if (minPrice !== undefined && Number.isNaN(minPrice)) {
    throw createError({ statusCode: 400, statusMessage: "minPrice must be numeric" });
  }

  if (maxPrice !== undefined && Number.isNaN(maxPrice)) {
    throw createError({ statusCode: 400, statusMessage: "maxPrice must be numeric" });
  }

  return {
    offset,
    limit,
    search: typeof query.search === "string" ? query.search : undefined,
    manufacturer: typeof query.manufacturer === "string" ? query.manufacturer : undefined,
    minPrice,
    maxPrice
  };
}

export function createShopCartApp() {
  const app = createApp();

  const cartRouter = createRouter();
  const productRouter = createRouter();
  const webRouter = createRouter();

  webRouter.get("/", eventHandler((event) => {
    setHeader(event, "content-type", "text/html; charset=utf-8");
    return indexHtml;
  }));

  webRouter.get("/product/:id", eventHandler((event) => {
    getIdParam(event);
    setHeader(event, "content-type", "text/html; charset=utf-8");
    return indexHtml;
  }));

  webRouter.get("/assets/styles.css", eventHandler((event) => {
    setHeader(event, "content-type", "text/css; charset=utf-8");
    return stylesCss;
  }));

  webRouter.get("/assets/app.js", eventHandler((event) => {
    setHeader(event, "content-type", "application/javascript; charset=utf-8");
    return appJs;
  }));

  productRouter.get("/", eventHandler(async (event) => {
    const query = getProductListQuery(event);
    return resilience.listProducts(query);
  }));

  productRouter.get("/:id", eventHandler(async (event) => {
    const id = getIdParam(event);
    return resilience.getProduct(id);
  }));

  cartRouter.get("/", eventHandler(async () => {
    return resilience.getCart();
  }));

  cartRouter.post("/", eventHandler(async (event) => {
    const payload = (await readBody(event)) as Partial<AddCartItemRequest>;
    if (typeof payload?.partId !== "number" || typeof payload?.quantity !== "number") {
      throw createError({
        statusCode: 400,
        statusMessage: "partId and quantity are required numeric fields"
      });
    }
    return resilience.addToCart({ partId: payload.partId, quantity: payload.quantity });
  }));

  cartRouter.put("/:id", eventHandler(async (event) => {
    const id = getIdParam(event);
    const payload = (await readBody(event)) as Partial<UpdateCartItemRequest>;
    if (typeof payload?.quantity !== "number") {
      throw createError({ statusCode: 400, statusMessage: "quantity is required numeric field" });
    }
    return resilience.updateCartItem(id, { quantity: payload.quantity });
  }));

  cartRouter.delete("/:id", eventHandler(async (event) => {
    const id = getIdParam(event);
    return resilience.removeCartItem(id);
  }));

  app.use("/", webRouter.handler);
  app.use("/api/cart/products", productRouter.handler);
  app.use("/api/cart", cartRouter.handler);

  return app;
}

export function createNodeHandler() {
  return toNodeListener(createShopCartApp());
}
