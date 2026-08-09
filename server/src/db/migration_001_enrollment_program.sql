-- ── 1. Add program_id to enrollments ─────────────────────────
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Index so we can quickly find all students in a cohort for a specific program
CREATE INDEX IF NOT EXISTS idx_enrollments_program
  ON enrollments (cohort_id, program_id);

-- ── 2. Add registration_open to cohorts ──────────────────────
-- Allows the admin to explicitly close/open registration
-- independently of cohort status.
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT TRUE;

-- Index for fast active+open lookup
CREATE INDEX IF NOT EXISTS idx_cohorts_registration
  ON cohorts (status, registration_open);

-- ── 3. Add assigned_program_id to cohort_instructors ─────────
-- Tracks which program an instructor was assigned to within a cohort.
-- This replaces the fragile JSONB metadata approach.
ALTER TABLE cohort_instructors
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Remove old duplicate unique constraint if it exists (cohort_id, instructor_id)
-- and replace with one that allows the same instructor for different programs.
-- Drop the old PK first, re-add as a composite that includes program_id.
ALTER TABLE cohort_instructors DROP CONSTRAINT IF EXISTS cohort_instructors_pkey;

-- New PK: one row per instructor per cohort per program
ALTER TABLE cohort_instructors
  ADD PRIMARY KEY (cohort_id, instructor_id, program_id);

-- ── 4. Backfill: set registration_open based on existing metadata ──
-- For any cohort that already had a registration_close_date in metadata,
-- mark it closed if the date has passed.
UPDATE cohorts
SET registration_open = FALSE
WHERE
  status = 'active'
  AND metadata->>'registration_close_date' IS NOT NULL
  AND (metadata->>'registration_close_date')::TIMESTAMPTZ < NOW();

-- ── 5. Student profiles: add cohort_id for quick lookup ──────
-- Stores the cohort the student completed onboarding for.
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_profiles_cohort
  ON student_profiles (cohort_id);

CREATE INDEX IF NOT EXISTS idx_student_profiles_program
  ON student_profiles (program_id);
