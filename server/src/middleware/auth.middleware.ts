import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, getCachedUserSession, cacheUserSession } from '../utils/auth';
import { supabaseAdmin } from '../db/supabase';
import type { UserRole, JwtPayload } from '../types/database';
import logger from '../utils/logger';

// ─── Authentication middleware ────────────────────────────────────────────────

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, populates req.user and continues.
 * Uses a two-tier cache (session cache → DB fallback) to avoid DB hits on
 * every request — critical for high-traffic scenarios.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = header.split(' ')[1];


    let payload: JwtPayload;

    try {
      payload = verifyAccessToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid token';
      res.status(401).json({ error: 'Invalid or expired token', detail: message });
      return;
    }

    // 1. Check session cache (L1/L2 — O(1))
    const cached = await getCachedUserSession(payload.sub);
    if (cached) {
      req.user = cached;
      return next();
    }

    // 2. Fallback: fetch from DB and repopulate cache
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, email, role, status')
      .eq('id', payload.sub)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    const sessionData: JwtPayload = {
      sub: user.id,
      auth_id: user.auth_id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as JwtPayload['status'],
    };

    await cacheUserSession(user.id, sessionData);
    req.user = sessionData;
    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err });
    res.status(500).json({ error: 'Authentication error' });
  }
}

// ─── Role-based authorization middleware factory ──────────────────────────────

/**
 * Restricts access to one or more roles.
 * Must be used AFTER `authenticate`.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, authorize('admin'), handler)
 *   router.get('/staff/data', authenticate, authorize('admin', 'instructor'), handler)
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied',
        required: roles,
        yours: req.user.role,
      });
      return;
    }
    next();
  };
}

// ─── Resource ownership check ─────────────────────────────────────────────────

/**
 * Verifies the authenticated user owns the resource, OR is an admin.
 * Used in routes where param :userId must match the logged-in user.
 */
export function requireSelfOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { user } = req;
  const targetId = req.params.userId || req.params.id;

  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (user.role === 'admin' || user.sub === targetId) {
    return next();
  }

  res.status(403).json({ error: 'You can only access your own data' });
}

// ─── Status guard ─────────────────────────────────────────────────────────────

/**
 * Blocks pending/inactive users from accessing protected resources.
 */
export function requireActiveAccount(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (req.user.status !== 'active') {
    res.status(403).json({
      error: 'Account not yet active',
      status: req.user.status,
      message: 'Please wait for your account to be approved.',
    });
    return;
  }
  next();
}
