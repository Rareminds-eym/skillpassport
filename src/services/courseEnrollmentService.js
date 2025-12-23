import { supabase } from '../lib/supabaseClient';

/**
 * Service for managing course enrollments and student progress
 */
export const courseEnrollmentService = {
  /**
   * Enroll a student in a course
   * @param {string} studentEmail - Student's email
   * @param {string} courseId - Course ID
   * @returns {Object} - Enrollment data
   */
  async enrollStudent(studentEmail, courseId) {
    try {
      // Get student ID from email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, name, email')
        .eq('email', studentEmail)
        .single();

      if (studentError) throw studentError;
      if (!studentData) throw new Error('Student not found');

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
        .eq('student_id', studentData.id)
        .eq('course_id', courseId)
        .maybeSingle();

      // If error occurred, throw it
      if (checkError) {
        console.error('Error checking enrollment:', checkError);
        throw checkError;
      }

      // If enrollment exists, return it
      if (existingEnrollment) {
        console.log('Student already enrolled, returning existing enrollment');
        return {
          success: true,
          message: 'Already enrolled',
          data: existingEnrollment
        };
      }

      // If we reach here, student is not enrolled yet

      // We'll set total_lessons to 0 initially and update it when the student first accesses the course
      const totalLessons = 0;

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: studentData.id,
          student_name: studentData.name,
          student_email: studentData.email,
          course_id: courseId,
          course_title: courseData.title,
          educator_id: courseData.educator_id,
          educator_name: educatorName,
          enrolled_at: new Date().toISOString(),
          progress: 0,
          completed_lessons: [],
          total_lessons: totalLessons,
          status: 'active',
          last_accessed: new Date().toISOString()
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // Update course enrollment count
      await supabase.rpc('increment_course_enrollment', {
        course_id_param: courseId
      });

      return {
        success: true,
        message: 'Enrolled successfully',
        data: enrollment
      };
    } catch (error) {
      console.error('Error enrolling student:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return {
        success: false,
        error: error.message || 'Failed to enroll student'
      };
    }
  },

  /**
   * Update student progress in a course
   * @param {string} studentEmail - Student's email
   * @param {string} courseId - Course ID
   * @param {Array} completedLessons - Array of completed lesson keys (e.g., ["0-0", "0-1"])
   * @returns {Object} - Updated enrollment data
   */
  async updateProgress(studentEmail, courseId, completedLessons) {
    try {
      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', studentEmail)
        .single();

      if (studentError) throw studentError;

      // Get enrollment - use maybeSingle to avoid 406 error
      const { data: enrollment, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollError) throw enrollError;
      if (!enrollment) throw new Error('Enrollment not found');

      // Calculate progress percentage
      const totalLessons = enrollment.total_lessons || 1;
      const progress = Math.round((completedLessons.length / totalLessons) * 100);

      // Determine status
      let status = 'active';
      if (progress === 100) {
        status = 'completed';
      }

      // Update enrollment
      const { data: updated, error: updateError } = await supabase
        .from('course_enrollments')
        .update({
          completed_lessons: completedLessons,
          progress: progress,
          status: status,
          last_accessed: new Date().toISOString(),
          completed_at: progress === 100 ? new Date().toISOString() : null
        })
        .eq('id', enrollment.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      console.error('Error updating progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get student's enrollment for a course
   * @param {string} studentEmail - Student's email
   * @param {string} courseId - Course ID
   * @returns {Object} - Enrollment data
   */
  async getEnrollment(studentEmail, courseId) {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', studentEmail)
        .single();

      if (studentError) throw studentError;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;

      return {
        success: true,
        data: data || null
      };
    } catch (error) {
      console.error('Error getting enrollment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get all enrollments for a student
   * @param {string} studentEmail - Student's email
   * @returns {Array} - List of enrollments
   */
  async getStudentEnrollments(studentEmail) {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', studentEmail)
        .single();

      if (studentError) throw studentError;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', studentData.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error getting student enrollments:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Get all enrollments for a course (for educators)
   * @param {string} courseId - Course ID
   * @returns {Array} - List of enrollments
   */
  async getCourseEnrollments(courseId) {
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
    } catch (error) {
      console.error('Error getting course enrollments:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Get enrollment statistics for an educator
   * @param {string} educatorId - Educator ID
   * @returns {Object} - Enrollment statistics
   */
  async getEducatorEnrollmentStats(educatorId) {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('educator_id', educatorId);

      if (error) throw error;

      const enrollments = data || [];

      const stats = {
        total_enrollments: enrollments.length,
        active_students: enrollments.filter(e => e.status === 'active').length,
        completed_students: enrollments.filter(e => e.status === 'completed').length,
        average_progress: enrollments.length > 0
          ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
          : 0,
        recent_enrollments: enrollments
          .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at))
          .slice(0, 10)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting educator stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default courseEnrollmentService;
