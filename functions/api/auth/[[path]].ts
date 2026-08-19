/**
 * Auth Core Browser Route Dispatcher
 */

import { getAuthInstance } from '../../lib/auth';

export async function onRequest(context: { request: Request; env: Record<string, unknown> }): Promise<Response> {
  const auth = getAuthInstance(context.env);
  return auth.handleBrowserRequest(context.request);
}

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    const auth = getAuthInstance(env);
    return auth.handleBrowserRequest(request);
  }
};
