import { Hero, Features, CoreFeatures, BusinessImpact, BuiltForCorporates, SecurityCompliance, CaseHighlights, FinalCTA, HowItWorks } from '../../components/Homepage';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <div id="next-section">
        <Features />
      </div>
      <CoreFeatures />
      <BusinessImpact />
      <BuiltForCorporates />
      <HowItWorks/>
      <CaseHighlights />
      <SecurityCompliance />
      <FinalCTA />
    </div>
  );
};

export default Home;
