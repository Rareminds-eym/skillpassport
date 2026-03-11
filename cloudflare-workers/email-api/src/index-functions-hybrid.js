/**
 * Hybrid Worker - CRON only, delegates to Functions API
 * This Worker handles scheduled jobs and calls the Functions API for actual email sending
 */

import { processCountdownEmails } from './cron/countdown-processor.js';
import { retryFailedEmails } from './cron/retry-processor.js';
import { jsonResponse } from './utils/response.js';

export default {
  /**
   * HTTP Handler - Minimal, just health check
   */
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse({ 
        status: 'ok', 
        service: 'email-api-cron-worker',
        message: 'CRON worker running. Email sending handled by Functions API.'
      });
    }

    return jsonResponse({ 
      error: 'This Worker only handles CRON jobs. Use /api/email/* endpoints for email sending.' 
    }, 404);
  },

  /**
   * Scheduled CRON Handler
   * Runs automated countdown emails and retry logic
   */
  async scheduled(event, env, ctx) {
    console.log('Starting scheduled email job...');
    
    const processEmails = async () => {
      try {
        // Process countdown emails
        await processCountdownEmails(env);
        
        // Retry failed emails
        await retryFailedEmails(env);
        
        console.log('Scheduled email job completed successfully');
      } catch (error) {
        console.error('Error in scheduled email job:', error);
      }
    };
    
    ctx.waitUntil(processEmails());
  },
};
