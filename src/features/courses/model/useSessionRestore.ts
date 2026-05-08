import { useCallback, useEffect, useState } from 'react';
import { courseProgressService } from '../api/courseProgressService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-session-restore');

/**
 * Custom hook for session restoration logic
 * Handles checking for restore points and managing the restore modal
 */
export const useSessionRestore = (learnerId, courseId, options = {}) => {
  const {
    enabled = true,
    minProgressForRestore = 1, // Minimum progress % to show restore modal
    autoRestoreThreshold = 95  // Auto-restore without modal if progress >= this
  } = options;

  const [restorePoint, setRestorePoint] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAutoRestore, setShouldAutoRestore] = useState(false);

  // Check for restore point on mount
  useEffect(() => {
    if (!enabled || !learnerId || !courseId) {
      setIsLoading(false);
      return;
    }

    const checkRestorePoint = async () => {
      setIsLoading(true);

      try {
        const point = await courseProgressService.getRestorePoint(learnerId, courseId);

        if (point && point.progress >= minProgressForRestore && point.progress < 100) {
          setRestorePoint(point);

          // Auto-restore for high progress without showing modal
          if (point.progress >= autoRestoreThreshold) {
            setShouldAutoRestore(true);
          } else {
            setShowRestoreModal(true);
          }
        }
      } catch (error) {
        logger.error('Error checking restore point', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    };

    checkRestorePoint();
  }, [learnerId, courseId, enabled, minProgressForRestore, autoRestoreThreshold]);

  // Handle user choosing to restore
  const handleRestore = useCallback(() => {
    setShowRestoreModal(false);
    return restorePoint;
  }, [restorePoint]);

  // Handle user choosing to start fresh
  const handleStartFresh = useCallback(async () => {
    if (learnerId && courseId) {
      await courseProgressService.clearRestorePoint(learnerId, courseId);
    }
    setShowRestoreModal(false);
    setRestorePoint(null);
    setShouldAutoRestore(false);
  }, [learnerId, courseId]);

  // Dismiss modal without action
  const dismissModal = useCallback(() => {
    setShowRestoreModal(false);
  }, []);

  // Save current position as restore point
  const saveRestorePoint = useCallback(async (moduleIndex, lessonIndex, lessonId, videoPosition = 0) => {
    if (!enabled || !learnerId || !courseId) return;

    await courseProgressService.saveRestorePoint(
      learnerId,
      courseId,
      moduleIndex,
      lessonIndex,
      lessonId,
      videoPosition
    );
  }, [enabled, learnerId, courseId]);

  // Format last accessed time for display
  const getLastAccessedText = useCallback(() => {
    if (!restorePoint?.lastAccessed) return '';

    const lastAccessed = new Date(restorePoint.lastAccessed);
    const now = new Date();
    const diffMs = now - lastAccessed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return lastAccessed.toLocaleDateString();
  }, [restorePoint]);

  return {
    restorePoint,
    showRestoreModal,
    isLoading,
    shouldAutoRestore,
    handleRestore,
    handleStartFresh,
    dismissModal,
    saveRestorePoint,
    getLastAccessedText
  };
};

export default useSessionRestore;
