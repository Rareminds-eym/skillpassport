/**
 * Student Activity Service - Fetch activities related to a specific student
 * This replaces the mock recentUpdates with real data from recruitment tables
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Add a course enrollment activity to recent updates
 * @param {string} studentEmail - Student's email address
 * @param {Object} courseDetails - Course details (title, code, educator_name)
 */
export const addCourseEnrollmentActivity = async (studentEmail, courseDetails) => {
  if (!studentEmail || !courseDetails) {
    return { success: false, error: 'Student email and course details required' };
  }

  try {
    // Get student ID from email
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', studentEmail)
      .single();

    if (studentError || !student) {
      return { success: false, error: 'Student not found' };
    }

    const activity = {
      id: `course-enrolled-${Date.now()}`,
      user: courseDetails.educator_name || 'Instructor',
      action: 'published a new course:',
      candidate: courseDetails.title,
      details: `Course Code: ${courseDetails.code}`,
      timestamp: new Date().toISOString(),
      type: 'course_enrolled',
      icon: 'book-open',
      metadata: {
        courseId: courseDetails.course_id,
        courseCode: courseDetails.code,
        courseTitle: courseDetails.title,
        educatorName: courseDetails.educator_name
      }
    };

    // Store in recent_updates table
    const { data: existingData } = await supabase
      .from('recent_updates')
      .select('updates')
      .eq('student_id', student.id)
      .single();

    let currentUpdates = [];
    if (existingData && existingData.updates && existingData.updates.updates) {
      currentUpdates = existingData.updates.updates;
    }

    // Add new activity to the beginning
    const updatedUpdates = [activity, ...currentUpdates];

    // Keep only latest 20 updates
    const trimmedUpdates = updatedUpdates.slice(0, 20);

    // Upsert the updates
    const { error: upsertError } = await supabase
      .from('recent_updates')
      .upsert({
        student_id: student.id,
        updates: { updates: trimmedUpdates }
      }, {
        onConflict: 'student_id'
      });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    return { success: true, data: activity };
  } catch (error) {
    console.error('Error adding course enrollment activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a new course notification to all students
 * @param {Object} courseDetails - Course details (title, code, educator_name, course_id)
 */
export const notifyAllStudentsNewCourse = async (courseDetails) => {
  console.log('🔔 ========== NEW COURSE NOTIFICATION STARTED ==========');
  console.log('📚 Course Details:', courseDetails);

  if (!courseDetails) {
    console.error('❌ No course details provided');
    return { success: false, error: 'Course details required' };
  }

  try {
    // Get all active students
    console.log('👥 Fetching all students from database...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, email');

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return { success: false, error: studentsError.message };
    }

    console.log(`✅ Found ${students?.length || 0} students in database`);

    if (!students || students.length === 0) {
      console.warn('⚠️ No students found to notify');
      return { success: true, data: { notified: 0 } };
    }

    const activity = {
      id: `course-new-${courseDetails.course_id}-${Date.now()}`,
      message: `New course available: ${courseDetails.title}`,
      details: `Course Code: ${courseDetails.code} • Instructor: ${courseDetails.educator_name}`,
      timestamp: new Date().toISOString(),
      type: 'course_new',
      icon: 'book-open',
      metadata: {
        courseId: courseDetails.course_id,
        courseCode: courseDetails.code,
        courseTitle: courseDetails.title,
        educatorName: courseDetails.educator_name
      }
    };

    console.log('📝 Activity object created:', activity);

    // Add notification to each student's recent updates
    console.log(`🔄 Starting to update ${students.length} student records...`);

    const updatePromises = students.map(async (student, index) => {
      console.log(`  📤 [${index + 1}/${students.length}] Processing student: ${student.email}`);

      // Get existing updates
      const { data: existingData } = await supabase
        .from('recent_updates')
        .select('updates')
        .eq('student_id', student.id)
        .single();

      let currentUpdates = [];
      if (existingData && existingData.updates && existingData.updates.updates) {
        currentUpdates = existingData.updates.updates;
        console.log(`    ℹ️  Student has ${currentUpdates.length} existing updates`);
      } else {
        console.log(`    ℹ️  Student has no existing updates`);
      }

      // Add new activity
      const updatedUpdates = [activity, ...currentUpdates];
      const trimmedUpdates = updatedUpdates.slice(0, 20);

      console.log(`    ✏️  Adding new update (total will be ${trimmedUpdates.length})`);

      // Upsert
      const result = await supabase
        .from('recent_updates')
        .upsert({
          student_id: student.id,
          updates: { updates: trimmedUpdates }
        }, {
          onConflict: 'student_id'
        });

      if (result.error) {
        console.error(`    ❌ Error updating student ${student.email}:`, result.error);
      } else {
        console.log(`    ✅ Successfully updated student ${student.email}`);
      }

      return result;
    });

    console.log('⏳ Waiting for all updates to complete...');
    const results = await Promise.all(updatePromises);

    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    console.log(`✅ Notification complete: ${successCount} succeeded, ${errorCount} failed`);
    console.log('🔔 ========== NEW COURSE NOTIFICATION ENDED ==========');

    return { success: true, data: { notified: students.length, successCount, errorCount } };
  } catch (error) {
    console.error('❌ CRITICAL ERROR in notifyAllStudentsNewCourse:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent activities for a specific student by their email
 * @param {string} studentEmail - Student's email address
 * @param {number} limit - Number of activities to fetch (default: 10)
 */
export const getStudentRecentActivity = async (studentEmail, limit = 10) => {
  
  if (!studentEmail) {
    return { data: [], error: 'Student email required' };
  }

  try {
    const allActivities = [];

    // First, get student ID from email
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, profile')
      .eq('email', studentEmail)
      .single();

    if (studentError || !student) {
      return { data: [], error: 'Student not found' };
    }

    const studentId = student.id;
    const studentProfile = typeof student.profile === 'string' 
      ? JSON.parse(student.profile) 
      : student.profile;
    const studentName = studentProfile?.name || `Student ${studentId}`;


    // 1. Shortlist Activities - When student gets shortlisted
    try {
      const { data: shortlistCandidates } = await supabase
        .from('shortlist_candidates')
        .select(`
          *,
          shortlists(name, created_by)
        `)
        .eq('student_id', studentId)
        .order('added_at', { ascending: false })
        .limit(limit);

      if (shortlistCandidates?.length > 0) {
        shortlistCandidates.forEach(sc => {
          allActivities.push({
            id: `shortlist-${sc.id}`,
            user: sc.added_by || 'Recruiter',
            action: 'shortlisted you for',
            candidate: sc.shortlists?.name || 'a position',
            details: sc.notes || 'Added to recruiter shortlist',
            timestamp: sc.added_at,
            type: 'shortlist_added',
            icon: 'bookmark',
            metadata: {
              shortlistName: sc.shortlists?.name,
              notes: sc.notes
            }
          });
        });
      }
    } catch (error) {
    }

    // 2. Pipeline Activities - Student's recruitment journey
    try {
      const { data: pipelineActivities } = await supabase
        .from('pipeline_activities')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (pipelineActivities?.length > 0) {
        pipelineActivities.forEach(pa => {
          let action = 'updated your status';
          let details = pa.activity_type;

          if (pa.from_stage && pa.to_stage) {
            action = `moved you from ${pa.from_stage} to ${pa.to_stage}`;
            details = 'Pipeline stage update';
          }

          allActivities.push({
            id: `pipeline-activity-${pa.id}`,
            user: pa.performed_by || 'Recruitment Team',
            action: action,
            candidate: '', // Not needed for student view
            details: details,
            timestamp: pa.created_at,
            type: 'pipeline_update',
            icon: 'arrow-right',
            metadata: pa.activity_details
          });
        });
      }
    } catch (error) {
    }

    // 3. Pipeline Candidates - Stage changes
    try {
      const { data: pipelineCandidates } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('candidate_name', studentName) // Match by name for now
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (pipelineCandidates?.length > 0) {
        pipelineCandidates.forEach(pc => {
          const isNew = new Date(pc.created_at).getTime() === new Date(pc.updated_at).getTime();
          let action = isNew ? 'added you to the recruitment pipeline' : `moved you to ${pc.stage} stage`;
          
          if (pc.status === 'rejected') {
            action = 'updated your application status';
          }

          allActivities.push({
            id: `pipeline-candidate-${pc.id}`,
            user: pc.stage_changed_by || pc.added_by || 'Recruitment Team',
            action: action,
            candidate: pc.stage || 'recruitment process',
            details: pc.rejection_reason || (pc.previous_stage ? `from ${pc.previous_stage}` : ''),
            timestamp: pc.updated_at,
            type: pc.status === 'rejected' ? 'application_rejected' : 'stage_change',
            icon: pc.status === 'rejected' ? 'x-circle' : 'users',
            metadata: {
              stage: pc.stage,
              status: pc.status,
              opportunityId: pc.opportunity_id
            }
          });
        });
      }
    } catch (error) {
    }

    // 4. Offers - Job offers for the student
    try {
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('candidate_name', studentName) // Match by name for now
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (offers?.length > 0) {
        offers.forEach(offer => {
          const isNew = new Date(offer.inserted_at).getTime() === new Date(offer.updated_at).getTime();
          let action = isNew ? 'extended an offer to you' : `updated your offer status to ${offer.status}`;
          
          allActivities.push({
            id: `offer-${offer.id}`,
            user: 'HR Team',
            action: action,
            candidate: offer.job_title,
            details: `${offer.job_title}${offer.offered_ctc ? ` - ${offer.offered_ctc}` : ''}`,
            timestamp: offer.updated_at,
            type: offer.status === 'accepted' ? 'offer_accepted' : 
                  offer.status === 'rejected' ? 'offer_rejected' : 'offer_extended',
            icon: offer.status === 'accepted' ? 'check-circle' : 
                  offer.status === 'rejected' ? 'x-circle' : 'document-text',
            metadata: {
              status: offer.status,
              ctc: offer.offered_ctc,
              expiryDate: offer.expiry_date,
              offerDate: offer.offer_date
            }
          });
        });
      }
    } catch (error) {
    }

    // 5. Placements - Final hiring/placement updates
    try {
      const { data: placements } = await supabase
        .from('placements')
        .select('*')
        .eq('studentId', studentId)
        .order('updatedAt', { ascending: false })
        .limit(limit);

      if (placements?.length > 0) {
        placements.forEach(placement => {
          let action = 'updated your placement status';
          if (placement.placementStatus === 'hired') action = 'hired you';
          if (placement.placementStatus === 'applied') action = 'processed your application';

          allActivities.push({
            id: `placement-${placement.id}`,
            user: placement.recruiterId || 'Recruiter',
            action: action,
            candidate: placement.jobTitle,
            details: `${placement.jobTitle}${placement.salaryOffered ? ` - ₹${placement.salaryOffered}` : ''}`,
            timestamp: placement.updatedAt,
            type: placement.placementStatus === 'hired' ? 'placement_hired' : 'placement_update',
            icon: placement.placementStatus === 'hired' ? 'briefcase' : 'clipboard-document-list',
            metadata: {
              status: placement.placementStatus,
              salary: placement.salaryOffered,
              metadata: placement.metadata
            }
          });
        });
      }
    } catch (error) {
    }

    // 6. Profile Updates - Track when student updates their own profile
    // Note: This would require a new table to track profile changes
    // For now, we'll skip this but can add later

    // Sort all activities by timestamp (most recent first)
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take only the requested limit
    const recentActivities = allActivities.slice(0, limit);

    
    return {
      data: recentActivities,
      error: null
    };

  } catch (error) {
    console.error('❌ Error fetching student activities:', error);
    return { 
      data: [], 
      error: error.message || 'Failed to fetch activities' 
    };
  }
};

/**
 * Create a profile update activity (for future use)
 * This can be called when student updates their profile
 */
export const logProfileUpdate = async (studentEmail, section, action, details) => {
  
  // For now, just log to console
  // In the future, we can create a profile_updates table
  const activity = {
    studentEmail,
    section, // 'education', 'skills', 'experience'
    action,  // 'added', 'updated', 'removed'
    details,
    timestamp: new Date().toISOString()
  };

  return { success: true, activity };
};
