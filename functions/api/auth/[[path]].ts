// @public-endpoint: Delegated SSO Gateway browser authentication router (login, signup, session refresh, recovery, invites)
/**
 * SSO Gateway Browser Route Dispatcher
 */

import { getSsoGatewayInstance } from '../../lib/auth';

export async function onRequest(context: { request: Request; env: Record<string, unknown> }): Promise<Response> {
  const gateway = getSsoGatewayInstance(context.env);
  return gateway.handleBrowserRequest(context.request);
}

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    const gateway = getSsoGatewayInstance(env);
    return gateway.handleBrowserRequest(request);
  }
};
