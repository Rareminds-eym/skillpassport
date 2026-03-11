import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/Recruiter/components/Toast';
import { Toaster } from './components/Students/components/ui/toaster';
import { SubscriptionPrefetch } from '@/features/subscription/ui/shared';
import TourWrapper from './components/Tours/TourWrapper';
import TokenRefreshErrorNotification from './components/TokenRefreshErrorNotification';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SupabaseAuthBridgeProvider } from './context/SupabaseAuthBridge';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
  const fetchUserEntitlements = useSubscriptionStore((s) => s.fetchUserEntitlements);
  const clearAccessCache = useSubscriptionStore((s) => s.clearAccessCache);

  useEffect(() => {
    let cancelled = false;

    if (user?.id) {
      const uid = user.id;
      // Fetch subscription then entitlements for the SAME userId
      // Pass uid explicitly to prevent stale _currentUserId reads
      fetchSubscription(uid)
        .then(() => {
          if (!cancelled) fetchUserEntitlements(uid);
        })
        .catch((err) => {
          if (!cancelled) {
            console.error('SubscriptionInitializer: fetch failed', err);
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

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <SupabaseAuthProvider>
            <AuthProvider>
              <SupabaseAuthBridgeProvider>
                <SubscriptionProvider>
                  <SearchProvider>
                    <ToastProvider>
                      <TourWrapper>
                        <SubscriptionPrefetch />
                        <TokenRefreshErrorNotification />
                        <AppRoutes />
                        <Toaster />
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
                    </ToastProvider>
                  </SearchProvider>
                </SubscriptionProvider>
              </SupabaseAuthBridgeProvider>
            </AuthProvider>
          </SupabaseAuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
