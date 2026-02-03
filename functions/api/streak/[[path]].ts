/**
 * Streak API - Pages Function
 * Handles student streak management
 * 
 * Endpoints:
 * - GET /:studentId - Get student streak info
 * - POST /:studentId/complete - Mark activity complete (update streak)
 * - GET /:studentId/notifications - Get notification history
 * - POST /:studentId/process - Process streak check
 * - POST /reset-daily - Reset daily flags (cron)
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse, createSupabaseClient } from '../../../src/functions-lib';
import type { SupabaseClient } from '@supabase/supabase-js';

// ==================== GET STUDENT STREAK ====================

async function handleGetStreak(supabase: SupabaseClient, studentId: string): Promise<Response> {
  if (!studentId) {
    return jsonResponse({ error: 'Student ID is required' }, 400);
  }

  const { data, error } = await supabase
    .from('student_streaks')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, return default
      return jsonResponse({
        success: true,
        data: {
          student_id: studentId,
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

async function handleCompleteStreak(supabase: SupabaseClient, studentId: string): Promise<Response> {
  if (!studentId) {
    return jsonResponse({ error: 'Student ID is required' }, 400);
  }

  const { data, error } = await supabase
    .rpc('update_student_streak', {
      p_student_id: studentId,
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

async function handleGetNotifications(supabase: SupabaseClient, studentId: string, limit: number = 10): Promise<Response> {
  if (!studentId) {
    return jsonResponse({ error: 'Student ID is required' }, 400);
  }

  const { data, error } = await supabase
    .from('streak_notification_log')
    .select('*')
    .eq('student_id', studentId)
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

async function checkStudentActivityToday(supabase: SupabaseClient, studentId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('student_course_progress')
    .select('id')
    .eq('student_id', studentId)
    .gte('last_accessed', today.toISOString())
    .lte('last_accessed', todayEnd.toISOString())
    .limit(1);

  if (error) {
    console.error('Error checking course progress:', error);
    return false;
  }

  return data && data.length > 0;
}

async function handleProcessStreak(supabase: SupabaseClient, studentId: string): Promise<Response> {
  if (!studentId) {
    return jsonResponse({ error: 'Student ID is required' }, 400);
  }

  try {
    const hasActivity = await checkStudentActivityToday(supabase, studentId);

    if (hasActivity) {
      const { data, error } = await supabase
        .rpc('update_student_streak', {
          p_student_id: studentId,
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
    message: `Reset daily flags for ${data} students`,
    count: data,
  });
}

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    const supabase = createSupabaseClient(env);

    // Parse path: /api/streak/:studentId, /api/streak/:studentId/complete, etc.
    const pathParts = path.replace('/api/streak', '').split('/').filter(Boolean);

    // Health check
    if (pathParts.length === 0) {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'streak-api',
          endpoints: ['/:studentId', '/:studentId/complete', '/:studentId/notifications', '/:studentId/process', '/reset-daily'],
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST /reset-daily
    if (pathParts.length === 1 && pathParts[0] === 'reset-daily' && request.method === 'POST') {
      return await handleResetDailyFlags(supabase);
    }

    // Routes with studentId
    if (pathParts.length >= 1) {
      const studentId = pathParts[0];

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(studentId)) {
        return jsonResponse({ error: 'Invalid student ID format' }, 400);
      }

      // GET /:studentId
      if (pathParts.length === 1 && request.method === 'GET') {
        return await handleGetStreak(supabase, studentId);
      }

      // POST /:studentId/complete
      if (pathParts.length === 2 && pathParts[1] === 'complete' && request.method === 'POST') {
        return await handleCompleteStreak(supabase, studentId);
      }

      // GET /:studentId/notifications
      if (pathParts.length === 2 && pathParts[1] === 'notifications' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        return await handleGetNotifications(supabase, studentId, limit);
      }

      // POST /:studentId/process
      if (pathParts.length === 2 && pathParts[1] === 'process' && request.method === 'POST') {
        return await handleProcessStreak(supabase, studentId);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('Streak API Error:', error);
    return jsonResponse({ 
      error: (error as Error).message || 'Internal server error' 
    }, 500);
  }
};
