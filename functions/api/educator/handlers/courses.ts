import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);

export async function handleGetAllCourses(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { status } = params;
  let coursesQuery = supabase.from('courses').select('*').is('deleted_at', null);
  if (status?.in) {
    coursesQuery = coursesQuery.in('status', status.in);
  }
  const { data, error } = await coursesQuery.order('created_at', { ascending: false });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || [], context.request, { startTime });
}

export async function handleGetCoursesBySchool(params: any, context: AuthenticatedContext, startTime: number) {
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

export async function handleGetCoursesByEducator(params: any, context: AuthenticatedContext, startTime: number) {
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

export async function handleGetCourseFullData(params: any, context: AuthenticatedContext, startTime: number) {
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

export async function handleGetCourse(params: any, context: AuthenticatedContext, startTime: number) {
  const { courseId } = params;
  if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
  const { data, error } = await supabase.rpc('get_course_full_details', { course_uuid: courseId });
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleFetchCourseSchoolId(params: any, context: AuthenticatedContext, startTime: number) {
  const { courseId } = params;
  if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
  const { data, error } = await supabase.from('courses').select('school_id').eq('course_id', courseId).single();
  if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
  return apiSuccess(data || null, context.request, { startTime });
}

export async function handleCreateCourse(params: any, context: AuthenticatedContext, startTime: number) {
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

export async function handleUpdateCourse(params: any, context: AuthenticatedContext, startTime: number) {
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

export async function handleDeleteCourse(params: any, context: AuthenticatedContext, startTime: number) {
  const { courseId } = params;
  if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
  const { error } = await supabase.from('courses').update({ deleted_at: new Date().toISOString() }).eq('course_id', courseId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleAddModule(params: any, context: AuthenticatedContext, startTime: number) {
  const { courseId, moduleData } = params;
  if (!courseId || !moduleData) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or moduleData', context.request, { startTime });
  const { data, error } = await supabase.from('course_modules').insert({
    course_id: courseId, title: moduleData.title, description: moduleData.description,
    order_index: moduleData.order, skill_tags: moduleData.skillTags, activities: moduleData.activities,
  }).select().single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleAddLesson(params: any, context: AuthenticatedContext, startTime: number) {
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

export async function handleUpdateLesson(params: any, context: AuthenticatedContext, startTime: number) {
  const { lessonId, updates } = params;
  if (!lessonId || !updates) return apiError(400, 'VALIDATION_ERROR', 'Missing lessonId or updates', context.request, { startTime });
  const { error } = await supabase.from('lessons').update({
    title: updates.title, description: updates.description, content: updates.content,
    duration: updates.duration, order_index: updates.order,
  }).eq('lesson_id', lessonId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ updated: true }, context.request, { startTime });
}

export async function handleDeleteLesson(params: any, context: AuthenticatedContext, startTime: number) {
  const { lessonId } = params;
  if (!lessonId) return apiError(400, 'VALIDATION_ERROR', 'Missing lessonId', context.request, { startTime });
  const { error } = await supabase.from('lessons').delete().eq('lesson_id', lessonId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleAddResource(params: any, context: AuthenticatedContext, startTime: number) {
  const { lessonId, resourceData } = params;
  if (!lessonId || !resourceData) return apiError(400, 'VALIDATION_ERROR', 'Missing lessonId or resourceData', context.request, { startTime });
  const { data, error } = await supabase.from('lesson_resources').insert({
    lesson_id: lessonId, name: resourceData.name, type: resourceData.type, url: resourceData.url,
    file_size: resourceData.size, thumbnail_url: resourceData.thumbnailUrl, embed_url: resourceData.embedUrl,
  }).select().single();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
}

export async function handleDeleteResource(params: any, context: AuthenticatedContext, startTime: number) {
  const { resourceId } = params;
  if (!resourceId) return apiError(400, 'VALIDATION_ERROR', 'Missing resourceId', context.request, { startTime });
  const { error } = await supabase.from('lesson_resources').delete().eq('resource_id', resourceId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ deleted: true }, context.request, { startTime });
}

export async function handleUpdateCourseField(params: any, context: AuthenticatedContext, startTime: number) {
  const { courseId, field, value } = params;
  if (!courseId || !field) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or field', context.request, { startTime });
  const { error } = await supabase.from('courses').update({ [field]: value }).eq('course_id', courseId);
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ updated: true }, context.request, { startTime });
}





