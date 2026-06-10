import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

async function getUserCollegeId(userId: string, supabase: any): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('organizationId')
    .eq('id', userId)
    .single();
  if (error || !data?.organizationId) return null;
  return data.organizationId;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      // ──────────────────────────────────────────────
      // COURSE MAPPING ACTIONS
      // ──────────────────────────────────────────────

      case 'get-courses': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        let query = supabase
          .from('college_courses')
          .select('*')
          .eq('college_id', collegeId)
          .eq('is_active', true);

        if (params.searchQuery?.trim()) {
          const term = params.searchQuery.trim();
          query = query.or(`course_name.ilike.%${term}%,course_code.ilike.%${term}%`);
        }

        if (params.courseType) {
          query = query.eq('course_type', params.courseType);
        }

        query = query.order('course_code');

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-course': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { course_code, course_name, credits, description, prerequisites, course_type, is_active } = params;
        if (!course_code || !course_name) {
          return apiError(400, 'VALIDATION_ERROR', 'course_code and course_name are required', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_courses')
          .insert([{
            college_id: collegeId,
            course_code,
            course_name,
            credits: credits || 3,
            description: description || '',
            prerequisites: prerequisites || [],
            course_type: course_type || 'theory',
            is_active: is_active !== false,
            created_by: user.id,
            updated_by: user.id,
          }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return apiError(409, 'DUPLICATE', 'Course code already exists in this college', context.request, { startTime });
          }
          return apiDbError(error, context.request, { startTime });
        }

        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-course': {
        const { course_id, ...updates } = params;
        if (!course_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing course_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_courses')
          .update({
            ...updates,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', course_id)
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-course-mappings': {
        const { program_id, semester, type } = params;
        if (!program_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });
        }

        let query = supabase
          .from('college_course_mappings')
          .select(`*, course:college_courses(*)`)
          .eq('program_id', program_id);

        if (semester !== undefined && semester !== null) {
          query = query.eq('semester', semester);
        }

        if (type) {
          query = query.eq('offering_type', type);
        }

        query = query.order('semester', { ascending: true });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const mapped = (data || []).map((m: any) => ({
          ...m,
          course_code: m.course?.course_code,
          course_name: m.course?.course_name,
          credits: m.course?.credits,
          type: m.offering_type,
        }));

        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'get-all-course-mappings': {
        const { limit, offset } = params;
        let query = supabase
          .from('college_course_mappings')
          .select(`*, course:college_courses(*)`)
          .order('semester', { ascending: true });
        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 50) - 1);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const mapped = (data || []).map((m: any) => ({
          ...m,
          course_code: m.course?.course_code,
          course_name: m.course?.course_name,
          credits: m.course?.credits,
          type: m.offering_type,
        }));
        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'map-course': {
        const { course_id, program_id, semester, offering_type, faculty_id, capacity, course_code, course_name, credits, type } = params;
        if (!program_id || semester === undefined || semester === null) {
          return apiError(400, 'VALIDATION_ERROR', 'program_id and semester are required', context.request, { startTime });
        }

        // Check if semester is locked
        const { data: lockCheck, error: lockError } = await supabase
          .from('college_course_mappings')
          .select('is_locked')
          .eq('program_id', program_id)
          .eq('semester', semester)
          .limit(1)
          .maybeSingle();

        if (lockError) return apiDbError(lockError, context.request, { startTime });
        if (lockCheck?.is_locked) {
          return apiError(400, 'INVALID_STATE', 'Semester is locked and cannot be modified', context.request, { startTime });
        }

        const timestamp = new Date().toISOString();

        // Resolve course_id (create if needed via legacy fields)
        let resolvedCourseId = course_id;

        if (!resolvedCourseId && course_code && course_name) {
          const collegeId = await getUserCollegeId(user.id, supabase);
          if (!collegeId) {
            return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
          }

          const { data: existingCourse } = await supabase
            .from('college_courses')
            .select('id')
            .eq('college_id', collegeId)
            .eq('course_code', course_code)
            .maybeSingle();

          if (existingCourse) {
            resolvedCourseId = existingCourse.id;
          } else {
            const { data: newCourse, error: createError } = await supabase
              .from('college_courses')
              .insert([{
                college_id: collegeId,
                course_code,
                course_name,
                credits: credits || 3,
                description: '',
                prerequisites: [],
                course_type: 'theory',
                is_active: true,
                created_by: user.id,
                updated_by: user.id,
              }])
              .select('id')
              .single();

            if (createError) return apiDbError(createError, context.request, { startTime });
            resolvedCourseId = newCourse.id;
          }
        }

        if (!resolvedCourseId) {
          return apiError(400, 'VALIDATION_ERROR', 'course_id is required or course_data must be provided', context.request, { startTime });
        }

        // Map offering_type
        let finalOfferingType = offering_type || type || 'core';
        const typeMap: Record<string, string> = {
          mandatory: 'core',
          department_elective: 'dept_elective',
          elective: 'open_elective',
          core: 'core',
          dept_elective: 'dept_elective',
          open_elective: 'open_elective',
        };
        finalOfferingType = typeMap[finalOfferingType] || 'core';

        // Validate faculty if provided
        if (faculty_id) {
          const { data: facultyCheck } = await supabase
            .from('users')
            .select('id')
            .eq('id', faculty_id)
            .eq('role', 'college_educator')
            .maybeSingle();

          if (!facultyCheck) {
            const { data: lecturerCheck } = await supabase
              .from('college_lecturers')
              .select('id')
              .eq('user_id', faculty_id)
              .eq('accountStatus', 'active')
              .maybeSingle();

            if (!lecturerCheck) {
              return apiError(400, 'VALIDATION_ERROR', 'Invalid faculty ID provided', context.request, { startTime });
            }
          }
        }

        const { data, error } = await supabase
          .from('college_course_mappings')
          .insert([{
            course_id: resolvedCourseId,
            program_id,
            semester,
            offering_type: finalOfferingType,
            faculty_id: faculty_id || null,
            capacity: capacity || null,
            current_enrollment: 0,
            created_by: user.id,
            updated_by: user.id,
            created_at: timestamp,
            updated_at: timestamp,
          }])
          .select(`*, course:college_courses(*)`)
          .single();

        if (error) {
          if (error.code === '23505') {
            return apiError(409, 'DUPLICATE', 'Course already mapped to this program semester', context.request, { startTime });
          }
          return apiDbError(error, context.request, { startTime });
        }

        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-course-mapping': {
        const { mapping_id, ...updates } = params;
        if (!mapping_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing mapping_id', context.request, { startTime });
        }

        // Check if locked
        const { data: existing, error: fetchError } = await supabase
          .from('college_course_mappings')
          .select('is_locked, offering_type')
          .eq('id', mapping_id)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (existing?.is_locked) {
          return apiError(400, 'INVALID_STATE', 'Course mapping is locked and cannot be modified', context.request, { startTime });
        }

        const finalUpdates: Record<string, any> = { ...updates };

        // Handle capacity constraints based on offering_type
        if (finalUpdates.offering_type) {
          if (finalUpdates.offering_type === 'core') {
            finalUpdates.capacity = null;
          } else if ((finalUpdates.offering_type === 'dept_elective' || finalUpdates.offering_type === 'open_elective') && !finalUpdates.capacity) {
            return apiError(400, 'VALIDATION_ERROR', 'Elective courses must have a capacity', context.request, { startTime });
          }
        } else if (existing?.offering_type === 'core' && finalUpdates.capacity !== undefined) {
          finalUpdates.capacity = null;
        }

        finalUpdates.updated_by = user.id;
        finalUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('college_course_mappings')
          .update(finalUpdates)
          .eq('id', mapping_id)
          .select(`*, course:college_courses(*)`)
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-course-mapping': {
        const { mapping_id } = params;
        if (!mapping_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing mapping_id', context.request, { startTime });
        }

        const { data: existing, error: fetchError } = await supabase
          .from('college_course_mappings')
          .select('is_locked')
          .eq('id', mapping_id)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (existing?.is_locked) {
          return apiError(400, 'INVALID_STATE', 'Course mapping is locked and cannot be modified', context.request, { startTime });
        }

        const { error } = await supabase
          .from('college_course_mappings')
          .delete()
          .eq('id', mapping_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-faculty': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { department_id } = params;

        // Try department_faculty_assignments first
        if (department_id) {
          const { data: assignments, error: assignError } = await supabase
            .from('department_faculty_assignments')
            .select(`
              lecturer_id,
              college_lecturers!inner(
                id, first_name, last_name, email, user_id,
                accountStatus, collegeId
              )
            `)
            .eq('department_id', department_id)
            .eq('is_active', true)
            .eq('college_lecturers.collegeId', collegeId)
            .eq('college_lecturers.accountStatus', 'active');

          if (!assignError && assignments && assignments.length > 0) {
            const lecturerUserIds = assignments
              .map((a: any) => a.college_lecturers?.user_id)
              .filter(Boolean);

            const workloadMap = await calculateWorkloadMap(supabase, lecturerUserIds);

            const facultyList = assignments.map((a: any) => {
              const lec = a.college_lecturers;
              const name = `${lec.first_name || ''} ${lec.last_name || ''}`.trim() || lec.email || 'Unknown';
              return {
                id: lec.user_id || lec.id,
                name,
                email: lec.email || '',
                maxWorkload: 18,
                currentWorkload: workloadMap.get(lec.user_id || lec.id) || 0,
              };
            });

            return apiSuccess(facultyList, context.request, { startTime });
          }
        }

        // Fallback: get all college lecturers + college_educator role users
        const { data: collegeLecturers, error: lecError } = await supabase
          .from('college_lecturers')
          .select('id, first_name, last_name, email, user_id, department, accountStatus')
          .eq('collegeId', collegeId)
          .eq('accountStatus', 'active')
          .not('user_id', 'is', null);

        if (lecError) return apiDbError(lecError, context.request, { startTime });

        const { data: educatorUsers } = await supabase
          .from('users')
          .select('id, firstName, lastName, email')
          .eq('role', 'college_educator');

        const facultyMap = new Map<string, any>();

        if (collegeLecturers) {
          for (const lec of collegeLecturers) {
            if (lec.user_id) {
              const name = `${lec.first_name || ''} ${lec.last_name || ''}`.trim() || lec.email || 'Unknown';
              facultyMap.set(lec.user_id, {
                id: lec.user_id,
                name,
                email: lec.email || '',
                maxWorkload: 18,
                currentWorkload: 0,
              });
            }
          }
        }

        if (educatorUsers) {
          for (const u of educatorUsers) {
            if (!facultyMap.has(u.id)) {
              const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown';
              facultyMap.set(u.id, {
                id: u.id,
                name,
                email: u.email || '',
                maxWorkload: 18,
                currentWorkload: 0,
              });
            }
          }
        }

        // Filter by department if specified (department name matching)
        if (department_id && collegeLecturers) {
          const { data: dept } = await supabase
            .from('departments')
            .select('name, code')
            .eq('id', department_id)
            .single();

          if (dept) {
            const deptLecturerIds = new Set(
              collegeLecturers
                .filter((l: any) =>
                  l.department && (
                    l.department.toLowerCase().includes(dept.name.toLowerCase()) ||
                    l.department.toLowerCase().includes(dept.code.toLowerCase()) ||
                    dept.name.toLowerCase().includes(l.department.toLowerCase())
                  )
                )
                .map((l: any) => l.user_id)
                .filter(Boolean)
            );

            for (const fid of facultyMap.keys()) {
              if (!deptLecturerIds.has(fid)) facultyMap.delete(fid);
            }
          }
        }

        // Calculate workload
        const facultyIds = Array.from(facultyMap.keys());
        if (facultyIds.length > 0) {
          const workloadMap = await calculateWorkloadMap(supabase, facultyIds);
          for (const [id, f] of facultyMap.entries()) {
            f.currentWorkload = workloadMap.get(id) || 0;
          }
        }

        const result = Array.from(facultyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        return apiSuccess(result, context.request, { startTime });
      }

      case 'allocate-faculty': {
        const { mapping_id, faculty_id } = params;
        if (!mapping_id || !faculty_id) {
          return apiError(400, 'VALIDATION_ERROR', 'mapping_id and faculty_id are required', context.request, { startTime });
        }

        const { error } = await supabase
          .from('college_course_mappings')
          .update({ faculty_id, updated_at: new Date().toISOString() })
          .eq('id', mapping_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'calculate-workload': {
        const { faculty_id } = params;
        if (!faculty_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing faculty_id', context.request, { startTime });
        }

        const [coursesResult, facultyResult] = await Promise.all([
          supabase
            .from('college_course_mappings')
            .select(`course:college_courses(course_name, credits), programs:program_id(name)`)
            .eq('faculty_id', faculty_id),
          supabase
            .from('users')
            .select('firstName, lastName, email')
            .eq('id', faculty_id)
            .single(),
        ]);

        if (coursesResult.error) return apiDbError(coursesResult.error, context.request, { startTime });
        if (facultyResult.error) return apiDbError(facultyResult.error, context.request, { startTime });

        const courses = coursesResult.data || [];
        const faculty = facultyResult.data;

        const total_credits = courses.reduce((sum: number, m: any) => sum + (m.course?.credits || 0), 0);
        const faculty_name = `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() || faculty.email;

        return apiSuccess({
          faculty_id,
          faculty_name,
          total_credits,
          courses: courses.map((m: any) => ({
            course_name: m.course?.course_name || 'Unknown',
            credits: m.course?.credits || 0,
            program: m.programs?.name || 'Unknown',
          })),
        }, context.request, { startTime });
      }

      case 'lock-semester':
      case 'unlock-semester': {
        const { program_id, semester } = params;
        if (!program_id || semester === undefined || semester === null) {
          return apiError(400, 'VALIDATION_ERROR', 'program_id and semester are required', context.request, { startTime });
        }

        const isLock = action === 'lock-semester';

        const { error } = await supabase
          .from('college_course_mappings')
          .update({ is_locked: isLock, updated_at: new Date().toISOString() })
          .eq('program_id', program_id)
          .eq('semester', semester);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ locked: isLock }, context.request, { startTime });
      }

      case 'clone-semester-structure': {
        const { from_program_id, from_semester, to_program_id, to_semester } = params;
        if (!from_program_id || !to_program_id || from_semester === undefined || to_semester === undefined) {
          return apiError(400, 'VALIDATION_ERROR', 'All parameters (from_program_id, from_semester, to_program_id, to_semester) are required', context.request, { startTime });
        }

        const { data: sourceMappings, error: fetchError } = await supabase
          .from('college_course_mappings')
          .select('*')
          .eq('program_id', from_program_id)
          .eq('semester', from_semester);

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        if (!sourceMappings || sourceMappings.length === 0) {
          return apiError(404, 'NOT_FOUND', 'No courses found in source semester to clone', context.request, { startTime });
        }

        const timestamp = new Date().toISOString();
        const clonedMappings = sourceMappings.map((m: any) => ({
          course_id: m.course_id,
          program_id: to_program_id,
          semester: to_semester,
          offering_type: m.offering_type,
          capacity: m.capacity,
          current_enrollment: 0,
          is_locked: false,
          created_by: user.id,
          updated_by: user.id,
          created_at: timestamp,
          updated_at: timestamp,
        }));

        const { error: insertError } = await supabase
          .from('college_course_mappings')
          .insert(clonedMappings);

        if (insertError) {
          if (insertError.code === '23505') {
            return apiError(409, 'DUPLICATE', 'Some courses already exist in the target semester', context.request, { startTime });
          }
          return apiDbError(insertError, context.request, { startTime });
        }

        return apiSuccess({ cloned: clonedMappings.length }, context.request, { startTime });
      }

      case 'is-semester-locked': {
        const { program_id, semester } = params;
        if (!program_id || semester === undefined || semester === null) {
          return apiError(400, 'VALIDATION_ERROR', 'program_id and semester are required', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_course_mappings')
          .select('is_locked')
          .eq('program_id', program_id)
          .eq('semester', semester)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess({ locked: data?.is_locked || false }, context.request, { startTime });
      }

      case 'get-mapping-departments': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('departments')
          .select('id, name, code, college_id')
          .eq('college_id', collegeId)
          .eq('status', 'active')
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-mapping-programs': {
        let query = supabase
          .from('programs')
          .select('id, name, code, department_id, degree_level')
          .eq('status', 'active')
          .order('name');

        if (params.department_id) {
          query = query.eq('department_id', params.department_id);
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'check-elective-capacity': {
        const { mapping_id } = params;
        if (!mapping_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing mapping_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_course_mappings')
          .select('capacity, current_enrollment')
          .eq('id', mapping_id)
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        const capacity = data.capacity || 0;
        const enrolled = data.current_enrollment || 0;

        return apiSuccess({
          enrolled,
          capacity,
          available: Math.max(0, capacity - enrolled),
        }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // DEPARTMENT ACTIONS
      // ──────────────────────────────────────────────

      case 'get-departments': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('departments')
          .select(`
            *,
            department_faculty_assignments(
              id, is_active, is_hod,
              college_lecturers!inner(
                id, first_name, last_name, email, designation
              )
            ),
            programs!programs_department_id_fkey(
              id, name, code, degree_level, description, status,
              learners!learners_program_id_fkey(
                id, is_deleted, approval_status
              )
            )
          `)
          .eq('college_id', collegeId)
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });

        const result = (data || []).map((dept: any) => {
          const assignments = dept.department_faculty_assignments || [];
          const active = assignments.filter((a: any) => a.is_active);
          const hodAssign = active.find((a: any) => a.is_hod);

          let hodInfo = null;
          if (hodAssign?.college_lecturers) {
            const lec = hodAssign.college_lecturers;
            hodInfo = {
              name: `${lec.first_name || ''} ${lec.last_name || ''}`.trim() || 'Unknown',
              email: lec.email || '',
              designation: lec.designation || 'Head of Department',
            };
          }

          const programs = (dept.programs || [])
            .filter((p: any) => p.status === 'active')
            .map((p: any) => ({
              id: p.id, name: p.name, code: p.code,
              degree_level: p.degree_level, description: p.description, status: p.status,
            }));

          const learnerCount = (dept.programs || [])
            .filter((p: any) => p.status === 'active')
            .reduce((total: number, p: any) => {
              const activeLearners = (p.learners || []).filter(
                (l: any) => !l.is_deleted && l.approval_status !== 'rejected'
              );
              return total + activeLearners.length;
            }, 0);

          return {
            ...dept,
            faculty_count: active.length,
            learner_count: learnerCount,
            program_count: programs.length,
            course_count: 0,
            programs_offered: programs,
            metadata: {
              ...(dept.metadata || {}),
              hod: hodInfo?.name || dept.metadata?.hod || 'Not Assigned',
              email: hodInfo?.email || dept.metadata?.email || '',
              hod_designation: hodInfo?.designation || dept.metadata?.hod_designation || '',
            },
          };
        });

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-department': {
        const { department_id } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('departments')
          .select(`
            *,
            faculty:faculty(count),
            learners:learners(count),
            programs:programs(count),
            curriculum_courses:curriculum_courses(count)
          `)
          .eq('id', department_id)
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiError(404, 'NOT_FOUND', 'Department not found', context.request, { startTime });

        return apiSuccess({
          ...data,
          faculty_count: data.faculty?.[0]?.count || 0,
          learner_count: data.learners?.[0]?.count || 0,
          program_count: data.programs?.[0]?.count || 0,
          course_count: data.curriculum_courses?.[0]?.count || 0,
        }, context.request, { startTime });
      }

      case 'create-department': {
        const { name, code, description, status, school_id, college_id, metadata } = params;
        if (!name || !code) {
          return apiError(400, 'VALIDATION_ERROR', 'name and code are required', context.request, { startTime });
        }

        const insertData: Record<string, any> = {
          name,
          code,
          description: description || null,
          status: status || 'active',
          metadata: metadata || null,
          created_by: user.id,
          updated_by: user.id,
        };

        if (school_id !== undefined && school_id !== null) {
          insertData.school_id = school_id;
          insertData.college_id = null;
        } else if (college_id !== undefined && college_id !== null) {
          insertData.school_id = null;
          insertData.college_id = college_id;
        } else {
          const resolvedCollegeId = await getUserCollegeId(user.id, supabase);
          if (resolvedCollegeId) {
            insertData.school_id = null;
            insertData.college_id = resolvedCollegeId;
          }
        }

        const { data, error } = await supabase
          .from('departments')
          .insert(insertData)
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        // If HOD specified in metadata, assign
        if (data && metadata?.hod_id) {
          await assignHodInternal(supabase, data.id, metadata.hod_id, user.id);
        }

        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-department': {
        const { department_id, ...updates } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('departments')
          .update({
            ...updates,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', department_id)
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        // Handle HOD change if hod_id in metadata
        if (data && updates.metadata?.hod_id) {
          const { data: currentHOD } = await supabase
            .from('department_faculty_assignments')
            .select('lecturer_id')
            .eq('department_id', department_id)
            .eq('is_hod', true)
            .eq('is_active', true)
            .maybeSingle();

          if (!currentHOD || currentHOD.lecturer_id !== updates.metadata.hod_id) {
            await assignHodInternal(supabase, department_id, updates.metadata.hod_id, user.id);
          }
        }

        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-department': {
        const { department_id } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { error } = await supabase
          .from('departments')
          .delete()
          .eq('id', department_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-department-faculty': {
        const { department_id } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('department_faculty_assignments')
          .select(`
            lecturer_id, is_hod,
            college_lecturers!inner(
              id, employeeId, specialization, qualification,
              experienceYears, designation, accountStatus,
              first_name, last_name, email, phone,
              id_proof_url, degree_certificate_url, experience_letters_url,
              users!fk_college_lecturers_user(
                id, firstName, lastName, email, phone
              )
            )
          `)
          .eq('department_id', department_id)
          .eq('is_active', true);

        if (error) return apiDbError(error, context.request, { startTime });

        const result = (data || []).map((item: any) => {
          const lec = item.college_lecturers;
          return {
            id: lec.id,
            name: `${lec.first_name || lec.users?.firstName || ''} ${lec.last_name || lec.users?.lastName || ''}`.trim() || 'Unknown',
            email: lec.email || lec.users?.email || '',
            designation: item.is_hod ? 'Head of Department' : (lec.designation || 'Faculty'),
            specialization: lec.specialization || '',
            employeeId: lec.employeeId,
            qualification: lec.qualification,
            experienceYears: lec.experienceYears,
            phone: lec.phone || lec.users?.phone,
            idProofUrl: lec.id_proof_url,
            degreeCertificateUrl: lec.degree_certificate_url,
            experienceLettersUrl: lec.experience_letters_url || [],
          };
        });

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-college-faculty': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_lecturers')
          .select(`
            id, employeeId, specialization, qualification,
            experienceYears, designation, accountStatus,
            first_name, last_name, email, phone,
            id_proof_url, degree_certificate_url, experience_letters_url,
            users!fk_college_lecturers_user(
              id, firstName, lastName, email, phone
            )
          `)
          .eq('collegeId', collegeId)
          .eq('accountStatus', 'active');

        if (error) return apiDbError(error, context.request, { startTime });

        const result = (data || []).map((lecturer: any) => ({
          id: lecturer.id,
          name: `${lecturer.first_name || lecturer.users?.firstName || ''} ${lecturer.last_name || lecturer.users?.lastName || ''}`.trim() || 'Unknown',
          email: lecturer.email || lecturer.users?.email || '',
          designation: lecturer.designation || 'Faculty',
          specialization: lecturer.specialization || '',
          employeeId: lecturer.employeeId,
          qualification: lecturer.qualification,
          experienceYears: lecturer.experienceYears,
          phone: lecturer.phone || lecturer.users?.phone,
          idProofUrl: lecturer.id_proof_url,
          degreeCertificateUrl: lecturer.degree_certificate_url,
          experienceLettersUrl: lecturer.experience_letters_url || [],
        }));

        return apiSuccess(result, context.request, { startTime });
      }

      case 'assign-hod': {
        const { department_id, lecturer_id } = params;
        if (!department_id || !lecturer_id) {
          return apiError(400, 'VALIDATION_ERROR', 'department_id and lecturer_id are required', context.request, { startTime });
        }

        await assignHodInternal(supabase, department_id, lecturer_id, user.id);
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'assign-faculty': {
        const { department_id, lecturer_ids } = params;
        if (!department_id || !lecturer_ids || !Array.isArray(lecturer_ids)) {
          return apiError(400, 'VALIDATION_ERROR', 'department_id and lecturer_ids array are required', context.request, { startTime });
        }

        // Deactivate existing
        await supabase
          .from('department_faculty_assignments')
          .update({ is_active: false })
          .eq('department_id', department_id);

        if (lecturer_ids.length > 0) {
          const assignments = lecturer_ids.map((lid: string) => ({
            department_id,
            lecturer_id: lid,
            assignment_type: 'faculty',
            assigned_by: user.id,
            is_active: true,
            is_hod: false,
          }));

          const { error } = await supabase
            .from('department_faculty_assignments')
            .upsert(assignments, {
              onConflict: 'department_id,lecturer_id',
              ignoreDuplicates: false,
            });

          if (error) return apiDbError(error, context.request, { startTime });
        }

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-department-learners': {
        const { department_id } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('learners')
          .select(`
            id, roll_number, name, email, contactNumber, semester,
            approval_status, is_deleted,
            program:programs!learners_program_id_fkey(id, name, code, department_id)
          `)
          .eq('program.department_id', department_id)
          .eq('is_deleted', false)
          .neq('approval_status', 'rejected')
          .order('roll_number');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-department-programs': {
        const { department_id } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .eq('department_id', department_id)
          .eq('status', 'active')
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-department-courses': {
        const { department_id } = params;
        if (!department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('curriculum_courses')
          .select('*')
          .eq('department_id', department_id)
          .order('course_name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-department-status': {
        const { ids, status } = params;
        if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
          return apiError(400, 'VALIDATION_ERROR', 'ids array and status are required', context.request, { startTime });
        }

        const { error } = await supabase
          .from('departments')
          .update({ status, updated_by: user.id, updated_at: new Date().toISOString() })
          .in('id', ids);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'search-departments': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }
        if (!params.query) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing query parameter', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('departments')
          .select(`
            *,
            faculty:faculty(count),
            learners:learners(count),
            programs:programs(count),
            curriculum_courses:curriculum_courses(count)
          `)
          .eq('college_id', collegeId)
          .or(`name.ilike.%${params.query}%,code.ilike.%${params.query}%,description.ilike.%${params.query}%`)
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });

        const result = (data || []).map((dept: any) => ({
          ...dept,
          faculty_count: dept.faculty?.[0]?.count || 0,
          learner_count: dept.learners?.[0]?.count || 0,
          program_count: dept.programs?.[0]?.count || 0,
          course_count: dept.curriculum_courses?.[0]?.count || 0,
        }));

        return apiSuccess(result, context.request, { startTime });
      }

      case 'validate-department-code': {
        const { college_id, code, exclude_department_id } = params;
        if (!college_id || !code) {
          return apiError(400, 'VALIDATION_ERROR', 'college_id and code are required', context.request, { startTime });
        }

        let query = supabase
          .from('departments')
          .select('id, code, name')
          .eq('college_id', college_id)
          .ilike('code', code.trim());

        if (exclude_department_id) {
          query = query.neq('id', exclude_department_id);
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        if (data && data.length > 0) {
          return apiSuccess({
            isValid: false,
            message: `Department code "${code.toUpperCase()}" is already used by "${data[0].name}". Please choose a different code.`,
          }, context.request, { startTime });
        }

        return apiSuccess({ isValid: true }, context.request, { startTime });
      }

      case 'add-learners-to-department': {
        const { department_id, learners } = params;
        if (!department_id || !learners || !Array.isArray(learners) || learners.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'department_id and learners array are required', context.request, { startTime });
        }

        const { data: dept, error: deptError } = await supabase
          .from('departments')
          .select('college_id')
          .eq('id', department_id)
          .single();

        if (deptError) return apiDbError(deptError, context.request, { startTime });

        const learnersData = learners.map((l: any) => ({
          roll_number: l.rollNumber,
          first_name: l.firstName,
          last_name: l.lastName,
          email: l.email,
          phone: l.phone || null,
          semester: l.semester || 1,
          program: l.program || null,
          department_id,
          college_id: dept.college_id,
          status: 'active',
          created_by: user.id,
          updated_by: user.id,
        }));

        const { error } = await supabase.from('learners').insert(learnersData);
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ success: true, count: learnersData.length }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // PROGRAM SECTION ACTIONS
      // ──────────────────────────────────────────────

      case 'get-college-departments': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('departments')
          .select('id, name, code')
          .eq('college_id', collegeId)
          .eq('status', 'active')
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-lecturer-program-sections': {
        const { user_id } = params;
        const targetUserId = user_id || user.id;

        const { data, error } = await supabase
          .from('program_sections')
          .select(`
            *,
            program:programs(
              name, code, degree_level,
              department:departments(name, college_id)
            )
          `)
          .eq('faculty_id', targetUserId)
          .eq('status', 'active')
          .order('academic_year', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        // Enrich with college names and faculty info
        const enriched = await Promise.all(
          (data || []).map(async (section: any) => {
            const enrichedSection = { ...section };

            if (section.program?.department?.college_id) {
              const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', section.program.department.college_id)
                .maybeSingle();

              if (orgData) {
                enrichedSection.program.department.college = { name: orgData.name };
              }
            }

            return enrichedSection;
          })
        );

        // Add faculty info
        const { data: facultyData } = await supabase
          .from('college_lecturers')
          .select('first_name, last_name, email')
          .eq('user_id', targetUserId)
          .maybeSingle();

        const withFaculty = enriched.map((section: any) => ({
          ...section,
          faculty: facultyData ? {
            first_name: facultyData.first_name,
            last_name: facultyData.last_name,
            email: facultyData.email,
          } : null,
        }));

        return apiSuccess(withFaculty, context.request, { startTime });
      }

      case 'create-program-section': {
        const { department_id, program_name, program_code, degree_level, semester, section, academic_year, max_learners, status, faculty_id } = params;

        if (!department_id || !program_code || !semester || !section) {
          return apiError(400, 'VALIDATION_ERROR', 'department_id, program_code, semester, and section are required', context.request, { startTime });
        }

        // Find or create program
        let { data: existingProgram } = await supabase
          .from('programs')
          .select('id')
          .eq('department_id', department_id)
          .eq('code', program_code)
          .maybeSingle();

        let programId = existingProgram?.id;

        if (!programId) {
          const { data: newProgram, error: programError } = await supabase
            .from('programs')
            .insert([{
              department_id,
              name: program_name || program_code,
              code: program_code,
              degree_level: degree_level || 'undergraduate',
              status: 'active',
            }])
            .select('id')
            .single();

          if (programError) return apiDbError(programError, context.request, { startTime });
          programId = newProgram.id;
        }

        // Create program section
        const { data, error } = await supabase
          .from('program_sections')
          .insert([{
            department_id,
            program_id: programId,
            semester,
            section,
            academic_year: academic_year || new Date().getFullYear().toString(),
            max_learners: max_learners || 30,
            faculty_id: faculty_id || null,
            status: status || 'active',
          }])
          .select(`
            *,
            program:programs(
              name, code, degree_level,
              department:departments(name, college_id)
            )
          `)
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        // Enrich with college name
        if (data?.program?.department?.college_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', data.program.department.college_id)
            .maybeSingle();

          if (orgData) {
            (data as any).program.department.college = { name: orgData.name };
          }
        }

        return apiSuccess(data, context.request, { startTime });
      }

      case 'unassign-lecturer': {
        const { program_section_id } = params;
        if (!program_section_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing program_section_id', context.request, { startTime });
        }

        const { error } = await supabase
          .from('program_sections')
          .update({ faculty_id: null, updated_at: new Date().toISOString() })
          .eq('id', program_section_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-program-section-learners': {
        const { user_id } = params;
        const targetUserId = user_id || user.id;

        // Get assigned sections
        const { data: sections, error: sectionsError } = await supabase
          .from('program_sections')
          .select('program_id, semester, section')
          .eq('faculty_id', targetUserId)
          .eq('status', 'active');

        if (sectionsError) return apiDbError(sectionsError, context.request, { startTime });
        if (!sections || sections.length === 0) {
          return apiSuccess([], context.request, { startTime });
        }

        // Build OR conditions: (program_id=X AND semester=Y AND section=Z) OR ...
        const orConditions = sections
          .map((s: any) => `and(program_id.eq.${s.program_id},semester.eq.${s.semester},section.eq.${s.section})`)
          .join(',');

        const { data, error } = await supabase
          .from('learners')
          .select(`
            id, user_id, learner_id, name, email, contact_number,
            alternate_number, contact_dial_code, date_of_birth, age, gender,
            bloodGroup, district_name, university, university_main,
            branch_field, college_school_name, course_name,
            registration_number, enrollmentNumber, github_link,
            linkedin_link, twitter_link, facebook_link, instagram_link,
            portfolio_link, youtube_link, other_social_links,
            approval_status, trainer_name, bio, address, city, state,
            country, pincode, resumeUrl, profilePicture, contactNumber,
            created_at, createdAt, updated_at, updatedAt, imported_at,
            school_id, college_id, program_id, semester, section, grade,
            roll_number, admission_number, currentCgpa,
            guardianName, guardianPhone, guardianEmail, guardianRelation,
            enrollmentDate, expectedGraduationDate, learner_type,
            hobbies, languages, interests, category, quota, metadata,
            notification_settings,
            skills!skills_learner_id_fkey(
              id, name, type, level, description, verified, enabled,
              approval_status, created_at, updated_at
            ),
            projects!projects_learner_id_fkey(
              id, title, description, status, start_date, end_date,
              duration, tech_stack, demo_link, github_link,
              approval_status, certificate_url, video_url, ppt_url,
              organization, enabled, created_at, updated_at
            ),
            certificates!certificates_learner_id_fkey(
              id, title, issuer, level, credential_id, link, issued_on,
              description, status, approval_status, document_url,
              enabled, created_at, updated_at
            ),
            experience!experience_learner_id_fkey(
              id, organization, role, start_date, end_date, duration,
              verified, approval_status, created_at, updated_at
            ),
            trainings!trainings_learner_id_fkey(
              id, title, organization, start_date, end_date, duration,
              description, approval_status, created_at, updated_at
            )
          `)
          .eq('is_deleted', false)
          .or(orConditions)
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learners-by-section': {
        const { program_section_id } = params;
        if (!program_section_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing program_section_id', context.request, { startTime });
        }

        const { data: section, error: sectionError } = await supabase
          .from('program_sections')
          .select('program_id, semester, section')
          .eq('id', program_section_id)
          .single();

        if (sectionError || !section) {
          return apiError(404, 'NOT_FOUND', 'Program section not found', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('learners')
          .select(`
            id, name, email, city, program_id, semester, section,
            "enrollmentNumber", contact_number, updated_at
          `)
          .eq('program_id', section.program_id)
          .eq('semester', section.semester)
          .eq('section', section.section)
          .eq('is_deleted', false)
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });

        const learners = (data || []).map((l: any) => ({
          id: l.id,
          name: l.name || 'Unknown',
          email: l.email || '',
          city: l.city || '',
          program_id: l.program_id,
          semester: l.semester || 1,
          enrollment_number: l.enrollmentNumber || '',
          contact_number: l.contact_number || '',
          progress: 0,
          lastActive: l.updated_at || new Date().toISOString(),
        }));

        return apiSuccess(learners, context.request, { startTime });
      }

      case 'get-available-learners': {
        const collegeId = params.college_id || await getUserCollegeId(user.id, supabase);
        if (!collegeId) {
          return apiError(400, 'AFFILIATION_ERROR', 'Unable to determine user college', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('learners')
          .select(`
            id, name, email, city, program_id, semester,
            "enrollmentNumber", contact_number, updated_at
          `)
          .eq('college_id', collegeId)
          .is('program_id', null)
          .eq('is_deleted', false)
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });

        const learners = (data || []).map((l: any) => ({
          id: l.id,
          name: l.name || 'Unknown',
          email: l.email || '',
          city: l.city || '',
          program_id: l.program_id,
          semester: l.semester || 1,
          enrollment_number: l.enrollmentNumber || '',
          contact_number: l.contact_number || '',
          progress: 0,
          lastActive: l.updated_at || new Date().toISOString(),
        }));

        return apiSuccess(learners, context.request, { startTime });
      }

      case 'add-learner-to-program': {
        const { learner_id, program_id, semester, section } = params;
        if (!learner_id || !program_id) {
          return apiError(400, 'VALIDATION_ERROR', 'learner_id and program_id are required', context.request, { startTime });
        }

        const { error } = await supabase
          .from('learners')
          .update({
            program_id,
            semester: semester || 1,
            section: section || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', learner_id);

        if (error) return apiDbError(error, context.request, { startTime });

        // Update learner count in program section
        if (section) {
          await updateProgramSectionLearnerCount(supabase, program_id, semester || 1, section);
        }

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'remove-learner-from-program': {
        const { learner_id } = params;
        if (!learner_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        }

        // Get current program info before removing
        const { data: learner, error: fetchError } = await supabase
          .from('learners')
          .select('program_id, semester, section')
          .eq('id', learner_id)
          .single();

        if (fetchError || !learner) {
          return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });
        }

        const { program_id: oldProgramId, semester: oldSemester, section: oldSection } = learner;

        const { error } = await supabase
          .from('learners')
          .update({ program_id: null, semester: null, section: null, updated_at: new Date().toISOString() })
          .eq('id', learner_id);

        if (error) return apiDbError(error, context.request, { startTime });

        // Update learner count in old section
        if (oldProgramId && oldSemester && oldSection) {
          await updateProgramSectionLearnerCount(supabase, oldProgramId, oldSemester, oldSection);
        }

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-program': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('programs')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-program-section': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('program_sections')
          .select('*, program:programs(name, department)')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-college-learners': {
        const { college_id, department_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        let query = supabase
          .from('learners')
          .select('id, name, email, department_id, college_id, roll_number, course_name, branch_field, contactNumber, semester, section')
          .eq('college_id', college_id)
          .eq('is_deleted', false);
        if (department_id === 'null') {
          query = query.is('department_id', null);
        } else if (department_id) {
          query = query.eq('department_id', department_id);
        }
        const { data, error } = await query.order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'assign-learners-to-department': {
        const { learner_ids, department_id, semester, section, course_name } = params;
        if (!learner_ids || !Array.isArray(learner_ids) || learner_ids.length === 0 || !department_id) {
          return apiError(400, 'VALIDATION_ERROR', 'learner_ids array and department_id are required', context.request, { startTime });
        }
        const updates: Record<string, any> = { department_id, updated_at: new Date().toISOString() };
        if (semester !== undefined) updates.semester = semester;
        if (section !== undefined) updates.section = section;
        if (course_name !== undefined) updates.course_name = course_name;
        const { error } = await supabase
          .from('learners')
          .update(updates)
          .in('id', learner_ids);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'remove-learner-from-department': {
        const { learner_id } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        const { error } = await supabase
          .from('learners')
          .update({ department_id: null, updated_at: new Date().toISOString() })
          .eq('id', learner_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Backward Compatibility Stubs ──
      case 'get-subjects': {
        const { college_id } = params;
        let q = supabase.from('college_courses').select('id, course_code, course_name').order('course_name', { ascending: true });
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-classes': {
        const { college_id } = params;
        let q = supabase.from('college_classes').select('id, name, code, section').order('name', { ascending: true });
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-academic-years': {
        const { college_id } = params;
        let q = supabase.from('academic_years').select('id, name, start_date, end_date, is_current').order('start_date', { ascending: false });
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-current-academic-year': {
        const { college_id } = params;
        let q = supabase.from('academic_years').select('id, name, start_date, end_date, is_current').eq('is_current', true).limit(1);
        if (college_id) q = q.eq('college_id', college_id);
        const { data, error } = await q.maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (data) return apiSuccess(data, context.request, { startTime });
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const name = month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        return apiSuccess({ name }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[academic POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

// ──────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────

async function calculateWorkloadMap(supabase: any, facultyIds: string[]): Promise<Map<string, number>> {
  const workloadMap = new Map<string, number>();
  if (facultyIds.length === 0) return workloadMap;

  const { data } = await supabase
    .from('college_course_mappings')
    .select(`faculty_id, course:college_courses(credits)`)
    .in('faculty_id', facultyIds);

  (data || []).forEach((mapping: any) => {
    const current = workloadMap.get(mapping.faculty_id) || 0;
    workloadMap.set(mapping.faculty_id, current + Number(mapping.course?.credits || 0));
  });

  return workloadMap;
}

async function assignHodInternal(supabase: any, departmentId: string, lecturerId: string, assignedBy: string): Promise<void> {
  // Reset existing HOD
  await supabase
    .from('department_faculty_assignments')
    .update({ is_hod: false })
    .eq('department_id', departmentId)
    .eq('is_hod', true);

  // Check existing assignment
  const { data: existing } = await supabase
    .from('department_faculty_assignments')
    .select('id')
    .eq('department_id', departmentId)
    .eq('lecturer_id', lecturerId)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('department_faculty_assignments')
      .update({ is_hod: true })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('department_faculty_assignments')
      .insert({
        department_id: departmentId,
        lecturer_id: lecturerId,
        assignment_type: 'faculty',
        assigned_by: assignedBy,
        is_active: true,
        is_hod: true,
      });

    if (error) throw error;
  }
}

async function updateProgramSectionLearnerCount(supabase: any, programId: string, semester: number, section: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from('learners')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId)
    .eq('semester', semester)
    .eq('section', section)
    .eq('is_deleted', false);

  if (countError) {
    console.error('[academic] Error counting learners:', countError);
    return;
  }

  const { error: updateError } = await supabase
    .from('program_sections')
    .update({ current_learners: count || 0 })
    .eq('program_id', programId)
    .eq('semester', semester)
    .eq('section', section);

  if (updateError) {
    console.error('[academic] Error updating learner count:', updateError);
  }
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
