/**
 * Assessment API Service - Optimized Backend Integration
 * 
 * Single source for all assessment backend calls.
 * All functions call backend API endpoints which handle database operations.
 * No direct database access - everything goes through secure backend.
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('assessment-api');
const API_BASE = '/api/assessment';

// ============================================================================
// TYPES
// ============================================================================

export interface StartAssessmentRequest {
  gradeLevel: string;
  streamId?: string | null;
}

export interface StartAssessmentResponse {
  success: boolean;
  attemptId?: string;
  sections?: any[];
  error?: string;
}

export interface SaveResponseRequest {
  attemptId: string;
  questionId: string;
  answer: any;
}

export interface SaveResponseResponse {
  success: boolean;
  error?: string;
}

export interface SubmitAssessmentRequest {
  attemptId: string;
  answers: Record<string, any>;
  sectionTimings?: Record<string, number>;
}

export interface SubmitAssessmentResponse {
  success: boolean;
  resultId?: string;
  error?: string;
}

export interface CheckInProgressResponse {
  success: boolean;
  hasInProgress: boolean;
  attemptId?: string;
  answers?: Record<string, any>;
  all_responses?: Record<string, any>;
  currentSectionIndex?: number;
  currentQuestionIndex?: number;
  gradeLevel?: string;
  streamId?: string;
  stream_id?: string;
  sectionTimings?: Record<string, number>;
  timerRemaining?: number | null;
  elapsedTime?: number;
  started_at?: string;
  error?: string;
}

export interface UpdateProgressRequest {
  attemptId: string;
  sectionIndex: number;
  questionIndex: number;
  sectionTimings?: Record<string, number>;
  timerRemaining?: number | null;
  elapsedTime?: number | null;
  answers?: Record<string, any>;
}

export interface UpdateProgressResponse {
  success: boolean;
  error?: string;
  userMessage?: string;
}

// ============================================================================
// ASSESSMENT LIFECYCLE
// ============================================================================

/**
 * Start a new assessment attempt
 * Backend creates attempt record and returns sections
 */
export async function startAssessment(request: StartAssessmentRequest): Promise<StartAssessmentResponse> {
  try {
    logger.info('Starting assessment', { gradeLevel: request.gradeLevel, streamId: request.streamId });

    const response = await ssoClient.fetch(`${API_BASE}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('Failed to start assessment', error);
      return { 
        success: false, 
        error: error.message || 'Failed to start assessment' 
      };
    }

    const data = await response.json();
    logger.info('Assessment started', { attemptId: data.attemptId });
    return { 
      success: true, 
      attemptId: data.attemptId, 
      sections: data.sections 
    };
  } catch (err: any) {
    logger.error('Error starting assessment', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}

/**
 * Save a single response to a question
 * Backend validates and stores response
 */
export async function saveResponse(request: SaveResponseRequest): Promise<SaveResponseResponse> {
  try {
    const response = await ssoClient.fetch(`${API_BASE}/save-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('Failed to save response', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save response' 
      };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Error saving response', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}

/**
 * Update assessment progress (position, timers, answers)
 * Backend merges data with existing attempt
 */
export async function updateProgress(request: UpdateProgressRequest): Promise<UpdateProgressResponse> {
  try {
    const response = await ssoClient.fetch(`${API_BASE}/update-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('Failed to update progress', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update progress',
        userMessage: error.userMessage || 'Could not save your progress. Please check your internet connection.'
      };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Error updating progress', err);
    return { 
      success: false, 
      error: err.message || 'Network error',
      userMessage: 'Network connection lost. Please check your internet and try again.'
    };
  }
}

/**
 * Submit completed assessment
 * Backend runs AI analysis and creates result record
 */
export async function submitAssessment(request: SubmitAssessmentRequest): Promise<SubmitAssessmentResponse> {
  try {
    logger.info('Submitting assessment', { attemptId: request.attemptId });

    const response = await ssoClient.fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('Failed to submit assessment', error);
      return { 
        success: false, 
        error: error.message || 'Failed to submit assessment' 
      };
    }

    const data = await response.json();
    logger.info('Assessment submitted successfully', { resultId: data.resultId });
    return { 
      success: true, 
      resultId: data.resultId 
    };
  } catch (err: any) {
    logger.error('Error submitting assessment', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}

/**
 * Check if learner has in-progress assessment
 * Backend returns attempt with all saved data
 */
export async function checkInProgress(): Promise<CheckInProgressResponse> {
  try {
    const response = await ssoClient.fetch(`${API_BASE}/check-in-progress`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('Failed to check in-progress', error);
      return { 
        success: false, 
        hasInProgress: false, 
        error: error.message 
      };
    }

    const data = await response.json();
    return {
      success: true,
      hasInProgress: data.hasInProgress,
      attemptId: data.attemptId,
      answers: data.answers,
      all_responses: data.all_responses,
      currentSectionIndex: data.currentSectionIndex,
      currentQuestionIndex: data.currentQuestionIndex,
      gradeLevel: data.gradeLevel,
      streamId: data.streamId,
      stream_id: data.stream_id,
      sectionTimings: data.sectionTimings,
      timerRemaining: data.timerRemaining,
      elapsedTime: data.elapsedTime,
      started_at: data.started_at
    };
  } catch (err: any) {
    logger.error('Error checking in-progress assessment', err);
    return { 
      success: false, 
      hasInProgress: false, 
      error: err.message || 'Network error' 
    };
  }
}

/**
 * Abandon an in-progress assessment
 * Backend marks attempt as abandoned
 */
export async function abandonAttempt(attemptId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await ssoClient.fetch(`${API_BASE}/abandon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('Failed to abandon attempt', error);
      return { 
        success: false, 
        error: error.message || 'Failed to abandon attempt' 
      };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Error abandoning attempt', err);
    return { 
      success: false, 
      error: err.message || 'Network error' 
    };
  }
}
