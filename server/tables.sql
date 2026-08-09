-- ============================================================================
-- LMS Complete Database Schema (tables.sql)
-- Comprehensive production database definition incorporating all system requirements:
-- Includes all 26 tables, views, relations, constraints, indexes, triggers,
-- RLS security policies, and explicit Supabase role GRANT permissions.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- DROP EXISTING VIEWS & TABLES (Reverse Dependency Order)
-- ============================================================================
DROP VIEW IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS student_performance CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS capstones CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS material_progress CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS cohort_instructors CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS instructor_profiles CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS & CORE AUTH
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    metadata JSONB DEFAULT '{}',
    password_hash TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE instructor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialization TEXT,
    skills TEXT[] DEFAULT '{}',
    phone TEXT,
    office_hours TEXT,
    years_of_experience INTEGER,
    years_experience INTEGER,
    linkedin_url TEXT,
    github_url TEXT,
    certifications JSONB DEFAULT '[]',
    class_assigned TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ACADEMIC STRUCTURE (Programs, Cohorts, Courses & Modules)
-- ============================================================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    duration_weeks INTEGER DEFAULT 12,
    image_url TEXT,
    cover_url TEXT,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
    max_students INTEGER DEFAULT 50,
    capacity INTEGER DEFAULT 50,
    registration_open BOOLEAN DEFAULT TRUE,
    registration_close_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    phone TEXT,
    emergency_contact TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    nationality TEXT,
    state_of_origin TEXT,
    education_level TEXT,
    occupation TEXT,
    interests TEXT[] DEFAULT '{}',
    cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'suspended')),
    progress_pct NUMERIC(5,2) DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    completion_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    CONSTRAINT unique_student_cohort UNIQUE (student_id, cohort_id)
);

CREATE TABLE cohort_instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_instructor_cohort_program UNIQUE (cohort_id, instructor_id, program_id)
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    cover_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CLASS SCHEDULING & ATTENDANCE
-- ============================================================================

CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    schedule_type TEXT DEFAULT 'lecture' CHECK (schedule_type IN ('lecture', 'lab', 'workshop', 'exam', 'office_hours')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    meeting_url TEXT,
    notes TEXT,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    open_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    self_marked BOOLEAN DEFAULT FALSE,
    note TEXT,
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_schedule_student UNIQUE (schedule_id, student_id)
);

-- ============================================================================
-- 4. COURSE MATERIALS, ASSIGNMENTS & SUBMISSIONS
-- ============================================================================

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type TEXT,
    content_type TEXT,
    storage_path TEXT,
    original_name TEXT,
    file_size_kb INTEGER,
    duration_sec INTEGER,
    metadata JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE material_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    progress_pct NUMERIC(5,2) DEFAULT 0,
    last_position INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_student_material UNIQUE (student_id, material_id)
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_points NUMERIC DEFAULT 100,
    max_score NUMERIC DEFAULT 100,
    assignment_type TEXT DEFAULT 'individual' CHECK (assignment_type IN ('individual', 'group')),
    attachment_url TEXT,
    attachments JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID,
    submission_url TEXT,
    content TEXT,
    attachments JSONB DEFAULT '[]',
    status TEXT DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'graded', 'resubmit', 'late', 'missing')),
    score NUMERIC,
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    grader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- Backwards-compatibility View for queries targeting assignment_submissions
CREATE OR REPLACE VIEW assignment_submissions AS 
SELECT * FROM submissions;

-- ============================================================================
-- 5. TESTS & QUIZZES
-- ============================================================================

CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB DEFAULT '[]',
    duration_mins INTEGER DEFAULT 60,
    max_score NUMERIC DEFAULT 100,
    pass_score NUMERIC,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT FALSE,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '{}',
    score NUMERIC,
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    time_taken_sec INTEGER,
    CONSTRAINT unique_test_student UNIQUE (test_id, student_id)
);

-- ============================================================================
-- 6. CAPSTONES, GROUPS & ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE capstones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_url TEXT,
    repo_url TEXT,
    attachments JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected')),
    score NUMERIC,
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    feedback TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE submissions ADD CONSTRAINT fk_submissions_group
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_group_student UNIQUE (group_id, student_id)
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    body TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CERTIFICATES
-- ============================================================================

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    template_url TEXT,
    credential_id TEXT UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. PERFORMANCE, GRADES & AUDIT LOGS
-- ============================================================================

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    assignment_avg NUMERIC DEFAULT 0,
    test_avg NUMERIC DEFAULT 0,
    attendance_pct NUMERIC DEFAULT 0,
    overall_score NUMERIC DEFAULT 0,
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_grade_student_cohort UNIQUE (student_id, cohort_id)
);

CREATE TABLE student_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    overall_score NUMERIC DEFAULT 0,
    assignment_score NUMERIC DEFAULT 0,
    test_score NUMERIC DEFAULT 0,
    attendance_score NUMERIC DEFAULT 0,
    capstone_score NUMERIC DEFAULT 0,
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    is_eligible_for_graduation BOOLEAN DEFAULT FALSE,
    graduation_status TEXT DEFAULT 'pending' CHECK (graduation_status IN ('pending', 'graduated', 'failed', 'deferred')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_performance_student_cohort UNIQUE (student_id, cohort_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT NOT NULL,
    body TEXT,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT,
    resource_id TEXT,
    target_table TEXT,
    target_id UUID,
    old_data JSONB,
    new_data JSONB,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_cohort ON enrollments(cohort_id);
CREATE INDEX idx_enrollments_program ON enrollments(program_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

CREATE INDEX idx_cohort_instructors_instructor ON cohort_instructors(instructor_id);
CREATE INDEX idx_cohort_instructors_cohort ON cohort_instructors(cohort_id);

CREATE INDEX idx_schedules_cohort ON class_schedules(cohort_id);
CREATE INDEX idx_schedules_instructor ON class_schedules(instructor_id);
CREATE INDEX idx_schedules_start_time ON class_schedules(start_time);

CREATE INDEX idx_attendance_sessions_schedule ON attendance_sessions(schedule_id);
CREATE INDEX idx_attendance_sessions_code ON attendance_sessions(code);
CREATE INDEX idx_attendance_sessions_cohort ON attendance_sessions(cohort_id);
CREATE INDEX idx_attendance_schedule ON attendance(schedule_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);

CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_materials_module ON materials(module_id);
CREATE INDEX idx_materials_cohort ON materials(cohort_id);

CREATE INDEX idx_assignments_cohort ON assignments(cohort_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE INDEX idx_tests_cohort ON tests(cohort_id);
CREATE INDEX idx_tests_published ON tests(is_published);
CREATE INDEX idx_test_attempts_student ON test_attempts(student_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);

CREATE INDEX idx_capstones_cohort ON capstones(cohort_id);
CREATE INDEX idx_capstones_student ON capstones(student_id);
CREATE INDEX idx_capstones_status ON capstones(status);

CREATE INDEX idx_groups_cohort ON groups(cohort_id);
CREATE INDEX idx_group_members_student ON group_members(student_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);

CREATE INDEX idx_grades_cohort_student ON grades(cohort_id, student_id);
CREATE INDEX idx_grades_program ON grades(program_id);
CREATE INDEX idx_grades_overall_score ON grades(overall_score);

CREATE INDEX idx_student_performance_student ON student_performance(student_id);
CREATE INDEX idx_student_performance_cohort ON student_performance(cohort_id);
CREATE INDEX idx_student_performance_program ON student_performance(program_id);
CREATE INDEX idx_student_performance_graduation ON student_performance(graduation_status);

CREATE INDEX idx_certificates_program ON certificates(program_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(target_table);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Allow public select on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow service_role full access on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Schedules RLS policies
CREATE POLICY "Schedules viewable by all authenticated"
  ON class_schedules FOR SELECT USING (true);

CREATE POLICY "Instructors manage their schedules"
  ON class_schedules FOR ALL
  USING (auth.uid() = instructor_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Attendance Sessions RLS policies
CREATE POLICY "Students can read active open sessions"
  ON attendance_sessions FOR SELECT
  USING (is_open = true OR auth.uid() = instructor_id);

CREATE POLICY "Instructors manage attendance sessions"
  ON attendance_sessions FOR ALL
  USING (auth.uid() = instructor_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Attendance RLS policies
CREATE POLICY "Students read own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('instructor', 'admin')
  ));

CREATE POLICY "Students insert own self-marked attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('instructor', 'admin')
  ));

CREATE POLICY "Instructors manage attendance records"
  ON attendance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('instructor', 'admin')
  ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION compute_grade_letter(score NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF score >= 90 THEN RETURN 'A';
  ELSIF score >= 80 THEN RETURN 'B';
  ELSIF score >= 70 THEN RETURN 'C';
  ELSIF score >= 60 THEN RETURN 'D';
  ELSE RETURN 'F';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_test_attempt_grade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score IS NOT NULL THEN
    NEW.grade_letter = compute_grade_letter(NEW.score);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_grade_test_attempt
  BEFORE INSERT OR UPDATE ON test_attempts
  FOR EACH ROW EXECUTE FUNCTION set_test_attempt_grade();

CREATE OR REPLACE FUNCTION set_submission_grade()
RETURNS TRIGGER AS $$
DECLARE
  max_pts NUMERIC;
  pct NUMERIC;
BEGIN
  IF NEW.score IS NOT NULL THEN
    SELECT COALESCE(max_score, max_points, 100) INTO max_pts FROM assignments WHERE id = NEW.assignment_id;
    IF max_pts > 0 THEN
      pct := (NEW.score / max_pts) * 100;
      NEW.grade_letter = compute_grade_letter(pct);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_grade_submission
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_submission_grade();

-- ============================================================================
-- GRANT TABLE & SCHEMA PERMISSIONS FOR SUPABASE API ROLES
-- ============================================================================

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;
