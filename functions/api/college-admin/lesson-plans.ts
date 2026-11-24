import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { academicYearVariants } from '../../lib/college-learner-academic-year';

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
    const account = await supabase.from('users').select('role,isActive,organizationId').eq('id', user.id).maybeSingle();
    if (account.error) return apiDbError(account.error, context.request, { startTime });
    const adminRoles = ['college_admin', 'university_admin', 'university_admin_dean'];
    if (!account.data?.isActive || !account.data.organizationId ||
        (!adminRoles.includes(account.data.role) && !user.roles?.some(role => adminRoles.includes(role)))) {
      return apiError(403, 'FORBIDDEN', 'College administrator access is required.', context.request, { startTime });
    }
    const adminCollegeId = account.data.organizationId;
    params.college_id = adminCollegeId;
    switch (action) {
      case 'get-lesson-plans': {
        const { college_id, department_id, program_id, course_id, semester, academic_year, status, created_by } = params;
        let query = supabase
          .from('college_lesson_plans')
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `);
        if (college_id) query = query.eq('college_id', college_id);
        if (department_id) query = query.eq('department_id', department_id);
        if (program_id) query = query.eq('program_id', program_id);
        if (course_id) query = query.eq('course_id', course_id);
        if (semester) query = query.eq('semester', semester);
        if (academic_year) query = query.eq('academic_year', academic_year);
        if (status) query = query.eq('status', status);
        if (created_by) query = query.eq('created_by', created_by);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const result = (data || []).filter((p: any) => {
          // If a draft was submitted by an educator and is pending approval, hide from main list until approved
          if (p.status === 'draft' && p.metadata?.pending_approval?.status === 'pending' && p.created_by !== user.id) {
            return false;
          }
          return true;
        }).map((p: any) => ({
          ...p,
          course_code: p.course?.course_code,
          course_name: p.course?.course_name,
          department_name: p.department?.name,
          program_name: p.program?.name,
          unit_name: p.unit?.name,
        }));
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-educator-changes': {
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .eq('college_id', adminCollegeId);

        if (error) return apiDbError(error, context.request, { startTime });

        const pending: any[] = [];
        const approved: any[] = [];
        const rejected: any[] = [];

        for (const p of data || []) {
          const meta = p.metadata || {};
          const pendingApproval = meta.pending_approval;
          if (pendingApproval && pendingApproval.status === 'pending') {
            pending.push({
              id: pendingApproval.id,
              plan_id: p.id,
              course_id: p.course_id,
              course_name: p.course?.course_name || '',
              course_code: p.course?.course_code || '',
              department_name: p.department?.name || '',
              program_name: p.program?.name || '',
              unit_name: p.unit?.name || '',
              academic_year: p.academic_year,
              semester: p.semester,
              action: pendingApproval.action || 'edit',
              requester_email: pendingApproval.requester_name || '',
              requested_by: pendingApproval.requested_by,
              requested_at: pendingApproval.requested_at || p.updated_at || p.created_at,
              proposed_data: pendingApproval.proposed_plan || {},
              before_data: pendingApproval.existing_plan || {
                title: p.title,
                session_date: p.session_date,
                duration_minutes: p.duration_minutes,
                session_objectives: p.session_objectives,
                teaching_methodology: p.teaching_methodology,
                required_materials: p.required_materials,
                evaluation_criteria: p.evaluation_criteria,
                follow_up_activities: p.follow_up_activities,
              },
            });
          }

          const history = Array.isArray(meta.review_history) ? meta.review_history : [];
          for (const h of history) {
            const entry = {
              id: h.id,
              plan_id: p.id,
              course_name: p.course?.course_name || '',
              course_code: p.course?.course_code || '',
              academic_year: p.academic_year,
              status: h.status,
              action: h.action,
              requester_email: h.requester_name || '',
              reviewed_at: h.reviewed_at,
              review_notes: h.review_notes || '',
              proposed_data: h.proposed_plan || {},
            };
            if (h.status === 'approved') approved.push(entry);
            else if (h.status === 'rejected') rejected.push(entry);
          }
        }

        pending.sort((a, b) => (b.requested_at || '').localeCompare(a.requested_at || ''));
        approved.sort((a, b) => (b.reviewed_at || '').localeCompare(a.reviewed_at || ''));
        rejected.sort((a, b) => (b.reviewed_at || '').localeCompare(a.reviewed_at || ''));

        return apiSuccess({ pending, approved, rejected }, context.request, { startTime });
      }

      case 'review-educator-change': {
        const { requestId, decision, notes } = params;
        if (!requestId || !['approved', 'rejected'].includes(decision)) {
          return apiError(400, 'VALIDATION_ERROR', 'requestId and valid decision (approved/rejected) are required', context.request, { startTime });
        }

        const { data: plans, error: planErr } = await supabase
          .from('college_lesson_plans')
          .select('*')
          .eq('college_id', adminCollegeId);

        if (planErr) return apiDbError(planErr, context.request, { startTime });

        let targetPlan: any = null;
        for (const p of plans || []) {
          if (p.metadata?.pending_approval?.id === requestId) {
            targetPlan = p;
            break;
          }
        }

        if (!targetPlan) {
          return apiError(404, 'NOT_FOUND', 'Approval request is no longer pending', context.request, { startTime });
        }

        const pendingReq = targetPlan.metadata.pending_approval;
        const currentMeta = targetPlan.metadata || {};
        const currentHistory = Array.isArray(currentMeta.review_history) ? currentMeta.review_history : [];

        const historyEntry = {
          id: requestId,
          action: pendingReq.action || 'edit',
          status: decision,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || '',
          requested_by: pendingReq.requested_by,
          requester_name: pendingReq.requester_name,
          proposed_plan: pendingReq.proposed_plan,
          existing_plan: pendingReq.existing_plan,
        };

        const updatedMetadata = {
          ...currentMeta,
          pending_approval: null,
          review_history: [historyEntry, ...currentHistory],
        };

        if (decision === 'approved') {
          const proposed = pendingReq.proposed_plan || {};
          const updatePayload: any = {
            ...proposed,
            metadata: updatedMetadata,
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          };
          delete updatePayload.id;

          const { error: updErr } = await supabase
            .from('college_lesson_plans')
            .update(updatePayload)
            .eq('id', targetPlan.id);

          if (updErr) return apiDbError(updErr, context.request, { startTime });
        } else {
          const { error: updErr } = await supabase
            .from('college_lesson_plans')
            .update({
              metadata: updatedMetadata,
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('id', targetPlan.id);

          if (updErr) return apiDbError(updErr, context.request, { startTime });
        }

        await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('curriculum_change_id', requestId);

        if (pendingReq.requested_by) {
          await supabase.from('notifications').insert({
            recipient_id: pendingReq.requested_by,
            type: decision === 'approved' ? 'curriculum_change_approved' : 'curriculum_change_rejected',
            title: `Session plan ${decision}`,
            message: `Your session plan submission for "${targetPlan.title}" was ${decision}.${notes ? ' Review note: ' + notes : ''}`,
            read: false,
            curriculum_change_id: requestId,
            action_url: `/educator/browse-courses?courseId=${targetPlan.course_id}&programId=${targetPlan.program_id}&reviewChange=${requestId}`,
          });
        }

        return apiSuccess({ success: true, decision }, context.request, { startTime });
      }

      case 'get-lesson-plan': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .eq('id', id)
          .eq('college_id', adminCollegeId)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          ...data,
          course_code: data.course?.course_code,
          course_name: data.course?.course_name,
          department_name: data.department?.name,
          program_name: data.program?.name,
          unit_name: data.unit?.name,
        }, context.request, { startTime });
      }

      case 'create-lesson-plan': {
        const actor = await supabase.from('users').select('organizationId').eq('id', user.id).single();
        if (actor.error) return apiDbError(actor.error, context.request, { startTime });
        const collegeId = actor.data?.organizationId;
        if (!collegeId) return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        const program = await supabase.from('programs').select('id, departments!inner(college_id)')
          .eq('id', params.program_id).eq('department_id', params.department_id)
          .eq('departments.college_id', collegeId).maybeSingle();
        if (program.error) return apiDbError(program.error, context.request, { startTime });
        if (!program.data) return apiError(403, 'FORBIDDEN', 'Select a department and program in your college', context.request, { startTime });
        const mapping = await supabase.from('college_course_mappings').select('id')
          .eq('program_id', params.program_id).eq('semester', params.semester).eq('course_id', params.course_id).limit(1);
        if (mapping.error) return apiDbError(mapping.error, context.request, { startTime });
        if (!mapping.data?.length) return apiError(400, 'VALIDATION_ERROR', 'Course is not mapped to this program and semester', context.request, { startTime });
        const unit = await supabase.from('college_curriculum_units')
          .select('curriculum_id, curriculum:college_curriculums!inner(college_id,course_id,program_id,academic_year)')
          .eq('id', params.unit_id).eq('curriculum.college_id', collegeId)
          .eq('curriculum.course_id', params.course_id).eq('curriculum.program_id', params.program_id)
          .in('curriculum.academic_year', academicYearVariants(params.academic_year)).maybeSingle();
        if (unit.error) return apiDbError(unit.error, context.request, { startTime });
        if (!unit.data) return apiError(400, 'VALIDATION_ERROR', 'Select a curriculum unit for this course and academic year', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .insert([{ ...params, college_id: collegeId, curriculum_id: unit.data.curriculum_id, created_by: user.id }])
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          ...data,
          course_code: data.course?.course_code,
          course_name: data.course?.course_name,
          department_name: data.department?.name,
          program_name: data.program?.name,
          unit_name: data.unit?.name,
        }, context.request, { startTime });
      }

      case 'update-lesson-plan': {
        const { id, college_id: _collegeId, created_by: _createdBy, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lesson_plans')
          .update({ ...updates, college_id: adminCollegeId, updated_by: user.id, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('college_id', adminCollegeId)
          .select(`
            *,
            course:college_courses!college_lesson_plans_course_id_fkey(course_code, course_name),
            department:departments!college_lesson_plans_department_id_fkey(name),
            program:programs!college_lesson_plans_program_id_fkey(name),
            unit:college_curriculum_units!college_lesson_plans_unit_id_fkey(name)
          `)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          ...data,
          course_code: data.course?.course_code,
          course_name: data.course?.course_name,
          department_name: data.department?.name,
          program_name: data.program?.name,
          unit_name: data.unit?.name,
        }, context.request, { startTime });
      }

      case 'delete-lesson-plan': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase
          .from('college_lesson_plans')
          .delete()
          .eq('id', id)
          .eq('college_id', adminCollegeId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-lesson-plan-curriculums': {
        // The lesson-plan form requests units for one course; retain the
        // existing college hierarchy response for callers without a course.
        if (params.course_id) {
          if (!params.program_id || !params.academic_year) return apiError(400, 'VALIDATION_ERROR', 'Program and academic year are required', context.request, { startTime });
          const actor = await supabase.from('users').select('organizationId').eq('id', user.id).single();
          if (actor.error) return apiDbError(actor.error, context.request, { startTime });
          if (!actor.data?.organizationId) return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
          const years = academicYearVariants(params.academic_year);
          if (!years.length) return apiError(400, 'VALIDATION_ERROR', 'Invalid academic year', context.request, { startTime });
          const curriculums = await supabase.from('college_curriculums').select('id,academic_year')
            .eq('college_id', actor.data.organizationId).eq('course_id', params.course_id)
            .eq('program_id', params.program_id).in('academic_year', years).order('created_at', { ascending: false });
          if (curriculums.error) return apiDbError(curriculums.error, context.request, { startTime });
          const curriculum = curriculums.data?.find(item => item.academic_year === params.academic_year) || curriculums.data?.[0];
          if (!curriculum) return apiSuccess({ units: [], curriculumId: null }, context.request, { startTime });
          const units = await supabase.from('college_curriculum_units').select('*').eq('curriculum_id', curriculum.id).order('order_index');
          if (units.error) return apiDbError(units.error, context.request, { startTime });
          return apiSuccess({ units: units.data || [], curriculumId: curriculum.id }, context.request, { startTime });
        }
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data: departments, error: deptError } = await supabase
          .from('departments')
          .select('id, name, code')
          .eq('college_id', college_id)
          .eq('status', 'active')
          .order('name');
        if (deptError) return apiDbError(deptError, context.request, { startTime });

        const result: any[] = [];
        for (const dept of (departments || [])) {
          const { data: programs } = await supabase
            .from('programs')
            .select('id, name, code, specializations')
            .eq('department_id', dept.id)
            .eq('status', 'active')
            .order('name');
          const progList: any[] = [];
          for (const prog of (programs || [])) {
            const { data: mappings } = await supabase
              .from('college_course_mappings')
              .select(`
                id, semester, offering_type,
                course:college_courses(id, course_code, course_name, credits, course_type)
              `)
              .eq('program_id', prog.id);
            const courses = (mappings || []).map((m: any) => ({
              mapping_id: m.id,
              semester: m.semester,
              offering_type: m.offering_type,
              ...m.course,
            })).filter((c: any) => c.id);
            progList.push({ ...prog, courses });
          }
          result.push({ ...dept, programs: progList });
        }
        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-lesson-plan-units': {
        const { curriculum_id } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculum_units')
          .select('*, curriculum:college_curriculums!inner(college_id)')
          .eq('curriculum.college_id', adminCollegeId)
          .eq('curriculum_id', curriculum_id)
          .order('order_index');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-lesson-plan-outcomes': {
        const { unit_id } = params;
        if (!unit_id) return apiError(400, 'VALIDATION_ERROR', 'Missing unit_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_curriculum_outcomes')
          .select('*, curriculum:college_curriculums!inner(college_id)')
          .eq('curriculum.college_id', adminCollegeId)
          .eq('unit_id', unit_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'debug-curriculums': {
        const { course_id, program_id, academic_year, college_id } = params;
        let q = supabase.from('college_curriculums').select(`
          id, course_id, program_id, academic_year, status, college_id,
          course:college_courses(course_code, course_name),
          program:programs(name)
        `);
        if (course_id) q = q.eq('course_id', course_id);
        if (program_id) q = q.eq('program_id', program_id);
        if (academic_year) q = q.eq('academic_year', academic_year);
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[lesson-plans POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
