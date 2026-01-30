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
import SEOHead from '../../components/SEO/SEOHead';

const Home = () => {
  const { 
    showModal: showAssessmentModal, 
    dismissModal: dismissAssessmentModal,
    getTimeRemaining: getAssessmentTimeRemaining
  } = useAssessmentPromotionalContext();

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Skill Ecosystem - Educational Management & Career Development Platform"
        description="Transform education with AI-powered career guidance, student management, and recruitment solutions. Trusted by schools, colleges, and universities worldwide."
        keywords="educational management, AI career guidance, student management, school management system, college management, university management, recruitment platform"
        url="https://skillpassport.rareminds.in/"
      />
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
