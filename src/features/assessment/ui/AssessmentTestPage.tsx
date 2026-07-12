import React, { useEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useUser } from '@/shared/model/authStore';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, Button } from '@/shared/ui';
import { showDemoModal } from '@/shared/ui/demoGuard';

// Store
import { useAssessmentStore } from '../model/assessmentStore';

// Services
import {
  startAssessment,
  saveResponse,
  checkInProgress,
  abandonAttempt,
  analyzeAssessment,
  StartAssessmentResponse,
} from '../api/assessmentApiService';
import { useAssessmentSubmission } from '../model'; // Import the submission hook
import { normalizeStreamId } from '../api/careerAssessmentAIService';

// Hooks
import { useLearnerGrade } from '../model/useLearnerGrade';
import { useAnswerSync } from '../hooks/useAnswerSync';
import { useAdaptiveAptitude } from '../model';
import { useAIQuestions } from '../model/useAIQuestions';

// Components
import { LoadingScreen } from './screens/LoadingScreen';
import { AssessmentCompleteScreen } from './screens/AssessmentCompleteScreen';
import { SectionIntroScreen } from './screens/SectionIntroScreen';
import { SectionCompleteScreen } from './screens/SectionCompleteScreen';
import { AnalyzingScreen } from './screens/AnalyzingScreen';
import { GradeSelectionScreen } from './GradeSelectionScreen';
import { CategorySelectionScreen } from './CategorySelectionScreen';
import { StreamSelectionScreen } from './StreamSelectionScreen';
import { QuestionRenderer } from './questions/QuestionRenderer';
import { ProgressHeader } from './layout/ProgressHeader';
import { QuestionLayout } from './layout/QuestionLayout';
import ResumePromptScreen from './ResumePromptScreen';

// Config
import type { GradeLevel as AdaptiveGradeLevel } from '@/shared/types/adaptiveAptitude';
import { getLogger } from '@/shared/config/logging';

// Adaptive Aptitude Service
import AdaptiveAptitudeApiService, { linkSessionToAttempt } from '../api/adaptiveAptitudeApiService';

const logger = getLogger('AssessmentTestPage');

type ScreenType = 'loading' | 'grade-selection' | 'category-selection' | 'stream-selection' | 'section-intro' | 'section-complete' | 'assessment' | 'analyzing' | 'complete' | 'error' | 'resume-prompt';

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

const isAISection = (section: any): boolean =>
  !isAdaptiveSection(section) && (
    section?.name === 'aptitude' ||
    section?.name === 'knowledge' ||
    (typeof section?.id === 'string' && (section.id.startsWith('aptitude-') || section.id.startsWith('knowledge-')))
  );

const ADAPTIVE_TOTAL_QUESTIONS = 50;

const AssessmentTestPage: React.FC = () => {
  const user = useUser();

  // Store state
  const store = useAssessmentStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('loading');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [adaptiveTimer, setAdaptiveTimer] = useState(60); // 60 seconds per question (1:00)
  const adaptiveTimerRef = useRef(adaptiveTimer);
  adaptiveTimerRef.current = adaptiveTimer; // keep ref in sync with state each render
  const [adaptiveElapsedTime, setAdaptiveElapsedTime] = useState(0); // Track total elapsed time for adaptive section
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isResumingAdaptive, setIsResumingAdaptive] = useState(false);
  const [aiSectionTimer, setAiSectionTimer] = useState(59);

  // Ref to track pending AI section resume position
  // When resuming to an AI section, questions aren't loaded yet so we store the target position here
  // Once AI questions load and populate the section, we use this to jump to the exact position
  const pendingAIResumeRef = useRef<{ sectionIndex: number; questionIndex: number; answers: Record<string, any> } | null>(null);

  // Ref to store the full resume target across the entire resume flow
  // This persists even when isAdaptiveCompleted path goes through section-complete → Continue
  const resumeTargetRef = useRef<{ sectionIndex: number; questionIndex: number; answers: Record<string, any> } | null>(null);

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
    onTestComplete: async (results) => {
      // WHY: The adaptive session ID is the only link the backend (save-results)
      // uses to derive aptitude_scores/aptitude_overall via the adaptive results.
      // It must survive a page reload/resume between finishing the adaptive section
      // and submitting the (later) aptitude/knowledge sections. We therefore persist
      // it in TWO durable places, not just non-persisted Zustand state:
      //   1) answers map  -> saved to attempts.all_responses (survives reload)
      //   2) attempts.adaptive_aptitude_session_id -> via linkSessionToAttempt (DB)
      // This restores the backup-link guarantee that was previously missing; without
      // it a failed startTest link silently caused aptitude to be saved as 0/null.
      const sessionId = results?.sessionId;
      if (sessionId) {
        store.saveAnswer('adaptive_aptitude_session_id', sessionId);

        if (store.attemptId) {
          try {
            await linkSessionToAttempt(store.attemptId, sessionId);
            logger.info('[onTestComplete] Adaptive session linked to attempt (backup link)', {
              attemptId: store.attemptId,
              sessionId,
            });
          } catch (err) {
            // Non-blocking: store + answers fallback still allow submit-time recovery.
            logger.warn('[onTestComplete] Backup session link failed (non-blocking)', {
              error: err instanceof Error ? err.message : String(err),
              attemptId: store.attemptId,
              sessionId,
            });
          }
        }
      } else {
        logger.warn('[onTestComplete] Completed adaptive test returned no sessionId');
      }

      // Show section-complete screen; user clicks "Submit Assessment" to submit.
      setCurrentScreen('section-complete');
    },
    onError: (err) => {
      store.setError(err.message);
    },
  });

  // Initialize AI questions hook for aptitude and knowledge sections
  // Use store.streamId as the primary source since it's set during initializeAssessment
  // Also use store.gradeLevel as it's more reliable than selectedGrade
  const effectiveStream = store.streamId || selectedStream;
  const effectiveGrade = store.gradeLevel || selectedGrade;
  
  logger.info('[AI Questions Hook Init]', {
    effectiveStream,
    effectiveGrade,
    storeStreamId: store.streamId,
    storeGradeLevel: store.gradeLevel,
    selectedStream,
    selectedGrade,
    learnerId,
    attemptId: store.attemptId,
    learnerProgram
  });
  
  const aiQuestionsHook = useAIQuestions({
    gradeLevel: effectiveGrade as any,
    learnerStream: effectiveStream,
    learnerId: learnerId,
    attemptId: store.attemptId,
    learnerProgram: learnerProgram,
    isResuming: !!resumeData || isResumingAdaptive // Flag to indicate resume operation
  });

  // Log AI questions hook state for debugging
  useEffect(() => {
    logger.info('[AI Questions Hook State]', {
      loading: aiQuestionsHook.loading,
      error: aiQuestionsHook.error,
      hasAptitude: !!aiQuestionsHook.aiQuestions.aptitude,
      hasKnowledge: !!aiQuestionsHook.aiQuestions.knowledge,
      aptitudeCount: aiQuestionsHook.aiQuestions.aptitude?.length || 0,
      knowledgeCount: aiQuestionsHook.aiQuestions.knowledge?.length || 0,
      progress: aiQuestionsHook.progress,
      selectedGrade,
      selectedStream,
      effectiveStream,
      storeStreamId: store.streamId,
      learnerId,
      attemptId: store.attemptId,
      learnerProgram
    });
  }, [aiQuestionsHook.loading, aiQuestionsHook.error, aiQuestionsHook.aiQuestions, aiQuestionsHook.progress, selectedGrade, selectedStream, effectiveStream, store.streamId, learnerId, store.attemptId, learnerProgram]);

  // Effect: when pendingAIResumeRef is set AND questions are already loaded, restore position immediately
  // This is intentionally left empty - position restore is handled in the AI questions effect below
  // to ensure sections are populated BEFORE position is set
  useEffect(() => {
    // intentionally empty - position restore happens after sections are populated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, aiQuestionsHook.loading, aiQuestionsHook.aiQuestions]);

  // Effect to populate AI sections when questions are loaded
  useEffect(() => {
    if (!aiQuestionsHook.loading && !aiQuestionsHook.error && store.sections.length > 0) {
      const { aptitude, knowledge } = aiQuestionsHook.aiQuestions;
      
      logger.info('[AI Questions Effect] Checking for questions to populate', {
        hasAptitude: !!aptitude,
        hasKnowledge: !!knowledge,
        aptitudeLength: aptitude?.length || 0,
        knowledgeLength: knowledge?.length || 0,
        sectionsCount: store.sections.length,
        hasPendingResume: !!pendingAIResumeRef.current
      });
      
      let sectionsUpdated = false;
      const updatedSections = [...store.sections];
      
      // Find and populate aptitude section
      if (aptitude && aptitude.length > 0) {
        const aptitudeIndex = store.sections.findIndex(s => s.name === 'aptitude' || s.id === 'aptitude' || (typeof s.id === 'string' && s.id.startsWith('aptitude-')));
        if (aptitudeIndex !== -1 && store.sections[aptitudeIndex].questions.length === 0) {
          logger.info('[AI Questions] Populating aptitude section', { questionCount: aptitude.length, sectionIndex: aptitudeIndex });
          updatedSections[aptitudeIndex] = {
            ...updatedSections[aptitudeIndex],
            questions: aptitude.map((q: any, index: number) => ({
              id: q.id || `aptitude-${index}`,
              text: q.text || q.question,
              type: 'mcq',
              options: q.options || [],
              correct: q.correct || q.correct_answer,
              order: index
            }))
          };
          sectionsUpdated = true;
          logger.info('[AI Questions] Aptitude section populated successfully');
        }
      }
      
      // Find and populate knowledge section
      if (knowledge && knowledge.length > 0) {
        const knowledgeIndex = store.sections.findIndex(s => s.name === 'knowledge' || s.id === 'knowledge' || (typeof s.id === 'string' && s.id.startsWith('knowledge-')));
        if (knowledgeIndex !== -1 && store.sections[knowledgeIndex].questions.length === 0) {
          logger.info('[AI Questions] Populating knowledge section', { questionCount: knowledge.length, sectionIndex: knowledgeIndex });
          updatedSections[knowledgeIndex] = {
            ...updatedSections[knowledgeIndex],
            questions: knowledge.map((q: any, index: number) => ({
              id: q.id || `knowledge-${index}`,
              text: q.text || q.question,
              type: 'mcq',
              options: q.options || [],
              correct: q.correct || q.correct_answer,
              order: index
            }))
          };
          sectionsUpdated = true;
          logger.info('[AI Questions] Knowledge section populated successfully');
        }
      }
      
      // Step 1: Update store with populated sections first
      if (sectionsUpdated) {
        store.setSections(updatedSections);
        logger.info('[AI Questions] Sections updated in store');

        // Step 2: If we're on loading screen (resume case), restore exact question position then switch to assessment
        if (currentScreen === 'loading') {
          if (pendingAIResumeRef.current) {
            const { sectionIndex, questionIndex } = pendingAIResumeRef.current;
            logger.info('[AI Questions] Restoring pending resume position', { sectionIndex, questionIndex });
            store.setCurrentQuestion(sectionIndex, questionIndex);
            pendingAIResumeRef.current = null;
          }
          logger.info('[AI Questions] Questions loaded, switching from loading to assessment screen');
          setCurrentScreen('assessment');
        }
      }
    } else if (aiQuestionsHook.error) {
      logger.error('[AI Questions Effect] Error loading AI questions', { error: aiQuestionsHook.error });
    } else if (aiQuestionsHook.loading) {
      logger.info('[AI Questions Effect] Still loading AI questions...');
    }
  }, [aiQuestionsHook.loading, aiQuestionsHook.aiQuestions, aiQuestionsHook.error, store.sections, store, currentScreen]);

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
          setResumeData(inProgressResponse);
          setCurrentScreen('resume-prompt');
        } else {
          setCurrentScreen('grade-selection');
        }
      } catch (err: unknown) {
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
          // Reset timers for fresh start
          setElapsedTime(0);
          setAdaptiveElapsedTime(0);
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

  // Handle category selection (Science/Commerce/Arts)
  const handleCategorySelect = useCallback((categoryId: string): void => {
    setSelectedCategory(categoryId);
    
    // For higher_secondary and after10, show stream selection screen
    // For after12, directly start with the category as stream (no sub-streams)
    if (selectedGrade === 'higher_secondary' || selectedGrade === 'after10') {
      setCurrentScreen('stream-selection');
    } else {
      // For after12, use category directly as stream
      handleStreamSelect(categoryId);
    }
  }, [selectedGrade, handleStreamSelect]);

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

      // sections are loaded by checkInProgress and stored in resumeData
      const sectionsToUse = sections;

      if (sectionsToUse) {
        // Initialize store with sections
        store.initializeAssessment(
          sectionsToUse,
          attemptId,
          gradeLevel,
          streamId
        );

        // Set selectedGrade and selectedStream to trigger AI questions loading
        setSelectedGrade(gradeLevel);
        setSelectedStream(streamId);

        // If adaptive test is already completed — all sections done, go straight to submit
        if (isAdaptiveCompleted) {
          const adaptiveSection = sectionsToUse.find((s: any) => s.isAdaptive || s.name === 'adaptive_aptitude');
          const adaptiveSectionIndex = adaptiveSection ? sectionsToUse.indexOf(adaptiveSection) : (sectionsToUse.length - 1);

          // Set position FIRST before restoring answers — same pattern as regular resume flow.
          // useAnswerSync's detect-answers effect fires when saveAnswer runs and captures
          // store.currentQuestionIndex into pendingQuestionIndexRef. If setCurrentQuestion
          // hasn't run yet, it captures 0 and syncs questionIndex: 0 to the backend → Q1 on resume.
          store.setCurrentQuestion(currentSectionIndex || 0, currentQuestionIndex || 0);

          // Restore all previous answers
          if (answers && Object.keys(answers).length > 0) {
            Object.entries(answers).forEach(([questionId, answer]) => {
              store.saveAnswer(questionId, answer);
            });
          }

          // Check if user was in a post-adaptive section (AI section)
          if (currentSectionIndex > adaptiveSectionIndex) {
            // User was in an AI section - directly restore that position
            logger.info('[Resume] Adaptive completed, restoring position in post-adaptive section', {
              sectionIndex: currentSectionIndex,
              questionIndex: currentQuestionIndex,
              adaptiveSectionIndex
            });

            store.setCurrentQuestion(currentSectionIndex || 0, currentQuestionIndex || 0);
            // Store pending position so populate effect can restore it after AI questions load
            pendingAIResumeRef.current = {
              sectionIndex: currentSectionIndex || 0,
              questionIndex: currentQuestionIndex || 0,
              answers: answers || {}
            };

            // Check if it's an AI section that needs questions loaded
            const currentSection = sectionsToUse[currentSectionIndex || 0];
            const isAISection = currentSection && (
              currentSection.name === 'aptitude' ||
              currentSection.name === 'knowledge' ||
              (typeof currentSection.id === 'string' && (currentSection.id.startsWith('aptitude-') || currentSection.id.startsWith('knowledge-')))
            );

            if (isAISection && currentSection.questions.length === 0) {
              // AI section with no questions - show loading while questions load
              logger.info('[Resume] AI section needs questions, showing loading screen');
              setShowSectionIntro(false);
              setCurrentScreen('loading');
            } else {
              // Questions already loaded or not an AI section - go directly to assessment
              logger.info('[Resume] Going directly to assessment');
              setShowSectionIntro(false);
              setCurrentScreen('assessment');
            }
          } else if (currentSectionIndex === adaptiveSectionIndex) {
            // Adaptive is completed but DB recorded the adaptive section index
            // (caused by debounce race on section transition) — move directly to AI section intro
            logger.info('[Resume] Adaptive completed at boundary, advancing to AI section', {
              adaptiveSectionIndex,
              nextSectionIndex: adaptiveSectionIndex + 1
            });
            const nextSectionIndex = adaptiveSectionIndex + 1;
            store.setCurrentQuestion(nextSectionIndex, 0);
            setShowSectionIntro(true);
            setCurrentScreen('section-intro');
          } else {
            // User was still in adaptive section or earlier - show section-complete for adaptive
            store.setCurrentQuestion(adaptiveSectionIndex, 0);

            // Use saved adaptive section timing (in minutes → seconds), fallback to overall elapsed
            const adaptiveSectionMinutes = resumeData.sectionTimings?.adaptive_aptitude || 0;
            const restoredElapsed = adaptiveSectionMinutes > 0
              ? adaptiveSectionMinutes * 60
              : (resumeData.elapsedTime || 0);
            // Set after tick so the section-change effect (which resets to 0) fires first
            setTimeout(() => setElapsedTime(restoredElapsed), 0);

            setShowSectionIntro(false);
            setCurrentScreen('section-complete');
          }
          
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

          // Check if resuming to an AI section (aptitude or knowledge)
          const currentSection = sectionsToUse[currentSectionIndex || 0];
          const isAISection = currentSection && (
            currentSection.name === 'aptitude' || 
            currentSection.name === 'knowledge' ||
            (typeof currentSection.id === 'string' && (currentSection.id.startsWith('aptitude-') || currentSection.id.startsWith('knowledge-')))
          );
          
          if (isAISection && currentSection.questions.length === 0) {
            // Resuming to an AI section with no questions yet - store the target position
            // The AI questions effect will restore position once questions are loaded
            logger.info('[Resume] Resuming to AI section - storing pending position for restore after questions load', {
              sectionName: currentSection.name,
              sectionIndex: currentSectionIndex || 0,
              questionIndex: currentQuestionIndex || 0
            });

            // Store the pending resume position - will be used by AI questions effect
            pendingAIResumeRef.current = {
              sectionIndex: currentSectionIndex || 0,
              questionIndex: currentQuestionIndex || 0,
              answers: answers || {}
            };

            // Show loading screen while AI questions load
            setShowSectionIntro(false);
            setCurrentScreen('loading');
          } else {
            // Skip intro and go directly to assessment
            setShowSectionIntro(false);
            setCurrentScreen('assessment');
          }
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
      setAdaptiveElapsedTime(0); // Also reset adaptive elapsed time
      setAdaptiveTimer(60); // Reset adaptive timer to 60 seconds
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

  // Use the old submission hook that properly handles AI-generated questions
  const { submit: submitAssessmentWithAI, isSubmitting } = useAssessmentSubmission();

  // Handle submit assessment
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!store.attemptId) return;

    store.setStatus('submitting');
    store.setLoading(true);
    setCurrentScreen('analyzing');

    try {
      // Use the old flow that properly fetches AI-generated questions
      // and calls analyzeAssessmentWithGemini
      await submitAssessmentWithAI({
        answers: store.answers,
        sections: store.sections,
        learnerStream: store.streamId || null,
        gradeLevel: store.gradeLevel,
        sectionTimings: {}, // TODO: Track section timings
        currentAttempt: { id: store.attemptId },
        userId: user?.id || null,
        timeRemaining: null,
        elapsedTime: 0,
        selectedCategory: undefined,
        learnerProgram: learnerProgram || undefined, // Pass the learner program from the hook
      });

      toast.success('Success');
      store.setStatus('completed');
      setCurrentScreen('complete');
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      console.error('[AssessmentTestPage] Submit error:', error);
      store.setError(error);
      setCurrentScreen('error');
    } finally {
      store.setLoading(false);
    }
  }, [store, submitAssessmentWithAI, user, learnerProgram]);

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
    // Calculate next section index BEFORE calling nextSection() 
    // because store.currentSectionIndex won't update synchronously
    const nextSectionIndex = store.currentSectionIndex + 1;
    const nextSection = store.sections[nextSectionIndex];

    // Normal flow: move to next section (this resets questionIndex to 0, which is correct)
    store.nextSection();
    
    const isAISection = nextSection && (
      nextSection.name === 'aptitude' || 
      nextSection.name === 'knowledge' ||
      (typeof nextSection.id === 'string' && (nextSection.id.startsWith('aptitude-') || nextSection.id.startsWith('knowledge-')))
    );
    
    // Save progress when moving to next section (especially important for AI sections)
    if (store.attemptId) {
      if (isAISection) {
        logger.info('[AI Section Entry] Saving progress for AI section', { 
          sectionName: nextSection.name,
          sectionIndex: nextSectionIndex,
          attemptId: store.attemptId
        });
        store.saveAnswer('_ai_section_entry_marker', new Date().toISOString());
      }
    }
    
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

  // Unified timer for all non-adaptive sections (counts up)
  // This timer runs for both timed and non-timed sections
  // Timer ONLY runs during active assessment, NOT on intro or complete screens
  useEffect(() => {
    if (store.sections.length === 0) return;
    
    const currentSection = store.sections[store.currentSectionIndex];
    const isAdaptive = isAdaptiveSection(currentSection);
    
    // Run timer ONLY when:
    // 1. Not adaptive section
    // 2. Currently on assessment screen (not intro, not complete, not analyzing)
    // 3. Not showing section intro
    const shouldRunTimer = !isAdaptive 
      && currentScreen === 'assessment' 
      && !showSectionIntro;

    if (shouldRunTimer) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [store.currentSectionIndex, currentScreen, showSectionIntro, store.sections]);

  // Adaptive timer countdown (60 seconds per question)
  // Timer ONLY runs during active assessment, NOT on complete screens
  useEffect(() => {
    const currentSection = store.sections[store.currentSectionIndex];
    const isAdaptive = isAdaptiveSection(currentSection);
    
    // Run timer ONLY when:
    // 1. Is adaptive section
    // 2. Currently on assessment screen (not complete)
    // 3. Not showing section intro
    // 4. Has current question
    const shouldRunTimer = isAdaptive 
      && currentScreen === 'assessment' 
      && !showSectionIntro 
      && adaptiveHook.currentQuestion;

    if (shouldRunTimer) {
      const timer = setInterval(() => {
        if (adaptiveTimerRef.current <= 1) {
          // Time's up — submit selected answer or default to A, then reset timer
          const answerToSubmit = (selectedAnswer || 'A') as 'A' | 'B' | 'C' | 'D';
          adaptiveHook.submitAnswer(answerToSubmit);
          if (selectedAnswer) setSelectedAnswer(null);
          setAdaptiveTimer(60);
        } else {
          setAdaptiveTimer(prev => prev - 1);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [store.currentSectionIndex, currentScreen, showSectionIntro, adaptiveHook.currentQuestion, store.sections, selectedAnswer]);

  // Adaptive elapsed time tracker (counts up for total time spent)
  useEffect(() => {
    const currentSection = store.sections[store.currentSectionIndex];
    const isAdaptive = isAdaptiveSection(currentSection);
    
    // Track elapsed time for adaptive section
    const shouldRunTimer = isAdaptive 
      && currentScreen === 'assessment' 
      && !showSectionIntro 
      && adaptiveHook.currentQuestion;

    if (shouldRunTimer) {
      const timer = setInterval(() => {
        setAdaptiveElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [store.currentSectionIndex, currentScreen, showSectionIntro, adaptiveHook.currentQuestion, store.sections]);

  // Reset adaptive timer when question changes
  useEffect(() => {
    const currentSection = store.sections[store.currentSectionIndex];
    if (isAdaptiveSection(currentSection) && adaptiveHook.currentQuestion) {
      setAdaptiveTimer(60); // Reset to 60 seconds for new question
    }
  }, [adaptiveHook.questionsAnswered, store.currentSectionIndex, adaptiveHook.currentQuestion, store.sections]);

  // AI section per-question countdown (59 → 0, loops back to 59)
  useEffect(() => {
    if (store.sections.length === 0) return;
    const currentSection = store.sections[store.currentSectionIndex];
    if (!isAISection(currentSection) || currentScreen !== 'assessment' || showSectionIntro) return;

    const timer = setInterval(() => {
      setAiSectionTimer(prev => (prev <= 1 ? 59 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [store.currentSectionIndex, store.currentQuestionIndex, currentScreen, showSectionIntro, store.sections]);

  // Reset AI section timer to 59 when question changes
  useEffect(() => {
    if (store.sections.length === 0) return;
    const currentSection = store.sections[store.currentSectionIndex];
    if (isAISection(currentSection)) {
      setAiSectionTimer(59);
    }
  }, [store.currentQuestionIndex, store.currentSectionIndex, store.sections]);

  // Reset elapsed time when section changes
  const previousSectionIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (previousSectionIndexRef.current !== null && previousSectionIndexRef.current !== store.currentSectionIndex) {
      setElapsedTime(0);
      setAdaptiveElapsedTime(0); // Also reset adaptive elapsed time
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
        onCategorySelect={handleCategorySelect}
        onBack={() => {
          setSelectedGrade(null);
          setSelectedCategory(null);
          setCurrentScreen('grade-selection');
        }}
        loading={store.loading}
      />
    );
  }

  // Stream selection screen (for higher_secondary and after10)
  if (currentScreen === 'stream-selection' && selectedGrade && selectedCategory) {
    return (
      <StreamSelectionScreen
        gradeLevel={selectedGrade}
        selectedCategory={selectedCategory}
        onStreamSelect={handleStreamSelect}
        onBack={() => {
          setSelectedCategory(null);
          setCurrentScreen('category-selection');
        }}
        isLoading={store.loading}
        learnerProgram={learnerProgram}
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
    
    // Check if this is an AI section (aptitude or knowledge) and if questions are being loaded
    const isAISection = currentSection.id === 'aptitude' || currentSection.id === 'knowledge' || currentSection.name === 'aptitude' || currentSection.name === 'knowledge';
    const isLoadingAI = isAISection && aiQuestionsHook.loading;
    const hasAIError = isAISection && aiQuestionsHook.error;
    const hasNoQuestions = currentSection.questions?.length === 0;

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
        showAIPoweredBadge={isAISection}
        isLoading={store.loading || isLoadingAI}
        gradeLevel={currentGradeLevel}
        aiProgress={isLoadingAI ? aiQuestionsHook.progress : undefined}
        aiError={hasAIError ? aiQuestionsHook.error : undefined}
        onRetryAI={hasAIError ? aiQuestionsHook.reload : undefined}
        onStart={() => {
          // Demo mode blocker
          showDemoModal();
          return;

          // Don't allow starting if AI questions are still loading or if there are no questions
          if (isLoadingAI || (isAISection && hasNoQuestions && !hasAIError)) {
            toast.error('Please wait for questions to load');
            return;
          }

          if (hasAIError) {
            toast.error('Please retry loading questions');
            return;
          }
          
          // Save progress marker only on first entry (not on resume), to avoid overwriting saved position
          if (isAISection && store.attemptId && !store.answers['_ai_section_start_marker']) {
            logger.info('[AI Section Start] Saving progress marker for AI section (first entry)', {
              sectionName: currentSection.name,
              sectionIndex: store.currentSectionIndex,
              attemptId: store.attemptId
            });

            // Save a progress marker to ensure this attempt is considered "started"
            store.saveAnswer('_ai_section_start_marker', new Date().toISOString());
          }
          
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
                elapsedTime={adaptiveElapsedTime}
                perQuestionTimer={adaptiveTimer}
                showPerQuestionTimer={false}
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
    const isCurrentAISection = isAISection(currentSection);

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
                perQuestionTimer={isCurrentAISection ? aiSectionTimer : null}
                showPerQuestionTimer={isCurrentAISection}
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