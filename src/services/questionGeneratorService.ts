/**
 * Question Generator Service
 * 
 * Generates adaptive aptitude test questions using AI (OpenRouter/Claude).
 * Handles question generation for all test phases with caching support.
 * 
 * Requirements: 4.1, 4.2, 1.4, 6.1, 2.5, 6.2, 3.1, 3.2, 7.1
 */

import OpenAI from 'openai';
import { supabase } from '../lib/supabaseClient';
import {
  Question,
  GradeLevel,
  TestPhase,
  DifficultyLevel,
  Subtag,
  ALL_SUBTAGS,
  DEFAULT_ADAPTIVE_TEST_CONFIG,
} from '../types/adaptiveAptitude';

// =============================================================================
// OPENAI CLIENT SETUP
// =============================================================================

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
    'X-Title': 'Adaptive Aptitude Test Generator',
  },
});

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for generating questions
 */
export interface QuestionGenerationOptions {
  gradeLevel: GradeLevel;
  phase: TestPhase;
  difficulty?: DifficultyLevel;
  subtag?: Subtag;
  count?: number;
  excludeQuestionIds?: string[];
}


/**
 * Result of question generation
 */
export interface QuestionGenerationResult {
  questions: Question[];
  fromCache: boolean;
  generatedCount: number;
  cachedCount: number;
}

/**
 * Raw question from AI response
 */
interface RawAIQuestion {
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

const GRADE_LEVEL_CONTEXT: Record<GradeLevel, string> = {
  middle_school: `You are creating aptitude test questions for middle school students (grades 6-8, ages 11-14).
- Use age-appropriate vocabulary and concepts
- Questions should be challenging but accessible
- Use relatable scenarios (school, sports, hobbies, everyday life)
- Avoid complex technical jargon
- Mathematical concepts should be at pre-algebra to basic algebra level`,

  high_school: `You are creating aptitude test questions for high school students (grades 9-12, ages 14-18).
- Use more sophisticated vocabulary and concepts
- Questions can involve more complex reasoning
- Use scenarios relevant to teenagers (academics, career planning, technology)
- Mathematical concepts can include algebra, basic statistics, and logical reasoning
- Include more abstract thinking challenges`,
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


// =============================================================================
// AI QUESTION GENERATION
// =============================================================================

/**
 * Builds the system prompt for question generation
 */
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

/**
 * Builds the user prompt for generating questions
 */
function buildUserPrompt(
  count: number,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  gradeLevel: GradeLevel
): string {
  return `Generate exactly ${count} multiple-choice aptitude test question(s) with the following specifications:

DIFFICULTY LEVEL: ${difficulty} - ${DIFFICULTY_DESCRIPTIONS[difficulty]}
QUESTION TYPE: ${subtag.replace(/_/g, ' ').toUpperCase()}
DESCRIPTION: ${SUBTAG_DESCRIPTIONS[subtag]}
GRADE LEVEL: ${gradeLevel.replace('_', ' ')}

Requirements:
- Generate exactly ${count} question(s)
- All questions must be at difficulty level ${difficulty}
- All questions must test ${subtag.replace(/_/g, ' ')}
- Each question must have 4 options (A, B, C, D) with exactly one correct answer
- Include a brief explanation for each correct answer

Return ONLY a valid JSON array, no additional text.`;
}


/**
 * Generates a unique question ID
 */
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

/**
 * Parses AI response to extract questions
 */
function parseAIResponse(content: string): RawAIQuestion[] {
  // Try to extract JSON array from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON array from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not an array');
  }

  // Validate each question
  return parsed.map((q, index) => {
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

/**
 * Generates questions using AI
 * Requirements: 4.1, 4.2
 */
async function generateQuestionsWithAI(
  count: number,
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag
): Promise<Question[]> {
  console.log('🤖 [QuestionGeneratorService] generateQuestionsWithAI called:', { count, gradeLevel, phase, difficulty, subtag });
  
  // Validate API key
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ [QuestionGeneratorService] API key not configured!');
    throw new Error('API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }
  console.log('🔑 [QuestionGeneratorService] API key found:', apiKey.substring(0, 10) + '...');

  const systemPrompt = buildSystemPrompt(gradeLevel);
  const userPrompt = buildUserPrompt(count, difficulty, subtag, gradeLevel);
  
  console.log('📡 [QuestionGeneratorService] Calling OpenRouter API...');

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    
    console.log('✅ [QuestionGeneratorService] API response received');

    const responseContent = completion.choices[0]?.message?.content || '';
    
    if (!responseContent) {
      console.error('❌ [QuestionGeneratorService] Empty response from AI');
      throw new Error('Empty response from AI');
    }
    
    console.log('📝 [QuestionGeneratorService] Parsing AI response...');
    const rawQuestions = parseAIResponse(responseContent);
    console.log('✅ [QuestionGeneratorService] Parsed', rawQuestions.length, 'questions');

    // Convert to Question objects
    return rawQuestions.map((raw) => ({
      id: generateQuestionId(gradeLevel, phase, difficulty, subtag),
      text: raw.text,
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      difficulty,
      subtag,
      gradeLevel,
      phase,
      explanation: raw.explanation,
      createdAt: new Date().toISOString(),
    }));
  } catch (apiError) {
    console.error('❌ [QuestionGeneratorService] API call failed:', apiError);
    throw apiError;
  }
}


// =============================================================================
// CACHING FUNCTIONS
// =============================================================================

/**
 * Retrieves cached questions from the database
 * Requirements: 7.1
 */
async function getCachedQuestions(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty?: DifficultyLevel,
  subtag?: Subtag,
  limit: number = 10,
  excludeIds: string[] = []
): Promise<Question[]> {
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

  if (excludeIds.length > 0) {
    query = query.not('question_id', 'in', `(${excludeIds.join(',')})`);
  }

  // Order by usage count (least used first) and random
  query = query.order('usage_count', { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cached questions:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Convert database records to Question objects
  return data.map((record) => ({
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
}

/**
 * Saves questions to the cache
 * Requirements: 7.1
 */
async function cacheQuestions(questions: Question[]): Promise<void> {
  if (questions.length === 0) return;

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

  const { error } = await supabase
    .from('adaptive_aptitude_questions_cache')
    .upsert(records, { onConflict: 'question_id' });

  if (error) {
    console.error('Error caching questions:', error);
  }
}

/**
 * Updates usage count for questions
 */
async function updateQuestionUsage(questionIds: string[]): Promise<void> {
  for (const questionId of questionIds) {
    await supabase.rpc('update_question_usage', { p_question_id: questionId });
  }
}


// =============================================================================
// DIAGNOSTIC SCREENER GENERATION
// =============================================================================

/**
 * Generates questions for the Diagnostic Screener phase - OPTIMIZED VERSION
 * Requirements: 1.4, 6.1
 * 
 * OPTIMIZATIONS:
 * - Parallel cache lookups for all questions at once
 * - Batch AI generation (all missing questions in single API call)
 * - Fallback questions for instant loading when cache/API unavailable
 * 
 * - Generates 6 questions: 2 Easy (1-2), 2 Medium (3), 2 Hard (4-5)
 * - Ensures at least 3 different subtags
 * - Prevents consecutive same-subtag questions
 */
export async function generateDiagnosticScreenerQuestions(
  gradeLevel: GradeLevel,
  excludeQuestionIds: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateDiagnosticScreenerQuestions called:', { gradeLevel });
  const startTime = Date.now();
  
  const phase: TestPhase = 'diagnostic_screener';
  const config = DEFAULT_ADAPTIVE_TEST_CONFIG.phases.diagnostic_screener;
  
  // Define what questions we need: difficulty + subtag combinations
  const selectedSubtags = selectSubtagsForScreener(6, config.minSubtags || 3);
  const questionSpecs: { difficulty: DifficultyLevel; subtag: Subtag }[] = [
    { difficulty: 2, subtag: selectedSubtags[0] },
    { difficulty: 2, subtag: selectedSubtags[1] },
    { difficulty: 3, subtag: selectedSubtags[2] },
    { difficulty: 3, subtag: selectedSubtags[3] },
    { difficulty: 4, subtag: selectedSubtags[4] },
    { difficulty: 4, subtag: selectedSubtags[5] },
  ];

  // OPTIMIZATION 1: Parallel cache lookups for all questions at once
  console.log('📦 [QuestionGeneratorService] Checking cache in parallel...');
  const cachePromises = questionSpecs.map(spec => 
    getCachedQuestions(gradeLevel, phase, spec.difficulty, spec.subtag, 1, excludeQuestionIds)
  );
  const cacheResults = await Promise.all(cachePromises);
  
  const allQuestions: Question[] = [];
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  // Collect cached questions and identify missing ones
  cacheResults.forEach((cached, index) => {
    if (cached.length > 0) {
      allQuestions[index] = cached[0];
      cachedCount++;
    } else {
      missingSpecs.push({ ...questionSpecs[index], index });
    }
  });

  console.log(`📊 [QuestionGeneratorService] Cache hit: ${cachedCount}/6, need to generate: ${missingSpecs.length}`);

  let generatedCount = 0;

  // OPTIMIZATION 2: Batch generate all missing questions in a single API call
  if (missingSpecs.length > 0) {
    console.log('🤖 [QuestionGeneratorService] Batch generating missing questions...');
    try {
      const batchGenerated = await generateBatchQuestionsWithAI(
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        phase
      );
      
      // Place generated questions in correct positions
      batchGenerated.forEach((question, i) => {
        if (question && missingSpecs[i]) {
          allQuestions[missingSpecs[i].index] = question;
          generatedCount++;
        }
      });
      
      // Cache the generated questions (don't await - do in background)
      if (batchGenerated.length > 0) {
        cacheQuestions(batchGenerated.filter(q => q !== null) as Question[]).catch(err => 
          console.warn('Background caching failed:', err)
        );
      }
    } catch (genError) {
      console.error('❌ [QuestionGeneratorService] Batch generation failed:', genError);
    }
  }

  // OPTIMIZATION 3: Use fallback questions for any still missing
  const stillMissing = questionSpecs.filter((_, i) => !allQuestions[i]);
  if (stillMissing.length > 0) {
    console.log(`⚡ [QuestionGeneratorService] Using ${stillMissing.length} fallback questions`);
    stillMissing.forEach((spec) => {
      const originalIndex = questionSpecs.findIndex((s, idx) => 
        !allQuestions[idx] && s.difficulty === spec.difficulty && s.subtag === spec.subtag
      );
      if (originalIndex !== -1) {
        allQuestions[originalIndex] = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag);
      }
    });
  }

  // Filter out any undefined entries and reorder
  const validQuestions = allQuestions.filter(q => q !== undefined) as Question[];
  const orderedQuestions = reorderToPreventConsecutiveSubtags(validQuestions, config.maxConsecutiveSameSubtag);

  // Update usage counts in background (don't await)
  updateQuestionUsage(orderedQuestions.map((q) => q.id)).catch(() => {});

  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated ${orderedQuestions.length} questions in ${elapsed}ms (cached: ${cachedCount}, generated: ${generatedCount})`);

  return {
    questions: orderedQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}

/**
 * Batch generates multiple questions in a single API call - MUCH FASTER
 */
async function generateBatchQuestionsWithAI(
  specs: { difficulty: DifficultyLevel; subtag: Subtag }[],
  gradeLevel: GradeLevel,
  phase: TestPhase
): Promise<Question[]> {
  if (specs.length === 0) return [];
  
  console.log(`🚀 [QuestionGeneratorService] Batch generating ${specs.length} questions in single API call`);
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Build a combined prompt for all questions
  const questionsDescription = specs.map((spec, i) => 
    `Question ${i + 1}: Difficulty ${spec.difficulty} (${DIFFICULTY_DESCRIPTIONS[spec.difficulty]}), Type: ${spec.subtag.replace(/_/g, ' ')}`
  ).join('\n');

  const systemPrompt = buildSystemPrompt(gradeLevel);
  const userPrompt = `Generate exactly ${specs.length} multiple-choice aptitude test questions with these SPECIFIC requirements:

${questionsDescription}

CRITICAL: Generate questions in the EXACT order specified above. Each question must match its specified difficulty and type.

Requirements:
- Each question must have 4 options (A, B, C, D) with exactly one correct answer
- Include a brief explanation for each correct answer
- Questions should be appropriate for ${gradeLevel.replace('_', ' ')} students

Return ONLY a valid JSON array with ${specs.length} question objects, no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || '';
    if (!responseContent) {
      throw new Error('Empty response from AI');
    }

    const rawQuestions = parseAIResponse(responseContent);
    
    // Convert to Question objects with correct metadata
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
    console.error('❌ [QuestionGeneratorService] Batch API call failed:', error);
    throw error;
  }
}

/**
 * Returns a pre-defined fallback question for instant loading
 * Used when cache is empty and API fails
 */
function getFallbackQuestion(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag
): Question {
  const fallbacks: Record<Subtag, { text: string; options: Question['options']; correctAnswer: Question['correctAnswer'] }[]> = {
    numerical_reasoning: [
      { text: 'If a shirt costs $25 and is on sale for 20% off, what is the sale price?', options: { A: '$20', B: '$22', C: '$18', D: '$15' }, correctAnswer: 'A' },
      { text: 'What is 15% of 80?', options: { A: '10', B: '12', C: '15', D: '8' }, correctAnswer: 'B' },
      { text: 'If 3x + 7 = 22, what is x?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'C' },
    ],
    logical_reasoning: [
      { text: 'All roses are flowers. Some flowers fade quickly. Which conclusion is valid?', options: { A: 'All roses fade quickly', B: 'Some roses may fade quickly', C: 'No roses fade quickly', D: 'Roses never fade' }, correctAnswer: 'B' },
      { text: 'If it rains, the ground gets wet. The ground is wet. What can we conclude?', options: { A: 'It definitely rained', B: 'It might have rained', C: 'It did not rain', D: 'The sun is shining' }, correctAnswer: 'B' },
    ],
    verbal_reasoning: [
      { text: 'HAPPY is to SAD as LIGHT is to:', options: { A: 'Lamp', B: 'Dark', C: 'Bright', D: 'Sun' }, correctAnswer: 'B' },
      { text: 'Choose the word most similar to "ABUNDANT":', options: { A: 'Scarce', B: 'Plentiful', C: 'Empty', D: 'Small' }, correctAnswer: 'B' },
    ],
    spatial_reasoning: [
      { text: 'If you rotate a square 90 degrees clockwise, which corner moves to the top?', options: { A: 'Top-left', B: 'Top-right', C: 'Bottom-left', D: 'Bottom-right' }, correctAnswer: 'C' },
      { text: 'How many faces does a cube have?', options: { A: '4', B: '6', C: '8', D: '12' }, correctAnswer: 'B' },
    ],
    data_interpretation: [
      { text: 'A bar chart shows sales of 100, 150, 200, 250 for Jan-Apr. What is the average monthly sales?', options: { A: '150', B: '175', C: '200', D: '225' }, correctAnswer: 'B' },
      { text: 'If a pie chart shows 25% for Category A, what angle does it represent?', options: { A: '45°', B: '90°', C: '180°', D: '270°' }, correctAnswer: 'B' },
    ],
    pattern_recognition: [
      { text: 'What comes next: 2, 4, 8, 16, ?', options: { A: '24', B: '32', C: '20', D: '18' }, correctAnswer: 'B' },
      { text: 'Complete the pattern: A, C, E, G, ?', options: { A: 'H', B: 'I', C: 'J', D: 'K' }, correctAnswer: 'B' },
    ],
  };

  const subtagFallbacks = fallbacks[subtag] || fallbacks.numerical_reasoning;
  const fallback = subtagFallbacks[Math.floor(Math.random() * subtagFallbacks.length)];

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

/**
 * Selects subtags ensuring minimum diversity
 */
function selectSubtagsForScreener(totalQuestions: number, minSubtags: number): Subtag[] {
  // Shuffle subtags
  const shuffled = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  
  // Select at least minSubtags different subtags
  const selected: Subtag[] = [];
  
  // First, add one of each required subtag
  for (let i = 0; i < Math.min(minSubtags, shuffled.length); i++) {
    selected.push(shuffled[i]);
  }
  
  // Fill remaining slots
  while (selected.length < totalQuestions) {
    const nextSubtag = shuffled[selected.length % shuffled.length];
    selected.push(nextSubtag);
  }
  
  return selected;
}

/**
 * Reorders questions to prevent consecutive same-subtag questions
 * Requirements: 6.1
 */
function reorderToPreventConsecutiveSubtags(
  questions: Question[],
  maxConsecutive: number
): Question[] {
  if (questions.length <= 1) return questions;

  const result: Question[] = [];
  const remaining = [...questions];

  while (remaining.length > 0) {
    // Count consecutive same subtags at end of result
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

    // Find a question with different subtag if we've hit the limit
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


// =============================================================================
// ADAPTIVE CORE LOOP GENERATION
// =============================================================================

/**
 * Generates questions for the Adaptive Core Loop phase - OPTIMIZED VERSION
 * Requirements: 2.5, 6.2
 * 
 * OPTIMIZATIONS:
 * - Parallel cache lookups
 * - Batch AI generation for missing questions
 * - Fallback questions for reliability
 * 
 * - Generates 8-10 questions with adaptive difficulty
 * - Maintains subtag balance (no more than 2 consecutive same subtag)
 * - Limits consecutive difficulty jumps in same direction to 2
 */
export async function generateAdaptiveCoreQuestions(
  gradeLevel: GradeLevel,
  startingDifficulty: DifficultyLevel,
  count: number = 10,
  excludeQuestionIds: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateAdaptiveCoreQuestions called:', { gradeLevel, startingDifficulty, count });
  const startTime = Date.now();
  
  const phase: TestPhase = 'adaptive_core';
  const config = DEFAULT_ADAPTIVE_TEST_CONFIG.phases.adaptive_core;
  
  // Ensure count is within bounds
  const questionCount = Math.min(
    Math.max(count, config.minQuestions),
    config.maxQuestions
  );

  // Generate question specs
  const difficultyRange = generateDifficultyRange(startingDifficulty, questionCount);
  const subtagSequence = generateBalancedSubtagSequence(questionCount, config.maxConsecutiveSameSubtag);
  
  const questionSpecs = difficultyRange.map((difficulty, i) => ({
    difficulty,
    subtag: subtagSequence[i],
  }));

  // OPTIMIZATION 1: Parallel cache lookups
  console.log('📦 [QuestionGeneratorService] Checking cache in parallel...');
  const cachePromises = questionSpecs.map(spec => 
    getCachedQuestions(gradeLevel, phase, spec.difficulty, spec.subtag, 1, excludeQuestionIds)
  );
  const cacheResults = await Promise.all(cachePromises);
  
  const allQuestions: Question[] = [];
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  cacheResults.forEach((cached, index) => {
    if (cached.length > 0) {
      allQuestions[index] = cached[0];
      cachedCount++;
    } else {
      missingSpecs.push({ ...questionSpecs[index], index });
    }
  });

  console.log(`📊 [QuestionGeneratorService] Cache hit: ${cachedCount}/${questionCount}, need to generate: ${missingSpecs.length}`);

  let generatedCount = 0;

  // OPTIMIZATION 2: Batch generate missing questions
  if (missingSpecs.length > 0) {
    console.log('🤖 [QuestionGeneratorService] Batch generating missing questions...');
    try {
      const batchGenerated = await generateBatchQuestionsWithAI(
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        phase
      );
      
      batchGenerated.forEach((question, i) => {
        if (question && missingSpecs[i]) {
          allQuestions[missingSpecs[i].index] = question;
          generatedCount++;
        }
      });
      
      // Cache in background
      if (batchGenerated.length > 0) {
        cacheQuestions(batchGenerated.filter(q => q !== null) as Question[]).catch(() => {});
      }
    } catch (genError) {
      console.error('❌ [QuestionGeneratorService] Batch generation failed:', genError);
    }
  }

  // OPTIMIZATION 3: Fallback for any still missing
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      allQuestions[i] = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag);
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as Question[];
  
  // Update usage counts in background
  updateQuestionUsage(validQuestions.map((q) => q.id)).catch(() => {});

  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated ${validQuestions.length} questions in ${elapsed}ms`);

  return {
    questions: validQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}

/**
 * Generates a difficulty range for adaptive core questions
 * Limits consecutive difficulty jumps in same direction to 2
 * Requirements: 6.2
 */
function generateDifficultyRange(
  startingDifficulty: DifficultyLevel,
  count: number
): DifficultyLevel[] {
  const difficulties: DifficultyLevel[] = [startingDifficulty];
  let consecutiveSameDirection = 0;
  let lastDirection: 'up' | 'down' | null = null;

  for (let i = 1; i < count; i++) {
    const current = difficulties[i - 1];
    
    // Determine possible directions
    const canGoUp = current < 5;
    const canGoDown = current > 1;
    
    // Check if we need to change direction due to limit
    const mustChangeDirection = consecutiveSameDirection >= 2;
    
    let nextDifficulty: DifficultyLevel;
    
    if (mustChangeDirection) {
      // Force direction change
      if (lastDirection === 'up' && canGoDown) {
        nextDifficulty = (current - 1) as DifficultyLevel;
        lastDirection = 'down';
        consecutiveSameDirection = 1;
      } else if (lastDirection === 'down' && canGoUp) {
        nextDifficulty = (current + 1) as DifficultyLevel;
        lastDirection = 'up';
        consecutiveSameDirection = 1;
      } else {
        // Stay at current if can't change direction
        nextDifficulty = current;
        consecutiveSameDirection = 0;
        lastDirection = null;
      }
    } else {
      // Random direction with slight bias toward staying near starting difficulty
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

/**
 * Generates a balanced subtag sequence
 * Ensures no more than maxConsecutive same subtags in a row
 * Requirements: 2.5
 */
function generateBalancedSubtagSequence(count: number, maxConsecutive: number): Subtag[] {
  const sequence: Subtag[] = [];
  const shuffledSubtags = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    // Count consecutive same subtags at end
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

    // Select next subtag
    let selectedSubtag: Subtag;
    
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      // Must pick a different subtag
      const available = shuffledSubtags.filter((s) => s !== lastSubtag);
      selectedSubtag = available[i % available.length];
    } else {
      selectedSubtag = shuffledSubtags[i % shuffledSubtags.length];
    }
    
    sequence.push(selectedSubtag);
  }

  return sequence;
}


// =============================================================================
// STABILITY CONFIRMATION GENERATION
// =============================================================================

/**
 * Generates questions for the Stability Confirmation phase - OPTIMIZED VERSION
 * Requirements: 3.1, 3.2
 * 
 * OPTIMIZATIONS:
 * - Parallel cache lookups
 * - Batch AI generation
 * - Fallback questions
 * 
 * - Generates 4-6 questions within ±1 of provisional band
 * - Includes at least one near-boundary item
 * - Mixes data and logic formats
 */
export async function generateStabilityConfirmationQuestions(
  gradeLevel: GradeLevel,
  provisionalBand: DifficultyLevel,
  count: number = 5,
  excludeQuestionIds: string[] = []
): Promise<QuestionGenerationResult> {
  console.log('🎯 [QuestionGeneratorService] generateStabilityConfirmationQuestions called:', { gradeLevel, provisionalBand, count });
  const startTime = Date.now();
  
  const phase: TestPhase = 'stability_confirmation';
  const config = DEFAULT_ADAPTIVE_TEST_CONFIG.phases.stability_confirmation;
  
  const questionCount = Math.min(
    Math.max(count, config.minQuestions),
    config.maxQuestions
  );

  // Generate question specs
  const difficulties = generateStabilityDifficulties(provisionalBand, questionCount);
  const subtags = generateMixedFormatSubtags(questionCount, config.maxConsecutiveSameSubtag);
  
  const questionSpecs = difficulties.map((difficulty, i) => ({
    difficulty,
    subtag: subtags[i],
  }));

  // OPTIMIZATION 1: Parallel cache lookups
  console.log('📦 [QuestionGeneratorService] Checking cache in parallel...');
  const cachePromises = questionSpecs.map(spec => 
    getCachedQuestions(gradeLevel, phase, spec.difficulty, spec.subtag, 1, excludeQuestionIds)
  );
  const cacheResults = await Promise.all(cachePromises);
  
  const allQuestions: Question[] = [];
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  cacheResults.forEach((cached, index) => {
    if (cached.length > 0) {
      allQuestions[index] = cached[0];
      cachedCount++;
    } else {
      missingSpecs.push({ ...questionSpecs[index], index });
    }
  });

  console.log(`📊 [QuestionGeneratorService] Cache hit: ${cachedCount}/${questionCount}, need to generate: ${missingSpecs.length}`);

  let generatedCount = 0;

  // OPTIMIZATION 2: Batch generate missing questions
  if (missingSpecs.length > 0) {
    try {
      const batchGenerated = await generateBatchQuestionsWithAI(
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        phase
      );
      
      batchGenerated.forEach((question, i) => {
        if (question && missingSpecs[i]) {
          allQuestions[missingSpecs[i].index] = question;
          generatedCount++;
        }
      });
      
      // Cache in background
      if (batchGenerated.length > 0) {
        cacheQuestions(batchGenerated.filter(q => q !== null) as Question[]).catch(() => {});
      }
    } catch (genError) {
      console.error('❌ [QuestionGeneratorService] Batch generation failed:', genError);
    }
  }

  // OPTIMIZATION 3: Fallback for any still missing
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      allQuestions[i] = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag);
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as Question[];
  
  // Update usage counts in background
  updateQuestionUsage(validQuestions.map((q) => q.id)).catch(() => {});

  const elapsed = Date.now() - startTime;
  console.log(`✅ [QuestionGeneratorService] Generated ${validQuestions.length} questions in ${elapsed}ms`);

  return {
    questions: validQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}

/**
 * Generates difficulties within ±1 of provisional band
 * Includes at least one near-boundary item
 * Requirements: 3.1
 */
function generateStabilityDifficulties(
  provisionalBand: DifficultyLevel,
  count: number
): DifficultyLevel[] {
  const difficulties: DifficultyLevel[] = [];
  
  // Calculate valid difficulty range (±1 of provisional band)
  const minDifficulty = Math.max(1, provisionalBand - 1) as DifficultyLevel;
  const maxDifficulty = Math.min(5, provisionalBand + 1) as DifficultyLevel;
  
  // Ensure at least one near-boundary item (at min or max of range)
  const hasBoundaryItem = { lower: false, upper: false };
  
  for (let i = 0; i < count; i++) {
    let difficulty: DifficultyLevel;
    
    // First question: at provisional band
    if (i === 0) {
      difficulty = provisionalBand;
    }
    // Second question: near lower boundary if possible
    else if (i === 1 && !hasBoundaryItem.lower && minDifficulty < provisionalBand) {
      difficulty = minDifficulty;
      hasBoundaryItem.lower = true;
    }
    // Third question: near upper boundary if possible
    else if (i === 2 && !hasBoundaryItem.upper && maxDifficulty > provisionalBand) {
      difficulty = maxDifficulty;
      hasBoundaryItem.upper = true;
    }
    // Remaining: random within range
    else {
      const range = [minDifficulty, provisionalBand, maxDifficulty].filter(
        (d, idx, arr) => arr.indexOf(d) === idx
      );
      difficulty = range[Math.floor(Math.random() * range.length)];
    }
    
    difficulties.push(difficulty);
  }

  return difficulties;
}

/**
 * Generates a mix of data and logic format subtags
 * Requirements: 3.2
 */
function generateMixedFormatSubtags(count: number, maxConsecutive: number): Subtag[] {
  // Data formats
  const dataFormats: Subtag[] = ['data_interpretation', 'pattern_recognition'];
  // Logic formats
  const logicFormats: Subtag[] = ['logical_reasoning', 'numerical_reasoning', 'verbal_reasoning', 'spatial_reasoning'];
  
  const sequence: Subtag[] = [];
  let useDataFormat = true; // Alternate between data and logic formats
  
  for (let i = 0; i < count; i++) {
    // Check consecutive count
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

    // Select from appropriate format pool
    const pool = useDataFormat ? dataFormats : logicFormats;
    let selectedSubtag: Subtag;
    
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      // Must pick different subtag
      const available = pool.filter((s) => s !== lastSubtag);
      if (available.length > 0) {
        selectedSubtag = available[Math.floor(Math.random() * available.length)];
      } else {
        // Switch to other pool
        const otherPool = useDataFormat ? logicFormats : dataFormats;
        selectedSubtag = otherPool[Math.floor(Math.random() * otherPool.length)];
      }
    } else {
      selectedSubtag = pool[Math.floor(Math.random() * pool.length)];
    }
    
    sequence.push(selectedSubtag);
    useDataFormat = !useDataFormat; // Alternate
  }

  return sequence;
}


// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

/**
 * Main function to generate questions based on options
 * Requirements: 7.1
 */
export async function generateQuestions(
  options: QuestionGenerationOptions
): Promise<QuestionGenerationResult> {
  const { gradeLevel, phase, difficulty, subtag, count = 1, excludeQuestionIds = [] } = options;

  // If specific difficulty and subtag provided, generate directly
  if (difficulty !== undefined && subtag !== undefined) {
    const cached = await getCachedQuestions(
      gradeLevel,
      phase,
      difficulty,
      subtag,
      count,
      excludeQuestionIds
    );

    if (cached.length >= count) {
      await updateQuestionUsage(cached.slice(0, count).map((q) => q.id));
      return {
        questions: cached.slice(0, count),
        fromCache: true,
        generatedCount: 0,
        cachedCount: count,
      };
    }

    // Generate remaining questions
    const needed = count - cached.length;
    const generated = await generateQuestionsWithAI(needed, gradeLevel, phase, difficulty, subtag);
    await cacheQuestions(generated);

    const allQuestions = [...cached, ...generated].slice(0, count);
    await updateQuestionUsage(allQuestions.map((q) => q.id));

    return {
      questions: allQuestions,
      fromCache: cached.length > 0,
      generatedCount: generated.length,
      cachedCount: cached.length,
    };
  }

  // Phase-specific generation
  switch (phase) {
    case 'diagnostic_screener':
      return generateDiagnosticScreenerQuestions(gradeLevel, excludeQuestionIds);
    
    case 'adaptive_core':
      return generateAdaptiveCoreQuestions(
        gradeLevel,
        difficulty || 3,
        count,
        excludeQuestionIds
      );
    
    case 'stability_confirmation':
      return generateStabilityConfirmationQuestions(
        gradeLevel,
        difficulty || 3,
        count,
        excludeQuestionIds
      );
    
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

// =============================================================================
// QUESTION GENERATOR SERVICE CLASS
// =============================================================================

/**
 * QuestionGeneratorService class providing all question generation functionality
 */
export class QuestionGeneratorService {
  /**
   * Generates questions for the Diagnostic Screener phase
   * Requirements: 1.4, 6.1
   */
  static async generateDiagnosticScreenerQuestions(
    gradeLevel: GradeLevel,
    excludeQuestionIds?: string[]
  ): Promise<QuestionGenerationResult> {
    return generateDiagnosticScreenerQuestions(gradeLevel, excludeQuestionIds);
  }

  /**
   * Generates questions for the Adaptive Core Loop phase
   * Requirements: 2.5, 6.2
   */
  static async generateAdaptiveCoreQuestions(
    gradeLevel: GradeLevel,
    startingDifficulty: DifficultyLevel,
    count?: number,
    excludeQuestionIds?: string[]
  ): Promise<QuestionGenerationResult> {
    return generateAdaptiveCoreQuestions(gradeLevel, startingDifficulty, count, excludeQuestionIds);
  }

  /**
   * Generates questions for the Stability Confirmation phase
   * Requirements: 3.1, 3.2
   */
  static async generateStabilityConfirmationQuestions(
    gradeLevel: GradeLevel,
    provisionalBand: DifficultyLevel,
    count?: number,
    excludeQuestionIds?: string[]
  ): Promise<QuestionGenerationResult> {
    return generateStabilityConfirmationQuestions(gradeLevel, provisionalBand, count, excludeQuestionIds);
  }

  /**
   * Generates questions based on options
   * Requirements: 7.1
   */
  static async generateQuestions(
    options: QuestionGenerationOptions
  ): Promise<QuestionGenerationResult> {
    return generateQuestions(options);
  }

  /**
   * Gets cached questions from the database
   * Requirements: 7.1
   */
  static async getCachedQuestions(
    gradeLevel: GradeLevel,
    phase: TestPhase,
    difficulty?: DifficultyLevel,
    subtag?: Subtag,
    limit?: number,
    excludeIds?: string[]
  ): Promise<Question[]> {
    return getCachedQuestions(gradeLevel, phase, difficulty, subtag, limit, excludeIds);
  }

  /**
   * Caches questions to the database
   * Requirements: 7.1
   */
  static async cacheQuestions(questions: Question[]): Promise<void> {
    return cacheQuestions(questions);
  }

  /**
   * Updates usage count for questions
   */
  static async updateQuestionUsage(questionIds: string[]): Promise<void> {
    return updateQuestionUsage(questionIds);
  }
}

export default QuestionGeneratorService;
