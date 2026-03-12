import { lazy, Outlet } from "react";
import { Navigate, Route } from "react-router-dom";
import SubscriptionProtectedRoute from "../components/Subscription/SubscriptionProtectedRoute";
import StudentLayout from "../layouts/StudentLayout";

// Digital Passport imports
import HomePage from '../pages/digital-pp/HomePage';
import DigitalPassportPage from '../pages/digital-pp/PassportPage';
import DigitalPortfolioPage from '../pages/digital-pp/PortfolioPage';
import DigitalVideoPortfolioPage from '../pages/digital-pp/VideoPortfolioPage';
import DigitalExportSettings from '../pages/digital-pp/settings/ExportSettings';
import DigitalLayoutSettings from '../pages/digital-pp/settings/LayoutSettings';
import DigitalProfileSettings from '../pages/digital-pp/settings/ProfileSettings';
import DigitalSharingSettings from '../pages/digital-pp/settings/SharingSettings';
import DigitalThemeSettings from '../pages/digital-pp/settings/ThemeSettings';

const STUDENT_ROLES = ["student", "school_student", "college_student", "learner"];

const StudentDashboard = lazy(() => import("../pages/student/Dashboard"));
const Profile = lazy(() => import("../pages/student/Profile"));
const MySkills = lazy(() => import("../pages/student/MySkills"));
const MyLearning = lazy(() => import("../pages/student/MyLearning"));
const Courses = lazy(() => import("../pages/student/Courses"));
const CoursePlayer = lazy(() => import("../pages/student/CoursePlayer"));
const ComingSoon = lazy(() => import("../pages/student/ComingSoon"));
const Opportunities = lazy(() => import("../pages/student/Opportunities"));
const SavedJobs = lazy(() => import("../pages/student/SavedJobs"));
const Applications = lazy(() => import("../pages/student/Applications"));
const AppliedJobs = lazy(() => import("../pages/student/AppliedJobs"));
const BrowseJobs = lazy(() => import("../pages/student/BrowseJobs"));
const Messages = lazy(() => import("../pages/student/Messages"));
const StudentAnalytics = lazy(() => import("../pages/student/Analytics"));
const MyClass = lazy(() => import("../pages/student/MyClass"));
const Clubs = lazy(() => import("../pages/student/Clubs"));
const TimelinePage = lazy(() => import("../pages/student/TimelinePage"));
const AchievementsPage = lazy(() => import("../pages/student/AchievementsPage"));
const CareerAI = lazy(() => import("../pages/student/CareerAI"));
const Settings = lazy(() => import("../pages/student/Settings"));
const AssessmentResult = lazy(() => import("../pages/student/AssessmentResult"));
const AssessmentTestPage = lazy(() => import("../pages/student/AssessmentTestPage"));
const AssessmentResults = lazy(() => import("../pages/student/AssessmentResults"));
const AssessmentStart = lazy(() => import("../pages/student/AssessmentStart"));
const DynamicAssessment = lazy(() => import("../pages/student/DynamicAssessment"));
const AdaptiveAptitudeTest = lazy(() => import("../pages/student/AdaptiveAptitudeTest"));
const SubscriptionManage = lazy(() =>
  import("../pages/subscription/SubscriptionManage")
);
const AddOns = lazy(() =>
  import("../pages/subscription/AddOns")
);

export const studentRoutes = (
  <Route
    key="student-routes"
    path="/student/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={STUDENT_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=student"
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
    <Route path="my-training" element={<MyLearning />} />
    <Route path="courses" element={<Courses />} />
    <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
    <Route path="coming-soon" element={<ComingSoon />} />
    <Route path="opportunities" element={<Opportunities />} />
    <Route path="saved-jobs" element={<SavedJobs />} />
    <Route path="applications" element={<Applications />} />
    <Route path="applied-jobs" element={<AppliedJobs />} />
    <Route path="browse-jobs" element={<BrowseJobs />} />
    <Route path="messages" element={<Messages />} />
    <Route path="career-ai" element={<CareerAI />} />
    <Route path="settings" element={<Settings />} />
    <Route path="subscription/manage" element={<SubscriptionManage />} />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="analytics" element={<StudentAnalytics />} />
    <Route path="my-class" element={<MyClass />} />
    <Route path="assignments" element={<Navigate to="/student/my-class" replace />} />
    <Route path="clubs" element={<Clubs />} />
    <Route path="timeline" element={<TimelinePage />} />
    <Route path="achievements" element={<AchievementsPage />} />
    <Route path="assessment-report" element={<AssessmentTestPage />} />
    <Route path="assessment/test" element={<AssessmentTestPage />} />
    <Route path="assessment/result" element={<AssessmentResult />} />
    <Route path="assessment/platform" element={<AssessmentStart />} />
    <Route path="assessment/dynamic" element={<DynamicAssessment />} />
    <Route path="adaptive-aptitude-test" element={<AdaptiveAptitudeTest />} />
    <Route path="assessment/start" element={<AssessmentTestPage />} />
    <Route path="assessment/results" element={<AssessmentResults />} />

    {/* Digital Portfolio routes */}
    <Route path="digital-portfolio" element={<div><HomePage /></div>} />
    <Route path="digital-portfolio/portfolio" element={<div><DigitalPortfolioPage /></div>} />
    <Route path="digital-portfolio/passport" element={<div><DigitalPassportPage /></div>} />
    <Route path="digital-portfolio/video" element={<div><DigitalVideoPortfolioPage /></div>} />
    <Route path="digital-portfolio/settings/theme" element={<div><DigitalThemeSettings /></div>} />
    <Route path="digital-portfolio/settings/layout" element={<div><DigitalLayoutSettings /></div>} />
    <Route path="digital-portfolio/settings/export" element={<div><DigitalExportSettings /></div>} />
    <Route path="digital-portfolio/settings/sharing" element={<div className="-mx-6 -my-8"><DigitalSharingSettings /></div>} />
    <Route path="digital-portfolio/settings/profile" element={<div className="-mx-6 -my-8"><DigitalProfileSettings /></div>} />

    <Route path="" element={<Navigate to="/student/dashboard" replace />} />
  </Route>
);