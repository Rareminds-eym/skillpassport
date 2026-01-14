/**
 * Course Assessment Handler
 * Generates course-specific assessment questions
 */

import type { Env } from '../../types';
import { jsonResponse, errorResponse } from '../../utils/response';
import { repairAndParseJSON } from '../../utils/jsonParser';
import { getReadClient } from '../../services/supabaseService';
import { callClaudeAPI } from '../../services/claudeService';
import { buildCourseAssessmentPrompt } from '../../prompts/course';

interface CourseAssessmentRequestBody {
  courseName: string;
  level?: string;
  questionCount?: number;
}

export async function handleCourseAssessment(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as CourseAssessmentRequestBody;
    const { courseName, level = 'Intermediate', questionCount = 15 } = body;

    if (!courseName) {
      return errorResponse('Course name is required', 400);
    }

    const supabase = getReadClient(env);

    // Check cache first
    try {
      const { data: existing, error: cacheError } = await supabase
        .from('generated_external_assessment')
        .select('*')
        .eq('certificate_name', courseName)
        .single();

      if (!cacheError && existing) {
        console.log('✅ Returning cached questions for:', courseName);
        return jsonResponse({
          course: courseName,
          level: existing.assessment_level,
          total_questions: existing.total_questions,
          questions: existing.questions,
          cached: true
        });
      }
    } catch (dbError: any) {
      console.warn('⚠️ Database unavailable, will generate new questions:', dbError.message);
    }

    console.log('📝 Generating new questions for:', courseName);

    const apiKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      return errorResponse('Claude API key not configured', 500);
    }

    const prompt = buildCourseAssessmentPrompt(courseName, level, questionCount);

    const jsonText = await callClaudeAPI(apiKey, {
      systemPrompt: `You are an expert assessment creator for ${courseName}. Generate ONLY valid JSON.`,
      userPrompt: prompt,
      maxTokens: 4000,
      temperature: 0.7
    });

    const assessment = repairAndParseJSON(jsonText);

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
    try {
      const { error: insertError } = await supabase.from('generated_external_assessment').insert({
        certificate_name: courseName,
        assessment_level: level,
        total_questions: questionCount,
        questions: assessment.questions,
        generated_by: 'claude-ai'
      });
      
      if (insertError) {
        console.warn('⚠️ Could not cache assessment:', insertError.message);
      } else {
        console.log('✅ Assessment cached to database');
      }
    } catch (cacheError: any) {
      console.warn('⚠️ Database insert exception:', cacheError.message);
    }

    console.log('✅ Assessment generated successfully');
    return jsonResponse(assessment);
  } catch (error: any) {
    console.error('❌ Course assessment error:', error);
    return errorResponse(error.message || 'Failed to generate assessment', 500);
  }
}
