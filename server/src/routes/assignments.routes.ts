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
  [query('cohort_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const cohortId = req.query.cohort_id as string;
    const role = req.user!.role;
    const cacheKey = `assignments:cohort:${cohortId}:${role}`;

    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    let q = supabaseAdmin
      .from('assignments')
      .select('id, title, description, assignment_type, max_score, due_date, is_published, attachments, created_at')
      .eq('cohort_id', cohortId)
      .order('due_date');

    if (role === 'student') q = q.eq('is_published', true);

    const { data, error } = await q;
    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.set(cacheKey, data, 60);
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
