import Bottleneck from "bottleneck";
import CircuitBreaker from "opossum";
import pRetry from "p-retry";
import {
  AddCartItemRequest,
  AutomobilePart,
  CartResponse,
  ProductListQuery,
  ProductListResponse,
  UpdateCartItemRequest
} from "../types/dto.js";
import { ShopCartManager } from "../manager/shopCartManager.js";

export class ShopCartResilience {
  private readonly limiter: Bottleneck;
  private readonly breaker: CircuitBreaker<[() => Promise<unknown>], unknown>;

  constructor(private readonly manager: ShopCartManager) {
    this.limiter = new Bottleneck({
      maxConcurrent: 20,
      minTime: 25,
      reservoir: 200,
      reservoirRefreshAmount: 200,
      reservoirRefreshInterval: 60 * 1000
    });

    this.breaker = new CircuitBreaker(async (task: () => Promise<unknown>) => task(), {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 5000,
      volumeThreshold: 5,
      capacity: 50
    });
  }

  async listProducts(query: ProductListQuery): Promise<ProductListResponse> {
    return this.execute(() => this.manager.listProducts(query)) as Promise<ProductListResponse>;
  }

  async getProduct(productId: number): Promise<AutomobilePart> {
    return this.execute(() => this.manager.getProduct(productId)) as Promise<AutomobilePart>;
  }

  async getCart(): Promise<CartResponse> {
    return this.execute(() => this.manager.getCart()) as Promise<CartResponse>;
  }

  async addToCart(payload: AddCartItemRequest): Promise<CartResponse> {
    return this.execute(() => this.manager.addToCart(payload)) as Promise<CartResponse>;
  }

  async updateCartItem(partId: number, payload: UpdateCartItemRequest): Promise<CartResponse> {
    return this.execute(() => this.manager.updateCartItem(partId, payload)) as Promise<CartResponse>;
  }

  async removeCartItem(partId: number): Promise<CartResponse> {
    return this.execute(() => this.manager.removeCartItem(partId)) as Promise<CartResponse>;
  }

  private async execute<T>(action: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(() =>
      pRetry(
        async () => {
          const result = await this.breaker.fire(action);
          return result as T;
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 100,
          maxTimeout: 1000,
          randomize: true
        }
      )
    );
  }
}
