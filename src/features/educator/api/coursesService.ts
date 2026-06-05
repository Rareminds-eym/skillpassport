import { apiPost } from '@/shared/api/apiClient';
import { Course, CourseModule, Lesson, Resource } from '@/shared/types/educator/course';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-courses');

const createCourseNotification = async (
  type: 'course_added' | 'course_updated',
  courseId: string,
  courseTitle: string,
  educatorName: string,
  schoolId?: string
): Promise<void> => {
  try {
    let finalSchoolId = schoolId;
    if (!finalSchoolId) {
      const res = await apiPost('/educator/actions', { action: 'fetch-course-school-id', courseId });
      if (res?.data?.school_id) finalSchoolId = res.data.school_id;
    }
    if (!finalSchoolId) return;
    await apiPost('/educator/actions', {
      action: 'create-course-notification',
      schoolId: finalSchoolId,
      type,
      courseTitle,
      educatorName,
    });
  } catch (error) {
    logger.error('Error in createCourseNotification', error as Error, { courseId });
  }
};

const transformCoursesData = async (coursesData: any[]): Promise<Course[]> => {
  try {
    const courseIds = coursesData.map((c: any) => c.course_id);
    const res = await apiPost('/educator/actions', { action: 'get-course-full-data', courseIds });
    const { skills, classes, modules, coEducators } = res?.data || { skills: [], classes: [], modules: [], coEducators: [] };

    const skillsMap: { [key: string]: string[] } = {};
    (skills || []).forEach((s: any) => {
      if (!skillsMap[s.course_id]) skillsMap[s.course_id] = [];
      skillsMap[s.course_id].push(s.skill_name);
    });

    const classesMap: { [key: string]: string[] } = {};
    (classes || []).forEach((c: any) => {
      if (!classesMap[c.course_id]) classesMap[c.course_id] = [];
      classesMap[c.course_id].push(c.class_name);
    });

    const modulesMap: { [key: string]: any[] } = {};
    (modules || []).forEach((m: any) => {
      if (!modulesMap[m.course_id]) modulesMap[m.course_id] = [];
      modulesMap[m.course_id].push(m);
    });

    const coEducatorsMap: { [key: string]: string[] } = {};
    (coEducators || []).forEach((ce: any) => {
      if (!coEducatorsMap[ce.course_id]) coEducatorsMap[ce.course_id] = [];
      coEducatorsMap[ce.course_id].push(ce.educator_name);
    });

    const transformedCourses = coursesData.map((courseRow: any) => ({
      id: courseRow.course_id,
      title: courseRow.title,
      code: courseRow.code,
      description: courseRow.description,
      thumbnail: courseRow.thumbnail,
      status: courseRow.status,
      duration: courseRow.duration,
      skillsCovered: skillsMap[courseRow.course_id] || [],
      skillsMapped: courseRow.skills_mapped || 0,
      totalSkills: courseRow.total_skills || 0,
      enrollmentCount: courseRow.enrollment_count || 0,
      completionRate: courseRow.completion_rate || 0,
      evidencePending: courseRow.evidence_pending || 0,
      linkedClasses: classesMap[courseRow.course_id] || [],
      targetOutcomes: courseRow.target_outcomes || [],
      modules: (modulesMap[courseRow.course_id] || []).map((mod: any) => ({
        id: mod.module_id,
        title: mod.title,
        description: mod.description || '',
        skillTags: mod.skill_tags || [],
        activities: mod.activities || [],
        order: mod.order_index,
        lessons: (mod.lessons || []).map((les: any) => ({
          id: les.lesson_id,
          title: les.title,
          content: les.content || '',
          description: les.description || '',
          duration: les.duration || '',
          order: les.order_index,
          resources: (les.lesson_resources || []).map((res: any) => ({
            id: res.resource_id,
            name: res.name,
            type: res.type,
            url: res.url,
            size: res.file_size,
            thumbnailUrl: res.thumbnail_url,
            embedUrl: res.embed_url
          }))
        }))
      })),
      coEducators: coEducatorsMap[courseRow.course_id] || [],
      createdAt: courseRow.created_at,
      updatedAt: courseRow.updated_at
    }));

    return transformedCourses;
  } catch (error) {
    logger.error('Error transforming courses', error as Error);
    throw error;
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-all-courses' });
    const coursesData = res?.data || [];
    if (coursesData.length === 0) return [];
    return await transformCoursesData(coursesData);
  } catch (error) {
    logger.error('Error fetching all courses', error as Error);
    throw error;
  }
};

export const getCoursesBySchool = async (schoolId: string): Promise<Course[]> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-courses-by-school', schoolId });
    const coursesData = res?.data || [];
    if (coursesData.length === 0) return [];
    return await transformCoursesData(coursesData);
  } catch (error) {
    logger.error('Error fetching courses by school', error as Error, { schoolId });
    throw error;
  }
};

export const getCoursesByEducator = async (educatorId: string): Promise<Course[]> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-courses-by-educator', educatorId });
    const coursesData = res?.data || [];
    if (coursesData.length === 0) return [];
    return await transformCoursesData(coursesData);
  } catch (error) {
    logger.error('Error fetching courses by educator', error as Error, { educatorId });
    throw error;
  }
};

export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-course-by-id', courseId });
    if (!res?.data) return null;
    return res.data as any;
  } catch (error) {
    logger.error('Error fetching course by ID', error as Error, { courseId });
    throw error;
  }
};

export const createCourse = async (
  courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrollmentCount' | 'completionRate' | 'evidencePending'>,
  educatorId: string,
  educatorName: string,
  schoolId?: string
): Promise<Course> => {
  try {
    const res = await apiPost('/educator/actions', {
      action: 'create-course',
      courseData,
      educatorId,
      educatorName,
      schoolId,
    });
    if (!res?.data) throw new Error('Failed to create course');

    const courses = await getCoursesByEducator(educatorId);
    const newCourse = courses.find(c => c.id === res.data.course_id);
    if (!newCourse) throw new Error('Failed to retrieve created course');
    return newCourse;
  } catch (error) {
    logger.error('Error creating course', error as Error, { educatorId, courseTitle: courseData.title });
    throw error;
  }
};

export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<Course> => {
  try {
    await apiPost('/educator/actions', { action: 'update-course', courseId, updates });

    const res = await apiPost('/educator/actions', { action: 'get-all-courses' });
    const courses = res?.data || [];
    const courseRow = courses.find((c: any) => c.course_id === courseId);
    if (!courseRow) throw new Error('Course not found');

    await createCourseNotification(
      'course_updated',
      courseId,
      updates.title || courseRow.title,
      courseRow.educator_name,
      courseRow.school_id
    );

    const educatorCourses = await getCoursesByEducator(courseRow.educator_id);
    const updatedCourse = educatorCourses.find(c => c.id === courseId);
    if (!updatedCourse) throw new Error('Failed to retrieve updated course');
    return updatedCourse;
  } catch (error) {
    logger.error('Error updating course', error as Error, { courseId });
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await apiPost('/educator/actions', { action: 'delete-course', courseId });
  } catch (error) {
    throw error;
  }
};

const insertModules = async (courseId: string, modules: CourseModule[]): Promise<void> => {
  for (const module of modules) {
    const res = await apiPost('/educator/actions', { action: 'add-module', courseId, moduleData: module });
    if (!res?.data) throw new Error('Failed to insert module');
    if (module.lessons.length > 0) {
      await insertLessons(res.data.module_id, module.lessons);
    }
  }
};

export const addModule = async (courseId: string, moduleData: Omit<CourseModule, 'id' | 'lessons'>): Promise<CourseModule> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'add-module', courseId, moduleData });
    if (!res?.data) throw new Error('Failed to add module');
    const data = res.data;
    return {
      id: data.module_id,
      title: data.title,
      description: data.description,
      skillTags: data.skill_tags || [],
      activities: data.activities || [],
      order: data.order_index,
      lessons: []
    };
  } catch (error) {
    logger.error('Error adding module', error as Error, { courseId, moduleTitle: moduleData.title });
    throw error;
  }
};

const insertLessons = async (moduleId: string, lessons: Lesson[]): Promise<void> => {
  for (const lesson of lessons) {
    const res = await apiPost('/educator/actions', { action: 'add-lesson', moduleId, lessonData: lesson });
    if (!res?.data) throw new Error('Failed to insert lesson');
  }
};

export const addLesson = async (moduleId: string, lessonData: Omit<Lesson, 'id'>): Promise<Lesson> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'add-lesson', moduleId, lessonData });
    if (!res?.data) throw new Error('Failed to add lesson');
    const { lesson, resources } = res.data;
    return {
      id: lesson.lesson_id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      duration: lesson.duration,
      order: lesson.order_index,
      resources: (resources || []).map((r: any) => ({
        id: r.resource_id,
        name: r.name,
        type: r.type,
        url: r.url,
        size: r.file_size,
        thumbnailUrl: r.thumbnail_url,
        embedUrl: r.embed_url
      }))
    };
  } catch (error) {
    logger.error('Error adding lesson', error as Error, { moduleId, lessonTitle: lessonData.title });
    throw error;
  }
};

export const updateLesson = async (lessonId: string, updates: Partial<Lesson>): Promise<void> => {
  try {
    await apiPost('/educator/actions', { action: 'update-lesson', lessonId, updates });
  } catch (error) {
    logger.error('Error updating lesson', error as Error, { lessonId });
    throw error;
  }
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    await apiPost('/educator/actions', { action: 'delete-lesson', lessonId });
  } catch (error) {
    logger.error('Error deleting lesson', error as Error, { lessonId });
    throw error;
  }
};

const insertResources = async (lessonId: string, resources: Resource[]): Promise<Resource[]> => {
  const results: Resource[] = [];
  for (const resource of resources) {
    const res = await apiPost('/educator/actions', { action: 'add-resource', lessonId, resourceData: resource });
    if (res?.data) {
      results.push({
        id: res.data.resource_id,
        name: res.data.name,
        type: res.data.type,
        url: res.data.url,
        size: res.data.file_size,
        thumbnailUrl: res.data.thumbnail_url,
        embedUrl: res.data.embed_url
      });
    }
  }
  return results;
};

export const addResource = async (lessonId: string, resourceData: Omit<Resource, 'id'>): Promise<Resource> => {
  try {
    const res = await apiPost('/educator/actions', { action: 'add-resource', lessonId, resourceData });
    if (!res?.data) throw new Error('Failed to add resource');
    const data = res.data;
    return {
      id: data.resource_id,
      name: data.name,
      type: data.type,
      url: data.url,
      size: data.file_size,
      thumbnailUrl: data.thumbnail_url,
      embedUrl: data.embed_url
    };
  } catch (error) {
    logger.error('Error adding resource', error as Error, { lessonId, resourceName: resourceData.name });
    throw error;
  }
};

export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    await apiPost('/educator/actions', { action: 'delete-resource', resourceId });
  } catch (error) {
    logger.error('Error deleting resource', error as Error, { resourceId });
    throw error;
  }
};

export const updateEnrollmentCount = async (courseId: string, count: number): Promise<void> => {
  try {
    await apiPost('/educator/actions', { action: 'update-course-field', courseId, field: 'enrollment_count', value: count });
  } catch (error) {
    logger.error('Error updating enrollment count', error as Error, { courseId, count });
    throw error;
  }
};

export const updateCompletionRate = async (courseId: string, rate: number): Promise<void> => {
  try {
    await apiPost('/educator/actions', { action: 'update-course-field', courseId, field: 'completion_rate', value: rate });
  } catch (error) {
    logger.error('Error updating completion rate', error as Error, { courseId, rate });
    throw error;
  }
};
