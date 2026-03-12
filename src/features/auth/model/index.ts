/**
 * Auth Model Public Exports
 * Authentication state management, context, and hooks
 */

// ============================================================================
// AUTH CONTEXT
// ============================================================================
export { 
  AuthProvider, 
  AuthContext,
  useAuth as useAuthContext
} from './AuthContext';

// ============================================================================
// AUTH HOOK
// ============================================================================
export { 
  useAuth,
  default as useAuthHook
} from './useAuth';

// ============================================================================
// TYPES
// ============================================================================
export type { 
  AuthState, 
  AuthContextType 
} from './AuthContext';
