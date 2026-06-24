import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '@/features/digital-portfolio';
import { useTheme } from "@/shared/model/themeStore";
import { useUserRole } from '@/shared/model/authStore';
import { checkProfileCompleteness } from '@/features/learner-profile';
import { getPromptDismissed, setPromptDismissed } from '@/features/learner-profile';
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
 * - Fetches learner data from PortfolioContext
 * - Checks profile completeness
 * - Manages modal visibility based on user preferences
 * - Provides handlers for user actions
 * - Handles errors gracefully
 * 
 * @returns Object containing modal state and action handlers
 */
export function useProfileCompletionPrompt(): UseProfileCompletionPromptReturn {
  const navigate = useNavigate();
  const { learner, isLoading } = usePortfolio();
  const { theme } = useTheme();
  const { role } = useUserRole();
  const [showModal, setShowModal] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check if user is a learner (not admin, educator, etc.)
  const isLearner = useMemo(() => {
    if (!role) return false;
    // Role can be a string or array of strings
    const roles = Array.isArray(role) ? role : [role];
    // Check if user has learner role and NOT admin/educator roles
    return roles.some(r => r === 'learner' || r === 'student') && 
           !roles.some(r => r.includes('admin') || r.includes('educator') || r.includes('teacher'));
  }, [role]);

  // Memoize profile completeness check results to avoid recalculation
  const profileCompletenessResult = useMemo(() => {
    if (isLoading || !learner) {
      return { incompleteSections: [], isComplete: true };
    }

    try {
      const result = checkProfileCompleteness(learner);
      return result;
    } catch (error) {
      logger.error('Error in memoized completeness check', error as Error);
      return { incompleteSections: [], isComplete: true };
    }
  }, [learner, isLoading]);

  // Memoize dismissal preference check to avoid repeated localStorage reads
  const isDismissed = useMemo(() => {
    if (!learner?.id) return false;
    
    try {
      const dismissed = getPromptDismissed(learner.id);
      return dismissed;
    } catch (error) {
      logger.error('Error checking dismissal preference', error as Error);
      return false;
    }
  }, [learner?.id]);

  // Check profile completeness and determine if modal should show
  useEffect(() => {
    // Reset error state on new data
    setHasError(false);

    // Don't show modal while data is loading
    if (isLoading) {
      return;
    }

    // IMPORTANT: Only show modal for learners, not for admins or educators
    if (!isLearner) {
      setShowModal(false);
      return;
    }

    // Handle missing learner data gracefully
    if (!learner) {
      setShowModal(false);
      return;
    }

    // Validate learner data structure
    if (!learner.id) {
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
  }, [learner, isLoading, isDismissed, profileCompletenessResult, theme, isLearner]);

  /**
   * Handle "Complete Now" button click
   * Closes modal and navigates to profile edit page
   */
  const handleComplete = () => {
    setShowModal(false);
    navigate('/learner/profile');
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
    if (!learner) {
      setShowModal(false);
      return;
    }

    if (!learner.id) {
      logger.error('Cannot save preference: invalid learner ID');
      setShowModal(false);
      return;
    }

    try {
      // Store dismissal preference with error handling
      setPromptDismissed(learner.id, true);
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
