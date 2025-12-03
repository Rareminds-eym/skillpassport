import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ENVIRONMENT VARIABLES CHECK =====
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables:', { 
        hasUrl: !!SUPABASE_URL, 
        hasAnonKey: !!SUPABASE_ANON_KEY 
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get service role key for JWT verification (required per Supabase docs)
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client to verify JWT (official Supabase pattern)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the JWT token using admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create regular client for database operations (respects RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log(`AI Tutor feedback request from user: ${user.id}`);
    const studentId = user.id;
    const { conversationId, messageIndex, rating, feedbackText } = await req.json();

    if (!conversationId || messageIndex === undefined || rating === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: conversationId, messageIndex, rating' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate rating
    if (rating !== 1 && rating !== -1) {
      return new Response(
        JSON.stringify({ error: 'Invalid rating. Must be 1 (thumbs up) or -1 (thumbs down)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from('tutor_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('student_id', studentId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if feedback already exists for this message
    const { data: existingFeedback } = await supabase
      .from('tutor_feedback')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('message_index', messageIndex)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { error: updateError } = await supabase
        .from('tutor_feedback')
        .update({
          rating,
          feedback_text: feedbackText || null
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        console.error('Error updating feedback:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update feedback' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Feedback updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new feedback
    const { error: insertError } = await supabase
      .from('tutor_feedback')
      .insert({
        conversation_id: conversationId,
        message_index: messageIndex,
        rating,
        feedback_text: feedbackText || null
      });

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Feedback submitted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-tutor-feedback:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
