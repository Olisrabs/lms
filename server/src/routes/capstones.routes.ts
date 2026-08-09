import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /capstones — List capstones for a cohort ─────────────────────────────
router.get(
  '/',
  [query('cohort_id').optional().isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string | undefined;
    const role = req.user!.role;
    const userId = req.user!.sub;

    const cacheKey = `capstones:cohort:${cohortId || 'all'}:${role}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    let q = supabaseAdmin
      .from('capstones')
      .select(`
        id, title, description, status, score, feedback, submitted_at, reviewed_at, created_at,
        groups:group_id (id, name),
        users:student_id (id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (cohortId) {
      q = q.eq('cohort_id', cohortId);
    }

    // Students only see their own capstone
    if (role === 'student') {
      q = q.eq('student_id', userId);
    }

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── POST /capstones — Submit a capstone ─────────────────────────────────────
router.post(
  '/',
  upload.array('attachments', 5),
  uploadToSupabase('capstones'),
  [
    body('cohort_id').isUUID(),
    body('title').trim().notEmpty(),
    body('description').optional().isString(),
    body('group_id').optional().isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohort_id, title, description, group_id } = req.body as Record<string, string>;
    const userId = req.user!.sub;
    const results = (req as Request & { uploadResults?: { storage_path: string }[] }).uploadResults || [];

    const { data, error } = await supabaseAdmin
      .from('capstones')
      .insert({
        cohort_id,
        title,
        description,
        group_id: group_id || null,
        student_id: group_id ? null : userId,
        attachments: results.map((r) => r.storage_path),
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.invalidatePattern(`capstones:cohort:${cohort_id}`);
    res.status(201).json(data);
  }
);

// ─── PATCH /capstones/:id/review — Instructor reviews a capstone ──────────────
router.patch(
  '/:id/review',
  authorize('admin', 'instructor'),
  [
    param('id').isUUID(),
    body('status').isIn(['approved', 'rejected', 'reviewing']),
    body('score').optional().isFloat({ min: 0 }),
    body('feedback').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, score, feedback } = req.body as {
      status: 'approved' | 'rejected' | 'reviewing';
      score?: number;
      feedback?: string;
    };

    const { data, error } = await supabaseAdmin
      .from('capstones')
      .update({
        status,
        score: score ?? null,
        feedback,
        reviewed_by: req.user!.sub,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('cohort_id, student_id, group_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Notify relevant parties
    const notifyUsers: string[] = [];

    if (data.student_id) {
      notifyUsers.push(data.student_id);
    } else if (data.group_id) {
      // Fetch all group members to notify
      const { data: members } = await supabaseAdmin
        .from('group_members')
        .select('student_id')
        .eq('group_id', data.group_id);
      members?.forEach((m) => notifyUsers.push(m.student_id));
    }

    if (notifyUsers.length > 0) {
      const notifications = notifyUsers.map((userId) => ({
        user_id: userId,
        type: 'capstone_reviewed',
        title: `Capstone ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: feedback || `Your capstone project has been ${status}.`,
        link: '/student/capstone',
      }));
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    await cache.invalidatePattern(`capstones:cohort:${data.cohort_id}`);
    res.json({ message: `Capstone marked as ${status}` });
  }
);

export default router;
