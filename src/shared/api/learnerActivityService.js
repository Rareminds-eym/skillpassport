/**
 * Learner Activity Service - Fetch activities related to a specific learner
 * This replaces the mock recentUpdates with real data from recruitment tables
 */

import { supabase } from '@/shared/api/supabaseClient';

/**
 * Add a course enrollment activity to recent updates
 * @param {string} learnerEmail - Learner's email address
 * @param {Object} courseDetails - Course details (title, code, educator_name)
 */
export const addCourseEnrollmentActivity = async (learnerEmail, courseDetails) => {
  if (!learnerEmail || !courseDetails) {
    return { success: false, error: 'Learner email and course details required' };
  }

  try {
    // Get learner ID from email
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('email', learnerEmail)
      .single();

    if (learnerError || !learner) {
      return { success: false, error: 'Learner not found' };
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
      .eq('learner_id', learner.id)
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
        learner_id: learner.id,
        updates: { updates: trimmedUpdates }
      }, {
        onConflict: 'learner_id'
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
 * Add a new course notification to all learners
 * @param {Object} courseDetails - Course details (title, code, educator_name, course_id)
 */
export const notifyAlllearnersNewCourse = async (courseDetails) => {
  console.log('🔔 ========== NEW COURSE NOTIFICATION STARTED ==========');
  console.log('📚 Course Details:', courseDetails);

  if (!courseDetails) {
    console.error('❌ No course details provided');
    return { success: false, error: 'Course details required' };
  }

  try {
    // Get all active learners
    console.log('👥 Fetching all learners from database...');
    const { data: learners, error: learnersError } = await supabase
      .from('learners')
      .select('id, email');

    if (learnersError) {
      console.error('❌ Error fetching learners:', learnersError);
      return { success: false, error: learnersError.message };
    }

    console.log(`✅ Found ${learners?.length || 0} learners in database`);

    if (!learners || learners.length === 0) {
      console.warn('⚠️ No learners found to notify');
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

    // Add notification to each learner's recent updates
    console.log(`🔄 Starting to update ${learners.length} learner records...`);

    const updatePromises = learners.map(async (learner, index) => {
      console.log(`  📤 [${index + 1}/${learners.length}] Processing learner: ${learner.email}`);

      // Get existing updates
      const { data: existingData } = await supabase
        .from('recent_updates')
        .select('updates')
        .eq('learner_id', learner.id)
        .single();

      let currentUpdates = [];
      if (existingData && existingData.updates && existingData.updates.updates) {
        currentUpdates = existingData.updates.updates;
        console.log(`    ℹ️  Learner has ${currentUpdates.length} existing updates`);
      } else {
        console.log(`    ℹ️  Learner has no existing updates`);
      }

      // Add new activity
      const updatedUpdates = [activity, ...currentUpdates];
      const trimmedUpdates = updatedUpdates.slice(0, 20);

      console.log(`    ✏️  Adding new update (total will be ${trimmedUpdates.length})`);

      // Upsert
      const result = await supabase
        .from('recent_updates')
        .upsert({
          learner_id: learner.id,
          updates: { updates: trimmedUpdates }
        }, {
          onConflict: 'learner_id'
        });

      if (result.error) {
        console.error(`    ❌ Error updating learner ${learner.email}:`, result.error);
      } else {
        console.log(`    ✅ Successfully updated learner ${learner.email}`);
      }

      return result;
    });

    console.log('⏳ Waiting for all updates to complete...');
    const results = await Promise.all(updatePromises);

    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    console.log(`✅ Notification complete: ${successCount} succeeded, ${errorCount} failed`);
    console.log('🔔 ========== NEW COURSE NOTIFICATION ENDED ==========');

    return { success: true, data: { notified: learners.length, successCount, errorCount } };
  } catch (error) {
    console.error('❌ CRITICAL ERROR in notifyAlllearnersNewCourse:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent activities for a specific learner by their email
 * @param {string} learnerEmail - Learner's email address
 * @param {number} limit - Number of activities to fetch (default: 10)
 */
export const getlearnerRecentActivity = async (learnerEmail, limit = 10) => {
  
  if (!learnerEmail) {
    return { data: [], error: 'Learner email required' };
  }

  try {
    const allActivities = [];

    // First, get learner ID from email
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id, name')
      .eq('email', learnerEmail)
      .single();

    if (learnerError || !learner) {
      return { data: [], error: 'Learner not found' };
    }

    const learnerId = learner.id;
    const learnerName = learner.name || `Learner ${learnerId}`;


    // 1. Shortlist Activities - When learner gets shortlisted
    try {
      const { data: shortlistCandidates } = await supabase
        .from('shortlist_candidates')
        .select(`
          *,
          shortlists(name, created_by)
        `)
        .eq('learner_id', learnerId)
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

    // 2. Pipeline Activities - Learner's recruitment journey
    try {
      const { data: pipelineActivities } = await supabase
        .from('pipeline_activities')
        .select('*')
        .eq('learner_id', learnerId)
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
            candidate: '', // Not needed for learner view
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
        .eq('candidate_name', learnerName) // Match by name for now
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

    // 4. Offers - Job offers for the learner
    try {
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('candidate_name', learnerName) // Match by name for now
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
        .eq('learnerId', learnerId)
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

    // 6. Profile Updates - Track when learner updates their own profile
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
    console.error('❌ Error fetching learner activities:', error);
    return { 
      data: [], 
      error: error.message || 'Failed to fetch activities' 
    };
  }
};

/**
 * Create a profile update activity (for future use)
 * This can be called when learner updates their profile
 */
export const logProfileUpdate = async (learnerEmail, section, action, details) => {
  
  // For now, just log to console
  // In the future, we can create a profile_updates table
  const activity = {
    learnerEmail,
    section, // 'education', 'skills', 'experience'
    action,  // 'added', 'updated', 'removed'
    details,
    timestamp: new Date().toISOString()
  };

  return { success: true, activity };
};
