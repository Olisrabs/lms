-- ============================================================
-- Migration: Attendance Sessions for Student Self-Check-In
-- Description:
--   Adds an `attendance_sessions` table that instructors use
--   to open/close an attendance window and generate a one-time
--   code. Also extends the `attendance` table with columns that
--   record whether the record was self-marked by a student and
--   which session it belongs to.
-- ============================================================

-- ─── 1. attendance_sessions ──────────────────────────────────────────────────
-- One row per class session opened by an instructor.
-- Instructors open the session → system generates a 6-char code →
-- students use the code within the time window to mark themselves.

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id     UUID        NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  cohort_id       UUID        NOT NULL REFERENCES cohorts(id)         ON DELETE CASCADE,
  opened_by       UUID        NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
  code            VARCHAR(8)  NOT NULL,          -- 6-char uppercase alphanumeric
  is_open         BOOLEAN     NOT NULL DEFAULT TRUE,
  open_until      TIMESTAMPTZ,                   -- NULL = instructor closes manually
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ
);

-- One open session per schedule at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_sessions_schedule_open
  ON attendance_sessions (schedule_id)
  WHERE (is_open = TRUE);

-- Fast lookup when student submits a code
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_code ON attendance_sessions (code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_schedule ON attendance_sessions (schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_cohort ON attendance_sessions (cohort_id);

-- ─── 2. Extend `attendance` table ───────────────────────────────────────────
-- Track whether the record was created by the student themselves
-- (self-mark via code) vs. by the instructor (bulk mark).

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS session_id        UUID    REFERENCES attendance_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS self_marked       BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance (session_id);

-- ─── 3. Row Level Security ──────────────────────────────────────────────────
-- (Supabase admin client bypasses RLS server-side, so these are a
--  belt-and-braces policy for any direct client queries.)

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Instructors/admins can manage sessions for their cohorts.
CREATE POLICY "Instructors manage attendance sessions"
  ON attendance_sessions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM cohort_instructors WHERE cohort_id = attendance_sessions.cohort_id
      UNION
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Students can read open sessions (to verify code).
CREATE POLICY "Students read open sessions"
  ON attendance_sessions
  FOR SELECT
  USING (
    is_open = TRUE AND
    auth.uid() IN (
      SELECT student_id FROM enrollments WHERE cohort_id = attendance_sessions.cohort_id
    )
  );

-- ─── Done ────────────────────────────────────────────────────────────────────
