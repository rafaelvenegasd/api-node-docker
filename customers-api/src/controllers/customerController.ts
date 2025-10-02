import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  customerIdSchema,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
  CustomerIdInput
} from '../utils/validation';
import { ApiResponse, PaginatedResponse, Customer } from '../types';

const customerService = new CustomerService();

export class CustomerController {
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createCustomerSchema.safeParse(req.body);

      if (!validationResult.success) {
        const error = validationResult.error.errors[0]?.message || 'Validation error';
        res.status(400).json({
          success: false,
          error
        } as ApiResponse<never>);
        return;
      }

      const customerData: CreateCustomerInput = validationResult.data;
      const customer = await customerService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        data: customer
      } as ApiResponse<Customer>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('Email already exists')) {
        res.status(409).json({
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

  async getCustomer(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = customerIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid customer ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      const customer = await customerService.getCustomerById(id);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: customer
      } as ApiResponse<Customer>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as any;
      const validationResult = customerQuerySchema.safeParse(query);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters'
        } as ApiResponse<never>);
        return;
      }

      const queryData: CustomerQueryInput = validationResult.data;
      const { customers, hasMore } = await customerService.getCustomers(queryData);

      res.status(200).json({
        success: true,
        data: customers,
        pagination: {
          cursor: customers.length > 0 ? customers[customers.length - 1].id : undefined,
          limit: queryData.limit || 10,
          hasMore
        }
      } as PaginatedResponse<Customer>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const idValidation = customerIdSchema.safeParse(params);

      if (!idValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid customer ID'
        } as ApiResponse<never>);
        return;
      }

      const bodyValidation = updateCustomerSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        const error = bodyValidation.error.errors[0]?.message || 'Validation error';
        res.status(400).json({
          success: false,
          error
        } as ApiResponse<never>);
        return;
      }

      const { id } = idValidation.data;
      const updateData: UpdateCustomerInput = bodyValidation.data;

      const customer = await customerService.updateCustomer(id, updateData);

      res.status(200).json({
        success: true,
        data: customer
      } as ApiResponse<Customer>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: message
        } as ApiResponse<never>);
        return;
      }

      if (message.includes('already exists')) {
        res.status(409).json({
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

  async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = customerIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid customer ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      await customerService.deleteCustomer(id);

      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('not found')) {
        res.status(404).json({
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

  async getInternalCustomer(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = customerIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid customer ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      const customer = await customerService.getCustomerById(id);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: customer
      } as ApiResponse<Customer>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }
}