import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const supabase = getServiceClient(context.env);
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;
  try {
    switch (action) {
      // --- Shared / Init ---
      case 'initUser': return handleInitUser(supabase, context, body);
      case 'fetchSchoolId': return handleFetchSchoolId(supabase, context, body);
      case 'findClassId': return handleFindClassId(supabase, context, body);

      // --- Dashboard ---
      case 'fetchDashboardData': return handleFetchDashboardData(supabase, context, body);

      // --- Class Management ---
      case 'fetchClasses': return handleFetchClasses(supabase, context, body);
      case 'fetchEducators': return handleFetchEducators(supabase, context, body);
      case 'fetchLearners': return handleFetchLearners(supabase, context, body);
      case 'createClass': return handleCreateClass(supabase, context, body);
      case 'updateClass': return handleUpdateClass(supabase, context, body);
      case 'deleteClass': return handleDeleteClass(supabase, context, body);

      // --- Courses ---
      case 'fetchCourses': return handleFetchCourses(supabase, context, body);
      case 'deleteCourse': return handleDeleteCourse(supabase, context, body);
      case 'updateCourseEducator': return handleUpdateCourseEducator(supabase, context, body);

      // --- Assessment Results ---
      case 'fetchAssessmentResults': return handleFetchAssessmentResults(supabase, context, body);
      case 'testConnection': return handleTestConnection(supabase, context, body);

      // --- Attendance Reports ---
      case 'fetchAttendance': return handleFetchAttendance(supabase, context, body);
      case 'fetchAttendanceLearners': return handleFetchAttendanceLearners(supabase, context, body);

      // --- Browse Courses ---
      case 'fetchBrowseCourses': return handleFetchBrowseCourses(supabase, context, body);

      // --- Learner Reports ---
      case 'fetchLearnerReports': return handleFetchLearnerReports(supabase, context, body);

      // --- Lesson Plan Approvals ---
      case 'fetchPendingLessonPlans': return handleFetchPendingLessonPlans(supabase, context, body);
      case 'approveLessonPlan': return handleApproveLessonPlan(supabase, context, body);
      case 'rejectLessonPlan': return handleRejectLessonPlan(supabase, context, body);
      case 'requestLessonPlanRevision': return handleRequestLessonPlanRevision(supabase, context, body);

      // --- Library ---
      case 'fetchLibraryData': return handleFetchLibraryData(supabase, context, body);
      case 'getLibraryCategories': return handleGetLibraryCategories(supabase, context, body);
      case 'addLibraryBook': return handleAddLibraryBook(supabase, context, body);
      case 'updateLibraryBook': return handleUpdateLibraryBook(supabase, context, body);
      case 'deleteLibraryBook': return handleDeleteLibraryBook(supabase, context, body);
      case 'getLibraryHistory': return handleGetLibraryHistory(supabase, context, body);
      case 'getOverdueBooks': return handleGetOverdueBooks(supabase, context, body);
      case 'issueBook': return handleIssueBook(supabase, context, body);
      case 'renewBook': return handleRenewBook(supabase, context, body);
      case 'returnBook': return handleReturnBook(supabase, context, body);
      case 'markBookOverdue': return handleMarkBookOverdue(supabase, context, body);

      // --- Skill Badges ---
      case 'fetchSkillBadges': return handleFetchSkillBadges(supabase, context, body);
      case 'getCompetitionRegistrations': return handleGetCompetitionRegistrations(supabase, context, body);
      case 'getCompetitionResults': return handleGetCompetitionResults(supabase, context, body);
      case 'saveCompetitionResults': return handleSaveCompetitionResults(supabase, context, body);
      case 'updateCompetitionStatus': return handleUpdateCompetitionStatus(supabase, context, body);
      case 'saveCertificates': return handleSaveCertificates(supabase, context, body);
      case 'deleteCertificate': return handleDeleteCertificate(supabase, context, body);
      case 'getEducatorAndSchool': return handleGetEducatorAndSchool(supabase, context, body);
      case 'getCurricularLearners': return handleGetCurricularLearners(supabase, context, body);
      case 'saveSkillBadgeCerts': return handleSaveSkillBadgeCerts(supabase, context, body);

      // --- Skill Curricular ---
      case 'fetchSkillCurricular': return handleFetchSkillCurricular(supabase, context, body);

      // --- Educator / Learner Communication (school_id lookup) ---
      case 'fetchCommunicationSchoolData': return handleFetchCommunicationSchoolData(supabase, context, body);
      case 'fetchActiveLearnerConversations': return handleFetchActiveLearnerConversations(supabase, context, body);
      case 'fetchArchivedLearnerConversations': return handleFetchArchivedLearnerConversations(supabase, context, body);
      case 'fetchActiveEducatorConversations': return handleFetchActiveEducatorConversations(supabase, context, body);
      case 'fetchArchivedEducatorConversations': return handleFetchArchivedEducatorConversations(supabase, context, body);
      case 'getEducatorUserId': return handleGetEducatorUserId(supabase, context, body);

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error) {
    console.error('[SchoolAdmin/Actions] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
});

// ──────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────

async function handleInitUser(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  const result: any = { userId: user.id };

  // §7.3 fix (task 12.1): authorize from the verified JWT roles (canonical SSO
  // source) instead of the app-DB shadow `users.role` column. `school_admin` is
  // a canonical SSO role, so this is a JWT-role authorization read.
  result.isSchoolAdmin = user.roles.includes('school_admin');

  const { data: educator } = await supabase.from('school_educators').select('id, school_id').eq('user_id', user.id).maybeSingle();
  if (educator) {
    result.educatorData = educator;
  } else {
    const { data: org } = await supabase.from('organizations').select('id').eq('organization_type', 'school').or(`admin_id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
    if (org?.id) {
      result.educatorData = { id: user.id, school_id: org.id };
    }
  }

  return apiSuccess(result, context.request);
}

async function handleFetchSchoolId(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  let schoolId: string | null = null;

  // §7.8 fix (task 12.1): do NOT trust the client-supplied stored-user role.
  // The school_admin authorization decision now comes from the verified JWT
  // roles only. (Residual: the client-hinted schoolId is still honored for a
  // JWT-verified school_admin — flagged for review, not part of §7.8.)
  const storedUser = body.storedUser;
  if (storedUser && user.roles.includes('school_admin')) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.schoolId) {
        return apiSuccess({ schoolId: parsed.schoolId }, context.request);
      }
    } catch { /* ignore */ }
  }

  const { data: educator } = await supabase.from('school_educators').select('school_id').eq('user_id', user.id).maybeSingle();
  if (educator?.school_id) {
    schoolId = educator.school_id;
  } else {
    const { data: org } = await supabase.from('organizations').select('id').eq('organization_type', 'school').or(`admin_id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
    schoolId = org?.id || null;
  }

  return apiSuccess({ schoolId }, context.request);
}

async function handleFindClassId(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, grade, academicYear } = body;
  let classData: any = null;

  if (schoolId) {
    const { data } = await supabase.from('school_classes').select('id').eq('school_id', schoolId).eq('grade', grade).eq('academic_year', academicYear).limit(1);
    classData = data?.[0] || null;
  }

  if (!classData) {
    const { data } = await supabase.from('school_classes').select('id, school_id').eq('grade', grade).eq('academic_year', academicYear).limit(1);
    classData = data?.[0] || null;
  }

  return apiSuccess({ classId: classData?.id || null, schoolId: classData?.school_id || schoolId }, context.request);
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

async function handleFetchDashboardData(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data: coursesData } = await supabase.from('courses').select('course_id, title, category, duration, status, created_at, enrollment_count').eq('school_id', schoolId).order('created_at', { ascending: false });

  const courseIds = (coursesData || []).map((c: any) => c.course_id).filter(Boolean);
  let enrollmentsData: any[] = [];
  if (courseIds.length > 0) {
    const { data: ed } = await supabase.from('course_enrollments').select('course_id, learner_id, learner_name, status, progress, enrolled_at, last_accessed').in('course_id', courseIds).order('enrolled_at', { ascending: false });
    enrollmentsData = ed || [];
  }

  const { data: attendanceData } = await supabase.from('attendance_records').select('learner_id, status, date, created_at').eq('school_id', schoolId).gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).order('created_at', { ascending: false }).limit(10);

  const { data: learnersData } = await supabase.from('learners').select('id, name, created_at, grade, section').eq('school_id', schoolId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false }).limit(5);

  return apiSuccess({ courses: coursesData || [], enrollments: enrollmentsData, attendance: attendanceData || [], learners: learnersData || [] }, context.request);
}

// ──────────────────────────────────────────────
// Class Management
// ──────────────────────────────────────────────

async function handleFetchClasses(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('school_classes').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
  if (error) throw error;

  const enriched = await Promise.all((data || []).map(async (cls: any) => {
    const { data: classlearners } = await supabase.from('learners').select('id, name, email, updated_at').eq('school_class_id', cls.id).eq('is_deleted', false);
    const learnerCount = classlearners?.length || 0;
    if (cls.current_learners !== learnerCount) {
      await supabase.from('school_classes').update({ current_learners: learnerCount }).eq('id', cls.id);
    }
    const meta = cls.metadata || {};
    return { ...cls, current_learners: learnerCount, learners: classlearners || [], avg_progress: 0, performance_band: 'N/A', skillAreas: meta.skillAreas || [], educator: meta.educator || '', educatorEmail: meta.educatorEmail || '' };
  }));

  return apiSuccess(enriched, context.request);
}

async function handleFetchEducators(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('school_educators').select('id, first_name, last_name, email').eq('school_id', schoolId).eq('account_status', 'active');
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleFetchLearners(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('learners').select('id, name, email, school_class_id, roll_number, grade, section, contactNumber').eq('school_id', schoolId).eq('is_deleted', false);
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleCreateClass(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, name, grade, section, academicYear, maxLearners, skills } = body;
  if (!schoolId || !name || !grade || !section || !academicYear) {
    return apiError(400, 'VALIDATION_ERROR', 'schoolId, name, grade, section, academicYear are required', context.request);
  }

  const { data, error } = await supabase.from('school_classes').insert([{ school_id: schoolId, name, grade, section, academic_year: academicYear, max_learners: maxLearners || 40, current_learners: 0, account_status: 'active', metadata: { skillAreas: skills || [] } }]).select();
  if (error) throw error;
  return apiSuccess(data, context.request);
}

async function handleUpdateClass(supabase: any, context: AuthenticatedContext, body: any) {
  const { id, name, grade, section, academicYear, maxLearners, skills } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const updateData: any = { name, grade, section, academic_year: academicYear, max_learners: maxLearners, updated_at: new Date().toISOString() };
  if (skills !== undefined) {
    updateData.metadata = { skillAreas: skills };
  }

  const { error } = await supabase.from('school_classes').update(updateData).eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleDeleteClass(supabase: any, context: AuthenticatedContext, body: any) {
  const { id } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id is required', context.request);

  const { error } = await supabase.from('school_classes').delete().eq('id', id);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

// ──────────────────────────────────────────────
// Courses
// ──────────────────────────────────────────────

async function handleFetchCourses(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;

  let query = supabase.from('courses').select('*');
  if (schoolId) query = query.eq('school_id', schoolId);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleDeleteCourse(supabase: any, context: AuthenticatedContext, body: any) {
  const { courseId } = body;
  if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'courseId is required', context.request);

  const { error } = await supabase.from('courses').update({ deleted_at: new Date().toISOString() }).eq('course_id', courseId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleUpdateCourseEducator(supabase: any, context: AuthenticatedContext, body: any) {
  const { courseId, educatorId, educatorName } = body;
  if (!courseId || !educatorId) return apiError(400, 'VALIDATION_ERROR', 'courseId and educatorId are required', context.request);
  const { error } = await supabase.from('courses').update({ educator_id: educatorId, educator_name: educatorName, updated_at: new Date().toISOString() }).eq('course_id', courseId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

// ──────────────────────────────────────────────
// Assessment Results
// ──────────────────────────────────────────────

async function handleFetchAssessmentResults(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  const userEmail = user.email;
  if (!userEmail) return apiError(400, 'VALIDATION_ERROR', 'User email not found', context.request);

  const { data: org, error: orgError } = await supabase.from('organizations').select('id, name').eq('organization_type', 'school').ilike('email', userEmail).maybeSingle();
  if (orgError) throw orgError;
  if (!org) return apiSuccess({ schoolName: '', results: [] }, context.request);

  const { data: learnersData } = await supabase.from('learners').select('user_id, name, email, enrollmentNumber, grade, program_id, programs(id, name)').eq('school_id', org.id);

  if (!learnersData || learnersData.length === 0) return apiSuccess({ schoolName: org.name, results: [] }, context.request);

  const validlearners = learnersData.filter((s: any) => s.user_id != null);
  if (validlearners.length === 0) return apiSuccess({ schoolName: org.name, results: [] }, context.request);

  const learnerIds = validlearners.map((s: any) => s.user_id);
  const learnerMap = new Map(validlearners.map((s: any) => [s.user_id, s]));

  const { data: results, error: fetchError } = await supabase.from('personal_assessment_results').select('id, learner_id, stream_id, riasec_code, riasec_scores, aptitude_overall, aptitude_scores, employability_readiness, knowledge_score, status, created_at, career_fit, skill_gap, gemini_results, overall_summary, platform_courses, roadmap, profile_snapshot, personal_assessment_streams(name)').in('learner_id', learnerIds).order('created_at', { ascending: false });
  if (fetchError) throw fetchError;

  const enriched = (results || []).map((r: any) => {
    const learner = learnerMap.get(r.learner_id);
    const prog = learner?.programs;
    const progName = Array.isArray(prog) ? (prog[0]?.name || null) : (prog?.name || null);
    const streamName = r.personal_assessment_streams ? (Array.isArray(r.personal_assessment_streams) ? r.personal_assessment_streams[0]?.name : r.personal_assessment_streams.name) : null;
    return { ...r, learner_name: learner?.name || null, learner_email: learner?.email || null, school_id: org.id, school_name: org.name, enrollmentNumber: learner?.enrollmentNumber || null, learner_grade: learner?.grade || null, program_id: learner?.program_id || null, program_name: progName, stream_name: streamName };
  });

  return apiSuccess({ schoolName: org.name, results: enriched }, context.request);
}

async function handleTestConnection(supabase: any, context: AuthenticatedContext, body: any) {
  const { data } = await supabase.from('organizations').select('count').limit(1);
  return apiSuccess({ connected: !!data }, context.request);
}

// ──────────────────────────────────────────────
// Attendance Reports
// ──────────────────────────────────────────────

async function handleFetchAttendance(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const safeStartDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data, error } = await supabase.from('attendance_records').select('*').eq('school_id', schoolId).gte('date', safeStartDate).order('date', { ascending: false });
  if (error) throw error;

  const { data: learnersData } = await supabase.from('learners').select('id, name, roll_number, grade, section').eq('school_id', schoolId);

  const learnerMap = new Map();
  (learnersData || []).forEach((s: any) => learnerMap.set(s.id, s));

  const records = (data || []).map((record: any) => {
    const learner = learnerMap.get(record.learner_id);
    return { id: record.id, learnerId: record.learner_id, learnerName: learner?.name || 'Unknown', rollNumber: learner?.roll_number || 'N/A', class: learner?.grade || 'N/A', section: learner?.section || 'N/A', date: record.date, status: record.status, timeIn: record.time_in, timeOut: record.time_out, remarks: record.remarks, teacher: 'Teacher', source: record.mode || 'manual' };
  });

  return apiSuccess(records, context.request);
}

async function handleFetchAttendanceLearners(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase.from('learners').select('id, roll_number, name, grade, section, email, contactNumber').eq('school_id', schoolId);
  if (error) throw error;

  const learners = (data || []).map((s: any) => ({ id: s.id, rollNumber: s.roll_number || 'N/A', name: s.name, class: s.grade || 'N/A', section: s.section || 'N/A', email: s.email, phone: s.contactNumber || 'N/A' }));
  return apiSuccess(learners, context.request);
}

// ──────────────────────────────────────────────
// Browse Courses
// ──────────────────────────────────────────────

async function handleFetchBrowseCourses(supabase: any, context: AuthenticatedContext, body: any) {
  const { data, error } = await supabase.from('courses').select('*').in('status', ['Active', 'Upcoming']).is('deleted_at', null).order('created_at', { ascending: false });
  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

// ──────────────────────────────────────────────
// Learner Reports
// ──────────────────────────────────────────────

async function handleFetchLearnerReports(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data: learnersData, error: learnersError } = await supabase.from('learners').select('id, name, roll_number, grade, section, extended:learner_management_records(enrollment_number)').eq('school_id', schoolId);
  if (learnersError) throw learnersError;

  const enriched = await Promise.all((learnersData || []).map(async (learner: any) => {
    const { data: assessments } = await supabase.from('skill_assessments').select('score, max_score').eq('learner_id', learner.id).eq('school_id', schoolId);
    const avgScore = assessments && assessments.length > 0 ? assessments.reduce((sum: number, a: any) => sum + (a.score / a.max_score * 100), 0) / assessments.length : 0;
    return { id: learner.id, name: learner.name, rollNumber: learner.roll_number || 'N/A', class: learner.grade || 'N/A', section: learner.section || 'N/A', enrollmentNumber: learner.extended?.enrollment_number || 'N/A', assessmentCount: assessments?.length || 0, averageScore: avgScore };
  }));

  return apiSuccess(enriched, context.request);
}

// ──────────────────────────────────────────────
// Lesson Plan Approvals
// ──────────────────────────────────────────────

async function handleFetchPendingLessonPlans(supabase: any, context: AuthenticatedContext, body: any) {
  const { data, error } = await supabase.from('lesson_plans').select('*, teachers!inner(first_name, last_name)').in('status', ['submitted', 'revision_required']).order('submitted_at', { ascending: true });
  if (error) throw error;

  const formatted = (data || []).map((lp: any) => ({ ...lp, teacher_name: `${lp.teachers.first_name} ${lp.teachers.last_name}` }));
  return apiSuccess(formatted, context.request);
}

async function handleApproveLessonPlan(supabase: any, context: AuthenticatedContext, body: any) {
  const { planId, reviewComments } = body;
  const user = getContextUser(context);
  if (!planId) return apiError(400, 'VALIDATION_ERROR', 'planId is required', context.request);

  const { error } = await supabase.from('lesson_plans').update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_comments: reviewComments || 'Approved' }).eq('id', planId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleRejectLessonPlan(supabase: any, context: AuthenticatedContext, body: any) {
  const { planId, reviewComments } = body;
  const user = getContextUser(context);
  if (!planId) return apiError(400, 'VALIDATION_ERROR', 'planId is required', context.request);
  if (!reviewComments?.trim()) return apiError(400, 'VALIDATION_ERROR', 'reviewComments required for rejection', context.request);

  const { error } = await supabase.from('lesson_plans').update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_comments: reviewComments }).eq('id', planId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleRequestLessonPlanRevision(supabase: any, context: AuthenticatedContext, body: any) {
  const { planId, reviewComments } = body;
  const user = getContextUser(context);
  if (!planId) return apiError(400, 'VALIDATION_ERROR', 'planId is required', context.request);
  if (!reviewComments?.trim()) return apiError(400, 'VALIDATION_ERROR', 'reviewComments required for revision', context.request);

  const { error } = await supabase.from('lesson_plans').update({ status: 'revision_required', reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_comments: reviewComments }).eq('id', planId);
  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

// ──────────────────────────────────────────────
// Library
// ──────────────────────────────────────────────

async function handleFetchLibraryData(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data: booksData } = await supabase.from('books').select('id, title, author, isbn, category, total_copies, available_copies, shelf_location, created_at').eq('school_id', schoolId).order('created_at', { ascending: false });

  const { data: issuesData } = await supabase.from('book_issues').select('id, book_id, learner_id, issue_date, due_date, return_date, status').eq('school_id', schoolId).order('issue_date', { ascending: false });

  const { data: statsData } = await supabase.from('library_stats').select('*').eq('school_id', schoolId).maybeSingle();

  const { data: categoriesData } = await supabase.from('book_categories').select('*').eq('school_id', schoolId).eq('is_active', true);

  return apiSuccess({ books: booksData || [], issues: issuesData || [], stats: statsData || null, categories: categoriesData || [] }, context.request);
}

// ──────────────────────────────────────────────
// Skill Badges
// ──────────────────────────────────────────────

async function handleFetchSkillBadges(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data: compsData } = await supabase.from('skill_competitions').select('id, name, category, level, date, status, participant_count').eq('school_id', schoolId).order('date', { ascending: false });

  const { count: certCount } = await supabase.from('skill_certificates').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);

  const { data: certsData } = await supabase.from('skill_certificates').select('id, learner_id, badge_name, issue_date, expiry_date, status, credential_url').eq('school_id', schoolId).order('issue_date', { ascending: false });

  const { data: registrations } = await supabase.from('skill_registrations').select('id, learner_id, competition_id, status, registered_at').eq('school_id', schoolId).order('registered_at', { ascending: false });

  const { data: existingResults } = await supabase.from('skill_results').select('competition_id, learner_id').eq('school_id', schoolId);

  const { data: competitionCerts } = await supabase.from('skill_certificates').select('id, learner_id, badge_name, issue_date').eq('school_id', schoolId).eq('type', 'competition');

  return apiSuccess({ competitions: compsData || [], certCount: certCount || 0, certificates: certsData || [], registrations: registrations || [], existingResults: existingResults || [], competitionCerts: competitionCerts || [] }, context.request);
}

async function handleSaveSkillBadgeCerts(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  const { schoolId, certs } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  // Delete existing certs, then insert new ones
  const { error: delError } = await supabase.from('skill_certificates').delete().eq('school_id', schoolId).eq('type', 'competition');
  if (delError) throw delError;

  if (certs && certs.length > 0) {
    const { data: inserted } = await supabase.from('skill_certificates').insert(certs.map((c: any) => ({ ...c, school_id: schoolId, created_by: user.id, updated_by: user.id }))).select();
    return apiSuccess(inserted || [], context.request);
  }

  return apiSuccess([], context.request);
}

// ──────────────────────────────────────────────
// Skill Curricular
// ──────────────────────────────────────────────

async function handleFetchSkillCurricular(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data: skillData, error } = await supabase.from('skill_curriculums').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
  if (error) throw error;

  return apiSuccess(skillData || [], context.request);
}

// ──────────────────────────────────────────────
// Communication School Data
// ──────────────────────────────────────────────

async function handleFetchCommunicationSchoolData(supabase: any, context: AuthenticatedContext, body: any) {
  const user = getContextUser(context);
  let schoolId: string | null = null;

  // FINALIZED in P4 task 22.3: this is a DATA-SCOPE read, NOT an authorization use of
  // `school_educators.role`. It resolves the current user's `school_id` (a COLUMN that
  // `resolveSchoolRole` does not return), and the `role = 'school_admin'` clause is a query
  // FILTER selecting the school-admin educator record — not a permission lookup against
  // `college_role_module_permissions`. Authorization for this endpoint is enforced separately
  // from the verified JWT. Preserved as-is (converting would change which `school_id` resolves).
  const { data: educator } = await supabase.from('school_educators').select('school_id').eq('user_id', user.id).eq('role', 'school_admin').maybeSingle();
  if (educator?.school_id) {
    schoolId = educator.school_id;
  } else {
    const { data: org } = await supabase.from('organizations').select('id').eq('organization_type', 'school').or(`admin_id.eq.${user.id},email.eq.${user.email}`).maybeSingle();
    schoolId = org?.id || null;
  }

  return apiSuccess({ schoolId }, context.request);
}

// ──────────────────────────────────────────────
// Learner / Educator Conversations
// ──────────────────────────────────────────────

async function handleFetchActiveLearnerConversations(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      learner:learners(id, name, email, school_id, university, branch_field)
    `)
    .eq('school_id', schoolId)
    .eq('conversation_type', 'learner_admin')
    .eq('deleted_by_admin', false)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleFetchArchivedLearnerConversations(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      learner:learners(id, name, email, school_id, university, branch_field)
    `)
    .eq('school_id', schoolId)
    .eq('conversation_type', 'learner_admin')
    .eq('status', 'archived')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleFetchActiveEducatorConversations(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  // Get conversations
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('school_id', schoolId)
    .eq('conversation_type', 'educator_admin')
    .eq('deleted_by_admin', false)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  if (!conversations || conversations.length === 0) {
    return apiSuccess([], context.request);
  }

  // Get educator IDs and fetch their details
  const educatorIds = conversations.map((c: any) => c.educator_id).filter(Boolean);
  if (educatorIds.length === 0) {
    return apiSuccess(conversations, context.request);
  }

  const { data: educators, error: educatorError } = await supabase
    .from('school_educators')
    .select('id, first_name, last_name, email, phone_number, photo_url, user_id')
    .in('id', educatorIds);

  if (educatorError) throw educatorError;

  // Merge the data
  const conversationsWithEducators = conversations.map((conv: any) => ({
    ...conv,
    school_educators: educators?.find((edu: any) => edu.id === conv.educator_id) || null
  }));

  return apiSuccess(conversationsWithEducators, context.request);
}

async function handleFetchArchivedEducatorConversations(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  // Get conversations
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('school_id', schoolId)
    .eq('conversation_type', 'educator_admin')
    .eq('status', 'archived')
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  if (!conversations || conversations.length === 0) {
    return apiSuccess([], context.request);
  }

  // Get educator IDs and fetch their details
  const educatorIds = conversations.map((c: any) => c.educator_id).filter(Boolean);
  if (educatorIds.length === 0) {
    return apiSuccess(conversations, context.request);
  }

  const { data: educators, error: educatorError } = await supabase
    .from('school_educators')
    .select('id, first_name, last_name, email, phone_number, photo_url, user_id')
    .in('id', educatorIds);

  if (educatorError) throw educatorError;

  // Merge the data
  const conversationsWithEducators = conversations.map((conv: any) => ({
    ...conv,
    school_educators: educators?.find((edu: any) => edu.id === conv.educator_id) || null
  }));

  return apiSuccess(conversationsWithEducators, context.request);
}

async function handleGetEducatorUserId(supabase: any, context: AuthenticatedContext, body: any) {
  const { educatorId } = body;
  if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'educatorId is required', context.request);

  const { data: educator, error } = await supabase
    .from('school_educators')
    .select('user_id')
    .eq('id', educatorId)
    .maybeSingle();

  if (error) throw error;
  return apiSuccess({ user_id: educator?.user_id || null }, context.request);
}

// ──────────────────────────────────────────────
// Library Management
// ──────────────────────────────────────────────

async function handleGetLibraryCategories(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('library_categories_school')
    .select('*')
    .eq('school_id', schoolId)
    .order('name');

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleAddLibraryBook(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, bookData } = body;
  if (!schoolId || !bookData) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('library_books_school')
    .insert({
      ...bookData,
      school_id: schoolId,
      available_copies: bookData.total_copies
    })
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

async function handleUpdateLibraryBook(supabase: any, context: AuthenticatedContext, body: any) {
  const { bookId, schoolId, bookData } = body;
  if (!bookId || !schoolId || !bookData) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('library_books_school')
    .update(bookData)
    .eq('id', bookId)
    .eq('school_id', schoolId)
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

async function handleDeleteLibraryBook(supabase: any, context: AuthenticatedContext, body: any) {
  const { bookId, schoolId } = body;
  if (!bookId || !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { error } = await supabase
    .from('library_books_school')
    .delete()
    .eq('id', bookId)
    .eq('school_id', schoolId);

  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

async function handleGetLibraryHistory(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('library_book_issues_school')
    .select('*')
    .eq('school_id', schoolId)
    .order('issued_date', { ascending: false });

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleGetOverdueBooks(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('library_book_issues_school')
    .select('*')
    .eq('school_id', schoolId)
    .lt('due_date', new Date().toISOString())
    .is('return_date', null)
    .order('due_date');

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleIssueBook(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, issueData } = body;
  if (!schoolId || !issueData) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('library_book_issues_school')
    .insert({
      ...issueData,
      school_id: schoolId
    })
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

async function handleRenewBook(supabase: any, context: AuthenticatedContext, body: any) {
  const { issueId, schoolId, newDueDate } = body;
  if (!issueId || !schoolId || !newDueDate) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('library_book_issues_school')
    .update({ due_date: newDueDate })
    .eq('id', issueId)
    .eq('school_id', schoolId)
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

async function handleReturnBook(supabase: any, context: AuthenticatedContext, body: any) {
  const { issueId, schoolId, returnDate } = body;
  if (!issueId || !schoolId || !returnDate) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('library_book_issues_school')
    .update({
      return_date: returnDate,
      status: 'returned'
    })
    .eq('id', issueId)
    .eq('school_id', schoolId)
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

async function handleMarkBookOverdue(supabase: any, context: AuthenticatedContext, body: any) {
  const { issueId, schoolId, fineAmount } = body;
  if (!issueId || !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('library_book_issues_school')
    .update({
      status: 'overdue',
      fine_amount: fineAmount || 0
    })
    .eq('id', issueId)
    .eq('school_id', schoolId)
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

// ──────────────────────────────────────────────
// Skill Badges - Competition Management
// ──────────────────────────────────────────────

async function handleGetCompetitionRegistrations(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, competitionId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('competition_registrations')
    .select('*')
    .eq('school_id', schoolId)
    .eq('competition_id', competitionId || null)
    .order('registered_at', { ascending: false });

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleGetCompetitionResults(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, competitionId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('competition_results')
    .select('*')
    .eq('school_id', schoolId)
    .eq('competition_id', competitionId || null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleSaveCompetitionResults(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, competitionId, results } = body;
  if (!schoolId || !competitionId || !results) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const resultsData = results.map((r: any) => ({
    ...r,
    school_id: schoolId,
    competition_id: competitionId
  }));

  const { data, error } = await supabase
    .from('competition_results')
    .upsert(resultsData, { onConflict: 'id' })
    .select();

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleUpdateCompetitionStatus(supabase: any, context: AuthenticatedContext, body: any) {
  const { competitionId, schoolId, status } = body;
  if (!competitionId || !schoolId || !status) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data, error } = await supabase
    .from('competitions')
    .update({ status })
    .eq('id', competitionId)
    .eq('school_id', schoolId)
    .select();

  if (error) throw error;
  return apiSuccess(data?.[0] || {}, context.request);
}

async function handleSaveCertificates(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId, certs } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const certsData = (certs || []).map((c: any) => ({
    ...c,
    school_id: schoolId
  }));

  const { data, error } = await supabase
    .from('club_certificates')
    .upsert(certsData, { onConflict: 'id' })
    .select();

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}

async function handleDeleteCertificate(supabase: any, context: AuthenticatedContext, body: any) {
  const { certId, schoolId } = body;
  if (!certId || !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { error } = await supabase
    .from('club_certificates')
    .delete()
    .eq('id', certId)
    .eq('school_id', schoolId);

  if (error) throw error;
  return apiSuccess({ success: true }, context.request);
}

// ──────────────────────────────────────────────
// Skill Curricular - Additional handlers
// ──────────────────────────────────────────────

async function handleGetEducatorAndSchool(supabase: any, context: AuthenticatedContext, body: any) {
  const { educatorId, schoolId } = body;
  if (!educatorId || !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

  const { data: educatorData } = await supabase
    .from('school_educators')
    .select('*')
    .eq('id', educatorId)
    .eq('school_id', schoolId)
    .single();

  const { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', schoolId)
    .single();

  return apiSuccess({ educator: educatorData, school: orgData }, context.request);
}

async function handleGetCurricularLearners(supabase: any, context: AuthenticatedContext, body: any) {
  const { schoolId } = body;
  if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId is required', context.request);

  const { data, error } = await supabase
    .from('learners')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_deleted', false)
    .order('name');

  if (error) throw error;
  return apiSuccess(data || [], context.request);
}
