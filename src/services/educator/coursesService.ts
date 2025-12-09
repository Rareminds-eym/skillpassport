import { supabase } from '../../lib/supabaseClient';
import { Course, CourseModule, Lesson, Resource } from '../../types/educator/course';

// =====================================================
// COURSE CRUD OPERATIONS
// =====================================================

/**
 * Get all courses (for admin/college admin to see all courses)
 */
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    console.log('📡 Fetching all courses');
    
    // Step 1: Fetch basic course data only
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError);
      throw coursesError;
    }

    if (!coursesData || coursesData.length === 0) {
      console.log('✅ No courses found');
      return [];
    }

    console.log('✅ Courses fetched:', coursesData.length);
    return await transformCoursesData(coursesData);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    throw error;
  }
};

/**
 * Get all courses for a specific school/college
 * Used by college admins to see all courses in their institution
 */
export const getCoursesBySchool = async (schoolId: string): Promise<Course[]> => {
  try {
    console.log('📡 Fetching courses for school:', schoolId);
    
    // Step 1: Fetch basic course data only
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError);
      throw coursesError;
    }

    if (!coursesData || coursesData.length === 0) {
      console.log('✅ No courses found');
      return [];
    }

    console.log('✅ Courses fetched:', coursesData.length);
    return await transformCoursesData(coursesData);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    throw error;
  }
};

/**
 * Get all courses for the current educator
 * FIXED: Fetch all related data separately to avoid RLS recursion issues
 */
export const getCoursesByEducator = async (educatorId: string): Promise<Course[]> => {
  try {
    console.log('📡 Fetching courses for educator:', educatorId);
    
    // Step 1: Fetch basic course data only
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('educator_id', educatorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError);
      throw coursesError;
    }

    if (!coursesData || coursesData.length === 0) {
      console.log('✅ No courses found');
      return [];
    }

    console.log('✅ Courses fetched:', coursesData.length);
    return await transformCoursesData(coursesData);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    throw error;
  }
};

/**
 * Transform raw course data from database to Course interface
 * Shared by getCoursesByEducator and getCoursesBySchool
 */
const transformCoursesData = async (coursesData: any[]): Promise<Course[]> => {
  try {
    const courseIds = coursesData.map((c: any) => c.course_id);
    console.log('📋 Course IDs for modules query:', courseIds);

    // Debug: Check if user is authenticated with Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('🔐 Supabase session:', sessionData?.session ? 'Active' : 'No session');
    if (sessionData?.session) {
      console.log('🔐 Session user ID:', sessionData.session.user.id);
      console.log('🔐 Session expires at:', new Date(sessionData.session.expires_at! * 1000).toISOString());
    }

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

    console.log('✅ Related data fetched');

    // Process results with better error handling
    let skillsData: any[] = [];
    let classesData: any[] = [];
    let modulesData: any[] = [];
    let coEducatorsData: any[] = [];

    // Handle skills result
    if (skillsResult.status === 'fulfilled') {
      if (skillsResult.value.error) {
        console.warn('⚠️ Skills fetch error:', skillsResult.value.error);
      } else {
        skillsData = skillsResult.value.data || [];
      }
    } else {
      console.warn('⚠️ Skills fetch rejected:', skillsResult.reason);
    }

    // Handle classes result
    if (classesResult.status === 'fulfilled') {
      if (classesResult.value.error) {
        console.warn('⚠️ Classes fetch error:', classesResult.value.error);
      } else {
        classesData = classesResult.value.data || [];
      }
    } else {
      console.warn('⚠️ Classes fetch rejected:', classesResult.reason);
    }

    // Handle modules result - THIS IS THE KEY ONE
    if (modulesResult.status === 'fulfilled') {
      if (modulesResult.value.error) {
        console.error('❌ Modules fetch error:', modulesResult.value.error);
        console.error('Error details:', JSON.stringify(modulesResult.value.error, null, 2));
      } else {
        modulesData = modulesResult.value.data || [];
        console.log('✅ Modules fetched:', modulesData.length, 'modules');
        // Log first module to verify structure
        if (modulesData.length > 0) {
          console.log('📋 First module sample:', JSON.stringify(modulesData[0], null, 2));
        } else {
          // Debug: Try a simple query to see if we can access course_modules at all
          console.log('⚠️ No modules returned, trying debug query...');
          const debugResult = await supabase
            .from('course_modules')
            .select('module_id, course_id, title')
            .limit(5);
          console.log('🔍 Debug query result:', debugResult.data?.length || 0, 'modules');
          if (debugResult.error) {
            console.error('🔍 Debug query error:', debugResult.error);
          } else if (debugResult.data && debugResult.data.length > 0) {
            console.log('🔍 Debug modules found:', debugResult.data);
            console.log('🔍 Checking if any debug module course_id matches our courseIds...');
            const matchingIds = debugResult.data.filter((m: any) => courseIds.includes(m.course_id));
            console.log('🔍 Matching modules:', matchingIds.length);
          }
        }
      }
    } else {
      console.error('❌ Modules fetch rejected:', modulesResult.reason);
    }

    // Handle co-educators result
    if (coEducatorsResult.status === 'fulfilled') {
      if (coEducatorsResult.value.error) {
        console.warn('⚠️ Co-educators fetch error:', coEducatorsResult.value.error);
      } else {
        coEducatorsData = coEducatorsResult.value.data || [];
      }
    } else {
      console.warn('⚠️ Co-educators fetch rejected:', coEducatorsResult.reason);
    }

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
    
    // Log modules map for debugging
    console.log('📊 Modules map keys:', Object.keys(modulesMap));
    console.log('📊 Total modules in map:', Object.values(modulesMap).flat().length);

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

    console.log('✅ Courses transformed:', transformedCourses.length);
    return transformedCourses;
  } catch (error) {
    console.error('❌ Error transforming courses:', error);
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
  educatorName: string,
  schoolId?: string
): Promise<Course> => {
  try {
    console.log('📡 Creating course:', courseData);
    
    // If schoolId not provided, try to get it from school_educators table
    let finalSchoolId = schoolId;
    if (!finalSchoolId) {
      const { data: educatorData } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('user_id', educatorId)
        .single();
      
      if (educatorData) {
        finalSchoolId = educatorData.school_id;
        console.log('✅ School ID retrieved from educator:', finalSchoolId);
      }
    }
    
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
        educator_name: educatorName,
        school_id: finalSchoolId
      })
      .select()
      .single();

    if (courseError) {
      console.error('❌ Error creating course:', courseError);
      throw courseError;
    }

    console.log('✅ Course created:', courseRow.course_id);

    // Insert skills
    if (courseData.skillsCovered.length > 0) {
      console.log('📡 Inserting skills:', courseData.skillsCovered);
      const skillsToInsert = courseData.skillsCovered.map(skill => ({
        course_id: courseRow.course_id,
        skill_name: skill
      }));

      const { error: skillsError } = await supabase
        .from('course_skills')
        .insert(skillsToInsert);

      if (skillsError) {
        console.error('❌ Error inserting skills:', skillsError);
        throw skillsError;
      }
      console.log('✅ Skills inserted');
    }

    // Insert classes
    if (courseData.linkedClasses.length > 0) {
      console.log('📡 Inserting classes:', courseData.linkedClasses);
      const classesToInsert = courseData.linkedClasses.map(className => ({
        course_id: courseRow.course_id,
        class_name: className
      }));

      const { error: classesError } = await supabase
        .from('course_classes')
        .insert(classesToInsert);

      if (classesError) {
        console.error('❌ Error inserting classes:', classesError);
        throw classesError;
      }
      console.log('✅ Classes inserted');
    }

    // Insert modules
    if (courseData.modules.length > 0) {
      console.log('📡 Inserting modules:', courseData.modules.length);
      await insertModules(courseRow.course_id, courseData.modules);
      console.log('✅ Modules inserted');
    }

    // Fetch and return the complete course
    console.log('📡 Fetching complete course data');
    const courses = await getCoursesByEducator(educatorId);
    const newCourse = courses.find(c => c.id === courseRow.course_id);

    if (!newCourse) {
      console.error('❌ Failed to retrieve created course');
      throw new Error('Failed to retrieve created course');
    }

    console.log('✅ Course creation complete');
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
    console.log('📡 Updating course:', courseId, updates);
    
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

    if (courseError) {
      console.error('❌ Error updating course:', courseError);
      throw courseError;
    }

    console.log('✅ Course basic info updated');

    // Update skills if provided
    if (updates.skillsCovered) {
      console.log('📡 Updating skills');
      // Delete existing skills
      await supabase
        .from('course_skills')
        .delete()
        .eq('course_id', courseId);

      // Insert new skills
      if (updates.skillsCovered.length > 0) {
        const skillsToInsert = updates.skillsCovered.map(skill => ({
          course_id: courseId,
          skill_name: skill
        }));

        await supabase
          .from('course_skills')
          .insert(skillsToInsert);
      }
      console.log('✅ Skills updated');
    }

    // Update classes if provided
    if (updates.linkedClasses) {
      console.log('📡 Updating classes');
      // Delete existing classes
      await supabase
        .from('course_classes')
        .delete()
        .eq('course_id', courseId);

      // Insert new classes
      if (updates.linkedClasses.length > 0) {
        const classesToInsert = updates.linkedClasses.map(className => ({
          course_id: courseId,
          class_name: className
        }));

        await supabase
          .from('course_classes')
          .insert(classesToInsert);
      }
      console.log('✅ Classes updated');
    }

    // Get updated course
    console.log('📡 Fetching updated course');
    const { data: courseData } = await supabase
      .from('courses')
      .select('educator_id')
      .eq('course_id', courseId)
      .single();

    if (!courseData) {
      console.error('❌ Course not found');
      throw new Error('Course not found');
    }

    const courses = await getCoursesByEducator(courseData.educator_id);
    const updatedCourse = courses.find(c => c.id === courseId);

    if (!updatedCourse) {
      console.error('❌ Failed to retrieve updated course');
      throw new Error('Failed to retrieve updated course');
    }

    console.log('✅ Course update complete');
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