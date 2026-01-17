import { supabase } from '../lib/supabaseClient';

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

class CurriculumApprovalService {
  /**
   * Check if the current user's college is affiliated with a university
   * Simple logic: If college_id exists in university_colleges table with active status, then it's affiliated
   */
  async checkCollegeAffiliation(): Promise<{ success: boolean; data?: CollegeAffiliation; error?: string }> {
    try {
      console.log('🔍 Checking college affiliation with direct query...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('❌ No authenticated user found', userError);
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
      
      console.log('✅ User authenticated:', user.email);

      // Get user's organization (college)
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('organizationId')
        .eq('id', user.id)
        .single();

      console.log('📊 User data query result:', { userData, error: userDataError });

      if (userDataError || !userData?.organizationId) {
        console.log('❌ User has no organization assigned', userDataError);
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

      const collegeId = userData.organizationId;
      console.log('✅ User college ID:', collegeId);

      // Simple query without foreign key reference - just get university_id first
      const { data: affiliationData, error: affiliationError } = await supabase
        .from('university_colleges')
        .select('university_id, account_status')
        .eq('college_id', collegeId)
        .eq('account_status', 'active')
        .limit(1);

      console.log('📊 Affiliation query result:', { 
        affiliationData, 
        error: affiliationError,
        collegeId: collegeId,
        query: 'university_colleges where college_id = ' + collegeId + ' and account_status = active'
      });

      if (affiliationError) {
        console.log('❌ Error checking affiliation:', affiliationError.message, affiliationError);
        return { success: false, error: affiliationError.message };
      }

      // If no records found or empty result, college is not affiliated
      if (!affiliationData || affiliationData.length === 0) {
        console.log('❌ No active affiliation found for college:', collegeId);
        console.log('   This means either:');
        console.log('   1. College is not in university_colleges table');
        console.log('   2. account_status is not "active"');
        console.log('   3. RLS policy is blocking the query');
        return {
          success: true,
          data: {
            isAffiliated: false,
            collegeId: collegeId,
            universityId: null,
            universityName: null,
          }
        };
      }

      // College is affiliated! Now get university name
      const affiliation = affiliationData[0];
      console.log('✅ College is affiliated with university:', affiliation.university_id);
      
      // Get university name in a separate query
      let universityName = 'University';
      if (affiliation.university_id) {
        const { data: universityData, error: universityError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', affiliation.university_id)
          .single();
        
        console.log('📊 University name query result:', { universityData, error: universityError });
        
        if (universityData) {
          universityName = universityData.name;
        }
      }
      
      console.log('✅ Final affiliation result:', {
        isAffiliated: true,
        collegeId: collegeId,
        universityId: affiliation.university_id,
        universityName: universityName
      });
      
      return {
        success: true,
        data: {
          isAffiliated: true,
          collegeId: collegeId,
          universityId: affiliation.university_id,
          universityName: universityName,
        }
      };

    } catch (error: any) {
      console.error('❌ Error in checkCollegeAffiliation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit curriculum for approval (for affiliated colleges)
   */
  async submitForApproval(curriculumId: string, message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('submit_curriculum_for_approval', {
        p_curriculum_id: curriculumId,
        p_message: message || null
      });
      
      if (error) {
        console.error('Error submitting curriculum for approval:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Failed to submit curriculum for approval' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in submitForApproval:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Review curriculum (approve/reject) - University Admin only
   */
  async reviewCurriculum(curriculumId: string, decision: 'approved' | 'rejected', notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, try to update the curriculum directly if the RPC function fails
      const { data, error } = await supabase.rpc('review_curriculum', {
        p_curriculum_id: curriculumId,
        p_decision: decision,
        p_notes: notes || null
      });
      
      if (error) {
        console.error('RPC function failed, trying direct update:', error);
        
        // Fallback: Update curriculum directly
        const newStatus = decision === 'approved' ? 'published' : 'rejected';
        const { error: updateError } = await supabase
          .from('college_curriculums')
          .update({
            status: newStatus,
            review_notes: notes,
            review_date: new Date().toISOString(),
            published_date: decision === 'approved' ? new Date().toISOString() : null
          })
          .eq('id', curriculumId)
          .eq('status', 'pending_approval');
        
        if (updateError) {
          console.error('Direct update also failed:', updateError);
          return { success: false, error: updateError.message };
        }
        
        console.log('✅ Curriculum updated successfully via direct update');
        return { success: true };
      }

      if (!data) {
        return { success: false, error: 'Failed to review curriculum' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in reviewCurriculum:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve curriculum - University Admin only
   */
  async approveCurriculum(requestId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    return this.reviewCurriculum(requestId, 'approved', notes);
  }

  /**
   * Reject curriculum - University Admin only
   */
  async rejectCurriculum(requestId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    return this.reviewCurriculum(requestId, 'rejected', notes);
  }

  /**
   * Get approval requests for university admin
   */
  async getApprovalRequests(universityId: string, filters?: {
    status?: string;
    collegeId?: string;
    departmentId?: string;
    limit?: number;
  }): Promise<{ success: boolean; data?: CurriculumApprovalDashboard[]; error?: string }> {
    try {
      console.log('🔍 Fetching approval requests for university:', universityId);
      
      let query = supabase
        .from('curriculum_approval_dashboard')
        .select('*')
        .eq('university_id', universityId)
        .order('request_date', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.collegeId) {
        query = query.eq('college_id', filters.collegeId);
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      console.log('📊 Query filters:', { universityId, filters });

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error fetching approval requests:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Raw data from database:', data);

      const approvalRequests: CurriculumApprovalDashboard[] = (data || []).map(item => ({
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

      console.log('✅ Processed approval requests:', approvalRequests.length);
      return { success: true, data: approvalRequests };
    } catch (error: any) {
      console.error('❌ Error in getApprovalRequests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get approval statistics for university admin
   */
  async getApprovalStatistics(universityId: string): Promise<{ success: boolean; data?: ApprovalStatistics; error?: string }> {
    try {
      console.log('📊 Fetching approval statistics for university:', universityId);
      
      const { data, error } = await supabase
        .from('curriculum_approval_dashboard')
        .select('status')
        .eq('university_id', universityId);
      
      if (error) {
        console.error('❌ Error fetching approval statistics:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Raw statistics data:', data);

      const stats = (data || []).reduce((acc, item) => {
        acc.total++;
        switch (item.status) {
          case 'pending_approval':
            acc.pending++;
            break;
          case 'approved':
            acc.approved++;
            break;
          case 'rejected':
            acc.rejected++;
            break;
          case 'published':
            acc.published++;
            break;
        }
        return acc;
      }, { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 });

      console.log('✅ Processed statistics:', stats);
      return { success: true, data: stats };
    } catch (error: any) {
      console.error('❌ Error in getApprovalStatistics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending approvals for university admin
   */
  async getPendingApprovals(): Promise<{ success: boolean; data?: PendingApproval[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('curriculum_approval_dashboard')
        .select('*')
        .eq('status', 'pending_approval') // Use existing status column
        .order('request_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching pending approvals:', error);
        return { success: false, error: error.message };
      }

      const pendingApprovals: PendingApproval[] = (data || []).map(item => ({
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
      console.error('Error in getPendingApprovals:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get curriculum approval history
   */
  async getApprovalHistory(limit = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('curriculum_approval_dashboard')
        .select('*')
        .in('status', ['approved', 'rejected', 'published']) // Use existing status column
        .order('review_date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching approval history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error in getApprovalHistory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get curriculum status for college admin
   */
  async getCurriculumStatus(curriculumId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('college_curriculum_status')
        .select('*')
        .eq('curriculum_id', curriculumId)
        .single();
      
      if (error) {
        console.error('Error fetching curriculum status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in getCurriculumStatus:', error);
      return { success: false, error: error.message };
    }
  }
}

export const curriculumApprovalService = new CurriculumApprovalService();