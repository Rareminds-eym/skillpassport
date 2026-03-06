/**
 * Authentication middleware
 */

import type { Env } from '../types';
import { AuthenticationError } from '../types';

export function authenticateRequest(request: Request, env: Env): void {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    throw new AuthenticationError('Missing API key. Provide X-API-Key header or Authorization: Bearer token');
  }
  
  if (apiKey !== env.API_KEY) {
    throw new AuthenticationError('Invalid API key');
  }
}
