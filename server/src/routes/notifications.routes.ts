import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /notifications — User's notification feed ────────────────────────────
/**
 * Uses a partial index on (user_id) WHERE is_read = FALSE for the unread count.
 * Main feed uses the composite index (user_id, is_read, created_at DESC).
 * Limited to 50 per request to avoid large payloads.
 */
router.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    // Notifications are user-specific — short TTL (10s) to balance freshness
    const cacheKey = `notifications:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, type, title, body, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) { res.status(500).json({ error: error.message }); return; }

    const unreadCount = data?.filter((n) => !n.is_read).length ?? 0;
    const result = { notifications: data, unread_count: unreadCount };

    await cache.set(cacheKey, result, 10);
    res.json(result);
  }
);

// ─── PATCH /notifications/:id/read — Mark one as read ────────────────────────
router.patch(
  '/:id/read',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user!.sub); // RLS: only own notifications

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`notifications:${req.user!.sub}`);
    res.json({ message: 'Marked as read' });
  }
);

// ─── PATCH /notifications/read-all — Mark all as read ────────────────────────
router.patch(
  '/read-all',
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.sub;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`notifications:${userId}`);
    res.json({ message: 'All notifications marked as read' });
  }
);

// ─── DELETE /notifications/:id — Delete one notification ─────────────────────
router.delete(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.sub);

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`notifications:${req.user!.sub}`);
    res.json({ message: 'Notification deleted' });
  }
);

export default router;
