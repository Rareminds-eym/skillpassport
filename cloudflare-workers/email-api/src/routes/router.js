/**
 * Request router
 */

import { handleGenericEmail } from '../handlers/generic.js';
import { handleInvitationEmail } from '../handlers/invitation.js';
import { handleCountdownEmail } from '../handlers/countdown.js';
import { handleBulkCountdownEmail } from '../handlers/bulk-countdown.js';
import { handleEventConfirmation, handleEventOTP } from '../handlers/event-registration.js';
import { handlePDFReceipt } from '../handlers/pdf-receipt.js';
import { handlePasswordResetEmail } from '../handlers/password-reset.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function routeRequest(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  // Handle GET requests (PDF download)
  if (method === 'GET') {
    // Match /download-receipt/:orderId
    const pdfMatch = url.pathname.match(/^\/download-receipt\/(.+)$/);
    if (pdfMatch) {
      const orderId = pdfMatch[1];
      return await handlePDFReceipt(orderId, env);
    }
    
    return errorResponse('Route not found', null, 404);
  }

  // Handle POST requests (email sending)
  const body = await request.json();

  // Route to appropriate handler
  switch (url.pathname) {
    case '/invitation':
      return await handleInvitationEmail(body, env);
    
    case '/countdown':
      return await handleCountdownEmail(body, env);
    
    case '/send-bulk-countdown':
      return await handleBulkCountdownEmail(body, env);
    
    case '/event-confirmation':
      return await handleEventConfirmation(body, env);
    
    case '/event-otp':
      return await handleEventOTP(body, env);
    
    case '/password-reset':
      return await handlePasswordResetEmail(body, env);
    
    case '/':
    case '/send':
      return await handleGenericEmail(body, env);
    
    default:
      return errorResponse('Route not found', null, 404);
  }
}
