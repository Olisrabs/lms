-- ============================================================================
-- LMS Database Schema (tables.sql)
-- Complete schema creation script with table integrity, foreign keys,
-- constraints, indexes, and RLS security policies.
-- Updated to include: certificates, student_performance, grade letter system,
-- MCQ test support, and all FK relations.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- DROP EXISTING TABLES (Reverse Dependency Order)
-- ============================================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS student_performance CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS capstones CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS cohort_instructors CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS instructor_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. USERS & PROFILES
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    metadata JSONB DEFAULT '{}',
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE instructor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialization TEXT,
    phone TEXT,
    office_hours TEXT,
    years_of_experience INTEGER,
    linkedin_url TEXT,
    github_url TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ACADEMIC STRUCTURE (Programs & Cohorts)
-- ============================================================================

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    image_url TEXT,
    price NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
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
    registration_close_date TIMESTAMPTZ,
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
    completion_date TIMESTAMPTZ,
    CONSTRAINT unique_student_cohort UNIQUE (student_id, cohort_id)
);

CREATE TABLE cohort_instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_instructor_cohort UNIQUE (instructor_id, cohort_id)
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CLASS SCHEDULING & COLLABORATIVE ATTENDANCE
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
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
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
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_schedule_student UNIQUE (schedule_id, student_id)
);

-- ============================================================================
-- 4. COURSEWORK & ASSIGNMENTS
-- ============================================================================

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_points NUMERIC DEFAULT 100,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_url TEXT,
    content TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmit')),
    -- Numeric score and letter grade
    score NUMERIC,
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    grader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id)
);

-- ============================================================================
-- 5. TESTS & QUIZZES (MCQ Support with JSONB questions)
-- ============================================================================

CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    -- Questions stored as JSONB array: [{id, text, type, options[], correct_answer}]
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
    -- answers stored as JSONB: { "question_id": "selected_answer" }
    answers JSONB DEFAULT '{}',
    score NUMERIC,
    -- Letter grade auto-computed: A>=90, B>=80, C>=70, D>=60, F<60
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    time_taken_sec INTEGER,
    CONSTRAINT unique_test_student UNIQUE (test_id, student_id)
);

-- ============================================================================
-- 6. CAPSTONES, GROUPS & ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE capstones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID,  -- Nullable; filled when it's a group submission
    title TEXT NOT NULL,
    description TEXT,
    project_url TEXT,
    repo_url TEXT,
    -- attachments stored as JSONB array of storage paths
    attachments JSONB DEFAULT '[]',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected')),
    score NUMERIC,
    -- Letter grade
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    feedback TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from capstones.group_id → groups.id after groups table exists
ALTER TABLE capstones ADD CONSTRAINT fk_capstone_group
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
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CERTIFICATES (Admin creates per program; students see for their programs)
-- ============================================================================

CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    -- URL to the uploaded certificate design/template
    template_url TEXT,
    -- Unique credential identifier
    credential_id TEXT UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. PERFORMANCE, GRADES & STUDENT PERFORMANCE TABLE
-- ============================================================================

-- Aggregated grade record per student per cohort
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    -- Component averages (percentages 0-100)
    assignment_avg NUMERIC DEFAULT 0,
    test_avg NUMERIC DEFAULT 0,
    attendance_pct NUMERIC DEFAULT 0,
    -- Weighted overall: assignments(40%) + tests(40%) + attendance(20%)
    overall_score NUMERIC DEFAULT 0,
    -- Letter grade: A>=90, B>=80, C>=70, D>=60, F<60
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_grade_student_cohort UNIQUE (student_id, cohort_id)
);

-- Master performance table used to determine graduation eligibility
CREATE TABLE student_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    -- Overall weighted score
    overall_score NUMERIC DEFAULT 0,
    -- Individual components
    assignment_score NUMERIC DEFAULT 0,
    test_score NUMERIC DEFAULT 0,
    attendance_score NUMERIC DEFAULT 0,
    capstone_score NUMERIC DEFAULT 0,
    -- Letter grade
    grade_letter TEXT CHECK (grade_letter IN ('A', 'B', 'C', 'D', 'F')),
    -- Graduation eligibility flag
    is_eligible_for_graduation BOOLEAN DEFAULT FALSE,
    graduation_status TEXT DEFAULT 'pending' CHECK (graduation_status IN ('pending', 'graduated', 'failed', 'deferred')),
    -- Timestamps
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

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

CREATE INDEX idx_assignments_cohort ON assignments(cohort_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);

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
CREATE INDEX idx_audit_logs_table ON audit_logs(target_table);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

-- Class Schedules Policies
CREATE POLICY "Schedules viewable by all authenticated"
  ON class_schedules FOR SELECT USING (true);

CREATE POLICY "Instructors manage their schedules"
  ON class_schedules FOR ALL
  USING (auth.uid() = instructor_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Attendance Sessions Policies
CREATE POLICY "Students can read active open sessions"
  ON attendance_sessions FOR SELECT
  USING (is_open = true OR auth.uid() = instructor_id);

CREATE POLICY "Instructors manage attendance sessions"
  ON attendance_sessions FOR ALL
  USING (auth.uid() = instructor_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Attendance Policies
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

-- Auto-update updated_at timestamp
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

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate grade_letter in test_attempts
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

-- Trigger to auto-set grade_letter on test_attempts insert/update
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

-- Trigger to auto-set grade_letter on assignment_submissions
CREATE OR REPLACE FUNCTION set_submission_grade()
RETURNS TRIGGER AS $$
DECLARE
  max_pts NUMERIC;
  pct NUMERIC;
BEGIN
  IF NEW.score IS NOT NULL THEN
    SELECT max_points INTO max_pts FROM assignments WHERE id = NEW.assignment_id;
    IF max_pts > 0 THEN
      pct := (NEW.score / max_pts) * 100;
      NEW.grade_letter = compute_grade_letter(pct);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_grade_submission
  BEFORE INSERT OR UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION set_submission_grade();
