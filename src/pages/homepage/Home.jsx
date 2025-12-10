import {
  Hero,
  Features,
  CoreFeatures,
  BusinessImpact,
  BuiltForCorporates,
  SecurityCompliance,
  CaseHighlights,
  FinalCTA,
  HowItWorks,
  ProductWalkthrough,
  PromotionalModal,
} from '../../components/Homepage';
import { usePromotionalEvent } from '../../hooks/usePromotionalEvent';

const Home = () => {
  const { event, showModal, dismissModal, getTimeRemaining } = usePromotionalEvent();

  return (
    <div className="min-h-screen">
      <Hero />
      <div id="next-section">
        <Features />
      </div>
      <CoreFeatures />
      <BusinessImpact />
      <BuiltForCorporates />
      <HowItWorks />
      <ProductWalkthrough />
      <CaseHighlights />
      <SecurityCompliance />
      <FinalCTA />

      {/* Promotional Modal - Shows on first visit */}
      <PromotionalModal
        event={event}
        isOpen={showModal}
        onClose={dismissModal}
        getTimeRemaining={getTimeRemaining}
      />
    </div>
  );
};

export default Home;
