import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from '../components/Footer';
import { PromotionalBanner } from '../components/Homepage';
import {
  PromotionalEventProvider,
  usePromotionalEventContext,
} from '../contexts/PromotionalEventContext';

const PublicLayoutContent = () => {
  const { event, showBanner, dismissBanner, getTimeRemaining } = usePromotionalEventContext();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Promotional Banner - Above Header */}
      <PromotionalBanner
        event={event}
        isOpen={showBanner}
        onClose={dismissBanner}
        getTimeRemaining={getTimeRemaining}
      />

      {/* Add margin-top when banner is visible */}
      <div className={showBanner ? 'mt-[36px] sm:mt-[40px]' : ''}>
        <Header hasBanner={showBanner} />
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
      <PublicLayoutContent />
    </PromotionalEventProvider>
  );
};

export default PublicLayout;
