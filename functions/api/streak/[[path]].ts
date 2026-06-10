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

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getContextUser, withAuth } from '../../lib/auth';
import { getCorsHeaders } from '../../lib/cors';
import { apiError, apiSuccess } from '../../lib/response';
import { ADMIN_ROLES } from '../../lib/roleCategories';
import { getServiceClient } from '../../lib/supabase';
import type { PagesFunction } from '../../lib/types';

// ==================== GET LEARNER STREAK ====================

async function handleGetStreak(supabase: SupabaseClient, learnerId: string): Promise<Response> {
  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'Learner ID is required', undefined);
  }

  const { data, error } = await supabase
    .from('learner_streaks')
    .select('*')
    .eq('learner_id', learnerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, return default
      return apiSuccess({
        data: {
          learner_id: learnerId,
          current_streak: 0,
          longest_streak: 0,
          streak_completed_today: false,
        },
      }, undefined);
    }
    return apiError(500, 'INTERNAL_ERROR', `Failed to get streak: ${error instanceof Error ? error.message : String(error)}`, undefined);
  }

  return apiSuccess({
    data,
  }, undefined);
}

// ==================== UPDATE STREAK (COMPLETE ACTIVITY) ====================

async function handleCompleteStreak(supabase: SupabaseClient, learnerId: string): Promise<Response> {
  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'Learner ID is required', undefined);
  }

  const { data, error } = await supabase
    .rpc('update_learner_streak', {
      p_learner_id: learnerId,
      p_activity_date: new Date().toISOString().split('T')[0],
    });

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', `Failed to update streak: ${error.message}`, undefined);
  }

  return apiSuccess({
    data,
    message: 'Streak updated successfully!',
  }, undefined);
}

// ==================== GET NOTIFICATION HISTORY ====================

async function handleGetNotifications(supabase: SupabaseClient, learnerId: string, limit: number = 10): Promise<Response> {
  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'Learner ID is required', undefined);
  }

  const { data, error } = await supabase
    .from('streak_notification_log')
    .select('*')
    .eq('learner_id', learnerId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', `Failed to get notification history: ${error.message}`, undefined);
  }

  return apiSuccess({
    data: data || [],
    count: data?.length || 0,
  }, undefined);
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
    return apiError(400, 'VALIDATION_ERROR', 'Learner ID is required', undefined);
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
        return apiSuccess({
          data: {
            hasActivity: true,
            streakUpdated: false,
            error: error.message,
          },
        }, undefined);
      }

      return apiSuccess({
        data: {
          hasActivity: true,
          streakUpdated: true,
          ...data,
        },
      }, undefined);
    } else {
      return apiSuccess({
        data: {
          hasActivity: false,
          streakUpdated: false,
          message: 'No activity today',
        },
      }, undefined);
    }
  } catch (error) {
    return apiError(500, 'INTERNAL_ERROR', `Failed to get streak: ${error instanceof Error ? error.message : String(error)}`, undefined);
  }
}

// ==================== RESET DAILY FLAGS (CRON) ====================

async function handleResetDailyFlags(supabase: SupabaseClient): Promise<Response> {
  const { data, error } = await supabase
    .rpc('reset_daily_streak_flags');

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', `Failed to reset daily flags: ${error.message}`, undefined);
  }

  return apiSuccess({
    message: `Reset daily flags for ${data} learners`,
    count: data,
  }, undefined);
}

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '';
    return new Response(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(origin),
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Parse path: /api/streak/:learnerId, /api/streak/:learnerId/complete, etc.
    const pathParts = path.replace('/api/streak', '').split('/').filter(Boolean);

    // Health check (public endpoint)
    if (pathParts.length === 0) {
      if (request.method === 'GET') {
        return apiSuccess({
          status: 'ok',
          service: 'streak-api',
          endpoints: ['/:learnerId', '/:learnerId/complete', '/:learnerId/notifications', '/:learnerId/process', '/reset-daily'],
          timestamp: new Date().toISOString()
        }, request);
      }
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      const user = getContextUser(authContext);
      const supabase = getServiceClient(authContext.env as unknown as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) as unknown as SupabaseClient;

      // POST /reset-daily - require admin role.
      // Sourced from the shared ADMIN_ROLES group (NOT an inline literal — bug
      // §7.1). NOTE: this normalizes the prior single-literal `roles.includes('admin')`
      // check to the full admin role-category group; the own-streak routes below
      // remain ownership-scoped (authenticated-only).
      if (pathParts.length === 1 && pathParts[0] === 'reset-daily' && request.method === 'POST') {
        const isAdmin = user.roles?.some((r: string) => ADMIN_ROLES.includes(r));
        if (!isAdmin) {
          return apiError(403, 'FORBIDDEN', 'Forbidden: Admin access required', request);
        }
        return await handleResetDailyFlags(supabase);
      }

      // Routes with learnerId
      if (pathParts.length >= 1) {
        const learnerId = pathParts[0];

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(learnerId)) {
          return apiError(400, 'VALIDATION_ERROR', 'Invalid learner ID format', request);
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
          return apiError(404, 'NOT_FOUND', 'Learner not found', request);
        }

        if (learner.user_id !== user.id) {
          return apiError(403, 'FORBIDDEN', 'Forbidden: Can only access your own streak data', request);
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

      return apiError(404, 'NOT_FOUND', 'Not found', request);
    })(context);
  } catch (error) {
    console.error('Streak API Error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message || 'Internal server error', undefined);
  }
};
