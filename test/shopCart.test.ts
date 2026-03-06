import { createServer } from "node:http";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createNodeHandler } from "../src/app.js";

function setupServer() {
  return createServer(createNodeHandler());
}

afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 5));
});

describe("Shop cart API", () => {
  it("returns product list with pagination", async () => {
    const server = setupServer();
    const response = await request(server).get("/api/cart/products?offset=0&limit=5");

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(5);
    expect(response.body.total).toBeGreaterThanOrEqual(5);
    server.close();
  });

  it("supports add, update and delete cart item", async () => {
    const server = setupServer();

    const addResponse = await request(server).post("/api/cart").send({ partId: 1, quantity: 2 });
    expect(addResponse.status).toBe(200);
    expect(addResponse.body.totalQuantity).toBe(2);

    const updateResponse = await request(server).put("/api/cart/1").send({ quantity: 3 });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.totalQuantity).toBe(3);

    const deleteResponse = await request(server).delete("/api/cart/1");
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.totalQuantity).toBe(0);

    server.close();
  });
});
