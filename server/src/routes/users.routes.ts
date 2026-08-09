import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { supabaseAdmin } from '../db/supabase';
import { cache } from '../utils/cache';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { upload, uploadToSupabase } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── GET /users — Admin: list all users with pagination & search ──────────────
router.get(
  '/',
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['admin', 'instructor', 'student']),
    query('search').optional().isString().trim(),
    query('cohort_id').optional().isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const page  = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const role  = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const cohortId = req.query.cohort_id as string | undefined;
    const from = (page - 1) * limit;

    const cacheKey = `users:list:${page}:${limit}:${role || 'all'}:${search || ''}:${cohortId || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    let targetIds: string[] | null = null;
    if (cohortId) {
      if (role === 'student') {
        const { data: enrollments } = await supabaseAdmin
          .from('enrollments')
          .select('student_id')
          .eq('cohort_id', cohortId);
        targetIds = (enrollments || []).map((e: any) => e.student_id);
      } else if (role === 'instructor') {
        const { data: instructors } = await supabaseAdmin
          .from('cohort_instructors')
          .select('instructor_id')
          .eq('cohort_id', cohortId);
        targetIds = (instructors || []).map((i: any) => i.instructor_id);
      }
    }

    // When listing instructors specifically, also pull in their profile data
    const selectFields = role === 'instructor'
      ? 'id, email, full_name, role, status, avatar_url, last_login_at, created_at, instructor_profiles(specialization, skills, class_assigned)'
      : 'id, email, full_name, role, status, avatar_url, last_login_at, created_at';

    let q = supabaseAdmin
      .from('users')
      .select(selectFields, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (role) q = q.eq('role', role);
    if (search) q = q.ilike('full_name', `%${search}%`);
    
    if (cohortId) {
      if (targetIds && targetIds.length > 0) {
        q = q.in('id', targetIds);
      } else {
        q = q.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    const { data, error, count } = await q;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const result = { users: data, total: count, page, limit };
    await cache.set(cacheKey, result, 10);
    res.json(result);
  }
);

// ─── GET /users/flush-cache — Admin: bust all user list caches ────────────────
router.get(
  '/flush-cache',
  authorize('admin'),
  async (_req: Request, res: Response): Promise<void> => {
    await cache.invalidatePattern('users:list:');
    res.json({ message: 'Users list cache cleared' });
  }
);

// ─── GET /users/admin/dashboard-stats ──────────────────────────────────────────
router.get(
  '/admin/dashboard-stats',
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const cohortId = req.query.cohort_id as string | undefined;

      // 1. Total students (always count all students regardless of cohort)
      const { count: totalStudentsCount, error: errStud } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      if (errStud) throw errStud;
      res.locals.totalStudents = totalStudentsCount || 0;

      // 2. Total instructors
      let instructorQuery = supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor');

      if (cohortId) {
        // Count instructors assigned to this cohort
        const { count, error: errInst } = await supabaseAdmin
          .from('cohort_instructors')
          .select('*', { count: 'exact', head: true })
          .eq('cohort_id', cohortId);
        if (errInst) throw errInst;
        res.locals.totalInstructors = count || 0;
      } else {
        const { count, error: errInst } = await instructorQuery;
        if (errInst) throw errInst;
        res.locals.totalInstructors = count || 0;
      }

      // 3. Active cohorts
      let activeCohortsQuery = supabaseAdmin
        .from('cohorts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (cohortId) {
        // Check if the selected cohort is active
        const { count, error: errCoh } = await supabaseAdmin
          .from('cohorts')
          .select('*', { count: 'exact', head: true })
          .eq('id', cohortId)
          .eq('status', 'active');
        if (errCoh) throw errCoh;
        res.locals.activeCohorts = count || 0;
      } else {
        const { count, error: errCoh } = await activeCohortsQuery;
        if (errCoh) throw errCoh;
        res.locals.activeCohorts = count || 0;
      }

      // 4. Upcoming classes (start_time > now)
      let upcomingClassesQuery = supabaseAdmin
        .from('class_schedules')
        .select('*', { count: 'exact', head: true })
        .gt('start_time', new Date().toISOString())
        .eq('is_cancelled', false);

      if (cohortId) {
        upcomingClassesQuery = upcomingClassesQuery.eq('cohort_id', cohortId);
      }
      const { count: upcomingClasses, error: errClass } = await upcomingClassesQuery;
      if (errClass) throw errClass;

      // 5. Pending reviews (capstones with status draft, submitted or reviewing)
      let pendingReviewsQuery = supabaseAdmin
        .from('capstones')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'reviewing']);

      if (cohortId) {
        pendingReviewsQuery = pendingReviewsQuery.eq('cohort_id', cohortId);
      }
      const { count: pendingReviews, error: errCap } = await pendingReviewsQuery;
      if (errCap) throw errCap;

      // 6. Active capstones (total capstones count)
      let activeCapstonesQuery = supabaseAdmin
        .from('capstones')
        .select('*', { count: 'exact', head: true });

      if (cohortId) {
        activeCapstonesQuery = activeCapstonesQuery.eq('cohort_id', cohortId);
      }
      const { count: activeCapstones, error: errCapAll } = await activeCapstonesQuery;
      if (errCapAll) throw errCapAll;

      // 7. Get upcoming classes details
      let upcomingListQuery = supabaseAdmin
        .from('class_schedules')
        .select(`
          id, title, start_time, schedule_type,
          cohorts:cohort_id (id, name)
        `)
        .gt('start_time', new Date().toISOString())
        .eq('is_cancelled', false)
        .order('start_time')
        .limit(3);

      if (cohortId) {
        upcomingListQuery = upcomingListQuery.eq('cohort_id', cohortId);
      }
      const { data: upcomingList, error: errList } = await upcomingListQuery;
      if (errList) throw errList;

      // 8. Activities from audit_logs
      let rawActivitiesQuery = supabaseAdmin
        .from('audit_logs')
        .select(`
          id, action, resource, created_at,
          users:actor_id (id, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (cohortId) {
        // Filter activities by actors associated with this cohort
        const { data: studentEnrollments } = await supabaseAdmin
          .from('enrollments')
          .select('student_id')
          .eq('cohort_id', cohortId);
        
        const { data: cohortInstructors } = await supabaseAdmin
          .from('cohort_instructors')
          .select('instructor_id')
          .eq('cohort_id', cohortId);

        const actorIds = [
          ...(studentEnrollments || []).map((s: any) => s.student_id),
          ...(cohortInstructors || []).map((i: any) => i.instructor_id)
        ];

        if (actorIds.length > 0) {
          rawActivitiesQuery = rawActivitiesQuery.in('actor_id', actorIds);
        } else {
          // If cohort has no students or instructors, force empty result
          rawActivitiesQuery = rawActivitiesQuery.eq('actor_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data: rawActivities, error: errAct } = await rawActivitiesQuery;
      if (errAct) throw errAct;

      const formattedActivities = (rawActivities || []).map((act: any) => {
        let type = 'system';
        if (act.action.includes('SUBMIT')) type = 'assignment';
        else if (act.action.includes('REGISTER') || act.action.includes('SIGNUP') || act.action.includes('ENROLL')) type = 'student';
        else if (act.action.includes('GRADE')) type = 'grade';
        else if (act.action.includes('CREATE')) type = 'creation';

        return {
          title: act.action.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
          desc: `${act.users?.full_name || 'Someone'} performed ${act.action.toLowerCase()} on ${act.resource}`,
          time: new Date(act.created_at).toLocaleTimeString() + ' (' + new Date(act.created_at).toLocaleDateString() + ')',
          type
        };
      });

      res.json({
        totalStudents: res.locals.totalStudents,
        totalInstructors: res.locals.totalInstructors,
        activeCohorts: res.locals.activeCohorts,
        upcomingClasses: upcomingClasses || 0,
        pendingReviews: pendingReviews || 0,
        activeCapstones: activeCapstones || 0,
        upcomingClassesList: upcomingList || [],
        activities: formattedActivities
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ─── GET /users/student/enrollment — Student's active cohort enrollment ──────────
router.get(
  '/student/enrollment',
  authorize('student', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user!.sub;
      const { data, error } = await supabaseAdmin
        .from('enrollments')
        .select(`
          id, enrolled_at, status, program_id,
          cohort_id,
          cohorts:cohort_id (id, name, status, program_id),
          programs:program_id (id, name)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) { res.status(500).json({ error: error.message }); return; }
      if (!data) { res.json(null); return; }

      // If programs join is null (program_id on enrollments might be null),
      // resolve via the cohort's own program_id
      let programObj = (data as any).programs;
      const cohortObj = (data as any).cohorts as any;
      if (!programObj && cohortObj?.program_id) {
        const { data: prog } = await supabaseAdmin
          .from('programs')
          .select('id, name')
          .eq('id', cohortObj.program_id)
          .single();
        programObj = prog || null;
      }

      res.json({ ...data, programs: programObj });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ─── GET /users/instructor/assignments — List instructor's assigned cohorts/programs ──
router.get(
  '/instructor/assignments',
  authorize('instructor', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const instructorId = req.user!.sub;
      const { data, error } = await supabaseAdmin
        .from('cohort_instructors')
        .select(`
          cohort_id,
          program_id,
          cohorts:cohort_id (id, name, status, program_id),
          programs:program_id (id, name)
        `)
        .eq('instructor_id', instructorId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      // For each assignment, if program_id on cohort_instructors is null,
      // fall back to the cohort's own program_id to resolve the program name.
      const rows = data || [];
      const enriched: any[] = [];

      for (const row of rows) {
        const cohortObj = row.cohorts as any;
        let programObj = row.programs as any;

        // If the program join is null (program_id was not set on cohort_instructors),
        // look it up via the cohort's program_id
        if (!programObj && cohortObj?.program_id) {
          const { data: prog } = await supabaseAdmin
            .from('programs')
            .select('id, name')
            .eq('id', cohortObj.program_id)
            .single();
          programObj = prog || null;
        }

        enriched.push({
          ...row,
          // Ensure program_id is populated for callers
          program_id: row.program_id || cohortObj?.program_id || null,
          programs: programObj,
        });
      }

      // Sort: active cohorts first so callers can use [0] safely
      enriched.sort((a, b) => {
        const aActive = (a.cohorts as any)?.status === 'active' ? 0 : 1;
        const bActive = (b.cohorts as any)?.status === 'active' ? 0 : 1;
        return aActive - bActive;
      });

      res.json(enriched);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ─── GET /users/:id — Get single user ─────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    // Non-admins can only view themselves
    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const cacheKey = `user:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, full_name, role, status, avatar_url, phone,
        date_of_birth, gender, metadata, last_login_at, created_at,
        instructor_profiles (*),
        student_profiles (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await cache.set(cacheKey, data, 120); // 2 min TTL
    res.json(data);
  }
);

// ─── PATCH /users/:id/status — Admin only: activate/suspend ──────────────────
router.patch(
  '/:id/status',
  authorize('admin'),
  [param('id').isUUID(), body('status').isIn(['active', 'inactive', 'suspended', 'pending'])],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body as { status: string };

    const { error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Invalidate user cache
    await cache.del(`user:${id}`);
    await cache.del(`session:${id}`);
    await cache.invalidatePattern('users:list:');

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: req.user!.sub,
      action: 'USER_STATUS_CHANGE',
      resource: 'users',
      resource_id: id,
      new_values: { status },
      ip_address: req.ip,
    });

    res.json({ message: `User status updated to ${status}` });
  }
);

// ─── PATCH /users/:id/avatar — Upload profile photo ──────────────────────────
router.patch(
  '/:id/avatar',
  [param('id').isUUID()],
  validate,
  upload.single('avatar'),
  uploadToSupabase('avatars'),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const results = (req as Request & { uploadResults?: { public_url: string }[] }).uploadResults;
    if (!results?.length) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ avatar_url: results[0].public_url })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`user:${id}`);
    res.json({ avatar_url: results[0].public_url });
  }
);

// ─── PATCH /users/:id/instructor-profile ─────────────────────────────────────
router.patch(
  '/:id/instructor-profile',
  [
    param('id').isUUID(),
    body('specialization').optional().isString(),
    body('skills').optional().isArray(),
    body('class_assigned').optional().isString(),
    body('bio').optional().isString(),
    body('years_experience').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { specialization, skills, class_assigned, bio, years_experience } = req.body as Record<string, unknown>;

    const { error } = await supabaseAdmin
      .from('instructor_profiles')
      .upsert({ instructor_id: id, specialization, skills, class_assigned, bio, years_experience }, { onConflict: 'instructor_id' });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`user:${id}`);
    res.json({ message: 'Instructor profile updated' });
  }
);

// ─── PATCH /users/:id/student-profile ────────────────────────────────────────
router.patch(
  '/:id/student-profile',
  [
    param('id').isUUID(),
    body('education_level').optional().isString(),
    body('occupation').optional().isString(),
    body('interests').optional().isArray(),
    body('phone').optional().isString(),
    body('dob').optional().isString(),
    body('gender').optional().isString(),
    body('cohort_id').optional().isUUID(),
    body('program_id').optional().isUUID(),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = req.user!;

    if (user.role !== 'admin' && user.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { education_level, occupation, interests, phone, dob, gender, cohort_id, program_id } = req.body as Record<string, unknown>;

    // Build student_profiles upsert payload
    const profilePayload: Record<string, unknown> = { student_id: id, education_level, occupation, interests };
    if (cohort_id !== undefined) profilePayload.cohort_id = cohort_id;
    if (program_id !== undefined) profilePayload.program_id = program_id;

    const { error } = await supabaseAdmin
      .from('student_profiles')
      .upsert(profilePayload, { onConflict: 'student_id' });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Update fields in users table
    const userUpdates: Record<string, any> = {};
    if (phone !== undefined) userUpdates.phone = phone;
    if (dob !== undefined) userUpdates.date_of_birth = dob;
    if (gender !== undefined) userUpdates.gender = gender;

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', id);
      if (userError) {
        res.status(500).json({ error: userError.message });
        return;
      }
    }

    // Auto-enroll student in the cohort when a cohort_id is provided.
    // This replaces the separate admin-only enroll endpoint call from the frontend.
    // Uses upsert so it's idempotent (safe to call multiple times).
    if (cohort_id && typeof cohort_id === 'string') {
      const enrollPayload: Record<string, any> = { student_id: id, cohort_id };
      if (program_id && typeof program_id === 'string') enrollPayload.program_id = program_id;

      const { error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .upsert(enrollPayload, { onConflict: 'student_id,cohort_id', ignoreDuplicates: true });

      if (enrollError && enrollError.code !== '23505') {
        // Log but don't fail the request — profile data is already saved
        console.warn('Auto-enrollment warning:', enrollError.message);
      } else {
        // Bust the cohort students cache so admin list reflects the new enrolment
        await cache.del(`cohort:${cohort_id}:students:all`);
        if (program_id) await cache.del(`cohort:${cohort_id}:students:${program_id}`);
      }
    }

    await cache.del(`user:${id}`);
    res.json({ message: 'Student profile updated' });
  }
);


// ─── PATCH /users/:id — Update general user details ─────────────────────────
router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('full_name').optional().isString().trim(),
    body('phone').optional().isString().trim(),
    body('date_of_birth').optional().isString(),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const authUser = req.user!;

    if (authUser.role !== 'admin' && authUser.sub !== id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { full_name, phone, date_of_birth, gender } = req.body as Record<string, any>;
    const updates: Record<string, any> = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
    if (gender !== undefined) updates.gender = gender;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await cache.del(`user:${id}`);
    await cache.del(`session:${id}`);
    await cache.invalidatePattern('users:list:');

    res.json({ message: 'Profile updated successfully' });
  }
);

// ─── DELETE /users/:id — Admin: delete user from DB and Supabase Auth ─────────
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // 1. Fetch user to get their auth_id
    const { data: targetUser, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('auth_id, email')
      .eq('id', id)
      .single();

    if (fetchErr || !targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 2. Delete role-specific profiles first to satisfy foreign keys
    await supabaseAdmin.from('instructor_profiles').delete().eq('instructor_id', id);
    await supabaseAdmin.from('student_profiles').delete().eq('student_id', id);
    await supabaseAdmin.from('cohort_instructors').delete().eq('instructor_id', id);
    await supabaseAdmin.from('enrollments').delete().eq('student_id', id);

    // 3. Delete from public users table
    const { error: dbErr } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (dbErr) {
      res.status(500).json({ error: dbErr.message });
      return;
    }

    // 4. Delete from Supabase Auth if auth_id exists
    if (targetUser.auth_id) {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(targetUser.auth_id);
      if (authErr) {
        console.error(`Failed to delete auth user for ${targetUser.email}:`, authErr.message);
      }
    }

    await cache.del(`user:${id}`);
    await cache.del(`session:${id}`);
    await cache.invalidatePattern('users:list:');

    res.json({ message: 'User account deleted successfully' });
  }
);

export default router;
