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
  const [adaptiveAptitudeAnswer, setAdaptiveAptitudeAnswer] = useState<string | null>(null);
  const [adaptiveQuestionTimer, setAdaptiveQuestionTimer] = useState(90); // 90 seconds per question
  
  // Flow state machine
  const flow = useAssessmentFlow({
    sections,
    onSectionComplete: (sectionId, timeSpent) => {
      console.log(`Section ${sectionId} completed in ${timeSpent}s`);
      if (useDatabase && currentAttempt?.id) {
        // Save all responses including non-UUID questions (RIASEC, BigFive, etc.)
        // Note: flow.answers should be up-to-date here since section is complete
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
  
  // Track if initial check has been done (prevents re-running after assessment starts)
  const initialCheckDoneRef = React.useRef(false);
  
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
  }, [studentRecordId, dbLoading, checkInProgressAttempt]);
  
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
  
  // Timer effects
  useEffect(() => {
    if (flow.showSectionIntro || flow.showSectionComplete || flow.isSubmitting) return;
    
    const currentSection = sections[flow.currentSectionIndex];
    if (!currentSection) return;
    
    // Elapsed time counter for non-timed sections
    if (!currentSection.isTimed && !currentSection.isAdaptive) {
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
    } else {
      // Middle school (6-8), High school (9-10) - start directly without stream selection
      setAssessmentStarted(true);
      flow.setCurrentScreen('section_intro');
    }
  }, [flow, studentRecordId, dbStartAssessment, studentProgram]);
  
  const handleCategorySelect = useCallback(async (category: string) => {
    flow.setSelectedCategory(category);
    
    // Skip stream selection - go directly to assessment
    // Use category as the stream (science/commerce/arts)
    flow.setStudentStream(category);
    setAssessmentStarted(true);
    
    // DON'T create attempt here - wait until user clicks "Start Section"
    // This prevents orphan attempts when user just browses
    
    flow.setCurrentScreen('section_intro');
  }, [flow, studentRecordId, dbStartAssessment]);
  
  const handleStreamSelect = useCallback(async (stream: string) => {
    flow.setStudentStream(stream);
    setAssessmentStarted(true);
    
    // DON'T create attempt here - wait until user clicks "Start Section"
    // This prevents orphan attempts when user just browses
    
    flow.setCurrentScreen('section_intro');
  }, [flow, studentRecordId, dbStartAssessment]);
  
  const handleResumeAssessment = useCallback(async () => {
    if (!pendingAttempt) return;
    
    setShowResumePrompt(false);
    setAssessmentStarted(true);
    setUseDatabase(true);
    
    // Restore state from pending attempt
    flow.setGradeLevel(pendingAttempt.grade_level as GradeLevel);
    flow.setStudentStream(pendingAttempt.stream_id);
    
    // Restore answers
    if (pendingAttempt.restoredResponses) {
      Object.entries(pendingAttempt.restoredResponses).forEach(([key, value]) => {
        flow.setAnswer(key, value);
      });
    }
    
    // Restore section and question indices from database columns
    const sectionIndex = pendingAttempt.current_section_index ?? 0;
    const questionIndex = pendingAttempt.current_question_index ?? 0;
    
    console.log('📍 Resuming from section:', sectionIndex, 'question:', questionIndex);
    
    // Restore position using the newly exposed setters
    flow.setCurrentSectionIndex(sectionIndex);
    flow.setCurrentQuestionIndex(questionIndex);
    
    // If we're in the middle of a section, skip the intro
    if (questionIndex > 0) {
      flow.setShowSectionIntro(false);
      flow.setCurrentScreen('assessment');
    } else {
      flow.setCurrentScreen('section_intro');
    }
  }, [pendingAttempt, flow]);
  
  const handleStartNewAssessment = useCallback(async () => {
    if (pendingAttempt?.id) {
      try {
        await assessmentService.abandonAttempt(pendingAttempt.id);
      } catch (err) {
        console.error('Error abandoning attempt:', err);
      }
    }
    
    setShowResumePrompt(false);
    setPendingAttempt(null);
    flow.setCurrentScreen('grade_selection');
  }, [pendingAttempt, flow]);
  
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
        await dbStartAssessment(flow.studentStream || 'general', flow.gradeLevel || 'after10');
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
    
    // Reset aptitude question timer
    if (currentSection?.isAptitude) {
      flow.setAptitudeQuestionTimer(currentSection.individualTimeLimit || 60);
    }
    
    // Initialize adaptive test
    if (currentSection?.isAdaptive && !adaptiveAptitude.session) {
      adaptiveAptitude.startTest();
    }
    
    flow.startSection();
  }, [sections, flow, adaptiveAptitude, currentAttempt, studentRecordId, dbStartAssessment, showResumePrompt]);
  
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
  
  const handleNextSection = useCallback(async () => {
    // Calculate and save scores for completed section
    const completedSection = sections[flow.currentSectionIndex];
    
    try {
      // For aptitude sections, calculate and save scores
      if (completedSection?.isAptitude && aiQuestions?.aptitude && currentAttempt?.id) {
        console.log('🧮 Calculating aptitude scores for completed section...');
        
        // Get answers for this section
        const aptitudeAnswers = Object.entries(flow.answers)
          .filter(([key]) => key.startsWith('aptitude_'))
          .map(([key, value]) => ({
            question_id: key.replace('aptitude_', ''),
            selected_answer: value
          }));
        
        if (aptitudeAnswers.length > 0) {
          const scores = assessmentService.calculateAptitudeScores(
            aptitudeAnswers,
            aiQuestions.aptitude
          );
          await assessmentService.saveAptitudeScores(currentAttempt.id, scores);
          console.log('✅ Aptitude scores saved:', scores);
        }
      }
      
      // For knowledge sections, calculate and save scores
      if (completedSection?.id?.includes('knowledge') && aiQuestions?.knowledge && currentAttempt?.id) {
        console.log('🧮 Calculating knowledge scores for completed section...');
        
        // Get answers for this section
        const knowledgeAnswers = Object.entries(flow.answers)
          .filter(([key]) => key.startsWith('knowledge_'))
          .map(([key, value]) => ({
            question_id: key.replace('knowledge_', ''),
            selected_answer: value
          }));
        
        if (knowledgeAnswers.length > 0) {
          const scores = assessmentService.calculateKnowledgeScores(
            knowledgeAnswers,
            aiQuestions.knowledge
          );
          await assessmentService.saveKnowledgeScores(currentAttempt.id, scores);
          console.log('✅ Knowledge scores saved:', scores);
        }
      }
    } catch (error) {
      console.error('❌ Error calculating/saving scores:', error);
      // Don't block progression if scoring fails
    }
    
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
  }, [flow, sections, submission, currentAttempt, user, aiQuestions]);
  
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
  
  // Calculate overall progress
  const calculateProgress = () => {
    if (sections.length === 0) return 0;
    
    let totalQuestions = 0;
    let answeredQuestions = 0;
    
    sections.forEach((section, idx) => {
      const sectionQuestions = section.questions?.length || (section.isAdaptive ? 21 : 0);
      totalQuestions += sectionQuestions;
      
      if (idx < flow.currentSectionIndex) {
        answeredQuestions += sectionQuestions;
      } else if (idx === flow.currentSectionIndex) {
        if (section.isAdaptive) {
          answeredQuestions += adaptiveAptitude.progress?.questionsAnswered || 0;
        } else {
          answeredQuestions += flow.currentQuestionIndex;
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
