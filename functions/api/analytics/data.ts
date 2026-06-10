import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';

function buildDateRange(preset: string, start?: string, end?: string): { startDate: string; endDate: string } {
  if (preset === 'custom' && start && end) return { startDate: start, endDate: end };
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;
  if (preset === 'ytd') {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  } else {
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    const d = new Date(now); d.setDate(d.getDate() - days);
    startDate = d.toISOString();
  }
  return { startDate, endDate };
}

function makeTrendLabels(preset: string): string[] {
  switch (preset) {
    case '7d': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    case '30d': return ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'];
    case '90d': return ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
    case 'ytd': return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    default: return ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5'];
  }
}

function bucketize(timestamps: string[], buckets: number, startISO: string, endISO: string): number[] {
  if (buckets <= 0) return [];
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  const span = Math.max(1, end - start);
  const arr = Array(buckets).fill(0);
  timestamps.forEach(ts => {
    const t = new Date(ts).getTime();
    const ratio = Math.min(0.999999, Math.max(0, (t - start) / span));
    arr[Math.floor(ratio * buckets)] += 1;
  });
  return arr;
}

function parseSkills(skillsData: any): string[] {
  if (!skillsData) return [];
  let skills: string[] = [];
  try {
    if (Array.isArray(skillsData)) {
      skills = skillsData.filter((s: any) => s && typeof s === 'string');
    } else if (typeof skillsData === 'string') {
      const separators = [',', ';', '|', '\n', '•', '-'];
      let bestSplit = [skillsData];
      for (const sep of separators) {
        if (skillsData.includes(sep)) {
          const split = skillsData.split(sep);
          if (split.length > bestSplit.length) bestSplit = split;
        }
      }
      skills = bestSplit.map((s: string) => s.trim()).filter(Boolean);
    } else if (typeof skillsData === 'object') {
      if (skillsData.skills) return parseSkills(skillsData.skills);
      else if (skillsData.name) skills = [skillsData.name];
      else skills = Object.values(skillsData).filter(v => typeof v === 'string').map((v: string) => v.trim()).filter(Boolean);
    }
  } catch {}
  return skills.map((s: string) => s.trim().replace(/^[-•\s]+/, '').replace(/[.,:;]+$/, '').replace(/\s+/g, ' ').trim())
    .filter((s: string) => s.length > 1 && s.length < 100 && !/^\d+$/.test(s) && /[a-zA-Z]/.test(s));
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

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

      // ─── Recruitment Funnel Stats ────────────────────────
      case 'get-funnel-stats': {
        const { startDate, endDate } = buildDateRange(params.preset, params.startDate, params.endDate);

        const { data: candidates, error: snapErr } = await supabase
          .from('pipeline_candidates').select('stage, status');
        if (snapErr) throw snapErr;

        let sourced = 0, screened = 0, interviewed = 0, offered = 0, hired = 0;
        (candidates || []).forEach((c: any) => {
          if (c.status === 'rejected') return;
          const s = (c.stage || '').toLowerCase();
          if (s === 'sourced') sourced++;
          else if (s === 'screened') screened++;
          else if (s === 'interview_1' || s === 'interview_2' || s === 'interviewed') interviewed++;
          else if (s === 'offer' || s === 'offered') offered++;
          else if (s === 'hired') hired++;
        });

        const { data: activities, error: actErr } = await supabase
          .from('pipeline_activities').select('to_stage, created_at')
          .eq('activity_type', 'stage_change').eq('to_stage', 'hired')
          .gte('created_at', startDate).lte('created_at', endDate);
        if (actErr) throw actErr;

        const hiredTimestamps = (activities || []).map((a: any) => a.created_at);
        const labels = makeTrendLabels(params.preset);
        const hiresTrend = bucketize(hiredTimestamps, labels.length, startDate, endDate);

        return apiSuccess({ sourced, screened, interviewed, offered, hired, trendLabels: labels, hiresTrend }, context.request, { startTime });
      }

      // ─── Analytics KPI Metrics ────────────────────────────
      case 'get-kpi-metrics': {
        const { startDate, endDate } = buildDateRange(params.preset, params.startDate, params.endDate);
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        const periodLength = endMs - startMs;
        const prevStartDate = new Date(startMs - periodLength).toISOString();
        const prevEndDate = new Date(endMs - periodLength).toISOString();

        const { data: currentCandidates } = await supabase
          .from('pipeline_candidates').select('id, stage, status, added_at, learner_id')
          .gte('added_at', startDate).lte('added_at', endDate);

        const totalCandidates = (currentCandidates || []).length;

        const { data: currentHires } = await supabase
          .from('pipeline_activities').select('pipeline_candidate_id, created_at')
          .eq('activity_type', 'stage_change').eq('to_stage', 'hired')
          .gte('created_at', startDate).lte('created_at', endDate);

        const successfulHires = (currentHires || []).length;
        const hiredCandidateIds = [...new Set((currentHires || []).map((h: any) => h.pipeline_candidate_id))];

        let timeToHire = 23;
        if (hiredCandidateIds.length > 0) {
          const { data: hiredDetails } = await supabase
            .from('pipeline_candidates').select('id, added_at').in('id', hiredCandidateIds);

          if (hiredDetails) {
            const durations: number[] = [];
            for (const cand of hiredDetails) {
              const ha = (currentHires || []).find((h: any) => h.pipeline_candidate_id === cand.id);
              if (ha && cand.added_at) {
                durations.push(Math.max(0, Math.round((new Date(ha.created_at).getTime() - new Date(cand.added_at).getTime()) / (1000 * 60 * 60 * 24))));
              }
            }
            if (durations.length > 0) timeToHire = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
          }
        }

        let qualityScore = 85.2;
        if (hiredCandidateIds.length > 0) {
          const { data: hiredCands } = await supabase
            .from('pipeline_candidates').select('learner_id').in('id', hiredCandidateIds);
          const learnerIds = (hiredCands || []).map((c: any) => c.learner_id).filter(Boolean);
          if (learnerIds.length > 0) {
            const { data: learners } = await supabase
              .from('learners').select('employability_score').in('id', learnerIds);
            const scores = (learners || []).map((s: any) => s.employability_score).filter((s: number) => s && s > 0);
            if (scores.length > 0) qualityScore = parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1));
          }
        }

        const { data: prevCandidates } = await supabase
          .from('pipeline_candidates').select('id').gte('added_at', prevStartDate).lte('added_at', prevEndDate);
        const prevTotalCandidates = (prevCandidates || []).length;

        const { data: prevHires } = await supabase
          .from('pipeline_activities').select('pipeline_candidate_id, created_at')
          .eq('activity_type', 'stage_change').eq('to_stage', 'hired')
          .gte('created_at', prevStartDate).lte('created_at', prevEndDate);
        const prevSuccessfulHires = (prevHires || []).length;
        const prevHiredIds = [...new Set((prevHires || []).map((h: any) => h.pipeline_candidate_id))];

        let prevTimeToHire = timeToHire;
        if (prevHiredIds.length > 0) {
          const { data: prevHiredDetails } = await supabase.from('pipeline_candidates').select('id, added_at').in('id', prevHiredIds);
          if (prevHiredDetails) {
            const prevDurations: number[] = [];
            for (const cand of prevHiredDetails) {
              const ha = (prevHires || []).find((h: any) => h.pipeline_candidate_id === cand.id);
              if (ha && cand.added_at) prevDurations.push(Math.max(0, Math.round((new Date(ha.created_at).getTime() - new Date(cand.added_at).getTime()) / (1000 * 60 * 60 * 24))));
            }
            if (prevDurations.length > 0) prevTimeToHire = Math.round(prevDurations.reduce((a, b) => a + b, 0) / prevDurations.length);
          }
        }

        let prevQualityScore = qualityScore;
        if (prevHiredIds.length > 0) {
          const { data: prevHiredCands } = await supabase.from('pipeline_candidates').select('learner_id').in('id', prevHiredIds);
          const prevLearnerIds = (prevHiredCands || []).map((c: any) => c.learner_id).filter(Boolean);
          if (prevLearnerIds.length > 0) {
            const { data: prevLearners } = await supabase.from('learners').select('employability_score').in('id', prevLearnerIds);
            const prevScores = (prevLearners || []).map((s: any) => s.employability_score).filter((s: number) => s && s > 0);
            if (prevScores.length > 0) prevQualityScore = parseFloat((prevScores.reduce((a: number, b: number) => a + b, 0) / prevScores.length).toFixed(1));
          }
        }

        return apiSuccess({
          totalCandidates, successfulHires, timeToHire, qualityScore,
          totalCandidatesTrend: calcTrend(totalCandidates, prevTotalCandidates),
          successfulHiresTrend: calcTrend(successfulHires, prevSuccessfulHires),
          timeToHireTrend: -1 * calcTrend(timeToHire, prevTimeToHire),
          qualityScoreTrend: calcTrend(qualityScore, prevQualityScore),
        }, context.request, { startTime });
      }

      // ─── Usage Statistics ─────────────────────────────────
      case 'get-usage-stats': {
        const userId = params.userId || user.id;

        const getCount = async (table: string, field = 'learner_id'): Promise<number> => {
          try {
            const { count } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(field, userId);
            return count || 0;
          } catch { return 0; }
        };

        const [assessments, profileViews, reports] = await Promise.all([
          getCount('personal_assessment_results'),
          getCount('profile_views'),
          getCount('learner_reports'),
        ]);

        return apiSuccess({
          assessments: { used: assessments, label: 'Skill Assessments' },
          profileViews: { used: profileViews, label: 'Profile Views' },
          reports: { used: reports, label: 'Reports Generated' },
        }, context.request, { startTime });
      }

      // ─── Skills Demand Analysis ───────────────────────────
      case 'get-skills-demand': {
        const limit = params.limit || 5;

        const { data: opportunities, error } = await supabase
          .from('opportunities').select('skills_required, job_title, id')
          .eq('is_active', true).not('skills_required', 'is', null);

        if (error) throw error;
        if (!opportunities?.length) return apiSuccess({ topSkills: [], totalOpportunities: 0, lastUpdated: new Date().toISOString(), analysis: { mostDemandedSkill: null, averageDemand: 0 } }, context.request, { startTime });

        const skillCounts: Record<string, number> = {};
        opportunities.forEach((opp: any) => {
          parseSkills(opp.skills_required).forEach((skill: string) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        });

        const topSkills = Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / opportunities.length) * 100) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);

        const { count: totalOpportunities } = await supabase
          .from('opportunities').select('*', { count: 'exact', head: true }).eq('is_active', true);

        return apiSuccess({
          topSkills,
          totalOpportunities: totalOpportunities || 0,
          lastUpdated: new Date().toISOString(),
          analysis: {
            mostDemandedSkill: topSkills[0]?.skill || null,
            averageDemand: topSkills.length > 0 ? Math.round(topSkills.reduce((sum, s) => sum + s.count, 0) / topSkills.length) : 0,
          },
        }, context.request, { startTime });
      }

      // ─── Top Skills in Demand (simple) ────────────────────
      case 'get-top-skills-demand': {
        const limit = params.limit || 5;

        const { data: opportunities } = await supabase
          .from('opportunities').select('skills_required, job_title, id')
          .eq('is_active', true).not('skills_required', 'is', null);

        if (!opportunities?.length) return apiSuccess([], context.request, { startTime });

        const skillCounts: Record<string, number> = {};
        opportunities.forEach((opp: any) => {
          parseSkills(opp.skills_required).forEach((skill: string) => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        });

        return apiSuccess(
          Object.entries(skillCounts)
            .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / opportunities.length) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit),
          context.request, { startTime }
        );
      }

      // ─── Check Email Exists ───────────────────────────────
      case 'check-email': {
        const email = params.email?.toLowerCase();
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email parameter', context.request, { startTime });

        try {
          const { data, error } = await supabase.rpc('check_email_exists', { email_to_check: email });
          if (!error) return apiSuccess(data, context.request, { startTime });
        } catch {}

        const { data } = await supabase.from('learners').select('email').eq('email', email).maybeSingle();
        return apiSuccess(!!data, context.request, { startTime });
      }

      // ─── Quick Email Check ────────────────────────────────
      case 'quick-email-check': {
        const email = params.email?.toLowerCase();
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email parameter', context.request, { startTime });

        const { data } = await supabase.from('learners').select('email, name').eq('email', email).maybeSingle();
        return apiSuccess({ exists: !!data, name: data?.name || null }, context.request, { startTime });
      }

      // ─── Get Learner by ID ────────────────────────────────
      case 'get-learner-by-id': {
        const learnerId = params.learnerId;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId parameter', context.request, { startTime });

        try {
          const { data, error } = await supabase.rpc('get_learner_by_id', { learner_id: learnerId });
          if (!error && data?.length > 0) return apiSuccess(data[0], context.request, { startTime });
        } catch {}

        const { data } = await supabase.from('learners').select('id, email, name, profile, createdAt').eq('id', learnerId).single();
        return apiSuccess(data, context.request, { startTime });
      }

      // ─── Batch Get Learners ───────────────────────────────
      case 'get-learners-batch': {
        const ids = params.learnerIds;
        if (!ids?.length) return apiSuccess([], context.request, { startTime });

        const { data } = await supabase.from('learners').select('id, email, name, profile, createdAt').in('id', ids);
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ─── Get Active Subscription ──────────────────────────
      case 'get-active-subscription': {
        const userId = params.userId || user.id;

        const { data } = await supabase
          .from('subscription_cache').select('*')
          .eq('user_id', userId).in('status', ['active', 'pending'])
          .order('created_at', { ascending: false }).limit(1).maybeSingle();

        return apiSuccess(data, context.request, { startTime });
      }

      // ─── Debug Opportunities ──────────────────────────────
      case 'debug-opportunities': {
        const { data: samples } = await supabase.from('opportunities').select('*').limit(5);
        const { count: totalCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
        const { count: activeCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('is_active', true);

        return apiSuccess({ samples: samples || [], totalCount: totalCount || 0, activeCount: activeCount || 0 }, context.request, { startTime });
      }

      // ─── Learner Analytics ────────────────────────────────
      case 'get-learner-analytics': {
        const userEmail = params.userEmail;
        if (!userEmail) return apiError(400, 'VALIDATION_ERROR', 'Missing userEmail parameter', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners').select('id').eq('email', userEmail).maybeSingle();

        if (learnerError || !learner) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });

        const { data: appliedJobs } = await supabase
          .from('applied_jobs')
          .select(`*, opportunities!fk_applied_jobs_opportunity (id, job_title, title, company_name, employment_type, location, salary_range_min, salary_range_max, mode)`)
          .eq('learner_id', learner.id)
          .order('applied_at', { ascending: false });

        return apiSuccess({ applications: appliedJobs || [] }, context.request, { startTime });
      }

      default:
        return apiError(400, 'INVALID_ACTION', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    return apiDbError(error, context.request, { startTime });
  }
});
