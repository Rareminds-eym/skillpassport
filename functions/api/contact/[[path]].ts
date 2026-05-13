/**
 * Contact Form API - Cloudflare Pages Function
 * Handles contact form submissions from About page
 * 
 * Endpoints:
 * - POST /api/contact/submit - Submit contact form
 * - GET /api/contact - Health check
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse, createSupabaseAdminClient } from '../../../src/functions-lib';
import { handleContactSubmit } from './handlers/submit';
import { apiLogger } from '../../lib/logger';

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/contact', '');

  try {
    const supabase = createSupabaseAdminClient(env);

    // GET route - Health check
    if (request.method === 'GET') {
      if (path === '' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'contact-api',
          endpoints: [
            'POST /submit - Submit contact form'
          ],
          timestamp: new Date().toISOString()
        });
      }
      
      return jsonResponse({ success: false, error: 'Route not found' }, 404);
    }

    // Only POST requests for contact form submission
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    // Parse JSON body with proper error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }, 400);
    }

    // Route to appropriate handler
    if (path === '/submit' || path === '' || path === '/') {
      return await handleContactSubmit(body, env, supabase);
    }

    return jsonResponse({ success: false, error: 'Route not found' }, 404);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    apiLogger.error('Contact API Error', error as Error);
    return jsonResponse(
      { success: false, error: errorMessage },
      500
    );
  }
};
