import { Toaster as HotToaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import SubscriptionPrefetch from './components/Subscription/SubscriptionPrefetch';
import TourWrapper from './components/Tours/TourWrapper';
import TokenRefreshErrorNotification from './components/TokenRefreshErrorNotification';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import AppRoutes from './routes/AppRoutes';
import './utils/suppressRechartsWarnings'; // Suppress Recharts warnings globally

function App() {
  // No scroll lock management needed
  return (
    <BrowserRouter>
        <SupabaseAuthProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <SearchProvider>
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
              </SearchProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </BrowserRouter>
  );
}

export default App;
