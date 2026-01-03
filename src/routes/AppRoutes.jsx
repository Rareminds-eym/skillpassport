import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Loader from "../components/Loader";
import ProtectedRoute from "../components/ProtectedRoute";
import ScrollToTop from "../components/ScrollToTop";
import SubscriptionProtectedRoute from "../components/Subscription/SubscriptionProtectedRoute";

import AdminLayout from "../layouts/AdminLayout";
import EducatorLayout from "../layouts/EducatorLayout";
import PortfolioLayout from "../layouts/PortfolioLayout";
import PublicLayout from "../layouts/PublicLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import StudentLayout from "../layouts/StudentLayout";
//digital passport
import StudentDigitalPortfolioNav from '../components/digital-pp/ui/StudentDigitalPortfolioNav';
import { PortfolioProvider } from '../context/PortfolioContext';
import { ThemeProvider } from '../context/ThemeContext';
import { TestProvider } from '../context/assessment/TestContext';
import HomePage from '../pages/digital-pp/HomePage';
import DigitalPassportPage from '../pages/digital-pp/PassportPage';
import DigitalPortfolioPage from '../pages/digital-pp/PortfolioPage';
import DigitalSettingsPage from '../pages/digital-pp/SettingsPage';
import DigitalVideoPortfolioPage from '../pages/digital-pp/VideoPortfolioPage';
import DigitalExportSettings from '../pages/digital-pp/settings/ExportSettings';
import DigitalLayoutSettings from '../pages/digital-pp/settings/LayoutSettings';
import DigitalProfileSettings from '../pages/digital-pp/settings/ProfileSettings';
import DigitalSharingSettings from '../pages/digital-pp/settings/SharingSettings';
import DigitalThemeSettings from '../pages/digital-pp/settings/ThemeSettings';
// Duplicate imports removed - using the Digital* prefixed imports above

const Home = lazy(() => import("../pages/homepage/Home"));
const About = lazy(() => import("../pages/homepage/About"));
const Contact = lazy(() => import("../pages/homepage/Contact"));
const TermsAndConditions = lazy(() => import("../pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const PuterDemo = lazy(() => import("../pages/puter/PuterDemo"));
const SubscriptionPlans = lazy(() =>
  import("../pages/subscription/SubscriptionPlans")
);
const PaymentCompletion = lazy(() =>
  import("../pages/subscription/PaymentCompletion")
);
const PaymentSuccess = lazy(() =>
  import("../pages/subscription/PaymentSuccess")
);
const PaymentFailure = lazy(() =>
  import("../pages/subscription/PaymentFailure")
);
const MySubscription = lazy(() =>
  import("../pages/subscription/MySubscription")
);
const SubscriptionManage = lazy(() =>
  import("../pages/subscription/SubscriptionManage")
);
const AddOns = lazy(() =>
  import("../pages/subscription/AddOns")
);

// Event Sales (no auth required)
const EventSales = lazy(() =>
  import("../pages/event/EventSales")
);
const EventSalesSuccess = lazy(() =>
  import("../pages/event/EventSalesSuccess")
);
const EventSalesFailure = lazy(() =>
  import("../pages/event/EventSalesFailure")
);

const LoginStudent = lazy(() => import("../pages/auth/LoginStudent"));
const LoginRecruiter = lazy(() => import("../pages/auth/LoginRecruiter"));
const LoginAdmin = lazy(() => import("../pages/auth/LoginAdmin"));
const Register = lazy(() => import("../pages/auth/components/SignIn/Register"));
const UnifiedLogin = lazy(() => import("../pages/auth/UnifiedLogin"));
const UnifiedSignup = lazy(() => import("../pages/auth/UnifiedSignup"));
const UnifiedForgotPassword = lazy(() => import("../pages/auth/UnifiedForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const DebugRoles = lazy(() => import("../pages/auth/DebugRoles"));
const SignupRecruiter = lazy(() =>
  import("../pages/auth/components/SignIn/recruitment/SignupRecruiter")
);
const SignupAdmin = lazy(() =>
  import("../pages/auth/components/SignIn/recruitment/SignupAdmin")
);
const SignInSchool = lazy(() =>
  import("../pages/auth/components/SignIn/schools/SignInSchool")
);
const SignInUniversity = lazy(() =>
  import("../pages/auth/components/SignIn/university/SignInUniversity")
);
const UniversityAdmin = lazy(() =>
  import("../pages/auth/components/SignIn/university/UniversityAdmin")
);

// const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
// const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
// const Reports = lazy(() => import("../pages/admin/Reports"));

// Recruiter pages
const RecruiterProfile = lazy(() => import("../pages/recruiter/Profile"));
const RecruiterSettings = lazy(() => import("../pages/recruiter/Settings"));
const Overview = lazy(() => import("../pages/recruiter/Overview"));
const Requisitions = lazy(() => import("../pages/recruiter/Requisitions"));
const ApplicantsList = lazy(() => import("../pages/recruiter/ApplicantsList"));
const TalentPool = lazy(() => import("../pages/recruiter/TalentPool"));
const Pipelines = lazy(() => import("../pages/recruiter/Pipelines"));
const Shortlists = lazy(() => import("../pages/recruiter/Shortlists"));
const Interviews = lazy(() => import("../pages/recruiter/Interviews"));
const OffersDecisions = lazy(() =>
  import("../pages/recruiter/OffersDecisions")
);
const VerifiedWork = lazy(() => import("../pages/recruiter/VerifiedStudentWork"));
const Analytics = lazy(() => import("../pages/recruiter/Analytics"));
const Activities = lazy(() => import("../pages/recruiter/Activities"));
const RecruiterMessages = lazy(() => import("../pages/recruiter/Messages"));
const RecruiterAI = lazy(() => import("../pages/recruiter/RecruiterAI"));
const ProjectHiringWithNav = lazy(() => import("../pages/recruiter/ProjectHiringWithNav"));

const StudentDashboard = lazy(() => import("../pages/student/Dashboard"));
const Profile = lazy(() => import("../pages/student/Profile"));
const MySkills = lazy(() => import("../pages/student/MySkills"));
const MyLearning = lazy(() => import("../pages/student/MyLearning"));
const MyExperience = lazy(() => import("../pages/student/MyExperience"));
const Courses = lazy(() => import("../pages/student/Courses"));
const CoursePlayer = lazy(() => import("../pages/student/CoursePlayer"));
const Opportunities = lazy(() => import("../pages/student/Opportunities"));
const SavedJobs = lazy(() => import("../pages/student/SavedJobs"));
const Applications = lazy(() => import("../pages/student/Applications"));
const AppliedJobs = lazy(() => import("../pages/student/AppliedJobs"));
const BrowseJobs = lazy(() => import("../pages/student/BrowseJobs"));
const Messages = lazy(() => import("../pages/student/Messages"));
const StudentAnalytics = lazy(() => import("../pages/student/Analytics"));
const Assignments = lazy(() => import("../pages/student/Assignments"));
const MyClass = lazy(() => import("../pages/student/MyClass"));
const Clubs = lazy(() => import ("../pages/student/Clubs"))
const TimelinePage = lazy(() => import("../pages/student/TimelinePage"));
const AchievementsPage = lazy(() => import("../pages/student/AchievementsPage"));
const CareerAI = lazy(() => import("../features/career-assistant/components/CareerAssistant"));
const DebugQRTest = lazy(() => import("../pages/DebugQRTest"));
const StudentPublicViewer = lazy(() =>
  import("../components/Students/components/StudentPublicViewer")
);
const Settings = lazy(() => import("../pages/student/Settings"));
const AssessmentTest = lazy(() => import("../pages/student/AssessmentTest"));
const AssessmentResult = lazy(() => import("../pages/student/AssessmentResult"));
const AssessmentPlatform = lazy(() => import("../pages/student/AssessmentPlatform"));
const AssessmentTestPage = lazy(() => import("../pages/student/AssessmentTestPage"));
const AssessmentResults = lazy(() => import("../pages/student/AssessmentResults"));
const AssessmentStart = lazy(() => import("../pages/student/AssessmentStart"));
const DynamicAssessment = lazy(() => import("../pages/student/DynamicAssessment"));

// Educator pages
const EducatorDashboard = lazy(() => import("../pages/educator/Dashboard"));
const EducatorLogin = lazy(() => import("../pages/auth/LoginEducator"));
const EducatorStudents = lazy(() => import("../pages/educator/StudentsPage"));
const EducatorClasses = lazy(() => import("../pages/educator/ClassesPage"));
const EducatorAssessmentResults = lazy(() => import("../pages/educator/AssessmentResults"));

const EducatorCourses = lazy(() => import("../pages/educator/Courses"));
const EducatorBrowseCourses = lazy(() => import("../pages/educator/BrowseCourses"));
const EducatorAssessments = lazy(() => import("../pages/educator/Assessments"));
const EducatorMentorNotes = lazy(() => import("../pages/educator/MentorNotes"));
const EducatorSettings = lazy(() => import("../pages/educator/Settings"));
const EducatorProfile = lazy(() => import("../pages/educator/ProfileFixed"));
const EducatorProfileDebug = lazy(() => import("../pages/educator/ProfileDebug"));
const EducatorManagement = lazy(() => import("../pages/educator/EducatorManagement"));
const EducatorCommunication = lazy(() =>
  import("../pages/educator/Communication")
);
const SkillCurriculars = lazy(() => import("../pages/educator/SkillCurricular"))
const EducatorAnalytics = lazy(() => import("../pages/educator/Analytics"));
const EducatorActivities = lazy(() => import("../pages/educator/Activities"));
const EducatorReports = lazy(() => import("../pages/educator/Reports"));
const EducatorMediaManager = lazy(() =>
  import("../pages/educator/MediaManager")
);
const EducatorDigitalPortfolio = lazy(() =>
  import("../pages/educator/DigitalPortfolioPage")
);
const EducatorAI = lazy(() => import("../pages/educator/EducatorAI"));
const CourseAnalytics = lazy(() => import("../pages/educator/CourseAnalytics"));
const MarkAttendance = lazy(() => import("../pages/educator/MarkAttendance"));

// Teacher pages (for teachers using the system)
const LessonPlanCreate = lazy(() => import("../pages/teacher/LessonPlanCreate"));
const LessonPlansList = lazy(() => import("../pages/teacher/LessonPlansList"));
const MyTimetable = lazy(() => import("../pages/teacher/MyTimetable"));
const LessonPlanApprovals = lazy(() => import("../pages/admin/schoolAdmin/LessonPlanApprovals"));

// ===== Admins (Role-Based) =====
const CollegeDashboard = lazy(() =>
  import("../pages/admin/collegeAdmin/Dashboard")
);
const DepartmentManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/Departmentmanagement")
);
const CourseMapping = lazy(() =>
  import("../pages/admin/collegeAdmin/CourseMapping")
);
const StudentDataAdmission = lazy(() =>
  import("../pages/admin/collegeAdmin/Studentdataadmission")
);
const AdminEducatorManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/EducatorManagement")
);
const FacultyManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/FacultyManagement")
);
const ExaminationManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/ExaminationManagement")
);
const CollegeAdminDigitalPortfolio = lazy(() =>
  import("../pages/admin/collegeAdmin/DigitalPortfolio")
);
const StudentVerifications = lazy(() => import("../pages/admin/collegeAdmin/Verifications"))
const StudentCollegeAdminCommunications = lazy(() => import("../pages/admin/collegeAdmin/StudentCollegeAdminCommunication"))
const PlacementManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/PlacementManagement")
);
const SkillDevelopment = lazy(() =>
  import("../pages/admin/collegeAdmin/SkillDevelopment")
);
const EventManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/EventManagement")
);
const FinanceManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/FinanceManagement")
);
const ReportsAnalytics = lazy(() =>
  import("../pages/admin/collegeAdmin/ReportsAnalytics")
);

// Future: Add SchoolAdmin and UniversityAdmin dashboards here
const SchoolAdminDashboard = lazy(() =>
  import("../pages/admin/schoolAdmin/Dashboard")
);
const StudentAdmissions = lazy(() =>
  import("../pages/admin/schoolAdmin/StudentAdmissions")
);
const TeacherList = lazy(() =>
  import("../pages/admin/schoolAdmin/components/TeacherList")
);
const TeacherOnboarding = lazy(() =>
  import("../pages/admin/schoolAdmin/components/TeacherOnboarding")
);
const TeacherTimetable = lazy(() =>
  import("../pages/admin/schoolAdmin/components/TimetableBuilderEnhanced")
);
const UniversityAdminDashboard = lazy(() =>
  import("../pages/admin/universityAdmin/Dashboard")
);
const CollegeRegistration = lazy(() =>
  import("../pages/admin/universityAdmin/CollegeRegistration")
);
const StudentEnrollments = lazy(() =>
  import("../pages/admin/universityAdmin/StudentEnrollments")
);
const ContinuousAssessment = lazy(() =>
  import("../pages/admin/universityAdmin/ContinuousAssessment")
);
const PlacementReadiness = lazy(() =>
  import("../pages/admin/universityAdmin/PlacementReadiness")
);
const OutcomeBasedEducation = lazy(() =>
  import("../pages/admin/universityAdmin/OutcomeBasedEducation")
);
const AICounselling = lazy(() =>
  import("../pages/admin/universityAdmin/AICounselling")
);
const UniversityAdminCourses = lazy(() =>
  import("../pages/admin/universityAdmin/Courses")
);
const UniversityAdminDigitalPortfolio = lazy(() =>
  import("../pages/admin/universityAdmin/DigitalPortfolio")
);
const UniversityAdminAssessmentResults = lazy(() =>
  import("../pages/admin/universityAdmin/AssessmentResults")
);

const AttendanceTracking = lazy(() =>
  import("../pages/admin/collegeAdmin/Attendancetracking")
);
const GraduationEligibility = lazy(() =>
  import("../pages/admin/collegeAdmin/GraduationEligibility")
);
const CircularsManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/CircularsManagement")
);
const CollegeUserManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/UserManagement")
);
const CollegeCurriculumBuilder = lazy(() =>
  import("../pages/admin/collegeAdmin/CurriculumBuilder")
);
const CollegeAdminCourses = lazy(() =>
  import("../pages/admin/collegeAdmin/Courses")
);
const CollegeAdminAssessmentResults = lazy(() =>
  import("../pages/admin/collegeAdmin/AssessmentResults")
);
const LessonPlanManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/LessonPlanManagement")
);
const MentorAllocation = lazy(() =>
  import("../pages/admin/collegeAdmin/MentorAllocation")
);
const TranscriptGeneration = lazy(() =>
  import("../pages/admin/collegeAdmin/TranscriptGeneration")
);
const AcademicCalendar = lazy(() =>
  import("../pages/admin/collegeAdmin/AcademicCalendar")
);
const PerformanceMonitoring = lazy(() =>
  import("../pages/admin/collegeAdmin/PerformanceMonitoring")
);
const CollegeSettings = lazy(() =>
  import("../pages/admin/collegeAdmin/Settings")
);
const AcademicCoverageTracker = lazy(() =>
  import("../pages/admin/collegeAdmin/AcademicCoverageTracker")
);
const ProgramSectionManagement = lazy(() =>
  import("../pages/admin/collegeAdmin/ProgramSectionManagement")
);
const CollegeLibrary = lazy(() =>
  import("../pages/admin/collegeAdmin/Library")
);

const CurriculumBuilder = lazy(() =>
  import("../pages/admin/schoolAdmin/CurriculumBuilderWrapper")
);
const SchoolAdminCourses = lazy(() => import("../pages/admin/schoolAdmin/Courses"));
const SchoolAdminBrowseCourses = lazy(() => import("../pages/admin/schoolAdmin/BrowseCourses"));
const CollegeAdminBrowseCourses = lazy(() => import("../pages/admin/collegeAdmin/BrowseCourses"));
const UniversityAdminBrowseCourses = lazy(() => import("../pages/admin/universityAdmin/BrowseCourses"));
const LessonPlan = lazy(() => import("../pages/admin/schoolAdmin/LessonPlanWrapper"));
const ExamsAssessments = lazy(() =>
  import("../pages/admin/schoolAdmin/ExamsAssessments")
);

// Parent & Communication routes
const ParentPortal = lazy(() =>
  import("../pages/admin/schoolAdmin/ParentPortal")
);
const MessageCenter = lazy(() =>
  import("../pages/admin/schoolAdmin/MessageCenter")
);
const CircularsFeedback = lazy(() =>
  import("../pages/admin/schoolAdmin/CircularsFeedback")
);
const StudentMessages = lazy(() =>
  import("../pages/admin/schoolAdmin/StudentCommunication")
);

// skill && Curriculum Management
const SkillCurricular = lazy(() =>
  import("../pages/admin/schoolAdmin/SkillCurricular")
);
const SkillBadges = lazy(() =>
  import("../pages/admin/schoolAdmin/SkillBadges")
);
const Reports = lazy(() =>
  import("../pages/admin/schoolAdmin/Reports")
);
// Finance & infrastructure buddy
const FinanceInfrastructure = lazy(() => import("../pages/admin/schoolAdmin/FeeStructureSetup"))
const Library = lazy(() => import("../pages/admin/schoolAdmin/Library"))
const AttendanceReports = lazy(() =>
  import("../pages/admin/schoolAdmin/AttendanceReports")
);
const ClassManagement = lazy(() =>
  import("../pages/admin/schoolAdmin/ClassManagement")
);
const SchoolAdminAssessmentResults = lazy(() =>
  import("../pages/admin/schoolAdmin/AssessmentResults")
);
const SchoolAdminVerifications = lazy(() => import("../pages/admin/schoolAdmin/Verifications"))
// Settings
const SchoolAdminSettings = lazy(() =>
  import("../pages/admin/schoolAdmin/Settings")
);
const SchoolAdminDigitalPortfolio = lazy(() =>
  import("../pages/admin/schoolAdmin/DigitalPortfolio")
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <ScrollToTop />
      <Routes>
        {/* Event Sales - Standalone without layout (no header/footer) */}
        <Route path="/signup/plans" element={<EventSales />} />
        <Route path="/signup/plans/success" element={<EventSalesSuccess />} />
        <Route path="/signup/plans/failure" element={<EventSalesFailure />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/puter" element={<PuterDemo />} />

          {/* Legal Pages */}
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Unified Login */}
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/signup" element={<UnifiedSignup />} />
          <Route path="/forgot-password" element={<UnifiedForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/debug-roles" element={<DebugRoles />} />

          {/* Deprecated login routes - redirect to unified login */}
          <Route path="/login/student" element={<Navigate to="/login" replace />} />
          <Route path="/login/recruiter" element={<Navigate to="/login" replace />} />
          <Route path="/login/admin" element={<Navigate to="/login" replace />} />
          <Route path="/login/educator" element={<Navigate to="/login" replace />} />

          {/* Registration routes */}
          <Route path="/signup/recruitment" element={<Register />} />
          <Route path="/signup/:type" element={<Register />} />
          <Route
            path="/signup/recruitment-recruiter"
            element={<SignupRecruiter />}
          />
          <Route path="/signup/recruitment-admin" element={<SignupAdmin />} />
          <Route path="/signin/school" element={<SignInSchool />} />
          <Route path="/signin/university" element={<SignInUniversity />} />
          <Route
            path="/signup/university-admin"
            element={<UniversityAdmin />}
          />
          <Route path="/subscription/plans" element={<SubscriptionPlans />} />
          <Route path="/subscription/plans/:type" element={<SubscriptionPlans />} />
          <Route path="/subscription/plans/:type/:mode" element={<SubscriptionPlans />} />

          <Route path="/subscription/payment" element={<PaymentCompletion />} />
          <Route path="/subscription/payment/success" element={<PaymentSuccess />} />
          <Route path="/subscription/payment/failure" element={<PaymentFailure />} />
          <Route path="/subscription/manage" element={<SubscriptionManage />} />
          <Route path="/subscription/add-ons" element={<AddOns />} />
          {/* Legacy route - redirect to new manage route */}
          <Route
            path="/my-subscription"
            element={<Navigate to="/subscription/manage" replace />}
          />
          <Route path="/debug-qr" element={<DebugQRTest />} />
          <Route
            path="/student/profile/:studentId"
            element={<StudentPublicViewer />}
          />

        </Route>

        {/* Digital Portfolio routes (public) with PortfolioLayout (no footer) */}
        <Route element={<PortfolioLayout />}>
          <Route
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <Outlet />
                </PortfolioProvider>
              </ThemeProvider>
            }
          >
            <Route path="/portfolio" element={<DigitalPortfolioPage />} />
            <Route path="/digital-pp/homepage" element={<HomePage />} />
            <Route path="/passport" element={<DigitalPassportPage />} />
            <Route path="/video-portfolio" element={<DigitalVideoPortfolioPage />} />
            <Route path="/settings" element={<DigitalSettingsPage />} />
            {/* Settings sub-pages for digital passport */}
            <Route path="/settings/theme" element={<DigitalThemeSettings />} />
            <Route path="/settings/layout" element={<DigitalLayoutSettings />} />
            <Route path="/settings/export" element={<DigitalExportSettings />} />
            <Route path="/settings/sharing" element={<DigitalSharingSettings />} />
          </Route>
        </Route>

        {/* ---------- College Admin ---------- */}
        <Route
          path="/college-admin/*"
          element={
            <ProtectedRoute allowedRoles={["college_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<CollegeDashboard />} />

          {/* Department Management */}
          <Route path="departments/management" element={<DepartmentManagement />} />
          <Route path="departments/mapping" element={<CourseMapping />} />
          <Route path="departments/educators" element={<FacultyManagement />} />

          {/* Student Lifecycle Management */}
          <Route path="students/data-management" element={<StudentDataAdmission />} />
          <Route path="students/attendance" element={<AttendanceTracking />} />
          <Route path="students/performance" element={<PerformanceMonitoring />} />
          <Route path="students/assessment-results" element={<CollegeAdminAssessmentResults />} />
          <Route path="students/graduation" element={<GraduationEligibility />} />
          <Route path="students/digital-portfolio" element={<CollegeAdminDigitalPortfolio />} />
          <Route path="students/verifications" element={<StudentVerifications />} />
          <Route path="students/communication" element={<StudentCollegeAdminCommunications />} />
          {/* Academic Management */}
          <Route path="academics/courses" element={<CollegeAdminCourses />} />
          <Route path="academics/browse-courses" element={<CollegeAdminBrowseCourses />} />
          <Route path="academics/curriculum" element={<CollegeCurriculumBuilder />} />
          <Route path="academics/lesson-plans" element={<LessonPlanManagement />} />
          <Route path="academics/coverage-tracker" element={<AcademicCoverageTracker />} />
          <Route path="academics/program-sections" element={<ProgramSectionManagement />} />
          <Route path="academics/calendar" element={<AcademicCalendar />} />

          {/* Examination Management */}
          <Route path="examinations" element={<ExaminationManagement />} />
          <Route path="examinations/transcripts" element={<TranscriptGeneration />} />

          {/* Training & Skill Development */}
          <Route path="skill-development" element={<SkillDevelopment />} />

          {/* Placement Management */}
          <Route path="placements" element={<PlacementManagement />} />

          {/* Mentor Allocation */}
          <Route path="mentors" element={<MentorAllocation />} />

          {/* Communication */}
          <Route path="circulars" element={<CircularsManagement />} />

          {/* Events */}
          <Route path="events" element={<EventManagement />} />

          {/* Finance & Accounts */}
          <Route path="finance" element={<FinanceManagement />} />

          {/* Library & Assets */}
          <Route path="library" element={<CollegeLibrary />} />

          {/* Reports & Analytics */}
          <Route path="reports" element={<ReportsAnalytics />} />

          {/* User Management */}
          <Route path="users" element={<CollegeUserManagement />} />

          {/* Settings */}
          <Route path="settings" element={<CollegeSettings />} />

          <Route path="" element={<Navigate to="/college-admin/dashboard" replace />} />
        </Route>

        <Route
          path="/school-admin/*"
          element={
            <ProtectedRoute allowedRoles={["school_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SchoolAdminDashboard />} />
          <Route path="students/admissions" element={<StudentAdmissions />} />
          <Route path="students/attendance-reports" element={<AttendanceReports />} />
          <Route path="students/assessment-results" element={<SchoolAdminAssessmentResults />} />
          <Route path="students/verifications" element={<SchoolAdminVerifications  />} />
          <Route path="students/digital-portfolio" element={<SchoolAdminDigitalPortfolio />} />
          <Route path="classes/management" element={<ClassManagement />} />
          <Route path="courses" element={<SchoolAdminCourses />} />
          <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
          <Route path="teachers/list" element={<TeacherList />} />
          <Route path="teachers/onboarding" element={<TeacherOnboarding />} />
          <Route path="teachers/timetable" element={<TeacherTimetable />} />
          <Route path="lesson-plans/approvals" element={<LessonPlanApprovals />} />
          {/* Academic Management System Routes */}
          <Route path="academics/courses" element={<SchoolAdminCourses />} />
          <Route path="academics/browse-courses" element={<SchoolAdminBrowseCourses />} />
          <Route path="academics/curriculum" element={<CurriculumBuilder />} />
          <Route path="academics/lesson-plans" element={<LessonPlan />} />
          <Route path="academics/exams" element={<ExamsAssessments />} />
          {/* Parent & Communication Routes */}
          <Route path="communication/parents" element={<ParentPortal />} />
          <Route path="communication/messages" element={<MessageCenter />} />
          <Route
            path="communication/circulars"
            element={<CircularsFeedback />}
          />
          <Route path="communication/messages-student" element={<StudentMessages />} />
          {/* Skill & Curriculum Manament*/}
          <Route path="skills/clubs" element={<SkillCurricular />} />
          <Route path="skills/badges" element={<SkillBadges />} />
          <Route path="skills/reports" element={<Reports />} />
          <Route path="finance/fees" element={<FinanceInfrastructure />} />
          <Route path="infrastructure/library" element={<Library />} />
          {/* Finance & Infrastructure*/}

          {/* Settings */}
          <Route path="settings" element={<SchoolAdminSettings />} />
          <Route
            path=""
            element={<Navigate to="/school-admin/dashboard" replace />}
          />
        </Route>

        <Route
          path="/university-admin/*"
          element={
            <ProtectedRoute allowedRoles={["university_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<UniversityAdminDashboard />} />
          <Route path="colleges/registration" element={<CollegeRegistration />} />
          <Route path="courses" element={<UniversityAdminCourses />} />
          <Route path="browse-courses" element={<UniversityAdminBrowseCourses />} />
          <Route path="students/enrollments" element={<StudentEnrollments />} />
          <Route path="students/digital-portfolios" element={<UniversityAdminDigitalPortfolio />} />
          <Route path="students/assessment-results" element={<UniversityAdminAssessmentResults />} />
          <Route path="students/continuous-assessment" element={<ContinuousAssessment />} />
          <Route path="placements/readiness" element={<PlacementReadiness />} />
          <Route path="analytics/obe-tracking" element={<OutcomeBasedEducation />} />
          <Route path="ai-counselling" element={<AICounselling />} />
          <Route
            path=""
            element={<Navigate to="/university-admin/dashboard" replace />}
          />
        </Route>

        <Route
          path="/recruitment/*"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <RecruiterLayout />
            </ProtectedRoute>
          }
        >
          <Route path="overview" element={<Overview />} />
          <Route path="projects" element={<ProjectHiringWithNav />} />
          {/* <Route path="talent-scout" element={<RecruiterAI />} /> */}
          <Route path="talent-pool" element={<TalentPool />} />
          <Route path="requisition" element={<Requisitions />} />
          <Route path="requisition/applicants" element={<ApplicantsList />} />
          <Route path="pipelines" element={<Pipelines />} />
          <Route path="shortlists" element={<Shortlists />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="offers-decisions" element={<OffersDecisions />} />
          <Route path="verified-work" element={<VerifiedWork />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="activities" element={<Activities />} />
          <Route path="messages" element={<RecruiterMessages />} />
          <Route path="profile" element={<RecruiterProfile />} />
          <Route path="settings" element={<RecruiterSettings />} />
          <Route
            path="*"
            element={<Navigate to="/recruitment/overview" replace />}
          />
        </Route>

        <Route
          path="/student/*"
          element={
            <SubscriptionProtectedRoute 
              allowedRoles={["student", "school_student", "college_student"]}
              requireSubscription={true}
              subscriptionFallbackPath="/subscription/plans"
            >
              <StudentLayout />
            </SubscriptionProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="dashboard/:id" element={<Profile />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:email" element={<Profile />} />
          <Route path="my-skills" element={<MySkills />} />
          <Route path="my-learning" element={<MyLearning />} />
          <Route path="my-training" element={<MyLearning />} /> {/* Redirect old route */}
          <Route path="my-experience" element={<MyExperience />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="saved-jobs" element={<SavedJobs />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applied-jobs" element={<AppliedJobs />} />
          <Route path="browse-jobs" element={<BrowseJobs />} />
          <Route path="messages" element={<Messages />} />
          <Route path="career-ai" element={<CareerAI />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="my-class" element={<MyClass />} />
          <Route path="assignments" element={<Navigate to="/student/my-class" replace />} />
          <Route path="clubs" element={<Clubs />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="assessment-report" element={<AssessmentTest />} /> {/* Keep old path for backward compat if needed, or redirect */}
          <Route path="assessment/test" element={<AssessmentTest />} />
          <Route path="assessment/result" element={<AssessmentResult />} />
          <Route path="assessment/platform" element={<AssessmentStart />} />
          <Route path="assessment/dynamic" element={<DynamicAssessment />} />
          <Route path="assessment/start" element={<TestProvider><AssessmentTestPage /></TestProvider>} />
          <Route path="assessment/results" element={<TestProvider><AssessmentResults /></TestProvider>} />

          {/* Digital Portfolio routes with required providers */}
          <Route
            path="digital-portfolio"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <HomePage />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/portfolio"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalPortfolioPage />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/passport"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalPassportPage />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/video"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalVideoPortfolioPage />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/settings"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalSettingsPage />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/settings/theme"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalThemeSettings />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/settings/layout"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalLayoutSettings />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/settings/export"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalExportSettings />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/settings/sharing"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalSharingSettings />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="digital-portfolio/settings/profile"
            element={
              <ThemeProvider>
                <PortfolioProvider>
                  <div className="-mx-6 -my-8">
                    <StudentDigitalPortfolioNav />
                    <DigitalProfileSettings />
                  </div>
                </PortfolioProvider>
              </ThemeProvider>
            }
          />

          <Route
            path=""
            element={<Navigate to="/student/dashboard" replace />}
          />
        </Route>

        <Route
          path="/educator/*"
          element={
            <ProtectedRoute allowedRoles={["educator"]}>
              <EducatorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<EducatorDashboard />} />
          <Route path="ai-copilot" element={<EducatorAI />} />
          <Route path="students" element={<EducatorStudents />} />
          <Route path="classes" element={<EducatorClasses />} />
          <Route path="courses" element={<EducatorCourses />} />
          <Route path="browse-courses" element={<EducatorBrowseCourses />} />
          <Route path="courses/:courseId/analytics" element={<CourseAnalytics />} />
          <Route path="assessment-results" element={<EducatorAssessmentResults />} />
          <Route path="assignments" element={<EducatorAssessments />} />
          <Route path="mentornotes" element={<EducatorMentorNotes />} />
          <Route path="digital-portfolio" element={<EducatorDigitalPortfolio />} />
          <Route path="settings" element={<EducatorSettings />} />
          <Route path="profile" element={<EducatorProfile />} />
          <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
          <Route path="profile-debug" element={<EducatorProfileDebug />} />
          <Route path="management" element={<EducatorManagement />} />
          <Route path="communication" element={<EducatorCommunication />} />
          <Route path="analytics" element={<EducatorAnalytics />} />
          <Route path="activities" element={<EducatorActivities />} />
          <Route path="reports" element={<EducatorReports />} />
          <Route path="media" element={<EducatorMediaManager />} />
          <Route path="lesson-plans" element={<LessonPlansList />} />
          <Route path="lesson-plans/create" element={<LessonPlanCreate />} />
          <Route path="my-timetable" element={<MyTimetable />} />
          <Route path="mark-attendance" element={<MarkAttendance />} />
          <Route path="clubs" element={<SkillCurriculars />} />
          <Route
            path=""
            element={<Navigate to="/educator/dashboard" replace />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;