import { FeatureGate } from '../../components/subscription/FeatureGate';
import RecruiterCopilot from '../../features/recruiter-copilot/components/RecruiterCopilot';

/**
 * Recruitment Intelligence Page
 * 
 * Intelligent system specifically designed for recruiters to:
 * - Find and match top candidates
 * - Get candidate insights and analytics
 * - Analyze talent pool distribution
 * - Receive hiring recommendations
 * - Get skill trends and market intelligence
 * - Access interview guidance
 * - Review recruitment pipeline
 * 
 * Wrapped with FeatureGate for recruiter_ai add-on access control
 */
export default function RecruiterAI() {
  return (
    <FeatureGate featureKey="recruiter_ai" showUpgradePrompt={true}>
      <RecruiterCopilot />
    </FeatureGate>
  );
}
