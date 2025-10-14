import { supabase } from '../lib/supabaseClient';

/**
 * Get dashboard KPIs (Key Performance Indicators)
 */
export const getDashboardKPIs = async () => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get total students count
    const { count: totalStudents, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    if (studentsError) throw studentsError;

    // Get new profiles this week
    const { count: newProfiles, error: newProfilesError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString());
    
    if (newProfilesError) throw newProfilesError;

    // Get shortlisted candidates count
    const { count: shortlisted, error: shortlistedError } = await supabase
      .from('shortlist_candidates')
      .select('*', { count: 'exact', head: true });
    
    if (shortlistedError) throw shortlistedError;

    // Get scheduled interviews count
    const { count: interviewsScheduled, error: interviewsError } = await supabase
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled');
    
    if (interviewsError) throw interviewsError;

    // Get offers count (candidates in 'offer' or 'hired' stage)
    const { count: offersExtended, error: offersError } = await supabase
      .from('pipeline_candidates')
      .select('*', { count: 'exact', head: true })
      .in('stage', ['offer', 'hired']);
    
    if (offersError) throw offersError;

    // Calculate average time to hire (simplified - days from sourced to hired)
    const { data: hiredCandidates, error: hiredError } = await supabase
      .from('pipeline_candidates')
      .select('created_at, updated_at')
      .eq('stage', 'hired')
      .limit(10);
    
    if (hiredError) throw hiredError;

    let avgTimeToHire = 0;
    if (hiredCandidates && hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((sum, candidate) => {
        const created = new Date(candidate.created_at);
        const hired = new Date(candidate.updated_at);
        const days = Math.floor((hired - created) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
    }

    return {
      data: {
        totalStudents: totalStudents || 0,
        newProfiles: newProfiles || 0,
        shortlisted: shortlisted || 0,
        interviewsScheduled: interviewsScheduled || 0,
        offersExtended: offersExtended || 0,
        timeToHire: avgTimeToHire || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    return { data: null, error };
  }
};

/**
 * Get recent activity/audit logs
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    // Get recent pipeline movements
    const { data: pipelineActivity, error: pipelineError } = await supabase
      .from('pipeline_candidates')
      .select(`
        id,
        candidate_name,
        stage,
        updated_at,
        created_at
      `)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (pipelineError) throw pipelineError;

    // Get recent interviews
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select(`
        id,
        candidate_name,
        scheduled_at,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (interviewsError) throw interviewsError;

    // Combine and format activities
    const activities = [];

    pipelineActivity?.forEach(pc => {
      activities.push({
        id: `pipeline-${pc.id}`,
        user: 'Recruiter',
        action: `moved`,
        candidate: pc.candidate_name,
        details: `to ${pc.stage} stage`,
        timestamp: new Date(pc.updated_at).toLocaleString(),
        type: 'pipeline_move'
      });
    });

    interviews?.forEach(interview => {
      activities.push({
        id: `interview-${interview.id}`,
        user: 'Recruiter',
        action: `scheduled interview with`,
        candidate: interview.candidate_name,
        details: '',
        timestamp: new Date(interview.created_at).toLocaleString(),
        type: 'interview_scheduled'
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      data: activities.slice(0, limit),
      error: null
    };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return { data: [], error };
  }
};

/**
 * Get alerts and pending tasks
 */
export const getDashboardAlerts = async () => {
  try {
    const alerts = [];
    const now = new Date();

    // Check for upcoming interviews (within 24 hours)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { data: upcomingInterviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('candidate_name, scheduled_at')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', tomorrow.toISOString());

    if (!interviewsError && upcomingInterviews?.length > 0) {
      alerts.push({
        id: 'upcoming-interviews',
        type: 'warning',
        title: 'Upcoming Interviews',
        message: `${upcomingInterviews.length} interview(s) scheduled in the next 24 hours`,
        time: 'now',
        urgent: true
      });
    }

    // Check for candidates waiting in sourced stage for too long (> 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { count: staleCandidates, error: staleError } = await supabase
      .from('pipeline_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('stage', 'sourced')
      .lte('created_at', sevenDaysAgo.toISOString());

    if (!staleError && staleCandidates > 0) {
      alerts.push({
        id: 'stale-candidates',
        type: 'warning',
        title: 'Candidates Need Attention',
        message: `${staleCandidates} candidate(s) have been in sourced stage for over 7 days`,
        time: 'now',
        urgent: false
      });
    }

    // Check for candidates in offer stage
    const { count: offersCount, error: offersError } = await supabase
      .from('pipeline_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('stage', 'offer');

    if (!offersError && offersCount > 0) {
      alerts.push({
        id: 'pending-offers',
        type: 'success',
        title: 'Pending Offers',
        message: `${offersCount} candidate(s) have pending offers`,
        time: 'now',
        urgent: false
      });
    }

    return {
      data: alerts,
      error: null
    };
  } catch (error) {
    console.error('Error fetching dashboard alerts:', error);
    return { data: [], error };
  }
};
