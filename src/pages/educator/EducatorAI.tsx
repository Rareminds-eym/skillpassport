import { FeatureGate } from '../../components/Subscription/FeatureGate';
import EducatorCopilot from '../../features/educator-copilot/components/EducatorCopilot';

/**
 * Teaching Intelligence Page
 *
 * Intelligent system specifically designed for educators to:
 * - Get student career insights and analytics
 * - Identify students needing intervention
 * - Receive guidance recommendations
 * - Analyze class performance and trends
 * - Get skill development suggestions
 * - Access career readiness assessments
 *
 * Wrapped with FeatureGate for educator_ai add-on access control
 */
export default function EducatorAI() {
  return (
    // @ts-expect-error - Auto-suppressed for migration
    <FeatureGate featureKey="educator_ai" showUpgradePrompt={true}>
      <EducatorCopilot />
    </FeatureGate>
  );
}
