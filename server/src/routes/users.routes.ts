import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /users — Admin: list all users with pagination & search ──────────────
router.get(
  '/',
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['admin', 'instructor', 'student']),
    query('search').optional().isString().trim(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const page  = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const role  = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const from = (page - 1) * limit;

    const cacheKey = `users:list:${page}:${limit}:${role || 'all'}:${search || ''}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    let q = supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, status, avatar_url, last_login_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (role) q = q.eq('role', role);
    if (search) q = q.ilike('full_name', `%${search}%`);

    const { data, error, count } = await q;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const result = { users: data, total: count, page, limit };
    // Cache for 30s — user list changes frequently
    await cache.set(cacheKey, result, 30);
    res.json(result);
  }
);

// ─── GET /users/:id — Get single user ─────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    // Non-admins can only view themselves
    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const cacheKey = `user:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, full_name, role, status, avatar_url, phone,
        date_of_birth, gender, metadata, last_login_at, created_at,
        instructor_profiles (*),
        student_profiles (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await cache.set(cacheKey, data, 120); // 2 min TTL
    res.json(data);
  }
);

// ─── PATCH /users/:id/status — Admin only: activate/suspend ──────────────────
router.patch(
  '/:id/status',
  authorize('admin'),
  [param('id').isUUID(), body('status').isIn(['active', 'inactive', 'suspended', 'pending'])],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body as { status: string };

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Invalidate user cache
    await cache.del(`user:${id}`);
    await cache.del(`session:${id}`);
    await cache.invalidatePattern('users:list:');

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: req.user!.sub,
      action: 'USER_STATUS_CHANGE',
      resource: 'users',
      resource_id: id,
      new_values: { status },
      ip_address: req.ip,
    });

    res.json({ message: `User status updated to ${status}` });
  }
);

// ─── PATCH /users/:id/avatar — Upload profile photo ──────────────────────────
router.patch(
  '/:id/avatar',
  [param('id').isUUID()],
  validate,
  upload.single('avatar'),
  uploadToSupabase('avatars'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const results = (req as Request & { uploadResults?: { public_url: string }[] }).uploadResults;
    if (!results?.length) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: results[0].public_url })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`user:${id}`);
    res.json({ avatar_url: results[0].public_url });
  }
);

// ─── PATCH /users/:id/instructor-profile ─────────────────────────────────────
router.patch(
  '/:id/instructor-profile',
  [
    param('id').isUUID(),
    body('specialization').optional().isString(),
    body('skills').optional().isArray(),
    body('class_assigned').optional().isString(),
    body('bio').optional().isString(),
    body('years_experience').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { specialization, skills, class_assigned, bio, years_experience } = req.body as Record<string, unknown>;

    const { error } = await supabaseAdmin
      .from('instructor_profiles')
      .upsert({ instructor_id: id, specialization, skills, class_assigned, bio, years_experience }, { onConflict: 'instructor_id' });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`user:${id}`);
    res.json({ message: 'Instructor profile updated' });
  }
);

// ─── PATCH /users/:id/student-profile ────────────────────────────────────────
router.patch(
  '/:id/student-profile',
  [
    param('id').isUUID(),
    body('education_level').optional().isString(),
    body('occupation').optional().isString(),
    body('interests').optional().isArray(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { education_level, occupation, interests } = req.body as Record<string, unknown>;

    const { error } = await supabaseAdmin
      .from('student_profiles')
      .upsert({ student_id: id, education_level, occupation, interests }, { onConflict: 'student_id' });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`user:${id}`);
    res.json({ message: 'Student profile updated' });
  }
);

export default router;
