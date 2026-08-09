import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
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
    // Strict RFC-5322-compatible email validation
    body('email')
      .isEmail({ allow_utf8_local_part: false })
      .normalizeEmail()
      .withMessage('Please enter a valid email address'),
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

    // 1. For student signups: verify an active cohort with open registration exists.
    //    We block account creation entirely so no orphaned accounts accumulate.
    if (role === 'student') {
      const { data: activeCohort, error: cohortErr } = await supabaseAdmin
        .from('cohorts')
        .select('id, registration_open, metadata')
        .eq('status', 'active')
        .maybeSingle();

      if (cohortErr) {
        logger.error('Cohort check failed during signup', { error: cohortErr });
        res.status(500).json({ error: 'Unable to verify cohort status. Please try again.' });
        return;
      }

      if (!activeCohort) {
        res.status(403).json({
          error: 'Registration is currently closed. No active cohort is available. Please check back later.',
        });
        return;
      }

      // Check registration_close_date first (authoritative). Fall back to boolean flag.
      const closeDate: string | undefined = activeCohort.metadata?.registration_close_date;
      let isOpen: boolean;
      if (closeDate) {
        isOpen = new Date() < new Date(closeDate);
      } else {
        isOpen = activeCohort.registration_open ?? true;
      }

      if (!isOpen) {
        res.status(403).json({
          error: 'Registration is currently closed. Please check back when the next cohort opens.',
        });
        return;
      }
    }

    // Helper to safely create an auth user or clean up an orphan auth user if public.users was wiped
    const createAuthUserWithCleanup = async () => {
      let result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (result.error) {
        const msg = (result.error.message || '').toLowerCase();
        const isExistsErr =
          result.error.code === 'email_exists' ||
          msg.includes('already registered') ||
          msg.includes('already been registered') ||
          msg.includes('exists');

        if (isExistsErr) {
          // Check if user exists in public.users
          const { data: existingProfile } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          // If no public user profile exists, this is an orphan user in auth.users left after DB cleanup
          if (!existingProfile) {
            logger.info('Cleaning up orphan Supabase Auth user', { email });
            const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
            const orphanUser = usersList?.users?.find(u => u.email === email);
            if (orphanUser) {
              await supabaseAdmin.auth.admin.deleteUser(orphanUser.id);
              // Retry creation
              result = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
              });
            }
          }
        }
      }
      return result;
    };

    const { data: authData, error: authError } = await createAuthUserWithCleanup();

    if (authError || !authData?.user) {
      const msg = (authError?.message || '').toLowerCase();
      if (
        authError?.code === 'email_exists' ||
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('exists')
      ) {
        res.status(409).json({ error: 'Email already in use' });
      } else {
        logger.error('Supabase auth createUser failed', { error: authError });
        res.status(400).json({ error: authError?.message || 'Failed to create account' });
      }
      return;
    }

    // 3. Insert profile row into users table
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
      logger.error('Failed to create user profile in public.users', { error: userError });
      // Rollback auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({ error: `Failed to create user profile: ${userError?.message || 'Database insert failed'}` });
      return;
    }

    // 4. Create role-specific profile
    if (role === 'instructor') {
      await supabaseAdmin.from('instructor_profiles').insert({ instructor_id: user.id });
    } else {
      await supabaseAdmin.from('student_profiles').insert({ student_id: user.id });
    }

    // 5. Issue tokens
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

    // Bust the users list cache so admin pages see the new user immediately
    await cache.invalidatePattern('users:list:');

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

    let authResult = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authResult.error) {
      const msg = (authResult.error.message || '').toLowerCase();
      const isExistsErr =
        authResult.error.code === 'email_exists' ||
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('exists');

      if (isExistsErr) {
        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (!existingProfile) {
          logger.info('Cleaning up orphan Supabase Auth user for admin signup', { email });
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const orphanUser = usersList?.users?.find(u => u.email === email);
          if (orphanUser) {
            await supabaseAdmin.auth.admin.deleteUser(orphanUser.id);
            authResult = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
            });
          }
        }
      }
    }

    const authData = authResult.data;
    const authError = authResult.error;

    if (authError || !authData?.user) {
      res.status(400).json({ error: authError?.message || 'Failed to create admin user' });
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
      logger.error('Failed to create admin profile in public.users', { error: userError });
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({ error: `Failed to create admin profile: ${userError?.message || 'Database insert failed'}` });
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

    // 1. Authenticate with Supabase Auth using a request-scoped client
    const tempClient = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
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
    .select('id, email, full_name, role, status, avatar_url, phone, date_of_birth, gender, metadata, last_login_at')
    .eq('id', req.user!.sub)
    .single();

  res.json({ user });
});

// ─── POST /auth/change-password ──────────────────────────────────────────────
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 10 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authUser = req.user!;
      const { currentPassword, newPassword } = req.body as Record<string, string>;

      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', authUser.sub)
        .single();

      if (!userProfile) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      // Verify current password by signing in with a temp client
      const tempClient = createClient(config.supabase.url, config.supabase.anonKey, {
        auth: { persistSession: false },
      });
      const { error: signInErr } = await tempClient.auth.signInWithPassword({
        email: userProfile.email,
        password: currentPassword,
      });

      if (signInErr) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Update password using admin API
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.auth_id,
        { password: newPassword }
      );

      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }

      res.json({ message: 'Password updated successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
