/**
 * useAssessment Hook
 * Provides assessment functionality with database integration
 * 
 * OPTIMIZED: All initial data is loaded in parallel for faster startup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {MutableRefObject, SetStateAction} from 'react';

import * as assessmentService from '../api/assessmentService';
import {getOwnAssessmentLearner} from '../api/learnerContext';

import { useUser } from '@/shared/model/authStore';
type AssessmentOwner = { id: string | null };

/** State and retained callbacks are valid only for this exact owner generation. */
function useOwnerState<T>(initialValue:T, owner:AssessmentOwner, liveOwner:MutableRefObject<AssessmentOwner>, mounted:MutableRefObject<boolean>) {
  const initial=useRef(initialValue);
  const [stored,setStored]=useState({owner,value:initial.current});
  const setValue=useCallback((next:SetStateAction<T>)=>{
    if(!mounted.current||liveOwner.current!==owner)return;
    setStored(previous=>{
      if(!mounted.current||liveOwner.current!==owner)return previous;
      const value=previous.owner===owner?previous.value:initial.current;
      return {owner,value:typeof next==='function'?(next as (previous:T)=>T)(value):next};
    });
  },[owner,liveOwner,mounted]);
  return [stored.owner===owner?stored.value:initial.current,setValue] as const;
}

export const useAssessment = () => {
  const user = useUser();
  const ownerId=user?.id||null;
  const liveOwner=useRef<AssessmentOwner>({id:ownerId});
  // Compare identity during rendering, so old state is never exposed while an
  // effect is waiting to reset. A -> B -> A gets a fresh generation as well.
  if(liveOwner.current.id!==ownerId)liveOwner.current={id:ownerId};
  const owner=liveOwner.current;
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
  const isCurrentOwner=()=>mounted.current&&owner.id!==null&&liveOwner.current===owner;
  const assertCurrentOwner=()=>{if(!isCurrentOwner())throw new Error('Assessment owner changed');};
  const [loading,setLoading]=useOwnerState(true,owner,liveOwner,mounted);
  const [error,setError]=useOwnerState<string|null>(null,owner,liveOwner,mounted);
  const [sections,setSections]=useOwnerState<Array<{id:string;name:string}>>([],owner,liveOwner,mounted);
  const [streams,setStreams]=useOwnerState<unknown[]>([],owner,liveOwner,mounted);
  const [currentAttempt,setCurrentAttempt]=useOwnerState<Record<string,any>|null>(null,owner,liveOwner,mounted);
  const [questions,setQuestions]=useOwnerState<Record<string,any>>({},owner,liveOwner,mounted);
  const [responses,setResponses]=useOwnerState<Record<string,unknown>>({},owner,liveOwner,mounted);
  const [learnerRecordId,setlearnerRecordId]=useOwnerState<string|null>(null,owner,liveOwner,mounted);

  useEffect(()=>{
    let cancelled=false;
    if(!owner.id){setLoading(false);return;}
    const load=async()=>{
      setLoading(true);
      setError(null);
      try{
        const [sectionsData,streamsData,learnerData]=await Promise.all([
          assessmentService.fetchSections(),assessmentService.fetchStreams(),getOwnAssessmentLearner(owner.id!),
        ]);
        if(cancelled||!isCurrentOwner())return;
        setSections(sectionsData||[]);
        setStreams(streamsData||[]);
        setlearnerRecordId(learnerData?.id??null);
      }catch(err){
        if(!cancelled&&isCurrentOwner())setError(err instanceof Error?err.message:'Assessment context unavailable');
      }finally{
        if(!cancelled&&isCurrentOwner())setLoading(false);
      }
    };
    void load();
    return ()=>{cancelled=true;};
  },[owner]);

  // Check for in-progress attempt
  const checkInProgressAttempt = useCallback(async () => {
    if (!isCurrentOwner() || !learnerRecordId) return null;
    
    try {
      const attempt = await assessmentService.getInProgressAttempt(learnerRecordId);
      assertCurrentOwner();
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
          assertCurrentOwner();
          sectionsData.forEach(s => {
            sectionIdToName[s.id] = s.name;
          });
        } catch (e) {
          console.warn('Could not fetch sections for response restoration:', e);
        }
        
        assertCurrentOwner();

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
  }, [learnerRecordId, owner]);

  // Start a new assessment
  const startAssessment = useCallback(async (streamId, gradeLevel) => {
    assertCurrentOwner();
    console.log('useAssessment.startAssessment called with:', { streamId, gradeLevel, learnerRecordId });
    
    if (!learnerRecordId) throw new Error('Learner record not found');

    try {
      setLoading(true);
      setError(null);

      // Create new attempt using learner record ID (not auth user ID)
      console.log('Creating attempt with learnerRecordId:', learnerRecordId);
      const attempt = await assessmentService.createAttempt(learnerRecordId, streamId, gradeLevel);
      assertCurrentOwner();
      console.log('Attempt created:', attempt);
      setCurrentAttempt(attempt);

      // Load all questions for this stream and grade level
      const allQuestions = await assessmentService.fetchAllQuestions(attempt.stream_id, attempt.grade_level, attempt.id);
      assertCurrentOwner();
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
  }, [learnerRecordId, owner]);

  // Resume an existing attempt
  const resumeAssessment = useCallback(async (attemptId) => {
    assertCurrentOwner();
    try {
      setLoading(true);
      const attempt = await assessmentService.getAttemptWithResults(attemptId);
      assertCurrentOwner();
      setCurrentAttempt(attempt);

      // Load questions for this stream and grade level
      const allQuestions = await assessmentService.fetchAllQuestions(attempt.stream_id, attempt.grade_level, attempt.id);
      assertCurrentOwner();
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
  }, [sections, owner]);

  // Save a response
  const saveResponse = useCallback(async (sectionName, questionId, value, isCorrect = null) => {
    assertCurrentOwner();
    if (!currentAttempt?.id) {
      console.warn('⚠️ No active attempt, skipping save');
      return { success: false, error: 'No active attempt' };
    }

    const responseKey = `${sectionName}_${questionId}`;
    
    // Update local state immediately (optimistic update)
    setResponses(prev => ({
      ...prev,
      [responseKey]: value
    }));

    // Save to database with error handling
    try {
      await assessmentService.saveResponse(
        currentAttempt.id,
        questionId,
        value,
        isCorrect
      );
      assertCurrentOwner();
      return { success: true };
    } catch (err) {
      console.error('❌ Error saving response:', err);
      
      // Provide user-friendly error message
      let userMessage = 'Failed to save answer';
      if (err.code === 'VALIDATION_ERROR') {
        userMessage = 'Invalid data - please try again';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        userMessage = 'Network error - please check your connection';
      } else if (err.code === 'RESPONSE_SAVE_FAILED') {
        userMessage = 'Failed to save answer after multiple attempts';
      }
      
      return { 
        success: false, 
        error: err.message,
        userMessage,
        code: err.code
      };
    }
  }, [currentAttempt?.id, owner]);

  // Update progress
  const updateProgress = useCallback(async (sectionIndex, questionIndex, sectionTimings, timerRemaining = null, elapsedTime = null, allResponses = null, aptitudeQuestionTimer = null) => {
    assertCurrentOwner();
    if (!currentAttempt?.id) {
      console.warn('⚠️ No active attempt, skipping progress update');
      return { success: false, error: 'No active attempt' };
    }

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
      assertCurrentOwner();
      return { success: true };
    } catch (err) {
      console.error('❌ Error updating progress:', err);
      
      // Provide user-friendly error message
      let userMessage = 'Failed to save progress';
      if (err.code === 'VALIDATION_ERROR') {
        userMessage = 'Invalid progress data';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        userMessage = 'Network error - progress not saved';
      } else if (err.code === 'PROGRESS_UPDATE_FAILED') {
        userMessage = 'Failed to save progress after multiple attempts';
      }
      
      return { 
        success: false, 
        error: err.message,
        userMessage,
        code: err.code
      };
    }
  }, [currentAttempt?.id, owner]);

  // Complete the assessment
  const completeAssessment = useCallback(async (geminiResults, sectionTimings) => {
    assertCurrentOwner();
    if (!currentAttempt?.id || !learnerRecordId) {
      throw new Error('No active attempt or learner record');
    }

    try {
      setLoading(true);
      const results = await assessmentService.completeAttempt(
        currentAttempt.id,
        learnerRecordId,
        currentAttempt.stream_id,
        currentAttempt.grade_level,
        geminiResults,
        sectionTimings
      );
      assertCurrentOwner();

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
  }, [currentAttempt, learnerRecordId, owner]);

  // Abandon current attempt
  const abandonAssessment = useCallback(async () => {
    assertCurrentOwner();
    if (!currentAttempt?.id) return;

    try {
      await assessmentService.abandonAttempt(currentAttempt.id);
      assertCurrentOwner();
      setCurrentAttempt(null);
      setResponses({});
      setQuestions({});
    } catch (err) {
      console.error('Error abandoning assessment:', err);
    }
  }, [currentAttempt?.id, owner]);

  // Get assessment history
  const getHistory = useCallback(async () => {
    if (!isCurrentOwner() || !learnerRecordId) return [];

    try {
      const history=await assessmentService.getlearnerAttempts(learnerRecordId);
      assertCurrentOwner();
      return history;
    } catch (err) {
      console.error('Error fetching history:', err);
      return [];
    }
  }, [learnerRecordId, owner]);

  // Get latest result
  const getLatestResult = useCallback(async () => {
    if (!isCurrentOwner() || !learnerRecordId) return null;

    try {
      const result=await assessmentService.getLatestResult(learnerRecordId);
      assertCurrentOwner();
      return result;
    } catch (err) {
      console.error('Error fetching latest result:', err);
      return null;
    }
  }, [learnerRecordId, owner]);

  return {
    // State
    loading: ownerId ? loading : false,
    error,
    sections,
    streams,
    currentAttempt,
    questions,
    responses,
    learnerRecordId,
    
    // Actions
    checkInProgressAttempt,
    startAssessment,
    resumeAssessment,
    saveResponse,
    updateProgress,
    completeAssessment,
    abandonAssessment,
    getHistory,
    getLatestResult
  };
};

export default useAssessment;
