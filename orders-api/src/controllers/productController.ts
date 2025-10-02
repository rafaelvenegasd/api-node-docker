import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  ProductIdInput
} from '../utils/validation';
import { ApiResponse, PaginatedResponse, Product } from '../types';

const productService = new ProductService();

export class ProductController {
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createProductSchema.safeParse(req.body);

      if (!validationResult.success) {
        const error = validationResult.error.errors[0]?.message || 'Validation error';
        res.status(400).json({
          success: false,
          error
        } as ApiResponse<never>);
        return;
      }

      const productData: CreateProductInput = validationResult.data;
      const product = await productService.createProduct(productData);

      res.status(201).json({
        success: true,
        data: product
      } as ApiResponse<Product>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

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

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = productIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      const product = await productService.getProductById(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: product
      } as ApiResponse<Product>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as any;
      const validationResult = productQuerySchema.safeParse(query);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters'
        } as ApiResponse<never>);
        return;
      }

      const queryData: ProductQueryInput = validationResult.data;
      const { products, hasMore } = await productService.getProducts(queryData);

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          cursor: products.length > 0 ? products[products.length - 1].id : undefined,
          limit: queryData.limit || 10,
          hasMore
        }
      } as PaginatedResponse<Product>);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({
        success: false,
        error: message
      } as ApiResponse<never>);
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const idValidation = productIdSchema.safeParse(params);

      if (!idValidation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        } as ApiResponse<never>);
        return;
      }

      const bodyValidation = updateProductSchema.safeParse(req.body);

      if (!bodyValidation.success) {
        const error = bodyValidation.error.errors[0]?.message || 'Validation error';
        res.status(400).json({
          success: false,
          error
        } as ApiResponse<never>);
        return;
      }

      const { id } = idValidation.data;
      const updateData: UpdateProductInput = bodyValidation.data;

      const product = await productService.updateProduct(id, updateData);

      res.status(200).json({
        success: true,
        data: product
      } as ApiResponse<Product>);
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

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const params = { id: (req.params as any).id };
      const validationResult = productIdSchema.safeParse(params);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid product ID'
        } as ApiResponse<never>);
        return;
      }

      const { id } = validationResult.data;
      await productService.deleteProduct(id);

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

      if (message.includes('used in orders')) {
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
}