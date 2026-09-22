// ─── LocalStorage Mock Database Simulator ────────────────────────────────────
// Serves as a local state sync to keep all dashboard values dynamic and interactive
// even when running in development mode without backend connection.

export interface MockStudentStats {
  overallProgress: number;
  classesAttendedPct: number;
  assignmentsDone: number;
  currentGradePct: number;
  programName: string;
  cohortName: string;
  currentModule: {
    title: string;
    completedLessons: number;
    totalLessons: number;
    currentLesson: {
      title: string;
      duration: string;
    };
  };
  schedule: Array<{
    time: string;
    period: 'AM' | 'PM';
    title: string;
    type: string;
    borderColorClass: string;
  }>;
  activities: Array<{
    title: string;
    desc: string;
    time: string;
    type: 'assignment' | 'grade' | 'project';
  }>;
}

export interface MockInstructorStats {
  fullName: string;
  totalStudents: number;
  pendingReviews: number;
  activeProjects: number;
  avgAttendancePct: number;
  assignmentCompletionPct: number;
  activities: Array<{
    title: string;
    time: string;
    type: 'submission' | 'test' | 'class' | 'project';
  }>;
}

export interface MockAdminStats {
  totalStudents: number;
  totalInstructors: number;
  activeCohorts: number;
  upcomingClasses: number;
  pendingReviews: number;
  activeCapstones: number;
  upcomingClassesList?: Array<{
    id: string;
    title: string;
    start_time: string;
    schedule_type: string;
    cohorts?: { id: string; name: string };
  }>;
  activities: Array<{
    title: string;
    desc: string;
    time: string;
    type: 'assignment' | 'student' | 'grade' | 'creation' | 'capstone';
  }>;
}

export interface MockAnnouncement {
  id: string;
  authorName: string;
  title: string;
  timeLabel: string;
  isPinned: boolean;
}

export interface MockCourse {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  modules: number;
  lessons: number;
  status: 'completed' | 'in-progress' | 'locked';
  thumbnail: string;
}

export interface MockAssignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted';
  score?: number;
}

export interface MockTest {
  id: number;
  title: string;
  questions: number;
  timeLimit: string;
  dueDate: string;
  status: 'available' | 'completed';
  score?: string;
}

export interface MockGroup {
  name: string;
  projectTitle: string;
  projectDescription: string;
  members: string[];
}

export interface MockCapstone {
  title: string;
  description: string;
  status: 'Draft' | 'Pending' | 'Submitted' | 'Approved';
  score?: number;
  feedback?: string;
  deadline: string;
}

export interface MockCertificate {
  id: number;
  title: string;
  date: string;
  credentialId: string;
  color: string;
  border: string;
  icon: string;
}

// Initial data templates — all start at zero/empty; real data comes from API
const defaultStudentStats: MockStudentStats = {
  overallProgress: 0,
  classesAttendedPct: 0,
  assignmentsDone: 0,
  currentGradePct: 0,
  programName: '—',
  cohortName: '—',
  currentModule: {
    title: 'No module assigned yet',
    completedLessons: 0,
    totalLessons: 0,
    currentLesson: {
      title: 'No lesson available',
      duration: '',
    }
  },
  schedule: [],
  activities: []
};

const defaultInstructorStats: MockInstructorStats = {
  fullName: '',
  totalStudents: 0,
  pendingReviews: 0,
  activeProjects: 0,
  avgAttendancePct: 0,
  assignmentCompletionPct: 0,
  activities: []
};

const defaultAdminStats: MockAdminStats = {
  totalStudents: 0,
  totalInstructors: 0,
  activeCohorts: 0,
  upcomingClasses: 0,
  pendingReviews: 0,
  activeCapstones: 0,
  activities: []
};

const defaultAnnouncements: MockAnnouncement[] = [];

// Helper functions to manage the DB in LocalStorage
export const mockDb = {
  init() {
    // Version key: bump this string to wipe stale mock localStorage data
    const DB_VERSION = 'v5_clean_dynamic';
    if (localStorage.getItem('edule_db_version') !== DB_VERSION) {
      const keysToRemove = [
        'edule_db_initialized',
        'edule_db_student',
        'edule_db_instructor',
        'edule_db_admin',
        'edule_db_announcements',
        'edule_mock_assignments',
        'edule_mock_tests',
        'edule_mock_capstone',
        'edule_mock_timetable',
        'edule_mock_courses',
        'edule_mock_certificates',
        'edule_mock_group',
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('edule_db_version', DB_VERSION);
    }
    if (!localStorage.getItem('edule_db_initialized')) {
      localStorage.setItem('edule_db_student', JSON.stringify(defaultStudentStats));
      localStorage.setItem('edule_db_instructor', JSON.stringify(defaultInstructorStats));
      localStorage.setItem('edule_db_admin', JSON.stringify(defaultAdminStats));
      localStorage.setItem('edule_db_announcements', JSON.stringify(defaultAnnouncements));
      localStorage.setItem('edule_db_initialized', 'true');
    }
  },

  clearAll() {
    const keysToRemove = [
      'edule_db_initialized',
      'edule_db_student',
      'edule_db_instructor',
      'edule_db_admin',
      'edule_db_announcements',
      'edule_mock_assignments',
      'edule_mock_tests',
      'edule_mock_capstone',
      'edule_mock_timetable',
      'edule_mock_courses',
      'edule_mock_certificates',
      'edule_mock_group',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    this.init();
  },

  getStudentStats(): MockStudentStats {
    this.init();
    return JSON.parse(localStorage.getItem('edule_db_student') || JSON.stringify(defaultStudentStats));
  },

  updateStudentStats(stats: Partial<MockStudentStats>) {
    const current = this.getStudentStats();
    const updated = { ...current, ...stats };
    localStorage.setItem('edule_db_student', JSON.stringify(updated));
    return updated;
  },

  getInstructorStats(): MockInstructorStats {
    this.init();
    return JSON.parse(localStorage.getItem('edule_db_instructor') || JSON.stringify(defaultInstructorStats));
  },

  updateInstructorStats(stats: Partial<MockInstructorStats>) {
    const current = this.getInstructorStats();
    const updated = { ...current, ...stats };
    localStorage.setItem('edule_db_instructor', JSON.stringify(updated));
    return updated;
  },

  getAdminStats(): MockAdminStats {
    this.init();
    return JSON.parse(localStorage.getItem('edule_db_admin') || JSON.stringify(defaultAdminStats));
  },

  updateAdminStats(stats: Partial<MockAdminStats>) {
    const current = this.getAdminStats();
    const updated = { ...current, ...stats };
    localStorage.setItem('edule_db_admin', JSON.stringify(updated));
    return updated;
  },

  getAnnouncements(): MockAnnouncement[] {
    this.init();
    return JSON.parse(localStorage.getItem('edule_db_announcements') || JSON.stringify(defaultAnnouncements));
  },

  addAnnouncement(announcement: Omit<MockAnnouncement, 'id'>) {
    const list = this.getAnnouncements();
    const newAnn = { ...announcement, id: Math.random().toString(36).substr(2, 9) };
    list.unshift(newAnn);
    localStorage.setItem('edule_db_announcements', JSON.stringify(list));
    return list;
  },

  // Dynamic Course and Track Management per Program
  getCourses(): MockCourse[] {
    const stored = localStorage.getItem('edule_mock_courses');
    return stored ? JSON.parse(stored) : [];
  },

  getAssignments(): MockAssignment[] {
    const stored = localStorage.getItem('edule_mock_assignments');
    return stored ? JSON.parse(stored) : [];
  },

  submitAssignment(id: number) {
    const list = this.getAssignments();
    const updated = list.map((a) => (a.id === id ? { ...a, status: 'submitted' as const } : a));
    localStorage.setItem('edule_mock_assignments', JSON.stringify(updated));
    return updated;
  },

  getTests(): MockTest[] {
    const stored = localStorage.getItem('edule_mock_tests');
    return stored ? JSON.parse(stored) : [];
  },

  completeTest(id: number, score: string) {
    const list = this.getTests();
    const updated = list.map((t) => (t.id === id ? { ...t, status: 'completed' as const, score } : t));
    localStorage.setItem('edule_mock_tests', JSON.stringify(updated));
    return updated;
  },

  getGroup(): MockGroup | null {
    const stored = localStorage.getItem('edule_mock_group');
    return stored ? JSON.parse(stored) : null;
  },

  getCapstone(): MockCapstone | null {
    const stored = localStorage.getItem('edule_mock_capstone');
    return stored ? JSON.parse(stored) : null;
  },

  submitCapstone(notes: string) {
    const current = this.getCapstone();
    if (!current) return null;
    const updated = { ...current, status: 'Submitted' as const, notes };
    localStorage.setItem('edule_mock_capstone', JSON.stringify(updated));
    return updated;
  },

  getCertificates(): MockCertificate[] {
    const stored = localStorage.getItem('edule_mock_certificates');
    return stored ? JSON.parse(stored) : [];
  },

  getTimetable(): Record<string, any> {
    const stored = localStorage.getItem('edule_mock_timetable');
    return stored ? JSON.parse(stored) : {};
  },

  addTimetableItem(item: { day: string; time: string; course: string; instructor: string; room: string }) {
    const current = this.getTimetable();
    const day = item.day;
    if (!current[day]) {
      current[day] = {};
    }
    current[day][item.time.split(' - ')[0]] = { title: item.course, instructor: item.instructor };
    localStorage.setItem('edule_mock_timetable', JSON.stringify(current));
    return current;
  }
};
