import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from '../components/Footer';
import { PromotionalBanner, AssessmentPromotionalBanner } from '../components/Homepage';
import {
  PromotionalEventProvider,
  usePromotionalEventContext,
} from '../contexts/PromotionalEventContext';
import {
  AssessmentPromotionalProvider,
  useAssessmentPromotionalContext,
} from '../contexts/AssessmentPromotionalContext';
import useAuth from '../hooks/useAuth';
import { useSubscriptionQuery } from '../hooks/Subscription/useSubscriptionQuery';
import { isActiveOrPaused } from '../utils/subscriptionHelpers';

// Import role-specific headers
import StudentHeader from '../components/Students/components/Header';
import EducatorHeader from '../components/educator/Header';
import AdminHeader from '../components/admin/Header';
import RecruiterHeader from '../components/Recruiter/components/Header';
import SubscriptionPurchaseHeader from '../components/Subscription/SubscriptionPurchaseHeader';
import { useState } from 'react';

const PublicLayoutContent = () => {
  const location = useLocation();
  const { isAuthenticated, role: userRole, user } = useAuth();
  const { subscriptionData, loading: subscriptionLoading } = useSubscriptionQuery();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('subscription');

  const { event, showBanner, dismissBanner, getTimeRemaining } = usePromotionalEventContext();
  const {
    showBanner: showAssessmentBanner,
    dismissBanner: dismissAssessmentBanner,
    getTimeRemaining: getAssessmentTimeRemaining,
  } = useAssessmentPromotionalContext();

  // Show assessment banner if assessment modal was dismissed, otherwise show promo banner
  const hasAnyBanner = showAssessmentBanner || showBanner;

  // Check if we're on a subscription page
  const isSubscriptionPage = location.pathname.startsWith('/subscription/');

  // Check if user has active subscription
  const hasActiveSubscription = subscriptionData && isActiveOrPaused(subscriptionData.status);

  // Determine which header to render
  const renderHeader = () => {
    // If authenticated and on subscription page
    if (isAuthenticated && isSubscriptionPage) {
      // While loading subscription data, show simplified header to avoid flickering
      if (subscriptionLoading) {
        return <SubscriptionPurchaseHeader userEmail={user?.email} hasBanner={hasAnyBanner} />;
      }

      // If user doesn't have active subscription, show simplified purchase header
      if (!hasActiveSubscription) {
        return <SubscriptionPurchaseHeader userEmail={user?.email} hasBanner={hasAnyBanner} />;
      }

      // If user has active subscription, show role-specific header
      if (userRole) {
        // Student roles
        if (
          userRole === 'student' ||
          userRole === 'school_student' ||
          userRole === 'college_student'
        ) {
          return <StudentHeader activeTab={activeTab} setActiveTab={setActiveTab} />;
        }

        // Educator roles
        if (
          userRole === 'educator' ||
          userRole === 'school_educator' ||
          userRole === 'college_educator'
        ) {
          return (
            <EducatorHeader
              onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
              showMobileMenu={showMobileMenu}
            />
          );
        }

        // Admin roles
        if (
          userRole === 'admin' ||
          userRole === 'super_admin' ||
          userRole === 'rm_admin' ||
          userRole === 'school_admin' ||
          userRole === 'college_admin' ||
          userRole === 'university_admin'
        ) {
          return (
            <AdminHeader
              onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
              showMobileMenu={showMobileMenu}
            />
          );
        }

        // Recruiter role
        if (userRole === 'recruiter') {
          return (
            <RecruiterHeader
              onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
              showMobileMenu={showMobileMenu}
            />
          );
        }
      }
    }

    // Default: show public header
    return <Header hasBanner={hasAnyBanner} />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Assessment Promotional Banner - Shows after modal is dismissed */}
      <AssessmentPromotionalBanner
        isOpen={showAssessmentBanner}
        onClose={dismissAssessmentBanner}
        getTimeRemaining={getAssessmentTimeRemaining}
      />

      {/* Promotional Banner - Shows after promo modal is dismissed (only if assessment banner not showing) */}
      {!showAssessmentBanner && (
        <PromotionalBanner
          event={event}
          isOpen={showBanner}
          onClose={dismissBanner}
          getTimeRemaining={getTimeRemaining}
        />
      )}

      {/* Add margin-top when any banner is visible */}
      <div className={hasAnyBanner ? 'mt-[36px] sm:mt-[40px]' : ''}>
        {renderHeader()}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

const PublicLayout = () => {
  return (
    <PromotionalEventProvider>
      <AssessmentPromotionalProvider>
        <PublicLayoutContent />
      </AssessmentPromotionalProvider>
    </PromotionalEventProvider>
  );
};

export default PublicLayout;
