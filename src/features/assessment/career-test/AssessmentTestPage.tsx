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
  
  // Flow state machine
  const flow = useAssessmentFlow({
    sections,
    onSectionComplete: (sectionId, timeSpent) => {
      console.log(`Section ${sectionId} completed in ${timeSpent}s`);
      if (useDatabase && currentAttempt?.id) {
        // Save all responses including non-UUID questions (RIASEC, BigFive, etc.)
        dbUpdateProgress(flow.currentSectionIndex, 0, flow.sectionTimings, null, null, flow.answers);
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
        // in the updateProgress call below, which includes flow.answers
        
        // Update progress (current position) after every answer
        // Also save all responses to the all_responses column
        dbUpdateProgress(flow.currentSectionIndex, flow.currentQuestionIndex, flow.sectionTimings, null, null, flow.answers);
      }
    }
  });
  
  // Submission hook
  const submission = useAssessmentSubmission();
  
  // AI Questions Hook - loads aptitude and knowledge questions for after10/after12/college
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
  const adaptiveAptitude = useAdaptiveAptitude({
    studentId: studentId || '',
    gradeLevel: getAdaptiveGradeLevel(flow.gradeLevel || ('after12' as GradeLevel)),
    onTestComplete: (testResults) => {
      console.log('✅ Adaptive aptitude test completed:', testResults);
      flow.setAnswer('adaptive_aptitude_results', testResults);
      flow.completeSection();
    },
    onError: (err) => {
      console.error('❌ Adaptive aptitude test error:', err);
      flow.setError(`Adaptive test error: ${err}`);
    },
  });
  
  // Check for existing in-progress attempt on mount
  // OPTIMIZED: Start checking as soon as studentRecordId is available
  useEffect(() => {
    const checkExisting = async () => {
      // If user explicitly chose to start fresh, skip the check
      if (skipResumeCheck) {
        console.log('⏭️ Skipping resume check (user chose to start fresh)');
        setCheckingExistingAttempt(false);
        return;
      }
      
      // If still loading student record, wait
      if (dbLoading) {
        return;
      }
      
      // If no student record found, proceed to grade selection immediately
      if (!studentRecordId) {
        console.log('🚀 No student record, skipping to grade selection');
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
        
        if (attempt) {
          setPendingAttempt(attempt);
          setShowResumePrompt(true);
        } else {
          flow.setCurrentScreen('grade_selection');
        }
      } catch (err) {
        console.error('Error checking existing attempt:', err);
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
    
    // For stream-based assessments (higher_secondary, after12, college), wait for stream selection
    // For middle/highschool, build sections immediately
    // For after10, we use 'general' stream which is set automatically in handleGradeSelect
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
    // Only run if we have a pending attempt and sections are now built
    if (!pendingAttempt || sections.length === 0) return;
    
    // Only run if we haven't restored position yet (check if we're still on loading/resume screen)
    if (flow.currentScreen !== 'loading' && flow.currentScreen !== 'resume_prompt') return;
    
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
    } else {
      // For regular sections, restore the exact question index
      flow.setCurrentQuestionIndex(questionIndex);
      
      // If we're in the middle of a section, skip the intro
      if (questionIndex > 0) {
        flow.setShowSectionIntro(false);
        flow.setCurrentScreen('assessment');
      } else {
        flow.setCurrentScreen('section_intro');
      }
    }
  }, [sections.length, pendingAttempt, flow.currentScreen]);
  
  // Timer effects
  useEffect(() => {
    if (flow.showSectionIntro || flow.showSectionComplete || flow.isSubmitting) return;
    
    const currentSection = sections[flow.currentSectionIndex];
    if (!currentSection) return;
    
    // Elapsed time counter for non-timed sections (including adaptive sections)
    // Adaptive sections need elapsed time tracking for section timing records
    if (!currentSection.isTimed) {
      const interval = setInterval(() => {
        flow.setElapsedTime(flow.elapsedTime + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    
    // Countdown timer for timed sections
    if (currentSection.isTimed && flow.timeRemaining !== null && flow.timeRemaining > 0) {
      const interval = setInterval(() => {
        flow.setTimeRemaining(flow.timeRemaining! - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
    
    // Auto-advance when time runs out
    if (currentSection.isTimed && flow.timeRemaining === 0) {
      handleNextQuestion();
    }
  }, [flow.showSectionIntro, flow.showSectionComplete, flow.isSubmitting, flow.currentSectionIndex, flow.timeRemaining, flow.elapsedTime, sections]);
  
  // Aptitude per-question timer
  useEffect(() => {
    const currentSection = sections[flow.currentSectionIndex];
    if (!currentSection?.isAptitude || flow.aptitudePhase !== 'individual') return;
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
    // after12 ONLY: Show category selection (Science/Commerce/Arts)
    // after10, college, and below: Skip category selection, go directly to assessment
    if (level === 'after12') {
      // Show category selection ONLY for after12 students
      flow.setCurrentScreen('category_selection');
    } else if (level === 'after10' || level === 'higher_secondary') {
      // After 10th (11th grade) students skip category selection - use 'general' stream
      // The AI analysis will recommend the best stream based on their assessment results
      flow.setStudentStream('general');
      setAssessmentStarted(true);
      
      // Start database attempt with 'general' stream
      if (studentRecordId) {
        try {
          setUseDatabase(true);
          await dbStartAssessment('general', level);
        } catch (err) {
          console.error('Error starting assessment:', err);
        }
      }
      
      flow.setCurrentScreen('section_intro');
    } else if (level === 'college') {
      // College students (UG/PG) skip category selection - use their program directly
      setAssessmentStarted(true);
      
      // Normalize the program name to fit database constraints (max 20 chars)
      const normalizedStreamId = normalizeStreamId(studentProgram || 'college');
      console.log(`🎓 College student: ${studentProgram} -> normalized: ${normalizedStreamId}`);
      
      flow.setStudentStream(normalizedStreamId);
      
      // Start database attempt with normalized stream ID
      if (studentRecordId) {
        try {
          setUseDatabase(true);
          await dbStartAssessment(normalizedStreamId, 'college');
        } catch (err) {
          console.error('Error starting assessment:', err);
        }
      }
      
      flow.setCurrentScreen('section_intro');
    } else {
      // Middle school (6-8), High school (9-10) - start directly without stream selection
      setAssessmentStarted(true);
      
      // FIX: Create database attempt for middle/high school too
      // Use grade level as stream (e.g., 'middle', 'highschool')
      const streamId = level === 'middle' ? 'middle_school' : 
                       level === 'highschool' ? 'high_school' : level;
      flow.setStudentStream(streamId);
      
      if (studentRecordId) {
        try {
          setUseDatabase(true);
          await dbStartAssessment(streamId, level);
          console.log('✅ Database attempt created for', level);
        } catch (err) {
          console.error('Error starting assessment:', err);
        }
      }
      
      flow.setCurrentScreen('section_intro');
    }
  }, [flow, studentRecordId, dbStartAssessment, studentProgram]);
  
  const handleCategorySelect = useCallback(async (category: string) => {
    flow.setSelectedCategory(category);
    
    // Skip stream selection - go directly to assessment
    // Use category as the stream (science/commerce/arts)
    flow.setStudentStream(category);
    setAssessmentStarted(true);
    
    // Start database attempt with category as stream
    if (studentRecordId) {
      try {
        setUseDatabase(true);
        await dbStartAssessment(category, flow.gradeLevel || 'after12');
      } catch (err) {
        console.error('Error starting assessment:', err);
      }
    }
    
    flow.setCurrentScreen('section_intro');
  }, [flow, studentRecordId, dbStartAssessment]);
  
  const handleStreamSelect = useCallback(async (stream: string) => {
    flow.setStudentStream(stream);
    setAssessmentStarted(true);
    
    // Start database attempt
    if (studentRecordId) {
      try {
        setUseDatabase(true);
        await dbStartAssessment(stream, flow.gradeLevel || 'after12');
      } catch (err) {
        console.error('Error starting assessment:', err);
      }
    }
    
    flow.setCurrentScreen('section_intro');
  }, [flow, studentRecordId, dbStartAssessment]);
  
  const handleResumeAssessment = useCallback(async () => {
    if (!pendingAttempt) return;
    
    console.log('🔄 Starting assessment resume process...');
    console.log('📋 Pending attempt:', {
      id: pendingAttempt.id,
      gradeLevel: pendingAttempt.grade_level,
      stream: pendingAttempt.stream_id,
      sectionIndex: pendingAttempt.current_section_index,
      questionIndex: pendingAttempt.current_question_index,
      hasAdaptiveSession: !!pendingAttempt.adaptive_aptitude_session_id,
      hasTimerRemaining: pendingAttempt.timer_remaining !== null,
      hasElapsedTime: pendingAttempt.elapsed_time !== null,
      hasSectionTimings: !!pendingAttempt.section_timings
    });
    
    setShowResumePrompt(false);
    setAssessmentStarted(true);
    setUseDatabase(true);
    
    // Restore state from pending attempt
    flow.setGradeLevel(pendingAttempt.grade_level as GradeLevel);
    flow.setStudentStream(pendingAttempt.stream_id);
    
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
    if (needsAIQuestions && questionsLoading) {
      console.log('⏳ Waiting for AI questions to load before resuming position...');
      // Position will be restored in the useEffect below once sections are built
      return;
    }
    
    // Restore section and question indices from database columns
    const sectionIndex = pendingAttempt.current_section_index ?? 0;
    const questionIndex = pendingAttempt.current_question_index ?? 0;
    
    console.log('📍 Resuming from section:', sectionIndex, 'question:', questionIndex);
    
    // FIX 2: Only restore position if sections are already built
    // Otherwise, let the useEffect below handle it once sections are ready
    if (sections.length > 0) {
      const targetSection = sections[sectionIndex];
      console.log('✅ Sections already built, restoring position immediately', {
        sectionIndex,
        questionIndex,
        sectionId: targetSection?.id,
        isAdaptive: targetSection?.isAdaptive
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
      } else {
        // For regular sections, restore the exact question index
        flow.setCurrentQuestionIndex(questionIndex);
        
        // If we're in the middle of a section, skip the intro
        if (questionIndex > 0) {
          flow.setShowSectionIntro(false);
          flow.setCurrentScreen('assessment');
        } else {
          flow.setCurrentScreen('section_intro');
        }
      }
    } else {
      console.log('⏳ Sections not built yet, will restore position once ready');
      // Position will be restored in useEffect below
    }
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
  
  const handleStartSection = useCallback(() => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // Initialize timer for timed sections
    if (currentSection?.isTimed && currentSection.timeLimit) {
      flow.setTimeRemaining(currentSection.timeLimit);
    }
    
    // Reset elapsed time
    flow.setElapsedTime(0);
    
    // Reset aptitude question timer
    if (currentSection?.isAptitude) {
      flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
    }
    
    // Initialize adaptive test
    if (currentSection?.isAdaptive && !adaptiveAptitude.session) {
      adaptiveAptitude.startTest();
    }
    
    flow.startSection();
  }, [sections, flow, adaptiveAptitude]);
  
  const handleNextQuestion = useCallback(() => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // Handle adaptive section
    if (currentSection?.isAdaptive) {
      // Prevent double submission - check if already submitting
      if (adaptiveAptitude.submitting) {
        console.log('⏳ Already submitting adaptive answer, ignoring click');
        return;
      }
      
      if (adaptiveAptitudeAnswer !== null) {
        adaptiveAptitude.submitAnswer(adaptiveAptitudeAnswer as 'A' | 'B' | 'C' | 'D');
        setAdaptiveAptitudeAnswer(null);
      }
      return;
    }
    
    // Reset aptitude question timer for next question
    if (currentSection?.isAptitude && flow.aptitudePhase === 'individual') {
      flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
    }
    
    flow.goToNextQuestion();
  }, [sections, flow, adaptiveAptitude, adaptiveAptitudeAnswer]);
  
  const handleNextSection = useCallback(() => {
    if (flow.isLastSection) {
      // Submit assessment
      submission.submit({
        answers: flow.answers,
        sections,
        studentStream: flow.studentStream,
        gradeLevel: flow.gradeLevel,
        sectionTimings: flow.sectionTimings,
        currentAttempt,
        userId: user?.id || null,
        timeRemaining: flow.timeRemaining,
        elapsedTime: flow.elapsedTime
      });
    } else {
      flow.goToNextSection();
    }
  }, [flow, sections, submission, currentAttempt, user]);
  
  const handleAnswerChange = useCallback((value: any) => {
    const currentSection = sections[flow.currentSectionIndex];
    
    if (currentSection?.isAdaptive) {
      setAdaptiveAptitudeAnswer(value);
    } else {
      flow.setAnswer(flow.questionId, value);
    }
  }, [sections, flow]);
  
  // Test mode functions
  const autoFillAllAnswers = useCallback(() => {
    sections.forEach(section => {
      section.questions?.forEach((question: any) => {
        const questionId = `${section.id}_${question.id}`;
        
        if (question.partType === 'sjt') {
          const options = question.options || [];
          if (options.length >= 2) {
            flow.setAnswer(questionId, { best: options[0], worst: options[options.length - 1] });
          }
        } else if (section.responseScale) {
          flow.setAnswer(questionId, 3);
        } else if (question.options?.length > 0) {
          flow.setAnswer(questionId, question.correct || question.options[0]);
        }
      });
    });
    console.log('Test Mode: Auto-filled all answers');
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
        
        if (question.partType === 'sjt') {
          const options = question.options || [];
          if (options.length >= 2) {
            flow.setAnswer(questionId, { best: options[0], worst: options[options.length - 1] });
          }
        } else if (section.responseScale) {
          flow.setAnswer(questionId, 3);
        } else if (question.options?.length > 0) {
          flow.setAnswer(questionId, question.correct || question.options[0]);
        }
      });
    });
    
    // Jump to the target section
    flow.jumpToSection(sectionIndex);
    console.log(`✅ Test Mode: Skipped to section ${sectionIndex} (${sections[sectionIndex]?.title})`);
  }, [sections, flow]);
  
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
    
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };
  
  // Main Assessment UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <ProgressHeader
          sections={sections}
          currentSectionIndex={flow.currentSectionIndex}
          currentQuestionIndex={flow.currentQuestionIndex}
          progress={calculateProgress()}
          adaptiveProgress={adaptiveAptitude.progress ? {
            questionsAnswered: adaptiveAptitude.progress.questionsAnswered,
            estimatedTotalQuestions: 20
          } : null}
          isDevMode={isDevMode}
          testMode={testMode}
          onEnableTestMode={() => setTestMode(true)}
        />
      </div>
      
      {/* Test Mode Controls (Dev only) */}
      {isDevMode && testMode && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={autoFillAllAnswers}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200"
            >
              Auto-Fill All
            </button>
            <button
              onClick={() => {
                // Find aptitude section dynamically
                const aptitudeIndex = sections.findIndex(s => s.id === 'aptitude' || s.id === 'hs_aptitude_sampling' || s.id === 'adaptive_aptitude');
                if (aptitudeIndex >= 0) {
                  skipToSection(aptitudeIndex);
                } else {
                  console.warn('❌ Aptitude section not found in sections:', sections.map(s => s.id));
                }
              }}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
              disabled={sections.length === 0}
            >
              Skip to Aptitude
            </button>
            <button
              onClick={() => {
                // Find adaptive section dynamically (renamed from "Skip to Knowledge")
                const adaptiveIndex = sections.findIndex(s => s.id === 'adaptive_aptitude' || s.id === 'knowledge');
                if (adaptiveIndex >= 0) {
                  skipToSection(adaptiveIndex);
                } else {
                  console.warn('❌ Adaptive/Knowledge section not found in sections:', sections.map(s => s.id));
                }
              }}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200"
              disabled={sections.length === 0}
            >
              Skip to Adaptive
            </button>
            <button
              onClick={() => {
                console.log('🎯 Submit button clicked');
                
                if (sections.length === 0) {
                  console.warn('❌ Cannot submit: sections array is empty');
                  return;
                }
                
                // Auto-fill all answers first
                autoFillAllAnswers();
                
                // Use setTimeout to ensure state updates after auto-fill
                setTimeout(() => {
                  const lastSectionIndex = sections.length - 1;
                  const lastSection = sections[lastSectionIndex];
                  
                  console.log(`🎯 Jumping to last section: ${lastSectionIndex} (${lastSection?.title})`);
                  
                  // For adaptive sections, we need to start the test first
                  if (lastSection?.isAdaptive) {
                    flow.setCurrentSectionIndex(lastSectionIndex);
                    flow.setCurrentQuestionIndex(0);
                    flow.setShowSectionIntro(false); // Skip intro, go straight to questions
                    
                    // Start the adaptive test if not already started
                    if (!adaptiveAptitude.session) {
                      adaptiveAptitude.startTest();
                    }
                    console.log('✅ Jumped to adaptive section and started test');
                  } else {
                    // For regular sections, go to the last question
                    const lastQuestionIndex = Math.max(0, (lastSection?.questions?.length || 1) - 1);
                    console.log(`🎯 Going to last question: ${lastQuestionIndex} of ${lastSection?.questions?.length}`);
                    
                    flow.setCurrentSectionIndex(lastSectionIndex);
                    flow.setCurrentQuestionIndex(lastQuestionIndex);
                    flow.setShowSectionIntro(false);
                    console.log('✅ Jumped to last question successfully');
                  }
                }, 100);
              }}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
              disabled={sections.length === 0}
            >
              Submit
            </button>
          </div>
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
              icon={null}
              color={currentSection.color}
              sectionId={currentSection.id}
              questionCount={currentSection.questions?.length || 0}
              timeLimit={currentSection.timeLimit}
              isAptitude={currentSection.isAptitude}
              isAdaptive={currentSection.isAdaptive}
              isTimed={currentSection.isTimed}
              showAIPoweredBadge={currentSection.id === 'aptitude' || currentSection.id === 'knowledge'}
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
            <motion.div
              key={questionId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
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
                  ? (adaptiveAptitude.progress?.estimatedTotalQuestions || 20)
                  : (currentSection?.questions?.length || 0)}
                elapsedTime={flow.elapsedTime}
                showNoWrongAnswers={!currentSection?.isAptitude && !currentSection?.isAdaptive}
              >
                {/* Question Number Label */}
                <div className="text-sm font-semibold text-indigo-600 mb-2">
                  QUESTION {currentSection?.isAdaptive 
                    ? `${(adaptiveAptitude.progress?.questionsAnswered || 0) + 1} / ${adaptiveAptitude.progress?.estimatedTotalQuestions || 21}`
                    : `${flow.currentQuestionIndex + 1} / ${currentSection?.questions?.length || 0}`}
                </div>
                
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
                
                <QuestionNavigation
                  onPrevious={flow.goToPreviousQuestion}
                  onNext={handleNextQuestion}
                  canGoPrevious={flow.currentQuestionIndex > 0 && !currentSection?.isAdaptive}
                  canGoNext={isCurrentAnswered}
                  isAnswered={isCurrentAnswered}
                  isSubmitting={currentSection?.isAdaptive ? adaptiveAptitude.submitting : false}
                  isLastQuestion={flow.isLastQuestion}
                />
              </QuestionLayout>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Submission Error */}
      {submission.error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p>{submission.error}</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentTestPage;
