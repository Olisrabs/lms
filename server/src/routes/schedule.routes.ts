import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /schedule — Get schedule for a cohort ───────────────────────────────
router.get(
  '/',
  [query('cohort_id').optional().isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string | undefined;

    if (!cohortId) {
      const { data, error } = await supabaseAdmin
        .from('class_schedules')
        .select(`
          id, title, schedule_type, start_time, end_time, location, meeting_url, is_cancelled,
          users:instructor_id (id, full_name, avatar_url),
          courses:course_id (id, title)
        `)
        .eq('is_cancelled', false)
        .order('start_time');
      if (error) { res.status(500).json({ error: error.message }); return; }
      res.json(data);
      return;
    }

    const data = await cache.remember(`schedule:cohort:${cohortId}`, 60, async () => {
      const { data, error } = await supabaseAdmin
        .from('class_schedules')
        .select(`
          id, title, schedule_type, start_time, end_time, location, meeting_url, is_cancelled,
          users:instructor_id (id, full_name, avatar_url),
          courses:course_id (id, title)
        `)
        .eq('cohort_id', cohortId)
        .eq('is_cancelled', false)
        .order('start_time');
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

// ─── POST /schedule — Create a class session ─────────────────────────────────
router.post(
  '/',
  authorize('admin', 'instructor'),
  [
    body('cohort_id').isUUID(),
    body('title').trim().notEmpty(),
    body('start_time').isISO8601(),
    body('end_time').isISO8601(),
    body('schedule_type').optional().isIn(['lecture', 'lab', 'workshop', 'exam', 'office_hours']),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohort_id, title, start_time, end_time, schedule_type, location, meeting_url, course_id } = req.body as Record<string, string>;

    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .insert({
        cohort_id,
        instructor_id: req.user!.sub,
        title,
        start_time,
        end_time,
        schedule_type: (schedule_type as 'lecture' | 'lab' | 'workshop' | 'exam' | 'office_hours') || 'lecture',
        location,
        meeting_url,
        course_id: course_id || null,
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Bust both the cohort cache AND the instructor's personal timetable cache
    await Promise.all([
      cache.del(`schedule:cohort:${cohort_id}`),
      cache.del(`schedule:instructor:${req.user!.sub}`),
    ]);
    res.status(201).json(data);
  }
);

// ─── PATCH /schedule/:id/cancel ───────────────────────────────────────────────
router.patch(
  '/:id/cancel',
  authorize('admin', 'instructor'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('class_schedules')
      .update({ is_cancelled: true })
      .eq('id', id)
      .select('cohort_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`schedule:cohort:${data.cohort_id}`);
    res.json({ message: 'Session cancelled' });
  }
);

// ─── GET /schedule/instructor/:id — Instructor's personal timetable ───────────
router.get(
  '/instructor/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const data = await cache.remember(`schedule:instructor:${id}`, 60, async () => {
      const { data, error } = await supabaseAdmin
        .from('class_schedules')
        .select('id, title, schedule_type, start_time, end_time, location, meeting_url, cohorts:cohort_id (id, name)')
        .eq('instructor_id', id)
        .eq('is_cancelled', false)
        .order('start_time');
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

export default router;
