/**
 * AI Tutor Suggestions Handler
 * 
 * Generates 3-5 helpful questions that students might want to ask
 * to better understand lesson material.
 * 
 * Features:
 * - Fetches lesson and module data from Supabase
 * - Uses AI to generate contextual questions
 * - Graceful degradation with default questions
 * - No authentication required (public endpoint)
 */

import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../../src/functions-lib/types';
import { callOpenRouterWithRetry, getAPIKeys } from '../../shared/ai-config';

/**
 * Default questions to use when AI is unavailable or fails
 */
function getDefaultQuestions(lessonTitle: string): string[] {
  return [
    `What are the key concepts in "${lessonTitle}"?`,
    `Can you explain the main points of this lesson?`,
    `How does this lesson connect to the rest of the course?`
  ];
}

/**
 * Parse AI response to extract questions array
 */
function parseQuestionsFromResponse(content: string): string[] {
  try {
    // Try to find JSON array in response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter((q: any) => typeof q === 'string' && q.trim().length > 0);
      }
    }
  } catch {
    // Fall through to line-by-line parsing
  }

  // Fallback: extract lines ending with '?'
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.endsWith('?'))
    .slice(0, 5);
}

/**
 * Generate AI tutor suggestions for a lesson
 */
export const handleAiTutorSuggestions: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createSupabaseClient(env);
    
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { lessonId } = body;

    if (!lessonId) {
      return jsonResponse({ error: 'Missing required field: lessonId' }, 400);
    }

    // Fetch lesson with module info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('lesson_id, title, content, module_id')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (lessonError) {
      console.error('❌ Lesson fetch error:', lessonError);
      return jsonResponse({ error: 'Database error fetching lesson' }, 500);
    }

    if (!lesson) {
      // Graceful degradation: return default questions if lesson not found
      console.warn(`⚠️ Lesson not found: ${lessonId}, returning default questions`);
      return jsonResponse({
        questions: [
          "What are the key concepts in this lesson?",
          "Can you explain the main points?",
          "How does this connect to the rest of the course?"
        ],
        lessonId,
        lessonTitle: 'Unknown Lesson'
      });
    }

    // Get module title
    const { data: module } = await supabase
      .from('course_modules')
      .select('title')
      .eq('module_id', lesson.module_id)
      .maybeSingle();

    const moduleTitle = module?.title || 'Unknown Module';

    // Check if AI is configured
    const { openRouter: openRouterKey } = getAPIKeys(env);
    if (!openRouterKey) {
      console.log('⚠️ OpenRouter API key not configured, returning default questions');
      return jsonResponse({
        questions: getDefaultQuestions(lesson.title),
        lessonId,
        lessonTitle: lesson.title
      });
    }

    // Build prompt for AI
    const prompt = `Based on the following lesson, generate 3-5 helpful questions that a student might want to ask to better understand the material.

## Lesson: ${lesson.title}
## Module: ${moduleTitle}

### Content:
${lesson.content || 'No content available'}

Generate questions that:
1. Help clarify key concepts from the lesson
2. Explore practical applications of the material
3. Connect this lesson to broader course themes
4. Address common points of confusion

Return ONLY a JSON array of question strings, like:
["Question 1?", "Question 2?", "Question 3?"]`;

    // Call AI with retry and fallback
    let questions: string[] = [];
    try {
      console.log(`🤖 Generating suggestions for lesson: ${lesson.title}`);
      
      const aiResponse = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'user', content: prompt }
      ], {
        maxTokens: 500,
        temperature: 0.7
      });

      // Parse questions from AI response
      questions = parseQuestionsFromResponse(aiResponse);
      
      // Limit to 5 questions
      questions = questions.slice(0, 5);

      // Validate we got at least 3 questions
      if (questions.length < 3) {
        console.warn('⚠️ AI returned fewer than 3 questions, using defaults');
        questions = getDefaultQuestions(lesson.title);
      }

      console.log(`✅ Generated ${questions.length} suggestions`);
    } catch (error: any) {
      console.error('❌ AI generation error:', error.message);
      // Graceful degradation: return default questions on AI error
      questions = getDefaultQuestions(lesson.title);
    }

    return jsonResponse({
      questions,
      lessonId,
      lessonTitle: lesson.title
    });

  } catch (error: any) {
    console.error('❌ AI Tutor Suggestions error:', error);
    // Final fallback: return generic default questions
    return jsonResponse({
      questions: [
        "What are the key concepts in this lesson?",
        "Can you explain the main points?",
        "How does this connect to the rest of the course?"
      ],
      lessonId: 'unknown',
      lessonTitle: 'Unknown Lesson'
    });
  }
};
