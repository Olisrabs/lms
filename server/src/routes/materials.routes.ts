import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

// ─── GET /materials — List materials by module ────────────────────────────────
router.get(
  '/',
  [query('module_id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const moduleId = req.query.module_id as string;
    const cacheKey = `materials:module:${moduleId}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    let q = supabaseAdmin
      .from('materials')
      .select('id, title, content_type, file_size_kb, duration_sec, sort_order, is_published, metadata, created_at')
      .eq('module_id', moduleId)
      .order('sort_order');

    // Students only see published materials
    if (req.user!.role === 'student') {
      q = q.eq('is_published', true);
    }

    const { data, error } = await q;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.set(cacheKey, data, 120);
    res.json(data);
  }
);

// ─── POST /materials — Upload a new material ──────────────────────────────────
router.post(
  '/',
  authorize('admin', 'instructor'),
  upload.single('file'),
  uploadToSupabase('materials'),
  [
    body('module_id').isUUID(),
    body('title').trim().notEmpty(),
    body('sort_order').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const results = (req as Request & { uploadResults?: {
      storage_path: string;
      public_url: string;
      file_size_kb: number;
      content_type: string;
      original_name: string;
      metadata: Record<string, unknown>;
    }[] }).uploadResults;

    if (!results?.length) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    const file = results[0];
    const { module_id, title, sort_order } = req.body as {
      module_id: string;
      title: string;
      sort_order?: number;
    };

    const { data, error } = await supabaseAdmin
      .from('materials')
      .insert({
        module_id,
        title,
        content_type: file.content_type as 'video' | 'pdf' | 'image' | 'audio' | 'document',
        storage_path: file.storage_path,
        original_name: file.original_name,
        file_size_kb: file.file_size_kb,
        metadata: file.metadata,
        sort_order: sort_order || 0,
        uploaded_by: req.user!.sub,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Invalidate module materials cache
    await cache.del(`materials:module:${module_id}`);

    res.status(201).json({ material: data, public_url: file.public_url });
  }
);

// ─── PATCH /materials/:id/publish — Toggle published state ───────────────────
router.patch(
  '/:id/publish',
  authorize('admin', 'instructor'),
  [param('id').isUUID(), body('is_published').isBoolean()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { is_published } = req.body as { is_published: boolean };

    const { data, error } = await supabaseAdmin
      .from('materials')
      .update({ is_published })
      .eq('id', id)
      .select('module_id')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`materials:module:${data.module_id}`);
    res.json({ message: `Material ${is_published ? 'published' : 'unpublished'}` });
  }
);

// ─── DELETE /materials/:id ────────────────────────────────────────────────────
router.delete(
  '/:id',
  authorize('admin', 'instructor'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Fetch storage path before deleting
    const { data: mat } = await supabaseAdmin
      .from('materials')
      .select('storage_path, module_id')
      .eq('id', id)
      .single();

    if (!mat) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    // Delete from storage
    await supabaseAdmin.storage.from('lms-materials').remove([mat.storage_path]);

    // Delete DB record (cascades to material_progress)
    const { error } = await supabaseAdmin.from('materials').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`materials:module:${mat.module_id}`);
    res.json({ message: 'Material deleted' });
  }
);

// ─── POST /materials/:id/progress — Track student progress ───────────────────
router.post(
  '/:id/progress',
  authorize('student'),
  [
    param('id').isUUID(),
    body('progress_pct').isFloat({ min: 0, max: 100 }),
    body('last_position').optional().isInt({ min: 0 }),
    body('completed').optional().isBoolean(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: materialId } = req.params;
    const { progress_pct, last_position, completed } = req.body as {
      progress_pct: number;
      last_position?: number;
      completed?: boolean;
    };

    const studentId = req.user!.sub;
    const isCompleted = completed ?? progress_pct >= 95;

    const { error } = await supabaseAdmin
      .from('material_progress')
      .upsert(
        {
          student_id: studentId,
          material_id: materialId,
          progress_pct,
          last_position: last_position || 0,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        },
        { onConflict: 'student_id,material_id' }
      );

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Invalidate student progress cache
    await cache.del(`progress:student:${studentId}`);
    res.json({ message: 'Progress updated', completed: isCompleted });
  }
);

export default router;
