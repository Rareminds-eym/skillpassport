/**
 * Assessment Session API
 * 
 * Manages assessment session locking and coordination across browser tabs.
 * Provides server-side session management with automatic cleanup.
 */

import { createClient } from '@supabase/supabase-js';

interface AssessmentSession {
  id: string;
  assessment_id: string;
  student_id: string;
  tab_id: string;
  student_name: string;
  status: 'active' | 'completed' | 'abandoned';
  heartbeat_at: string;
  created_at: string;
  updated_at: string;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface PagesFunction<Env = any> {
  (context: { request: Request; env: Env }): Response | Promise<Response>;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/assessment-session', '');
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!env.SUPABASE_URL,
        hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // POST /acquire - Acquire session lock
    if (method === 'POST' && path === '/acquire') {
      return await acquireSession(request, supabase, corsHeaders);
    }

    // POST /heartbeat - Send heartbeat to maintain session
    if (method === 'POST' && path === '/heartbeat') {
      return await sendHeartbeat(request, supabase, corsHeaders);
    }

    // POST /release - Release session lock
    if (method === 'POST' && path === '/release') {
      return await releaseSession(request, supabase, corsHeaders);
    }

    // GET /status/:assessmentId/:studentId - Check session status
    if (method === 'GET' && path.startsWith('/status/')) {
      return await getSessionStatus(path, supabase, corsHeaders);
    }

    // POST /cleanup - Clean up stale sessions (admin)
    if (method === 'POST' && path === '/cleanup') {
      return await cleanupStaleSessions(supabase, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error('Assessment Session API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

/**
 * Acquire session lock
 */
async function acquireSession(request: Request, supabase: any, corsHeaders: Record<string, string>) {
  const { assessmentId, studentId, tabId, studentName } = await request.json();

  console.log('[API] Acquire session request:', { assessmentId, studentId, tabId, studentName });

  if (!assessmentId || !studentId || !tabId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    // First, check if there's already an active session
    console.log('[API] Checking for existing sessions...');
    const { data: existingSessions, error: checkError } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (checkError) {
      console.error('[API] Error checking existing sessions:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: checkError.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('[API] Existing sessions found:', existingSessions?.length || 0);

    // If there's an active session from a different tab, check if it's stale
    if (existingSessions && existingSessions.length > 0) {
      const existingSession = existingSessions[0];
      const heartbeatTime = new Date(existingSession.heartbeat_at).getTime();
      const now = Date.now();
      const staleThreshold = 15 * 60 * 1000; // 15 minutes

      console.log('[API] Existing session details:', {
        tabId: existingSession.tab_id,
        requestTabId: tabId,
        heartbeatAge: now - heartbeatTime,
        staleThreshold
      });

      // If session is from same tab, update it
      if (existingSession.tab_id === tabId) {
        console.log('[API] Updating existing session for same tab');
        const { data: updatedSession, error: updateError } = await supabase
          .from('assessment_sessions')
          .update({ 
            heartbeat_at: new Date().toISOString(),
            student_name: studentName || existingSession.student_name
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (updateError) {
          console.error('[API] Error updating existing session:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update session', details: updateError.message }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            session: updatedSession,
            acquired: true,
            message: 'Session updated'
          }),
          { 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      // If session is not stale, deny acquisition
      if (now - heartbeatTime < staleThreshold) {
        console.log('[API] Session is active, denying acquisition');
        return new Response(
          JSON.stringify({
            success: false,
            acquired: false,
            message: 'Session locked by another tab',
            lockHolder: {
              tabId: existingSession.tab_id,
              studentName: existingSession.student_name,
              heartbeatAt: existingSession.heartbeat_at
            }
          }),
          { 
            status: 409, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        );
      }

      // Session is stale, remove it
      console.log('[API] Removing stale session');
      await supabase
        .from('assessment_sessions')
        .delete()
        .eq('id', existingSession.id);
    }

    // Create new session
    console.log('[API] Creating new session...');
    const sessionData = {
      assessment_id: assessmentId,
      student_id: studentId,
      tab_id: tabId,
      student_name: studentName || 'Student',
      status: 'active',
      heartbeat_at: new Date().toISOString()
    };
    
    console.log('[API] Session data to insert:', sessionData);
    
    const { data: newSession, error: insertError } = await supabase
      .from('assessment_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error('[API] Error creating session:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session', details: insertError.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('[API] Session created successfully:', newSession);

    return new Response(
      JSON.stringify({
        success: true,
        session: newSession,
        acquired: true,
        message: 'Session acquired'
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('[API] Error in acquireSession:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

/**
 * Send heartbeat to maintain session
 */
async function sendHeartbeat(request: Request, supabase: any, corsHeaders: Record<string, string>) {
  const { sessionId, tabId } = await request.json();

  if (!sessionId || !tabId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    const { data: session, error } = await supabase
      .from('assessment_sessions')
      .update({ heartbeat_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('tab_id', tabId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      console.error('Error updating heartbeat:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update heartbeat' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found or not owned by this tab' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session,
        message: 'Heartbeat updated'
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in sendHeartbeat:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

/**
 * Release session lock
 */
async function releaseSession(request: Request, supabase: any, corsHeaders: Record<string, string>) {
  const { sessionId, tabId, status = 'completed' } = await request.json();

  if (!sessionId || !tabId) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    const { data: session, error } = await supabase
      .from('assessment_sessions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('tab_id', tabId)
      .select()
      .single();

    if (error) {
      console.error('Error releasing session:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to release session' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found or not owned by this tab' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session,
        message: 'Session released'
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in releaseSession:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

/**
 * Get session status
 */
async function getSessionStatus(path: string, supabase: any, corsHeaders: Record<string, string>) {
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length < 3) {
    return new Response(
      JSON.stringify({ error: 'Invalid path format' }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  const assessmentId = pathParts[1];
  const studentId = pathParts[2];

  try {
    const { data: sessions, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting session status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get session status' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const activeSession = sessions && sessions.length > 0 ? sessions[0] : null;

    return new Response(
      JSON.stringify({
        success: true,
        hasActiveSession: !!activeSession,
        session: activeSession,
        message: activeSession ? 'Active session found' : 'No active session'
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in getSessionStatus:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}

/**
 * Clean up stale sessions
 */
async function cleanupStaleSessions(supabase: any, corsHeaders: Record<string, string>) {
  try {
    // Call the database function to clean up stale sessions
    const { data, error } = await supabase.rpc('cleanup_stale_assessment_sessions');

    if (error) {
      console.error('Error cleaning up stale sessions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup stale sessions' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: data || 0,
        message: `Cleaned up ${data || 0} stale sessions`
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('Error in cleanupStaleSessions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
}