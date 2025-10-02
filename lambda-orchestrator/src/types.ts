export interface OrchestratorRequest {
  customer_id: number;
  items: Array<{
    product_id: number;
    qty: number;
  }>;
  idempotency_key: string;
  correlation_id?: string;
}

export interface OrchestratorResponse {
  success: boolean;
  correlationId?: string;
  data?: {
    customer: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    };
    order: {
      id: number;
      status: string;
      total_cents: number;
      items: Array<{
        product_id: number;
        qty: number;
        unit_price_cents: number;
        subtotal_cents: number;
      }>;
    };
  };
  error?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  status: string;
  total_cents: number;
  created_at: string;
  items?: Array<{
    id: number;
    order_id: number;
    product_id: number;
    qty: number;
    unit_price_cents: number;
    subtotal_cents: number;
  }>;
}

export interface ApiConfig {
  customersApiBase: string;
  ordersApiBase: string;
  serviceToken: string;
}