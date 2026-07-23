/**
 * PHASE 1: SSO → Skillpassport User Existence Check
 * 
 * This endpoint allows SSO Worker to check if a user exists in Skillpassport DB
 * before creating queue messages. Called via service binding.
 * 
 * Usage: env.SKILLPASSPORT_SERVICE.checkUserExists(userId)
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as { userId: string };
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with shorter timeout
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          fetch: (url, options = {}) => {
            return fetch(url, {
              ...options,
              // ponytail: 5s timeout for DB query to prevent endpoint timeout
              signal: AbortSignal.timeout(5000),
            });
          },
        },
      }
    );

    // Check if user exists in Skillpassport DB - optimized query with timeout
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[sync/check-user] Database error:', error.message);
      // Return 200 with exists: false instead of 500 to avoid triggering retries
      return new Response(JSON.stringify({ exists: false, error: 'Database timeout' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const exists = data !== null;
    console.log(`[sync/check-user] User ${userId} exists: ${exists}`);

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const errorMsg = err?.message || 'Unknown error';
    console.error('[sync/check-user] Error:', errorMsg);
    
    // Return 200 with exists: false to prevent retry loops
    return new Response(JSON.stringify({ exists: false, error: 'Check failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
