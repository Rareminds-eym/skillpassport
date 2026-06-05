import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import PublicLayout from "../layouts/PublicLayout";
import PortfolioLayout from "../layouts/PortfolioLayout";

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

const Home = lazy(() => import("@/pages/homepage/Home"));
const About = lazy(() => import("@/pages/AboutPage"));
const Contact = lazy(() => import("@/pages/homepage/Contact"));
const TermsAndConditions = lazy(() => import("@/pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Receipt = lazy(() => import("@/pages/Receipt"));
const PuterDemo = lazy(() => import("@/pages/puter/PuterDemo"));
const SubscriptionPlans = lazy(() =>
  import("@/pages/subscription/SubscriptionPlans")
);
const PaymentCompletion = lazy(() =>
  import("@/pages/subscription/PaymentCompletion")
);
const PaymentSuccess = lazy(() =>
  import("@/features/subscription/ui/shared/PaymentSuccess")
);
const PaymentFailure = lazy(() =>
  import("@/features/subscription/ui/shared/PaymentFailure")
);
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
const MemberSubscriptionPage = lazy(() =>
  import("@/pages/subscription/MemberSubscriptionPage")
);
const OrganizationPaymentPage = lazy(() =>
  import("@/pages/subscription/OrganizationPaymentPage")
);
const AcceptInvitationPage = lazy(() =>
  import("@/pages/subscription/AcceptInvitationPage")
);
const InvitationSignup = lazy(() =>
  import("@/pages/subscription/InvitationSignup")
);
const CompleteProfile = lazy(() =>
  import("@/pages/auth/CompleteProfile")
);

const EventSales = lazy(() =>
  import("@/pages/event/EventSales")
);
const EventSalesSuccess = lazy(() =>
  import("@/pages/event/EventSalesSuccess")
);
const EventSalesFailure = lazy(() =>
  import("@/pages/event/EventSalesFailure")
);

const SimpleEventRegistration = lazy(() =>
  import("@/pages/register/SimpleEventRegistration")
);

const SkillPassportPreRegistration = lazy(() =>
  import("@/pages/register/SkillPassportPreRegistration")
);

const NetworkError = lazy(() => import("@/pages/NetworkError"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));

const InternalTestingRegistration = lazy(() =>
  import("@/pages/register/InternalTestingRegistration")
);

const Register = lazy(() => import("@/pages/auth/components/SignIn/Register"));
const UnifiedLogin = lazy(() => import("@/pages/auth/UnifiedLogin"));
const UnifiedSignup = lazy(() => import("@/pages/auth/UnifiedSignup"));
const UnifiedForgotPassword = lazy(() => import("@/features/auth/ui/UnifiedForgotPassword"));
const TokenPasswordReset = lazy(() => import("@/pages/auth/TokenPasswordReset"));
const VerifyEmail = lazy(() => import("@/pages/auth/VerifyEmail"));
const AcceptInvite = lazy(() => import("@/pages/auth/AcceptInvite"));
const CompanySignup = lazy(() => import("@/pages/auth/CompanySignup"));
const SignupRecruiter = lazy(() =>
  import("@/pages/auth/components/SignIn/recruitment/SignupRecruiter")
);
const SignupAdmin = lazy(() =>
  import("@/pages/auth/components/SignIn/recruitment/SignupAdmin")
);
const SignInSchool = lazy(() =>
  import("@/pages/auth/components/SignIn/schools/SignInSchool")
);
const SignInUniversity = lazy(() =>
  import("@/pages/auth/components/SignIn/university/SignInUniversity")
);
const UniversityAdmin = lazy(() =>
  import("@/pages/auth/components/SignIn/university/UniversityAdmin")
);

const LearnerPublicViewer = lazy(() =>
  import("@/features/learner-profile/ui/LearnerPublicViewer")
);

const OrganizationSetupPage = lazy(() =>
  import("@/pages/onboarding/OrganizationSetupPage")
);

export const publicRoutes = [
  // Organization Setup (for admins without organization)
  <Route key="organization-setup" path="/organization-setup" element={<OrganizationSetupPage />} />,

  // Skill Passport Pre-Registration
  // Redirect /register/student to /register/learner
  <Route key="register-student-redirect" path="/register/student" element={<Navigate to="/register/learner" replace />} />,
  <Route key="register-learner" path="/register/learner" element={<SkillPassportPreRegistration />} />,
  <Route key="register-corporate" path="/register/corporate" element={<SkillPassportPreRegistration />} />,

  // Internal Testing Registration
  <Route key="internal-testing" path="/internal-testing" element={<InternalTestingRegistration />} />,

  // Receipt Page
  <Route key="receipt" path="/receipt/:orderId" element={<Receipt />} />,

  // Event Sales - Standalone
  <Route key="signup-plans" path="/signup/plans" element={<EventSales />} />,
  <Route key="signup-plans-success" path="/signup/plans/success" element={<EventSalesSuccess />} />,
  <Route key="signup-plans-failure" path="/signup/plans/failure" element={<EventSalesFailure />} />,

  // Register plans - alias
  <Route key="register-plans" path="/register/plans" element={<EventSales />} />,
  <Route key="register-plans-success" path="/register/plans/success" element={<EventSalesSuccess />} />,
  <Route key="register-plans-failure" path="/register/plans/failure" element={<EventSalesFailure />} />,

  // Public Layout Routes
  <Route key="public-layout" path="/" element={<PublicLayout />}>
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
    <Route path="/signup/company" element={<CompanySignup />} />
    <Route path="/forgot-password" element={<UnifiedForgotPassword />} />
    <Route path="/reset-password" element={<TokenPasswordReset />} />
    <Route path="/verify-email" element={<VerifyEmail />} />
    <Route path="/invite/accept" element={<AcceptInvite />} />

    {/* Deprecated login routes */}
    <Route path="/login/learner" element={<Navigate to="/login" replace />} />
    <Route path="/login/recruiter" element={<Navigate to="/login" replace />} />
    <Route path="/login/admin" element={<Navigate to="/login" replace />} />
    <Route path="/login/educator" element={<Navigate to="/login" replace />} />

    {/* Registration routes */}
    <Route path="/signup/recruitment" element={<Register />} />
    <Route path="/signup/:type" element={<Register />} />
    {/* Individual recruiter signup disabled - recruiters must be invited by organization admins */}
    <Route path="/signup/recruitment-recruiter" element={<Navigate to="/signup" replace />} />
    <Route path="/signup/recruitment-admin" element={<SignupAdmin />} />
    <Route path="/signin/school" element={<SignInSchool />} />
    <Route path="/signin/university" element={<SignInUniversity />} />
    <Route path="/signup/university-admin" element={<UniversityAdmin />} />

    <Route path="/subscription/plans" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
    <Route path="/subscription/plans/:type" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
    <Route path="/subscription/plans/:type/:mode" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />

    <Route path="/subscription/payment" element={<PaymentCompletion />} />
    <Route path="/subscription/payment/success" element={<PaymentSuccess />} />
    <Route path="/subscription/payment/failure" element={<PaymentFailure />} />
    <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
    <Route path="/invitation/accept" element={<AcceptInvitationPage />} />
    <Route path="/invitation/signup" element={<InvitationSignup />} />
    <Route path="/complete-profile" element={<CompleteProfile />} />
    <Route path="/network-error" element={<NetworkError />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
    <Route path="/learner/profile/:learnerId" element={<LearnerPublicViewer />} />
  </Route>,

  // Digital Portfolio routes with PortfolioLayout
  <Route key="portfolio-layout" path="/" element={<PortfolioLayout />}>
    <Route path="/portfolio" element={<DigitalPortfolioPage />} />
    <Route path="/digital-pp/homepage" element={<HomePage />} />
    <Route path="/passport" element={<DigitalPassportPage />} />
    <Route path="/video-portfolio" element={<DigitalVideoPortfolioPage />} />
    <Route path="/settings/theme" element={<DigitalThemeSettings />} />
    <Route path="/settings/layout" element={<DigitalLayoutSettings />} />
    <Route path="/settings/export" element={<DigitalExportSettings />} />
    <Route path="/settings/sharing" element={<DigitalSharingSettings />} />
  </Route>,
];
