import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import type { JwtPayload, UserRole, UserStatus } from '../types/database';

// ─── Token generation ─────────────────────────────────────────────────────────

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Refresh token persistence ────────────────────────────────────────────────

/**
 * Persist a refresh token hash in DB.
 * Uses SHA-256 hash so it is queryable while avoiding raw token storage.
 */
export async function storeRefreshToken(
  userId: string,
  rawToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const hash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await supabaseAdmin
    .from('refresh_tokens')
    .insert({
      user_id: userId,
      token_hash: hash,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    });
}

/**
 * Rotate refresh tokens: revoke old, store new.
 * This implements the sliding-window "token rotation" pattern.
 * If a revoked token is reused → revoke ALL user tokens (token theft detection).
 */
export async function rotateRefreshToken(
  userId: string,
  oldTokenRaw: string
): Promise<void> {
  const hash = hashToken(oldTokenRaw);
  const { data } = await supabaseAdmin
    .from('refresh_tokens')
    .select('id, revoked')
    .eq('token_hash', hash)
    .single();

  if (!data) throw new Error('Refresh token not found');

  if (data.revoked) {
    // Token was already revoked → possible theft → revoke ALL tokens for this user
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked: true })
      .eq('user_id', userId);
    throw new Error('STOLEN_TOKEN_DETECTED');
  }

  // Revoke the used token
  await supabaseAdmin
    .from('refresh_tokens')
    .update({ revoked: true })
    .eq('id', data.id);
}

/**
 * Revoke all refresh tokens for a user (logout-all-devices).
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await supabaseAdmin
    .from('refresh_tokens')
    .update({ revoked: true })
    .eq('user_id', userId);

  // Invalidate cached sessions
  await cache.invalidatePattern(`session:${userId}`);
}

// ─── Password utilities ───────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcrypt.rounds);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Session cache helper ─────────────────────────────────────────────────────

/**
 * Cache the full user profile for fast auth middleware lookups.
 * TTL: 5 minutes — balance freshness vs DB load.
 */
export async function cacheUserSession(userId: string, data: JwtPayload): Promise<void> {
  await cache.set(`session:${userId}`, data, 300);
}

export async function getCachedUserSession(userId: string): Promise<JwtPayload | null> {
  return cache.get<JwtPayload>(`session:${userId}`);
}
