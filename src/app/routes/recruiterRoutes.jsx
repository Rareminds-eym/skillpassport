import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import SubscriptionProtectedRoute from "@/features/subscription/ui/shared/SubscriptionProtectedRoute";
import OrganizationProtectedRoute from "@/features/recruitment/ui/OrganizationProtectedRoute";
import AdminProtectedRoute from "@/features/recruitment/ui/AdminProtectedRoute";
import { ErrorBoundary } from "@/features/subscription/ui/organization/ErrorBoundary";
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
const AdminDashboard = lazy(() => import("@/pages/recruiter/AdminDashboard"));
// OnboardingWizard should NOT be lazy-loaded since it wraps lazy-loaded steps
import { OnboardingWizard } from "@/pages/recruitment/onboarding/OnboardingWizard";
const OnboardingStep1 = lazy(() => import("@/pages/recruitment/onboarding/step-1"));
const OnboardingStep2 = lazy(() => import("@/pages/recruitment/onboarding/step-2"));
const OnboardingStep3 = lazy(() => import("@/pages/recruitment/onboarding/step-3"));

// Onboarding route - protected by subscription requirement (must purchase before accessing onboarding)
// Per-route error boundaries (outer wrapper) on the 3 rows that mount lazily loaded
// recruiter onboarding pages: a chunk-import failure renders fallback=Retry for that
// page only, instead of the app-wide GlobalErrorBoundary nuclear option.
export const recruiterOnboardingRoute = (
  <Route
    key="recruiter-onboarding"
    path="/recruitment/onboarding/*"
  >
    <Route
      path="step-1"
      element={
        <ErrorBoundary>
          <SubscriptionProtectedRoute
            allowedRoles={RECRUITER_ROLES}
            requireSubscription={true}
            subscriptionFallbackPath="/subscription/plans?type=recruiter"
          >
            <OnboardingWizard currentStep={1}><OnboardingStep1 /></OnboardingWizard>
          </SubscriptionProtectedRoute>
        </ErrorBoundary>
      }
    />
    <Route
      path="step-2"
      element={
        <ErrorBoundary>
          <SubscriptionProtectedRoute
            allowedRoles={RECRUITER_ROLES}
            requireSubscription={true}
            subscriptionFallbackPath="/subscription/plans?type=recruiter"
          >
            <OnboardingWizard currentStep={2}><OnboardingStep2 /></OnboardingWizard>
          </SubscriptionProtectedRoute>
        </ErrorBoundary>
      }
    />
    <Route
      path="step-3"
      element={
        <ErrorBoundary>
          <SubscriptionProtectedRoute
            allowedRoles={RECRUITER_ROLES}
            requireSubscription={true}
            subscriptionFallbackPath="/subscription/plans?type=recruiter"
          >
            <OnboardingWizard currentStep={3}><OnboardingStep3 /></OnboardingWizard>
          </SubscriptionProtectedRoute>
        </ErrorBoundary>
      }
    />
    <Route path="step-4" element={<Navigate to="/recruitment/onboarding/step-3" replace />} />
    <Route path="*" element={<Navigate to="/recruitment/onboarding/step-1" replace />} />
  </Route>
);

export const recruiterRoutes = (
  <Route
    key="recruiter-routes"
    path="/recruitment/*"
    element={
      <SubscriptionProtectedRoute
        allowedRoles={RECRUITER_ROLES}
        requireSubscription={true}
        subscriptionFallbackPath="/subscription/plans?type=recruiter"
      >
        <OrganizationProtectedRoute allowedRoles={RECRUITER_ROLES}>
          {/* Per-section error boundary: a lazy chunk-import failure (deploy mid-session,
              network) renders the boundary's retry fallback for this section only instead
              of bubbling to the app-wide GlobalErrorBoundary. Covers all lazy child pages
              rendered through the layout Outlet. */}
          <ErrorBoundary>
            <RecruiterLayout />
          </ErrorBoundary>
        </OrganizationProtectedRoute>
      </SubscriptionProtectedRoute>
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
          <SubscriptionManage />
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
