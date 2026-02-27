/**
 * Career API Request Interceptor
 * 
 * Intercepts fetch requests to Career AI endpoints (/api/career/*) to ensure
 * all requests use valid JWT tokens. Coordinates with Token Monitor and Refresh
 * Coordinator to handle token expiry proactively.
 */

import { TokenMonitor, getGlobalTokenMonitor } from '../utils/tokenMonitor';
import { RefreshCoordinator, getGlobalRefreshCoordinator, RefreshResult } from '../utils/refreshCoordinator';
import { getGlobalTokenRefreshErrorHandler } from '../utils/tokenRefreshErrorHandler';
import { supabase } from '../lib/supabaseClient';

export interface InterceptorConfig {
  /** Maximum time to wait for token refresh (in milliseconds). Default: 10000 (10 seconds) */
  maxWaitTimeMs?: number;
  /** Whether to automatically retry on 401 responses. Default: true */
  retryOn401?: boolean;
}

interface QueuedRequest {
  requestId: string;
  config: RequestConfig;
  resolve: (config: RequestConfig) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface RequestConfig {
  url: string;
  init?: RequestInit;
}

const DEFAULT_MAX_WAIT_TIME_MS = 10000;

/**
 * CareerApiInterceptor class for intercepting and managing API requests
 */
export class CareerApiInterceptor {
  private config: Required<InterceptorConfig>;
  private tokenMonitor: TokenMonitor;
  private refreshCoordinator: RefreshCoordinator;
  private errorHandler = getGlobalTokenRefreshErrorHandler();
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue: boolean = false;
  private requestIdCounter: number = 0;

  constructor(
    tokenMonitor?: TokenMonitor,
    refreshCoordinator?: RefreshCoordinator,
    config: InterceptorConfig = {}
  ) {
    this.tokenMonitor = tokenMonitor || getGlobalTokenMonitor();
    this.refreshCoordinator = refreshCoordinator || getGlobalRefreshCoordinator(
      () => supabase.auth.refreshSession()
    );
    this.config = {
      maxWaitTimeMs: config.maxWaitTimeMs ?? DEFAULT_MAX_WAIT_TIME_MS,
      retryOn401: config.retryOn401 ?? true,
    };
  }

  /**
   * Intercept a fetch request to ensure it has a valid token
   * @param url - Request URL
   * @param init - Fetch init options
   * @returns Promise resolving to updated RequestConfig
   */
  async interceptRequest(url: string, init?: RequestInit): Promise<RequestConfig> {
    // Check if this is a Career AI endpoint
    if (!this.isCareerEndpoint(url)) {
      // Not a Career endpoint, pass through unchanged
      return { url, init };
    }

    console.log('[CareerApiInterceptor] Intercepting request to:', url);

    // Check token validity before request
    const isValid = this.tokenMonitor.isTokenValid();
    const needsRefresh = this.tokenMonitor.needsRefresh();

    if (!isValid || needsRefresh) {
      console.log(
        `[CareerApiInterceptor] Token ${!isValid ? 'expired' : 'near expiry'}, waiting for refresh...`
      );

      // Wait for token refresh with timeout
      const refreshResult = await this.waitForTokenRefresh();

      if (!refreshResult.success) {
        throw new Error(
          `Token refresh failed: ${refreshResult.error}. Cannot proceed with request.`
        );
      }

      console.log('[CareerApiInterceptor] Token refreshed, proceeding with request');
    }

    // Get fresh token from Supabase session
    const token = await this.getCurrentToken();

    if (!token) {
      throw new Error('No valid token available for request');
    }

    // Inject fresh token into Authorization header
    const updatedInit = this.injectToken(init, token);

    return { url, init: updatedInit };
  }

  /**
   * Execute a fetch request with interception
   * @param url - Request URL
   * @param init - Fetch init options
   * @returns Promise resolving to Response
   */
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      // Intercept and update request config
      const config = await this.interceptRequest(url, init);

      // Execute the request
      const response = await fetch(config.url, config.init);

      // Handle 401 responses with retry
      if (response.status === 401 && this.config.retryOn401) {
        console.log('[CareerApiInterceptor] Received 401, attempting token refresh and retry...');

        // Log the 401 error
        this.errorHandler.logFailure(
          'invalid_refresh_token',
          1,
          true,
          '401 Unauthorized response from Career AI endpoint'
        );

        // Attempt token refresh
        const refreshResult = await this.refreshCoordinator.refreshToken();

        if (refreshResult.success) {
          // Retry the request with new token
          const retryConfig = await this.interceptRequest(url, init);
          const retryResponse = await fetch(retryConfig.url, retryConfig.init);

          console.log('[CareerApiInterceptor] Retry after refresh:', retryResponse.status);
          return retryResponse;
        } else {
          console.warn('[CareerApiInterceptor] Token refresh failed after 401:', refreshResult.error);
          
          // Log the final failure
          this.errorHandler.logFailure(
            refreshResult.error,
            this.refreshCoordinator.getCurrentAttempt() || 1,
            refreshResult.retryable,
            'Token refresh failed after 401 response'
          );
          
          // Return original 401 response
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('[CareerApiInterceptor] Request error:', error);
      throw error;
    }
  }

  /**
   * Queue a request to wait for token refresh
   * @param config - Request configuration
   * @returns Promise resolving to updated RequestConfig
   */
  private queueRequest(config: RequestConfig): Promise<RequestConfig> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestIdCounter}`;
      
      this.requestQueue.push({
        requestId,
        config,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      console.log(
        `[CareerApiInterceptor] Request ${requestId} queued (queue length: ${this.requestQueue.length})`
      );
    });
  }

  /**
   * Process all queued requests with fresh token
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      console.log(
        `[CareerApiInterceptor] Processing ${this.requestQueue.length} queued requests`
      );

      // Get fresh token
      const token = await this.getCurrentToken();

      if (!token) {
        throw new Error('No valid token available for queued requests');
      }

      // Process all queued requests
      const queue = [...this.requestQueue];
      this.requestQueue = [];

      for (const request of queue) {
        try {
          // Inject fresh token into request
          const updatedInit = this.injectToken(request.config.init, token);
          const updatedConfig = { ...request.config, init: updatedInit };

          request.resolve(updatedConfig);
        } catch (error) {
          console.error(
            `[CareerApiInterceptor] Error processing queued request ${request.requestId}:`,
            error
          );
          request.reject(error as Error);
        }
      }

      console.log('[CareerApiInterceptor] Queue processing complete');
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Wait for token refresh to complete with timeout
   * @returns Promise resolving to RefreshResult
   */
  private async waitForTokenRefresh(): Promise<RefreshResult> {
    // Check if refresh is already in progress
    if (this.refreshCoordinator.isRefreshInProgress()) {
      console.log('[CareerApiInterceptor] Refresh already in progress, waiting...');
      
      // Wait for existing refresh with timeout
      return this.waitWithTimeout(
        this.refreshCoordinator.waitForRefresh(),
        this.config.maxWaitTimeMs
      );
    }

    // Initiate new refresh
    console.log('[CareerApiInterceptor] Initiating token refresh...');
    
    return this.waitWithTimeout(
      this.refreshCoordinator.refreshToken(),
      this.config.maxWaitTimeMs
    );
  }

  /**
   * Wait for a promise with timeout
   * @param promise - Promise to wait for
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise resolving to RefreshResult
   */
  private async waitWithTimeout(
    promise: Promise<RefreshResult>,
    timeoutMs: number
  ): Promise<RefreshResult> {
    const timeoutPromise = new Promise<RefreshResult>((resolve) => {
      setTimeout(() => {
        resolve({ success: false, error: 'timeout', retryable: true });
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Get current token from Supabase session
   * @returns Promise resolving to token string or null
   */
  private async getCurrentToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[CareerApiInterceptor] Error getting session:', error);
        return null;
      }

      return session?.access_token || null;
    } catch (error) {
      console.error('[CareerApiInterceptor] Error getting current token:', error);
      return null;
    }
  }

  /**
   * Inject token into request headers
   * @param init - Fetch init options
   * @param token - JWT token
   * @returns Updated fetch init options
   */
  private injectToken(init: RequestInit | undefined, token: string): RequestInit {
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return {
      ...init,
      headers,
    };
  }

  /**
   * Check if URL is a Career AI endpoint
   * @param url - Request URL
   * @returns true if URL is a Career endpoint
   */
  private isCareerEndpoint(url: string): boolean {
    // Check if URL contains /api/career/
    return url.includes('/api/career/');
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
  updateConfig(config: Partial<InterceptorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<InterceptorConfig> {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearQueue();
    this.isProcessingQueue = false;
    this.requestIdCounter = 0;
  }
}

/**
 * Create a singleton instance for global use
 */
let globalInterceptor: CareerApiInterceptor | null = null;

export function getGlobalCareerApiInterceptor(
  tokenMonitor?: TokenMonitor,
  refreshCoordinator?: RefreshCoordinator,
  config?: InterceptorConfig
): CareerApiInterceptor {
  if (!globalInterceptor) {
    globalInterceptor = new CareerApiInterceptor(tokenMonitor, refreshCoordinator, config);
  }
  return globalInterceptor;
}

/**
 * Reset the global interceptor (useful for testing)
 */
export function resetGlobalCareerApiInterceptor(): void {
  if (globalInterceptor) {
    globalInterceptor.destroy();
    globalInterceptor = null;
  }
}
