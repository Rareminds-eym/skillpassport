import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json(); } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action field', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-college-lecturer-by-email': {
        const { email, select: selectField } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const q = selectField ? supabase.from('college_lecturers').select(selectField) : supabase.from('college_lecturers').select('*');
        const { data, error } = await q.eq('email', email).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-org-by-admin-or-email': {
        const { userId, email, select: selectField } = params;
        if (!userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });
        let q = selectField ? supabase.from('organizations').select(selectField) : supabase.from('organizations').select('id');
        q = q.eq('organization_type', 'college');
        if (userId && email) {
          q = q.or(`admin_id.eq.${userId},email.ilike.${email}`);
        } else if (userId) {
          q = q.eq('admin_id', userId);
        } else if (email) {
          q = q.eq('email', email);
        }
        const { data, error } = await q.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-college-lecturer-by-user-id': {
        const { userId, select: selectField } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const q = selectField ? supabase.from('college_lecturers').select(selectField) : supabase.from('college_lecturers').select('*');
        const { data, error } = await q.eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-org-by-filters': {
        const { select: selectField, filters, limit: queryLimit } = params;
        let q = selectField ? supabase.from('organizations').select(selectField) : supabase.from('organizations').select('id');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.eq) q = q.eq(key, v.eq);
              if (v.ilike) q = q.ilike(key, v.ilike);
              if (v.or) q = q.or(v.or);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        if (queryLimit) q = q.limit(queryLimit);
        const { data, error } = await q.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-learners': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id, roll_number, name, email, phone, department_id, program_id, semester, college_id').eq('college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'delete-invigilator': {
        const { slotId, facultyId } = params;
        if (!slotId || !facultyId) return apiError(400, 'VALIDATION_ERROR', 'Missing slotId or facultyId', context.request, { startTime });
        const { error } = await supabase.from('invigilator_assignments').delete().eq('exam_timetable_id', slotId).eq('invigilator_id', facultyId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      case 'generate-transcript': {
        const { verificationId, data } = params;
        const { data: transcript, error } = await supabase.from('transcripts').insert([{ ...data, verification_id: verificationId, status: 'draft', generated_at: new Date().toISOString() }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(transcript, context.request, { startTime });
      }

      case 'get-dashboard-stats': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Run queries in parallel for performance
        const [
          learnersRes, learnersPrevRes,
          facultyRes, facultyPrevRes,
          deptRes, deptPrevRes,
          learnerIdsRes
        ] = await Promise.all([
          supabase.from('learners').select('*', { count: 'exact', head: true }).eq('college_id', college_id),
          supabase.from('learners').select('*', { count: 'exact', head: true }).eq('college_id', college_id).lte('created_at', thirtyDaysAgo),
          supabase.from('college_lecturers').select('*', { count: 'exact', head: true }).eq('collegeId', college_id),
          supabase.from('college_lecturers').select('*', { count: 'exact', head: true }).eq('collegeId', college_id).lte('created_at', thirtyDaysAgo),
          supabase.from('departments').select('*', { count: 'exact', head: true }).eq('college_id', college_id),
          supabase.from('departments').select('*', { count: 'exact', head: true }).eq('college_id', college_id).lte('created_at', thirtyDaysAgo),
          supabase.from('learners').select('id').eq('college_id', college_id),
        ]);

        const learnersCount = learnersRes.count || 0;
        const learnersPrev = learnersPrevRes.count || 0;
        const facultyCount = facultyRes.count || 0;
        const facultyPrev = facultyPrevRes.count || 0;
        const deptCount = deptRes.count || 0;
        const deptPrev = deptPrevRes.count || 0;

        const learnerIds = (learnerIdsRes.data || []).map((s: any) => s.id);
        let totalPlaced = 0;
        let totalPlacedPrev = 0;

        if (learnerIds.length > 0) {
          const [placedRes, placedPrevRes] = await Promise.all([
            supabase.from('applied_jobs').select('learner_id').eq('application_status', 'accepted').in('learner_id', learnerIds),
            supabase.from('applied_jobs').select('learner_id').eq('application_status', 'accepted').in('learner_id', learnerIds).lte('updated_at', thirtyDaysAgo),
          ]);
          totalPlaced = new Set((placedRes.data || []).map((p: any) => p.learner_id)).size;
          totalPlacedPrev = new Set((placedPrevRes.data || []).map((p: any) => p.learner_id)).size;
        }

        const calcChange = (curr: number, prev: number) => prev > 0 ? Math.round((curr - prev) / prev * 100) : 0;
        const placementRate = learnersCount > 0 ? Math.round((totalPlaced / learnersCount) * 1000) / 10 : 0;
        const placementRatePrev = learnersPrev > 0 ? Math.round((totalPlacedPrev / learnersPrev) * 1000) / 10 : 0;

        return apiSuccess({
          totalLearners: learnersCount,
          totalFaculty: facultyCount,
          totalDepartments: deptCount,
          placementRate,
          learnersChange: calcChange(learnersCount, learnersPrev),
          facultyChange: calcChange(facultyCount, facultyPrev),
          departmentsChange: calcChange(deptCount, deptPrev),
          placementRateChange: placementRatePrev > 0 ? Math.round((placementRate - placementRatePrev) * 10) / 10 : 0,
        }, context.request, { startTime });
      }

      case 'get-academic-coverage': {
        const { data: curriculumData, error } = await supabase
          .from("curriculum")
          .select(`
            id,
            course_id,
            units,
            outcomes,
            updated_at,
            course_mappings (
              course_code,
              course_name,
              semester,
              program_id,
              faculty_id,
              programs (
                name,
                department_id,
                departments (
                  name
                )
              ),
              users (
                name
              )
            )
          `)
          .eq("status", "published");

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(curriculumData, context.request, { startTime });
      }

      case 'get-digital-portfolios': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data: learnersData, error: learnersError } = await supabase
          .from('learners')
          .select(`
            id,
            name,
            email,
            college_id,
            branch_field,
            created_at,
            updated_at,
            github_link,
            linkedin_link,
            portfolio_link,
            bio,
            skill_summary,
            hobbies,
            languages,
            interests,
            metadata,
            skills:skills(name, type, level, verified),
            projects:projects(title, description, status, tech_stack, demo_link, github_link, organization),
            experience:experience(organization, role, start_date, end_date, duration, verified)
          `)
          .eq('college_id', college_id)
          .not('college_id', 'is', null);

        if (learnersError) return apiDbError(learnersError, context.request, { startTime });
        return apiSuccess(learnersData, context.request, { startTime });
      }

      case 'get-assessment-results': {
        const { college_id, college_name } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data: learnersData, error: learnersError } = await supabase
          .from('learners')
          .select(`
            user_id, 
            name, 
            email, 
            enrollmentNumber, 
            grade, 
            program_id,
            programs (
              name
            )
          `)
          .eq('college_id', college_id);

        if (learnersError) return apiDbError(learnersError, context.request, { startTime });
        if (!learnersData || learnersData.length === 0) return apiSuccess([], context.request, { startTime });

        const validLearners = learnersData.filter((s: any) => s.user_id != null);
        if (validLearners.length === 0) return apiSuccess([], context.request, { startTime });

        const learnerIds = validLearners.map((s: any) => s.user_id);
        const learnerMap = new Map(validLearners.map((s: any) => [s.user_id, s]));

        const { data, error: fetchError } = await supabase
          .from('personal_assessment_results')
          .select(`
            id,
            learner_id,
            stream_id,
            riasec_code,
            aptitude_overall,
            employability_readiness,
            knowledge_score,
            status,
            created_at,
            career_fit,
            skill_gap,
            gemini_results,
            overall_summary,
            platform_courses,
            riasec_scores,
            aptitude_scores,
            roadmap,
            profile_snapshot,
            personal_assessment_streams (
              name
            )
          `)
          .in('learner_id', learnerIds)
          .order('created_at', { ascending: false });

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        const enrichedResults = (data || []).map((r: any) => {
          const learner: any = learnerMap.get(r.learner_id);
          return {
            ...r,
            learner_name: learner?.name || null,
            learner_email: learner?.email || null,
            college_id: college_id,
            college_name: college_name || null,
            enrollmentNumber: learner?.enrollmentNumber || null,
            learner_grade: learner?.grade || null,
            program_id: learner?.program_id || null,
            program_name: (() => {
              if (!learner?.programs) return null;
              if (Array.isArray(learner.programs)) {
                return learner.programs.length > 0 ? learner.programs[0].name : null;
              }
              return learner.programs.name || null;
            })(),
            stream_name: (() => {
              if (!r.personal_assessment_streams) return null;
              if (Array.isArray(r.personal_assessment_streams)) {
                return r.personal_assessment_streams.length > 0 ? r.personal_assessment_streams[0].name : null;
              }
              return r.personal_assessment_streams.name || null;
            })(),
          };
        });

        return apiSuccess(enrichedResults, context.request, { startTime });
      }

      case 'search-library-learners': {
        const { searchTerm, userId, email, passedSchoolId, passedCollegeId, passedUniversityId } = params;
        if (!searchTerm) return apiError(400, 'VALIDATION_ERROR', 'Missing searchTerm', context.request, { startTime });

        let schoolId = passedSchoolId;
        let collegeId = passedCollegeId;
        let universityId = passedUniversityId;

        if (!schoolId && !collegeId && userId && email) {
          // TODO(12.1 review / §7.5): role-based DATA SCOPING keyed by an arbitrary
          // `userId` param (not guaranteed to be the current user). `users.role`
          // selects college vs school scope. Deferred for safety — converting to JWT
          // requires confirming userId === current user; flagged for review.
          const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

          const userRole = userRecord?.role || null;

          if (userRole === 'college_admin') {
            const { data: org } = await supabase
              .from('organizations')
              .select('id')
              .eq('organization_type', 'college')
              .ilike('email', email)
              .maybeSingle();

            if (org?.id) collegeId = org.id;
          } else {
            const { data: educator } = await supabase
              .from('school_educators')
              .select('school_id')
              .eq('user_id', userId)
              .single();

            if (educator?.school_id) {
              schoolId = educator.school_id;
            } else {
              const { data: org } = await supabase
                .from('organizations')
                .select('id')
                .eq('organization_type', 'school')
                .eq('email', email)
                .maybeSingle();

              schoolId = org?.id || null;
            }
          }
        }

        let query = supabase
          .from('learners')
          .select('id, name, roll_number, enrollmentNumber, admission_number, contact_number, email, grade, section, course_name, semester')
          .eq('is_deleted', false)
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`)
          .order('name')
          .limit(10);

        if (schoolId) {
          query = query.eq('school_id', schoolId);
        } else if (collegeId) {
          query = query.eq('college_id', collegeId);
        } else if (universityId) {
          query = query.eq('universityId', universityId);
        }

        const { data: learners, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(learners, context.request, { startTime });
      }

      case 'get-conversations': {
        const { college_id, conversation_type, status } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        if (!conversation_type) return apiError(400, 'VALIDATION_ERROR', 'Missing conversation_type', context.request, { startTime });

        let query = supabase
          .from('conversations')
          .select(`
            *,
            learner:learners(id, name, email, university, branch_field)
          `)
          .eq('college_id', college_id)
          .eq('conversation_type', conversation_type)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (status === 'archived') {
          query = query.eq('status', 'archived');
        } else if (status === 'active') {
          query = query.eq('deleted_by_college_admin', false);
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-placement-analytics-data': {
        const { data: recentPlacementsData, error: recentError } = await supabase
          .from('applied_jobs')
          .select(`
            id,
            application_status,
            applied_at,
            learners!fk_applied_jobs_learner (
              name,
              learner_id,
              branch_field,
              course_name
            ),
            opportunities!fk_applied_jobs_opportunity (
              title,
              company_name,
              employment_type,
              location,
              salary_range_min,
              salary_range_max
            )
          `)
          .eq('application_status', 'accepted')
          .order('applied_at', { ascending: false })
          .limit(10);

        if (recentError) return apiDbError(recentError, context.request, { startTime });

        const { data: alllearnersData, error: learnersError } = await supabase
          .from('learners')
          .select('branch_field, course_name, id');

        if (learnersError) return apiDbError(learnersError, context.request, { startTime });

        const { data: allPlacementsData, error: placementsError } = await supabase
          .from('applied_jobs')
          .select(`
            id,
            learner_id,
            learners!fk_applied_jobs_learner (
              branch_field,
              course_name
            ),
            opportunities!fk_applied_jobs_opportunity (
              employment_type,
              salary_range_min,
              salary_range_max
            )
          `)
          .eq('application_status', 'accepted');

        if (placementsError) return apiDbError(placementsError, context.request, { startTime });

        return apiSuccess({
          recentPlacementsData,
          alllearnersData,
          allPlacementsData
        }, context.request, { startTime });
      }

      case 'get-program-sections-data': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const [deptRes, progRes, facultyRes, sectionsRes] = await Promise.all([
          supabase.from('departments').select('*').eq('college_id', college_id).eq('status', 'active'),
          supabase.from('programs').select('*, departments!inner(college_id)').eq('departments.college_id', college_id).eq('status', 'active'),
          supabase.from('college_lecturers').select('id, user_id, users!fk_college_lecturers_user(firstName, lastName, email)').eq('collegeId', college_id).eq('accountStatus', 'active'),
          supabase.from('program_sections').select('*, programs!inner(name, code, departments!inner(name, college_id))').eq('programs.departments.college_id', college_id).order('semester', { ascending: true }).order('section', { ascending: true })
        ]);

        if (deptRes.error) return apiDbError(deptRes.error, context.request, { startTime });
        if (progRes.error) return apiDbError(progRes.error, context.request, { startTime });
        if (sectionsRes.error) return apiDbError(sectionsRes.error, context.request, { startTime });

        return apiSuccess({
          deptData: deptRes.data,
          progData: progRes.data,
          facultyData: facultyRes.data || [],
          sectionsData: sectionsRes.data
        }, context.request, { startTime });
      }

      case 'save-program-section': {
        const { section_id, data, user_id } = params;

        if (section_id) {
          const { error } = await supabase
            .from("program_sections")
            .update({
              department_id: data.department_id,
              program_id: data.program_id,
              semester: data.semester,
              section: data.section,
              max_learners: data.max_learners,
              faculty_id: data.faculty_id || null,
              status: data.status,
              updated_by: user_id,
            })
            .eq("id", section_id);
          if (error) return apiDbError(error, context.request, { startTime });
        } else {
          const currentYear = new Date().getFullYear();
          const nextYear = (currentYear + 1).toString().slice(-2);
          const academicYear = `${currentYear}-${nextYear}`;

          const { error } = await supabase
            .from("program_sections")
            .insert({
              department_id: data.department_id,
              program_id: data.program_id,
              semester: data.semester,
              section: data.section,
              max_learners: data.max_learners,
              faculty_id: data.faculty_id || null,
              academic_year: academicYear,
              status: data.status || "active",
              current_learners: 0,
              created_by: user_id,
            });
          if (error) return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-programs-data': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const [deptRes, progRes] = await Promise.all([
          supabase.from('departments').select('*').eq('college_id', college_id).order('name', { ascending: true }),
          supabase.from('programs').select('*, departments!inner(name, college_id)').eq('departments.college_id', college_id).order('name', { ascending: true })
        ]);

        if (deptRes.error) return apiDbError(deptRes.error, context.request, { startTime });
        if (progRes.error) return apiDbError(progRes.error, context.request, { startTime });

        return apiSuccess({
          deptData: deptRes.data,
          programsData: progRes.data
        }, context.request, { startTime });
      }

      case 'delete-program': {
        const { program_id } = params;
        if (!program_id) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });

        const { error } = await supabase.from('programs').delete().eq('id', program_id);
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'save-program': {
        const { program_id, data, user_id } = params;

        if (program_id) {
          const { error } = await supabase
            .from("programs")
            .update({
              name: data.name,
              code: data.code,
              description: data.description,
              degree_level: data.degree_level,
              department_id: data.department_id,
              status: data.status,
              updated_by: user_id,
            })
            .eq("id", program_id);
          if (error) return apiDbError(error, context.request, { startTime });
        } else {
          const { error } = await supabase
            .from("programs")
            .insert({
              name: data.name,
              code: data.code,
              description: data.description,
              degree_level: data.degree_level,
              department_id: data.department_id,
              status: data.status || "active",
              created_by: user_id,
            });
          if (error) return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-browse-courses': {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .in('status', ['Active', 'Upcoming'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-curriculum-courses': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('curriculum_courses')
          .select('*')
          .eq('college_id', college_id)
          .order('semester', { ascending: true })
          .order('course_code', { ascending: true });

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-departments': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .eq('college_id', college_id)
          .eq('status', 'active')
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-programs': {
        const { data, error } = await supabase
          .from('programs')
          .select('id, name, department_id')
          .eq('status', 'active')
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'save-curriculum-course': {
        const { course_id, data } = params;

        if (course_id) {
          const { error } = await supabase
            .from('curriculum_courses')
            .update(data)
            .eq('id', course_id);
          if (error) return apiDbError(error, context.request, { startTime });
        } else {
          const { error } = await supabase
            .from('curriculum_courses')
            .insert([data]);
          if (error) return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-available-semesters': {
        const { program_id } = params;
        if (!program_id) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('program_sections')
          .select('semester')
          .eq('program_id', program_id)
          .eq('status', 'active');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-program-sections-with-counts': {
        const { program_id, semester } = params;
        if (!program_id || !semester) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id or semester', context.request, { startTime });

        const { data, error } = await supabase
          .from('program_sections')
          .select('*')
          .eq('program_id', program_id)
          .eq('semester', parseInt(semester))
          .eq('status', 'active')
          .order('section');

        if (error) return apiDbError(error, context.request, { startTime });

        if (data && data.length > 0) {
          const sectionsWithCounts = await Promise.all(
            data.map(async (sec) => {
              const { count } = await supabase
                .from("learners")
                .select("*", { count: "exact", head: true })
                .eq("program_id", program_id)
                .eq("semester", parseInt(semester))
                .eq("section", sec.section)
                .eq("is_deleted", false);
              return { ...sec, current_learners: count || 0 };
            })
          );
          return apiSuccess(sectionsWithCounts, context.request, { startTime });
        }
        return apiSuccess([], context.request, { startTime });
      }

      case 'get-unenrolled-learners': {
        const { college_id } = params;
        let query = supabase
          .from("learners")
          .select("id, name, roll_number, email, contact_number, admission_number")
          .eq("is_deleted", false)
          .is("program_id", null)
          .order("name");

        if (college_id) {
          query = query.eq("college_id", college_id);
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-mentor-allocations-with-names': {
        const { data: allocations, error } = await supabase
          .from('college_mentor_learner_allocations')
          .select('learner_id, mentor_id')
          .in('status', ['active', 'pending']);

        if (error) return apiDbError(error, context.request, { startTime });

        if (allocations && allocations.length > 0) {
          const mentorIds = [...new Set(allocations.map((a: any) => a.mentor_id))];
          const { data: mentorsData } = await supabase
            .from('college_lecturers')
            .select('id, first_name, last_name')
            .in('id', mentorIds);

          const mentorMap = new Map(mentorsData?.map((m: any) => [m.id, m]) || []);
          const enriched = allocations.map((allocation: any) => ({
            ...allocation,
            college_lecturers: mentorMap.get(allocation.mentor_id)
          }));

          return apiSuccess(enriched, context.request, { startTime });
        }
        return apiSuccess(allocations || [], context.request, { startTime });
      }

      case 'check-existing-allocations': {
        const { learner_ids } = params;
        if (!learner_ids || !Array.isArray(learner_ids)) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_ids', context.request, { startTime });

        const { data: existingAllocations, error: checkError } = await supabase
          .from('college_mentor_learner_allocations')
          .select('learner_id, mentor_id')
          .in('learner_id', learner_ids)
          .eq('status', 'active');

        if (checkError) return apiDbError(checkError, context.request, { startTime });

        if (existingAllocations && existingAllocations.length > 0) {
          const mentorIds = [...new Set(existingAllocations.map((a: any) => a.mentor_id))];
          const { data: mentorsData } = await supabase
            .from('college_lecturers')
            .select('id, first_name, last_name')
            .in('id', mentorIds);

          const mentorMap = new Map(mentorsData?.map((m: any) => [m.id, m]) || []);
          const enriched = existingAllocations.map((allocation: any) => ({
            ...allocation,
            college_lecturers: mentorMap.get(allocation.mentor_id)
          }));

          return apiSuccess(enriched, context.request, { startTime });
        }
        return apiSuccess(existingAllocations || [], context.request, { startTime });
      }

      case 'delete-mentor-period': {
        const { period_id } = params;
        if (!period_id) return apiError(400, 'VALIDATION_ERROR', 'Missing period_id', context.request, { startTime });

        const { error: allocError } = await supabase
          .from('college_mentor_learner_allocations')
          .delete()
          .eq('period_id', period_id);
        if (allocError) return apiDbError(allocError, context.request, { startTime });

        const { error: periodError } = await supabase
          .from('college_mentor_periods')
          .delete()
          .eq('id', period_id);
        if (periodError) return apiDbError(periodError, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[college-admin/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
