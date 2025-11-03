import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Loader from "../components/Loader";

import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";
import StudentLayout from "../layouts/StudentLayout";
import EducatorLayout from "../layouts/EducatorLayout";

const Home = lazy(() => import("../pages/homepage/Home"));
const About = lazy(() => import("../pages/homepage/About"));
const Contact = lazy(() => import("../pages/homepage/Contact"));
const SubscriptionPlans = lazy(() =>
  import("../pages/subscription/SubscriptionPlans")
);

const LoginStudent = lazy(() => import('../pages/auth/LoginStudent'));
const LoginRecruiter = lazy(() => import('../pages/auth/LoginRecruiter'));
const LoginAdmin = lazy(() => import('../pages/auth/LoginAdmin'));
const Register = lazy(() => import('../pages/auth/components/SignIn/Register'));
const SignupRecruiter = lazy(() => import('../pages/auth/components/SignIn/recruitment/SignupRecruiter'));
const SignupAdmin = lazy(() => import('../pages/auth/components/SignIn/recruitment/SignupAdmin'));
const SignInSchool = lazy(() => import('../pages/auth/components/SignIn/schools/SignInSchool'));
const SignInUniversity = lazy(() => import('../pages/auth/components/SignIn/university/SignInUniversity'));
const UniversityAdmin = lazy(() => import('../pages/auth/components/SignIn/university/UniversityAdmin'));

const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const ManageUsers = lazy(() => import("../pages/admin/ManageUsers"));
const Reports = lazy(() => import("../pages/admin/Reports"));

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
const Analytics = lazy(() => import("../pages/recruiter/Analytics"));
const Activities = lazy(() => import("../pages/recruiter/Activities"));
const RecruiterMessages = lazy(() => import("../pages/recruiter/Messages"));

const StudentDashboard = lazy(() => import("../pages/student/Dashboard"));
const Profile = lazy(() => import("../pages/student/Profile"));
const MySkills = lazy(() => import("../pages/student/MySkills"));
const MyTraining = lazy(() => import("../pages/student/MyTraining"));
const MyExperience = lazy(() => import("../pages/student/MyExperience"));
const Opportunities = lazy(() => import("../pages/student/Opportunities"));
const SavedJobs = lazy(() => import("../pages/student/SavedJobs"));
const Applications = lazy(() => import("../pages/student/Applications"));
const AppliedJobs = lazy(() => import("../pages/student/AppliedJobs"));
const BrowseJobs = lazy(() => import("../pages/student/BrowseJobs"));
const Messages = lazy(() => import("../pages/student/Messages"));
const StudentAnalytics = lazy(() => import("../pages/student/Analytics"));
const Assignments = lazy(() => import("../pages/student/Assignments"));
const DebugQRTest = lazy(() => import("../pages/DebugQRTest"));
const StudentPublicViewer = lazy(() =>
  import("../components/Students/components/StudentPublicViewer")
);
const Settings = lazy(() => import("../pages/student/Settings"));

// Educator pages
const EducatorDashboard = lazy(() => import("../pages/educator/Dashboard"));
const EducatorLogin = lazy(() => import("../pages/auth/LoginEducator"));
const EducatorStudents = lazy(() => import("../pages/educator/StudentsPage"));
const EducatorClasses = lazy(() => import("../pages/educator/ClassesPage"));
const EducatorAssessments = lazy(() => import("../pages/educator/Assessments"));
const EducatorMentorNotes = lazy(() => import("../pages/educator/MentorNotes"));
const EducatorSettings = lazy(() => import("../pages/educator/Settings"));
const EducatorCommunication = lazy(() => import("../pages/educator/Communication"));
const EducatorAnalytics = lazy(() => import("../pages/educator/Analytics"));
const EducatorActivities = lazy(() => import("../pages/educator/Activities"));
const EducatorReports = lazy(() => import("../pages/educator/Reports"));
const EducatorMediaManager = lazy(() => import("../pages/educator/MediaManager"));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login/student" element={<LoginStudent />} />
          <Route path="/login/recruiter" element={<LoginRecruiter />} />
          <Route path="/login/admin" element={<LoginAdmin />} />
          <Route path="/login/educator" element={<EducatorLogin />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/signup/recruitment-recruiter"
            element={<SignupRecruiter />}
          />
          <Route path="/signup/recruitment-admin" element={<SignupAdmin />} />
          <Route path="/signin/school" element={<SignInSchool />} />
          <Route path="/signin/university" element={<SignInUniversity />} />
          <Route path="/signup/university-admin" element={<UniversityAdmin />} />
          <Route path="/subscription" element={<SubscriptionPlans />} />
          <Route path="/debug-qr" element={<DebugQRTest />} />
          <Route
            path="/student/profile/:email"
            element={<StudentPublicViewer />}
          />
        </Route>

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
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
          <Route path="talent-pool" element={<TalentPool />} />
          <Route path="requisition" element={<Requisitions />} />
          <Route path="requisition/applicants" element={<ApplicantsList />} />
          <Route path="pipelines" element={<Pipelines />} />
          <Route path="shortlists" element={<Shortlists />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="offers-decisions" element={<OffersDecisions />} />
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
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="dashboard/:id" element={<Profile />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:email" element={<Profile />} />
          <Route path="my-skills" element={<MySkills />} />
          <Route path="my-training" element={<MyTraining />} />
          <Route path="my-experience" element={<MyExperience />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="saved-jobs" element={<SavedJobs />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applied-jobs" element={<AppliedJobs />} />
          <Route path="browse-jobs" element={<BrowseJobs />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="assignments" element={<Assignments />} />
          <Route
            path=""
            element={<Navigate to="/student/dashboard" replace />}
          />
        </Route>

        <Route path="/educator/*" element={<EducatorLayout />}>
          <Route path="dashboard" element={<EducatorDashboard />} />
          <Route path="students" element={<EducatorStudents />} />
          <Route path="classes" element={<EducatorClasses />} />
          <Route path="assignments" element={<EducatorAssessments />} />
          <Route path="mentornotes" element={<EducatorMentorNotes />} />
          <Route path="settings" element={<EducatorSettings />} />
          <Route path="communication" element={<EducatorCommunication />} />
          <Route path="analytics" element={<EducatorAnalytics />} />
          <Route path="activities" element={<EducatorActivities />} />
          <Route path="reports" element={<EducatorReports />} />
          <Route path="media" element={<EducatorMediaManager />} />
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
