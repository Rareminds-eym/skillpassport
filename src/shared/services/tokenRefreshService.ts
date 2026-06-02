/**
 * Token Refresh Service
 * 
 * Proactively refreshes access tokens before they expire to prevent
 * automatic logout during active user sessions.
 * 
 * Strategy:
 * - Access tokens expire after 15 minutes
 * - Refresh at 12 minutes (80% of token lifetime)
 * - Uses ssoClient.refresh() to get new tokens
 * - Handles cross-tab coordination via auth-client's built-in sync
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('token-refresh-service');

// Token lifetime configuration
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_THRESHOLD = 0.8; // Refresh at 80% of lifetime (12 minutes)
const REFRESH_INTERVAL_MS = ACCESS_TOKEN_LIFETIME_MS * REFRESH_THRESHOLD;

class TokenRefreshService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;
  private isActive = false;

  /**
   * Start the automatic token refresh cycle.
   * Should be called after successful login or session initialization.
   */
  start(): void {
    if (this.isActive) {
      logger.debug('Token refresh service already active');
      return;
    }

    this.isActive = true;
    this.scheduleNextRefresh();
    logger.info('Token refresh service started', {
      refreshInterval: `${REFRESH_INTERVAL_MS / 1000}s`,
      tokenLifetime: `${ACCESS_TOKEN_LIFETIME_MS / 1000}s`,
    });
  }

  /**
   * Stop the automatic token refresh cycle.
   * Should be called on logout or when the user session ends.
   */
  stop(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.isActive = false;
    this.isRefreshing = false;
    logger.info('Token refresh service stopped');
  }

  /**
   * Manually trigger a token refresh.
   * Useful for testing or forcing a refresh on user action.
   */
  async refreshNow(): Promise<boolean> {
    if (!this.isActive) {
      logger.warn('Cannot refresh: service not active');
      return false;
    }

    return this.performRefresh();
  }

  /**
   * Check if the service is currently active.
   */
  isRunning(): boolean {
    return this.isActive;
  }

  private scheduleNextRefresh(): void {
    if (!this.isActive) return;

    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule the next refresh
    this.refreshTimer = setTimeout(async () => {
      await this.performRefresh();
    }, REFRESH_INTERVAL_MS);

    logger.debug('Next token refresh scheduled', {
      nextRefreshIn: `${REFRESH_INTERVAL_MS / 1000}s`,
    });
  }

  private async performRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      logger.debug('Refresh already in progress, skipping');
      return false;
    }

    this.isRefreshing = true;

    try {
      logger.debug('Performing token refresh');
      await ssoClient.refresh();
      logger.info('Token refresh successful');

      // Schedule the next refresh
      this.scheduleNextRefresh();
      return true;
    } catch (error) {
      logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));

      // On refresh failure, the session is likely expired
      // The ssoClient will trigger onSessionExpired callback
      // which redirects to login, so we stop the service
      this.stop();
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();

/**
 * Initialize token refresh service.
 * Call this after successful authentication.
 */
export function startTokenRefresh(): void {
  tokenRefreshService.start();
}

/**
 * Stop token refresh service.
 * Call this on logout or session end.
 */
export function stopTokenRefresh(): void {
  tokenRefreshService.stop();
}

/**
 * Manually trigger a token refresh.
 */
export function refreshTokenNow(): Promise<boolean> {
  return tokenRefreshService.refreshNow();
}
