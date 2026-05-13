/**
 * Course Enrollment Service
 * Handles course enrollment operations and enrollment management
 * 
 * Extracted from courseEnrollmentService.js
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('enrollment-service');

// ═══════════════════════════════════════════════════════════════════════════
// ENROLLMENT OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enroll a learner in a course
 * @param {string} learnerEmail - Learner's email
 * @param {string} courseId - Course ID
 * @returns {Object} - Enrollment data
 */
export async function enrollLearner(learnerEmail: string, courseId: string) {
  try {
    // Get learner ID from email
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id, name, email')
      .eq('email', learnerEmail)
      .single();

    if (learnerError) throw learnerError;
    if (!learnerData) throw new Error('Learner not found');

    // Get course details with educator name - join directly to users since admin_users.id = users.id
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select(`
        course_id, 
        title, 
        educator_id
      `)
      .eq('course_id', courseId)
      .single();

    if (courseError) throw courseError;
    if (!courseData) throw new Error('Course not found');

    // Get educator name separately to avoid complex joins
    let educatorName = 'Unknown Educator';
    if (courseData.educator_id) {
      const { data: educatorData } = await supabase
        .from('users')
        .select('firstName, lastName, email')
        .eq('id', courseData.educator_id)
        .single();
      
      if (educatorData) {
        educatorName = `${educatorData.firstName || ''} ${educatorData.lastName || ''}`.trim() || educatorData.email || 'Unknown Educator';
      }
    }

    // Check if already enrolled - use maybeSingle to avoid 406 error
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('learner_id', learnerData.id)
      .eq('course_id', courseId)
      .maybeSingle();

    // If error occurred, throw it
    if (checkError) {
      logger.error('Error checking enrollment', checkError instanceof Error ? checkError : new Error(String(checkError)));
      throw checkError;
    }

    // If enrollment exists, return it
    if (existingEnrollment) {
      // Update last_accessed and ensure progress is at least 1 (so it shows in My Learning)
      const updateData = { 
        last_accessed: new Date().toISOString(),
        status: existingEnrollment.status === 'completed' ? 'completed' : 'in_progress'
      };
      
      // If progress is 0, set it to 1 to indicate the learner has started the course
      if (existingEnrollment.progress === 0) {
        updateData.progress = 1;
      }
      
      await supabase
        .from('course_enrollments')
        .update(updateData)
        .eq('id', existingEnrollment.id);
      
      return {
        success: true,
        message: 'Already enrolled',
        data: { ...existingEnrollment, ...updateData }
      };
    }

    // If we reach here, learner is not enrolled yet

    // Get total lessons count from course modules
    const { data: modulesData } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        lessons!fk_module (lesson_id)
      `)
      .eq('course_id', courseId);

    const totalLessons = modulesData?.reduce((acc, module) => 
      acc + (module.lessons?.length || 0), 0) || 0;

    // Create enrollment with progress=1 so it shows in My Learning immediately
    const { data: enrollment, error: enrollError } = await supabase
      .from('course_enrollments')
      .insert({
        learner_id: learnerData.id,
        learner_name: learnerData.name,
        learner_email: learnerData.email,
        course_id: courseId,
        course_title: courseData.title,
        educator_id: courseData.educator_id,
        educator_name: educatorName,
        enrolled_at: new Date().toISOString(),
        progress: 1,  // Start with 1% so it shows in My Learning
        completed_lessons: [],
        total_lessons: totalLessons,
        status: 'active',
        last_accessed: new Date().toISOString()
      })
      .select()
      .single();

    // Handle duplicate key error (race condition from React StrictMode)
    if (enrollError && enrollError.code === '23505') {
      const { data: existingRecord } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('learner_id', learnerData.id)
        .eq('course_id', courseId)
        .maybeSingle();
      
      if (existingRecord) {
        return {
          success: true,
          message: 'Already enrolled',
          data: existingRecord
        };
      }
    }

    if (enrollError) throw enrollError;

    // Update course enrollment count (ignore if RPC doesn't exist)
    try {
      await supabase.rpc('increment_course_enrollment', {
        course_id_param: courseId
      });
    } catch (rpcError) {
      // Ignore - RPC may not exist
    }

    return {
      success: true,
      message: 'Enrolled successfully',
      data: enrollment
    };
  } catch (error: any) {
    logger.error('Error enrolling learner', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message || 'Failed to enroll learner'
    };
  }
}

/**
 * Update learner progress in a course
 * @param {string} learnerEmail - Learner's email
 * @param {string} courseId - Course ID
 * @param {Array} completedLessons - Array of completed lesson keys (e.g., ["0-0", "0-1"])
 * @returns {Object} - Updated enrollment data
 */
export async function updateProgress(learnerEmail: string, courseId: string, completedLessons: string[]) {
  try {
    // Get learner ID
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('email', learnerEmail)
      .single();

    if (learnerError) throw learnerError;

    // Get enrollment - use maybeSingle to avoid 406 error
    const { data: enrollment, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('learner_id', learnerData.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollError) throw enrollError;
    if (!enrollment) throw new Error('Enrollment not found');

    // Calculate progress percentage
    const totalLessons = enrollment.total_lessons || completedLessons.length || 1;
    const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));

    // Determine status
    let status = 'active';
    if (progress >= 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'in_progress';
    }

    // Update enrollment
    const { data: updated, error: updateError } = await supabase
      .from('course_enrollments')
      .update({
        completed_lessons: completedLessons,
        progress: progress,
        status: status,
        last_accessed: new Date().toISOString(),
        completed_at: progress >= 100 ? new Date().toISOString() : null
      })
      .eq('id', enrollment.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Embedding regeneration handled by database trigger on course_enrollments

    return {
      success: true,
      data: updated
    };
  } catch (error: any) {
    logger.error('Error updating progress', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENROLLMENT QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get learner's enrollment for a course
 * @param {string} learnerEmail - Learner's email
 * @param {string} courseId - Course ID
 * @returns {Object} - Enrollment data
 */
export async function getEnrollment(learnerEmail: string, courseId: string) {
  try {
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('email', learnerEmail)
      .single();

    if (learnerError) throw learnerError;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('learner_id', learnerData.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      data: data || null
    };
  } catch (error: any) {
    logger.error('Error getting enrollment', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all enrollments for a learner
 * @param {string} learnerEmail - Learner's email
 * @returns {Array} - List of enrollments
 */
export async function getlearnerEnrollments(learnerEmail: string) {
  try {
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('email', learnerEmail)
      .single();

    if (learnerError) throw learnerError;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('learner_id', learnerData.id)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    logger.error('Error getting learner enrollments', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Get all enrollments for a course (for educators)
 * @param {string} courseId - Course ID
 * @returns {Array} - List of enrollments
 */
export async function getCourseEnrollments(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    logger.error('Error getting course enrollments', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENROLLMENT STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get enrollment statistics for an educator
 * @param {string} educatorId - Educator ID
 * @returns {Object} - Enrollment statistics
 */
export async function getEducatorEnrollmentStats(educatorId: string) {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('educator_id', educatorId);

    if (error) throw error;

    const enrollments = data || [];

    const stats = {
      total_enrollments: enrollments.length,
      active_learners: enrollments.filter(e => e.status === 'active').length,
      completed_learners: enrollments.filter(e => e.status === 'completed').length,
      average_progress: enrollments.length > 0
        ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
        : 0,
      recent_enrollments: enrollments
        .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())
        .slice(0, 10)
    };

    return {
      success: true,
      data: stats
    };
  } catch (error: any) {
    logger.error('Error getting educator stats', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const enrollmentService = {
  enrollLearner,
  updateProgress,
  getEnrollment,
  getlearnerEnrollments,
  getCourseEnrollments,
  getEducatorEnrollmentStats,
};

export default enrollmentService;
