/**
 * OTP API Cloudflare Worker
 * Handles OTP generation, sending via AWS SNS, and verification
 */

import { handleRequest } from './router';
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
