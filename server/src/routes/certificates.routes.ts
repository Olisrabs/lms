import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /certificates — List all certificates (admin) or by program ──────────
router.get(
  '/',
  authorize('admin', 'instructor'),
  async (req: Request, res: Response): Promise<void> => {
    const cacheKey = 'certificates:all';
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        id, title, description, template_url, issued_at, credential_id, created_at, program_id,
        programs:program_id (id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── GET /certificates/student/:studentId — Student's certificates ─────────────
router.get(
  '/student/:studentId',
  async (req: Request, res: Response): Promise<void> => {
    const { studentId } = req.params;
    const user = req.user!;

    if (user.role === 'student' && user.sub !== studentId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const cacheKey = `certificates:student:${studentId}`;
    const cached = await cache.get(cacheKey);
    if (cached) { res.json(cached); return; }

    // Get student's programs via enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('program_id')
      .eq('student_id', studentId)
      .eq('status', 'active');

    const programIds = (enrollments || []).map((e: any) => e.program_id);

    if (programIds.length === 0) {
      res.json([]);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        id, title, description, template_url, issued_at, credential_id, program_id,
        programs:program_id (id, name)
      `)
      .in('program_id', programIds)
      .order('issued_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }
    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── POST /certificates — Create a certificate (admin only) ──────────────────
router.post(
  '/',
  authorize('admin'),
  upload.single('template'),
  uploadToSupabase('certificates'),
  [
    body('title').trim().notEmpty(),
    body('program_id').isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { title, program_id, description } = req.body as Record<string, string>;
    const results = (req as Request & { uploadResults?: { url: string; storage_path: string }[] }).uploadResults || [];
    const templateUrl = results[0]?.url || null;

    // Generate a unique credential ID
    const credentialId = `CERT-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabaseAdmin
      .from('certificates')
      .insert({
        title,
        program_id,
        description: description || null,
        template_url: templateUrl,
        credential_id: credentialId,
        issued_at: new Date().toISOString(),
        created_by: req.user!.sub,
      })
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del('certificates:all');
    res.status(201).json(data);
  }
);

// ─── DELETE /certificates/:id ─────────────────────────────────────────────────
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('id', id);

    if (error) { res.status(500).json({ error: error.message }); return; }

    await cache.del('certificates:all');
    res.json({ message: 'Certificate deleted' });
  }
);

export default router;
