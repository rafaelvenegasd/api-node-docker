import { RowDataPacket } from "mysql2/typings/mysql/lib/protocol/packets/RowDataPacket";

export interface Product {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
  stock: number;
  created_at: Date;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  price_cents: number;
  stock?: number;
}

export interface IdempotencyKeyRow extends RowDataPacket {
  key_value: string;
  target_type: string;
  target_id: number;
  status: 'PENDING'|'COMPLETED'|'FAILED';
  response_body: string | null;
};

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  price_cents?: number;
  stock?: number;
}

export interface ProductQuery {
  search?: string;
  cursor?: number;
  limit?: number;
}

export interface Order {
  id: number;
  customer_id: number;
  status: 'CREATED' | 'CONFIRMED' | 'CANCELED';
  total_cents: number;
  created_at: Date;
  items?: OrderItem[];
  customer?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  qty: number;
  unit_price_cents: number;
  subtotal_cents: number;
  product?: Product;
}

export interface CreateOrderRequest {
  customer_id: number;
  items: Array<{
    product_id: number;
    qty: number;
  }>;
}

export interface CreateOrderItem  { 
  product_id: number; 
  qty: number
};

export interface ConfirmOrderRequest {
  idempotency_key: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface OrderQuery {
  status?: 'CREATED' | 'CONFIRMED' | 'CANCELED';
  from?: string;
  to?: string;
  cursor?: number;
  limit?: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface CustomersApiConfig {
  baseUrl: string;
  serviceToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    cursor?: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface IdempotencyKey {
  key_value: string;
  target_type: string;
  target_id: number;
  status: string;
  response_body?: string;
  created_at: Date;
  expires_at: Date;
}