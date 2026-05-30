/**
 * Assessment Validation Utilities
 *
 * Input validation for assessment operations
 */

import type {
  StartAssessmentOptions,
  SaveResponseOptions,
  UpdateProgressOptions,
  SubmitAssessmentOptions,
  AbandonAttemptOptions,
  ValidationResult
} from '../types';

const VALID_GRADE_LEVELS = ['middle', 'highschool', 'higher_secondary', 'after10', 'after12', 'college'];
const VALID_QUESTION_TYPES = ['mcq', 'rating', 'multiselect', 'text', 'sjt', 'likert'];

/**
 * Validate start assessment request
 */
export function validateStartAssessmentRequest(body: any): ValidationResult {
  if (!body) {
    return { isValid: false, message: 'Request body is required' };
  }

  const { gradeLevel } = body as StartAssessmentOptions;

  if (!gradeLevel) {
    return { isValid: false, message: 'gradeLevel is required' };
  }

  if (!VALID_GRADE_LEVELS.includes(gradeLevel)) {
    return {
      isValid: false,
      message: `Invalid gradeLevel. Must be one of: ${VALID_GRADE_LEVELS.join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Validate save response request
 */
export function validateSaveResponseRequest(body: any): ValidationResult {
  if (!body) {
    return { isValid: false, message: 'Request body is required' };
  }

  const { attemptId, questionId, answer } = body as SaveResponseOptions;

  if (!attemptId) {
    return { isValid: false, message: 'attemptId is required' };
  }

  if (!questionId) {
    return { isValid: false, message: 'questionId is required' };
  }

  if (answer === undefined || answer === null) {
    return { isValid: false, message: 'answer is required' };
  }

  return { isValid: true };
}

/**
 * Validate update progress request
 */
export function validateUpdateProgressRequest(body: any): ValidationResult {
  if (!body) {
    return { isValid: false, message: 'Request body is required' };
  }

  const { attemptId } = body as UpdateProgressOptions;

  if (!attemptId) {
    return { isValid: false, message: 'attemptId is required' };
  }

  return { isValid: true };
}

/**
 * Validate submit assessment request
 */
export function validateSubmitAssessmentRequest(body: any): ValidationResult {
  if (!body) {
    return { isValid: false, message: 'Request body is required' };
  }

  const { attemptId } = body as SubmitAssessmentOptions;

  if (!attemptId) {
    return { isValid: false, message: 'attemptId is required' };
  }

  return { isValid: true };
}

/**
 * Validate abandon attempt request
 */
export function validateAbandonAttemptRequest(body: any): ValidationResult {
  if (!body) {
    return { isValid: false, message: 'Request body is required' };
  }

  const { attemptId } = body as AbandonAttemptOptions;

  if (!attemptId) {
    return { isValid: false, message: 'attemptId is required' };
  }

  return { isValid: true };
}

/**
 * Validate learner lookup
 */
export function validateLearnerData(learnerData: any): ValidationResult {
  if (!learnerData?.id) {
    return { isValid: false, message: 'Learner record not found. Please complete your profile first.' };
  }

  return { isValid: true };
}

/**
 * Validate assessment attempt data
 */
export function validateAttemptData(attemptData: any): ValidationResult {
  if (!attemptData?.id) {
    return { isValid: false, message: 'Assessment attempt not found' };
  }

  return { isValid: true };
}
