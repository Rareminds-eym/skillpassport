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
 * 2. In-memory state remains available while this page is mounted (no browser persistence)
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

  const [hasPendingAnswers,setHasPendingAnswers]=useState(false);

  // Refs for tracking
  const isSyncing = useRef(false);
  const pendingAnswers = useRef<Map<string, {value: any}>>(new Map());
  const syncGeneration = useRef(0);
  const activeAttempt = useRef(attemptId);
  activeAttempt.current = attemptId;
  const latestStore = useRef(store);
  latestStore.current = store;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const previousAnswersRef = useRef<Record<string, any>>({});
  const sectionStartTimeRef = useRef<Record<number, number>>({});
  // Track the section/question index that pending answers belong to
  const pendingSectionIndexRef = useRef(store.currentSectionIndex);
  const pendingQuestionIndexRef = useRef(store.currentQuestionIndex);

  // ===== BUILD SECTION TIMINGS =====
  const buildSectionTimings = (currentSectionIndex: number): Record<string, number> => {
    const currentSection = latestStore.current.sections[currentSectionIndex];
    if (!currentSection) return {};

    const sectionName = currentSection.name;
    if (typeof sectionName !== 'string') return {};

    // Calculate elapsed time for this section
    const sectionStartTime = sectionStartTimeRef.current[currentSectionIndex];
    if (!sectionStartTime) {
      return {};
    }

    const elapsedSeconds = Math.round((Date.now() - sectionStartTime) / 1000);

    return {
      [sectionName]: (latestStore.current.sectionTimings?.[sectionName]??0)+elapsedSeconds
    };
  };

  // ===== SYNC TO BACKEND =====
  const syncPendingAnswers = useCallback(async (retries = 3): Promise<boolean> => {
    if (attemptId !== activeAttempt.current || store.generation !== latestStore.current.generation) return false;
    if (isSyncing.current || pendingAnswers.current.size === 0 || !attemptId) {
      return true;
    }

    // Check network first
    if (!isOnline) {
      const offlineMsg = 'No internet connection. Answers are held in this page; keep it open.';
      logger.warn('Sync blocked: offline', { attemptId, pendingCount: pendingAnswers.current.size });
      setErrorMessage(offlineMsg);
      setCanProceedToNextQuestion(false);
      return false;
    }

    const generation = syncGeneration.current;
    const isCurrent = () => generation === syncGeneration.current && attemptId === activeAttempt.current && store.generation === latestStore.current.generation;
    isSyncing.current = true;

    try {
      // Drain batches added while an earlier request is in flight. Each map entry
      // is a version token, so changing the same question cannot be acknowledged
      // accidentally by an older save (even if its value changes back again).
      while (pendingAnswers.current.size > 0 && isCurrent()) {
        let saved = false;
        for (let attempt = 0; attempt < retries; attempt++) {
          if (!isCurrent()) return false;
          const batch = new Map(pendingAnswers.current);
          const answers = Object.fromEntries([...batch].map(([key, entry]) => [key, entry.value]));
          const syncSectionIndex = pendingSectionIndexRef.current;
          const syncQuestionIndex = pendingQuestionIndexRef.current;
          const sectionTimings = buildSectionTimings(syncSectionIndex);
          try {
            const response = await updateProgress({
              attemptId,
              sectionIndex: syncSectionIndex,
              questionIndex: syncQuestionIndex,
              sectionTimings,
              answers,
            });
            if (!isCurrent()) return false;
            if (!response.success) throw new Error(response.error || 'Sync failed');

            for (const [key, entry] of batch) {
              if (pendingAnswers.current.get(key) === entry) pendingAnswers.current.delete(key);
            }
            setHasPendingAnswers(pendingAnswers.current.size>0);
            saved = true;
            break;
          } catch (error) {
            if (!isCurrent()) return false;
            logger.warn(`Sync attempt ${attempt + 1}/${retries} failed`, {
              attemptId,
              error: error instanceof Error ? error.message : 'Unknown error',
              pendingCount: pendingAnswers.current.size,
            });
            if (attempt < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            }
          }
        }
        if (!saved) {
          setErrorMessage('Unable to save your answer. Please check your internet connection and try again.');
          setCanProceedToNextQuestion(false);
          return false;
        }
      }
      if (!isCurrent()) return false;
      setErrorMessage(null);
      setCanProceedToNextQuestion(true);
      return true;
    } finally {
      // An old attempt's completion must not release a newer attempt's sync lock.
      if (isCurrent()) isSyncing.current = false;
    }
  }, [attemptId, isOnline,store.generation]);

  useEffect(() => {
    syncGeneration.current++;
    pendingAnswers.current.clear();
    setHasPendingAnswers(false);
    previousAnswersRef.current = {...store.answers};
    sectionStartTimeRef.current = {};
    isSyncing.current = false;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setCanProceedToNextQuestion(false);
    setErrorMessage(null);
    return () => {
      syncGeneration.current++;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [attemptId,store.generation]);

  // ===== TRACK SECTION ENTRY TIME (after intro dismissed) =====
  useEffect(() => {
    // Only start tracking when user clicks "Start" (showSectionIntro becomes false)
    if (!showSectionIntro && !sectionStartTimeRef.current[store.currentSectionIndex]) {
      sectionStartTimeRef.current[store.currentSectionIndex] = Date.now();
    }
  }, [store.currentSectionIndex, showSectionIntro, attemptId,store.generation]);

  // ===== DETECT ANSWER CHANGES =====
  useEffect(() => {
    const currentAnswers = store.answers;
    let hasNewAnswers = false;

    // Find new or changed answers
    Object.entries(currentAnswers).forEach(([questionId, answer]) => {
      if (previousAnswersRef.current[questionId] !== answer) {
        pendingAnswers.current.set(questionId, {value: answer});
        hasNewAnswers = true;
        // Reset canProceed when new answer is detected
        setCanProceedToNextQuestion(false);
      }
    });

    previousAnswersRef.current = { ...currentAnswers };
    setHasPendingAnswers(pendingAnswers.current.size>0);

    // Capture current position when new answers arrive (before any section navigation)
    if (hasNewAnswers) {
      pendingSectionIndexRef.current = store.currentSectionIndex;
      pendingQuestionIndexRef.current = store.currentQuestionIndex;
    }

    // If answers changed, trigger sync
    if (pendingAnswers.current.size > 0) {
      // Clear existing debounce timer
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      // Debounce: wait 2 seconds after last answer
      debounceTimer.current = setTimeout(() => {
        syncPendingAnswers();
      }, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.answers, attemptId,store.generation]);

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
      const offlineMsg = 'No internet connection. Answers are held in this page; keep it open.';
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
          logger.error('Failed to sync before unload', undefined, { attemptId });
          e.preventDefault();
          e.returnValue = 'You have unsaved answers. Are you sure you want to leave?';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncPendingAnswers, attemptId]);

  const getElapsedSecondsForSection = (sectionIndex: number): number => {
    const startTime = sectionStartTimeRef.current[sectionIndex];
    const name=store.sections[sectionIndex]?.name;
    const saved=name?(store.sectionTimings?.[name]??0):0;
    return saved+(startTime?Math.round((Date.now() - startTime) / 1000):0);
  };

  return {
    isOnline,
    errorMessage,
    canProceedToNextQuestion,
    hasPendingAnswers,
    getElapsedSecondsForSection,
  } as SyncStatus & { getElapsedSecondsForSection: (sectionIndex: number) => number };
};
