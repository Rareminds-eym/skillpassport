import { Hero, Features, BusinessImpact, BuiltForCorporates, SecurityCompliance, CaseHighlights, FinalCTA } from '../../components/Homepage';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <BusinessImpact />
      <BuiltForCorporates />
      <SecurityCompliance />
      <CaseHighlights />
      <FinalCTA />
    </div>
  );
};

export default Home;
