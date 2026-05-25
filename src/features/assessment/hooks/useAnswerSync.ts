import { useRef, useEffect, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useAssessmentStore } from '../model/assessmentStore';
import { updateProgress } from '../api/assessmentApiService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('answer-sync');

export interface SyncStatus {
  isOnline: boolean;
  errorMessage: string | null;
  canProceedToNextQuestion: boolean;
  hasPendingAnswers: boolean;
}

/**
 * Hook for managing answer synchronization with network detection
 * 
 * Flow:
 * 1. User answers question → Saved to Zustand (instant)
 * 2. Zustand persist middleware → Saves to localStorage automatically
 * 3. Hook detects answer change → Queues for backend sync
 * 4. Debounce 2s → Batch answers
 * 5. Check network → If offline, block next question
 * 6. Send to backend → With retry logic
 * 7. On success → Enable next button
 * 
 * UI: Only show errors, no status bars
 */
export const useAnswerSync = (attemptId: string | null, showSectionIntro: boolean = true) => {
  const store = useAssessmentStore();

  // Network state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canProceedToNextQuestion, setCanProceedToNextQuestion] = useState(false);

  // Refs for tracking
  const isSyncing = useRef(false);
  const pendingAnswers = useRef<Map<string, any>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const previousAnswersRef = useRef<Record<string, any>>({});
  const sectionStartTimeRef = useRef<Record<number, number>>({});

  // ===== BUILD SECTION TIMINGS =====
  const buildSectionTimings = (currentSectionIndex: number): Record<string, number> => {
    const currentSection = store.sections[currentSectionIndex];
    if (!currentSection) return {};

    const sectionName = currentSection.name;

    // Calculate elapsed time for this section
    const sectionStartTime = sectionStartTimeRef.current[currentSectionIndex];
    if (!sectionStartTime) {
      return {};
    }

    const elapsedSeconds = Math.round((Date.now() - sectionStartTime) / 1000);

    return {
      [sectionName]: elapsedSeconds
    };
  };

  // ===== SYNC TO BACKEND =====
  const syncPendingAnswers = useCallback(async (retries = 3): Promise<boolean> => {
    if (isSyncing.current || pendingAnswers.current.size === 0 || !attemptId) {
      return true;
    }

    // Check network first
    if (!isOnline) {
      const offlineMsg = 'No internet connection. Answers saved locally.';
      logger.warn('Sync blocked: offline', { attemptId, pendingCount: pendingAnswers.current.size });
      setErrorMessage(offlineMsg);
      setCanProceedToNextQuestion(false);
      return false;
    }

    isSyncing.current = true;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const answers = Object.fromEntries(pendingAnswers.current);
        const sectionTimings = buildSectionTimings(store.currentSectionIndex);


        // Call backend API
        const response = await updateProgress({
          attemptId,
          sectionIndex: store.currentSectionIndex,
          questionIndex: store.currentQuestionIndex,
          sectionTimings,
          answers,
        });

        if (!response.success) {
          throw new Error(response.error || 'Sync failed');
        }

        // Success: clear pending answers
        pendingAnswers.current.clear();
        setErrorMessage(null);
        setCanProceedToNextQuestion(true);
        isSyncing.current = false;
        return true;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`Sync attempt ${attempt + 1}/${retries} failed`, {
          attemptId,
          error: errorMsg,
          pendingCount: pendingAnswers.current.size,
        });

        if (attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
        } else {
          // All retries failed
          const errorMsg = 'Unable to save your answer. Please check your internet connection and try again.';
          logger.error('All sync retries failed', {
            attemptId,
            totalAttempts: retries,
            pendingCount: pendingAnswers.current.size,
          });
          
          setErrorMessage(errorMsg);
          setCanProceedToNextQuestion(false);
          isSyncing.current = false;
          return false;
        }
      }
    }

    isSyncing.current = false;
    return false;
  }, [attemptId, isOnline, store.currentSectionIndex, store.currentQuestionIndex]);

  // ===== TRACK SECTION ENTRY TIME (after intro dismissed) =====
  useEffect(() => {
    // Only start tracking when user clicks "Start" (showSectionIntro becomes false)
    if (!showSectionIntro && !sectionStartTimeRef.current[store.currentSectionIndex]) {
      sectionStartTimeRef.current[store.currentSectionIndex] = Date.now();
    }
  }, [store.currentSectionIndex, showSectionIntro]);

  // ===== DETECT ANSWER CHANGES =====
  useEffect(() => {
    const currentAnswers = store.answers;
    
    // Find new or changed answers
    Object.entries(currentAnswers).forEach(([questionId, answer]) => {
      if (previousAnswersRef.current[questionId] !== answer) {
        pendingAnswers.current.set(questionId, answer);
        // Reset canProceed when new answer is detected
        setCanProceedToNextQuestion(false);
      }
    });

    previousAnswersRef.current = { ...currentAnswers };

    // If answers changed, trigger sync
    if (pendingAnswers.current.size > 0) {
      // Clear existing debounce timer
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      // Debounce: wait 2 seconds after last answer
      debounceTimer.current = setTimeout(() => {
        syncPendingAnswers();
      }, 2000);
    }
  }, [store.answers, syncPendingAnswers]);

  // ===== NETWORK MONITORING =====
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setErrorMessage(null);
      toast.success('Connection restored. Syncing your answers...', {
        duration: 3000,
        position: 'top-right',
      });
      // Auto-sync when back online
      syncPendingAnswers();
    };

    const handleOffline = () => {
      setIsOnline(false);
      const offlineMsg = 'No internet connection. Answers saved locally.';
      setErrorMessage(offlineMsg);
      setCanProceedToNextQuestion(false);
      toast.error(offlineMsg, {
        duration: 4000,
        position: 'top-right',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingAnswers, attemptId]);

  // ===== PERIODIC SYNC (every 5 seconds) =====
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && pendingAnswers.current.size > 0 && !isSyncing.current) {
        syncPendingAnswers();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline, syncPendingAnswers]);

  // ===== SYNC ON PAGE UNLOAD =====
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (pendingAnswers.current.size > 0) {
        logger.warn('Page unload with pending answers', {
          attemptId,
          pendingCount: pendingAnswers.current.size,
        });
        
        const synced = await syncPendingAnswers();
        if (!synced) {
          logger.error('Failed to sync before unload', { attemptId });
          e.preventDefault();
          e.returnValue = 'You have unsaved answers. Are you sure you want to leave?';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncPendingAnswers, attemptId]);

  return {
    isOnline,
    errorMessage,
    canProceedToNextQuestion,
    hasPendingAnswers: pendingAnswers.current.size > 0,
  } as SyncStatus;
};
