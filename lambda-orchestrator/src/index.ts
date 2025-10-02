import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  OrchestratorRequest,
  OrchestratorResponse,
  Customer,
  Order,
  ApiConfig
} from './types';

const orchestratorRequestSchema = z.object({
  customer_id: z.number().int().min(1),
  items: z.array(z.object({
    product_id: z.number().int().min(1),
    qty: z.number().int().min(1)
  })).min(1),
  idempotency_key: z.string().min(1),
  correlation_id: z.string().optional()
});

function getApiConfig(): ApiConfig {
  return {
    customersApiBase: process.env.CUSTOMERS_API_BASE || 'http://localhost:3001/api/v1',
    ordersApiBase: process.env.ORDERS_API_BASE || 'http://localhost:3002/api/v1',
    serviceToken: process.env.CUSTOMERS_API_TOKEN || 'your-service-token-change-in-production'
  };
}

class ApiClient {
  private customersClient: AxiosInstance;
  private ordersClient: AxiosInstance;

  constructor(config: ApiConfig) {
    this.customersClient = axios.create({
      baseURL: config.customersApiBase,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.serviceToken}`
      }
    });

    this.ordersClient = axios.create({
      baseURL: config.ordersApiBase,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    [this.customersClient, this.ordersClient].forEach(client => {
      client.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response) {
            throw new Error(`${error.config.baseURL} error: ${error.response.data?.error || error.message}`);
          } else if (error.request) {
            throw new Error(`Unable to reach ${error.config.baseURL}`);
          } else {
            throw new Error(`Request error: ${error.message}`);
          }
        }
      );
    });
  }

  async validateCustomer(customerId: number): Promise<Customer> {
    const response = await this.customersClient.get(`/internal/customers/${customerId}`);
    return response.data.data;
  }

  async createOrder(orderData: {
    customer_id: number;
    items: Array<{ product_id: number; qty: number }>;
  }): Promise<Order> {
    const response = await this.ordersClient.post('/orders', orderData);
    return response.data.data;
  }

  async confirmOrder(orderId: number, idempotencyKey: string): Promise<Order> {
    const response = await this.ordersClient.post(`/orders/${orderId}/confirm`, {
      idempotency_key: idempotencyKey
    });
    return response.data.data;
  }
}

export async function createAndConfirmOrder(
  event: any,
  context: any
): Promise<OrchestratorResponse> {
  const correlationId = uuidv4();

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const validationResult = orchestratorRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return {
        success: false,
        correlationId,
        error: validationResult.error.errors[0]?.message || 'Invalid request data'
      };
    }

    const requestData: OrchestratorRequest = validationResult.data;

    const responseCorrelationId = requestData.correlation_id || correlationId;

    console.log(`[${responseCorrelationId}] Starting order orchestration for customer ${requestData.customer_id}`);

    const config = getApiConfig();
    const apiClient = new ApiClient(config);

    console.log(`[${responseCorrelationId}] Validating customer ${requestData.customer_id}`);
    let customer: Customer;
    try {
      customer = await apiClient.validateCustomer(requestData.customer_id);
      console.log(`[${responseCorrelationId}] Customer validated: ${customer.name}`);
    } catch (error) {
      console.error(`[${responseCorrelationId}] Customer validation failed:`, error);
      return {
        success: false,
        correlationId: responseCorrelationId,
        error: `Customer validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    console.log(`[${responseCorrelationId}] Creating order with ${requestData.items.length} items`);
    let order: Order;
    try {
      order = await apiClient.createOrder({
        customer_id: requestData.customer_id,
        items: requestData.items
      });
      console.log(`[${responseCorrelationId}] Order created with ID: ${order.id}`);
    } catch (error) {
      console.error(`[${responseCorrelationId}] Order creation failed:`, error);
      return {
        success: false,
        correlationId: responseCorrelationId,
        error: `Order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    console.log(`[${responseCorrelationId}] Confirming order ${order.id}`);
    try {
      order = await apiClient.confirmOrder(order.id, requestData.idempotency_key);
      console.log(`[${responseCorrelationId}] Order confirmed: ${order.status}`);
    } catch (error) {
      console.error(`[${responseCorrelationId}] Order confirmation failed:`, error);
      return {
        success: false,
        correlationId: responseCorrelationId,
        error: `Order confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }

    console.log(`[${responseCorrelationId}] Order orchestration completed successfully`);

    return {
      success: true,
      correlationId: responseCorrelationId,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        order: {
          id: order.id,
          status: order.status,
          total_cents: order.total_cents,
          items: order.items?.map(item => ({
            product_id: item.product_id,
            qty: item.qty,
            unit_price_cents: item.unit_price_cents,
            subtotal_cents: item.subtotal_cents
          })) || []
        }
      }
    };

  } catch (error) {
    console.error(`[${correlationId}] Unexpected error in order orchestration:`, error);
    return {
      success: false,
      correlationId,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const handler = createAndConfirmOrder;