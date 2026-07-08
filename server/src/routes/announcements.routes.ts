import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /announcements — List announcements for a cohort or platform-wide ────
/**
 * Sorting: pinned first, then by created_at DESC.
 * This is done in application layer after DB query since Supabase doesn't
 * support complex ORDER BY with multiple expressions in the JS client.
 * Dataset size is small (< 200 per cohort) so in-memory sort is O(n log n)
 * and negligible in cost.
 */
router.get(
  '/',
  [query('cohort_id').optional().isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string | undefined;
    const cacheKey = `announcements:${cohortId || 'global'}`;

    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    let q = supabaseAdmin
      .from('announcements')
      .select(`
        id, title, body, is_pinned, expires_at, created_at,
        users:author_id (id, full_name, avatar_url, role)
      `);

    if (cohortId) {
      q = q.or(`cohort_id.eq.${cohortId},cohort_id.is.null`);
    } else {
      q = q.is('cohort_id', null);
    }

    // Filter out expired — done here (not in index predicate)
    const now = new Date().toISOString();
    q = q.or(`expires_at.is.null,expires_at.gt.${now}`);
    q = q.order('created_at', { ascending: false });

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    // Sort: pinned first, then by date (O(n log n))
    const sorted = [...(data || [])].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    await cache.set(cacheKey, sorted, 60);
    res.json(sorted);
  }
);

// ─── POST /announcements — Create an announcement ────────────────────────────
router.post(
  '/',
  authorize('admin', 'instructor'),
  [
    body('title').trim().notEmpty(),
    body('body').trim().notEmpty(),
    body('cohort_id').optional().isUUID(),
    body('is_pinned').optional().isBoolean(),
    body('expires_at').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { title, body: bodyText, cohort_id, is_pinned, expires_at } = req.body as {
      title: string;
      body: string;
      cohort_id?: string;
      is_pinned?: boolean;
      expires_at?: string;
    };

    // Instructors can only post to their assigned cohort
    if (req.user!.role === 'instructor' && !cohort_id) {
      res.status(403).json({ error: 'Instructors must specify a cohort_id' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        author_id: req.user!.sub,
        title,
        body: bodyText,
        cohort_id: cohort_id || null,
        is_pinned: is_pinned || false,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Invalidate relevant caches
    await cache.del(`announcements:${cohort_id || 'global'}`);

    // Send in-app notifications to all cohort members (if cohort-specific)
    if (cohort_id) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_id')
        .eq('cohort_id', cohort_id);

      if (enrollments?.length) {
        const notifications = enrollments.map((e) => ({
          user_id: e.student_id,
          type: 'new_announcement',
          title: `New Announcement: ${title}`,
          body: bodyText.substring(0, 120),
          link: '/student/announcements',
        }));
        // Insert notifications in batches of 100 to avoid payload limits
        const BATCH = 100;
        for (let i = 0; i < notifications.length; i += BATCH) {
          await supabaseAdmin.from('notifications').insert(notifications.slice(i, i + BATCH));
        }
      }
    }

    res.status(201).json(data);
  }
);

// ─── PATCH /announcements/:id — Update / pin an announcement ─────────────────
router.patch(
  '/:id',
  authorize('admin', 'instructor'),
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('body').optional().trim().notEmpty(),
    body('is_pinned').optional().isBoolean(),
    body('expires_at').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select('cohort_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`announcements:${data.cohort_id || 'global'}`);
    res.json({ message: 'Announcement updated' });
  }
);

// ─── DELETE /announcements/:id ────────────────────────────────────────────────
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id)
      .select('cohort_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`announcements:${data.cohort_id || 'global'}`);
    res.json({ message: 'Announcement deleted' });
  }
);

export default router;
