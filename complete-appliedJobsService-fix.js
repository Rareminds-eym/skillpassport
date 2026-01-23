// Complete fixed versions of the remaining methods
// Copy these to replace the existing methods in src/services/appliedJobsService.js

/**
 * Withdraw application
 * @param {string} applicationId - Application ID (UUID)
 * @param {string} studentId - Student user_id (auth UUID) for verification
 * @returns {Promise<Object>} Result
 */
static async withdrawApplication(applicationId, studentId) {
  try {
    // Get student's id from user_id
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentId)
      .maybeSingle();

    if (!student) {
      return { success: false, message: 'Student profile not found' };
    }

    const { data, error } = await supabase
      .from('applied_jobs')
      .update({
        application_status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('student_id', student.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, message: 'Application withdrawn successfully', data };
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return { success: false, message: error.message || 'Failed to withdraw application', error };
  }
}

/**
 * Delete application completely
 * @param {string} applicationId - Application ID (UUID)
 * @param {string} studentId - Student user_id (auth UUID) for verification
 * @returns {Promise<Object>} Result
 */
static async deleteApplication(applicationId, studentId) {
  try {
    // Get student's id from user_id
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentId)
      .maybeSingle();

    if (!student) {
      return { success: false, message: 'Student profile not found' };
    }

    const { error } = await supabase
      .from('applied_jobs')
      .delete()
      .eq('id', applicationId)
      .eq('student_id', student.id);

    if (error) throw error;
    return { success: true, message: 'Application deleted successfully' };
  } catch (error) {
    console.error('Error deleting application:', error);
    return { success: false, message: error.message || 'Failed to delete application', error };
  }
}

/**
 * Get recent applications (last 30 days)
 * @param {string} studentId - Student's user_id (auth UUID)
 * @returns {Promise<Array>} Recent applications
 */
static async getRecentApplications(studentId) {
  try {
    // Get student's id from user_id
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentId)
      .maybeSingle();

    if (!student) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('applied_jobs')
      .select('*, opportunity:opportunities!fk_applied_jobs_opportunity(job_title, company_name, company_logo)')
      .eq('student_id', student.id)
      .gte('applied_at', thirtyDaysAgo.toISOString())
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getRecentApplications:', error);
    throw error;
  }
}
