/**
 * AssessmentTestPage
 * 
 * Main orchestrator component for the career assessment test.
 * Replaces the monolithic AssessmentTest.jsx with a modular architecture.
 * 
 * Flow:
 * 1. Check for existing in-progress attempt
 * 2. Show grade selection (or auto-detect from database)
 * 3. Show category/stream selection
 * 4. Run through sections with questions
 * 5. Submit and analyze with Gemini AI
 * 
 * @module features/assessment/career-test/AssessmentTestPage
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Auth & Database
// @ts-ignore - JS file without type declarations
import { useAuth } from '../../../context/AuthContext';
// @ts-ignore - JS file without type declarations
import { useAssessment } from '../../../hooks/useAssessment';
import { useAdaptiveAptitude } from '../../../hooks/useAdaptiveAptitude';
// @ts-ignore - JS service
import * as assessmentService from '../../../services/assessmentService';
// @ts-ignore - JS service
import { normalizeStreamId } from '../../../services/careerAssessmentAIService';

// Hooks
import { useAssessmentFlow } from './hooks/useAssessmentFlow';
import { useStudentGrade } from './hooks/useStudentGrade';
import { useAIQuestions } from './hooks/useAIQuestions';
import { useAssessmentSubmission } from './hooks/useAssessmentSubmission';

// Config
import { 
  getSectionsForGrade, 
  type GradeLevel,
  RESPONSE_SCALES 
} from './config/sections';

// Components
import { QuestionRenderer } from './components/questions/QuestionRenderer';
import { QuestionNavigation } from './components/QuestionNavigation';
import { SectionIntroScreen } from './components/screens/SectionIntroScreen';
import { SectionCompleteScreen } from './components/screens/SectionCompleteScreen';
import { LoadingScreen } from './components/screens/LoadingScreen';
import { AnalyzingScreen } from './components/screens/AnalyzingScreen';
import { ProgressHeader } from './components/layout/ProgressHeader';
import { QuestionLayout } from './components/layout/QuestionLayout';
import { TestModeControls } from './components/layout/TestModeControls';

// Shared Components (from parent assessment feature)
// @ts-ignore - JSX components
import {
  GradeSelectionScreen,
  CategorySelectionScreen,
  StreamSelectionScreen,
  ResumePromptScreen,
  RestrictionScreen,
} from '../../assessment/components';

// Utilities
import {
  getGradeLevelFromGrade,
  getAdaptiveGradeLevel,
} from '../../assessment';

// Question Data
import {
  riasecQuestions,
  bigFiveQuestions,
  workValuesQuestions,
  employabilityQuestions,
  // Middle School questions
  interestExplorerQuestions,
  strengthsCharacterQuestions,
  learningPreferencesQuestions,
  // High School questions
  highSchoolInterestQuestions,
  highSchoolStrengthsQuestions,
  highSchoolLearningQuestions,
  highSchoolAptitudeQuestions,
} from '../../assessment/data/questions';
import { supabase } from '@/lib/supabaseClient';

/**
 * Get icon image path for a section based on section ID
 */
const getSectionIconPath = (sectionId: string): string => {
  const iconMap: Record<string, string> = {
    // Career Interests (RIASEC)
    'riasec': '/assets/Assessment Icons/Career Interests.png',
    
    // Big Five Personality
    'bigfive': '/assets/Assessment Icons/Big 5 Personality.png',
    
    // Work Values & Motivators
    'values': '/assets/Assessment Icons/Work Value & Motivators.png',
    
    // Employability Skills
    'employability': '/assets/Assessment Icons/Employability Skills.png',
    
    // Stream Based Aptitude
    'aptitude': '/assets/Assessment Icons/Multi-Aptitude.png',
    
    // Stream Knowledge
    'knowledge': '/assets/Assessment Icons/Stream Knowledge.png',
    
    // Middle School - Interest Explorer
    'middle_interest_explorer': '/assets/Assessment Icons/Interest Explorer.png',
    
    // Middle School - Strengths & Character
    'middle_strengths_character': '/assets/Assessment Icons/Strenghts & Character.png',
    
    // Middle School - Learning & Work Preferences
    'middle_learning_preferences': '/assets/Assessment Icons/Learning & Work Preference.png',
    
    // High School - Interest Explorer
    'hs_interest_explorer': '/assets/Assessment Icons/Interest Explorer.png',
    
    // High School - Strengths & Character
    'hs_strengths_character': '/assets/Assessment Icons/Strenghts & Character.png',
    
    // High School - Learning & Work Preferences
    'hs_learning_preferences': '/assets/Assessment Icons/Learning & Work Preference.png',
    
    // High School - Aptitude Sampling
    'hs_aptitude_sampling': '/assets/Assessment Icons/Aptitude Sampling.png',
    
    // Adaptive Aptitude Test
    'adaptive_aptitude': '/assets/Assessment Icons/Adaptive Aptitude Test.png',
  };
  
  return iconMap[sectionId] || '/assets/Assessment Icons/Career Interests.png';
};

/**
 * Build sections with questions for a given grade level
 */
const buildSectionsWithQuestions = (
  gradeLevel: GradeLevel,
  _studentStream: string | null,
  aiQuestions: any,
  _selectedCategory: string | null
) => {
  const sectionConfigs = getSectionsForGrade(gradeLevel);
  
  return sectionConfigs.map(config => {
    let questions: any[] = [];
    let responseScale = config.responseScale;
    
    // Map section ID to question data
    switch (config.id) {
      // Middle School sections
      case 'middle_interest_explorer':
        questions = interestExplorerQuestions || [];
        break;
      case 'middle_strengths_character':
        questions = strengthsCharacterQuestions || [];
        break;
      case 'middle_learning_preferences':
        questions = learningPreferencesQuestions || [];
        break;
        
      // High School sections
      case 'hs_interest_explorer':
        questions = highSchoolInterestQuestions || [];
        break;
      case 'hs_strengths_character':
        questions = highSchoolStrengthsQuestions || [];
        break;
      case 'hs_learning_preferences':
        questions = highSchoolLearningQuestions || [];
        break;
      case 'hs_aptitude_sampling':
        questions = highSchoolAptitudeQuestions || [];
        break;
        
      // Comprehensive sections (after10, after12, college)
      case 'riasec':
        questions = riasecQuestions || [];
        responseScale = RESPONSE_SCALES.likert5;
        break;
      case 'bigfive':
        questions = bigFiveQuestions || [];
        responseScale = RESPONSE_SCALES.accuracy5;
        break;
      case 'values':
        questions = workValuesQuestions || [];
        responseScale = RESPONSE_SCALES.importance5;
        break;
      case 'employability':
        questions = employabilityQuestions || [];
        responseScale = RESPONSE_SCALES.selfDescription5;
        break;
      case 'aptitude':
        // Use AI-generated questions if available
        questions = aiQuestions?.aptitude || [];
        break;
      case 'knowledge':
        // Use AI-generated stream-specific questions
        questions = aiQuestions?.knowledge || [];
        break;
        
      // Adaptive aptitude (handled separately by adaptive hook)
      case 'adaptive_aptitude':
        questions = []; // Questions come from adaptive hook
        break;
    }
    
    return {
      ...config,
      questions,
      responseScale,
      icon: null // Icons handled by components
    };
  });
};

/**
 * Main Assessment Test Page Component
 */
const AssessmentTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Environment flags
  const isDevMode = import.meta.env.DEV || window.location.hostname === 'localhost';
  const shouldShowAllOptions = window.location.hostname === 'skillpassport.pages.dev';
  const shouldFilterByGrade = window.location.hostname === 'localhost' || 
                               window.location.hostname === 'skilldevelopment.rareminds.in';
  
  // Student grade info
  const {
    studentId,
    studentGrade,
    isCollegeStudent,
    studentProgram,
    monthsInGrade,
    profileData,
    loading: loadingStudentGrade
  } = useStudentGrade({ userId: user?.id, userEmail: user?.email });
  
  // Database integration
  const {
    loading: dbLoading,
    currentAttempt,
    startAssessment: dbStartAssessment,
    saveResponse: dbSaveResponse,
    updateProgress: dbUpdateProgress,
    checkInProgressAttempt,
    studentRecordId
  } = useAssessment();
  
  // Local state
  const [sections, setSections] = useState<any[]>([]);
  const [useDatabase, setUseDatabase] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingAttempt, setPendingAttempt] = useState<any>(null);
  const [checkingExistingAttempt, setCheckingExistingAttempt] = useState(true);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [skipResumeCheck, setSkipResumeCheck] = useState(false); // Flag to skip resume check after abandoning
  const [adaptiveAptitudeAnswer, setAdaptiveAptitudeAnswer] = useState<string | null>(null);
  const [adaptiveQuestionTimer, setAdaptiveQuestionTimer] = useState(90); // 90 seconds per question
  
  // Toast notification state for save errors
  const [toastError, setToastError] = useState<string | null>(null);
  
  // Flow state machine
  const flow = useAssessmentFlow({
    sections,
    onSectionComplete: (sectionId, timeSpent) => {
      console.log(`Section ${sectionId} completed in ${timeSpent}s`);
      console.log('🔍 DEBUG: flow.answers on section complete:', flow.answers);
      console.log('🔍 DEBUG: Answer count:', Object.keys(flow.answers).length);
      console.log('🔍 DEBUG: Sample keys:', Object.keys(flow.answers).slice(0, 10));
      
      // Update section timings in state so it shows on the complete screen
      const updatedTimings = {
        ...flow.sectionTimings,
        [sectionId]: timeSpent
      };
      flow.setSectionTimings(updatedTimings);
      console.log('📊 Updated section timings in state:', updatedTimings);
      
      if (useDatabase && currentAttempt?.id) {
        // Save all responses including non-UUID questions (RIASEC, BigFive, etc.)
        console.log('📊 Saving section timings to database:', updatedTimings);
        dbUpdateProgress(flow.currentSectionIndex, 0, updatedTimings, null, null, flow.answers);
      }
    },
    onAnswerChange: (questionId, answer) => {
      // Save to database if database mode is enabled and we have an active attempt
      if (useDatabase && currentAttempt?.id) {
        const [sectionId, qId] = questionId.split('_');
        
        // Check if qId is a valid UUID (36 chars with dashes: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qId);
        
        if (isUUID) {
          // UUID questions (AI-generated) go to personal_assessment_responses table
          dbSaveResponse(sectionId, qId, answer);
        }
        // Note: Non-UUID questions (RIASEC, BigFive, etc.) are saved via all_responses
        // in the updateProgress call below
        
        // IMPORTANT: flow.answers is stale here (React state is async)
        // We need to include the current answer in the update
        const updatedAnswers = { ...flow.answers, [questionId]: answer };
        
        // Update progress (current position) after every answer
        // Also save all responses to the all_responses column
        dbUpdateProgress(flow.currentSectionIndex, flow.currentQuestionIndex, flow.sectionTimings, null, null, updatedAnswers);
      }
    }
  });
  
  // Submission hook
  const submission = useAssessmentSubmission();
  
  // AI Questions Hook
  // - after10: Loads ONLY aptitude questions (stream-agnostic, no knowledge)
  // - after12/college/higher_secondary: Loads BOTH aptitude AND knowledge questions
  const {
    aiQuestions,
    loading: questionsLoading,
    error: questionsError
  } = useAIQuestions({
    gradeLevel: flow.gradeLevel,
    studentStream: flow.studentStream,
    studentId: studentId || null,
    attemptId: currentAttempt?.id || null
  });
  
  // Adaptive Aptitude Hook
  // Note: We need a ref to track if this is the last section since the callback
  // is created before sections are built
  const isAdaptiveLastSectionRef = React.useRef(false);
  
  const adaptiveAptitude = useAdaptiveAptitude({
    studentId: studentId || '',
    gradeLevel: getAdaptiveGradeLevel(flow.gradeLevel || ('after12' as GradeLevel)),
    onTestComplete: (testResults) => {
      console.log('✅ Adaptive aptitude test completed:', testResults);
      console.log('📊 DEBUG onTestComplete:', {
        isAdaptiveLastSection: isAdaptiveLastSectionRef.current,
        currentSectionIndex: flow.currentSectionIndex,
        sectionsLength: sections.length,
        isLastSection: flow.isLastSection,
        showSectionComplete: flow.showSectionComplete
      });
      
      flow.setAnswer('adaptive_aptitude_results', testResults);
      
      // Always call completeSection to show the section complete screen
      // The auto-submit useEffect will handle submission if it's the last section
      console.log('🔄 Calling flow.completeSection()...');
      flow.completeSection();
      
      console.log('📊 DEBUG after completeSection:', {
        showSectionComplete: flow.showSectionComplete
      });
    },
    onError: (err) => {
      console.error('❌ Adaptive aptitude test error:', err);
      flow.setError(`Adaptive test error: ${err}`);
    },
  });
  
  // Track if initial check has been done (prevents re-running after assessment starts)
  const initialCheckDoneRef = React.useRef(false);
  
  // Track if adaptive section start is pending (waiting for questions to load)
  const adaptiveStartPendingRef = React.useRef(false);
  
  // Update the ref when sections change to track if adaptive is the last section
  useEffect(() => {
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      isAdaptiveLastSectionRef.current = lastSection?.isAdaptive === true;
      console.log('📊 isAdaptiveLastSection:', isAdaptiveLastSectionRef.current, 'sections:', sections.length);
    }
  }, [sections]);
  
  // Check for existing in-progress attempt on mount
  // OPTIMIZED: Start checking as soon as studentRecordId is available
  // FIXED: Only run ONCE on initial mount, not on every dependency change
  useEffect(() => {
    const checkExisting = async () => {
      // CRITICAL: Skip if we've already done the initial check
      // This prevents showing "Resume Your Assessment?" after user clicks "Start Section"
      if (initialCheckDoneRef.current) {
        console.log('⏭️ Skipping checkExisting - already done initial check');
        return;
      }
      
      // If still loading student record, wait
      if (dbLoading) {
        return;
      }
      
      // If no student record found, proceed to grade selection immediately
      if (!studentRecordId) {
        console.log('🚀 No student record, skipping to grade selection');
        initialCheckDoneRef.current = true;
        setCheckingExistingAttempt(false);
        flow.setCurrentScreen('grade_selection');
        return;
      }
      
      try {
        console.log('🔍 Checking for in-progress attempt...');
        const startTime = performance.now();
        const attempt = await checkInProgressAttempt();
        const endTime = performance.now();
        console.log(`✅ In-progress check completed in ${Math.round(endTime - startTime)}ms`);
        
        // Mark initial check as done BEFORE setting state
        initialCheckDoneRef.current = true;
        
        if (attempt) {
          setPendingAttempt(attempt);
          setShowResumePrompt(true);
        } else {
          flow.setCurrentScreen('grade_selection');
        }
      } catch (err) {
        console.error('Error checking existing attempt:', err);
        initialCheckDoneRef.current = true;
        flow.setCurrentScreen('grade_selection');
      } finally {
        setCheckingExistingAttempt(false);
      }
    };
    
    checkExisting();
  }, [studentRecordId, dbLoading, checkInProgressAttempt, skipResumeCheck]);
  
  // Build sections when grade level, stream, or AI questions change
  useEffect(() => {
    if (!flow.gradeLevel) return;
    
    // For stream-based assessments (after12, college), wait for stream selection
    // For middle/highschool, build sections immediately
    // For after10, we use 'general' stream which is set automatically in handleGradeSelect
    // For higher_secondary, students select their stream (Science/Commerce/Arts) before assessment
    const needsStream = ['higher_secondary', 'after12', 'college'].includes(flow.gradeLevel);
    const canBuild = flow.studentStream || !needsStream;
    
    if (canBuild) {
      const builtSections = buildSectionsWithQuestions(
        flow.gradeLevel,
        flow.studentStream,
        aiQuestions,
        flow.selectedCategory
      );
      setSections(builtSections);
    }
  }, [flow.gradeLevel, flow.studentStream, aiQuestions, flow.selectedCategory]);
  
  // FIX 2: Restore position after sections are built (handles race condition)
  useEffect(() => {
    console.log('🔄 useEffect: Restore position check', {
      hasPendingAttempt: !!pendingAttempt,
      sectionsLength: sections.length,
      currentScreen: flow.currentScreen
    });
    
    // Only run if we have a pending attempt and sections are now built
    if (!pendingAttempt || sections.length === 0) {
      console.log('⏭️ useEffect: Skipping - no pending attempt or no sections');
      return;
    }
    
    // Only run if we haven't restored position yet (check if we're still on loading/resume screen)
    if (flow.currentScreen !== 'loading' && flow.currentScreen !== 'resume_prompt') {
      console.log('⏭️ useEffect: Skipping - screen already set:', flow.currentScreen);
      return;
    }
    
    console.log('✅ useEffect: Conditions met, restoring position...');
    
    const sectionIndex = pendingAttempt.current_section_index ?? 0;
    const questionIndex = pendingAttempt.current_question_index ?? 0;
    
    // Validate that the section index is valid
    if (sectionIndex >= sections.length) {
      console.error('❌ Invalid section index:', sectionIndex, 'sections.length:', sections.length);
      // Start from beginning if invalid
      flow.setCurrentSectionIndex(0);
      flow.setCurrentQuestionIndex(0);
      flow.setCurrentScreen('section_intro');
      return;
    }
    
    const targetSection = sections[sectionIndex];
    console.log('✅ Sections built, restoring position:', { 
      sectionIndex, 
      questionIndex, 
      sectionsCount: sections.length,
      sectionId: targetSection?.id,
      isAdaptive: targetSection?.isAdaptive,
      elapsedTime: pendingAttempt.elapsed_time,
      timerRemaining: pendingAttempt.timer_remaining
    });
    
    flow.setCurrentSectionIndex(sectionIndex);
    
    // FIX: Restore elapsed time when restoring position after sections are built
    if (pendingAttempt.elapsed_time !== null && pendingAttempt.elapsed_time !== undefined) {
      console.log('⏱️ Restoring elapsed_time after sections built:', pendingAttempt.elapsed_time);
      flow.setElapsedTime(pendingAttempt.elapsed_time);
    }
    
    // FIX: Restore timer remaining for timed sections
    if (pendingAttempt.timer_remaining !== null && pendingAttempt.timer_remaining !== undefined) {
      console.log('⏱️ Restoring timer_remaining after sections built:', pendingAttempt.timer_remaining);
      flow.setTimeRemaining(pendingAttempt.timer_remaining);
    }
    
    // FIX: For adaptive sections, don't set questionIndex
    // The adaptive hook manages its own question state
    if (targetSection?.isAdaptive) {
      console.log('🎯 Adaptive section detected - letting adaptive hook manage questions');
      // Adaptive session was already resumed in handleResumeAssessment
      // Just set to question 0 and let adaptive hook take over
      flow.setCurrentQuestionIndex(0);
      flow.setShowSectionIntro(false);
      flow.setCurrentScreen('assessment');
      console.log('✅ useEffect: Screen set to assessment (adaptive)');
    } else {
      // For regular sections, restore the exact question index
      const questionCount = targetSection?.questions?.length || 0;
      
      // Check if question index is out of bounds (past last question)
      if (questionIndex >= questionCount && questionCount > 0) {
        console.warn(`⚠️ Question index ${questionIndex} is out of bounds (section has ${questionCount} questions)`);
        console.log('✅ Section already complete - moving to next section or showing complete');
        
        // Set to last valid question
        flow.setCurrentQuestionIndex(Math.max(0, questionCount - 1));
        
        // Check if this is the last section
        const isLastSection = sectionIndex === sections.length - 1;
        
        if (isLastSection) {
          console.log('✅ Last section complete - ready to submit');
          // Show section complete screen so user can submit
          flow.setShowSectionIntro(false);
          flow.setCurrentScreen('assessment');
          setTimeout(() => {
            flow.completeSection();
          }, 100);
        } else {
          console.log('✅ Moving to next section:', sectionIndex + 1);
          // Move to next section automatically
          flow.setCurrentSectionIndex(sectionIndex + 1);
          flow.setCurrentQuestionIndex(0);
          flow.setShowSectionIntro(true);
          flow.setCurrentScreen('section_intro');
        }
      } else {
        // Normal resume - set question index
        flow.setCurrentQuestionIndex(questionIndex);
        
        if (questionIndex > 0) {
          // If we're in the middle of a section, skip the intro
          flow.setShowSectionIntro(false);
          flow.setCurrentScreen('assessment');
          console.log('✅ useEffect: Screen set to assessment (mid-section)');
        } else {
          flow.setCurrentScreen('section_intro');
          console.log('✅ useEffect: Screen set to section_intro');
        }
      }
    }
    
    console.log('🏁 useEffect: Position restoration completed');
  }, [sections.length, pendingAttempt, flow.currentScreen]);
  
  // Timer effects
  useEffect(() => {
    console.log('⏱️ Timer useEffect triggered:', {
      showSectionIntro: flow.showSectionIntro,
      showSectionComplete: flow.showSectionComplete,
      isSubmitting: flow.isSubmitting,
      currentSectionIndex: flow.currentSectionIndex,
      elapsedTime: flow.elapsedTime,
      sectionsLength: sections.length
    });
    
    if (flow.showSectionIntro || flow.showSectionComplete || flow.isSubmitting) {
      console.log('⏱️ Timer BLOCKED - Early return due to:', {
        showSectionIntro: flow.showSectionIntro,
        showSectionComplete: flow.showSectionComplete,
        isSubmitting: flow.isSubmitting
      });
      return;
    }
    
    const currentSection = sections[flow.currentSectionIndex];
    if (!currentSection) {
      console.log('⏱️ Timer BLOCKED - No current section');
      return;
    }
    
    console.log('⏱️ Timer ACTIVE - Section:', {
      sectionId: currentSection.id,
      sectionTitle: currentSection.title,
      isTimed: currentSection.isTimed,
      isAptitude: currentSection.isAptitude,
      isKnowledge: currentSection.isKnowledge,
      timeRemaining: flow.timeRemaining,
      elapsedTime: flow.elapsedTime
    });
    
    // For aptitude and knowledge sections: ALWAYS use elapsed time counter
    // These sections use per-question timers, not section-level countdown
    if (currentSection.isAptitude || currentSection.isKnowledge) {
      console.log('⏱️ Starting elapsed time counter (aptitude/knowledge section)');
      const interval = setInterval(() => {
        console.log('⏱️ Elapsed time tick:', flow.elapsedTime, '→', flow.elapsedTime + 1);
        flow.setElapsedTime(flow.elapsedTime + 1);
      }, 1000);
      return () => {
        console.log('⏱️ Cleaning up elapsed time counter');
        clearInterval(interval);
      };
    }
    
    // Elapsed time counter for non-timed sections
    if (!currentSection.isTimed || flow.timeRemaining === null) {
      console.log('⏱️ Starting elapsed time counter (non-timed or timeRemaining not set)');
      const interval = setInterval(() => {
        console.log('⏱️ Elapsed time tick:', flow.elapsedTime, '→', flow.elapsedTime + 1);
        flow.setElapsedTime(flow.elapsedTime + 1);
      }, 1000);
      return () => {
        console.log('⏱️ Cleaning up elapsed time counter');
        clearInterval(interval);
      };
    }
    
    // Countdown timer for timed sections (not aptitude/knowledge)
    if (currentSection.isTimed && flow.timeRemaining !== null && flow.timeRemaining > 0) {
      console.log('⏱️ Starting countdown timer for timed section');
      const interval = setInterval(() => {
        console.log('⏱️ Countdown tick:', flow.timeRemaining, '→', flow.timeRemaining! - 1);
        flow.setTimeRemaining(flow.timeRemaining! - 1);
      }, 1000);
      return () => {
        console.log('⏱️ Cleaning up countdown timer');
        clearInterval(interval);
      };
    }
    
    // Auto-advance when time runs out
    if (currentSection.isTimed && flow.timeRemaining === 0) {
      console.log('⏱️ Time expired - auto-advancing');
      handleNextQuestion();
    }
  }, [flow.showSectionIntro, flow.showSectionComplete, flow.isSubmitting, flow.currentSectionIndex, flow.timeRemaining, flow.elapsedTime, sections]);
  
  // Aptitude and Knowledge per-question timer
  useEffect(() => {
    const currentSection = sections[flow.currentSectionIndex];
    // Check if this is aptitude individual phase OR knowledge section
    const hasIndividualTimer = (currentSection?.isAptitude && flow.aptitudePhase === 'individual') || currentSection?.isKnowledge;
    
    if (!hasIndividualTimer) return;
    if (flow.showSectionIntro || flow.showSectionComplete) return;
    
    if (flow.aptitudeQuestionTimer > 0) {
      const interval = setInterval(() => {
        flow.setAptitudeQuestionTimer(flow.aptitudeQuestionTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Auto-advance when individual question time runs out
      handleNextQuestion();
    }
  }, [flow.aptitudeQuestionTimer, flow.aptitudePhase, flow.showSectionIntro, flow.showSectionComplete, flow.currentSectionIndex, sections]);
  
  // Adaptive aptitude per-question timer (90 seconds)
  useEffect(() => {
    const currentSection = sections[flow.currentSectionIndex];
    if (!currentSection?.isAdaptive) return;
    if (flow.showSectionIntro || flow.showSectionComplete) return;
    if (adaptiveAptitude.loading || adaptiveAptitude.submitting) return;
    if (!adaptiveAptitude.currentQuestion) return;
    
    if (adaptiveQuestionTimer > 0) {
      const interval = setInterval(() => {
        setAdaptiveQuestionTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Auto-submit when time runs out - select a random answer if none selected
      if (adaptiveAptitudeAnswer) {
        adaptiveAptitude.submitAnswer(adaptiveAptitudeAnswer as 'A' | 'B' | 'C' | 'D');
        setAdaptiveAptitudeAnswer(null);
        setAdaptiveQuestionTimer(90); // Reset for next question
      } else {
        // No answer selected, auto-submit 'A' as default
        adaptiveAptitude.submitAnswer('A');
        setAdaptiveQuestionTimer(90); // Reset for next question
      }
    }
  }, [adaptiveQuestionTimer, adaptiveAptitudeAnswer, adaptiveAptitude.currentQuestion, adaptiveAptitude.loading, adaptiveAptitude.submitting, flow.showSectionIntro, flow.showSectionComplete, flow.currentSectionIndex, sections]);
  
  // Reset adaptive timer when question changes
  useEffect(() => {
    if (adaptiveAptitude.currentQuestion) {
      setAdaptiveQuestionTimer(90);
    }
  }, [adaptiveAptitude.currentQuestion?.id]);
  
  // Auto-start adaptive section once questions are loaded
  // This handles the case where user clicked "Start Section" but questions were still loading
  useEffect(() => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // If we're on an adaptive section intro and questions just finished loading
    if (
      currentSection?.isAdaptive &&
      flow.showSectionIntro &&
      adaptiveStartPendingRef.current &&
      !adaptiveAptitude.loading &&
      adaptiveAptitude.currentQuestion
    ) {
      console.log('✅ Adaptive questions loaded, starting section...');
      adaptiveStartPendingRef.current = false;
      flow.startSection();
    }
  }, [adaptiveAptitude.loading, adaptiveAptitude.currentQuestion, flow.showSectionIntro, flow.currentSectionIndex, sections]);
  
  // Link adaptive aptitude session to assessment attempt when session is created
  useEffect(() => {
    const linkAdaptiveSession = async () => {
      if (adaptiveAptitude.session?.id && currentAttempt?.id && useDatabase) {
        console.log('🔗 Linking adaptive session to attempt:', {
          adaptiveSessionId: adaptiveAptitude.session.id,
          attemptId: currentAttempt.id
        });
        try {
          await assessmentService.updateAttemptAdaptiveSession(
            currentAttempt.id,
            adaptiveAptitude.session.id
          );
          console.log('✅ Adaptive session linked to attempt');
        } catch (err) {
          console.warn('⚠️ Could not link adaptive session to attempt:', err);
        }
      }
    };
    
    linkAdaptiveSession();
  }, [adaptiveAptitude.session?.id, currentAttempt?.id, useDatabase]);
  
  // FIX: Periodically save elapsed time to database (every 10 seconds)
  // This ensures the timer can be restored accurately when resuming
  useEffect(() => {
    if (!useDatabase || !currentAttempt?.id) return;
    if (flow.showSectionIntro || flow.showSectionComplete || flow.isSubmitting) return;
    
    // Save elapsed time every 10 seconds
    if (flow.elapsedTime > 0 && flow.elapsedTime % 10 === 0) {
      const currentSection = sections[flow.currentSectionIndex];
      const timerRemaining = currentSection?.isTimed ? flow.timeRemaining : null;
      
      console.log('⏱️ Auto-saving timer state:', {
        elapsedTime: flow.elapsedTime,
        timerRemaining,
        sectionIndex: flow.currentSectionIndex
      });
      
      dbUpdateProgress(
        flow.currentSectionIndex,
        flow.currentQuestionIndex,
        flow.sectionTimings,
        timerRemaining,
        flow.elapsedTime,
        flow.answers
      );
    }
  }, [
    flow.elapsedTime,
    flow.timeRemaining,
    flow.currentSectionIndex,
    flow.currentQuestionIndex,
    flow.sectionTimings,
    flow.answers,
    flow.showSectionIntro,
    flow.showSectionComplete,
    flow.isSubmitting,
    useDatabase,
    currentAttempt?.id,
    dbUpdateProgress,
    sections
  ]);
  
  // FIX: Update database progress when adaptive aptitude question changes
  useEffect(() => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // Only update if we're in an adaptive section with an active session
    if (!currentSection?.isAdaptive) return;
    if (!adaptiveAptitude.session?.id) return;
    if (!useDatabase || !currentAttempt?.id) return;
    
    // Update progress whenever the adaptive question changes (after answer is submitted)
    const questionsAnswered = adaptiveAptitude.progress?.questionsAnswered || 0;
    
    if (questionsAnswered > 0) {
      console.log('📊 Updating adaptive progress in database:', {
        sectionIndex: flow.currentSectionIndex,
        questionsAnswered,
        phase: adaptiveAptitude.progress?.currentPhase
      });
      
      // Update the attempt with current section index and adaptive progress
      dbUpdateProgress(
        flow.currentSectionIndex,
        questionsAnswered, // Use questions answered as question index
        flow.sectionTimings,
        null, // No timer for adaptive
        flow.elapsedTime,
        flow.answers
      );
    }
  }, [
    adaptiveAptitude.progress?.questionsAnswered,
    adaptiveAptitude.session?.id,
    flow.currentSectionIndex,
    sections,
    useDatabase,
    currentAttempt?.id,
    dbUpdateProgress,
    flow.sectionTimings,
    flow.elapsedTime,
    flow.answers
  ]);
  
  // Handlers
  const handleGradeSelect = useCallback(async (level: GradeLevel) => {
    flow.setGradeLevel(level);
    
    // Determine next screen based on grade level
    // after12 and higher_secondary: Show category selection (Science/Commerce/Arts)
    // after10: Skip stream selection, use 'general' (AI will recommend best stream)
    // college and below: Skip category/stream selection
    if (level === 'after12' || level === 'higher_secondary') {
      // Show category selection for after12 and higher_secondary students
      // They need to select Science/Commerce/Arts first, then specific stream
      flow.setCurrentScreen('category_selection');
    } else if (level === 'after10') {
      // After 10th (11th grade) students skip stream selection - use 'general' stream
      // The AI analysis will recommend the best stream based on their assessment results
      flow.setStudentStream('general');
      setAssessmentStarted(true);
      
      // DON'T create attempt here - wait until user clicks "Start Section"
      // This prevents orphan attempts when user just browses
      
      flow.setCurrentScreen('section_intro');
    } else if (level === 'college') {
      // College students (UG/PG) skip category selection - use their program directly
      setAssessmentStarted(true);
      
      // Normalize the program name to fit database constraints (max 20 chars)
      const normalizedStreamId = normalizeStreamId(studentProgram || 'college');
      console.log(`🎓 College student: ${studentProgram} -> normalized: ${normalizedStreamId}`);
      
      flow.setStudentStream(normalizedStreamId);
      
      // DON'T create attempt here - wait until user clicks "Start Section"
      // This prevents orphan attempts when user just browses
      
      flow.setCurrentScreen('section_intro');
    } else if (level === 'middle') {
      // Middle school (6-8) - use 'middle_school' stream
      flow.setStudentStream('middle_school');
      setAssessmentStarted(true);
      flow.setCurrentScreen('section_intro');
    } else if (level === 'highschool') {
      // High school (9-10) - use 'high_school' stream
      flow.setStudentStream('high_school');
      setAssessmentStarted(true);
      flow.setCurrentScreen('section_intro');
    } else {
      // Fallback for any other grade level
      setAssessmentStarted(true);
      flow.setCurrentScreen('section_intro');
    }
  }, [flow, studentRecordId, dbStartAssessment, studentProgram]);
  
  const handleCategorySelect = useCallback(async (category: string) => {
    flow.setSelectedCategory(category);
    
    // Show stream selection screen for the selected category
    // This allows students to choose specific streams like PCMB, Commerce with Maths, Arts with Psychology, etc.
    flow.setCurrentScreen('stream_selection');
  }, [flow]);
  
  const handleStreamSelect = useCallback(async (stream: string) => {
    flow.setStudentStream(stream);
    setAssessmentStarted(true);
    
    // DON'T create attempt here - wait until user clicks "Start Section"
    // This prevents orphan attempts when user just browses
    
    flow.setCurrentScreen('section_intro');
  }, [flow, studentRecordId, dbStartAssessment]);
  
  const handleResumeAssessment = useCallback(async () => {
    if (!pendingAttempt) return;
    
    console.log('🔄 Starting assessment resume process...');
    console.log('📋 Pending attempt DATABASE VALUES:', {
      id: pendingAttempt.id,
      gradeLevel: pendingAttempt.grade_level,
      stream: pendingAttempt.stream_id,
      sectionIndex: pendingAttempt.current_section_index,
      questionIndex: pendingAttempt.current_question_index,
      hasAdaptiveSession: !!pendingAttempt.adaptive_aptitude_session_id,
      hasTimerRemaining: pendingAttempt.timer_remaining !== null,
      hasElapsedTime: pendingAttempt.elapsed_time !== null,
      hasSectionTimings: !!pendingAttempt.section_timings,
      sectionsLength: sections.length,
      questionsLoading,
      // CRITICAL DEBUG: Show raw database values
      rawSectionIndex: pendingAttempt.current_section_index,
      rawQuestionIndex: pendingAttempt.current_question_index,
      sectionTimings: pendingAttempt.section_timings
    });
    
    // CRITICAL: Validate database values before proceeding
    const dbSectionIndex = pendingAttempt.current_section_index;
    const dbQuestionIndex = pendingAttempt.current_question_index;
    
    if (dbSectionIndex === null || dbSectionIndex === undefined) {
      console.error('❌ CRITICAL: current_section_index is null/undefined in database!');
      console.error('❌ This indicates a database save issue. Starting from beginning.');
      // Start from beginning if database values are invalid
      flow.setCurrentSectionIndex(0);
      flow.setCurrentQuestionIndex(0);
      flow.setCurrentScreen('section_intro');
      setShowResumePrompt(false);
      setAssessmentStarted(true);
      setUseDatabase(true);
      return;
    }
    
    if (dbQuestionIndex === null || dbQuestionIndex === undefined) {
      console.error('❌ CRITICAL: current_question_index is null/undefined in database!');
      console.error('❌ This indicates a database save issue. Using section index only.');
    }
    
    setShowResumePrompt(false);
    setAssessmentStarted(true);
    setUseDatabase(true);
    
    console.log('✅ Resume prompt hidden, database enabled');
    
    // Restore state from pending attempt
    flow.setGradeLevel(pendingAttempt.grade_level as GradeLevel);
    flow.setStudentStream(pendingAttempt.stream_id);
    
    console.log('✅ Grade level and stream restored');
    
    // FIX 4: Restore timer state
    if (pendingAttempt.timer_remaining !== null && pendingAttempt.timer_remaining !== undefined) {
      console.log('⏱️ Restoring timer_remaining:', pendingAttempt.timer_remaining);
      flow.setTimeRemaining(pendingAttempt.timer_remaining);
    }
    if (pendingAttempt.elapsed_time !== null && pendingAttempt.elapsed_time !== undefined) {
      console.log('⏱️ Restoring elapsed_time:', pendingAttempt.elapsed_time);
      flow.setElapsedTime(pendingAttempt.elapsed_time);
    }
    
    // FIX 5: Restore section timings
    if (pendingAttempt.section_timings) {
      console.log('📊 Restoring section timings:', pendingAttempt.section_timings);
      flow.setSectionTimings(pendingAttempt.section_timings);
    }
    
    // Restore answers from UUID-based responses (personal_assessment_responses table)
    if (pendingAttempt.restoredResponses) {
      console.log('💾 Restoring', Object.keys(pendingAttempt.restoredResponses).length, 'UUID-based answers');
      Object.entries(pendingAttempt.restoredResponses).forEach(([key, value]) => {
        flow.setAnswer(key, value);
      });
    }
    
    // FIX: Restore non-UUID answers from all_responses column (RIASEC, BigFive, Values, Employability)
    if (pendingAttempt.all_responses) {
      console.log('💾 Restoring', Object.keys(pendingAttempt.all_responses).length, 'non-UUID answers from all_responses');
      Object.entries(pendingAttempt.all_responses).forEach(([key, value]) => {
        flow.setAnswer(key, value);
      });
    }
    
    console.log('✅ Answers restored');
    
    // FIX 1: Resume adaptive aptitude session if exists
    if (pendingAttempt.adaptive_aptitude_session_id) {
      console.log('🎯 Resuming adaptive aptitude session:', pendingAttempt.adaptive_aptitude_session_id);
      try {
        await adaptiveAptitude.resumeTest(pendingAttempt.adaptive_aptitude_session_id);
        console.log('✅ Adaptive aptitude session resumed successfully');
      } catch (err) {
        console.warn('⚠️ Could not resume adaptive session:', err);
        // Continue with regular resume - adaptive section will restart if needed
      }
    }
    
    // FIX 3: Check if we need to wait for AI questions
    const needsAIQuestions = ['after10', 'after12', 'college'].includes(pendingAttempt.grade_level);
    console.log('🔍 Checking if AI questions needed:', { needsAIQuestions, questionsLoading, sectionsLength: sections.length });
    
    if (needsAIQuestions && questionsLoading) {
      console.log('⏳ Waiting for AI questions to load before resuming position...');
      // Set screen to loading so useEffect can detect and restore position later
      flow.setCurrentScreen('loading');
      console.log('✅ Screen set to loading, waiting for AI questions...');
      // Position will be restored in the useEffect below once sections are built
      return;
    }
    
    // Use validated database values
    const sectionIndex = dbSectionIndex ?? 0;
    const questionIndex = dbQuestionIndex ?? 0;
    
    console.log('📍 RESUME TARGET POSITION:', { 
      sectionIndex, 
      questionIndex,
      sectionsAvailable: sections.length,
      willWaitForSections: sections.length === 0
    });
    
    // FIX 2: Only restore position if sections are already built
    // Otherwise, let the useEffect below handle it once sections are ready
    if (sections.length > 0) {
      // CRITICAL: Validate section index against actual sections
      if (sectionIndex >= sections.length) {
        console.error('❌ CRITICAL: Database section index', sectionIndex, 'is out of bounds! Available sections:', sections.length);
        console.error('❌ Available sections:', sections.map((s, i) => `${i}: ${s.id}`));
        console.error('❌ This indicates a mismatch between database and current sections. Starting from beginning.');
        
        // Start from beginning if section index is invalid
        flow.setCurrentSectionIndex(0);
        flow.setCurrentQuestionIndex(0);
        flow.setCurrentScreen('section_intro');
        return;
      }
      
      const targetSection = sections[sectionIndex];
      console.log('✅ Sections already built, restoring position immediately', {
        sectionIndex,
        questionIndex,
        sectionId: targetSection?.id,
        isAdaptive: targetSection?.isAdaptive,
        questionCount: targetSection?.questions?.length
      });
      
      flow.setCurrentSectionIndex(sectionIndex);
      
      // FIX: For adaptive sections, don't set questionIndex
      // The adaptive hook manages its own question state
      if (targetSection?.isAdaptive) {
        console.log('🎯 Adaptive section detected - letting adaptive hook manage questions');
        // Adaptive session was already resumed above
        // Just set to question 0 and let adaptive hook take over
        flow.setCurrentQuestionIndex(0);
        flow.setShowSectionIntro(false);
        flow.setCurrentScreen('assessment');
        console.log('✅ Screen set to assessment (adaptive)');
      } else {
        // For regular sections, restore the exact question index
        const questionCount = targetSection?.questions?.length || 0;
        
        console.log('📊 Regular section validation:', {
          questionIndex,
          questionCount,
          isOutOfBounds: questionIndex >= questionCount
        });
        
        // Check if question index is out of bounds (past last question)
        if (questionIndex >= questionCount && questionCount > 0) {
          console.warn(`⚠️ Question index ${questionIndex} is out of bounds (section has ${questionCount} questions)`);
          console.log('✅ Section already complete - moving to next section or showing complete');
          
          // Set to last valid question
          flow.setCurrentQuestionIndex(Math.max(0, questionCount - 1));
          
          // Check if this is the last section
          const isLastSection = sectionIndex === sections.length - 1;
          
          if (isLastSection) {
            console.log('✅ Last section complete - ready to submit');
            // Show section complete screen so user can submit
            flow.setShowSectionIntro(false);
            flow.setCurrentScreen('assessment');
            setTimeout(() => {
              flow.completeSection();
            }, 100);
          } else {
            console.log('✅ Moving to next section:', sectionIndex + 1);
            // Move to next section automatically
            flow.setCurrentSectionIndex(sectionIndex + 1);
            flow.setCurrentQuestionIndex(0);
            flow.setShowSectionIntro(true);
            flow.setCurrentScreen('section_intro');
          }
        } else if (questionIndex > 0) {
          // If we're in the middle of a section, skip the intro
          flow.setCurrentQuestionIndex(questionIndex);
          flow.setShowSectionIntro(false);
          flow.setCurrentScreen('assessment');
          console.log('✅ Screen set to assessment (mid-section), question:', questionIndex);
        } else {
          // Start of section - show intro
          flow.setCurrentQuestionIndex(questionIndex);
          flow.setCurrentScreen('section_intro');
          console.log('✅ Screen set to section_intro, question:', questionIndex);
        }
      }
    } else {
      console.log('⏳ Sections not built yet, will restore position once ready');
      // Set screen to loading so useEffect can detect and restore position later
      flow.setCurrentScreen('loading');
      console.log('✅ Screen set to loading, waiting for sections to build...');
      // Position will be restored in useEffect below
    }
    
    console.log('🏁 handleResumeAssessment completed');
  }, [pendingAttempt, flow, adaptiveAptitude, questionsLoading, sections.length]);
  
  const handleStartNewAssessment = useCallback(async () => {
    console.log('🔄 Starting new assessment (abandoning previous)...');
    
    if (pendingAttempt?.id) {
      try {
        console.log('🗑️ Abandoning attempt:', pendingAttempt.id);
        await assessmentService.abandonAttempt(pendingAttempt.id);
        console.log('✅ Attempt abandoned successfully');
      } catch (err) {
        console.error('❌ Error abandoning attempt:', err);
        // Continue anyway - user wants to start fresh
      }
    }
    
    // Clear all resume-related state
    setShowResumePrompt(false);
    setPendingAttempt(null);
    setCheckingExistingAttempt(false);
    setSkipResumeCheck(true); // Prevent resume check from running again
    
    // Clear current attempt from useAssessment hook
    if (currentAttempt?.id) {
      try {
        await assessmentService.abandonAttempt(currentAttempt.id);
      } catch (err) {
        console.error('Error abandoning current attempt:', err);
      }
    }
    
    // Go to grade selection
    flow.setCurrentScreen('grade_selection');
    console.log('✅ Ready to start new assessment');
  }, [pendingAttempt, currentAttempt, flow]);
  
  const handleStartSection = useCallback(async () => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // SAFEGUARD: Ensure resume prompt is hidden when starting a section
    // This prevents any race conditions from showing the prompt
    if (showResumePrompt) {
      setShowResumePrompt(false);
      setPendingAttempt(null);
    }
    
    // Create database attempt on first section start (if not already created)
    if (flow.currentSectionIndex === 0 && !currentAttempt && studentRecordId) {
      try {
        console.log('📝 Creating assessment attempt on first section start...');
        setUseDatabase(true);
        
        // Determine the appropriate stream ID based on grade level
        let streamId = flow.studentStream;
        if (!streamId) {
          // Fallback based on grade level if stream wasn't set
          switch (flow.gradeLevel) {
            case 'middle':
              streamId = 'middle_school';
              break;
            case 'highschool':
              streamId = 'high_school';
              break;
            default:
              streamId = 'general';
          }
          console.log(`⚠️ Stream not set, using fallback: ${streamId} for grade level: ${flow.gradeLevel}`);
        }
        
        await dbStartAssessment(streamId, flow.gradeLevel || 'after10');
      } catch (err) {
        console.error('Error starting assessment:', err);
      }
    }
    
    // Initialize timer for timed sections
    if (currentSection?.isTimed && currentSection.timeLimit) {
      flow.setTimeRemaining(currentSection.timeLimit);
    }
    
    // Reset elapsed time
    flow.setElapsedTime(0);
    
    // Reset aptitude question timer for aptitude section
    if (currentSection?.isAptitude) {
      flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
    }
    
    // Reset question timer for knowledge section (reuse aptitudeQuestionTimer state)
    if (currentSection?.isKnowledge) {
      flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
    }
    
    // Initialize adaptive test
    if (currentSection?.isAdaptive && !adaptiveAptitude.session) {
      // Set pending flag so useEffect knows to start section when questions load
      adaptiveStartPendingRef.current = true;
      // Start the adaptive test (async - questions will load in background)
      adaptiveAptitude.startTest();
      // Don't call flow.startSection() here - the useEffect will do it once questions are ready
      return;
    }
    
    flow.startSection();
  }, [sections, flow, adaptiveAptitude, currentAttempt, studentRecordId, dbStartAssessment, showResumePrompt]);
  
  const handleNextQuestion = useCallback(async () => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // CRITICAL FIX 1: Race Condition Protection
    if (flow.isSaving) {
      console.log('⏳ [RACE PROTECTION] Already saving, ignoring click');
      return;
    }
    
    console.log('🔄 [NEXT QUESTION] Starting navigation with save-first logic:', {
      currentSectionIndex: flow.currentSectionIndex,
      currentQuestionIndex: flow.currentQuestionIndex,
      sectionId: currentSection?.id,
      totalQuestions: currentSection?.questions?.length,
      useDatabase,
      hasCurrentAttempt: !!currentAttempt?.id,
      isSaving: flow.isSaving
    });
    
    // Handle adaptive section
    if (currentSection?.isAdaptive) {
      if (adaptiveAptitude.submitting) {
        console.log('⏳ Already submitting adaptive answer, ignoring click');
        return;
      }
      
      if (adaptiveAptitudeAnswer !== null) {
        console.log('🎯 [ADAPTIVE] Submitting answer:', adaptiveAptitudeAnswer);
        adaptiveAptitude.submitAnswer(adaptiveAptitudeAnswer as 'A' | 'B' | 'C' | 'D');
        setAdaptiveAptitudeAnswer(null);
      }
      return;
    }
    
    // CRITICAL: Block navigation if database is required but we can't save
    if (useDatabase && !currentAttempt?.id) {
      console.error('❌ [SAVE BLOCK] Cannot save - no current attempt ID');
      showToastError('Assessment session not found. Please refresh the page and try again.');
      return;
    }
    
    // CRITICAL FIX 2: Set saving state and clear previous errors
    flow.setIsSaving(true);
    if (flow.error) {
      flow.setError(null);
    }
    
    try {
      // Calculate navigation positions
      const isLastInSection = flow.currentQuestionIndex >= (currentSection?.questions?.length - 1);
      const isEvery10th = (flow.currentQuestionIndex + 1) % 10 === 0;
      const nextQuestionIndex = flow.currentQuestionIndex + 1;
      const nextSectionIndex = isLastInSection ? flow.currentSectionIndex + 1 : flow.currentSectionIndex;
      const finalQuestionIndex = isLastInSection ? 0 : nextQuestionIndex;
      
      console.log('📊 [SAVE STRATEGY] Determining save approach:', {
        isLastInSection,
        isEvery10th,
        nextPosition: { section: nextSectionIndex, question: finalQuestionIndex },
        saveStrategy: isLastInSection ? 'CRITICAL' : isEvery10th ? 'CHECKPOINT' : 'LIGHT'
      });
      
      // Reset timers before navigation
      if (currentSection?.isAptitude && flow.aptitudePhase === 'individual') {
        flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
      }
      if (currentSection?.isKnowledge) {
        flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
      }
      
      // Smart save strategy based on importance
      if (useDatabase && currentAttempt?.id) {
        const updatedAnswers = { ...flow.answers };
        
        if (isLastInSection) {
          // CRITICAL SAVE: Block at section boundaries (data integrity)
          console.log('💾 [CRITICAL SAVE] Section boundary - blocking save for data integrity');
          const saveStartTime = performance.now();
          const saveResult = await dbUpdateProgress(
            nextSectionIndex,
            finalQuestionIndex,
            flow.sectionTimings,
            null,
            null,
            updatedAnswers
          );
          const saveEndTime = performance.now();
          const saveDuration = Math.round(saveEndTime - saveStartTime);
          
          console.log('📊 [CRITICAL SAVE] Completed:', {
            success: saveResult?.success,
            duration: `${saveDuration}ms`,
            error: saveResult?.error || 'none'
          });
          
          if (!saveResult?.success) {
            console.error('❌ [SAVE BLOCK] Critical save failed - Navigation BLOCKED');
            console.error('❌ [SAVE BLOCK] Save result:', saveResult);
            showToastError('Failed to save your progress. Please check your internet connection and try again.');
            return; // BLOCK NAVIGATION - critical save failed
          }
          
          console.log('✅ [CRITICAL SAVE] Success - Navigation ALLOWED');
        } else {
          // For non-critical saves, try to save first, then navigate
          console.log('💾 [BACKGROUND SAVE] Attempting save before navigation...');
          
          if (isEvery10th) {
            // CHECKPOINT SAVE: Try to save, block if it fails
            const saveResult = await dbUpdateProgress(
              nextSectionIndex,
              finalQuestionIndex,
              flow.sectionTimings,
              null,
              null,
              updatedAnswers
            );
            
            if (!saveResult?.success) {
              console.error('❌ [SAVE BLOCK] Checkpoint save failed - Navigation BLOCKED');
              console.error('❌ [SAVE BLOCK] Save result:', saveResult);
              showToastError('Failed to save your progress. Please check your internet connection and try again.');
              return; // BLOCK NAVIGATION - checkpoint save failed
            }
            
            console.log('✅ [CHECKPOINT SAVE] Success - Navigation ALLOWED');
          } else {
            // LIGHT SAVE: Try to save, block if it fails
            const saveResult = await dbUpdateProgress(
              nextSectionIndex,
              finalQuestionIndex,
              {}, // Empty section timings for light save
              null,
              null,
              {} // Empty answers for light save
            );
            
            if (!saveResult?.success) {
              console.error('❌ [SAVE BLOCK] Light save failed - Navigation BLOCKED');
              console.error('❌ [SAVE BLOCK] Save result:', saveResult);
              showToastError('Failed to save your progress. Please check your internet connection and try again.');
              return; // BLOCK NAVIGATION - light save failed
            }
            
            console.log('✅ [LIGHT SAVE] Success - Navigation ALLOWED');
          }
          
          // Only navigate after successful save
          console.log('🚀 [NAVIGATION] Proceeding with navigation after successful save');
          flow.goToNextQuestion();
          console.log('✅ [NAVIGATION] Navigation completed');
          return; // Early return for non-critical saves
        }
      } else {
        console.log('⏭️ [SAVE] Database disabled - allowing navigation without save');
      }
      
      // Navigate after critical save or when database is disabled
      console.log('🚀 [NAVIGATION] Proceeding with navigation after critical save');
      flow.goToNextQuestion();
      console.log('✅ [NAVIGATION] Navigation completed');
      
    } catch (error: any) {
      // CRITICAL FIX 3: Handle network errors and other exceptions
      console.error('❌ [CRITICAL ERROR] Unexpected error during navigation:', error);
      
      // Provide user-friendly error messages based on error type
      if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
        showToastError('Network connection lost. Please check your internet connection and try again.');
      } else if (error?.message?.includes('timeout')) {
        showToastError('Request timed out. Please try again.');
      } else if (error?.message?.includes('session')) {
        showToastError('Your session has expired. Please refresh the page and try again.');
      } else {
        showToastError('An unexpected error occurred. Please try again or refresh the page.');
      }
      
      // Don't navigate on error
      return;
    } finally {
      // CRITICAL FIX 4: Always clear saving state in finally block
      console.log('🔓 [SAVE] Clearing isSaving state in finally block');
      flow.setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, flow, adaptiveAptitude, adaptiveAptitudeAnswer, useDatabase, currentAttempt, dbUpdateProgress]);
  
  const handleNextSection = useCallback(async () => {
    // Compute isLastSection directly to avoid stale closure issues
    const isLastSection = flow.currentSectionIndex === sections.length - 1;
    
    console.log('🔄 handleNextSection called!');
    console.log('📊 handleNextSection state:', {
      isLastSection,
      flowIsLastSection: flow.isLastSection,
      currentSectionIndex: flow.currentSectionIndex,
      sectionsLength: sections.length,
      gradeLevel: flow.gradeLevel,
      useDatabase,
      hasCurrentAttempt: !!currentAttempt?.id,
      currentAttemptId: currentAttempt?.id
    });
    
    if (isLastSection) {
      console.log('✅ This IS the last section - proceeding to submit');
      
      // IMPORTANT: Set submitting state IMMEDIATELY so the UI shows loading
      // This prevents the button from appearing unresponsive during database fetch
      flow.setIsSubmitting(true);
      
      // CRITICAL FIX: Load answers and section timings from database before submitting
      // Don't rely on flow.answers/flow.sectionTimings because of async state updates
      let answersToSubmit = flow.answers;
      let timingsToSubmit = flow.sectionTimings;
      
      if (useDatabase && currentAttempt?.id) {
        try {
          // Fetch the latest attempt data with all_responses and section_timings
          const { data: attemptData, error: fetchError } = await supabase
            .from('personal_assessment_attempts')
            .select('all_responses, section_timings')
            .eq('id', currentAttempt.id)
            .single();
          
          if (!fetchError && attemptData) {
            if (attemptData.all_responses) {
              console.log('✅ Loaded answers from database for submission:', Object.keys(attemptData.all_responses).length);
              answersToSubmit = attemptData.all_responses;
            } else {
              console.warn('⚠️ Could not load answers from database, using flow.answers');
            }
            
            if (attemptData.section_timings) {
              console.log('✅ Loaded section timings from database for submission:', attemptData.section_timings);
              timingsToSubmit = attemptData.section_timings;
            } else {
              console.warn('⚠️ Could not load section timings from database, using flow.sectionTimings');
            }
          }
        } catch (err) {
          console.error('Error loading data from database:', err);
        }
      }
      
      // Submit assessment with the correct answers and timings
      console.log('🚀 Calling submission.submit with:', {
        answersCount: Object.keys(answersToSubmit).length,
        sectionsCount: sections.length,
        studentStream: flow.studentStream,
        gradeLevel: flow.gradeLevel,
        sectionTimingsKeys: Object.keys(timingsToSubmit),
        currentAttemptId: currentAttempt?.id,
        userId: user?.id
      });
      
      submission.submit({
        answers: answersToSubmit,
        sections,
        studentStream: flow.studentStream,
        gradeLevel: flow.gradeLevel,
        sectionTimings: timingsToSubmit,
        currentAttempt,
        userId: user?.id || null,
        timeRemaining: flow.timeRemaining,
        elapsedTime: flow.elapsedTime,
        selectedCategory: flow.selectedCategory
      });
    } else {
      console.log('⏭️ [NEXT SECTION] Moving to next section with optimized save strategy');
      console.log('📊 [NEXT SECTION] Current state:', {
        currentSectionIndex: flow.currentSectionIndex,
        totalSections: sections.length,
        currentQuestionIndex: flow.currentQuestionIndex,
        useDatabase,
        hasCurrentAttempt: !!currentAttempt?.id
      });
      
      // CRITICAL: Block navigation if database is required but we can't save
      if (useDatabase && !currentAttempt?.id) {
        console.error('❌ [SAVE BLOCK] Cannot save - no current attempt ID');
        console.error('❌ [SAVE BLOCK] Section navigation BLOCKED - database enabled but no attempt');
        showToastError('Assessment session not found. Please refresh the page and try again.');
        return; // BLOCK NAVIGATION - cannot save at all
      }
      
      // Calculate the next section position
      const nextSectionIndex = flow.currentSectionIndex + 1;
      const nextQuestionIndex = 0; // Always start at question 0 in new section
      
      console.log('📊 [NEXT SECTION] Next position:', {
        currentPosition: { section: flow.currentSectionIndex, question: flow.currentQuestionIndex },
        nextPosition: { section: nextSectionIndex, question: nextQuestionIndex }
      });
      
      // CRITICAL SAVE: Section boundaries are always critical for data integrity
      if (useDatabase && currentAttempt?.id) {
        console.log('💾 [CRITICAL SAVE] Section boundary - blocking save for data integrity');
        const updatedAnswers = { ...flow.answers };
        
        try {
          const saveStartTime = performance.now();
          const saveResult = await dbUpdateProgress(
            nextSectionIndex,
            nextQuestionIndex,
            flow.sectionTimings,
            null,
            null,
            updatedAnswers
          );
          const saveEndTime = performance.now();
          const saveDuration = Math.round(saveEndTime - saveStartTime);
          
          console.log('📊 [CRITICAL SAVE] Section boundary save completed:', {
            success: saveResult?.success,
            duration: `${saveDuration}ms`,
            error: saveResult?.error || 'none'
          });
          
          if (!saveResult?.success) {
            console.error('❌ [SAVE BLOCK] Section save failed - Navigation BLOCKED');
            console.error('❌ [SAVE BLOCK] Save result:', saveResult);
            showToastError('Failed to save your progress. Please check your internet connection and try again.');
            return; // BLOCK NAVIGATION - critical save failed
          }
          
          console.log('✅ [CRITICAL SAVE] Section save successful - Navigation ALLOWED');
        } catch (error: any) {
          console.error('❌ [SAVE BLOCK] Section save error - Navigation BLOCKED');
          console.error('❌ [SAVE BLOCK] Error details:', error);
          
          // Provide user-friendly error messages based on error type
          if (error?.message?.includes('NetworkError') || error?.message?.includes('fetch')) {
            showToastError('Network connection lost. Please check your internet connection and try again.');
          } else if (error?.message?.includes('timeout')) {
            showToastError('Request timed out. Please try again.');
          } else if (error?.message?.includes('session')) {
            showToastError('Your session has expired. Please refresh the page and try again.');
          } else {
            showToastError('An unexpected error occurred. Please try again or refresh the page.');
          }
          
          return; // BLOCK NAVIGATION - critical save error
        }
      } else {
        console.log('⏭️ [SAVE] Database disabled - allowing section navigation without save');
      }
      
      // Navigate after critical save or when database is disabled
      console.log('🚀 [SECTION NAVIGATION] Proceeding with section navigation after critical save');
      flow.goToNextSection();
      console.log('✅ [SECTION NAVIGATION] Section navigation completed');
    }
  }, [flow, sections, submission, currentAttempt, user, useDatabase, dbUpdateProgress]);
  
  const handleAnswerChange = useCallback((value: any) => {
    const currentSection = sections[flow.currentSectionIndex];
    
    if (currentSection?.isAdaptive) {
      setAdaptiveAptitudeAnswer(value);
    } else {
      flow.setAnswer(flow.questionId, value);
    }
  }, [sections, flow]);
  
  // Toast error helper function
  const showToastError = useCallback((message: string) => {
    console.log('🚨 [TOAST ERROR] Showing user-friendly error:', message);
    setToastError(message);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToastError(null);
    }, 5000);
  }, []);
  
  // Test mode functions
  const autoFillAllAnswers = useCallback(async () => {
    sections.forEach(section => {
      section.questions?.forEach((question: any) => {
        const questionId = `${section.id}_${question.id}`;
        
        // Handle SJT questions (best/worst)
        if (question.partType === 'sjt') {
          const options = question.options || [];
          if (options.length >= 2) {
            flow.setAnswer(questionId, { best: options[0], worst: options[options.length - 1] });
          }
        } 
        // Handle RIASEC questions with categoryMapping (multiselect)
        else if (question.categoryMapping && question.options?.length > 0) {
          // For RIASEC questions, select 2-3 random options to generate valid scores
          const numToSelect = Math.min(3, question.options.length);
          const selectedOptions = question.options.slice(0, numToSelect);
          flow.setAnswer(questionId, selectedOptions);
          console.log(`Test Mode: RIASEC question ${questionId} filled with ${numToSelect} options`);
        }
        // Handle rating scale questions (1-5)
        else if (section.responseScale) {
          // Use 4 instead of 3 to generate higher scores
          flow.setAnswer(questionId, 4);
        } 
        // Handle multiple choice questions
        else if (question.options?.length > 0) {
          flow.setAnswer(questionId, question.correct || question.options[0]);
        }
      });
    });
    console.log('Test Mode: Auto-filled all answers with valid RIASEC data');
  }, [sections, flow]);
  
  const skipToSection = useCallback((sectionIndex: number) => {
    console.log(`🚀 skipToSection called: sectionIndex=${sectionIndex}, sections.length=${sections.length}`);
    console.log(`📋 Available sections:`, sections.map((s, i) => `${i}: ${s.id}`));
    
    if (sections.length === 0) {
      console.warn('❌ Cannot skip: sections array is empty');
      return;
    }
    
    if (sectionIndex >= sections.length) {
      console.warn(`❌ Cannot skip to section ${sectionIndex}: only ${sections.length} sections available`);
      return;
    }
    
    // Fill all previous sections with dummy answers
    sections.slice(0, sectionIndex).forEach(section => {
      section.questions?.forEach((question: any) => {
        const questionId = `${section.id}_${question.id}`;
        
        // Handle SJT questions (best/worst)
        if (question.partType === 'sjt') {
          const options = question.options || [];
          if (options.length >= 2) {
            flow.setAnswer(questionId, { best: options[0], worst: options[options.length - 1] });
          }
        }
        // Handle RIASEC questions with categoryMapping (multiselect)
        else if (question.categoryMapping && question.options?.length > 0) {
          // For RIASEC questions, select 2-3 random options to generate valid scores
          const numToSelect = Math.min(3, question.options.length);
          const selectedOptions = question.options.slice(0, numToSelect);
          flow.setAnswer(questionId, selectedOptions);
        }
        // Handle rating scale questions (1-5)
        else if (section.responseScale) {
          // Use 4 instead of 3 to generate higher scores
          flow.setAnswer(questionId, 4);
        }
        // Handle multiple choice questions
        else if (question.options?.length > 0) {
          flow.setAnswer(questionId, question.correct || question.options[0]);
        }
      });
    });
    
    console.log('📍 About to call flow.jumpToSection');
    // Jump to the target section
    flow.jumpToSection(sectionIndex);
    
    console.log('⏰ Scheduling auto-start in 100ms');
    // Auto-start the section (skip the intro screen) so timer starts immediately
    // This ensures the elapsed time timer starts counting when using test mode
    setTimeout(() => {
      console.log('⏰ Auto-start timeout fired - calling flow.startSection()');
      flow.startSection();
      console.log('✅ flow.startSection() called');
    }, 100);
    
    console.log(`✅ Test Mode: Skipped to section ${sectionIndex} (${sections[sectionIndex]?.title})`);
  }, [sections, flow, useDatabase, currentAttempt, dbUpdateProgress, dbSaveResponse]);
  
  // Get current question (handle adaptive sections)
  const currentSection = sections[flow.currentSectionIndex];
  const currentQuestion = currentSection?.isAdaptive 
    ? adaptiveAptitude.currentQuestion 
    : currentSection?.questions?.[flow.currentQuestionIndex];
  
  const questionId = currentSection?.isAdaptive 
    ? `adaptive_aptitude_${adaptiveAptitude.currentQuestion?.id}` 
    : flow.questionId;
  
  // Check if current question is answered
  const isCurrentAnswered = useMemo(() => {
    if (currentSection?.isAdaptive) {
      return adaptiveAptitudeAnswer !== null;
    }
    
    const answer = flow.answers[questionId];
    if (!answer) return false;
    
    if (currentQuestion?.partType === 'sjt') {
      return answer.best && answer.worst;
    }
    if (currentQuestion?.type === 'multiselect') {
      return Array.isArray(answer) && answer.length === currentQuestion.maxSelections;
    }
    if (currentQuestion?.type === 'text') {
      return typeof answer === 'string' && answer.trim().length >= 10;
    }
    return true;
  }, [currentSection, adaptiveAptitudeAnswer, flow.answers, questionId, currentQuestion]);
  
  // Loading state - only show loading screen for initial checks, not for AI questions
  // AI questions can load in the background while showing section intro
  const showLoading = checkingExistingAttempt || (!assessmentStarted && dbLoading);
  
  // Debug: Log loading states
  if (showLoading) {
    console.log('🔄 Loading states:', {
      checkingExistingAttempt,
      questionsLoading,
      assessmentStarted,
      dbLoading,
      loadingStudentGrade,
      studentRecordId,
      currentScreen: flow.currentScreen
    });
  }
  
  if (showLoading) {
    return <LoadingScreen message="Loading assessment..." />;
  }
  
  // Error state
  if (questionsError && flow.currentScreen !== 'grade_selection') {
    return (
      <RestrictionScreen
        errorMessage={questionsError}
        onViewLastReport={() => navigate('/student/assessment/result')}
        onBackToDashboard={() => navigate('/student/dashboard')}
      />
    );
  }
  
  // Restriction/Error state
  if (flow.error && !showResumePrompt && !assessmentStarted) {
    return (
      <RestrictionScreen
        errorMessage={flow.error}
        onViewLastReport={() => navigate('/student/assessment/result')}
        onBackToDashboard={() => navigate('/student/dashboard')}
      />
    );
  }
  
  // Resume Prompt
  if (showResumePrompt && pendingAttempt) {
    return (
      <ResumePromptScreen
        pendingAttempt={pendingAttempt}
        onResume={handleResumeAssessment}
        onStartNew={handleStartNewAssessment}
        isLoading={questionsLoading}
      />
    );
  }
  
  // Grade Selection
  if (flow.currentScreen === 'grade_selection') {
    const detectedGradeLevel = getGradeLevelFromGrade(studentGrade);
    
    return (
      <GradeSelectionScreen
        onGradeSelect={handleGradeSelect}
        studentGrade={studentGrade}
        detectedGradeLevel={detectedGradeLevel}
        monthsInGrade={monthsInGrade}
        isCollegeStudent={isCollegeStudent}
        loadingStudentGrade={loadingStudentGrade}
        shouldShowAllOptions={shouldShowAllOptions}
        shouldFilterByGrade={shouldFilterByGrade}
        studentProgram={studentProgram}
        profileData={profileData}
      />
    );
  }
  
  // Category Selection
  if (flow.currentScreen === 'category_selection') {
    return (
      <CategorySelectionScreen
        onCategorySelect={handleCategorySelect}
        onBack={() => flow.setCurrentScreen('grade_selection')}
        gradeLevel={flow.gradeLevel}
      />
    );
  }
  
  // Stream Selection
  if (flow.currentScreen === 'stream_selection') {
    return (
      <StreamSelectionScreen
        onStreamSelect={handleStreamSelect}
        onBack={() => flow.setCurrentScreen('category_selection')}
        selectedCategory={flow.selectedCategory}
        gradeLevel={flow.gradeLevel}
        studentProgram={studentProgram}
      />
    );
  }
  
  // Submitting state - show engaging multi-stage progress screen
  if (submission.isSubmitting || flow.isSubmitting) {
    return <AnalyzingScreen gradeLevel={flow.gradeLevel || undefined} />;
  }
  
  // Calculate overall progress based on actual answered questions
  const calculateProgress = () => {
    if (sections.length === 0) return 0;
    
    let totalQuestions = 0;
    let answeredQuestions = 0;
    
    sections.forEach((section, idx) => {
      const sectionQuestions = section.questions?.length || (section.isAdaptive ? 21 : 0);
      totalQuestions += sectionQuestions;
      
      if (idx < flow.currentSectionIndex) {
        // For completed sections, count all questions as answered
        answeredQuestions += sectionQuestions;
      } else if (idx === flow.currentSectionIndex) {
        if (section.isAdaptive) {
          // For adaptive sections, use the adaptive progress
          answeredQuestions += adaptiveAptitude.progress?.questionsAnswered || 0;
        } else {
          // For current section, count actual answered questions from flow.answers
          // This ensures progress is accurate after resume
          const sectionAnswerCount = section.questions?.filter((q: any) => {
            const questionId = `${section.id}_${q.id}`;
            return flow.answers[questionId] !== undefined;
          }).length || 0;
          
          // Use the higher of: answered count or current question index
          // This handles both fresh progress and resumed progress
          answeredQuestions += Math.max(sectionAnswerCount, flow.currentQuestionIndex);
        }
      }
    });
    
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    console.log('📊 [MAIN PROGRESS] Calculation:', {
      totalQuestions,
      answeredQuestions,
      progressPercentage: Math.round(progressPercentage),
      currentSectionIndex: flow.currentSectionIndex,
      currentQuestionIndex: flow.currentQuestionIndex,
      sectionsBreakdown: sections.map((s, i) => ({
        id: s.id,
        questions: s.questions?.length || (s.isAdaptive ? 21 : 0),
        isCompleted: i < flow.currentSectionIndex,
        isCurrent: i === flow.currentSectionIndex
      }))
    });
    
    return progressPercentage;
  };
  
  // Main Assessment UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Progress Header */}
      <div>
        <ProgressHeader
          sections={sections}
          currentSectionIndex={flow.currentSectionIndex}
          currentQuestionIndex={flow.currentQuestionIndex}
          progress={calculateProgress()}
          adaptiveProgress={adaptiveAptitude.progress ? {
            questionsAnswered: adaptiveAptitude.progress.questionsAnswered,
            estimatedTotalQuestions: 21
          } : null}
          isDevMode={isDevMode}
          testMode={testMode}
          onEnableTestMode={() => setTestMode(true)}
        />
      </div>
      
      {/* Test Mode Controls (Dev only) */}
      {isDevMode && testMode && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <TestModeControls
            onAutoFillAll={autoFillAllAnswers}
            onSkipToAptitude={() => {
              const aptitudeIndex = sections.findIndex(s => s.id === 'aptitude' || s.id === 'hs_aptitude_sampling' || s.id === 'adaptive_aptitude');
              if (aptitudeIndex >= 0) {
                skipToSection(aptitudeIndex);
              } else {
                console.warn('❌ Aptitude section not found');
              }
            }}
            onSkipToKnowledge={() => {
              const knowledgeIndex = sections.findIndex(s => s.id === 'knowledge' || s.id === 'adaptive_aptitude');
              if (knowledgeIndex >= 0) {
                skipToSection(knowledgeIndex);
              } else {
                console.warn('❌ Knowledge section not found');
              }
            }}
            onSkipToSubmit={async () => {
              console.log('🎯 Submit button clicked');
              
              if (sections.length === 0) {
                console.warn('❌ Cannot submit: sections array is empty');
                return;
              }
              
              // Enable database mode and create attempt if not already created
              if (!currentAttempt && studentRecordId) {
                console.log('📝 Creating database attempt for test mode submission...');
                setUseDatabase(true);
                
                try {
                  await dbStartAssessment(flow.studentStream || 'general', flow.gradeLevel || 'after12');
                  console.log('✅ Database attempt created');
                  
                  // Wait a bit for the attempt to be created
                  await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                  console.error('❌ Failed to create database attempt:', err);
                }
              }
              
              // Auto-fill all answers first
              autoFillAllAnswers();
              
              // Use setTimeout to ensure state updates after auto-fill
              setTimeout(async () => {
                console.log('🚀 Auto-fill complete, proceeding to submit...');
                
                // Mark all sections as complete by setting section timings
                const completedTimings: Record<string, number> = {};
                sections.forEach((section) => {
                  if (!flow.sectionTimings[section.id]) {
                    completedTimings[section.id] = 60;
                  }
                });
                
                if (Object.keys(completedTimings).length > 0) {
                  flow.setSectionTimings({ ...flow.sectionTimings, ...completedTimings });
                }
                
                // Jump to last section to trigger submission
                const lastSectionIndex = sections.length - 1;
                flow.setCurrentSectionIndex(lastSectionIndex);
                flow.setCurrentQuestionIndex(0);
                flow.setShowSectionIntro(false);
                
                // Wait for state to update, then trigger submission directly
                setTimeout(() => {
                  console.log('✅ Triggering submission via handleNextSection...');
                  handleNextSection();
                }, 200);
              }, 100);
            }}
            onExitTestMode={() => setTestMode(false)}
            gradeLevel={flow.gradeLevel || undefined}
            studentStream={flow.studentStream || undefined}
            currentSectionIndex={flow.currentSectionIndex}
            totalSections={sections.length}
            aiQuestionsLoading={questionsLoading}
            aiQuestionsLoaded={aiQuestions ? {
              aptitude: aiQuestions.aptitude?.length || 0,
              knowledge: aiQuestions.knowledge?.length || 0
            } : undefined}
            sections={sections}
          />
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Section Intro */}
          {flow.showSectionIntro && currentSection && (
            <SectionIntroScreen
              key={`intro-${currentSection.id}`}
              title={currentSection.title}
              description={currentSection.description}
              instruction={currentSection.instruction}
              icon={getSectionIconPath(currentSection.id)}
              color={currentSection.color}
              sectionId={currentSection.id}
              questionCount={currentSection.questions?.length || 0}
              timeLimit={currentSection.timeLimit}
              isAptitude={currentSection.isAptitude}
              isAdaptive={currentSection.isAdaptive}
              isTimed={currentSection.isTimed}
              showAIPoweredBadge={currentSection.id === 'aptitude' || currentSection.id === 'knowledge'}
              isLoading={
                // Show loading for adaptive aptitude (21 questions)
                (currentSection.isAdaptive && adaptiveAptitude.loading) ||
                // Show loading for multi-aptitude (50 questions) when AI questions are still loading
                (currentSection.id === 'aptitude' && !currentSection.isAdaptive && questionsLoading) ||
                // Show loading for knowledge section when AI questions are still loading
                (currentSection.id === 'knowledge' && questionsLoading)
              }
              onStart={handleStartSection}
            />
          )}
          
          {/* Section Complete */}
          {flow.showSectionComplete && currentSection && (
            <SectionCompleteScreen
              key={`complete-${currentSection.id}`}
              sectionTitle={currentSection.title}
              nextSectionTitle={!flow.isLastSection && sections[flow.currentSectionIndex + 1]?.title}
              elapsedTime={flow.sectionTimings[currentSection.id]}
              isLastSection={flow.isLastSection}
              onContinue={handleNextSection}
            />
          )}
          
          {/* Question with Sidebar Layout */}
          {!flow.showSectionIntro && !flow.showSectionComplete && currentQuestion && (
            <QuestionLayout
              sectionTitle={currentSection?.title || ''}
              sectionDescription={currentSection?.description || ''}
              sectionInstruction={currentSection?.instruction}
              sectionId={currentSection?.id || ''}
              sectionColor={currentSection?.color}
              currentSectionIndex={flow.currentSectionIndex}
              totalSections={sections.length}
              currentQuestionIndex={currentSection?.isAdaptive
                ? (adaptiveAptitude.progress?.questionsAnswered || 0)
                : flow.currentQuestionIndex}
              totalQuestions={currentSection?.isAdaptive
                ? (adaptiveAptitude.progress?.estimatedTotalQuestions || 21)
                : (currentSection?.questions?.length || 0)}
              elapsedTime={flow.elapsedTime}
              showNoWrongAnswers={!currentSection?.isAptitude && !currentSection?.isAdaptive}
              perQuestionTimer={((currentSection?.isAptitude && flow.aptitudePhase === 'individual') || currentSection?.isKnowledge) ? flow.aptitudeQuestionTimer : null}
              showPerQuestionTimer={((currentSection?.isAptitude && flow.aptitudePhase === 'individual') || currentSection?.isKnowledge) && flow.aptitudeQuestionTimer !== null}
            >
              {/* Question Number Label with Per-Question Timer - Fixed at top in container */}
              <div className="bg-white/60 rounded-xl border border-blue-200/50 px-4 py-2 mb-12 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold text-indigo-600">
                    QUESTION {currentSection?.isAdaptive
                      ? `${(adaptiveAptitude.progress?.questionsAnswered || 0) + 1} / ${adaptiveAptitude.progress?.estimatedTotalQuestions || 21}`
                      : `${flow.currentQuestionIndex + 1} / ${currentSection?.questions?.length || 0}`}
                  </div>
                  
                  {/* Per-Question Countdown Timer - Top Right (for aptitude/knowledge sections ONLY) */}
                  {((currentSection?.isAptitude && flow.aptitudePhase === 'individual') || currentSection?.isKnowledge) && flow.aptitudeQuestionTimer !== null && (
                    <div className={`text-sm font-semibold flex items-center gap-1.5 ${
                      flow.aptitudeQuestionTimer <= 10 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2"/>
                      </svg>
                      <span>Question Time: {Math.floor(flow.aptitudeQuestionTimer / 60)}:{(flow.aptitudeQuestionTimer % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
              </div>

              <motion.div
                key={questionId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col flex-1"
              >
                {/* Question Content */}
                <div className="flex-1 py-8">
                  <QuestionRenderer
                    question={currentQuestion}
                    questionId={questionId}
                    sectionId={currentSection?.id || ''}
                    answer={currentSection?.isAdaptive ? adaptiveAptitudeAnswer : flow.answers[questionId]}
                    onAnswer={handleAnswerChange}
                    responseScale={currentSection?.responseScale}
                    isAdaptive={currentSection?.isAdaptive}
                    adaptiveTimer={adaptiveQuestionTimer}
                    adaptiveDifficulty={adaptiveAptitude.currentQuestion?.difficulty || adaptiveAptitude.progress?.currentDifficulty}
                    adaptiveLoading={false}
                    adaptiveDisabled={currentSection?.isAdaptive ? adaptiveAptitude.submitting : false}
                  />
                </div>

                {/* Navigation Buttons - Fixed at bottom */}
                <div className="mt-2">
                  <QuestionNavigation
                    onPrevious={flow.goToPreviousQuestion}
                    onNext={handleNextQuestion}
                    canGoPrevious={flow.currentQuestionIndex > 0 && !currentSection?.isAdaptive}
                    canGoNext={isCurrentAnswered}
                    isAnswered={isCurrentAnswered}
                    isSubmitting={currentSection?.isAdaptive ? adaptiveAptitude.submitting : false}
                    isLastQuestion={flow.isLastQuestion}
                  />
                </div>
              </motion.div>
            </QuestionLayout>
          )}
        </AnimatePresence>
      </div>
      
      {/* Submission Error */}
      {submission.error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p>{submission.error}</p>
        </div>
      )}
      
      {/* Toast Error Notification - Top Right Corner */}
      <AnimatePresence>
        {toastError && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-4 right-4 z-[9999] bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Save Error</p>
                <p className="text-sm opacity-90 mt-1">{toastError}</p>
              </div>
              <button
                onClick={() => setToastError(null)}
                className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssessmentTestPage;
