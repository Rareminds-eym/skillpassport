import SubscriptionRouteGuard from '../../components/Subscription/SubscriptionRouteGuard';
import MySubscription from './MySubscription';

/**
 * Subscription Management Route Component
 * - Shows subscription management page for authenticated users with active subscriptions
 * - Redirects unauthenticated users to subscription plans
 * - Uses centralized route guard for optimized status checking
 */
function SubscriptionManage() {
  return (
    <SubscriptionRouteGuard mode="manage" showSkeleton={true}>
      <MySubscription />
    </SubscriptionRouteGuard>
  );
}

export default SubscriptionManage;

