/**
 * useAssessment Hook
 * Provides assessment functionality with database integration
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as assessmentService from '../services/assessmentService';

export const useAssessment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [streams, setStreams] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [questions, setQuestions] = useState({});
  const [responses, setResponses] = useState({});

  // Load sections and streams on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [sectionsData, streamsData] = await Promise.all([
          assessmentService.fetchSections(),
          assessmentService.fetchStreams()
        ]);
        setSections(sectionsData);
        setStreams(streamsData);
      } catch (err) {
        console.error('Error loading assessment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Check for in-progress attempt
  const checkInProgressAttempt = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      const attempt = await assessmentService.getInProgressAttempt(user.id);
      if (attempt) {
        setCurrentAttempt(attempt);
        // Restore responses from the attempt
        const restoredResponses = {};
        
        // Get sections to map IDs to names (for regular database questions)
        let sectionIdToName = {};
        try {
          const sectionsData = await assessmentService.fetchSections();
          sectionsData.forEach(s => {
            sectionIdToName[s.id] = s.name;
          });
        } catch (e) {
          console.warn('Could not fetch sections for response restoration:', e);
        }
        
        attempt.responses?.forEach(r => {
          if (r.question_id && r.response_value !== null) {
            // For regular questions with section info, use sectionName_questionId format
            // For AI questions (no section info), just use the question_id
            // The frontend will match by question UUID
            restoredResponses[r.question_id] = r.response_value;
          }
        });
        setResponses(restoredResponses);
        
        // Return attempt with restored responses for the component
        return { ...attempt, restoredResponses };
      }
      return attempt;
    } catch (err) {
      console.error('Error checking in-progress attempt:', err);
      return null;
    }
  }, [user?.id]);

  // Start a new assessment
  const startAssessment = useCallback(async (streamId, gradeLevel) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      // Create new attempt
      const attempt = await assessmentService.createAttempt(user.id, streamId, gradeLevel);
      setCurrentAttempt(attempt);

      // Load all questions for this stream and grade level
      const allQuestions = await assessmentService.fetchAllQuestions(streamId, gradeLevel);
      setQuestions(allQuestions);
      setResponses({});

      return attempt;
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Resume an existing attempt
  const resumeAssessment = useCallback(async (attemptId) => {
    try {
      setLoading(true);
      const attempt = await assessmentService.getAttemptWithResults(attemptId);
      setCurrentAttempt(attempt);

      // Load questions for this stream and grade level
      const allQuestions = await assessmentService.fetchAllQuestions(attempt.stream_id, attempt.grade_level);
      setQuestions(allQuestions);

      // Restore responses
      const restoredResponses = {};
      attempt.responses?.forEach(r => {
        // Create a key that matches the frontend format
        const section = sections.find(s => s.id === r.question?.section_id);
        if (section) {
          restoredResponses[`${section.name}_${r.question_id}`] = r.response_value;
        }
      });
      setResponses(restoredResponses);

      return attempt;
    } catch (err) {
      console.error('Error resuming assessment:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sections]);

  // Save a response
  const saveResponse = useCallback(async (sectionName, questionId, value, isCorrect = null) => {
    if (!currentAttempt?.id) return { success: false, error: 'No active attempt' };

    const responseKey = `${sectionName}_${questionId}`;
    
    // Update local state immediately
    setResponses(prev => ({
      ...prev,
      [responseKey]: value
    }));

    // Save to database
    try {
      await assessmentService.saveResponse(
        currentAttempt.id,
        questionId,
        value,
        isCorrect
      );
      return { success: true };
    } catch (err) {
      console.error('Error saving response:', err);
      return { success: false, error: err.message };
    }
  }, [currentAttempt?.id]);

  // Update progress
  const updateProgress = useCallback(async (sectionIndex, questionIndex, sectionTimings, timerRemaining = null, elapsedTime = null) => {
    if (!currentAttempt?.id) return { success: false, error: 'No active attempt' };

    try {
      await assessmentService.updateAttemptProgress(currentAttempt.id, {
        sectionIndex,
        questionIndex,
        sectionTimings,
        timerRemaining,
        elapsedTime
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating progress:', err);
      return { success: false, error: err.message };
    }
  }, [currentAttempt?.id]);

  // Complete the assessment
  const completeAssessment = useCallback(async (geminiResults, sectionTimings) => {
    if (!currentAttempt?.id || !user?.id) {
      throw new Error('No active attempt or user');
    }

    try {
      setLoading(true);
      const results = await assessmentService.completeAttempt(
        currentAttempt.id,
        user.id,
        currentAttempt.stream_id,
        currentAttempt.grade_level,
        geminiResults,
        sectionTimings
      );

      setCurrentAttempt(prev => ({
        ...prev,
        status: 'completed',
        results: [results]
      }));

      return results;
    } catch (err) {
      console.error('Error completing assessment:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentAttempt, user?.id]);

  // Abandon current attempt
  const abandonAssessment = useCallback(async () => {
    if (!currentAttempt?.id) return;

    try {
      await assessmentService.abandonAttempt(currentAttempt.id);
      setCurrentAttempt(null);
      setResponses({});
      setQuestions({});
    } catch (err) {
      console.error('Error abandoning assessment:', err);
    }
  }, [currentAttempt?.id]);

  // Get assessment history
  const getHistory = useCallback(async () => {
    if (!user?.id) return [];

    try {
      return await assessmentService.getStudentAttempts(user.id);
    } catch (err) {
      console.error('Error fetching history:', err);
      return [];
    }
  }, [user?.id]);

  // Get latest result
  const getLatestResult = useCallback(async () => {
    if (!user?.id) return null;

    try {
      return await assessmentService.getLatestResult(user.id);
    } catch (err) {
      console.error('Error fetching latest result:', err);
      return null;
    }
  }, [user?.id]);

  return {
    // State
    loading,
    error,
    sections,
    streams,
    currentAttempt,
    questions,
    responses,
    
    // Actions
    checkInProgressAttempt,
    startAssessment,
    resumeAssessment,
    saveResponse,
    updateProgress,
    completeAssessment,
    abandonAssessment,
    getHistory,
    getLatestResult,
    
    // Utilities
    transformQuestionsForUI: assessmentService.transformQuestionsForUI
  };
};

export default useAssessment;
