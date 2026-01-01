/**
 * Assessment API Cloudflare Worker
 * Generates course-specific assessment questions using Claude AI
 * POST /generate - Generate assessment questions
 * POST /career-assessment/generate-aptitude - Generate aptitude questions
 * POST /career-assessment/generate-knowledge - Generate stream knowledge questions
 */

import { createClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  CLAUDE_API_KEY?: string;
  VITE_CLAUDE_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  VITE_OPENROUTER_API_KEY?: string;
}

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to repair and parse JSON from AI responses
function repairAndParseJSON(text: string): any {
  // Clean markdown
  let cleaned = text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find JSON boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON object found in response');
  }
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Initial JSON parse failed, attempting repair...');
  }

  // Repair common issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
    .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
    .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
    .replace(/\n/g, ' ')              // Remove newlines
    .replace(/\r/g, '')               // Remove carriage returns
    .replace(/\t/g, ' ')              // Replace tabs with spaces
    .replace(/"\s*\n\s*"/g, '", "')   // Fix broken string arrays
    .replace(/}\s*{/g, '},{')         // Fix missing commas between objects
    .replace(/]\s*\[/g, '],[')        // Fix missing commas between arrays
    .replace(/"\s+"/g, '","');        // Fix missing commas between strings

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Repair attempt 1 failed, trying more aggressive repair...');
  }

  // More aggressive: try to extract just the questions array
  const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
  if (questionsMatch) {
    try {
      // Try to parse individual question objects
      const questionsStr = questionsMatch[1];
      const questions: any[] = [];
      
      // Split by },{ pattern
      const parts = questionsStr.split(/}\s*,\s*{/);
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        if (!part.startsWith('{')) part = '{' + part;
        if (!part.endsWith('}')) part = part + '}';
        
        try {
          const q = JSON.parse(part);
          questions.push(q);
        } catch (qe) {
          console.log(`⚠️ Skipping malformed question ${i + 1}`);
        }
      }
      
      if (questions.length > 0) {
        console.log(`✅ Recovered ${questions.length} questions from malformed JSON`);
        return { questions };
      }
    } catch (e) {
      console.log('⚠️ Questions extraction failed');
    }
  }

  throw new Error('Failed to parse JSON after all repair attempts');
}

// List of free models to try in order (verified working on OpenRouter)
const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free'
];

// Helper function to call OpenRouter with retry and model fallback
async function callOpenRouterWithRetry(
  openRouterKey: string,
  messages: Array<{role: string, content: string}>,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (const model of FREE_MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Trying ${model} (attempt ${attempt + 1}/${maxRetries})`);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://skillpassport.pages.dev',
            'X-Title': 'SkillPassport Assessment'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 4000,
            temperature: 0.7,
            messages: messages
          })
        });

        if (response.status === 429) {
          // Rate limited - wait and retry
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${model} failed (${response.status}):`, errorText.substring(0, 200));
          lastError = new Error(`${model} failed: ${response.status}`);
          break; // Try next model
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(`✅ ${model} succeeded`);
          return content;
        }
        
        lastError = new Error('Empty response from API');
        break; // Try next model
      } catch (e: any) {
        console.error(`❌ ${model} error:`, e.message);
        lastError = e;
        if (attempt < maxRetries - 1) {
          await delay(1000);
        }
      }
    }
  }
  
  throw lastError || new Error('All models failed');
}

// ============================================
// APTITUDE QUESTION GENERATION
// ============================================
const APTITUDE_CATEGORIES = [
  { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies' },
  { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation' },
  { id: 'logical', name: 'Logical Reasoning', description: 'Pattern recognition, deductive reasoning' },
  { id: 'spatial', name: 'Spatial Reasoning', description: 'Visual-spatial relationships, mental rotation' },
  { id: 'abstract', name: 'Abstract Reasoning', description: 'Pattern completion, sequence identification' }
];

const APTITUDE_PROMPT = `You are an expert psychometric assessment creator. Generate aptitude test questions for {{STREAM_NAME}} stream career assessment.

Generate {{QUESTIONS_PER_CATEGORY}} questions for EACH of these categories:
{{CATEGORIES}}

IMPORTANT CONTEXT - This is for {{STREAM_NAME}} stream students:
{{STREAM_CONTEXT}}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Mix difficulty levels: 40% easy, 40% medium, 20% hard
4. Questions should be culturally neutral and fair
5. Test cognitive abilities with examples relevant to {{STREAM_NAME}} field
6. Use scenarios, examples, and contexts from {{STREAM_NAME}} domain where possible

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "category": "verbal",
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "vocabulary",
      "estimated_time": 45
    }
  ]
}

IMPORTANT: Use sequential numeric IDs (1, 2, 3, etc.) for each question.`;

// Stream-specific context for aptitude questions
const STREAM_CONTEXTS: Record<string, { name: string; context: string }> = {
  'science': {
    name: 'Science',
    context: `- Verbal: Use scientific terminology, research papers context, lab reports
- Numerical: Include physics calculations, chemistry equations, biology statistics
- Logical: Use scientific method reasoning, hypothesis testing scenarios
- Spatial: Include molecular structures, anatomical diagrams, physics diagrams
- Abstract: Use patterns from nature, scientific data visualization`
  },
  'commerce': {
    name: 'Commerce',
    context: `- Verbal: Use business terminology, financial reports, market analysis context
- Numerical: Include profit/loss calculations, interest rates, accounting problems
- Logical: Use business decision scenarios, market trend analysis
- Spatial: Include charts, graphs, organizational structures
- Abstract: Use patterns from financial data, economic trends`
  },
  'arts': {
    name: 'Arts/Humanities',
    context: `- Verbal: Use literary terminology, historical texts, philosophical concepts
- Numerical: Include statistics from social sciences, historical data analysis
- Logical: Use ethical dilemmas, historical cause-effect scenarios
- Spatial: Include art compositions, architectural layouts, map reading
- Abstract: Use patterns from art, cultural symbols, design elements`
  }
};

const KNOWLEDGE_PROMPT = `You are an expert assessment creator for {{STREAM_NAME}} education.

Generate {{QUESTION_COUNT}} knowledge assessment questions covering these topics:
{{TOPICS}}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization
5. Questions should be relevant for students entering this field

Output Format - Respond with ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "easy",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "skill_tag": "topic name",
      "estimated_time": 60
    }
  ]
}

IMPORTANT: Use sequential numeric IDs (1, 2, 3, etc.) for each question.`;

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

// ============================================
// APTITUDE QUESTION GENERATION (Per-student with save/resume)
// Generates 50 questions in two batches of 25 each
// ============================================
async function generateAptitudeQuestions(
  env: Env, 
  streamId: string, 
  questionsPerCategory: number = 5,
  studentId?: string,
  attemptId?: string
) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // If studentId provided, check for existing questions for this student
  if (studentId) {
    try {
      const { data: existing, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('stream_id', streamId)
        .eq('question_type', 'aptitude')
        .eq('is_active', true)
        .maybeSingle();

      if (!error && existing?.questions?.length >= 50) {
        console.log('✅ Returning saved aptitude questions for student:', studentId, 'count:', existing.questions.length);
        return { questions: existing.questions, cached: true };
      }
    } catch (e: any) {
      console.warn('⚠️ Error checking existing questions:', e.message);
    }
  }

  console.log('📝 Generating fresh aptitude questions in 2 batches for stream:', streamId);

  const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
  
  if (!openRouterKey && !claudeKey) {
    throw new Error('No API key configured (OpenRouter or Claude)');
  }

  // Helper function to generate one batch
  async function generateBatch(batchNum: number, questionsPerCat: number): Promise<any[]> {
    const categoriesText = APTITUDE_CATEGORIES.map(c => `- ${c.name}: ${c.description}`).join('\n');
    const streamContext = STREAM_CONTEXTS[streamId] || STREAM_CONTEXTS['science'];
    const prompt = APTITUDE_PROMPT
      .replace(/\{\{QUESTIONS_PER_CATEGORY\}\}/g, String(questionsPerCat))
      .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
      .replace(/\{\{STREAM_NAME\}\}/g, streamContext.name)
      .replace(/\{\{STREAM_CONTEXT\}\}/g, streamContext.context);

    let jsonText: string;
    
    // Try Claude first, fallback to OpenRouter with retry
    if (claudeKey) {
      console.log(`🔑 Batch ${batchNum}: Using Claude API`);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            temperature: 0.7 + (batchNum * 0.05),
            system: 'You are an expert psychometric assessment creator. Generate ONLY valid JSON.',
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API failed: ${response.status}`);
        }

        const data = await response.json() as any;
        jsonText = data.content[0].text;
      } catch (claudeError: any) {
        console.error('Claude error:', claudeError.message);
        if (openRouterKey) {
          console.log(`🔑 Batch ${batchNum}: Claude failed, trying OpenRouter with retry`);
          jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: 'You are an expert psychometric assessment creator. Generate ONLY valid JSON.' },
            { role: 'user', content: prompt }
          ]);
        } else {
          throw claudeError;
        }
      }
    } else if (openRouterKey) {
      console.log(`🔑 Batch ${batchNum}: Using OpenRouter with retry`);
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: 'You are an expert psychometric assessment creator. Generate ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ]);
    } else {
      throw new Error('No API key configured');
    }

    // Use robust JSON parser
    const result = repairAndParseJSON(jsonText);
    return result.questions || [];
  }

  // Generate two batches of 25 questions each (5 per category × 5 categories = 25)
  console.log('📦 Generating batch 1 (25 questions)...');
  const batch1 = await generateBatch(1, 5);
  console.log(`✅ Batch 1 complete: ${batch1.length} questions`);

  // Wait 3 seconds between batches to avoid rate limits
  console.log('⏳ Waiting 3s before batch 2...');
  await delay(3000);

  console.log('📦 Generating batch 2 (25 questions)...');
  const batch2 = await generateBatch(2, 5);
  console.log(`✅ Batch 2 complete: ${batch2.length} questions`);

  // Combine batches and assign UUIDs
  const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1
  }));

  console.log(`✅ Total aptitude questions generated: ${allQuestions.length}`);

  // Save to database for this student if studentId provided
  if (studentId) {
    try {
      await supabase.from('career_assessment_ai_questions').upsert({
        student_id: studentId,
        stream_id: streamId,
        question_type: 'aptitude',
        attempt_id: attemptId || null,
        questions: allQuestions,
        generated_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'student_id,stream_id,question_type' });
      console.log('✅ Aptitude questions saved for student:', studentId);
    } catch (e: any) {
      console.warn('⚠️ Could not save questions:', e.message);
    }
  }

  return { questions: allQuestions, generated: true };
}

// ============================================
// STREAM KNOWLEDGE QUESTION GENERATION (Per-student with save/resume)
// Generates 20 questions in two batches of 10 each
// ============================================
async function generateKnowledgeQuestions(
  env: Env, 
  streamId: string, 
  streamName: string, 
  topics: string[], 
  questionCount: number = 20,
  studentId?: string,
  attemptId?: string
) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // If studentId provided, check for existing questions for this student
  if (studentId) {
    try {
      const { data: existing, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('stream_id', streamId)
        .eq('question_type', 'knowledge')
        .eq('is_active', true)
        .maybeSingle();

      if (!error && existing?.questions?.length >= 20) {
        console.log('✅ Returning saved knowledge questions for student:', studentId, 'count:', existing.questions.length);
        return { questions: existing.questions, cached: true };
      }
    } catch (e: any) {
      console.warn('⚠️ Error checking existing questions:', e.message);
    }
  }

  console.log('📝 Generating fresh knowledge questions in 2 batches for:', streamName);

  const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
  
  if (!openRouterKey && !claudeKey) {
    throw new Error('No API key configured (OpenRouter or Claude)');
  }

  // Helper function to generate one batch of knowledge questions
  async function generateBatch(batchNum: number, count: number, topicSubset: string[]): Promise<any[]> {
    const topicsText = topicSubset.map(t => `- ${t}`).join('\n');
    const prompt = `You are an expert assessment creator for ${streamName} education.

Generate exactly ${count} knowledge assessment questions covering these topics:
${topicsText}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}`;

    let jsonText: string;
    
    if (claudeKey) {
      console.log(`🔑 Knowledge Batch ${batchNum}: Using Claude API`);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 3000,
            temperature: 0.7 + (batchNum * 0.05),
            system: `You are an expert assessment creator. Generate ONLY valid JSON with ${count} questions. No markdown.`,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API failed: ${response.status}`);
        }

        const data = await response.json() as any;
        jsonText = data.content[0].text;
      } catch (claudeError: any) {
        console.error('Claude error:', claudeError.message);
        if (openRouterKey) {
          console.log(`🔑 Knowledge Batch ${batchNum}: Claude failed, trying OpenRouter with retry`);
          jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: `Generate ONLY valid JSON with ${count} questions. No markdown.` },
            { role: 'user', content: prompt }
          ]);
        } else {
          throw claudeError;
        }
      }
    } else if (openRouterKey) {
      console.log(`🔑 Knowledge Batch ${batchNum}: Using OpenRouter with retry`);
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: `Generate ONLY valid JSON with ${count} questions. No markdown.` },
        { role: 'user', content: prompt }
      ]);
    } else {
      throw new Error('No API key configured');
    }

    // Use robust JSON parser
    const result = repairAndParseJSON(jsonText);
    return result.questions || [];
  }

  // Split topics into two groups for variety
  const halfTopics = Math.ceil(topics.length / 2);
  const topics1 = topics.slice(0, halfTopics);
  const topics2 = topics.slice(halfTopics);

  // Generate two batches of 10 questions each
  console.log('📦 Generating knowledge batch 1 (10 questions)...');
  const batch1 = await generateBatch(1, 10, topics1.length > 0 ? topics1 : topics);
  console.log(`✅ Knowledge batch 1 complete: ${batch1.length} questions`);

  // Wait 3 seconds between batches to avoid rate limits
  console.log('⏳ Waiting 3s before batch 2...');
  await delay(3000);

  console.log('📦 Generating knowledge batch 2 (10 questions)...');
  const batch2 = await generateBatch(2, 10, topics2.length > 0 ? topics2 : topics);
  console.log(`✅ Knowledge batch 2 complete: ${batch2.length} questions`);

  // Combine batches and assign UUIDs
  const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1
  }));

  console.log(`✅ Total knowledge questions generated: ${allQuestions.length}`);

  // Save to database for this student if studentId provided
  if (studentId) {
    try {
      await supabase.from('career_assessment_ai_questions').upsert({
        student_id: studentId,
        stream_id: streamId,
        question_type: 'knowledge',
        attempt_id: attemptId || null,
        questions: allQuestions,
        generated_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'student_id,stream_id,question_type' });
      console.log('✅ Knowledge questions saved for student:', studentId);
    } catch (e: any) {
      console.warn('⚠️ Could not save questions:', e.message);
    }
  }

  return { questions: allQuestions, generated: true };
}

// ============================================
// COURSE ASSESSMENT GENERATION (existing)
// ============================================
async function generateAssessment(env: Env, courseName: string, level: string, questionCount: number) {
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  // Check cache first (but don't fail if database is unavailable)
  try {
    const { data: existing, error: cacheError } = await supabase
      .from('generated_external_assessment')
      .select('*')
      .eq('certificate_name', courseName)
      .single();

    if (!cacheError && existing) {
      console.log('✅ Returning cached questions for:', courseName);
      return {
        course: courseName,
        level: existing.assessment_level,
        total_questions: existing.total_questions,
        questions: existing.questions,
        cached: true
      };
    }
    
    if (cacheError && cacheError.code !== 'PGRST116') {
      console.warn('⚠️ Cache check failed, will generate new:', cacheError.message);
    }
  } catch (dbError: any) {
    console.warn('⚠️ Database unavailable, will generate new questions:', dbError.message);
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

  // Cache to database (don't fail if this doesn't work)
  try {
    const { error: insertError } = await supabase.from('generated_external_assessment').insert({
      certificate_name: courseName,
      assessment_level: level,
      total_questions: questionCount,
      questions: assessment.questions,
      generated_by: 'claude-ai'
    });
    
    if (insertError) {
      console.warn('⚠️ Could not cache assessment to database:', insertError.message, insertError.code);
    } else {
      console.log('✅ Assessment cached to database');
    }
  } catch (cacheError: any) {
    console.warn('⚠️ Database insert exception:', cacheError.message);
  }

  console.log('✅ Assessment generated successfully');
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

    // Generate aptitude questions for career assessment
    if ((path === '/career-assessment/generate-aptitude' || path === '/api/career-assessment/generate-aptitude') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { streamId, questionsPerCategory = 10, studentId, attemptId } = body;

        if (!streamId) {
          return jsonResponse({ error: 'Stream ID is required' }, 400);
        }

        const result = await generateAptitudeQuestions(env, streamId, questionsPerCategory, studentId, attemptId);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Aptitude generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate aptitude questions' }, 500);
      }
    }

    // Generate stream knowledge questions for career assessment
    if ((path === '/career-assessment/generate-knowledge' || path === '/api/career-assessment/generate-knowledge') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        console.log('📥 Knowledge request body:', JSON.stringify(body));
        const { streamId, streamName, topics, questionCount = 20, studentId, attemptId } = body;

        if (!streamId || !streamName || !topics) {
          console.error('❌ Missing required fields:', { streamId, streamName, topics: !!topics });
          return jsonResponse({ error: 'Stream ID, name, and topics are required', received: { streamId, streamName, hasTopics: !!topics } }, 400);
        }

        console.log('🎯 Generating knowledge questions for:', streamName, 'topics:', topics.length);
        const result = await generateKnowledgeQuestions(env, streamId, streamName, topics, questionCount, studentId, attemptId);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Knowledge generation error:', error.message, error.stack);
        return jsonResponse({ error: error.message || 'Failed to generate knowledge questions', stack: error.stack?.substring(0, 500) }, 500);
      }
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};
