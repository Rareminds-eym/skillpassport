/**
 * useAssessmentSubmission Hook
 * 
 * Handles assessment submission logic including:
 * - Gemini AI analysis
 * - Database saving
 * - Result processing
 * - Course recommendations
 * 
 * @module features/assessment/career-test/hooks/useAssessmentSubmission
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - JS service without type declarations
import { analyzeAssessmentWithGemini } from '../../../../services/geminiAssessmentService';
// @ts-ignore - JS service without type declarations
import * as assessmentService from '../../../../services/assessmentService';
import { supabase } from '../../../../lib/supabaseClient';
import type { GradeLevel } from '../config/sections';
import { generateCourseRecommendations } from '../utils/courseRecommendations';

// Import static question banks for fallback (same as useAssessmentResults uses)
// @ts-ignore - JS exports
import {
  riasecQuestions,
  bigFiveQuestions,
  workValuesQuestions,
  employabilityQuestions,
  streamKnowledgeQuestions,
} from '../../index';

/**
 * Get the student record ID from auth user ID
 * Questions are saved with students.id, not auth.user.id
 */
const getStudentRecordId = async (authUserId: string): Promise<string | null> => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (error || !student) {

      return null;
    }


    return student.id;
  } catch (err) {
    console.error('Error looking up student record:', err);
    return null;
  }
};

/**
 * Fetch AI-generated aptitude questions from database
 * These questions have correct_answer field needed for scoring
 * 
 * IMPORTANT: We need to find questions that match the IDs in the student's answers,
 * not just the latest questions (which may have different IDs if regenerated)
 * 
 * NOTE: Questions are saved with students.id (from students table), not auth.user.id
 * So we need to look up the student record first if an auth user ID is provided
 */
const fetchAIAptitudeQuestions = async (authUserId: string, answerKeys?: string[]): Promise<any[]> => {
  try {
    // If we have answer keys, extract the question IDs to find the right question set
    let targetQuestionIds: string[] = [];
    if (answerKeys && answerKeys.length > 0) {
      targetQuestionIds = answerKeys
        .filter(k => k.startsWith('aptitude_'))
        .map(k => k.replace('aptitude_', ''));

    }

    // First, look up the student record ID from the auth user ID
    // Questions are saved with students.id, not auth.user.id
    const studentRecordId = await getStudentRecordId(authUserId);

    // Try with student record ID first (this is how questions are saved)
    if (studentRecordId) {


      const { data: allQuestionSets, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('id, questions, created_at')
        .eq('student_id', studentRecordId)
        .eq('question_type', 'aptitude')
        .order('created_at', { ascending: false });



      if (!error && allQuestionSets && allQuestionSets.length > 0) {
        const matchingSet = findMatchingQuestionSet(allQuestionSets, targetQuestionIds);
        return transformQuestions(matchingSet);
      }
    }

    // Fallback: Try with auth user ID directly (in case questions were saved with auth ID)

    const { data: fallbackQuestionSets, error: fallbackError } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, created_at')
      .eq('student_id', authUserId)
      .eq('question_type', 'aptitude')
      .order('created_at', { ascending: false });



    if (!fallbackError && fallbackQuestionSets && fallbackQuestionSets.length > 0) {
      const matchingSet = findMatchingQuestionSet(fallbackQuestionSets, targetQuestionIds);
      return transformQuestions(matchingSet);
    }

    console.log('No AI aptitude questions found in database');
    return [];
  } catch (err) {
    console.error('Error fetching AI aptitude questions:', err);
    return [];
  }
};

// Helper function to find matching question set
const findMatchingQuestionSet = (allQuestionSets: any[], targetQuestionIds: string[]): any => {
  let matchingQuestionSet = null;
  let bestMatchCount = 0;

  if (targetQuestionIds.length > 0) {


    for (const questionSet of allQuestionSets) {
      const questionIds = questionSet.questions.map((q: any) => q.id);
      const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;



      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        matchingQuestionSet = questionSet;
      }

      // If we found a perfect or near-perfect match, use it
      if (matchCount >= targetQuestionIds.length * 0.9) {

        break;
      }
    }
  }

  if (!matchingQuestionSet) {
    console.warn('⚠️ No matching question set found, using latest');
    matchingQuestionSet = allQuestionSets[0];
  } else if (bestMatchCount < targetQuestionIds.length * 0.5) {
    console.warn(`⚠️ Poor match quality: only ${bestMatchCount}/${targetQuestionIds.length} IDs matched (${Math.round(bestMatchCount / targetQuestionIds.length * 100)}%)`);
    console.warn('⚠️ This will result in incomplete scoring - questions may have been regenerated');
  }

  return matchingQuestionSet;
};

// Helper function to transform questions
const transformQuestions = (questionSet: any): any[] => {
  if (!questionSet || !questionSet.questions) return [];

  const questions = questionSet.questions.map((q: any) => ({
    ...q,
    correct: q.correct_answer,
    correctAnswer: q.correct_answer,
    subtype: q.subtype || q.category || 'verbal'
  }));


  return questions;
};

/**
 * Fetch AI-generated knowledge questions from database
 * 
 * IMPORTANT: We need to find questions that match the IDs in the student's answers,
 * not just the latest questions (which may have different IDs if regenerated)
 * 
 * NOTE: Questions are saved with students.id (from students table), not auth.user.id
 * So we need to look up the student record first if an auth user ID is provided
 */
const fetchAIKnowledgeQuestions = async (authUserId: string, answerKeys?: string[]): Promise<any[]> => {
  try {
    // If we have answer keys, extract the question IDs to find the right question set
    let targetQuestionIds: string[] = [];
    if (answerKeys && answerKeys.length > 0) {
      targetQuestionIds = answerKeys
        .filter(k => k.startsWith('knowledge_'))
        .map(k => k.replace('knowledge_', ''));
      console.log(`🔍 Looking for knowledge questions matching ${targetQuestionIds.length} answer IDs`);
    }

    // First, look up the student record ID from the auth user ID
    // Questions are saved with students.id, not auth.user.id
    const studentRecordId = await getStudentRecordId(authUserId);

    // Try with student record ID first (this is how questions are saved)
    if (studentRecordId) {
      console.log(`📡 Fetching knowledge questions for student_id: ${studentRecordId}`);

      const { data: allQuestionSets, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('id, questions, created_at')
        .eq('student_id', studentRecordId)
        .eq('question_type', 'knowledge')
        .order('created_at', { ascending: false });

      console.log(`📡 Knowledge query result: ${allQuestionSets?.length || 0} question sets found, error: ${error?.message || 'none'}`);

      if (!error && allQuestionSets && allQuestionSets.length > 0) {
        const matchingSet = findMatchingQuestionSet(allQuestionSets, targetQuestionIds);
        return transformKnowledgeQuestions(matchingSet);
      }
    }

    // Fallback: Try with auth user ID directly (in case questions were saved with auth ID)
    console.log(`📡 Fallback: Fetching knowledge questions with auth user id: ${authUserId}`);
    const { data: fallbackQuestionSets, error: fallbackError } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, created_at')
      .eq('student_id', authUserId)
      .eq('question_type', 'knowledge')
      .order('created_at', { ascending: false });

    console.log(`📡 Fallback knowledge query result: ${fallbackQuestionSets?.length || 0} question sets found`);

    if (!fallbackError && fallbackQuestionSets && fallbackQuestionSets.length > 0) {
      const matchingSet = findMatchingQuestionSet(fallbackQuestionSets, targetQuestionIds);
      return transformKnowledgeQuestions(matchingSet);
    }

    console.log('No AI knowledge questions found in database');
    return [];
  } catch (err) {
    console.error('Error fetching AI knowledge questions:', err);
    return [];
  }
};

// Helper function to transform knowledge questions
const transformKnowledgeQuestions = (questionSet: any): any[] => {
  if (!questionSet || !questionSet.questions) return [];

  const questions = questionSet.questions.map((q: any) => ({
    ...q,
    correct: q.correct_answer,
    correctAnswer: q.correct_answer
  }));

  console.log(`📚 Fetched ${questions.length} AI knowledge questions from database`);
  return questions;
};

interface Section {
  id: string;
  title: string;
  questions: any[];
  isTimed?: boolean;
  timeLimit?: number;
}

interface SubmissionOptions {
  answers: Record<string, any>;
  sections: Section[];
  studentStream: string | null;
  gradeLevel: GradeLevel | null;
  sectionTimings: Record<string, number>;
  currentAttempt: any;
  userId: string | null;
  timeRemaining: number | null;
  elapsedTime: number;
  selectedCategory?: string | null;
}

interface UseAssessmentSubmissionResult {
  isSubmitting: boolean;
  error: string | null;
  submit: (options: SubmissionOptions) => Promise<void>;
}

/**
 * Get section ID mapping for different grade levels
 */
const getSectionId = (baseSection: string, gradeLevel: GradeLevel | null): string => {
  if (gradeLevel === 'middle') {
    const map: Record<string, string> = {
      'riasec': 'middle_interest_explorer',
      'bigfive': 'middle_strengths_character',
      'knowledge': 'middle_learning_preferences'
    };
    return map[baseSection] || baseSection;
  }
  if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    const map: Record<string, string> = {
      'riasec': 'hs_interest_explorer',
      'aptitude': 'hs_aptitude_sampling',
      'bigfive': 'hs_strengths_character',
      'knowledge': 'hs_learning_preferences'
    };
    return map[baseSection] || baseSection;
  }
  return baseSection;
};

/**
 * Get questions for a specific section
 * FIXED: Import questions directly from data files instead of relying on sections array
 */
const getQuestionsForSection = (sections: Section[], sectionId: string): any[] => {
  const section = sections.find(s => s.id === sectionId);

  // If section has questions, use them
  if (section?.questions && section.questions.length > 0) {
    return section.questions;
  }

  // FALLBACK: Return empty array - questions will be imported directly below
  return [];
};

/**
 * Hook for handling assessment submission
 */
export const useAssessmentSubmission = (): UseAssessmentSubmissionResult => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async ({
    answers,
    sections,
    studentStream,
    gradeLevel,
    sectionTimings,
    currentAttempt,
    userId,
    timeRemaining,
    elapsedTime,
    selectedCategory
  }: SubmissionOptions) => {



    setIsSubmitting(true);
    setError(null);

    // Capture final section timing
    const finalTimings = { ...sectionTimings };
    const lastSection = sections[sections.length - 1];
    if (lastSection && !finalTimings[lastSection.id]) {
      const timeSpent = lastSection.isTimed
        ? (lastSection.timeLimit || 0) - (timeRemaining || 0)
        : elapsedTime;
      finalTimings[lastSection.id] = timeSpent;
    }

    try {


      // ✅ Derive category from stream if not explicitly provided
      let derivedCategory = selectedCategory;
      if (!derivedCategory && studentStream) {
        const streamLower = studentStream.toLowerCase();
        if (streamLower.includes('science') || streamLower.includes('pcm') || streamLower.includes('pcb')) {
          derivedCategory = 'science';
        } else if (streamLower.includes('commerce')) {
          derivedCategory = 'commerce';
        } else if (streamLower.includes('arts') || streamLower.includes('humanities')) {
          derivedCategory = 'arts';
        }

      }

      // ✅ CRITICAL FIX: Fetch student context for all students to get their actual grade
      // This ensures career recommendations are age-appropriate
      let studentContext: any = {};

      if (userId) {
        try {

          const { data: student, error: studentError } = await supabase
            .from('students')
            .select(`
              grade,
              branch_field,
              course_name,
              program_id,
              programs (
                name,
                code,
                degree_level
              )
            `)
            .eq('user_id', userId)
            .maybeSingle();

          if (!studentError && student) {
            // Extract degree level from grade or program
            const extractDegreeLevel = (grade: string | null, programDegreeLevel: string | null): string | null => {
              if (programDegreeLevel) return programDegreeLevel;
              if (!grade) return null;
              const gradeStr = grade.toLowerCase();
              if (gradeStr.includes('pg') || gradeStr.includes('postgraduate') ||
                gradeStr.includes('m.tech') || gradeStr.includes('mtech') ||
                gradeStr.includes('mca') || gradeStr.includes('mba') ||
                gradeStr.includes('m.sc') || gradeStr.includes('msc')) {
                return 'postgraduate';
              }
              if (gradeStr.includes('ug') || gradeStr.includes('undergraduate') ||
                gradeStr.includes('b.tech') || gradeStr.includes('btech') ||
                gradeStr.includes('bca') || gradeStr.includes('b.sc') ||
                gradeStr.includes('b.com') || gradeStr.includes('ba ') ||
                gradeStr.includes('bba')) {
                return 'undergraduate';
              }
              if (gradeStr.includes('diploma')) {
                return 'diploma';
              }
              return null;
            };

            // Priority: program.name > program.code > course_name > branch_field
            const programName = (student.programs as any)?.name ||
              (student.programs as any)?.code ||
              student.course_name ||
              student.branch_field;
            const programCode = (student.programs as any)?.code || null;
            const degreeLevel = extractDegreeLevel(
              student.grade,
              (student.programs as any)?.degree_level
            );

            // ✅ FIX: For higher_secondary, include the selected stream in rawGrade
            // This ensures AI knows if student is in Arts/Science/Commerce
            let enhancedGrade = student.grade;
            if (gradeLevel === 'higher_secondary' && studentStream) {
              // Map stream ID to readable name
              const streamMap: Record<string, string> = {
                'science': 'Science',
                'commerce': 'Commerce',
                'arts': 'Arts'
              };
              const streamName = streamMap[studentStream] || studentStream;
              enhancedGrade = `${student.grade} - ${streamName}`;
              console.log(`✅ Enhanced grade for higher_secondary: "${enhancedGrade}"`);
            }

            studentContext = {
              rawGrade: enhancedGrade,
              grade: student.grade, // Keep original grade too
              programName: programName,
              programCode: programCode,
              degreeLevel: degreeLevel,
              selectedStream: studentStream, // Include the selected stream
              selectedCategory: derivedCategory // Include the category (arts/science/commerce)
            };


          } else {
            console.warn('⚠️ Could not fetch student context:', studentError?.message);
          }
        } catch (contextError) {
          console.error('❌ Error fetching student context:', contextError);
        }
      }

      // ✅ FIX: If no student record but we have a stream selection, still include it
      if (Object.keys(studentContext).length === 0 && studentStream && gradeLevel === 'higher_secondary') {
        const streamMap: Record<string, string> = {
          'science': 'Science',
          'commerce': 'Commerce',
          'arts': 'Arts'
        };
        const streamName = streamMap[studentStream] || studentStream;
        studentContext = {
          rawGrade: `Grade 11/12 - ${streamName}`,
          selectedStream: studentStream,
          selectedCategory: derivedCategory
        };

      }

      // Save to database WITHOUT AI analysis
      // AI analysis will be generated on-demand when viewing result (same as Regenerate)
      let attemptId = currentAttempt?.id;

      if (!attemptId && userId) {

        try {
          const { data: latestAttempt } = await supabase
            .from('personal_assessment_attempts')
            .select('id, stream_id, grade_level')
            .eq('student_id', userId)
            .eq('status', 'in_progress')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestAttempt) {
            attemptId = latestAttempt.id;

          }
        } catch (fetchErr: any) {
          console.log('Could not fetch latest attempt:', fetchErr.message);
        }
      }

      // ✅ CRITICAL FIX: Store studentContext in the attempt for later use
      // This ensures the AI analysis can access program information when generating career clusters
      if (attemptId && Object.keys(studentContext).length > 0) {
        try {

          const { error: contextError } = await supabase
            .from('personal_assessment_attempts')
            .update({
              student_context: studentContext
            })
            .eq('id', attemptId);

          if (contextError) {
            console.warn('⚠️ Could not store student context:', contextError.message);
          } else {

          }
        } catch (contextUpdateError) {
          console.error('❌ Error storing student context:', contextUpdateError);
        }
      }

      // Save completion to database
      if (attemptId && userId) {
        try {
          console.log('🚀 [UNIFIED LOADER] Starting AI analysis during submission...');
          console.log('🚀 [UNIFIED LOADER] This will show ONE loader for the entire process');
          
          // ============================================================================
          // STAGE 1: PREPARING (0-10%)
          // ============================================================================
          console.log('📊 [Stage 1/6] Preparing your responses...');
          window.setAnalysisProgress?.('preparing', 'Organizing assessment data...');
          
          // Fetch adaptive aptitude results if available
          let adaptiveResults = null;
          if (currentAttempt?.adaptive_aptitude_session_id) {
            console.log('🔍 [Preparing] Fetching adaptive aptitude results...');
            console.log('🔍 [Preparing] Session ID:', currentAttempt.adaptive_aptitude_session_id);
            
            try {
              const { data: adaptiveData, error: adaptiveError } = await supabase
                .from('adaptive_aptitude_results')
                .select('*')
                .eq('session_id', currentAttempt.adaptive_aptitude_session_id)
                .maybeSingle();
              
              if (!adaptiveError && adaptiveData) {
                adaptiveResults = adaptiveData;
                console.log('✅ [Preparing] Adaptive results fetched:', {
                  level: adaptiveData.aptitude_level,
                  accuracy: adaptiveData.overall_accuracy,
                  totalQuestions: adaptiveData.total_questions,
                  totalCorrect: adaptiveData.total_correct
                });
              } else {
                console.warn('⚠️ [Preparing] No adaptive results found:', adaptiveError?.message);
              }
            } catch (adaptiveErr) {
              console.error('❌ [Preparing] Error fetching adaptive results:', adaptiveErr);
            }
          } else {
            console.log('ℹ️ [Preparing] No adaptive session ID found in attempt');
          }
          
          // Merge answers with adaptive results for AI analysis
          const answersWithAdaptive = { ...answers };
          console.log('📦 [Preparing] Prepared answers:', {
            totalAnswers: Object.keys(answersWithAdaptive).length,
            hasAdaptiveResults: !!adaptiveResults
          });
          
          // Small delay to show preparing stage
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // ============================================================================
          // STAGE 2: SENDING (10-20%)
          // ============================================================================
          console.log('📊 [Stage 2/6] Connecting to AI engine...');
          window.setAnalysisProgress?.('sending', 'Sending your responses to AI...');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // ============================================================================
          // STAGE 3: AI ANALYZING (20-70%) - THE MAIN EVENT
          // ============================================================================
          console.log('📊 [Stage 3/6] AI Analysis starting...');
          console.log('⏱️ [AI Analysis] Starting timer...');
          window.setAnalysisProgress?.('analyzing', 'AI is analyzing your assessment...');
          
          const aiStartTime = Date.now();
          let geminiResults = null;
          
          try {
            console.log('🤖 [AI Analysis] Calling analyzeAssessmentWithGemini...');
            console.log('🤖 [AI Analysis] Parameters:', {
              hasAnswers: !!answersWithAdaptive,
              answerCount: Object.keys(answersWithAdaptive).length,
              stream: studentStream,
              gradeLevel: gradeLevel || 'after12',
              hasQuestionBanks: !!(riasecQuestions && bigFiveQuestions),
              hasTimings: !!finalTimings,
              hasAdaptiveResults: !!adaptiveResults,
              adaptiveSessionId: currentAttempt?.adaptive_aptitude_session_id
            });
            
            // Call AI analysis with all data
            geminiResults = await analyzeAssessmentWithGemini(
              answersWithAdaptive,
              studentStream,
              {
                riasecQuestions,
                aptitudeQuestions: [], // Adaptive aptitude is separate
                bigFiveQuestions,
                workValuesQuestions,
                employabilityQuestions,
                streamKnowledgeQuestions
              },
              finalTimings,
              gradeLevel || 'after12',
              null, // preCalculatedScores
              studentContext,
              adaptiveResults
            );
            
            const aiDuration = ((Date.now() - aiStartTime) / 1000).toFixed(1);
            console.log(`✅ [AI Analysis] Completed successfully in ${aiDuration}s`);
            console.log('✅ [AI Analysis] Results received:', {
              hasRiasec: !!geminiResults?.riasec,
              hasCareerFit: !!geminiResults?.careerFit,
              hasRoadmap: !!geminiResults?.roadmap,
              resultKeys: geminiResults ? Object.keys(geminiResults) : []
            });
            
          } catch (aiError: any) {
            console.error('❌ [AI Analysis] Failed:', aiError);
            console.error('❌ [AI Analysis] Error details:', {
              message: aiError.message,
              code: aiError.code,
              stack: aiError.stack
            });
            
            // Show error in analyzing screen
            window.setAnalysisProgress?.('error', `AI analysis failed: ${aiError.message}`);
            
            throw new Error(`AI analysis failed: ${aiError.message}`);
          }
          
          // ============================================================================
          // STAGE 4: PROCESSING (70-85%)
          // ============================================================================
          console.log('📊 [Stage 4/6] Processing results...');
          window.setAnalysisProgress?.('processing', 'Generating career matches...');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // ============================================================================
          // STAGE 5: SAVING (85-95%)
          // ============================================================================
          console.log('📊 [Stage 5/6] Saving to database...');
          window.setAnalysisProgress?.('saving', 'Saving your personalized report...');
          
          console.log('💾 [Database] Calling completeAttempt WITH AI results...');
          
          const dbResults = await assessmentService.completeAttempt(
            attemptId,
            userId,
            studentStream,
            gradeLevel || 'after12',
            geminiResults, // ← AI results included!
            finalTimings
          );

          console.log('✅ [Database] Assessment saved successfully:', dbResults.id);
          console.log('✅ [Database] AI results are now in database');
          
          // ============================================================================
          // STAGE 6: COMPLETE (95-100%)
          // ============================================================================
          console.log('📊 [Stage 6/6] Complete!');
          window.setAnalysisProgress?.('complete', 'Analysis complete!');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('🎉 [UNIFIED LOADER] All stages complete!');
          console.log('🎉 [UNIFIED LOADER] Total time:', ((Date.now() - aiStartTime) / 1000).toFixed(1) + 's');
          console.log('🎉 [UNIFIED LOADER] Redirecting to results page...');
          console.log('🎉 [UNIFIED LOADER] Results will display IMMEDIATELY (no additional loading)');

          // Navigate with attemptId
          navigate(`/student/assessment/result?attemptId=${attemptId}`);
        } catch (dbErr: any) {
          console.error('❌ [UNIFIED LOADER] Failed:', dbErr);
          console.error('❌ [UNIFIED LOADER] Error details:', {
            message: dbErr.message,
            code: dbErr.code,
            stage: 'submission'
          });
          
          // Show error in analyzing screen
          window.setAnalysisProgress?.('error', dbErr.message || 'Submission failed');
          
          // Provide user-friendly error messages
          let errorMessage = 'Failed to save assessment results. ';
          
          if (dbErr.message?.includes('AI analysis failed')) {
            errorMessage = 'AI analysis encountered an error. ';
          } else if (dbErr.code === 'VALIDATION_ERROR') {
            errorMessage += 'Invalid data detected. Please contact support.';
          } else if (dbErr.code === 'ATTEMPT_UPDATE_FAILED') {
            errorMessage += 'Could not mark assessment as complete. Your answers are saved, but you may need to resubmit.';
          } else if (dbErr.code === 'RESULT_INSERT_FAILED') {
            errorMessage += 'Could not create result record. Your answers are saved. Please try viewing results again.';
          } else if (dbErr.message?.includes('network') || dbErr.message?.includes('fetch')) {
            errorMessage += 'Network error. Please check your connection and try again.';
          } else {
            errorMessage += 'Please try again or contact support if the issue persists.';
          }
          
          // If we have an attemptId, try to navigate anyway (data might be partially saved)
          if (attemptId) {
            console.log('⚠️ [UNIFIED LOADER] Attempting to navigate to results despite error...');
            const shouldNavigate = confirm(
              `${errorMessage}\n\nYour answers may be saved. Would you like to try viewing your results?`
            );
            
            if (shouldNavigate) {
              navigate(`/student/assessment/result?attemptId=${attemptId}`);
            } else {
              setError(errorMessage);
              setIsSubmitting(false);
            }
          } else {
            // No attemptId - show error and stay on assessment page
            alert(errorMessage);
            setError(errorMessage);
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        console.log('❌ No attemptId or userId available - cannot save results');
        const errorMessage = 'Assessment data not found. Please ensure you started the assessment properly.';
        alert(errorMessage);
        setError(errorMessage);
        setIsSubmitting(false);
        return;
      }
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setIsSubmitting(false);

      const errorMessage = err.message || 'Failed to submit assessment. Please try again.';
      console.error('❌ Assessment submission failed:', errorMessage);

      alert(`Assessment Submission Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    }
  }, [navigate]);

  return {
    isSubmitting,
    error,
    submit
  };
};

export default useAssessmentSubmission;