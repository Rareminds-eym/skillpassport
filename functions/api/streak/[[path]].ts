/**
 * Streak API - Pages Function
 * Handles learner streak management
 * 
 * Endpoints:
 * - GET /:learnerId - Get learner streak info
 * - POST /:learnerId/complete - Mark activity complete (update streak)
 * - GET /:learnerId/notifications - Get notification history
 * - POST /:learnerId/process - Process streak check
 * - POST /reset-daily - Reset daily flags (cron)
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';

// ==================== GET LEARNER STREAK ====================

async function handleGetStreak(supabase: SupabaseClient, learnerId: string): Promise<Response> {
  if (!learnerId) {
    return jsonResponse({ error: 'Learner ID is required' }, 400);
  }

  const { data, error } = await supabase
    .from('learner_streaks')
    .select('*')
    .eq('learner_id', learnerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, return default
      return jsonResponse({
        success: true,
        data: {
          learner_id: learnerId,
          current_streak: 0,
          longest_streak: 0,
          streak_completed_today: false,
        },
      });
    }
    return jsonResponse({ error: 'Failed to get streak', message: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    data,
  });
}

// ==================== UPDATE STREAK (COMPLETE ACTIVITY) ====================

async function handleCompleteStreak(supabase: SupabaseClient, learnerId: string): Promise<Response> {
  if (!learnerId) {
    return jsonResponse({ error: 'Learner ID is required' }, 400);
  }

  const { data, error } = await supabase
    .rpc('update_learner_streak', {
      p_learner_id: learnerId,
      p_activity_date: new Date().toISOString().split('T')[0],
    });

  if (error) {
    return jsonResponse({ error: 'Failed to update streak', message: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    data,
    message: 'Streak updated successfully!',
  });
}

// ==================== GET NOTIFICATION HISTORY ====================

async function handleGetNotifications(supabase: SupabaseClient, learnerId: string, limit: number = 10): Promise<Response> {
  if (!learnerId) {
    return jsonResponse({ error: 'Learner ID is required' }, 400);
  }

  const { data, error } = await supabase
    .from('streak_notification_log')
    .select('*')
    .eq('learner_id', learnerId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) {
    return jsonResponse({ error: 'Failed to get notification history', message: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    data: data || [],
    count: data?.length || 0,
  });
}

// ==================== PROCESS STREAK ====================

async function checklearnerActivityToday(supabase: SupabaseClient, learnerId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('learner_course_progress')
    .select('id')
    .eq('learner_id', learnerId)
    .gte('last_accessed', today.toISOString())
    .lte('last_accessed', todayEnd.toISOString())
    .limit(1);

  if (error) {
    console.error('Error checking course progress:', error);
    return false;
  }

  return data && data.length > 0;
}

async function handleProcessStreak(supabase: SupabaseClient, learnerId: string): Promise<Response> {
  if (!learnerId) {
    return jsonResponse({ error: 'Learner ID is required' }, 400);
  }

  try {
    const hasActivity = await checklearnerActivityToday(supabase, learnerId);

    if (hasActivity) {
      const { data, error } = await supabase
        .rpc('update_learner_streak', {
          p_learner_id: learnerId,
          p_activity_date: new Date().toISOString().split('T')[0],
        });

      if (error) {
        return jsonResponse({
          success: true,
          data: {
            hasActivity: true,
            streakUpdated: false,
            error: error.message,
          },
        });
      }

      return jsonResponse({
        success: true,
        data: {
          hasActivity: true,
          streakUpdated: true,
          ...data,
        },
      });
    } else {
      return jsonResponse({
        success: true,
        data: {
          hasActivity: false,
          streakUpdated: false,
          message: 'No activity today',
        },
      });
    }
  } catch (error) {
    return jsonResponse({
      error: 'Failed to process streak',
      message: (error as Error).message
    }, 500);
  }
}

// ==================== RESET DAILY FLAGS (CRON) ====================

async function handleResetDailyFlags(supabase: SupabaseClient): Promise<Response> {
  const { data, error } = await supabase
    .rpc('reset_daily_streak_flags');

  if (error) {
    return jsonResponse({ error: 'Failed to reset daily flags', message: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    message: `Reset daily flags for ${data} learners`,
    count: data,
  });
}

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Parse path: /api/streak/:learnerId, /api/streak/:learnerId/complete, etc.
    const pathParts = path.replace('/api/streak', '').split('/').filter(Boolean);

    // Health check (public endpoint)
    if (pathParts.length === 0) {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'streak-api',
          endpoints: ['/:learnerId', '/:learnerId/complete', '/:learnerId/notifications', '/:learnerId/process', '/reset-daily'],
          timestamp: new Date().toISOString()
        });
      }
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      const user = getContextUser(authContext);
      const supabase = getServiceClient(authContext.env as unknown as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) as unknown as SupabaseClient;

      // POST /reset-daily - require admin role
      if (pathParts.length === 1 && pathParts[0] === 'reset-daily' && request.method === 'POST') {
        if (!user.roles?.includes('admin')) {
          return jsonResponse({ error: 'Forbidden: Admin access required' }, 403);
        }
        return await handleResetDailyFlags(supabase);
      }

      // Routes with learnerId
      if (pathParts.length >= 1) {
        const learnerId = pathParts[0];

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(learnerId)) {
          return jsonResponse({ error: 'Invalid learner ID format' }, 400);
        }

        // Security: Users can only access their own streak data
        // learnerId comes from the URL (learners.id), user.sub from the JWT (auth.users.id).
        // Look up the learner's user_id to verify ownership.
        const { data: learner } = await supabase
          .from('learners')
          .select('user_id')
          .eq('id', learnerId)
          .maybeSingle();

        if (!learner) {
          return jsonResponse({ error: 'Learner not found' }, 404);
        }

        if (learner.user_id !== user.id) {
          return jsonResponse({ error: 'Forbidden: Can only access your own streak data' }, 403);
        }

        // GET /:learnerId
        if (pathParts.length === 1 && request.method === 'GET') {
          return await handleGetStreak(supabase, learnerId);
        }

        // POST /:learnerId/complete
        if (pathParts.length === 2 && pathParts[1] === 'complete' && request.method === 'POST') {
          return await handleCompleteStreak(supabase, learnerId);
        }

        // GET /:learnerId/notifications
        if (pathParts.length === 2 && pathParts[1] === 'notifications' && request.method === 'GET') {
          const limit = parseInt(url.searchParams.get('limit') || '10');
          return await handleGetNotifications(supabase, learnerId, limit);
        }

        // POST /:learnerId/process
        if (pathParts.length === 2 && pathParts[1] === 'process' && request.method === 'POST') {
          return await handleProcessStreak(supabase, learnerId);
        }
      }

      return jsonResponse({ error: 'Not found' }, 404);
    })(context);
  } catch (error) {
    console.error('Streak API Error:', error);
    return jsonResponse({ 
      error: (error as Error).message || 'Internal server error' 
    }, 500);
  }
};
