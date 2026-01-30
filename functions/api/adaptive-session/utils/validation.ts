/**
 * Validation utilities for adaptive session API
 */

import { createSupabaseClient, createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';

/**
 * Validation result for duplicate detection
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Session duplicate validation result
 */
export interface SessionValidationResult {
  isValid: boolean;
  duplicates?: Array<{ questionId: string; sequences: number[] }>;
}

/**
 * Validates that the exclusion list is complete
 * 
 * Requirements: 1.4
 * - Verifies all answered question IDs are in exclusion list
 * - Verifies all phase question IDs are in exclusion list
 * - Logs error if any IDs are missing
 * 
 * @param excludeIds - The built exclusion list
 * @param answeredIds - IDs of answered questions
 * @param phaseIds - IDs of current phase questions
 * @returns ValidationResult with isValid and optional reason
 */
export function validateExclusionListComplete(
  excludeIds: string[],
  answeredIds: string[],
  phaseIds: string[]
): ValidationResult {
  const excludeSet = new Set(excludeIds);
  const missingAnsweredIds: string[] = [];
  const missingPhaseIds: string[] = [];
  
  // Check all answered question IDs are in exclusion list
  for (const id of answeredIds) {
    if (!excludeSet.has(id)) {
      missingAnsweredIds.push(id);
    }
  }
  
  // Check all phase question IDs are in exclusion list
  for (const id of phaseIds) {
    if (!excludeSet.has(id)) {
      missingPhaseIds.push(id);
    }
  }
  
  // Log errors if any IDs are missing
  if (missingAnsweredIds.length > 0) {
    console.error('❌ [ValidationUtils] Exclusion list validation failed: Missing answered question IDs:', missingAnsweredIds);
  }
  
  if (missingPhaseIds.length > 0) {
    console.error('❌ [ValidationUtils] Exclusion list validation failed: Missing phase question IDs:', missingPhaseIds);
  }
  
  const isValid = missingAnsweredIds.length === 0 && missingPhaseIds.length === 0;
  
  if (isValid) {
    console.log('✅ [ValidationUtils] Exclusion list validation passed: All IDs accounted for');
  }
  
  return {
    isValid,
    reason: isValid 
      ? undefined 
      : `Missing ${missingAnsweredIds.length} answered IDs and ${missingPhaseIds.length} phase IDs from exclusion list`
  };
}

/**
 * Validates that a question is not a duplicate
 * 
 * Requirements: 3.3
 * - Checks if question ID is in exclusion list
 * - Checks if question text is in exclusion list
 * 
 * @param question - The question to validate
 * @param excludeIds - Array of question IDs to exclude
 * @param excludeTexts - Array of question texts to exclude
 * @returns ValidationResult with isValid and optional reason
 */
export function validateQuestionNotDuplicate(
  question: { id: string; text: string },
  excludeIds: string[],
  excludeTexts: string[]
): ValidationResult {
  // Check if question ID is in exclusion list
  if (excludeIds.includes(question.id)) {
    return { 
      isValid: false, 
      reason: `Question ID ${question.id} is in exclusion list` 
    };
  }
  
  // Check if question text is in exclusion list
  if (excludeTexts.includes(question.text)) {
    return { 
      isValid: false, 
      reason: `Question text already used` 
    };
  }
  
  return { isValid: true };
}


/**
 * Validates that a session has no duplicate questions
 * 
 * Requirements: 3.1
 * - Queries all responses for a session
 * - Groups by question_id and counts occurrences
 * - Returns list of duplicates with sequence numbers
 * 
 * @param sessionId - The session ID to validate
 * @param supabase - Supabase client instance
 * @returns Validation result with isValid flag and optional duplicates array
 */
export async function validateSessionNoDuplicates(
  sessionId: string,
  supabase: ReturnType<typeof createSupabaseClient> | ReturnType<typeof createSupabaseAdminClient>
): Promise<SessionValidationResult> {
  // Query all responses for the session
  const { data: responses, error } = await supabase
    .from('adaptive_aptitude_responses')
    .select('question_id, sequence_number')
    .eq('session_id', sessionId)
    .order('sequence_number', { ascending: true });
  
  if (error) {
    console.error('❌ [ValidationUtils] Failed to fetch responses for duplicate validation:', error);
    // Return valid to avoid blocking test completion on query errors
    return { isValid: true };
  }
  
  if (!responses || responses.length === 0) {
    // No responses means no duplicates
    return { isValid: true };
  }
  
  // Group by question_id and collect sequence numbers
  const questionMap = new Map<string, number[]>();
  
  for (const response of responses) {
    const questionId = response.question_id;
    const sequenceNumber = response.sequence_number;
    
    if (!questionMap.has(questionId)) {
      questionMap.set(questionId, []);
    }
    questionMap.get(questionId)!.push(sequenceNumber);
  }
  
  // Find duplicates (questions that appear more than once)
  const duplicates = Array.from(questionMap.entries())
    .filter(([_, sequences]) => sequences.length > 1)
    .map(([questionId, sequences]) => ({ questionId, sequences }));
  
  if (duplicates.length > 0) {
    console.error(`❌ [ValidationUtils] Session ${sessionId} has duplicate questions:`, duplicates);
    return { isValid: false, duplicates };
  }
  
  console.log(`✅ [ValidationUtils] Session ${sessionId} validation passed: No duplicate questions found`);
  return { isValid: true };
}
