import type { SupabaseClient } from '@supabase/supabase-js';

// Matches the existing V2 and generic SQL contract. Deadline equality is closed.
export function eligibleJobs<T>(query: T, now = new Date().toISOString()): T {
  return (query as any).eq('status', 'open').eq('is_active', true)
    .or(`deadline.is.null,deadline.gt.${now}`);
}

export function isEligibleJob(job: any, now = Date.now()): boolean {
  return job?.status === 'open' && job?.is_active === true &&
    (job.deadline == null || (Number.isFinite(Date.parse(job.deadline)) && Date.parse(job.deadline) > now));
}

export function stringSkills(value: unknown): string[] {
  const list = typeof value === 'string' ? value.split(',') : value;
  return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string' && !!s.trim()).map(s => s.trim()) : [];
}

export function privateRecommendations(response: Response): Response {
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Origin, Authorization, Cookie');
  return response;
}

export const JOB_FIELDS = 'id,title,job_title,company_name,company_logo,employment_type,location,mode,stipend_or_salary,experience_required,experience_level,skills_required,description,application_link,deadline,is_active,status,created_at,updated_at,department,sector,salary_range_min,salary_range_max,posted_date,closing_date,requirements,responsibilities,benefits,learning_requirements,learning_requirements_version';

/** Ranker/cache rows supply scores only; current job fields always come from DB. */
export async function hydrateJobs(db: SupabaseClient, ranks: any[], dismissedIds: string[]): Promise<any[]> {
  const ids = [...new Set(ranks.slice(0, 100).map(row => row?.id).filter(id => typeof id === 'string'))];
  if (!ids.length) return [];
  const { data, error } = await eligibleJobs(db.from('opportunities').select(JOB_FIELDS).in('id', ids));
  if (error) throw new Error('JOB_HYDRATION_FAILED');
  const jobs = new Map((data || []).filter(job => isEligibleJob(job)).map(job => [job.id, job]));
  const dismissed = new Set(dismissedIds);
  const seen = new Set<string>();
  return ranks.flatMap(rank => {
    if (!jobs.has(rank?.id) || dismissed.has(rank.id) || seen.has(rank.id)) return [];
    seen.add(rank.id);
    const score = (name: string) => typeof rank[name] === 'number' && Number.isFinite(rank[name]) ? rank[name] : null;
    return [{ ...jobs.get(rank.id), similarity: score('similarity'), final_score: score('final_score'),
      match_percentage: score('match_percentage'), skill_match_score: score('skill_match_score'),
      certificate_match_score: score('certificate_match_score'), project_match_score: score('project_match_score') }];
  });
}
