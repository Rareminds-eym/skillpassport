/**
 * Auth Recovery Service
 * 
 * Handles authentication recovery scenarios like expired tokens
 */

import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('auth-recovery');

export class AuthRecoveryService {
  /**
   * Attempt to recover from authentication failures
   */
  static async attemptRecovery(): Promise<boolean> {
    try {
      logger.info('Attempting auth recovery...');
      
      const store = useAuthStore.getState();
      
      // Try to initialize/refresh the session
      await store.initialize();
      
      // Check if we're now authenticated
      const newState = useAuthStore.getState();
      if (newState.isAuthenticated && newState.user) {
        logger.info('Auth recovery successful');
        return true;
      }
      
      // Try refresh session if initialize didn't work
      const refreshSuccess = await store.refreshSession();
      if (refreshSuccess) {
        logger.info('Auth recovery via refresh successful');
        return true;
      }
      
      logger.warn('Auth recovery failed - session could not be restored');
      return false;
      
    } catch (error) {
      logger.error('Auth recovery failed with error', error as Error);
      return false;
    }
  }

  /**
   * Handle auth errors in API responses
   */
  static async handleAuthError(error: any): Promise<boolean> {
    if (this.isAuthError(error)) {
      logger.info('Auth error detected, attempting recovery');
      return await this.attemptRecovery();
    }
    return false;
  }

  /**
   * Check if an error is authentication related
   */
  static isAuthError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || error.error || String(error);
    
    return message.includes('Unauthorized') ||
           message.includes('no valid token') ||
           message.includes('Authentication required') ||
           message.includes('Session expired') ||
           message.includes('Invalid token') ||
           error.status === 401;
  }

  /**
   * Redirect to login with current page as return URL
   */
  static redirectToLogin(): void {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login?redirect=${currentUrl}`;
  }
}

/**
 * Hook for components to use auth recovery
 */
export function useAuthRecovery() {
  const handleAuthError = async (error: any) => {
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