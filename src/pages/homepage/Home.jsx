import { Hero, Features, BusinessImpact, BuiltForCorporates, SecurityCompliance, CaseHighlights, FinalCTA, HowItWorks } from '../../components/Homepage';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
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
