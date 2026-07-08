import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /grades — Grade book for a cohort ───────────────────────────────────
/**
 * Returns the aggregated grade record for each enrolled student.
 * Uses a JOIN to pull in student info in one query.
 * Cached for 2 minutes — grades change infrequently.
 */
router.get(
  '/',
  authorize('admin', 'instructor'),
  [query('cohort_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string;

    const data = await cache.remember(`grades:cohort:${cohortId}`, 120, async () => {
      const { data, error } = await supabaseAdmin
        .from('grades')
        .select(`
          id, assignment_avg, test_avg, attendance_pct, overall_score, grade_letter, updated_at,
          users:student_id (id, full_name, email, avatar_url)
        `)
        .eq('cohort_id', cohortId)
        .order('overall_score', { ascending: false });
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

// ─── GET /grades/student/:studentId — Student's own grades ───────────────────
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

    const data = await cache.remember(`grades:student:${studentId}`, 120, async () => {
      const { data, error } = await supabaseAdmin
        .from('grades')
        .select(`
          id, assignment_avg, test_avg, attendance_pct, overall_score, grade_letter, updated_at,
          cohorts:cohort_id (id, name, programs:program_id (id, name))
        `)
        .eq('student_id', studentId);
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

// ─── POST /grades/recalculate — Recompute a student's overall grade ───────────
/**
 * Called by the system after grading assignments or tests.
 * Aggregates all submission scores + test scores + attendance into one grade row.
 *
 * Data algorithm: weighted average
 *   overall = (assignment_avg * 0.4) + (test_avg * 0.4) + (attendance_pct * 0.2)
 *
 * Grade letter mapping (standard scale):
 *   A: >= 90, B: >= 80, C: >= 70, D: >= 60, F: < 60
 */
router.post(
  '/recalculate',
  authorize('admin', 'instructor'),
  [
    body('student_id').isUUID(),
    body('cohort_id').isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { student_id, cohort_id } = req.body as { student_id: string; cohort_id: string };

    // 1. Average assignment scores
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('score, assignments!inner(cohort_id, max_score)')
      .eq('student_id', student_id)
      .eq('status', 'graded')
      .not('score', 'is', null);

    let assignmentAvg: number | null = null;
    if (submissions && submissions.length > 0) {
      const pctScores = submissions.map((s) => {
        const assign = s.assignments as unknown as { max_score: number };
        return (s.score! / assign.max_score) * 100;
      });
      assignmentAvg = pctScores.reduce((a, b) => a + b, 0) / pctScores.length;
    }

    // 2. Average test scores
    const { data: attempts } = await supabaseAdmin
      .from('test_attempts')
      .select('score, tests!inner(cohort_id, max_score)')
      .eq('student_id', student_id)
      .not('score', 'is', null);

    let testAvg: number | null = null;
    if (attempts && attempts.length > 0) {
      const pctScores = attempts.map((a) => {
        const t = a.tests as unknown as { max_score: number };
        return (a.score! / t.max_score) * 100;
      });
      testAvg = pctScores.reduce((a, b) => a + b, 0) / pctScores.length;
    }

    // 3. Attendance percentage
    const { data: attendanceData } = await supabaseAdmin
      .from('attendance')
      .select('status, class_schedules!inner(cohort_id)')
      .eq('student_id', student_id);

    let attendancePct: number | null = null;
    if (attendanceData && attendanceData.length > 0) {
      const present = attendanceData.filter((a) =>
        a.status === 'present' || a.status === 'late'
      ).length;
      attendancePct = (present / attendanceData.length) * 100;
    }

    // 4. Weighted overall score
    let overallScore: number | null = null;
    if (assignmentAvg !== null || testAvg !== null || attendancePct !== null) {
      const aScore = assignmentAvg ?? 0;
      const tScore = testAvg ?? 0;
      const attScore = attendancePct ?? 0;
      overallScore = aScore * 0.4 + tScore * 0.4 + attScore * 0.2;
      overallScore = Math.round(overallScore * 100) / 100;
    }

    // 5. Grade letter
    let gradeLetter: string | null = null;
    if (overallScore !== null) {
      if (overallScore >= 90) gradeLetter = 'A';
      else if (overallScore >= 80) gradeLetter = 'B';
      else if (overallScore >= 70) gradeLetter = 'C';
      else if (overallScore >= 60) gradeLetter = 'D';
      else gradeLetter = 'F';
    }

    // 6. Upsert grade record
    const { data, error } = await supabaseAdmin
      .from('grades')
      .upsert({
        student_id,
        cohort_id,
        assignment_avg: assignmentAvg,
        test_avg: testAvg,
        attendance_pct: attendancePct,
        overall_score: overallScore,
        grade_letter: gradeLetter,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,cohort_id' })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Invalidate related caches
    await cache.del(`grades:cohort:${cohort_id}`);
    await cache.del(`grades:student:${student_id}`);

    res.json({ grade: data });
  }
);

export default router;
