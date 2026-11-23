import { useSearchParams } from 'react-router-dom';
import SubscriptionWorkspace from '../SubscriptionWorkspace';

const revisionPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Published terms never infer purchase authority or substitute legacy plan data. */
export default function SubscriptionPlans({ onPaymentConfirmed }) {
  const [search] = useSearchParams();
  const revision = search.get('revision');
  return <SubscriptionWorkspace catalogType={search.get('type') ?? undefined} view="catalog" selectedRevisionId={revision && revisionPattern.test(revision) ? revision.toLowerCase() : undefined} onPaymentConfirmed={onPaymentConfirmed} />;
}
