/**
 * Unified Verification Service
 * Provides approval/rejection functionality for learner submissions (certificates, skills, etc.)
 * This service is used by both college-admin and school-admin features.
 * 
 * FSD Compliance: Lives in @/shared/api to avoid cross-slice dependencies
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

/**
 * Approves a training submission
 * @param trainingId - ID of the training to approve
 * @param approverId - ID of the admin performing the approval
 * @param notes - Optional approval notes
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function approveTraining(
  trainingId: string,
  approverId: string,
  notes = '',
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'approve-training',
    training_id: trainingId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Rejects a training submission
 * @param trainingId - ID of the training to reject
 * @param rejectorId - ID of the admin performing the rejection
 * @param notes - Rejection reason (required)
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function rejectTraining(
  trainingId: string,
  rejectorId: string,
  notes: string,
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  if (!notes || notes.trim() === '') {
    throw new Error('Rejection reason is required');
  }

  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'reject-training',
    training_id: trainingId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Approves an experience submission
 * @param experienceId - ID of the experience to approve
 * @param approverId - ID of the admin performing the approval
 * @param notes - Optional approval notes
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function approveExperience(
  experienceId: string,
  approverId: string,
  notes = '',
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'approve-experience',
    experience_id: experienceId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Rejects an experience submission
 * @param experienceId - ID of the experience to reject
 * @param rejectorId - ID of the admin performing the rejection
 * @param notes - Rejection reason (required)
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function rejectExperience(
  experienceId: string,
  rejectorId: string,
  notes: string,
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  if (!notes || notes.trim() === '') {
    throw new Error('Rejection reason is required');
  }

  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'reject-experience',
    experience_id: experienceId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Approves a certificate submission
 * @param certificateId - ID of the certificate to approve
 * @param approverId - ID of the admin performing the approval
 * @param notes - Optional approval notes
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function approveCertificate(
  certificateId: string,
  approverId: string,
  notes = '',
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'approve-certificate',
    certificate_id: certificateId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Rejects a certificate submission
 * @param certificateId - ID of the certificate to reject
 * @param rejectorId - ID of the admin performing the rejection
 * @param notes - Rejection reason (required)
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function rejectCertificate(
  certificateId: string,
  rejectorId: string,
  notes: string,
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  if (!notes || notes.trim() === '') {
    throw new Error('Rejection reason is required');
  }

  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'reject-certificate',
    certificate_id: certificateId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Approves a skill submission
 * @param skillId - ID of the skill to approve
 * @param approverId - ID of the admin performing the approval
 * @param notes - Optional approval notes
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function approveSkill(
  skillId: string,
  approverId: string,
  notes = '',
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'approve-skill',
    skill_id: skillId,
    approver_id: approverId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

/**
 * Rejects a skill submission
 * @param skillId - ID of the skill to reject
 * @param rejectorId - ID of the admin performing the rejection
 * @param notes - Rejection reason (required)
 * @param approvalAuthority - 'college_admin' or 'school_admin'
 */
export async function rejectSkill(
  skillId: string,
  rejectorId: string,
  notes: string,
  approvalAuthority: 'college_admin' | 'school_admin' = 'school_admin'
): Promise<ApprovalResult> {
  if (!notes || notes.trim() === '') {
    throw new Error('Rejection reason is required');
  }

  const endpoint = approvalAuthority === 'college_admin' 
    ? '/college-admin/notifications' 
    : '/college-admin/school-admin';
  
  const result = await apiPost(endpoint, {
    action: 'reject-skill',
    skill_id: skillId,
    rejector_id: rejectorId,
    notes
  }) as ApiResponse<ApprovalResult>;

  return result.data;
}

// Export as namespace for convenience
export const VerificationService = {
  approveTraining,
  rejectTraining,
  approveExperience,
  rejectExperience,
  approveCertificate,
  rejectCertificate,
  approveSkill,
  rejectSkill,
};
