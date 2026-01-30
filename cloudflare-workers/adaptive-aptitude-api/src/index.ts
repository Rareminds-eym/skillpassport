/**
 * Adaptive Aptitude API Cloudflare Worker
 * 
 * Generates adaptive aptitude test questions using AI (OpenRouter).
 * Handles question generation for all test phases with caching support.
 * 
 * Endpoints:
 * - POST /generate - Generate questions based on options
 * - POST /generate/diagnostic - Generate diagnostic screener questions
 * - POST /generate/adaptive - Generate adaptive core questions
 * - POST /generate/stability - Generate stability confirmation questions
 * - GET /health - Health check
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string; // Alternative name for service role key
  OPENROUTER_API_KEY?: string;
  VITE_OPENROUTER_API_KEY?: string;
}

type GradeLevel = 'middle_school' | 'high_school' | 'higher_secondary';
type TestPhase = 'diagnostic_screener' | 'adaptive_core' | 'stability_confirmation';
type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
type Subtag = 
  | 'numerical_reasoning'
  | 'logical_reasoning'
  | 'verbal_reasoning'
  | 'spatial_reasoning'
  | 'data_interpretation'
  | 'pattern_recognition';

interface Question {
  id: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  difficulty: DifficultyLevel;
  subtag: Subtag;
  gradeLevel: GradeLevel;
  phase: TestPhase;
  explanation?: string;
  createdAt?: string;
}

interface QuestionGenerationOptions {
  gradeLevel: GradeLevel;
  phase: TestPhase;
  difficulty?: DifficultyLevel;
  subtag?: Subtag;
  count?: number;
  excludeQuestionIds?: string[];
}

interface QuestionGenerationResult {
  questions: Question[];
  fromCache: boolean;
  generatedCount: number;
  cachedCount: number;
}

interface RawAIQuestion {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALL_SUBTAGS: Subtag[] = [
  'numerical_reasoning',
  'logical_reasoning',
  'verbal_reasoning',
  'spatial_reasoning',
  'data_interpretation',
  'pattern_recognition',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// =============================================================================
// HELPERS
// =============================================================================

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateQuestionId(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${gradeLevel}_${phase}_d${difficulty}_${subtag}_${timestamp}_${random}`;
}

function getWriteClient(env: Env): ReturnType<typeof createClient> {
  // Check both possible environment variable names
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  const key = serviceKey || env.VITE_SUPABASE_ANON_KEY;
  
  if (!serviceKey) {
    console.warn('⚠️ [getWriteClient] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY not configured, falling back to anonymous key. Cache writes may fail due to RLS policies.');
  } else {
    console.log('✅ [getWriteClient] Using service role key for write operations');
  }
  
  console.log(`🔗 [getWriteClient] Creating Supabase client with URL: ${env.VITE_SUPABASE_URL}`);
  
  return createClient(env.VITE_SUPABASE_URL, key);
}

// =============================================================================
// PROMPTS
// =============================================================================

const GRADE_LEVEL_CONTEXT: Record<GradeLevel, string> = {
  middle_school: `You are creating aptitude test questions for MIDDLE SCHOOL students (grades 6-8, ages 11-14).

CRITICAL GUIDELINES FOR MIDDLE SCHOOL (Grades 6-8):
- Use simple, everyday vocabulary that 11-14 year olds understand
- Questions should be challenging but NOT frustrating
- Use relatable scenarios: school life, sports, games, family, friends, hobbies, animals, nature
- AVOID: complex technical terms, abstract business concepts, advanced math beyond basic algebra
- Mathematical concepts: basic arithmetic, fractions, percentages (up to 25%), simple ratios, basic geometry
- Logical reasoning: simple if-then statements, basic categorization, straightforward deductions
- Verbal reasoning: common word analogies, simple vocabulary relationships
- Keep question text SHORT and CLEAR (max 2-3 sentences)
- Use concrete examples, not abstract concepts
- Numbers should be manageable: avoid decimals beyond 2 places, keep calculations mental-math friendly

VARIETY REQUIREMENTS FOR MIDDLE SCHOOL:
- Use DIVERSE scenarios: mix school, home, sports, nature, shopping, games, etc.
- Vary the subjects: use different fruits, animals, objects, people names, etc.
- Change numerical values significantly between questions
- Use different measurement units: dollars, meters, hours, pieces, etc.
- Create original contexts - avoid repeating similar situations`,

  high_school: `You are creating aptitude test questions for HIGH SCHOOL students (grades 9-12, ages 14-18).

CRITICAL GUIDELINES FOR HIGH SCHOOL (Grades 9-12):
- Use more sophisticated vocabulary and concepts
- Questions can involve more complex multi-step reasoning
- Use scenarios relevant to teenagers: academics, career planning, technology, social situations
- Mathematical concepts: algebra, basic statistics, percentages, ratios, probability basics
- Logical reasoning: syllogisms, conditional statements, pattern analysis
- Verbal reasoning: advanced analogies, vocabulary in context, reading comprehension
- Include more abstract thinking challenges
- Can reference real-world applications and career contexts

VARIETY REQUIREMENTS FOR HIGH SCHOOL:
- Use DIVERSE scenarios: academics, business, science, technology, social situations, etc.
- Vary the contexts: different professions, situations, and real-world applications
- Change numerical values and scales significantly between questions
- Use different types of data: percentages, ratios, statistics, probabilities, etc.
- Create original problems - avoid repeating similar patterns or structures`,

  higher_secondary: `You are creating aptitude test questions for HIGHER SECONDARY / COLLEGE students (grades 11-12+, ages 16-22).

CRITICAL GUIDELINES FOR HIGHER SECONDARY / COLLEGE:
- Use advanced vocabulary and complex sentence structures
- Questions should be intellectually challenging and require critical thinking
- Use scenarios relevant to young adults: college life, career planning, professional scenarios, advanced academics, research
- Mathematical concepts: advanced algebra, statistics, data analysis, probability, logical deduction, quantitative reasoning
- Logical reasoning: complex syllogisms, multi-step deductions, pattern recognition, analytical thinking
- Verbal reasoning: sophisticated analogies, contextual vocabulary, inference, comprehension of complex texts
- Include abstract reasoning and higher-order thinking skills
- Can reference professional aptitude test formats (similar to GRE, GMAT, CAT style questions)
- Questions should prepare students for competitive exams and professional assessments

VARIETY REQUIREMENTS FOR HIGHER SECONDARY / COLLEGE:
- Use DIVERSE scenarios: business analytics, scientific research, professional situations, academic contexts, etc.
- Vary the contexts: different industries, professional roles, academic disciplines, real-world applications
- Change numerical values, scales, and complexity significantly between questions
- Use different types of data: complex statistics, multi-variable problems, data interpretation, logical puzzles
- Create original, sophisticated problems - avoid repeating patterns or structures`,
};

const SUBTAG_DESCRIPTIONS: Record<Subtag, string> = {
  numerical_reasoning: 'Questions involving numbers, calculations, percentages, ratios, and mathematical patterns',
  logical_reasoning: 'Questions testing deductive reasoning, syllogisms, and logical conclusions',
  verbal_reasoning: 'Questions involving word relationships, analogies, and language comprehension',
  spatial_reasoning: 'Questions about shapes, patterns, rotations, and visual-spatial relationships',
  data_interpretation: 'Questions requiring analysis of charts, graphs, tables, and data sets',
  pattern_recognition: 'Questions identifying sequences, patterns, and relationships in data',
};

const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: 'Very Easy - Basic concepts, straightforward questions, minimal steps required',
  2: 'Easy - Simple concepts with slight complexity, 1-2 steps to solve',
  3: 'Medium - Moderate complexity, requires careful thinking, 2-3 steps',
  4: 'Hard - Complex reasoning required, multiple steps, some tricky elements',
  5: 'Very Hard - Advanced concepts, multi-step reasoning, requires deep analysis',
};

function buildSystemPrompt(gradeLevel: GradeLevel): string {
  return `${GRADE_LEVEL_CONTEXT[gradeLevel]}

You are an expert educational assessment designer creating multiple-choice aptitude test questions.

CRITICAL REQUIREMENTS:
1. Each question MUST have exactly 4 options (A, B, C, D)
2. Exactly ONE option must be correct
3. All distractors (wrong answers) must be plausible but clearly incorrect
4. Questions must be unambiguous with a single correct answer
5. Avoid culturally biased or offensive content
6. Questions should test aptitude, not memorized knowledge
7. NEVER create duplicate or similar questions - each question must be completely unique
8. Vary the scenarios, contexts, and numbers used in questions
9. Avoid common or overused question patterns

UNIQUENESS REQUIREMENTS:
- Use diverse scenarios and contexts for each question
- Vary numerical values significantly between questions
- Create original word problems, not variations of the same problem
- For pattern recognition: use different sequences (arithmetic, geometric, Fibonacci, etc.)
- For verbal reasoning: use different word pairs and relationships
- For logical reasoning: use varied logical structures and premises
- For spatial reasoning: describe different shapes, rotations, and transformations
- For data interpretation: use different data types (percentages, counts, ratios, etc.)

RESPONSE FORMAT:
Return a valid JSON array of question objects. Each object must have:
- "text": The question text (string)
- "options": Object with keys A, B, C, D containing answer choices
- "correctAnswer": Single letter (A, B, C, or D)
- "explanation": Brief explanation of why the answer is correct (optional but recommended)

Example format:
[
  {
    "text": "If 3x + 5 = 14, what is the value of x?",
    "options": {
      "A": "2",
      "B": "3",
      "C": "4",
      "D": "5"
    },
    "correctAnswer": "B",
    "explanation": "Solving: 3x = 14 - 5 = 9, so x = 9/3 = 3"
  }
]`;
}


// =============================================================================
// AI QUESTION GENERATION
// =============================================================================

function parseAIResponse(content: string): RawAIQuestion[] {
  // Clean markdown
  let cleaned = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find JSON array boundaries
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON array found in response');
  }
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // Try parsing as-is first
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }
    return validateQuestions(parsed);
  } catch (e) {
    console.log('⚠️ Initial JSON parse failed, attempting repair...');
    console.log('📄 Raw cleaned content (first 500 chars):', cleaned.substring(0, 500));
  }

  // Repair common issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ');

  try {
    const parsed = JSON.parse(cleaned);
    return validateQuestions(parsed);
  } catch (e) {
    console.error('❌ Failed to parse AI response after repair attempts');
    console.error('📄 Repaired content (first 500 chars):', cleaned.substring(0, 500));
    console.error('📄 Parse error:', e);
    throw new Error('Failed to parse AI response after repair attempts');
  }
}

function validateQuestions(parsed: unknown[]): RawAIQuestion[] {
  return parsed.map((q: any, index: number) => {
    if (!q.text || typeof q.text !== 'string') {
      throw new Error(`Question ${index + 1}: Missing or invalid text`);
    }
    if (!q.options || typeof q.options !== 'object') {
      throw new Error(`Question ${index + 1}: Missing or invalid options`);
    }
    if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
      throw new Error(`Question ${index + 1}: Missing one or more options (A, B, C, D)`);
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      throw new Error(`Question ${index + 1}: Invalid correctAnswer (must be A, B, C, or D)`);
    }

    return {
      text: q.text,
      options: {
        A: String(q.options.A),
        B: String(q.options.B),
        C: String(q.options.C),
        D: String(q.options.D),
      },
      correctAnswer: q.correctAnswer as 'A' | 'B' | 'C' | 'D',
      explanation: q.explanation ? String(q.explanation) : undefined,
    };
  });
}

// AI Models to try in order of preference (same as Assessment Evaluation/Analysis)
const AI_MODELS = [
  'google/gemini-2.0-flash-exp:free',  // Google's Gemini 2.0 - free, fast, 1M context
  'google/gemini-flash-1.5-8b',        // Gemini 1.5 Flash 8B - fast and efficient
  'anthropic/claude-3.5-sonnet',       // Claude 3.5 Sonnet - best quality (paid)
  'xiaomi/mimo-v2-flash:free'          // Fallback: Xiaomi's free model
];

async function generateQuestionsWithAI(
  apiKey: string,
  specs: { difficulty: DifficultyLevel; subtag: Subtag }[],
  gradeLevel: GradeLevel,
  phase: TestPhase
): Promise<Question[]> {
  console.log(`🤖 Generating ${specs.length} questions via OpenRouter...`);

  const questionsDescription = specs.map((spec, i) => 
    `Question ${i + 1}: Difficulty ${spec.difficulty} (${DIFFICULTY_DESCRIPTIONS[spec.difficulty]}), Type: ${spec.subtag.replace(/_/g, ' ')}`
  ).join('\n');

  const systemPrompt = buildSystemPrompt(gradeLevel);
  const userPrompt = `Generate exactly ${specs.length} COMPLETELY UNIQUE multiple-choice aptitude test questions with these SPECIFIC requirements:

${questionsDescription}

CRITICAL INSTRUCTIONS:
1. Generate questions in the EXACT order specified above
2. Each question must match its specified difficulty and type
3. EVERY question must be COMPLETELY UNIQUE - no similar questions, no repeated patterns
4. Use DIVERSE scenarios, contexts, and numerical values
5. Avoid common or overused question formats

UNIQUENESS CHECKLIST:
- Different scenarios for each question (e.g., don't use "apples" in multiple questions)
- Varied numerical values (e.g., don't repeat numbers like 12, 24, etc.)
- Original word problems, not variations of the same concept
- Diverse contexts (school, sports, shopping, nature, technology, etc.)
- Different logical structures and reasoning patterns

Requirements:
- Each question must have 4 options (A, B, C, D) with exactly one correct answer
- Include a brief explanation for each correct answer
- Questions should be appropriate for ${gradeLevel.replace('_', ' ')} students
- NO duplicate or similar questions within this batch

Return ONLY a valid JSON array with ${specs.length} question objects, no additional text.`;

  let lastError = '';

  // Try each model until one succeeds
  for (const model of AI_MODELS) {
    console.log(`🔄 [AI] Trying model: ${model}`);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://skillpassport.pages.dev',
          'X-Title': 'Adaptive Aptitude Test Generator'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = errorText;
        console.error(`❌ [AI] Model ${model} failed:`, response.status, errorText.substring(0, 200));
        continue;
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        lastError = 'Empty response from AI';
        console.error(`❌ [AI] Model ${model} returned empty content`);
        continue;
      }

      console.log(`✅ [AI] Success with model: ${model}`);
      console.log('📝 AI response received, length:', content.length, 'chars');
      console.log('📄 AI response preview (first 200 chars):', content.substring(0, 200));

      const rawQuestions = parseAIResponse(content);
      
      return rawQuestions.map((raw, index) => {
        const spec = specs[index] || specs[0];
        return {
          id: generateQuestionId(gradeLevel, phase, spec.difficulty, spec.subtag),
          text: raw.text,
          options: raw.options,
          correctAnswer: raw.correctAnswer,
          difficulty: spec.difficulty,
          subtag: spec.subtag,
          gradeLevel,
          phase,
          explanation: raw.explanation,
          createdAt: new Date().toISOString(),
        };
      });
      
    } catch (error) {
      lastError = (error as Error).message;
      console.error(`❌ [AI] Model ${model} error:`, error);
    }
  }

  // All models failed
  throw new Error(`AI question generation failed after trying all models: ${lastError}`);
}

// =============================================================================
// FALLBACK QUESTIONS
// =============================================================================

// Middle school fallback questions (grades 6-8, ages 11-14) - EXPANDED POOL
const MIDDLE_SCHOOL_FALLBACKS: Record<Subtag, { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]> = {
  numerical_reasoning: [
    { text: 'If you have 24 cookies and want to share them equally among 6 friends, how many cookies does each friend get?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
    { text: 'A pizza has 8 slices. If you eat 2 slices, what fraction of the pizza is left?', options: { A: '1/4', B: '1/2', C: '3/4', D: '2/3' }, correctAnswer: 'C' },
    { text: 'If a book costs $12 and you have $50, how many books can you buy?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
    { text: 'A movie ticket costs $8. How much do 5 tickets cost?', options: { A: '$35', B: '$40', C: '$45', D: '$50' }, correctAnswer: 'B' },
    { text: 'If you save $5 each week, how much will you have after 8 weeks?', options: { A: '$30', B: '$35', C: '$40', D: '$45' }, correctAnswer: 'C' },
    { text: 'A bag has 15 marbles. If 1/3 are blue, how many blue marbles are there?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    { text: 'What is 25% of 80?', options: { A: '15', B: '20', C: '25', D: '30' }, correctAnswer: 'B' },
    { text: 'If 4 pencils cost $2, how much do 10 pencils cost?', options: { A: '$4', B: '$5', C: '$6', D: '$8' }, correctAnswer: 'B' },
  ],
  logical_reasoning: [
    { text: 'All dogs are animals. Max is a dog. What can we conclude?', options: { A: 'Max is a cat', B: 'Max is an animal', C: 'All animals are dogs', D: 'Max is not a pet' }, correctAnswer: 'B' },
    { text: 'If it rains, the grass gets wet. The grass is wet. What can we say?', options: { A: 'It definitely rained', B: 'It might have rained', C: 'It did not rain', D: 'The sun is out' }, correctAnswer: 'B' },
    { text: 'All birds have feathers. A robin is a bird. What can we conclude?', options: { A: 'A robin can fly', B: 'A robin has feathers', C: 'All feathered things are birds', D: 'Robins are red' }, correctAnswer: 'B' },
    { text: 'If today is Monday, what day was it 3 days ago?', options: { A: 'Thursday', B: 'Friday', C: 'Saturday', D: 'Sunday' }, correctAnswer: 'B' },
    { text: 'All squares are rectangles. This shape is a square. What do we know?', options: { A: 'It has 3 sides', B: 'It is a rectangle', C: 'It is a circle', D: 'It has 5 corners' }, correctAnswer: 'B' },
    { text: 'If A is taller than B, and B is taller than C, who is the shortest?', options: { A: 'A', B: 'B', C: 'C', D: 'Cannot tell' }, correctAnswer: 'C' },
  ],
  verbal_reasoning: [
    { text: 'HOT is to COLD as DAY is to:', options: { A: 'Sun', B: 'Night', C: 'Light', D: 'Morning' }, correctAnswer: 'B' },
    { text: 'BOOK is to READ as SONG is to:', options: { A: 'Dance', B: 'Write', C: 'Listen', D: 'Play' }, correctAnswer: 'C' },
    { text: 'Which word means the OPPOSITE of "happy"?', options: { A: 'Joyful', B: 'Excited', C: 'Sad', D: 'Cheerful' }, correctAnswer: 'C' },
    { text: 'FISH is to SWIM as BIRD is to:', options: { A: 'Nest', B: 'Fly', C: 'Feather', D: 'Egg' }, correctAnswer: 'B' },
    { text: 'Which word means the SAME as "big"?', options: { A: 'Tiny', B: 'Small', C: 'Large', D: 'Short' }, correctAnswer: 'C' },
    { text: 'TEACHER is to SCHOOL as DOCTOR is to:', options: { A: 'Medicine', B: 'Hospital', C: 'Patient', D: 'Nurse' }, correctAnswer: 'B' },
    { text: 'UP is to DOWN as LEFT is to:', options: { A: 'Side', B: 'Right', C: 'Center', D: 'Forward' }, correctAnswer: 'B' },
    { text: 'PENCIL is to WRITE as SCISSORS is to:', options: { A: 'Paper', B: 'Sharp', C: 'Cut', D: 'Draw' }, correctAnswer: 'C' },
  ],
  spatial_reasoning: [
    { text: 'How many sides does a triangle have?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'B' },
    { text: 'If you fold a square piece of paper in half, what shape do you get?', options: { A: 'Triangle', B: 'Circle', C: 'Rectangle', D: 'Pentagon' }, correctAnswer: 'C' },
    { text: 'How many corners does a rectangle have?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'C' },
    { text: 'Which shape has no corners?', options: { A: 'Square', B: 'Triangle', C: 'Circle', D: 'Rectangle' }, correctAnswer: 'C' },
    { text: 'How many sides does a hexagon have?', options: { A: '4', B: '5', C: '6', D: '7' }, correctAnswer: 'C' },
    { text: 'If you cut a square diagonally, what shapes do you get?', options: { A: 'Two squares', B: 'Two triangles', C: 'Two rectangles', D: 'Two circles' }, correctAnswer: 'B' },
  ],
  data_interpretation: [
    { text: 'In a class of 20 students, 8 like soccer and 12 like basketball. How many more students like basketball than soccer?', options: { A: '2', B: '4', C: '6', D: '8' }, correctAnswer: 'B' },
    { text: 'If a graph shows Monday: 5 books, Tuesday: 3 books, Wednesday: 7 books read, which day had the most books read?', options: { A: 'Monday', B: 'Tuesday', C: 'Wednesday', D: 'All equal' }, correctAnswer: 'C' },
    { text: 'A survey shows 10 students like apples, 15 like oranges, 5 like bananas. What is the total?', options: { A: '25', B: '30', C: '35', D: '40' }, correctAnswer: 'B' },
    { text: 'If a chart shows Team A scored 20 points and Team B scored 15 points, what is the difference?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    { text: 'A table shows: Jan-10, Feb-15, Mar-20 sales. What is the total for all three months?', options: { A: '35', B: '40', C: '45', D: '50' }, correctAnswer: 'C' },
    { text: 'In a group of 30 students, half are girls. How many boys are there?', options: { A: '10', B: '15', C: '20', D: '25' }, correctAnswer: 'B' },
  ],
  pattern_recognition: [
    { text: 'What comes next: 2, 4, 6, 8, ?', options: { A: '9', B: '10', C: '11', D: '12' }, correctAnswer: 'B' },
    { text: 'What comes next: A, B, C, D, ?', options: { A: 'F', B: 'E', C: 'G', D: 'A' }, correctAnswer: 'B' },
    { text: 'What comes next: 1, 3, 5, 7, ?', options: { A: '8', B: '9', C: '10', D: '11' }, correctAnswer: 'B' },
    { text: 'What comes next: 5, 10, 15, 20, ?', options: { A: '22', B: '23', C: '24', D: '25' }, correctAnswer: 'D' },
    { text: 'What comes next: 3, 6, 9, 12, ?', options: { A: '13', B: '14', C: '15', D: '16' }, correctAnswer: 'C' },
    { text: 'What comes next: 1, 2, 4, 8, ?', options: { A: '10', B: '12', C: '14', D: '16' }, correctAnswer: 'D' },
    { text: 'What comes next: 100, 90, 80, 70, ?', options: { A: '50', B: '55', C: '60', D: '65' }, correctAnswer: 'C' },
    { text: 'What comes next: Z, Y, X, W, ?', options: { A: 'U', B: 'V', C: 'T', D: 'S' }, correctAnswer: 'B' },
  ],
};

// High school fallback questions (grades 9-12, ages 14-18) - EXPANDED POOL
const HIGH_SCHOOL_FALLBACKS: Record<Subtag, { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]> = {
  numerical_reasoning: [
    { text: 'If a shirt costs $25 and is on sale for 20% off, what is the sale price?', options: { A: '$20', B: '$22', C: '$18', D: '$15' }, correctAnswer: 'A' },
    { text: 'What is 15% of 80?', options: { A: '10', B: '12', C: '15', D: '8' }, correctAnswer: 'B' },
    { text: 'If 3x + 7 = 22, what is x?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    { text: 'A car travels 240 miles in 4 hours. What is its average speed?', options: { A: '50 mph', B: '55 mph', C: '60 mph', D: '65 mph' }, correctAnswer: 'C' },
    { text: 'If the ratio of boys to girls is 3:2 and there are 30 students, how many boys are there?', options: { A: '12', B: '15', C: '18', D: '20' }, correctAnswer: 'C' },
    { text: 'What is 2/5 expressed as a percentage?', options: { A: '25%', B: '30%', C: '35%', D: '40%' }, correctAnswer: 'D' },
    { text: 'If a product costs $80 after a 20% discount, what was the original price?', options: { A: '$90', B: '$96', C: '$100', D: '$110' }, correctAnswer: 'C' },
    { text: 'What is the value of 5² + 3²?', options: { A: '30', B: '32', C: '34', D: '36' }, correctAnswer: 'C' },
  ],
  logical_reasoning: [
    { text: 'All roses are flowers. Some flowers fade quickly. Which conclusion is valid?', options: { A: 'All roses fade quickly', B: 'Some roses may fade quickly', C: 'No roses fade quickly', D: 'Roses never fade' }, correctAnswer: 'B' },
    { text: 'If P implies Q, and Q is false, what can we conclude about P?', options: { A: 'P is true', B: 'P is false', C: 'P could be either', D: 'Cannot determine' }, correctAnswer: 'B' },
    { text: 'All mammals are warm-blooded. Whales are mammals. Therefore:', options: { A: 'Whales live in water', B: 'Whales are warm-blooded', C: 'All warm-blooded animals are mammals', D: 'Whales are fish' }, correctAnswer: 'B' },
    { text: 'If it is raining, then the ground is wet. The ground is not wet. What can we conclude?', options: { A: 'It is raining', B: 'It is not raining', C: 'The ground is dry', D: 'Both B and C' }, correctAnswer: 'D' },
    { text: 'No reptiles are mammals. All snakes are reptiles. Therefore:', options: { A: 'Some snakes are mammals', B: 'No snakes are mammals', C: 'All reptiles are snakes', D: 'Some mammals are snakes' }, correctAnswer: 'B' },
    { text: 'If A > B and B > C, which statement must be true?', options: { A: 'A = C', B: 'A < C', C: 'A > C', D: 'B = C' }, correctAnswer: 'C' },
  ],
  verbal_reasoning: [
    { text: 'HAPPY is to SAD as LIGHT is to:', options: { A: 'Lamp', B: 'Dark', C: 'Bright', D: 'Sun' }, correctAnswer: 'B' },
    { text: 'Choose the word most similar to "ABUNDANT":', options: { A: 'Scarce', B: 'Plentiful', C: 'Empty', D: 'Small' }, correctAnswer: 'B' },
    { text: 'ARCHITECT is to BUILDING as AUTHOR is to:', options: { A: 'Library', B: 'Book', C: 'Reader', D: 'Publisher' }, correctAnswer: 'B' },
    { text: 'Choose the word most opposite to "EXPAND":', options: { A: 'Grow', B: 'Contract', C: 'Extend', D: 'Increase' }, correctAnswer: 'B' },
    { text: 'SYMPHONY is to COMPOSER as PAINTING is to:', options: { A: 'Museum', B: 'Canvas', C: 'Artist', D: 'Gallery' }, correctAnswer: 'C' },
    { text: 'Which word is most similar to "METICULOUS"?', options: { A: 'Careless', B: 'Careful', C: 'Quick', D: 'Lazy' }, correctAnswer: 'B' },
    { text: 'HYPOTHESIS is to THEORY as SKETCH is to:', options: { A: 'Drawing', B: 'Painting', C: 'Pencil', D: 'Paper' }, correctAnswer: 'B' },
    { text: 'Choose the word most opposite to "VERBOSE":', options: { A: 'Wordy', B: 'Concise', C: 'Lengthy', D: 'Detailed' }, correctAnswer: 'B' },
  ],
  spatial_reasoning: [
    { text: 'If you rotate a square 90 degrees clockwise, which corner moves to the top?', options: { A: 'Top-left', B: 'Top-right', C: 'Bottom-left', D: 'Bottom-right' }, correctAnswer: 'C' },
    { text: 'How many faces does a cube have?', options: { A: '4', B: '6', C: '8', D: '12' }, correctAnswer: 'B' },
    { text: 'How many edges does a cube have?', options: { A: '6', B: '8', C: '10', D: '12' }, correctAnswer: 'D' },
    { text: 'If you unfold a cube, how many squares do you see?', options: { A: '4', B: '5', C: '6', D: '8' }, correctAnswer: 'C' },
    { text: 'A mirror image of the letter "b" looks like:', options: { A: 'b', B: 'd', C: 'p', D: 'q' }, correctAnswer: 'B' },
    { text: 'How many vertices does a triangular pyramid have?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B' },
  ],
  data_interpretation: [
    { text: 'A bar chart shows sales of 100, 150, 200, 250 for Jan-Apr. What is the average monthly sales?', options: { A: '150', B: '175', C: '200', D: '225' }, correctAnswer: 'B' },
    { text: 'If a pie chart shows 25% for Category A, what angle does it represent?', options: { A: '45°', B: '90°', C: '180°', D: '270°' }, correctAnswer: 'B' },
    { text: 'A line graph shows values 10, 20, 15, 25. What is the range?', options: { A: '10', B: '15', C: '20', D: '25' }, correctAnswer: 'B' },
    { text: 'If 40% of 200 students passed, how many failed?', options: { A: '80', B: '100', C: '120', D: '140' }, correctAnswer: 'C' },
    { text: 'A table shows Q1: $500, Q2: $600, Q3: $700, Q4: $800. What is the total annual revenue?', options: { A: '$2,400', B: '$2,500', C: '$2,600', D: '$2,700' }, correctAnswer: 'C' },
    { text: 'In a dataset of 5, 10, 15, 20, 25, what is the median?', options: { A: '10', B: '15', C: '17.5', D: '20' }, correctAnswer: 'B' },
  ],
  pattern_recognition: [
    { text: 'What comes next: 2, 4, 8, 16, ?', options: { A: '24', B: '32', C: '20', D: '18' }, correctAnswer: 'B' },
    { text: 'Complete the pattern: A, C, E, G, ?', options: { A: 'H', B: 'I', C: 'J', D: 'K' }, correctAnswer: 'B' },
    { text: 'What comes next: 1, 1, 2, 3, 5, 8, ?', options: { A: '11', B: '12', C: '13', D: '14' }, correctAnswer: 'C' },
    { text: 'What comes next: 3, 9, 27, 81, ?', options: { A: '162', B: '189', C: '216', D: '243' }, correctAnswer: 'D' },
    { text: 'Complete the pattern: 1, 4, 9, 16, ?', options: { A: '20', B: '23', C: '25', D: '27' }, correctAnswer: 'C' },
    { text: 'What comes next: 2, 6, 12, 20, ?', options: { A: '28', B: '30', C: '32', D: '36' }, correctAnswer: 'B' },
    { text: 'Complete the pattern: 64, 32, 16, 8, ?', options: { A: '2', B: '4', C: '6', D: '0' }, correctAnswer: 'B' },
    { text: 'What comes next: 1, 8, 27, 64, ?', options: { A: '100', B: '125', C: '150', D: '175' }, correctAnswer: 'B' },
  ],
};

function getFallbackQuestion(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  excludeTexts: Set<string> = new Set()
): Question {
  // Select appropriate fallbacks based on grade level
  // higher_secondary uses high school fallbacks (same difficulty level)
  const fallbacks = gradeLevel === 'middle_school' ? MIDDLE_SCHOOL_FALLBACKS : HIGH_SCHOOL_FALLBACKS;
  const subtagFallbacks = fallbacks[subtag] || fallbacks.numerical_reasoning;
  
  // Find a fallback that hasn't been used yet
  const availableFallbacks = subtagFallbacks.filter(f => !excludeTexts.has(f.text));
  
  let fallback;
  if (availableFallbacks.length > 0) {
    fallback = availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)];
  } else {
    // If all fallbacks for this subtag are used, try other subtags
    const allSubtags = Object.keys(fallbacks) as Subtag[];
    for (const otherSubtag of allSubtags) {
      const otherFallbacks = fallbacks[otherSubtag].filter(f => !excludeTexts.has(f.text));
      if (otherFallbacks.length > 0) {
        fallback = otherFallbacks[Math.floor(Math.random() * otherFallbacks.length)];
        break;
      }
    }
    // Last resort: use any fallback even if duplicate
    if (!fallback) {
      fallback = subtagFallbacks[Math.floor(Math.random() * subtagFallbacks.length)];
    }
  }

  return {
    id: generateQuestionId(gradeLevel, phase, difficulty, subtag),
    text: fallback.text,
    options: fallback.options,
    correctAnswer: fallback.correctAnswer,
    difficulty,
    subtag,
    gradeLevel,
    phase,
    explanation: 'Fallback question',
    createdAt: new Date().toISOString(),
  };
}


// =============================================================================
// CACHING FUNCTIONS
// =============================================================================

async function getCachedQuestions(
  env: Env,
  supabase: any,
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty?: DifficultyLevel,
  subtag?: Subtag,
  limit: number = 10,
  excludeIds: string[] = []
): Promise<Question[]> {
  console.log(`🔍 [getCachedQuestions] Querying cache:`, {
    gradeLevel,
    phase,
    difficulty,
    subtag,
    limit,
    excludeCount: excludeIds.length,
    excludeIds: excludeIds.length > 0 ? excludeIds.slice(0, 5) : [], // Log first 5 for debugging
  });

  let query = supabase
    .from('adaptive_aptitude_questions_cache')
    .select('*')
    .eq('grade_level', gradeLevel)
    .eq('phase', phase)
    .eq('is_active', true);

  if (difficulty !== undefined) {
    query = query.eq('difficulty', difficulty);
  }

  if (subtag !== undefined) {
    query = query.eq('subtag', subtag);
  }

  // Fix: Use correct Supabase PostgREST NOT IN syntax with quoted IDs
  if (excludeIds.length > 0) {
    console.log(`🔒 [getCachedQuestions] Excluding ${excludeIds.length} question IDs from cache query`);
    query = query.not('question_id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
  }

  query = query.order('usage_count', { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getCachedQuestions] Error fetching cached questions:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return [];
  }

  if (!data || data.length === 0) {
    console.log('📭 [getCachedQuestions] No cached questions found');
    return [];
  }

  console.log(`✅ [getCachedQuestions] Found ${data.length} cached questions from database`);

  const questions = data.map((record: any) => ({
    id: record.question_id,
    text: record.text,
    options: record.options as Question['options'],
    correctAnswer: record.correct_answer as Question['correctAnswer'],
    difficulty: record.difficulty as DifficultyLevel,
    subtag: record.subtag as Subtag,
    gradeLevel: record.grade_level as GradeLevel,
    phase: record.phase as TestPhase,
    explanation: record.explanation || undefined,
    createdAt: record.created_at,
  }));

  // Post-query validation: Filter out any questions that are in the exclusion list
  const questionsBeforeValidation = questions.length;
  const validQuestions = questions.filter((q: Question) => !excludeIds.includes(q.id));
  
  if (validQuestions.length < questionsBeforeValidation) {
    console.warn(`⚠️ [getCachedQuestions] Filtered out ${questionsBeforeValidation - validQuestions.length} questions that were in exclusion list despite NOT IN clause`);
    console.warn(`⚠️ [getCachedQuestions] Excluded question IDs that were returned:`, 
      questions.filter((q: Question) => excludeIds.includes(q.id)).map((q: Question) => q.id)
    );
  }

  console.log(`✅ [getCachedQuestions] Returning ${validQuestions.length} validated questions (before: ${questionsBeforeValidation})`);
  console.log(`📋 [getCachedQuestions] Question IDs:`, validQuestions.map((q: Question) => q.id));

  // Track usage for returned questions
  if (validQuestions.length > 0) {
    const questionIds = validQuestions.map((q: Question) => q.id);
    console.log(`📊 [getCachedQuestions] Triggering usage tracking for ${questionIds.length} questions`);
    trackQuestionUsage(env, questionIds).catch((err: any) => 
      console.warn('⚠️ [getCachedQuestions] Failed to track question usage:', err)
    );
  }

  return validQuestions;
}

async function trackQuestionUsage(
  env: Env,
  questionIds: string[]
): Promise<void> {
  if (questionIds.length === 0) return;

  console.log(`📊 [trackQuestionUsage] Tracking usage for ${questionIds.length} cached questions...`);
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  console.log(`🔑 [trackQuestionUsage] Service role key available: ${!!serviceKey}`);

  // Use write client to update usage statistics
  const writeClient = getWriteClient(env);

  // Update each question individually
  // We need to increment usage_count and update last_used_at
  const updatePromises = questionIds.map(async (questionId, index) => {
    console.log(`📝 [trackQuestionUsage] Processing question ${index + 1}/${questionIds.length}: ${questionId}`);
    
    // First, get the current usage_count
    const { data: currentData, error: fetchError } = await writeClient
      .from('adaptive_aptitude_questions_cache')
      .select('usage_count')
      .eq('question_id', questionId)
      .single();

    if (fetchError || !currentData) {
      console.error(`❌ [trackQuestionUsage] Failed to fetch current usage for question ${questionId}:`, {
        message: fetchError?.message,
        details: fetchError?.details,
        hint: fetchError?.hint,
        code: fetchError?.code,
      });
      return;
    }

    console.log(`📈 [trackQuestionUsage] Current usage_count for ${questionId}: ${(currentData as any).usage_count}`);

    // Then update with incremented value
    const updateData = {
      usage_count: ((currentData as any).usage_count || 0) + 1,
      last_used_at: new Date().toISOString()
    };
    
    console.log(`💾 [trackQuestionUsage] Updating ${questionId} with:`, updateData);
    
    const { error: updateError } = await (writeClient
      .from('adaptive_aptitude_questions_cache') as any)
      .update(updateData)
      .eq('question_id', questionId);

    if (updateError) {
      console.error(`❌ [trackQuestionUsage] Failed to update usage for question ${questionId}:`, {
        message: updateError?.message,
        details: updateError?.details,
        hint: updateError?.hint,
        code: updateError?.code,
      });
    } else {
      console.log(`✅ [trackQuestionUsage] Successfully updated usage for ${questionId}`);
    }
  });

  await Promise.all(updatePromises);
  console.log(`✅ [trackQuestionUsage] Completed tracking usage for ${questionIds.length} questions`);
}

async function cacheQuestions(
  env: Env,
  questions: Question[]
): Promise<void> {
  if (questions.length === 0) {
    console.log('⚠️ [cacheQuestions] No questions to cache (empty array)');
    return;
  }

  try {
    console.log(`💾 [cacheQuestions] Starting cache operation for ${questions.length} questions`);
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
    console.log(`🔑 [cacheQuestions] Service role key available: ${!!serviceKey}`);

    const writeClient = getWriteClient(env);

    const records = questions.map((q) => ({
      question_id: q.id,
      text: q.text,
      options: q.options,
      correct_answer: q.correctAnswer,
      difficulty: q.difficulty,
      subtag: q.subtag,
      grade_level: q.gradeLevel,
      phase: q.phase,
      explanation: q.explanation || null,
    }));

    console.log(`📝 [cacheQuestions] Sample record to cache:`, {
      question_id: records[0].question_id,
      text: records[0].text.substring(0, 50) + '...',
      difficulty: records[0].difficulty,
      subtag: records[0].subtag,
      grade_level: records[0].grade_level,
      phase: records[0].phase,
    });

    console.log(`💾 [cacheQuestions] Attempting upsert to adaptive_aptitude_questions_cache...`);
    console.log(`📝 [cacheQuestions] About to call writeClient.from().upsert()`);

    // Add timeout to prevent hanging
    const upsertPromise = writeClient
      .from('adaptive_aptitude_questions_cache')
      .upsert(records as any, { onConflict: 'question_id' });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upsert timeout after 10 seconds')), 10000)
    );

    const { data, error } = await Promise.race([upsertPromise, timeoutPromise]) as any;

    console.log(`📡 [cacheQuestions] Upsert completed. Error:`, error ? 'YES' : 'NO');
    console.log(`📡 [cacheQuestions] Upsert completed. Data:`, data ? 'YES' : 'NO');

    if (error) {
      console.error('❌ [cacheQuestions] Error caching questions:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      console.error('❌ [cacheQuestions] Full error object:', JSON.stringify(error));
      throw error; // Re-throw to be caught by outer catch
    } else {
      console.log(`✅ [cacheQuestions] Successfully cached ${records.length} questions`);
      console.log(`📊 [cacheQuestions] Upsert response data:`, JSON.stringify(data));
    }
  } catch (err) {
    console.error('❌ [cacheQuestions] Unexpected error during caching:', err);
    // Don't re-throw - we don't want to break the main flow
  }
}

// =============================================================================
// QUESTION GENERATION LOGIC
// =============================================================================

function selectSubtagsForScreener(totalQuestions: number, minSubtags: number): Subtag[] {
  const shuffled = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  const selected: Subtag[] = [];
  
  for (let i = 0; i < Math.min(minSubtags, shuffled.length); i++) {
    selected.push(shuffled[i]);
  }
  
  while (selected.length < totalQuestions) {
    const nextSubtag = shuffled[selected.length % shuffled.length];
    selected.push(nextSubtag);
  }
  
  return selected;
}

function reorderToPreventConsecutiveSubtags(
  questions: Question[],
  maxConsecutive: number
): Question[] {
  if (questions.length <= 1) return questions;

  const result: Question[] = [];
  const remaining = [...questions];

  while (remaining.length > 0) {
    let consecutiveCount = 0;
    let lastSubtag: Subtag | null = null;
    
    for (let i = result.length - 1; i >= 0 && i >= result.length - maxConsecutive; i--) {
      if (lastSubtag === null) {
        lastSubtag = result[i].subtag;
        consecutiveCount = 1;
      } else if (result[i].subtag === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    let selectedIndex = 0;
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const differentIndex = remaining.findIndex((q) => q.subtag !== lastSubtag);
      if (differentIndex !== -1) {
        selectedIndex = differentIndex;
      }
    }

    result.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }

  return result;
}

async function generateDiagnosticScreenerQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 generateDiagnosticScreenerQuestions:', { gradeLevel, excludeCount: excludeQuestionIds.length, excludeTextsCount: excludeQuestionTexts.length });
  const startTime = Date.now();
  
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const phase: TestPhase = 'diagnostic_screener';
  const selectedSubtags = selectSubtagsForScreener(8, 4);
  
  // Phase 1: ALL 8 questions at Level 3 (baseline) for tier classification
  const questionSpecs: { difficulty: DifficultyLevel; subtag: Subtag }[] = [
    { difficulty: 3, subtag: selectedSubtags[0] },
    { difficulty: 3, subtag: selectedSubtags[1] },
    { difficulty: 3, subtag: selectedSubtags[2] },
    { difficulty: 3, subtag: selectedSubtags[3] },
    { difficulty: 3, subtag: selectedSubtags[4] },
    { difficulty: 3, subtag: selectedSubtags[5] },
    { difficulty: 3, subtag: selectedSubtags[6] },
    { difficulty: 3, subtag: selectedSubtags[7] },
  ];

  // Track all used question IDs to prevent duplicates within this batch
  const usedQuestionIds = new Set<string>(excludeQuestionIds);
  
  const allQuestions: (Question | undefined)[] = new Array(8);
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  // Sequential cache lookups to prevent duplicates within the same batch
  console.log('📦 Checking cache sequentially to prevent duplicates...');
  for (let index = 0; index < questionSpecs.length; index++) {
    const spec = questionSpecs[index];
    const cached = await getCachedQuestions(
      env, supabase, gradeLevel, phase, spec.difficulty, spec.subtag, 5, Array.from(usedQuestionIds)
    );
    
    if (cached.length > 0) {
      // Find first question not already used
      const uniqueQuestion = cached.find(q => !usedQuestionIds.has(q.id));
      if (uniqueQuestion) {
        allQuestions[index] = uniqueQuestion;
        usedQuestionIds.add(uniqueQuestion.id);
        cachedCount++;
      } else {
        missingSpecs.push({ ...spec, index });
      }
    } else {
      missingSpecs.push({ ...spec, index });
    }
  }

  console.log(`📊 Cache hit: ${cachedCount}/6, need to generate: ${missingSpecs.length}`);

  let generatedCount = 0;

  // Generate missing questions
  if (missingSpecs.length > 0) {
    try {
      const batchGenerated = await generateQuestionsWithAI(
        apiKey,
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        phase
      );
      
      batchGenerated.forEach((question, i) => {
        if (question && missingSpecs[i] && !usedQuestionIds.has(question.id)) {
          allQuestions[missingSpecs[i].index] = question;
          usedQuestionIds.add(question.id);
          generatedCount++;
        }
      });
      
      // Cache synchronously to ensure it completes
      if (batchGenerated.length > 0) {
        console.log('💾 [generateDiagnosticScreenerQuestions] Caching questions synchronously...');
        try {
          await cacheQuestions(env, batchGenerated);
          console.log('✅ [generateDiagnosticScreenerQuestions] Caching completed successfully');
        } catch (err) {
          console.error('❌ [generateDiagnosticScreenerQuestions] Caching failed:', err);
        }
      }
    } catch (genError) {
      console.error('❌ Batch generation failed:', genError);
    }
  }

  // Fallback for any still missing - use unique fallbacks
  const usedFallbackTexts = new Set<string>(excludeQuestionTexts || []);
  // Also add texts from questions we already have
  allQuestions.forEach(q => { if (q) usedFallbackTexts.add(q.text); });
  
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      const fallback = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag, usedFallbackTexts);
      usedFallbackTexts.add(fallback.text);
      allQuestions[i] = fallback;
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as Question[];
  const orderedQuestions = reorderToPreventConsecutiveSubtags(validQuestions, 1);

  const elapsed = Date.now() - startTime;
  console.log(`✅ Generated ${orderedQuestions.length} unique questions in ${elapsed}ms`);

  return {
    questions: orderedQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}


// =============================================================================
// ADAPTIVE CORE GENERATION
// =============================================================================

function generateDifficultyRange(
  startingDifficulty: DifficultyLevel,
  count: number
): DifficultyLevel[] {
  const difficulties: DifficultyLevel[] = [startingDifficulty];
  let consecutiveSameDirection = 0;
  let lastDirection: 'up' | 'down' | null = null;

  for (let i = 1; i < count; i++) {
    const current = difficulties[i - 1];
    const canGoUp = current < 5;
    const canGoDown = current > 1;
    const mustChangeDirection = consecutiveSameDirection >= 2;
    
    let nextDifficulty: DifficultyLevel;
    
    if (mustChangeDirection) {
      if (lastDirection === 'up' && canGoDown) {
        nextDifficulty = (current - 1) as DifficultyLevel;
        lastDirection = 'down';
        consecutiveSameDirection = 1;
      } else if (lastDirection === 'down' && canGoUp) {
        nextDifficulty = (current + 1) as DifficultyLevel;
        lastDirection = 'up';
        consecutiveSameDirection = 1;
      } else {
        nextDifficulty = current;
        consecutiveSameDirection = 0;
        lastDirection = null;
      }
    } else {
      const random = Math.random();
      
      if (random < 0.4 && canGoUp) {
        nextDifficulty = (current + 1) as DifficultyLevel;
        if (lastDirection === 'up') {
          consecutiveSameDirection++;
        } else {
          lastDirection = 'up';
          consecutiveSameDirection = 1;
        }
      } else if (random < 0.8 && canGoDown) {
        nextDifficulty = (current - 1) as DifficultyLevel;
        if (lastDirection === 'down') {
          consecutiveSameDirection++;
        } else {
          lastDirection = 'down';
          consecutiveSameDirection = 1;
        }
      } else {
        nextDifficulty = current;
        consecutiveSameDirection = 0;
        lastDirection = null;
      }
    }
    
    difficulties.push(nextDifficulty);
  }

  return difficulties;
}

function generateBalancedSubtagSequence(count: number, maxConsecutive: number): Subtag[] {
  const sequence: Subtag[] = [];
  const shuffledSubtags = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    let consecutiveCount = 0;
    let lastSubtag: Subtag | null = null;
    
    for (let j = sequence.length - 1; j >= 0 && j >= sequence.length - maxConsecutive; j--) {
      if (lastSubtag === null) {
        lastSubtag = sequence[j];
        consecutiveCount = 1;
      } else if (sequence[j] === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    let selectedSubtag: Subtag;
    
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const available = shuffledSubtags.filter((s) => s !== lastSubtag);
      selectedSubtag = available[i % available.length];
    } else {
      selectedSubtag = shuffledSubtags[i % shuffledSubtags.length];
    }
    
    sequence.push(selectedSubtag);
  }

  return sequence;
}

async function generateAdaptiveCoreQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  startingDifficulty: DifficultyLevel,
  count: number = 10,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 generateAdaptiveCoreQuestions:', { gradeLevel, startingDifficulty, count, excludeCount: excludeQuestionIds.length, excludeTextsCount: excludeQuestionTexts.length });
  const startTime = Date.now();
  
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const phase: TestPhase = 'adaptive_core';
  // Phase 2: 11 adaptive questions (Q7-Q17)
  const questionCount = 11;

  const difficultyRange = generateDifficultyRange(startingDifficulty, questionCount);
  const subtagSequence = generateBalancedSubtagSequence(questionCount, 2);
  
  const questionSpecs = difficultyRange.map((difficulty, i) => ({
    difficulty,
    subtag: subtagSequence[i],
  }));

  // Track all used question IDs and texts to prevent duplicates within this batch
  const usedQuestionIds = new Set<string>(excludeQuestionIds);
  const usedQuestionTexts = new Set<string>(excludeQuestionTexts);
  
  const allQuestions: (Question | undefined)[] = new Array(questionCount);
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  // Sequential cache lookups to prevent duplicates
  console.log('📦 Checking cache sequentially to prevent duplicates...');
  for (let index = 0; index < questionSpecs.length; index++) {
    const spec = questionSpecs[index];
    const cached = await getCachedQuestions(
      env, supabase, gradeLevel, phase, spec.difficulty, spec.subtag, 5, Array.from(usedQuestionIds)
    );
    
    if (cached.length > 0) {
      // Find first question not already used (by ID or text)
      const uniqueQuestion = cached.find(q => !usedQuestionIds.has(q.id) && !usedQuestionTexts.has(q.text));
      if (uniqueQuestion) {
        allQuestions[index] = uniqueQuestion;
        usedQuestionIds.add(uniqueQuestion.id);
        usedQuestionTexts.add(uniqueQuestion.text);
        cachedCount++;
      } else {
        missingSpecs.push({ ...spec, index });
      }
    } else {
      missingSpecs.push({ ...spec, index });
    }
  }

  let generatedCount = 0;

  if (missingSpecs.length > 0) {
    try {
      const batchGenerated = await generateQuestionsWithAI(
        apiKey,
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        phase
      );
      
      batchGenerated.forEach((question, i) => {
        if (question && missingSpecs[i] && !usedQuestionIds.has(question.id) && !usedQuestionTexts.has(question.text)) {
          allQuestions[missingSpecs[i].index] = question;
          usedQuestionIds.add(question.id);
          usedQuestionTexts.add(question.text);
          generatedCount++;
        }
      });
      
      // Cache synchronously to ensure it completes
      if (batchGenerated.length > 0) {
        console.log('💾 [generateAdaptiveCoreQuestions] Caching questions synchronously...');
        try {
          await cacheQuestions(env, batchGenerated);
          console.log('✅ [generateAdaptiveCoreQuestions] Caching completed successfully');
        } catch (err) {
          console.error('❌ [generateAdaptiveCoreQuestions] Caching failed:', err);
        }
      }
    } catch (genError) {
      console.error('❌ Batch generation failed:', genError);
    }
  }

  // Fallback for any still missing - use unique fallbacks
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      const fallback = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag, usedQuestionTexts);
      usedQuestionTexts.add(fallback.text);
      allQuestions[i] = fallback;
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as Question[];

  const elapsed = Date.now() - startTime;
  console.log(`✅ Generated ${validQuestions.length} unique questions in ${elapsed}ms`);

  return {
    questions: validQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}


// =============================================================================
// STABILITY CONFIRMATION GENERATION
// =============================================================================

function generateStabilityDifficulties(
  provisionalBand: DifficultyLevel,
  count: number
): DifficultyLevel[] {
  const difficulties: DifficultyLevel[] = [];
  const minDifficulty = Math.max(1, provisionalBand - 1) as DifficultyLevel;
  const maxDifficulty = Math.min(5, provisionalBand + 1) as DifficultyLevel;
  const hasBoundaryItem = { lower: false, upper: false };
  
  for (let i = 0; i < count; i++) {
    let difficulty: DifficultyLevel;
    
    if (i === 0) {
      difficulty = provisionalBand;
    } else if (i === 1 && !hasBoundaryItem.lower && minDifficulty < provisionalBand) {
      difficulty = minDifficulty;
      hasBoundaryItem.lower = true;
    } else if (i === 2 && !hasBoundaryItem.upper && maxDifficulty > provisionalBand) {
      difficulty = maxDifficulty;
      hasBoundaryItem.upper = true;
    } else {
      const range = [minDifficulty, provisionalBand, maxDifficulty].filter(
        (d, idx, arr) => arr.indexOf(d) === idx
      );
      difficulty = range[Math.floor(Math.random() * range.length)];
    }
    
    difficulties.push(difficulty);
  }

  return difficulties;
}

function generateMixedFormatSubtags(count: number, maxConsecutive: number): Subtag[] {
  const dataFormats: Subtag[] = ['data_interpretation', 'pattern_recognition'];
  const logicFormats: Subtag[] = ['logical_reasoning', 'numerical_reasoning', 'verbal_reasoning', 'spatial_reasoning'];
  
  const sequence: Subtag[] = [];
  let useDataFormat = true;
  
  for (let i = 0; i < count; i++) {
    let consecutiveCount = 0;
    let lastSubtag: Subtag | null = null;
    
    for (let j = sequence.length - 1; j >= 0 && j >= sequence.length - maxConsecutive; j--) {
      if (lastSubtag === null) {
        lastSubtag = sequence[j];
        consecutiveCount = 1;
      } else if (sequence[j] === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    const pool = useDataFormat ? dataFormats : logicFormats;
    let selectedSubtag: Subtag;
    
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const available = pool.filter((s) => s !== lastSubtag);
      if (available.length > 0) {
        selectedSubtag = available[Math.floor(Math.random() * available.length)];
      } else {
        const otherPool = useDataFormat ? logicFormats : dataFormats;
        selectedSubtag = otherPool[Math.floor(Math.random() * otherPool.length)];
      }
    } else {
      selectedSubtag = pool[Math.floor(Math.random() * pool.length)];
    }
    
    sequence.push(selectedSubtag);
    useDataFormat = !useDataFormat;
  }

  return sequence;
}

async function generateStabilityConfirmationQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  provisionalBand: DifficultyLevel,
  count: number = 4,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 generateStabilityConfirmationQuestions:', { gradeLevel, provisionalBand, count, excludeCount: excludeQuestionIds.length, excludeTextsCount: excludeQuestionTexts.length });
  const startTime = Date.now();
  
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const phase: TestPhase = 'stability_confirmation';
  const questionCount = Math.min(Math.max(count, 4), 6);

  const difficulties = generateStabilityDifficulties(provisionalBand, questionCount);
  const subtags = generateMixedFormatSubtags(questionCount, 2);
  
  const questionSpecs = difficulties.map((difficulty, i) => ({
    difficulty,
    subtag: subtags[i],
  }));

  // Track all used question IDs and texts to prevent duplicates within this batch
  const usedQuestionIds = new Set<string>(excludeQuestionIds);
  const usedQuestionTexts = new Set<string>(excludeQuestionTexts);
  
  const allQuestions: (Question | undefined)[] = new Array(questionCount);
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  // Sequential cache lookups to prevent duplicates
  console.log('📦 Checking cache sequentially to prevent duplicates...');
  for (let index = 0; index < questionSpecs.length; index++) {
    const spec = questionSpecs[index];
    const cached = await getCachedQuestions(
      env, supabase, gradeLevel, phase, spec.difficulty, spec.subtag, 5, Array.from(usedQuestionIds)
    );
    
    if (cached.length > 0) {
      // Find first question not already used (by ID or text)
      const uniqueQuestion = cached.find(q => !usedQuestionIds.has(q.id) && !usedQuestionTexts.has(q.text));
      if (uniqueQuestion) {
        allQuestions[index] = uniqueQuestion;
        usedQuestionIds.add(uniqueQuestion.id);
        usedQuestionTexts.add(uniqueQuestion.text);
        cachedCount++;
      } else {
        missingSpecs.push({ ...spec, index });
      }
    } else {
      missingSpecs.push({ ...spec, index });
    }
  }

  let generatedCount = 0;

  if (missingSpecs.length > 0) {
    try {
      const batchGenerated = await generateQuestionsWithAI(
        apiKey,
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        phase
      );
      
      batchGenerated.forEach((question, i) => {
        if (question && missingSpecs[i] && !usedQuestionIds.has(question.id) && !usedQuestionTexts.has(question.text)) {
          allQuestions[missingSpecs[i].index] = question;
          usedQuestionIds.add(question.id);
          usedQuestionTexts.add(question.text);
          generatedCount++;
        }
      });
      
      // Cache synchronously to ensure it completes
      if (batchGenerated.length > 0) {
        console.log('💾 [generateStabilityConfirmationQuestions] Caching questions synchronously...');
        try {
          await cacheQuestions(env, batchGenerated);
          console.log('✅ [generateStabilityConfirmationQuestions] Caching completed successfully');
        } catch (err) {
          console.error('❌ [generateStabilityConfirmationQuestions] Caching failed:', err);
        }
      }
    } catch (genError) {
      console.error('❌ Batch generation failed:', genError);
    }
  }

  // Fallback for any still missing - use unique fallbacks
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      const fallback = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag, usedQuestionTexts);
      usedQuestionTexts.add(fallback.text);
      allQuestions[i] = fallback;
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as Question[];

  const elapsed = Date.now() - startTime;
  console.log(`✅ Generated ${validQuestions.length} unique questions in ${elapsed}ms`);

  return {
    questions: validQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}


// =============================================================================
// MAIN HANDLER
// =============================================================================

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
      return jsonResponse({ 
        status: 'ok', 
        service: 'adaptive-aptitude-api',
        timestamp: new Date().toISOString() 
      });
    }

    // Generate diagnostic screener questions
    if ((path === '/generate/diagnostic' || path === '/api/generate/diagnostic') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

        if (!gradeLevel || !['middle_school', 'high_school', 'higher_secondary'].includes(gradeLevel)) {
          return jsonResponse({ error: 'Valid gradeLevel is required (middle_school, high_school, or higher_secondary)' }, 400);
        }

        const result = await generateDiagnosticScreenerQuestions(env, gradeLevel, excludeQuestionIds, excludeQuestionTexts);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Error generating diagnostic questions:', error);
        return jsonResponse({ error: error.message || 'Failed to generate questions' }, 500);
      }
    }

    // Generate adaptive core questions
    if ((path === '/generate/adaptive' || path === '/api/generate/adaptive') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, startingDifficulty = 3, count = 10, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

        if (!gradeLevel || !['middle_school', 'high_school'].includes(gradeLevel)) {
          return jsonResponse({ error: 'Valid gradeLevel is required (middle_school or high_school)' }, 400);
        }

        const result = await generateAdaptiveCoreQuestions(
          env, 
          gradeLevel, 
          startingDifficulty as DifficultyLevel, 
          count, 
          excludeQuestionIds,
          excludeQuestionTexts
        );
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Error generating adaptive questions:', error);
        return jsonResponse({ error: error.message || 'Failed to generate questions' }, 500);
      }
    }

    // Generate stability confirmation questions
    if ((path === '/generate/stability' || path === '/api/generate/stability') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, provisionalBand = 3, count = 4, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

        if (!gradeLevel || !['middle_school', 'high_school'].includes(gradeLevel)) {
          return jsonResponse({ error: 'Valid gradeLevel is required (middle_school or high_school)' }, 400);
        }

        const result = await generateStabilityConfirmationQuestions(
          env, 
          gradeLevel, 
          provisionalBand as DifficultyLevel, 
          count, 
          excludeQuestionIds,
          excludeQuestionTexts
        );
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Error generating stability questions:', error);
        return jsonResponse({ error: error.message || 'Failed to generate questions' }, 500);
      }
    }

    // Generic generate endpoint
    if ((path === '/generate' || path === '/api/generate') && request.method === 'POST') {
      try {
        const body = await request.json() as QuestionGenerationOptions;
        const { gradeLevel, phase, difficulty, subtag, count = 1, excludeQuestionIds = [] } = body;

        if (!gradeLevel || !['middle_school', 'high_school'].includes(gradeLevel)) {
          return jsonResponse({ error: 'Valid gradeLevel is required' }, 400);
        }

        if (!phase || !['diagnostic_screener', 'adaptive_core', 'stability_confirmation'].includes(phase)) {
          return jsonResponse({ error: 'Valid phase is required' }, 400);
        }

        let result: QuestionGenerationResult;

        switch (phase) {
          case 'diagnostic_screener':
            result = await generateDiagnosticScreenerQuestions(env, gradeLevel, excludeQuestionIds);
            break;
          case 'adaptive_core':
            result = await generateAdaptiveCoreQuestions(
              env, 
              gradeLevel, 
              difficulty || 3, 
              count, 
              excludeQuestionIds
            );
            break;
          case 'stability_confirmation':
            result = await generateStabilityConfirmationQuestions(
              env, 
              gradeLevel, 
              difficulty || 3, 
              count, 
              excludeQuestionIds
            );
            break;
          default:
            return jsonResponse({ error: 'Invalid phase' }, 400);
        }

        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Error generating questions:', error);
        return jsonResponse({ error: error.message || 'Failed to generate questions' }, 500);
      }
    }

    // Single question generation (for adaptive core dynamic generation)
    if ((path === '/generate/single' || path === '/api/generate/single') && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, phase, difficulty, subtag, excludeQuestionIds = [] } = body;

        if (!gradeLevel || !difficulty || !subtag) {
          return jsonResponse({ error: 'gradeLevel, difficulty, and subtag are required' }, 400);
        }

        const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
        if (!apiKey) {
          return jsonResponse({ error: 'API key not configured' }, 500);
        }

        const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

        // Try cache first
        const cached = await getCachedQuestions(
          env,
          supabase,
          gradeLevel,
          phase || 'adaptive_core',
          difficulty,
          subtag,
          1,
          excludeQuestionIds
        );

        if (cached.length > 0) {
          return jsonResponse({
            questions: cached,
            fromCache: true,
            generatedCount: 0,
            cachedCount: 1,
          });
        }

        // Generate new question
        const generated = await generateQuestionsWithAI(
          apiKey,
          [{ difficulty, subtag }],
          gradeLevel,
          phase || 'adaptive_core'
        );

        // Cache synchronously to ensure it completes
        if (generated.length > 0) {
          console.log('💾 [/generate/single] Caching question synchronously...');
          try {
            await cacheQuestions(env, generated);
            console.log('✅ [/generate/single] Caching completed successfully');
          } catch (err) {
            console.error('❌ [/generate/single] Caching failed:', err);
          }
        }

        return jsonResponse({
          questions: generated,
          fromCache: false,
          generatedCount: generated.length,
          cachedCount: 0,
        });
      } catch (error: any) {
        console.error('❌ Error generating single question:', error);
        return jsonResponse({ error: error.message || 'Failed to generate question' }, 500);
      }
    }

    // 404 for unknown routes
    return jsonResponse({ error: 'Not found', path }, 404);
  },
};

