/**
 * Authentication middleware
 */

import type { Env, WebsiteConfig } from '../types';
import { WEBSITE_CONFIGS, ERROR_CODES } from '../constants';
import { errorResponse } from '../utils/response';

export function authenticateRequest(request: Request, env: Env): WebsiteConfig | Response {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return errorResponse(
      ERROR_CODES.UNAUTHORIZED,
      'Missing API key',
      'X-API-Key header is required',
      401
    );
  }

  // Check against configured website keys
  const websiteConfig = WEBSITE_CONFIGS[apiKey as keyof typeof WEBSITE_CONFIGS];
  
  if (websiteConfig) {
    return websiteConfig;
  }

  // Fallback to legacy shared key for backward compatibility
  if (apiKey === env.SHARED_API_KEY) {
    return {
      id: 'legacy',
      name: 'Legacy Key',
      environment: env.ENVIRONMENT,
    };
  }

  return errorResponse(
    ERROR_CODES.UNAUTHORIZED,
    'Invalid API key',
    'The provided API key is not authorized',
    401
  );
}
