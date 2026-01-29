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
        title="Skill Passport | India's Verified Talent Infrastructure by Rareminds"
        description="description" content="Skill Passport is India’s verified talent infrastructure—validating skills at source to enable faster, trust-based hiring for employers, institutions, and learners."
        keywords="Skill Passport, verified skills India, talent verification platform, pre-verified talent, faster hiring India, employability infrastructure, Rareminds Skill Passport"
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
