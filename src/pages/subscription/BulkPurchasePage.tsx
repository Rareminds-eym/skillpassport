/**
 * BulkPurchasePage
 *
 * Organization plan purchase. Plans, prices and the buyer subject come only from the published catalog
 * (owner decision 2a): the owner quote, order and settlement flow replaces the legacy per-seat wizard.
 * The organization is the signed-in identity's organization; included seats come from the plan, and
 * licenses are assigned afterwards from Subscription Management.
 */
import SubscriptionWorkspace from '@/features/subscription/ui/SubscriptionWorkspace';
import { useIsAuthenticated, useUser } from '@/shared/model/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

function BulkPurchasePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">Please log in to purchase organization subscriptions.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Log In</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {searchParams.get('mode') === 'add-seats' && (
        <div role="status" className="max-w-4xl mx-auto mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Seats are included in each published plan. To add capacity, upgrade your current subscription from{' '}
          <a className="underline" href="/subscription/manage">Manage subscription</a>, or choose a larger plan below.
        </div>
      )}
      <SubscriptionWorkspace view="catalog" />
    </>
  );
}

export default BulkPurchasePage;
