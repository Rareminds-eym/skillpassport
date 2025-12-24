import { useCallback, useEffect, useState } from 'react';
import { courseProgressService } from '../services/courseProgressService';

/**
 * Custom hook for session restoration logic
 * Handles checking for restore points and managing the restore modal
 */
export const useSessionRestore = (studentId, courseId, options = {}) => {
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
    if (!enabled || !studentId || !courseId) {
      console.log('🔄 useSessionRestore: Skipping - enabled:', enabled, 'studentId:', studentId, 'courseId:', courseId);
      setIsLoading(false);
      return;
    }

    const checkRestorePoint = async () => {
      setIsLoading(true);
      console.log('🔄 useSessionRestore: Checking restore point for student:', studentId, 'course:', courseId);
      
      try {
        const point = await courseProgressService.getRestorePoint(studentId, courseId);
        console.log('🔄 useSessionRestore: Got restore point:', point);
        
        if (point && point.progress >= minProgressForRestore && point.progress < 100) {
          console.log('🔄 useSessionRestore: Valid restore point found, progress:', point.progress);
          setRestorePoint(point);
          
          // Auto-restore for high progress without showing modal
          if (point.progress >= autoRestoreThreshold) {
            console.log('🔄 useSessionRestore: Auto-restoring (high progress)');
            setShouldAutoRestore(true);
          } else {
            console.log('🔄 useSessionRestore: Showing restore modal');
            setShowRestoreModal(true);
          }
        } else {
          console.log('🔄 useSessionRestore: No valid restore point - point:', point, 'minProgress:', minProgressForRestore);
        }
      } catch (error) {
        console.error('Error checking restore point:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkRestorePoint();
  }, [studentId, courseId, enabled, minProgressForRestore, autoRestoreThreshold]);

  // Handle user choosing to restore
  const handleRestore = useCallback(() => {
    setShowRestoreModal(false);
    return restorePoint;
  }, [restorePoint]);

  // Handle user choosing to start fresh
  const handleStartFresh = useCallback(async () => {
    if (studentId && courseId) {
      await courseProgressService.clearRestorePoint(studentId, courseId);
    }
    setShowRestoreModal(false);
    setRestorePoint(null);
    setShouldAutoRestore(false);
  }, [studentId, courseId]);

  // Dismiss modal without action
  const dismissModal = useCallback(() => {
    setShowRestoreModal(false);
  }, []);

  // Save current position as restore point
  const saveRestorePoint = useCallback(async (moduleIndex, lessonIndex, lessonId, videoPosition = 0) => {
    if (!enabled || !studentId || !courseId) return;
    
    await courseProgressService.saveRestorePoint(
      studentId,
      courseId,
      moduleIndex,
      lessonIndex,
      lessonId,
      videoPosition
    );
  }, [enabled, studentId, courseId]);

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
