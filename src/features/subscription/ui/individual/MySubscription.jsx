import SubscriptionWorkspace from '../SubscriptionWorkspace';

/** Current execution comes only from the authenticated subscription owner APIs. */
export default function MySubscription() {
  return <SubscriptionWorkspace />;
}
