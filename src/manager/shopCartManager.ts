import { createError } from "h3";
import {
  AddCartItemRequest,
  AutomobilePart,
  CartResponse,
  ProductListQuery,
  ProductListResponse,
  UpdateCartItemRequest
} from "../types/dto.js";
import { ShopCartService } from "../service/shopCartService.js";

export class ShopCartManager {
  constructor(private readonly service: ShopCartService) {}

  async listProducts(query: ProductListQuery): Promise<ProductListResponse> {
    return this.service.getProducts(query);
  }

  async getProduct(productId: number): Promise<AutomobilePart> {
    this.assertPositiveInt(productId, "productId");
    const product = await this.service.getProductById(productId);
    if (!product) {
      throw createError({ statusCode: 404, statusMessage: "Product not found" });
    }
    return product;
  }

  async getCart(): Promise<CartResponse> {
    return this.service.getCart();
  }

  async addToCart(payload: AddCartItemRequest): Promise<CartResponse> {
    this.assertPositiveInt(payload.partId, "partId");
    this.assertPositiveInt(payload.quantity, "quantity");

    const product = await this.service.getProductById(payload.partId);
    if (!product) {
      throw createError({ statusCode: 404, statusMessage: "Product not found" });
    }

    return this.service.addToCart(payload);
  }

  async updateCartItem(partId: number, payload: UpdateCartItemRequest): Promise<CartResponse> {
    this.assertPositiveInt(partId, "partId");
    if (!Number.isInteger(payload.quantity)) {
      throw createError({ statusCode: 400, statusMessage: "quantity must be an integer" });
    }

    const product = await this.service.getProductById(partId);
    if (!product) {
      throw createError({ statusCode: 404, statusMessage: "Product not found" });
    }

    return this.service.updateCartItem(partId, payload);
  }

  async removeCartItem(partId: number): Promise<CartResponse> {
    this.assertPositiveInt(partId, "partId");
    return this.service.removeCartItem(partId);
  }

  private assertPositiveInt(value: number, fieldName: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `${fieldName} must be a positive integer`
      });
    }
  }
}
