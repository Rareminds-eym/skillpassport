import { supabase } from '../../lib/supabaseClient';
import { Course, CourseModule, Lesson, Resource } from '../../types/educator/course';

// =====================================================
// COURSE CRUD OPERATIONS
// =====================================================

/**
 * Get all courses for the current educator
 * FIXED: Fetch all related data separately to avoid RLS recursion issues
 */
export const getCoursesByEducator = async (educatorId: string): Promise<Course[]> => {
  try {
    // Verify session before making request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication session expired. Please log in again.');
    }
    
    // Step 1: Fetch basic course data only
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('educator_id', educatorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      throw coursesError;
    }

    if (!coursesData || coursesData.length === 0) {
      return [];
    }

    const courseIds = coursesData.map((c: any) => c.course_id);

    // Step 2: Fetch all related data in parallel
    const [
      skillsResult,
      classesResult,
      modulesResult,
      coEducatorsResult
    ] = await Promise.allSettled([
      // Fetch skills
      supabase
        .from('course_skills')
        .select('course_id, skill_name')
        .in('course_id', courseIds),
      
      // Fetch classes
      supabase
        .from('course_classes')
        .select('course_id, class_name')
        .in('course_id', courseIds),
      
      // Fetch modules with nested data
      supabase
        .from('course_modules')
        .select(`
          *,
          lessons (
            *,
            lesson_resources (*)
          )
        `)
        .in('course_id', courseIds)
        .order('order_index', { ascending: true }),
      
      // Fetch co-educators
      supabase
        .from('course_co_educators')
        .select('course_id, educator_name')
        .in('course_id', courseIds)
    ]);

    // Process results
    const skillsData = skillsResult.status === 'fulfilled' ? skillsResult.value.data : [];
    const classesData = classesResult.status === 'fulfilled' ? classesResult.value.data : [];
    const modulesData = modulesResult.status === 'fulfilled' ? modulesResult.value.data : [];
    const coEducatorsData = coEducatorsResult.status === 'fulfilled' ? coEducatorsResult.value.data : [];

    // Log any errors
    if (skillsResult.status === 'rejected') console.error('Skills fetch failed:', skillsResult.reason);
    if (classesResult.status === 'rejected') console.error('Classes fetch failed:', classesResult.reason);
    if (modulesResult.status === 'rejected') console.error('Modules fetch failed:', modulesResult.reason);
    if (coEducatorsResult.status === 'rejected') console.error('Co-educators fetch failed:', coEducatorsResult.reason);

    // Step 3: Build lookup maps
    const skillsMap: { [key: string]: string[] } = {};
    (skillsData || []).forEach((s: any) => {
      if (!skillsMap[s.course_id]) skillsMap[s.course_id] = [];
      skillsMap[s.course_id].push(s.skill_name);
    });

    const classesMap: { [key: string]: string[] } = {};
    (classesData || []).forEach((c: any) => {
      if (!classesMap[c.course_id]) classesMap[c.course_id] = [];
      classesMap[c.course_id].push(c.class_name);
    });

    const modulesMap: { [key: string]: any[] } = {};
    (modulesData || []).forEach((m: any) => {
      if (!modulesMap[m.course_id]) modulesMap[m.course_id] = [];
      modulesMap[m.course_id].push(m);
    });

    const coEducatorsMap: { [key: string]: string[] } = {};
    (coEducatorsData || []).forEach((ce: any) => {
      if (!coEducatorsMap[ce.course_id]) coEducatorsMap[ce.course_id] = [];
      coEducatorsMap[ce.course_id].push(ce.educator_name);
    });

    // Step 4: Transform to match Course interface
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
    console.error('❌ Error fetching courses:', error);
    throw error;
  }
};

/**
 * Get a single course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const { data, error } = await supabase
      .rpc('get_course_full_details', { course_uuid: courseId });

    if (error) throw error;
    if (!data) return null;

    // Transform the data to match Course interface
    // (This would need proper transformation based on the function return structure)
    return data as any; // You'd need to properly map this
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

/**
 * Create a new course
 */
export const createCourse = async (
  courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrollmentCount' | 'completionRate' | 'evidencePending'>,
  educatorId: string,
  educatorName: string
): Promise<Course> => {
  try {
    // Insert course
    const { data: courseRow, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        code: courseData.code,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        status: courseData.status,
        duration: courseData.duration,
        skills_mapped: courseData.skillsMapped,
        total_skills: courseData.totalSkills,
        target_outcomes: courseData.targetOutcomes,
        educator_id: educatorId,
        educator_name: educatorName
      })
      .select()
      .single();

    if (courseError) throw courseError;

    // Insert skills
    if (courseData.skillsCovered.length > 0) {
      const skillsToInsert = courseData.skillsCovered.map(skill => ({
        course_id: courseRow.course_id,
        skill_name: skill
      }));

      const { error: skillsError } = await supabase
        .from('course_skills')
        .insert(skillsToInsert);

      if (skillsError) throw skillsError;
    }

    // Insert classes
    if (courseData.linkedClasses.length > 0) {
      const classesToInsert = courseData.linkedClasses.map(className => ({
        course_id: courseRow.course_id,
        class_name: className
      }));

      const { error: classesError } = await supabase
        .from('course_classes')
        .insert(classesToInsert);

      if (classesError) throw classesError;
    }

    // Insert modules
    if (courseData.modules.length > 0) {
      await insertModules(courseRow.course_id, courseData.modules);
    }

    // Fetch and return the complete course
    const courses = await getCoursesByEducator(educatorId);
    const newCourse = courses.find(c => c.id === courseRow.course_id);

    if (!newCourse) {
      throw new Error('Failed to retrieve created course');
    }

    return newCourse;
  } catch (error) {
    console.error('❌ Error creating course:', error);
    throw error;
  }
};

/**
 * Update an existing course
 */
export const updateCourse = async (
  courseId: string,
  updates: Partial<Course>
): Promise<Course> => {
  try {
    // Update course basic info
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        title: updates.title,
        code: updates.code,
        description: updates.description,
        thumbnail: updates.thumbnail,
        status: updates.status,
        duration: updates.duration,
        skills_mapped: updates.skillsMapped,
        total_skills: updates.totalSkills,
        target_outcomes: updates.targetOutcomes,
        enrollment_count: updates.enrollmentCount,
        completion_rate: updates.completionRate,
        evidence_pending: updates.evidencePending
      })
      .eq('course_id', courseId);

    if (courseError) throw courseError;

    // Update skills if provided
    if (updates.skillsCovered) {
      await supabase
        .from('course_skills')
        .delete()
        .eq('course_id', courseId);

      if (updates.skillsCovered.length > 0) {
        const skillsToInsert = updates.skillsCovered.map(skill => ({
          course_id: courseId,
          skill_name: skill
        }));

        await supabase
          .from('course_skills')
          .insert(skillsToInsert);
      }
    }

    // Update classes if provided
    if (updates.linkedClasses) {
      await supabase
        .from('course_classes')
        .delete()
        .eq('course_id', courseId);

      if (updates.linkedClasses.length > 0) {
        const classesToInsert = updates.linkedClasses.map(className => ({
          course_id: courseId,
          class_name: className
        }));

        await supabase
          .from('course_classes')
          .insert(classesToInsert);
      }
    }

    // Get updated course
    const { data: courseData } = await supabase
      .from('courses')
      .select('educator_id')
      .eq('course_id', courseId)
      .single();

    if (!courseData) throw new Error('Course not found');

    const courses = await getCoursesByEducator(courseData.educator_id);
    const updatedCourse = courses.find(c => c.id === courseId);

    if (!updatedCourse) throw new Error('Failed to retrieve updated course');

    return updatedCourse;
  } catch (error) {
    console.error('❌ Error updating course:', error);
    throw error;
  }
};

/**
 * Delete a course (soft delete)
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('course_id', courseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// =====================================================
// MODULE OPERATIONS
// =====================================================

/**
 * Insert modules with lessons and resources
 */
const insertModules = async (courseId: string, modules: CourseModule[]): Promise<void> => {
  for (const module of modules) {
    const { data: moduleRow, error: moduleError } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: module.title,
        description: module.description,
        order_index: module.order,
        skill_tags: module.skillTags,
        activities: module.activities
      })
      .select()
      .single();

    if (moduleError) throw moduleError;

    // Insert lessons for this module
    if (module.lessons.length > 0) {
      await insertLessons(moduleRow.module_id, module.lessons);
    }
  }
};

/**
 * Add a module to a course
 */
export const addModule = async (
  courseId: string,
  moduleData: Omit<CourseModule, 'id' | 'lessons'>
): Promise<CourseModule> => {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: moduleData.title,
        description: moduleData.description,
        order_index: moduleData.order,
        skill_tags: moduleData.skillTags,
        activities: moduleData.activities
      })
      .select()
      .single();

    if (error) throw error;

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
    console.error('Error adding module:', error);
    throw error;
  }
};

// =====================================================
// LESSON OPERATIONS
// =====================================================

/**
 * Insert lessons with resources
 */
const insertLessons = async (moduleId: string, lessons: Lesson[]): Promise<void> => {
  for (const lesson of lessons) {
    const { data: lessonRow, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleId,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        duration: lesson.duration,
        order_index: lesson.order
      })
      .select()
      .single();

    if (lessonError) throw lessonError;

    // Insert resources for this lesson
    if (lesson.resources.length > 0) {
      await insertResources(lessonRow.lesson_id, lesson.resources);
    }
  }
};

/**
 * Add a lesson to a module
 */
export const addLesson = async (
  moduleId: string,
  lessonData: Omit<Lesson, 'id'>
): Promise<Lesson> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        module_id: moduleId,
        title: lessonData.title,
        description: lessonData.description,
        content: lessonData.content,
        duration: lessonData.duration,
        order_index: lessonData.order
      })
      .select()
      .single();

    if (error) throw error;

    // Insert resources if any
    let resources: Resource[] = [];
    if (lessonData.resources.length > 0) {
      resources = await insertResources(data.lesson_id, lessonData.resources);
    }

    return {
      id: data.lesson_id,
      title: data.title,
      description: data.description,
      content: data.content,
      duration: data.duration,
      order: data.order_index,
      resources
    };
  } catch (error) {
    console.error('Error adding lesson:', error);
    throw error;
  }
};

/**
 * Update a lesson
 */
export const updateLesson = async (
  lessonId: string,
  updates: Partial<Lesson>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lessons')
      .update({
        title: updates.title,
        description: updates.description,
        content: updates.content,
        duration: updates.duration,
        order_index: updates.order
      })
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('lesson_id', lessonId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

// =====================================================
// RESOURCE OPERATIONS
// =====================================================

/**
 * Insert resources
 */
const insertResources = async (lessonId: string, resources: Resource[]): Promise<Resource[]> => {
  const resourcesToInsert = resources.map((resource, index) => ({
    lesson_id: lessonId,
    name: resource.name,
    type: resource.type,
    url: resource.url,
    file_size: resource.size,
    thumbnail_url: resource.thumbnailUrl,
    embed_url: resource.embedUrl,
    order_index: index
  }));

  const { data, error } = await supabase
    .from('lesson_resources')
    .insert(resourcesToInsert)
    .select();

  if (error) throw error;

  return (data || []).map((res: any) => ({
    id: res.resource_id,
    name: res.name,
    type: res.type,
    url: res.url,
    size: res.file_size,
    thumbnailUrl: res.thumbnail_url,
    embedUrl: res.embed_url
  }));
};

/**
 * Add a resource to a lesson
 */
export const addResource = async (
  lessonId: string,
  resourceData: Omit<Resource, 'id'>
): Promise<Resource> => {
  try {
    const { data, error } = await supabase
      .from('lesson_resources')
      .insert({
        lesson_id: lessonId,
        name: resourceData.name,
        type: resourceData.type,
        url: resourceData.url,
        file_size: resourceData.size,
        thumbnail_url: resourceData.thumbnailUrl,
        embed_url: resourceData.embedUrl
      })
      .select()
      .single();

    if (error) throw error;

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
    console.error('Error adding resource:', error);
    throw error;
  }
};

/**
 * Delete a resource
 */
export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('lesson_resources')
      .delete()
      .eq('resource_id', resourceId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Update course enrollment count
 */
export const updateEnrollmentCount = async (
  courseId: string,
  count: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ enrollment_count: count })
      .eq('course_id', courseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating enrollment count:', error);
    throw error;
  }
};

/**
 * Update course completion rate
 */
export const updateCompletionRate = async (
  courseId: string,
  rate: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ completion_rate: rate })
      .eq('course_id', courseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating completion rate:', error);
    throw error;
  }
};