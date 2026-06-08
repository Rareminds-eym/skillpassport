import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { verifyOrgAccess } from '../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const url = new URL(context.request.url);

  const orgId = url.searchParams.get('org_id') || user.org_id;
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (orgId) {
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) return access.error!;
  }

  let query = supabase
    .from('pipeline_candidates')
    .select(`
      id,
      stage,
      status,
      stage_changed_at,
      organization_id,
      learner_id
    `)
    .order('stage_changed_at', { ascending: false });

  if (startDate) {
    query = query.gte('stage_changed_at', startDate);
  }
  if (endDate) {
    query = query.lte('stage_changed_at', endDate);
  }
  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  const { data: candidates, error } = await query;

  if (error) {
    console.error('[course-performance] Error:', error);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const learnerIds = [...new Set(candidates.map((c: any) => c.learner_id).filter(Boolean))];

  let learnerMap = new Map<string, any>();
  if (learnerIds.length > 0) {
    const { data: learners } = await supabase
      .from('learners')
      .select('id, branch_field, course_name, college_school_name')
      .in('id', learnerIds);

    if (learners) {
      for (const l of learners) {
        learnerMap.set(l.id, l);
      }
    }
  }

  const result = candidates.map((c: any) => {
    const learner = learnerMap.get(c.learner_id);
    return {
      learners: {
        profile: {
          course: learner?.course_name || null,
          program: learner?.branch_field || learner?.college_school_name || null,
        },
      },
      stage: c.stage,
      status: c.status,
      stage_changed_at: c.stage_changed_at,
    };
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
