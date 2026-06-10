import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'check-affiliation': {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiSuccess({
            isAffiliated: false,
            collegeId: null,
            universityId: null,
            universityName: null,
          }, context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        const { data: affiliationData, error: affiliationError } = await supabase
          .from('university_colleges')
          .select('university_id')
          .eq('college_id', collegeId)
          .eq('account_status', 'active')
          .limit(1);

        if (affiliationError) return apiDbError(affiliationError, context.request, { startTime });

        if (!affiliationData || affiliationData.length === 0) {
          return apiSuccess({
            isAffiliated: false,
            collegeId,
            universityId: null,
            universityName: null,
          }, context.request, { startTime });
        }

        const affiliation = affiliationData[0];
        let universityName: string | null = null;

        if (affiliation.university_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', affiliation.university_id)
            .single();
          if (orgData) universityName = orgData.name;
        }

        return apiSuccess({
          isAffiliated: true,
          collegeId,
          universityId: affiliation.university_id,
          universityName,
        }, context.request, { startTime });
      }

      case 'submit-for-approval': {
        const { curriculum_id, message } = params;
        if (!curriculum_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        const { data: affiliationData } = await supabase
          .from('university_colleges')
          .select('university_id')
          .eq('college_id', collegeId)
          .eq('account_status', 'active')
          .limit(1);

        if (!affiliationData || affiliationData.length === 0) {
          return apiError(400, 'AFFILIATION_ERROR', 'College is not affiliated with any university', context.request, { startTime });
        }

        const universityId = affiliationData[0].university_id;

        const { error: updateError } = await supabase
          .from('college_curriculums')
          .update({
            status: 'pending_approval',
            requested_by: user.id,
            request_date: new Date().toISOString(),
            request_message: message || null,
            university_id: universityId,
          })
          .eq('id', curriculum_id)
          .eq('college_id', collegeId);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'review-curriculum': {
        const { curriculum_id, decision, notes } = params;
        if (!curriculum_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        }
        if (!decision || !['approved', 'rejected'].includes(decision)) {
          return apiError(400, 'VALIDATION_ERROR', 'decision must be "approved" or "rejected"', context.request, { startTime });
        }

        const { data: curriculum, error: currError } = await supabase
          .from('college_curriculums')
          .select('university_id')
          .eq('id', curriculum_id)
          .single();

        if (currError || !curriculum) {
          return apiError(404, 'NOT_FOUND', 'Curriculum not found', context.request, { startTime });
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          return apiError(403, 'PERMISSION_DENIED', 'User not found', context.request, { startTime });
        }

        if (userData.organizationId !== curriculum.university_id) {
          return apiError(403, 'PERMISSION_DENIED', 'Not authorized to review curriculums for this university', context.request, { startTime });
        }

        const isApproved = decision === 'approved';
        const updateData: Record<string, any> = {
          status: isApproved ? 'published' : 'rejected',
          reviewed_by: user.id,
          review_date: new Date().toISOString(),
          review_notes: notes || null,
        };
        if (isApproved) {
          updateData.published_date = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('college_curriculums')
          .update(updateData)
          .eq('id', curriculum_id)
          .eq('status', 'pending_approval');

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-approval-requests': {
        const { university_id, status, college_id, limit } = params;
        if (!university_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing university_id', context.request, { startTime });
        }

        let query = supabase
          .from('curriculum_approval_dashboard')
          .select('*')
          .eq('university_id', university_id)
          .order('request_date', { ascending: false });

        if (status) query = query.eq('status', status);
        if (college_id) query = query.eq('college_id', college_id);
        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const mapped = (data || []).map((item: any) => ({
          curriculumId: item.curriculum_id,
          academicYear: item.academic_year,
          status: item.status,
          requestDate: item.request_date,
          requestMessage: item.request_message,
          reviewDate: item.review_date,
          reviewNotes: item.review_notes,
          publishedDate: item.published_date,
          courseName: item.course_name,
          courseCode: item.course_code,
          semester: item.semester,
          collegeName: item.college_name,
          collegeId: item.college_id,
          universityName: item.university_name,
          universityId: item.university_id,
          requesterEmail: item.requester_email,
          requesterName: item.requester_name,
          reviewerEmail: item.reviewer_email,
          reviewerName: item.reviewer_name,
          departmentName: item.department_name,
          programName: item.program_name,
        }));

        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'get-approval-statistics': {
        const { university_id } = params;
        if (!university_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing university_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('curriculum_approval_dashboard')
          .select('status')
          .eq('university_id', university_id);

        if (error) return apiDbError(error, context.request, { startTime });

        const stats = { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 };
        for (const item of data || []) {
          stats.total++;
          switch (item.status) {
            case 'pending_approval': stats.pending++; break;
            case 'approved': stats.approved++; break;
            case 'rejected': stats.rejected++; break;
            case 'published': stats.published++; break;
          }
        }

        return apiSuccess(stats, context.request, { startTime });
      }

      case 'get-pending-approvals': {
        const { data, error } = await supabase
          .from('curriculum_approval_dashboard')
          .select('*')
          .eq('status', 'pending_approval')
          .order('request_date', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        const mapped = (data || []).map((item: any) => ({
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

        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'get-approval-history': {
        const limit = params.limit || 50;

        const { data, error } = await supabase
          .from('curriculum_approval_dashboard')
          .select('*')
          .in('status', ['approved', 'rejected', 'published'])
          .order('review_date', { ascending: false })
          .limit(limit);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-curriculum-status': {
        const { curriculum_id } = params;
        if (!curriculum_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_curriculum_status')
          .select('*')
          .eq('curriculum_id', curriculum_id)
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[curriculum-approvals POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
