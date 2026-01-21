import { FeatureGate } from '../../components/Subscription/FeatureGate';
import CareerAssistant from '../../features/career-assistant/components/CareerAssistant';

/**
 * CareerAI Page - Wrapped with FeatureGate for add-on access control
 * Feature key: career_ai
 */
export default function CareerAI() {
  return (
    // @ts-expect-error - Auto-suppressed for migration
    <FeatureGate featureKey="career_ai" showUpgradePrompt={true}>
      <CareerAssistant />
    </FeatureGate>
  );
}
