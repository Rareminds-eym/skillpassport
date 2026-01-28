/**
 * Assessment API - Cloudflare Pages Function
 * Migrated from cloudflare-workers/assessment-api
 * 
 * Generates course-specific assessment questions using Claude AI
 * POST /api/assessment/generate - Generate assessment questions
 * POST /api/assessment/career-assessment/generate-aptitude - Generate aptitude questions
 * POST /api/assessment/career-assessment/generate-knowledge - Generate stream knowledge questions
 */

import { createSupabaseClient } from '../../../src/functions-lib/supabase';
import { jsonResponse, errorResponse } from '../../../src/functions-lib/response';
import type { PagesEnv } from '../../../src/functions-lib/types';

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
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
      const questionsStr = questionsMatch[1];
      const questions: any[] = [];
      
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

// List of models to try in order (using reliable free models)
const FREE_MODELS = [
  'xiaomi/mimo-v2-flash:free'
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
          const waitTime = Math.pow(2, attempt) * 2000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${model} failed (${response.status}):`, errorText.substring(0, 200));
          lastError = new Error(`${model} failed: ${response.status}`);
          break;
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(`✅ ${model} succeeded`);
          return content;
        }
        
        lastError = new Error('Empty response from API');
        break;
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

// Categories with specific question counts to match UI expectations (total: 50)
const APTITUDE_CATEGORIES = [
  { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies', count: 8 },
  { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation', count: 8 },
  { id: 'abstract', name: 'Abstract / Logical Reasoning', description: 'Pattern recognition, deductive reasoning, sequences', count: 8 },
  { id: 'spatial', name: 'Spatial / Mechanical Reasoning', description: 'Visual-spatial relationships, gears, rotation', count: 6 },
  { id: 'clerical', name: 'Clerical Speed & Accuracy', description: 'String comparison, attention to detail - mark Same or Different', count: 20 }
];

// School Subject Categories for After 10th students (total: 50 questions)
const SCHOOL_SUBJECT_CATEGORIES = [
  { id: 'mathematics', name: 'Mathematics', description: 'Algebra, geometry, arithmetic, problem-solving - tests analytical and numerical skills', count: 10 },
  { id: 'science', name: 'Science (Physics, Chemistry, Biology)', description: 'Scientific concepts, experiments, formulas, natural phenomena', count: 10 },
  { id: 'english', name: 'English Language', description: 'Grammar, vocabulary, comprehension, communication skills', count: 10 },
  { id: 'social_studies', name: 'Social Studies (History, Geography, Civics)', description: 'Historical events, geography, civics, current affairs, society', count: 10 },
  { id: 'computer', name: 'Computer & Logical Thinking', description: 'Basic computer concepts, logical reasoning, problem-solving, digital literacy', count: 10 }
];

// Import prompts and contexts
import { SCHOOL_SUBJECT_PROMPT, APTITUDE_PROMPT, KNOWLEDGE_PROMPT, SYSTEM_PROMPT } from './prompts';
import { STREAM_CONTEXTS } from './stream-contexts';

// Aptitude question generation
async function generateAptitudeQuestions(
  env: PagesEnv, 
  streamId: string, 
  questionsPerCategory: number = 5,
  studentId?: string,
  attemptId?: string,
  gradeLevel?: string
) {
  const supabase = createSupabaseClient(env);
  const isAfter10 = gradeLevel === 'after10';
  
  console.log(`📚 Grade level detection: streamId=${streamId}, gradeLevel=${gradeLevel}, isAfter10=${isAfter10}`);

  // Check for existing questions
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
        console.log('✅ Returning saved aptitude questions for student:', studentId);
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

  // Smart fallback logic for stream context lookup
  let streamContext = STREAM_CONTEXTS[streamId];
  
  if (!streamContext) {
    console.warn(`⚠️ Stream context not found for: ${streamId}, attempting fallback...`);
    const streamIdLower = streamId.toLowerCase();
    
    if (streamIdLower.includes('commerce')) {
      streamContext = STREAM_CONTEXTS['commerce'];
    } else if (streamIdLower.includes('arts') || streamIdLower.includes('humanities')) {
      streamContext = STREAM_CONTEXTS['arts'];
    } else if (streamIdLower.includes('science') || streamIdLower.includes('pcm') || streamIdLower.includes('pcb')) {
      streamContext = STREAM_CONTEXTS['science'];
    } else {
      streamContext = STREAM_CONTEXTS['college'];
    }
  }

  const categories = isAfter10 ? SCHOOL_SUBJECT_CATEGORIES : APTITUDE_CATEGORIES;
  const promptTemplate = isAfter10 ? SCHOOL_SUBJECT_PROMPT : APTITUDE_PROMPT;

  // Helper function to generate questions for specific categories
  async function generateBatch(batchNum: number, batchCategories: typeof categories): Promise<any[]> {
    const categoriesText = batchCategories.map(c => `- ${c.name} (${c.count} questions): ${c.description}`).join('\n');
    const totalQuestions = batchCategories.reduce((sum, c) => sum + c.count, 0);
    
    let prompt: string;
    if (isAfter10) {
      prompt = promptTemplate
        .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
        .replace(/\{\{STREAM_NAME\}\}/g, streamContext.name);
    } else {
      prompt = promptTemplate
        .replace(/\{\{CATEGORIES\}\}/g, categoriesText)
        .replace(/\{\{STREAM_NAME\}\}/g, streamContext.name)
        .replace(/\{\{STREAM_CONTEXT\}\}/g, streamContext.context)
        .replace(/\{\{CLERICAL_EXAMPLE\}\}/g, streamContext.clericalExample);
    }

    let jsonText: string;
    const systemPrompt = isAfter10 
      ? `You are an expert educational assessment creator for 10th grade students. Generate EXACTLY ${totalQuestions} questions total covering school subjects. Generate ONLY valid JSON.`
      : `You are an expert psychometric assessment creator. Generate EXACTLY ${totalQuestions} questions total. Generate ONLY valid JSON.`;
    
    if (claudeKey) {
      console.log(`🔑 Batch ${batchNum}: Using Claude API for ${totalQuestions} questions`);
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
            max_tokens: 6000,
            temperature: 0.7 + (batchNum * 0.05),
            system: systemPrompt,
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ]);
        } else {
          throw claudeError;
        }
      }
    } else if (openRouterKey) {
      console.log(`🔑 Batch ${batchNum}: Using OpenRouter with retry for ${totalQuestions} questions`);
      jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);
    } else {
      throw new Error('No API key configured');
    }

    const result = repairAndParseJSON(jsonText);
    return result.questions || [];
  }

  let batch1: any[];
  let batch2: any[];

  if (isAfter10) {
    const batch1Categories = categories.filter(c => ['mathematics', 'science', 'english'].includes(c.id));
    console.log('📦 Generating batch 1 (Mathematics + Science + English = 30 questions)...');
    batch1 = await generateBatch(1, batch1Categories);
    console.log(`✅ Batch 1 complete: ${batch1.length} questions`);

    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    const batch2Categories = categories.filter(c => ['social_studies', 'computer'].includes(c.id));
    console.log('📦 Generating batch 2 (Social Studies + Computer = 20 questions)...');
    batch2 = await generateBatch(2, batch2Categories);
    console.log(`✅ Batch 2 complete: ${batch2.length} questions`);
  } else {
    const batch1Categories = categories.filter(c => ['verbal', 'numerical', 'abstract'].includes(c.id));
    console.log('📦 Generating batch 1 (verbal + numerical + abstract = 24 questions)...');
    batch1 = await generateBatch(1, batch1Categories);
    console.log(`✅ Batch 1 complete: ${batch1.length} questions`);

    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    const batch2Categories = categories.filter(c => ['spatial', 'clerical'].includes(c.id));
    console.log('📦 Generating batch 2 (spatial + clerical = 26 questions)...');
    batch2 = await generateBatch(2, batch2Categories);
    console.log(`✅ Batch 2 complete: ${batch2.length} questions`);
  }

  const categoryToModule: Record<string, string> = isAfter10 ? {
    'mathematics': 'A) Mathematics',
    'science': 'B) Science',
    'english': 'C) English Language',
    'social_studies': 'D) Social Studies',
    'computer': 'E) Computer & Logical Thinking'
  } : {
    'verbal': 'A) Verbal Reasoning',
    'numerical': 'B) Numerical Ability',
    'abstract': 'C) Abstract / Logical Reasoning',
    'spatial': 'D) Spatial / Mechanical Reasoning',
    'clerical': 'E) Clerical Speed & Accuracy'
  };

  const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1,
    subtype: q.category,
    subject: q.subject || q.category,
    moduleTitle: categoryToModule[q.category] || q.category
  }));

  console.log(`✅ Total aptitude questions generated: ${allQuestions.length}`);

  if (studentId) {
    try {
      await supabase.from('career_assessment_ai_questions').upsert({
        student_id: studentId,
        stream_id: streamId,
        question_type: 'aptitude',
        attempt_id: attemptId || null,
        questions: allQuestions,
        generated_at: new Date().toISOString(),
        grade_level: gradeLevel || 'Grade 10',
        is_active: true
      }, { onConflict: 'student_id,stream_id,question_type' });
      console.log('✅ Aptitude questions saved for student:', studentId);
    } catch (e: any) {
      console.warn('⚠️ Could not save questions:', e.message);
    }
  }

  return { questions: allQuestions, generated: true };
}

// Stream knowledge question generation
async function generateKnowledgeQuestions(
  env: PagesEnv, 
  streamId: string, 
  streamName: string, 
  topics: string[], 
  questionCount: number = 20,
  studentId?: string,
  attemptId?: string,
  gradeLevel?: string
) {
  const supabase = createSupabaseClient(env);

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
        console.log('✅ Returning saved knowledge questions for student:', studentId);
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

    const result = repairAndParseJSON(jsonText);
    return result.questions || [];
  }

  const halfTopics = Math.ceil(topics.length / 2);
  const topics1 = topics.slice(0, halfTopics);
  const topics2 = topics.slice(halfTopics);

  console.log('📦 Generating knowledge batch 1 (10 questions)...');
  const batch1 = await generateBatch(1, 10, topics1.length > 0 ? topics1 : topics);
  console.log(`✅ Knowledge batch 1 complete: ${batch1.length} questions`);

  console.log('⏳ Waiting 3s before batch 2...');
  await delay(3000);

  console.log('📦 Generating knowledge batch 2 (10 questions)...');
  const batch2 = await generateBatch(2, 10, topics2.length > 0 ? topics2 : topics);
  console.log(`✅ Knowledge batch 2 complete: ${batch2.length} questions`);

  const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
    ...q,
    id: generateUUID(),
    originalIndex: idx + 1
  }));

  console.log(`✅ Total knowledge questions generated: ${allQuestions.length}`);

  if (studentId) {
    try {
      await supabase.from('career_assessment_ai_questions').upsert({
        student_id: studentId,
        stream_id: streamId,
        question_type: 'knowledge',
        attempt_id: attemptId || null,
        questions: allQuestions,
        generated_at: new Date().toISOString(),
        grade_level: gradeLevel || 'Grade 10',
        is_active: true
      }, { onConflict: 'student_id,stream_id,question_type' });
      console.log('✅ Knowledge questions saved for student:', studentId);
    } catch (e: any) {
      console.warn('⚠️ Could not save questions:', e.message);
    }
  }

  return { questions: allQuestions, generated: true };
}

// Course assessment generation
async function generateAssessment(env: PagesEnv, courseName: string, level: string, questionCount: number) {
  const supabase = createSupabaseClient(env);

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

  assessmentJSON = assessmentJSON
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  const startIdx = assessmentJSON.indexOf('{');
  const endIdx = assessmentJSON.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error('Invalid JSON structure in response');
    throw new Error('Failed to parse assessment response');
  }
  
  assessmentJSON = assessmentJSON.substring(startIdx, endIdx + 1);

  assessmentJSON = assessmentJSON
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}')
    .replace(/[\x00-\x1F\x7F]/g, ' ');

  let assessment;
  try {
    assessment = JSON.parse(assessmentJSON);
  } catch (parseError: any) {
    console.error('JSON parse error:', parseError.message);
    console.error('Problematic JSON (first 500 chars):', assessmentJSON.substring(0, 500));
    throw new Error('Failed to parse assessment JSON: ' + parseError.message);
  }

  if (assessment.questions) {
    assessment.questions = assessment.questions.map((q: any, idx: number) => {
      if (!q.correct_answer && q.options?.length > 0) {
        q.correct_answer = q.options[0];
      }
      if (!q.estimated_time) {
        q.estimated_time = q.difficulty === 'easy' ? 50 : q.difficulty === 'medium' ? 80 : 110;
      }
      if (q.type === 'mcq' && q.options?.length > 0) {
        const correctAnswer = q.correct_answer;
        q.options = [...q.options].sort(() => Math.random() - 0.5);
        q.correct_answer = correctAnswer;
      }
      return { ...q, id: idx + 1 };
    });
  }

  try {
    const { error: insertError } = await supabase.from('generated_external_assessment').insert({
      certificate_name: courseName,
      assessment_level: level,
      total_questions: questionCount,
      questions: assessment.questions,
      generated_by: 'claude-ai'
    });
    
    if (insertError) {
      console.warn('⚠️ Could not cache assessment to database:', insertError.message);
    } else {
      console.log('✅ Assessment cached to database');
    }
  } catch (cacheError: any) {
    console.warn('⚠️ Database insert exception:', cacheError.message);
  }

  console.log('✅ Assessment generated successfully');
  return assessment;
}

// Main request handler for Cloudflare Pages Function
export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;
  
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check
  if (path.endsWith('/health')) {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // Generate assessment
  if (path.endsWith('/generate') && request.method === 'POST') {
    try {
      const body = await request.json() as any;
      const { courseName, level = 'Intermediate', questionCount = 15 } = body;

      if (!courseName) {
        return errorResponse('Course name is required', 400);
      }

      const assessment = await generateAssessment(env, courseName, level, questionCount);
      return jsonResponse(assessment);
    } catch (error: any) {
      console.error('❌ Error:', error);
      return errorResponse(error.message || 'Failed to generate assessment', 500);
    }
  }

  // Generate aptitude questions for career assessment
  if (path.includes('/career-assessment/generate-aptitude') && request.method === 'POST') {
    try {
      const body = await request.json() as any;
      const { streamId, questionsPerCategory = 10, studentId, attemptId, gradeLevel } = body;

      if (!streamId) {
        return errorResponse('Stream ID is required', 400);
      }

      console.log('📚 Aptitude request:', { streamId, gradeLevel, studentId });
      const result = await generateAptitudeQuestions(env, streamId, questionsPerCategory, studentId, attemptId, gradeLevel);
      return jsonResponse(result);
    } catch (error: any) {
      console.error('❌ Aptitude generation error:', error);
      return errorResponse(error.message || 'Failed to generate aptitude questions', 500);
    }
  }

  // Generate stream knowledge questions for career assessment
  if (path.includes('/career-assessment/generate-knowledge') && request.method === 'POST') {
    try {
      const body = await request.json() as any;
      console.log('📥 Knowledge request body:', JSON.stringify(body));
      const { streamId, streamName, topics, questionCount = 20, studentId, attemptId, gradeLevel } = body;

      if (!streamId || !streamName || !topics) {
        console.error('❌ Missing required fields:', { streamId, streamName, topics: !!topics });
        return errorResponse('Stream ID, name, and topics are required', 400);
      }

      console.log('🎯 Generating knowledge questions for:', streamName, 'topics:', topics.length, 'grade:', gradeLevel);
      const result = await generateKnowledgeQuestions(env, streamId, streamName, topics, questionCount, studentId, attemptId, gradeLevel);
      return jsonResponse(result);
    } catch (error: any) {
      console.error('❌ Knowledge generation error:', error.message, error.stack);
      return errorResponse(error.message || 'Failed to generate knowledge questions', 500);
    }
  }

  return errorResponse('Not found', 404);
};
