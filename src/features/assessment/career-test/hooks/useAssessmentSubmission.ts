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
 */
const getQuestionsForSection = (sections: Section[], sectionId: string): any[] => {
  const section = sections.find(s => s.id === sectionId);
  return section?.questions || [];
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
      const questionBanks = {
        riasecQuestions: getQuestionsForSection(sections, getSectionId('riasec', gradeLevel)),
        aptitudeQuestions: getQuestionsForSection(sections, getSectionId('aptitude', gradeLevel)),
        bigFiveQuestions: getQuestionsForSection(sections, getSectionId('bigfive', gradeLevel)),
        workValuesQuestions: getQuestionsForSection(sections, 'values'),
        employabilityQuestions: getQuestionsForSection(sections, 'employability'),
        streamKnowledgeQuestions: { [studentStream || '']: getQuestionsForSection(sections, getSectionId('knowledge', gradeLevel)) }
      };

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
      
      // Validate that we have essential fields
      if (!geminiResults.riasec && !geminiResults.careerFit) {
        console.error('❌ AI analysis missing essential fields:', Object.keys(geminiResults));
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
