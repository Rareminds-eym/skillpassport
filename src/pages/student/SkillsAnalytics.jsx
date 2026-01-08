import SkillsDashboard from '../../components/Students/components/SkillsDashboard';
import { FeatureGate } from '../../components/Subscription/FeatureGate';

/**
 * Skills Analytics Page
 * Dedicated page to showcase the dynamic Top Skills in Demand feature
 * 
 * Wrapped with FeatureGate for skills_analytics add-on access control
 */
const SkillsAnalytics = () => {
  return (
    <FeatureGate featureKey="skills_analytics" showUpgradePrompt={true}>
      <SkillsDashboard />
    </FeatureGate>
  );
};

export default SkillsAnalytics;