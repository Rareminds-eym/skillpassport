/**
 * Auth Model Public Exports (SSO-only)
 */
import type { ReactNode } from 'react';

// Auth hook (delegates to SSO Zustand store)
export { useAuth, default as useAuthHook } from './useAuth';

// Legacy types kept for backward compatibility
export interface AuthState {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  role: string | null;
}

export interface AuthContextType extends AuthState {
  login: (userData: any) => void;
  logout: () => Promise<void>;
  checkSessionValidity: () => Promise<any>;
}

// AuthProvider stub (no longer needed — auth is in Zustand store)
export const AuthProvider = ({ children }: { children: ReactNode }) => children;
export const AuthContext = null;
export const useAuthContext = () => {
  throw new Error('useAuthContext is deprecated. Use useAuth() from @/features/auth/model instead.');
};
