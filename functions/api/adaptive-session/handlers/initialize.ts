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
import { fetchDiagnosticQuestions, extractGradeNumber } from '../utils/question-bank';

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
      .select('id, user_id, grade')
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
    const studentGradeString = studentData.grade;
    console.log('✅ [InitializeHandler] Found student record:', { studentId, grade: studentGradeString });

    // Validate gradeLevel
    const validGradeLevels: GradeLevel[] = ['middle_school', 'high_school', 'higher_secondary'];
    if (!validGradeLevels.includes(gradeLevel)) {
      return jsonResponse(
        { error: 'Invalid gradeLevel. Must be one of: middle_school, high_school, higher_secondary' },
        400
      );
    }

    console.log('🚀 [InitializeHandler] initializeTest called:', { studentId, gradeLevel });

    // Fetch diagnostic screener questions from question bank (no AI)
    console.log('📝 [InitializeHandler] Fetching diagnostic screener questions from database...');
    
    // Extract specific grade number from student record
    const specificGrade = extractGradeNumber(studentGradeString);
    console.log('🎯 [InitializeHandler] Using specific grade:', specificGrade || 'fallback to range');
    
    const diagnosticQuestions = await fetchDiagnosticQuestions(supabase, gradeLevel, [], specificGrade || undefined);
    
    console.log('📋 [InitializeHandler] Questions fetched from database:', {
      questionsCount: diagnosticQuestions.length,
      source: 'personal_assessment_questions',
      specificGrade: specificGrade || 'range',
    });

    if (!diagnosticQuestions || diagnosticQuestions.length === 0) {
      console.error('❌ [InitializeHandler] No questions found in database!');
      throw new Error('No diagnostic screener questions available in question bank');
    }

    // Create session in database (reuse supabase client from earlier)
    console.log('💾 [InitializeHandler] Creating session in database...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('adaptive_aptitude_sessions')
      .insert({
        student_id: studentId,
        grade_level: gradeLevel,
        student_course: specificGrade ? `Grade ${specificGrade}` : (studentCourse || null),
        current_phase: 'diagnostic_screener',
        current_difficulty: 3, // Default starting difficulty
        difficulty_path: [],
        questions_answered: 0,
        correct_answers: 0,
        current_question_index: 0,
        current_phase_questions: diagnosticQuestions,
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
      diagnosticQuestions
    );

    const result: InitializeTestResult = {
      session,
      firstQuestion: diagnosticQuestions[0],
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
