/**
 * Internal API: College Lecturer Account Status Check
 * Layer 0: Called by SSO-worker during login to check college_educator accountStatus
 * 
 * GET /api/internal/lecturer-status/:user_id
 * 
 * Authentication: Internal API key (X-Internal-API-Key header)
 * Response: { isLecturer: boolean, accountStatus?: string, userId: string }
 */

import { getServiceClient } from '../../../lib/supabase';
import type { PagesEnv } from '../../../lib/types';

export const onRequestGet = async (context: any) => {
  const env = context.env as unknown as PagesEnv;
  const supabase = getServiceClient(env);

  // Verify internal API key
  const apiKey = context.request.headers.get('X-Internal-API-Key');
  const validSecret = env.INTERNAL_WEBHOOK_SECRET || (env as any).INTERNAL_API_KEY;
  if (!apiKey || !validSecret || apiKey !== validSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawUserId = context.params.user_id;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  if (!userId || typeof userId !== 'string') {
    return Response.json({ error: 'Invalid user_id parameter' }, { status: 400 });
  }

  try {
    const { data: lecturer, error } = await supabase
      .from('college_lecturers')
      .select('accountStatus')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Internal API] Lecturer status check database error:', error);
      return Response.json({ error: 'Database error' }, { status: 500 });
    }

    if (!lecturer) {
      // User exists but is not a college lecturer
      return Response.json(
        {
          isLecturer: false,
          userId,
        },
        { status: 200 }
      );
    }

    // User is a college lecturer
    return Response.json(
      {
        isLecturer: true,
        accountStatus: lecturer.accountStatus || 'active',
        userId,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Internal API] Lecturer status check exception:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
