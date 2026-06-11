import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  try {
    switch (action) {
      case 'get-talent-pool-alerts': {
        const alerts: any[] = [];
        const { count: unverifiedCount } = await supabase
          .from('learners')
          .select('id', { count: 'exact', head: true })
          .or('verified.is.null,verified.eq.false');

        if (unverifiedCount && unverifiedCount > 0) {
          alerts.push({
            id: 'talent-pool-unverified',
            type: 'warning',
            title: 'Verification Pending',
            message: `${unverifiedCount} candidate${unverifiedCount !== 1 ? 's' : ''} waiting for verification`,
            time: 'Just now',
            urgent: unverifiedCount > 10,
            source: 'talent_pool',
          });
        }

        const { data: incompleteProfiles } = await supabase
          .from('learners')
          .select('id, profile')
          .limit(1000);

        if (incompleteProfiles) {
          const incomplete = incompleteProfiles.filter((l: any) => {
            const profile = typeof l.profile === 'string' ? JSON.parse(l.profile) : l.profile;
            return !profile?.email || !profile?.contact_number || !profile?.education?.length;
          });
          if (incomplete.length > 0) {
            alerts.push({
              id: 'talent-pool-incomplete',
              type: 'info',
              title: 'Incomplete Profiles',
              message: `${incomplete.length} candidate${incomplete.length !== 1 ? 's' : ''} have incomplete profiles`,
              time: '2 hours ago',
              urgent: false,
              source: 'talent_pool',
            });
          }
        }

        return apiSuccess(alerts, context.request);
      }

      case 'get-shortlist-alerts': {
        const alerts: any[] = [];
        const { data: shortlists } = await supabase
          .from('shortlists')
          .select('id, name, created_date, status, shortlist_candidates(count)')
          .eq('status', 'active');

        if (shortlists) {
          const emptyShortlists = shortlists.filter((sl: any) => {
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
                time: `${daysSinceCreation} days ago`,
                urgent: false,
                source: 'shortlists',
                actionData: { shortlistIds: emptyShortlists.map((sl: any) => sl.id) },
              });
            }
          }
        }

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
            time: '30 minutes ago',
            urgent: false,
            source: 'shortlists',
          });
        }

        return apiSuccess(alerts, context.request);
      }

      case 'get-interview-alerts': {
        const alerts: any[] = [];
        const now = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { data: upcomingInterviews } = await supabase
          .from('interviews')
          .select('*')
          .gte('date', now)
          .lte('date', tomorrow)
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
            actionData: { interviews: upcomingInterviews },
          });
        }

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
            time: '3 hours ago',
            urgent: completedInterviews.length > 5,
            source: 'interviews',
            actionData: { pendingCount: completedInterviews.length },
          });
        }

        return apiSuccess(alerts, context.request);
      }

      case 'get-offers-alerts': {
        const alerts: any[] = [];
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        const { data: expiringOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('status', 'pending')
          .lte('expiry_date', twoDaysFromNow.toISOString())
          .gte('expiry_date', now.toISOString());

        if (expiringOffers && expiringOffers.length > 0) {
          const urgentOffers = expiringOffers.filter((offer: any) => {
            const expiryDate = new Date(offer.expiry_date);
            const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            return hoursUntilExpiry <= 24;
          });

          if (urgentOffers.length > 0) {
            const offer = urgentOffers[0];
            const hoursUntilExpiry = Math.floor(
              (new Date(offer.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60)
            );
            alerts.push({
              id: 'offers-expiring',
              type: 'error',
              title: 'Expiring Offers',
              message: urgentOffers.length === 1
                ? `Offer for ${offer.candidate_name} expires in ${hoursUntilExpiry} hours`
                : `${urgentOffers.length} offers expiring within 24 hours`,
              time: '2 hours ago',
              urgent: true,
              source: 'offers',
              actionData: { offers: urgentOffers },
            });
          } else {
            alerts.push({
              id: 'offers-expiring-soon',
              type: 'warning',
              title: 'Offers Expiring Soon',
              message: `${expiringOffers.length} offer${expiringOffers.length !== 1 ? 's' : ''} expiring within 48 hours`,
              time: '4 hours ago',
              urgent: false,
              source: 'offers',
              actionData: { offers: expiringOffers },
            });
          }
        }

        const { data: acceptedOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('status', 'accepted')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (acceptedOffers && acceptedOffers.length > 0) {
          const recentAccepted = acceptedOffers.filter((offer: any) => {
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
              time: 'Just now',
              urgent: false,
              source: 'offers',
              actionData: { offers: recentAccepted },
            });
          }
        }

        return apiSuccess(alerts, context.request);
      }

      case 'get-pipeline-alerts': {
        const alerts: any[] = [];
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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
            time: '6 hours ago',
            urgent: stalledCandidates.length > 10,
            source: 'pipelines',
            actionData: { count: stalledCandidates.length },
          });
        }

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
            actionData: { candidates: overdueActions },
          });
        }

        return apiSuccess(alerts, context.request);
      }

      case 'get-all-alerts': {
        const allResults = await Promise.all([
          supabase.from('learners')
            .select('id', { count: 'exact', head: true })
            .or('verified.is.null,verified.eq.false'),
          supabase.from('interviews')
            .select('*')
            .gte('date', new Date().toISOString())
            .lte('date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
            .in('status', ['scheduled', 'confirmed', 'pending']),
          supabase.from('pipeline_candidates')
            .select('*')
            .eq('status', 'active')
            .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ]);

        const alerts: any[] = [];

        const [unverifiedResult, upcomingInterviews, stalledCandidates] = allResults;
        const unverifiedCount = unverifiedResult.count;

        if (unverifiedCount && unverifiedCount > 0) {
          alerts.push({
            id: 'talent-pool-unverified',
            type: 'warning',
            title: 'Verification Pending',
            message: `${unverifiedCount} candidate${unverifiedCount !== 1 ? 's' : ''} waiting for verification`,
            time: 'Just now',
            urgent: unverifiedCount > 10,
            source: 'talent_pool',
          });
        }

        if (upcomingInterviews && upcomingInterviews.length > 0) {
          alerts.push({
            id: 'interview-upcoming',
            type: 'warning',
            title: 'Upcoming Interviews',
            message: `${upcomingInterviews.length} interview${upcomingInterviews.length !== 1 ? 's' : ''} scheduled for the next 24 hours`,
            time: 'Just now',
            urgent: true,
            source: 'interviews',
            actionData: { interviews: upcomingInterviews },
          });
        }

        if (stalledCandidates && stalledCandidates.length > 0) {
          alerts.push({
            id: 'pipeline-stalled',
            type: 'warning',
            title: 'Stalled Pipeline Candidates',
            message: `${stalledCandidates.length} candidate${stalledCandidates.length !== 1 ? 's have' : ' has'} no activity for 7+ days`,
            time: '6 hours ago',
            urgent: stalledCandidates.length > 10,
            source: 'pipelines',
            actionData: { count: stalledCandidates.length },
          });
        }

        alerts.sort((a, b) => (a.urgent === b.urgent ? 0 : a.urgent ? -1 : 1));
        return apiSuccess(alerts, context.request);
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error: any) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }
});