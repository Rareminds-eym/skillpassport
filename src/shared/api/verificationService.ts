/**
 * Unified Verification Service
 * Provides approval/rejection functionality for learner submissions (certificates, skills, etc.)
 * This service is used by both college-admin and school-admin features.
 * 
 * FSD Compliance: Lives in @/shared/api to avoid cross-slice dependencies
 * DRY Principle: Uses factory functions to eliminate code duplication
 */

import { apiPost } from '@/shared/api/apiClient';

// ── Type Definitions ──
interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  success?: boolean;
}

interface ApprovalResult {
  success: boolean;
  message: string;
}

type ApprovalAuthority = 'college_admin' | 'school_admin';

type ItemType = 
  | 'training' 
  | 'experience' 
  | 'certificate' 
  | 'skill';

// ── Type Guards ──

/**
 * Type guard to validate ApprovalResult shape
 */
function isApprovalResult(value: unknown): value is ApprovalResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as Record<string, unknown>).success === 'boolean' &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type guard to validate ApiResponse shape
 */
function isApiResponse<T>(value: unknown, dataValidator: (data: unknown) => data is T): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  // Check if it has 'data' property and validate it
  if (!('data' in obj)) {
    return false;
  }
  
  return dataValidator(obj.data);
}

// ── Helper Functions ──

/**
 * Determines the correct API endpoint based on approval authority
 */
function getEndpoint(approvalAuthority: ApprovalAuthority): string {
  return approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
}

/**
 * Creates the request payload for approval/rejection operations
 */
function createActionPayload(
  action: string,
  itemType: ItemType,
  itemId: string,
  userId: string,
  notes: string
): Record<string, unknown> {
  if (!itemId || itemId.trim() === '') {
    throw new Error('itemId is required and cannot be empty');
  }
  if (!userId || userId.trim() === '') {
    throw new Error('userId is required and cannot be empty');
  }
  
  return {
    action,
    [`${itemType}_id`]: itemId,
    [`${action.includes('approve') ? 'approver' : 'rejector'}_id`]: userId,
    notes
  };
}

/**
 * Validates and extracts ApprovalResult from API response
 * Throws error if response structure is invalid
 */
function validateAndExtractResult(result: unknown, action: string, itemType: ItemType): ApprovalResult {
  if (!isApiResponse(result, isApprovalResult)) {
    throw new Error(`Invalid API response format for ${action}-${itemType}`);
  }
  return result.data;
}

// ── Factory Functions ──

/**
 * Factory function to create approval functions for different item types
 * Eliminates code duplication across all approval operations
 */
function createApprovalFunction(itemType: ItemType) {
  return async (
    itemId: string,
    approverId: string,
    notes = '',
    approvalAuthority: ApprovalAuthority = 'school_admin'
  ): Promise<ApprovalResult> => {
    const endpoint = getEndpoint(approvalAuthority);
    const payload = createActionPayload(`approve-${itemType}`, itemType, itemId, approverId, notes);
    const result = await apiPost(endpoint, payload);
    
    return validateAndExtractResult(result, 'approve', itemType);
  };
}

/**
 * Factory function to create rejection functions for different item types
 * Eliminates code duplication across all rejection operations
 */
function createRejectionFunction(itemType: ItemType) {
  return async (
    itemId: string,
    rejectorId: string,
    notes: string,
    approvalAuthority: ApprovalAuthority = 'school_admin'
  ): Promise<ApprovalResult> => {
    if (!notes || notes.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const endpoint = getEndpoint(approvalAuthority);
    const payload = createActionPayload(`reject-${itemType}`, itemType, itemId, rejectorId, notes);
    const result = await apiPost(endpoint, payload);
    
    return validateAndExtractResult(result, 'reject', itemType);
  };
}

// ── Public API: Approval Functions ──

/**
 * Approves a training submission
 */
export const approveTraining = createApprovalFunction('training');

/**
 * Approves an experience submission
 */
export const approveExperience = createApprovalFunction('experience');

/**
 * Approves a certificate submission
 */
export const approveCertificate = createApprovalFunction('certificate');

/**
 * Approves a skill submission
 */
export const approveSkill = createApprovalFunction('skill');

// ── Public API: Rejection Functions ──

/**
 * Rejects a training submission
 */
export const rejectTraining = createRejectionFunction('training');

/**
 * Rejects an experience submission
 */
export const rejectExperience = createRejectionFunction('experience');

/**
 * Rejects a certificate submission
 */
export const rejectCertificate = createRejectionFunction('certificate');

/**
 * Rejects a skill submission
 */
export const rejectSkill = createRejectionFunction('skill');
