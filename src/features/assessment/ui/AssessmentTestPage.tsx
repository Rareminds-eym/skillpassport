import React, { useEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useUser } from '@/shared/model/authStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, Button } from '@/shared/ui';

// Store
import { useAssessmentStore } from '../model/assessmentStore';

// Services
import {
  startAssessment,
  saveResponse,
  submitAssessment,
  checkInProgress,
  abandonAttempt,
  analyzeAssessment,
  StartAssessmentResponse,
} from '../api/assessmentApiService';
import { normalizeStreamId } from '../api/careerAssessmentAIService';

// Hooks
import { useLearnerGrade } from '../model/useLearnerGrade';
import { useAnswerSync } from '../hooks/useAnswerSync';
import { useAdaptiveAptitude } from '../model';

// Components
import { LoadingScreen } from './screens/LoadingScreen';
import { AssessmentCompleteScreen } from './screens/AssessmentCompleteScreen';
import { SectionIntroScreen } from './screens/SectionIntroScreen';
import { SectionCompleteScreen } from './screens/SectionCompleteScreen';
import { AnalyzingScreen } from './screens/AnalyzingScreen';
import { GradeSelectionScreen } from './GradeSelectionScreen';
import { CategorySelectionScreen } from './CategorySelectionScreen';
import { QuestionRenderer } from './questions/QuestionRenderer';
import { ProgressHeader } from './layout/ProgressHeader';
import { QuestionLayout } from './layout/QuestionLayout';
import ResumePromptScreen from './ResumePromptScreen';

// Config
import type { GradeLevel as AdaptiveGradeLevel } from '@/shared/types/adaptiveAptitude';
import { getLogger } from '@/shared/config/logging';

// Adaptive Aptitude Service
import AdaptiveAptitudeApiService from '../api/adaptiveAptitudeApiService';

const logger = getLogger('AssessmentTestPage');

type ScreenType = 'loading' | 'grade-selection' | 'category-selection' | 'section-intro' | 'section-complete' | 'assessment' | 'analyzing' | 'complete' | 'error' | 'resume-prompt';

const getIconPathFromName = (sectionName?: string | null): string => {
  if (!sectionName) return '/assets/Assessment Icons/Career Interests.png';

  const name = sectionName.toLowerCase();

  if (name.includes('interest_explorer')) {
    return '/assets/Assessment Icons/Interest Explorer.png';
  }
  if (name.includes('strengths_character') || name.includes('strength')) {
    return '/assets/Assessment Icons/Strenghts & Character.png';
  }
  if (name.includes('learning_preferences') || name.includes('learning_preference')) {
    return '/assets/Assessment Icons/Learning & Work Preference.png';
  }
  if (name.includes('aptitude_sampling') || name.includes('aptitude_')) {
    return '/assets/Assessment Icons/Aptitude Sampling.png';
  }
  if (name.includes('riasec') || name.includes('bigfive') || name.includes('employability')) {
    return '/assets/Assessment Icons/Career Interests.png';
  }

  return '/assets/Assessment Icons/Career Interests.png';
};

const isAdaptiveSection = (section: any): boolean => {
  return section?.isAdaptive || section?.name === 'adaptive_aptitude';
};

const ADAPTIVE_TOTAL_QUESTIONS = 50;

const AssessmentTestPage: React.FC = () => {
  const user = useUser();

  // Store state
  const store = useAssessmentStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('loading');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [adaptiveTimer, setAdaptiveTimer] = useState(90); // 90 seconds per question
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isResumingAdaptive, setIsResumingAdaptive] = useState(false);

  // Learner grade hook - get complete profile data
  const {
    learnerId,
    learnerGrade,
    isCollegeLearner,
    learnerProgram,
    monthsInGrade,
    detectedGradeLevel,
    profileData,
    loading: loadingLearnerGrade
  } = useLearnerGrade({ userId: user?.id, userEmail: user?.email });

  const getAdaptiveGradeLevel = (grade: string | null): AdaptiveGradeLevel => {
    const gradeMap: Record<string, AdaptiveGradeLevel> = {
      'middle': 'middle_school',
      'middle_school': 'middle_school',
      'highschool': 'high_school',
      'high_school': 'high_school',
      'higher_secondary': 'higher_secondary',
      'after10': 'after10',
      'after12': 'after12',
      'college': 'undergraduate',
      'undergraduate': 'undergraduate',
      'postgraduate': 'postgraduate',
    };
    return gradeMap[grade || ''] || 'high_school';
  };

  // Initialize adaptive aptitude hook at top level (hooks must be called unconditionally)
  const adaptiveHook = useAdaptiveAptitude({
    learnerId: learnerId || '',
    gradeLevel: getAdaptiveGradeLevel(selectedGrade),
    onTestComplete: async () => {
      // Show section-complete screen for adaptive test (it's the last section)
      // User will click "Submit Assessment" to submit
      setCurrentScreen('section-complete');
    },
    onError: (err) => {
      store.setError(err.message);
    },
  });

  // Initialize assessment on mount
  useEffect((): void => {
    const initAssessment = async (): Promise<void> => {
      if (!user?.id) return;

      if (loadingLearnerGrade) {
        return;
      }

      try {
        // Check if there's an in-progress assessment to resume
        const inProgressResponse = await checkInProgress();

        if (inProgressResponse.success && inProgressResponse.hasInProgress) {
          // Show resume prompt with available data (will fetch sections on Resume click)
          setResumeData(inProgressResponse);
          setCurrentScreen('resume-prompt');
        } else {
          // No in-progress assessment, show grade selection
          if (learnerId) {
            setCurrentScreen('grade-selection');
          } else {
            setCurrentScreen('grade-selection');
          }
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setCurrentScreen('grade-selection');
      }
    };

    initAssessment();
  }, [user?.id, learnerId, loadingLearnerGrade]);

  // Handle stream/category selection (defined first so it can be used by handleGradeSelect)
  const handleStreamSelect = useCallback(async (streamId: string): Promise<void> => {
    if (!selectedGrade) return;

    setSelectedStream(streamId);
    store.setLoading(true);
    store.setStatus('loading');

    try {
      // Check if there's already an in-progress assessment for this grade/stream
      // to avoid creating duplicate attempts
      const resumeStreamId = resumeData?.streamId || resumeData?.stream_id;
      if (resumeData?.gradeLevel === selectedGrade && resumeStreamId === streamId) {
        // Resume existing attempt instead of creating a new one
        const { gradeLevel, streamId: resumeStreamId, currentSectionIndex, currentQuestionIndex, answers, elapsedTime, attemptId, sections } = resumeData;

        if (sections) {
          store.initializeAssessment(sections, attemptId, gradeLevel, resumeStreamId);
          store.setCurrentQuestion(currentSectionIndex || 0, currentQuestionIndex || 0);

          if (answers && Object.keys(answers).length > 0) {
            Object.entries(answers).forEach(([questionId, answer]) => {
              store.saveAnswer(questionId, answer);
            });
          }

          if (elapsedTime) {
            setElapsedTime(elapsedTime);
          }

          setShowSectionIntro(false);
          setCurrentScreen('assessment');
          setResumeData(null); // Clear resume data after resuming
        }
      } else {
        // Create new assessment only if there's no matching in-progress one
        const result: StartAssessmentResponse = await startAssessment({
          gradeLevel: selectedGrade,
          streamId,
        });

        if (result.success && result.attemptId) {
          store.initializeAssessment(result.sections, result.attemptId, selectedGrade, streamId);
          setShowSectionIntro(true); // Show section intro before questions
          setCurrentScreen('section-intro');
          setResumeData(null); // Clear any old resume data
        } else {
          store.setError(result.error || 'Failed to start assessment');
          setCurrentScreen('error');
        }
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      store.setError(error);
      setCurrentScreen('error');
    } finally {
      store.setLoading(false);
    }
  }, [selectedGrade, resumeData, store]);

  // Handle grade selection
  const handleGradeSelect = useCallback((gradeLevel: string): void => {
    setSelectedGrade(gradeLevel);
    setShowSectionIntro(true);

    // For middle school and high school: skip category selection and go directly to section intro
    if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
      // These grade levels will start assessment with the appropriate stream
      handleStreamSelect(gradeLevel === 'middle' ? 'middle_school' : 'high_school');
    } else if (gradeLevel === 'college') {
      // College learners skip field selection and start assessment with normalized program stream
      // Use learnerProgram from useLearnerGrade hook (already extracted with priority)
      const normalizedStream = learnerProgram ? normalizeStreamId(learnerProgram) : 'college';
      logger.info('College learner starting assessment', { 
        normalizedStream, 
        originalProgram: learnerProgram 
      });
      handleStreamSelect(normalizedStream);
    } else {
      // Other grade levels (higher_secondary, after10, after12) need category selection
      setCurrentScreen('category-selection');
    }
  }, [handleStreamSelect, learnerProgram]);

  // Handle resume assessment from resume prompt screen
  const handleResumeAssessment = useCallback(async (): Promise<void> => {
    if (!resumeData) return;

    setIsLoadingResume(true);
    // Set flag immediately to prevent startTest() from being called during resume
    const isAdaptiveInProgress = resumeData.isAdaptiveInProgress;
    const isAdaptiveCompleted = resumeData.adaptiveSession?.status === 'completed';
    // Suppress startTest() for both in-progress resume AND completed-adaptive resume
    if (isAdaptiveInProgress || isAdaptiveCompleted) {
      setIsResumingAdaptive(true);
    }

    try {
      const gradeLevel = resumeData.gradeLevel;
      const streamId = resumeData.streamId || resumeData.stream_id;
      const { currentSectionIndex, currentQuestionIndex, answers, elapsedTime, attemptId, sections } = resumeData;

      // Use pre-fetched sections from resumeData if available
      const sectionsToUse = sections || (await startAssessment({
        gradeLevel,
        streamId
      })).sections;

      if (sectionsToUse) {
        // Initialize store with sections
        store.initializeAssessment(
          sectionsToUse,
          attemptId,
          gradeLevel,
          streamId
        );

        // If adaptive test is already completed — all sections done, go straight to submit
        if (isAdaptiveCompleted) {
          const adaptiveSection = sectionsToUse.find((s: any) => s.isAdaptive || s.name === 'adaptive_aptitude');
          const adaptiveSectionIndex = adaptiveSection ? sectionsToUse.indexOf(adaptiveSection) : (sectionsToUse.length - 1);

          store.setCurrentQuestion(adaptiveSectionIndex, 0);

          // Restore all previous answers
          if (answers && Object.keys(answers).length > 0) {
            Object.entries(answers).forEach(([questionId, answer]) => {
              store.saveAnswer(questionId, answer);
            });
          }

          // Use saved adaptive section timing (in minutes → seconds), fallback to overall elapsed
          const adaptiveSectionMinutes = resumeData.sectionTimings?.adaptive_aptitude || 0;
          const restoredElapsed = adaptiveSectionMinutes > 0
            ? adaptiveSectionMinutes * 60
            : (resumeData.elapsedTime || 0);
          // Set after tick so the section-change effect (which resets to 0) fires first
          setTimeout(() => setElapsedTime(restoredElapsed), 0);

          setShowSectionIntro(false);
          setCurrentScreen('section-complete');
          setIsResumingAdaptive(false);
          return;
        }

        // If resuming adaptive test mid-way, restore it properly
        if (isAdaptiveInProgress && resumeData.adaptiveSession) {
          // Find the adaptive section
          const adaptiveSection = sectionsToUse.find((s: any) => s.isAdaptive || s.name === 'adaptive_aptitude');
          if (adaptiveSection) {
            const adaptiveSectionIndex = sectionsToUse.indexOf(adaptiveSection);

            // Initialize store to point to adaptive section
            store.setCurrentQuestion(adaptiveSectionIndex, 0);

            // Restore adaptive session from backend
            try {
              const resumedSessionData = await AdaptiveAptitudeApiService.resumeTest(
                resumeData.adaptiveSession.sessionId
              );

              if (resumedSessionData.session && resumedSessionData.currentQuestion) {
                // Initialize both store AND hook with resumed session data
                store.initializeAdaptiveSession(
                  resumedSessionData.session,
                  resumedSessionData.currentQuestion
                );

                // Set selectedGrade so the hook's gradeLevel matches
                const resumedGradeLevel = resumeData.gradeLevel;
                if (resumedGradeLevel) {
                  setSelectedGrade(resumedGradeLevel);
                }

                setShowSectionIntro(false);
                setCurrentScreen('assessment');
                setIsResumingAdaptive(false);
              } else {
                throw new Error('Failed to resume adaptive test');
              }
            } catch (resumeError) {
              store.setError('Failed to resume adaptive test');
              setCurrentScreen('error');
              setIsResumingAdaptive(false);
              return;
            }
          }
        } else {
          // Regular resume flow
          // Set current position to where user left off
          store.setCurrentQuestion(currentSectionIndex || 0, currentQuestionIndex || 0);

          // Restore all previous answers
          if (answers && Object.keys(answers).length > 0) {
            Object.entries(answers).forEach(([questionId, answer]) => {
              store.saveAnswer(questionId, answer);
            });
          }

          // Set elapsed time for non-timed sections
          if (elapsedTime) {
            setElapsedTime(elapsedTime);
          }

          // Skip intro and go directly to assessment
          setShowSectionIntro(false);
          setCurrentScreen('assessment');
        }
      } else {
        store.setError('Failed to load assessment');
        setCurrentScreen('error');
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Unknown error';
      store.setError(err);
      setCurrentScreen('error');
    } finally {
      setIsLoadingResume(false);
    }
  }, [resumeData, store, adaptiveHook]);

  // Handle start fresh - abandon previous attempt
  const handleStartFresh = useCallback(async (): Promise<void> => {
    setIsLoadingResume(true);
    try {
      if (resumeData?.attemptId) {
        await abandonAttempt(resumeData.attemptId);
      }
      // Reset store to clear all old state
      store.reset();
      // Clear resume data and show grade selection
      setResumeData(null);
      setSelectedGrade(null);
      setSelectedStream(null);
      setElapsedTime(0);
      setShowSectionIntro(true);
      setCurrentScreen('grade-selection');
    } catch (error) {
      // Silently fail on abandon
    } finally {
      setIsLoadingResume(false);
    }
  }, [resumeData, store]);

  // Handle answer submission
  const handleAnswerSubmit = useCallback((questionId: string, answer: unknown): void => {
    store.saveAnswer(questionId, answer);
    // useAnswerSync hook handles backend sync - no direct save needed
  }, [store]);

  // Handle submit assessment
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!store.attemptId) return;

    store.setStatus('submitting');
    store.setLoading(true);

    try {
      const result = await submitAssessment({
        attemptId: store.attemptId,
        answers: store.answers,
      });

      if (result.success) {
        // Show analyzing screen while backend processes
        setCurrentScreen('analyzing');

        // Step 1: Call analyze endpoint via service
        const analyzeResult = await analyzeAssessment(store.attemptId, store.gradeLevel);

        // Step 2: Check if analysis succeeded
        if (analyzeResult.success) {
          toast.success('Success');
          store.setStatus('completed');
          setCurrentScreen('complete');
        } else {
          // Analysis failed
          store.setError(analyzeResult.error || 'Failed to analyze assessment');
          setCurrentScreen('error');
        }
      } else {
        store.setError(result.error || 'Failed to submit assessment');
        setCurrentScreen('error');
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      store.setError(error);
      setCurrentScreen('error');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  // Handle next question
  const handleNextQuestion = useCallback((): void => {
    const currentSection = store.sections[store.currentSectionIndex];
    const isLastQuestion = store.currentQuestionIndex >= currentSection.questions.length - 1;

    if (isLastQuestion && store.currentSectionIndex === store.sections.length - 1) {
      handleSubmit();
    } else if (isLastQuestion) {
      // Show section complete screen
      setCurrentScreen('section-complete');
    } else {
      store.nextQuestion();
    }
  }, [store, handleSubmit]);

  // Handle section complete - move to next section and show its intro
  const handleSectionComplete = useCallback((): void => {
    store.nextSection();
    setShowSectionIntro(true);
    setCurrentScreen('section-intro');
  }, [store]);

  // Use the sync hook at top level (not conditionally)
  const syncStatus = useAnswerSync(store.attemptId, showSectionIntro);

  // Initialize adaptive test when reaching adaptive section
  useEffect(() => {
    if (store.sections.length === 0) return;

    const currentSection = store.sections[store.currentSectionIndex];

    // Only start a NEW test if:
    // 1. We're in an adaptive section
    // 2. AND we don't already have a session (either resumed or already started)
    // 3. AND we're not currently in the process of resuming
    const alreadyHasSession = adaptiveHook.sessionId || store.adaptiveSessionId;

    if (isAdaptiveSection(currentSection) && !alreadyHasSession && !isResumingAdaptive) {
      adaptiveHook.startTest();
    }
  }, [store.currentSectionIndex, learnerId, selectedGrade, adaptiveHook.sessionId, store.adaptiveSessionId, isResumingAdaptive]);

  // Timer for non-timed sections
  useEffect(() => {
    const currentSection = store.sections[store.currentSectionIndex];
    const isTimed = currentSection?.isTimed || false;
    const shouldRunTimer = !isTimed && currentScreen === 'assessment' && !showSectionIntro;

    if (shouldRunTimer) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [store.currentSectionIndex, currentScreen, showSectionIntro, store.sections]);

  // Adaptive timer countdown (90 seconds per question)
  useEffect(() => {
    const currentSection = store.sections[store.currentSectionIndex];
    const isAdaptive = isAdaptiveSection(currentSection);
    const shouldRunTimer = isAdaptive && currentScreen === 'assessment' && !showSectionIntro && adaptiveHook.currentQuestion;

    if (shouldRunTimer) {
      const timer = setInterval(() => {
        setAdaptiveTimer(prev => {
          if (prev <= 1) {
            // Time's up - auto-submit current answer or skip
            const currentAnswer = selectedAnswer;
            if (currentAnswer) {
              adaptiveHook.submitAnswer(currentAnswer);
              setSelectedAnswer(null);
            }
            return 90; // Reset for next question
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [store.currentSectionIndex, currentScreen, showSectionIntro, adaptiveHook.currentQuestion, store.sections]);

  // Reset adaptive timer when question changes
  useEffect(() => {
    const currentSection = store.sections[store.currentSectionIndex];
    if (isAdaptiveSection(currentSection) && adaptiveHook.currentQuestion) {
      setAdaptiveTimer(90); // Reset to 90 seconds for new question
    }
  }, [adaptiveHook.questionsAnswered, store.currentSectionIndex, adaptiveHook.currentQuestion, store.sections]);

  // Reset elapsed time when section changes
  const previousSectionIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (previousSectionIndexRef.current !== null && previousSectionIndexRef.current !== store.currentSectionIndex) {
      setElapsedTime(0);
    }
    previousSectionIndexRef.current = store.currentSectionIndex;
  }, [store.currentSectionIndex]);

  // Render screens based on current screen state
  if (store.loading && currentScreen === 'loading') {
    return <LoadingScreen message="Loading assessment..." />;
  }

  if (currentScreen === 'resume-prompt' && resumeData) {
    return (
      <ResumePromptScreen
        pendingAttempt={resumeData}
        totalQuestions={resumeData.totalQuestions}
        onResume={handleResumeAssessment}
        onStartNew={handleStartFresh}
        isLoading={isLoadingResume}
      />
    );
  }

  if (currentScreen === 'grade-selection') {
    return (
      <GradeSelectionScreen
        onGradeSelect={handleGradeSelect}
        learnerGrade={learnerGrade}
        detectedGradeLevel={detectedGradeLevel}
        monthsInGrade={monthsInGrade}
        isCollegeLearner={isCollegeLearner}
        loadingLearnerGrade={loadingLearnerGrade}
        shouldShowAllOptions={false}
        shouldFilterByGrade={true}
        learnerProgram={learnerProgram}
        profileData={profileData}
      />
    );
  }

  if (currentScreen === 'category-selection' && selectedGrade) {
    return (
      <CategorySelectionScreen
        gradeLevel={selectedGrade}
        onStreamSelect={handleStreamSelect}
        loading={store.loading}
      />
    );
  }

  // Show section completion screen after each section
  if (currentScreen === 'section-complete' && store.sections.length > 0) {
    const completedSection = store.sections[store.currentSectionIndex];
    const nextSection = store.currentSectionIndex < store.sections.length - 1
      ? store.sections[store.currentSectionIndex + 1]
      : null;
    const isLastSection = store.currentSectionIndex === store.sections.length - 1;

    const handleContinue = isLastSection
      ? handleSubmit  // Last section: submit assessment
      : handleSectionComplete;  // Other sections: move to next section

    return (
      <SectionCompleteScreen
        sectionTitle={completedSection.title}
        nextSectionTitle={nextSection?.title}
        elapsedTime={syncStatus.getElapsedSecondsForSection(store.currentSectionIndex)}
        isLastSection={isLastSection}
        onContinue={handleContinue}
      />
    );
  }

  // Show section introduction screen before questions
  if (currentScreen === 'section-intro' && showSectionIntro && store.sections.length > 0) {
    const currentSection = store.sections[store.currentSectionIndex];
    const currentGradeLevel = (selectedGrade || 'after10') as GradeLevel;

    const isAdaptiveIntro = isAdaptiveSection(currentSection);
    const adaptiveInstruction = isAdaptiveIntro ? "Take your time with each question. You have 5 minutes per question - just do your best!" : undefined;
    const adaptiveDescription = isAdaptiveIntro ? "A smart test that adjusts to your skill level. It gets easier or harder based on how you're doing!" : undefined;

    const sectionIconPath = getIconPathFromName(currentSection.name as string | null);

    return (
      <SectionIntroScreen
        title={currentSection.title}
        description={isAdaptiveIntro ? adaptiveDescription : currentSection.description}
        instruction={currentSection.instruction || adaptiveInstruction}
        icon={sectionIconPath}
        color={currentSection.color}
        sectionId={currentSection.id}
        questionCount={currentSection.questions?.length || 0}
        timeLimit={currentSection.timeLimit}
        isAptitude={currentSection.isAptitude}
        isAdaptive={isAdaptiveIntro}
        isTimed={currentSection.isTimed}
        showAIPoweredBadge={currentSection.id === 'aptitude' || currentSection.id === 'knowledge'}
        isLoading={store.loading}
        gradeLevel={currentGradeLevel}
        onStart={() => {
          setShowSectionIntro(false);
          setCurrentScreen('assessment');
        }}
      />
    );
  }

  if (currentScreen === 'assessment' && store.sections.length > 0) {
    const currentSection = store.sections[store.currentSectionIndex];
    const currentQuestion = currentSection?.questions[store.currentQuestionIndex];

    if (isAdaptiveSection(currentSection)) {
      // Show error if exists
      if (adaptiveHook.error) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-600 mb-4">{adaptiveHook.error}</p>
                <Button
                  onClick={() => {
                    adaptiveHook.clearError();
                    adaptiveHook.reset();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }

      // If no question yet, return early (shouldn't happen in normal flow)
      if (!adaptiveHook.currentQuestion) {
        return null;
      }

      return (
        <div className="min-h-screen bg-gray-50">
          <ProgressHeader
            sections={store.sections}
            currentSectionIndex={store.currentSectionIndex}
            currentQuestionIndex={adaptiveHook.questionsAnswered}
            progress={(adaptiveHook.questionsAnswered / 50) * 100}
          />

          <div className="max-w-7xl mx-auto px-4 py-8">
            {adaptiveHook.currentQuestion && (
              <QuestionLayout
                key={`adaptive-${adaptiveHook.sessionId}-${adaptiveHook.questionsAnswered}`}
                sectionTitle={currentSection.title}
                sectionDescription="Adaptive Aptitude Test"
                sectionInstruction="Answer at your own pace. The difficulty adjusts based on your responses."
                sectionId={currentSection.id}
                sectionIcon={currentSection.name as string}
                sectionColor={currentSection.color}
                currentSectionIndex={store.currentSectionIndex}
                totalSections={store.sections.length}
                currentQuestionIndex={adaptiveHook.questionsAnswered}
                totalQuestions={ADAPTIVE_TOTAL_QUESTIONS}
                elapsedTime={elapsedTime}
                perQuestionTimer={adaptiveTimer}
                showPerQuestionTimer={true}
                showNoWrongAnswers={true}
                isAnswered={!!selectedAnswer}
                isLastQuestion={adaptiveHook.isTestComplete}
                isSubmitting={adaptiveHook.loading}
                canGoPrevious={false}
                onNext={async () => {
                  if (selectedAnswer) {
                    await adaptiveHook.submitAnswer(selectedAnswer);
                    setSelectedAnswer(null);
                  }
                }}
                onPrevious={() => {}}
              >
                <QuestionRenderer
                  question={adaptiveHook.currentQuestion}
                  questionId={adaptiveHook.currentQuestion.id}
                  sectionId={currentSection.id}
                  answer={selectedAnswer}
                  onAnswer={setSelectedAnswer}
                  isAdaptive={true}
                  adaptiveTimer={adaptiveTimer}
                  adaptiveDifficulty={adaptiveHook.difficulty}
                  adaptiveLoading={adaptiveHook.loading}
                  color={currentSection.color}
                />
              </QuestionLayout>
            )}
          </div>
        </div>
      );
    }

    // Validate answer completeness
    const isCurrentAnswered = (() => {
      const answer = store.answers[currentQuestion?.id];
      const hasAnswer = !!answer;

      // For multiselect questions, must have exact selection count
      if (currentQuestion?.type === 'multiselect' && currentQuestion?.maxSelections) {
        const selectedItems = answer;
        const selectedCount = Array.isArray(selectedItems) ? selectedItems.length : 0;
        return selectedCount === currentQuestion.maxSelections;
      }

      return hasAnswer;
    })();

    const isLastQuestion = store.currentQuestionIndex === currentSection.questions.length - 1 && store.currentSectionIndex === store.sections.length - 1;

    return (
      <div className="min-h-screen bg-gray-50">
        <ProgressHeader
          sections={store.sections}
          currentSectionIndex={store.currentSectionIndex}
          currentQuestionIndex={store.currentQuestionIndex}
          progress={(store.currentSectionIndex / store.sections.length) * 100}
        />

        {/* ===== ONLY SHOW ERROR MESSAGES ===== */}
        {syncStatus.errorMessage && (
          <div className="fixed top-4 left-4 right-4 z-50 px-4 py-3 bg-red-100 text-red-800 text-sm font-medium rounded-lg border border-red-300">
            ⚠️ {syncStatus.errorMessage}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <QuestionLayout
                key={`${store.currentSectionIndex}-${store.currentQuestionIndex}`}
                sectionTitle={currentSection.title}
                sectionDescription={currentSection.description}
                sectionInstruction={currentSection.instruction}
                sectionId={currentSection.id}
                sectionIcon={currentSection.name as string}
                sectionColor={currentSection.color}
                currentSectionIndex={store.currentSectionIndex}
                totalSections={store.sections.length}
                currentQuestionIndex={store.currentQuestionIndex}
                totalQuestions={currentSection.questions.length}
                elapsedTime={elapsedTime}
                showNoWrongAnswers={true}
                isAnswered={isCurrentAnswered}
                isLastQuestion={isLastQuestion}
                canGoPrevious={store.currentQuestionIndex > 0}
                onNext={() => {
                  // Block only if offline
                  if (!syncStatus.isOnline) {
                    toast.error('Cannot proceed. No internet connection.', {
                      duration: 3000,
                      position: 'top-right',
                    });
                    return;
                  }
                  // Allow navigation - sync happens in background
                  handleNextQuestion();
                }}
                onPrevious={store.previousQuestion}
              >
                <QuestionRenderer
                  question={currentQuestion}
                  questionId={currentQuestion.id}
                  sectionId={currentSection.id}
                  answer={store.answers[currentQuestion.id]}
                  onAnswer={(answer) => handleAnswerSubmit(currentQuestion.id, answer)}
                  responseScale={currentSection.responseScale}
                  color={currentSection.color}
                />
              </QuestionLayout>
            )}
          </AnimatePresence>
        </div>

        {store.error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg">
            {store.error}
          </div>
        )}
      </div>
    );
  }

  if (currentScreen === 'analyzing') {
    return <AnalyzingScreen />;
  }

  if (currentScreen === 'complete' && store.attemptId) {
    return <AssessmentCompleteScreen attemptId={store.attemptId} />;
  }

  if (currentScreen === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Assessment Error</h1>
          <p className="text-gray-700 mb-6">{store.error || 'An error occurred'}</p>
          <button
            onClick={() => {
              store.reset();
              setCurrentScreen('grade-selection');
              setSelectedGrade(null);
              setSelectedStream(null);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <LoadingScreen message="Loading assessment..." />;
};

export default AssessmentTestPage;
