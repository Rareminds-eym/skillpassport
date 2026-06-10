/**
 * Educator API — catch-all route
 *
 * Routes:
 *   POST /api/educator/actions  → actions.ts (action dispatch)
 *
 * NOTE: GET /api/educator and GET /api/educator/ are handled by index.ts
 * NOTE: GET /api/educator/dashboard/* is handled by dashboard/[[path]].ts
 */
import { onRequestPost } from './actions';

export { onRequestPost };

// Preflight for POST routes
export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
});
