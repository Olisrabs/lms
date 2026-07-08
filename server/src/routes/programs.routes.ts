import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /programs — List all programs ───────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const data = await cache.remember('programs:all', 300, async () => {
    const { data, error } = await supabaseAdmin
      .from('programs')
      .select('id, name, description, duration_weeks, cover_url, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });
  res.json(data);
});

// ─── POST /programs — Create a program ───────────────────────────────────────
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('description').optional().isString(),
    body('duration_weeks').isInt({ min: 1 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { name, description, duration_weeks } = req.body as {
      name: string;
      description?: string;
      duration_weeks: number;
    };

    const { data, error } = await supabaseAdmin
      .from('programs')
      .insert({ name, description, duration_weeks, created_by: req.user!.sub })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del('programs:all');
    res.status(201).json(data);
  }
);

// ─── GET /programs/:id/cohorts — List cohorts for a program ──────────────────
router.get('/:id/cohorts', [param('id').isUUID()], validate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const data = await cache.remember(`program:${id}:cohorts`, 120, async () => {
    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, status, start_date, end_date, capacity')
      .eq('program_id', id)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data;
  });

  res.json(data);
});

// ─── POST /programs/:id/cohorts — Create a cohort ────────────────────────────
router.post(
  '/:id/cohorts',
  authorize('admin'),
  [
    param('id').isUUID(),
    body('name').trim().notEmpty(),
    body('start_date').isISO8601(),
    body('end_date').isISO8601(),
    body('capacity').isInt({ min: 1 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: program_id } = req.params;
    const { name, start_date, end_date, capacity } = req.body as {
      name: string;
      start_date: string;
      end_date: string;
      capacity: number;
    };

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .insert({ program_id, name, start_date, end_date, capacity })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`program:${program_id}:cohorts`);
    res.status(201).json(data);
  }
);

// ─── POST /programs/cohorts/:cohortId/enroll — Enroll a student ──────────────
router.post(
  '/cohorts/:cohortId/enroll',
  authorize('admin'),
  [param('cohortId').isUUID(), body('student_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { student_id } = req.body as { student_id: string };

    // Check cohort capacity
    const { count: enrolled } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId);

    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select('capacity')
      .eq('id', cohortId)
      .single();

    if (cohort && enrolled !== null && enrolled >= cohort.capacity) {
      res.status(409).json({ error: 'Cohort is full' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({ student_id, cohort_id: cohortId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Student already enrolled in this cohort' });
      } else {
        res.status(500).json({ error: error.message });
      }
      return;
    }

    await cache.del(`cohort:${cohortId}:students`);
    res.status(201).json(data);
  }
);

// ─── GET /programs/cohorts/:cohortId/students — List enrolled students ────────
router.get(
  '/cohorts/:cohortId/students',
  authorize('admin', 'instructor'),
  [param('cohortId').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;

    const data = await cache.remember(`cohort:${cohortId}:students`, 60, async () => {
      const { data, error } = await supabaseAdmin
        .from('enrollments')
        .select(`
          id, enrolled_at, progress_pct, completed_at,
          users:student_id (id, full_name, email, avatar_url, status)
        `)
        .eq('cohort_id', cohortId);
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

export default router;
