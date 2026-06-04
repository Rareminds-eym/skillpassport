/**
 * useAssessmentSubmission Hook
 * 
 * Handles assessment submission with proper learner context for school and college learners
 * 
 * @module features/assessment/career-test/hooks/useAssessmentSubmission
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore - JS service without type declarations
import { analyzeAssessmentWithGemini } from '../api/geminiAssessmentService';
// @ts-ignore - JS service without type declarations
import * as assessmentService from '../api/assessmentApiService';
import type { GradeLevel } from '../model/types';
import { useAssessmentStore } from './assessmentStore';

// Import static question banks for fallback
// @ts-ignore - JS exports
import {
  riasecQuestions,
  bigFiveQuestions,
  workValuesQuestions,
  employabilityQuestions,
  streamKnowledgeQuestions,
} from '@/features/assessment';

// ============================================================================
// TYPES
// ============================================================================

interface LearnerContext {
  rawGrade: string;
  grade?: string | null;
  programName?: string;
  programCode?: string | null;
  degreeLevel?: string | null;
  selectedStream?: string | null;
  selectedCategory?: string | null;
  learnerType?: 'school' | 'college' | 'general';
}

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
  learnerStream: string | null;
  gradeLevel: GradeLevel | null;
  sectionTimings: Record<string, number>;
  currentAttempt: any;
  userId: string | null;
  timeRemaining: number | null;
  elapsedTime: number;
  selectedCategory?: string | null;
  learnerProgram?: string | null;
}

interface UseAssessmentSubmissionResult {
  isSubmitting: boolean;
  error: string | null;
  submit: (options: SubmissionOptions) => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the learner record ID from auth user ID
 */
const getlearnerRecordId = async (authUserId: string): Promise<string | null> => {
  try {
    const { data: learner, error } = await supabase
      .from('learners')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (error || !learner) {
      return null;
    }

    return learner.id;
  } catch (err) {
    console.error('Error looking up learner record:', err);
    return null;
  }
};

/**
 * Determine learner type from all available sources
 */
const determinelearnerType = (
  grade: string | null,
  programId: string | null,
  degreeLevel: string | null,
  schoolId: string | null,
  collegeId: string | null,
  learnerTypeField: string | null,
  userMetadataRole: string | null
): 'school' | 'college' | 'general' => {
  // Priority 1: College learners have program_id, degree_level, or college_id
  // Check this FIRST because learner_type field might be incorrect
  if (programId || degreeLevel || collegeId) {
    return 'college';
  }

  // Priority 2: Use learner_type field if available
  if (learnerTypeField === 'school') return 'school';
  if (learnerTypeField === 'college') return 'college';

  // Priority 3: Use user metadata role
  if (userMetadataRole) {
    if (userMetadataRole.includes('school')) return 'school';
    if (userMetadataRole.includes('college')) return 'college';
  }

  // Priority 4: School learners have school_id
  if (schoolId) {
    return 'school';
  }

  // Priority 5: Check grade format
  if (grade) {
    const gradeLower = grade.toLowerCase();
    if (
      gradeLower.includes('grade') ||
      gradeLower.includes('class') ||
      /^(6|7|8|9|10|11|12)$/.test(grade)
    ) {
      return 'school';
    }
  }

  return 'general';
};

/**
 * Extract degree level from various sources
 */
const extractDegreeLevel = (
  grade: string | null,
  programDegreeLevel: string | null,
  programName: string | null
): string | null => {
  // Priority 1: Explicit degree level from program
  if (programDegreeLevel) {
    return programDegreeLevel;
  }

  // Priority 2: Extract from program name
  if (programName) {
    const programLower = programName.toLowerCase();
    
    // Undergraduate patterns
    if (
      programLower.includes('bachelor') ||
      programLower.includes('b.tech') ||
      programLower.includes('btech') ||
      programLower.includes('bca') ||
      programLower.includes('b.sc') ||
      programLower.includes('bsc') ||
      programLower.includes('b.com') ||
      programLower.includes('bcom') ||
      programLower.includes('ba ') ||
      programLower.includes('bba')
    ) {
      return 'undergraduate';
    }

    // Postgraduate patterns
    if (
      programLower.includes('master') ||
      programLower.includes('m.tech') ||
      programLower.includes('mtech') ||
      programLower.includes('mca') ||
      programLower.includes('mba') ||
      programLower.includes('m.sc') ||
      programLower.includes('msc')
    ) {
      return 'postgraduate';
    }

    // Diploma patterns
    if (programLower.includes('diploma')) {
      return 'diploma';
    }
  }

  // Priority 3: Extract from grade string
  if (grade) {
    const gradeLower = grade.toLowerCase();
    
    if (
      gradeLower.includes('pg') ||
      gradeLower.includes('postgraduate') ||
      gradeLower.includes('m.tech') ||
      gradeLower.includes('mtech') ||
      gradeLower.includes('mca') ||
      gradeLower.includes('mba') ||
      gradeLower.includes('m.sc') ||
      gradeLower.includes('msc')
    ) {
      return 'postgraduate';
    }

    if (
      gradeLower.includes('ug') ||
      gradeLower.includes('undergraduate') ||
      gradeLower.includes('b.tech') ||
      gradeLower.includes('btech') ||
      gradeLower.includes('bca') ||
      gradeLower.includes('b.sc') ||
      gradeLower.includes('b.com') ||
      gradeLower.includes('ba ') ||
      gradeLower.includes('bba')
    ) {
      return 'undergraduate';
    }

    if (gradeLower.includes('diploma')) {
      return 'diploma';
    }
  }

  return null;
};

/**
 * Build enhanced grade string for display
 */
const buildEnhancedGrade = (
  grade: string | null,
  programName: string | null,
  learnerStream: string | null,
  gradeLevel: GradeLevel | null
): string => {
  // For college learners with program name
  if (programName) {
    const programLower = programName.toLowerCase();
    
    // Check if it's a UG program
    if (
      programLower.includes('bachelor') ||
      programLower.includes('b.tech') ||
      programLower.includes('bca') ||
      programLower.includes('b.sc') ||
      programLower.includes('b.com') ||
      programLower.includes('bba')
    ) {
      return `UG - ${programName}`;
    }

    // Check if it's a PG program
    if (
      programLower.includes('master') ||
      programLower.includes('m.tech') ||
      programLower.includes('mca') ||
      programLower.includes('mba') ||
      programLower.includes('m.sc')
    ) {
      return `PG - ${programName}`;
    }

    // Check if it's a Diploma
    if (programLower.includes('diploma')) {
      return `Diploma - ${programName}`;
    }

    // If grade is UG/PG, use it with program name
    if (grade && (grade.toUpperCase() === 'UG' || grade.toUpperCase() === 'PG')) {
      return `${grade.toUpperCase()} - ${programName}`;
    }

    return programName;
  }

  // For school learners with grade
  if (grade) {
    // For higher_secondary (Grade 11/12), include stream
    if (gradeLevel === 'higher_secondary' && learnerStream) {
      const streamMap: Record<string, string> = {
        science: 'Science',
        commerce: 'Commerce',
        arts: 'Arts',
        humanities: 'Humanities',
      };
      const streamName = streamMap[learnerStream.toLowerCase()] || learnerStream;
      return `${grade} - ${streamName}`;
    }

    // For highschool (Grade 9/10), format as "Grade 9" or "Grade 10"
    if (gradeLevel === 'highschool') {
      // Check if grade is just a number (9 or 10)
      const gradeNum = parseInt(String(grade));
      if (gradeNum === 9) {
        return 'Grade 9';
      }
      if (gradeNum === 10) {
        return 'Grade 10';
      }
      // If grade already has "Grade" prefix, return as-is
      if (String(grade).toLowerCase().includes('grade')) {
        return grade;
      }
      // Otherwise, add "Grade" prefix
      return `Grade ${grade}`;
    }

    return grade;
  }

  // Fallback based on gradeLevel (only for non-highschool grades)
  if (gradeLevel === 'after12') {
    return 'after12';
  }

  if (gradeLevel === 'after10') {
    return 'after10';
  }

  if (gradeLevel === 'higher_secondary') {
    const streamMap: Record<string, string> = {
      science: 'Science',
      commerce: 'Commerce',
      arts: 'Arts',
      humanities: 'Humanities',
    };
    const streamName = learnerStream ? streamMap[learnerStream.toLowerCase()] || learnerStream : 'General';
    return `Grade 11/12 - ${streamName}`;
  }

  if (gradeLevel === 'middle') {
    return 'Grade 6-8';
  }

  // No fallback for highschool - grade must be present in database
  return 'Learner';
};

/**
 * Derive category from stream
 */
const deriveCategory = (learnerStream: string | null): string | null => {
  if (!learnerStream) return null;

  const streamLower = learnerStream.toLowerCase();

  if (
    streamLower.includes('science') ||
    streamLower.includes('pcm') ||
    streamLower.includes('pcb') ||
    streamLower.includes('pcmb')
  ) {
    return 'science';
  }

  if (streamLower.includes('commerce')) {
    return 'commerce';
  }

  if (streamLower.includes('arts') || streamLower.includes('humanities')) {
    return 'arts';
  }

  return null;
};

/**
 * Build complete learner context from database
 */
const buildlearnerContext = async (
  userId: string,
  learnerStream: string | null,
  gradeLevel: GradeLevel | null,
  selectedCategory: string | null,
  learnerProgram?: string | null
): Promise<LearnerContext> => {
  console.log('[LEARNER-CONTEXT] Building context with:', { userId, learnerStream, gradeLevel, selectedCategory, learnerProgram });
  
  try {
    // Fetch learner record
    console.log('[LEARNER-CONTEXT] Fetching learner record for user_id:', userId);
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select(`
        grade,
        branch_field,
        course_name,
        program_id,
        learner_type,
        school_id,
        college_id,
        programs (
          name,
          code,
          degree_level
        )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[LEARNER-CONTEXT] Learner query result:', { learner, learnerError });

    if (learnerError || !learner) {
      console.warn('⚠️ Could not fetch learner record:', learnerError?.message);
      console.warn('⚠️ Falling back to fallback context');
      return buildFallbackContext(learnerStream, gradeLevel, selectedCategory, learnerProgram);
    }

    // Extract program information
    const programName =
      (learner.programs as any)?.name ||
      (learner.programs as any)?.code ||
      learner.course_name ||
      learner.branch_field ||
      null;

    const programCode = (learner.programs as any)?.code || null;
    const programDegreeLevel = (learner.programs as any)?.degree_level || null;

    // Determine degree level
    const degreeLevel = extractDegreeLevel(learner.grade, programDegreeLevel, programName);

    // Determine learner type using all available sources
    const learnerType = determinelearnerType(
      learner.grade,
      learner.program_id,
      degreeLevel,
      (learner as any).school_id,
      (learner as any).college_id,
      (learner as any).learner_type,
      null // userMetadata not available
    );

    // Build enhanced grade
    const enhancedGrade = buildEnhancedGrade(learner.grade, programName, learnerStream, gradeLevel);

    // Derive category
    const category = selectedCategory || deriveCategory(learnerStream);

    const context: LearnerContext = {
      rawGrade: enhancedGrade,
      grade: learner.grade,
      programName: programName || undefined,
      programCode: programCode,
      degreeLevel: degreeLevel,
      selectedStream: learnerStream,
      selectedCategory: category,
      learnerType: learnerType,
    };

    console.log('✅ [LEARNER-CONTEXT] Built from database:', JSON.stringify(context, null, 2));
    return context;
  } catch (contextError) {
    console.error('❌ Error building learner context:', contextError);
    return buildFallbackContext(learnerStream, gradeLevel, selectedCategory, learnerProgram);
  }
};

/**
 * Build fallback context when learner record is not available
 */
const buildFallbackContext = (
  learnerStream: string | null,
  gradeLevel: GradeLevel | null,
  selectedCategory: string | null,
  learnerProgram?: string | null
): LearnerContext => {
  console.log('[LEARNER-CONTEXT] Building fallback context with:', { learnerStream, gradeLevel, selectedCategory, learnerProgram });
  
  const category = selectedCategory || deriveCategory(learnerStream);
  
  // For college learners, try to build a better grade string
  let enhancedGrade = 'Learner';
  let degreeLevel: string | null = null;
  
  if (gradeLevel === 'college' && learnerProgram) {
    // Extract degree level from program name
    const programLower = learnerProgram.toLowerCase();
    if (programLower.includes('bachelor') || programLower.includes('b.tech') || programLower.includes('btech')) {
      degreeLevel = 'undergraduate';
      enhancedGrade = `UG - ${learnerProgram}`;
    } else if (programLower.includes('master') || programLower.includes('m.tech') || programLower.includes('mtech')) {
      degreeLevel = 'postgraduate';
      enhancedGrade = `PG - ${learnerProgram}`;
    } else {
      enhancedGrade = learnerProgram;
    }
  } else {
    enhancedGrade = buildEnhancedGrade(null, learnerProgram ?? null, learnerStream, gradeLevel);
  }

  const context: LearnerContext = {
    rawGrade: enhancedGrade,
    selectedStream: learnerStream,
    selectedCategory: category,
    learnerType: gradeLevel === 'college' ? 'college' : 'general',
    programName: learnerProgram ?? undefined,
    degreeLevel: degreeLevel,
  };

  console.log('✅ [LEARNER-CONTEXT] Built fallback context:', JSON.stringify(context, null, 2));
  return context;
};

/**
 * Store learner context in assessment attempt
 */
const storelearnerContext = async (attemptId: string, context: LearnerContext): Promise<void> => {
  try {
    // Check if context has meaningful data
    const hasMeaningfulData = context.rawGrade && context.rawGrade.trim() !== '';

    if (!hasMeaningfulData) {
      console.warn('⚠️ [LEARNER-CONTEXT] Skipping update - no meaningful data');
      return;
    }

    console.log('📝 [LEARNER-CONTEXT] Storing context:', {
      attemptId,
      contextData: JSON.stringify(context, null, 2),
    });

    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({ learner_context: context })
      .eq('id', attemptId)
      .select();

    if (error) {
      console.error('❌ [LEARNER-CONTEXT] Failed to store:', error);
    } else {
      console.log('✅ [LEARNER-CONTEXT] Successfully stored');
      console.log('✅ [LEARNER-CONTEXT] Updated record:', data);
    }
  } catch (err) {
    console.error('❌ [LEARNER-CONTEXT] Exception:', err);
  }
};

/**
 * Fetch adaptive aptitude results
 */
const fetchAdaptiveResults = async (sessionId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('adaptive_aptitude_results')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error || !data) {
      console.warn('⚠️ No adaptive results found:', error?.message);
      return null;
    }

    console.log('✅ Adaptive results fetched:', {
      level: data.aptitude_level,
      accuracy: data.overall_accuracy,
      totalQuestions: data.total_questions,
      totalCorrect: data.total_correct,
    });

    return data;
  } catch (err) {
    console.error('❌ Error fetching adaptive results:', err);
    return null;
  }
};

/**
 * Computes the Stream Knowledge score from the knowledge section's questions and
 * the learner's answers.
 *
 * WHY: For college/comprehensive assessments the AI does not reliably score the
 * stream-knowledge MCQs, and the DB trigger is skipped for adaptive rows. The
 * knowledge questions carry a `correct` field and the learner's answers are stored
 * by question id, so we score them deterministically here and inject the result
 * into geminiResults.knowledge before saving.
 *
 * @param sections - Built assessment sections (knowledge section carries `correct`)
 * @param answers - Learner answers keyed by question id
 * @returns knowledge details (score 0-100, counts) or null when no knowledge section/questions
 */
const computeKnowledgeScore = (
  sections: any[],
  answers: Record<string, any>
): { score: number; correctCount: number; totalQuestions: number } | null => {
  const knowledgeSection = sections?.find(
    (s) =>
      s?.name === 'knowledge' ||
      s?.id === 'knowledge' ||
      (typeof s?.id === 'string' && s.id.startsWith('knowledge'))
  );

  const questions = knowledgeSection?.questions ?? [];
  if (!questions.length) return null;

  let correctCount = 0;
  let totalQuestions = 0;

  for (const q of questions) {
    const correct = q?.correct ?? q?.correct_answer ?? q?.correctAnswer;
    if (correct == null) continue;

    totalQuestions++;
    const given = answers[String(q.id)];
    if (given != null && String(given).trim() === String(correct).trim()) {
      correctCount++;
    }
  }

  if (totalQuestions === 0) return null;

  return {
    score: Math.round((correctCount / totalQuestions) * 100),
    correctCount,
    totalQuestions,
  };
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for handling assessment submission
 */
export const useAssessmentSubmission = (): UseAssessmentSubmissionResult => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async ({
      answers,
      sections,
      learnerStream,
      gradeLevel,
      sectionTimings,
      currentAttempt,
      userId,
      timeRemaining,
      elapsedTime,
      selectedCategory,
      learnerProgram,
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
        if (!userId) {
          throw new Error('User ID is required for assessment submission');
        }

        // ============================================================================
        // STEP 1: Get learner record ID
        // ============================================================================
        let learnerRecordId = await getlearnerRecordId(userId);
        if (!learnerRecordId) {
          console.warn('⚠️ No learner record found, using auth user_id directly');
          learnerRecordId = userId;
        }

        if (!learnerRecordId) {
          throw new Error('User ID is required for assessment submission');
        }

        // ============================================================================
        // STEP 2: Get or verify attempt ID
        // ============================================================================
        let attemptId = currentAttempt?.id;

        if (!attemptId) {
          try {
            const { data: latestAttempt } = await supabase
              .from('personal_assessment_attempts')
              .select('id, stream_id, grade_level')
              .eq('learner_id', learnerRecordId)
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

        if (!attemptId) {
          throw new Error('Assessment attempt not found. Please start the assessment again.');
        }

        // ============================================================================
        // STEP 3: Build and store learner context
        // ============================================================================
        console.log('📊 [Stage 1/6] Preparing your responses...');
        window.setAnalysisProgress?.('preparing', 'Organizing assessment data...');

        // Try to fetch existing learner context from the attempt first
        let finalLearnerContext: LearnerContext | null = null;
        
        try {
          const { data: attemptData } = await supabase
            .from('personal_assessment_attempts')
            .select('learner_context')
            .eq('id', attemptId)
            .single();
          
          if (attemptData?.learner_context) {
            console.log('✅ Using existing learner context from attempt:', attemptData.learner_context);
            finalLearnerContext = attemptData.learner_context as LearnerContext;
          }
        } catch (fetchErr) {
          console.warn('⚠️ Could not fetch existing learner context:', fetchErr);
        }
        
        // If no existing context, build a new one
        if (!finalLearnerContext) {
          console.log('🔨 Building new learner context...');
          finalLearnerContext = await buildlearnerContext(
            userId!,
            learnerStream,
            gradeLevel,
            selectedCategory || null,
            learnerProgram || null
          );
          
          // Save the newly built context
          await storelearnerContext(attemptId, finalLearnerContext);
        }
        
        // Final safety check - ensure we have a valid context
        if (!finalLearnerContext || !finalLearnerContext.rawGrade) {
          console.error('❌ Failed to build learner context, using emergency fallback');
          finalLearnerContext = {
            rawGrade: learnerProgram || gradeLevel || 'Learner',
            selectedStream: learnerStream,
            selectedCategory: selectedCategory || null,
            learnerType: gradeLevel === 'college' ? 'college' : 'general',
            programName: learnerProgram || undefined,
          };
        }
        
        console.log('✅ Final learner context:', finalLearnerContext);

        // ============================================================================
        // STEP 4: Fetch adaptive aptitude results
        // ============================================================================
        console.log('📊 [Stage 1/6] Preparing your responses...');
        window.setAnalysisProgress?.('preparing', 'Organizing assessment data...');
        
        let adaptiveResults = null;

        // Get session ID directly from the store state (not using the hook)
        // We can't use hooks inside async functions, so we access the store directly
        const storeSessionId = useAssessmentStore.getState().adaptiveSessionId;

        console.log('🔍 [Preparing] Looking for adaptive session ID...');
        console.log('🔍 [Preparing] From store:', storeSessionId);
        console.log('🔍 [Preparing] From answers:', answers['adaptive_aptitude_session_id']);

        // Use session ID from store (primary) or answers (fallback)
        const sessionIdFromAnswers = storeSessionId || answers['adaptive_aptitude_session_id'];
        console.log('🔍 [Preparing] Final session ID:', sessionIdFromAnswers);
        
        // If we have a session ID in answers, ensure it's saved to the attempt table
        if (sessionIdFromAnswers && attemptId) {
          console.log('🔗 [Preparing] Ensuring session ID is saved to attempt table...');
          try {
            const { error: updateError } = await supabase
              .from('personal_assessment_attempts')
              .update({ adaptive_aptitude_session_id: sessionIdFromAnswers })
              .eq('id', attemptId);
            
            if (updateError) {
              console.error('❌ [Preparing] Failed to save session ID to attempt:', updateError);
            } else {
              console.log('✅ [Preparing] Session ID saved to attempt table');
            }
          } catch (saveErr) {
            console.error('❌ [Preparing] Error saving session ID:', saveErr);
          }
        }
        
        // Refetch attempt to verify session ID is saved
        const { data: latestAttempt, error: attemptError } = await supabase
          .from('personal_assessment_attempts')
          .select('adaptive_aptitude_session_id, grade_level')
          .eq('id', attemptId)
          .maybeSingle();
        
        if (attemptError) {
          console.error('❌ [Preparing] Error refetching attempt:', attemptError);
        } else {
          console.log('✅ [Preparing] Latest attempt data:', latestAttempt);
        }
        
        // Use session ID from answers, fallback to attempt's saved session ID
        // (for high school/simplified assessments that might have adaptive linked from elsewhere)
        const sessionId = sessionIdFromAnswers || latestAttempt?.adaptive_aptitude_session_id;
        const attemptGradeLevel = latestAttempt?.grade_level || gradeLevel;

        console.log('🔗 [Preparing] Final session ID to use:', sessionId);
        console.log('🔗 [Preparing] From answers:', sessionIdFromAnswers, '| From attempt:', latestAttempt?.adaptive_aptitude_session_id);
        
        // Check if this grade level uses adaptive aptitude
        const usesAdaptiveAptitude = ['middle', 'highschool', 'after10', 'after12', 'college', 'higher_secondary'].includes(attemptGradeLevel || '');
        
        if (sessionId && usesAdaptiveAptitude) {
          console.log('📋 [Preparing] Adaptive session ID found:', sessionId);
          console.log('📋 [Preparing] Grade level:', attemptGradeLevel);
          console.log('ℹ️ [Preparing] Backend will fetch and validate adaptive results using service role');
          
          // NOTE: We do NOT query adaptive_aptitude_results or adaptive_aptitude_sessions here because:
          // 1. Frontend uses authenticated client which may not have RLS access
          // 2. Backend save-results handler uses service role and will fetch/validate the results
          // 3. This prevents 400 Bad Request errors from RLS policies
          
          // Just pass the session ID to the backend - it will handle everything
          adaptiveResults = null; // Backend will fetch this
        } else if (!sessionId && usesAdaptiveAptitude) {
          console.info('ℹ️ [Preparing] No adaptive session ID in current answers - backend will auto-link completed session if available');
        } else {
          console.log('ℹ️ [Preparing] Grade level does not use adaptive aptitude test');
        }
        
        // Log prepared answers
        console.log('📦 [Preparing] Prepared answers:', {
          totalAnswers: Object.keys(answers).length,
          adaptiveSessionId: sessionId || 'none'
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // ============================================================================
        // STEP 5: Send to AI for analysis
        // ============================================================================
        console.log('📊 [Stage 2/6] Connecting to AI engine...');
        window.setAnalysisProgress?.('sending', 'Sending your responses to AI...');

        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('📊 [Stage 3/6] AI Analysis starting...');
        window.setAnalysisProgress?.('analyzing', 'AI is analyzing your assessment...');

        const aiStartTime = Date.now();
        let geminiResults = null;

        try {
          console.log('🤖 [AI Analysis] Calling analyzeAssessmentWithGemini...');
          console.log('🤖 [AI Analysis] Parameters:', {
            answerCount: Object.keys(answers).length,
            stream: learnerStream,
            gradeLevel: gradeLevel || 'after12',
            hasAdaptiveResults: !!adaptiveResults,
            learnerContext: finalLearnerContext,
          });

          // ============================================================================
          // SKIP FRONTEND PRE-CALCULATION - Let backend handle all score calculations
          // Backend has access to full question metadata (categoryMapping, riasecType, etc.)
          // and can calculate scores more accurately
          // ============================================================================
          console.log('📊 [Pre-calculation] Skipping frontend calculation - backend will handle all scores');

          geminiResults = await analyzeAssessmentWithGemini(
            answers,
            learnerStream,
            {
              riasecQuestions,
              aptitudeQuestions: [],
              bigFiveQuestions,
              workValuesQuestions,
              employabilityQuestions,
              streamKnowledgeQuestions,
            },
            finalTimings,
            gradeLevel || 'after12',
            null, // No pre-calculated scores - let backend calculate
            learnerRecordId, // Pass learner ID for course recommendations
            finalLearnerContext,
            adaptiveResults,
            sections
          );

          // Deterministically score Stream Knowledge from the section's correct answers.
          // The AI/DB-trigger paths leave this at 0 for adaptive (college) results, so we
          // override geminiResults.knowledge with the real computed score before saving.
          const knowledgeResult = computeKnowledgeScore(sections, answers);
          if (knowledgeResult && geminiResults) {
            const existingKnowledge = geminiResults.knowledge || {};
            geminiResults.knowledge = {
              ...existingKnowledge,
              score: knowledgeResult.score,
              correctCount: knowledgeResult.correctCount,
              totalQuestions: knowledgeResult.totalQuestions,
            };
            console.log('📚 [Knowledge] Computed stream knowledge score:', knowledgeResult);
          }

          const aiDuration = ((Date.now() - aiStartTime) / 1000).toFixed(1);
          console.log(`✅ [AI Analysis] Completed successfully in ${aiDuration}s`);
          console.log('✅ [AI Analysis] Results received:', {
            hasRiasec: !!geminiResults?.riasec,
            hasCareerFit: !!geminiResults?.careerFit,
            hasRoadmap: !!geminiResults?.roadmap,
          });
        } catch (aiError: any) {
          console.error('❌ [AI Analysis] Failed:', aiError);
          window.setAnalysisProgress?.('error', `AI analysis failed: ${aiError.message}`);
          throw new Error(`AI analysis failed: ${aiError.message}`);
        }

        // ============================================================================
        // STEP 6: Process and save results
        // ============================================================================
        console.log('📊 [Stage 4/6] Processing results...');
        window.setAnalysisProgress?.('processing', 'Generating career matches...');

        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('� [Stage 5/6] Saving to database...');
        window.setAnalysisProgress?.('saving', 'Saving your personalized report...');

        // stream_id should always be the learner's input stream, not the AI recommendation
        // The AI recommendation is stored in gemini_results JSON field
        const finalStreamId = learnerStream;

        // Save completion to database
        if (attemptId && learnerRecordId) {
          try {
            console.log('� [Database] Calling completeAttempt WITH AI results...');
            
            const dbResults = await assessmentService.completeAttempt(
              attemptId,
              learnerRecordId,
              finalStreamId,
              gradeLevel || 'after12',
              geminiResults, // ← AI results included!
              finalTimings
            );

        console.log('✅ [Database] Assessment saved successfully:', dbResults.id);

        // ============================================================================
        // STEP 7: Complete and navigate
        // ============================================================================
        console.log('📊 [Stage 6/6] Complete!');
        window.setAnalysisProgress?.('complete', 'Analysis complete!');

        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('🎉 All stages complete!');
        console.log('🎉 Total time:', ((Date.now() - aiStartTime) / 1000).toFixed(1) + 's');
        console.log('🎉 Redirecting to results page...');

        navigate(`/learner/assessment/result?attemptId=${attemptId}`);
      } catch (err: any) {
        console.error('❌ Assessment submission failed:', err);

        window.setAnalysisProgress?.('error', err.message || 'Submission failed');

        let errorMessage = 'Failed to save assessment results. ';

        if (err.message?.includes('AI analysis failed')) {
          errorMessage = 'AI analysis encountered an error. ';
        } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
          errorMessage += 'Network error. Please check your connection and try again.';
        } else {
          errorMessage += 'Please try again or contact support if the issue persists.';
        }

        alert(`Assessment Submission Error: ${errorMessage}`);
        setError(errorMessage);
        setIsSubmitting(false);
      }
    }
  } catch (err: any) {
    console.error('❌ Outer submission error:', err);
    setError(err.message || 'Submission failed');
    setIsSubmitting(false);
  }
},
[navigate]
);

  return {
    isSubmitting,
    error,
    submit,
  };
};

export default useAssessmentSubmission;
