import { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerQuery } from '../types';
import { executeQuery, executeTransaction } from '../utils/database';

export class CustomerService {
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const existingCustomers = await executeQuery<Customer[]>(
      'SELECT id FROM customers WHERE email = ?',
      [data.email]
    );

    if (existingCustomers.length > 0) {
      throw new Error('Email already exists');
    }

    const result = await executeQuery<{ insertId: number }>(
      'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
      [data.name, data.email, data.phone || null]
    );

    const customers = await executeQuery<Customer[]>(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    if (customers.length === 0) {
      throw new Error('Failed to create customer');
    }

    return customers[0];
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const customers = await executeQuery<Customer[]>(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    return customers.length > 0 ? customers[0] : null;
  }

  async getCustomers(query: CustomerQuery = {}): Promise<{ customers: Customer[], hasMore: boolean }> {
    let { search, cursor, limit = 10 } = query;

    const limitNum = Number(limit);
    const safeLimit = Number.isFinite(limitNum) ? Math.min(100, Math.max(1, limitNum)) : 10;
    const queryLimit = safeLimit + 1; 

    const params: any[] = [];
    const whereParts: string[] = [];

    if (search && String(search).trim() !== '') {
      const s = `%${String(search).trim()}%`;
      whereParts.push('(name LIKE ? OR email LIKE ?)');
      params.push(s, s);
    }

    if (cursor !== undefined && cursor !== null && String(cursor).trim() !== '') {
      const lastId = Number(cursor);
      if (Number.isFinite(lastId)) {
        whereParts.push('id > ?');
        params.push(lastId);
      } else {
        throw new Error('Invalid cursor');
      }
    }

    let sql = 'SELECT * FROM customers';
    if (whereParts.length) {
      sql += ' WHERE ' + whereParts.join(' AND ');
    }
    sql += ` ORDER BY id ASC LIMIT ${queryLimit}`;

    const customers = await executeQuery<Customer[]>(sql, params);

    const hasMore = customers.length > safeLimit;
    if (hasMore) customers.pop();

    return { customers, hasMore };
  }

  async updateCustomer(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    const existingCustomer = await this.getCustomerById(id);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    if (data.email && data.email !== existingCustomer.email) {
      const emailCheck = await executeQuery<Customer[]>(
        'SELECT id FROM customers WHERE email = ? AND id != ?',
        [data.email, id]
      );

      if (emailCheck.length > 0) {
        throw new Error('Email already exists');
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email);
    }

    if (data.phone !== undefined) {
      updates.push('phone = ?');
      params.push(data.phone);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);

    await executeQuery(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedCustomer = await this.getCustomerById(id);
    if (!updatedCustomer) {
      throw new Error('Failed to retrieve updated customer');
    }

    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<void> {
    const existingCustomer = await this.getCustomerById(id);
    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    await executeQuery(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const customers = await executeQuery<Customer[]>(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    return customers.length > 0 ? customers[0] : null;
  }
}