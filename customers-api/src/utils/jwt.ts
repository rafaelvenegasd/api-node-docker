import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTConfig } from '../types';

export interface JWTPayload {
  id: number;
  email: string;
  [key: string]: any;
}

export function createJWTConfig(): JWTConfig {
  return {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };
}

export function generateToken(payload: JWTPayload): string {
  const config = createJWTConfig();
  return jwt.sign(payload, config.secret, { expiresIn: config.expiresIn } as SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  try {
    const config = createJWTConfig();
    return jwt.verify(token, config.secret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}