import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';
import logger from '../utils/logger';

const router = Router();

// ─── PUBLIC: GET /programs/active-cohort ─────────────────────────────────────
// IMPORTANT: This route is registered BEFORE router.use(authenticate) so it
// can be called without a JWT — needed by SignUpPage and OnboardingPage which
// run before the user is fully authenticated.
router.get('/active-cohort', async (_req: Request, res: Response): Promise<void> => {
  // Short cache to avoid hammering the DB — busted by /flush-cohort-cache
  const CACHE_KEY = 'cohort:active:status';
  const cached = await cache.get<object>(CACHE_KEY);
  if (cached) {
    res.json(cached);
    return;
  }

  const { data: cohort, error } = await supabaseAdmin
    .from('cohorts')
    .select('id, name, status, start_date, end_date, metadata, registration_open, program_id, programs:program_id (id, name)')
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!cohort) {
    const empty = { activeCohort: null, registrationOpen: false, programs: [] };
    await cache.set(CACHE_KEY, empty, 30);
    res.json(empty);
    return;
  }

  // Determine registration open status.
  // If a registration_close_date is set in metadata, it is the authoritative source.
  // Only fall back to the DB boolean column when no close date is configured.
  const closeDate: string | undefined = cohort.metadata?.registration_close_date;
  let registrationOpen: boolean;
  if (closeDate) {
    // Date-based check takes precedence — compare against current UTC time
    registrationOpen = new Date() < new Date(closeDate);
  } else {
    // Fall back to the DB boolean flag (default true if null/undefined)
    registrationOpen = cohort.registration_open ?? true;
  }

  // Gather programs from metadata or primary program
  const metaPrograms: any[] = cohort.metadata?.programs || [];
  let programs: any[] = metaPrograms;
  if (programs.length === 0 && cohort.programs) {
    programs = [cohort.programs];
  }

  const payload = {
    activeCohort: { id: cohort.id, name: cohort.name, status: cohort.status },
    registrationOpen,
    registrationCloseDate: cohort.metadata?.registration_close_date || null,
    programs,
  };

  await cache.set(CACHE_KEY, payload, 30); // 30-second TTL
  res.json(payload);
});

// ─── PUBLIC: GET /programs/flush-cohort-cache ─────────────────────────────────
// Admin utility to force-invalidate the active cohort status cache.
// Useful after toggling registration_open or changing registration_close_date.
router.get('/flush-cohort-cache', async (_req: Request, res: Response): Promise<void> => {
  await cache.del('cohort:active:status');
  logger.info('Active cohort status cache flushed');
  res.json({ message: 'Active cohort status cache cleared. Fresh data will be fetched on next request.' });
});

// All routes below require a valid JWT
router.use(authenticate);

// ─── GET /programs — List all programs ───────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.query.cohort_id as string | undefined;

  if (cohortId && cohortId !== 'undefined' && cohortId !== 'null') {
    const { data: cohort, error: cohortErr } = await supabaseAdmin
      .from('cohorts')
      .select('program_id, metadata')
      .eq('id', cohortId)
      .single();

    if (cohort && !cohortErr) {
      const programIds: string[] = [];
      if (cohort.program_id) {
        programIds.push(cohort.program_id);
      }
      const metaProgs = cohort.metadata?.programs || [];
      metaProgs.forEach((p: any) => {
        if (p && p.id && !programIds.includes(p.id)) {
          programIds.push(p.id);
        }
      });

      if (programIds.length === 0) {
        res.json([]);
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('programs')
        .select('id, name, description, cover_url, is_active, created_at')
        .in('id', programIds);
      if (error) { res.status(500).json({ error: error.message }); return; }
      res.json(data);
      return;
    } else {
      res.json([]);
      return;
    }
  }

  const data = await cache.remember('programs:all', 300, async () => {
    const { data, error } = await supabaseAdmin
      .from('programs')
      .select('id, name, description, cover_url, is_active, created_at')
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
  upload.single('cover_image'),
  uploadToSupabase('programs'),
  [
    body('name').trim().notEmpty(),
    body('description').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { name, description } = req.body as {
      name: string;
      description?: string;
    };
    
    // parse is_active
    const is_active = req.body.is_active === 'true' || req.body.is_active === true;

    const uploadResults = (req as any).uploadResults;
    const cover_url = uploadResults && uploadResults.length > 0 ? uploadResults[0].public_url : null;

    const { data, error } = await supabaseAdmin
      .from('programs')
      .insert({ 
        name, 
        description, 
        cover_url,
        is_active,
        created_by: req.user!.sub 
      })
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


// ─── GET /programs/all-cohorts — List all cohorts across all programs ──────────
router.get('/all-cohorts', async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('cohorts')
    .select(`
      id, name, status, start_date, end_date, capacity, program_id, metadata,
      programs:program_id (id, name)
    `)
    .order('created_at', { ascending: false });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// ─── GET /programs/courses/all — List all courses ──────────────────
router.get('/courses/all', async (req: Request, res: Response): Promise<void> => {
  const cohortId = req.query.cohort_id as string | undefined;
  const programId = req.query.program_id as string | undefined;
  
  let q = supabaseAdmin
    .from('courses')
    .select(`
      id, title, description, sort_order, is_active, program_id,
      programs:program_id (id, name)
    `)
    .order('sort_order');
    
  if (cohortId && cohortId !== 'undefined' && cohortId !== 'null') {
    // get program_id from cohort
    const { data: cohort, error: cohortErr } = await supabaseAdmin
      .from('cohorts')
      .select('program_id')
      .eq('id', cohortId)
      .single();
      
    if (cohort && !cohortErr) {
      q = q.eq('program_id', cohort.program_id);
    } else {
      res.json([]);
      return;
    }
  } else if (programId && programId !== 'undefined' && programId !== 'null') {
    q = q.eq('program_id', programId);
  }
  
  const { data, error } = await q;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// ─── POST /programs/courses/create — Create a course ────────────────────────────
router.post(
  '/courses/create',
  authorize('admin'),
  [
    body('program_id').isUUID(),
    body('title').trim().notEmpty(),
    body('description').optional().isString(),
    body('sort_order').optional().isInt(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { program_id, title, description, sort_order } = req.body as {
      program_id: string;
      title: string;
      description?: string;
      sort_order?: number;
    };
    
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        program_id,
        title,
        description,
        sort_order: sort_order || 0,
        created_by: req.user!.sub
      })
      .select()
      .single();
      
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  }
);

// ─── GET /programs/:id/cohorts — List cohorts for a program ──────────────────
router.get('/:id/cohorts', [param('id').isUUID()], validate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const data = await cache.remember(`program:${id}:cohorts`, 120, async () => {
    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, status, start_date, end_date, capacity, metadata')
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
    body('capacity').optional().isInt({ min: 1 }),
    body('metadata').optional().isObject(),
    body('status').optional().isIn(['active', 'upcoming', 'completed']),
    body('registration_close_date').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: program_id } = req.params;
    const { name, start_date, end_date, capacity = 30, metadata, status = 'upcoming', registration_close_date } = req.body as {
      name: string;
      start_date: string;
      end_date: string;
      capacity?: number;
      metadata?: any;
      status?: string;
      registration_close_date?: string;
    };

    if (status === 'active') {
      const { data: activeCohorts, error: activeErr } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active');

      if (activeErr) {
        res.status(500).json({ error: activeErr.message });
        return;
      }

      if (activeCohorts && activeCohorts.length > 0) {
        res.status(400).json({ error: 'Another cohort is already active. New cohort status must be upcoming.' });
        return;
      }
    }

    // Merge registration_close_date into metadata
    const finalMetadata = { ...(metadata || {}) };
    if (registration_close_date) {
      finalMetadata.registration_close_date = registration_close_date;
    }

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .insert({ 
        program_id, 
        name, 
        start_date, 
        end_date, 
        capacity, 
        status,
        metadata: finalMetadata 
      })
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

// ─── PATCH /programs/:id/cohorts/:cohortId — Update a cohort ───────────────────
router.patch(
  '/:id/cohorts/:cohortId',
  authorize('admin'),
  [
    param('id').isUUID(),
    param('cohortId').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('status').optional().isIn(['active', 'upcoming', 'completed']),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
    body('capacity').optional().isInt({ min: 1 }),
    body('metadata').optional().isObject(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: program_id, cohortId } = req.params;
    const { name, status, start_date, end_date, capacity, metadata } = req.body;

    if (status === 'active') {
      const { data: activeCohorts, error: activeErr } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active');

      if (activeErr) {
        res.status(500).json({ error: activeErr.message });
        return;
      }

      const otherActive = activeCohorts ? activeCohorts.filter((c: any) => c.id !== cohortId) : [];
      if (otherActive.length > 0) {
        res.status(400).json({ error: 'Another cohort is already active. Only one cohort can be active at a time.' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .update(updateData)
      .eq('id', cohortId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`program:${program_id}:cohorts`);
    res.json(data);
  }
);

// ─── DELETE /programs/:id/cohorts/:cohortId — Delete a cohort ───────────────────
router.delete(
  '/:id/cohorts/:cohortId',
  authorize('admin'),
  [
    param('id').isUUID(),
    param('cohortId').isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: program_id, cohortId } = req.params;
    const { error } = await supabaseAdmin
      .from('cohorts')
      .delete()
      .eq('id', cohortId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`program:${program_id}:cohorts`);
    res.json({ message: 'Cohort deleted successfully' });
  }
);

// ─── POST /programs/cohorts/:cohortId/enroll — Enroll a student ──────────────
router.post(
  '/cohorts/:cohortId/enroll',
  authorize('admin'),
  [param('cohortId').isUUID(), body('student_id').isUUID(), body('program_id').optional().isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const { student_id, program_id } = req.body as { student_id: string; program_id?: string };

    // Check cohort capacity
    const { count: enrolled } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId);

    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select('capacity, status, registration_open, metadata')
      .eq('id', cohortId)
      .single();

    if (!cohort) {
      res.status(404).json({ error: 'Cohort not found' });
      return;
    }

    // Guard: cohort must be active and registration must be open
    if (cohort.status !== 'active') {
      res.status(403).json({ error: 'Cohort is not active' });
      return;
    }

    const cohortCloseDate: string | undefined = cohort.metadata?.registration_close_date;
    let isOpen: boolean;
    if (cohortCloseDate) {
      isOpen = new Date() < new Date(cohortCloseDate);
    } else {
      isOpen = cohort.registration_open ?? true;
    }
    if (!isOpen) {
      res.status(403).json({ error: 'Registration for this cohort is closed' });
      return;
    }

    if (enrolled !== null && enrolled >= cohort.capacity) {
      res.status(409).json({ error: 'Cohort is full' });
      return;
    }

    const insertPayload: any = { student_id, cohort_id: cohortId };
    if (program_id) insertPayload.program_id = program_id;

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert(insertPayload)
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

    await cache.del(`cohort:${cohortId}:students:all`);
    if (program_id) await cache.del(`cohort:${cohortId}:students:${program_id}`);
    res.status(201).json(data);
  }
);


// ─── GET /programs/cohorts/:cohortId/students — List enrolled students ────────
router.get(
  '/cohorts/:cohortId/students',
  authorize('admin', 'instructor'),
  [param('cohortId').isUUID(), query('program_id').optional().isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { cohortId } = req.params;
    const programId = req.query.program_id as string | undefined;

    // If instructor, verify they are assigned to this cohort (and optionally this program)
    const requestingUser = req.user!;
    if (requestingUser.role === 'instructor') {
      const { data: assignment } = await supabaseAdmin
        .from('cohort_instructors')
        .select('cohort_id')
        .eq('cohort_id', cohortId)
        .eq('instructor_id', requestingUser.sub)
        .maybeSingle();

      if (!assignment) {
        res.status(403).json({ error: 'You are not assigned to this cohort' });
        return;
      }
    }

    const cacheKey = `cohort:${cohortId}:students:${programId || 'all'}`;
    const data = await cache.remember(cacheKey, 60, async () => {
      let q = supabaseAdmin
        .from('enrollments')
        .select(`
          id, enrolled_at, progress_pct, completed_at, program_id,
          users:student_id (id, full_name, email, avatar_url, status, phone, date_of_birth, gender),
          programs:program_id (id, name)
        `)
        .eq('cohort_id', cohortId);

      // Filter by program if provided (instructor views their program's students only)
      if (programId) {
        q = q.eq('program_id', programId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data;
    });

    res.json(data);
  }
);

// ─── PATCH /programs/:id — Update a program ───────────────────────────────────
router.patch(
  '/:id',
  authorize('admin'),
  upload.single('cover_image'),
  uploadToSupabase('programs'),
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description } = req.body;

    let is_active: boolean | undefined;
    if (req.body.is_active !== undefined) {
      is_active = req.body.is_active === 'true' || req.body.is_active === true;
    }

    const uploadResults = (req as any).uploadResults;
    const cover_url = uploadResults && uploadResults.length > 0 ? uploadResults[0].public_url : undefined;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (cover_url !== undefined) updateData.cover_url = cover_url;

    const { data, error } = await supabaseAdmin
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del('programs:all');
    res.json(data);
  }
);

// ─── DELETE /programs/:id — Delete a program ───────────────────────────────────
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del('programs:all');
    res.json({ message: 'Program deleted successfully' });
  }
);

// ─── PATCH /programs/courses/:id — Update a course ──────────────────────────────
router.patch(
  '/courses/:id',
  authorize('admin'),
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().isString(),
    body('sort_order').optional().isInt(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description, sort_order } = req.body;

    let is_active: boolean | undefined;
    if (req.body.is_active !== undefined) {
      is_active = req.body.is_active === 'true' || req.body.is_active === true;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  }
);

// ─── DELETE /programs/courses/:id — Delete a course ──────────────────────────────
router.delete(
  '/courses/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ message: 'Course deleted successfully' });
  }
);

// ─── POST /programs/:id/cohorts/:cohortId/instructors — Assign an instructor ───
router.post(
  '/:id/cohorts/:cohortId/instructors',
  authorize('admin'),
  [
    param('id').isUUID(),
    param('cohortId').isUUID(),
    body('instructor_id').isUUID(),
    body('program_id').isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id: program_id, cohortId } = req.params;
    const { instructor_id, program_id: target_program_id } = req.body;

    try {
      // 1. Fetch cohort
      const { data: cohort, error: cohortErr } = await supabaseAdmin
        .from('cohorts')
        .select('*')
        .eq('id', cohortId)
        .single();

      if (cohortErr || !cohort) {
        res.status(404).json({ error: 'Cohort not found' });
        return;
      }

      // 2. Fetch instructor details
      const { data: instructor, error: instErr } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')
        .eq('id', instructor_id)
        .eq('role', 'instructor')
        .single();

      if (instErr || !instructor) {
        res.status(404).json({ error: 'Instructor not found' });
        return;
      }

      // 3. Fetch program details
      const { data: program, error: progErr } = await supabaseAdmin
        .from('programs')
        .select('id, name')
        .eq('id', target_program_id)
        .single();

      if (progErr || !program) {
        res.status(404).json({ error: 'Program not found' });
        return;
      }

      // 4. Update cohort metadata (kept for backwards compatibility / display purposes)
      const currentMeta = cohort.metadata || {};
      const currentAssignments = currentMeta.instructor_assignments || [];
      
      // Avoid duplicate assignments
      const alreadyAssigned = currentAssignments.some(
        (a: any) => a.instructor_id === instructor_id && a.program_id === target_program_id
      );

      if (!alreadyAssigned) {
        currentAssignments.push({
          instructor_id,
          instructor_name: instructor.full_name,
          program_id: target_program_id,
          program_name: program.name,
          assigned_at: new Date().toISOString()
        });
      }

      const updatedMeta = {
        ...currentMeta,
        instructor_assignments: currentAssignments
      };

      const { data: updatedCohort, error: updateCohortErr } = await supabaseAdmin
        .from('cohorts')
        .update({ metadata: updatedMeta })
        .eq('id', cohortId)
        .select()
        .single();

      if (updateCohortErr) {
        res.status(500).json({ error: updateCohortErr.message });
        return;
      }

      // 5. Upsert row in cohort_instructors with the specific program_id.
      //    This is the authoritative relational record for instructor→cohort→program.
      //    After migration_001, the PK is (cohort_id, instructor_id, program_id),
      //    so the same instructor can be assigned to multiple programs in the same cohort.
      const { error: junctionErr } = await supabaseAdmin
        .from('cohort_instructors')
        .upsert(
          { cohort_id: cohortId, instructor_id, program_id: target_program_id },
          { onConflict: 'cohort_id,instructor_id,program_id', ignoreDuplicates: true }
        );

      if (junctionErr) {
        logger.error('Failed to upsert cohort_instructors', { error: junctionErr });
      }

      // 6. Create Notification for the instructor
      const notificationTitle = 'New Program Assignment';
      const notificationBody = `You have been assigned as the instructor for the program "${program.name}" in cohort "${cohort.name}".`;
      
      const { error: notifErr } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: instructor_id,
          type: 'instructor_assigned',
          title: notificationTitle,
          body: notificationBody,
          link: '/instructor/dashboard',
          is_read: false,
          metadata: {
            cohort_id: cohortId,
            cohort_name: cohort.name,
            program_id: target_program_id,
            program_name: program.name
          }
        });

      if (notifErr) {
        logger.error('Failed to create notification for instructor', { error: notifErr });
      } else {
        logger.info('Created assignment notification for instructor', { instructor_id });
      }

      // 7. Mock/Log Email Notification
      logger.info(`[Email Dispatch] Email sent to instructor ${instructor.email} (${instructor.full_name}): "${notificationBody}"`);

      // 8. Delete cache
      await cache.del(`program:${program_id}:cohorts`);
      await cache.del('programs:all');

      res.status(200).json({
        message: 'Instructor assigned successfully',
        cohort: updatedCohort
      });
    } catch (err: any) {
      logger.error('Error assigning instructor', { error: err.message });
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
);

export default router;
