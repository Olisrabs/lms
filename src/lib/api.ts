/**
 * EduLe API Client
 *
 * Centralized HTTP client for all API calls.
 * Features:
 *   - Automatic Authorization header injection
 *   - Transparent token refresh on 401 responses
 *   - Request queuing during token refresh (prevents multiple refresh calls)
 *   - Consistent error handling
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

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
    'Content-Type': 'application/json',
    ...rest.headers,
  };

  if (!skipAuth && _accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${_accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  // Token expired — attempt refresh
  if (response.status === 401 && !skipAuth) {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      window.location.href = '/staff';
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
        window.location.href = '/staff';
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
};

// ─── Domain API methods ───────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<{ users: AuthUser[]; total: number }>(`/users${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<AuthUser>(`/users/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/users/${id}/status`, { status }),
  updateInstructorProfile: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}/instructor-profile`, data),
  updateStudentProfile: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}/student-profile`, data),
};

export const programsApi = {
  list: () => api.get('/programs'),
  create: (data: Record<string, unknown>) => api.post('/programs', data),
  getCohorts: (programId: string) => api.get(`/programs/${programId}/cohorts`),
  createCohort: (programId: string, data: Record<string, unknown>) =>
    api.post(`/programs/${programId}/cohorts`, data),
  enrollStudent: (cohortId: string, studentId: string) =>
    api.post(`/programs/cohorts/${cohortId}/enroll`, { student_id: studentId }),
  getStudents: (cohortId: string) => api.get(`/programs/cohorts/${cohortId}/students`),
};

export const materialsApi = {
  list: (moduleId: string) => api.get(`/materials?module_id=${moduleId}`),
  upload: (moduleId: string, title: string, file: File) => {
    const form = new FormData();
    form.append('module_id', moduleId);
    form.append('title', title);
    form.append('file', file);
    return api.post('/materials', form);
  },
  updateProgress: (materialId: string, data: { progress_pct: number; last_position?: number }) =>
    api.post(`/materials/${materialId}/progress`, data),
};

export const assignmentsApi = {
  list: (cohortId: string) => api.get(`/assignments?cohort_id=${cohortId}`),
  create: (data: FormData) => api.post('/assignments', data),
  submit: (assignmentId: string, data: FormData) =>
    api.post(`/assignments/${assignmentId}/submit`, data),
  grade: (assignmentId: string, submissionId: string, score: number, feedback?: string) =>
    api.patch(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, { score, feedback }),
};

export const attendanceApi = {
  getForSession: (scheduleId: string) => api.get(`/attendance?schedule_id=${scheduleId}`),
  markBulk: (scheduleId: string, records: Array<{ student_id: string; status: string; note?: string }>) =>
    api.post('/attendance/bulk', { schedule_id: scheduleId, records }),
  getStudentHistory: (studentId: string) => api.get(`/attendance/student/${studentId}`),
};

export const scheduleApi = {
  getForCohort: (cohortId: string) => api.get(`/schedule?cohort_id=${cohortId}`),
  create: (data: Record<string, unknown>) => api.post('/schedule', data),
  cancel: (id: string) => api.patch(`/schedule/${id}/cancel`),
  getInstructorSchedule: (instructorId: string) => api.get(`/schedule/instructor/${instructorId}`),
};

export const testsApi = {
  list: (cohortId: string) => api.get(`/tests?cohort_id=${cohortId}`),
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
  getCohortGrades: (cohortId: string) => api.get(`/grades?cohort_id=${cohortId}`),
  getStudentGrades: (studentId: string) => api.get(`/grades/student/${studentId}`),
  recalculate: (studentId: string, cohortId: string) =>
    api.post('/grades/recalculate', { student_id: studentId, cohort_id: cohortId }),
};

export const groupsApi = {
  list: (cohortId: string) => api.get(`/groups?cohort_id=${cohortId}`),
  create: (data: { cohort_id: string; name: string; description?: string }) =>
    api.post('/groups', data),
  addMember: (groupId: string, studentId: string, role = 'member') =>
    api.post(`/groups/${groupId}/members`, { student_id: studentId, role }),
  removeMember: (groupId: string, studentId: string) =>
    api.delete(`/groups/${groupId}/members/${studentId}`),
  myGroups: () => api.get('/groups/mine'),
};

export const capstonesApi = {
  list: (cohortId: string) => api.get(`/capstones?cohort_id=${cohortId}`),
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

