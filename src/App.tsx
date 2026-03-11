import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import TourWrapper from './components/Tours/TourWrapper';
import TokenRefreshErrorNotification from './components/TokenRefreshErrorNotification';
import AppRoutes from './routes/AppRoutes';

// Zustand stores - state management migrated from Context
import { initializeStores, useUser } from './stores';
import { useSubscriptionStore } from './stores/subscriptionStore';

/**
 * SubscriptionInitializer
 * 
 * Triggers subscription fetch when user changes.
 * Replaces SubscriptionStoreSync + SubscriptionPrefetch with a single useEffect.
 */
function SubscriptionInitializer() {
  const user = useUser();
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const clearAccessCache = useSubscriptionStore((s) => s.clearAccessCache);

  useEffect(() => {
    if (user?.id) {
      fetchSubscription(user.id);
    } else {
      clearAccessCache();
    }
  }, [user?.id, fetchSubscription, clearAccessCache]);

  return null;
}

function App() {
  // Initialize stores on mount
  useEffect(() => {
    initializeStores();
  }, []);

  return (

    <BrowserRouter>
      <TourWrapper>
        <SubscriptionInitializer />
        <TokenRefreshErrorNotification />
        <AppRoutes />
        <HotToaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </TourWrapper>
    </BrowserRouter>

  );
}

export default App;
