import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import OrganizationProtectedRoute from "@/features/recruitment/ui/OrganizationProtectedRoute";
import RecruiterLayout from "../layouts/RecruiterLayout";

const RECRUITER_ROLES = ["recruiter", "company_admin"];

const RecruiterProfile = lazy(() => import("@/pages/recruiter/Profile"));
const RecruiterSettings = lazy(() => import("@/pages/recruiter/Settings"));
const Overview = lazy(() => import("@/pages/recruiter/Overview"));
const Requisitions = lazy(() => import("@/pages/recruiter/Requisitions"));
const ApplicantsList = lazy(() => import("@/pages/recruiter/ApplicantsList"));
const TalentPool = lazy(() => import("@/pages/recruiter/TalentPool"));
const Pipelines = lazy(() => import("@/pages/recruiter/Pipelines"));
const Shortlists = lazy(() => import("@/pages/recruiter/Shortlists"));
const Interviews = lazy(() => import("@/pages/recruiter/Interviews"));
const OffersDecisions = lazy(() =>
  import("@/pages/recruiter/OffersDecisions")
);
const VerifiedWork = lazy(() => import("@/pages/recruiter/VerifiedLearnerWork"));
const Analytics = lazy(() => import("@/pages/recruiter/Analytics"));
const Activities = lazy(() => import("@/pages/recruiter/Activities"));
const RecruiterMessages = lazy(() => import("@/pages/recruiter/Messages"));
const ProjectHiringWithNav = lazy(() => import("@/pages/recruiter/ProjectHiringWithNav"));
const SubscriptionManage = lazy(() =>
  import("@/pages/subscription/SubscriptionManage")
);
const AddOns = lazy(() =>
  import("@/pages/subscription/AddOns")
);
const RecruitmentSubscriptionPlans = lazy(() =>
  import("@/pages/recruitment/RecruitmentSubscriptionPlans")
);
const AdminDashboard = lazy(() => import("@/pages/recruiter/AdminDashboard"));

export const recruiterRoutes = (
  <Route
    key="recruiter-routes"
    path="/recruitment/*"
    element={
      <OrganizationProtectedRoute allowedRoles={RECRUITER_ROLES}>
        <RecruiterLayout />
      </OrganizationProtectedRoute>
    }
  >
    <Route path="overview" element={<Overview />} />
    <Route path="admin" element={<AdminDashboard />} />
    <Route path="projects" element={<ProjectHiringWithNav />} />
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
    <Route path="subscription/manage" element={<SubscriptionManage />} />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="*" element={<Navigate to="/recruitment/overview" replace />} />
  </Route>
);

// Standalone route for subscription plans (no sidebar)
export const recruiterSubscriptionPlanRoute = (
  <Route
    key="recruiter-subscription-plan"
    path="/recruitment/subscription/plans"
    element={<RecruitmentSubscriptionPlans />}
  />
);
