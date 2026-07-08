import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /groups — List groups for a cohort ───────────────────────────────────
router.get(
  '/',
  [query('cohort_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string;

    const data = await cache.remember(`groups:cohort:${cohortId}`, 120, async () => {
      const { data, error } = await supabaseAdmin
        .from('groups')
        .select(`
          id, name, description, metadata, created_at,
          group_members (
            role, joined_at,
            users:student_id (id, full_name, email, avatar_url)
          )
        `)
        .eq('cohort_id', cohortId)
        .order('name');
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

// ─── POST /groups — Create a group ───────────────────────────────────────────
router.post(
  '/',
  authorize('admin', 'instructor'),
  [
    body('cohort_id').isUUID(),
    body('name').trim().notEmpty(),
    body('description').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohort_id, name, description } = req.body as {
      cohort_id: string;
      name: string;
      description?: string;
    };

    const { data, error } = await supabaseAdmin
      .from('groups')
      .insert({ cohort_id, name, description })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`groups:cohort:${cohort_id}`);
    res.status(201).json(data);
  }
);

// ─── POST /groups/:id/members — Add a student to a group ─────────────────────
router.post(
  '/:id/members',
  authorize('admin', 'instructor'),
  [
    param('id').isUUID(),
    body('student_id').isUUID(),
    body('role').optional().isIn(['leader', 'member']),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: groupId } = req.params;
    const { student_id, role = 'member' } = req.body as { student_id: string; role?: string };

    const { error } = await supabaseAdmin
      .from('group_members')
      .insert({ group_id: groupId, student_id, role });

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Student is already in this group' });
      } else {
        res.status(500).json({ error: error.message });
      }
      return;
    }

    // Fetch cohort_id to invalidate group cache
    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('cohort_id')
      .eq('id', groupId)
      .single();

    if (group) await cache.del(`groups:cohort:${group.cohort_id}`);
    res.status(201).json({ message: 'Member added' });
  }
);

// ─── DELETE /groups/:id/members/:studentId — Remove a member ─────────────────
router.delete(
  '/:id/members/:studentId',
  authorize('admin', 'instructor'),
  [param('id').isUUID(), param('studentId').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: groupId, studentId } = req.params;

    const { error } = await supabaseAdmin
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId);

    if (error) { res.status(500).json({ error: error.message }); return; }

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('cohort_id')
      .eq('id', groupId)
      .single();

    if (group) await cache.del(`groups:cohort:${group.cohort_id}`);
    res.json({ message: 'Member removed' });
  }
);

// ─── GET /groups/mine — Student's own groups ──────────────────────────────────
router.get(
  '/mine',
  authorize('student'),
  async (req: Request, res: Response): Promise<void> => {
    const studentId = req.user!.sub;

    const data = await cache.remember(`groups:student:${studentId}`, 120, async () => {
      const { data, error } = await supabaseAdmin
        .from('group_members')
        .select(`
          role, joined_at,
          groups:group_id (
            id, name, description, cohort_id,
            cohorts:cohort_id (id, name),
            group_members (
              role,
              users:student_id (id, full_name, avatar_url)
            )
          )
        `)
        .eq('student_id', studentId);
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

export default router;
