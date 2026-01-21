import { useCallback, useEffect, useRef, useState } from 'react';
import { courseProgressService } from '../services/courseProgressService';

/**
 * Custom hook for video progress tracking
 * Handles auto-save, resume, and completion detection
 */
export const useVideoProgress = (studentId, courseId, lessonId, options = {}) => {
  const {
    saveInterval = 5000, // Save every 5 seconds during playback
    completionThreshold = 0.9, // 90% watched = completed
    resumeBuffer = 2, // Resume 2 seconds before saved position
    enabled = true, // Allow disabling for non-students
  } = options;

  const videoRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastSavedPositionRef = useRef(0);

  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRestored, setHasRestored] = useState(false);

  // Load saved position on mount/lesson change
  useEffect(() => {
    if (!enabled || !studentId || !courseId || !lessonId) {
      setIsLoading(false);
      return;
    }

    const loadPosition = async () => {
      setIsLoading(true);
      setHasRestored(false);

      try {
        const saved = await courseProgressService.getVideoPosition(studentId, courseId, lessonId);

        if (saved) {
          setIsCompleted(saved.video_completed || false);

          // Store position to restore when video loads
          if (saved.video_position_seconds > 0 && !saved.video_completed) {
            lastSavedPositionRef.current = Math.max(0, saved.video_position_seconds - resumeBuffer);
          }
        }
      } catch (error) {
        console.error('Error loading video position:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosition();

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [studentId, courseId, lessonId, enabled, resumeBuffer]);

  // Save position to database (debounced)
  const savePosition = useCallback(
    async (position, videoDuration) => {
      if (!enabled || !studentId || !courseId || !lessonId) return;

      await courseProgressService.saveVideoPosition(
        studentId,
        courseId,
        lessonId,
        Math.floor(position),
        Math.floor(videoDuration)
      );
      lastSavedPositionRef.current = position;
    },
    [enabled, studentId, courseId, lessonId]
  );

  // Immediate save (for pause, seek, blur events)
  const saveImmediately = useCallback(() => {
    if (!videoRef.current || !enabled) return;

    const video = videoRef.current;
    if (video.currentTime > 0) {
      // Clear any pending debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      savePosition(video.currentTime, video.duration);
    }
  }, [savePosition, enabled]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    // Restore position when video metadata loads
    const handleLoadedMetadata = () => {
      setDuration(video.duration);

      // Restore saved position
      if (lastSavedPositionRef.current > 0 && !hasRestored) {
        video.currentTime = lastSavedPositionRef.current;
        setHasRestored(true);
      }
    };

    // Track time updates with debounced save
    const handleTimeUpdate = () => {
      const position = video.currentTime;
      setCurrentPosition(position);

      // Check for completion
      if (video.duration > 0 && position / video.duration >= completionThreshold && !isCompleted) {
        setIsCompleted(true);
        courseProgressService.markVideoCompleted(studentId, courseId, lessonId);
      }

      // Debounced save during playback
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (!video.paused && position > lastSavedPositionRef.current + 3) {
          savePosition(position, video.duration);
        }
      }, saveInterval);
    };

    // Save on pause
    const handlePause = () => {
      saveImmediately();
    };

    // Save on seek
    const handleSeeked = () => {
      saveImmediately();
    };

    // Save when video ends
    const handleEnded = () => {
      setIsCompleted(true);
      courseProgressService.markVideoCompleted(studentId, courseId, lessonId);
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ended', handleEnded);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    enabled,
    studentId,
    courseId,
    lessonId,
    savePosition,
    saveImmediately,
    saveInterval,
    completionThreshold,
    isCompleted,
    hasRestored,
  ]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      if (videoRef.current && videoRef.current.currentTime > 0) {
        // Use sendBeacon for reliable save on page close
        const data = JSON.stringify({
          studentId,
          courseId,
          lessonId,
          position: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration),
        });

        // Fallback: save synchronously if sendBeacon not available
        saveImmediately();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveImmediately();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, studentId, courseId, lessonId, saveImmediately]);

  // Seek to specific position
  const seekTo = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  }, []);

  // Get progress percentage
  const progressPercent = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return {
    videoRef,
    currentPosition,
    duration,
    progressPercent,
    isCompleted,
    isLoading,
    seekTo,
    saveImmediately,
  };
};

export default useVideoProgress;
