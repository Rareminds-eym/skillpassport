import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { SubscriptionProtectedRoute } from "@/features/subscription";
import { OrganizationGuard } from "@/app/guards";
import AdminLayout from "../layouts/AdminLayout";

// Role constants
const COLLEGE_ADMIN_ROLES = ["college_admin"];
const SCHOOL_ADMIN_ROLES = ["school_admin"];
const UNIVERSITY_ADMIN_ROLES = ["university_admin"];

// Shared imports
const CoursePlayer = lazy(() => import("@/pages/learner/CoursePlayer"));
const SubscriptionManage = lazy(() =>
  import("@/pages/subscription/SubscriptionManage")
);
const AddOns = lazy(() =>
  import("@/pages/subscription/AddOns")
);
const OrganizationSubscriptionPage = lazy(() =>
  import("@/pages/subscription/OrganizationSubscriptionPage")
);
const BulkPurchasePage = lazy(() =>
  import("@/pages/subscription/BulkPurchasePage")
);
const OrganizationPaymentPage = lazy(() =>
  import("@/pages/subscription/OrganizationPaymentPage")
);
const MemberSubscriptionPage = lazy(() =>
  import("@/pages/subscription/MemberSubscriptionPage")
);

// College Admin imports
const CollegeDashboard = lazy(() =>
  import("@/pages/admin/collegeAdmin/Dashboard")
);
const DepartmentManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/Departmentmanagement")
);
const CourseMapping = lazy(() =>
  import("@/pages/admin/collegeAdmin/CourseMapping")
);
const LearnerDataAdmission = lazy(() =>
  import("@/pages/admin/collegeAdmin/LearnerDataAdmission")
);
const FacultyManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/FacultyManagement")
);
const ExaminationManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/ExaminationManagement")
);
const CollegeAdminDigitalPortfolio = lazy(() =>
  import("@/pages/admin/collegeAdmin/DigitalPortfolio")
);
const LearnerVerifications = lazy(() => import("@/pages/admin/collegeAdmin/Verifications"));
const LearnerSubjectCourses = lazy(() => import("@/pages/admin/collegeAdmin/SubjectMaster"));
const LearnerCollegeAdminCommunications = lazy(() => import("@/pages/admin/collegeAdmin/LearnerCollegeAdminCommunication"));
const PlacementManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/PlacementManagement")
);
const SkillDevelopment = lazy(() =>
  import("@/pages/admin/collegeAdmin/SkillDevelopment")
);
const EventManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/EventManagement")
);
const FinanceManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/FinanceManagement")
);
const ReportsAnalytics = lazy(() =>
  import("@/pages/admin/collegeAdmin/ReportsAnalytics")
);
const AttendanceTracking = lazy(() =>
  import("@/pages/admin/collegeAdmin/Attendancetracking")
);
const AttendancePolicies = lazy(() => import("@/pages/admin/collegeAdmin/AttendancePolicyMaster"));
const GraduationEligibility = lazy(() =>
  import("@/pages/admin/collegeAdmin/GraduationEligibility")
);
const CircularsManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/CircularsManagement")
);
const CollegeUserManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/UserManagement")
);
const CollegeCurriculumBuilder = lazy(() =>
  import("@/pages/admin/collegeAdmin/CurriculumBuilder")
);
const CollegeAdminCourses = lazy(() =>
  import("@/pages/admin/collegeAdmin/Courses")
);
const CollegeAdminAssessmentResults = lazy(() =>
  import("@/pages/admin/collegeAdmin/AssessmentResults")
);
const LessonPlanManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/LessonPlanManagement")
);
const MentorAllocation = lazy(() =>
  import("@/pages/admin/collegeAdmin/MentorAllocation")
);
const EnrolledLearners = lazy(() =>
  import("@/pages/admin/collegeAdmin/EnrolledLearners")
);
const TranscriptGeneration = lazy(() =>
  import("@/pages/admin/collegeAdmin/TranscriptGeneration")
);
const AcademicCalendar = lazy(() =>
  import("@/pages/admin/collegeAdmin/AcademicCalendar")
);
const AssessmentGradingMaster = lazy(() =>
  import("@/pages/admin/collegeAdmin/AssessmentGradingMaster")
);
const PerformanceMonitoring = lazy(() =>
  import("@/pages/admin/collegeAdmin/PerformanceMonitoring")
);
const CollegeSettings = lazy(() =>
  import("@/pages/admin/collegeAdmin/Settings")
);
const AcademicCoverageTracker = lazy(() =>
  import("@/pages/admin/collegeAdmin/AcademicCoverageTracker")
);
const ProgramSectionManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/ProgramSectionManagement")
);
const ProgramManagement = lazy(() =>
  import("@/pages/admin/collegeAdmin/ProgramManagement")
);
const CollegeLibrary = lazy(() =>
  import("@/pages/admin/collegeAdmin/Library")
);
const CollegeAdminBrowseCourses = lazy(() => import("@/pages/admin/collegeAdmin/BrowseCourses"));

// School Admin imports
const SchoolAdminDashboard = lazy(() =>
  import("@/pages/admin/schoolAdmin/Dashboard")
);
const LearnerAdmissions = lazy(() =>
  import("@/pages/admin/schoolAdmin/LearnerAdmissions")
);
const TeacherList = lazy(() =>
  import("@/features/school-admin/ui/components/TeacherList")
);
const TeacherOnboarding = lazy(() =>
  import("@/features/school-admin/ui/components/TeacherOnboarding")
);
const TeacherTimetable = lazy(() =>
  import("@/features/school-admin/ui/components/TimetableBuilderEnhanced")
);
const LessonPlanApprovals = lazy(() => import("@/pages/admin/schoolAdmin/LessonPlanApprovals"));
const CurriculumBuilder = lazy(() =>
  import("@/pages/admin/schoolAdmin/CurriculumBuilderWrapper")
);
const SchoolAdminCourses = lazy(() => import("@/pages/admin/schoolAdmin/Courses"));
const SchoolAdminBrowseCourses = lazy(() => import("@/pages/admin/schoolAdmin/BrowseCourses"));
const LessonPlan = lazy(() => import("@/pages/admin/schoolAdmin/LessonPlanWrapper"));
const ExamsAssessments = lazy(() =>
  import("@/pages/admin/schoolAdmin/ExamsAssessments")
);
const ParentPortal = lazy(() =>
  import("@/pages/admin/schoolAdmin/ParentPortal")
);
const MessageCenter = lazy(() =>
  import("@/pages/admin/schoolAdmin/MessageCenter")
);
const CircularsFeedback = lazy(() =>
  import("@/pages/admin/schoolAdmin/CircularsFeedback")
);
const LearnerMessages = lazy(() =>
  import("@/pages/admin/schoolAdmin/LearnerCommunication")
);
const SkillCurricular = lazy(() =>
  import("@/pages/admin/schoolAdmin/SkillCurricular")
);
const SkillBadges = lazy(() =>
  import("@/pages/admin/schoolAdmin/SkillBadges")
);
const Reports = lazy(() =>
  import("@/pages/admin/schoolAdmin/Reports")
);
const SchoolFinanceModule = lazy(() => import("@/features/school-admin/ui/finance/index"));
const Library = lazy(() => import("@/pages/admin/schoolAdmin/Library"));
const AttendanceReports = lazy(() =>
  import("@/pages/admin/schoolAdmin/AttendanceReports")
);
const ClassManagement = lazy(() =>
  import("@/pages/admin/schoolAdmin/ClassManagement")
);
const SchoolAdminAssessmentResults = lazy(() =>
  import("@/pages/admin/schoolAdmin/AssessmentResults")
);
const SchoolAdminVerifications = lazy(() => import("@/pages/admin/schoolAdmin/Verifications"));
const SchoolAdminSettings = lazy(() =>
  import("@/pages/admin/schoolAdmin/Settings")
);
const SchoolAdminDigitalPortfolio = lazy(() =>
  import("@/pages/admin/schoolAdmin/DigitalPortfolio")
);

// University Admin imports
const UniversityAdminDashboard = lazy(() =>
  import("@/pages/admin/universityAdmin/Dashboard")
);
const CollegeRegistration = lazy(() =>
  import("@/pages/admin/universityAdmin/CollegeRegistration")
);
const ProgramAllocation = lazy(() =>
  import("@/pages/admin/universityAdmin/ProgramAllocation")
);
const LearnerEnrollments = lazy(() =>
  import("@/pages/admin/universityAdmin/LearnerEnrollments")
);
const ContinuousAssessment = lazy(() =>
  import("@/pages/admin/universityAdmin/ContinuousAssessment")
);
const PlacementReadiness = lazy(() =>
  import("@/pages/admin/universityAdmin/PlacementReadiness")
);
const OutcomeBasedEducation = lazy(() =>
  import("@/pages/admin/universityAdmin/OutcomeBasedEducation")
);
const DistrictCollegeReports = lazy(() =>
  import("@/pages/admin/universityAdmin/DistrictCollegeReports")
);
const AICounselling = lazy(() =>
  import("@/pages/admin/universityAdmin/AICounselling")
);
const UniversityAdminCourses = lazy(() =>
  import("@/pages/admin/universityAdmin/Courses")
);
const SyllabusApproval = lazy(() =>
  import("@/pages/admin/universityAdmin/SyllabusApproval")
);
const UniversityAdminDigitalPortfolio = lazy(() =>
  import("@/pages/admin/universityAdmin/DigitalPortfolio")
);
const UniversityAdminAssessmentResults = lazy(() =>
  import("@/pages/admin/universityAdmin/AssessmentResults")
);
const UniversityAdminSettings = lazy(() =>
  import("@/pages/admin/universityAdmin/Settings")
);
const UniversityExaminationManagement = lazy(() =>
  import("@/pages/admin/universityAdmin/ExaminationManagement")
);
const UniversityGradeCalculation = lazy(() =>
  import("@/pages/admin/universityAdmin/GradeCalculation")
);
const UniversityResultsPublishing = lazy(() =>
  import("@/pages/admin/universityAdmin/ResultsPublishing")
);
const UniversityCentralizedResults = lazy(() =>
  import("@/pages/admin/universityAdmin/CentralizedResults")
);
const UniversityFinance = lazy(() =>
  import("@/pages/admin/universityAdmin/Finance")
);
const UniversityPaymentTracking = lazy(() =>
  import("@/pages/admin/universityAdmin/PaymentTracking")
);
const UniversityFinancialReports = lazy(() =>
  import("@/pages/admin/universityAdmin/FinancialReports")
);
const UniversityPerformanceMonitoring = lazy(() =>
  import("@/pages/admin/universityAdmin/PerformanceMonitoring")
);
const FacultyEmpanelment = lazy(() =>
  import("@/pages/admin/universityAdmin/FacultyEmpanelment")
);
const FacultyFeedbackCertification = lazy(() =>
  import("@/pages/admin/universityAdmin/FeedbackCertification")
);
const UniversityLearnerCertificates = lazy(() =>
  import("@/pages/admin/universityAdmin/LearnerCertificates")
);
const UniversityCircularsManagement = lazy(() =>
  import("@/pages/admin/universityAdmin/CircularsManagement")
);
const UniversityTrainingUpdates = lazy(() =>
  import("@/pages/admin/universityAdmin/TrainingUpdates")
);
const LibraryManagement = lazy(() =>
  import("@/pages/admin/universityAdmin/library/LibraryManagement")
);
const LibraryClearance = lazy(() =>
  import("@/pages/admin/universityAdmin/library/LibraryClearance")
);
const LearnerServiceRequests = lazy(() =>
  import("@/pages/admin/universityAdmin/library/LearnerServiceRequests")
);
const GraduationIntegration = lazy(() =>
  import("@/pages/admin/universityAdmin/library/GraduationIntegration")
);
const FacultyLifecycle = lazy(() =>
  import("@/pages/admin/universityAdmin/hr/FacultyLifecycle")
);
const StaffManagement = lazy(() =>
  import("@/pages/admin/universityAdmin/hr/StaffManagement")
);
const PayrollProcessing = lazy(() =>
  import("@/pages/admin/universityAdmin/hr/PayrollProcessing")
);
const StatutoryDeductions = lazy(() =>
  import("@/pages/admin/universityAdmin/hr/StatutoryDeductions")
);
const EmployeeRecords = lazy(() =>
  import("@/pages/admin/universityAdmin/hr/EmployeeRecords")
);
const LeaveManagement = lazy(() =>
  import("@/pages/admin/universityAdmin/hr/LeaveManagement")
);
const UniversityAdminBrowseCourses = lazy(() => import("@/pages/admin/universityAdmin/BrowseCourses"));

// College Admin Routes
export const collegeAdminRoutes = (
  <Route
    key="college-admin-routes"
    path="/college-admin/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={COLLEGE_ADMIN_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=college_admin"
      >
        <OrganizationGuard organizationType="college">
          <AdminLayout />
        </OrganizationGuard>
      </SubscriptionProtectedRoute>
    }
  >
    <Route path="dashboard" element={<CollegeDashboard />} />
    <Route path="departments/management" element={<DepartmentManagement />} />
    <Route path="departments/mapping" element={<CourseMapping />} />
    <Route path="departments/educators" element={<FacultyManagement />} />
    <Route path="learners/data-management" element={<LearnerDataAdmission />} />
    <Route path="learners/enrolled" element={<EnrolledLearners />} />
    <Route path="learners/attendance" element={<AttendanceTracking />} />
    <Route path="learners/attendance-policies" element={<AttendancePolicies />} />
    <Route path="learners/performance" element={<PerformanceMonitoring />} />
    <Route path="learners/assessment-results" element={<CollegeAdminAssessmentResults />} />
    <Route path="learners/graduation" element={<GraduationEligibility />} />
    <Route path="learners/digital-portfolio" element={<CollegeAdminDigitalPortfolio />} />
    <Route path="learners/verifications" element={<LearnerVerifications />} />
    <Route path="learners/communication" element={<LearnerCollegeAdminCommunications />} />
    <Route path="academics/courses" element={<CollegeAdminCourses />} />
    <Route path="academics/subject-courses" element={<LearnerSubjectCourses />} />
    <Route path="academics/browse-courses" element={<CollegeAdminBrowseCourses />} />
    <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
    <Route path="academics/curriculum" element={<CollegeCurriculumBuilder />} />
    <Route path="academics/lesson-plans" element={<LessonPlanManagement />} />
    <Route path="academics/coverage-tracker" element={<AcademicCoverageTracker />} />
    <Route path="academics/programs" element={<ProgramManagement />} />
    <Route path="academics/program-sections" element={<ProgramSectionManagement />} />
    <Route path="academics/calendar" element={<AcademicCalendar />} />
    <Route path="examinations" element={<ExaminationManagement />} />
    <Route path="examinations/transcripts" element={<TranscriptGeneration />} />
    <Route path="examinations/assessment-grading" element={<AssessmentGradingMaster />} />
    <Route path="skill-development" element={<SkillDevelopment />} />
    <Route path="placements" element={<PlacementManagement />} />
    <Route path="mentors" element={<MentorAllocation />} />
    <Route path="circulars" element={<CircularsManagement />} />
    <Route path="events" element={<EventManagement />} />
    <Route path="finance" element={<FinanceManagement />} />
    <Route path="library" element={<CollegeLibrary />} />
    <Route path="reports" element={<ReportsAnalytics />} />
    <Route path="users" element={<CollegeUserManagement />} />
    <Route path="settings" element={<CollegeSettings />} />
    <Route path="subscription/manage" element={<SubscriptionManage />} />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="subscription/organization" element={<OrganizationSubscriptionPage />} />
    <Route path="subscription/bulk-purchase" element={<BulkPurchasePage />} />
    <Route path="subscription/organization-payment" element={<OrganizationPaymentPage />} />
    <Route path="subscription/member-view" element={<MemberSubscriptionPage />} />
    <Route path="" element={<Navigate to="/college-admin/dashboard" replace />} />
  </Route>
);

// School Admin Routes
export const schoolAdminRoutes = (
  <Route
    key="school-admin-routes"
    path="/school-admin/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={SCHOOL_ADMIN_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=school_admin"
      >
        <OrganizationGuard organizationType="school">
          <AdminLayout />
        </OrganizationGuard>
      </SubscriptionProtectedRoute>
    }
  >
    <Route path="dashboard" element={<SchoolAdminDashboard />} />
    <Route path="learners/admissions" element={<LearnerAdmissions />} />
    <Route path="learners/attendance-reports" element={<AttendanceReports />} />
    <Route path="learners/assessment-results" element={<SchoolAdminAssessmentResults />} />
    <Route path="learners/verifications" element={<SchoolAdminVerifications />} />
    <Route path="learners/digital-portfolio" element={<SchoolAdminDigitalPortfolio />} />
    <Route path="classes/management" element={<ClassManagement />} />
    <Route path="courses" element={<SchoolAdminCourses />} />
    <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
    <Route path="teachers/list" element={<TeacherList />} />
    <Route path="teachers/onboarding" element={<TeacherOnboarding />} />
    <Route path="teachers/timetable" element={<TeacherTimetable />} />
    <Route path="lesson-plans/approvals" element={<LessonPlanApprovals />} />
    <Route path="academics/courses" element={<SchoolAdminCourses />} />
    <Route path="academics/browse-courses" element={<SchoolAdminBrowseCourses />} />
    <Route path="academics/curriculum" element={<CurriculumBuilder />} />
    <Route path="academics/lesson-plans" element={<LessonPlan />} />
    <Route path="academics/exams" element={<ExamsAssessments />} />
    <Route path="communication/parents" element={<ParentPortal />} />
    <Route path="communication/messages" element={<MessageCenter />} />
    <Route path="communication/circulars" element={<CircularsFeedback />} />
    <Route path="communication/messages-learner" element={<LearnerMessages />} />
    <Route path="skills/clubs" element={<SkillCurricular />} />
    <Route path="skills/badges" element={<SkillBadges />} />
    <Route path="skills/reports" element={<Reports />} />
    <Route path="finance/fees" element={<SchoolFinanceModule />} />
    <Route path="infrastructure/library" element={<Library />} />
    <Route path="settings" element={<SchoolAdminSettings />} />
    <Route path="subscription/manage" element={<SubscriptionManage />} />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="subscription/organization" element={<OrganizationSubscriptionPage />} />
    <Route path="subscription/bulk-purchase" element={<BulkPurchasePage />} />
    <Route path="subscription/organization-payment" element={<OrganizationPaymentPage />} />
    <Route path="subscription/member-view" element={<MemberSubscriptionPage />} />
    <Route path="" element={<Navigate to="/school-admin/dashboard" replace />} />
  </Route>
);

// University Admin Routes
export const universityAdminRoutes = (
  <Route
    key="university-admin-routes"
    path="/university-admin/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={UNIVERSITY_ADMIN_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=university_admin"
      >
        <OrganizationGuard organizationType="university">
          <AdminLayout />
        </OrganizationGuard>
      </SubscriptionProtectedRoute>
    }
  >
    <Route path="dashboard" element={<UniversityAdminDashboard />} />
    <Route path="colleges/registration" element={<CollegeRegistration />} />
    <Route path="colleges/programs" element={<ProgramAllocation />} />
    <Route path="courses" element={<UniversityAdminCourses />} />
    <Route path="courses/syllabus" element={<SyllabusApproval />} />
    <Route path="browse-courses" element={<UniversityAdminBrowseCourses />} />
    <Route path="learners/enrollments" element={<LearnerEnrollments />} />
    <Route path="learners/digital-portfolios" element={<UniversityAdminDigitalPortfolio />} />
    <Route path="learners/assessment-results" element={<UniversityAdminAssessmentResults />} />
    <Route path="learners/continuous-assessment" element={<ContinuousAssessment />} />
    <Route path="placements/readiness" element={<PlacementReadiness />} />
    <Route path="analytics/obe-tracking" element={<OutcomeBasedEducation />} />
    <Route path="analytics/reports" element={<DistrictCollegeReports />} />
    <Route path="ai-counselling" element={<AICounselling />} />
    <Route path="examinations" element={<UniversityExaminationManagement />} />
    <Route path="examinations/grades" element={<UniversityGradeCalculation />} />
    <Route path="examinations/results" element={<UniversityResultsPublishing />} />
    <Route path="learners/results" element={<UniversityCentralizedResults />} />
    <Route path="learners/certificates" element={<UniversityLearnerCertificates />} />
    <Route path="finance" element={<UniversityFinance />} />
    <Route path="finance/payments" element={<UniversityPaymentTracking />} />
    <Route path="finance/reports" element={<UniversityFinancialReports />} />
    <Route path="colleges/performance" element={<UniversityPerformanceMonitoring />} />
    <Route path="faculty/empanelment" element={<FacultyEmpanelment />} />
    <Route path="faculty/feedback" element={<FacultyFeedbackCertification />} />
    <Route path="library/management" element={<LibraryManagement />} />
    <Route path="library/clearance" element={<LibraryClearance />} />
    <Route path="library/service-requests" element={<LearnerServiceRequests />} />
    <Route path="library/graduation-integration" element={<GraduationIntegration />} />
    <Route path="hr/faculty-lifecycle" element={<FacultyLifecycle />} />
    <Route path="hr/staff-management" element={<StaffManagement />} />
    <Route path="hr/payroll" element={<PayrollProcessing />} />
    <Route path="hr/statutory-deductions" element={<StatutoryDeductions />} />
    <Route path="hr/employee-records" element={<EmployeeRecords />} />
    <Route path="hr/leave-management" element={<LeaveManagement />} />
    <Route path="communication/circulars" element={<UniversityCircularsManagement />} />
    <Route path="communication/training" element={<UniversityTrainingUpdates />} />
    <Route path="settings" element={<UniversityAdminSettings />} />
    <Route path="subscription/manage" element={<SubscriptionManage />} />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="subscription/organization" element={<OrganizationSubscriptionPage />} />
    <Route path="subscription/bulk-purchase" element={<BulkPurchasePage />} />
    <Route path="subscription/organization-payment" element={<OrganizationPaymentPage />} />
    <Route path="subscription/member-view" element={<MemberSubscriptionPage />} />
    <Route path="" element={<Navigate to="/university-admin/dashboard" replace />} />
  </Route>
);
