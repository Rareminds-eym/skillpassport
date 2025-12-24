/**
 * Assessment API Cloudflare Worker
 * Generates course-specific assessment questions using Claude AI
 * POST /generate - Generate assessment questions
 */

import { createClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  CLAUDE_API_KEY?: string;
  VITE_CLAUDE_API_KEY?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const SYSTEM_PROMPT = `You are an expert assessment creator. Generate a skill assessment SPECIFICALLY for the course: {{COURSE_NAME}}

CRITICAL REQUIREMENTS:
1. ALL questions MUST be directly related to {{COURSE_NAME}}
2. Questions should test practical knowledge of {{COURSE_NAME}}
3. Generate EXACTLY {{QUESTION_COUNT}} questions with this distribution:
   - First 5 questions: EASY difficulty
   - Next 5 questions: MEDIUM difficulty  
   - Last 5 questions: HARD difficulty

Difficulty Guidelines:
- EASY (Q1-5): Fundamental concepts (45-60 seconds per question)
- MEDIUM (Q6-10): Complex application, debugging (75-90 seconds per question)
- HARD (Q11-15): Advanced optimization, edge cases (100-120 seconds per question)

Question Rules:
1. All questions must be MCQ with exactly 4 options
2. Each MCQ must have exactly ONE correct answer
3. Options should be plausible but clearly distinguishable
4. Test understanding, not memorization

Output Format:
- Respond with ONLY valid JSON
- NO markdown formatting
- NO explanatory text

Required JSON structure:
{
  "course": "{{COURSE_NAME}}",
  "level": "{{LEVEL}}",
  "total_questions": {{QUESTION_COUNT}},
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "Skill being tested",
      "estimated_time": 45
    }
  ]
}`;

async function generateAssessment(env: Env, courseName: string, level: string, questionCount: number) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // Check cache first
  const { data: existing } = await supabase
    .from('generated_external_assessment')
    .select('*')
    .eq('certificate_name', courseName)
    .single();

  if (existing) {
    console.log('✅ Returning cached questions for:', courseName);
    return {
      course: courseName,
      level: existing.assessment_level,
      total_questions: existing.total_questions,
      questions: existing.questions,
      cached: true
    };
  }

  console.log('📝 Generating new questions for:', courseName);

  const apiKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const prompt = SYSTEM_PROMPT
    .replace(/\{\{COURSE_NAME\}\}/g, courseName)
    .replace(/\{\{LEVEL\}\}/g, level)
    .replace(/\{\{QUESTION_COUNT\}\}/g, String(questionCount));


  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      system: `You are an expert assessment creator for ${courseName}. Generate ONLY valid JSON.`,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.json() as any;
    throw new Error(error.error?.message || 'Failed to generate assessment');
  }

  const data = await response.json() as any;
  let assessmentJSON = data.content[0].text;

  console.log('Raw Claude response length:', assessmentJSON.length);

  // Clean up response - more robust parsing
  assessmentJSON = assessmentJSON
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find the JSON object boundaries
  const startIdx = assessmentJSON.indexOf('{');
  const endIdx = assessmentJSON.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error('Invalid JSON structure in response');
    throw new Error('Failed to parse assessment response');
  }
  
  assessmentJSON = assessmentJSON.substring(startIdx, endIdx + 1);

  // Fix common JSON issues from AI responses
  assessmentJSON = assessmentJSON
    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
    .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters

  let assessment;
  try {
    assessment = JSON.parse(assessmentJSON);
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError.message);
    console.error('Problematic JSON (first 500 chars):', assessmentJSON.substring(0, 500));
    throw new Error('Failed to parse assessment JSON: ' + parseError.message);
  }

  // Validate and fix questions
  if (assessment.questions) {
    assessment.questions = assessment.questions.map((q: any, idx: number) => {
      if (!q.correct_answer && q.options?.length > 0) {
        q.correct_answer = q.options[0];
      }
      if (!q.estimated_time) {
        q.estimated_time = q.difficulty === 'easy' ? 50 : q.difficulty === 'medium' ? 80 : 110;
      }
      // Shuffle options
      if (q.type === 'mcq' && q.options?.length > 0) {
        const correctAnswer = q.correct_answer;
        q.options = [...q.options].sort(() => Math.random() - 0.5);
        q.correct_answer = correctAnswer;
      }
      return { ...q, id: idx + 1 };
    });
  }

  // Cache to database
  await supabase.from('generated_external_assessment').insert({
    certificate_name: courseName,
    assessment_level: level,
    total_questions: questionCount,
    questions: assessment.questions,
    generated_by: 'claude-ai'
  });

  console.log('✅ Assessment generated and cached');
  return assessment;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/health' || path === '/api/health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Generate assessment
    if ((path === '/generate' || path === '/api/assessment/generate') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { courseName, level = 'Intermediate', questionCount = 15 } = body;

        if (!courseName) {
          return jsonResponse({ error: 'Course name is required' }, 400);
        }

        const assessment = await generateAssessment(env, courseName, level, questionCount);
        return jsonResponse(assessment);
      } catch (error: any) {
        console.error('❌ Error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate assessment' }, 500);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
