import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from '../components/Footer';
import { PromotionalBanner, AssessmentPromotionalBanner } from '../components/Homepage';
import {
  PromotionalEventProvider,
  usePromotionalEventContext,
} from '../contexts/PromotionalEventContext';
import { AssessmentPromotionalProvider, useAssessmentPromotionalContext } from '../contexts/AssessmentPromotionalContext';

const PublicLayoutContent = () => {
  const { event, showBanner, dismissBanner, getTimeRemaining } = usePromotionalEventContext();
  const { 
    showBanner: showAssessmentBanner, 
    dismissBanner: dismissAssessmentBanner,
    getTimeRemaining: getAssessmentTimeRemaining
  } = useAssessmentPromotionalContext();

  // Show assessment banner if assessment modal was dismissed, otherwise show promo banner
  const hasAnyBanner = showAssessmentBanner || showBanner;

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
        <Header hasBanner={hasAnyBanner} />
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
