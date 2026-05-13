/**
 * Career API Request Interceptor (SSO-based)
 *
 * Wraps requests to Career AI endpoints (/api/career/*) with SSO authentication.
 * Uses ssoClient.fetch() which automatically handles token attachment and 401 retry.
 *
 * This replaces the legacy TokenMonitor + RefreshCoordinator approach.
 */
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('career-api-interceptor');

export interface InterceptorConfig {
  maxWaitTimeMs?: number;
  retryOn401?: boolean;
}

export interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Career API Interceptor
 *
 * All requests go through ssoClient.fetch() which:
 * 1. Attaches the SSO access token as Bearer header
 * 2. On 401, silently refreshes and retries once
 * 3. On second failure, triggers logout + onSessionExpired
 */
export class CareerApiInterceptor {
  private config: InterceptorConfig;

  constructor(config: InterceptorConfig = {}) {
    this.config = config;
  }

  /**
   * Execute an authenticated request to the Career API.
   */
  async request(url: string, init: RequestInit = {}): Promise<Response> {
    logger.debug('Career API request', { url, method: init.method || 'GET' });

    try {
      const response = await ssoClient.fetch(url, init);
      return response;
    } catch (error) {
      logger.error('Career API request failed', { url, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Convenience method for GET requests.
   */
  async get(url: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, { method: 'GET', headers });
  }

  /**
   * Convenience method for POST requests.
   */
  async post(url: string, body?: unknown, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Singleton instance
let globalInterceptor: CareerApiInterceptor | null = null;

export function getGlobalCareerApiInterceptor(config?: InterceptorConfig): CareerApiInterceptor {
  if (!globalInterceptor) {
    globalInterceptor = new CareerApiInterceptor(config);
  }
  return globalInterceptor;
}

export default CareerApiInterceptor;
