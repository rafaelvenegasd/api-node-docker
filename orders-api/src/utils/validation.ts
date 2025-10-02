import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  price_cents: z.number().int().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be non-negative').default(0)
});

export const updateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters').optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  price_cents: z.number().int().min(0, 'Price must be non-negative').optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const productQuerySchema = z.object({
  search: z.string().max(255, 'Search term must be less than 255 characters').optional(),
  cursor: z.string().transform(val => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? undefined : parsed;
  }).optional(),
  limit: z.string().transform(val => {
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
  }).optional()
});

export const productIdSchema = z.object({
  id: z.string().transform(val => {
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Invalid product ID');
    }
    return parsed;
  })
});

export const createOrderSchema = z.object({
  customer_id: z.number().int().min(1, 'Valid customer ID is required'),
  items: z.array(z.object({
    product_id: z.number().int().min(1, 'Valid product ID is required'),
    qty: z.number().int().min(1, 'Quantity must be at least 1')
  })).min(1, 'At least one item is required')
});

export const orderIdSchema = z.object({
  id: z.string().transform(val => {
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Invalid order ID');
    }
    return parsed;
  })
});

export const confirmOrderSchema = z.object({
  idempotency_key: z.string().min(1, 'Idempotency key is required')
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
});

export const orderQuerySchema = z.object({
  status: z.enum(['CREATED', 'CONFIRMED', 'CANCELED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().transform(val => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? undefined : parsed;
  }).optional(),
  limit: z.string().transform(val => {
    const parsed = parseInt(val);
    return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
  }).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type ProductIdInput = z.infer<typeof productIdSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderIdInput = z.infer<typeof orderIdSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;