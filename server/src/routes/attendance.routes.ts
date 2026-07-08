import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /attendance — Attendance for a schedule/session ─────────────────────
router.get(
  '/',
  authorize('admin', 'instructor'),
  [query('schedule_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const scheduleId = req.query.schedule_id as string;
    const cacheKey = `attendance:schedule:${scheduleId}`;

    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select(`
        id, status, note, marked_at,
        users:student_id (id, full_name, email, avatar_url)
      `)
      .eq('schedule_id', scheduleId);

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 30);
    res.json(data);
  }
);

// ─── POST /attendance/bulk — Mark attendance for all students in a session ────
/**
 * Bulk upsert pattern:
 * Inserts/updates all attendance records in one DB round-trip.
 * Much faster than N individual INSERTs when marking 30+ students.
 * Time complexity: O(n) for the array processing + single O(n) DB upsert.
 */
router.post(
  '/bulk',
  authorize('admin', 'instructor'),
  [
    body('schedule_id').isUUID(),
    body('records').isArray({ min: 1 }),
    body('records.*.student_id').isUUID(),
    body('records.*.status').isIn(['present', 'absent', 'late', 'excused']),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { schedule_id, records } = req.body as {
      schedule_id: string;
      records: Array<{ student_id: string; status: string; note?: string }>;
    };

    const rows = records.map((r) => ({
      schedule_id,
      student_id: r.student_id,
      status: r.status as 'present' | 'absent' | 'late' | 'excused',
      note: r.note,
      marked_by: req.user!.sub,
      marked_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('attendance')
      .upsert(rows, { onConflict: 'schedule_id,student_id' });

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`attendance:schedule:${schedule_id}`);
    res.json({ message: `${rows.length} attendance records saved` });
  }
);

// ─── GET /attendance/student/:studentId — Student attendance history ──────────
router.get(
  '/student/:studentId',
  [param('studentId').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { studentId } = req.params;
    const user = req.user!;

    if (user.role === 'student' && user.sub !== studentId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const cacheKey = `attendance:student:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select(`
        id, status, marked_at,
        class_schedules:schedule_id (id, title, start_time, end_time, schedule_type)
      `)
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── GET /attendance/stats/:cohortId — Aggregate stats for a cohort ───────────
/**
 * Using a Supabase RPC (stored procedure) for the aggregate query
 * to reduce data transferred over the network and leverage DB-side computation.
 * The stats are cached for 5 minutes as they are expensive to compute.
 */
router.get(
  '/stats/:cohortId',
  authorize('admin', 'instructor'),
  [param('cohortId').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const cacheKey = `attendance:stats:${cohortId}`;

    const data = await cache.remember(cacheKey, 300, async () => {
      const { data, error } = await supabaseAdmin.rpc('get_attendance_stats', {
        p_cohort_id: cohortId,
      });
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

export default router;
