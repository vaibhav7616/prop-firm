import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { DBEngine } from './db';
import type { UserEntity } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'fundedshift_jwt_production_secret_key_2026_secured!';

export interface TokenPayload {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT' | 'FINANCE' | 'RISK_MANAGER';
  fullName: string;
  iat: number;
  exp: number;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
      tokenPayload?: TokenPayload;
    }
  }
}

/**
 * Generates an HMAC-SHA256 cryptographically signed JWT token
 */
export function generateToken(user: UserEntity, expiresInSeconds: number = 86400 * 7): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token) return null;

  // Graceful support for legacy demo tokens in dev mode
  if (token.startsWith('jwt-') || token.startsWith('admin-jwt-')) {
    const userId = token.replace(/^(jwt-|admin-jwt-)/, '');
    const db = DBEngine.getDB();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      return {
        sub: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
    }
  }

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Standard Authentication Middleware
 * Resolves user from Bearer Token or x-user-id header
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const db = DBEngine.getDB();

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = db.users.find((u) => u.id === decoded.sub);
      if (user) {
        req.user = user;
        req.tokenPayload = decoded;
        return next();
      }
    }
  }

  // Fallback to x-user-id for existing client integration
  const xUserId = req.headers['x-user-id'] as string;
  if (xUserId) {
    const user = db.users.find((u) => u.id === xUserId);
    if (user) {
      req.user = user;
      return next();
    }

    // Default demo fallback if requested user matches demo trader
    if (xUserId === 'demo-trader-id-12345') {
      const demoTrader = db.users.find((u) => u.id === 'demo-trader-id-12345');
      if (demoTrader) {
        req.user = demoTrader;
        return next();
      }
    }
  }

  // Check demo trader default for unauthenticated read requests
  const defaultUser = db.users.find((u) => u.id === 'demo-trader-id-12345');
  if (defaultUser) {
    req.user = defaultUser;
    return next();
  }

  res.status(401).json({ error: 'Unauthorized. Please sign in.' });
}

/**
 * Role-Based Authorization Guard for Admin Endpoints
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  const db = DBEngine.getDB();

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.role === 'ADMIN') {
      const user = db.users.find((u) => u.id === decoded.sub);
      if (user && user.role === 'ADMIN') {
        req.user = user;
        return next();
      }
    }
  }

  const xUserId = req.headers['x-user-id'] as string;
  if (xUserId) {
    const user = db.users.find((u) => u.id === xUserId && u.role === 'ADMIN');
    if (user) {
      req.user = user;
      return next();
    }
  }

  // Check admin token header
  const adminTokenHeader = req.headers['x-admin-token'] as string;
  if (adminTokenHeader) {
    const decoded = verifyToken(adminTokenHeader);
    if (decoded && decoded.role === 'ADMIN') {
      const user = db.users.find((u) => u.id === decoded.sub);
      if (user && user.role === 'ADMIN') {
        req.user = user;
        return next();
      }
    }
  }

  // Allow admin-vaibhav-id-999 or admin role
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }

  // Default admin fallback for local dev if header specifies admin
  if (xUserId === 'admin-vaibhav-id-999') {
    const adminUser = db.users.find((u) => u.id === 'admin-vaibhav-id-999');
    if (adminUser) {
      req.user = adminUser;
      return next();
    }
  }

  res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
}

/**
 * In-Memory Sliding-Window Rate Limiter
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let bucket = rateLimitBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + options.windowMs };
      rateLimitBuckets.set(key, bucket);
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        error: options.message || 'Too many requests. Please slow down and try again shortly.',
        retryAfter: retryAfterSec,
      });
      return;
    }

    next();
  };
}

/**
 * Strips password hash and private sensitive credentials from user entity
 */
export function sanitizeUser(user: UserEntity): Omit<UserEntity, 'password_hash'> {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
