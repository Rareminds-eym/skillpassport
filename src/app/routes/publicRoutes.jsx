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
  import("@/pages/subscription/PaymentSuccess")
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

const InternalTestingRegistration = lazy(() =>
  import("@/pages/register/InternalTestingRegistration")
);

const Register = lazy(() => import("@/pages/auth/components/SignIn/Register"));
const UnifiedLogin = lazy(() => import("@/pages/auth/UnifiedLogin"));
const UnifiedSignup = lazy(() => import("@/pages/auth/UnifiedSignup"));
const UnifiedForgotPassword = lazy(() => import("@/features/auth/ui/UnifiedForgotPassword"));
const PasswordReset = lazy(() => import("@/features/auth/ui/PasswordReset"));
const TokenPasswordReset = lazy(() => import("@/pages/auth/TokenPasswordReset"));
const ResetPassword = lazy(() => import("@/features/auth/ui/ResetPassword"));
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

const StudentPublicViewer = lazy(() =>
  import("@/features/student-profile/ui/StudentPublicViewer")
);

export const publicRoutes = [
  // Skill Passport Pre-Registration
  <Route key="register-student" path="/register/student" element={<SkillPassportPreRegistration />} />,
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
    <Route path="/forgot-password" element={<UnifiedForgotPassword />} />
    <Route path="/password-reset" element={<TokenPasswordReset />} />
    <Route path="/reset-password" element={<ResetPassword />} />

    {/* Deprecated login routes */}
    <Route path="/login/student" element={<Navigate to="/login" replace />} />
    <Route path="/login/recruiter" element={<Navigate to="/login" replace />} />
    <Route path="/login/admin" element={<Navigate to="/login" replace />} />
    <Route path="/login/educator" element={<Navigate to="/login" replace />} />

    {/* Registration routes */}
    <Route path="/signup/recruitment" element={<Register />} />
    <Route path="/signup/:type" element={<Register />} />
    <Route path="/signup/recruitment-recruiter" element={<SignupRecruiter />} />
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
    <Route path="/network-error" element={<NetworkError />} />
    <Route path="/student/profile/:studentId" element={<StudentPublicViewer />} />
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
