import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters'),
  phone: z.string().max(50, 'Phone must be less than 50 characters').optional()
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters').optional(),
  phone: z.string().max(50, 'Phone must be less than 50 characters').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export const customerQuerySchema = z.object({
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

export const customerIdSchema = z.object({
  id: z.string().transform(val => {
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Invalid customer ID');
    }
    return parsed;
  })
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CustomerIdInput = z.infer<typeof customerIdSchema>;