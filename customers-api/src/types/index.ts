export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerQuery {
  search?: string;
  cursor?: number;
  limit?: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface ServiceTokenConfig {
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    cursor?: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
}