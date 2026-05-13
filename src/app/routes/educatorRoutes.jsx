import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { SubscriptionProtectedRoute } from "@/features/subscription";
import EducatorLayout from "../layouts/EducatorLayout";

const EDUCATOR_ROLES = ["educator", "school_educator", "college_educator"];

const EducatorDashboard = lazy(() => import("@/pages/educator/Dashboard"));
const EducatorLearners = lazy(() => import("@/pages/educator/LearnersPage"));
const EducatorClasses = lazy(() => import("@/pages/educator/ClassesPage"));
const EducatorPrograms = lazy(() => import("@/pages/educator/ProgramSectionsPage"));
const EducatorAssessmentResults = lazy(() => import("@/pages/educator/AssessmentResults"));
const EducatorCourses = lazy(() => import("@/pages/educator/Courses"));
const EducatorBrowseCourses = lazy(() => import("@/pages/educator/BrowseCourses"));
const EducatorAssessments = lazy(() => import("@/pages/educator/Assessments"));
const CollegeAssignments = lazy(() => import("@/pages/educator/CollegeSkillTasks"));
const EducatorMentorNotes = lazy(() => import("@/pages/educator/MentorNotes"));
const EducatorMyMentees = lazy(() => import("@/pages/educator/MyMentees"));
const EducatorSettings = lazy(() => import("@/pages/educator/Settings"));
const EducatorProfile = lazy(() => import("@/pages/educator/ProfileFixed"));
const EducatorManagement = lazy(() => import("@/pages/educator/EducatorManagement"));
const EducatorCommunication = lazy(() =>
  import("@/pages/educator/Communication")
);
const EducatorMessages = lazy(() => import("@/pages/educator/Messages"));
const SkillCurriculars = lazy(() => import("@/pages/educator/SkillCurricular"));
const EducatorAnalytics = lazy(() => import("@/pages/educator/Analytics"));
const EducatorActivities = lazy(() => import("@/pages/educator/Activities"));
const EducatorReports = lazy(() => import("@/pages/educator/Reports"));
const EducatorMediaManager = lazy(() =>
  import("@/pages/educator/MediaManager")
);
const EducatorDigitalPortfolio = lazy(() =>
  import("@/pages/educator/DigitalPortfolioPage")
);
const EducatorAI = lazy(() => import("@/pages/educator/EducatorAI"));
const CourseAnalytics = lazy(() => import("@/pages/educator/CourseAnalytics"));
const MarkAttendance = lazy(() => import("@/pages/educator/MarkAttendance"));
const CoursePlayer = lazy(() => import("@/pages/learner/CoursePlayer"));
const LessonPlansList = lazy(() => import("@/pages/teacher/LessonPlansList"));
const LessonPlanCreate = lazy(() => import("@/pages/teacher/LessonPlanCreate"));
const MyTimetable = lazy(() => import("@/pages/teacher/MyTimetable"));
const SubscriptionManage = lazy(() =>
  import("@/pages/subscription/SubscriptionManage")
);
const AddOns = lazy(() =>
  import("@/pages/subscription/AddOns")
);

export const educatorRoutes = (
  <Route
    key="educator-routes"
    path="/educator/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={EDUCATOR_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=educator"
      >
        <EducatorLayout />
      </SubscriptionProtectedRoute>
    }
  >
    <Route path="dashboard" element={<EducatorDashboard />} />
    <Route path="ai-copilot" element={<EducatorAI />} />
    <Route path="learners" element={<EducatorLearners />} />
    <Route path="classes" element={<EducatorClasses />} />
    <Route path="programs" element={<EducatorPrograms />} />
    <Route path="courses" element={<EducatorCourses />} />
    <Route path="browse-courses" element={<EducatorBrowseCourses />} />
    <Route path="courses/:courseId/analytics" element={<CourseAnalytics />} />
    <Route path="assessment-results" element={<EducatorAssessmentResults />} />
    <Route path="assignments" element={<EducatorAssessments />} />
    <Route path="college-assignments" element={<CollegeAssignments />} />
    <Route path="mentor-notes" element={<EducatorMentorNotes />} />
    <Route path="mentees" element={<EducatorMyMentees />} />
    <Route path="digital-portfolio" element={<EducatorDigitalPortfolio />} />
    <Route path="settings" element={<EducatorSettings />} />
    <Route path="subscription/manage" element={<SubscriptionManage />} />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="profile" element={<EducatorProfile />} />
    <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
    <Route path="management" element={<EducatorManagement />} />
    <Route path="communication" element={<EducatorCommunication />} />
    <Route path="messages" element={<EducatorMessages />} />
    <Route path="analytics" element={<EducatorAnalytics />} />
    <Route path="activities" element={<EducatorActivities />} />
    <Route path="reports" element={<EducatorReports />} />
    <Route path="media-manager" element={<EducatorMediaManager />} />
    <Route path="lesson-plans" element={<LessonPlansList />} />
    <Route path="lesson-plans/create" element={<LessonPlanCreate />} />
    <Route path="my-timetable" element={<MyTimetable />} />
    <Route path="mark-attendance" element={<MarkAttendance />} />
    <Route path="clubs" element={<SkillCurriculars />} />
    <Route path="" element={<Navigate to="/educator/dashboard" replace />} />
  </Route>
);
