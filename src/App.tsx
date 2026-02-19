import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/Recruiter/components/Toast';
import { Toaster } from './components/Students/components/ui/toaster';
import SubscriptionPrefetch from './components/Subscription/SubscriptionPrefetch';
import TourWrapper from './components/Tours/TourWrapper';
import { AbilityProvider } from './context/AbilityContext';
import { AuthProvider } from './context/AuthContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { SearchProvider } from './context/SearchContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SupabaseAuthBridgeProvider } from './context/SupabaseAuthBridge';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import AppRoutes from './routes/AppRoutes';
import './utils/suppressRechartsWarnings'; // Suppress Recharts warnings globally

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection time (replaces cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      retry: 1,
    },
  },
});

function App() {
  // No scroll lock management needed
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <AuthProvider>
            <AbilityProvider>
              <PermissionsProvider>
                <SupabaseAuthBridgeProvider>
                  <SubscriptionProvider>
                    <SearchProvider>
                      <ToastProvider>
                        <TourWrapper>
                          <SubscriptionPrefetch />
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
              </PermissionsProvider>
            </AbilityProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
