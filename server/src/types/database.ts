/**
 * Hand-maintained TypeScript types mirroring the Supabase schema.
 * For production, generate these automatically with: npx supabase gen types typescript
 */

export type UserRole   = 'admin' | 'instructor' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type ContentType = 'video' | 'pdf' | 'image' | 'audio' | 'document' | 'link';
export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'late' | 'missing';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type CohortStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type CapstoneStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  role: UserRole;
  status: UserStatus;
  metadata: Record<string, unknown>;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string | null;
  duration_weeks: number;
  is_active: boolean;
  cover_url?: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Cohort {
  id: string;
  program_id: string;
  name: string;
  status: CohortStatus;
  start_date: string;
  end_date: string;
  capacity: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  cohort_id: string;
  enrolled_at: string;
  progress_pct: number;
  completed_at?: string | null;
}

export interface Material {
  id: string;
  module_id: string;
  title: string;
  content_type: ContentType;
  storage_path: string;
  original_name: string;
  file_size_kb?: number | null;
  duration_sec?: number | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  is_published: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id?: string | null;
  group_id?: string | null;
  status: SubmissionStatus;
  content?: string | null;
  attachments: string[];
  score?: number | null;
  feedback?: string | null;
  graded_by?: string | null;
  submitted_at?: string | null;
  graded_at?: string | null;
}

// ─── Remaining table row types ────────────────────────────────────────────────

export interface Course {
  id: string;
  program_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  cover_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialProgress {
  id: string;
  student_id: string;
  material_id: string;
  completed: boolean;
  progress_pct: number;
  last_position: number;
  completed_at?: string | null;
}

export interface ClassSchedule {
  id: string;
  cohort_id: string;
  instructor_id: string;
  course_id?: string | null;
  title: string;
  schedule_type: 'lecture' | 'lab' | 'workshop' | 'exam' | 'office_hours';
  start_time: string;
  end_time: string;
  location?: string | null;
  meeting_url?: string | null;
  notes?: string | null;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  schedule_id: string;
  student_id: string;
  status: AttendanceStatus;
  note?: string | null;
  marked_by?: string | null;
  marked_at: string;
}

export interface Assignment {
  id: string;
  cohort_id: string;
  instructor_id: string;
  course_id?: string | null;
  title: string;
  description?: string | null;
  assignment_type: 'individual' | 'group';
  max_score: number;
  due_date: string;
  instructions?: string | null;
  attachments: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  cohort_id: string;
  instructor_id: string;
  course_id?: string | null;
  title: string;
  description?: string | null;
  duration_mins: number;
  max_score: number;
  pass_score?: number | null;
  start_time: string;
  end_time: string;
  questions: Record<string, unknown>[];
  is_published: boolean;
  shuffle_questions: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  answers: Record<string, unknown>;
  score?: number | null;
  started_at: string;
  submitted_at?: string | null;
  graded_at?: string | null;
  time_taken_sec?: number | null;
}

export interface Grade {
  id: string;
  student_id: string;
  cohort_id: string;
  assignment_avg?: number | null;
  test_avg?: number | null;
  attendance_pct?: number | null;
  overall_score?: number | null;
  grade_letter?: string | null;
  updated_at: string;
}

export interface Group {
  id: string;
  cohort_id: string;
  name: string;
  description?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  student_id: string;
  role: string;
  joined_at: string;
}

export interface CohortInstructor {
  cohort_id: string;
  instructor_id: string;
  assigned_at: string;
}

export interface Capstone {
  id: string;
  cohort_id: string;
  group_id?: string | null;
  student_id?: string | null;
  title: string;
  description?: string | null;
  status: CapstoneStatus;
  attachments: string[];
  score?: number | null;
  feedback?: string | null;
  reviewed_by?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  cohort_id?: string | null;
  title: string;
  body: string;
  is_pinned: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorProfile {
  instructor_id: string;
  specialization?: string | null;
  skills: string[];
  bio?: string | null;
  linkedin_url?: string | null;
  years_experience?: number | null;
  certifications: Record<string, unknown>[];
  class_assigned?: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface StudentProfile {
  student_id: string;
  education_level?: string | null;
  occupation?: string | null;
  interests: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
  bio?: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  revoked: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: string | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

// Represents the authenticated token payload
export interface JwtPayload {
  sub: string;      // user.id (our UUID, not auth.uid)
  auth_id: string;  // Supabase auth uid
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Full Supabase Database type — covers all 20 tables ──────────────────────
// In production, replace this with: npx supabase gen types typescript --project-id <ref>
export interface Database {
  public: {
    Tables: {
      users:               { Row: User; Insert: Partial<User>; Update: Partial<User> };
      programs:            { Row: Program; Insert: Partial<Program>; Update: Partial<Program> };
      cohorts:             { Row: Cohort; Insert: Partial<Cohort>; Update: Partial<Cohort> };
      courses:             { Row: Course; Insert: Partial<Course>; Update: Partial<Course> };
      modules:             { Row: Module; Insert: Partial<Module>; Update: Partial<Module> };
      enrollments:         { Row: Enrollment; Insert: Partial<Enrollment>; Update: Partial<Enrollment> };
      cohort_instructors:  { Row: CohortInstructor; Insert: Partial<CohortInstructor>; Update: Partial<CohortInstructor> };
      materials:           { Row: Material; Insert: Partial<Material>; Update: Partial<Material> };
      material_progress:   { Row: MaterialProgress; Insert: Partial<MaterialProgress>; Update: Partial<MaterialProgress> };
      class_schedules:     { Row: ClassSchedule; Insert: Partial<ClassSchedule>; Update: Partial<ClassSchedule> };
      attendance:          { Row: Attendance; Insert: Partial<Attendance>; Update: Partial<Attendance> };
      assignments:         { Row: Assignment; Insert: Partial<Assignment>; Update: Partial<Assignment> };
      submissions:         { Row: Submission; Insert: Partial<Submission>; Update: Partial<Submission> };
      tests:               { Row: Test; Insert: Partial<Test>; Update: Partial<Test> };
      test_attempts:       { Row: TestAttempt; Insert: Partial<TestAttempt>; Update: Partial<TestAttempt> };
      grades:              { Row: Grade; Insert: Partial<Grade>; Update: Partial<Grade> };
      groups:              { Row: Group; Insert: Partial<Group>; Update: Partial<Group> };
      group_members:       { Row: GroupMember; Insert: Partial<GroupMember>; Update: Partial<GroupMember> };
      capstones:           { Row: Capstone; Insert: Partial<Capstone>; Update: Partial<Capstone> };
      announcements:       { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement> };
      instructor_profiles: { Row: InstructorProfile; Insert: Partial<InstructorProfile>; Update: Partial<InstructorProfile> };
      student_profiles:    { Row: StudentProfile; Insert: Partial<StudentProfile>; Update: Partial<StudentProfile> };
      notifications:       { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      refresh_tokens:      { Row: RefreshToken; Insert: Partial<RefreshToken>; Update: Partial<RefreshToken> };
      audit_logs:          { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
  };
}

