/**
 * Sales Enquiry Email Endpoint
 * POST /api/email/sales-enquiry
 */

import type { PagesFunction } from '../../lib/types';
import { apiError } from '../../lib/response';
import { handleSalesEnquiryEmail } from './handlers/sales-enquiry';

export const onRequestPost: PagesFunction = async (context) => {
  const body: any = await context.request.json().catch(() => null);
  if (!body) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', context.request);
  }
  return await handleSalesEnquiryEmail(body, context.env, context.request);
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
