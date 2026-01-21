// Global type declarations for JSX modules without types

declare module '@/context/AuthContext' {
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  export const useAuth: () => any;
}

declare module '../../context/AuthContext' {
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  export const useAuth: () => any;
}

declare module '../../../context/AuthContext' {
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  export const useAuth: () => any;
}

declare module './context/AuthContext' {
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
  export const useAuth: () => any;
}

declare module './context/SearchContext' {
  export const SearchProvider: React.FC<{ children: React.ReactNode }>;
  export const useSearch: () => any;
}

declare module './context/SubscriptionContext' {
  export const SubscriptionProvider: React.FC<{ children: React.ReactNode }>;
  export const useSubscription: () => any;
}

declare module './context/SupabaseAuthBridge' {
  export const SupabaseAuthBridge: React.FC<{ children: React.ReactNode }>;
}

declare module './context/SupabaseAuthContext' {
  export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }>;
  export const useSupabaseAuth: () => any;
}

declare module './routes/AppRoutes' {
  const AppRoutes: React.FC;
  export default AppRoutes;
}

declare module './components/Students/components/ui/toaster' {
  export const Toaster: React.FC;
}

declare module './components/Subscription/SubscriptionPrefetch' {
  const SubscriptionPrefetch: React.FC;
  export default SubscriptionPrefetch;
}

// Supabase global
declare const supabase: any;
