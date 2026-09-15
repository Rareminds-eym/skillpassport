/**
 * AI execution status/cancel route (dormant — no callers yet).
 *
 * GET  /api/ai/executions/:id → worker execution status (owner-scoped).
 * POST /api/ai/executions/:id → request cancellation (worker confirms state).
 *
 * Authenticated via `withAuth`; the handlers enforce entitlement before
 * minting the worker assertion. First UI caller (analysis polling) is a
 * separately gated cutover.
 */

import type { PagesFunction } from '../../../lib/types';
import { apiError } from '../../../lib/response';
import { handleCorsPreflightRequest } from '../../../lib/cors';
import { withAuth, getContextUser } from '../../../lib/auth';
import {
  handleGetExecutionStatus,
  handleCancelExecution,
} from '../handlers/executions';

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context as unknown as {
    request: Request;
    env: Record<string, unknown>;
  };

  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  try {
    return withAuth(async (authContext: unknown) => {
      const user = getContextUser(authContext as never) as { id: string };
      const { id } = context.params as unknown as { id?: string | string[] };
      const executionId = Array.isArray(id) ? id[0] : id ?? '';

      if (request.method === 'GET') {
        return handleGetExecutionStatus(request, env as never, user.id, executionId);
      }
      if (request.method === 'POST') {
        return handleCancelExecution(request, env as never, user.id, executionId);
      }
      return apiError(405, 'ERROR', 'Method not allowed', request);
    })(context);
  } catch (error) {
    return apiError(500, 'INTERNAL_ERROR', (error as Error)?.message || 'Internal server error', request);
  }
};
