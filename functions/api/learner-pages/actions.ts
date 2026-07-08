import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request, { startTime });
  }

  try {
    switch (action) {

      // ───────── Dashboard ─────────

      case 'test-supabase-connectivity': {
        const { data, error, count } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ data, count }, context.request, { startTime });
      }

      case 'clear-assessment-data': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', context.request, { startTime });
        const { error: resultsError } = await supabase
          .from('personal_assessment_results')
          .delete()
          .eq('learner_id', learnerId);
        if (resultsError) return apiDbError(resultsError, context.request, { startTime });
        const { error: attemptsError } = await supabase
          .from('personal_assessment_attempts')
          .delete()
          .eq('learner_id', learnerId);
        if (attemptsError) return apiDbError(attemptsError, context.request, { startTime });
        return apiSuccess({ cleared: true }, context.request, { startTime });
      }

      // ───────── Applications ─────────

      case 'fetch-recruiter': {
        const { recruiterId } = params;
        if (!recruiterId) return apiError(400, 'VALIDATION_ERROR', 'recruiterId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('id, email, name, phone')
          .eq('id', recruiterId)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ───────── Assessment Results ─────────

      case 'mark-assessment-completed': {
        const { attemptId, percentage, score, totalTimeTaken } = params;
        if (!attemptId) return apiError(400, 'VALIDATION_ERROR', 'attemptId required', context.request, { startTime });
        const { error } = await supabase
          .from('external_assessment_attempts')
          .update({
            status: 'completed',
            score: percentage,
            correct_answers: score,
            completed_at: new Date().toISOString(),
            time_taken: totalTimeTaken,
          })
          .eq('id', attemptId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ completed: true }, context.request, { startTime });
      }

      // ───────── Assessment Test ─────────

      case 'fetch-learner-by-user-id': {
        const { userId, email } = params;
        const select = params.select || 'id, grade, grade_start_date, school_class_id, school_id, university_college_id, program_id, course_name, school_classes:school_class_id(grade, academic_year), program:program_id(name, code)';
        let { data, error } = await supabase
          .from('learners')
          .select(select)
          .eq('user_id', userId)
          .maybeSingle();
        if (!data && email) {
          const result = await supabase
            .from('learners')
            .select(select)
            .eq('email', email)
            .maybeSingle();
          data = result.data;
          error = result.error;
        }
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-learner-id': {
        const { userId, email } = params;
        let { data, error } = await supabase
          .from('learners')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (!data && email) {
          const result = await supabase
            .from('learners')
            .select('id')
            .eq('email', email)
            .maybeSingle();
          data = result.data;
          error = result.error;
        }
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-ai-questions': {
        const { learnerId, questionType } = params;
        if (!learnerId || !questionType) return apiError(400, 'VALIDATION_ERROR', 'learnerId and questionType required', context.request, { startTime });
        const { data, error } = await supabase
          .from('career_assessment_ai_questions')
          .select('questions')
          .eq('learner_id', learnerId)
          .eq('question_type', questionType)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-latest-attempt': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('personal_assessment_attempts')
          .select('id, stream_id, grade_level')
          .eq('learner_id', learnerId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      // ───────── Clubs ─────────

      case 'fetch-clubs-data': {
        const { userEmail, schoolId } = params;
        if (!userEmail) return apiError(400, 'VALIDATION_ERROR', 'userEmail required', context.request, { startTime });

        const { data: membershipData, error: membershipError } = await supabase
          .from('club_memberships')
          .select(`
            membership_id, club_id, learner_email, status, enrolled_at,
            total_sessions_attended, total_sessions_held, attendance_percentage, performance_score,
            clubs ( club_id, name, category, description, meeting_day, meeting_time, location, capacity, is_active )
          `)
          .eq('learner_email', userEmail)
          .eq('status', 'active');
        if (membershipError) return apiDbError(membershipError, context.request, { startTime });

        const clubsData = (membershipData || []).map((m: any) => ({
          club_id: m.clubs?.club_id, name: m.clubs?.name, category: m.clubs?.category,
          description: m.clubs?.description || '', meeting_day: m.clubs?.meeting_day,
          meeting_time: m.clubs?.meeting_time, location: m.clubs?.location,
          is_active: m.clubs?.is_active, capacity: m.clubs?.capacity || 30, members: [],
          membership_id: m.membership_id, enrolled_at: m.enrolled_at,
          total_sessions_attended: m.total_sessions_attended, total_sessions_held: m.total_sessions_held,
          attendance_percentage: m.attendance_percentage, performance_score: m.performance_score,
        }));

        const clubsWithMembers = await Promise.all(
          clubsData.map(async (club: any) => {
            const { count } = await supabase
              .from('club_memberships')
              .select('*', { count: 'exact', head: true })
              .eq('club_id', club.club_id)
              .eq('status', 'active');
            return { ...club, memberCount: count || 0 };
          })
        );

        let resolvedSchoolId = schoolId;
        if (!resolvedSchoolId && clubsData.length > 0 && clubsData[0].club_id) {
          const { data: clubRow } = await supabase
            .from('clubs')
            .select('school_id')
            .eq('club_id', clubsData[0].club_id)
            .single();
          resolvedSchoolId = clubRow?.school_id;
        }

        let competitionsData: any[] = [];
        if (resolvedSchoolId) {
          const { data } = await supabase
            .from('competitions')
            .select('*')
            .eq('school_id', resolvedSchoolId)
            .order('competition_date', { ascending: true });
          competitionsData = data || [];
        }

        const attendanceMap: Record<string, any[]> = {};
        if (membershipData) {
          for (const membership of membershipData) {
            const { data: attendanceIds } = await supabase
              .from('club_attendance')
              .select('attendance_id')
              .eq('club_id', membership.club_id);
            if (attendanceIds && attendanceIds.length > 0) {
              const { data: records } = await supabase
                .from('club_attendance_records')
                .select(`*, club_attendance ( session_date, session_topic )`)
                .eq('learner_email', userEmail)
                .in('attendance_id', attendanceIds.map((a: any) => a.attendance_id));
              attendanceMap[membership.club_id] = records || [];
            }
          }
        }

        const { data: resultsData, error: resultsError } = await supabase
          .from('competition_results')
          .select(`result_id, rank, score, award, performance_notes, competitions ( comp_id, name, level, category, competition_date, status )`)
          .eq('learner_email', userEmail)
          .order('rank', { ascending: true });
        if (resultsError) return apiDbError(resultsError, context.request, { startTime });

        const { data: certificatesData, error: certificatesError } = await supabase
          .from('club_certificates')
          .select(`certificate_id, title, description, certificate_type, issued_date, credential_id, metadata, competitions ( name, level, category )`)
          .eq('learner_email', userEmail)
          .order('issued_date', { ascending: false });
        if (certificatesError) return apiDbError(certificatesError, context.request, { startTime });

        return apiSuccess({
          clubs: clubsWithMembers,
          memberships: membershipData || [],
          competitions: competitionsData,
          attendanceData: attendanceMap,
          achievements: resultsData || [],
          certificates: certificatesData || [],
        }, context.request, { startTime });
      }

      // ───────── Course Player ─────────

      case 'fetch-course-time': {
        const { userId, courseId, lessonId } = params;
        if (!userId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId, lessonId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_course_progress')
          .select('time_spent_seconds')
          .eq('learner_id', userId)
          .eq('course_id', courseId)
          .eq('lesson_id', lessonId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'upsert-course-time': {
        const { userId, courseId, lessonId, timeSpentSeconds, lastAccessed } = params;
        if (!userId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId, lessonId required', context.request, { startTime });
        const { error } = await supabase
          .from('learner_course_progress')
          .upsert({
            learner_id: userId, course_id: courseId, lesson_id: lessonId,
            time_spent_seconds: timeSpentSeconds || 0,
            last_accessed: lastAccessed || new Date().toISOString(),
          }, { onConflict: 'learner_id,course_id,lesson_id' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ saved: true }, context.request, { startTime });
      }

      case 'mark-lesson-completed': {
        const { userId, courseId, lessonId } = params;
        if (!userId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId, lessonId required', context.request, { startTime });
        const { error } = await supabase
          .from('learner_course_progress')
          .upsert({
            learner_id: userId, course_id: courseId, lesson_id: lessonId,
            status: 'completed', completed_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          }, { onConflict: 'learner_id,course_id,lesson_id' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ completed: true }, context.request, { startTime });
      }

      case 'count-completed-lessons': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId required', context.request, { startTime });
        const { count, error } = await supabase
          .from('learner_course_progress')
          .select('*', { count: 'exact', head: true })
          .eq('learner_id', userId)
          .eq('course_id', courseId)
          .eq('status', 'completed');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ count: count || 0 }, context.request, { startTime });
      }

      case 'update-course-completed-at': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId required', context.request, { startTime });
        const { error } = await supabase
          .from('course_enrollments')
          .update({ completed_at: new Date().toISOString() })
          .eq('learner_id', userId)
          .eq('course_id', courseId)
          .is('completed_at', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      case 'get-lesson-progress': {
        const { userId, courseId, lessonId } = params;
        if (!userId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId, lessonId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_course_progress')
          .select('*')
          .eq('learner_id', userId)
          .eq('course_id', courseId)
          .eq('lesson_id', lessonId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'upsert-lesson-progress': {
        const { userId, courseId, lessonId, status, timeSpentSeconds } = params;
        if (!userId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId, lessonId required', context.request, { startTime });
        const payload: any = {
          learner_id: userId, course_id: courseId, lesson_id: lessonId,
          last_accessed: new Date().toISOString(),
        };
        if (status) payload.status = status;
        if (timeSpentSeconds !== undefined) payload.time_spent_seconds = timeSpentSeconds;
        const { error } = await supabase
          .from('learner_course_progress')
          .upsert(payload, { onConflict: 'learner_id,course_id,lesson_id' });
        if (error) {
          if (error.code === '23505') return apiSuccess({ created: false }, context.request, { startTime });
          return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ saved: true }, context.request, { startTime });
      }

      case 'fetch-course-full': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'courseId required', context.request, { startTime });
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('course_id', courseId)
          .maybeSingle();
        if (courseError) return apiDbError(courseError, context.request, { startTime });
        if (!courseData) return apiError(404, 'NOT_FOUND', 'Course not found', context.request, { startTime });
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select('*, lessons!fk_module ( *, lesson_resources!fk_lesson (*) )')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        if (modulesError) return apiDbError(modulesError, context.request, { startTime });
        return apiSuccess({ ...courseData, modules: modulesData || [] }, context.request, { startTime });
      }

      case 'fetch-all-lesson-times': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'userId, courseId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_course_progress')
          .select('lesson_id, time_spent_seconds')
          .eq('learner_id', userId)
          .eq('course_id', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-record': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'userId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('id, learner_id, name, users!inner(firstName, lastName)')
          .eq('user_id', userId)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'complete-course-enrollment': {
        const { learnerId, courseId, status, progress } = params;
        if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId required', context.request, { startTime });
        const { error } = await supabase
          .from('course_enrollments')
          .update({
            status: status || 'completed',
            completed_at: new Date().toISOString(),
            progress: progress || 100,
          })
          .eq('learner_id', learnerId)
          .eq('course_id', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ completed: true }, context.request, { startTime });
      }

      // ───────── Courses ─────────

      case 'fetch-learner-info': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('grade, branch_field, learner_type')
          .eq('email', email)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-courses-query': {
        const { filters } = params;
        let query = supabase
          .from('courses')
          .select('*', { count: 'exact' })
          .in('status', filters?.status || ['Active', 'Upcoming'])
          .is('deleted_at', null);

        if (filters?.classification) {
          query = query.or(`classification.eq.${filters.classification},classification.is.null`);
        }
        if (filters?.branchField && (!filters?.categoryFilter || filters.categoryFilter.length === 0)) {
          query = query.or(`category.eq.${filters.branchField},category.is.null`);
        }
        if (filters?.search) {
          const s = filters.search;
          query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,code.ilike.%${s}%`);
        }
        if (filters?.filterStatus && filters.filterStatus !== 'all') {
          query = query.eq('status', filters.filterStatus);
        }
        if (filters?.categories && filters.categories.length > 0) {
          query = query.in('category', filters.categories);
        }
        if (filters?.skillTypes && filters.skillTypes.length > 0) {
          query = query.in('skill_type', filters.skillTypes);
        }
        if (filters?.durations && filters.durations.length > 0) {
          query = query.in('duration', filters.durations);
        }

        const limit = filters?.limit || 20;
        const offset = ((filters?.page || 1) - 1) * limit;
        query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ courses: data || [], total: count || 0 }, context.request, { startTime });
      }

      // ───────── Messages ─────────

      case 'fetch-school-org-admin': {
        const { schoolId } = params;
        if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('admin_id')
          .eq('id', schoolId)
          .eq('organization_type', 'school')
          .single();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-college-org-admin': {
        const { collegeId } = params;
        if (!collegeId) return apiError(400, 'VALIDATION_ERROR', 'collegeId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('admin_id')
          .eq('id', collegeId)
          .eq('organization_type', 'college')
          .single();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-school-admin-educator': {
        const { schoolId } = params;
        if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('school_educators')
          .select('id, user_id')
          .eq('school_id', schoolId)
          .eq('role', 'school_admin')
          .limit(1)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-college-admin': {
        const { collegeId } = params;
        if (!collegeId) return apiError(400, 'VALIDATION_ERROR', 'collegeId required', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_lecturers')
          .select('id, user_id, userId')
          .or(`collegeId.eq.${collegeId},college_id.eq.${collegeId}`)
          .limit(1)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      // ───────── My Learning ─────────

      case 'delete-training-cascade': {
        const { trainingId } = params;
        if (!trainingId) return apiError(400, 'VALIDATION_ERROR', 'trainingId required', context.request, { startTime });
        const { error: certError } = await supabase
          .from('certificates')
          .delete()
          .eq('training_id', trainingId);
        if (certError) return apiDbError(certError, context.request, { startTime });
        const { error: skillError } = await supabase
          .from('skills')
          .delete()
          .eq('training_id', trainingId);
        if (skillError) return apiDbError(skillError, context.request, { startTime });
        const { error } = await supabase
          .from('trainings')
          .delete()
          .eq('id', trainingId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[LearnerPages Actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
