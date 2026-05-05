import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TourWrapper } from './app/providers/tour-wrapper';
import { TokenRefreshErrorNotification } from './app/providers/token-refresh-notification';
import AppRoutes from './app/routes/AppRoutes';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('app');

// Zustand stores - state management migrated from Context
import { initializeStores, useUser, useAuthLoading, useIsAuthenticated } from '@/shared/model/authStore';
import { useSubscriptionStore } from '@/features/subscription/model/subscriptionStore';
import { ssoClient } from '@/shared/api/ssoClient';

/**
 * SubscriptionInitializer
 * 
 * Triggers subscription fetch when user changes.
 * Replaces SubscriptionStoreSync + SubscriptionPrefetch with a single useEffect.
 */
function SubscriptionInitializer() {
  const user = useUser();
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const fetchUserEntitlements = useSubscriptionStore((s) => s.fetchUserEntitlements);
  const clearAccessCache = useSubscriptionStore((s) => s.clearAccessCache);


  useEffect(() => {
    let cancelled = false;

    if (user?.id) {
      const uid = user.id;
      fetchSubscription(uid)
        .then(() => {
          if (!cancelled) fetchUserEntitlements(uid);
        })
        .catch((err) => {
          if (!cancelled) {
            logger.error('Error fetching subscription', err as Error);
          }
        });
    } else {
      clearAccessCache();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, fetchSubscription, fetchUserEntitlements, clearAccessCache]);

  return null;
}

function App() {
  // Initialize stores on mount
  useEffect(() => {
    initializeStores();
  }, []);

  const authLoading = useAuthLoading();
  const isAuthenticated = useIsAuthenticated();
  const queryClient = useQueryClient();

  // Clear TanStack Query cache on logout (prevent stale data from previous user)
  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated, queryClient]);

  // Clear TanStack Query cache on org switch
  useEffect(() => {
    const unsub = ssoClient.onAuthStateChange((event) => {
      if (event === 'REFRESH') {
        // Org switch triggers a REFRESH event with new org_id in the JWT
        queryClient.invalidateQueries();
      }
    });
    return unsub;
  }, [queryClient]);

  // Show loading state during session initialization
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

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