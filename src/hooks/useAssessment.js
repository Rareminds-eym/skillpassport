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

  // Get student record ID from students table (not auth user ID)
  const [studentRecordId, setStudentRecordId] = useState(null);
  
  // Fetch student record ID on mount
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user?.id) {
        console.log('useAssessment: No user.id, skipping student fetch');
        return;
      }
      
      console.log('useAssessment: Fetching student record for user.id:', user.id);
      
      try {
        const { supabase } = await import('../lib/supabaseClient');
        
        // First try to find student by user_id (auth user ID)
        let { data, error } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        console.log('useAssessment: Student fetch by user_id result:', { data, error });
        
        // If not found by user_id, check if user.id IS the student table ID directly
        if (!data && !error) {
          console.log('useAssessment: No student found by user_id, checking if user.id is student table ID...');
          const { data: directData, error: directError } = await supabase
            .from('students')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          console.log('useAssessment: Student fetch by id result:', { directData, directError });
          
          if (directData?.id) {
            data = directData;
          }
        }
        
        if (data?.id) {
          console.log('useAssessment: Setting studentRecordId to:', data.id);
          setStudentRecordId(data.id);
        } else {
          console.log('useAssessment: No student record found for user.id:', user.id);
        }
      } catch (err) {
        console.error('Error fetching student record ID:', err);
      }
    };
    
    fetchStudentId();
  }, [user?.id]);

  // Check for in-progress attempt
  const checkInProgressAttempt = useCallback(async () => {
    if (!studentRecordId) return null;
    
    try {
      const attempt = await assessmentService.getInProgressAttempt(studentRecordId);
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
  }, [studentRecordId]);

  // Start a new assessment
  const startAssessment = useCallback(async (streamId, gradeLevel) => {
    console.log('useAssessment.startAssessment called with:', { streamId, gradeLevel, studentRecordId });
    
    if (!studentRecordId) throw new Error('Student record not found');

    try {
      setLoading(true);
      setError(null);

      // Create new attempt using student record ID (not auth user ID)
      console.log('Creating attempt with studentRecordId:', studentRecordId);
      const attempt = await assessmentService.createAttempt(studentRecordId, streamId, gradeLevel);
      console.log('Attempt created:', attempt);
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
  }, [studentRecordId]);

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
    if (!currentAttempt?.id || !studentRecordId) {
      throw new Error('No active attempt or student record');
    }

    try {
      setLoading(true);
      const results = await assessmentService.completeAttempt(
        currentAttempt.id,
        studentRecordId,
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
  }, [currentAttempt, studentRecordId]);

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
    if (!studentRecordId) return [];

    try {
      return await assessmentService.getStudentAttempts(studentRecordId);
    } catch (err) {
      console.error('Error fetching history:', err);
      return [];
    }
  }, [studentRecordId]);

  // Get latest result
  const getLatestResult = useCallback(async () => {
    if (!studentRecordId) return null;

    try {
      return await assessmentService.getLatestResult(studentRecordId);
    } catch (err) {
      console.error('Error fetching latest result:', err);
      return null;
    }
  }, [studentRecordId]);

  return {
    // State
    loading,
    error,
    sections,
    streams,
    currentAttempt,
    questions,
    responses,
    studentRecordId,
    
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
