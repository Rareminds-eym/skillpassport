import { Outlet } from 'react-router-dom';
import Header from './Header';
import { PromotionalBanner } from '../components/Homepage';
import {
  PromotionalEventProvider,
  usePromotionalEventContext,
} from '../contexts/PromotionalEventContext';

const PortfolioLayoutContent = () => {
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
        {/* No Footer for portfolio pages */}
      </div>
    </div>
  );
};

const PortfolioLayout = () => {
  return (
    <PromotionalEventProvider>
      <PortfolioLayoutContent />
    </PromotionalEventProvider>
  );
};

export default PortfolioLayout;