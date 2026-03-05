/**
 * Cloudflare Worker: Razorpay API
 * Shared payment processing for multiple websites
 * 
 * Endpoints:
 * - POST /create-order - Create Razorpay order
 * - POST /verify-payment - Verify Razorpay signature
 * - GET /payment/:id - Get payment details
 * - POST /subscription/:id/cancel - Cancel subscription
 * - POST /verify-webhook - Verify webhook signature
 * - GET /health - Health check
 */

import { corsPreflightResponse, jsonResponse, errorResponse } from './utils/response.js';
import { 
  createRazorpayOrder, 
  verifyRazorpaySignature, 
  getPaymentDetails,
  cancelSubscription,
  verifyWebhookSignature
} from './services/razorpay.js';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/health') {
      return jsonResponse({ 
        status: 'ok', 
        service: 'razorpay-api',
        version: '1.0.0',
        endpoints: [
          'POST /create-order',
          'POST /verify-payment',
          'GET /payment/:id',
          'POST /subscription/:id/cancel',
          'POST /verify-webhook'
        ]
      });
    }

    // Authenticate request
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.SHARED_API_KEY) {
      return errorResponse('Unauthorized', 'Invalid API key', 401);
    }

    try {
      // Route requests
      if (path === '/create-order' && request.method === 'POST') {
        return await createRazorpayOrder(request, env);
      }

      if (path === '/verify-payment' && request.method === 'POST') {
        return await verifyRazorpaySignature(request, env);
      }

      if (path === '/verify-webhook' && request.method === 'POST') {
        return await verifyWebhookSignature(request, env);
      }

      // GET /payment/:id
      if (path.startsWith('/payment/') && request.method === 'GET') {
        const paymentId = path.split('/')[2];
        return await getPaymentDetails(request, env, paymentId);
      }

      // POST /subscription/:id/cancel
      if (path.startsWith('/subscription/') && path.endsWith('/cancel') && request.method === 'POST') {
        const subscriptionId = path.split('/')[2];
        return await cancelSubscription(request, env, subscriptionId);
      }

      return errorResponse('Not found', `Unknown endpoint: ${path}`, 404);
    } catch (error) {
      console.error('Razorpay API Error:', error);
      return errorResponse('Internal server error', error.message, 500);
    }
  }
};
