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

/**
 * Fetch AI-generated aptitude questions from database
 * These questions have correct_answer field needed for scoring
 * 
 * IMPORTANT: We need to find questions that match the IDs in the student's answers,
 * not just the latest questions (which may have different IDs if regenerated)
 */
const fetchAIAptitudeQuestions = async (studentId: string, answerKeys?: string[]): Promise<any[]> => {
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

    console.log(`📡 Fetching aptitude questions for student_id: ${studentId}`);

    // Fetch ALL aptitude question sets for this student (not just the latest)
    const { data: allQuestionSets, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, created_at')
      .eq('student_id', studentId)
      .eq('question_type', 'aptitude')
      .order('created_at', { ascending: false });
    
    console.log(`📡 Query result: ${allQuestionSets?.length || 0} question sets found, error: ${error?.message || 'none'}`);

    // If no questions found with provided studentId, try with current auth user
    if ((!allQuestionSets || allQuestionSets.length === 0) && !error) {
      console.log('⚠️ No questions found with provided studentId, trying with current auth user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id !== studentId) {
        console.log(`📡 Retrying with auth user id: ${user.id}`);
        const { data: retryData, error: retryError } = await supabase
          .from('career_assessment_ai_questions')
          .select('id, questions, created_at')
          .eq('student_id', user.id)
          .eq('question_type', 'aptitude')
          .order('created_at', { ascending: false });
        
        if (!retryError && retryData && retryData.length > 0) {
          console.log(`✅ Found ${retryData.length} question sets with auth user id`);
          // Continue with retryData
          const matchingSet = findMatchingQuestionSet(retryData, targetQuestionIds);
          return transformQuestions(matchingSet);
        }
      }
    }

    if (error || !allQuestionSets || allQuestionSets.length === 0) {
      console.log('No AI aptitude questions found in database');
      return [];
    }

    const matchingSet = findMatchingQuestionSet(allQuestionSets, targetQuestionIds);
    return transformQuestions(matchingSet);
  } catch (err) {
    console.error('Error fetching AI aptitude questions:', err);
    return [];
  }
};

// Helper function to find matching question set
const findMatchingQuestionSet = (allQuestionSets: any[], targetQuestionIds: string[]): any => {
  let matchingQuestionSet = null;
  
  if (targetQuestionIds.length > 0) {
    for (const questionSet of allQuestionSets) {
      const questionIds = questionSet.questions.map((q: any) => q.id);
      const matchCount = targetQuestionIds.filter(id => questionIds.includes(id)).length;
      
      if (matchCount > 0) {
        console.log(`✅ Found question set with ${matchCount}/${targetQuestionIds.length} matching IDs (created: ${questionSet.created_at})`);
        matchingQuestionSet = questionSet;
        break;
      }
    }
  }
  
  if (!matchingQuestionSet) {
    console.log('⚠️ No matching question set found, using latest');
    matchingQuestionSet = allQuestionSets[0];
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
 */
const fetchAIKnowledgeQuestions = async (studentId: string, answerKeys?: string[]): Promise<any[]> => {
  try {
    // If we have answer keys, extract the question IDs to find the right question set
    let targetQuestionIds: string[] = [];
    if (answerKeys && answerKeys.length > 0) {
      targetQuestionIds = answerKeys
        .filter(k => k.startsWith('knowledge_'))
        .map(k => k.replace('knowledge_', ''));
      console.log(`🔍 Looking for knowledge questions matching ${targetQuestionIds.length} answer IDs`);
    }

    console.log(`📡 Fetching knowledge questions for student_id: ${studentId}`);

    // Fetch ALL knowledge question sets for this student (not just the latest)
    const { data: allQuestionSets, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, created_at')
      .eq('student_id', studentId)
      .eq('question_type', 'knowledge')
      .order('created_at', { ascending: false });

    console.log(`📡 Knowledge query result: ${allQuestionSets?.length || 0} question sets found, error: ${error?.message || 'none'}`);

    // If no questions found with provided studentId, try with current auth user
    if ((!allQuestionSets || allQuestionSets.length === 0) && !error) {
      console.log('⚠️ No knowledge questions found with provided studentId, trying with current auth user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id !== studentId) {
        console.log(`📡 Retrying knowledge with auth user id: ${user.id}`);
        const { data: retryData, error: retryError } = await supabase
          .from('career_assessment_ai_questions')
          .select('id, questions, created_at')
          .eq('student_id', user.id)
          .eq('question_type', 'knowledge')
          .order('created_at', { ascending: false });
        
        if (!retryError && retryData && retryData.length > 0) {
          console.log(`✅ Found ${retryData.length} knowledge question sets with auth user id`);
          const matchingSet = findMatchingQuestionSet(retryData, targetQuestionIds);
          return transformKnowledgeQuestions(matchingSet);
        }
      }
    }

    if (error || !allQuestionSets || allQuestionSets.length === 0) {
      console.log('No AI knowledge questions found in database');
      return [];
    }

    const matchingSet = findMatchingQuestionSet(allQuestionSets, targetQuestionIds);
    return transformKnowledgeQuestions(matchingSet);
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
      // Save to localStorage for backward compatibility
      localStorage.setItem('assessment_answers', JSON.stringify(answers));
      localStorage.setItem('assessment_stream', studentStream || '');
      localStorage.setItem('assessment_grade_level', gradeLevel || 'after12');
      localStorage.setItem('assessment_section_timings', JSON.stringify(finalTimings));
      localStorage.removeItem('assessment_gemini_results');

      // Prepare question banks for Gemini analysis
      let questionBanks = {
        riasecQuestions: getQuestionsForSection(sections, getSectionId('riasec', gradeLevel)),
        aptitudeQuestions: getQuestionsForSection(sections, getSectionId('aptitude', gradeLevel)),
        bigFiveQuestions: getQuestionsForSection(sections, getSectionId('bigfive', gradeLevel)),
        workValuesQuestions: getQuestionsForSection(sections, 'values'),
        employabilityQuestions: getQuestionsForSection(sections, 'employability'),
        streamKnowledgeQuestions: { [studentStream || '']: getQuestionsForSection(sections, getSectionId('knowledge', gradeLevel)) }
      };

      // Check if we need to fetch AI-generated questions from database
      // This is needed because AI questions have correct_answer field for scoring
      // IMPORTANT: For AI assessments (after10, after12, college, higher_secondary), 
      // ALWAYS fetch from database because frontend questions don't have correct_answer
      const aptitudeAnswerKeys = Object.keys(answers).filter(k => k.startsWith('aptitude_'));
      const knowledgeAnswerKeys = Object.keys(answers).filter(k => k.startsWith('knowledge_'));
      
      // AI assessment grade levels that use AI-generated questions
      const isAIAssessment = ['after10', 'after12', 'college', 'higher_secondary'].includes(gradeLevel || '');
      
      // For AI assessments, ALWAYS fetch from database (even if sections have questions)
      // because frontend questions don't have correct_answer field needed for scoring
      if (aptitudeAnswerKeys.length > 0 && userId) {
        const shouldFetch = isAIAssessment || !questionBanks.aptitudeQuestions || questionBanks.aptitudeQuestions.length === 0;
        
        if (shouldFetch) {
          console.log(`📡 Fetching AI-generated aptitude questions from database for scoring... (isAIAssessment: ${isAIAssessment}, userId: ${userId})`);
          let aiAptitudeQuestions = await fetchAIAptitudeQuestions(userId, aptitudeAnswerKeys);
          
          // If no questions found, wait a bit and retry (questions might still be saving)
          if (aiAptitudeQuestions.length === 0) {
            console.log('⏳ No questions found, waiting 1s and retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            aiAptitudeQuestions = await fetchAIAptitudeQuestions(userId, aptitudeAnswerKeys);
          }
          
          if (aiAptitudeQuestions.length > 0) {
            questionBanks.aptitudeQuestions = aiAptitudeQuestions;
            console.log(`✅ Loaded ${aiAptitudeQuestions.length} AI aptitude questions with correct answers`);
          } else {
            console.warn('⚠️ No AI aptitude questions found in database - scoring may be inaccurate');
          }
        }
      }

      if (knowledgeAnswerKeys.length > 0 && userId) {
        const shouldFetch = isAIAssessment || !questionBanks.streamKnowledgeQuestions?.[studentStream || ''] || questionBanks.streamKnowledgeQuestions[studentStream || ''].length === 0;
        
        if (shouldFetch) {
          console.log(`📡 Fetching AI-generated knowledge questions from database for scoring... (isAIAssessment: ${isAIAssessment}, userId: ${userId})`);
          let aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(userId, knowledgeAnswerKeys);
          
          // If no questions found, wait a bit and retry (questions might still be saving)
          if (aiKnowledgeQuestions.length === 0) {
            console.log('⏳ No knowledge questions found, waiting 1s and retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            aiKnowledgeQuestions = await fetchAIKnowledgeQuestions(userId, knowledgeAnswerKeys);
          }
          
          if (aiKnowledgeQuestions.length > 0) {
            questionBanks.streamKnowledgeQuestions = { [studentStream || '']: aiKnowledgeQuestions };
            console.log(`✅ Loaded ${aiKnowledgeQuestions.length} AI knowledge questions with correct answers`);
          } else {
            console.warn('⚠️ No AI knowledge questions found in database - scoring may be inaccurate');
          }
        }
      }

      console.log('📚 Question banks prepared:', {
        riasec: questionBanks.riasecQuestions?.length || 0,
        aptitude: questionBanks.aptitudeQuestions?.length || 0,
        bigFive: questionBanks.bigFiveQuestions?.length || 0,
        workValues: questionBanks.workValuesQuestions?.length || 0,
        employability: questionBanks.employabilityQuestions?.length || 0,
        knowledge: questionBanks.streamKnowledgeQuestions?.[studentStream || '']?.length || 0
      });
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
