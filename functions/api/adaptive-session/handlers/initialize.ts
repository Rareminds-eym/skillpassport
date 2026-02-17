/**
 * Initialize Test Handler
 * 
 * Handles POST /initialize endpoint
 * Creates a new adaptive aptitude test session
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import type { InitializeTestOptions, InitializeTestResult, GradeLevel } from '../types';
import { dbSessionToTestSession } from '../utils/converters';
import { authenticateUser } from '../../shared/auth';

/**
 * Initializes a new adaptive aptitude test session
 * 
 * Requirements: 1.1
 * - Creates a new session with student ID and grade level
 * - Generates initial question set (diagnostic screener)
 * - Requires authentication
 * 
 * @param context - Cloudflare Pages context
 * @returns InitializeTestResult with session and first question
 */
export const initializeHandler: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('❌ [InitializeHandler] Authentication required');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    console.log('✅ [InitializeHandler] User authenticated:', auth.user.id);

    // Parse request body
    const body = await request.json() as InitializeTestOptions;
    const { gradeLevel, studentCourse } = body;
    // Note: studentId from body is ignored - we look it up from auth.user.id

    if (!gradeLevel) {
      return jsonResponse(
        { error: 'Missing required field: gradeLevel' },
        400
      );
    }

    console.log('📋 [InitializeHandler] Request:', { gradeLevel, studentCourse });

    // Create Supabase admin client for verification
    const supabase = createSupabaseAdminClient(env);

    // Look up the student record for the authenticated user
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('user_id', auth.user.id)
      .single();

    if (studentError || !studentData) {
      console.error('❌ [InitializeHandler] Student record not found for user:', auth.user.id, studentError);
      return jsonResponse(
        { error: 'Student record not found', message: studentError?.message },
        404
      );
    }

    const studentId = studentData.id;
    console.log('✅ [InitializeHandler] Found student record:', studentId);

    // Validate and map gradeLevel for question generation
    const gradeLevelForQuestions: Record<string, GradeLevel> = {
      'middle_school': 'grade6-8',
      'high_school': 'grade9-10',
      'higher_secondary': 'after10',
      'grade6-8': 'grade6-8',
      'grade9-10': 'grade9-10',
      'after10': 'after10',
      'after12': 'after12',
      'college': 'college',
      'postgraduate': 'postgraduate'
    };

    const mappedGradeLevelForQuestions = gradeLevelForQuestions[gradeLevel];
    if (!mappedGradeLevelForQuestions) {
      return jsonResponse(
        { error: 'Invalid gradeLevel. Must be one of: middle_school, high_school, higher_secondary, grade6-8, grade9-10, after10, after12, college, postgraduate' },
        400
      );
    }

    console.log('🚀 [InitializeHandler] initializeTest called:', { studentId, gradeLevel, mappedForQuestions: mappedGradeLevelForQuestions });

    // Generate diagnostic screener questions by calling the question generation API
    console.log('📝 [InitializeHandler] Generating diagnostic screener questions...');
    
    const questionGenUrl = new URL('/api/question-generation/generate/diagnostic', request.url);
    const questionGenResponse = await fetch(questionGenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gradeLevel: mappedGradeLevelForQuestions, studentCourse }),
    });

    if (!questionGenResponse.ok) {
      console.error('❌ [InitializeHandler] Question generation failed:', questionGenResponse.status);
      throw new Error(`Failed to generate diagnostic screener questions: ${questionGenResponse.statusText}`);
    }

    const questionResult = await questionGenResponse.json();
    console.log('📋 [InitializeHandler] Question generation result:', {
      questionsCount: questionResult.questions?.length || 0,
      fromCache: questionResult.fromCache,
      generatedCount: questionResult.generatedCount,
      cachedCount: questionResult.cachedCount,
    });

    if (!questionResult.questions || questionResult.questions.length === 0) {
      console.error('❌ [InitializeHandler] No questions generated!');
      throw new Error('Failed to generate diagnostic screener questions');
    }

    // Create session in database (reuse supabase client from earlier)
    console.log('💾 [InitializeHandler] Creating session in database...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .insert({
        student_id: studentId,
        grade_level: gradeLevel, // Use original gradeLevel for database
        student_course: studentCourse || null,
        current_phase: 'diagnostic_screener',
        current_difficulty: 3, // Default starting difficulty
        difficulty_path: [],
        questions_answered: 0,
        correct_answers: 0,
        current_question_index: 0,
        current_phase_questions: questionResult.questions,
        status: 'in_progress',
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ [InitializeHandler] Failed to create session:', sessionError);
      throw new Error(`Failed to create test session: ${sessionError?.message || 'Unknown error'}`);
    }
    
    console.log('✅ [InitializeHandler] Session created:', sessionData.id);

    // Convert to typed session
    const session = dbSessionToTestSession(
      sessionData,
      [],
      questionResult.questions
    );

    const result: InitializeTestResult = {
      session,
      firstQuestion: questionResult.questions[0],
    };

    return jsonResponse(result, 201);

  } catch (error) {
    console.error('❌ [InitializeHandler] Error:', error);
    return jsonResponse(
      { 
        error: 'Failed to initialize test',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
};
