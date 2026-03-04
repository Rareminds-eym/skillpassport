/**
 * Refresh Coordinator
 * 
 * Manages token refresh operations with deduplication, retry logic, and request queuing.
 * Integrates with Supabase authentication to coordinate token refresh across the application.
 */

import { supabase } from '../lib/supabaseClient';
import { getGlobalTokenRefreshErrorHandler } from './tokenRefreshErrorHandler';

export interface RefreshCoordinatorConfig {
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries?: number;
  /** Initial retry delay in milliseconds. Default: 1000 (1 second) */
  initialRetryDelayMs?: number;
  /** Timeout for refresh operations in milliseconds. Default: 10000 (10 seconds) */
  timeoutMs?: number;
}

export type RefreshResult =
  | { success: true; token: string; expiresAt: number }
  | { success: false; error: RefreshError; retryable: boolean };

export type RefreshError =
  | 'network_error'
  | 'invalid_refresh_token'
  | 'timeout'
  | 'unknown';

interface QueuedRequest {
  resolve: (result: RefreshResult) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

type RefreshFunction = () => Promise<{ data: { session: any } | null; error: any } | null>;

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * RefreshCoordinator class for managing token refresh operations
 */
export class RefreshCoordinator {
  private config: Required<RefreshCoordinatorConfig>;
  private isRefreshing: boolean = false;
  private currentRefreshPromise: Promise<RefreshResult> | null = null;
  private requestQueue: QueuedRequest[] = [];
  private refreshFunction: RefreshFunction;
  private lastRefreshTime: number = -1;
  private currentAttempt: number = 0;
  private errorHandler = getGlobalTokenRefreshErrorHandler();

  constructor(
    refreshFunction?: RefreshFunction,
    config: RefreshCoordinatorConfig = {}
  ) {
    // Default to Supabase refresh if no function provided
    this.refreshFunction = refreshFunction || (() => supabase.auth.refreshSession());
    this.config = {
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      initialRetryDelayMs: config.initialRetryDelayMs ?? DEFAULT_INITIAL_RETRY_DELAY_MS,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    };
  }

  /**
   * Attempt to refresh the token
   * Implements deduplication - if refresh is in progress, returns the existing promise
   * @returns Promise resolving to RefreshResult
   */
  async refreshToken(): Promise<RefreshResult> {
    // Deduplication: if refresh is in progress, return existing promise
    if (this.isRefreshing && this.currentRefreshPromise) {
      console.log('[RefreshCoordinator] Refresh already in progress, waiting...');
      return this.currentRefreshPromise;
    }

    // Mark as refreshing and create new promise
    this.isRefreshing = true;
    this.currentRefreshPromise = this.executeRefreshWithRetry();

    try {
      const result = await this.currentRefreshPromise;
      
      // Process queued requests
      this.processQueue(result);
      
      return result;
    } finally {
      this.isRefreshing = false;
      this.currentRefreshPromise = null;
    }
  }

  /**
   * Execute refresh with retry logic and timeout
   */
  private async executeRefreshWithRetry(): Promise<RefreshResult> {
    let lastError: RefreshError = 'unknown';
    let retryable = true;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      this.currentAttempt = attempt + 1;
      
      try {
        console.log(
          `[RefreshCoordinator] Refresh attempt ${attempt + 1}/${this.config.maxRetries}`
        );

        // Execute refresh with timeout
        const result = await this.executeRefreshWithTimeout();
        
        if (result.success) {
          console.log('[RefreshCoordinator] Refresh successful');
          this.lastRefreshTime = Date.now();
          this.currentAttempt = 0;
          return result;
        }

        // If not successful, prepare for retry
        lastError = result.error;
        retryable = result.retryable;

        // Log the failure
        this.errorHandler.logFailure(
          result.error,
          attempt + 1,
          result.retryable,
          `Attempt ${attempt + 1}/${this.config.maxRetries}`
        );

        // Don't retry if error is not retryable
        if (!retryable) {
          console.warn(
            `[RefreshCoordinator] Non-retryable error: ${lastError}, aborting`
          );
          break;
        }

        // Calculate exponential backoff delay
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.initialRetryDelayMs * Math.pow(2, attempt);
          console.log(`[RefreshCoordinator] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      } catch (error) {
        console.error('[RefreshCoordinator] Unexpected error during refresh:', error);
        lastError = 'unknown';
        retryable = true;

        // Log the unexpected error
        this.errorHandler.logFailure(
          'unknown',
          attempt + 1,
          true,
          error instanceof Error ? error.message : String(error)
        );

        // Retry with exponential backoff
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.initialRetryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted - log final failure
    this.currentAttempt = 0;
    console.error(
      `[RefreshCoordinator] Refresh failed after ${this.config.maxRetries} attempts`
    );
    
    this.errorHandler.logFailure(
      lastError,
      this.config.maxRetries,
      retryable,
      'All retry attempts exhausted'
    );
    
    return { success: false, error: lastError, retryable };
  }

  /**
   * Execute refresh with timeout
   */
  private async executeRefreshWithTimeout(): Promise<RefreshResult> {
    const timeoutPromise = new Promise<RefreshResult>((resolve) => {
      setTimeout(() => {
        resolve({ success: false, error: 'timeout', retryable: true });
      }, this.config.timeoutMs);
    });

    const refreshPromise = this.executeSingleRefresh();

    return Promise.race([refreshPromise, timeoutPromise]);
  }

  /**
   * Execute a single refresh attempt
   */
  private async executeSingleRefresh(): Promise<RefreshResult> {
    try {
      const response = await this.refreshFunction();

      if (!response || !response.data || !response.data.session) {
        // Check if there's an error indicating invalid refresh token
        if (response?.error) {
          const error = response.error;
          
          // Categorize error
          if (
            error.message?.includes('refresh') ||
            error.message?.includes('invalid') ||
            error.status === 401 ||
            error.status === 403
          ) {
            return {
              success: false,
              error: 'invalid_refresh_token',
              retryable: false,
            };
          }

          if (error.message?.includes('network') || error.status === 0) {
            return { success: false, error: 'network_error', retryable: true };
          }
        }

        // No session returned - likely invalid refresh token
        return {
          success: false,
          error: 'invalid_refresh_token',
          retryable: false,
        };
      }

      const { session } = response.data;
      const token = session.access_token;

      if (!token) {
        return {
          success: false,
          error: 'invalid_refresh_token',
          retryable: false,
        };
      }

      // Extract expiry from token or use expires_at from session
      const expiresAt = session.expires_at || this.extractTokenExpiry(token);

      return {
        success: true,
        token,
        expiresAt,
      };
    } catch (error: any) {
      console.error('[RefreshCoordinator] Refresh error:', error);

      // Categorize error
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        return { success: false, error: 'network_error', retryable: true };
      }

      if (
        error.message?.includes('refresh') ||
        error.message?.includes('invalid') ||
        error.status === 401 ||
        error.status === 403
      ) {
        return {
          success: false,
          error: 'invalid_refresh_token',
          retryable: false,
        };
      }

      return { success: false, error: 'unknown', retryable: true };
    }
  }

  /**
   * Extract expiry timestamp from JWT token
   */
  private extractTokenExpiry(token: string): number {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return 0;
      }

      const payload = parts[1];
      const decoded = this.base64UrlDecode(payload);
      const parsed = JSON.parse(decoded);

      return parsed.exp || 0;
    } catch (error) {
      console.error('[RefreshCoordinator] Error extracting token expiry:', error);
      return 0;
    }
  }

  /**
   * Decode base64url encoded string
   */
  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding > 0) {
      base64 += '='.repeat(4 - padding);
    }
    return atob(base64);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if refresh is currently in progress
   */
  isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Wait for ongoing refresh to complete
   * If no refresh in progress, throws error
   */
  async waitForRefresh(): Promise<RefreshResult> {
    if (!this.isRefreshing || !this.currentRefreshPromise) {
      throw new Error('No refresh operation in progress');
    }

    return this.currentRefreshPromise;
  }

  /**
   * Queue a request to wait for refresh completion
   * @returns Promise that resolves when refresh completes
   */
  queueRequest(): Promise<RefreshResult> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Process all queued requests with the refresh result
   */
  private processQueue(result: RefreshResult): void {
    if (this.requestQueue.length === 0) {
      return;
    }

    console.log(
      `[RefreshCoordinator] Processing ${this.requestQueue.length} queued requests`
    );

    // Resolve all queued requests with the same result
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach((request) => {
      try {
        request.resolve(result);
      } catch (error) {
        console.error('[RefreshCoordinator] Error processing queued request:', error);
      }
    });
  }

  /**
   * Get the number of queued requests
   */
  getQueueLength(): number {
    return this.requestQueue.length;
  }

  /**
   * Clear all queued requests
   */
  clearQueue(): void {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    // Reject all queued requests
    queue.forEach((request) => {
      request.reject(new Error('Queue cleared'));
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RefreshCoordinatorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<RefreshCoordinatorConfig> {
    return { ...this.config };
  }

  /**
   * Get time since last successful refresh in milliseconds
   * Returns Infinity if no refresh has occurred yet
   */
  getTimeSinceLastRefresh(): number {
    if (this.lastRefreshTime === -1) {
      return Infinity;
    }
    return Date.now() - this.lastRefreshTime;
  }

  /**
   * Get current attempt number (1-based, 0 when not refreshing)
   */
  getCurrentAttempt(): number {
    return this.currentAttempt;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearQueue();
    this.isRefreshing = false;
    this.currentRefreshPromise = null;
    this.lastRefreshTime = -1;
    this.currentAttempt = 0;
  }
}

/**
 * Create a singleton instance for global use
 */
let globalRefreshCoordinator: RefreshCoordinator | null = null;

export function getGlobalRefreshCoordinator(
  refreshFunction: RefreshFunction,
  config?: RefreshCoordinatorConfig
): RefreshCoordinator {
  if (!globalRefreshCoordinator) {
    globalRefreshCoordinator = new RefreshCoordinator(refreshFunction, config);
  }
  return globalRefreshCoordinator;
}

/**
 * Reset the global refresh coordinator (useful for testing)
 */
export function resetGlobalRefreshCoordinator(): void {
  if (globalRefreshCoordinator) {
    globalRefreshCoordinator.destroy();
    globalRefreshCoordinator = null;
  }
}
