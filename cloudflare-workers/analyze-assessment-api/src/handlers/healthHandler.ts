/**
 * Health Check Handler
 */

import { jsonResponse } from '../utils/cors';

/**
 * Handle GET /health
 */
export function handleHealthCheck(): Response {
  return jsonResponse({
    status: 'ok',
    service: 'analyze-assessment-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: {
      gradeSpecificPrompts: true,
      supportedGrades: ['middle', 'highschool', 'higher_secondary', 'after10', 'after12']
    }
  });
}
