export interface ProductSpecification {
  weight: string;
  dimensions: string;
  material: string;
}

export interface AutomobilePart {
  id: number;
  name: string;
  description: string;
  image_url: string;
  price: number;
  manufacturer: string;
  model_compatibility: string[];
  part_number: string;
  stock: number;
  specifications: ProductSpecification;
}

export interface ProductListQuery {
  offset?: number;
  limit?: number;
  search?: string;
  manufacturer?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductListResponse {
  items: AutomobilePart[];
  total: number;
  offset: number;
  limit: number;
}

export interface AddCartItemRequest {
  partId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartItem {
  partId: number;
  quantity: number;
  product: AutomobilePart;
  lineTotal: number;
}

export interface CartResponse {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
}
