import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from "@/stores/portfolioStore";
import { useTheme } from "@/stores/themeStore";
import { checkProfileCompleteness } from "@/features/student-profile/lib/profileCompletenessChecker";
import { getPromptDismissed, setPromptDismissed } from "@/features/student-profile/lib/profilePromptPreference";

/**
 * Return type for useProfileCompletionPrompt hook
 */
export interface UseProfileCompletionPromptReturn {
  showModal: boolean;
  incompleteSections: string[];
  handleComplete: () => void;
  handleSkip: () => void;
  handleNeverShow: () => void;
  handleClose: () => void;
}

/**
 * Custom hook to manage profile completion prompt logic
 * 
 * This hook:
 * - Fetches student data from PortfolioContext
 * - Checks profile completeness
 * - Manages modal visibility based on user preferences
 * - Provides handlers for user actions
 * - Handles errors gracefully
 * 
 * @returns Object containing modal state and action handlers
 */
export function useProfileCompletionPrompt(): UseProfileCompletionPromptReturn {
  const navigate = useNavigate();
  const { student, isLoading } = usePortfolio();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  // Memoize profile completeness check results to avoid recalculation
  const profileCompletenessResult = useMemo(() => {
    if (isLoading || !student) {
      return { incompleteSections: [], isComplete: true };
    }

    try {
      const result = checkProfileCompleteness(student);
      
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] Profile completeness check memoized', {
          studentId: student.id,
          result,
        });
      }
      
      return result;
    } catch (error) {
      if (isDevelopment) {
        console.error('[useProfileCompletionPrompt] Error in memoized completeness check:', error);
      }
      return { incompleteSections: [], isComplete: true };
    }
  }, [student, isLoading, isDevelopment]);

  // Memoize dismissal preference check to avoid repeated localStorage reads
  const isDismissed = useMemo(() => {
    if (!student?.id) return false;
    
    try {
      const dismissed = getPromptDismissed(student.id);
      
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] Dismissal preference memoized', {
          studentId: student.id,
          dismissed,
        });
      }
      
      return dismissed;
    } catch (error) {
      if (isDevelopment) {
        console.error('[useProfileCompletionPrompt] Error checking dismissal preference:', error);
      }
      return false;
    }
  }, [student?.id, isDevelopment]);

  // Check profile completeness and determine if modal should show
  useEffect(() => {
    // Reset error state on new data
    setHasError(false);

    // Don't show modal while data is loading
    if (isLoading) {
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] Waiting for data to load...');
      }
      return;
    }

    // Handle missing student data gracefully
    if (!student) {
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] No student data available - assuming complete profile');
      }
      setShowModal(false);
      return;
    }

    // Validate student data structure
    if (!student.id) {
      if (isDevelopment) {
        console.error('[useProfileCompletionPrompt] Invalid student data: missing ID', student);
      }
      setHasError(true);
      setShowModal(false);
      return;
    }

    try {
      // Use memoized values instead of recalculating
      if (isDismissed) {
        if (isDevelopment) {
          console.log('[useProfileCompletionPrompt] User has permanently dismissed prompt', {
            studentId: student.id,
          });
        }
        setShowModal(false);
        return;
      }

      // Show modal only if profile is incomplete
      const shouldShow = !profileCompletenessResult.isComplete;
      
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] Modal display decision', {
          studentId: student.id,
          isComplete: profileCompletenessResult.isComplete,
          incompleteSections: profileCompletenessResult.incompleteSections,
          shouldShow,
          isDismissed,
          theme,
        });
      }

      setShowModal(shouldShow);
    } catch (error) {
      if (isDevelopment) {
        console.error('[useProfileCompletionPrompt] Error during modal display logic:', error);
      }
      setHasError(true);
      setShowModal(false);
    }
  }, [student, isLoading, isDismissed, profileCompletenessResult, theme, isDevelopment]);

  /**
   * Handle "Complete Now" button click
   * Closes modal and navigates to profile edit page
   */
  const handleComplete = () => {
    if (isDevelopment) {
      console.log('[useProfileCompletionPrompt] User clicked "Complete Now"');
    }
    setShowModal(false);
    navigate('/student/profile');
  };

  /**
   * Handle "Skip for now" button click
   * Closes modal without changing user preference
   */
  const handleSkip = () => {
    if (isDevelopment) {
      console.log('[useProfileCompletionPrompt] User clicked "Skip for now"');
    }
    setShowModal(false);
  };

  /**
   * Handle "Never show this again" button click
   * Closes modal and stores dismissal preference in localStorage
   */
  const handleNeverShow = () => {
    if (!student) {
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] Cannot save preference: no student data');
      }
      setShowModal(false);
      return;
    }

    if (!student.id) {
      if (isDevelopment) {
        console.error('[useProfileCompletionPrompt] Cannot save preference: invalid student ID');
      }
      setShowModal(false);
      return;
    }

    try {
      if (isDevelopment) {
        console.log('[useProfileCompletionPrompt] User clicked "Never show this again"', {
          studentId: student.id,
        });
      }

      // Store dismissal preference with error handling
      setPromptDismissed(student.id, true);
      setShowModal(false);
    } catch (error) {
      if (isDevelopment) {
        console.error('[useProfileCompletionPrompt] Error saving dismissal preference:', error);
      }
      // Still close modal even if preference save fails
      setShowModal(false);
    }
  };

  /**
   * Handle modal close (backdrop click or Escape key)
   * Closes modal without changing user preference
   */
  const handleClose = () => {
    if (isDevelopment) {
      console.log('[useProfileCompletionPrompt] User closed modal (backdrop/Escape)');
    }
    setShowModal(false);
  };

  return {
    showModal,
    incompleteSections: profileCompletenessResult.incompleteSections,
    handleComplete,
    handleSkip,
    handleNeverShow,
    handleClose,
  };
}
