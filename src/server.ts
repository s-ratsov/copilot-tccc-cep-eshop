import { createServer } from "node:http";
import { createNodeHandler } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const server = createServer(createNodeHandler());

server.listen(port, () => {
  console.log(`ShopCartAPI listening on http://localhost:${port}`);
});
