import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /assignments — List assignments for a cohort ─────────────────────────
router.get(
  '/',
  [query('cohort_id').optional().isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string | undefined;
    const role = req.user!.role;
    const userId = req.user!.sub;

    // For students, include their own submission so the UI can show status/grade
    if (role === 'student') {
      let q = supabaseAdmin
        .from('assignments')
        .select(`
          id, title, description, assignment_type, max_score, due_date, is_published, attachments, created_at,
          submissions!inner(id, status, score, feedback, content, submitted_at, graded_at)
        `)
        .eq('is_published', true)
        .eq('submissions.student_id', userId);

      if (cohortId) q = q.eq('cohort_id', cohortId);

      // Also fetch assignments that have NO submission yet (left join workaround)
      let qAll = supabaseAdmin
        .from('assignments')
        .select(`
          id, title, description, assignment_type, max_score, due_date, is_published, attachments, created_at
        `)
        .eq('is_published', true)
        .order('due_date');

      if (cohortId) qAll = qAll.eq('cohort_id', cohortId);

      const [{ data: submitted, error: e1 }, { data: all, error: e2 }] = await Promise.all([q, qAll]);
      if (e1 || e2) { res.status(500).json({ error: (e1 || e2)?.message }); return; }

      // Merge: enrich all assignments with the student's own submission if any
      const submissionMap = new Map<string, any>();
      for (const a of (submitted || [])) {
        if ((a as any).submissions?.length) {
          submissionMap.set(a.id, (a as any).submissions[0]);
        }
      }

      const enriched = (all || []).map((a: any) => ({
        ...a,
        submissions: submissionMap.has(a.id) ? [submissionMap.get(a.id)] : [],
      }));

      res.json(enriched);
      return;
    }

    // Instructors / admins — simple list
    const cacheKey = `assignments:cohort:${cohortId || 'all'}:${role}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    let q = supabaseAdmin
      .from('assignments')
      .select('id, title, description, assignment_type, max_score, due_date, is_published, attachments, created_at')
      .order('due_date');

    if (cohortId) q = q.eq('cohort_id', cohortId);

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 60);
    res.json(data);
  }
);

// ─── GET /assignments/submissions — List student submissions for instructor ───
router.get(
  '/submissions',
  authorize('admin', 'instructor'),
  async (req: Request, res: Response): Promise<void> => {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        id, assignment_id, student_id, content, attachments, status, score, feedback, submitted_at, graded_at,
        student:student_id (id, full_name, email, avatar_url),
        assignment:assignment_id (id, title, max_score, due_date, cohort_id)
      `)
      .order('submitted_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  }
);


// ─── POST /assignments — Create assignment ────────────────────────────────────
router.post(
  '/',
  authorize('admin', 'instructor'),
  upload.array('attachments', 5),
  uploadToSupabase('assignments'),
  [
    body('cohort_id').isUUID(),
    body('title').trim().notEmpty(),
    body('due_date').isISO8601(),
    body('max_score').optional().isFloat({ min: 0 }),
    body('assignment_type').optional().isIn(['individual', 'group']),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohort_id, title, description, due_date, max_score, assignment_type, instructions } = req.body as Record<string, string>;
    const results = (req as Request & { uploadResults?: { storage_path: string }[] }).uploadResults || [];
    const attachmentPaths = results.map((r) => r.storage_path);

    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({
        cohort_id,
        instructor_id: req.user!.sub,
        title,
        description,
        due_date,
        max_score: parseFloat(max_score) || 100,
        assignment_type: (assignment_type as 'individual' | 'group') || 'individual',
        instructions,
        attachments: attachmentPaths,
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.invalidatePattern(`assignments:cohort:${cohort_id}`);
    res.status(201).json(data);
  }
);

// ─── POST /assignments/:id/submit — Student submits assignment ────────────────
router.post(
  '/:id/submit',
  authorize('student'),
  upload.array('attachments', 5),
  uploadToSupabase('submissions'),
  [
    param('id').isUUID(),
    body('content').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: assignmentId } = req.params;
    const { content } = req.body as { content?: string };
    const studentId = req.user!.sub;
    const results = (req as Request & { uploadResults?: { storage_path: string }[] }).uploadResults || [];

    // Check due date
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('due_date, is_published')
      .eq('id', assignmentId)
      .single();

    if (!assignment || !assignment.is_published) {
      res.status(404).json({ error: 'Assignment not found or not published' });
      return;
    }

    const isLate = new Date() > new Date(assignment.due_date);

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id: studentId,
        content,
        attachments: results.map((r) => r.storage_path),
        status: isLate ? 'late' : 'submitted',
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    res.status(201).json({ submission: data, late: isLate });
  }
);

// ─── PATCH /assignments/:id/grade — Grade a submission ───────────────────────
router.patch(
  '/:assignmentId/submissions/:submissionId/grade',
  authorize('admin', 'instructor'),
  [
    param('submissionId').isUUID(),
    body('score').isFloat({ min: 0 }),
    body('feedback').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { submissionId } = req.params;
    const { score, feedback } = req.body as { score: number; feedback?: string };

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({
        score,
        feedback,
        status: 'graded',
        graded_by: req.user!.sub,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select('student_id, assignment_id')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Notify student via notifications table
    if (data?.student_id) {
      await supabaseAdmin.from('notifications').insert({
        user_id: data.student_id,
        type: 'grade_posted',
        title: 'Assignment Graded',
        body: `Your assignment has been graded. Score: ${score}`,
        link: `/student/assignments`,
      });
    }

    res.json({ message: 'Submission graded', score });
  }
);

export default router;
