import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/features/digital-portfolio';
import { useTheme } from "@/shared/model/themeStore";
import { checkProfileCompleteness } from '@/features/student-profile';
import { getPromptDismissed, setPromptDismissed } from '@/features/student-profile';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('profile-completion-prompt');

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

  // Memoize profile completeness check results to avoid recalculation
  const profileCompletenessResult = useMemo(() => {
    if (isLoading || !student) {
      return { incompleteSections: [], isComplete: true };
    }

    try {
      const result = checkProfileCompleteness(student);
      return result;
    } catch (error) {
      logger.error('Error in memoized completeness check', error as Error);
      return { incompleteSections: [], isComplete: true };
    }
  }, [student, isLoading]);

  // Memoize dismissal preference check to avoid repeated localStorage reads
  const isDismissed = useMemo(() => {
    if (!student?.id) return false;
    
    try {
      const dismissed = getPromptDismissed(student.id);
      return dismissed;
    } catch (error) {
      logger.error('Error checking dismissal preference', error as Error);
      return false;
    }
  }, [student?.id]);

  // Check profile completeness and determine if modal should show
  useEffect(() => {
    // Reset error state on new data
    setHasError(false);

    // Don't show modal while data is loading
    if (isLoading) {
      return;
    }

    // Handle missing student data gracefully
    if (!student) {
      setShowModal(false);
      return;
    }

    // Validate student data structure
    if (!student.id) {
      setHasError(true);
      setShowModal(false);
      return;
    }

    try {
      // Use memoized values instead of recalculating
      if (isDismissed) {
        setShowModal(false);
        return;
      }

      // Show modal only if profile is incomplete
      const shouldShow = !profileCompletenessResult.isComplete;
      setShowModal(shouldShow);
    } catch (error) {
      logger.error('Error during modal display logic', error as Error);
      setHasError(true);
      setShowModal(false);
    }
  }, [student, isLoading, isDismissed, profileCompletenessResult, theme]);

  /**
   * Handle "Complete Now" button click
   * Closes modal and navigates to profile edit page
   */
  const handleComplete = () => {
    setShowModal(false);
    navigate('/student/profile');
  };

  /**
   * Handle "Skip for now" button click
   * Closes modal without changing user preference
   */
  const handleSkip = () => {
    setShowModal(false);
  };

  /**
   * Handle "Never show this again" button click
   * Closes modal and stores dismissal preference in localStorage
   */
  const handleNeverShow = () => {
    if (!student) {
      setShowModal(false);
      return;
    }

    if (!student.id) {
      logger.error('Cannot save preference: invalid student ID');
      setShowModal(false);
      return;
    }

    try {
      // Store dismissal preference with error handling
      setPromptDismissed(student.id, true);
      setShowModal(false);
    } catch (error) {
      logger.error('Error saving dismissal preference', error as Error);
      // Still close modal even if preference save fails
      setShowModal(false);
    }
  };

  /**
   * Handle modal close (backdrop click or Escape key)
   * Closes modal without changing user preference
   */
  const handleClose = () => {
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
