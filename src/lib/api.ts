/**
 * Make It Simple API Client
 *
 * Centralized HTTP client for all API calls.
 * Features:
 *   - Automatic Authorization header injection
 *   - Transparent token refresh on 401 responses
 *   - Request queuing during token refresh (prevents multiple refresh calls)
 *   - Consistent error handling
 */

const BASE_URL = ((import.meta as any).env?.VITE_API_URL) || 'http://localhost:4000/api/v1';

// ─── Token storage ────────────────────────────────────────────────────────────
// Stored in memory (not localStorage) to mitigate XSS token theft.
// Refresh token IS stored in sessionStorage as it only lasts 7 days.
let _accessToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  _accessToken = access;
  sessionStorage.setItem('edule_refresh', refresh);
}

export function clearTokens(): void {
  _accessToken = null;
  sessionStorage.removeItem('edule_refresh');
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem('edule_refresh');
}

// ─── Refresh queue management ─────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

async function doFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth = false, ...rest } = options;
  const headers: HeadersInit = {
    ...rest.headers,
  };

  if (!(rest.body instanceof FormData) && !(headers as Record<string, string>)['Content-Type']) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (!skipAuth && _accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${_accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  // Token expired — attempt refresh
  // Token expired — attempt refresh
  if (response.status === 401 && !skipAuth) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      const isStaffPath = window.location.pathname.startsWith('/admin') ||
                          window.location.pathname.startsWith('/instructor') ||
                          window.location.pathname.startsWith('/staff');
      if (isStaffPath) {
        window.location.href = '/staff';
      } else if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
        window.location.href = '/signin';
      }
      throw new Error('Session expired');
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber(async (newToken) => {
          try {
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            const retryRes = await fetch(`${BASE_URL}${path}`, {
              ...rest,
              headers: retryHeaders,
            });
            if (!retryRes.ok) reject(await retryRes.json());
            else resolve(await retryRes.json());
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!refreshRes.ok) {
        clearTokens();
        const isStaffPath = window.location.pathname.startsWith('/admin') ||
                            window.location.pathname.startsWith('/instructor') ||
                            window.location.pathname.startsWith('/staff');
        if (isStaffPath) {
          window.location.href = '/staff';
        } else if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
          window.location.href = '/signin';
        }
        throw new Error('Refresh failed');
      }

      const { access_token, refresh_token: newRefresh } = await refreshRes.json();
      setTokens(access_token, newRefresh);
      isRefreshing = false;
      onTokenRefreshed(access_token);

      // Retry original request with new token
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: { ...headers, Authorization: `Bearer ${access_token}` },
      });
      if (!retryRes.ok) throw await retryRes.json();
      return retryRes.json();
    } catch (e) {
      isRefreshing = false;
      throw e;
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw { status: response.status, ...body };
  }

  return response.json();
}

// ─── HTTP method shortcuts ────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, options?: ApiOptions) =>
    doFetch<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    doFetch<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      ...options,
    }),

  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    doFetch<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      ...options,
    }),

  delete: <T>(path: string, options?: ApiOptions) =>
    doFetch<T>(path, { method: 'DELETE', ...options }),
};

// ─── Auth API methods ─────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'instructor' | 'student';
  status: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string | null;
  gender?: string;
  metadata?: Record<string, any>;
  onboardingIncomplete?: boolean; // true when student hasn't completed onboarding
}

interface AuthResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

export const authApi = {
  signIn: (email: string, password: string, role: string) =>
    api.post<AuthResponse>('/auth/signin', { email, password, role }, { skipAuth: true }),

  signUp: (data: { email: string; password: string; full_name: string; role: string }) =>
    api.post<AuthResponse>('/auth/signup', data, { skipAuth: true }),

  signUpAdmin: (data: { email: string; password: string; full_name: string; admin_key: string }) =>
    api.post<AuthResponse>('/auth/signup/admin', data, { skipAuth: true }),

  signOut: () => api.post('/auth/signout'),

  me: () => api.get<{ user: AuthUser }>('/auth/me'),

  changePassword: (data: Record<string, string>) => api.post('/auth/change-password', data),
};

// ─── Domain API methods ───────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string; search?: string; cohort_id?: string }) => {
    const filtered = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(filtered as Record<string, string>).toString();
    return api.get<{ users: AuthUser[]; total: number }>(`/users${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<AuthUser>(`/users/${id}`),
  updateProfile: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  uploadAvatar: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api.patch<{ avatar_url: string }>(`/users/${id}/avatar`, fd);
  },
  updateStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
  updateInstructorProfile: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}/instructor-profile`, data),
  updateStudentProfile: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}/student-profile`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  flushCache: () => api.get('/users/flush-cache'),
  getAdminDashboardStats: (cohortId?: string) => api.get<any>(`/users/admin/dashboard-stats${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  getInstructorAssignments: () => api.get<any[]>('/users/instructor/assignments'),
  getStudentEnrollment: () => api.get<any | null>('/users/student/enrollment'),
};

export const programsApi = {
  list: (cohortId?: string) => api.get(`/programs${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  create: (data: FormData | Record<string, unknown>) => api.post('/programs', data),
  update: (id: string, data: FormData | Record<string, unknown>) => api.patch(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
  getCohorts: (programId: string) => api.get(`/programs/${programId}/cohorts`),
  createCohort: (programId: string, data: Record<string, unknown> & { registration_close_date?: string }) =>
    api.post(`/programs/${programId}/cohorts`, data),
  updateCohort: (programId: string, cohortId: string, data: Record<string, unknown> & { registration_close_date?: string }) =>
    api.patch(`/programs/${programId}/cohorts/${cohortId}`, data),
  deleteCohort: (programId: string, cohortId: string) =>
    api.delete(`/programs/${programId}/cohorts/${cohortId}`),
  enrollStudent: (cohortId: string, studentId: string, programId?: string) =>
    api.post(`/programs/cohorts/${cohortId}/enroll`, { student_id: studentId, program_id: programId }),
  getStudents: (cohortId: string, programId?: string) =>
    api.get(`/programs/cohorts/${cohortId}/students${programId ? `?program_id=${programId}` : ''}`),
  listAllCohorts: () => api.get<any[]>('/programs/all-cohorts'),
  getActiveCohort: () => api.get<{
    activeCohort: { id: string; name: string; status: string } | null;
    registrationOpen: boolean;
    registrationCloseDate: string | null;
    programs: Array<{ id: string; name: string }>;
  }>('/programs/active-cohort', { skipAuth: true }),
  flushCohortCache: () => api.get('/programs/flush-cohort-cache', { skipAuth: true }),
  assignInstructor: (programId: string, cohortId: string, instructorId: string, targetProgramId: string) =>
    api.post(`/programs/${programId}/cohorts/${cohortId}/instructors`, { instructor_id: instructorId, program_id: targetProgramId }),
};

export const coursesApi = {
  list: (params?: { cohort_id?: string; program_id?: string }) => {
    const filtered = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(filtered as Record<string, string>).toString();
    return api.get<any[]>(`/programs/courses/all${qs ? `?${qs}` : ''}`);
  },
  create: (data: { program_id: string; title: string; description?: string; sort_order?: number }) =>
    api.post('/programs/courses/create', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/programs/courses/${id}`, data),
  delete: (id: string) =>
    api.delete(`/programs/courses/${id}`),
};

export const materialsApi = {
  list: (cohortId?: string) => api.get<any[]>(`/materials${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  upload: (data: FormData | Record<string, unknown>) => api.post<any>('/materials', data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  updateProgress: (materialId: string, data: { progress_pct: number; last_position?: number }) =>
    api.post(`/materials/${materialId}/progress`, data),
};

export const assignmentsApi = {
  list: (cohortId?: string) => api.get<any[]>(`/assignments${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  create: (data: FormData | Record<string, any>) => api.post('/assignments', data),
  submit: (assignmentId: string, data: FormData | Record<string, any>) =>
    api.post(`/assignments/${assignmentId}/submit`, data),
  getSubmissions: () => api.get<any[]>('/assignments/submissions'),
  grade: (assignmentId: string, submissionId: string, score: number, feedback?: string) =>
    api.patch(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, { score, feedback }),
};

export const attendanceApi = {
  // ── Instructor / Admin ──────────────────────────────────────────────────────
  list: (cohortId?: string) => api.get(`/attendance${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  getForSession: (scheduleId: string) => api.get<any[]>(`/attendance?schedule_id=${scheduleId}`),
  markBulk: (scheduleId: string, records: Array<{ student_id: string; status: string; note?: string }>) =>
    api.post('/attendance/bulk', { schedule_id: scheduleId, records }),
  updateRecord: (id: string, data: { status?: string; note?: string }) =>
    api.patch(`/attendance/${id}`, data),
  getStudentHistory: (studentId: string) => api.get<any[]>(`/attendance/student/${studentId}`),

  // ── Session management (instructor opens / closes a session window) ─────────
  getSessions: (params?: { schedule_id?: string; cohort_id?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return api.get<any[]>(`/attendance/sessions${qs ? `?${qs}` : ''}`);
  },
  openSession: (data: { schedule_id: string; cohort_id: string; open_minutes?: number }) =>
    api.post<any>('/attendance/sessions', data),
  closeSession: (sessionId: string) =>
    api.patch(`/attendance/sessions/${sessionId}/close`),
  getActiveSession: (scheduleId: string) =>
    api.get<any | null>(`/attendance/sessions/active/${scheduleId}`),

  // ── Student self-mark ───────────────────────────────────────────────────────
  selfMark: (code: string) =>
    api.post<{ message: string; status?: string; alreadyMarked?: boolean }>('/attendance/self-mark', { code }),
  getTodaySchedule: () => api.get<any[]>('/attendance/today'),
};

export const scheduleApi = {
  getForCohort: (cohortId?: string) => api.get(`/schedule${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  create: (data: Record<string, unknown>) => api.post('/schedule', data),
  cancel: (id: string) => api.patch(`/schedule/${id}/cancel`),
  getInstructorSchedule: (instructorId: string) => api.get(`/schedule/instructor/${instructorId}`),
};

export const testsApi = {
  list: (cohortId?: string) => api.get(`/tests${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  get: (id: string) => api.get(`/tests/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tests', data),
  publish: (id: string, is_published: boolean) =>
    api.patch(`/tests/${id}/publish`, { is_published }),
  submit: (testId: string, answers: Record<string, unknown>) =>
    api.post(`/tests/${testId}/attempt`, { answers }),
  getAttempts: (testId: string) => api.get(`/tests/${testId}/attempts`),
  gradeAttempt: (testId: string, attemptId: string, score: number) =>
    api.patch(`/tests/${testId}/attempts/${attemptId}/grade`, { score }),
};

export const gradesApi = {
  getCohortGrades: (cohortId?: string, programId?: string) => {
    const params = new URLSearchParams();
    if (cohortId) params.append('cohort_id', cohortId);
    if (programId) params.append('program_id', programId);
    const qs = params.toString();
    return api.get(`/grades${qs ? `?${qs}` : ''}`);
  },
  getStudentGrades: (studentId: string) => api.get(`/grades/student/${studentId}`),
  getAllGrades: () => api.get<any>('/grades'),
  recalculate: (studentId: string, cohortId: string) =>
    api.post('/grades/recalculate', { student_id: studentId, cohort_id: cohortId }),
};

export const groupsApi = {
  list: (cohortId?: string) => api.get(`/groups${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  create: (data: { cohort_id: string; name: string; description?: string }) =>
    api.post('/groups', data),
  addMember: (groupId: string, studentId: string, role = 'member') =>
    api.post(`/groups/${groupId}/members`, { student_id: studentId, role }),
  removeMember: (groupId: string, studentId: string) =>
    api.delete(`/groups/${groupId}/members/${studentId}`),
  myGroups: () => api.get('/groups/mine'),
};

export const capstonesApi = {
  list: (cohortId?: string) => api.get(`/capstones${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  submit: (data: FormData) => api.post('/capstones', data),
  review: (id: string, data: { status: string; score?: number; feedback?: string }) =>
    api.patch(`/capstones/${id}/review`, data),
};

export const announcementsApi = {
  list: (cohortId?: string) =>
    api.get(`/announcements${cohortId ? `?cohort_id=${cohortId}` : ''}`),
  create: (data: Record<string, unknown>) => api.post('/announcements', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const certificatesApi = {
  list: () => api.get<any[]>('/certificates'),
  getStudentCertificates: (studentId: string) => api.get<any[]>(`/certificates/student/${studentId}`),
  create: (data: FormData) => api.post<any>('/certificates', data),
  delete: (id: string) => api.delete(`/certificates/${id}`),
};
