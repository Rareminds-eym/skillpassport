/**
 * Auth Recovery Service
 * 
 * Handles authentication recovery scenarios like expired tokens
 */

import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('auth-recovery');

// Define proper error interfaces
interface AuthError {
  message: string;
  status?: number;
  error?: string;
}

interface ApiErrorResponse {
  status: number;
  message?: string;
  error?: string;
}

export class AuthRecoveryService {
  /**
   * Attempt to recover from authentication failures
   */
  static async attemptRecovery(): Promise<boolean> {
    try {
      logger.info('Attempting auth recovery...');
      
      const store = useAuthStore.getState();
      
      // Try to initialize/refresh the session with granular error handling
      let initSucceeded = false;
      try {
        await store.initialize();
        // Check state after initialization to determine success
        const stateAfterInit = useAuthStore.getState();
        initSucceeded = stateAfterInit.isAuthenticated && !!stateAfterInit.user;
      } catch (initError) {
        const errorInstance = initError instanceof Error ? initError : new Error(String(initError));
        logger.warn('Store initialization failed during auth recovery', { 
          error: errorInstance.message,
          stack: errorInstance.stack 
        });
      }
      
      // Check if we're now authenticated after initialization
      if (initSucceeded) {
        logger.info('Auth recovery successful via initialization');
        return true;
      }
      
      // Try refresh session if initialize didn't work
      try {
        const refreshSuccess = await store.refreshSession();
        if (refreshSuccess) {
          logger.info('Auth recovery successful via refresh');
          return true;
        }
      } catch (refreshError) {
        const errorInstance = refreshError instanceof Error ? refreshError : new Error(String(refreshError));
        logger.warn('Session refresh failed during auth recovery', { 
          error: errorInstance.message,
          stack: errorInstance.stack 
        });
      }
      
      logger.warn('Auth recovery failed - session could not be restored');
      return false;
      
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      logger.error('Auth recovery failed with unexpected error', errorInstance);
      return false;
    }
  }

  /**
   * Handle auth errors in API responses
   */
  static async handleAuthError(error: unknown): Promise<boolean> {
    if (this.isAuthError(error)) {
      logger.info('Auth error detected, attempting recovery');
      return await this.attemptRecovery();
    }
    return false;
  }

  /**
   * Check if an error is authentication related
   */
  static isAuthError(error: unknown): boolean {
    if (!error) return false;
    
    // Handle Error objects
    if (error instanceof Error) {
      const message = error.message;
      return this.hasAuthKeywords(message) || this.hasAuthStatus(error);
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return this.hasAuthKeywords(error);
    }
    
    // Handle structured error objects
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as AuthError | ApiErrorResponse;
      const message = errorObj.message || errorObj.error || '';
      return this.hasAuthKeywords(message) || this.hasAuthStatus(errorObj);
    }
    
    return false;
  }

  private static hasAuthKeywords(message: string): boolean {
    return message.includes('Unauthorized') ||
           message.includes('no valid token') ||
           message.includes('Authentication required') ||
           message.includes('Session expired') ||
           message.includes('Invalid token') ||
           message.includes('401');
  }

  private static hasAuthStatus(errorObj: unknown): boolean {
    return typeof errorObj === 'object' && 
           errorObj !== null && 
           'status' in errorObj && 
           (errorObj as { status: unknown }).status === 401;
  }

  /**
   * Redirect to login with current page as return URL
   * Sanitizes the current URL to prevent injection attacks
   */
  static redirectToLogin(): void {
    // Sanitize current URL - only include pathname and search, exclude hash
    const { pathname, search } = window.location;
    const sanitizedUrl = `${pathname}${search}`;
    const encodedUrl = encodeURIComponent(sanitizedUrl);
    
    // Validate that we're not redirecting to external sites
    if (pathname.startsWith('http://') || pathname.startsWith('https://') || pathname.includes('//')) {
      logger.warn('Unsafe redirect URL detected, using root path', { pathname });
      window.location.href = '/login?redirect=/';
      return;
    }
    
    window.location.href = `/login?redirect=${encodedUrl}`;
  }
}

/**
 * Hook for components to use auth recovery
 */
export function useAuthRecovery() {
  const handleAuthError = async (error: unknown): Promise<boolean> => {
    const recovered = await AuthRecoveryService.handleAuthError(error);
    if (!recovered && AuthRecoveryService.isAuthError(error)) {
      // If recovery failed, redirect to login
      AuthRecoveryService.redirectToLogin();
    }
    return recovered;
  };

  return {
    handleAuthError,
    attemptRecovery: AuthRecoveryService.attemptRecovery,
    redirectToLogin: AuthRecoveryService.redirectToLogin,
    isAuthError: AuthRecoveryService.isAuthError
  };
}