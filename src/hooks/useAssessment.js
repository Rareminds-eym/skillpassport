/**
 * useAssessment Hook
 * Provides assessment functionality with database integration
 * 
 * OPTIMIZED: All initial data is loaded in parallel for faster startup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
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
  const [studentRecordId, setStudentRecordId] = useState(null);
  
  // Track if initial load is complete
  const initialLoadComplete = useRef(false);

  // OPTIMIZED: Load ALL initial data in parallel (sections, streams, student ID)
  useEffect(() => {
    const loadAllInitialData = async () => {
      // Skip if no user or already loaded
      if (!user?.id || initialLoadComplete.current) {
        if (!user?.id) setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('🚀 useAssessment: Loading all initial data in parallel...');
        const startTime = performance.now();
        
        // Run ALL queries in parallel for maximum speed
        const [sectionsData, streamsData, studentData] = await Promise.all([
          // 1. Fetch sections
          assessmentService.fetchSections(),
          // 2. Fetch streams
          assessmentService.fetchStreams(),
          // 3. Fetch student ID (optimized single query with OR condition)
          supabase
            .from('students')
            .select('id')
            .or(`user_id.eq.${user.id},id.eq.${user.id}`)
            .maybeSingle()
        ]);
        
        const endTime = performance.now();
        console.log(`✅ useAssessment: All data loaded in ${Math.round(endTime - startTime)}ms`);
        
        // Set all state at once
        setSections(sectionsData || []);
        setStreams(streamsData || []);
        
        if (studentData.data?.id) {
          console.log('useAssessment: Found student record:', studentData.data.id);
          setStudentRecordId(studentData.data.id);
        } else {
          console.log('useAssessment: No student record found for user:', user.id);
        }
        
        initialLoadComplete.current = true;
      } catch (err) {
        console.error('Error loading assessment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllInitialData();
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
        
        // IMPORTANT: First restore all_responses (RIASEC, BigFive, Values, Employability, etc.)
        // These are stored directly in the attempt record, not in personal_assessment_responses
        if (attempt.all_responses && typeof attempt.all_responses === 'object') {
          Object.entries(attempt.all_responses).forEach(([key, value]) => {
            restoredResponses[key] = value;
          });
          console.log('✅ Restored', Object.keys(attempt.all_responses).length, 'responses from all_responses');
        }
        
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
        
        // Then restore AI-generated question responses from personal_assessment_responses table
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
      
      // CRITICAL FIX: Also restore from all_responses column (RIASEC, BigFive, Values, etc.)
      if (attempt.all_responses) {
        console.log('🔄 Restoring answers from all_responses column:', Object.keys(attempt.all_responses).length);
        Object.entries(attempt.all_responses).forEach(([key, value]) => {
          restoredResponses[key] = value;
        });
        console.log('✅ Total restored responses:', Object.keys(restoredResponses).length);
      }
      
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
  const updateProgress = useCallback(async (sectionIndex, questionIndex, sectionTimings, timerRemaining = null, elapsedTime = null, allResponses = null, aptitudeQuestionTimer = null) => {
    if (!currentAttempt?.id) return { success: false, error: 'No active attempt' };

    try {
      await assessmentService.updateAttemptProgress(currentAttempt.id, {
        sectionIndex,
        questionIndex,
        sectionTimings,
        timerRemaining,
        elapsedTime,
        allResponses,
        aptitudeQuestionTimer
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
