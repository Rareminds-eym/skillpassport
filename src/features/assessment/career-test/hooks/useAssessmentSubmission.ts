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
      console.log(`⚠️ No student record found for auth user: ${authUserId}`);
      return null;
    }
    
    console.log(`✅ Found student record: ${student.id} for auth user: ${authUserId}`);
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
      console.log(`🔍 Looking for questions matching ${targetQuestionIds.length} answer IDs`);
      console.log(`🔍 Sample target IDs:`, targetQuestionIds.slice(0, 3));
    }

    // First, look up the student record ID from the auth user ID
    // Questions are saved with students.id, not auth.user.id
    const studentRecordId = await getStudentRecordId(authUserId);
    
    // Try with student record ID first (this is how questions are saved)
    if (studentRecordId) {
      console.log(`📡 Fetching aptitude questions for student_id: ${studentRecordId}`);
      
      const { data: allQuestionSets, error } = await supabase
        .from('career_assessment_ai_questions')
        .select('id, questions, created_at')
        .eq('student_id', studentRecordId)
        .eq('question_type', 'aptitude')
        .order('created_at', { ascending: false });
      
      console.log(`📡 Query result: ${allQuestionSets?.length || 0} question sets found, error: ${error?.message || 'none'}`);

      if (!error && allQuestionSets && allQuestionSets.length > 0) {
        const matchingSet = findMatchingQuestionSet(allQuestionSets, targetQuestionIds);
        return transformQuestions(matchingSet);
      }
    }

    // Fallback: Try with auth user ID directly (in case questions were saved with auth ID)
    console.log(`📡 Fallback: Fetching aptitude questions with auth user id: ${authUserId}`);
    const { data: fallbackQuestionSets, error: fallbackError } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, created_at')
      .eq('student_id', authUserId)
      .eq('question_type', 'aptitude')
      .order('created_at', { ascending: false });
    
    console.log(`📡 Fallback query result: ${fallbackQuestionSets?.length || 0} question sets found`);

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
    console.log(`🔍 Searching through ${allQuestionSets.length} question sets for best match...`);
    
    for (const questionSet of allQuestionSets) {
      const questionIds = questionSet.questions.map((q: any) => q.id);
      const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;
      
      console.log(`   Set created ${questionSet.created_at}: ${matchCount}/${targetQuestionIds.length} matches`);
      
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        matchingQuestionSet = questionSet;
      }
      
      // If we found a perfect or near-perfect match, use it
      if (matchCount >= targetQuestionIds.length * 0.9) {
        console.log(`✅ Found excellent match: ${matchCount}/${targetQuestionIds.length} IDs (${Math.round(matchCount/targetQuestionIds.length*100)}%)`);
        break;
      }
    }
  }
  
  if (!matchingQuestionSet) {
    console.warn('⚠️ No matching question set found, using latest');
    matchingQuestionSet = allQuestionSets[0];
  } else if (bestMatchCount < targetQuestionIds.length * 0.5) {
    console.warn(`⚠️ Poor match quality: only ${bestMatchCount}/${targetQuestionIds.length} IDs matched (${Math.round(bestMatchCount/targetQuestionIds.length*100)}%)`);
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

  console.log(`📚 Fetched ${questions.length} AI aptitude questions from database`);
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
    console.log('🚀 submission.submit called!');
    console.log('📊 Submission params:', {
      answersCount: Object.keys(answers).length,
      sectionsCount: sections.length,
      studentStream,
      gradeLevel,
      selectedCategory,
      sectionTimingsKeys: Object.keys(sectionTimings),
      currentAttemptId: currentAttempt?.id,
      userId,
      timeRemaining,
      elapsedTime
    });
    
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
      console.log('📝 Submitting assessment...');
      console.log('   Grade:', gradeLevel, 'Stream:', studentStream);
      console.log('   Total answers:', Object.keys(answers).length);
      
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
        console.log(`🔍 Derived category from stream "${studentStream}": ${derivedCategory}`);
      }
      
      // ✅ CRITICAL FIX: Fetch student context for college, after12, and higher_secondary students
      // This ensures career clusters are aligned with the student's program/course/stream
      let studentContext: any = {};
      
      if (userId && (gradeLevel === 'college' || gradeLevel === 'after12' || gradeLevel === 'higher_secondary')) {
        try {
          console.log('📚 Fetching student context for enhanced AI recommendations...');
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
            
            const programName = student.branch_field || 
                               (student.programs as any)?.name || 
                               student.course_name;
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
              programName: programName,
              programCode: programCode,
              degreeLevel: degreeLevel,
              selectedStream: studentStream, // Include the selected stream
              selectedCategory: derivedCategory // Include the category (arts/science/commerce)
            };
            
            console.log('✅ Student context fetched:', studentContext);
            console.log('   - Stream:', studentStream);
            console.log('   - Category:', derivedCategory);
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
        console.log('✅ Created student context from stream selection:', studentContext);
      }
      
      // Save to database WITHOUT AI analysis
      // AI analysis will be generated on-demand when viewing result (same as Regenerate)
      let attemptId = currentAttempt?.id;
      
      if (!attemptId && userId) {
        console.log('No currentAttempt, fetching latest attempt from database...');
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
            console.log('Found latest attempt:', attemptId);
          }
        } catch (fetchErr: any) {
          console.log('Could not fetch latest attempt:', fetchErr.message);
        }
      }
      
      // ✅ CRITICAL FIX: Store studentContext in the attempt for later use
      // This ensures the AI analysis can access program information when generating career clusters
      if (attemptId && Object.keys(studentContext).length > 0) {
        try {
          console.log('💾 Storing student context in attempt for AI analysis...');
          const { error: contextError } = await supabase
            .from('personal_assessment_attempts')
            .update({
              student_context: studentContext
            })
            .eq('id', attemptId);
          
          if (contextError) {
            console.warn('⚠️ Could not store student context:', contextError.message);
          } else {
            console.log('✅ Student context stored in attempt');
          }
        } catch (contextUpdateError) {
          console.error('❌ Error storing student context:', contextUpdateError);
        }
      }
      
      // Save completion to database
      if (attemptId && userId) {
        try {
          console.log('💾 Saving assessment completion to database...');
          console.log('   Attempt ID:', attemptId);
          console.log('   Using completeAttemptWithoutAI (AI analysis will be generated on result page)');
          
          const dbResults = await assessmentService.completeAttemptWithoutAI(
            attemptId,
            userId,
            studentStream,
            gradeLevel || 'after12',
            finalTimings
          );
          
          console.log('✅ Assessment completion saved to database');
          console.log('   Result ID:', dbResults.id);
          console.log('   Navigating to result page...');
          console.log('   AI analysis will be generated automatically (same as Regenerate)');
          
          // Navigate with attemptId
          navigate(`/student/assessment/result?attemptId=${attemptId}`);
        } catch (dbErr: any) {
          console.error('❌ Failed to save to database:', dbErr);
          // Navigate to results with attemptId (database has real-time saved data)
          if (attemptId) {
            navigate(`/student/assessment/result?attemptId=${attemptId}`);
          } else {
            // No attemptId - show error and stay on assessment page
            alert('Failed to save assessment. Please try again.');
            setIsSubmitting(false);
            return;
          }
        }
      } else {
        console.log('❌ No attemptId available - cannot navigate to results');
        alert('Assessment data not found. Please try again.');
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