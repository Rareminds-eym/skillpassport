/**
 * useAssessmentSubmission Hook
 * 
 * Handles assessment submission with proper student context for school and college students
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

// Import static question banks for fallback
// @ts-ignore - JS exports
import {
  riasecQuestions,
  bigFiveQuestions,
  workValuesQuestions,
  employabilityQuestions,
  streamKnowledgeQuestions,
} from '../../index';

// ============================================================================
// TYPES
// ============================================================================

interface StudentContext {
  rawGrade: string;
  grade?: string | null;
  programName?: string;
  programCode?: string | null;
  degreeLevel?: string | null;
  selectedStream?: string | null;
  selectedCategory?: string | null;
  studentType?: 'school' | 'college' | 'general';
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
  studentStream: string | null;
  gradeLevel: GradeLevel | null;
  sectionTimings: Record<string, number>;
  currentAttempt: any;
  userId: string | null;
  timeRemaining: number | null;
  elapsedTime: number;
  selectedCategory?: string | null;
  studentProgram?: string | null;
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
 * Get the student record ID from auth user ID
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
 * Determine student type from all available sources
 */
const determineStudentType = (
  grade: string | null,
  programId: string | null,
  degreeLevel: string | null,
  schoolId: string | null,
  collegeId: string | null,
  studentTypeField: string | null,
  userMetadataRole: string | null
): 'school' | 'college' | 'general' => {
  // Priority 1: College students have program_id, degree_level, or college_id
  // Check this FIRST because student_type field might be incorrect
  if (programId || degreeLevel || collegeId) {
    return 'college';
  }

  // Priority 2: Use student_type field if available
  if (studentTypeField === 'school') return 'school';
  if (studentTypeField === 'college') return 'college';

  // Priority 3: Use user metadata role
  if (userMetadataRole) {
    if (userMetadataRole.includes('school')) return 'school';
    if (userMetadataRole.includes('college')) return 'college';
  }

  // Priority 4: School students have school_id
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
  studentStream: string | null,
  gradeLevel: GradeLevel | null
): string => {
  // For college students with program name
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

  // For school students with grade
  if (grade) {
    // For higher_secondary (Grade 11/12), include stream
    if (gradeLevel === 'higher_secondary' && studentStream) {
      const streamMap: Record<string, string> = {
        science: 'Science',
        commerce: 'Commerce',
        arts: 'Arts',
        humanities: 'Humanities',
      };
      const streamName = streamMap[studentStream.toLowerCase()] || studentStream;
      return `${grade} - ${streamName}`;
    }

    return grade;
  }

  // Fallback based on gradeLevel
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
    const streamName = studentStream ? streamMap[studentStream.toLowerCase()] || studentStream : 'General';
    return `Grade 11/12 - ${streamName}`;
  }

  if (gradeLevel === 'highschool') {
    return 'Grade 9/10';
  }

  if (gradeLevel === 'middle') {
    return 'Grade 6-8';
  }

  return 'Student';
};

/**
 * Derive category from stream
 */
const deriveCategory = (studentStream: string | null): string | null => {
  if (!studentStream) return null;

  const streamLower = studentStream.toLowerCase();

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
 * Build complete student context from database
 */
const buildStudentContext = async (
  userId: string,
  studentStream: string | null,
  gradeLevel: GradeLevel | null,
  selectedCategory: string | null,
  studentProgram?: string | null
): Promise<StudentContext> => {
  try {
    // Fetch both student record and user metadata
    const [studentResult, userResult] = await Promise.all([
      supabase
        .from('students')
        .select(`
          grade,
          branch_field,
          course_name,
          program_id,
          student_type,
          school_id,
          college_id,
          programs (
            name,
            code,
            degree_level
          )
        `)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase.auth.getUser()
    ]);

    const { data: student, error: studentError } = studentResult;
    const userMetadata = userResult.data?.user?.user_metadata;

    if (studentError || !student) {
      console.warn('⚠️ Could not fetch student record:', studentError?.message);
      return buildFallbackContext(studentStream, gradeLevel, selectedCategory, studentProgram);
    }

    // Extract program information
    const programName =
      (student.programs as any)?.name ||
      (student.programs as any)?.code ||
      student.course_name ||
      student.branch_field ||
      null;

    const programCode = (student.programs as any)?.code || null;
    const programDegreeLevel = (student.programs as any)?.degree_level || null;

    // Determine degree level
    const degreeLevel = extractDegreeLevel(student.grade, programDegreeLevel, programName);

    // Determine student type using all available sources
    const studentType = determineStudentType(
      student.grade,
      student.program_id,
      degreeLevel,
      (student as any).school_id,
      (student as any).college_id,
      (student as any).student_type,
      userMetadata?.role
    );

    // Build enhanced grade
    const enhancedGrade = buildEnhancedGrade(student.grade, programName, studentStream, gradeLevel);

    // Derive category
    const category = selectedCategory || deriveCategory(studentStream);

    const context: StudentContext = {
      rawGrade: enhancedGrade,
      grade: student.grade,
      programName: programName || undefined,
      programCode: programCode,
      degreeLevel: degreeLevel,
      selectedStream: studentStream,
      selectedCategory: category,
      studentType: studentType,
    };

    console.log('✅ [STUDENT-CONTEXT] Built from database:', JSON.stringify(context, null, 2));
    return context;
  } catch (contextError) {
    console.error('❌ Error building student context:', contextError);
    return buildFallbackContext(studentStream, gradeLevel, selectedCategory, studentProgram);
  }
};

/**
 * Build fallback context when student record is not available
 */
const buildFallbackContext = (
  studentStream: string | null,
  gradeLevel: GradeLevel | null,
  selectedCategory: string | null,
  studentProgram?: string | null
): StudentContext => {
  const category = selectedCategory || deriveCategory(studentStream);
  const enhancedGrade = buildEnhancedGrade(null, studentProgram, studentStream, gradeLevel);

  const context: StudentContext = {
    rawGrade: enhancedGrade,
    selectedStream: studentStream,
    selectedCategory: category,
    studentType: 'general',
    programName: studentProgram || undefined,
  };

  console.log('✅ [STUDENT-CONTEXT] Built fallback context:', JSON.stringify(context, null, 2));
  return context;
};

/**
 * Store student context in assessment attempt
 */
const storeStudentContext = async (attemptId: string, context: StudentContext): Promise<void> => {
  try {
    // Check if context has meaningful data
    const hasMeaningfulData = context.rawGrade && context.rawGrade.trim() !== '';

    if (!hasMeaningfulData) {
      console.warn('⚠️ [STUDENT-CONTEXT] Skipping update - no meaningful data');
      return;
    }

    console.log('📝 [STUDENT-CONTEXT] Storing context:', {
      attemptId,
      contextData: JSON.stringify(context, null, 2),
    });

    const { data, error } = await supabase
      .from('personal_assessment_attempts')
      .update({ student_context: context })
      .eq('id', attemptId)
      .select();

    if (error) {
      console.error('❌ [STUDENT-CONTEXT] Failed to store:', error);
    } else {
      console.log('✅ [STUDENT-CONTEXT] Successfully stored');
      console.log('✅ [STUDENT-CONTEXT] Updated record:', data);
    }
  } catch (err) {
    console.error('❌ [STUDENT-CONTEXT] Exception:', err);
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
      studentStream,
      gradeLevel,
      sectionTimings,
      currentAttempt,
      userId,
      timeRemaining,
      elapsedTime,
      selectedCategory,
      studentProgram,
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
        // ============================================================================
        // STEP 1: Get student record ID
        // ============================================================================
        let studentRecordId: string | null = null;
        if (userId) {
          studentRecordId = await getStudentRecordId(userId);
          if (!studentRecordId) {
            console.warn('⚠️ No student record found, using auth user_id directly');
            studentRecordId = userId;
          }
        }

        if (!studentRecordId) {
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
              .eq('student_id', studentRecordId)
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
        // STEP 3: Build and store student context
        // ============================================================================
        console.log('📊 [Stage 1/6] Preparing your responses...');
        window.setAnalysisProgress?.('preparing', 'Organizing assessment data...');

        const studentContext = await buildStudentContext(
          userId!,
          studentStream,
          gradeLevel,
          selectedCategory || null,
          studentProgram || null
        );

        await storeStudentContext(attemptId, studentContext);

        // ============================================================================
        // STEP 4: Fetch adaptive aptitude results
        // ============================================================================
        let adaptiveResults = null;
        let adaptiveSessionId = currentAttempt?.adaptive_aptitude_session_id;
        
        // If no session ID in currentAttempt, fetch the latest attempt to get the linked session
        if (!adaptiveSessionId && attemptId) {
          console.log('🔍 [Preparing] No adaptive session ID in currentAttempt, fetching latest attempt...');
          try {
            const { data: latestAttempt, error: attemptError } = await supabase
              .from('personal_assessment_attempts')
              .select('adaptive_aptitude_session_id')
              .eq('id', attemptId)
              .maybeSingle();
            
            if (!attemptError && latestAttempt?.adaptive_aptitude_session_id) {
              adaptiveSessionId = latestAttempt.adaptive_aptitude_session_id;
              console.log('✅ [Preparing] Found adaptive session ID from attempt:', adaptiveSessionId);
            } else {
              console.warn('⚠️ [Preparing] No adaptive session ID found in attempt');
            }
          } catch (fetchErr) {
            console.error('❌ [Preparing] Error fetching attempt:', fetchErr);
          }
        }
        
        if (adaptiveSessionId) {
          console.log('🔍 [Preparing] Fetching adaptive results for session:', adaptiveSessionId);
          adaptiveResults = await fetchAdaptiveResults(adaptiveSessionId);
          
          if (adaptiveResults) {
            console.log('✅ [Preparing] Adaptive results fetched successfully:', {
              level: adaptiveResults.aptitude_level,
              accuracy: adaptiveResults.overall_accuracy,
              confidence: adaptiveResults.confidence_tag
            });
          } else {
            console.warn('⚠️ [Preparing] Failed to fetch adaptive results');
          }
        } else {
          console.log('ℹ️ [Preparing] No adaptive session ID available');
        }

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
            stream: studentStream,
            gradeLevel: gradeLevel || 'after12',
            hasAdaptiveResults: !!adaptiveResults,
            studentContext: studentContext,
          });

          geminiResults = await analyzeAssessmentWithGemini(
            answers,
            studentStream,
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
            null,
            studentContext,
            adaptiveResults
          );

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

        console.log('📊 [Stage 5/6] Saving to database...');
        window.setAnalysisProgress?.('saving', 'Saving your personalized report...');

        // For after10, use the AI-recommended stream instead of studentStream
        let finalStreamId = studentStream;
        if (gradeLevel === 'after10' && geminiResults?.recommendedStream?.stream) {
          const streamMapping: Record<string, string> = {
            'Science (PCM)': 'science_pcm',
            'Science (PCB)': 'science_pcb',
            'Science (PCMB)': 'science_pcmb',
            'Commerce': 'commerce',
            'Arts/Humanities': 'arts',
            'Arts': 'arts',
            'Humanities': 'arts'
          };
          finalStreamId = streamMapping[geminiResults.recommendedStream.stream] || studentStream;
          console.log('✅ [After10] Using AI-recommended stream:', geminiResults.recommendedStream.stream, '→', finalStreamId);
        }

        const dbResults = await assessmentService.completeAttempt(
          attemptId,
          studentRecordId,
          finalStreamId,
          gradeLevel || 'after12',
          geminiResults,
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

        navigate(`/student/assessment/result?attemptId=${attemptId}`);
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
