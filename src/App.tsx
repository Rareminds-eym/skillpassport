import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { TourWrapper } from './app/providers/tour-wrapper';
import { TokenRefreshErrorNotification } from './app/providers/token-refresh-notification';
import AppRoutes from './app/routes/AppRoutes';

// Zustand stores - state management migrated from Context
import { initializeStores, useUser } from '@/shared/model/authStore';
import { useSubscriptionStore } from '@/features/subscription/model/subscriptionStore';

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

  // DEBUG: Log store identity on mount
  useEffect(() => {
    const storeState = useSubscriptionStore.getState() as any;
    console.log('🔧 [SubscriptionInitializer] Mounted. Store identity:', {
      _storeId: storeState._storeId,
      isLoading: storeState.isLoading,
      hasAccess: storeState.hasAccess,
      accessReason: storeState.accessReason,
      _currentUserId: storeState._currentUserId,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    console.log('🔧 [SubscriptionInitializer] useEffect fired. user?.id =', user?.id);

    if (user?.id) {
      const uid = user.id;
      console.log('🔧 [SubscriptionInitializer] Calling fetchSubscription for uid:', uid);
      // Fetch subscription then entitlements for the SAME userId
      // Pass uid explicitly to prevent stale _currentUserId reads
      fetchSubscription(uid)
        .then(() => {
          console.log('🔧 [SubscriptionInitializer] fetchSubscription resolved. Store state:', {
            isLoading: useSubscriptionStore.getState().isLoading,
            hasAccess: useSubscriptionStore.getState().hasAccess,
            accessReason: useSubscriptionStore.getState().accessReason,
            subscription: useSubscriptionStore.getState().subscription ? 'exists' : 'null',
            error: useSubscriptionStore.getState().error?.message || null,
          });
          if (!cancelled) fetchUserEntitlements(uid);
        })
        .catch((err) => {
          console.error('🔧 [SubscriptionInitializer] fetchSubscription REJECTED:', err);
          if (!cancelled) {
            console.error('SubscriptionInitializer: fetch failed', err);
          }
        });
    } else {
      console.log('🔧 [SubscriptionInitializer] No user, clearing access cache');
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