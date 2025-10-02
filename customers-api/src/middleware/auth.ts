import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { ServiceTokenConfig } from '../types';

export function createServiceTokenConfig(): ServiceTokenConfig {
  return {
    token: process.env.SERVICE_TOKEN || 'your-service-token-change-in-production'
  };
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    });
    return;
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

export function authenticateServiceToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Service token required'
    });
    return;
  }

  const config = createServiceTokenConfig();
  if (token !== config.token) {
    res.status(403).json({
      success: false,
      error: 'Invalid service token'
    });
    return;
  }

  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    try {
      const decoded = verifyToken(token);
      (req as any).user = decoded;
    } catch (error) {
    }
  }

  next();
}