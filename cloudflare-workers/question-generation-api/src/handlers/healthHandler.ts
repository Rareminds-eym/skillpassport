/**
 * Health Check Handler
 */

import { jsonResponse } from '../utils/response';

export function handleHealthCheck(): Response {
  return jsonResponse({ 
    status: 'ok', 
    service: 'question-generation-api',
    timestamp: new Date().toISOString() 
  });
}
