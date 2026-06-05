import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';
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

      // ==================== TEACHER SERVICE ====================
      case 'getTeachers': {
        const { schoolId } = params;
        const { data, error } = await supabase.from('school_educators').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getTeacherById': {
        const { teacherId } = params;
        const { data, error } = await supabase.from('school_educators').select('*').eq('id', teacherId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'createTeacher': {
        const { teacherData } = params;
        const { data, error } = await supabase.from('school_educators').insert(teacherData).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'updateTeacher': {
        const { teacherId, updates } = params;
        const { data, error } = await supabase.from('school_educators').update(updates).eq('id', teacherId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'bulkImportTeachers': {
        const { teachers } = params;
        const { data, error } = await supabase.from('school_educators').insert(teachers).select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'deleteTeacher': {
        const { teacherId } = params;
        const { error } = await supabase.from('school_educators').delete().eq('id', teacherId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'getTeacherPerformance': {
        const { teacherId } = params;
        const [classes, lessonPlans, assignments, learners] = await Promise.all([
          supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', teacherId),
          supabase.from('lesson_plans').select('id').eq('teacher_id', teacherId),
          supabase.from('assignments').select('id').eq('teacher_id', teacherId),
          supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', teacherId),
        ]);
        if (classes.error) return apiDbError(classes.error, context.request, { startTime });
        return apiSuccess({
          teacher_id: teacherId,
          classes_taught: classes.data?.length || 0,
          learners_count: learners.data?.length || 0,
          lesson_plans_created: lessonPlans.data?.length || 0,
          assignments_created: assignments.data?.length || 0,
          average_learner_performance: 0,
          attendance_rate: 0,
        }, context.request, { startTime });
      }

      case 'getTeacherWorkload': {
        const { teacherId } = params;
        const { data, error } = await supabase.from('teacher_workload').select('*').eq('teacher_id', teacherId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getTeacherTimetable': {
        const { teacherId } = params;
        const { data, error } = await supabase.from('timetable_slots').select(`*, timetables (*, school_classes (*))`).eq('teacher_id', teacherId).order('day_of_week').order('start_time');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'searchTeachers': {
        const { schoolId, query } = params;
        const { data, error } = await supabase.from('school_educators').select('*').eq('school_id', schoolId).or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,teacher_id.ilike.%${query}%`).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getTeacherStatistics': {
        const { schoolId } = params;
        const { data: teachers, error } = await supabase.from('school_educators').select('onboarding_status, role').eq('school_id', schoolId);
        if (error) return apiDbError(error, context.request, { startTime });
        if (!teachers) return apiSuccess(null, context.request, { startTime });
        const stats = {
          total: teachers.length,
          active: teachers.filter(t => t.onboarding_status === 'active').length,
          pending: teachers.filter(t => t.onboarding_status === 'pending').length,
          verified: teachers.filter(t => t.onboarding_status === 'verified').length,
          inactive: teachers.filter(t => t.onboarding_status === 'inactive').length,
          byRole: {
            school_admin: teachers.filter(t => t.role === 'school_admin').length,
            principal: teachers.filter(t => t.role === 'principal').length,
            it_admin: teachers.filter(t => t.role === 'it_admin').length,
            class_teacher: teachers.filter(t => t.role === 'class_teacher').length,
            subject_teacher: teachers.filter(t => t.role === 'subject_teacher').length,
          }
        };
        return apiSuccess(stats, context.request, { startTime });
      }

      // ==================== EDUCATOR SERVICE ====================
      case 'getCurrentEducator': {
        const { data: schoolEducatorData, error: schoolError } = await supabase.from('school_educators').select('id, user_id, school_id, employee_id').eq('user_id', user.id).maybeSingle();
        if (schoolError && schoolError.code !== 'PGRST116') return apiDbError(schoolError, context.request, { startTime });
        if (schoolEducatorData) return apiSuccess({ ...schoolEducatorData, type: 'school' }, context.request, { startTime });
        const { data: collegeLecturerData, error: collegeError } = await supabase.from('college_lecturers').select('id, user_id, collegeId, department').eq('user_id', user.id).maybeSingle();
        if (collegeError && collegeError.code !== 'PGRST116') return apiDbError(collegeError, context.request, { startTime });
        if (collegeLecturerData) return apiSuccess({ ...collegeLecturerData, school_id: collegeLecturerData.collegeId, type: 'college' }, context.request, { startTime });
        return apiSuccess(null, context.request, { startTime });
      }

      // ==================== LESSON PLANS SERVICE ====================
      case 'getCurrentEducatorId': {
        const { data: educator, error } = await supabase.from('school_educators').select('id').eq('user_id', user.id).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(educator?.id || null, context.request, { startTime });
      }

      case 'getLessonPlans': {
        const { educatorId, schoolId } = params;
        let lpQuery = supabase.from('lesson_plans').select(`*, school_classes(academic_year)`).order('date', { ascending: false });
        if (educatorId) {
          lpQuery = lpQuery.eq('educator_id', educatorId);
        } else if (schoolId) {
          const { data: educators } = await supabase.from('school_educators').select('id').eq('school_id', schoolId);
          const educatorIds = educators?.map(e => e.id) || [];
          if (educatorIds.length > 0) lpQuery = lpQuery.in('educator_id', educatorIds);
          else return apiSuccess([], context.request, { startTime });
        }
        const { data, error } = await lpQuery;
        if (error) return apiDbError(error, context.request, { startTime });
        const flattenedData = data?.map(plan => ({ ...plan, academic_year: (plan as any).school_classes?.academic_year || null, school_classes: undefined }));
        return apiSuccess(flattenedData, context.request, { startTime });
      }

      case 'getLessonPlan': {
        const { id } = params;
        const { data, error } = await supabase.from('lesson_plans').select('*').eq('id', id).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'createLessonPlan': {
        const { educatorId, formData, classId } = params;
        if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Educator not found', context.request, { startTime });
        const { data: chapter } = await supabase.from('curriculum_chapters').select('estimated_duration, duration_unit').eq('id', formData.chapterId).maybeSingle();
        const duration = chapter?.estimated_duration || 60;
        const { data, error } = await supabase.from('lesson_plans').insert({
          educator_id: educatorId, class_id: classId || null, title: formData.title, subject: formData.subject, class_name: formData.class, date: formData.date, duration,
          chapter_id: formData.chapterId, selected_learning_outcomes: formData.selectedLearningOutcomes, learning_objectives: formData.learningObjectives,
          teaching_methodology: formData.teachingMethodology, required_materials: formData.requiredMaterials, resource_files: formData.resourceFiles,
          resource_links: formData.resourceLinks, evaluation_criteria: formData.evaluationCriteria, evaluation_items: formData.evaluationItems,
          homework: formData.homework || null, differentiation_notes: formData.differentiationNotes || null, status: formData.status || 'draft', activities: [], resources: [],
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'updateLessonPlan': {
        const { id, formData, classId } = params;
        const { data: chapter } = await supabase.from('curriculum_chapters').select('estimated_duration, duration_unit').eq('id', formData.chapterId).maybeSingle();
        const duration = chapter?.estimated_duration || 60;
        const { data, error } = await supabase.from('lesson_plans').update({
          class_id: classId || null, title: formData.title, subject: formData.subject, class_name: formData.class, date: formData.date, duration, chapter_id: formData.chapterId,
          selected_learning_outcomes: formData.selectedLearningOutcomes, learning_objectives: formData.learningObjectives, teaching_methodology: formData.teachingMethodology,
          required_materials: formData.requiredMaterials, resource_files: formData.resourceFiles, resource_links: formData.resourceLinks,
          evaluation_criteria: formData.evaluationCriteria, evaluation_items: formData.evaluationItems, homework: formData.homework || null,
          differentiation_notes: formData.differentiationNotes || null, status: formData.status || 'draft',
        }).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'deleteLessonPlan': {
        const { id } = params;
        const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'submitLessonPlan': {
        const { id } = params;
        const { data, error } = await supabase.from('lesson_plans').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getCurriculums': {
        const { subject, className } = params;
        const { data, error } = await supabase.from('curriculums').select('id, subject, class, academic_year, status').eq('subject', subject).eq('class', className).eq('status', 'approved').order('academic_year', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getChapters': {
        const { curriculumId } = params;
        const { data, error } = await supabase.from('curriculum_chapters').select('*').eq('curriculum_id', curriculumId).order('order_number', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        const transformedData = data?.map((chapter: any) => ({
          id: chapter.id, curriculum_id: chapter.curriculum_id, name: chapter.name, code: chapter.code, description: chapter.description,
          order: chapter.order_number, estimatedDuration: chapter.estimated_duration, durationUnit: chapter.duration_unit, created_at: chapter.created_at, updated_at: chapter.updated_at,
        }));
        return apiSuccess(transformedData, context.request, { startTime });
      }

      case 'getLearningOutcomes': {
        const { chapterId } = params;
        const { data, error } = await supabase.from('curriculum_learning_outcomes').select('*').eq('chapter_id', chapterId);
        if (error) return apiDbError(error, context.request, { startTime });
        const transformedData = data?.map((outcome: any) => ({ id: outcome.id, chapterId: outcome.chapter_id, outcome: outcome.outcome, bloomLevel: outcome.bloom_level }));
        return apiSuccess(transformedData, context.request, { startTime });
      }

      case 'getSubjects': {
        const { schoolId } = params;
        let query = supabase.from('curriculum_subjects').select('*').eq('is_active', true).order('display_order', { ascending: true });
        if (schoolId) query = query.or(`school_id.is.null,school_id.eq.${schoolId}`);
        else query = query.is('school_id', null);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getClasses': {
        const { schoolId } = params;
        const { data, error } = await supabase.from('school_classes').select('id, name, grade, section, academic_year').eq('school_id', schoolId).eq('account_status', 'active').order('grade', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ==================== MENTOR NOTES ====================
      case 'saveMentorNote': {
        const { learner_id, mentor_type, school_educator_id, college_lecturer_id, quick_notes, feedback, action_points } = params;
        const { data, error } = await supabase.from('mentor_notes').insert([{ learner_id, mentor_type, school_educator_id, college_lecturer_id, quick_notes, feedback, action_points }]).select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getLearners': {
        const { data, error } = await supabase.from('learners').select('id, name').order('name', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getMentorNotes': {
        const { data, error } = await supabase.from('mentor_notes').select(`id, learner_id, feedback, action_points, quick_notes, note_date, learners(name)`).order('note_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ==================== EDUCATOR DATA SERVICE ====================
      case 'educatorGetLearners': {
        const { universityId } = params;
        let query = supabase.from('learners').select('id, universityId, profile').order('profile->updatedAt', { ascending: false });
        if (universityId) query = query.eq('universityId', universityId);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'getLearnerById': {
        const { learnerId } = params;
        const { data, error } = await supabase.from('learners').select('id, universityId, profile').eq('id', learnerId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getOpportunities': {
        const { limit = 50 } = params;
        const { data, error } = await supabase.from('opportunities').select('*').eq('is_active', true).eq('status', 'published').order('posted_date', { ascending: false }).limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'educatorGetAssignments': {
        const { educatorId } = params;
        let query = supabase.from('assignments').select('*').eq('is_deleted', false).order('created_date', { ascending: false });
        if (educatorId) query = query.eq('educator_id', educatorId);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'getPendingCertificates': {
        const { data, error } = await supabase.from('certificates').select('*').eq('approval_status', 'pending').eq('enabled', true).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'getLearnerCertificates': {
        const { learnerId } = params;
        const { data, error } = await supabase.from('certificates').select('*').eq('learner_id', learnerId).eq('enabled', true).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ==================== EDUCATOR ASSIGNMENTS SERVICE ====================
      case 'getAssignmentLearners': {
        const { assignmentId } = params;
        const { data, error } = await supabase.from('learner_assignments').select(`*, learners (id, name, email, university, branch_field, college_school_name, registration_number)`).eq('assignment_id', assignmentId).eq('is_deleted', false).order('assigned_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const { data: files } = await supabase.from('assignment_attachments').select('*').eq('assignment_id', assignmentId).like('file_name', 'LEARNER:%').order('uploaded_date', { ascending: false });
        const groupedFiles: Record<string, any[]> = {};
        (files || []).forEach(file => {
          const match = file.file_name.match(/^LEARNER:([^:]+):/);
          if (match) {
            if (!groupedFiles[match[1]]) groupedFiles[match[1]] = [];
            groupedFiles[match[1]].push({ ...file, original_filename: file.file_name.replace(/^LEARNER:[^:]+:/, '') });
          }
        });
        const flattenedData = data?.map(item => {
          const learner = item.learners;
          return { ...item, learner: { id: learner?.id, name: learner?.name || 'Unknown', email: learner?.email || '', university: learner?.university || '', branch_field: learner?.branch_field || '', college_school_name: learner?.college_school_name || '', registration_number: learner?.registration_number || '' }, submission_files: groupedFiles[item.learner_assignment_id] || [] };
        }) || [];
        return apiSuccess(flattenedData, context.request, { startTime });
      }

      case 'gradeAssignment': {
        const { learnerAssignmentId, gradingData } = params;
        const { data, error } = await supabase.from('learner_assignments').update({
          grade_received: gradingData.grade_received, instructor_feedback: gradingData.instructor_feedback, graded_by: gradingData.graded_by,
          graded_date: new Date().toISOString(), feedback_date: new Date().toISOString(), status: 'graded', updated_date: new Date().toISOString(),
        }).eq('learner_assignment_id', learnerAssignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ==================== ASSIGNMENTS SERVICE ====================
      case 'getAssignmentsByLearnerId': {
        const { learnerId } = params;
        const { data: learnerRow } = await supabase.from('learners').select('id, user_id').eq('id', learnerId).maybeSingle();
        if (!learnerRow?.user_id) return apiError(400, 'NOT_FOUND', 'Learner not found', context.request, { startTime });
        const { data, error } = await supabase.from('learner_assignments').select(`*, assignments (assignment_id, title, description, instructions, course_name, course_code, educator_id, educator_name, total_points, assignment_type, skill_outcomes, assign_classes, document_pdf, due_date, available_from, created_date, allow_late_submission)`).eq('learner_id', learnerRow.user_id).eq('is_deleted', false).order('assignments(created_date)', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const flattenedData = data?.map(item => ({ ...item.assignments, learner_assignment_id: item.learner_assignment_id, status: item.status, priority: item.priority, grade_received: item.grade_received, grade_percentage: item.grade_percentage, instructor_feedback: item.instructor_feedback, feedback_date: item.feedback_date, graded_by: item.graded_by, graded_date: item.graded_date, submission_date: item.submission_date, submission_type: item.submission_type, submission_content: item.submission_content, submission_url: item.submission_url, is_late: item.is_late, late_penalty: item.late_penalty, assigned_date: item.assigned_date, started_date: item.started_date, completed_date: item.completed_date })) || [];
        return apiSuccess(flattenedData, context.request, { startTime });
      }

      case 'getAssignmentsByStatus': {
        const { learnerId, status } = params;
        const { data, error } = await supabase.from('learner_assignments').select(`*, assignments (assignment_id, title, description, instructions, course_name, course_code, total_points, assignment_type, skill_outcomes, due_date, document_pdf)`).eq('learner_id', learnerId).eq('status', status).eq('is_deleted', false).order('assignments(due_date)', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        const flattenedData = data?.map(item => ({ ...item.assignments, learner_assignment_id: item.learner_assignment_id, status: item.status, priority: item.priority, grade_received: item.grade_received, grade_percentage: item.grade_percentage, submission_date: item.submission_date, is_late: item.is_late })) || [];
        return apiSuccess(flattenedData, context.request, { startTime });
      }

      case 'getAssignmentsByDateRange': {
        const { learnerId, startDate, endDate } = params;
        const { data: assignmentIds } = await supabase.from('assignments').select('assignment_id').gte('due_date', startDate).lte('due_date', endDate).eq('is_deleted', false);
        if (!assignmentIds || assignmentIds.length === 0) return apiSuccess([], context.request, { startTime });
        const ids = assignmentIds.map(a => a.assignment_id);
        const { data, error } = await supabase.from('learner_assignments').select(`*, assignments (assignment_id, title, description, course_name, course_code, total_points, assignment_type, due_date)`).eq('learner_id', learnerId).in('assignment_id', ids).eq('is_deleted', false).order('assignments(due_date)', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        const flattenedData = data?.map(item => ({ ...item.assignments, learner_assignment_id: item.learner_assignment_id, status: item.status, priority: item.priority, grade_received: item.grade_received, submission_date: item.submission_date })) || [];
        return apiSuccess(flattenedData, context.request, { startTime });
      }

      case 'getAssignmentStats': {
        const { learnerId } = params;
        const { data: learnerRow } = await supabase.from('learners').select('user_id').eq('id', learnerId).maybeSingle();
        if (!learnerRow?.user_id) return apiError(400, 'NOT_FOUND', 'Learner not found', context.request, { startTime });
        const { data, error } = await supabase.from('learner_assignments').select('status, grade_percentage').eq('learner_id', learnerRow.user_id).eq('is_deleted', false);
        if (error) return apiDbError(error, context.request, { startTime });
        const entries = data || [];
        const gradesArray = entries.filter(a => a.grade_percentage !== null).map(a => a.grade_percentage);
        const avg = gradesArray.length > 0 ? Math.round(gradesArray.reduce((sum, g) => sum + g, 0) / gradesArray.length) : 0;
        return apiSuccess({ total: entries.length, todo: entries.filter(a => a.status === 'todo').length, inProgress: entries.filter(a => a.status === 'in-progress').length, submitted: entries.filter(a => a.status === 'submitted').length, graded: entries.filter(a => a.status === 'graded').length, averageGrade: avg }, context.request, { startTime });
      }

      case 'updateAssignmentStatus': {
        const { learnerAssignmentId, newStatus } = params;
        const updateData: any = { status: newStatus, updated_date: new Date().toISOString() };
        if (newStatus === 'submitted') {
          const { data: current } = await supabase.from('learner_assignments').select('submission_date').eq('learner_assignment_id', learnerAssignmentId).single();
          if (!current?.submission_date) updateData.submission_date = new Date().toISOString();
        }
        const { data, error } = await supabase.from('learner_assignments').update(updateData).eq('learner_assignment_id', learnerAssignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getAssignmentWithAttachments': {
        const { learnerId, assignmentId } = params;
        const { data, error } = await supabase.from('learner_assignments').select(`*, assignments (*, assignment_attachments (*))`).eq('learner_id', learnerId).eq('assignment_id', assignmentId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        const flattened = { ...data.assignments, learner_assignment_id: data.learner_assignment_id, status: data.status, priority: data.priority, grade_received: data.grade_received, grade_percentage: data.grade_percentage, instructor_feedback: data.instructor_feedback, feedback_date: data.feedback_date, submission_date: data.submission_date, submission_type: data.submission_type, submission_content: data.submission_content, submission_url: data.submission_url, is_late: data.is_late, late_penalty: data.late_penalty, started_date: data.started_date, completed_date: data.completed_date };
        return apiSuccess(flattened, context.request, { startTime });
      }

      case 'getLearnerAssignment': {
        const { learnerId, assignmentId } = params;
        const { data, error } = await supabase.from('learner_assignments').select(`*, assignments (*)`).eq('learner_id', learnerId).eq('assignment_id', assignmentId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        const flattened = { ...data.assignments, learner_assignment_id: data.learner_assignment_id, status: data.status, priority: data.priority, grade_received: data.grade_received, grade_percentage: data.grade_percentage, instructor_feedback: data.instructor_feedback, feedback_date: data.feedback_date, graded_by: data.graded_by, graded_date: data.graded_date, submission_date: data.submission_date, submission_type: data.submission_type, submission_content: data.submission_content, submission_url: data.submission_url, is_late: data.is_late, late_penalty: data.late_penalty, assigned_date: data.assigned_date, started_date: data.started_date, completed_date: data.completed_date };
        return apiSuccess(flattened, context.request, { startTime });
      }

      case 'deleteLearnerAssignment': {
        const { learnerAssignmentId } = params;
        const { error } = await supabase.from('learner_assignments').update({ is_deleted: true, updated_date: new Date().toISOString() }).eq('learner_assignment_id', learnerAssignmentId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'submitAssignment': {
        const { learnerAssignmentId, submissionData } = params;
        const updateData = { ...submissionData, status: 'submitted', submission_date: new Date().toISOString(), completed_date: new Date().toISOString(), updated_date: new Date().toISOString() };
        const { data, error } = await supabase.from('learner_assignments').update(updateData).eq('learner_assignment_id', learnerAssignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'updateLearnerAssignment': {
        const { learnerAssignmentId, updateData } = params;
        const { data, error } = await supabase.from('learner_assignments').update({ ...updateData, updated_date: new Date().toISOString() }).eq('learner_assignment_id', learnerAssignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'getLearnerSubmissionFiles': {
        const { assignmentId, learnerAssignmentId } = params;
        const { data, error } = await supabase.from('assignment_attachments').select('*').eq('assignment_id', assignmentId).like('file_name', `LEARNER:${learnerAssignmentId}:%`).order('uploaded_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const filesWithOriginalNames = data?.map(file => ({ ...file, original_filename: file.file_name.replace(/^LEARNER:[^:]+:/, '') })) || [];
        return apiSuccess(filesWithOriginalNames, context.request, { startTime });
      }

      case 'getAssignmentWithFiles': {
        const { learnerId, assignmentId } = params;
        const { data: laData, error: laError } = await supabase.from('learner_assignments').select(`*, assignments (*, assignment_attachments (*))`).eq('learner_id', learnerId).eq('assignment_id', assignmentId).single();
        if (laError) return apiDbError(laError, context.request, { startTime });
        const assignment = { ...laData.assignments, learner_assignment_id: laData.learner_assignment_id, status: laData.status, priority: laData.priority, grade_received: laData.grade_received, grade_percentage: laData.grade_percentage, instructor_feedback: laData.instructor_feedback, feedback_date: laData.feedback_date, submission_date: laData.submission_date, submission_type: laData.submission_type, submission_content: laData.submission_content, submission_url: laData.submission_url, is_late: laData.is_late, late_penalty: laData.late_penalty, started_date: laData.started_date, completed_date: laData.completed_date };
        const { data: instructionFiles } = await supabase.from('assignment_attachments').select('*').eq('assignment_id', assignmentId).not('file_name', 'like', 'LEARNER:%').order('uploaded_date', { ascending: false });
        const { data: submissionFiles } = await supabase.from('assignment_attachments').select('*').eq('assignment_id', assignmentId).like('file_name', `LEARNER:${assignment.learner_assignment_id}:%`).order('uploaded_date', { ascending: false });
        const submissionFilesWithNames = (submissionFiles || []).map(file => ({ ...file, original_filename: file.file_name.replace(/^LEARNER:[^:]+:/, '') }));
        return apiSuccess({ ...assignment, instruction_files: instructionFiles || [], submission_files: submissionFilesWithNames }, context.request, { startTime });
      }

      case 'deleteLearnerSubmissionFile': {
        const { attachmentId, learnerAssignmentId } = params;
        const { data: attachment, error: fetchError } = await supabase.from('assignment_attachments').select('file_url, file_name').eq('attachment_id', attachmentId).like('file_name', `LEARNER:${learnerAssignmentId}:%`).single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const { error } = await supabase.from('assignment_attachments').delete().eq('attachment_id', attachmentId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true, file_url: attachment?.file_url }, context.request, { startTime });
      }

      case 'uploadInstructionFile': {
        const { assignmentId, fileName, fileType, fileSize, fileUrl } = params;
        const { data, error } = await supabase.from('assignment_attachments').insert({ assignment_id: assignmentId, file_name: fileName, file_type: fileType, file_size: fileSize, file_url: fileUrl }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ ...data, url: fileUrl }, context.request, { startTime });
      }

      case 'deleteInstructionFile': {
        const { attachmentId } = params;
        const { data: attachment, error: fetchError } = await supabase.from('assignment_attachments').select('file_url, file_name').eq('attachment_id', attachmentId).not('file_name', 'like', 'LEARNER:%').single();
        if (fetchError) return apiDbError(fetchError, context.request, { startTime });
        const { error } = await supabase.from('assignment_attachments').delete().eq('attachment_id', attachmentId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true, file_url: attachment?.file_url }, context.request, { startTime });
      }

      case 'submitAssignmentWithStagedFiles': {
        const { learnerAssignmentId, files, assignmentId } = params;
        if (!files || files.length === 0) {
          const { data, error } = await supabase.from('learner_assignments').update({ status: 'submitted', submission_type: 'text', submission_date: new Date().toISOString(), completed_date: new Date().toISOString(), updated_date: new Date().toISOString() }).eq('learner_assignment_id', learnerAssignmentId).select().single();
          if (error) return apiDbError(error, context.request, { startTime });
          return apiSuccess(data, context.request, { startTime });
        }
        const attachmentPromises = files.map(async (file: any) => {
          return await supabase.from('assignment_attachments').insert({ assignment_id: assignmentId, file_name: `LEARNER:${learnerAssignmentId}:${file.name}`, file_type: file.type, file_size: file.size, file_url: file.url }).select().single();
        });
        const attachmentResults = await Promise.all(attachmentPromises);
        const hasError = attachmentResults.find(r => r.error);
        if (hasError) return apiDbError(hasError.error, context.request, { startTime });

        const fileNames = files.map((f: any) => f.name).join(',');
        const { data, error } = await supabase.from('learner_assignments').update({ status: 'submitted', submission_type: 'file', submission_content: fileNames, submission_url: files[0]?.url || null, submission_date: new Date().toISOString(), completed_date: new Date().toISOString(), updated_date: new Date().toISOString() }).eq('learner_assignment_id', learnerAssignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ==================== DATA FETCHER SERVICE ====================
      case 'getLearnersWithAssignments': {
        const { universityId } = params;
        let learnersQuery = supabase.from('learners').select('id, user_id, universityId, profile').order('profile->updatedAt', { ascending: false });
        if (universityId) learnersQuery = learnersQuery.eq('universityId', universityId);
        const { data: learners, error: learnersError } = await learnersQuery;
        if (learnersError) return apiDbError(learnersError, context.request, { startTime });
        if (!learners || learners.length === 0) return apiSuccess([], context.request, { startTime });
        const userIds = learners.map((s: any) => s.user_id).filter(Boolean);
        let allAssignments: any[] = [];
        if (userIds.length > 0) {
          const BATCH_SIZE = 100;
          for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batchIds = userIds.slice(i, i + BATCH_SIZE);
            const { data: batchData } = await supabase.from('learner_assignments').select('*').in('learner_id', batchIds);
            if (batchData) allAssignments.push(...batchData);
          }
        }
        const assignmentsByLearner = new Map<string, any[]>();
        allAssignments.forEach(assignment => {
          const list = assignmentsByLearner.get(assignment.learner_id) || [];
          list.push(assignment);
          assignmentsByLearner.set(assignment.learner_id, list);
        });
        const enriched = learners.map((learner: any) => {
          const learnerAssignments = assignmentsByLearner.get(learner.user_id) || [];
          const submitted = learnerAssignments.filter((a: any) => a.status === 'submitted' || a.status === 'graded');
          const graded = learnerAssignments.filter((a: any) => a.status === 'graded');
          const pending = learnerAssignments.filter((a: any) => a.status === 'todo' || a.status === 'in-progress');
          const late = learnerAssignments.filter((a: any) => a.is_late);
          const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum: number, a: any) => sum + (a.grade_percentage || 0), 0) / graded.length * 10) / 10 : 0;
          return { ...learner, assignments: learnerAssignments, assignmentStats: { total: learnerAssignments.length, submitted: submitted.length, graded: graded.length, pending: pending.length, avgGrade, lateSubmissions: late.length } };
        });
        return apiSuccess(enriched, context.request, { startTime });
      }

      case 'getLearnerWithAssignments': {
        const { learnerId } = params;
        const { data: learner, error: learnerError } = await supabase.from('learners').select('id, user_id, universityId, profile').eq('id', learnerId).single();
        if (learnerError) return apiDbError(learnerError, context.request, { startTime });
        const { data: assignments } = await supabase.from('learner_assignments').select('*').eq('learner_id', (learner as any).user_id);
        const la = (assignments || []) as any[];
        const submitted = la.filter((a: any) => a.status === 'submitted' || a.status === 'graded');
        const graded = la.filter((a: any) => a.status === 'graded');
        const pending = la.filter((a: any) => a.status === 'todo' || a.status === 'in-progress');
        const late = la.filter((a: any) => a.is_late);
        const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum: number, a: any) => sum + (a.grade_percentage || 0), 0) / graded.length * 10) / 10 : 0;
        return apiSuccess({ ...learner, assignments: la, assignmentStats: { total: la.length, submitted: submitted.length, graded: graded.length, pending: pending.length, avgGrade, lateSubmissions: late.length } }, context.request, { startTime });
      }

      case 'getAssignmentsWithStats': {
        const { educatorId } = params;
        let query = supabase.from('assignments').select('*').eq('is_deleted', false).order('due_date', { ascending: false });
        if (educatorId) query = query.eq('educator_id', educatorId);
        const { data: assignData, error: assignError } = await query;
        if (assignError) return apiDbError(assignError, context.request, { startTime });
        if (!assignData || assignData.length === 0) return apiSuccess([], context.request, { startTime });
        const assignmentIds = assignData.map((a: any) => a.assignment_id).filter(Boolean);
        let learnerAssignments: any[] = [];
        if (assignmentIds.length > 0) {
          const { data: subs } = await supabase.from('learner_assignments').select('*').in('assignment_id', assignmentIds);
          if (subs) learnerAssignments = subs;
        }
        const idsSet = new Map<string, any[]>();
        learnerAssignments.forEach((sa: any) => {
          const list = idsSet.get(sa.assignment_id) || [];
          list.push(sa);
          idsSet.set(sa.assignment_id, list);
        });
        const result = assignData.map((assignment: any) => {
          const submissions = idsSet.get(assignment.assignment_id) || [];
          const submitted = submissions.filter((s: any) => s.status === 'submitted' || s.status === 'graded').length;
          const graded = submissions.filter((s: any) => s.status === 'graded').length;
          const pending = submissions.filter((s: any) => s.status === 'todo' || s.status === 'in-progress').length;
          const lateSubmissions = submissions.filter((s: any) => s.is_late).length;
          const grades = submissions.filter((s: any) => s.grade_percentage !== null).map((s: any) => s.grade_percentage);
          const avgGrade = grades.length > 0 ? Math.round(grades.reduce((sum: number, g: number) => sum + g, 0) / grades.length * 10) / 10 : 0;
          return { ...assignment, stats: { totallearners: submissions.length, submitted, graded, pending, lateSubmissions, avgGrade, submissionRate: submissions.length > 0 ? Math.round((submitted / submissions.length) * 100) : 0 } };
        });
        return apiSuccess(result, context.request, { startTime });
      }

      case 'getActiveOpportunities': {
        const { limit = 100 } = params;
        const { data, error } = await supabase.from('opportunities').select('id, title, job_title, company_name, employment_type, location, mode, experience_level, skills_required, requirements, department, status, is_active, deadline, applications_count, salary_range_min, salary_range_max').eq('is_active', true).eq('status', 'published').order('posted_date', { ascending: false }).limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ==================== ANALYTICS SERVICE ====================
      case 'getGeographicDistribution': {
        const { preset, start, end, limit = 4 } = params;
        const { startDate, endDate } = buildDateRange(preset, start, end);
        const { data: results, error } = await supabase.from('pipeline_candidates').select(`learner_id, learners!inner(state)`).gte('added_at', startDate).lte('added_at', endDate);
        if (error) return apiDbError(error, context.request, { startTime });
        if (!results || results.length === 0) return apiSuccess([], context.request, { startTime });
        const locationCounts: Record<string, number> = {};
        let totalCount = 0;
        results.forEach((row: any) => { const state = row.learners?.state || 'Unknown'; locationCounts[state] = (locationCounts[state] || 0) + 1; totalCount += 1; });
        const locationsArray = Object.entries(locationCounts).map(([city, count]) => ({ city, count: count as number, percentage: totalCount > 0 ? parseFloat(((count as number / totalCount) * 100).toFixed(1)) : 0 })).sort((a, b) => b.count - a.count).slice(0, limit);
        return apiSuccess(locationsArray, context.request, { startTime });
      }

      case 'getTopHiringColleges': {
        const { preset, start, end, limit = 4 } = params;
        const { startDate, endDate } = buildDateRange(preset, start, end);
        const { data: results, error } = await supabase.from('pipeline_candidates').select(`learner_id, learners!inner(college_school_name)`).gte('added_at', startDate).lte('added_at', endDate);
        if (error) return apiDbError(error, context.request, { startTime });
        if (!results || results.length === 0) return apiSuccess([], context.request, { startTime });
        const collegeCounts: Record<string, number> = {};
        let totalCount = 0;
        results.forEach((row: any) => { const name = row.learners?.college_school_name || 'Unknown'; collegeCounts[name] = (collegeCounts[name] || 0) + 1; totalCount += 1; });
        const collegesArray = Object.entries(collegeCounts).map(([name, count]) => ({ name, count: count as number, percentage: totalCount > 0 ? parseFloat(((count as number / totalCount) * 100).toFixed(1)) : 0 })).sort((a, b) => b.count - a.count).slice(0, limit);
        return apiSuccess(collegesArray, context.request, { startTime });
      }

      case 'getQualityMetrics': {
        const { preset, start, end } = params;
        const { startDate, endDate } = buildDateRange(preset, start, end);
        const { data: hiredCandidates, error } = await supabase.from('pipeline_candidates').select(`learner_id, learners!inner(currentCgpa, gender, age, branch_field)`).eq('stage', 'hired').gte('added_at', startDate).lte('added_at', endDate);
        if (error) return apiDbError(error, context.request, { startTime });
        if (!hiredCandidates || hiredCandidates.length === 0) {
          return apiSuccess({ totalHired: 0, avgAiScore: 0, avgCgpa: 0, genderDiversity: { male: 0, female: 0, other: 0, malePercent: 0, femalePercent: 0, otherPercent: 0 }, ageDemographics: { averageAge: 0, ageRanges: [] }, topCourses: [] }, context.request, { startTime });
        }
        let totalCgpa = 0, cgpaCount = 0, maleCount = 0, femaleCount = 0, otherCount = 0, totalAge = 0, ageCount = 0, ageRanges = { '18-21': 0, '22-25': 0, '26-30': 0, '30+': 0 };
        const courseCounts: Record<string, number> = {};
        hiredCandidates.forEach((row: any) => {
          const l = row.learners;
          if (l?.currentCgpa && l.currentCgpa > 0) { totalCgpa += l.currentCgpa; cgpaCount++; }
          const g = (l?.gender || '').toLowerCase();
          if (g === 'male' || g === 'm') maleCount++; else if (g === 'female' || g === 'f') femaleCount++; else if (g) otherCount++;
          if (l?.age && l.age > 0) { totalAge += l.age; ageCount++; if (l.age <= 21) ageRanges['18-21']++; else if (l.age <= 25) ageRanges['22-25']++; else if (l.age <= 30) ageRanges['26-30']++; else ageRanges['30+']++; }
          const course = l?.branch_field || 'Unknown'; courseCounts[course] = (courseCounts[course] || 0) + 1;
        });
        const totalHired = hiredCandidates.length;
        const genderTotal = maleCount + femaleCount + otherCount;
        return apiSuccess({
          totalHired, avgAiScore: 0, avgCgpa: cgpaCount > 0 ? parseFloat((totalCgpa / cgpaCount).toFixed(2)) : 0,
          genderDiversity: { male: maleCount, female: femaleCount, other: otherCount, malePercent: genderTotal > 0 ? parseFloat(((maleCount / genderTotal) * 100).toFixed(1)) : 0, femalePercent: genderTotal > 0 ? parseFloat(((femaleCount / genderTotal) * 100).toFixed(1)) : 0, otherPercent: genderTotal > 0 ? parseFloat(((otherCount / genderTotal) * 100).toFixed(1)) : 0 },
          ageDemographics: { averageAge: ageCount > 0 ? parseFloat((totalAge / ageCount).toFixed(1)) : 0, ageRanges: Object.entries(ageRanges).map(([range, count]) => ({ range, count, percentage: ageCount > 0 ? parseFloat(((count / ageCount) * 100).toFixed(1)) : 0 })) },
          topCourses: Object.entries(courseCounts).map(([name, count]) => ({ name, count, percentage: parseFloat(((count / totalHired) * 100).toFixed(1)) })).sort((a, b) => b.count - a.count).slice(0, 5),
        }, context.request, { startTime });
      }

      // ==================== EDUCATOR PROFILE ====================
      case 'getEducatorByEmail': {
        const { email } = params;
        const { data, error } = await supabase.from('school_educators').select('*').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'createEducatorProfile': {
        const { educatorData } = params;
        const { data, error } = await supabase.from('school_educators').insert([{
          first_name: educatorData.first_name || '', last_name: educatorData.last_name || '', email: educatorData.email,
          phone_number: educatorData.phone_number || null, specialization: educatorData.specialization || null,
          qualification: educatorData.qualification || null, experience_years: educatorData.experience_years || null,
          designation: educatorData.designation || null, department: educatorData.department || null,
          school_id: educatorData.school_id, user_id: educatorData.user_id, account_status: 'active', verification_status: 'Pending',
        }]).select().single();
        if (error) {
          if (error.code === '23505') return apiError(409, 'DUPLICATE', 'An educator with this email already exists.', context.request, { startTime });
          return apiDbError(error, context.request, { startTime });
        }
        return apiSuccess({ id: data.id, name: `${data.first_name} ${data.last_name}`.trim(), email: data.email, specialization: data.specialization, qualification: data.qualification, verification_status: data.verification_status, account_status: data.account_status }, context.request, { startTime });
      }

      case 'fetchEducatorProfileByUserId': {
        const { userId } = params;
        const { data, error } = await supabase.from('school_educators').select('*').eq('user_id', userId).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetchEducatorProfileByEmail': {
        const { email } = params;
        const { data, error } = await supabase.from('school_educators').select('*').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'updateEducatorUserId': {
        const { educatorId, userId } = params;
        const { error } = await supabase.from('school_educators').update({ user_id: userId }).eq('id', educatorId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      // ==================== CONTEXT BUILDER ====================
      case 'buildEducatorContext': {
        const { educatorId } = params;
        const { data: educator, error: educatorError } = await supabase.from('school_educators').select(`id, user_id, school_id, first_name, last_name, email, designation, department, specialization, qualification, experience_years, subjects_handled, account_status, schools (id, name, code, city, state, board)`).eq('user_id', educatorId).eq('account_status', 'active').single();
        if (educatorError) return apiSuccess({ name: 'Educator', institution: 'Your Institution', total_learners: 0, active_classes: 0, subjects_taught: [], recent_activities: [] }, context.request, { startTime });
        if (!educator) return apiSuccess({ name: 'Educator', institution: 'Your Institution', total_learners: 0, active_classes: 0, subjects_taught: [], recent_activities: [] }, context.request, { startTime });
        const educatorData = educator as any;
        const { count: learnerCount } = await supabase.from('learners').select('id', { count: 'exact', head: true }).eq('universityId', educatorData.school_id);
        const fullName = [educatorData.first_name, educatorData.last_name].filter(Boolean).join(' ') || 'Educator';
        const institution = educatorData.schools?.name || 'Your Institution';
        const institutionDetails = [educatorData.schools?.city, educatorData.schools?.state].filter(Boolean).join(', ');
        const subjects_taught = educatorData.subjects_handled || [];
        const recent_activities = [
          ...(educatorData.designation ? [`Role: ${educatorData.designation}`] : []),
          ...(educatorData.specialization ? [`Specialization: ${educatorData.specialization}`] : []),
          ...(educatorData.qualification ? [`Qualification: ${educatorData.qualification}`] : []),
          ...(educatorData.experience_years ? [`Experience: ${educatorData.experience_years} years`] : []),
          ...(educatorData.schools?.board ? [`Board: ${educatorData.schools.board}`] : []),
        ].filter(Boolean);
        return apiSuccess({ name: fullName, institution: institutionDetails ? `${institution} (${institutionDetails})` : institution, department: educatorData.department || undefined, total_learners: learnerCount || 0, active_classes: 1, subjects_taught, recent_activities }, context.request, { startTime });
      }

      // ==================== LESSON PLAN SERVICE (alternate) ====================
      case 'lpGetLessonPlans': {
        const { schoolId } = params;
        const { data, error } = await supabase.from('lesson_plans').select(`*, school_educators!inner(school_id)`).eq('school_educators.school_id', schoolId).order('date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'lpGetEducatorLessonPlans': {
        const { educatorId } = params;
        const { data, error } = await supabase.from('lesson_plans').select('*').eq('educator_id', educatorId).order('date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'lpCreateLessonPlan': {
        const { lessonPlan } = params;
        const { data, error } = await supabase.from('lesson_plans').insert(lessonPlan).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'lpUpdateLessonPlan': {
        const { id, updates } = params;
        const { data, error } = await supabase.from('lesson_plans').update(updates).eq('id', id).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'lpDeleteLessonPlan': {
        const { id } = params;
        const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'lpGetLessonPlanById': {
        const { id } = params;
        const { data, error } = await supabase.from('lesson_plans').select('*').eq('id', id).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[educator-copilot POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});

function buildDateRange(preset: string, start?: string, end?: string) {
  if (preset === 'custom' && start && end) return { startDate: start, endDate: end };
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;
  if (preset === 'ytd') { const ytd = new Date(now.getFullYear(), 0, 1); startDate = ytd.toISOString(); }
  else { const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90; const d = new Date(now); d.setDate(d.getDate() - days); startDate = d.toISOString(); }
  return { startDate, endDate };
}
