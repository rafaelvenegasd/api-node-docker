import mysql from 'mysql2/promise';
import { DatabaseConfig } from '../types';

let pool: mysql.Pool | null = null;

export function createDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'b2b_orders',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10')
  };
}

export function getDatabasePool(): mysql.Pool {
  if (!pool) {
    const config = createDatabaseConfig();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit,
      waitForConnections: true,
      queueLimit: 0
    });
  }
  return pool;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const pool = getDatabasePool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function executeQuery<T = any>(sql: string, params: any[] = []): Promise<T> {
  const pool = getDatabasePool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function executeTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getDatabasePool();
  const connection = await pool.getConnection();

  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}