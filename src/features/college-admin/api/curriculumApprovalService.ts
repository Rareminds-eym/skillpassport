import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';

export interface CollegeAffiliation {
  isAffiliated: boolean;
  collegeId: string | null;
  universityId: string | null;
  universityName: string | null;
}

export interface CurriculumApprovalRequest {
  curriculumId: string;
  message?: string;
}

export interface CurriculumReview {
  curriculumId: string;
  decision: 'approved' | 'rejected';
  notes?: string;
}

export interface PendingApproval {
  curriculumId: string;
  academicYear: string;
  courseName: string;
  courseCode: string;
  semester: number;
  departmentName: string;
  programName: string;
  collegeName: string;
  requesterName: string;
  requesterEmail: string;
  requestDate: string;
  requestMessage?: string;
}

export interface CurriculumApprovalDashboard {
  request_id: string;
  curriculum_id: string;
  academic_year: string;
  course_name: string;
  course_code: string;
  semester: number;
  department_name: string;
  program_name: string;
  college_name: string;
  requester_name: string;
  requester_email: string;
  request_date: string;
  published_date?: string;
  request_message?: string;
  request_status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'published' | 'archived' | 'rejected';
  review_notes?: string;
  review_date?: string;
  reviewer_name?: string;
}

export interface ApprovalStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
}

export async function checkCollegeAffiliation(): Promise<{ success: boolean; data?: CollegeAffiliation; error?: string }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) {
      return {
        success: true,
        data: {
          isAffiliated: false,
          collegeId: null,
          universityId: null,
          universityName: null,
        }
      };
    }

    const result = await apiPost('/college-admin/curriculum-approvals', { action: 'check-affiliation' });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to check college affiliation' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitForApproval(curriculumId: string, message?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'submit-for-approval',
      curriculum_id: curriculumId,
      message
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to submit curriculum for approval' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reviewCurriculum(curriculumId: string, decision: 'approved' | 'rejected', notes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'review-curriculum',
      curriculum_id: curriculumId,
      decision,
      notes
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to review curriculum' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveCurriculum(requestId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  return reviewCurriculum(requestId, 'approved', notes);
}

export async function rejectCurriculum(requestId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  return reviewCurriculum(requestId, 'rejected', notes);
}

export async function getApprovalRequests(universityId: string, filters?: {
  status?: string;
  collegeId?: string;
  departmentId?: string;
  limit?: number;
}): Promise<{ success: boolean; data?: CurriculumApprovalDashboard[]; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'get-approval-requests',
      university_id: universityId,
      ...filters
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch approval requests' };
    }

    const approvalRequests: CurriculumApprovalDashboard[] = (result.data || []).map((item: any) => ({
      request_id: item.curriculum_id,
      curriculum_id: item.curriculum_id,
      academic_year: item.academic_year || '',
      course_name: item.course_name || '',
      course_code: item.course_code || '',
      semester: item.semester || 1,
      department_name: item.department_name || '',
      program_name: item.program_name || '',
      college_name: item.college_name || '',
      requester_name: item.requester_name || '',
      requester_email: item.requester_email || '',
      request_date: item.request_date || item.created_at || new Date().toISOString(),
      published_date: item.published_date,
      request_message: item.request_message,
      request_status: item.status || 'draft',
      review_notes: item.review_notes,
      review_date: item.review_date,
      reviewer_name: item.reviewer_name,
    }));

    return { success: true, data: approvalRequests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getApprovalStatistics(universityId: string): Promise<{ success: boolean; data?: ApprovalStatistics; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'get-approval-statistics',
      university_id: universityId
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch approval statistics' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPendingApprovals(): Promise<{ success: boolean; data?: PendingApproval[]; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'get-pending-approvals'
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch pending approvals' };
    }

    const pendingApprovals: PendingApproval[] = (result.data || []).map((item: any) => ({
      curriculumId: item.curriculum_id,
      academicYear: item.academic_year,
      courseName: item.course_name,
      courseCode: item.course_code,
      semester: item.semester,
      departmentName: item.department_name || '',
      programName: item.program_name || '',
      collegeName: item.college_name || '',
      requesterName: item.requester_name || '',
      requesterEmail: item.requester_email || '',
      requestDate: item.request_date,
      requestMessage: item.request_message,
    }));

    return { success: true, data: pendingApprovals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getApprovalHistory(limit = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'get-approval-history',
      limit
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to fetch approval history' };
    }

    return { success: true, data: result.data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCurriculumStatus(curriculumId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await apiPost('/college-admin/curriculum-approvals', {
      action: 'get-curriculum-status',
      curriculum_id: curriculumId
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to fetch curriculum status' };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Namespace export for compatibility
export const curriculumApprovalService = {
  checkCollegeAffiliation,
  submitForApproval,
  reviewCurriculum,
  approveCurriculum,
  rejectCurriculum,
  getApprovalRequests,
  getApprovalStatistics,
  getPendingApprovals,
  getApprovalHistory,
  getCurriculumStatus,
};
