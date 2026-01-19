/**
 * Assessment Service
 * Handles all database operations for the assessment system
 */

import { supabase } from '../lib/supabaseClient';
import { calculateStreamRecommendations } from '../features/assessment/assessment-result/utils/streamMatchingEngine';

/**
 * Validate and enhance stream recommendation for After 10th students
 * Uses rule-based engine to verify AI recommendation
 */
export const validateStreamRecommendation = (results) => {
  if (results.gradeLevel !== 'after10') return results;
  
  try {
    console.log('🔍 Validating stream recommendation for After 10th student...');
    
    // Calculate rule-based recommendation
    const ruleBasedStream = calculateStreamRecommendations(
      { riasec: { scores: results.riasec?.scores || {} } },
      { subjectMarks: [], projects: [], experiences: [] }
    );
    
    const aiStream = results.streamRecommendation?.recommendedStream;
    const ruleStream = ruleBasedStream.recommendedStream;
    const ruleConfidence = ruleBasedStream.confidenceScore;
    
    // If streamRecommendation is missing or invalid, generate it from rule-based engine
    if (!aiStream || aiStream === 'N/A' || aiStream === 'null' || aiStream === null) {
      console.warn('⚠️ streamRecommendation missing from AI response!');
      console.warn('   Generating from rule-based engine...');
      
      results.streamRecommendation = {
        ...ruleBasedStream,
        isAfter10: true,
        source: 'rule-based-fallback',
        reason: 'AI response did not include streamRecommendation',
        aiSuggestion: null
      };
      
      console.log('✅ Generated streamRecommendation:', results.streamRecommendation.recommendedStream);
      return results;
    }
    
    console.log('AI Recommendation:', aiStream);
    console.log('Rule-Based Recommendation:', ruleStream, `(${ruleConfidence}% confidence)`);
    
    // If AI and rule-based differ significantly, use rule-based if confidence is high
    if (aiStream !== ruleStream && ruleConfidence >= 75) {
      console.warn('⚠️ Stream recommendation mismatch detected!');
      console.warn('   AI suggested:', aiStream);
      console.warn('   Rule-based suggests:', ruleStream, `(${ruleConfidence}% confidence)`);
      
      // Use rule-based if confidence is high
      if (ruleConfidence >= 80) {
        console.log('✅ Using rule-based recommendation due to high confidence');
        results.streamRecommendation = {
          ...results.streamRecommendation,
          ...ruleBasedStream,
          aiSuggestion: aiStream,
          source: 'rule-based-override',
          overrideReason: `Rule-based algorithm has ${ruleConfidence}% confidence vs AI suggestion`
        };
      } else {
        // Add rule-based as alternative
        results.streamRecommendation = {
          ...results.streamRecommendation,
          ruleBasedAlternative: ruleStream,
          ruleBasedConfidence: ruleConfidence,
          source: 'ai-with-rule-based-alternative'
        };
      }
    } else {
      console.log('✅ AI and rule-based recommendations agree:', aiStream);
      results.streamRecommendation = {
        ...results.streamRecommendation,
        ruleBasedConfirmation: ruleStream,
        ruleBasedConfidence: ruleConfidence,
        source: 'ai-confirmed-by-rules'
      };
    }
  } catch (error) {
    console.error('❌ Error validating stream recommendation:', error);
    // Continue with AI recommendation if validation fails
  }
  
  return results;
};

/**
 * Map grade levels to their database equivalents
 * Some UI grade levels share the same database sections
 */
const mapGradeLevelToDatabase = (gradeLevel) => {
  const mapping = {
    'higher_secondary': 'highschool', // Grades 11-12 use high school sections
    // Add more mappings as needed
  };
  return mapping[gradeLevel] || gradeLevel;
};

/**
 * Fetch all assessment sections
 * @param {string} gradeLevel - Grade level filter: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const fetchSections = async (gradeLevel = null) => {
  let query = supabase
    .from('personal_assessment_sections')
    .select('*')
    .eq('is_active', true);

  // Filter by grade level if provided (with mapping)
  if (gradeLevel) {
    const dbGradeLevel = mapGradeLevelToDatabase(gradeLevel);
    query = query.eq('grade_level', dbGradeLevel);
  }

  const { data, error } = await query.order('order_number');

  if (error) throw error;
  return data;
};

/**
 * Fetch all available streams
 */
export const fetchStreams = async () => {
  const { data, error } = await supabase
    .from('personal_assessment_streams')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;
  return data;
};

/**
 * Fetch questions for a specific section
 * @param {string} sectionId - Section UUID
 * @param {string} streamId - Stream ID (only needed for knowledge section)
 */
export const fetchQuestionsBySection = async (sectionId, streamId = null) => {
  let query = supabase
    .from('personal_assessment_questions')
    .select('*')
    .eq('section_id', sectionId)
    .eq('is_active', true)
    .order('order_number');

  // For stream-specific sections, filter by stream
  if (streamId) {
    query = query.eq('stream_id', streamId);
  } else {
    query = query.is('stream_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/**
 * Fetch all questions for an assessment (organized by section)
 * @param {string} streamId - Student's selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const fetchAllQuestions = async (streamId, gradeLevel = null) => {
  const sections = await fetchSections(gradeLevel);
  const questionsBySection = {};

  for (const section of sections) {
    const isStreamSpecific = section.is_stream_specific;
    const questions = await fetchQuestionsBySection(
      section.id,
      isStreamSpecific ? streamId : null
    );
    questionsBySection[section.name] = {
      section,
      questions
    };
  }

  return questionsBySection;
};

/**
 * Create a new assessment attempt
 * @param {string} studentId - Student's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 */
export const createAttempt = async (studentId, streamId, gradeLevel) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .insert({
      student_id: studentId,
      stream_id: streamId,
      grade_level: gradeLevel,
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update attempt progress
 * @param {string} attemptId - Attempt UUID
 * @param {object} progress - Progress data including timerRemaining for timed sections and elapsedTime for non-timed
 */
export const updateAttemptProgress = async (attemptId, progress) => {
  // First fetch existing data to merge section_timings and all_responses
  const { data: existingAttempt } = await supabase
    .from('personal_assessment_attempts')
    .select('section_timings, all_responses')
    .eq('id', attemptId)
    .single();

  // IMPORTANT: Merge section_timings with existing timings instead of replacing
  // This ensures all section timings are preserved across multiple updates
  const mergedSectionTimings = {
    ...(existingAttempt?.section_timings || {}),
    ...(progress.sectionTimings || {})
  };

  const updateData = {
    current_section_index: progress.sectionIndex,
    current_question_index: progress.questionIndex,
    section_timings: mergedSectionTimings,
    updated_at: new Date().toISOString()
  };
  
  // Include timer_remaining if provided (for timed sections)
  if (progress.timerRemaining !== undefined && progress.timerRemaining !== null) {
    updateData.timer_remaining = progress.timerRemaining;
  }
  
  // Include elapsed_time if provided (for non-timed sections)
  if (progress.elapsedTime !== undefined && progress.elapsedTime !== null) {
    updateData.elapsed_time = progress.elapsedTime;
  }

  // Include aptitude_question_timer if provided (for aptitude section per-question timer)
  if (progress.aptitudeQuestionTimer !== undefined && progress.aptitudeQuestionTimer !== null) {
    updateData.aptitude_question_timer = progress.aptitudeQuestionTimer;
  }

  // Include adaptive_aptitude_session_id if provided (for adaptive section)
  if (progress.adaptiveAptitudeSessionId) {
    updateData.adaptive_aptitude_session_id = progress.adaptiveAptitudeSessionId;
  }

  // Include all_responses if provided (for non-UUID questions like RIASEC, BigFive, etc.)
  // IMPORTANT: Merge with existing all_responses instead of replacing
  if (progress.allResponses) {
    
    // Merge existing responses with new ones (new ones take precedence)
    const mergedResponses = {
      ...(existingAttempt?.all_responses || {}),
      ...progress.allResponses
    };
    updateData.all_responses = mergedResponses;
  }
  
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Save all responses to the attempt (for non-UUID questions)
 * This is used for RIASEC, BigFive, Values, Employability questions that have string IDs
 * @param {string} attemptId - Attempt UUID
 * @param {object} allResponses - All responses object { "riasec_r1": 4, "bigfive_o1": 3, ... }
 */
export const saveAllResponses = async (attemptId, allResponses) => {
  try {
    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({
        all_responses: allResponses,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('Error saving all responses:', error);
      throw error;
    }
    
    console.log('✅ All responses saved to database');
    return data;
  } catch (err) {
    console.error('Error in saveAllResponses:', err);
    throw err;
  }
};

/**
 * Update the adaptive aptitude session ID for an attempt
 * @param {string} attemptId - Attempt UUID
 * @param {string} adaptiveSessionId - Adaptive aptitude session UUID
 */
export const updateAttemptAdaptiveSession = async (attemptId, adaptiveSessionId) => {
  try {
    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({
        adaptive_aptitude_session_id: adaptiveSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      // Log but don't throw - this is a non-critical operation
      console.warn('Could not update adaptive session ID:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    // Catch any unexpected errors - column might not exist yet
    console.warn('Error updating adaptive session ID:', err.message);
    return null;
  }
};

/**
 * Save a response to a question
 * @param {string} attemptId - Attempt UUID
 * @param {string} questionId - Question UUID
 * @param {any} responseValue - The response value (can be number, string, or object)
 * @param {boolean} isCorrect - Whether the answer is correct (for MCQ)
 */
export const saveResponse = async (attemptId, questionId, responseValue, isCorrect = null) => {
  // Ensure responseValue is never null or undefined
  // Convert null/undefined to appropriate defaults based on type
  let sanitizedValue = responseValue;

  if (responseValue === null || responseValue === undefined) {
    // Default to empty string for text responses, empty array for multi-select
    sanitizedValue = '';
  } else if (Array.isArray(responseValue) && responseValue.length === 0) {
    // For empty arrays, store as empty array JSON
    sanitizedValue = [];
  }

  console.log('Saving response:', {
    attemptId,
    questionId,
    originalValue: responseValue,
    sanitizedValue,
    valueType: typeof sanitizedValue,
    isCorrect
  });

  const { data, error } = await supabase
    .from('personal_assessment_responses')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      response_value: sanitizedValue,
      is_correct: isCorrect,
      responded_at: new Date().toISOString()
    }, {
      onConflict: 'attempt_id,question_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving response:', error);
    console.error('Failed data:', {
      attempt_id: attemptId,
      question_id: questionId,
      response_value: sanitizedValue,
      is_correct: isCorrect
    });
    throw error;
  }

  return data;
};

/**
 * Get all responses for an attempt
 * @param {string} attemptId - Attempt UUID
 */
export const getAttemptResponses = async (attemptId) => {
  const { data, error } = await supabase
    .from('personal_assessment_responses')
    .select(`
      *,
      question:personal_assessment_questions(*)
    `)
    .eq('attempt_id', attemptId);

  if (error) throw error;
  return data;
};

/**
 * Complete an assessment attempt and save results
 * 
 * IMPORTANT: This function saves results FIRST, then marks the attempt as completed.
 * This ensures that if the results insert fails, the attempt remains "in_progress"
 * and can be retried, rather than being orphaned as "completed" with no results.
 * 
 * @param {string} attemptId - Attempt UUID
 * @param {string} studentId - Student's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @param {object} geminiResults - Full Gemini AI analysis results
 * @param {object} sectionTimings - Time spent on each section
 */
export const completeAttempt = async (attemptId, studentId, streamId, gradeLevel, geminiResults, sectionTimings) => {
  console.log('=== completeAttempt Debug ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Student ID:', studentId);
  console.log('Stream ID:', streamId);
  console.log('Has geminiResults:', !!geminiResults);
  console.log('geminiResults keys:', geminiResults ? Object.keys(geminiResults) : []);
  
  // Debug: Log the actual data being extracted
  console.log('🔍 Extracting data from geminiResults:');
  console.log('  riasec:', JSON.stringify(geminiResults?.riasec));
  console.log('  riasec.scores:', JSON.stringify(geminiResults?.riasec?.scores));
  console.log('  riasec.code:', geminiResults?.riasec?.code);

  // ============================================================================
  // CRITICAL VALIDATION: Ensure AI returned complete data
  // Validation is grade-level specific since different grades have different sections
  // ============================================================================
  
  // Define required fields based on grade level
  let requiredFields;
  
  if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
    // Middle school and high school have simplified assessments
    // They use adaptive aptitude instead of traditional aptitude/knowledge sections
    requiredFields = [
      'riasec',        // Interest explorer maps to RIASEC
      'bigFive',       // Strengths & character maps to BigFive
      'careerFit',     // Career recommendations
      'roadmap'        // Development roadmap
    ];
    console.log('📊 Using simplified validation for grade:', gradeLevel);
  } else {
    // Comprehensive assessment for after10, after12, college, higher_secondary
    requiredFields = [
      'riasec',
      'aptitude', 
      'bigFive',
      'workValues',
      'employability',
      'knowledge',
      'careerFit',
      'skillGap',
      'roadmap'
    ];
    console.log('📊 Using comprehensive validation for grade:', gradeLevel);
  }
  
  const missingFields = requiredFields.filter(field => !geminiResults[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ CRITICAL: AI returned incomplete data!');
    console.error('❌ Missing required fields:', missingFields);
    console.error('❌ AI Response Keys:', Object.keys(geminiResults));
    console.error('❌ Full AI Response:', JSON.stringify(geminiResults, null, 2));
    
    throw new Error(
      `AI analysis incomplete. Missing ${missingFields.length} required fields: ${missingFields.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  // Validate nested required fields (grade-level specific)
  let nestedValidation;
  
  if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
    // Simplified nested validation for middle/high school
    nestedValidation = [
      { path: 'careerFit.clusters', value: geminiResults.careerFit?.clusters },
      { path: 'roadmap.projects', value: geminiResults.roadmap?.projects }
    ];
  } else {
    // Comprehensive nested validation
    nestedValidation = [
      { path: 'workValues.scores', value: geminiResults.workValues?.scores },
      { path: 'employability.skillScores', value: geminiResults.employability?.skillScores },
      { path: 'employability.overallReadiness', value: geminiResults.employability?.overallReadiness },
      { path: 'careerFit.clusters', value: geminiResults.careerFit?.clusters },
      { path: 'skillGap.priorityA', value: geminiResults.skillGap?.priorityA },
      { path: 'roadmap.projects', value: geminiResults.roadmap?.projects }
    ];
  }
  
  const missingNested = nestedValidation.filter(v => !v.value).map(v => v.path);
  
  if (missingNested.length > 0) {
    console.error('❌ CRITICAL: AI returned incomplete nested data!');
    console.error('❌ Missing nested fields:', missingNested);
    
    throw new Error(
      `AI analysis incomplete. Missing nested fields: ${missingNested.join(', ')}. ` +
      `Please try again or contact support if the issue persists.`
    );
  }

  // Prepare data for insertion - explicitly extract each field
  const riasecScores = geminiResults?.riasec?.scores || null;
  const riasecCode = geminiResults?.riasec?.code || null;
  const bigfiveScores = geminiResults?.bigFive || null;
  const careerFit = geminiResults?.careerFit || null;
  const skillGap = geminiResults?.skillGap || null;
  const skillGapCourses = geminiResults?.skillGapCourses || null;
  const platformCourses = geminiResults?.platformCourses || null;
  const coursesByType = geminiResults?.coursesByType || null;
  const roadmap = geminiResults?.roadmap || null;
  const profileSnapshot = geminiResults?.profileSnapshot || null;
  const timingAnalysis = geminiResults?.timingAnalysis || null;
  const finalNote = geminiResults?.finalNote || null;
  const overallSummary = geminiResults?.overallSummary || null;

  // Grade-level specific fields - only extract for comprehensive assessments
  const isSimplifiedAssessment = gradeLevel === 'middle' || gradeLevel === 'highschool';
  
  // Aptitude - available for all grade levels (adaptive for middle/high school)
  const aptitudeScores = geminiResults?.aptitude?.scores || null;
  const aptitudeOverall = geminiResults?.aptitude?.overallScore ?? null;
  
  // These fields are ONLY for comprehensive assessments (after10, after12, college, higher_secondary)
  const workValuesScores = isSimplifiedAssessment ? null : (geminiResults?.workValues?.scores || null);
  const employabilityScores = isSimplifiedAssessment ? null : (geminiResults?.employability?.skillScores || null);
  const employabilityReadiness = isSimplifiedAssessment ? null : (geminiResults?.employability?.overallReadiness || null);
  const knowledgeScore = isSimplifiedAssessment ? null : (geminiResults?.knowledge?.score ?? null);
  const knowledgeDetails = isSimplifiedAssessment ? null : (geminiResults?.knowledge || null);

  console.log('📊 Extracted values (grade:', gradeLevel, ', simplified:', isSimplifiedAssessment, '):');
  console.log('  riasecScores:', riasecScores);
  console.log('  riasecCode:', riasecCode);
  console.log('  bigfiveScores:', bigfiveScores);
  console.log('  aptitudeScores:', aptitudeScores);
  console.log('  workValuesScores:', workValuesScores, isSimplifiedAssessment ? '(excluded for simplified)' : '');
  console.log('  employabilityScores:', employabilityScores, isSimplifiedAssessment ? '(excluded for simplified)' : '');
  console.log('  knowledgeScore:', knowledgeScore, isSimplifiedAssessment ? '(excluded for simplified)' : '');
  console.log('  careerFit exists:', !!careerFit);

  const dataToInsert = {
    attempt_id: attemptId,
    student_id: studentId,
    grade_level: gradeLevel,
    stream_id: streamId,
    status: 'completed',
    riasec_scores: riasecScores,
    riasec_code: riasecCode,
    aptitude_scores: aptitudeScores,
    aptitude_overall: aptitudeOverall,
    bigfive_scores: bigfiveScores,
    work_values_scores: workValuesScores,
    employability_scores: employabilityScores,
    employability_readiness: employabilityReadiness,
    knowledge_score: knowledgeScore,
    knowledge_details: knowledgeDetails,
    career_fit: careerFit,
    skill_gap: skillGap,
    skill_gap_courses: skillGapCourses,
    platform_courses: platformCourses,
    courses_by_type: coursesByType,
    roadmap: roadmap,
    profile_snapshot: profileSnapshot,
    timing_analysis: timingAnalysis,
    final_note: finalNote,
    overall_summary: overallSummary,
    gemini_results: geminiResults
  };

  console.log('📝 Final dataToInsert check:');
  console.log('  riasec_scores:', dataToInsert.riasec_scores);
  console.log('  riasec_code:', dataToInsert.riasec_code);
  console.log('  career_fit exists:', !!dataToInsert.career_fit);
  console.log('  skill_gap exists:', !!dataToInsert.skill_gap);
  console.log('  roadmap exists:', !!dataToInsert.roadmap);

  // STEP 1: Save results FIRST (before marking attempt as completed)
  // This ensures if insert fails, the attempt stays "in_progress" and can be retried
  console.log('=== STEP 1: Inserting into personal_assessment_results ===');
  console.log('Attempt ID:', attemptId);
  console.log('Student ID:', studentId);
  console.log('Stream ID:', streamId);
  
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .upsert(dataToInsert, {
      onConflict: 'attempt_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (resultsError) {
    console.error('❌ Error upserting results:', resultsError);
    console.error('Full error object:', JSON.stringify(resultsError, null, 2));
    
    // Check if it's an RLS error
    if (resultsError.code === '42501' || resultsError.message?.includes('policy')) {
      console.error('🔒 This appears to be an RLS (Row Level Security) policy error');
      console.error('The student_id in the upsert must match auth.uid()');
    }
    
    // Don't mark attempt as completed if results failed to save
    throw resultsError;
  }

  console.log('✅ Results saved successfully:', results.id);

  // STEP 2: Only mark attempt as completed AFTER results are saved successfully
  console.log('=== STEP 2: Marking attempt as completed ===');
  const { error: attemptError } = await supabase
    .from('personal_assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      section_timings: sectionTimings
    })
    .eq('id', attemptId);

  if (attemptError) {
    console.error('⚠️ Warning: Results saved but failed to update attempt status:', attemptError);
    // Results are saved, so we don't throw here - the data is safe
    // The attempt status can be fixed manually if needed
  } else {
    console.log('✅ Attempt marked as completed');
  }

  // STEP 3: Create notification for assessment completion
  console.log('=== STEP 3: Creating assessment completion notification ===');
  try {
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: studentId,
        type: 'assessment_completed',
        title: 'Career Assessment Completed',
        message: `Your ${gradeLevel === 'middle' ? 'Middle School' : gradeLevel === 'highschool' ? 'High School' : gradeLevel === 'after10' ? 'After 10th' : gradeLevel === 'after12' ? 'After 12th' : 'College'} career assessment has been completed. View your personalized results and career recommendations.`,
        assessment_id: attemptId,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.warn('⚠️ Could not create notification:', notificationError.message);
      // Don't throw - notification is not critical
    } else {
      console.log('✅ Assessment completion notification created');
    }
  } catch (notifErr) {
    console.warn('⚠️ Notification creation failed:', notifErr.message);
    // Don't throw - notification is not critical
  }

  return results;
};

/**
 * Get student's assessment history
 * @param {string} studentId - Student's user_id
 */
export const getStudentAttempts = async (studentId) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
      results:personal_assessment_results(*)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get a specific attempt with full results
 * @param {string} attemptId - Attempt UUID
 */
export const getAttemptWithResults = async (attemptId) => {
  const { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
      results:personal_assessment_results(*)
    `)
    .eq('id', attemptId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get the latest completed assessment result for a student
 * @param {string} studentIdOrUserId - Student's ID from students table OR user_id from auth
 * @returns {object|null} Latest assessment result, or null if none found
 */
export const getLatestResult = async (studentIdOrUserId) => {
  if (!studentIdOrUserId) {
    console.warn('getLatestResult: No student ID provided');
    return null;
  }

  // Try direct lookup first (assuming it's student.id)
  let { data, error } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('student_id', studentIdOrUserId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest result:', error);
    throw error;
  }

  // If found, return it
  if (data) {
    console.log('✅ Found assessment result (direct lookup)');
    return data;
  }

  // If not found, try looking up by user_id (in case we were passed auth.uid())
  console.log('🔄 No direct match, trying user_id lookup...');
  
  try {
    // Get student.id from user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentIdOrUserId)
      .maybeSingle();

    if (studentError) {
      console.warn('Error looking up student by user_id:', studentError);
      return null;
    }

    if (!student) {
      console.warn('No student record found for user_id:', studentIdOrUserId);
      return null;
    }

    // Now try again with the correct student.id
    const { data: resultData, error: resultError } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('student_id', student.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resultError) {
      console.error('Error fetching result by student.id:', resultError);
      return null;
    }

    if (resultData) {
      console.log('✅ Found assessment result (via user_id lookup)');
    } else {
      console.log('❌ No completed assessment result found for this student');
    }

    return resultData;
  } catch (err) {
    console.error('Error in user_id fallback lookup:', err);
    return null;
  }
};

/**
 * Check if student can take assessment (6-month restriction)
 * In development mode, the restriction is bypassed for testing.
 * 
 * @param {string} studentId - Student's user_id
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @returns {object} { canTake: boolean, lastAttemptDate: Date|null, nextAvailableDate: Date|null }
 */
export const canTakeAssessment = async (studentId, gradeLevel = null) => {
  // Bypass restriction in development mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  if (isDevelopment) {
    console.log('🔧 Development mode: Assessment 6-month restriction bypassed');
    return { canTake: true, lastAttemptDate: null, nextAvailableDate: null, devBypass: true };
  }

  const { data, error } = await supabase
    .from('personal_assessment_results')
    .select('created_at')
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // No previous assessment, can take
    return { canTake: true, lastAttemptDate: null, nextAvailableDate: null };
  }

  const lastAttemptDate = new Date(data.created_at);
  const sixMonthsLater = new Date(lastAttemptDate);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const now = new Date();
  const canTake = now >= sixMonthsLater;

  return {
    canTake,
    lastAttemptDate,
    nextAvailableDate: canTake ? null : sixMonthsLater
  };
};

/**
 * Check if student has an in-progress attempt
 * @param {string} studentIdOrUserId - Student's ID from students table OR user_id from auth
 * @returns {object|null} In-progress attempt with responses, or null if none found
 */
export const getInProgressAttempt = async (studentIdOrUserId) => {
  if (!studentIdOrUserId) {
    console.warn('getInProgressAttempt: No student ID provided');
    return null;
  }

  /**
   * Helper function to check if an attempt has meaningful progress
   * An attempt is considered "started" if it has:
   * - At least one response in personal_assessment_responses table, OR
   * - At least one answer in all_responses JSONB column, OR
   * - An adaptive aptitude session with progress
   */
  const hasProgress = (attempt) => {
    if (!attempt) return false;
    
    // Check for responses in the responses table
    if (attempt.responses && attempt.responses.length > 0) {
      return true;
    }
    
    // Check for answers in all_responses JSONB
    if (attempt.all_responses && typeof attempt.all_responses === 'object') {
      const keys = Object.keys(attempt.all_responses);
      // Filter out metadata keys that aren't actual answers
      const answerKeys = keys.filter(k => 
        !k.startsWith('_') && 
        k !== 'adaptive_aptitude_results'
      );
      if (answerKeys.length > 0) {
        return true;
      }
    }
    
    // Check for adaptive aptitude session progress
    if (attempt.adaptive_aptitude_session_id) {
      return true;
    }
    
    return false;
  };
  
  /**
   * Helper function to fetch adaptive session progress
   * Returns the number of questions answered in the adaptive session
   */
  const fetchAdaptiveProgress = async (sessionId) => {
    if (!sessionId) return null;
    
    try {
      const { data: sessionData, error } = await supabase
        .from('adaptive_aptitude_sessions')
        .select('current_question_index, status, current_phase')
        .eq('id', sessionId)
        .maybeSingle();
      
      if (error || !sessionData) {
        console.warn('Could not fetch adaptive session progress:', error);
        return null;
      }
      
      return {
        questionsAnswered: sessionData.current_question_index || 0,
        status: sessionData.status,
        currentPhase: sessionData.current_phase
      };
    } catch (err) {
      console.warn('Error fetching adaptive progress:', err);
      return null;
    }
  };

  // Try direct lookup first (assuming it's student.id)
  let { data, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      stream:personal_assessment_streams(*),
      responses:personal_assessment_responses(*)
    `)
    .eq('student_id', studentIdOrUserId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching in-progress attempt:', error);
    throw error;
  }

  // If found, check if it has actual progress
  if (data) {
    if (hasProgress(data)) {
      console.log('✅ Found in-progress attempt with progress (direct lookup):', data.id);
      
      // Fetch adaptive progress if there's an adaptive session
      if (data.adaptive_aptitude_session_id) {
        const adaptiveProgress = await fetchAdaptiveProgress(data.adaptive_aptitude_session_id);
        if (adaptiveProgress) {
          data.adaptiveProgress = adaptiveProgress;
          console.log('📊 Adaptive progress:', adaptiveProgress);
        }
      }
      
      return data;
    } else {
      // Attempt exists but has no progress - abandon it silently
      console.log('🗑️ Found empty in-progress attempt, abandoning:', data.id);
      try {
        await supabase
          .from('personal_assessment_attempts')
          .update({ status: 'abandoned' })
          .eq('id', data.id);
      } catch (abandonErr) {
        console.warn('Could not abandon empty attempt:', abandonErr);
      }
      // Continue to check for other attempts or return null
      data = null;
    }
  }

  // If not found or abandoned, try looking up by user_id (in case we were passed auth.uid())
  console.log('🔄 No direct match, trying user_id lookup...');
  
  try {
    // Get student.id from user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentIdOrUserId)
      .maybeSingle();

    if (studentError) {
      console.warn('Error looking up student by user_id:', studentError);
      return null;
    }

    if (!student) {
      console.warn('No student record found for user_id:', studentIdOrUserId);
      return null;
    }

    // Now try again with the correct student.id
    const { data: attemptData, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select(`
        *,
        stream:personal_assessment_streams(*),
        responses:personal_assessment_responses(*)
      `)
      .eq('student_id', student.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptError) {
      console.error('Error fetching attempt by student.id:', attemptError);
      return null;
    }

    if (attemptData) {
      if (hasProgress(attemptData)) {
        console.log('✅ Found in-progress attempt with progress (via user_id lookup):', attemptData.id);
        
        // Fetch adaptive progress if there's an adaptive session
        if (attemptData.adaptive_aptitude_session_id) {
          const adaptiveProgress = await fetchAdaptiveProgress(attemptData.adaptive_aptitude_session_id);
          if (adaptiveProgress) {
            attemptData.adaptiveProgress = adaptiveProgress;
            console.log('📊 Adaptive progress:', adaptiveProgress);
          }
        }
        
        return attemptData;
      } else {
        // Attempt exists but has no progress - abandon it silently
        console.log('🗑️ Found empty in-progress attempt, abandoning:', attemptData.id);
        try {
          await supabase
            .from('personal_assessment_attempts')
            .update({ status: 'abandoned' })
            .eq('id', attemptData.id);
        } catch (abandonErr) {
          console.warn('Could not abandon empty attempt:', abandonErr);
        }
        return null;
      }
    } else {
      console.log('❌ No in-progress attempt found for this student');
    }

    return attemptData;
  } catch (err) {
    console.error('Error in user_id fallback lookup:', err);
    return null;
  }
};

/**
 * Abandon an in-progress attempt
 * @param {string} attemptId - Attempt UUID
 */
export const abandonAttempt = async (attemptId) => {
  const { error } = await supabase
    .from('personal_assessment_attempts')
    .update({
      status: 'abandoned',
      updated_at: new Date().toISOString()
    })
    .eq('id', attemptId);

  if (error) throw error;
};

/**
 * Transform database questions to match existing frontend format
 * This helps maintain backward compatibility with the existing UI
 */
export const transformQuestionsForUI = (dbQuestions, sectionName) => {
  return dbQuestions.map(q => {
    const base = {
      id: q.id,
      text: q.question_text,
      type: q.subtype,
      moduleTitle: q.module_title
    };

    // Add options for MCQ questions
    if (q.question_type === 'mcq' && q.options) {
      base.options = q.options;
      base.correct = q.correct_answer;
    }

    // Add SJT-specific fields
    if (q.question_type === 'sjt') {
      base.partType = 'sjt';
      base.scenario = q.scenario;
      base.options = q.options;
      base.bestAnswer = q.best_answer;
      base.worstAnswer = q.worst_answer;
    }

    // Add self-rating fields
    if (q.part_type === 'selfRating') {
      base.partType = 'selfRating';
    }

    return base;
  });
};

/**
 * Calculate aptitude scores from answers and questions
 * @param {Array} answers - Array of answer objects
 * @param {Array} questions - Array of question objects with correct_answer
 * @returns {Object} Scores object broken down by category
 */
export const calculateAptitudeScores = (answers, questions) => {
  console.log('🧮 Calculating aptitude scores...');
  console.log('📝 Answers count:', answers?.length);
  console.log('❓ Questions count:', questions?.length);

  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
    console.warn('⚠️ Missing answers or questions for aptitude scoring');
    return {
      verbal: { correct: 0, total: 0, percentage: 0 },
      numerical: { correct: 0, total: 0, percentage: 0 },
      abstract: { correct: 0, total: 0, percentage: 0 },
      spatial: { correct: 0, total: 0, percentage: 0 },
      clerical: { correct: 0, total: 0, percentage: 0 }
    };
  }

  // Create a map of question ID to question details
  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q.id, {
      correct_answer: q.correct_answer,
      subtype: q.subtype || q.category || 'verbal'
    });
  });

  // Category mapping for AI-generated questions
  const categoryMap = {
    'mathematics': 'numerical',
    'math': 'numerical',
    'numerical_reasoning': 'numerical',
    'numerical': 'numerical',
    'verbal_reasoning': 'verbal',
    'verbal': 'verbal',
    'logical_reasoning': 'abstract',
    'logical': 'abstract',
    'abstract': 'abstract',
    'spatial_reasoning': 'spatial',
    'spatial': 'spatial',
    'clerical_speed': 'clerical',
    'clerical': 'clerical',
    'data_interpretation': 'numerical',
    'english': 'verbal',
    'science': 'abstract',
    'social_studies': 'verbal',
    'history': 'verbal',
    'geography': 'spatial',
    'civics': 'verbal',
    'economics': 'numerical',
    'general_knowledge': 'verbal',
    'reasoning': 'abstract',
    'aptitude': 'numerical'
  };

  // Initialize scores by category
  const scoresByCategory = {
    verbal: { correct: 0, total: 0, details: [] },
    numerical: { correct: 0, total: 0, details: [] },
    abstract: { correct: 0, total: 0, details: [] },
    spatial: { correct: 0, total: 0, details: [] },
    clerical: { correct: 0, total: 0, details: [] }
  };

  answers.forEach(answer => {
    const questionDetails = questionMap.get(answer.question_id);
    if (questionDetails) {
      const rawCategory = questionDetails.subtype.toLowerCase();
      const category = categoryMap[rawCategory] || 'verbal';
      
      scoresByCategory[category].total++;
      
      const isCorrect = answer.selected_answer === questionDetails.correct_answer;
      if (isCorrect) {
        scoresByCategory[category].correct++;
      }
      
      scoresByCategory[category].details.push({
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        correct_answer: questionDetails.correct_answer,
        is_correct: isCorrect
      });
    }
  });

  // Calculate percentages
  Object.keys(scoresByCategory).forEach(category => {
    const scores = scoresByCategory[category];
    scores.percentage = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
  });

  console.log(`✅ Aptitude scores by category:`, scoresByCategory);

  return {
    verbal: {
      correct: scoresByCategory.verbal.correct,
      total: scoresByCategory.verbal.total,
      percentage: scoresByCategory.verbal.percentage
    },
    numerical: {
      correct: scoresByCategory.numerical.correct,
      total: scoresByCategory.numerical.total,
      percentage: scoresByCategory.numerical.percentage
    },
    abstract: {
      correct: scoresByCategory.abstract.correct,
      total: scoresByCategory.abstract.total,
      percentage: scoresByCategory.abstract.percentage
    },
    spatial: {
      correct: scoresByCategory.spatial.correct,
      total: scoresByCategory.spatial.total,
      percentage: scoresByCategory.spatial.percentage
    },
    clerical: {
      correct: scoresByCategory.clerical.correct,
      total: scoresByCategory.clerical.total,
      percentage: scoresByCategory.clerical.percentage
    }
  };
};

/**
 * Calculate knowledge scores from answers and questions
 * @param {Array} answers - Array of answer objects
 * @param {Array} questions - Array of question objects with correct_answer
 * @returns {Object} Scores object with correct/total counts
 */
export const calculateKnowledgeScores = (answers, questions) => {
  console.log('🧮 Calculating knowledge scores...');
  console.log('📝 Answers count:', answers?.length);
  console.log('❓ Questions count:', questions?.length);

  if (!answers || !questions || answers.length === 0 || questions.length === 0) {
    console.warn('⚠️ Missing answers or questions for knowledge scoring');
    return { correct: 0, total: 0, percentage: 0 };
  }

  // Create a map of question ID to correct answer
  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q.id, q.correct_answer);
  });

  let correct = 0;
  let total = 0;

  answers.forEach(answer => {
    const correctAnswer = questionMap.get(answer.question_id);
    if (correctAnswer !== undefined) {
      total++;
      if (answer.selected_answer === correctAnswer) {
        correct++;
      }
    }
  });

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  console.log(`✅ Knowledge: ${correct}/${total} correct (${percentage}%)`);

  return {
    correct,
    total,
    percentage,
    details: answers.map(answer => ({
      question_id: answer.question_id,
      selected_answer: answer.selected_answer,
      correct_answer: questionMap.get(answer.question_id),
      is_correct: answer.selected_answer === questionMap.get(answer.question_id)
    }))
  };
};

/**
 * Complete an assessment attempt WITHOUT AI analysis
 * This is used by Submit button - AI analysis will be generated on-demand on result page
 * @param {string} attemptId - Attempt UUID
 * @param {string} studentId - Student's user_id
 * @param {string} streamId - Selected stream
 * @param {string} gradeLevel - Grade level: 'middle', 'highschool', 'higher_secondary', or 'after12'
 * @param {object} sectionTimings - Time spent on each section
 */
export const completeAttemptWithoutAI = async (attemptId, studentId, streamId, gradeLevel, sectionTimings) => {
  console.log('=== completeAttemptWithoutAI ===');
  console.log('Grade Level:', gradeLevel);
  console.log('Student ID:', studentId);
  console.log('Stream ID:', streamId);
  console.log('Attempt ID:', attemptId);
  
  // Update attempt status to completed
  const { error: attemptError } = await supabase
    .from('personal_assessment_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      section_timings: sectionTimings
    })
    .eq('id', attemptId);

  if (attemptError) {
    console.error('Error updating attempt:', attemptError);
    throw attemptError;
  }

  // Create a minimal result record WITHOUT AI analysis
  // AI analysis will be generated on-demand when viewing result page
  const dataToInsert = {
    attempt_id: attemptId,
    student_id: studentId,
    grade_level: gradeLevel,
    stream_id: streamId,
    status: 'completed',
    // All AI fields are null - will be populated when AI analysis runs
    riasec_scores: null,
    riasec_code: null,
    aptitude_scores: null,
    aptitude_overall: null,
    bigfive_scores: null,
    work_values_scores: null,
    employability_scores: null,
    employability_readiness: null,
    knowledge_score: null,
    knowledge_details: null,
    career_fit: null,
    skill_gap: null,
    skill_gap_courses: null,
    roadmap: null,
    profile_snapshot: null,
    timing_analysis: null,
    final_note: null,
    overall_summary: null,
    gemini_results: null
  };

  console.log('📝 Inserting minimal result record (AI analysis will be generated on result page)');
  
  const { data: results, error: resultsError } = await supabase
    .from('personal_assessment_results')
    .upsert(dataToInsert, {
      onConflict: 'attempt_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (resultsError) {
    console.error('❌ Error upserting minimal result:', resultsError);
    throw resultsError;
  }

  console.log('✅ Minimal result saved successfully:', results.id);
  console.log('   AI analysis will be generated automatically on result page');
  return results;
};

/**
 * Save aptitude scores to assessment attempt
 * @param {string} attemptId - Assessment attempt ID
 * @param {Object} scores - Aptitude scores object
 * @returns {Promise<Object>} Updated attempt
 */
export const saveAptitudeScores = async (attemptId, scores) => {
  try {
    console.log('💾 Saving aptitude scores to attempt:', attemptId);
    console.log('📊 Scores:', scores);

    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({
        aptitude_scores: scores,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving aptitude scores:', error);
      throw error;
    }

    console.log('✅ Aptitude scores saved successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to save aptitude scores:', error);
    throw error;
  }
};

/**
 * Save knowledge scores to assessment attempt
 * @param {string} attemptId - Assessment attempt ID
 * @param {Object} scores - Knowledge scores object
 * @returns {Promise<Object>} Updated attempt
 */
export const saveKnowledgeScores = async (attemptId, scores) => {
  try {
    console.log('💾 Saving knowledge scores to attempt:', attemptId);
    console.log('📊 Scores:', scores);

    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({
        knowledge_scores: scores,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving knowledge scores:', error);
      throw error;
    }

    console.log('✅ Knowledge scores saved successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to save knowledge scores:', error);
    throw error;
  }
};

export default {
  fetchSections,
  fetchStreams,
  fetchQuestionsBySection,
  fetchAllQuestions,
  createAttempt,
  updateAttemptProgress,
  saveResponse,
  saveAllResponses,
  getAttemptResponses,
  completeAttempt,
  completeAttemptWithoutAI,
  getStudentAttempts,
  getAttemptWithResults,
  getLatestResult,
  getInProgressAttempt,
  abandonAttempt,
  transformQuestionsForUI,
  canTakeAssessment,
  calculateAptitudeScores,
  calculateKnowledgeScores,
  saveAptitudeScores,
  saveKnowledgeScores
};
