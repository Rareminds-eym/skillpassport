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
  AssessmentPromotionalModal,
} from '../../components/Homepage';
import { useAssessmentPromotionalContext } from '../../contexts/AssessmentPromotionalContext';

const Home = () => {
  const { 
    showModal: showAssessmentModal, 
    dismissModal: dismissAssessmentModal,
    getTimeRemaining: getAssessmentTimeRemaining
  } = useAssessmentPromotionalContext();

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

      {/* Assessment Promotional Modal - Shows on first visit */}
      <AssessmentPromotionalModal
        isOpen={showAssessmentModal}
        onClose={dismissAssessmentModal}
        getTimeRemaining={getAssessmentTimeRemaining}
      />
    </div>
  );
};

export default Home;
