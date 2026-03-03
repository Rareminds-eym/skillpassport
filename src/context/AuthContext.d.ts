import { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  role: string;
  isDemoMode?: boolean;
  user_metadata?: {
    full_name?: string;
    user_role?: string;
    role?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface AuthContextValue {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  role: string | null;
  checkSessionValidity: () => Promise<any>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export function useAuth(): AuthContextValue;
export function AuthProvider(props: AuthProviderProps): JSX.Element;
