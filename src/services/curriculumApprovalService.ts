import { supabase } from '../lib/supabaseClient';

/**
 * Curriculum Approval Service
 * Handles curriculum approval workflow for affiliated colleges
 */

export interface CurriculumApprovalRequest {
  id: string;
  curriculum_id: string;
  university_id: string;
  college_id: string;
  requested_by: string;
  request_date: string;
  request_message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
  auto_published: boolean;
  published_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CurriculumApprovalDashboard {
  request_id: string;
  curriculum_id: string;
  university_id: string;
  college_id: string;
  request_status: string;
  request_date: string;
  review_date?: string;
  review_notes?: string;
  auto_published: boolean;
  curriculum_status: string;
  course_code: string;
  course_name: string;
  college_name: string;
  college_code: string;
  dean_name?: string;
  dean_email?: string;
  requester_email: string;
  requester_name: string;
  reviewer_email?: string;
  reviewer_name?: string;
  department_name: string;
  program_name: string;
}

export interface CurriculumStatus {
  curriculum_id: string;
  college_id: string;
  course_id: string;
  department_id: string;
  program_id: string;
  academic_year: string;
  approval_status: string;
  university_id?: string;
  course_code: string;
  course_name: string;
  is_affiliated: boolean;
  latest_request_id?: string;
  latest_request_status?: string;
  latest_request_date?: string;
  latest_review_notes?: string;
  university_name?: string;
  department_name: string;
  program_name: string;
}

export interface ApprovalNotification {
  id: string;
  approval_request_id: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  metadata: any;
}

export const curriculumApprovalService = {
  /**
   * Check if a college is affiliated with a university
   */
  async checkCollegeAffiliation(collegeId: string): Promise<{ 
    success: boolean; 
    isAffiliated: boolean; 
    universityId?: string; 
    universityName?: string;
    error?: string; 
  }> {
    try {
      const { data, error } = await supabase.rpc('is_college_affiliated_with_university', {
        p_college_id: collegeId
      });

      if (error) throw error;

      if (data) {
        // Get university details
        const { data: universityData, error: univError } = await supabase.rpc('get_university_for_college', {
          p_college_id: collegeId
        });

        if (univError) throw univError;

        if (universityData) {
          const { data: univInfo } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', universityData)
            .single();

          return {
            success: true,
            isAffiliated: true,
            universityId: universityData,
            universityName: univInfo?.name
          };
        }
      }

      return {
        success: true,
        isAffiliated: false
      };
    } catch (error: any) {
      return {
        success: false,
        isAffiliated: false,
        error: error.message
      };
    }
  },

  /**
   * Submit curriculum for approval
   */
  async submitForApproval(
    curriculumId: string,
    requestMessage?: string
  ): Promise<{ success: boolean; data?: CurriculumApprovalRequest; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get curriculum details
      const { data: curriculum } = await supabase
        .from('college_curriculums')
        .select('college_id')
        .eq('id', curriculumId)
        .single();

      if (!curriculum) {
        return { success: false, error: 'Curriculum not found' };
      }

      // Check if college is affiliated
      const affiliationCheck = await this.checkCollegeAffiliation(curriculum.college_id);
      if (!affiliationCheck.success || !affiliationCheck.isAffiliated) {
        return { success: false, error: 'College is not affiliated with any university' };
      }

      // Create approval request
      const { data, error } = await supabase
        .from('curriculum_approval_requests')
        .insert([{
          curriculum_id: curriculumId,
          university_id: affiliationCheck.universityId,
          college_id: curriculum.college_id,
          requested_by: user.id,
          request_message: requestMessage,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to submit curriculum for approval'
      };
    }
  },

  /**
   * Get curriculum status for college admin
   */
  async getCurriculumStatus(curriculumId: string): Promise<{ 
    success: boolean; 
    data?: CurriculumStatus; 
    error?: string; 
  }> {
    try {
      const { data, error } = await supabase
        .from('college_curriculum_status')
        .select('*')
        .eq('curriculum_id', curriculumId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get curriculum status'
      };
    }
  },

  /**
   * Get pending approval requests for university admin
   */
  async getPendingApprovals(universityId: string): Promise<{ 
    success: boolean; 
    data?: CurriculumApprovalDashboard[]; 
    error?: string; 
  }> {
    try {
      const { data, error } = await supabase
        .from('curriculum_approval_dashboard')
        .select('*')
        .eq('university_id', universityId)
        .eq('request_status', 'pending')
        .order('request_date', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get pending approvals'
      };
    }
  },

  /**
   * Get all approval requests for university admin (with filters)
   */
  async getApprovalRequests(
    universityId: string,
    filters?: {
      status?: string;
      collegeId?: string;
      departmentId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ 
    success: boolean; 
    data?: CurriculumApprovalDashboard[]; 
    count?: number;
    error?: string; 
  }> {
    try {
      let query = supabase
        .from('curriculum_approval_dashboard')
        .select('*', { count: 'exact' })
        .eq('university_id', universityId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('request_status', filters.status);
      }
      if (filters?.collegeId) {
        query = query.eq('college_id', filters.collegeId);
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      query = query.order('request_date', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return { success: true, data: data || [], count: count || 0 };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get approval requests'
      };
    }
  },

  /**
   * Approve curriculum
   */
  async approveCurriculum(
    requestId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('curriculum_approval_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          review_date: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', requestId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to approve curriculum'
      };
    }
  },

  /**
   * Reject curriculum
   */
  async rejectCurriculum(
    requestId: string,
    reviewNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('curriculum_approval_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          review_date: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq('id', requestId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reject curriculum'
      };
    }
  },

  /**
   * Withdraw approval request
   */
  async withdrawRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('curriculum_approval_requests')
        .update({
          status: 'withdrawn'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update curriculum status back to draft
      const { data: request } = await supabase
        .from('curriculum_approval_requests')
        .select('curriculum_id')
        .eq('id', requestId)
        .single();

      if (request) {
        await supabase
          .from('college_curriculums')
          .update({
            approval_status: 'draft'
          })
          .eq('id', request.curriculum_id);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to withdraw request'
      };
    }
  },

  /**
   * Get notifications for user
   */
  async getNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<{ success: boolean; data?: ApprovalNotification[]; error?: string }> {
    try {
      let query = supabase
        .from('curriculum_approval_notifications')
        .select('*')
        .eq('recipient_id', userId);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get notifications'
      };
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('curriculum_approval_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read'
      };
    }
  },

  /**
   * Get approval statistics for university admin
   */
  async getApprovalStatistics(universityId: string): Promise<{ 
    success: boolean; 
    data?: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      published: number;
    }; 
    error?: string; 
  }> {
    try {
      const { data, error } = await supabase
        .from('curriculum_approval_requests')
        .select('status')
        .eq('university_id', universityId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        approved: data?.filter(r => r.status === 'approved').length || 0,
        rejected: data?.filter(r => r.status === 'rejected').length || 0,
        published: data?.filter(r => r.status === 'approved').length || 0 // Same as approved since auto-published
      };

      return { success: true, data: stats };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get approval statistics'
      };
    }
  }
};