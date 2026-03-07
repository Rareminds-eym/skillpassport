import { Outlet } from 'react-router-dom';
import Header from './Header';
import { PromotionalBanner, AssessmentPromotionalBanner } from '../components/Homepage';
import {
  PromotionalEventProvider,
  usePromotionalEventContext,
} from '../contexts/PromotionalEventContext';
import { AssessmentPromotionalProvider, useAssessmentPromotionalContext } from '../contexts/AssessmentPromotionalContext';
import { useUserRole } from '../stores';

const PortfolioLayoutContent = () => {
  const { event, showBanner, dismissBanner, getTimeRemaining } = usePromotionalEventContext();
  const { 
    showBanner: showAssessmentBanner, 
    dismissBanner: dismissAssessmentBanner,
    getTimeRemaining: getAssessmentTimeRemaining
  } = useAssessmentPromotionalContext();
  const { role } = useUserRole();

  // Don't show promotional banners for admin users or learners
  const isAdminUser = role && (role.includes('admin') || role === 'admin');
  const isLearner = role === 'learner';
  const shouldShowAssessmentBanner = showAssessmentBanner && !isAdminUser && !isLearner;
  const shouldShowPromoBanner = showBanner && !isAdminUser && !isLearner;

  // Show assessment banner if assessment modal was dismissed, otherwise show promo banner
  const hasAnyBanner = shouldShowAssessmentBanner || shouldShowPromoBanner;

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
          isOpen={shouldShowPromoBanner}
          onClose={dismissBanner}
          getTimeRemaining={getTimeRemaining}
        />
      )}

      {/* Add margin-top when any banner is visible */}
      <div className={hasAnyBanner ? 'mt-[36px] sm:mt-[40px]' : ''}>
        <Header hasBanner={hasAnyBanner} />
        <main className="flex-1">
          <Outlet />
        </main>
        {/* No Footer for portfolio pages */}
      </div>
    </div>
  );
};

const PortfolioLayout = () => {
  return (
    <PromotionalEventProvider>
      <AssessmentPromotionalProvider>
        <PortfolioLayoutContent />
      </AssessmentPromotionalProvider>
    </PromotionalEventProvider>
  );
};

export default PortfolioLayout;