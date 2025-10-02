import { Product, CreateProductRequest, UpdateProductRequest, ProductQuery } from '../types';
import { executeQuery } from '../utils/database';

export class ProductService {
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const existingProducts = await executeQuery<Product[]>(
      'SELECT id FROM products WHERE sku = ?',
      [data.sku]
    );

    if (existingProducts.length > 0) {
      throw new Error('SKU already exists');
    }

    const result = await executeQuery<{ insertId: number }>(
      'INSERT INTO products (sku, name, price_cents, stock) VALUES (?, ?, ?, ?)',
      [data.sku, data.name, data.price_cents, data.stock || 0]
    );

    const products = await executeQuery<Product[]>(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    if (products.length === 0) {
      throw new Error('Failed to create product');
    }

    return products[0];
  }

  async getProductById(id: number): Promise<Product | null> {
    const products = await executeQuery<Product[]>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    return products.length > 0 ? products[0] : null;
  }

  async getProducts(query: ProductQuery = {}): Promise<{ products: Product[], hasMore: boolean }> {
    const { search, cursor, limit = 10 } = query;

    let whereClause = '';
    let params: any[] = [];

    if (search) {
      whereClause = 'WHERE sku LIKE ? OR name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (cursor) {
      if (whereClause) {
        whereClause += ' AND id > ?';
      } else {
        whereClause = 'WHERE id > ?';
      }
      params.push(cursor);
    }

    const queryLimit = limit + 1; 

    const products = await executeQuery<Product[]>(
      `SELECT * FROM products ${whereClause} ORDER BY id LIMIT ${queryLimit}`,
      params
    );

    const hasMore = products.length > limit;
    if (hasMore) {
      products.pop(); 
    }

    return { products, hasMore };
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    if (data.sku && data.sku !== existingProduct.sku) {
      const skuCheck = await executeQuery<Product[]>(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [data.sku, id]
      );

      if (skuCheck.length > 0) {
        throw new Error('SKU already exists');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.sku !== undefined) {
      updates.push('sku = ?');
      params.push(data.sku);
    }

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.price_cents !== undefined) {
      updates.push('price_cents = ?');
      params.push(data.price_cents);
    }

    if (data.stock !== undefined) {
      updates.push('stock = ?');
      params.push(data.stock);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);

    await executeQuery(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedProduct = await this.getProductById(id);
    if (!updatedProduct) {
      throw new Error('Failed to retrieve updated product');
    }

    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const orderItems = await executeQuery(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [id]
    );

    if (orderItems[0].count > 0) {
      throw new Error('Cannot delete product that is used in orders');
    }

    await executeQuery(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    const products = await executeQuery<Product[]>(
      'SELECT * FROM products WHERE sku = ?',
      [sku]
    );

    return products.length > 0 ? products[0] : null;
  }

  async updateProductStock(id: number, newStock: number): Promise<void> {
    await executeQuery(
      'UPDATE products SET stock = ? WHERE id = ?',
      [newStock, id]
    );
  }

  async getProductsByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(',');
    const products = await executeQuery<Product[]>(
      `SELECT * FROM products WHERE id IN (${placeholders})`,
      ids
    );

    return products;
  }
}