/**
 * Initialize Test Handler
 * 
 * Handles POST /initialize endpoint
 * Creates a new adaptive aptitude test session
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { getContextUser } from '../../../lib/auth';
import type { InitializeTestOptions, InitializeTestResult, GradeLevel } from '../types';
import { dbSessionToTestSession } from '../utils/converters';
import { fetchDiagnosticQuestions, extractGradeNumber, learnerGradeToGradeLevel } from '../utils/question-bank';

/**
 * Initializes a new adaptive aptitude test session
 * 
 * Requirements: 1.1
 * - Creates a new session with learner ID and grade level
 * - Generates initial question set (diagnostic screener)
 * - Requires authentication
 * 
 * @param context - Cloudflare Pages context
 * @returns InitializeTestResult with session and first question
 */
export const initializeHandler: PagesFunction = async (context) => {
  const { request, env } = context;

  try {
    const user = getContextUser(context);
    const userId = user.id;

    console.log('✅ [InitializeHandler] User authenticated:', userId);

    // Parse request body
    const body = await request.json() as InitializeTestOptions;
    const { gradeLevel, learnerCourse } = body;
    // Note: learnerId from body is ignored - we look it up from auth.user.id

    if (!gradeLevel) {
      return jsonResponse(
        { error: 'Missing required field: gradeLevel' },
        400
      );
    }

    console.log('📋 [InitializeHandler] Request:', { gradeLevel, learnerCourse });

    // Create Supabase admin client for verification
    const supabase = createSupabaseAdminClient(env);

    // Look up the learner record for the authenticated user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id, user_id, grade')
      .eq('user_id', userId)
      .single();

    if (learnerError || !learnerData) {
      console.error('❌ [InitializeHandler] Learner record not found for user:', userId, learnerError);
      return jsonResponse(
        { error: 'Learner record not found', message: learnerError?.message },
        404
      );
    }

    const learnerId = learnerData.id;
    const learnerGradeString = learnerData.grade;
    console.log('✅ [InitializeHandler] Found learner record:', { learnerId, grade: learnerGradeString });

    // Determine actual gradeLevel from learner's grade column for college learners
    // This overrides the frontend-provided gradeLevel if learner has UG/PG in their grade
    let actualGradeLevel = gradeLevel;
    if (learnerGradeString) {
      const detectedGradeLevel = learnerGradeToGradeLevel(learnerGradeString);
      if (detectedGradeLevel === 'undergraduate' || detectedGradeLevel === 'postgraduate') {
        actualGradeLevel = detectedGradeLevel;
        console.log('🎓 [InitializeHandler] Overriding gradeLevel based on learner grade:', {
          provided: gradeLevel,
          detected: actualGradeLevel,
          learnerGrade: learnerGradeString
        });
      }
    }

    // Validate gradeLevel
    const validGradeLevels: GradeLevel[] = ['middle_school', 'high_school', 'higher_secondary', 'after10', 'after12', 'undergraduate', 'postgraduate'];
    if (!validGradeLevels.includes(gradeLevel)) {
      return jsonResponse(
        { error: 'Invalid gradeLevel. Must be one of: middle_school, high_school, higher_secondary, after10, after12, undergraduate, postgraduate' },
        400
      );
    }

    console.log('🚀 [InitializeHandler] initializeTest called:', { learnerId, gradeLevel: actualGradeLevel });

    // Fetch diagnostic screener questions from question bank (no AI)
    console.log('📝 [InitializeHandler] Fetching diagnostic screener questions from database...');
    
    // Extract specific grade number from learner record
    const specificGrade = extractGradeNumber(learnerGradeString);
    console.log('🎯 [InitializeHandler] Using specific grade:', specificGrade || 'fallback to range');
    
    const diagnosticQuestions = await fetchDiagnosticQuestions(supabase, actualGradeLevel, [], specificGrade || undefined);
    
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
        learner_id: learnerId,
        grade_level: gradeLevel,
        learner_course: specificGrade ? `Grade ${specificGrade}` : (learnerCourse || null),
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
