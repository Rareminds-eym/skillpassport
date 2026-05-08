import { lazy, Outlet } from "react";
import { Navigate, Route } from "react-router-dom";
import { SubscriptionProtectedRoute } from "@/features/subscription";
import LearnerLayout from "../layouts/LearnerLayout";

// Digital Passport imports - lazy loaded
const HomePage = lazy(() => import('@/pages/digital-pp/HomePage'));
const DigitalPassportPage = lazy(() => import('@/pages/digital-pp/PassportPage'));
const DigitalPortfolioPage = lazy(() => import('@/pages/digital-pp/PortfolioPage'));
const DigitalVideoPortfolioPage = lazy(() => import('@/pages/digital-pp/VideoPortfolioPage'));
const DigitalExportSettings = lazy(() => import('@/pages/digital-pp/settings/ExportSettings'));
const DigitalLayoutSettings = lazy(() => import('@/pages/digital-pp/settings/LayoutSettings'));
const DigitalProfileSettings = lazy(() => import('@/pages/digital-pp/settings/ProfileSettings'));
const DigitalSharingSettings = lazy(() => import('@/pages/digital-pp/settings/SharingSettings'));
const DigitalThemeSettings = lazy(() => import('@/pages/digital-pp/settings/ThemeSettings'));

const LEARNER_ROLES = ["learner", "school-learner", "college-learner"];

const LearnerDashboard = lazy(() => import("@/pages/learner/Dashboard"));
const Profile = lazy(() => import("@/pages/learner/Profile"));
const MySkills = lazy(() => import("@/pages/learner/MySkills"));
const MyLearning = lazy(() => import("@/pages/learner/MyLearning"));
const Courses = lazy(() => import("@/pages/learner/Courses"));
const CoursePlayer = lazy(() => import("@/pages/learner/CoursePlayer"));
const ComingSoon = lazy(() => import("@/pages/learner/ComingSoon"));
const Opportunities = lazy(() => import("@/pages/learner/Opportunities"));
const SavedJobs = lazy(() => import("@/pages/learner/SavedJobs"));
const Applications = lazy(() => import("@/pages/learner/Applications"));
const AppliedJobs = lazy(() => import("@/pages/learner/AppliedJobs"));
const BrowseJobs = lazy(() => import("@/pages/learner/BrowseJobs"));
const Messages = lazy(() => import("@/pages/learner/Messages"));
const LearnerAnalytics = lazy(() => import("@/pages/learner/Analytics"));
const MyClass = lazy(() => import("@/pages/learner/MyClass"));
const Clubs = lazy(() => import("@/pages/learner/Clubs"));
const TimelinePage = lazy(() => import("@/pages/learner/TimelinePage"));
const AchievementsPage = lazy(() => import("@/pages/learner/AchievementsPage"));
const CareerAI = lazy(() => import("@/pages/learner/CareerAI"));
const Settings = lazy(() => import("@/pages/learner/Settings"));
const AssessmentResult = lazy(() => import("@/pages/learner/AssessmentResult"));
const AssessmentTestPage = lazy(() => import("@/pages/learner/AssessmentTestPage"));
const AssessmentResults = lazy(() => import("@/pages/learner/AssessmentResults"));
const AssessmentStart = lazy(() => import("@/pages/learner/AssessmentStart"));
const DynamicAssessment = lazy(() => import("@/pages/learner/DynamicAssessment"));
const AdaptiveAptitudeTest = lazy(() => import("@/pages/learner/AdaptiveAptitudeTest"));
const SubscriptionManage = lazy(() =>
  import("@/pages/subscription/SubscriptionManage")
);
const AddOns = lazy(() =>
  import("@/pages/subscription/AddOns")
);

export const learnerRoutes = (
  <Route
    key="learner-routes"
    path="/learner/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={LEARNER_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=learner"
      >
        <LearnerLayout />
      </SubscriptionProtectedRoute>
    }
  >
    <Route path="dashboard" element={<LearnerDashboard />} />
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
    <Route path="analytics" element={<LearnerAnalytics />} />
    <Route path="my-class" element={<MyClass />} />
    <Route path="assignments" element={<Navigate to="/learner/my-class" replace />} />
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

    <Route path="" element={<Navigate to="/learner/dashboard" replace />} />
  </Route>
);
