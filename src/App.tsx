import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import SubscriptionPrefetch from './components/Subscription/SubscriptionPrefetch';
import TourWrapper from './components/Tours/TourWrapper';
import TokenRefreshErrorNotification from './components/TokenRefreshErrorNotification';
import AppRoutes from './routes/AppRoutes';
import './utils/suppressRechartsWarnings';

// Zustand stores - state management migrated from Context
import { initializeStores } from './stores';

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
  // Initialize stores on mount
  useEffect(() => {
    initializeStores();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TourWrapper>
          <SubscriptionPrefetch />
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
    </QueryClientProvider>
  );
}

export default App;
