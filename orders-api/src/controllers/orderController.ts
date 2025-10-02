import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import {
  createOrderSchema,
  confirmOrderSchema,
  cancelOrderSchema,
  orderQuerySchema,
  orderIdSchema,
  CreateOrderInput,
  ConfirmOrderInput,
  CancelOrderInput,
  OrderQueryInput,
  OrderIdInput
} from '../utils/validation';
import { ApiResponse, PaginatedResponse, Order } from '../types';

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createOrderSchema.safeParse(req.body);

      if (!validationResult.success) {
        const error = validationResult.error.errors[0]?.message || 'Validation error';
        res.status(400).json({
          success: false,
          error
        } as ApiResponse<never>);
        return;
      }

      const orderData: CreateOrderInput = validationResult.data;
      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order
      } as ApiResponse<Order>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      if (message.includes('Insufficient stock') || message.includes('not found')) {
        res.status(400).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = orderIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      const order = await orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: order
      } as ApiResponse<Order>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as any;
      const validationResult = orderQuerySchema.safeParse(query);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters'
        } as ApiResponse<never>);
        return;
      }

      const queryData: OrderQueryInput = validationResult.data;
      const { orders, hasMore } = await orderService.getOrders(queryData);

      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          cursor: orders.length > 0 ? orders[orders.length - 1].id : undefined,
          limit: queryData.limit || 10,
          hasMore
        }
      } as PaginatedResponse<Order>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async confirmOrder(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const idValidation = orderIdSchema.safeParse(params);

      if (!idValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        } as ApiResponse<never>);
        return;
      }

      const bodyValidation = confirmOrderSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        const error = bodyValidation.error.errors[0]?.message || 'Validation error';
        res.status(400).json({
          success: false,
          error
        } as ApiResponse<never>);
        return;
      }

      const { id } = idValidation.data;
      const { idempotency_key }: ConfirmOrderInput = bodyValidation.data;

      const order = await orderService.confirmOrder(id, idempotency_key);

      res.status(200).json({
        success: true,
        data: order
      } as ApiResponse<Order>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      if (message.includes('cannot be confirmed') || message.includes('already used')) {
        res.status(400).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = orderIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      const order = await orderService.cancelOrder(id);

      res.status(200).json({
        success: true,
        data: order
      } as ApiResponse<Order>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      if (message.includes('cannot be canceled') || message.includes('within 10 minutes')) {
        res.status(400).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }
}