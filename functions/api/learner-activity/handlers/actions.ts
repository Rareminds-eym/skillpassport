import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  try {
    switch (action) {
      case 'add-course-enrollment-activity': {
        const { learnerEmail, courseDetails } = params;
        if (!learnerEmail || !courseDetails) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerEmail or courseDetails', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners').select('id').eq('email', learnerEmail).single();
        if (learnerError || !learner) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });

        const activity = {
          id: `course-enrolled-${Date.now()}`,
          user: courseDetails.educator_name || 'Instructor',
          action: 'published a new course:',
          candidate: courseDetails.title,
          details: `Course Code: ${courseDetails.code}`,
          timestamp: new Date().toISOString(),
          type: 'course_enrolled',
          icon: 'book-open',
          metadata: { courseId: courseDetails.course_id, courseCode: courseDetails.code, courseTitle: courseDetails.title, educatorName: courseDetails.educator_name },
        };

        const { data: existingData } = await supabase
          .from('recent_updates').select('updates').eq('learner_id', learner.id).single();

        let currentUpdates: any[] = [];
        if (existingData && existingData.updates && existingData.updates.updates) {
          currentUpdates = existingData.updates.updates;
        }

        const trimmedUpdates = [activity, ...currentUpdates].slice(0, 20);

        const { error: upsertError } = await supabase
          .from('recent_updates').upsert({ learner_id: learner.id, updates: { updates: trimmedUpdates } }, { onConflict: 'learner_id' });

        if (upsertError) return apiDbError(upsertError, context.request, { startTime });
        return apiSuccess({ success: true, data: activity }, context.request, { startTime });
      }

      case 'notify-all-learners-new-course': {
        const { courseDetails } = params;
        if (!courseDetails) return apiError(400, 'VALIDATION_ERROR', 'Missing courseDetails', context.request, { startTime });

        const { data: learners, error: learnersError } = await supabase
          .from('learners').select('id, email');
        if (learnersError) return apiDbError(learnersError, context.request, { startTime });

        if (!learners || learners.length === 0) {
          return apiSuccess({ notified: 0 }, context.request, { startTime });
        }

        const activity = {
          id: `course-new-${courseDetails.course_id}-${Date.now()}`,
          message: `New course available: ${courseDetails.title}`,
          details: `Course Code: ${courseDetails.code} • Instructor: ${courseDetails.educator_name}`,
          timestamp: new Date().toISOString(),
          type: 'course_new',
          icon: 'book-open',
          metadata: { courseId: courseDetails.course_id, courseCode: courseDetails.code, courseTitle: courseDetails.title, educatorName: courseDetails.educator_name },
        };

        const results = await Promise.all(
          learners.map(async (learner: any) => {
            const { data: existingData } = await supabase
              .from('recent_updates').select('updates').eq('learner_id', learner.id).single();
            let currentUpdates: any[] = [];
            if (existingData && existingData.updates && existingData.updates.updates) {
              currentUpdates = existingData.updates.updates;
            }
            const trimmedUpdates = [activity, ...currentUpdates].slice(0, 20);
            return supabase.from('recent_updates').upsert({ learner_id: learner.id, updates: { updates: trimmedUpdates } }, { onConflict: 'learner_id' });
          })
        );

        const successCount = results.filter(r => !r.error).length;
        return apiSuccess({ notified: learners.length, successCount, errorCount: learners.length - successCount }, context.request, { startTime });
      }

      case 'get-learner-recent-activity': {
        const { learnerEmail, limit = 10 } = params;
        if (!learnerEmail) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerEmail', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners').select('id, name').eq('email', learnerEmail).single();
        if (learnerError || !learner) return apiSuccess({ activities: [] }, context.request, { startTime });

        const learnerId = learner.id;
        const learnerName = learner.name || `Learner ${learnerId}`;
        const activities: any[] = [];

        const [shortlistRes, pipelineActivitiesRes, pipelineCandidatesRes, offersRes, placementsRes] = await Promise.all([
          supabase.from('shortlist_candidates').select('*, shortlists(name, created_by)').eq('learner_id', learnerId).order('added_at', { ascending: false }).limit(limit),
          supabase.from('pipeline_activities').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }).limit(limit),
          supabase.from('pipeline_candidates').select('*').eq('candidate_name', learnerName).order('updated_at', { ascending: false }).limit(limit),
          supabase.from('offers').select('*').eq('candidate_name', learnerName).order('updated_at', { ascending: false }).limit(limit),
          supabase.from('placements').select('*').eq('learnerId', learnerId).order('updatedAt', { ascending: false }).limit(limit),
        ]);

        shortlistRes.data?.forEach((sc: any) => {
          activities.push({ id: `shortlist-${sc.id}`, user: sc.added_by || 'Recruiter', action: 'shortlisted you for', candidate: sc.shortlists?.name || 'a position', details: sc.notes || 'Added to recruiter shortlist', timestamp: sc.added_at, type: 'shortlist_added', icon: 'bookmark', metadata: { shortlistName: sc.shortlists?.name, notes: sc.notes } });
        });

        pipelineActivitiesRes.data?.forEach((pa: any) => {
          const action = pa.from_stage && pa.to_stage ? `moved you from ${pa.from_stage} to ${pa.to_stage}` : 'updated your status';
          activities.push({ id: `pipeline-activity-${pa.id}`, user: pa.performed_by || 'Recruitment Team', action, candidate: '', details: pa.activity_type, timestamp: pa.created_at, type: 'pipeline_update', icon: 'arrow-right', metadata: pa.activity_details });
        });

        pipelineCandidatesRes.data?.forEach((pc: any) => {
          const isNew = new Date(pc.created_at).getTime() === new Date(pc.updated_at).getTime();
          const action = isNew ? 'added you to the recruitment pipeline' : `moved you to ${pc.stage} stage`;
          activities.push({ id: `pipeline-candidate-${pc.id}`, user: pc.stage_changed_by || pc.added_by || 'Recruitment Team', action, candidate: pc.stage || 'recruitment process', details: pc.rejection_reason || (pc.previous_stage ? `from ${pc.previous_stage}` : ''), timestamp: pc.updated_at, type: pc.status === 'rejected' ? 'application_rejected' : 'stage_change', icon: pc.status === 'rejected' ? 'x-circle' : 'users', metadata: { stage: pc.stage, status: pc.status, opportunityId: pc.opportunity_id } });
        });

        offersRes.data?.forEach((offer: any) => {
          const isNew = new Date(offer.inserted_at).getTime() === new Date(offer.updated_at).getTime();
          const action = isNew ? 'extended an offer to you' : `updated your offer status to ${offer.status}`;
          activities.push({ id: `offer-${offer.id}`, user: 'HR Team', action, candidate: offer.job_title, details: `${offer.job_title}${offer.offered_ctc ? ` - ${offer.offered_ctc}` : ''}`, timestamp: offer.updated_at, type: offer.status === 'accepted' ? 'offer_accepted' : offer.status === 'rejected' ? 'offer_rejected' : 'offer_extended', icon: offer.status === 'accepted' ? 'check-circle' : offer.status === 'rejected' ? 'x-circle' : 'document-text', metadata: { status: offer.status, ctc: offer.offered_ctc, expiryDate: offer.expiry_date, offerDate: offer.offer_date } });
        });

        placementsRes.data?.forEach((placement: any) => {
          let action = 'updated your placement status';
          if (placement.placementStatus === 'hired') action = 'hired you';
          if (placement.placementStatus === 'applied') action = 'processed your application';
          activities.push({ id: `placement-${placement.id}`, user: placement.recruiterId || 'Recruiter', action, candidate: placement.jobTitle, details: `${placement.jobTitle}${placement.salaryOffered ? ` - ${placement.salaryOffered}` : ''}`, timestamp: placement.updatedAt, type: placement.placementStatus === 'hired' ? 'placement_hired' : 'placement_update', icon: placement.placementStatus === 'hired' ? 'briefcase' : 'clipboard-document-list', metadata: { status: placement.placementStatus, salary: placement.salaryOffered, metadata: placement.metadata } });
        });

        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return apiSuccess({ activities: activities.slice(0, limit) }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[learner-activity/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
