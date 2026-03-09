import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import SubscriptionPrefetch from './components/Subscription/SubscriptionPrefetch';
import TourWrapper from './components/Tours/TourWrapper';
import TokenRefreshErrorNotification from './components/TokenRefreshErrorNotification';
import { SubscriptionProvider } from './context/SubscriptionContext';
import AppRoutes from './routes/AppRoutes';
import './utils/suppressRechartsWarnings';

// Zustand stores - state management migrated from Context
import { initializeStores } from './stores';

function App() {
  // Initialize stores on mount
  useEffect(() => {
    initializeStores();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TourWrapper>
          <SubscriptionProvider>
            <SubscriptionPrefetch />
            <TokenRefreshErrorNotification />
            <AppRoutes />
          </SubscriptionProvider>
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
