import { Outlet, useLocation } from 'react-router-dom';
import { Header, Footer } from '@/shared/ui';
import PromotionalBanner from '@/shared/ui/marketing/PromotionalBanner';
import AssessmentPromotionalBanner from '@/shared/ui/marketing/AssessmentPromotionalBanner';


import { useAuth } from '@/features/auth';
import { useSubscriptionQuery, isActiveOrPaused } from '@/features/subscription';

// Import role-specific headers
import { Header as LearnerHeader } from '@/widgets/learner-dashboard';
import { Header as EducatorHeader } from '@/features/educator';
import { Header as AdminHeader } from '@/widgets/admin-navigation';
import { Header as RecruiterHeader } from '@/features/recruiter-pipeline';
import { SubscriptionPurchaseHeader } from '@/features/subscription';
import { useState } from 'react';

import { useAssessmentPromotional, useCurrentPromotional } from '@/features/promotional/model/promotionalStore';
import { useSubscriptionAccess } from '@/features/subscription/model/subscriptionStore';
import { useIsAuthenticated, useUserRole, useUser } from '@/shared/model/authStore';
const PublicLayoutContent = () => {
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { role: userRole } = useUserRole();
  const user = useUser();
  const { subscriptionData, loading: subscriptionLoading } = useSubscriptionAccess();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('subscription');

  const { event, showBanner, dismissBanner, getTimeRemaining } = useCurrentPromotional();
  const {
    showBanner: showAssessmentBanner,
    dismissBanner: dismissAssessmentBanner,
    getTimeRemaining: getAssessmentTimeRemaining
  } = useAssessmentPromotional();

  // Don't show assessment banner for learners
  const isLearner = userRole === 'learner';
  const shouldShowAssessmentBanner = showAssessmentBanner && !isLearner;

  // Show assessment banner if assessment modal was dismissed, otherwise show promo banner
  const hasAnyBanner = shouldShowAssessmentBanner || showBanner;

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
        // Learner roles
        if (userRole === 'learner' || userRole === 'school-learner' || userRole === 'college-learner') {
          return <LearnerHeader activeTab={activeTab} setActiveTab={setActiveTab} />;
        }

        // Educator roles
        if (userRole === 'educator' || userRole === 'school_educator' || userRole === 'college_educator') {
          return (
            <EducatorHeader
              onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
              showMobileMenu={showMobileMenu}
            />
          );
        }

        // Admin roles
        if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'rm_admin' ||
          userRole === 'school_admin' || userRole === 'college_admin' || userRole === 'university_admin') {
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
        isOpen={shouldShowAssessmentBanner}
        onClose={dismissAssessmentBanner}
        getTimeRemaining={getAssessmentTimeRemaining}
      />

      {/* Promotional Banner - Shows after promo modal is dismissed (only if assessment banner not showing) */}
      {!shouldShowAssessmentBanner && (
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
  return <PublicLayoutContent />;
};

export default PublicLayout;