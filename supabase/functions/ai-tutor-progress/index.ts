import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log(`AI Tutor progress request from user: ${user.id}`);
    const studentId = user.id;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const courseId = url.searchParams.get('courseId');

      if (!courseId) {
        return new Response(
          JSON.stringify({ error: 'Missing courseId parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: progress, error: progressError } = await supabase
        .from('student_course_progress')
        .select('lesson_id, status, last_accessed, completed_at, time_spent_seconds')
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch progress' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('lesson_id, course_modules!inner(course_id)')
        .eq('course_modules.course_id', courseId);

      const totalLessons = lessons?.length || 0;
      const completedLessons = (progress || []).filter((p: any) => p.status === 'completed').length;
      const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const lastAccessed = (progress || [])
        .filter((p: any) => p.last_accessed)
        .sort((a: any, b: any) => new Date(b.last_accessed!).getTime() - new Date(a.last_accessed!).getTime())[0];

      return new Response(
        JSON.stringify({
          courseId,
          totalLessons,
          completedLessons,
          completionPercentage,
          lastAccessedLessonId: lastAccessed?.lesson_id || null,
          lastAccessedAt: lastAccessed?.last_accessed || null,
          progress: progress || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { courseId, lessonId, status } = await req.json();

      if (!courseId || !lessonId || !status) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: courseId, lessonId, status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['not_started', 'in_progress', 'completed'].includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be: not_started, in_progress, or completed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const now = new Date().toISOString();
      const updateData: any = {
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        status,
        last_accessed: now,
        updated_at: now
      };

      if (status === 'completed') {
        updateData.completed_at = now;
      }

      const { data: result, error: upsertError } = await supabase
        .from('student_course_progress')
        .upsert(updateData, {
          onConflict: 'student_id,course_id,lesson_id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error updating progress:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to update progress' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, progress: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-tutor-progress:', error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
