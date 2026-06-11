import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';
import { notifyRealtime } from '../../lib/realtime';

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
      // COURSES
      // ──────────────────────────────────────────────

      case 'get-all-courses':
      case 'list-courses': {
        const { status } = params;
        let coursesQuery = supabase
          .from('courses')
          .select('*')
          .is('deleted_at', null);
        if (status?.in) {
          coursesQuery = coursesQuery.in('status', status.in);
        }
        const { data, error } = await coursesQuery.order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-courses-by-school': {
        const { schoolId } = params;
        if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId', context.request, { startTime });
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('school_id', schoolId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-courses-by-educator': {
        const { educatorId } = params;
        if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('educator_id', educatorId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-course-full-data': {
        const { courseIds } = params;
        if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0)
          return apiError(400, 'VALIDATION_ERROR', 'Missing courseIds array', context.request, { startTime });
        const [skillsResult, classesResult, modulesResult, coEducatorsResult] = await Promise.allSettled([
          supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds),
          supabase.from('course_classes').select('course_id, class_name').in('course_id', courseIds),
          supabase.from('course_modules').select('*, lessons(*, lesson_resources(*))').in('course_id', courseIds).order('order_index', { ascending: true }),
          supabase.from('course_co_educators').select('course_id, educator_name').in('course_id', courseIds),
        ]);
        const extract = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value.data || []) : [];
        return apiSuccess({
          skills: extract(skillsResult),
          classes: extract(classesResult),
          modules: extract(modulesResult),
          coEducators: extract(coEducatorsResult),
        }, context.request, { startTime });
      }

      case 'get-course':
      case 'get-course-by-id': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { data, error } = await supabase.rpc('get_course_full_details', { course_uuid: courseId });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-course-school-id': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { data, error } = await supabase.from('courses').select('school_id').eq('course_id', courseId).single();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-user-by-id': {
        const { ids, select } = params;
        if (!ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing ids', context.request, { startTime });
        const { data, error } = await supabase
          .from('users')
          .select(select || 'id, firstName, lastName')
          .in('id', ids);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-course': {
        const { courseData, educatorId, educatorName, schoolId } = params;
        if (!courseData || !educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseData or educatorId', context.request, { startTime });

        let finalSchoolId = schoolId;
        if (!finalSchoolId) {
          const { data: ed } = await supabase.from('school_educators').select('school_id').eq('user_id', educatorId).single();
          if (ed?.school_id) finalSchoolId = ed.school_id;
        }

        const { data: courseRow, error: courseError } = await supabase.from('courses').insert({
          title: courseData.title, code: courseData.code, description: courseData.description,
          thumbnail: courseData.thumbnail, status: courseData.status, duration: courseData.duration,
          skills_mapped: courseData.skillsMapped, total_skills: courseData.totalSkills,
          target_outcomes: courseData.targetOutcomes, educator_id: educatorId,
          educator_name: educatorName, school_id: finalSchoolId,
        }).select().single();
        if (courseError) return apiDbError(courseError, context.request, { startTime });

        if (courseData.skillsCovered?.length > 0) {
          await supabase.from('course_skills').insert(courseData.skillsCovered.map((s: string) => ({ course_id: courseRow.course_id, skill_name: s })));
        }
        if (courseData.linkedClasses?.length > 0) {
          await supabase.from('course_classes').insert(courseData.linkedClasses.map((c: string) => ({ course_id: courseRow.course_id, class_name: c })));
        }
        if (courseData.modules?.length > 0) {
          for (const mod of courseData.modules) {
            const { data: modRow, error: modErr } = await supabase.from('course_modules').insert({
              course_id: courseRow.course_id, title: mod.title, description: mod.description,
              order_index: mod.order, skill_tags: mod.skillTags, activities: mod.activities,
            }).select().single();
            if (modErr) continue;
            if (mod.lessons?.length > 0) {
              for (const les of mod.lessons) {
                const { data: lesRow } = await supabase.from('lessons').insert({
                  module_id: modRow.module_id, title: les.title, description: les.description,
                  content: les.content, duration: les.duration, order_index: les.order,
                }).select().single();
                if (lesRow && les.resources?.length > 0) {
                  await supabase.from('lesson_resources').insert(les.resources.map((r: any, i: number) => ({
                    lesson_id: lesRow.lesson_id, name: r.name, type: r.type, url: r.url,
                    file_size: r.size, thumbnail_url: r.thumbnailUrl, embed_url: r.embedUrl, order_index: i,
                  })));
                }
              }
            }
          }
        }

        return apiSuccess(courseRow, context.request, { startTime });
      }

      case 'update-course': {
        const { courseId, updates } = params;
        if (!courseId || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or updates', context.request, { startTime });
        const updatePayload: Record<string, any> = {};
        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.code !== undefined) updatePayload.code = updates.code;
        if (updates.description !== undefined) updatePayload.description = updates.description;
        if (updates.thumbnail !== undefined) updatePayload.thumbnail = updates.thumbnail;
        if (updates.status !== undefined) updatePayload.status = updates.status;
        if (updates.duration !== undefined) updatePayload.duration = updates.duration;
        if (updates.skillsMapped !== undefined) updatePayload.skills_mapped = updates.skillsMapped;
        if (updates.totalSkills !== undefined) updatePayload.total_skills = updates.totalSkills;
        if (updates.targetOutcomes !== undefined) updatePayload.target_outcomes = updates.targetOutcomes;
        if (updates.enrollmentCount !== undefined) updatePayload.enrollment_count = updates.enrollmentCount;
        if (updates.completionRate !== undefined) updatePayload.completion_rate = updates.completionRate;
        if (updates.evidencePending !== undefined) updatePayload.evidence_pending = updates.evidencePending;

        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase.from('courses').update(updatePayload).eq('course_id', courseId);
          if (error) return apiDbError(error, context.request, { startTime });
        }

        if (updates.skillsCovered) {
          await supabase.from('course_skills').delete().eq('course_id', courseId);
          if (updates.skillsCovered.length > 0) {
            await supabase.from('course_skills').insert(updates.skillsCovered.map((s: string) => ({ course_id: courseId, skill_name: s })));
          }
        }
        if (updates.linkedClasses) {
          await supabase.from('course_classes').delete().eq('course_id', courseId);
          if (updates.linkedClasses.length > 0) {
            await supabase.from('course_classes').insert(updates.linkedClasses.map((c: string) => ({ course_id: courseId, class_name: c })));
          }
        }

        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      case 'delete-course': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { error } = await supabase.from('courses').update({ deleted_at: new Date().toISOString() }).eq('course_id', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'add-module': {
        const { courseId, moduleData } = params;
        if (!courseId || !moduleData) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or moduleData', context.request, { startTime });
        const { data, error } = await supabase.from('course_modules').insert({
          course_id: courseId, title: moduleData.title, description: moduleData.description,
          order_index: moduleData.order, skill_tags: moduleData.skillTags, activities: moduleData.activities,
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'add-lesson': {
        const { moduleId, lessonData } = params;
        if (!moduleId || !lessonData) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleId or lessonData', context.request, { startTime });
        const { data, error } = await supabase.from('lessons').insert({
          module_id: moduleId, title: lessonData.title, description: lessonData.description,
          content: lessonData.content, duration: lessonData.duration, order_index: lessonData.order,
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        const resources = lessonData.resources?.length > 0
          ? await supabase.from('lesson_resources').insert(lessonData.resources.map((r: any, i: number) => ({
              lesson_id: data.lesson_id, name: r.name, type: r.type, url: r.url,
              file_size: r.size, thumbnail_url: r.thumbnailUrl, embed_url: r.embedUrl, order_index: i,
            }))).select()
          : { data: [] };
        return apiSuccess({ lesson: data, resources: resources.data || [] }, context.request, { startTime });
      }

      case 'update-lesson': {
        const { lessonId, updates } = params;
        if (!lessonId || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing lessonId or updates', context.request, { startTime });
        const { error } = await supabase.from('lessons').update({
          title: updates.title, description: updates.description, content: updates.content,
          duration: updates.duration, order_index: updates.order,
        }).eq('lesson_id', lessonId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      case 'delete-lesson': {
        const { lessonId } = params;
        if (!lessonId) return apiError(400, 'VALIDATION_ERROR', 'Missing lessonId', context.request, { startTime });
        const { error } = await supabase.from('lessons').delete().eq('lesson_id', lessonId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'add-resource': {
        const { lessonId, resourceData } = params;
        if (!lessonId || !resourceData) return apiError(400, 'VALIDATION_ERROR', 'Missing lessonId or resourceData', context.request, { startTime });
        const { data, error } = await supabase.from('lesson_resources').insert({
          lesson_id: lessonId, name: resourceData.name, type: resourceData.type, url: resourceData.url,
          file_size: resourceData.size, thumbnail_url: resourceData.thumbnailUrl, embed_url: resourceData.embedUrl,
        }).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-resource': {
        const { resourceId } = params;
        if (!resourceId) return apiError(400, 'VALIDATION_ERROR', 'Missing resourceId', context.request, { startTime });
        const { error } = await supabase.from('lesson_resources').delete().eq('resource_id', resourceId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'update-course-field': {
        const { courseId, field, value } = params;
        if (!courseId || !field) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or field', context.request, { startTime });
        const { error } = await supabase.from('courses').update({ [field]: value }).eq('course_id', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ updated: true }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // ASSIGNMENTS
      // ──────────────────────────────────────────────

      case 'get-educator-assigned-class-ids': {
        const { educatorId } = params;
        if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
        const { data, error } = await supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', educatorId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess((data || []).map((a: any) => a.class_id), context.request, { startTime });
      }

      case 'create-assignment': {
        const { assignmentData } = params;
        if (!assignmentData) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentData', context.request, { startTime });
        const { data, error } = await supabase.from('assignments').insert([{
          title: assignmentData.title, description: assignmentData.description,
          instructions: assignmentData.instructions, course_name: assignmentData.course_name,
          course_code: assignmentData.course_code, educator_id: assignmentData.educator_id,
          educator_name: assignmentData.educator_name, total_points: assignmentData.total_points || 100,
          assignment_type: assignmentData.assignment_type, skill_outcomes: assignmentData.skill_outcomes,
          assign_classes: assignmentData.assign_classes, school_class_id: assignmentData.school_class_id || null,
          document_pdf: assignmentData.document_pdf, due_date: assignmentData.due_date,
          available_from: assignmentData.available_from,
          allow_late_submission: assignmentData.allow_late_submission ?? true,
        }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'create-assignments-for-classes': {
        const { baseData, classIds } = params;
        if (!baseData || !classIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing baseData or classIds', context.request, { startTime });
        const toInsert = classIds.map((classId: string) => ({
          title: baseData.title, description: baseData.description, instructions: baseData.instructions,
          course_name: baseData.course_name, course_code: baseData.course_code,
          educator_id: baseData.educator_id, educator_name: baseData.educator_name,
          total_points: baseData.total_points || 100, assignment_type: baseData.assignment_type,
          skill_outcomes: baseData.skill_outcomes, assign_classes: classId, school_class_id: classId,
          document_pdf: baseData.document_pdf, due_date: baseData.due_date,
          available_from: baseData.available_from, allow_late_submission: baseData.allow_late_submission ?? true,
        }));
        const { data, error } = await supabase.from('assignments').insert(toInsert).select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-assignments-by-educator': {
        const { educatorId } = params;
        if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
        const { data, error } = await supabase
          .from('assignments')
          .select('*, assignment_attachments (*), school_classes (id, name, grade, section)')
          .eq('educator_id', educatorId).eq('is_deleted', false)
          .order('created_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-assignment-by-id': {
        const { assignmentId } = params;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
        const { data, error } = await supabase
          .from('assignments')
          .select('*, assignment_attachments (*)')
          .eq('assignment_id', assignmentId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-assignment': {
        const { assignmentId, updates } = params;
        if (!assignmentId || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or updates', context.request, { startTime });
        const { data, error } = await supabase.from('assignments').update({
          ...updates, updated_date: new Date().toISOString(),
        }).eq('assignment_id', assignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-assignment': {
        const { assignmentId } = params;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
        const { error } = await supabase.from('assignments').update({
          is_deleted: true, updated_date: new Date().toISOString(),
        }).eq('assignment_id', assignmentId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'add-assignment-attachment': {
        const { assignmentId, attachmentData } = params;
        if (!assignmentId || !attachmentData) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or attachmentData', context.request, { startTime });
        const { data, error } = await supabase.from('assignment_attachments').insert([{
          assignment_id: assignmentId, file_name: attachmentData.file_name,
          file_type: attachmentData.file_type, file_size: attachmentData.file_size,
          file_url: attachmentData.file_url,
        }]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'remove-assignment-attachment': {
        const { attachmentId } = params;
        if (!attachmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing attachmentId', context.request, { startTime });
        const { error } = await supabase.from('assignment_attachments').delete().eq('attachment_id', attachmentId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'assign-to-learners': {
        const { assignmentId, learnerIds } = params;
        if (!assignmentId || !learnerIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId or learnerIds', context.request, { startTime });

        const { data: existing } = await supabase.from('learner_assignments').select('learner_id').eq('assignment_id', assignmentId).in('learner_id', learnerIds);
        const existingIds = new Set((existing || []).map((a: any) => a.learner_id));
        const newIds = learnerIds.filter((id: string) => !existingIds.has(id));
        if (newIds.length === 0) return apiSuccess([], context.request, { startTime });

        const { data: userIdMappings } = await supabase.from('learners').select('id, user_id').in('id', newIds);
        const mapped = (userIdMappings || []).map((s: any) => ({
          assignment_id: assignmentId, learner_id: s.user_id,
          status: 'todo', priority: 'medium',
        }));
        const { data, error } = await supabase.from('learner_assignments').insert(mapped).select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-assignment-learners': {
        const { assignmentId } = params;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_assignments')
          .select('*, learners!inner(id, name, email, university, branch_field, college_school_name, registration_number)')
          .eq('assignment_id', assignmentId).eq('is_deleted', false)
          .order('assigned_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'grade-assignment': {
        const { learnerAssignmentId, gradingData } = params;
        if (!learnerAssignmentId || !gradingData) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerAssignmentId or gradingData', context.request, { startTime });
        const { data, error } = await supabase.from('learner_assignments').update({
          grade_received: gradingData.grade_received, instructor_feedback: gradingData.instructor_feedback,
          graded_by: gradingData.graded_by, graded_date: new Date().toISOString(),
          feedback_date: new Date().toISOString(), status: 'graded', updated_date: new Date().toISOString(),
        }).eq('learner_assignment_id', learnerAssignmentId).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-assignment-statistics': {
        const { assignmentId } = params;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_assignments')
          .select('status, grade_percentage, is_late')
          .eq('assignment_id', assignmentId).eq('is_deleted', false);
        if (error) return apiDbError(error, context.request, { startTime });
        const items = data || [];
        const grades = items.filter((a: any) => a.grade_percentage !== null).map((a: any) => a.grade_percentage);
        return apiSuccess({
          total: items.length,
          todo: items.filter((a: any) => a.status === 'todo').length,
          inProgress: items.filter((a: any) => a.status === 'in-progress').length,
          submitted: items.filter((a: any) => a.status === 'submitted').length,
          graded: items.filter((a: any) => a.status === 'graded').length,
          lateSubmissions: items.filter((a: any) => a.is_late).length,
          averageGrade: grades.length > 0 ? Math.round(grades.reduce((s: number, g: number) => s + g, 0) / grades.length) : 0,
        }, context.request, { startTime });
      }

      case 'get-assignment-attachments': {
        const { assignmentId, fileNamePattern } = params;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
        let query = supabase.from('assignment_attachments').select('*').eq('assignment_id', assignmentId);
        if (fileNamePattern) {
          if (fileNamePattern.startsWith('LEARNER:')) {
            query = query.like('file_name', fileNamePattern);
          } else {
            query = query.not('file_name', 'like', 'LEARNER:%');
          }
        }
        if (fileNamePattern?.startsWith('LEARNER:') && fileNamePattern.split(':').length > 2) {
          const learnerLaId = fileNamePattern.split(':')[1];
          query = query.like('file_name', `LEARNER:${learnerLaId}:%`);
        }
        const { data, error } = await query.order('uploaded_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-attachment-by-id': {
        const { attachmentId } = params;
        if (!attachmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing attachmentId', context.request, { startTime });
        const { data, error } = await supabase.from('assignment_attachments').select('file_url, file_name').eq('attachment_id', attachmentId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // MENTOR NOTES
      // ──────────────────────────────────────────────

      case 'save-mentor-note': {
        const { learner_id, mentor_type, school_educator_id, college_lecturer_id, quick_notes, feedback, action_points } = params;
        if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id', context.request, { startTime });
        const { data, error } = await supabase.from('mentor_notes').insert([{
          learner_id, mentor_type, school_educator_id, college_lecturer_id,
          quick_notes, feedback, action_points,
        }]).select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-mentor-learners': {
        const { data, error } = await supabase.from('learners').select('id, name').order('name', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-mentor-notes': {
        const { data, error } = await supabase.from('mentor_notes').select('*, learners(name)').order('note_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'list-mentor-notes': {
        const { select, filters } = params;
        if (!filters?.learner_id?.in) return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id filter', context.request, { startTime });
        let notesQuery = supabase.from('mentor_notes').select(select || '*').in('learner_id', filters.learner_id.in);
        if (filters.note_date?.order) notesQuery = notesQuery.order('note_date', { ascending: filters.note_date.order === 'asc' });
        const { data, error } = await notesQuery;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-mentor-note': {
        const { id, values } = params;
        if (!id || !values) return apiError(400, 'VALIDATION_ERROR', 'Missing id or values', context.request, { startTime });
        const { data, error } = await supabase.from('mentor_notes').update(values).eq('id', id).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // EDUCATOR INFO
      // ──────────────────────────────────────────────

      case 'get-organization-by-id': {
        const { id, select } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select(select || 'name')
          .eq('id', id)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-educator-school-info': {
        const { email, userId } = params;
        if (!email && !userId) return apiError(400, 'VALIDATION_ERROR', 'Missing email or userId', context.request, { startTime });

        const { data: schoolEducator } = await supabase
          .from('school_educators')
          .select('*, organizations!school_educators_school_id_fkey(id, name, code, city, state, country)')
          .eq('email', email)
          .maybeSingle();

        if (schoolEducator?.organizations) {
          const org = Array.isArray(schoolEducator.organizations) ? schoolEducator.organizations[0] : schoolEducator.organizations;
          let classIds: string[] = [];
          if (schoolEducator.role !== 'admin') {
            const { data: assignments } = await supabase.from('school_educator_class_assignments').select('class_id').eq('educator_id', schoolEducator.id);
            classIds = (assignments || []).map((a: any) => a.class_id);
          }
          return apiSuccess({ type: 'school', school: org, educatorRole: schoolEducator.role, assignedClassIds: classIds, educatorId: schoolEducator.id }, context.request, { startTime });
        }

        if (userId) {
          const { data: collegeLecturer } = await supabase.from('college_lecturers').select('id, collegeId').eq('user_id', userId).maybeSingle();
          if (collegeLecturer?.collegeId) {
            const { data: college } = await supabase.from('organizations').select('id, name, code, city, state, country').eq('id', collegeLecturer.collegeId).eq('organization_type', 'college').maybeSingle();
            let classIds: string[] = [];
            if (college) {
              const { data: assignments } = await supabase.from('college_faculty_class_assignments').select('class_id').eq('faculty_id', collegeLecturer.id);
              classIds = (assignments || []).map((a: any) => a.class_id);
            }
            return apiSuccess({ type: 'college', college, educatorRole: 'lecturer', assignedClassIds: classIds, educatorId: collegeLecturer.id }, context.request, { startTime });
          }
        }

        return apiSuccess(null, context.request, { startTime });
      }

      case 'fetch-educator-id': {
        const { userId, email } = params;
        if (!userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });

        if (userId) {
          const { data: school } = await supabase.from('school_educators').select('id').eq('user_id', userId).maybeSingle();
          if (school) return apiSuccess(school.id, context.request, { startTime });
          const { data: college } = await supabase.from('college_lecturers').select('id').eq('user_id', userId).maybeSingle();
          if (college) return apiSuccess(college.id, context.request, { startTime });
        }

        if (email) {
          const { data: schoolByEmail } = await supabase.from('school_educators').select('id').eq('email', email).maybeSingle();
          if (schoolByEmail) return apiSuccess(schoolByEmail.id, context.request, { startTime });
          const { data: collegeByEmail } = await supabase.from('college_lecturers').select('id').eq('email', email).maybeSingle();
          if (collegeByEmail) return apiSuccess(collegeByEmail.id, context.request, { startTime });
        }

        return apiSuccess(null, context.request, { startTime });
      }

      case 'fetch-educator-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('school_educators')
          .select('first_name, last_name, photo_url, email, specialization')
          .eq('email', email)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-school-educator-by-email':
      case 'fetch-school-educator-by-email': {
        const { email, select } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select(select || 'school_id').eq('email', email).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-school-educator-by-user-id':
      case 'fetch-school-educator-by-user-id': {
        const { userId, select } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select(select || 'school_id').eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-school-educator-by-user-id-ilike': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select('*').ilike('email', email).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-school-educator-by-id': {
        const { id, select } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select(select || '*').eq('id', id).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'create-school-educator': {
        const { values } = params;
        if (!values) return apiError(400, 'VALIDATION_ERROR', 'Missing values', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').insert([values]).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-school-educator': {
        const { id, values } = params;
        if (!id || !values) return apiError(400, 'VALIDATION_ERROR', 'Missing id or values', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').update(values).eq('id', id).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-school-educator-by-email': {
        const { email, values } = params;
        if (!email || !values) return apiError(400, 'VALIDATION_ERROR', 'Missing email or values', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').update(values).eq('email', email).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-school-educator': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { error } = await supabase.from('school_educators').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'list-school-educators': {
        const { select, filters } = params;
        if (!filters?.school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id filter', context.request, { startTime });
        let query = supabase.from('school_educators').select(select || '*').eq('school_id', filters.school_id);
        if (filters.role) query = query.eq('role', filters.role);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-college-lecturer-by-user-id':
      case 'fetch-college-lecturer-by-user-id': {
        const { userId, select } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('college_lecturers').select(select || 'user_id').eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-university-educator-by-user-id': {
        const { userId, select } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase.from('college_lecturers').select(select || 'user_id').eq('user_id', userId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'list-organizations': {
        const { select, filters } = params;
        let orgQuery = supabase.from('organizations').select(select || '*');
        if (filters?.organization_type) orgQuery = orgQuery.eq('organization_type', filters.organization_type);
        const { data, error } = await orgQuery;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'save-educator-profile': {
        const { userId, email, updates, isCollege } = params;
        if (!userId && !email) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });
        const table = isCollege ? 'college_lecturers' : 'school_educators';
        const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
        let query = supabase.from(table).update({ ...updates, [tsField]: new Date().toISOString() });
        if (userId) query = query.eq('user_id', userId);
        else if (email) query = query.eq('email', email);
        const { data, error } = await query.select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'update-educator-media': {
        const { userId, table, field, value } = params;
        if (!userId || !table || !field) return apiError(400, 'VALIDATION_ERROR', 'Missing userId, table, or field', context.request, { startTime });
        if (!['school_educators', 'college_lecturers'].includes(table)) return apiError(400, 'VALIDATION_ERROR', 'Invalid table', context.request, { startTime });
        const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
        const { data, error } = await supabase.from(table).update({ [field]: value, [tsField]: new Date().toISOString() }).eq('user_id', userId).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'remove-educator-media': {
        const { userId, table, field } = params;
        if (!userId || !table || !field) return apiError(400, 'VALIDATION_ERROR', 'Missing userId, table, or field', context.request, { startTime });
        if (!['school_educators', 'college_lecturers'].includes(table)) return apiError(400, 'VALIDATION_ERROR', 'Invalid table', context.request, { startTime });
        const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
        const { data, error } = await supabase.from(table).update({ [field]: null, [tsField]: new Date().toISOString() }).eq('user_id', userId).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'remove-experience-letter': {
        const { email, index, userId, isCollege } = params;
        if ((!email && !userId) || index === undefined) return apiError(400, 'VALIDATION_ERROR', 'Missing email/userId or index', context.request, { startTime });
        const table = isCollege ? 'college_lecturers' : 'school_educators';
        const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
        let educatorQuery = supabase.from(table).select('experience_letters_url');
        if (userId) educatorQuery = educatorQuery.eq('user_id', userId);
        else educatorQuery = educatorQuery.eq('email', email);
        const { data: educator } = await educatorQuery.maybeSingle();
        if (!educator) return apiError(404, 'NOT_FOUND', 'Educator not found', context.request, { startTime });
        const urls = (educator.experience_letters_url || []).filter((_: any, i: number) => i !== index);
        let updateQuery = supabase.from(table).update({ experience_letters_url: urls, [tsField]: new Date().toISOString() });
        if (userId) updateQuery = updateQuery.eq('user_id', userId);
        else updateQuery = updateQuery.eq('email', email);
        const { data, error } = await updateQuery.select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-organization-by-admin-id': {
        const { adminId, organizationType } = params;
        if (!adminId) return apiError(400, 'VALIDATION_ERROR', 'Missing adminId', context.request, { startTime });
        let query = supabase.from('organizations').select('id');
        if (organizationType) query = query.eq('organization_type', organizationType);
        const { data, error } = await query.eq('admin_id', adminId).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-organization-by-email': {
        const { email, organizationType } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        let query = supabase.from('organizations').select('id').ilike('email', email);
        if (organizationType) query = query.eq('organization_type', organizationType);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-user-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('users').select('organizationId').eq('email', email).maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'fetch-school-classes': {
        const { schoolId } = params;
        if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId', context.request, { startTime });
        const { data, error } = await supabase
          .from('school_classes')
          .select('id, grade, section, name, academic_year')
          .eq('school_id', schoolId)
          .eq('account_status', 'active');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // COURSE ANALYTICS
      // ──────────────────────────────────────────────

      case 'fetch-course-enrollments': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { data, error } = await supabase.from('course_enrollments').select('*').eq('course_id', courseId).order('enrolled_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-course-progress': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { data, error } = await supabase.from('learner_course_progress').select('*').eq('course_id', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // CONVERSATIONS
      // ──────────────────────────────────────────────

      case 'list-conversations': {
        const { select, filters } = params;
        if (!filters?.educator_id) return apiError(400, 'VALIDATION_ERROR', 'Missing educator_id', context.request, { startTime });
        let query = supabase
          .from('conversations')
          .select(select || '*');
        if (filters.educator_id) query = query.eq('educator_id', filters.educator_id);
        if (filters.conversation_type) query = query.eq('conversation_type', filters.conversation_type);
        if (filters.deleted_by_educator !== undefined) query = query.eq('deleted_by_educator', filters.deleted_by_educator);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.last_message_at?.order) query = query.order('last_message_at', { ascending: filters.last_message_at.order === 'asc' });
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-educator-conversations': {
        const { userId, collegeId, userType, includeArchived } = params;
        if (!userId || !collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or collegeId', context.request, { startTime });

        let query = supabase
          .from('conversations')
          .select('*, college:organizations!conversations_college_id_fkey(id, name, admin_id)')
          .eq('conversation_type', 'college_educator_admin')
          .eq('college_id', collegeId);

        if (userType === 'college_educator') {
          query = query.eq('educator_id', userId).eq('deleted_by_educator', false);
        } else {
          query = query.eq('deleted_by_college_admin', false);
        }

        if (includeArchived) {
          query = query.eq('status', 'archived');
        } else {
          query = query.neq('status', 'archived');
        }

        const { data, error } = await query.order('last_message_at', { ascending: false, nullsFirst: false });
        if (error && (error.message?.includes('college_educator_admin') || error.code === 'PGRST200')) {
          return apiSuccess([], context.request, { startTime });
        }
        if (error) return apiDbError(error, context.request, { startTime });

        const educatorIds = [...new Set((data || []).map((c: any) => c.educator_id).filter(Boolean))];
        let educatorMap: Record<string, any> = {};
        if (educatorIds.length > 0) {
          const { data: educators } = await supabase.from('college_lecturers').select('id, first_name, last_name, email, department, specialization, user_id').in('id', educatorIds);
          if (educators) {
            educatorMap = Object.fromEntries(educators.map((e: any) => [e.id, e]));
          }
        }

        return apiSuccess((data || []).map((c: any) => ({ ...c, college_educator: educatorMap[c.educator_id] || null })), context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER PROFILE (used in educator context)
      // ──────────────────────────────────────────────

      case 'fetch-learner-projects': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('projects').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-certificates': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase.from('certificates').select('*').eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-by-ids': {
        const { ids } = params;
        if (!ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing ids', context.request, { startTime });
        const { data, error } = await supabase.from('learners').select('*').in('id', ids);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-with-filters': {
        const { filters } = params;
        let query = supabase.from('learners').select('*');
        if (filters) {
          if (filters.school_id) query = query.eq('school_id', filters.school_id);
          if (filters.school_class_id) query = query.eq('school_class_id', filters.school_class_id);
          if (filters.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
          if (filters.limit) query = query.limit(filters.limit);
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // LEARNER SELECTION / PROFILE (educator context)
      // ──────────────────────────────────────────────

      case 'fetch-classes-by-ids': {
        const { ids } = params;
        if (!ids?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing ids', context.request, { startTime });
        const { data, error } = await supabase.from('school_classes').select('name, grade, section').in('id', ids);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-assigned-learner-ids': {
        const { assignmentId } = params;
        if (!assignmentId) return apiError(400, 'VALIDATION_ERROR', 'Missing assignmentId', context.request, { startTime });
        const { data, error } = await supabase.from('learner_assignments').select('learner_id').eq('assignment_id', assignmentId).eq('is_deleted', false);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess((data || []).map((a: any) => a.learner_id), context.request, { startTime });
      }

      case 'fetch-learner-assignment-submissions': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('learner_assignments')
          .select('*, assignments(title, description, course_name, course_code, assignment_type, due_date, total_points, skill_outcomes, educator_name)')
          .eq('learner_id', learnerId).eq('is_deleted', false);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learner-profiles-data': {
        const { schoolId, classIds } = params;
        let query = supabase.from('learners').select('profile, grade').eq('is_deleted', false);
        if (schoolId) query = query.eq('school_id', schoolId);
        if (classIds?.length) query = query.in('school_class_id', classIds);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        const depts = [...new Set((data || []).map((s: any) => s.profile?.department).filter(Boolean))];
        const years = [...new Set((data || []).map((s: any) => s.profile?.year || s.grade).filter(Boolean))];
        return apiSuccess({ departments: depts, years }, context.request, { startTime });
      }

      // ──────────────────────────────────────────────
      // NOTIFICATIONS (course notifications)
      // ──────────────────────────────────────────────

      case 'create-course-notification': {
        const { schoolId, type, courseTitle, educatorName } = params;
        if (!schoolId || !type || !courseTitle || !educatorName)
          return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        const { data: learners } = await supabase.from('learners').select('user_id').eq('school_id', schoolId);
        if (learners?.length) {
          const { data: insertedNotifications, error } = await supabase.from('notifications').insert(
            learners.map((l: any) => ({
              recipient_id: l.user_id, type,
              title: type === 'course_added' ? `New Course: ${courseTitle}` : `Course Updated: ${courseTitle}`,
              message: type === 'course_added'
                ? `${educatorName} has added a new course "${courseTitle}"`
                : `${educatorName} has updated the course "${courseTitle}"`,
              read: false,
            }))
          ).select();
          if (error) return apiDbError(error, context.request, { startTime });
          
          if (insertedNotifications) {
            insertedNotifications.forEach(notification => context.waitUntil(notifyRealtime(env as any, 'notifications', 'INSERT', notification)));
          }
        }
        return apiSuccess({ sent: true }, context.request, { startTime });
      }

      case 'db-select': {
        const { table, select: dbSelect, filters: dbFilters } = params;
        const allowedTables = ['learners', 'projects', 'trainings', 'certificates'];
        if (!table || !allowedTables.includes(table)) return apiError(400, 'VALIDATION_ERROR', `Table not allowed: ${table}`, context.request, { startTime });
        let dbQuery = supabase.from(table).select(dbSelect || '*');
        if (dbFilters) {
          if (dbFilters.school_id?.eq) dbQuery = dbQuery.eq('school_id', dbFilters.school_id.eq);
          if (dbFilters.college_id?.eq) dbQuery = dbQuery.eq('college_id', dbFilters.college_id.eq);
          if (dbFilters.school_class_id?.in) dbQuery = dbQuery.in('school_class_id', dbFilters.school_class_id.in);
          if (dbFilters.is_deleted?.eq !== undefined) dbQuery = dbQuery.eq('is_deleted', dbFilters.is_deleted.eq);
          if (dbFilters.learner_id?.in) dbQuery = dbQuery.in('learner_id', dbFilters.learner_id.in);
          if (dbFilters.learner_id?.eq) dbQuery = dbQuery.eq('learner_id', dbFilters.learner_id.eq);
        }
        const { data, error } = await dbQuery;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'db-update': {
        const { table, values, filters } = params;
        const allowedUpdateTables = ['projects', 'trainings', 'certificates'];
        if (!table || !allowedUpdateTables.includes(table)) return apiError(400, 'VALIDATION_ERROR', `Table not allowed: ${table}`, context.request, { startTime });
        if (!values || !filters?.id?.eq) return apiError(400, 'VALIDATION_ERROR', 'Missing values or id filter', context.request, { startTime });
        const { data, error } = await supabase.from(table).update(values).eq('id', filters.id.eq).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'update-educator-table': {
        const { table, values, id, idField } = params;
        const allowedTables2 = ['school_educators', 'college_lecturers'];
        if (!table || !allowedTables2.includes(table)) return apiError(400, 'VALIDATION_ERROR', `Table not allowed: ${table}`, context.request, { startTime });
        if (!values || !id || !idField) return apiError(400, 'VALIDATION_ERROR', 'Missing values, id, or idField', context.request, { startTime });
        const tsField = table === 'college_lecturers' ? 'updatedAt' : 'updated_at';
        const { data, error } = await supabase.from(table).update({ ...values, [tsField]: new Date().toISOString() }).eq(idField, id).select().maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[educator/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
