/**
 * User API Cloudflare Worker
 * Main entry point - routes all requests through the router
 */

import { handleRequest } from './router';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
