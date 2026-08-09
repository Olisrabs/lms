# Make It Simple LMS - Architecture Guide (A-Z)

## 1. Project Overview

**Make It Simple** is a full-stack Learning Management System with three user roles:

| Role | What they do |
|---|---|
| **Admin** | Manages the entire platform - programs, cohorts, students, instructors |
| **Instructor** | Teaches a cohort - schedules classes, creates assignments, grades students |
| **Student** | Enrols in a cohort - takes tests, submits assignments, views grades |

The project is a **monorepo** - one root folder contains both frontend and backend:

```
lms/                  <- root (frontend lives here)
├── src/              <- React frontend source
├── server/           <- Express backend source
├── index.html
├── vite.config.ts
└── package.json
```

---

## 2. Technology Stack

### Frontend (lms/)

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite 5 | Dev server and bundler |
| TailwindCSS 4 | Utility-first styling |
| React Router v6 | Client-side routing |
| Framer Motion | Animations |
| Recharts | Charts on dashboards |
| Lucide React | Icon library |

### Backend (lms/server/)

| Tool | Purpose |
|---|---|
| Express 4 | HTTP server framework |
| TypeScript | Type safety |
| ts-node + nodemon | Dev server with hot reload |
| Supabase JS SDK | PostgreSQL client |
| jsonwebtoken | JWT signing and verification |
| bcryptjs | Password and refresh token hashing |
| zod | Request body validation |
| helmet | HTTP security headers |
| cors | Cross-origin request handling |
| compression | gzip responses |
| morgan | HTTP request logging |
| express-rate-limit | Brute-force protection |
| multer | File upload handling |
| sharp | Image processing |
| fluent-ffmpeg | Video processing |
| winston | Structured server logging |
| node-cache | In-memory session cache (L1) |
| ioredis | Redis session cache (L2, optional) |
| socket.io | Real-time capability (scaffolded) |
| bull | Job queue (scaffolded) |

### Database

| Tool | Purpose |
|---|---|
| PostgreSQL | Relational database (hosted on Supabase) |
| Supabase | Managed Postgres + Auth + Storage |
| Row Level Security (RLS) | Database-level access control |

---

## 3. How the Two Servers Run

Both servers run simultaneously in development:

```
Terminal 1:  cd lms         ->  npm run dev  ->  Vite on http://localhost:5173
Terminal 2:  cd lms/server  ->  npm run dev  ->  Express on http://localhost:4000
```

The frontend is configured to call the backend at:

```
VITE_API_URL = http://localhost:4000/api/v1   (set in .env)
```

In production, they can be deployed separately (e.g. Vercel for frontend, Render for backend).

---

## 4. Frontend Architecture

### Entry Point Flow

```
index.html
  -> main.tsx       (mounts React app to #root)
       -> App.tsx   (wraps everything in AuthProvider + BrowserRouter)
             -> Routes (React Router v6 - all routes defined here)
```

### Folder Structure (src/)

```
src/
├── main.tsx                  <- React DOM entry point
├── App.tsx                   <- Root router (all routes defined here)
├── index.css                 <- Global styles + CSS design tokens
├── contexts/
│   └── AuthContext.tsx       <- Global auth state (user, signIn, signOut)
├── lib/
│   └── api.ts                <- Centralized HTTP client + all API methods
├── components/
│   ├── ProtectedRoute.tsx    <- Route guard (checks auth + role + status)
│   ├── ThemeToggle.tsx       <- Dark/light mode button
│   └── layout/
│       ├── admin/
│       │   ├── Sidebar.tsx         <- Admin nav links
│       │   ├── DashboardLayout.tsx <- Admin shell (sidebar + topbar + outlet)
│       │   └── Topbar.tsx
│       ├── instructor/
│       │   ├── InstructorSidebar.tsx
│       │   └── InstructorLayout.tsx
│       └── student/
│           ├── StudentSidebar.tsx
│           └── StudentLayout.tsx
└── pages/
    ├── LandingPage.tsx       <- Public marketing page
    ├── BootcampPage.tsx      <- Public bootcamp info page
    ├── SignInPage.tsx        <- Student sign-in
    ├── SignUpPage.tsx        <- Student sign-up
    ├── staff/                <- Admin/Instructor auth pages
    ├── admin/                <- 16 admin pages
    ├── instructor/           <- 18 instructor pages
    └── student/              <- 21 student pages
```

### Layout Pattern (React Router Outlet)

Each role uses a layout shell. The layout renders a sidebar, topbar, and a `<Outlet />` where the active page slots in:

```
DashboardLayout (admin)
  ├── Sidebar (fixed left nav)
  ├── Topbar (cohort selector + user menu)
  └── <Outlet />   <- active page renders here
```

The layout also passes shared state down to child pages via `useOutletContext()`:
- `selectedCohortId` - the currently viewed cohort
- `setSelectedCohortId` - lets pages switch cohort
- `cohorts` - full list of cohorts for the dropdown selector

### ProtectedRoute Logic (4 checks, in order)

```
1. isLoading?              -> show spinner (restoring session from sessionStorage)
2. !isAuthenticated?       -> redirect to /staff
3. role not in allowedRoles? -> redirect to correct dashboard for that role
4. status !== 'active'?    -> show "Account Pending" screen
5. All good                -> render children
```

---

## 5. Authentication Flow (End-to-End)

### Sign In

```
User submits form -> authApi.signIn(email, password, role)
  -> POST /api/v1/auth/signin
       -> backend: find user by email
       -> bcrypt.compare(password, hash)
       -> issue: access_token (JWT, 15 min) + refresh_token (7 days)
       -> refresh_token is bcrypt-hashed and stored in refresh_tokens table
  -> setTokens(access_token, refresh_token)
       -> access_token: stored in memory variable _accessToken  [XSS-safe]
       -> refresh_token: stored in sessionStorage('edule_refresh')
  -> user object stored in sessionStorage('edule_session_user')
  -> AuthContext.user updated -> React re-renders -> navigate to dashboard
```

### Session Restore (Page Refresh)

When the user refreshes the browser, the in-memory access token is lost. AuthProvider restores the session on mount:

```
AuthProvider mounts -> reads sessionStorage('edule_refresh')
  -> POST /api/v1/auth/refresh -> new access_token + refresh_token
  -> GET /api/v1/auth/me -> user object
  -> setUser(me) -> app resumes as if never refreshed
```

### Auto Token Refresh on 401

The `doFetch()` wrapper intercepts every 401 response automatically:

```
API call returns 401 (token expired)
  -> doFetch() intercepts
  -> POST /api/v1/auth/refresh -> new access_token
  -> retry original request with new token
  -> if multiple requests 401 simultaneously, only ONE refresh fires
     (others are queued via subscriber pattern and retried after)
  -> if refresh also fails -> clearTokens() + redirect to /staff
```

### Sign Out

```
authApi.signOut() -> POST /api/v1/auth/signout
  -> backend: marks refresh_token as revoked in DB
  -> clearTokens() -> clears _accessToken + sessionStorage
  -> setUser(null) -> React re-renders -> redirect to /
```

---

## 6. Backend Architecture

### Express App Setup (server/src/index.ts)

Middleware applied in order on every request:

```
1. helmet()            - security headers (XSS, clickjacking, MIME sniffing)
2. cors()              - whitelist localhost:5173 + production client URL
3. OPTIONS preflight   - never rate-limited or blocked
4. compression()       - gzip all responses over 1KB
5. express.json()      - parse JSON bodies (10MB limit)
6. express.urlencoded  - parse form data
7. morgan()            - log every request
8. trust proxy         - correct IP detection behind Nginx/Render
9. globalLimiter       - 100 requests / 15 min per IP
Auth endpoints also get: authLimiter - 20 attempts / 15 min
```

### Route Modules (server/src/routes/)

| Mount Path | Route File | Purpose |
|---|---|---|
| /api/v1/auth | auth.routes.ts | Sign up, sign in, refresh, sign out, change password |
| /api/v1/users | users.routes.ts | User CRUD, profiles, admin dashboard stats |
| /api/v1/programs | programs.routes.ts | Programs, cohorts, enrollment, instructor assignment, courses |
| /api/v1/assignments | assignments.routes.ts | Create, list, submit, grade |
| /api/v1/tests | tests.routes.ts | Create, publish, attempt, grade |
| /api/v1/grades | grades.routes.ts | Grade book, recalculation |
| /api/v1/schedule | schedule.routes.ts | Class schedule CRUD |
| /api/v1/attendance | attendance.routes.ts | Mark and view attendance |
| /api/v1/groups | groups.routes.ts | Group management |
| /api/v1/capstones | capstones.routes.ts | Final project submission and review |
| /api/v1/materials | materials.routes.ts | Upload and serve learning content |
| /api/v1/announcements | announcements.routes.ts | Cohort and platform broadcasts |
| /api/v1/notifications | notifications.routes.ts | In-app notification feed |

### Middleware on a Protected Route

```typescript
router.get('/resource', authenticate, authorize('admin'), handler)
```

`authenticate` steps:
1. Extract `Bearer <token>` from the `Authorization` header
2. `verifyAccessToken(token)` - decode JWT, check expiry and signature
3. Check in-memory session cache (`node-cache`) by user id
4. If cache miss -> query Supabase `users` table -> repopulate cache
5. Check `user.status !== 'suspended'`
6. Attach `req.user` and call `next()`

`authorize(...roles)`:
Checks `roles.includes(req.user.role)`. Returns 403 if not.

Additional middleware:
- `requireSelfOrAdmin` - allows access only if the user owns the resource OR is an admin
- `requireActiveAccount` - blocks pending/inactive users from protected resources

---

## 7. Database Architecture

### Design Principles

- **UUID primary keys** - prevents ID enumeration attacks
- **Normalized to 3NF** - no data redundancy
- **`created_at` / `updated_at`** on every table (auto-updated by trigger)
- **JSONB** for flexible metadata without schema rigidity
- **CHECK constraints** for domain integrity (dates, scores)
- **Indexes** on every foreign key and high-cardinality filter column
- **Row Level Security (RLS)** enabled on all user-facing tables

### Table Relationships

```
programs (curriculum blueprint)
  └── cohorts (a running instance of a program)
        ├── enrollments              <- students enrolled
        ├── cohort_instructors       <- instructors assigned
        ├── class_schedules          <- timetable entries
        │     ├── attendance_sessions  <- instructor-opened code windows
        │     └── attendance         <- per-student, per-session records
        │           (self_marked flag + session_id FK)
        ├── assignments
        │     └── submissions        <- student work
        ├── tests
        │     └── test_attempts      <- student answers and scores
        ├── grades                   <- aggregated grade book
        ├── groups
        │     └── group_members
        ├── capstones                <- final projects
        └── announcements

programs
  └── courses (subject areas)
        └── modules (topic groups)
              └── materials          <- videos, PDFs, links, etc.
                    └── material_progress  <- per-student consumption

users
  ├── instructor_profiles  (bio, skills, specialization)
  ├── student_profiles     (education, interests, github)
  ├── refresh_tokens       (hashed, for session management)
  ├── notifications        (in-app notification feed)
  └── audit_logs           (append-only change log)
```

### ENUM Types

| Type | Values |
|---|---|
| user_role | admin, instructor, student |
| user_status | active, inactive, suspended, pending |
| cohort_status | upcoming, active, completed, archived |
| assignment_type | individual, group |
| submission_status | pending, submitted, graded, late, missing |
| attendance_status | present, absent, late, excused |
| capstone_status | draft, submitted, reviewing, approved, rejected |
| schedule_type | lecture, lab, workshop, exam, office_hours |
| content_type | video, pdf, image, audio, document, link |

### Two Supabase Clients

```typescript
supabaseAnon    // anon key - honours RLS - for user-scoped queries
supabaseAdmin   // service role key - BYPASSES RLS - only used server-side
                // after middleware has already verified authorization
```

---

## 8. Frontend API Client (src/lib/api.ts)

All HTTP calls go through this one file. No page uses raw `fetch()` directly.

### Token Storage Strategy

```
_accessToken   -> module-level memory variable  (XSS-safe, lost on refresh)
refresh_token  -> sessionStorage('edule_refresh') (survives refresh, 7 days)
```

### doFetch() - The Core Wrapper

Every API call passes through this function:

1. Adds `Content-Type: application/json` (skipped automatically for FormData)
2. Injects `Authorization: Bearer <_accessToken>`
3. Makes the fetch call
4. On **401**: triggers token refresh with subscriber queue (only one refresh at a time)
5. On **non-OK**: throws structured error `{ status, ...body }`
6. On **success**: returns `response.json()`

### API Namespaces Exported

```
authApi          signIn, signUp, signUpAdmin, signOut, me, changePassword
usersApi         list, get, updateProfile, updateStatus, getAdminDashboardStats
programsApi      list, create, update, getCohorts, enrollStudent, listAllCohorts
coursesApi       list, create, update, delete
materialsApi     list, upload, updateProgress
assignmentsApi   list, create, submit, grade
attendanceApi    list, getForSession, markBulk, updateRecord, getStudentHistory, getSessions, openSession, closeSession, getActiveSession, selfMark, getTodaySchedule
scheduleApi      getForCohort, create, cancel, getInstructorSchedule
testsApi         list, get, create, publish, submit, getAttempts, gradeAttempt
gradesApi        getCohortGrades, getStudentGrades, recalculate
groupsApi        list, create, addMember, removeMember, myGroups
capstonesApi     list, submit, review
announcementsApi list, create, update, delete
notificationsApi list, markRead, markAllRead, delete
```

---

## 9. Complete Route Map

### Public Routes (no auth required)

| URL | Page |
|---|---|
| / | LandingPage |
| /bootcamp | BootcampPage |
| /signin | SignInPage (student) |
| /signup | SignUpPage (student) |
| /staff | StaffSignInPage (admin + instructor) |
| /staff/signup | InstructorSignUpPage |
| /staff/admin | AdminSignUpPage (requires admin_key) |
| /onboarding | StudentOnboardingPage |
| /instructor/onboarding | InstructorOnboardingPage |

### Admin Routes (/admin/* - role: admin)

| URL | Page |
|---|---|
| /admin | Dashboard Overview |
| /admin/programs | Programs management |
| /admin/cohorts | Cohorts management |
| /admin/students | Students list |
| /admin/instructors | Instructors list |
| /admin/assignments | Assignments (view only) |
| /admin/tests | Tests (view + publish toggle) |
| /admin/capstone | Capstone projects |
| /admin/groups | Groups (view only) |
| /admin/attendance | Attendance records |
| /admin/grades | Grade book |
| /admin/announcements | Announcements |
| /admin/reports | Reports |
| /admin/settings | Platform settings |

### Instructor Routes (/instructor/* - role: instructor)

| URL | Page |
|---|---|
| /instructor | Dashboard Overview |
| /instructor/schedule | Class schedule + Create classes |
| /instructor/assignments | Assignments + **Create Assignment** |
| /instructor/tests | Tests |
| /instructor/grades | Gradebook |
| /instructor/attendance | Mark attendance |
| /instructor/groups | Groups |
| /instructor/capstone | Capstone review |
| /instructor/courses | Course content |
| /instructor/modules | Modules |
| /instructor/materials | Learning materials |
| /instructor/performance | Student performance |
| /instructor/announcements | Announcements |
| /instructor/profile | Profile |
| /instructor/settings | Settings |

### Student Routes (/student/* - role: student)

| URL | Page |
|---|---|
| /student | Dashboard Overview |
| /student/classes | **My Classes** (Cohort & Program specific schedules) |
| /student/timetable | Timetable |
| /student/attendance | **Mark Attendance** (code entry + history) |
| /student/assignments | My Assignments |
| /student/tests | Available Tests |
| /student/tests/:id | Test Taking |
| /student/groups | My Groups |
| /student/capstone | Capstone Submission |
| /student/announcements | Announcements |
| /student/certificates | Certificates |
| /student/profile | Profile |
| /student/settings | Settings |

---

## 10. A Full Request - End to End

Example: An instructor opens the Assignments page and creates an assignment.

```
1. Browser navigates to /instructor/assignments

2. React Router matches -> renders InstructorLayout
   -> InstructorAssignmentsPage mounts

3. useEffect fires -> programsApi.listAllCohorts()
   -> doFetch('GET', '/programs/all-cohorts')
   -> adds Authorization: Bearer <_accessToken>
   -> fetch('http://localhost:4000/api/v1/programs/all-cohorts')

4. Express receives request:
   -> globalLimiter: checks rate limit OK
   -> programs.routes.ts: matches GET /all-cohorts
   -> authenticate middleware:
        -> extracts Bearer token
        -> verifyAccessToken() - checks signature + expiry
        -> checks node-cache session store
        -> if miss: queries Supabase users table, caches result
        -> attaches req.user = { sub, role: 'instructor', status: 'active' }
   -> authorize('instructor', 'admin'): role matches OK
   -> handler: supabaseAdmin.from('cohorts').select(...)
   -> returns JSON array of cohorts

5. doFetch() returns data -> setCohorts(list) -> React re-renders
   -> cohort dropdown populates

6. Instructor clicks "Create Assignment" -> modal opens
   -> fills form -> submits

7. handleCreateAssignment() fires
   -> assignmentsApi.create(formData)
   -> doFetch('POST', '/assignments', formData)

8. Server receives POST /api/v1/assignments:
   -> authenticate + authorize('instructor', 'admin') OK
   -> multer parses FormData fields
   -> zod validates required fields (cohort_id, title, due_date)
   -> supabaseAdmin.from('assignments').insert({...})
   -> returns created assignment JSON

9. Modal closes, list refreshes
```

---

## 11. Role Permission Summary

| Feature | Admin | Instructor | Student |
|---|---|---|---|
| Create programs | Yes | No | No |
| Create cohorts | Yes | No | No |
| Enrol students | Yes | No | No |
| Assign instructors | Yes | No | No |
| Create assignments | No | Yes | No |
| Create tests | No | Yes | No |
| Grade submissions | No | Yes | No |
| Open attendance session / generate code | No | Yes | No |
| Close / edit attendance records | No | Yes | No |
| Self-mark attendance (via code) | No | No | Yes |
| Download attendance report | No | Yes | No |
| Schedule classes | No | Yes | No |
| Submit assignments | No | No | Yes |
| Take tests | No | No | Yes |
| View grades | All cohorts | Own cohort | Own only |
| Post announcements | Yes | Yes | No |
| Create groups | No | No | No (admin manages) |

---

## 12. Security Layers

| Layer | Mechanism |
|---|---|
| HTTP headers | helmet() - XSS, clickjacking, MIME sniffing protection |
| Rate limiting | 100 req/15min global; 20 req/15min on /auth/* routes |
| CORS | Only whitelisted origins (localhost:5173 + production URL) |
| JWT | Short-lived access tokens (15 min), signed with JWT_SECRET env var |
| Refresh tokens | bcrypt-hashed in DB; rotated on every use; revocable per-session |
| Token storage | Access token in memory only (not localStorage - XSS safe) |
| Route guards | ProtectedRoute client-side + authenticate/authorize server-side |
| Row Level Security | DB policies - users see only their own rows by default |
| Admin key | Admin registration requires secret ADMIN_SIGNUP_KEY env var |
| Account status | pending/suspended users blocked at client AND server |
| Audit logs | Append-only table records all sensitive operations |

---

## 13. Key Conventions

**Architecture:**
- Pages never import from each other. Shared data flows through `useOutletContext()` or `useAuth()`.
- All HTTP calls go through `api.ts`. No component uses raw `fetch()` directly.
- `supabaseAdmin` lives only in `server/` - never sent to the client.

**Forms and files:**
- `FormData` is used for file uploads. `doFetch()` detects `instanceof FormData` and skips `Content-Type: application/json` automatically.

**UI:**
- Animations use Framer Motion (page transitions, modals, card entrances, staggered lists).
- Icons from Lucide React only - consistent visual language throughout.
- CSS design tokens defined in `index.css` as CSS variables (`--primary`, `--background`, `--border`, etc.) and consumed by Tailwind utilities.

**Dashboard data:**
- The admin dashboard's activity feed, capstone chart, and enrollment chart are derived from live database queries to `/users/admin/dashboard-stats`, not mock data.
- Activities are capped at 3 items in the Recent Activity feed.
- Auto-refreshes every 30 seconds via `setInterval`.
