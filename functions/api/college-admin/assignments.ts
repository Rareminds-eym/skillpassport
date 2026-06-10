/**
 * College Admin - College Assignments API
 * POST: Action-based dispatch for college assignments, educator data, learner tasks
 */
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
      case 'create-assignment': {
        const { data: educator } = await supabase.from('college_lecturers').select('first_name, last_name').eq('user_id', params.educator_user_id).single();
        const educatorName = educator ? `${educator.first_name || ''} ${educator.last_name || ''}`.trim() : 'Unknown Educator';
        const insertData = { ...params, college_educator_id: params.educator_user_id, educator_name: educatorName, available_from: params.available_from || new Date().toISOString(), instruction_files: [] };
        const { data, error } = await supabase.from('college_assignments').insert([insertData]).select('*, programs!college_assignments_program_id_fkey(name), departments!college_assignments_department_id_fkey(name)').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ ...data, program_name: data.programs?.name, department_name: data.departments?.name, status: 'active' }, context.request, { startTime });
      }

      case 'get-educator-departments': {
        const { educator_user_id } = params;
        const { data: lecturer, error: lecError } = await supabase.from('college_lecturers').select('id').eq('user_id', educator_user_id).single();
        if (lecError) return apiDbError(lecError, context.request, { startTime });
        if (!lecturer) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase.from('department_faculty_assignments').select('department_id, departments!inner(id, name, code, college_id, status)').eq('lecturer_id', lecturer.id).eq('is_active', true).eq('departments.status', 'active').order('departments(name)');
        if (error) return apiDbError(error, context.request, { startTime });
        const departments = (data || []).map((a: any) => {
          const d = Array.isArray(a.departments) ? a.departments[0] : a.departments;
          return { id: d.id, name: d.name, code: d.code, college_id: d.college_id };
        });
        return apiSuccess(departments, context.request, { startTime });
      }

      case 'get-educator-programs': {
        const { educator_user_id, department_id } = params;
        let query = supabase.from('program_sections').select('program_id, programs!inner(id, name, code, department_id, status)').eq('faculty_id', educator_user_id).eq('status', 'active').eq('programs.status', 'active');
        if (department_id) query = query.eq('programs.department_id', department_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const map = new Map();
        (data || []).forEach((s: any) => {
          const p = Array.isArray(s.programs) ? s.programs[0] : s.programs;
          if (!map.has(p.id)) map.set(p.id, { id: p.id, name: p.name, code: p.code, department_id: p.department_id });
        });
        return apiSuccess(Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name)), context.request, { startTime });
      }

      case 'get-educator-sections': {
        const { educator_user_id } = params;
        const { data, error } = await supabase.from('program_sections').select('id, department_id, program_id, semester, section, academic_year, max_learners, current_learners, faculty_id, status, programs!inner(id, name, code), departments!inner(id, name, code)').eq('faculty_id', educator_user_id).eq('status', 'active').order('semester').order('section');
        if (error) return apiDbError(error, context.request, { startTime });
        const sections = (data || []).map((s: any) => ({
          id: s.id, department_id: s.department_id, program_id: s.program_id, semester: s.semester, section: s.section, academic_year: s.academic_year, max_learners: s.max_learners, current_learners: s.current_learners, faculty_id: s.faculty_id, status: s.status,
          program: { id: s.programs?.id, name: s.programs?.name, code: s.programs?.code, department_id: s.programs?.department_id || s.department_id, college_id: s.programs?.college_id || '' },
          department: { id: s.departments?.id, name: s.departments?.name, code: s.departments?.code, college_id: s.departments?.college_id || '' },
        }));
        return apiSuccess(sections, context.request, { startTime });
      }

      case 'get-educator-courses': {
        const { educator_user_id, program_id } = params;
        const { data, error } = await supabase.from('college_course_mappings').select('course_id, semester, college_courses!inner(id, course_name, course_code, college_id)').eq('faculty_id', educator_user_id).eq('program_id', program_id);
        if (error) return apiDbError(error, context.request, { startTime });
        const map = new Map();
        (data || []).forEach((m: any) => {
          const c = Array.isArray(m.college_courses) ? m.college_courses[0] : m.college_courses;
          if (!map.has(c.id)) map.set(c.id, { id: c.id, course_name: c.course_name, course_code: c.course_code, college_id: c.college_id });
        });
        return apiSuccess(Array.from(map.values()).sort((a: any, b: any) => a.course_name.localeCompare(b.course_name)), context.request, { startTime });
      }

      case 'get-section-learners': {
        const { section_id } = params;
        const { data: section, error: sError } = await supabase.from('program_sections').select('program_id, semester, section').eq('id', section_id).single();
        if (sError) return apiDbError(sError, context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id, user_id, name, email, program_id, section, semester, roll_number').eq('program_id', section.program_id).eq('section', section.section).eq('semester', section.semester).eq('is_deleted', false).order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-educator-assignments': {
        const { educator_user_id } = params;
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_college_educator_assignments', { educator_user_id });
        if (!rpcError) return apiSuccess(rpcData || [], context.request, { startTime });
        if (rpcError?.code !== '42883') return apiDbError(rpcError, context.request, { startTime });
        const { data, error } = await supabase.from('college_assignments').select('assignment_id, title, description, instructions, course_name, course_code, due_date, total_points, assignment_type, skill_outcomes, created_date, program_section_id, instruction_files, college_id, educator_name, college_educator_id, department_id, program_id, available_from, allow_late_submission, document_pdf, program_sections!college_assignments_program_section_id_fkey(semester, section, academic_year), programs!college_assignments_program_id_fkey(name), departments!college_assignments_program_id_fkey(name)').eq('college_educator_id', educator_user_id).eq('is_deleted', false).order('created_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const assignments = (data || []).map((row: any) => ({
          ...row,
          program_name: row.programs?.name || '',
          department_name: row.departments?.name || '',
          semester: row.program_sections?.semester,
          section: row.program_sections?.section,
          academic_year: row.program_sections?.academic_year,
          status: row.due_date && new Date(row.due_date) < new Date() ? 'completed' : 'active',
          learner_count: 0,
        }));
        return apiSuccess(assignments, context.request, { startTime });
      }

      case 'assign-task-to-learners': {
        const { assignment_id, learner_user_ids } = params;
        const learnerAssignments = (learner_user_ids || []).map((lid: string) => ({ assignment_id, learner_id: lid, status: 'todo', priority: 'medium' }));
        const { error } = await supabase.from('college_learner_assignments').insert(learnerAssignments);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(true, context.request, { startTime });
      }

      case 'get-assignment-stats': {
        const { educator_user_id } = params;
        const { data: assignments } = await supabase.from('college_assignments').select('assignment_id, due_date').eq('college_educator_id', educator_user_id).eq('is_deleted', false);
        const totalAssignments = assignments?.length || 0;
        const activeAssignments = assignments?.filter((a: any) => new Date(a.due_date) > new Date()).length || 0;
        const assignmentIds = assignments?.map((a: any) => a.assignment_id) || [];
        let totalSubmissions = 0, pendingReviews = 0, averageScore = 0;
        if (assignmentIds.length > 0) {
          const { data: submissions } = await supabase.from('college_learner_assignments').select('status, grade_percentage').in('assignment_id', assignmentIds).eq('is_deleted', false);
          if (submissions) {
            totalSubmissions = submissions.filter((s: any) => s.status === 'submitted' || s.status === 'graded').length;
            pendingReviews = submissions.filter((s: any) => s.status === 'submitted').length;
            const graded = submissions.filter((s: any) => s.grade_percentage !== null);
            averageScore = graded.length > 0 ? graded.reduce((sum: number, s: any) => sum + (s.grade_percentage || 0), 0) / graded.length : 0;
          }
        }
        return apiSuccess({ totalAssignments, activeAssignments, totalSubmissions, pendingReviews, averageScore: Math.round(averageScore * 10) / 10 }, context.request, { startTime });
      }

      case 'delete-assignment': {
        const { assignment_id } = params;
        const { error } = await supabase.from('college_assignments').update({ is_deleted: true }).eq('assignment_id', assignment_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(true, context.request, { startTime });
      }

      case 'update-assignment': {
        const { assignment_id, ...updates } = params;
        const { data, error } = await supabase.from('college_assignments').update(updates).eq('assignment_id', assignment_id).select('*, programs!college_assignments_program_id_fkey(name), departments!college_assignments_department_id_fkey(name)').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ ...data, program_name: data.programs?.name, department_name: data.departments?.name, status: data.due_date < new Date().toISOString() ? 'completed' : 'active' }, context.request, { startTime });
      }

      case 'ensure-user-accounts': {
        const { learners } = params;
        if (!learners?.length) return apiSuccess([], context.request, { startTime });
        const emails = learners.map((l: any) => l.email);
        const { data: existingUsers } = await supabase.from('users').select('id, email').in('email', emails);
        if (!existingUsers?.length) return apiSuccess([], context.request, { startTime });
        const emailToUserId = new Map(existingUsers.map((u: any) => [u.email, u.id]));
        const learnersToUpdate = learners.filter((l: any) => !l.user_id && emailToUserId.has(l.email));
        if (learnersToUpdate.length > 0) {
          const updates = learnersToUpdate.map((l: any) => ({ id: l.id, user_id: emailToUserId.get(l.email) }));
          await supabase.from('learners').upsert(updates, { onConflict: 'id' });
        }
        const result = learners.map((l: any) => l.user_id || emailToUserId.get(l.email)).filter((id: any) => !!id);
        return apiSuccess(result, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[assignments POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
