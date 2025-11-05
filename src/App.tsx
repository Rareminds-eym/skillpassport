import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { SupabaseAuthBridgeProvider } from './context/SupabaseAuthBridge';
import { SearchProvider } from './context/SearchContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/Students/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import { ToastProvider } from './components/Recruiter/components/Toast';

function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <AuthProvider>
          <SupabaseAuthBridgeProvider>
            <SearchProvider>
              <ToastProvider>
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
              </ToastProvider>
            </SearchProvider>
          </SupabaseAuthBridgeProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
    </BrowserRouter>
  );
}

export default App;
