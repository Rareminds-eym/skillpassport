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
        const { data: educator } = await supabase.from('college_lecturers').select('first_name, last_name').eq('user_id', params.educator_user_id).maybeSingle();
        let educatorName = educator ? `${educator.first_name || ''} ${educator.last_name || ''}`.trim() : '';
        let isExternalEducator = false;
        
        if (!educatorName) {
          const { data: staff } = await supabase.from('organization_staff').select('first_name, last_name').eq('user_id', params.educator_user_id).maybeSingle();
          if (staff) {
            educatorName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
            isExternalEducator = true;
          }
        }
        if (!educatorName) educatorName = 'Unknown Educator';
        
        // Remove educator_user_id from params before inserting (not a valid column in college_assignments)
        const { educator_user_id, ...paramsWithoutEducatorUserId } = params;
        
        // Store educator ID in appropriate column based on type:
        // - Internal faculty (college_lecturers): college_educator_id
        // - External educators (organization_staff): external_educator_id
        const insertData = { 
          ...paramsWithoutEducatorUserId, 
          college_educator_id: isExternalEducator ? null : educator_user_id,
          external_educator_id: isExternalEducator ? educator_user_id : null,
          educator_name: educatorName, 
          available_from: params.available_from || new Date().toISOString(), 
          instruction_files: params.instruction_files || [] 
        };
        
        const { data, error } = await supabase.from('college_assignments').insert([insertData]).select('*, programs!college_assignments_program_id_fkey(name), departments!college_assignments_department_id_fkey(name)').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ ...data, program_name: data.programs?.name, department_name: data.departments?.name, status: 'active' }, context.request, { startTime });
      }

      case 'get-educator-departments': {
        const { educator_user_id, department_ids } = params;
        if (Array.isArray(department_ids) && department_ids.length > 0) {
          const { data, error } = await supabase.from('departments').select('id, name, code, college_id').in('id', department_ids);
          if (!error && data && data.length > 0) return apiSuccess(data, context.request, { startTime });
        }
        const { data: lecturer } = await supabase.from('college_lecturers').select('id').eq('user_id', educator_user_id).maybeSingle();
        if (lecturer) {
          const { data, error } = await supabase.from('department_faculty_assignments').select('department_id, departments!inner(id, name, code, college_id, status)').eq('lecturer_id', lecturer.id).eq('is_active', true).eq('departments.status', 'active').order('departments(name)');
          if (error) return apiDbError(error, context.request, { startTime });
          const departments = (data || []).map((a: any) => {
            const d = Array.isArray(a.departments) ? a.departments[0] : a.departments;
            return { id: d.id, name: d.name, code: d.code, college_id: d.college_id };
          });
          return apiSuccess(departments, context.request, { startTime });
        }
        // Fallback for external educator (organization_staff)
        const { data: staff } = await supabase.from('organization_staff').select('id').eq('user_id', educator_user_id).maybeSingle();
        if (staff) {
          const { data, error } = await supabase.from('organization_staff_assignments').select('department_id, departments!inner(id, name, code, college_id, status)').eq('staff_id', staff.id).eq('is_active', true);
          if (error) return apiDbError(error, context.request, { startTime });
          const map = new Map();
          (data || []).forEach((a: any) => {
            const d = Array.isArray(a.departments) ? a.departments[0] : a.departments;
            if (d && !map.has(d.id)) map.set(d.id, { id: d.id, name: d.name, code: d.code, college_id: d.college_id });
          });
          return apiSuccess(Array.from(map.values()), context.request, { startTime });
        }
        return apiSuccess([], context.request, { startTime });
      }

      case 'get-educator-programs': {
        const { educator_user_id, department_id, program_ids } = params;
        if (Array.isArray(program_ids) && program_ids.length > 0) {
          let query = supabase.from('programs').select('id, name, code, department_id, status, specializations').in('id', program_ids);
          if (department_id) query = query.eq('department_id', department_id);
          const { data, error } = await query;
          if (!error && data && data.length > 0) return apiSuccess(data, context.request, { startTime });
        }
        let query = supabase.from('program_sections').select('program_id, programs!inner(id, name, code, department_id, status, specializations)').eq('faculty_id', educator_user_id).eq('status', 'active').eq('programs.status', 'active');
        if (department_id) query = query.eq('programs.department_id', department_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const map = new Map();
        (data || []).forEach((s: any) => {
          const p = Array.isArray(s.programs) ? s.programs[0] : s.programs;
          if (!map.has(p.id)) map.set(p.id, { id: p.id, name: p.name, code: p.code, department_id: p.department_id, specializations: p.specializations || [] });
        });
        if (map.size > 0) {
          return apiSuccess(Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name)), context.request, { startTime });
        }
        // Fallback for external educator (organization_staff)
        const { data: staff } = await supabase.from('organization_staff').select('id').eq('user_id', educator_user_id).maybeSingle();
        if (staff) {
          let staffQuery = supabase.from('organization_staff_assignments').select('program_id, metadata, programs!inner(id, name, code, department_id, status, specializations)').eq('staff_id', staff.id).eq('is_active', true);
          if (department_id) staffQuery = staffQuery.eq('department_id', department_id);
          const { data: staffData } = await staffQuery;
          (staffData || []).forEach((a: any) => {
            const p = Array.isArray(a.programs) ? a.programs[0] : a.programs;
            if (p && !map.has(p.id)) {
              const assignedSpecs = a.metadata?.specializations || [];
              const specs = assignedSpecs.length > 0 ? assignedSpecs : (p.specializations || []);
              map.set(p.id, { id: p.id, name: p.name, code: p.code, department_id: p.department_id, specializations: specs });
            }
          });
          return apiSuccess(Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name)), context.request, { startTime });
        }
        return apiSuccess([], context.request, { startTime });
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
        console.log('[college-admin/assignments] get-educator-courses called', {
          educator_user_id,
          program_id,
          action: 'get-educator-courses'
        });

        // Fetch college-mapped courses
        const { data: collegeCourses, error: collegeError } = await supabase
          .from('college_course_mappings')
          .select('course_id, semester, college_courses!inner(id, course_name, course_code, college_id)')
          .eq('faculty_id', educator_user_id)
          .eq('program_id', program_id);

        console.log('[college-admin/assignments] college courses query result', {
          success: !collegeError,
          rowCount: collegeCourses?.length || 0,
          error: collegeError?.message
        });

        if (collegeError) {
          console.error('[college-admin/assignments] college courses database error', collegeError);
          return apiDbError(collegeError, context.request, { startTime });
        }

        // Fetch courses from college_attendance_sessions assigned to this educator
        // 1. Resolve faculty IDs: educator_user_id and college_lecturers.id (since college_attendance_sessions.faculty_id maps to college_lecturers.id)
        const { data: lecturer } = await supabase
          .from('college_lecturers')
          .select('id')
          .eq('user_id', educator_user_id)
          .maybeSingle();

        const facultyIds = [educator_user_id];
        if (lecturer?.id && lecturer.id !== educator_user_id) {
          facultyIds.push(lecturer.id);
        }

        // 2. Resolve program name if program_id is present
        let programName: string | null = null;
        if (program_id) {
          const { data: prog } = await supabase
            .from('programs')
            .select('name')
            .eq('id', program_id)
            .maybeSingle();
          if (prog?.name) {
            programName = prog.name;
          }
        }

        // 3. Query college_attendance_sessions
        const { data: attendanceSessions, error: attendanceError } = await supabase
          .from('college_attendance_sessions')
          .select('id, subject_name, subject_code, program_id, program_name, college_id, semester, section')
          .in('faculty_id', facultyIds);

        console.log('[college-admin/assignments] attendance sessions query result', {
          success: !attendanceError,
          rowCount: attendanceSessions?.length || 0,
          error: attendanceError?.message
        });

        if (attendanceError) {
          console.warn('[college-admin/assignments] attendance sessions query error (continuing with college courses only)', attendanceError);
        }

        // Merge both course sources into a single map (deduplicate by ID or code/name)
        const coursesMap = new Map();

        // Add college courses first (from college_course_mappings)
        (collegeCourses || []).forEach((m: any) => {
          const c = Array.isArray(m.college_courses) ? m.college_courses[0] : m.college_courses;
          if (c && !coursesMap.has(c.id)) {
            coursesMap.set(c.id, { 
              id: c.id, 
              course_name: c.course_name, 
              course_code: c.course_code, 
              college_id: c.college_id,
              semester: m.semester || null
            });
          }
        });

        // Add courses from college_attendance_sessions
        const filteredSessions = (attendanceSessions || []).filter((s: any) => {
          if (!program_id) return true;
          if (s.program_id && s.program_id === program_id) return true;
          if (programName && s.program_name && s.program_name.trim().toLowerCase() === programName.trim().toLowerCase()) return true;
          return !s.program_id && !s.program_name;
        });

        filteredSessions.forEach((session: any) => {
          const cName = session.subject_name?.trim();
          if (!cName) return;

          let cCode = session.subject_code?.trim() || '';
          if (!cCode && cName.includes(' - ')) {
            cCode = cName.split(' - ')[0].trim();
          }

          // Check if already in coursesMap by course_name or course_code
          const alreadyExists = Array.from(coursesMap.values()).some((existing: any) => {
            const sameName = existing.course_name?.trim().toLowerCase() === cName.toLowerCase();
            const sameCode = cCode && existing.course_code && existing.course_code?.trim().toLowerCase() === cCode.toLowerCase();
            return sameName || sameCode;
          });

          if (!alreadyExists) {
            const courseId = session.id || `session-${cCode || cName}`;
            coursesMap.set(courseId, {
              id: courseId,
              course_name: cName,
              course_code: cCode,
              college_id: session.college_id || null,
              semester: session.semester || null,
              section: session.section || null
            });
          }
        });

        const courses = Array.from(coursesMap.values()).sort((a: any, b: any) => a.course_name.localeCompare(b.course_name));
        console.log('[college-admin/assignments] get-educator-courses final result', {
          collegeCourseCount: collegeCourses?.length || 0,
          attendanceSessionCount: filteredSessions.length,
          uniqueCourseCount: courses.length,
          courses
        });

        return apiSuccess(courses, context.request, { startTime });
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
        // Query for assignments created by this educator (internal or external)
        // Check both college_educator_id (internal faculty) and external_educator_id (org staff)
        const { data, error } = await supabase
          .from('college_assignments')
          .select('assignment_id, title, description, instructions, course_name, course_code, due_date, total_points, assignment_type, skill_outcomes, created_date, program_section_id, instruction_files, college_id, educator_name, college_educator_id, external_educator_id, department_id, program_id, available_from, allow_late_submission, document_pdf, program_sections!college_assignments_program_section_id_fkey(semester, section, academic_year), programs!college_assignments_program_id_fkey(name), departments!college_assignments_department_id_fkey(name)')
          .or(`college_educator_id.eq.${educator_user_id},external_educator_id.eq.${educator_user_id}`)
          .eq('is_deleted', false)
          .order('created_date', { ascending: false });
        
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

      case 'get-college-all-assignments': {
        const { college_id, educator_type, department_id, program_id, program_section_id } = params;
        if (!college_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        }

        let query = supabase
          .from('college_assignments')
          .select('assignment_id, title, description, instructions, course_name, course_code, due_date, total_points, assignment_type, skill_outcomes, created_date, program_section_id, instruction_files, college_id, educator_name, college_educator_id, external_educator_id, department_id, program_id, available_from, allow_late_submission, document_pdf, program_sections!college_assignments_program_section_id_fkey(semester, section, academic_year), programs!college_assignments_program_id_fkey(name, code), departments!college_assignments_department_id_fkey(name, code)')
          .eq('college_id', college_id)
          .eq('is_deleted', false);

        if (department_id) {
          query = query.eq('department_id', department_id);
        }
        if (program_id) {
          query = query.eq('program_id', program_id);
        }
        if (program_section_id) {
          query = query.eq('program_section_id', program_section_id);
        }
        if (educator_type === 'internal') {
          query = query.not('college_educator_id', 'is', null);
        } else if (educator_type === 'external') {
          query = query.not('external_educator_id', 'is', null);
        }

        const { data: assignments, error } = await query.order('created_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        const assignmentIds = (assignments || []).map((a: any) => a.assignment_id);

        const externalUserIds = Array.from(new Set((assignments || []).map((a: any) => a.external_educator_id).filter(Boolean)));
        const internalUserIds = Array.from(new Set((assignments || []).map((a: any) => a.college_educator_id).filter(Boolean)));

        let externalStaffMap = new Map<string, any>();
        if (externalUserIds.length > 0) {
          const { data: staffList } = await supabase
            .from('organization_staff')
            .select('user_id, first_name, last_name, email, employee_id')
            .in('user_id', externalUserIds);
          (staffList || []).forEach((s: any) => {
            if (s.user_id) externalStaffMap.set(s.user_id, s);
          });
        }

        let internalLecturerMap = new Map<string, any>();
        if (internalUserIds.length > 0) {
          const { data: lecturers } = await supabase
            .from('college_lecturers')
            .select('id, user_id, first_name, last_name, email, employee_id')
            .or(`user_id.in.(${internalUserIds.join(',')}),id.in.(${internalUserIds.join(',')})`);
          (lecturers || []).forEach((l: any) => {
            if (l.user_id) internalLecturerMap.set(l.user_id, l);
            if (l.id) internalLecturerMap.set(l.id, l);
          });
        }

        let statsByAssignment = new Map<string, { totalAssigned: number; submittedCount: number; gradedCount: number; pendingCount: number }>();
        let submissionsByAssignment = new Map<string, any[]>();
        let learnersMap = new Map<string, any>();

        if (assignmentIds.length > 0) {
          const { data: subRows } = await supabase
            .from('college_learner_assignments')
            .select(`
              learner_assignment_id,
              assignment_id,
              learner_id,
              status,
              priority,
              grade_received,
              grade_percentage,
              instructor_feedback,
              feedback_date,
              graded_date,
              submission_date,
              submission_files,
              submission_url,
              submission_content,
              is_late
            `)
            .in('assignment_id', assignmentIds)
            .eq('is_deleted', false);

          const learnerIds = Array.from(new Set((subRows || []).map((s: any) => s.learner_id).filter(Boolean)));
          if (learnerIds.length > 0) {
            const { data: learnerRows } = await supabase
              .from('learners')
              .select('id, user_id, name, email, roll_number')
              .or(`id.in.(${learnerIds.join(',')}),user_id.in.(${learnerIds.join(',')})`);

            (learnerRows || []).forEach((l: any) => {
              if (l.id) learnersMap.set(l.id, l);
              if (l.user_id) learnersMap.set(l.user_id, l);
            });
          }

          (subRows || []).forEach((sub: any) => {
            if (!statsByAssignment.has(sub.assignment_id)) {
              statsByAssignment.set(sub.assignment_id, {
                totalAssigned: 0,
                submittedCount: 0,
                gradedCount: 0,
                pendingCount: 0,
              });
            }
            if (!submissionsByAssignment.has(sub.assignment_id)) {
              submissionsByAssignment.set(sub.assignment_id, []);
            }

            const st = statsByAssignment.get(sub.assignment_id)!;
            st.totalAssigned += 1;
            if (sub.status === 'submitted' || sub.status === 'graded') {
              st.submittedCount += 1;
            }
            if (sub.status === 'graded' || (sub.grade_percentage !== null && sub.grade_percentage !== undefined)) {
              st.gradedCount += 1;
            }
            if (sub.status === 'submitted') {
              st.pendingCount += 1;
            }

            const learnerInfo = learnersMap.get(sub.learner_id) || {};
            submissionsByAssignment.get(sub.assignment_id)!.push({
              id: sub.learner_assignment_id,
              learner_id: sub.learner_id,
              learner_name: learnerInfo.name || 'Unknown Learner',
              learner_email: learnerInfo.email || '',
              roll_number: learnerInfo.roll_number || '',
              status: sub.status,
              grade_received: sub.grade_received,
              grade_percentage: sub.grade_percentage,
              instructor_feedback: sub.instructor_feedback,
              feedback_date: sub.feedback_date,
              graded_date: sub.graded_date,
              submission_date: sub.submission_date,
              submission_files: sub.submission_files || [],
              submission_url: sub.submission_url,
              submission_content: sub.submission_content,
              is_late: sub.is_late ?? false,
            });
          });
        }

        const now = new Date();
        let totalAssignedSum = 0;
        let totalSubmissionsSum = 0;
        let totalGradedSum = 0;
        let totalPendingSum = 0;
        let internalCount = 0;
        let externalCount = 0;

        const resultAssignments = (assignments || []).map((row: any) => {
          const isExternal = Boolean(row.external_educator_id);
          const staffInfo = isExternal ? externalStaffMap.get(row.external_educator_id) : null;
          const lecturerInfo = !isExternal && row.college_educator_id ? internalLecturerMap.get(row.college_educator_id) : null;

          let resolvedEducatorName = row.educator_name || 'Unknown Educator';
          let educatorEmail = '';

          if (isExternal) {
            externalCount++;
            if (staffInfo) {
              resolvedEducatorName = `${staffInfo.first_name || ''} ${staffInfo.last_name || ''}`.trim() || resolvedEducatorName;
              educatorEmail = staffInfo.email || '';
            }
          } else {
            internalCount++;
            if (lecturerInfo) {
              resolvedEducatorName = `${lecturerInfo.first_name || ''} ${lecturerInfo.last_name || ''}`.trim() || resolvedEducatorName;
              educatorEmail = lecturerInfo.email || '';
            }
          }

          const st = statsByAssignment.get(row.assignment_id) || {
            totalAssigned: 0,
            submittedCount: 0,
            gradedCount: 0,
            pendingCount: 0,
          };

          totalAssignedSum += st.totalAssigned;
          totalSubmissionsSum += st.submittedCount;
          totalGradedSum += st.gradedCount;
          totalPendingSum += st.pendingCount;

          const isPastDue = row.due_date && new Date(row.due_date) < now;

          return {
            assignment_id: row.assignment_id,
            title: row.title,
            description: row.description,
            instructions: row.instructions,
            course_name: row.course_name,
            course_code: row.course_code,
            due_date: row.due_date,
            total_points: row.total_points,
            assignment_type: row.assignment_type || 'task',
            skill_outcomes: row.skill_outcomes || [],
            created_date: row.created_date,
            college_id: row.college_id,
            department_id: row.department_id,
            department_name: row.departments?.name || '',
            department_code: row.departments?.code || '',
            program_id: row.program_id,
            program_name: row.programs?.name || '',
            program_code: row.programs?.code || '',
            program_section_id: row.program_section_id,
            semester: row.program_sections?.semester || null,
            section: row.program_sections?.section || '',
            academic_year: row.program_sections?.academic_year || '',
            educator_type: isExternal ? 'external' : 'internal',
            educator_role_label: isExternal ? 'RareMinds Trainer' : 'Internal Faculty',
            educator_name: resolvedEducatorName,
            educator_email: educatorEmail,
            educator_user_id: row.external_educator_id || row.college_educator_id,
            status: isPastDue ? 'completed' : 'active',
            instruction_files: row.instruction_files || [],
            stats: st,
            learners: submissionsByAssignment.get(row.assignment_id) || [],
          };
        });

        return apiSuccess({
          assignments: resultAssignments,
          metrics: {
            totalAssignments: resultAssignments.length,
            totalAssigned: totalAssignedSum,
            internalAssignmentsCount: internalCount,
            externalAssignmentsCount: externalCount,
            totalSubmissions: totalSubmissionsSum,
            totalGraded: totalGradedSum,
            pendingReviews: totalPendingSum,
          }
        }, context.request, { startTime });
      }

      case 'assign-task-to-learners': {
        const { assignment_id, learner_user_ids } = params;
        const learnerAssignments = (learner_user_ids || []).map((lid: string) => ({ assignment_id, learner_id: lid, status: 'todo', priority: 'medium' }));
        const { error } = await supabase.from('college_learner_assignments').upsert(learnerAssignments, { onConflict: 'assignment_id,learner_id', ignoreDuplicates: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(true, context.request, { startTime });
      }

      case 'get-assigned-learners': {
        const assignmentId = params.assignment_id || params.assignmentId;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignment_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_learner_assignments')
          .select('learner_id')
          .eq('assignment_id', assignmentId)
          .eq('is_deleted', false);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess((data || []).map((a: any) => a.learner_id), context.request, { startTime });
      }

      case 'get-assignment-stats': {
        const { educator_user_id } = params;
        // Get stats for assignments from both internal and external educators
        const { data: assignments } = await supabase
          .from('college_assignments')
          .select('assignment_id, due_date')
          .or(`college_educator_id.eq.${educator_user_id},external_educator_id.eq.${educator_user_id}`)
          .eq('is_deleted', false);
        
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
