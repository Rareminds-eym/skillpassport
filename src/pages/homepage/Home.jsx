import { Hero, Features, CoreFeatures, BusinessImpact, BuiltForCorporates, SecurityCompliance, CaseHighlights, FinalCTA, HowItWorks, ProductWalkthrough } from '../../components/Homepage';

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
      <ProductWalkthrough />
      <CaseHighlights />
      <SecurityCompliance />
      <FinalCTA />
    </div>
  );
};

export default Home;
