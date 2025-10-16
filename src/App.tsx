import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { SupabaseAuthBridgeProvider } from './context/SupabaseAuthBridge';
import { SearchProvider } from './context/SearchContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/Students/components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <AuthProvider>
          <SupabaseAuthBridgeProvider>
            <SearchProvider>
              <AppRoutes />
              <Toaster />
            </SearchProvider>
          </SupabaseAuthBridgeProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
    </BrowserRouter>
  );
}

export default App;
