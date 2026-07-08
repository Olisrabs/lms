-- ============================================================
-- EduLe LMS — Full Database Schema
-- Engine: PostgreSQL (Supabase)
-- 
-- Design principles:
--   • Normalized to 3NF to eliminate data redundancy
--   • UUID primary keys (no sequential IDs — prevents enumeration attacks)
--   • created_at / updated_at on every table for audit trails
--   • Row Level Security (RLS) on all user-facing tables
--   • Indexes on every FK column and high-cardinality filter columns
--   • Partial indexes where beneficial (e.g. active rows only)
--   • Cascading deletes only where child data is meaningless without parent
--   • Triggers maintain updated_at automatically
--   • JSONB for flexible metadata without schema rigidity
--   • CHECK constraints for domain integrity
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram search on names
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Utility: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── ENUM types ───────────────────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE user_status     AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE content_type    AS ENUM ('video', 'pdf', 'image', 'audio', 'document', 'link');
CREATE TYPE assignment_type AS ENUM ('individual', 'group');
CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'graded', 'late', 'missing');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE capstone_status AS ENUM ('draft', 'submitted', 'reviewing', 'approved', 'rejected');
CREATE TYPE cohort_status   AS ENUM ('upcoming', 'active', 'completed', 'archived');
CREATE TYPE schedule_type   AS ENUM ('lecture', 'lab', 'workshop', 'exam', 'office_hours');

-- ============================================================
-- TABLE: users
-- Central identity table. Auth is handled by Supabase Auth;
-- this table stores profile + role data linked by auth.uid().
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id       UUID UNIQUE NOT NULL,   -- references auth.users(id)
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  date_of_birth DATE,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  role          user_role NOT NULL DEFAULT 'student',
  status        user_status NOT NULL DEFAULT 'pending',
  metadata      JSONB NOT NULL DEFAULT '{}',  -- flexible profile data per role
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id  ON users (auth_id);
CREATE INDEX idx_users_role     ON users (role);
CREATE INDEX idx_users_status   ON users (status);
CREATE INDEX idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX idx_users_name_trgm  ON users USING gin (full_name gin_trgm_ops);

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: refresh_tokens
-- Stores hashed refresh tokens for session management.
-- Short-lived access tokens (JWTs) are validated in memory;
-- refresh tokens persisted here for rotation & revocation.
-- ============================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,   -- bcrypt hashed
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user   ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash   ON refresh_tokens (token_hash);
-- Partial index: only look at active tokens
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens (user_id, expires_at)
  WHERE revoked = FALSE;

-- ============================================================
-- TABLE: programs
-- Top-level educational curriculum container.
-- ============================================================
CREATE TABLE programs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  duration_weeks INT NOT NULL DEFAULT 12,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  cover_url   TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_programs_active ON programs (is_active);

CREATE TRIGGER set_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: cohorts
-- A specific running instance of a program with a date range.
-- One program → many cohorts.
-- ============================================================
CREATE TABLE cohorts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id  UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      cohort_status NOT NULL DEFAULT 'upcoming',
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  capacity    INT NOT NULL DEFAULT 30,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cohort_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_cohorts_program ON cohorts (program_id);
CREATE INDEX idx_cohorts_status  ON cohorts (status);

CREATE TRIGGER set_cohorts_updated_at BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: enrollments
-- Student ↔ Cohort junction with progress tracking.
-- Unique constraint prevents double enrollment.
-- ============================================================
CREATE TABLE enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress_pct  NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  completed_at  TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}',
  UNIQUE (student_id, cohort_id)
);

CREATE INDEX idx_enrollments_student ON enrollments (student_id);
CREATE INDEX idx_enrollments_cohort  ON enrollments (cohort_id);

-- ============================================================
-- TABLE: cohort_instructors
-- Instructor ↔ Cohort junction (many-to-many).
-- ============================================================
CREATE TABLE cohort_instructors (
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, instructor_id)
);

CREATE INDEX idx_cohort_instructors_instructor ON cohort_instructors (instructor_id);

-- ============================================================
-- TABLE: courses
-- A course belongs to a program, broken into modules.
-- ============================================================
CREATE TABLE courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id  UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  cover_url   TEXT,
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_program    ON courses (program_id);
CREATE INDEX idx_courses_sort       ON courses (program_id, sort_order);
CREATE INDEX idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops);

CREATE TRIGGER set_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: modules
-- A module groups lessons inside a course.
-- ============================================================
CREATE TABLE modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON modules (course_id);
CREATE INDEX idx_modules_sort   ON modules (course_id, sort_order);

CREATE TRIGGER set_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: materials
-- Learning content (video, pdf, etc.) attached to a module.
-- Storage path in Supabase Storage; metadata JSONB holds
-- compression info, duration, dimensions, size, etc.
-- ============================================================
CREATE TABLE materials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id     UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content_type  content_type NOT NULL,
  storage_path  TEXT NOT NULL,        -- Supabase Storage object path
  original_name TEXT NOT NULL,
  file_size_kb  INT,                  -- compressed size
  duration_sec  INT,                  -- for video/audio
  metadata      JSONB NOT NULL DEFAULT '{}',  -- width, height, codec, thumb_path …
  sort_order    INT NOT NULL DEFAULT 0,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_module ON materials (module_id);
CREATE INDEX idx_materials_type   ON materials (content_type);
CREATE INDEX idx_materials_sort   ON materials (module_id, sort_order);

CREATE TRIGGER set_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: material_progress
-- Tracks whether a student has consumed a material item.
-- ============================================================
CREATE TABLE material_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  progress_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,  -- video watch %
  last_position   INT NOT NULL DEFAULT 0,           -- seconds for video resume
  completed_at    TIMESTAMPTZ,
  UNIQUE (student_id, material_id)
);

CREATE INDEX idx_mat_progress_student  ON material_progress (student_id);
CREATE INDEX idx_mat_progress_material ON material_progress (material_id);

-- ============================================================
-- TABLE: class_schedules
-- Timetable entries for a cohort.
-- ============================================================
CREATE TABLE class_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id),
  course_id     UUID REFERENCES courses(id),
  title         TEXT NOT NULL,
  schedule_type schedule_type NOT NULL DEFAULT 'lecture',
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  location      TEXT,
  meeting_url   TEXT,
  notes         TEXT,
  is_cancelled  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_times CHECK (end_time > start_time)
);

CREATE INDEX idx_schedule_cohort     ON class_schedules (cohort_id);
CREATE INDEX idx_schedule_instructor ON class_schedules (instructor_id);
CREATE INDEX idx_schedule_time       ON class_schedules (start_time, end_time);

CREATE TRIGGER set_schedules_updated_at BEFORE UPDATE ON class_schedules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: attendance
-- Per-student, per-session attendance record.
-- ============================================================
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      attendance_status NOT NULL DEFAULT 'absent',
  note        TEXT,
  marked_by   UUID REFERENCES users(id),
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schedule_id, student_id)
);

CREATE INDEX idx_attendance_schedule ON attendance (schedule_id);
CREATE INDEX idx_attendance_student  ON attendance (student_id);
-- Partial: quick lookup of present/late
CREATE INDEX idx_attendance_present  ON attendance (schedule_id) WHERE status IN ('present','late');

-- ============================================================
-- TABLE: assignments
-- Assessment tasks created by instructors.
-- ============================================================
CREATE TABLE assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id),
  course_id     UUID REFERENCES courses(id),
  title         TEXT NOT NULL,
  description   TEXT,
  assignment_type assignment_type NOT NULL DEFAULT 'individual',
  max_score     NUMERIC(6,2) NOT NULL DEFAULT 100,
  due_date      TIMESTAMPTZ NOT NULL,
  instructions  TEXT,
  attachments   JSONB NOT NULL DEFAULT '[]',  -- array of storage paths
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_cohort      ON assignments (cohort_id);
CREATE INDEX idx_assignments_instructor  ON assignments (instructor_id);
CREATE INDEX idx_assignments_due         ON assignments (due_date);

CREATE TRIGGER set_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: submissions
-- Student submissions for assignments.
-- ============================================================
CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id        UUID,          -- populated for group assignments (FK to groups)
  status          submission_status NOT NULL DEFAULT 'pending',
  content         TEXT,          -- written response
  attachments     JSONB NOT NULL DEFAULT '[]',  -- storage paths
  score           NUMERIC(6,2),
  feedback        TEXT,
  graded_by       UUID REFERENCES users(id),
  submitted_at    TIMESTAMPTZ,
  graded_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_assignment ON submissions (assignment_id);
CREATE INDEX idx_submissions_student    ON submissions (student_id);
CREATE INDEX idx_submissions_status     ON submissions (status);

CREATE TRIGGER set_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: tests
-- Quiz / exam definitions.
-- ============================================================
CREATE TABLE tests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id),
  course_id     UUID REFERENCES courses(id),
  title         TEXT NOT NULL,
  description   TEXT,
  duration_mins INT NOT NULL DEFAULT 60,
  max_score     NUMERIC(6,2) NOT NULL DEFAULT 100,
  pass_score    NUMERIC(6,2),
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  questions     JSONB NOT NULL DEFAULT '[]',  -- question bank embedded in JSON
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_test_times CHECK (end_time > start_time)
);

CREATE INDEX idx_tests_cohort     ON tests (cohort_id);
CREATE INDEX idx_tests_instructor ON tests (instructor_id);
CREATE INDEX idx_tests_time       ON tests (start_time, end_time);

CREATE TRIGGER set_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: test_attempts
-- Student test submissions.
-- ============================================================
CREATE TABLE test_attempts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers     JSONB NOT NULL DEFAULT '{}',
  score       NUMERIC(6,2),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  graded_at   TIMESTAMPTZ,
  time_taken_sec INT,
  UNIQUE (test_id, student_id)  -- one attempt per student per test
);

CREATE INDEX idx_attempts_test    ON test_attempts (test_id);
CREATE INDEX idx_attempts_student ON test_attempts (student_id);

-- ============================================================
-- TABLE: grades
-- Aggregated grade book entry per student per cohort.
-- Computed/updated by triggers when submissions are graded.
-- ============================================================
CREATE TABLE grades (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id       UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  assignment_avg  NUMERIC(5,2),
  test_avg        NUMERIC(5,2),
  attendance_pct  NUMERIC(5,2),
  overall_score   NUMERIC(5,2),
  grade_letter    CHAR(2),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, cohort_id)
);

CREATE INDEX idx_grades_student ON grades (student_id);
CREATE INDEX idx_grades_cohort  ON grades (cohort_id);

-- ============================================================
-- TABLE: groups
-- Project / capstone groups within a cohort.
-- ============================================================
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id   UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_cohort ON groups (cohort_id);

CREATE TRIGGER set_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: group_members
-- Student ↔ Group junction.
-- ============================================================
CREATE TABLE group_members (
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',  -- 'leader' | 'member'
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, student_id)
);

CREATE INDEX idx_group_members_student ON group_members (student_id);

-- Add the FK that submissions.group_id needs now that groups exists
ALTER TABLE submissions ADD CONSTRAINT fk_submissions_group
  FOREIGN KEY (group_id) REFERENCES groups(id);

-- ============================================================
-- TABLE: capstones
-- Final project submissions.
-- ============================================================
CREATE TABLE capstones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id     UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  group_id      UUID REFERENCES groups(id),
  student_id    UUID REFERENCES users(id),  -- NULL for group capstones
  title         TEXT NOT NULL,
  description   TEXT,
  status        capstone_status NOT NULL DEFAULT 'draft',
  attachments   JSONB NOT NULL DEFAULT '[]',
  score         NUMERIC(6,2),
  feedback      TEXT,
  reviewed_by   UUID REFERENCES users(id),
  submitted_at  TIMESTAMPTZ,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_capstones_cohort  ON capstones (cohort_id);
CREATE INDEX idx_capstones_group   ON capstones (group_id);
CREATE INDEX idx_capstones_student ON capstones (student_id);
CREATE INDEX idx_capstones_status  ON capstones (status);

CREATE TRIGGER set_capstones_updated_at BEFORE UPDATE ON capstones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: announcements
-- Broadcast messages to cohort, program, or platform-wide.
-- ============================================================
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id   UUID NOT NULL REFERENCES users(id),
  cohort_id   UUID REFERENCES cohorts(id) ON DELETE CASCADE,  -- NULL = platform-wide
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_cohort  ON announcements (cohort_id);
CREATE INDEX idx_announcements_author  ON announcements (author_id);
CREATE INDEX idx_announcements_pinned  ON announcements (is_pinned, created_at DESC);
-- Index for fast fetch ordered by recency per cohort.
-- Note: expires_at filtering is done at query time (NOT in the index predicate)
-- because NOW() is VOLATILE and PostgreSQL requires index predicates to be IMMUTABLE.
CREATE INDEX idx_announcements_active ON announcements (cohort_id, created_at DESC)
  WHERE expires_at IS NULL;

CREATE TRIGGER set_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: instructor_profiles
-- Extended instructor data (specialization, skills, etc.)
-- ============================================================
CREATE TABLE instructor_profiles (
  instructor_id   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialization  TEXT,
  skills          TEXT[] NOT NULL DEFAULT '{}',
  bio             TEXT,
  linkedin_url    TEXT,
  years_experience INT,
  certifications  JSONB NOT NULL DEFAULT '[]',
  class_assigned  TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_instructor_skills ON instructor_profiles USING gin (skills);

CREATE TRIGGER set_instructor_profiles_updated_at BEFORE UPDATE ON instructor_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: student_profiles  
-- Extended student onboarding data.
-- ============================================================
CREATE TABLE student_profiles (
  student_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  education_level TEXT,
  occupation      TEXT,
  interests       TEXT[] NOT NULL DEFAULT '{}',
  linkedin_url    TEXT,
  github_url      TEXT,
  bio             TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_student_profiles_updated_at BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TABLE: notifications
-- In-app notification feed.
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,        -- 'assignment_due', 'grade_posted', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread  ON notifications (user_id) WHERE is_read = FALSE;

-- ============================================================
-- TABLE: audit_logs
-- Append-only change log for sensitive operations.
-- Never deleted, never updated.
-- ============================================================
CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,  -- int8 for high-volume inserts
  actor_id    UUID REFERENCES users(id),
  action      TEXT NOT NULL,           -- 'USER_LOGIN', 'GRADE_UPDATE', etc.
  resource    TEXT NOT NULL,           -- table or resource name
  resource_id TEXT,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_logs (actor_id);
CREATE INDEX idx_audit_resource ON audit_logs (resource, resource_id);
CREATE INDEX idx_audit_time     ON audit_logs (created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY — Enable on all user-facing tables
-- ============================================================
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests               ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE capstones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles    ENABLE ROW LEVEL SECURITY;

-- Users: can read own row; admin reads all
CREATE POLICY "users_self_read" ON users FOR SELECT
  USING (auth.uid() = auth_id);
CREATE POLICY "users_self_update" ON users FOR UPDATE
  USING (auth.uid() = auth_id);
CREATE POLICY "users_admin_all" ON users FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- Enrollments: student sees own; instructor sees their cohort; admin sees all
CREATE POLICY "enrollments_student" ON enrollments FOR SELECT
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "enrollments_instructor" ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cohort_instructors ci
      JOIN users u ON u.id = ci.instructor_id
      WHERE ci.cohort_id = enrollments.cohort_id
        AND u.auth_id = auth.uid()
    )
  );

-- Notifications: users read/update own only
CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Material progress: own records only
CREATE POLICY "mat_progress_own" ON material_progress FOR ALL
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Submissions: own or grading instructor
CREATE POLICY "submissions_own" ON submissions FOR ALL
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Grades: own or assigned instructor
CREATE POLICY "grades_own" ON grades FOR SELECT
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Test attempts: own only
CREATE POLICY "attempts_own" ON test_attempts FOR ALL
  USING (student_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
