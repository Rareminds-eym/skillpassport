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
  return {
    action,
    [`${itemType}_id`]: itemId,
    [`${action.includes('approve') ? 'approver' : 'rejector'}_id`]: userId,
    notes
  };
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
    
    const result = await apiPost(endpoint, payload) as ApiResponse<ApprovalResult>;
    return result.data;
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
    
    const result = await apiPost(endpoint, payload) as ApiResponse<ApprovalResult>;
    return result.data;
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
