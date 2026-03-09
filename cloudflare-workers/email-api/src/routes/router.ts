/**
 * Request router
 */

import { handleGenericEmail } from '../handlers/generic';
import { handleInvitationEmail } from '../handlers/invitation';
import { handleCountdownEmail } from '../handlers/countdown';
import { handleBulkCountdownEmail } from '../handlers/bulk-countdown';
import { handleEventConfirmation, handleEventOTP } from '../handlers/event-registration';
import { handlePDFReceipt } from '../handlers/pdf-receipt';
import { errorResponse } from '../utils/response';
import type { Env } from '../types';

export async function routeRequest(request: Request, env: Env): Promise<Response> {
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
  const body = await request.json() as any;

  // Route to appropriate handler
  switch (url.pathname) {
    case '/invitation':
      return await handleInvitationEmail(body as any, env);
    
    case '/countdown':
      return await handleCountdownEmail(body as any, env);
    
    case '/send-bulk-countdown':
      return await handleBulkCountdownEmail(body as any, env);
    
    case '/event-confirmation':
      return await handleEventConfirmation(body as any, env);
    
    case '/event-otp':
      return await handleEventOTP(body as any, env);
    
    case '/':
    case '/send':
      return await handleGenericEmail(body as any, env);
    
    default:
      return errorResponse('Route not found', null, 404);
  }
}
