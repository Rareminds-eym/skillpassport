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
    elapsedTime
  }: SubmissionOptions) => {
    console.log('🚀 submission.submit called!');
    console.log('📊 Submission params:', {
      answersCount: Object.keys(answers).length,
      sectionsCount: sections.length,
      studentStream,
      gradeLevel,
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
      
      // Save to localStorage (same as Regenerate uses)
      localStorage.setItem('assessment_answers', JSON.stringify(answers));
      localStorage.setItem('assessment_stream', studentStream || '');
      localStorage.setItem('assessment_grade_level', gradeLevel || 'after12');
      localStorage.setItem('assessment_section_timings', JSON.stringify(finalTimings));
      localStorage.removeItem('assessment_gemini_results'); // Clear old results
      
      console.log('💾 Saved assessment data to localStorage');

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
          // Still navigate to results (localStorage has the data)
          navigate('/student/assessment/result');
        }
      } else {
        console.log('No attemptId available, navigating without database save');
        navigate('/student/assessment/result');
      }
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setIsSubmitting(false);
      
      const errorMessage = err.message || 'Failed to submit assessment. Please try again.';
      console.error('❌ Assessment submission failed:', errorMessage);
      
      alert(`Assessment Submission Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      

  return {
    isSubmitting,
    error,
    submit
  };
};

export default useAssessmentSubmission;
      
      // CRITICAL FIX: Store the question set metadata with answers
      // This ensures we can fetch the EXACT questions the student answered
      const questionSetMetadata = {
        aptitudeQuestionIds: Object.keys(answers)
          .filter(k => k.startsWith('aptitude_'))
          .map(k => k.replace('aptitude_', '')),
        knowledgeQuestionIds: Object.keys(answers)
          .filter(k => k.startsWith('knowledge_'))
          .map(k => k.replace('knowledge_', '')),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('assessment_question_metadata', JSON.stringify(questionSetMetadata));
      console.log('💾 Saved question metadata:', questionSetMetadata);

      // Prepare question banks for Gemini analysis
      // START with imported static question banks (same as regenerate uses)
      // Then override with section-specific questions if available
      let questionBanks: any = {
        riasecQuestions: riasecQuestions || [],
        aptitudeQuestions: [],  // Will be fetched from DB for AI assessments
        bigFiveQuestions: bigFiveQuestions || [],
        workValuesQuestions: workValuesQuestions || [],
        employabilityQuestions: employabilityQuestions || [],
        streamKnowledgeQuestions: streamKnowledgeQuestions || {}
      };
      
      // Override with section questions if they have content (for non-AI assessments)
      const sectionRiasec = getQuestionsForSection(sections, getSectionId('riasec', gradeLevel));
      const sectionBigFive = getQuestionsForSection(sections, getSectionId('bigfive', gradeLevel));
      const sectionValues = getQuestionsForSection(sections, 'values');
      const sectionEmployability = getQuestionsForSection(sections, 'employability');
      
      if (sectionRiasec?.length > 0) questionBanks.riasecQuestions = sectionRiasec;
      if (sectionBigFive?.length > 0) questionBanks.bigFiveQuestions = sectionBigFive;
      if (sectionValues?.length > 0) questionBanks.workValuesQuestions = sectionValues;
      if (sectionEmployability?.length > 0) questionBanks.employabilityQuestions = sectionEmployability;

      // CRITICAL FIX: Load pre-calculated scores from the attempt
      // Scores are calculated and saved when each section completes (while questions are still available)
      // This avoids the problem of trying to match questions that may have been regenerated
      let preCalculatedScores: any = {};
      
      if (currentAttempt?.id) {
        console.log('📊 Loading pre-calculated scores from attempt:', currentAttempt.id);
        
        try {
          const { data: attemptData, error: attemptError } = await supabase
            .from('personal_assessment_attempts')
            .select('aptitude_scores, knowledge_scores')
            .eq('id', currentAttempt.id)
            .single();
          
          if (!attemptError && attemptData) {
            if (attemptData.aptitude_scores) {
              preCalculatedScores.aptitude = attemptData.aptitude_scores;
              console.log('✅ Loaded aptitude scores:', attemptData.aptitude_scores);
            }
            if (attemptData.knowledge_scores) {
              preCalculatedScores.knowledge = attemptData.knowledge_scores;
              console.log('✅ Loaded knowledge scores:', attemptData.knowledge_scores);
            }
          } else {
            console.warn('⚠️ Could not load pre-calculated scores:', attemptError?.message);
          }
        } catch (err) {
          console.error('❌ Error loading pre-calculated scores:', err);
        }
      }
      
      // If we have pre-calculated scores, use them; otherwise fall back to fetching questions
      if (preCalculatedScores.aptitude || preCalculatedScores.knowledge) {
        console.log('✅ Pre-calculated scores will be used for AI analysis');
      } else {
        console.warn('⚠️ No pre-calculated scores found - will attempt to fetch questions');
        
        // Fallback: Try to fetch questions (old behavior)
        const aptitudeAnswerKeys = Object.keys(answers).filter(k => k.startsWith('aptitude_'));
        const knowledgeAnswerKeys = Object.keys(answers).filter(k => k.startsWith('knowledge_'));
        
        const isAIAssessment = ['after10', 'after12', 'college', 'higher_secondary'].includes(gradeLevel || '');
        
        if (aptitudeAnswerKeys.length > 0 && userId && isAIAssessment) {
          console.log(`📡 Fetching AI aptitude questions for submit...`);
          const aiAptitudeQuestions = await fetchAIAptitudeQuestions(userId, aptitudeAnswerKeys);
          if (aiAptitudeQuestions.length > 0) {
            questionBanks.aptitudeQuestions = aiAptitudeQuestions;
            console.log(`✅ Loaded ${aiAptitudeQuestions.length} AI aptitude questions`);
          } else {
            console.warn('⚠️ No AI aptitude questions found');
          }
        }

        if (knowledgeAnswerKeys.length > 0 && userId && isAIAssessment) {
          console.log(`📡 Fetching AI knowledge questions for submit...`);
          const aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(userId, knowledgeAnswerKeys);
          if (aiKnowledgeQuestions.length > 0) {
            questionBanks.streamKnowledgeQuestions = { [studentStream || '']: aiKnowledgeQuestions };
            console.log(`✅ Loaded ${aiKnowledgeQuestions.length} AI knowledge questions`);
          } else {
            console.warn('⚠️ No AI knowledge questions found');
          }
        }
      }

      console.log('=== SUBMIT: Question banks prepared ===');
      console.log('📚 Question bank counts:', {
        riasec: questionBanks.riasecQuestions?.length || 0,
        aptitude: questionBanks.aptitudeQuestions?.length || 0,
        bigFive: questionBanks.bigFiveQuestions?.length || 0,
        workValues: questionBanks.workValuesQuestions?.length || 0,
        employability: questionBanks.employabilityQuestions?.length || 0,
        knowledge: questionBanks.streamKnowledgeQuestions?.[studentStream || '']?.length || 0
      });
      
      // CRITICAL DEBUG: Check if questions have correct_answer field
      if (questionBanks.aptitudeQuestions?.length > 0) {
        const sampleAptQ = questionBanks.aptitudeQuestions[0];
        console.log('📊 SUBMIT: Sample aptitude question structure:', {
          id: sampleAptQ.id,
          hasCorrectAnswer: !!sampleAptQ.correct_answer,
          hasCorrect: !!sampleAptQ.correct,
          hasCorrectAnswerField: !!sampleAptQ.correctAnswer,
          keys: Object.keys(sampleAptQ)
        });
      }
      
      if (questionBanks.streamKnowledgeQuestions?.[studentStream || '']?.length > 0) {
        const sampleKnowQ = questionBanks.streamKnowledgeQuestions[studentStream || ''][0];
        console.log('📚 SUBMIT: Sample knowledge question structure:', {
          id: sampleKnowQ.id,
          hasCorrectAnswer: !!sampleKnowQ.correct_answer,
          hasCorrect: !!sampleKnowQ.correct,
          hasCorrectAnswerField: !!sampleKnowQ.correctAnswer,
          keys: Object.keys(sampleKnowQ)
        });
      }
      
      console.log('📝 Total answers:', Object.keys(answers).length);
      console.log('🎓 Grade level:', gradeLevel);
      console.log('📖 Stream:', studentStream);
      
      // Debug: Log sample answer keys to verify format
      const answerKeys = Object.keys(answers);
      console.log('🔑 Sample answer keys:', answerKeys.slice(0, 20));
      console.log('🔑 RIASEC keys:', answerKeys.filter(k => k.startsWith('riasec_')).length);
      console.log('🔑 BigFive keys:', answerKeys.filter(k => k.startsWith('bigfive_')).length);
      console.log('🔑 Values keys:', answerKeys.filter(k => k.startsWith('values_')).length);
      console.log('🔑 Employability keys:', answerKeys.filter(k => k.startsWith('employability_')).length);
      console.log('🔑 Aptitude keys:', answerKeys.filter(k => k.startsWith('aptitude_')).length);
      console.log('🔑 Knowledge keys:', answerKeys.filter(k => k.startsWith('knowledge_')).length);
      
      // Debug: Log sample answers to see the values
      console.log('📊 Sample RIASEC answers:', 
        Object.entries(answers)
          .filter(([k]) => k.startsWith('riasec_'))
          .slice(0, 5)
          .map(([k, v]) => `${k}=${v}`)
      );

      // Include adaptive aptitude results if available
      const answersWithAdaptive = { ...answers };
      if ((gradeLevel === 'highschool' || gradeLevel === 'middle') && answers.adaptive_aptitude_results) {
        console.log('📊 Including adaptive aptitude results in analysis:', answers.adaptive_aptitude_results);
      }

      // If we have pre-calculated scores, add them to answers for AI analysis
      // This ensures the AI gets accurate scores even if questions were regenerated
      if (preCalculatedScores.aptitude || preCalculatedScores.knowledge) {
        console.log('✅ Using pre-calculated scores for AI analysis');
        answersWithAdaptive._preCalculatedScores = preCalculatedScores;
      }

      // Analyze with Gemini AI
      const geminiResults = await analyzeAssessmentWithGemini(
        answersWithAdaptive,
        studentStream,
        questionBanks,
        finalTimings,
        gradeLevel
      );

      // Check for empty or invalid results
      if (!geminiResults || Object.keys(geminiResults).length === 0) {
        console.error('❌ AI analysis returned empty results:', geminiResults);
        throw new Error('AI analysis returned empty results. Please try again.');
      }
      
      // Log what the AI actually returned
      console.log('🔍 AI Response Analysis:');
      console.log('  Keys returned:', Object.keys(geminiResults));
      console.log('  Has riasec:', !!geminiResults.riasec);
      console.log('  Has aptitude:', !!geminiResults.aptitude);
      console.log('  Has bigFive:', !!geminiResults.bigFive);
      console.log('  Has workValues:', !!geminiResults.workValues);
      console.log('  Has employability:', !!geminiResults.employability);
      console.log('  Has knowledge:', !!geminiResults.knowledge);
      console.log('  Has careerFit:', !!geminiResults.careerFit);
      console.log('  Has skillGap:', !!geminiResults.skillGap);
      console.log('  Has roadmap:', !!geminiResults.roadmap);
      console.log('  Has profileSnapshot:', !!geminiResults.profileSnapshot);
      console.log('  Has timingAnalysis:', !!geminiResults.timingAnalysis);
      console.log('  Has finalNote:', !!geminiResults.finalNote);
      console.log('  Has overallSummary:', !!geminiResults.overallSummary);
      
      // Validate that we have essential fields
      if (!geminiResults.riasec && !geminiResults.careerFit) {
        console.error('❌ AI analysis missing essential fields:', Object.keys(geminiResults));
        console.error('❌ Full AI response:', JSON.stringify(geminiResults, null, 2));
        throw new Error('AI analysis returned incomplete results. Please try again.');
      }
      
      console.log('✅ AI analysis successful, keys:', Object.keys(geminiResults));

      // Enhance results with adaptive aptitude data for high school students
      if ((gradeLevel === 'highschool' || gradeLevel === 'middle') && answers.adaptive_aptitude_results) {
        const adaptiveResults = answers.adaptive_aptitude_results;
        console.log('🎯 Enhancing results with adaptive aptitude data');
        
        geminiResults.adaptiveAptitude = {
          aptitudeLevel: adaptiveResults.aptitudeLevel,
          confidenceTag: adaptiveResults.confidenceTag,
          tier: adaptiveResults.tier,
          overallAccuracy: adaptiveResults.overallAccuracy,
          accuracyBySubtag: adaptiveResults.accuracyBySubtag,
          pathClassification: adaptiveResults.pathClassification,
          totalQuestions: adaptiveResults.totalQuestions,
          totalCorrect: adaptiveResults.totalCorrect
        };
        
        // Enhance aptitude scores with adaptive test results
        if (geminiResults.aptitude) {
          geminiResults.aptitude.adaptiveLevel = adaptiveResults.aptitudeLevel;
          geminiResults.aptitude.adaptiveConfidence = adaptiveResults.confidenceTag;
          
          if (adaptiveResults.accuracyBySubtag) {
            const subtagMapping: Record<string, string> = {
              numerical_reasoning: 'numerical',
              logical_reasoning: 'abstract',
              verbal_reasoning: 'verbal',
              spatial_reasoning: 'spatial',
              data_interpretation: 'numerical',
              pattern_recognition: 'abstract'
            };
            
            Object.entries(adaptiveResults.accuracyBySubtag).forEach(([subtag, data]: [string, any]) => {
              const category = subtagMapping[subtag];
              if (category && geminiResults.aptitude.scores?.[category]) {
                geminiResults.aptitude.scores[category].adaptiveAccuracy = data.accuracy;
              }
            });
          }
        }
        
        console.log('✅ Adaptive aptitude data integrated into results');
      }
      
      // Add course recommendations for after12 students
      if (gradeLevel === 'after12') {
        geminiResults.courseRecommendations = generateCourseRecommendations(geminiResults);
        console.log('✅ Course recommendations generated:', geminiResults.courseRecommendations);
      }

      // Save AI-analyzed results to localStorage
      localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
      console.log('Gemini analysis complete:', geminiResults);

      // Save results to database
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
      
      // Save to database if we have an attempt
      if (attemptId && userId) {
        try {
          console.log('Attempting to save results to database with attemptId:', attemptId);
          
          const dbResults = await assessmentService.completeAttempt(
            attemptId,
            userId,
            studentStream,
            gradeLevel || 'after12',
            geminiResults,
            finalTimings
          );
          console.log('✅ Results saved to database:', dbResults);
          
          // Navigate with attemptId for database retrieval
          navigate(`/student/assessment/result?attemptId=${attemptId}`);
        } catch (dbErr: any) {
          console.error('❌ Failed to save to database:', dbErr);
          // Still navigate to results (localStorage has the data)
          navigate('/student/assessment/result');
        }
      } else {
        console.log('No attemptId available, navigating without database save');
        navigate('/student/assessment/result');
      }
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setIsSubmitting(false);
      
      // Show a more detailed error message
      const errorMessage = err.message || 'Failed to analyze assessment with AI. Please try again.';
      console.error('❌ Assessment submission failed:', errorMessage);
      
      // Alert the user about the error (in addition to the error state)
      alert(`Assessment Analysis Error: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      
      setError(errorMessage);
    }
  }, [navigate]);

  return {
    isSubmitting,
    error,
    submit
  };
};

export default useAssessmentSubmission;
