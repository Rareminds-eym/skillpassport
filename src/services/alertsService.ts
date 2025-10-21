import { supabase } from '../lib/supabaseClient';

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  urgent: boolean;
  source: 'talent_pool' | 'shortlists' | 'interviews' | 'offers' | 'pipelines';
  actionData?: any;
}

/**
 * Format time difference for display
 */
const formatTimeDiff = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

/**
 * Get alerts from Talent Pool (Students table)
 * - Unverified candidates
 * - Incomplete profiles
 * - Recent signups needing review
 */
export const getTalentPoolAlerts = async (): Promise<Alert[]> => {
  const alerts: Alert[] = [];

  try {
    // Check for unverified students
    const { count: unverifiedCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('verified', false);

    if (unverifiedCount && unverifiedCount > 0) {
      alerts.push({
        id: 'talent-pool-unverified',
        type: 'warning',
        title: 'Verification Pending',
        message: `${unverifiedCount} candidate${unverifiedCount !== 1 ? 's' : ''} waiting for verification`,
        time: 'Just now',
        urgent: unverifiedCount > 10,
        source: 'talent_pool'
      });
    }

    // Check for incomplete profiles (missing key fields)
    const { data: incompleteProfiles } = await supabase
      .from('students')
      .select('id, profile')
      .limit(1000);

    if (incompleteProfiles) {
      const incomplete = incompleteProfiles.filter(student => {
        const profile = typeof student.profile === 'string' 
          ? JSON.parse(student.profile) 
          : student.profile;
        return !profile?.email || !profile?.contact_number || !profile?.education?.length;
      });

      if (incomplete.length > 0) {
        alerts.push({
          id: 'talent-pool-incomplete',
          type: 'info',
          title: 'Incomplete Profiles',
          message: `${incomplete.length} candidate${incomplete.length !== 1 ? 's' : ''} have incomplete profiles`,
          time: formatTimeDiff(new Date(Date.now() - 2 * 60 * 60 * 1000)),
          urgent: false,
          source: 'talent_pool'
        });
      }
    }

  } catch (error) {
    console.error('Error fetching talent pool alerts:', error);
  }

  return alerts;
};

/**
 * Get alerts from Shortlists
 * - Empty shortlists
 * - Shortlists with expiring candidates
 * - Shared shortlists needing review
 */
export const getShortlistAlerts = async (): Promise<Alert[]> => {
  const alerts: Alert[] = [];

  try {
    // Check for empty shortlists
    const { data: shortlists } = await supabase
      .from('shortlists')
      .select(`
        id,
        name,
        created_date,
        status,
        shortlist_candidates(count)
      `)
      .eq('status', 'active');

    if (shortlists) {
      const emptyShortlists = shortlists.filter(sl => {
        const count = sl.shortlist_candidates?.[0]?.count || 0;
        return count === 0;
      });

      if (emptyShortlists.length > 0 && emptyShortlists.length < 5) {
        const oldestEmpty = emptyShortlists[0];
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(oldestEmpty.created_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation > 7) {
          alerts.push({
            id: 'shortlist-empty',
            type: 'info',
            title: 'Empty Shortlists',
            message: `${emptyShortlists.length} shortlist${emptyShortlists.length !== 1 ? 's' : ''} need candidates`,
            time: formatTimeDiff(new Date(oldestEmpty.created_date)),
            urgent: false,
            source: 'shortlists',
            actionData: { shortlistIds: emptyShortlists.map(sl => sl.id) }
          });
        }
      }
    }

    // Check for shared shortlists
    const { count: sharedCount } = await supabase
      .from('shortlists')
      .select('*', { count: 'exact', head: true })
      .eq('shared', true)
      .eq('status', 'active');

    if (sharedCount && sharedCount > 0) {
      alerts.push({
        id: 'shortlist-shared',
        type: 'success',
        title: 'Active Shared Shortlists',
        message: `${sharedCount} shortlist${sharedCount !== 1 ? 's are' : ' is'} currently shared`,
        time: formatTimeDiff(new Date(Date.now() - 30 * 60 * 1000)),
        urgent: false,
        source: 'shortlists'
      });
    }

  } catch (error) {
    console.error('Error fetching shortlist alerts:', error);
  }

  return alerts;
};

/**
 * Get alerts from Interviews
 * - Upcoming interviews (next 24 hours)
 * - Pending scorecards
 * - Overdue feedback
 */
export const getInterviewAlerts = async (): Promise<Alert[]> => {
  const alerts: Alert[] = [];

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Upcoming interviews in next 24 hours
    const { data: upcomingInterviews } = await supabase
      .from('interviews')
      .select('*')
      .gte('date', now.toISOString())
      .lte('date', tomorrow.toISOString())
      .in('status', ['scheduled', 'confirmed', 'pending']);

    if (upcomingInterviews && upcomingInterviews.length > 0) {
      alerts.push({
        id: 'interview-upcoming',
        type: 'warning',
        title: 'Upcoming Interviews',
        message: `${upcomingInterviews.length} interview${upcomingInterviews.length !== 1 ? 's' : ''} scheduled for the next 24 hours`,
        time: 'Just now',
        urgent: true,
        source: 'interviews',
        actionData: { interviews: upcomingInterviews }
      });
    }

    // Pending scorecards (completed interviews without feedback)
    const { data: completedInterviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('status', 'completed')
      .is('scorecard', null);

    if (completedInterviews && completedInterviews.length > 0) {
      alerts.push({
        id: 'interview-pending-scorecards',
        type: 'error',
        title: 'Pending Scorecards',
        message: `${completedInterviews.length} interview${completedInterviews.length !== 1 ? 's need' : ' needs'} feedback`,
        time: formatTimeDiff(new Date(Date.now() - 3 * 60 * 60 * 1000)),
        urgent: completedInterviews.length > 5,
        source: 'interviews',
        actionData: { pendingCount: completedInterviews.length }
      });
    }

    // Recent positive feedback
    const { data: recentCompleted } = await supabase
      .from('interviews')
      .select('*')
      .eq('status', 'completed')
      .not('scorecard', 'is', null)
      .order('completed_date', { ascending: false })
      .limit(10);

    if (recentCompleted && recentCompleted.length > 0) {
      const positiveInterviews = recentCompleted.filter(interview => {
        const scorecard = interview.scorecard;
        return scorecard?.overall_rating >= 4 || scorecard?.recommendation === 'proceed';
      });

      if (positiveInterviews.length > 0) {
        const latest = positiveInterviews[0];
        alerts.push({
          id: 'interview-positive-feedback',
          type: 'success',
          title: 'Positive Interview Feedback',
          message: `Strong feedback received for ${latest.candidate_name}`,
          time: formatTimeDiff(new Date(latest.completed_date)),
          urgent: false,
          source: 'interviews',
          actionData: { interviewId: latest.id, candidateName: latest.candidate_name }
        });
      }
    }

  } catch (error) {
    console.error('Error fetching interview alerts:', error);
  }

  return alerts;
};

/**
 * Get alerts from Offers & Decisions
 * - Expiring offers
 * - Pending decisions
 * - Accepted offers requiring action
 */
export const getOffersAlerts = async (): Promise<Alert[]> => {
  const alerts: Alert[] = [];

  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Expiring offers (within 48 hours)
    const { data: expiringOffers } = await supabase
      .from('offers')
      .select('*')
      .eq('status', 'pending')
      .lte('expiry_date', twoDaysFromNow.toISOString())
      .gte('expiry_date', now.toISOString());

    if (expiringOffers && expiringOffers.length > 0) {
      const urgentOffers = expiringOffers.filter(offer => {
        const expiryDate = new Date(offer.expiry_date);
        const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilExpiry <= 24;
      });

      if (urgentOffers.length > 0) {
        const offer = urgentOffers[0];
        const expiryDate = new Date(offer.expiry_date);
        const hoursUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        alerts.push({
          id: 'offers-expiring',
          type: 'error',
          title: 'Expiring Offers',
          message: urgentOffers.length === 1
            ? `Offer for ${offer.candidate_name} expires in ${hoursUntilExpiry} hours`
            : `${urgentOffers.length} offers expiring within 24 hours`,
          time: formatTimeDiff(new Date(Date.now() - 2 * 60 * 60 * 1000)),
          urgent: true,
          source: 'offers',
          actionData: { offers: urgentOffers }
        });
      } else if (expiringOffers.length > 0) {
        alerts.push({
          id: 'offers-expiring-soon',
          type: 'warning',
          title: 'Offers Expiring Soon',
          message: `${expiringOffers.length} offer${expiringOffers.length !== 1 ? 's' : ''} expiring within 48 hours`,
          time: formatTimeDiff(new Date(Date.now() - 4 * 60 * 60 * 1000)),
          urgent: false,
          source: 'offers',
          actionData: { offers: expiringOffers }
        });
      }
    }

    // Accepted offers needing onboarding
    const { data: acceptedOffers } = await supabase
      .from('offers')
      .select('*')
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (acceptedOffers && acceptedOffers.length > 0) {
      const recentAccepted = acceptedOffers.filter(offer => {
        const acceptedDate = new Date(offer.updated_at);
        const daysSinceAccepted = (now.getTime() - acceptedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceAccepted <= 7;
      });

      if (recentAccepted.length > 0) {
        alerts.push({
          id: 'offers-accepted',
          type: 'success',
          title: 'Offers Accepted',
          message: `${recentAccepted.length} offer${recentAccepted.length !== 1 ? 's' : ''} accepted - ready for onboarding`,
          time: formatTimeDiff(new Date(recentAccepted[0].updated_at)),
          urgent: false,
          source: 'offers',
          actionData: { offers: recentAccepted }
        });
      }
    }

  } catch (error) {
    console.error('Error fetching offers alerts:', error);
  }

  return alerts;
};

/**
 * Get alerts from Pipelines
 * - Stalled candidates
 * - Candidates needing next action
 * - Pipeline bottlenecks
 */
export const getPipelineAlerts = async (): Promise<Alert[]> => {
  const alerts: Alert[] = [];

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Stalled candidates (no update in 7 days)
    const { data: stalledCandidates } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('status', 'active')
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (stalledCandidates && stalledCandidates.length > 0) {
      alerts.push({
        id: 'pipeline-stalled',
        type: 'warning',
        title: 'Stalled Pipeline Candidates',
        message: `${stalledCandidates.length} candidate${stalledCandidates.length !== 1 ? 's have' : ' has'} no activity for 7+ days`,
        time: formatTimeDiff(new Date(Date.now() - 6 * 60 * 60 * 1000)),
        urgent: stalledCandidates.length > 10,
        source: 'pipelines',
        actionData: { count: stalledCandidates.length }
      });
    }

    // Candidates with overdue next actions
    const { data: overdueActions } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('status', 'active')
      .not('next_action_date', 'is', null)
      .lt('next_action_date', now.toISOString());

    if (overdueActions && overdueActions.length > 0) {
      alerts.push({
        id: 'pipeline-overdue-actions',
        type: 'error',
        title: 'Overdue Pipeline Actions',
        message: `${overdueActions.length} candidate${overdueActions.length !== 1 ? 's have' : ' has'} overdue follow-up actions`,
        time: 'Just now',
        urgent: true,
        source: 'pipelines',
        actionData: { candidates: overdueActions }
      });
    }

    // Check for pipeline bottlenecks (too many in one stage)
    const { data: allActiveCandidates } = await supabase
      .from('pipeline_candidates')
      .select('stage')
      .eq('status', 'active');

    if (allActiveCandidates && allActiveCandidates.length > 0) {
      const stageCounts = allActiveCandidates.reduce((acc, c) => {
        acc[c.stage] = (acc[c.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bottleneckStage = Object.entries(stageCounts).find(([_, count]) => count > 20);
      
      if (bottleneckStage) {
        const [stage, count] = bottleneckStage;
        alerts.push({
          id: 'pipeline-bottleneck',
          type: 'info',
          title: 'Pipeline Bottleneck',
          message: `${count} candidates in "${stage}" stage - review capacity`,
          time: formatTimeDiff(new Date(Date.now() - 12 * 60 * 60 * 1000)),
          urgent: false,
          source: 'pipelines',
          actionData: { stage, count }
        });
      }
    }

  } catch (error) {
    console.error('Error fetching pipeline alerts:', error);
  }

  return alerts;
};

/**
 * Get all alerts from all sources
 */
export const getAllAlerts = async (): Promise<Alert[]> => {
  try {
    console.log('🚨 Fetching alerts from all sources...');
    
    const [
      talentPoolAlerts,
      shortlistAlerts,
      interviewAlerts,
      offersAlerts,
      pipelineAlerts
    ] = await Promise.all([
      getTalentPoolAlerts(),
      getShortlistAlerts(),
      getInterviewAlerts(),
      getOffersAlerts(),
      getPipelineAlerts()
    ]);

    const allAlerts = [
      ...talentPoolAlerts,
      ...shortlistAlerts,
      ...interviewAlerts,
      ...offersAlerts,
      ...pipelineAlerts
    ];

    // Sort by urgency first, then by time
    allAlerts.sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return 0;
    });

    console.log(`✅ Found ${allAlerts.length} alerts total`);
    console.log(`   - Talent Pool: ${talentPoolAlerts.length}`);
    console.log(`   - Shortlists: ${shortlistAlerts.length}`);
    console.log(`   - Interviews: ${interviewAlerts.length}`);
    console.log(`   - Offers: ${offersAlerts.length}`);
    console.log(`   - Pipelines: ${pipelineAlerts.length}`);

    return allAlerts;
  } catch (error) {
    console.error('❌ Error fetching all alerts:', error);
    return [];
  }
};
