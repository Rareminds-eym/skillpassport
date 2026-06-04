import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

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
      case 'classwise-stats': {
        const { examId, targetClassIds } = params;
        if (!examId || !targetClassIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing examId or targetClassIds', context.request, { startTime });

        const { data: classes, error: classError } = await supabase
          .from('school_classes')
          .select('id, name, section, grade')
          .in('id', targetClassIds)
          .order('section');
        if (classError) return apiDbError(classError, context.request, { startTime });

        const classwise = await Promise.all(
          (classes || []).map(async (classInfo) => {
            const { data: learners } = await supabase
              .from('learners')
              .select('id')
              .eq('school_class_id', classInfo.id)
              .or('is_deleted.is.null,is_deleted.eq.false');

            const learnerIds = (learners || []).map((s: any) => s.id);

            if (!learnerIds.length) {
              return {
                class_id: classInfo.id, section: classInfo.section, class_name: classInfo.name,
                total_learners: 0, learner_ids: [],
              };
            }

            const { data: markEntries } = await supabase
              .from('mark_entries')
              .select('learner_id, marks_obtained, is_absent, subject_id')
              .eq('assessment_id', examId)
              .in('learner_id', learnerIds);

            return {
              class_id: classInfo.id,
              section: classInfo.section,
              class_name: classInfo.name,
              grade: classInfo.grade,
              total_learners: learnerIds.length,
              learner_ids: learnerIds,
              mark_entries: markEntries || [],
            };
          })
        );

        return apiSuccess(classwise, context.request, { startTime });
      }

      case 'get-learner-exams': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners')
          .select('school_class_id, school_id, grade, section')
          .eq('id', learnerId)
          .single();

        if (learnerError || !learner?.school_class_id) {
          return apiSuccess([], context.request, { startTime });
        }

        const { data: timetableEntries, error: timetableError } = await supabase
          .from('exam_timetable')
          .select(`
            id, assessment_id, course_name, course_code, exam_date,
            start_time, end_time, duration_minutes, room, status,
            assessments!inner(assessment_code, type, total_marks, pass_marks, instructions, status, school_id, target_classes)
          `)
          .eq('school_id', learner.school_id)
          .order('exam_date', { ascending: true });

        if (timetableError) return apiDbError(timetableError, context.request, { startTime });

        const validStatuses = ['scheduled', 'ongoing', 'marks_pending', 'published'];
        const relevantExams = (timetableEntries || []).filter((entry: any) => {
          const assessment = entry.assessments;
          if (!validStatuses.includes(assessment.status)) return false;
          const targetClasses = assessment.target_classes;
          if (!targetClasses) return false;
          if (targetClasses.type === 'whole_grade') return targetClasses.grade === learner.grade;
          if (targetClasses.type === 'single_section') return targetClasses.grade === learner.grade && targetClasses.sections?.includes(learner.section);
          if (targetClasses.class_ids) return targetClasses.class_ids.includes(learner.school_class_id);
          return false;
        });

        const exams = relevantExams.map((entry: any) => {
          const assessment = entry.assessments;
          const overallTotalMarks = parseFloat(assessment.total_marks) || 0;
          let subjectTotalMarks = overallTotalMarks;
          if (assessment.type === 'term_exam' || assessment.type === 'mid_term') {
            subjectTotalMarks = 100;
          }
          return {
            id: entry.id,
            assessment_id: entry.assessment_id,
            assessment_code: assessment.assessment_code || '',
            type: assessment.type || '',
            course_name: entry.course_name || assessment.course_name || '',
            subject_name: entry.course_name || '',
            exam_date: entry.exam_date,
            start_time: entry.start_time,
            end_time: entry.end_time,
            duration_minutes: entry.duration_minutes || 0,
            total_marks: subjectTotalMarks,
            pass_marks: Math.round(subjectTotalMarks * 0.35),
            room: entry.room || '',
            status: assessment.status || '',
            instructions: assessment.instructions,
          };
        });

        return apiSuccess(exams, context.request, { startTime });
      }

      case 'get-learner-results': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners')
          .select('school_class_id, school_id, grade, section')
          .eq('id', learnerId)
          .single();

        if (learnerError || !learner?.school_class_id) {
          return apiSuccess([], context.request, { startTime });
        }

        const { data: markEntries, error: markError } = await supabase
          .from('mark_entries')
          .select(`
            id, assessment_id, marks_obtained, total_marks, percentage, grade,
            is_absent, is_exempt, is_pass, remarks, subject_id,
            original_marks, moderated_by, moderation_reason, moderation_date,
            assessments!inner(assessment_code, type, course_name, status, pass_marks, school_id, target_classes)
          `)
          .eq('learner_id', learnerId);

        if (markError) return apiDbError(markError, context.request, { startTime });

        const relevantResults = (markEntries || []).filter((entry: any) => {
          const assessment = entry.assessments;
          if (assessment.status !== 'published') return false;
          if (assessment.school_id !== learner.school_id) return false;
          const targetClasses = assessment.target_classes;
          if (!targetClasses) return false;
          if (targetClasses.type === 'whole_grade') return targetClasses.grade === learner.grade;
          if (targetClasses.type === 'single_section') return targetClasses.grade === learner.grade && targetClasses.sections?.includes(learner.section);
          if (targetClasses.class_ids) return targetClasses.class_ids.includes(learner.school_class_id);
          return false;
        });

        const assessmentIds = [...new Set(relevantResults.map((r: any) => r.assessment_id))];
        const timetableMap: Record<string, { exam_date: string; subjects: string[] }> = {};

        if (assessmentIds.length > 0) {
          const { data: timetable } = await supabase
            .from('exam_timetable')
            .select('assessment_id, exam_date, course_name')
            .in('assessment_id', assessmentIds);

          if (timetable) {
            timetable.forEach((t: any) => {
              if (!timetableMap[t.assessment_id]) {
                timetableMap[t.assessment_id] = { exam_date: t.exam_date, subjects: [] };
              }
              if (t.course_name && !timetableMap[t.assessment_id].subjects.includes(t.course_name)) {
                timetableMap[t.assessment_id].subjects.push(t.course_name);
              }
            });
          }
        }

        const results = relevantResults.map((entry: any, index: number) => {
          const assessment = entry.assessments;
          const timetableInfo = timetableMap[entry.assessment_id];
          let subjectName = assessment.course_name || '';
          if (timetableInfo?.subjects && timetableInfo.subjects.length > 1) {
            subjectName = timetableInfo.subjects[index % timetableInfo.subjects.length];
          } else if (timetableInfo?.subjects && timetableInfo.subjects.length === 1) {
            subjectName = timetableInfo.subjects[0];
          }

          const subjectTotalMarks = parseFloat(entry.total_marks) || 0;
          const isModerated = entry.original_marks !== null && entry.moderated_by !== null;

          return {
            id: entry.id,
            assessment_id: entry.assessment_id,
            assessment_code: assessment.assessment_code || '',
            type: assessment.type || '',
            course_name: assessment.course_name || '',
            subject_name: subjectName,
            exam_date: timetableInfo?.exam_date || '',
            marks_obtained: entry.marks_obtained ? parseFloat(entry.marks_obtained) : undefined,
            total_marks: subjectTotalMarks,
            percentage: entry.percentage ? parseFloat(entry.percentage) : undefined,
            grade: entry.grade,
            is_absent: entry.is_absent || false,
            is_exempt: entry.is_exempt || false,
            is_pass: entry.is_pass,
            remarks: entry.remarks,
            status: assessment.status,
            pass_marks: Math.round(subjectTotalMarks * 0.35),
            original_marks: entry.original_marks ? parseFloat(entry.original_marks) : undefined,
            is_moderated: isModerated,
            moderation_reason: entry.moderation_reason,
            moderated_by: entry.moderated_by,
            moderation_date: entry.moderation_date,
          };
        }).sort((a: any, b: any) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());

        return apiSuccess(results, context.request, { startTime });
      }

      case 'get-learner-by-id': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const { data, error } = await supabase
          .from('learners')
          .select('school_class_id, school_id, grade, section')
          .eq('id', learnerId)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-educator-by-user-id': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });

        const { data, error } = await supabase
          .from('school_educators')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-educator-user-id': {
        const { educatorId } = params;
        if (!educatorId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });

        const { data, error } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('id', educatorId)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-subject-by-name': {
        const { name, schoolId } = params;
        if (!name || !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing name or schoolId', context.request, { startTime });

        const { data, error } = await supabase
          .from('curriculum_subjects')
          .select('id')
          .eq('name', name)
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[exams/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
