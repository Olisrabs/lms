import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/admin/DashboardLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import ProgramsPage from './pages/admin/ProgramsPage';
import CohortsPage from './pages/admin/CohortsPage';
import StudentsPage from './pages/admin/StudentsPage';
import InstructorsPage from './pages/admin/InstructorsPage';
import ClassSchedulePage from './pages/admin/ClassSchedulePage';
import AssignmentsPage from './pages/admin/AssignmentsPage';
import TestsPage from './pages/admin/TestsPage';
import CapstonePage from './pages/admin/CapstonePage';
import GroupsPage from './pages/admin/GroupsPage';
import AttendancePage from './pages/admin/AttendancePage';
import GradesPage from './pages/admin/GradesPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import LandingPage from './pages/LandingPage';

// Instructor Imports
import InstructorLayout from './components/layout/instructor/InstructorLayout';
import InstructorDashboardOverview from './pages/instructor/InstructorDashboardOverview';
import InstructorCoursesPage from './pages/instructor/InstructorCoursesPage';
import InstructorModulesPage from './pages/instructor/InstructorModulesPage';
import InstructorMaterialsPage from './pages/instructor/InstructorMaterialsPage';
import InstructorTimetablePage from './pages/instructor/InstructorTimetablePage';
import InstructorAttendancePage from './pages/instructor/InstructorAttendancePage';
import InstructorAssignmentsPage from './pages/instructor/InstructorAssignmentsPage';
import InstructorTestsPage from './pages/instructor/InstructorTestsPage';
import InstructorGroupsPage from './pages/instructor/InstructorGroupsPage';
import InstructorCapstonePage from './pages/instructor/InstructorCapstonePage';
import InstructorGradesPage from './pages/instructor/InstructorGradesPage';
import InstructorPerformancePage from './pages/instructor/InstructorPerformancePage';
import InstructorAnnouncementsPage from './pages/instructor/InstructorAnnouncementsPage';
import InstructorProfilePage from './pages/instructor/InstructorProfilePage';
import InstructorSettingsPage from './pages/instructor/InstructorSettingsPage';

// Student Imports
import StudentLayout from './components/layout/student/StudentLayout';
import StudentDashboardOverview from './pages/student/StudentDashboardOverview';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import StudentCourseDetailsPage from './pages/student/StudentCourseDetailsPage';
import StudentLessonPage from './pages/student/StudentLessonPage';
import StudentTimetablePage from './pages/student/StudentTimetablePage';
import StudentAssignmentsPage from './pages/student/StudentAssignmentsPage';
import StudentTestsPage from './pages/student/StudentTestsPage';
import StudentTestTakingPage from './pages/student/StudentTestTakingPage';
import StudentGroupsPage from './pages/student/StudentGroupsPage';
import StudentCapstonePage from './pages/student/StudentCapstonePage';
import StudentCertificatesPage from './pages/student/StudentCertificatesPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';
import StudentAnnouncementsPage from './pages/student/StudentAnnouncementsPage';
import StudentOnboardingPage from './pages/student/StudentOnboardingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Onboarding Route */}
        <Route path="/onboarding" element={<StudentOnboardingPage />} />

        {/* Landing Page Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="cohorts" element={<CohortsPage />} />
          <Route path="courses" element={<ProgramsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="instructors" element={<InstructorsPage />} />
          <Route path="schedule" element={<ClassSchedulePage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="capstone" element={<CapstonePage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboardOverview />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:id" element={<StudentCourseDetailsPage />} />
          <Route path="courses/:id/lesson/:lessonId" element={<StudentLessonPage />} />
          <Route path="timetable" element={<StudentTimetablePage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="tests" element={<StudentTestsPage />} />
          <Route path="tests/:id" element={<StudentTestTakingPage />} />
          <Route path="groups" element={<StudentGroupsPage />} />
          <Route path="capstone" element={<StudentCapstonePage />} />
          <Route path="announcements" element={<StudentAnnouncementsPage />} />
          <Route path="certificates" element={<StudentCertificatesPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
        </Route>

        {/* Instructor Routes */}
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<InstructorDashboardOverview />} />
          <Route path="courses" element={<InstructorCoursesPage />} />
          <Route path="modules" element={<InstructorModulesPage />} />
          <Route path="materials" element={<InstructorMaterialsPage />} />
          <Route path="timetable" element={<InstructorTimetablePage />} />
          <Route path="attendance" element={<InstructorAttendancePage />} />
          <Route path="assignments" element={<InstructorAssignmentsPage />} />
          <Route path="tests" element={<InstructorTestsPage />} />
          <Route path="groups" element={<InstructorGroupsPage />} />
          <Route path="capstone" element={<InstructorCapstonePage />} />
          <Route path="grades" element={<InstructorGradesPage />} />
          <Route path="performance" element={<InstructorPerformancePage />} />
          <Route path="announcements" element={<InstructorAnnouncementsPage />} />
          <Route path="profile" element={<InstructorProfilePage />} />
          <Route path="settings" element={<InstructorSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
