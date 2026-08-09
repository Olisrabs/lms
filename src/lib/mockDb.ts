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
    // Version key: bump this string to wipe stale localStorage data
    const DB_VERSION = 'v3';
    if (localStorage.getItem('edule_db_version') !== DB_VERSION) {
      localStorage.removeItem('edule_db_initialized');
      localStorage.removeItem('edule_db_student');
      localStorage.removeItem('edule_db_instructor');
      localStorage.removeItem('edule_db_admin');
      localStorage.removeItem('edule_db_announcements');
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
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';

    if (p.includes('backend')) {
      return [
        { id: 1, title: 'Node.js & Express Basics', instructor: 'David S.', progress: 100, modules: 4, lessons: 20, status: 'completed', thumbnail: 'bg-gradient-to-br from-green-400 to-green-600' },
        { id: 2, title: 'Database Systems & SQL', instructor: 'Sarah J.', progress: 70, modules: 6, lessons: 32, status: 'in-progress', thumbnail: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
        { id: 3, title: 'RESTful API Design', instructor: 'Dan A.', progress: 20, modules: 5, lessons: 25, status: 'in-progress', thumbnail: 'bg-gradient-to-br from-pink-400 to-pink-600' },
        { id: 4, title: 'System Architecture & Scale', instructor: 'Lee R.', progress: 0, modules: 4, lessons: 16, status: 'locked', thumbnail: 'bg-gradient-to-br from-slate-400 to-slate-600' }
      ];
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      return [
        { id: 1, title: 'Introduction to UI/UX', instructor: 'Michael R.', progress: 100, modules: 3, lessons: 15, status: 'completed', thumbnail: 'bg-gradient-to-br from-teal-400 to-teal-600' },
        { id: 2, title: 'Wireframing & Figma Basics', instructor: 'Figma Fanatic', progress: 75, modules: 6, lessons: 28, status: 'in-progress', thumbnail: 'bg-gradient-to-br from-rose-400 to-rose-600' },
        { id: 3, title: 'User Research & Testing', instructor: 'Sarah J.', progress: 10, modules: 4, lessons: 20, status: 'in-progress', thumbnail: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
        { id: 4, title: 'Design Systems & Spec', instructor: 'Adobe Ally', progress: 0, modules: 5, lessons: 25, status: 'locked', thumbnail: 'bg-gradient-to-br from-amber-400 to-amber-600' }
      ];
    } else {
      // Default: Frontend Engineering
      return [
        { id: 1, title: 'HTML & CSS Fundamentals', instructor: 'Sarah Drasner', progress: 100, modules: 5, lessons: 24, status: 'completed', thumbnail: 'bg-gradient-to-br from-orange-400 to-orange-600' },
        { id: 2, title: 'JavaScript Essentials', instructor: 'Kyle Simpson', progress: 85, modules: 8, lessons: 42, status: 'in-progress', thumbnail: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
        { id: 3, title: 'React.js & Hooks', instructor: 'Dan Abramov', progress: 30, modules: 6, lessons: 30, status: 'in-progress', thumbnail: 'bg-gradient-to-br from-cyan-400 to-cyan-600' },
        { id: 4, title: 'Advanced State Management', instructor: 'Mark Erikson', progress: 0, modules: 4, lessons: 18, status: 'locked', thumbnail: 'bg-gradient-to-br from-purple-400 to-purple-600' }
      ];
    }
  },

  getAssignments(): MockAssignment[] {
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';
    const stored = localStorage.getItem('edule_mock_assignments');
    if (stored) return JSON.parse(stored);

    let list: MockAssignment[] = [];
    if (p.includes('backend')) {
      list = [
        { id: 1, title: 'Setup an Express Server', course: 'Node.js & Express Basics', dueDate: 'Today, 11:59 PM', status: 'submitted', score: 98 },
        { id: 2, title: 'SQL Queries Practice', course: 'Database Systems & SQL', dueDate: 'Tomorrow, 11:59 PM', status: 'pending' }
      ];
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      list = [
        { id: 1, title: 'Design a Mobile Login Screen', course: 'Introduction to UI/UX', dueDate: 'Today, 11:59 PM', status: 'submitted', score: 96 },
        { id: 2, title: 'Create Interactive Figma Prototype', course: 'Wireframing & Figma Basics', dueDate: 'Tomorrow, 11:59 PM', status: 'pending' }
      ];
    } else {
      list = [
        { id: 1, title: 'Build a Responsive Portfolio', course: 'HTML & CSS Fundamentals', dueDate: 'Today, 11:59 PM', status: 'pending' },
        { id: 2, title: 'JavaScript Array Methods Exercises', course: 'JavaScript Essentials', dueDate: 'Tomorrow, 11:59 PM', status: 'pending' }
      ];
    }
    localStorage.setItem('edule_mock_assignments', JSON.stringify(list));
    return list;
  },

  submitAssignment(id: number) {
    const list = this.getAssignments();
    const updated = list.map(a => a.id === id ? { ...a, status: 'submitted' as const } : a);
    localStorage.setItem('edule_mock_assignments', JSON.stringify(updated));
    return updated;
  },

  getTests(): MockTest[] {
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';
    const stored = localStorage.getItem('edule_mock_tests');
    if (stored) return JSON.parse(stored);

    let list: MockTest[] = [];
    if (p.includes('backend')) {
      list = [
        { id: 1, title: 'SQL Joins & Schema Design', questions: 30, timeLimit: '45 mins', dueDate: 'Tomorrow, 11:59 PM', status: 'available' },
        { id: 2, title: 'Express Router Quiz', questions: 10, timeLimit: '15 mins', dueDate: 'Oct 28', status: 'available' },
        { id: 3, title: 'HTTP Protocol Fundamentals', questions: 20, timeLimit: '30 mins', dueDate: 'Past', status: 'completed', score: '90%' }
      ];
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      list = [
        { id: 1, title: 'User Research Methodologies', questions: 25, timeLimit: '35 mins', dueDate: 'Tomorrow, 11:59 PM', status: 'available' },
        { id: 2, title: 'Figma Component Quiz', questions: 15, timeLimit: '25 mins', dueDate: 'Oct 28', status: 'available' },
        { id: 3, title: 'UI Design Principles', questions: 20, timeLimit: '30 mins', dueDate: 'Past', status: 'completed', score: '95%' }
      ];
    } else {
      list = [
        { id: 1, title: 'JavaScript Fundamentals Midterm', questions: 40, timeLimit: '60 mins', dueDate: 'Tomorrow, 11:59 PM', status: 'available' },
        { id: 2, title: 'React Hooks Quiz', questions: 15, timeLimit: '20 mins', dueDate: 'Oct 28', status: 'available' },
        { id: 3, title: 'HTML & CSS Basics', questions: 25, timeLimit: '45 mins', dueDate: 'Past', status: 'completed', score: '92%' }
      ];
    }
    localStorage.setItem('edule_mock_tests', JSON.stringify(list));
    return list;
  },

  completeTest(id: number, score: string) {
    const list = this.getTests();
    const updated = list.map(t => t.id === id ? { ...t, status: 'completed' as const, score } : t);
    localStorage.setItem('edule_mock_tests', JSON.stringify(updated));
    return updated;
  },

  getGroup(): MockGroup {
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';

    if (p.includes('backend')) {
      return {
        name: 'Team Beta',
        projectTitle: 'Microservices Gateway',
        projectDescription: 'Build a highly scalable backend REST API gateway with JWT auth, rate limiting, and caching.',
        members: ['John Doe (You)', 'Robert Downey', 'Chris Evans', 'Scarlett Johansson']
      };
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      return {
        name: 'Team Gamma',
        projectTitle: 'Health Tracker Design',
        projectDescription: 'Conduct user research and create a comprehensive interactive design system and high-fidelity prototype.',
        members: ['John Doe (You)', 'Figma Fanatic', 'Adobe Ally', 'Sketch Wizard']
      };
    } else {
      return {
        name: 'Team Alpha',
        projectTitle: 'E-Commerce Frontend',
        projectDescription: 'Work with your team to build a fully responsive frontend for an e-commerce platform using React and Tailwind CSS.',
        members: ['John Doe (You)', 'Sarah Smith', 'Mike Johnson', 'Emily Davis']
      };
    }
  },

  getCapstone(): MockCapstone {
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';
    const stored = localStorage.getItem('edule_mock_capstone');
    if (stored) return JSON.parse(stored);

    let item: MockCapstone;
    if (p.includes('backend')) {
      item = {
        title: 'Microservices API Gateway',
        description: 'Build a highly scalable backend REST API gateway with JWT auth, rate limiting, and caching.',
        status: 'Draft',
        deadline: 'Dec 18, 2026'
      };
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      item = {
        title: 'Health Tracker App Design',
        description: 'Conduct user research and create a comprehensive interactive design system and high-fidelity prototype.',
        status: 'Draft',
        deadline: 'Dec 20, 2026'
      };
    } else {
      item = {
        title: 'E-Commerce Frontend Project',
        description: 'Work with your team to build a fully responsive frontend for an e-commerce platform using React and Tailwind CSS.',
        status: 'Draft',
        deadline: 'Dec 15, 2026'
      };
    }
    localStorage.setItem('edule_mock_capstone', JSON.stringify(item));
    return item;
  },

  submitCapstone(notes: string) {
    const current = this.getCapstone();
    const updated = { ...current, status: 'Submitted' as const, notes };
    localStorage.setItem('edule_mock_capstone', JSON.stringify(updated));
    return updated;
  },

  getCertificates(): MockCertificate[] {
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';

    if (p.includes('backend')) {
      return [
        { id: 1, title: 'Node.js & Express Basics', date: 'Sept 20, 2026', credentialId: 'CRED-928471B', color: 'from-green-500/20 to-green-500/5', border: 'border-green-500/20', icon: 'text-green-500' }
      ];
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      return [
        { id: 1, title: 'Introduction to UI/UX', date: 'Sept 10, 2026', credentialId: 'CRED-374920C', color: 'from-teal-500/20 to-teal-500/5', border: 'border-teal-500/20', icon: 'text-teal-500' }
      ];
    } else {
      return [
        { id: 1, title: 'HTML & CSS Fundamentals', date: 'Sept 15, 2026', credentialId: 'CRED-837492A', color: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20', icon: 'text-orange-500' }
      ];
    }
  },

  getTimetable() {
    const stats = this.getStudentStats();
    const p = stats.programName?.toLowerCase() || '';
    const stored = localStorage.getItem('edule_mock_timetable');
    if (stored) return JSON.parse(stored);

    let data: any = {};
    if (p.includes('backend')) {
      data = {
        'Monday': {
          '11:00 AM': { title: 'Node.js Performance', instructor: 'David S.' }
        },
        'Wednesday': {
          '09:00 AM': { title: 'Backend APIs', instructor: 'David S.' }
        },
        'Friday': {
          '10:00 AM': { title: 'System Design', instructor: 'Emma W.' }
        }
      };
    } else if (p.includes('design') || p.includes('ui') || p.includes('ux')) {
      data = {
        'Tuesday': {
          '02:00 PM': { title: 'UI/UX Basics', instructor: 'Michael R.' }
        },
        'Thursday': {
          '10:00 AM': { title: 'Figma Prototyping', instructor: 'Michael R.' }
        },
        'Friday': {
          '10:00 AM': { title: 'Career Prep', instructor: 'Emma W.' }
        }
      };
    } else {
      data = {
        'Monday': {
          '10:00 AM': { title: 'Advanced React', instructor: 'Sarah D.' }
        },
        'Wednesday': {
          '09:00 AM': { title: 'JS Fundamentals', instructor: 'Kyle S.' },
          '01:00 PM': { title: 'React Hooks', instructor: 'Sarah D.' }
        },
        'Thursday': {
          '11:00 AM': { title: 'State Management', instructor: 'Dan A.' }
        },
        'Friday': {
          '10:00 AM': { title: 'Career Prep', instructor: 'Emma W.' }
        }
      };
    }
    localStorage.setItem('edule_mock_timetable', JSON.stringify(data));
    return data;
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
