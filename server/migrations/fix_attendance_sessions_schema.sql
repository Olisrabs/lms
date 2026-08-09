-- ============================================================
-- Migration: Fix attendance_sessions schema mismatch (v2)
-- Description:
--   The live database was created from the old tables.sql which used
--   `instructor_id` instead of `opened_by` on attendance_sessions.
--   Two RLS policies reference that column, so we must drop them first
--   before renaming the column, then recreate them.
--
--   This migration is safe to re-run (all statements are idempotent).
-- ============================================================

-- ─── 1. Create attendance_sessions if it doesn't exist ───────────────────────
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id     UUID        NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  cohort_id       UUID        NOT NULL REFERENCES cohorts(id)         ON DELETE CASCADE,
  opened_by       UUID                 REFERENCES users(id)           ON DELETE SET NULL,
  code            VARCHAR(8)  NOT NULL,
  is_open         BOOLEAN     NOT NULL DEFAULT TRUE,
  open_until      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

-- ─── 2. Add opened_by if missing (safe no-op if already present) ─────────────
ALTER TABLE attendance_sessions
  ADD COLUMN IF NOT EXISTS opened_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ─── 3. Rename instructor_id → opened_by (handles the old schema) ────────────
-- The two RLS policies that reference instructor_id must be dropped BEFORE
-- the column can be removed. We drop all four possible policy names, copy
-- data, drop the column, then recreate correct policies in step 4.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'attendance_sessions'
      AND column_name  = 'instructor_id'
  ) THEN
    -- Drop every policy that may reference instructor_id
    DROP POLICY IF EXISTS "Instructors manage attendance sessions" ON attendance_sessions;
    DROP POLICY IF EXISTS "Students can read active open sessions"  ON attendance_sessions;
    DROP POLICY IF EXISTS "Instructors manage their schedules"      ON attendance_sessions;
    DROP POLICY IF EXISTS "Students read open sessions"             ON attendance_sessions;

    -- Copy data before removing column
    UPDATE attendance_sessions
    SET opened_by = instructor_id
    WHERE opened_by IS NULL AND instructor_id IS NOT NULL;

    -- Safe to drop now (no policies reference it)
    ALTER TABLE attendance_sessions DROP COLUMN IF EXISTS instructor_id;
  END IF;
END;
$$;

-- ─── 4. Recreate RLS policies using opened_by ────────────────────────────────
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Instructors manage attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Students can read active open sessions"  ON attendance_sessions;
DROP POLICY IF EXISTS "Students read open sessions"             ON attendance_sessions;

CREATE POLICY "Instructors manage attendance sessions"
  ON attendance_sessions
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    OR
    auth.uid() IN (
      SELECT instructor_id FROM cohort_instructors
      WHERE cohort_id = attendance_sessions.cohort_id
    )
  );

CREATE POLICY "Students read open sessions"
  ON attendance_sessions
  FOR SELECT
  USING (
    is_open = TRUE
    AND auth.uid() IN (
      SELECT student_id FROM enrollments
      WHERE cohort_id = attendance_sessions.cohort_id
    )
  );

-- ─── 5. Extend attendance table with required columns ────────────────────────
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS session_id  UUID     REFERENCES attendance_sessions(id) ON DELETE SET NULL;

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS self_marked BOOLEAN  NOT NULL DEFAULT FALSE;

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS marked_by   UUID     REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS cohort_id   UUID     REFERENCES cohorts(id) ON DELETE CASCADE;

-- ─── 6. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_code     ON attendance_sessions (code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_schedule ON attendance_sessions (schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_cohort   ON attendance_sessions (cohort_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id        ON attendance (session_id);

-- ─── 7. Unique partial index: one open session per schedule at a time ─────────
DROP INDEX IF EXISTS uq_attendance_sessions_schedule_open;
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_sessions_schedule_open
  ON attendance_sessions (schedule_id)
  WHERE (is_open = TRUE);

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- To verify columns after running:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   = 'attendance_sessions'
--   ORDER BY ordinal_position;
