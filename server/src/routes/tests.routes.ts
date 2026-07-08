import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /tests — List published tests for a cohort ───────────────────────────
router.get(
  '/',
  [query('cohort_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string;
    const role = req.user!.role;
    const cacheKey = `tests:cohort:${cohortId}:${role}`;

    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    let q = supabaseAdmin
      .from('tests')
      .select('id, title, description, duration_mins, max_score, pass_score, start_time, end_time, is_published, shuffle_questions, created_at')
      .eq('cohort_id', cohortId)
      .order('start_time');

    // Students only see published tests; also strip the questions field
    if (role === 'student') {
      q = q.eq('is_published', true);
    }

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 60);
    res.json(data);
  }
);

// ─── GET /tests/:id — Get a single test (with questions for instructor/admin) ─
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const role = req.user!.role;
    const cacheKey = `test:${id}:${role}`;

    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const { data, error } = await supabaseAdmin
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) { res.status(404).json({ error: 'Test not found' }); return; }

    if (role === 'student') {
      // Students cannot see correct answers — strip them from questions
      const sanitized = {
        ...data,
        questions: data.questions ? (data.questions as Array<Record<string, unknown>>).map((q) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { correct_answer, ...rest } = q;
          void correct_answer;
          return rest;
        }) : [],
      };
      await cache.set(cacheKey, sanitized, 120);
      res.json(sanitized);
      return;
    }

    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── POST /tests — Create a test ─────────────────────────────────────────────
router.post(
  '/',
  authorize('admin', 'instructor'),
  [
    body('cohort_id').isUUID(),
    body('title').trim().notEmpty(),
    body('start_time').isISO8601(),
    body('end_time').isISO8601(),
    body('duration_mins').isInt({ min: 1 }),
    body('questions').isArray(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const {
      cohort_id, title, description, duration_mins, max_score, pass_score,
      start_time, end_time, questions, shuffle_questions, course_id,
    } = req.body as Record<string, unknown>;

    const { data, error } = await supabaseAdmin
      .from('tests')
      .insert({
        cohort_id,
        instructor_id: req.user!.sub,
        course_id: course_id || null,
        title,
        description,
        duration_mins,
        max_score: max_score || 100,
        pass_score: pass_score || null,
        start_time,
        end_time,
        questions: questions || [],
        shuffle_questions: shuffle_questions ?? true,
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.invalidatePattern(`tests:cohort:${cohort_id}`);
    res.status(201).json(data);
  }
);

// ─── PATCH /tests/:id/publish ─────────────────────────────────────────────────
router.patch(
  '/:id/publish',
  authorize('admin', 'instructor'),
  [param('id').isUUID(), body('is_published').isBoolean()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_published } = req.body as { is_published: boolean };

    const { data, error } = await supabaseAdmin
      .from('tests')
      .update({ is_published })
      .eq('id', id)
      .select('cohort_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.invalidatePattern(`tests:cohort:${data.cohort_id}`);
    await cache.del(`test:${id}:student`);
    await cache.del(`test:${id}:instructor`);
    await cache.del(`test:${id}:admin`);
    res.json({ message: `Test ${is_published ? 'published' : 'unpublished'}` });
  }
);

// ─── POST /tests/:id/attempt — Start / submit a test attempt ──────────────────
/**
 * Students submit their answers here.
 * Auto-grading for MCQ: answers are checked against correct_answer in the
 * questions JSONB. Essay questions are flagged for manual review.
 *
 * UNIQUE constraint on (test_id, student_id) prevents double attempts.
 */
router.post(
  '/:id/attempt',
  authorize('student'),
  [
    param('id').isUUID(),
    body('answers').isObject(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: testId } = req.params;
    const { answers } = req.body as { answers: Record<string, unknown> };
    const studentId = req.user!.sub;

    // Fetch test with questions (need correct_answer for auto-grading)
    const { data: test, error: testError } = await supabaseAdmin
      .from('tests')
      .select('questions, max_score, start_time, end_time, is_published')
      .eq('id', testId)
      .single();

    if (testError || !test) { res.status(404).json({ error: 'Test not found' }); return; }
    if (!test.is_published) { res.status(403).json({ error: 'Test is not available' }); return; }

    const now = new Date();
    if (now < new Date(test.start_time)) { res.status(403).json({ error: 'Test has not started yet' }); return; }
    if (now > new Date(test.end_time)) { res.status(403).json({ error: 'Test window has closed' }); return; }

    // ── Auto-grade MCQ ─────────────────────────────────────────────────────
    let autoScore = 0;
    const questions = (test.questions as Array<Record<string, unknown>>) || [];
    const mcqQuestions = questions.filter((q) => q.type === 'mcq');

    if (mcqQuestions.length > 0) {
      const perQuestion = (test.max_score as number) / questions.length;
      mcqQuestions.forEach((q) => {
        if (answers[q.id as string] === q.correct_answer) {
          autoScore += perQuestion;
        }
      });
    }

    const hasEssay = questions.some((q) => q.type === 'essay');

    const { data, error } = await supabaseAdmin
      .from('test_attempts')
      .insert({
        test_id: testId,
        student_id: studentId,
        answers,
        score: hasEssay ? null : Math.round(autoScore * 100) / 100,
        submitted_at: new Date().toISOString(),
        graded_at: hasEssay ? null : new Date().toISOString(),
      })
      .select('id, score, submitted_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'You have already submitted this test' });
      } else {
        res.status(500).json({ error: error.message });
      }
      return;
    }

    // Notify student of result (if auto-graded)
    if (!hasEssay) {
      await supabaseAdmin.from('notifications').insert({
        user_id: studentId,
        type: 'test_graded',
        title: 'Test Submitted & Graded',
        body: `Your score: ${data.score} / ${test.max_score}`,
        link: '/student/tests',
      });
    }

    res.status(201).json({
      attempt: data,
      auto_graded: !hasEssay,
      message: hasEssay
        ? 'Submitted. Essay questions will be graded manually.'
        : 'Submitted and auto-graded.',
    });
  }
);

// ─── GET /tests/:id/attempts — Get all attempts (instructor/admin) ────────────
router.get(
  '/:id/attempts',
  authorize('admin', 'instructor'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: testId } = req.params;
    const cacheKey = `test:${testId}:attempts`;

    const data = await cache.remember(cacheKey, 60, async () => {
      const { data, error } = await supabaseAdmin
        .from('test_attempts')
        .select(`
          id, score, submitted_at, graded_at, time_taken_sec,
          users:student_id (id, full_name, email, avatar_url)
        `)
        .eq('test_id', testId)
        .order('submitted_at');
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

// ─── PATCH /tests/:testId/attempts/:attemptId/grade — Manual grade essay ──────
router.patch(
  '/:testId/attempts/:attemptId/grade',
  authorize('admin', 'instructor'),
  [param('attemptId').isUUID(), body('score').isFloat({ min: 0 })],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { attemptId } = req.params;
    const { score } = req.body as { score: number };

    const { data, error } = await supabaseAdmin
      .from('test_attempts')
      .update({ score, graded_at: new Date().toISOString() })
      .eq('id', attemptId)
      .select('student_id, test_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Notify student
    if (data?.student_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: data.student_id,
        type: 'test_graded',
        title: 'Test Graded',
        body: `Your test has been manually graded. Score: ${score}`,
        link: '/student/tests',
      });
    }

    await cache.del(`test:${data.test_id}:attempts`);
    res.json({ message: 'Attempt graded', score });
  }
);

export default router;
