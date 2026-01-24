import { useState, useEffect, useCallback, useRef } from 'react';
import { TourProgress } from '../types';
import { supabase } from '../../../lib/supabaseClient';

export const useTourProgress = (tourId: string) => {
  const [progress, setProgress] = useState<TourProgress>({
    tourId,
    status: 'not_started'
  });
  const [loading, setLoading] = useState(true);
  
  // Cache and debouncing refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgressRef = useRef<string>('');

  // Get current user email for database operations
  const getUserEmail = useCallback(() => {
    return localStorage.getItem('userEmail');
  }, []);

  // Load tour progress from database
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Validate tourId is not empty
        if (!tourId || tourId.trim() === '') {
          console.error('Invalid tourId provided to useTourProgress:', tourId);
          setLoading(false);
          return;
        }

        const userEmail = getUserEmail();
        
        if (!userEmail) {
          console.log('🔍 useTourProgress: No user email found, skipping tour progress load');
          setLoading(false);
          return;
        }

        console.log('🔍 useTourProgress: Loading progress for:', { tourId, userEmail });

        const { data: student, error } = await supabase
          .from('students')
          .select('tour_progress')
          .eq('email', userEmail)
          .single();

        if (error) {
          console.error('Failed to load tour progress:', error);
          setLoading(false);
          return;
        }

        console.log('📊 useTourProgress: Student data loaded:', {
          hasStudent: !!student,
          tourProgress: student?.tour_progress,
          specificTour: student?.tour_progress?.[tourId]
        });

        if (student?.tour_progress?.[tourId]) {
          const loadedProgress = {
            ...student.tour_progress[tourId],
            tourId
          };
          console.log('✅ useTourProgress: Found existing progress:', loadedProgress);
          setProgress(loadedProgress);
          // Cache the loaded progress
          lastSavedProgressRef.current = JSON.stringify(loadedProgress);
        } else {
          console.log('🆕 useTourProgress: No existing progress found, tour should auto-start');
        }
      } catch (error) {
        console.error('Error loading tour progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [tourId, getUserEmail]);

  // Debounced save function to prevent excessive database calls
  const debouncedSave = useCallback(async (progressToSave: TourProgress) => {
    try {
      console.log('💾 debouncedSave called with:', progressToSave);
      
      // Check if progress actually changed
      const progressString = JSON.stringify(progressToSave);
      if (progressString === lastSavedProgressRef.current) {
        console.log('⏭️ useTourProgress: No changes detected, skipping save');
        return; // No changes, skip save
      }

      const userEmail = getUserEmail();
      
      if (!userEmail) {
        console.log('❌ useTourProgress: No user email for save operation');
        return;
      }

      console.log('💾 useTourProgress: Saving progress to database:', {
        tourId,
        userEmail,
        progress: progressToSave,
        isFinalState: progressToSave.status === 'completed' || progressToSave.status === 'skipped'
      });

      // Get current tour progress
      const { data: currentStudent, error: fetchError } = await supabase
        .from('students')
        .select('tour_progress')
        .eq('email', userEmail)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current tour progress:', fetchError);
        return;
      }

      console.log('📊 Current student data from DB:', currentStudent);

      // Update tour progress
      const currentTourProgress = currentStudent.tour_progress || {};
      
      // Clean up any empty tourId entries
      if (currentTourProgress['']) {
        delete currentTourProgress[''];
      }
      
      const updatedTourProgress = {
        ...currentTourProgress,
        [tourId]: progressToSave
      };

      console.log('📝 useTourProgress: Updating database with:', updatedTourProgress);

      const { error: updateError, data: updateData } = await supabase
        .from('students')
        .update({ tour_progress: updatedTourProgress })
        .eq('email', userEmail)
        .select();

      if (updateError) {
        console.error('Failed to save tour progress:', updateError);
        throw updateError; // Re-throw to be caught by caller
      }

      console.log('✅ useTourProgress: Successfully saved to database');
      console.log('📊 Updated student data:', updateData);
      // Update cache
      lastSavedProgressRef.current = progressString;
    } catch (error) {
      console.error('Error saving tour progress:', error);
      throw error; // Re-throw to be caught by caller
    }
  }, [tourId, getUserEmail]);

  // Save tour progress to database with debouncing
  const saveProgress = useCallback(async (newProgress: Partial<TourProgress>) => {
    try {
      // Validate tourId is not empty
      if (!tourId || tourId.trim() === '') {
        console.error('Invalid tourId provided to saveProgress:', tourId);
        return;
      }

      const updatedProgress = {
        ...progress,
        ...newProgress,
        tourId
      };

      // Update local state immediately for responsive UI
      setProgress(updatedProgress);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce database save (except for final states)
      const isFinalState = updatedProgress.status === 'completed' || updatedProgress.status === 'skipped';
      const delay = isFinalState ? 0 : 500; // Immediate save for final states, 500ms delay for progress updates

      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(updatedProgress);
      }, delay);

    } catch (error) {
      console.error('Error in saveProgress:', error);
    }
  }, [progress, tourId, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Memoized functions to prevent unnecessary re-renders
  const completeTour = useCallback(async () => {
    console.log('🏁 useTourProgress: completeTour called');
    console.log('🔍 Current progress before completion:', progress);
    
    const completionProgress = {
      status: 'completed' as const,
      completedAt: new Date().toISOString()
    };
    
    console.log('📝 Completion data to save:', completionProgress);
    
    // Update local state immediately
    const updatedProgress = {
      ...progress,
      ...completionProgress,
      tourId
    };
    
    console.log('📊 Updated progress object:', updatedProgress);
    setProgress(updatedProgress);
    
    // Save immediately without debouncing for completion
    try {
      console.log('💾 Calling debouncedSave for completion...');
      await debouncedSave(updatedProgress);
      console.log('✅ useTourProgress: Tour completion saved successfully');
    } catch (error) {
      console.error('❌ useTourProgress: Failed to save tour completion:', error);
      throw error; // Re-throw so caller can handle
    }
  }, [progress, tourId, debouncedSave]);

  const skipTour = useCallback(async () => {
    console.log('🚫 useTourProgress: skipTour called');
    
    const skipProgress = {
      status: 'skipped' as const,
      completedAt: new Date().toISOString()
    };
    
    // Update local state immediately
    const updatedProgress = {
      ...progress,
      ...skipProgress,
      tourId
    };
    setProgress(updatedProgress);
    
    // Save immediately without debouncing for skip
    try {
      await debouncedSave(updatedProgress);
      console.log('✅ useTourProgress: Tour skip saved successfully');
    } catch (error) {
      console.error('❌ useTourProgress: Failed to save tour skip:', error);
    }
  }, [progress, tourId, debouncedSave]);

  const startTour = useCallback(() => {
    saveProgress({
      status: 'in_progress',
      lastStepIndex: 0
    });
  }, [saveProgress]);

  // Debounced step update to prevent excessive database calls during navigation
  const updateStep = useCallback((stepIndex: number) => {
    saveProgress({
      status: 'in_progress',
      lastStepIndex: stepIndex
    });
  }, [saveProgress]);

  const resetTour = useCallback(() => {
    saveProgress({
      status: 'not_started',
      completedAt: undefined,
      lastStepIndex: undefined
    });
  }, [saveProgress]);

  // Memoized computed values
  const shouldAutoStart = !loading && progress.status === 'not_started';
  const isCompleted = progress.status === 'completed';
  const isSkipped = progress.status === 'skipped';

  // Debug logging for tour state (simplified)
  useEffect(() => {
    if (progress.status !== 'not_started') {
      console.log('🎯 useTourProgress state:', {
        tourId,
        status: progress.status,
        shouldAutoStart,
        loading
      });
    }
  }, [tourId, progress.status, shouldAutoStart, loading]);

  return {
    progress,
    loading,
    shouldAutoStart,
    isCompleted,
    isSkipped,
    completeTour,
    skipTour,
    startTour,
    updateStep,
    resetTour
  };
};