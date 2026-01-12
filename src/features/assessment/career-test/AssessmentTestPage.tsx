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
import { Loader2 } from 'lucide-react';

// Auth & Database
import { useAuth } from '../../../context/AuthContext';
import { useAssessment } from '../../../hooks/useAssessment';
import { useAdaptiveAptitude } from '../../../hooks/useAdaptiveAptitude';
// @ts-ignore - JS service
import * as assessmentService from '../../../services/assessmentService';

// Hooks
import { useAssessmentFlow, type FlowScreen } from './hooks/useAssessmentFlow';
import { useStudentGrade } from './hooks/useStudentGrade';
import { useAIQuestions } from './hooks/useAIQuestions';
import { useAssessmentSubmission } from './hooks/useAssessmentSubmission';

// Config
import { 
  getSectionsForGrade, 
  type GradeLevel,
  RESPONSE_SCALES 
} from './config/sections';
import { STREAMS_BY_CATEGORY } from './config/streams';

// Components
import { QuestionRenderer } from './components/questions/QuestionRenderer';
import { QuestionNavigation } from './components/QuestionNavigation';
import { SectionIntroScreen } from './components/screens/SectionIntroScreen';
import { SectionCompleteScreen } from './components/screens/SectionCompleteScreen';
import { LoadingScreen } from './components/screens/LoadingScreen';
import { ProgressHeader } from './components/layout/ProgressHeader';
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
  formatTime,
  formatElapsedTime,
  TIMERS,
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

// @ts-ignore - JS service
import { loadCareerAssessmentQuestions, normalizeStreamId } from '../../../services/careerAssessmentAIService';

/**
 * Build sections with questions for a given grade level
 */
const buildSectionsWithQuestions = (
  gradeLevel: GradeLevel,
  studentStream: string | null,
  aiQuestions: any,
  selectedCategory: string | null
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
    completeAssessment: dbCompleteAssessment,
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
  
  // AI Questions state
  const [aiQuestions, setAiQuestions] = useState<any>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  
  // Flow state machine
  const flow = useAssessmentFlow({
    sections,
    onSectionComplete: (sectionId, timeSpent) => {
      console.log(`Section ${sectionId} completed in ${timeSpent}s`);
      if (useDatabase && currentAttempt?.id) {
        dbUpdateProgress(flow.currentSectionIndex, 0, flow.sectionTimings);
      }
    },
    onAnswerChange: (questionId, answer) => {
      if (useDatabase && currentAttempt?.id) {
        const [sectionId, qId] = questionId.split('_');
        dbSaveResponse(sectionId, qId, answer);
      }
    }
  });
  
  // Submission hook
  const submission = useAssessmentSubmission();
  
  // Adaptive Aptitude Hook
  const adaptiveAptitude = useAdaptiveAptitude({
    studentId: studentId || '',
    gradeLevel: getAdaptiveGradeLevel(flow.gradeLevel || 'after12'),
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
  useEffect(() => {
    const checkExisting = async () => {
      if (!studentRecordId) {
        setCheckingExistingAttempt(false);
        return;
      }
      
      try {
        const attempt = await checkInProgressAttempt();
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
    
    if (!loadingStudentGrade) {
      checkExisting();
    }
  }, [studentRecordId, loadingStudentGrade, checkInProgressAttempt]);
  
  // Build sections when grade level or stream changes
  useEffect(() => {
    if (flow.gradeLevel && (flow.studentStream || !['after10', 'after12', 'college'].includes(flow.gradeLevel))) {
      const builtSections = buildSectionsWithQuestions(
        flow.gradeLevel,
        flow.studentStream,
        aiQuestions,
        flow.selectedCategory
      );
      setSections(builtSections);
    }
  }, [flow.gradeLevel, flow.studentStream, aiQuestions, flow.selectedCategory]);
  
  // Load AI questions when stream is selected (for after10/after12/college)
  useEffect(() => {
    const loadAIQuestions = async () => {
      if (!flow.studentStream || !['after10', 'after12', 'college'].includes(flow.gradeLevel || '')) {
        return;
      }
      
      setQuestionsLoading(true);
      setQuestionsError(null);
      
      try {
        const normalizedStream = normalizeStreamId(flow.studentStream);
        const questions = await loadCareerAssessmentQuestions(normalizedStream, studentId);
        setAiQuestions(questions);
      } catch (err: any) {
        console.error('Error loading AI questions:', err);
        setQuestionsError(err.message || 'Failed to load questions');
      } finally {
        setQuestionsLoading(false);
      }
    };
    
    loadAIQuestions();
  }, [flow.studentStream, flow.gradeLevel, studentId]);
  
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
  
  // Handlers
  const handleGradeSelect = useCallback((level: GradeLevel) => {
    flow.setGradeLevel(level);
    
    // Determine next screen based on grade level
    if (['after10', 'after12', 'college'].includes(level)) {
      flow.setCurrentScreen('category_selection');
    } else {
      // Middle/High school - start directly
      setAssessmentStarted(true);
      flow.setCurrentScreen('section_intro');
    }
  }, [flow]);
  
  const handleCategorySelect = useCallback((category: string) => {
    flow.setSelectedCategory(category);
    flow.setCurrentScreen('stream_selection' as FlowScreen);
  }, [flow]);
  
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
    
    setShowResumePrompt(false);
    setAssessmentStarted(true);
    setUseDatabase(true);
    
    // Restore state from pending attempt
    flow.setGradeLevel(pendingAttempt.grade_level as GradeLevel);
    flow.setStudentStream(pendingAttempt.stream_id);
    
    // Restore progress
    if (pendingAttempt.progress) {
      // Restore answers
      if (pendingAttempt.restoredResponses) {
        Object.entries(pendingAttempt.restoredResponses).forEach(([key, value]) => {
          flow.setAnswer(key, value);
        });
      }
    }
    
    flow.setCurrentScreen('section_intro');
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
    if (currentSection?.isAdaptive && !adaptiveAptitude.isActive) {
      adaptiveAptitude.startTest();
    }
    
    flow.startSection();
  }, [sections, flow, adaptiveAptitude]);
  
  const handleNextQuestion = useCallback(() => {
    const currentSection = sections[flow.currentSectionIndex];
    
    // Handle adaptive section
    if (currentSection?.isAdaptive) {
      if (adaptiveAptitudeAnswer !== null) {
        adaptiveAptitude.submitAnswer(adaptiveAptitudeAnswer);
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
    // Fill all previous sections
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
    
    // Jump to section
    // Note: This requires adding a setCurrentSectionIndex to the flow hook
    console.log(`Test Mode: Skipped to section ${sectionIndex}`);
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
  
  // Loading state
  const showLoading = checkingExistingAttempt || questionsLoading || (!assessmentStarted && dbLoading);
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
  if (flow.currentScreen === 'stream_selection' as FlowScreen) {
    const streams = flow.selectedCategory ? STREAMS_BY_CATEGORY[flow.selectedCategory] || [] : [];
    
    return (
      <StreamSelectionScreen
        onStreamSelect={handleStreamSelect}
        onBack={() => flow.setCurrentScreen('category_selection')}
        streams={streams}
        category={flow.selectedCategory}
      />
    );
  }
  
  // Submitting state
  if (submission.isSubmitting || flow.isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing your responses with AI...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={autoFillAllAnswers}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200"
            >
              Auto-Fill All
            </button>
            <button
              onClick={() => skipToSection(4)}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
            >
              Skip to Aptitude
            </button>
            <button
              onClick={() => skipToSection(5)}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200"
            >
              Skip to Knowledge
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-8">
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
          
          {/* Question */}
          {!flow.showSectionIntro && !flow.showSectionComplete && currentQuestion && (
            <motion.div
              key={questionId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuestionRenderer
                question={currentQuestion}
                questionId={questionId}
                sectionId={currentSection?.id || ''}
                answer={currentSection?.isAdaptive ? adaptiveAptitudeAnswer : flow.answers[questionId]}
                onAnswer={handleAnswerChange}
                responseScale={currentSection?.responseScale}
                isAdaptive={currentSection?.isAdaptive}
                adaptiveTimer={90}
                adaptiveDifficulty={3}
                adaptiveLoading={false}
              />
              
              <QuestionNavigation
                onPrevious={flow.goToPreviousQuestion}
                onNext={handleNextQuestion}
                canGoPrevious={flow.currentQuestionIndex > 0 && !currentSection?.isAdaptive}
                canGoNext={isCurrentAnswered}
                isAnswered={isCurrentAnswered}
                isLastQuestion={flow.isLastQuestion}
              />
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
