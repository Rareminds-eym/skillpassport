import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import OrganizationProtectedRoute from "@/features/recruitment/ui/OrganizationProtectedRoute";
import AdminProtectedRoute from "@/features/recruitment/ui/AdminProtectedRoute";
import RecruiterLayout from "../layouts/RecruiterLayout";

const RECRUITER_ROLES = ["recruiter", "company_admin", "owner"];

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
// RecruitmentSubscriptionPlans removed - now using unified subscription system
const ManageSubscription = lazy(() =>
  import("@/pages/recruitment/ManageSubscription")
);
const AdminDashboard = lazy(() => import("@/pages/recruiter/AdminDashboard"));
// OnboardingWizard should NOT be lazy-loaded since it wraps lazy-loaded steps
import { OnboardingWizard } from "@/pages/recruitment/onboarding/OnboardingWizard";
const OnboardingStep1 = lazy(() => import("@/pages/recruitment/onboarding/step-1"));
const OnboardingStep2 = lazy(() => import("@/pages/recruitment/onboarding/step-2"));
const OnboardingStep3 = lazy(() => import("@/pages/recruitment/onboarding/step-3"));
const OnboardingStep4 = lazy(() => import("@/pages/recruitment/onboarding/step-4"));

// Onboarding route - separate from main recruitment routes (no org protection needed during setup)
export const recruiterOnboardingRoute = (
  <Route
    key="recruiter-onboarding"
    path="/recruitment/onboarding/*"
  >
    <Route path="step-1" element={<OnboardingWizard currentStep={1}><OnboardingStep1 /></OnboardingWizard>} />
    <Route path="step-2" element={<OnboardingWizard currentStep={2}><OnboardingStep2 /></OnboardingWizard>} />
    <Route path="step-3" element={<OnboardingWizard currentStep={3}><OnboardingStep3 /></OnboardingWizard>} />
    <Route path="step-4" element={<OnboardingWizard currentStep={4}><OnboardingStep4 /></OnboardingWizard>} />
    <Route path="*" element={<Navigate to="/recruitment/onboarding/step-1" replace />} />
  </Route>
);

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
    <Route
      path="admin"
      element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      }
    />
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
    <Route
      path="subscription/manage"
      element={
        <AdminProtectedRoute>
          <ManageSubscription />
        </AdminProtectedRoute>
      }
    />
    <Route path="subscription/add-ons" element={<AddOns />} />
    <Route path="*" element={<Navigate to="/recruitment/overview" replace />} />
  </Route>
);

// Standalone route for subscription plans (no sidebar)
export const recruiterSubscriptionPlanRoute = (
  // DEPRECATED: Now using general subscription plans with type=recruiter
  // <Route
  //   key="recruiter-subscription-plan"
  //   path="/recruitment/subscription/plans"
  //   element={<RecruitmentSubscriptionPlans />}
  // />
  // Redirect old route to new unified route
  <Route
    key="recruiter-subscription-plan-redirect"
    path="/recruitment/subscription/plans"
    element={<Navigate to="/subscription/plans?type=recruiter" replace />}
  />
);
