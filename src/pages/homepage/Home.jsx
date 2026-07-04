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
} from '@/pages/homepage';

import SEOHead from '@/shared/ui/SEOHead';
import { useAssessmentPromotional } from '@/features/promotional/model/promotionalStore';
import { useIsAuthenticated } from '@/shared/model/authStore';
import { useEffect, useRef } from 'react';
import { trackEvent, AnalyticsEvents } from '@/shared/lib/analytics';
const Home = () => {
  const {
    showModal: storeShowAssessmentModal,
    dismissModal: dismissAssessmentModal,
    getTimeRemaining: getAssessmentTimeRemaining
  } = useAssessmentPromotional();
  
  const isAuthenticated = useIsAuthenticated();
  const showAssessmentModal = storeShowAssessmentModal && !isAuthenticated;

  // Track scroll depth - fires once when user scrolls past 50%
  const hasTrackedScroll = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (hasTrackedScroll.current) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercent = ((scrollTop + windowHeight) / documentHeight) * 100;

      if (scrollPercent >= 50) {
        hasTrackedScroll.current = true;
        trackEvent(AnalyticsEvents.SCROLL_DEPTH, {
          page_path: window.location.pathname,
        });
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
