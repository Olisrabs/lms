-- ============================================================
-- Migration: Add missing columns to instructor_profiles
-- Description:
--   The live instructor_profiles table was created from the old
--   tables.sql which was missing several columns that the backend
--   code and admin UI now depend on:
--     • skills          — TEXT array of skill tags
--     • class_assigned  — the class/cohort label the instructor manages
--     • years_experience — renamed from years_of_experience
--     • certifications  — JSONB array of cert objects
--     • metadata        — JSONB bag for future flexible data
--
--   Run this against your Supabase SQL editor (or via psql) once.
--   All statements use IF NOT EXISTS / DO blocks so re-running is safe.
-- ============================================================

-- ─── 1. skills ───────────────────────────────────────────────────────────────
-- Stores comma-derived skill tags as a Postgres text array.
-- GIN index enables fast array-containment queries (@>, &&).
ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_instructor_skills
  ON instructor_profiles USING gin (skills);

-- ─── 2. class_assigned ───────────────────────────────────────────────────────
-- Human-readable label of the class / cohort the instructor is managing.
ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS class_assigned TEXT;

-- ─── 3. years_experience ─────────────────────────────────────────────────────
-- The old column was named years_of_experience; the backend uses years_experience.
-- We add the correctly-named column and (if the old one exists) copy its data over.
ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Copy existing data from old column if it is present (safe no-op if missing)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'instructor_profiles'
      AND column_name  = 'years_of_experience'
  ) THEN
    UPDATE instructor_profiles
    SET years_experience = years_of_experience
    WHERE years_of_experience IS NOT NULL
      AND years_experience IS NULL;
  END IF;
END;
$$;

-- ─── 4. certifications ───────────────────────────────────────────────────────
-- JSONB array of certification objects, e.g.:
--   [{ "name": "AWS Solutions Architect", "issued_by": "Amazon", "year": 2023 }]
ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS certifications JSONB NOT NULL DEFAULT '[]';

-- ─── 5. metadata ─────────────────────────────────────────────────────────────
-- Flexible JSONB bag for future extensibility without further migrations.
ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- Verify the final column list:
--   SELECT column_name, data_type, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   = 'instructor_profiles'
--   ORDER BY ordinal_position;
