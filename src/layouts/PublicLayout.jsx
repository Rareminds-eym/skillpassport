import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from '../components/Footer';
import { PromotionalBanner } from '../components/Homepage';
import { usePromotionalEvent } from '../hooks/usePromotionalEvent';

const PublicLayout = () => {
  const { event, showBanner, dismissBanner, getTimeRemaining } = usePromotionalEvent();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Promotional Banner - Above Header */}
      <PromotionalBanner
        event={event}
        isOpen={showBanner}
        onClose={dismissBanner}
        getTimeRemaining={getTimeRemaining}
      />

      {/* Add margin-top when banner is visible to push content down (smaller banner ~36px) */}
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

export default PublicLayout;
