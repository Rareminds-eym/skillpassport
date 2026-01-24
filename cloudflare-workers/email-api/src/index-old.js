/**
 * Cloudflare Worker: Email API
 * Sends emails using worker-mailer with AWS SES SMTP
 * 
 * Supports:
 * - Generic email sending (POST /)
 * - Organization invitation emails (POST /invitation)
 * - Countdown emails (POST /countdown)
 * - Bulk countdown emails (POST /send-bulk-countdown)
 * - Automated countdown emails (Scheduled CRON)
 */

import { routeRequest } from './routes/router.js';
import { processCountdownEmails } from './cron/countdown-processor.js';
import { retryFailedEmails } from './cron/retry-processor.js';
import { corsPreflightResponse, jsonResponse, errorResponse } from './utils/response.js';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'email-api' });
    }

    // Only allow POST for sending emails
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed. Use POST to send emails.', null, 405);
    }

    try {
      return await routeRequest(request, env);
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', error.message);
    }
  },

  /**
   * Scheduled CRON Handler for Automated Countdown Emails
   */
  async scheduled(event, env, ctx) {
    console.log('Starting scheduled countdown email job...');
    
    try {
      // Process new countdown emails
      await processCountdownEmails(env);
      
      // Retry failed emails
      await retryFailedEmails(env);
      
      console.log('Countdown email job completed successfully');
    } catch (error) {
      console.error('Error in scheduled countdown email job:', error);
    }
  },
};
