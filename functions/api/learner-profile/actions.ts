import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../lib/auth';
import { notifyRealtime } from '../../lib/realtime';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      // ──────────────────────────────────────────────
      // PROFILE DATA — batched overview for admin profile drawer
      // ──────────────────────────────────────────────

      case 'fetch-learner-overview': {
        const { learnerId, userId, email, schoolId, collegeId } = params;
        if (!learnerId && !userId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or userId', context.request, { startTime });

        const id = learnerId || userId;

        const [
          experienceRes, trainingsRes, appliedJobsRes, savedJobsRes,
          skillPassportsRes, learnerStreaksRes, learnerAssignmentsRes,
          attendanceRecordsRes, collegeEventsRes, skillsRes, educationRes,
          internshipsRes, clubCertsRes, competitionRes, skillBadgesRes,
          courseProgressRes, quizProgressRes, careerConvRes, searchHistoryRes,
          profileViewsRes, notificationsRes, conversationsRes, placementsRes,
          pipelineRes, interviewsRes, personalAssessRes,
        ] = await Promise.allSettled([
          supabase.from('experience').select('*').eq('learner_id', id).order('start_date', { ascending: false }),
          supabase.from('trainings').select('*').eq('learner_id', id).order('created_at', { ascending: false }),
          supabase.from('applied_jobs').select('*, opportunity:opportunities(title, company_name, location, employment_type)').eq('learner_id', userId || id).order('applied_at', { ascending: false }).limit(10),
          supabase.from('saved_jobs').select('*, opportunity:opportunities(title, company_name, location)').eq('learner_id', userId || id).order('saved_at', { ascending: false }).limit(10),
          supabase.from('skill_passports').select('*').eq('learnerId', userId || id).maybeSingle(),
          supabase.from('learner_streaks').select('*').eq('learner_id', id).maybeSingle(),
          supabase.from('learner_assignments').select('*, assignment:assignments(title, course_name, due_date, total_points)').eq('learner_id', userId || id).order('assigned_date', { ascending: false }).limit(10),
          schoolId ? supabase.from('attendance_records').select('*').eq('learner_id', id).order('date', { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
          collegeId ? supabase.from('college_event_registrations').select('*, event:college_events(title, event_type, start_date, end_date, venue)').eq('learner_id', id).order('registered_at', { ascending: false }) : Promise.resolve({ data: [] }),
          supabase.from('skills').select('*').eq('learner_id', id).order('created_at', { ascending: false }),
          supabase.from('education').select('*').eq('learner_id', id).order('year_of_passing', { ascending: false }),
          supabase.from('internships').select('*').eq('learner_id', userId || id).order('start_date', { ascending: false }),
          supabase.from('club_certificates').select('*, club:clubs(name), competition:competitions(name)').eq('learner_email', email || '').order('issued_date', { ascending: false }),
          supabase.from('competition_results').select('*, competition:competitions(name, level, category, competition_date)').eq('learner_email', email || '').order('recorded_at', { ascending: false }),
          supabase.from('learner_skill_badges').select('*, badge:skill_badges(name, description, icon, category, level)').eq('learner_email', email || '').order('earned_at', { ascending: false }),
          supabase.from('learner_course_progress').select('*, course:courses(title, code), lesson:lessons(title)').eq('learner_id', userId || id).order('last_accessed', { ascending: false }).limit(20),
          supabase.from('learner_quiz_progress').select('*').eq('learner_id', userId || id).order('started_at', { ascending: false }).limit(10),
          supabase.from('career_ai_conversations').select('id, title, created_at, updated_at').eq('learner_id', userId || id).order('updated_at', { ascending: false }).limit(10),
          supabase.from('search_history').select('*').eq('learner_id', userId || id).order('last_searched_at', { ascending: false }).limit(10),
          supabase.from('profile_views').select('*').eq('learner_id', userId || id).order('viewed_at', { ascending: false }).limit(20),
          supabase.from('notifications').select('*').eq('recipient_id', userId || id).order('created_at', { ascending: false }).limit(20),
          supabase.from('conversations').select('*').eq('learner_id', userId || id).order('last_message_at', { ascending: false }).limit(10),
          supabase.from('placements').select('*, recruiter:recruiters(name)').eq('learnerId', userId || id).order('hiredDate', { ascending: false }),
          supabase.from('pipeline_candidates').select('*, opportunity:opportunities(title, company_name)').eq('learner_id', userId || id).order('stage_changed_at', { ascending: false }),
          supabase.from('interviews').select('*').eq('learner_id', userId || id).order('date', { ascending: false }),
          supabase.from('personal_assessment_results').select('*').eq('learner_id', id).order('created_at', { ascending: false }),
        ]);

        const extract = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data || []) : [];

        return apiSuccess({
          experience: extract(experienceRes),
          trainings: extract(trainingsRes),
          appliedJobs: extract(appliedJobsRes),
          savedJobs: extract(savedJobsRes),
          skillPassports: skillPassportsRes.status === 'fulfilled' ? skillPassportsRes.value.data || null : null,
          learnerStreaks: learnerStreaksRes.status === 'fulfilled' ? learnerStreaksRes.value.data || null : null,
          learnerAssignments: extract(learnerAssignmentsRes),
          attendanceRecords: extract(attendanceRecordsRes),
          collegeEventRegistrations: extract(collegeEventsRes),
          skills: extract(skillsRes),
          education: extract(educationRes),
          internships: extract(internshipsRes),
          clubCertificates: extract(clubCertsRes),
          competitionResults: extract(competitionRes),
          learnerSkillBadges: extract(skillBadgesRes),
          learnerCourseProgress: extract(courseProgressRes),
          learnerQuizProgress: extract(quizProgressRes),
          careerAiConversations: extract(careerConvRes),
          searchHistory: extract(searchHistoryRes),
          profileViews: extract(profileViewsRes),
          notifications: extract(notificationsRes),
          conversations: extract(conversationsRes),
          placements: extract(placementsRes),
          pipelineCandidates: extract(pipelineRes),
          interviews: extract(interviewsRes),
          personalAssessmentResults: extract(personalAssessRes),
        }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER PROFILE DATA (individual table reads)
      // ──────────────────────────────────────────────

      case 'fetch-trainings': {
        const { learnerId, filters } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        let query = supabase.from('trainings').select('*').eq('learner_id', learnerId);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.approval_status) {
          if (Array.isArray(filters.approval_status)) {
            query = query.in('approval_status', filters.approval_status);
          } else {
            query = query.eq('approval_status', filters.approval_status);
          }
        }
        if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`);
        if (filters?.sortField) query = query.order(filters.sortField, { ascending: filters.sortAsc !== false });
        else query = query.order('created_at', { ascending: false });
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-course-enrollments': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('course_enrollments').select('*').eq('learner_id', learnerId).order('enrolled_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-course-modules': {
        const { courseIds } = params;
        if (!courseIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing courseIds', context.request, { startTime });
        const { data, error } = await supabase.from('course_modules').select('course_id, lessons:lessons(lesson_id)').in('course_id', courseIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-certificates-by-training': {
        const { trainingIds } = params;
        if (!trainingIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing trainingIds', context.request, { startTime });
        const { data, error } = await supabase.from('certificates').select('training_id, link').in('training_id', trainingIds).eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-certificates': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('certificates').select('*').eq('learner_id', learnerId).is('training_id', null).order('issued_on', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-skills-by-training': {
        const { trainingIds } = params;
        if (!trainingIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing trainingIds', context.request, { startTime });
        const { data, error } = await supabase.from('skills').select('training_id, name, type, level, description').in('training_id', trainingIds).eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-skills': {
        const { learnerId, skillType } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        let query = supabase.from('skills').select('*').eq('learner_id', learnerId);
        if (skillType) query = query.eq('type', skillType);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-projects': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('projects').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-projects': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('learner_projects').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-certificates': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('learner_certificates').select('*').eq('learner_id', learnerId).order('issued_on', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-skills': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('skills').select('*').eq('learner_id', learnerId).is('training_id', null).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-education': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('education').select('*').eq('learner_id', learnerId).order('year_of_passing', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-experience': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('experience').select('*').eq('learner_id', learnerId).order('start_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-personal-assessment-results': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('personal_assessment_results').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-streaks': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('learner_streaks').select('*').eq('learner_id', learnerId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-skill-passports': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('skill_passports').select('*').eq('learnerId', learnerId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-applied-jobs': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('applied_jobs').select('*, opportunity:opportunities(title, company_name, location, employment_type)').eq('learner_id', userId).order('applied_at', { ascending: false }).limit(10);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-saved-jobs': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('saved_jobs').select('*, opportunity:opportunities(title, company_name, location)').eq('learner_id', userId).order('saved_at', { ascending: false }).limit(10);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-assignments': {
        const { userId, limit: queryLimit } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        let query = supabase.from('learner_assignments').select('*, assignment:assignments(title, course_name, due_date, total_points)').eq('learner_id', userId).order('assigned_date', { ascending: false });
        if (queryLimit) query = query.limit(queryLimit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-attendance-records': {
        const { learnerId, startDate, endDate, schoolId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        let query = supabase.from('attendance_records').select('*').eq('learner_id', learnerId);
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);
        const { data, error } = await query.order('date', { ascending: false }).limit(30);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-school-classes': {
        const { schoolId, grade, section } = params;
        if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId', context.request, { startTime });
        let query = supabase.from('school_classes').select('id, grade, academic_year, school_id, section').eq('school_id', schoolId);
        if (grade) query = query.eq('grade', grade);
        if (section) query = query.eq('section', section);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-school-class-by-id': {
        const { classId } = params;
        if (!classId) return apiError(400, 'VALIDATION_ERROR', 'Missing classId', context.request, { startTime });
        const { data, error } = await supabase.from('school_classes').select('grade, academic_year, school_id').eq('id', classId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-lesson-plans': {
        const { classId, schoolId } = params;
        if (!classId && !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing classId or schoolId', context.request, { startTime });
        let query = supabase.from('lesson_plans').select('*, curriculum_chapters!inner(...curriculums!inner(...))');
        if (classId) query = query.eq('class_name', classId);
        if (schoolId) query = query.eq('curriculum_chapters.curriculums.school_id', schoolId);
        query = query.eq('status', 'approved');
        const { data, error } = await query.order('date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-curriculums': {
        const { grade, schoolId } = params;
        if (!grade) return apiError(400, 'VALIDATION_ERROR', 'Missing grade', context.request, { startTime });
        let query = supabase.from('curriculums').select('*, curriculum_chapters(*, curriculum_learning_outcomes(*))').eq('class', grade).eq('status', 'approved');
        if (schoolId) query = query.eq('school_id', schoolId);
        const { data, error } = await query.order('academic_year', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // TABS — clubs, competitions, events, exams
      // ──────────────────────────────────────────────

      case 'fetch-club-memberships': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('club_memberships').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-competition-registrations': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('competition_registrations').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-college-events': {
        const { collegeId } = params;
        if (!collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing collegeId', context.request, { startTime });
        const { data, error } = await supabase.from('college_events').select('*').eq('college_id', collegeId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-exam-results': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('exam_results').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-assessment-results': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('assessment_results').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-mark-entries': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('mark_entries').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-exam-timetable': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('exam_timetable').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER ACADEMICS
      // ──────────────────────────────────────────────

      case 'fetch-curriculum': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('curriculum').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER PORTFOLIO
      // ──────────────────────────────────────────────

      case 'fetch-learner-portfolio': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const [projectsRes, certsRes, trainingsRes, enrollmentsRes, skillsRes] = await Promise.allSettled([
          supabase.from('projects').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
          supabase.from('certificates').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
          supabase.from('trainings').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
          supabase.from('course_enrollments').select('*').eq('learner_id', learnerId).order('enrolled_at', { ascending: false }),
          supabase.from('skills').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
        ]);
        const extract = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data || []) : [];
        return apiSuccess({
          projects: extract(projectsRes),
          certificates: extract(certsRes),
          trainings: extract(trainingsRes),
          courseEnrollments: extract(enrollmentsRes),
          skills: extract(skillsRes),
        }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // ADMISSION NOTE MODALS
      // ──────────────────────────────────────────────

      case 'fetch-school-educators': {
        const { email, userId } = params;
        if (!email && !userId) return apiError(400, 'VALIDATION_ERROR', 'Missing email or userId', context.request, { startTime });
        let sq = supabase.from('school_educators').select('id, first_name, last_name, email, school_id');
        if (userId) sq = sq.eq('user_id', userId);
        else sq = sq.eq('email', email);
        const { data, error } = await sq.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-college-lecturers': {
        const { userId, email } = params;
        if (!userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });
        let query = supabase.from('college_lecturers').select('id, first_name, last_name, email, user_id');
        if (userId) query = query.eq('user_id', userId);
        if (email) query = query.eq('email', email);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-organization': {
        const { orgId, type, adminId } = params;
        if (!orgId && !adminId) return apiError(400, 'VALIDATION_ERROR', 'Missing orgId or adminId', context.request, { startTime });
        let query = supabase.from('organizations').select('id, name, code, city, state, country, email, admin_id');
        if (type) query = query.eq('organization_type', type);
        if (orgId) query = query.eq('id', orgId);
        else query = query.eq('admin_id', adminId);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'create-message': {
        const { conversationId, senderId, senderRole, messageContent, messageType } = params;
        if (!conversationId || !senderId || !messageContent) return apiError(400, 'VALIDATION_ERROR', 'Missing conversationId, senderId, or messageContent', context.request, { startTime });
        const { data, error } = await supabase.from('messages').insert({
          conversation_id: conversationId, sender_id: senderId,
          sender_role: senderRole || 'educator',
          message_content: messageContent, message_type: messageType || 'text',
          sent_at: new Date().toISOString(),
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', data));
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-conversation-last-message': {
        const { conversationId } = params;
        if (!conversationId) return apiError(400, 'VALIDATION_ERROR', 'Missing conversationId', context.request, { startTime });
        const lastMessageAt = new Date().toISOString();
        const { error } = await supabase.from('conversations').update({ last_message_at: lastMessageAt }).eq('id', conversationId);
        if (error) return apiDbError(error, context.request, { startTime });
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'UPDATE', { id: conversationId, last_message_at: lastMessageAt }));
        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      case 'create-conversation': {
        const { conversationData } = params;
        if (!conversationData) return apiError(400, 'VALIDATION_ERROR', 'Missing conversationData', context.request, { startTime });
        const { data, error } = await supabase.from('conversations').insert(conversationData).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        context.waitUntil(notifyRealtime(env as any, 'conversations', 'INSERT', data));
        return apiSuccess(data, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER SETTINGS SERVICE
      // ──────────────────────────────────────────────

      case 'fetch-learner': {
        const { id, userId, email } = params;
        if (!id && !userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing id, userId, or email', context.request, { startTime });
        let query = supabase.from('learners').select('*');
        if (id) query = query.eq('id', id);
        else if (userId) query = query.eq('user_id', userId);
        else if (email) query = query.eq('email', email);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'update-learner': {
        const { id, userId, updates } = params;
        if ((!id && !userId) || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing id/userId or updates', context.request, { startTime });
        let query = supabase.from('learners').update({ ...updates, updated_at: new Date().toISOString() });
        if (id) query = query.eq('id', id);
        else query = query.eq('user_id', userId);
        const { data, error } = await query.select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-programs': {
        const { data, error } = await supabase.from('programs').select('*');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER ADMIN MESSAGES
      // ──────────────────────────────────────────────

      case 'fetch-learner-admin-message': {
        const { userId, learnerId } = params;
        if (!userId && !learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or learnerId', context.request, { startTime });
        let query = supabase.from('learners').select('name');
        if (learnerId) query = query.eq('id', learnerId);
        else query = query.eq('user_id', userId);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-learners': {
        const { filters } = params;
        let query = supabase.from('learners').select('*');
        if (filters) {
          if (filters.schoolId) query = query.eq('school_id', filters.schoolId);
          if (filters.collegeId) query = query.eq('college_id', filters.collegeId);
          if (filters.grade) query = query.eq('grade', filters.grade);
          if (filters.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
          if (filters.limit) query = query.limit(filters.limit);
          if (filters.orderBy) query = query.order(filters.orderBy, { ascending: filters.orderAsc !== false });
        }
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER CLASS SERVICE
      // ──────────────────────────────────────────────

      case 'fetch-timetable-slots': {
        const { classId } = params;
        if (!classId) return apiError(400, 'VALIDATION_ERROR', 'Missing classId', context.request, { startTime });
        const { data, error } = await supabase.from('timetable_slots').select('*').eq('class_id', classId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-educator-class-assignments': {
        const { educatorId } = params;
        if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
        const { data, error } = await supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', educatorId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess((data || []).map((a: any) => a.class_id), context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER ENROLLMENT SERVICE (entities)
      // ──────────────────────────────────────────────

      case 'enroll-learner': {
        const { enrollmentData } = params;
        if (!enrollmentData) return apiError(400, 'VALIDATION_ERROR', 'Missing enrollmentData', context.request, { startTime });
        const { data, error } = await supabase.from('learners').insert({
          ...enrollmentData, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-enrollment': {
        const { learnerId, enrollmentData } = params;
        if (!learnerId || !enrollmentData) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or enrollmentData', context.request, { startTime });
        const { data, error } = await supabase.from('learners').update({ ...enrollmentData, updated_at: new Date().toISOString() }).eq('id', learnerId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-profile-section': {
        const { learnerId, learnerIdField, userId } = params;
        // For entity service delete operations
        const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (params.data) updatePayload.data = params.data;
        if (params.profile) updatePayload.profile = params.profile;
        if (params.deleted_at) updatePayload.deleted_at = params.deleted_at;

        let query = supabase.from('learners').update(updatePayload);
        if (learnerId) query = query.eq('id', learnerId);
        else if (userId) query = query.eq('user_id', userId);
        else return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or userId', context.request, { startTime });

        const { error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER AUTHENTICATED
      // ──────────────────────────────────────────────

      case 'fetch-authenticated-learner': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('*').eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-learner-by-id': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        // Fetch learner data
        const { data: learnerData, error: learnerError } = await supabase.from('learners').select('*').eq('id', learnerId).maybeSingle();

        if (learnerError && learnerError.code !== 'PGRST116') return apiDbError(learnerError, context.request, { startTime });
        if (!learnerData) return apiSuccess(null, context.request, { startTime });

        // Fetch privacy settings from user_settings table using learner's user_id
        let privacySettings = { profileVisibility: 'public' };

        if (learnerData.user_id) {
          const { data: userSettings, error: settingsError } = await supabase
            .from('user_settings')
            .select('privacy_settings')
            .eq('user_id', learnerData.user_id)
            .maybeSingle();

          if (!settingsError && userSettings?.privacy_settings) {
            privacySettings = userSettings.privacy_settings;
          }
        }

        return apiSuccess({
          ...learnerData,
          privacySettings
        }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // ADMISSION APPLICATIONS (duplicate check)
      // ──────────────────────────────────────────────

      case 'check-duplicate-application': {
        const { name, dateOfBirth, phone } = params;
        if (!name || !dateOfBirth || !phone) return apiError(400, 'VALIDATION_ERROR', 'Missing name, dateOfBirth, or phone', context.request, { startTime });
        const { data, error } = await supabase.from('admission_applications').select('id').eq('learner_name', name).eq('date_of_birth', dateOfBirth).eq('phone', phone).limit(1);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ isDuplicate: (data || []).length > 0 }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // PORTFOLIO TOAST — profile section data
      // ──────────────────────────────────────────────

      case 'fetch-profile-section-data': {
        const { learnerId, sections } = params;
        if (!learnerId || !sections?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or sections', context.request, { startTime });
        const results: Record<string, any[]> = {};
        const sectionTableMap: Record<string, string> = {
          skills: 'skills', education: 'education', projects: 'projects',
          experience: 'experience', certificates: 'certificates', learners: 'learners',
        };
        for (const section of sections) {
          const table = sectionTableMap[section];
          if (!table) continue;
          const { data } = await supabase.from(table).select('*').eq('learner_id', learnerId);
          results[section] = data || [];
        }
        return apiSuccess(results, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER WEEKLY TRACKER (WeeklyLearningTracker.jsx)
      // ──────────────────────────────────────────────

      case 'fetch-weekly-learning': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const [streakRes, progressRes, enrollmentsRes] = await Promise.allSettled([
          supabase.from('learner_streaks').select('*').eq('learner_id', learnerId).maybeSingle(),
          supabase.from('learner_course_progress').select('*, course:courses(*), lesson:lessons(*)').eq('learner_id', learnerId),
          supabase.from('course_enrollments').select('*, course:courses(*), module:course_modules(*), lesson:lessons(*)').eq('learner_id', learnerId),
        ]);
        const extract = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data || []) : [];
        const streak = streakRes.status === 'fulfilled' ? streakRes.value.data || null : null;
        return apiSuccess({
          streak,
          courseProgress: extract(progressRes),
          enrollments: extract(enrollmentsRes),
        }, context.request, { startTime });
      }

      case 'fetch-courses-by-ids': {
        const { courseIds } = params;
        if (!courseIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing courseIds', context.request, { startTime });
        const { data, error } = await supabase.from('courses').select('course_id, title').in('course_id', courseIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-lessons-by-module-ids': {
        const { moduleIds } = params;
        if (!moduleIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleIds', context.request, { startTime });
        const { data, error } = await supabase.from('lessons').select('module_id, lesson_id').in('module_id', moduleIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-course-modules-by-course-ids': {
        const { courseIds } = params;
        if (!courseIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing courseIds', context.request, { startTime });
        const { data, error } = await supabase.from('course_modules').select('module_id, course_id').in('course_id', courseIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-lesson-counts-by-module-ids': {
        const { moduleIds } = params;
        if (!moduleIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleIds', context.request, { startTime });
        const { data, error } = await supabase.from('lessons').select('module_id').in('module_id', moduleIds);
        if (error) return apiDbError(error, context.request, { startTime });
        const counts: Record<string, number> = {};
        (data || []).forEach((l: any) => { counts[l.module_id] = (counts[l.module_id] || 0) + 1; });
        return apiSuccess(counts, context.request, { startTime });
      }

      case 'fetch-achievement-stats': {
        const { userId, learnerDbId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const dbId = learnerDbId || userId;
        const [streakRes, progressRes, enrollRes] = await Promise.allSettled([
          supabase.from('learner_streaks').select('current_streak, longest_streak').eq('learner_id', dbId).maybeSingle(),
          supabase.from('learner_course_progress').select('time_spent_seconds, status').eq('learner_id', userId),
          supabase.from('course_enrollments').select('completed_at').eq('learner_id', dbId).not('completed_at', 'is', null),
        ]);
        const extract = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data || []) : [];
        const streak = streakRes.status === 'fulfilled' ? streakRes.value.data || { current_streak: 0, longest_streak: 0 } : { current_streak: 0, longest_streak: 0 };
        return apiSuccess({
          currentStreak: streak.current_streak || 0,
          longestStreak: streak.longest_streak || 0,
          timeProgress: extract(progressRes),
          completedEnrollments: extract(enrollRes),
        }, context.request, { startTime });
      }

      case 'fetch-certificate-url': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { data, error } = await supabase.from('course_enrollments').select('certificate_url').eq('learner_id', userId).eq('course_id', courseId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data?.certificate_url || null, context.request, { startTime });
      }

      case 'fetch-enrolled-learners': {
        const { filters } = params;
        let query = supabase.from('learners').select(`
          id, name, roll_number, email, contact_number, college_id, program_id, semester, section, enrollmentDate, created_at, updated_at,
          programs!learners_program_id_fkey(id, name, code, department_id, departments!programs_department_id_fkey(id, name, code))
        `).eq('is_deleted', false).not('program_id', 'is', null).order('name', { ascending: true });
        if (filters?.college_id) query = query.eq('college_id', filters.college_id);
        if (filters?.program_id) query = query.eq('program_id', filters.program_id);
        if (filters?.semester) query = query.eq('semester', filters.semester);
        if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-unenrolled-learners': {
        const { data, error } = await supabase.from('learners').select('id, name, roll_number, email, contact_number, college_id').eq('is_deleted', false).is('program_id', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-enrollment-stats': {
        const { filters } = params;
        let query = supabase.from('learners').select(`
          id, program_id, semester,
          programs!learners_program_id_fkey(name, department_id, departments!programs_department_id_fkey(id, name))
        `).eq('is_deleted', false).not('program_id', 'is', null);
        if (filters?.program_id) query = query.eq('program_id', filters.program_id);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER SETTINGS
      // ──────────────────────────────────────────────

      case 'fetch-learner-settings-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select(`
          id, email, name, age, date_of_birth, dateOfBirth, contact_number, contactNumber, alternate_number,
          district_name, city, state, country, pincode, address, university, branch_field,
          college_school_name, school_name, registration_number, enrollmentNumber, github_link, linkedin_link,
          twitter_link, facebook_link, instagram_link, portfolio_link, other_social_links,
          resumeUrl, profilePicture, bio, gender, bloodGroup, guardianName, guardianPhone,
          guardianEmail, guardianRelation, currentCgpa, grade, grade_start_date, universityId,
          university_college_id, school_id, school_class_id, college_id, program_id,
          program_section_id, semester, section, expectedGraduationDate, enrollmentDate, user_id,
          approval_status, created_at, updated_at, gap_in_studies, gap_years, gap_reason,
          work_experience, aadhar_number, backlogs_history, current_backlogs, interests,
          languages, hobbies, learner_type,
          school:organizations!learners_school_id_fkey(id, name, code, city, state, organization_type),
          college:organizations!learners_college_id_fkey(id, name, code, city, state, organization_type),
          universityOrganization:organizations!learners_universityid_fkey(id, name, code, city, state, organization_type),
          users!inner(role)
        `).eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiSuccess(null, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-user-settings': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('user_settings').select('notification_preferences, privacy_settings').eq('user_id', userId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-learner-id-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id, user_id').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-program-name-by-id': {
        const { programId } = params;
        if (!programId) return apiError(400, 'VALIDATION_ERROR', 'Missing programId', context.request, { startTime });
        const { data, error } = await supabase.from('programs').select('name, code').eq('id', programId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'upsert-user-settings': {
        const { userId, notificationPreferences, privacySettings } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data: existing } = await supabase.from('user_settings').select('id').eq('user_id', userId).maybeSingle();
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (notificationPreferences) payload.notification_preferences = notificationPreferences;
        if (privacySettings) payload.privacy_settings = privacySettings;
        if (existing) {
          const { error } = await supabase.from('user_settings').update(payload).eq('user_id', userId);
          if (error) return apiDbError(error, context.request, { startTime });
        } else {
          const { error } = await supabase.from('user_settings').insert({ user_id: userId, ...payload });
          if (error) return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'update-learner-by-id': {
        const { learnerId, updates } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        if (!updates || typeof updates !== 'object') return apiError(400, 'VALIDATION_ERROR', 'Missing updates', context.request, { startTime });
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase.from('learners').update(updates).eq('id', learnerId).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER LIST / ADMIN QUERIES
      // ──────────────────────────────────────────────

      case 'fetch-user-by-id': {
        // TODO(§7.5/7.10 frontend-resolver reconciliation): lookup endpoint returning
        // `users.role`/`organizationId` by arbitrary userId — NOT an in-handler authz
        // decision; deferred (out of scope for 12.1).
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('users').select('role, organizationId').eq('id', userId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-org-by-admin': {
        const { userId, email, orgType } = params;
        if (!orgType) return apiError(400, 'VALIDATION_ERROR', 'Missing orgType', context.request, { startTime });
        let query = supabase.from('organizations').select('id, name').eq('organization_type', orgType);
        if (userId) query = query.or(`admin_id.eq.${userId},email.ilike.${email || ''}`);
        const { data, error } = await query.maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-school-educator-by-user': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select('id, school_id').eq('user_id', userId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-orgs-by-type': {
        const { orgType } = params;
        if (!orgType) return apiError(400, 'VALIDATION_ERROR', 'Missing orgType', context.request, { startTime });
        const { data, error } = await supabase.from('organizations').select('id').eq('organization_type', orgType);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-rich': {
        const { schoolId, collegeId, classIds, educatorType, sortBy, sortOrder, limit } = params;
        let query = supabase.from('learners').select(`
          id, user_id, learner_id, name, email, contact_number, alternate_number, contact_dial_code,
          date_of_birth, age, gender, bloodGroup, district_name, university, university_main,
          branch_field, college_school_name, course_name, registration_number, enrollmentNumber,
          github_link, linkedin_link, twitter_link, facebook_link, instagram_link, portfolio_link,
          youtube_link, other_social_links, approval_status, trainer_name, bio, address, city,
          state, country, pincode, resumeUrl, profilePicture, contactNumber, dateOfBirth,
          created_at, createdAt, updated_at, updatedAt, imported_at, school_id, college_id,
          school_class_id, grade, section, roll_number, admission_number, currentCgpa, semester,
          admission_academic_year,
          guardianName, guardianPhone, guardianEmail, guardianRelation, enrollmentDate,
          expectedGraduationDate, hobbies, languages, interests, category, quota, metadata,
          notification_settings,
          school_classes:school_class_id(id, name, grade, section, academic_year),
          skills!skills_learner_id_fkey(id, name, type, level, description, verified, enabled, approval_status, created_at, updated_at),
          projects!projects_learner_id_fkey(id, title, description, status, start_date, end_date, duration, tech_stack, demo_link, github_link, approval_status, certificate_url, video_url, ppt_url, organization, enabled, created_at, updated_at),
          certificates!certificates_learner_id_fkey(id, title, issuer, level, credential_id, link, issued_on, description, status, approval_status, document_url, enabled, created_at, updated_at),
          experience!experience_learner_id_fkey(id, organization, role, start_date, end_date, duration, verified, approval_status, created_at, updated_at),
          trainings!trainings_learner_id_fkey(id, title, organization, start_date, end_date, duration, description, approval_status, created_at, updated_at)
        `).eq('is_deleted', false);
        if (classIds?.length && educatorType === 'school') query = query.in('school_class_id', classIds);
        else if (classIds?.length && educatorType === 'college') query = query.in('college_class_id', classIds);
        else if (schoolId) query = query.eq('school_id', schoolId);
        else if (collegeId) query = query.eq('college_id', collegeId);
        const s = sortBy || 'updated_at';
        const o = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
        const { data, error } = await query.order(s, o).limit(limit || 500);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-admin': {
        const { schoolId, collegeId, universityId, searchTerm, page, pageSize, useSimple } = params;
        const pg = page || 1;
        const ps = pageSize || 500;
        const startIndex = (pg - 1) * ps;
        const endIndex = startIndex + ps - 1;

        let query;
        if (useSimple) {
          query = supabase.from('learners').select('*').order('updatedAt', { ascending: false }).limit(500);
        } else {
          query = supabase.from('learners').select(`
            *,
            skills!skills_learner_id_fkey(id,name,type,level,description,verified,enabled,approval_status,created_at,updated_at),
            projects!projects_learner_id_fkey(id,title,description,status,start_date,end_date,duration,tech_stack,demo_link,github_link,approval_status,certificate_url,video_url,ppt_url,organization,enabled,created_at,updated_at),
            certificates!certificates_learner_id_fkey(id,title,issuer,level,credential_id,link,issued_on,description,status,approval_status,document_url,enabled,created_at,updated_at),
            education!education_learner_id_fkey(id,level,degree,department,university,year_of_passing,cgpa,status,approval_status,created_at,updated_at),
            experience!experience_learner_id_fkey(id,organization,role,start_date,end_date,duration,verified,approval_status,created_at,updated_at),
            trainings!trainings_learner_id_fkey(id,title,organization,start_date,end_date,duration,description,approval_status,created_at,updated_at)
          `).order('updatedAt', { ascending: false }).range(startIndex, endIndex);
        }
        if (schoolId) query = query.eq('school_id', schoolId);
        else if (collegeId) query = query.eq('college_id', collegeId);
        else if (universityId) query = query.eq('universityId', universityId);
        if (searchTerm?.trim()) {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
        }
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-count': {
        const { schoolId, collegeId, universityId, searchTerm } = params;
        let countQuery = supabase.from('learners').select('id', { count: 'exact', head: true });
        if (schoolId) countQuery = countQuery.eq('school_id', schoolId);
        else if (collegeId) countQuery = countQuery.eq('college_id', collegeId);
        else if (universityId) countQuery = countQuery.eq('universityId', universityId);
        if (searchTerm?.trim()) {
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
        }
        const { count, error } = await countQuery;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ count: count || 0 }, context.request, { startTime });
      }

      case 'send-learner-message': {
        const { conversationId, senderId, senderType, receiverId, receiverType, messageText, subject } = params;
        if (!conversationId || !senderId || !receiverId || !messageText) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        }
        const { data, error } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: senderId,
          sender_type: senderType || 'educator',
          receiver_id: receiverId,
          receiver_type: receiverType || 'learner',
          message_text: messageText,
          subject: subject || null,
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        context.waitUntil(notifyRealtime(env as any, 'messages', 'INSERT', data));
        return apiSuccess(data, context.request, { startTime });
      }

      case 'lookup-learner-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('id').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ id: data?.id ?? null }, context.request, { startTime });
      }

      case 'fetch-user-college-lecturer': {
        const { userId: ulId } = params;
        if (!ulId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data: ulData, error: ulError } = await supabase.from('college_lecturers').select('id, collegeId, designation, user_id').eq('user_id', ulId).maybeSingle();
        if (ulError) return apiDbError(ulError, context.request, { startTime });
        return apiSuccess(ulData || null, context.request, { startTime });
      }

      case 'fetch-learner-documents': {
        const { learnerId: docLearnerId } = params;
        if (!docLearnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data: docData, error: docError } = await supabase.from('learners').select('documents').eq('id', docLearnerId).single();
        if (docError) return apiDbError(docError, context.request, { startTime });
        return apiSuccess(docData?.documents || [], context.request, { startTime });
      }

      case 'update-learner-documents': {
        const { learnerId: updLearnerId, documents } = params;
        if (!updLearnerId || !Array.isArray(documents)) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or documents array', context.request, { startTime });
        }
        const { data: updDocData, error: updDocError } = await supabase.from('learners').update({ documents }).eq('id', updLearnerId).select('documents').single();
        if (updDocError) return apiDbError(updDocError, context.request, { startTime });
        return apiSuccess(updDocData?.documents || [], context.request, { startTime });
      }

      case 'fetch-learner-exam-data': {
        const { learnerId: examLearnerId } = params;
        if (!examLearnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data: examLearner, error: examLearnerErr } = await supabase.from('learners').select('school_class_id, school_id, grade, section').eq('id', examLearnerId).single();
        if (examLearnerErr) return apiSuccess({ learner: null, timetable: [] }, context.request, { startTime });
        if (!examLearner?.school_class_id) return apiSuccess({ learner: examLearner, timetable: [] }, context.request, { startTime });
        const { data: examTimetable, error: examTTErr } = await supabase.from('exam_timetable').select('*, assessments!inner(assessment_code, type, total_marks, pass_marks, instructions, status, school_id, target_classes)').eq('school_id', examLearner.school_id).order('exam_date', { ascending: true });
        if (examTTErr) return apiDbError(examTTErr, context.request, { startTime });
        return apiSuccess({ learner: examLearner, timetable: examTimetable || [] }, context.request, { startTime });
      }

      case 'fetch-learner-result-data': {
        const { learnerId: resultLearnerId } = params;
        if (!resultLearnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const [learnerRes, markEntriesRes] = await Promise.allSettled([
          supabase.from('learners').select('school_class_id, school_id, grade, section').eq('id', resultLearnerId).single(),
          supabase.from('mark_entries').select('*, assessments!inner(id, assessment_code, type, course_name, academic_year, start_date, end_date, target_classes, status, pass_marks, school_id)').eq('learner_id', resultLearnerId),
        ]);
        const resultLearnerData = learnerRes.status === 'fulfilled' ? learnerRes.value.data : null;
        const markEntriesData = markEntriesRes.status === 'fulfilled' ? markEntriesRes.value.data : [];
        const assessmentIds = [...new Set((markEntriesData || []).map(r => r.assessment_id).filter(Boolean))];
        let timetableData: any[] = [];
        if (assessmentIds.length > 0) {
          const ttRes = await supabase.from('exam_timetable').select('assessment_id, exam_date, course_name').in('assessment_id', assessmentIds);
          timetableData = ttRes.data || [];
        }
        return apiSuccess({ learner: resultLearnerData, markEntries: markEntriesData || [], timetable: timetableData }, context.request, { startTime });
      }

      case 'fetch-learner-class-data': {
        const { learnerId: classLearnerId } = params;
        if (!classLearnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data: classLearner, error: classLearnerErr } = await supabase.from('learners').select('school_class_id, school_id').eq('id', classLearnerId).single();
        if (classLearnerErr || !classLearner) return apiSuccess({ learner: null, classmates: [], timetable: [], educatorAssignments: [] }, context.request, { startTime });
        const [classmatesRes, assignmentsRes, timetableSlotsRes] = await Promise.allSettled([
          classLearner.school_class_id ? supabase.from('learners').select('id, name, email, profilePicture').eq('school_class_id', classLearner.school_class_id) : Promise.resolve({ data: [] }),
          classLearner.school_id ? supabase.from('school_educator_class_assignments').select('*, school_educators!inner(id, user_id, name, email)').eq('school_id', classLearner.school_id) : Promise.resolve({ data: [] }),
          classLearner.school_class_id ? supabase.from('timetable_slots').select('*, school_educators!inner(id, user_id, name)').eq('class_id', classLearner.school_class_id) : Promise.resolve({ data: [] }),
        ]);
        return apiSuccess({
          learner: classLearner,
          classmates: classmatesRes.status === 'fulfilled' ? classmatesRes.value.data || [] : [],
          educatorAssignments: assignmentsRes.status === 'fulfilled' ? assignmentsRes.value.data || [] : [],
          timetableSlots: timetableSlotsRes.status === 'fulfilled' ? timetableSlotsRes.value.data || [] : [],
        }, context.request, { startTime });
      }

      case 'fetch-learner-club-event-data': {
        const { learnerId: clubLearnerId, learnerEmail } = params;
        if (!clubLearnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const [clubsRes, compRegRes, compResultRes, eventsRes, learnerLookupRes] = await Promise.allSettled([
          supabase.from('club_memberships').select('*, clubs!inner(id, name, category, description)').eq('learner_id', clubLearnerId),
          supabase.from('competition_registrations').select('*, competitions!inner(id, name, type, date, status)').eq('learner_id', clubLearnerId),
          supabase.from('competition_results').select('*, competitions!inner(id, name, type, date)').eq('learner_id', clubLearnerId),
          supabase.from('college_event_registrations').select('event_id, registered_at, attended, college_events!inner(id, title, description, event_type, start_date, end_date, venue, status, capacity, created_at)').eq('learner_id', clubLearnerId),
          learnerEmail ? supabase.from('learners').select('id').eq('email', learnerEmail).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        if (learnerEmail && learnerLookupRes.status === 'fulfilled' && learnerLookupRes.value.data) {
          const lookupLearnerId = learnerLookupRes.value.data.id;
          if (lookupLearnerId !== clubLearnerId) {
            const [extraClubsRes, extraCompRegRes, extraEventsRes] = await Promise.allSettled([
              supabase.from('competition_registrations').select('*, competitions!inner(id, name, type, date, status)').eq('learner_id', lookupLearnerId),
              supabase.from('college_event_registrations').select('event_id, registered_at, attended, college_events!inner(id, title, description, event_type, start_date, end_date, venue, status, organizer, max_participants, created_at)').eq('learner_id', lookupLearnerId),
            ]);
            const extraCompReg = extraCompRegRes.status === 'fulfilled' ? extraCompRegRes.value.data || [] : [];
            const compRegData = compRegRes.status === 'fulfilled' ? compRegRes.value.data || [] : [];
            const mergedCompReg = [...compRegData, ...extraCompReg];
          }
        }
        return apiSuccess({
          clubs: clubsRes.status === 'fulfilled' ? clubsRes.value.data || [] : [],
          competitions: compRegRes.status === 'fulfilled' ? compRegRes.value.data || [] : [],
          competitionResults: compResultRes.status === 'fulfilled' ? compResultRes.value.data || [] : [],
          events: eventsRes.status === 'fulfilled' ? eventsRes.value.data || [] : [],
        }, context.request, { startTime });
      }

      case 'fetch-enrolled-learner-list': {
        const { collegeId, departmentId, programId, semester, search, page, pageSize } = params;
        let query = supabase.from('learners').select('id, name, roll_number, email, contact_number, college_id, program_id, semester, section, enrollmentDate, created_at, updated_at, programs!learners_program_id_fkey(id, name, code, department_id, departments!programs_department_id_fkey(id, name, code))').eq('is_deleted', false).not('program_id', 'is', null).order('name', { ascending: true });
        if (collegeId) query = query.eq('college_id', collegeId);
        if (programId) query = query.eq('program_id', programId);
        if (semester) query = query.eq('semester', semester);
        if (search?.trim()) query = query.or(`name.ilike.%${search}%,roll_number.ilike.%${search}%,email.ilike.%${search}%`);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const transformed = (data || []).map((l: any) => ({
          learner_id: l.id, learner_name: l.name, roll_number: l.roll_number, email: l.email, contact_number: l.contact_number,
          college_id: l.college_id, department_id: l.programs?.department_id || '', department_name: l.programs?.departments?.name || 'N/A',
          department_code: l.programs?.departments?.code || '', program_id: l.program_id, program_name: l.programs?.name || 'N/A',
          program_code: l.programs?.code || '', section: l.section || 'Not Assigned', semester: l.semester || 1,
          enrollment_date: l.enrollmentDate || l.created_at, created_at: l.created_at, updated_at: l.updated_at,
        }));
        let filtered = transformed;
        if (departmentId) filtered = transformed.filter((s: any) => s.department_id === departmentId);
        return apiSuccess(filtered, context.request, { startTime });
      }

      case 'get-institutions': {
        const queries: Record<string, any> = [
          { key: 'schools', table: 'organizations', select: 'id, name, city, state, code', filters: { organization_type: 'school', account_status: ['active', 'pending'] }, order: 'name' },
          { key: 'colleges', table: 'organizations', select: 'id, name, city, state, code', filters: { organization_type: 'college', account_status: ['active', 'pending'] }, order: 'name' },
          { key: 'universities', table: 'organizations', select: 'id, name, city, state, code', filters: { organization_type: 'university', account_status: ['active', 'pending'] }, order: 'name' },
          { key: 'universityColleges', table: 'university_colleges', select: 'id, name, code, university_id', order: 'name' },
          { key: 'departments', table: 'departments', select: 'id, name, code, college_id', order: 'name' },
          { key: 'programs', table: 'programs', select: 'id, name, code, degree_level, department_id', order: 'name' },
          { key: 'schoolClasses', table: 'school_classes', select: 'id, name, grade, section, school_id', order: ['grade', 'section'] },
          { key: 'programSections', table: 'program_sections', select: 'id, program_id, semester, section', order: ['semester', 'section'] },
        ];

        const results: Record<string, any[]> = {};
        for (const q of queries) {
          let query = supabase.from(q.table).select(q.select);
          if (q.filters) {
            for (const [k, v] of Object.entries(q.filters)) {
              if (Array.isArray(v)) query = query.in(k, v);
              else query = query.eq(k, v);
            }
          }
          const orderArr = Array.isArray(q.order) ? q.order : [q.order];
          for (const o of orderArr) query = query.order(o);
          const { data } = await query;
          results[q.key] = data || [];
        }

        return apiSuccess(results, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[learner-profile/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
