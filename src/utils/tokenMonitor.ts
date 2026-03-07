/**
 * Token Monitor Utility
 * 
 * Tracks JWT token expiry and signals when refresh is needed.
 * Integrates with Supabase authentication to proactively monitor token validity.
 */

import { getLogger } from '../config/logging';

const logger = getLogger('token-monitor');

export interface TokenMonitorConfig {
  /** Time before expiry to trigger refresh (in milliseconds). Default: 5 minutes */
  refreshWindowMs?: number;
  /** Interval for periodic token checks (in milliseconds). Default: 60 seconds */
  checkIntervalMs?: number;
  /** Function to check if session is active. If not provided, always considered active */
  isSessionActive?: () => boolean;
}

export interface TokenInfo {
  token: string;
  expiresAt: number; // Unix timestamp in seconds
  issuedAt?: number; // Unix timestamp in seconds
}

type RefreshNeededCallback = () => void;

const DEFAULT_REFRESH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds

/**
 * TokenMonitor class for tracking JWT token expiry and triggering refresh operations
 */
export class TokenMonitor {
  private config: TokenMonitorConfig & { refreshWindowMs: number; checkIntervalMs: number };
  private intervalId: number | null = null;
  private callbacks: Set<RefreshNeededCallback> = new Set();
  private currentToken: TokenInfo | null = null;

  constructor(config: TokenMonitorConfig = {}) {
    this.config = {
      refreshWindowMs: config.refreshWindowMs ?? DEFAULT_REFRESH_WINDOW_MS,
      checkIntervalMs: config.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS,
      isSessionActive: config.isSessionActive,
    };
  }

  /**
   * Extract expiry timestamp from JWT token
   * @param token - JWT token string
   * @returns Unix timestamp in seconds, or null if extraction fails
   */
  extractExpiry(token: string): number | null {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        logger.warn('Invalid JWT format: expected 3 parts');
        return null;
      }

      // Decode base64url payload
      const payload = parts[1];
      const decoded = this.base64UrlDecode(payload);
      const parsed = JSON.parse(decoded);

      // Extract exp claim
      if (typeof parsed.exp !== 'number') {
        logger.warn('Missing or invalid exp claim in JWT');
        return null;
      }

      return parsed.exp;
    } catch (error) {
      logger.error('Error extracting token expiry', error as Error);
      return null;
    }
  }

  /**
   * Decode base64url encoded string
   */
  private base64UrlDecode(str: string): string {
    // Replace base64url characters with base64 characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padding = base64.length % 4;
    if (padding > 0) {
      base64 += '='.repeat(4 - padding);
    }

    // Decode base64
    try {
      return atob(base64);
    } catch (error) {
      throw new Error('Failed to decode base64url string');
    }
  }

  /**
   * Update the current token being monitored
   * @param token - JWT token string
   */
  setToken(token: string | null): void {
    if (!token) {
      this.currentToken = null;
      return;
    }

    const expiresAt = this.extractExpiry(token);
    if (expiresAt === null) {
      logger.warn('Failed to extract expiry from token');
      this.currentToken = null;
      return;
    }

    this.currentToken = {
      token,
      expiresAt,
    };
  }

  /**
   * Check if current token is valid (not expired)
   * @returns true if token is valid, false otherwise
   */
  isTokenValid(): boolean {
    if (!this.currentToken) {
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    return nowSeconds < this.currentToken.expiresAt;
  }

  /**
   * Check if token needs refresh (within refresh window)
   * @returns true if token should be refreshed, false otherwise
   */
  needsRefresh(): boolean {
    if (!this.currentToken) {
      return false;
    }

    const nowMs = Date.now();
    const expiryMs = this.currentToken.expiresAt * 1000;
    const timeUntilExpiryMs = expiryMs - nowMs;

    // Need refresh if within refresh window or already expired
    return timeUntilExpiryMs <= this.config.refreshWindowMs;
  }

  /**
   * Get time until token expires (in seconds)
   * @returns seconds until expiry, or 0 if expired/no token
   */
  getTimeUntilExpiry(): number {
    if (!this.currentToken) {
      return 0;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = this.currentToken.expiresAt - nowSeconds;
    
    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Start periodic monitoring of token expiry
   * @param intervalMs - Optional custom interval in milliseconds
   */
  startMonitoring(intervalMs?: number): void {
    // Stop existing monitoring if any
    this.stopMonitoring();

    const interval = intervalMs ?? this.config.checkIntervalMs;

    logger.info(`Starting monitoring with ${interval}ms interval`);

    // Perform immediate check
    this.performCheck();

    // Set up periodic checks
    this.intervalId = window.setInterval(() => {
      this.performCheck();
    }, interval);
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId !== null) {
      logger.info('Stopping monitoring');
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform a token validity check and emit events if needed
   * This implements proactive refresh logic - triggers refresh during active sessions
   * even when no API requests are pending
   */
  private performCheck(): void {
    if (!this.currentToken) {
      return;
    }

    // Check if session is active (if function provided)
    const isActive = this.config.isSessionActive ? this.config.isSessionActive() : true;
    
    if (!isActive) {
      logger.debug('Session inactive, skipping proactive refresh check');
      return;
    }

    // Proactive refresh: trigger refresh even when no API requests pending
    // This ensures tokens are always fresh during active sessions
    if (this.needsRefresh()) {
      const timeUntilExpiry = this.getTimeUntilExpiry();
      logger.info(
        `Proactive refresh triggered (expires in ${timeUntilExpiry}s, session active)`
      );
      this.emitRefreshNeeded();
    }
  }

  /**
   * Trigger an immediate token validity check
   */
  checkNow(): void {
    this.performCheck();
  }

  /**
   * Register a callback for refresh needed events
   * @param callback - Function to call when refresh is needed
   * @returns Unsubscribe function
   */
  onRefreshNeeded(callback: RefreshNeededCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Emit refresh needed event to all registered callbacks
   */
  private emitRefreshNeeded(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logger.error('Error in refresh callback', error as Error);
      }
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): TokenMonitorConfig & { refreshWindowMs: number; checkIntervalMs: number } {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<TokenMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Restart monitoring if active with new config
    if (this.intervalId !== null) {
      this.startMonitoring();
    }
  }

  /**
   * Check if monitoring is currently active
   */
  isMonitoring(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.callbacks.clear();
    this.currentToken = null;
  }
}

/**
 * Create a singleton instance for global use
 */
let globalTokenMonitor: TokenMonitor | null = null;

export function getGlobalTokenMonitor(config?: TokenMonitorConfig): TokenMonitor {
  if (!globalTokenMonitor) {
    globalTokenMonitor = new TokenMonitor(config);
  }
  return globalTokenMonitor;
}

/**
 * Reset the global token monitor (useful for testing)
 */
export function resetGlobalTokenMonitor(): void {
  if (globalTokenMonitor) {
    globalTokenMonitor.destroy();
    globalTokenMonitor = null;
  }
}
