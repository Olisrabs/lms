import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeAllUserTokens,
  hashPassword,
  comparePassword,
} from '../utils/auth';
import { cache } from '../utils/cache';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import type { UserRole } from '../types/database';

const router = Router();

// ─── POST /auth/signup ────────────────────────────────────────────────────────
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('role')
      .isIn(['student', 'instructor'])
      .withMessage('Role must be student or instructor'),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, full_name, role } = req.body as {
      email: string;
      password: string;
      full_name: string;
      role: 'student' | 'instructor';
    };

    // 1. Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation in dev; set false in prod
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        res.status(409).json({ error: 'Email already in use' });
      } else {
        logger.error('Supabase auth createUser failed', { error: authError });
        res.status(500).json({ error: 'Failed to create account' });
      }
      return;
    }

    // 2. Insert profile row into users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        full_name,
        role,
        status: role === 'instructor' ? 'pending' : 'active', // instructors need admin approval
      })
      .select('id, email, full_name, role, status')
      .single();

    if (userError || !user) {
      // Rollback auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({ error: 'Failed to create user profile' });
      return;
    }

    // 3. Create role-specific profile
    if (role === 'instructor') {
      await supabaseAdmin.from('instructor_profiles').insert({ instructor_id: user.id });
    } else {
      await supabaseAdmin.from('student_profiles').insert({ student_id: user.id });
    }

    // 4. Issue tokens
    const tokenPayload = {
      sub: user.id,
      auth_id: authData.user.id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as 'active' | 'pending',
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    await storeRefreshToken(user.id, refreshToken, req.ip, req.headers['user-agent']);

    logger.info('New user registered', { userId: user.id, role });

    res.status(201).json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, status: user.status },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
);

// ─── POST /auth/signup/admin ──────────────────────────────────────────────────
router.post(
  '/signup/admin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 10 }),
    body('full_name').trim().notEmpty(),
    body('admin_key').notEmpty().withMessage('Admin registration key required'),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { admin_key } = req.body as { admin_key: string };

    // Validate secret admin registration key
    if (admin_key !== process.env.ADMIN_REGISTRATION_KEY) {
      res.status(403).json({ error: 'Invalid admin registration key' });
      return;
    }

    const { email, password, full_name } = req.body as {
      email: string;
      password: string;
      full_name: string;
    };

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      res.status(500).json({ error: authError.message });
      return;
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        full_name,
        role: 'admin',
        status: 'active',
      })
      .select('id, email, full_name, role, status')
      .single();

    if (userError || !user) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({ error: 'Failed to create admin profile' });
      return;
    }

    const tokenPayload = {
      sub: user.id,
      auth_id: authData.user.id,
      email: user.email,
      role: 'admin' as UserRole,
      status: 'active' as const,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    await storeRefreshToken(user.id, refreshToken, req.ip, req.headers['user-agent']);

    logger.info('Admin account created', { userId: user.id });
    res.status(201).json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role: 'admin', status: 'active' },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
);

// ─── POST /auth/signin ────────────────────────────────────────────────────────
router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    body('role').isIn(['admin', 'instructor', 'student']),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role: UserRole;
    };

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 2. Fetch profile and verify role
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, email, full_name, role, status, avatar_url')
      .eq('auth_id', authData.user.id)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    // Server-side role verification — prevent role spoofing
    if (user.role !== role) {
      res.status(403).json({ error: `You do not have ${role} access` });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended. Contact admin.' });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({
        error: 'Account pending approval',
        message: 'Your account is under review. You will be notified once approved.',
      });
      return;
    }

    // 3. Update last_login_at
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 4. Issue tokens
    const tokenPayload = {
      sub: user.id,
      auth_id: user.auth_id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as 'active',
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    await storeRefreshToken(user.id, refreshToken, req.ip, req.headers['user-agent']);

    // 5. Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'USER_LOGIN',
      resource: 'users',
      resource_id: user.id,
      ip_address: req.ip,
      new_values: { role },
    });

    logger.info('User signed in', { userId: user.id, role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
);

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body as { refresh_token: string };

  if (!refresh_token) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refresh_token);

    // Rotate: revoke old, detect theft
    try {
      // We store the hash — bcrypt.compare happens inside rotateRefreshToken
      await rotateRefreshToken(payload.sub, refresh_token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'STOLEN_TOKEN_DETECTED') {
        logger.warn('Token theft detected — all tokens revoked', { userId: payload.sub });
        res.status(401).json({ error: 'Security alert: please sign in again' });
      } else {
        res.status(401).json({ error: 'Invalid refresh token' });
      }
      return;
    }

    const newAccessToken = signAccessToken({
      sub: payload.sub,
      auth_id: payload.auth_id,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    });

    const newRefreshToken = signRefreshToken({
      sub: payload.sub,
      auth_id: payload.auth_id,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    });

    await storeRefreshToken(payload.sub, newRefreshToken, req.ip, req.headers['user-agent']);

    res.json({ access_token: newAccessToken, refresh_token: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// ─── POST /auth/signout ───────────────────────────────────────────────────────
router.post('/signout', authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub;
  await revokeAllUserTokens(userId);
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: userId,
    action: 'USER_LOGOUT',
    resource: 'users',
    resource_id: userId,
    ip_address: req.ip,
  });
  res.json({ message: 'Signed out successfully' });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, status, avatar_url, phone, metadata, last_login_at')
    .eq('id', req.user!.sub)
    .single();

  res.json({ user });
});

export default router;
