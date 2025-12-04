import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildSuggestedQuestionsPrompt(lessonTitle: string, lessonContent: string | null, moduleTitle: string): string {
  return `Based on the following lesson, generate 3-5 helpful questions that a student might want to ask to better understand the material.

## Lesson: ${lessonTitle}
## Module: ${moduleTitle}

### Content:
${lessonContent || 'No content available'}

Generate questions that:
1. Help clarify key concepts from the lesson
2. Explore practical applications of the material
3. Connect this lesson to broader course themes
4. Address common points of confusion

Return ONLY a JSON array of question strings, like:
["Question 1?", "Question 2?", "Question 3?"]`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ===== ENVIRONMENT VARIABLES CHECK =====
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables:', { 
        hasUrl: !!SUPABASE_URL, 
        hasAnonKey: !!SUPABASE_ANON_KEY 
      });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get service role key for JWT verification (required per Supabase docs)
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create admin client to verify JWT (official Supabase pattern)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the JWT token using admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Create regular client for database operations (respects RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log(`AI Tutor suggestions request from user: ${user.id}`);

    const { lessonId } = await req.json();
    if (!lessonId) {
      return new Response(JSON.stringify({ error: 'Missing required field: lessonId' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch lesson with module info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('lesson_id, title, content, module_id')
      .eq('lesson_id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(JSON.stringify({ error: 'Lesson not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get module title
    const { data: module } = await supabase
      .from('course_modules')
      .select('title')
      .eq('module_id', lesson.module_id)
      .single();

    const moduleTitle = module?.title || 'Unknown Module';
    const prompt = buildSuggestedQuestionsPrompt(lesson.title, lesson.content, moduleTitle);

    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('OPENAI_API_KEY');
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'AI service error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let questions: string[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) questions = JSON.parse(jsonMatch[0]);
    } catch {
      questions = content.split('\n').filter((q: string) => q.trim().endsWith('?')).slice(0, 5);
    }

    questions = questions.slice(0, 5);
    if (questions.length < 3) {
      questions = [
        `What are the key concepts in "${lesson.title}"?`,
        `Can you explain the main points of this lesson?`,
        `How does this lesson connect to the rest of the course?`
      ];
    }

    return new Response(JSON.stringify({ questions, lessonId, lessonTitle: lesson.title }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in ai-tutor-suggestions:', error);
    return new Response(JSON.stringify({ error: (error as Error)?.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
