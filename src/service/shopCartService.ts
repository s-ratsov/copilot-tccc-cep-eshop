import { catalog } from "../data/catalog.js";
import {
  AddCartItemRequest,
  AutomobilePart,
  CartItem,
  CartResponse,
  ProductListQuery,
  ProductListResponse,
  UpdateCartItemRequest
} from "../types/dto.js";

export class ShopCartService {
  private readonly cart = new Map<number, number>();

  async getProducts(query: ProductListQuery): Promise<ProductListResponse> {
    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.max(1, query.limit ?? 10);
    const normalizedSearch = (query.search ?? "").trim().toLowerCase();

    const filtered = catalog.filter((part) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        part.name.toLowerCase().includes(normalizedSearch) ||
        part.description.toLowerCase().includes(normalizedSearch) ||
        part.manufacturer.toLowerCase().includes(normalizedSearch) ||
        part.price.toString().includes(normalizedSearch);

      const matchesManufacturer =
        query.manufacturer === undefined ||
        part.manufacturer.toLowerCase() === query.manufacturer.toLowerCase();

      const matchesMinPrice = query.minPrice === undefined || part.price >= query.minPrice;
      const matchesMaxPrice = query.maxPrice === undefined || part.price <= query.maxPrice;

      return matchesSearch && matchesManufacturer && matchesMinPrice && matchesMaxPrice;
    });

    const items = filtered.slice(offset, offset + limit);

    return {
      items,
      total: filtered.length,
      offset,
      limit
    };
  }

  async getProductById(productId: number): Promise<AutomobilePart | null> {
    return catalog.find((part) => part.id === productId) ?? null;
  }

  async getCart(): Promise<CartResponse> {
    const items = Array.from(this.cart.entries())
      .map(([partId, quantity]) => {
        const product = catalog.find((part) => part.id === partId);
        if (!product) {
          return null;
        }
        return this.toCartItem(product, quantity);
      })
      .filter((item): item is CartItem => item !== null);

    return this.createCartResponse(items);
  }

  async addToCart(payload: AddCartItemRequest): Promise<CartResponse> {
    const currentQuantity = this.cart.get(payload.partId) ?? 0;
    this.cart.set(payload.partId, currentQuantity + payload.quantity);
    return this.getCart();
  }

  async updateCartItem(partId: number, payload: UpdateCartItemRequest): Promise<CartResponse> {
    if (payload.quantity <= 0) {
      this.cart.delete(partId);
      return this.getCart();
    }

    this.cart.set(partId, payload.quantity);
    return this.getCart();
  }

  async removeCartItem(partId: number): Promise<CartResponse> {
    this.cart.delete(partId);
    return this.getCart();
  }

  private toCartItem(product: AutomobilePart, quantity: number): CartItem {
    return {
      partId: product.id,
      quantity,
      product,
      lineTotal: Number((product.price * quantity).toFixed(2))
    };
  }

  private createCartResponse(items: CartItem[]): CartResponse {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));

    return {
      items,
      totalQuantity,
      totalPrice
    };
  }
}
