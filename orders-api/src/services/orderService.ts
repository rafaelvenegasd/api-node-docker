import { Order, CreateOrderRequest, OrderQuery, OrderItem, IdempotencyKeyRow } from '../types';
import { executeQuery, executeTransaction } from '../utils/database';
import { getHttpClient } from '../utils/httpClient';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const httpClient = getHttpClient();

export class OrderService {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return executeTransaction(async (conn) => {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }
      for (const it of data.items) {
        if (!Number.isInteger(it.qty) || it.qty <= 0) {
          throw new Error(`Invalid qty for product ${it.product_id}`);
        }
      }

      const customerExists = await httpClient.validateCustomer(data.customer_id);
      if (!customerExists) {
        throw new Error('Customer not found or inactive');
      }

      const qtyByProduct = new Map<number, number>();
      for (const it of data.items) {
        qtyByProduct.set(it.product_id, (qtyByProduct.get(it.product_id) ?? 0) + it.qty);
      }
      const productIds = [...qtyByProduct.keys()];
      if (productIds.length === 0) throw new Error('No products provided');

      const ph = productIds.map(() => '?').join(',');
      const [rows] = await conn.execute(
        `SELECT id, name, price_cents, stock
          FROM products
          WHERE id IN (${ph})
          FOR UPDATE`,
        productIds
      );
      const products = (rows as Array<{id:number; name:string; price_cents:number; stock:number}>);

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map(p => p.id));
        const missing = productIds.filter(id => !foundIds.has(id));
        throw new Error(`Products not found: ${missing.join(', ')}`);
      }

      let totalCents = 0;
      const orderItems: Array<{
        product_id: number;
        qty: number;
        unit_price_cents: number;
        subtotal_cents: number;
      }> = [];

      for (const p of products) {
        const qty = qtyByProduct.get(p.id)!;
        if (p.stock < qty) {
          throw new Error(`Insufficient stock for product ${p.name}. Available: ${p.stock}, Requested: ${qty}`);
        }
        const subtotal = p.price_cents * qty;
        totalCents += subtotal;
        orderItems.push({
          product_id: p.id,
          qty,
          unit_price_cents: p.price_cents,
          subtotal_cents: subtotal
        });
      }

      const [orderRes] = await conn.execute<ResultSetHeader>(
        'INSERT INTO orders (customer_id, status, total_cents) VALUES (?, ?, ?)',
        [data.customer_id, 'CREATED', totalCents]
      );
      const orderId = orderRes.insertId;

      const itemSql = 'INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents) VALUES (?, ?, ?, ?, ?)';
      for (const it of orderItems) {
        await conn.execute(itemSql, [orderId, it.product_id, it.qty, it.unit_price_cents, it.subtotal_cents]);
      }

      const updSql = 'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?';
      for (const it of orderItems) {
        const [updRes] = await conn.execute<ResultSetHeader>(updSql, [it.qty, it.product_id, it.qty]);
        if (updRes.affectedRows !== 1) {
          throw new Error(`Concurrent stock update detected for product ${it.product_id}`);
        }
      }
      
      const [orderRows] = await conn.execute(
        `SELECT o.id, o.customer_id, o.status, o.total_cents, o.created_at
          FROM orders o WHERE o.id = ?`,
        [orderId]
      );
      const order = (orderRows as any[])[0];

      const [itemsRows] = await conn.execute(
        `SELECT oi.product_id, oi.qty, oi.unit_price_cents, oi.subtotal_cents, p.name
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?`,
        [orderId]
      );

      return { ...order, items: itemsRows } as Order;
    });
  }

  async getOrderById(id: number): Promise<Order | null> {
    const orders = await executeQuery<Order[]>(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    const orderItems = await executeQuery<OrderItem[]>(
      `SELECT oi.*, p.name as product_name, p.sku as product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    return {
      ...order,
      items: orderItems
    };
  }

  async getOrders(query: OrderQuery = {}): Promise<{ orders: Order[], hasMore: boolean }> {
    const { status, from, to, cursor, limit = 10 } = query;

    let whereClause = '';
    let params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    if (from) {
      if (whereClause) {
        whereClause += ' AND created_at >= ?';
      } else {
        whereClause = 'WHERE created_at >= ?';
      }
      params.push(from);
    }

    if (to) {
      if (whereClause) {
        whereClause += ' AND created_at <= ?';
      } else {
        whereClause = 'WHERE created_at <= ?';
      }
      params.push(to);
    }

    if (cursor) {
      if (whereClause) {
        whereClause += ' AND id > ?';
      } else {
        whereClause = 'WHERE id > ?';
      }
      params.push(cursor);
    }

    const queryLimit = limit + 1; // Get one extra to check if there are more

    const orders = await executeQuery<Order[]>(
      `SELECT * FROM orders ${whereClause} ORDER BY id LIMIT ${queryLimit}`,
      params
    );

    const hasMore = orders.length > limit;
    if (hasMore) {
      orders.pop(); // Remove the extra item
    }

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await executeQuery<OrderItem[]>(
          `SELECT oi.*, p.name as product_name, p.sku as product_sku
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );
        return { ...order, items };
      })
    );

    return { orders: ordersWithItems, hasMore };
  }

  async confirmOrder(id: number, idempotencyKey: string): Promise<Order> {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new Error('Idempotency key required');
    }

    return executeTransaction(async (conn) => {
      try {
        await conn.execute<ResultSetHeader>(
          `INSERT INTO idempotency_keys (key_value, target_type, target_id, status, expires_at)
          VALUES (?, 'order', ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
          [idempotencyKey, id]
        );
      } catch (e: any) {
        if (e?.code !== 'ER_DUP_ENTRY') throw e;
      }

      const [keyRows] = await conn.execute<IdempotencyKeyRow[]>(
        `SELECT key_value, target_type, target_id, status, response_body
          FROM idempotency_keys
          WHERE key_value = ?`,
        [idempotencyKey]
      );
      const key = keyRows[0];
      if (!key) {
        throw new Error('Idempotency key not persisted');
      }

      if (!(key.target_type === 'order' && key.target_id === id)) {
        throw new Error('Idempotency key already used for different operation');
      }

      if (key.status === 'COMPLETED') {
        const order = await this.getOrderByIdUsingSameConn(conn, id);
        if (!order) throw new Error('Order not found after completed idempotent op');
        return order;
      }
      if (key.status === 'PENDING') {
        throw new Error('Operation in progress for this idempotency key');
      }

      const [orderRows] = await conn.execute<RowDataPacket[]>(
        `SELECT id, status FROM orders WHERE id = ? FOR UPDATE`,
        [id]
      );
      const row = orderRows[0] as any;
      if (!row) throw new Error('Order not found');

      if (row.status === 'CONFIRMED') {
        await conn.execute(
          `UPDATE idempotency_keys
              SET status = 'COMPLETED',
                  response_body = ?
            WHERE key_value = ?`,
          [JSON.stringify({ success: true, orderId: id, status: 'CONFIRMED' }), idempotencyKey]
        );
        const order = await this.getOrderByIdUsingSameConn(conn, id);
        return order!;
      }

      if (row.status !== 'CREATED') {
        await conn.execute(
          `UPDATE idempotency_keys SET status='FAILED', response_body=? WHERE key_value=?`,
          [JSON.stringify({ success: false, error: `Order cannot be confirmed. Current status: ${row.status}` }), idempotencyKey]
        );
        throw new Error(`Order cannot be confirmed. Current status: ${row.status}`);
      }

      const [upd] = await conn.execute<ResultSetHeader>(
        `UPDATE orders SET status = 'CONFIRMED' WHERE id = ? AND status = 'CREATED'`,
        [id]
      );
      if (upd.affectedRows !== 1) {
        await conn.execute(
          `UPDATE idempotency_keys SET status='FAILED', response_body=? WHERE key_value=?`,
          [JSON.stringify({ success: false, error: 'Concurrent confirmation detected' }), idempotencyKey]
        );
        throw new Error('Concurrent confirmation detected');
      }

      const responseSnapshot = JSON.stringify({ success: true, orderId: id, status: 'CONFIRMED' });
      await conn.execute(
        `UPDATE idempotency_keys
            SET status='COMPLETED',
                response_body=?,
                expires_at=DATE_ADD(NOW(), INTERVAL 24 HOUR)
          WHERE key_value=?`,
        [responseSnapshot, idempotencyKey]
      );

      const order = await this.getOrderByIdUsingSameConn(conn, id);
      if (!order) throw new Error('Failed to retrieve confirmed order');
      return order;
    });
  }

// Helper: reusa la MISMA conexión dentro de la transacción
  async getOrderByIdUsingSameConn(conn: any, id: number): Promise<Order | null> {
    const [rows] = await conn.execute(
      `SELECT id, customer_id, status, total_cents, created_at
        FROM orders WHERE id = ?`,
      [id]
    );
    const order = rows[0] as any;
    if (!order) return null;

    const [items] = await conn.execute(
      `SELECT oi.product_id, oi.qty, oi.unit_price_cents, oi.subtotal_cents, p.name
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?`,
      [id]
    );
    return { ...order, items } as Order;
  }

  async cancelOrder(id: number): Promise<Order> {
    return await executeTransaction(async (connection) => {
      const order = await this.getOrderById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status === 'CANCELED') {
        return order; // Already canceled
      }

      if (order.status === 'CONFIRMED') {
        const orderTime = new Date(order.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);

        if (diffMinutes > 10) {
          throw new Error('Confirmed orders can only be canceled within 10 minutes of creation');
        }
      }

      await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['CANCELED', id]
      );

      const orderItems = await connection.execute(
        'SELECT product_id, qty FROM order_items WHERE order_id = ?',
        [id]
      );

      const items = orderItems[0] as Array<{ product_id: number; qty: number }>;

      for (const item of items) {
        await connection.execute(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.qty, item.product_id]
        );
      }

      const updatedOrder = await this.getOrderById(id);
      if (!updatedOrder) {
        throw new Error('Failed to retrieve canceled order');
      }

      return updatedOrder;
    });
  }
}