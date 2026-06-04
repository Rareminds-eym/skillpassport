import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-kpis': {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalLearnersResult, newLearnersResult] = await Promise.all([
          supabase.from('learners').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
          supabase.from('learners')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', false)
            .gte('createdAt', oneWeekAgo.toISOString())
        ]);

        const totalLearners = totalLearnersResult.count || 0;
        const newProfiles = newLearnersResult.count || 0;

        let shortlisted = 0;
        try {
          const shortlistResult = await supabase.from('shortlist_candidates').select('*', { count: 'exact', head: true });
          shortlisted = shortlistResult.count || 0;
        } catch {}

        let interviewsScheduled = 0;
        try {
          const interviewResult = await supabase.from('interviews').select('*', { count: 'exact', head: true });
          interviewsScheduled = interviewResult.count || 0;
        } catch {}

        let offersExtended = 0;
        try {
          const pipelineResult = await supabase.from('pipeline_candidates').select('*', { count: 'exact', head: true });
          offersExtended = pipelineResult.count || 0;
        } catch {}

        return apiSuccess({
          newProfiles,
          newProfilesTrend: newProfiles > 0 ? Math.floor(Math.random() * 20) - 5 : 0,
          shortlisted,
          shortlistedTrend: shortlisted > 0 ? Math.floor(Math.random() * 15) + 2 : 0,
          interviewsScheduled,
          interviewsTrend: interviewsScheduled > 0 ? Math.floor(Math.random() * 20) - 8 : 0,
          offersExtended,
          offersTrend: offersExtended > 0 ? Math.floor(Math.random() * 25) + 5 : 0,
          timeToHire: Math.floor(Math.random() * 10) + 12,
          timeToHireTrend: Math.floor(Math.random() * 16) - 8,
        }, context.request, { startTime });
      }

      case 'get-recent-activity': {
        const limit = params.limit || 15;
        const allActivities: any[] = [];

        try {
          const { data: pipelineActivities } = await supabase
            .from('pipeline_activities')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (pipelineActivities?.length > 0) {
            pipelineActivities.forEach((pa: any) => {
              let actionType = pa.activity_type;
              let details = '';
              if (pa.from_stage && pa.to_stage) {
                actionType = 'moved';
                details = `from ${pa.from_stage} to ${pa.to_stage}`;
              }
              allActivities.push({
                id: `pipeline-activity-${pa.id}`, user: pa.performed_by || 'Recruitment Team',
                action: actionType, details, candidate: pa.activity_details?.candidate_name || 'Candidate',
                timestamp: pa.created_at, type: 'pipeline_activity', metadata: pa.activity_details, icon: 'pipeline'
              });
            });
          }
        } catch {}

        try {
          const { data: recruiterActivities } = await supabase
            .from('recruiter_activities')
            .select('*')
            .order('createdAt', { ascending: false })
            .limit(limit);

          if (recruiterActivities?.length > 0) {
            recruiterActivities.forEach((ra: any) => {
              allActivities.push({
                id: `recruiter-activity-${ra.id}`, user: ra.recruiterId || 'Recruiter',
                action: ra.activityType, candidate: ra.targetLearnerId ? `Learner ${ra.targetLearnerId}` : 'Multiple candidates',
                timestamp: ra.createdAt, type: 'recruiter_activity', metadata: ra.metadata,
                searchCriteria: ra.searchCriteria, icon: 'search'
              });
            });
          }
        } catch {}

        try {
          const { data: shortlistCandidates } = await supabase
            .from('shortlist_candidates')
            .select(`*, shortlists(name), learners(id, name)`)
            .order('added_at', { ascending: false })
            .limit(limit);

          if (shortlistCandidates?.length > 0) {
            shortlistCandidates.forEach((sc: any) => {
              const learnerName = sc.learners?.name || `Learner ${sc.learner_id}`;
              allActivities.push({
                id: `shortlist-${sc.id}`, user: sc.added_by || 'Recruiter', action: 'shortlisted',
                candidate: learnerName, details: sc.shortlists?.name || 'to shortlist',
                timestamp: sc.added_at, type: 'shortlist', notes: sc.notes, icon: 'bookmark'
              });
            });
          }
        } catch {}

        try {
          const { data: offers } = await supabase
            .from('offers')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

          if (offers?.length > 0) {
            offers.forEach((offer: any) => {
              const isNew = new Date(offer.inserted_at).getTime() === new Date(offer.updated_at).getTime();
              const actionType = isNew ? 'extended offer to' : `updated offer status to ${offer.status}`;
              allActivities.push({
                id: `offer-${offer.id}`, user: 'HR Team', action: actionType,
                candidate: offer.candidate_name, details: `${offer.job_title}${offer.offered_ctc ? ` - ${offer.offered_ctc}` : ''}`,
                timestamp: offer.updated_at, type: offer.status === 'accepted' ? 'offer_accepted' : offer.status === 'rejected' ? 'offer_rejected' : 'offer',
                metadata: { status: offer.status, expiryDate: offer.expiry_date, offerDate: offer.offer_date }, icon: 'document'
              });
            });
          }
        } catch {}

        try {
          const { data: interviews } = await supabase
            .from('interviews')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

          if (interviews?.length > 0) {
            interviews.forEach((interview: any) => {
              let actionType = 'scheduled interview with';
              if (interview.status === 'completed') actionType = 'completed interview with';
              if (interview.status === 'cancelled') actionType = 'cancelled interview with';
              if (interview.status === 'rescheduled') actionType = 'rescheduled interview with';
              const interviewDate = new Date(interview.date);
              allActivities.push({
                id: `interview-${interview.id}`, user: interview.interviewer_name || interview.created_by || 'Recruiter',
                action: actionType, candidate: interview.candidate_name,
                details: `${interview.interview_type || 'Interview'} on ${interviewDate.toLocaleDateString()}${interview.scheduled_time ? ` at ${interview.scheduled_time}` : ''}`,
                timestamp: interview.updated_at, type: interview.status === 'completed' ? 'interview_completed' : interview.status === 'cancelled' ? 'interview_cancelled' : 'interview',
                metadata: { status: interview.status, date: interview.date, scheduledTime: interview.scheduled_time, interviewType: interview.interview_type, location: interview.location, meetingLink: interview.meeting_link }, icon: 'calendar'
              });
            });
          }
        } catch {}

        try {
          const { data: placements } = await supabase
            .from('placements')
            .select(`*, learners(id, name)`)
            .order('updatedAt', { ascending: false })
            .limit(limit);

          if (placements?.length > 0) {
            placements.forEach((placement: any) => {
              let actionType = 'placement';
              if (placement.placementStatus === 'hired') actionType = 'hired';
              if (placement.placementStatus === 'applied') actionType = 'applied';
              const learnerName = placement.learners?.name || `Learner ${placement.learnerId}`;
              allActivities.push({
                id: `placement-${placement.id}`, user: placement.recruiterId || 'Recruiter',
                action: actionType, candidate: learnerName,
                details: `${placement.jobTitle}${placement.salaryOffered ? ` - ₹${placement.salaryOffered}` : ''}`,
                timestamp: placement.updatedAt, type: 'placement', metadata: placement.metadata, icon: 'briefcase'
              });
            });
          }
        } catch {}

        try {
          const { data: pipelineCandidates } = await supabase
            .from('pipeline_candidates')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

          if (pipelineCandidates?.length > 0) {
            pipelineCandidates.forEach((pc: any) => {
              const isNew = new Date(pc.created_at).getTime() === new Date(pc.updated_at).getTime();
              const actionType = isNew ? 'added to pipeline' : `moved to ${pc.stage}`;
              allActivities.push({
                id: `pipeline-candidate-${pc.id}`, user: pc.stage_changed_by || pc.added_by || 'Recruitment Team',
                action: pc.status === 'rejected' ? 'rejected' : actionType, candidate: pc.candidate_name,
                details: pc.rejection_reason || (pc.previous_stage ? `from ${pc.previous_stage}` : ''),
                timestamp: pc.updated_at, type: pc.status === 'rejected' ? 'candidate_rejected' : 'pipeline',
                metadata: { stage: pc.stage, status: pc.status, opportunityId: pc.opportunity_id }, icon: 'user-group'
              });
            });
          }
        } catch {}

        try {
          const { data: shortlists } = await supabase
            .from('shortlists')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(limit);

          if (shortlists?.length > 0) {
            shortlists.forEach((sl: any) => {
              const isNew = new Date(sl.created_date).getTime() === new Date(sl.updated_at).getTime();
              allActivities.push({
                id: `shortlist-created-${sl.id}`, user: sl.created_by || 'Recruiter',
                action: isNew ? 'created shortlist' : 'updated shortlist', candidate: sl.name,
                details: sl.shared ? '(Shared)' : '', timestamp: sl.updated_at, type: 'shortlist_created',
                metadata: { status: sl.status, shared: sl.shared, tags: sl.tags }, icon: 'folder'
              });
            });
          }
        } catch {}

        allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return apiSuccess(allActivities.slice(0, limit), context.request, { startTime });
      }

      case 'get-alerts': {
        return apiSuccess([], context.request, { startTime });
      }

      case 'get-recent-shortlists': {
        const slLimit = params.limit || 5;
        try {
          const { data: shortlists } = await supabase
            .from('shortlists')
            .select('*')
            .order('created_date', { ascending: false })
            .limit(slLimit);

          if (shortlists?.length > 0) {
            const formatted = shortlists.map((sl: any) => ({
              id: sl.id, name: sl.name,
              candidates: Array(Math.floor(Math.random() * 5) + 1).fill(null),
              created_date: new Date(sl.created_date).toLocaleDateString(),
              created_by: sl.created_by || 'Recruiter', shared: sl.shared || false
            }));
            return apiSuccess(formatted, context.request, { startTime });
          }
        } catch {}

        return apiSuccess([
          { id: 'sample-sl-1', name: 'FSQM Q4 Plant Quality Interns', candidates: [null, null, null], created_date: new Date().toLocaleDateString() },
          { id: 'sample-sl-2', name: 'Engineering Graduates 2024', candidates: [null, null], created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString() }
        ], context.request, { startTime });
      }

      case 'get-saved-searches': {
        return apiSuccess([
          { id: 'default-1', name: 'React + Node.js', search_criteria: { skills: ['React', 'Node.js'] } },
          { id: 'default-2', name: 'Python Developers', search_criteria: { skills: ['Python'] } },
          { id: 'default-3', name: 'Data Science + ML', search_criteria: { skills: ['Data Science', 'Machine Learning'] } },
          { id: 'default-4', name: 'Frontend (React/Angular)', search_criteria: { skills: ['React', 'Angular'] } }
        ], context.request, { startTime });
      }

      case 'get-dashboard-data': {
        const [kpisResult, alertsResult, activityResult, shortlistsResult, searchesResult] = await Promise.all([
          supabase.from('learners').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
          Promise.resolve({ data: [] }),
          supabase.from('pipeline_activities').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('shortlists').select('*').order('created_date', { ascending: false }).limit(3),
          Promise.resolve({ data: [] })
        ]);

        return apiSuccess({
          kpis: { newProfiles: kpisResult.count || 0, newProfilesTrend: 0, shortlisted: 0, shortlistedTrend: 0, interviewsScheduled: 0, interviewsTrend: 0, offersExtended: 0, offersTrend: 0, timeToHire: 15, timeToHireTrend: 0 },
          alerts: alertsResult,
          recentActivity: [],
          shortlists: [],
          savedSearches: []
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'INVALID_ACTION', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    return apiDbError(error, context.request, { startTime });
  }
});
