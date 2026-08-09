import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a random N-character uppercase alphanumeric code. */
function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit O,0,1,I to avoid confusion
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ─── GET /attendance ─────────────────────────────────────────────────────────
// List attendance records for a session or cohort. Admin + instructor only.
router.get(
  '/',
  authorize('admin', 'instructor'),
  [
    query('schedule_id').optional().isUUID(),
    query('cohort_id').optional().isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const scheduleId = req.query.schedule_id as string | undefined;
    const cohortId = req.query.cohort_id as string | undefined;
    const cacheKey = `attendance:list:${scheduleId || 'none'}:${cohortId || 'none'}`;

    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    let q = supabaseAdmin
      .from('attendance')
      .select(`
        id, status, note, marked_at, self_marked, session_id,
        student:student_id (id, full_name, email, avatar_url),
        class_schedule:schedule_id (id, title, start_time, end_time, cohort_id)
      `);

    if (scheduleId) {
      q = q.eq('schedule_id', scheduleId);
    } else if (cohortId) {
      const { data: schedules } = await supabaseAdmin
        .from('class_schedules')
        .select('id')
        .eq('cohort_id', cohortId);
      const scheduleIds = (schedules || []).map((s: any) => s.id);
      if (scheduleIds.length > 0) {
        q = q.in('schedule_id', scheduleIds);
      } else {
        res.json([]);
        return;
      }
    }

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 30);
    res.json(data);
  }
);

// ─── POST /attendance/bulk ────────────────────────────────────────────────────
// Instructor bulk-marks attendance for all students in a session.
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
      self_marked: false,
      marked_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('attendance')
      .upsert(rows, { onConflict: 'schedule_id,student_id' });

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del(`attendance:schedule:${schedule_id}`);
    await cache.del(`attendance:list:${schedule_id}:none`);
    res.json({ message: `${rows.length} attendance records saved` });
  }
);

// ─── PATCH /attendance/:id ────────────────────────────────────────────────────
// Instructor manually edits a single attendance record (status or note).
router.patch(
  '/:id',
  authorize('admin', 'instructor'),
  [
    param('id').isUUID(),
    body('status').optional().isIn(['present', 'absent', 'late', 'excused']),
    body('note').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, note } = req.body;

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({ status, note, marked_by: req.user!.sub, self_marked: false })
      .eq('id', id)
      .select('schedule_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Bust caches
    await cache.del(`attendance:list:${data.schedule_id}:none`);
    res.json({ message: 'Attendance record updated' });
  }
);

// ─── GET /attendance/student/:studentId ──────────────────────────────────────
// Student or instructor/admin views a student's full attendance history.
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
        id, status, marked_at, self_marked,
        class_schedules:schedule_id (id, title, start_time, end_time, schedule_type)
      `)
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── GET /attendance/stats/:cohortId ─────────────────────────────────────────
// Aggregate attendance stats for a cohort. Cached for 5 minutes.
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

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE SESSIONS — Instructor opens/closes a session window
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /attendance/sessions ────────────────────────────────────────────────
// List sessions for a schedule or cohort.
router.get(
  '/sessions',
  authorize('admin', 'instructor'),
  [
    query('schedule_id').optional().isUUID(),
    query('cohort_id').optional().isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const scheduleId = req.query.schedule_id as string | undefined;
    const cohortId = req.query.cohort_id as string | undefined;

    let q = supabaseAdmin
      .from('attendance_sessions')
      .select(`
        id, code, is_open, open_until, created_at, closed_at,
        schedule:schedule_id (id, title, start_time, end_time),
        cohort:cohort_id (id, name),
        opened_by_user:opened_by (id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (scheduleId) q = q.eq('schedule_id', scheduleId);
    if (cohortId) q = q.eq('cohort_id', cohortId);

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  }
);

// ─── POST /attendance/sessions ───────────────────────────────────────────────
// Instructor opens an attendance session (generates code).
router.post(
  '/sessions',
  authorize('admin', 'instructor'),
  [
    body('schedule_id').isUUID(),
    body('cohort_id').isUUID(),
    body('open_minutes').optional().isInt({ min: 1, max: 180 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { schedule_id, cohort_id, open_minutes } = req.body as {
      schedule_id: string;
      cohort_id: string;
      open_minutes?: number;
    };

    // Close any previously open session for this schedule
    await supabaseAdmin
      .from('attendance_sessions')
      .update({ is_open: false, closed_at: new Date().toISOString() })
      .eq('schedule_id', schedule_id)
      .eq('is_open', true);

    const code = generateCode(6);
    const open_until = open_minutes
      ? new Date(Date.now() + open_minutes * 60_000).toISOString()
      : null;

    const { data: sessionData, error } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        schedule_id,
        cohort_id,
        opened_by: req.user!.sub,
        code,
        is_open: true,
        open_until,
      })
      .select(`
        id, code, is_open, open_until, created_at, schedule_id, cohort_id,
        schedule:schedule_id (id, title, start_time, end_time)
      `)
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Automatically mark all students enrolled in this cohort as absent by default until marked present
    try {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_id')
        .eq('cohort_id', cohort_id);

      if (enrollments && enrollments.length > 0) {
        const absentRows = enrollments.map(e => ({
          schedule_id,
          cohort_id,
          student_id: e.student_id,
          session_id: sessionData.id,
          status: 'absent',
          self_marked: false,
          marked_by: req.user!.sub,
          marked_at: new Date().toISOString(),
        }));

        await supabaseAdmin
          .from('attendance')
          .upsert(absentRows, { onConflict: 'schedule_id,student_id', ignoreDuplicates: true });
      }
    } catch (e) {
      console.error('Failed to auto-mark students absent:', e);
    }

    await cache.invalidatePattern('attendance:*');
    res.status(201).json(sessionData);
  }
);

// ─── PATCH /attendance/sessions/:id/close ────────────────────────────────────
// Instructor manually closes an open session.
router.patch(
  '/sessions/:id/close',
  authorize('admin', 'instructor'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('attendance_sessions')
      .update({ is_open: false, closed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ message: 'Attendance session closed' });
  }
);

// ─── GET /attendance/sessions/active/:scheduleId ────────────────────────────
// Get the currently open session for a schedule (used by student UI to poll).
router.get(
  '/sessions/active/:scheduleId',
  [param('scheduleId').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { scheduleId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id, code, is_open, open_until, schedule_id, cohort_id')
      .eq('schedule_id', scheduleId)
      .eq('is_open', true)
      .maybeSingle();

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data || null);
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT SELF-MARK — Student submits a code to mark themselves present
// ═══════════════════════════════════════════════════════════════════════════════

// ─── POST /attendance/self-mark ──────────────────────────────────────────────
// Student submits an attendance code. System validates session is open,
// student is enrolled in the cohort, and time window hasn't expired.
router.post(
  '/self-mark',
  authorize('student'),
  [body('code').trim().notEmpty().toUpperCase()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const studentId = req.user!.sub;
    const code = (req.body.code as string).toUpperCase().trim();

    // 1. Find the open session matching the code
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('attendance_sessions')
      .select('id, schedule_id, cohort_id, is_open, open_until')
      .eq('code', code)
      .eq('is_open', true)
      .maybeSingle();

    if (sessionErr) { res.status(500).json({ error: sessionErr.message }); return; }
    if (!session) {
      res.status(404).json({ error: 'Invalid or expired attendance code' });
      return;
    }

    // 2. Check time window hasn't expired
    if (session.open_until && new Date(session.open_until) < new Date()) {
      // Auto-close the session
      await supabaseAdmin
        .from('attendance_sessions')
        .update({ is_open: false, closed_at: new Date().toISOString() })
        .eq('id', session.id);
      res.status(400).json({ error: 'Attendance window has closed' });
      return;
    }

    // 3. Verify student is enrolled in the cohort
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('cohort_id', session.cohort_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (!enrollment) {
      res.status(403).json({ error: 'You are not enrolled in this cohort' });
      return;
    }

    // 4. Upsert attendance record as present (won't overwrite an instructor-set record)
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('id, self_marked')
      .eq('schedule_id', session.schedule_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing && !existing.self_marked) {
      // Instructor already marked this student — don't overwrite
      res.json({ message: 'Attendance already recorded by instructor', alreadyMarked: true });
      return;
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('attendance')
      .upsert(
        {
          schedule_id: session.schedule_id,
          student_id: studentId,
          status: 'present',
          self_marked: true,
          session_id: session.id,
          marked_by: studentId,
          marked_at: new Date().toISOString(),
        },
        { onConflict: 'schedule_id,student_id' }
      );

    if (upsertErr) { res.status(500).json({ error: upsertErr.message }); return; }

    // Bust student cache
    await cache.del(`attendance:student:${studentId}`);
    await cache.del(`attendance:list:${session.schedule_id}:none`);

    res.json({ message: 'Attendance marked successfully', status: 'present' });
  }
);

// ─── GET /attendance/today ────────────────────────────────────────────────────
// Student fetches sessions they can mark attendance for.
// Returns all schedules for their cohort that have an OPEN attendance session
// (regardless of scheduled time), PLUS today's schedules even if no session
// is open yet so students can see what's coming.
router.get(
  '/today',
  authorize('student'),
  async (req: Request, res: Response): Promise<void> => {
    const studentId = req.user!.sub;

    // Get enrolled cohort(s)
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('cohort_id')
      .eq('student_id', studentId);

    if (!enrollments || enrollments.length === 0) {
      res.json([]);
      return;
    }

    const cohortIds = enrollments.map((e: any) => e.cohort_id);

    // Broad time window: yesterday 00:00 to tomorrow 23:59 (handles timezone diffs)
    const startWindow = new Date();
    startWindow.setDate(startWindow.getDate() - 1);
    startWindow.setHours(0, 0, 0, 0);
    const endWindow = new Date();
    endWindow.setDate(endWindow.getDate() + 1);
    endWindow.setHours(23, 59, 59, 999);

    // 1. Get schedules in the window for the student's cohorts
    const { data: schedules, error } = await supabaseAdmin
      .from('class_schedules')
      .select(`
        id, title, start_time, end_time, schedule_type,
        cohort:cohort_id (id, name)
      `)
      .in('cohort_id', cohortIds)
      .eq('is_cancelled', false)
      .gte('start_time', startWindow.toISOString())
      .lte('start_time', endWindow.toISOString())
      .order('start_time');

    if (error) { res.status(500).json({ error: error.message }); return; }

    // 2. Also get any schedules that have an OPEN session right now
    //    (covers cases where the schedule's start_time is outside the window
    //     but the instructor opened attendance manually)
    const { data: openSessions } = await supabaseAdmin
      .from('attendance_sessions')
      .select(`
        schedule_id,
        schedule:schedule_id (id, title, start_time, end_time, schedule_type, cohort_id,
          cohort:cohort_id (id, name)
        )
      `)
      .in('cohort_id', cohortIds)
      .eq('is_open', true);

    // Merge open-session schedules that aren't already in the window list
    const seenIds = new Set((schedules || []).map((s: any) => s.id));
    const extraSchedules: any[] = [];
    for (const os of (openSessions || [])) {
      const sched = (os as any).schedule;
      if (sched && !seenIds.has(sched.id)) {
        extraSchedules.push(sched);
        seenIds.add(sched.id);
      }
    }

    const allSchedules = [...(schedules || []), ...extraSchedules];

    // 3. For each schedule, check if an open session exists and if student already marked
    const enriched = await Promise.all(
      allSchedules.map(async (s: any) => {
        const [{ data: openSession }, { data: myRecord }] = await Promise.all([
          supabaseAdmin
            .from('attendance_sessions')
            .select('id, code, open_until')
            .eq('schedule_id', s.id)
            .eq('is_open', true)
            .maybeSingle(),
          supabaseAdmin
            .from('attendance')
            .select('id, status')
            .eq('schedule_id', s.id)
            .eq('student_id', studentId)
            .maybeSingle(),
        ]);

        return {
          ...s,
          session_open: !!openSession,
          already_marked: !!myRecord,
          my_status: myRecord?.status || null,
        };
      })
    );

    // Only show sessions that are open OR are scheduled for today/soon
    // Filter out past schedules that have no open session
    const now = new Date();
    const visible = enriched.filter(s =>
      s.session_open || new Date(s.start_time) >= new Date(now.setHours(0, 0, 0, 0))
    );

    res.json(visible);
  }
);

export default router;
