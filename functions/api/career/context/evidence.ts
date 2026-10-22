/**
 * Career evidence projection — authorized, provenance-carrying evidence for
 * the internal evidence API.
 *
 * Why this exists next to the career prompt builders: those builders render
 * a system prompt and therefore lose provenance. They coerce a NULL skill
 * level to `3` (making "unknown" indistinguishable from a claimed 3) and
 * they never carry `updated_at`, so nothing downstream can tell fresh
 * evidence from stale. This projection keeps the same source tables but
 * emits structured evidence with source, reference, revision and fetched
 * time, and it never invents a value it does not have.
 *
 * The legacy prompt path is unchanged: the cutover to evidence-backed
 * context is a later phase, and until then both read the same tables.
 */

import { deriveOpportunityFilters } from './opportunity-filters';
import { buildQuery, calculateMatchScore, matchesSearchTerms } from './smart-opportunities';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CONTEXT_MAX_BYTES, CONTEXT_MAX_ITEMS, CONTEXT_MAX_TEXT, ContextBundleSchema, type ContextBundle, type ContextItem } from '@rareminds-eym/ai-protocol';

/** Maximum items contributed per evidence kind. */
const KIND_ITEM_CAP: Record<string, number> = {
  'learner.profile': 1,
  'learner.skills': 8,
  'assessment.summary': 1,
  'learner.courses': 5,
  'learner.progress': 1,
  'opportunities.recommended': 3,
};

/** Maximum characters in one evidence text (matches the shared contract). */
const MAX_TEXT = CONTEXT_MAX_TEXT;

/** Maximum items in one bundle (matches the shared contract). */
const MAX_ITEMS = CONTEXT_MAX_ITEMS;

export interface CareerEvidenceInput {
  /** Authenticated actor (SSO user id). Ownership is derived from this. */
  actorId: string;
  /** Signed relevance text only; cannot widen actor/resource/kind scope. */
  query?: string;
  /** Requested evidence kinds. */
  kinds: string[];
  /** Resource references the caller asked for. */
  resources: Array<{ kind: string; id: string }>;
}

function clip(text: string): string {
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

function asIso(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString();
}

function namesOf(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      names.push(entry);
    } else if (entry && typeof entry === 'object') {
      const record = entry as Record<string, unknown>;
      const name = record.name ?? record.skill ?? record.title;
      if (typeof name === 'string') names.push(name);
    }
    if (names.length >= limit) break;
  }
  return names;
}

export interface CareerEvidenceResult {
  bundle: ContextBundle;
  /** The resolved learner id, when a learner exists for the actor. */
  learnerId: string | null;
  /** Resource references the caller asked for that this learner does not own. */
  forbiddenResources: string[];
}

/**
 * Build the evidence bundle for one authenticated actor.
 *
 * Reads are always scoped to the actor's own learner row. A caller cannot
 * name another learner: `resources` referencing a record the actor does not
 * own are reported as forbidden rather than silently ignored.
 */
export async function buildCareerEvidence(
  supabase: SupabaseClient,
  input: CareerEvidenceInput,
  nowMs: number = Date.now(),
): Promise<CareerEvidenceResult> {
  const nowIso = new Date(nowMs).toISOString();
  const requested = new Set(input.kinds);

  // Server-derived ownership: the learner is looked up by the authenticated
  // actor id, never by a learner id supplied in the request.
  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select('id, name, grade, branch_field, university, updated_at')
    .eq('user_id', input.actorId)
    .maybeSingle();
  if (learnerError) {
    console.error('[evidence] learner lookup failed', { code: learnerError.code });
    throw new Error('Evidence store is unavailable');
  }

  if (!learner) {
    return {
      learnerId: null,
      forbiddenResources: input.resources.map(resource => `${resource.kind}:${resource.id}`),
      bundle: {
        evidence: [],
        sources: [],
        missing: [...requested],
        absent: [],
        stale: [],
        invalid: [],
        gatheredAt: nowIso,
      },
    };
  }

  const learnerId = learner.id as string;
  const forbidden = input.resources.filter(resource => resource.kind !== 'learner' || resource.id !== learnerId);
  if (forbidden.length) {
    return { learnerId, forbiddenResources: forbidden.map(resource => `${resource.kind}:${resource.id}`),
      bundle: { evidence: [], sources: [], missing: [], absent: [], stale: [], invalid: [], gatheredAt: nowIso } };
  }
  const evidence: ContextItem[] = [];
  const technicalSkillNames: string[] = [];
  const sources = new Set<string>();
  const missing: string[] = [];

  const add = (kind: string, item: Omit<ContextItem, 'kind'>) => {
    const cap = KIND_ITEM_CAP[kind] ?? 3;
    const already = evidence.filter((entry) => entry.kind === kind).length;
    if (already >= cap) return;
    sources.add(item.source);
    evidence.push({ kind, ...item });
  };

  // ── learner.profile ─────────────────────────────────────────────────────
  if (requested.has('learner.profile')) {
    const parts = [
      learner.name ? `Name: ${learner.name}` : null,
      learner.grade ? `Grade: ${learner.grade}` : null,
      learner.branch_field ? `Field of study: ${learner.branch_field}` : null,
      learner.university ? `University: ${learner.university}` : null,
    ].filter((part): part is string => Boolean(part));
    if (parts.length > 0) {
      add('learner.profile', {
        reference: `learner:${learnerId}`,
        text: clip(parts.join('. ')),
        source: 'skillpassport:learners',
        ...(asIso(learner.updated_at) ? { revision: asIso(learner.updated_at) } : {}),
        gatheredAt: nowIso,
      });
    }
  }

  // ── learner.skills ──────────────────────────────────────────────────────
  if (requested.has('learner.skills')) {
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, type, level, verified, updated_at')
      .eq('learner_id', learnerId)
      .eq('enabled', true)
      .limit(20);
    if (skillsError) {
      console.error('[evidence] skills read failed', { code: skillsError.code });
      throw new Error('Evidence store is unavailable');
    }
    for (const skill of skills ?? []) {
      const name = typeof skill.name === 'string' ? skill.name : null;
      if (!name) continue;
      if (skill.type === 'technical') technicalSkillNames.push(name);
      // An absent level stays absent: "unknown" is never rendered as a number.
      const level = typeof skill.level === 'number' ? `level ${skill.level}` : 'level unknown';
      const provenance = skill.verified === true ? 'verified' : 'self-reported';
      const kind = skill.type === 'soft' ? 'soft skill' : 'technical skill';
      add('learner.skills', {
        reference: `skill:${skill.id}`,
        text: clip(`${name} (${kind}, ${level}, ${provenance})`),
        source: 'skillpassport:skills',
        ...(asIso(skill.updated_at) ? { revision: asIso(skill.updated_at) } : {}),
        gatheredAt: nowIso,
      });
    }
  }

  // ── assessment.summary ──────────────────────────────────────────────────
  if (requested.has('assessment.summary')) {
    const { data: assessment, error: assessmentError } = await supabase
      .from('personal_assessment_results')
      .select(
        'id, riasec_code, riasec_scores, aptitude_overall, employability_readiness, career_fit, skill_gap, roadmap, overall_summary, created_at, updated_at',
      )
      .eq('learner_id', learnerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (assessmentError) {
      console.error('[evidence] assessment read failed', { code: assessmentError.code });
      throw new Error('Evidence store is unavailable');
    }
    if (assessment) {
      const scores = (assessment.riasec_scores ?? {}) as Record<string, unknown>;
      const topInterests = Object.entries(scores)
        .filter(([, value]) => typeof value === 'number')
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([key]) => key);
      const skillGaps = namesOf(assessment.skill_gap, 6);
      const goals = namesOf(
        Array.isArray(assessment.roadmap) ? assessment.roadmap : undefined,
        5,
      );
      const parts = [
        assessment.riasec_code ? `RIASEC code: ${assessment.riasec_code}` : null,
        topInterests.length > 0 ? `Top interests: ${topInterests.join(', ')}` : null,
        typeof assessment.aptitude_overall === 'number'
          ? `Aptitude overall: ${assessment.aptitude_overall}`
          : null,
        assessment.employability_readiness
          ? `Employability: ${assessment.employability_readiness}`
          : null,
        skillGaps.length > 0 ? `Skill gaps: ${skillGaps.join(', ')}` : null,
        goals.length > 0 ? `Goals: ${goals.join(', ')}` : null,
        assessment.overall_summary ? `Summary: ${assessment.overall_summary}` : null,
      ].filter((part): part is string => Boolean(part));
      if (parts.length > 0) {
        add('assessment.summary', {
          reference: `assessment:${assessment.id}`,
          text: clip(parts.join('. ')),
          source: 'skillpassport:personal_assessment_results',
          ...(asIso(assessment.updated_at) ? { revision: asIso(assessment.updated_at) } : {}),
          gatheredAt: nowIso,
        });
      }
    }
  }

  // ── learner.courses ─────────────────────────────────────────────────────
  if (requested.has('learner.courses')) {
    const { data: enrollments, error: coursesError } = await supabase
      .from('course_enrollments')
      .select('id, course_id, course_title, progress, status, certificate_url, updated_at')
      .eq('learner_id', learnerId)
      .order('enrolled_at', { ascending: false })
      .limit(10);
    if (coursesError) {
      console.error('[evidence] course read failed', { code: coursesError.code });
      throw new Error('Evidence store is unavailable');
    }
    for (const enrollment of enrollments ?? []) {
      const title = typeof enrollment.course_title === 'string' ? enrollment.course_title : null;
      if (!title) continue;
      const progress = typeof enrollment.progress === 'number' ? enrollment.progress : null;
      const parts = [
        `Enrolled: ${title}`,
        enrollment.status ? `status ${enrollment.status}` : null,
        progress !== null ? `progress ${progress}%` : null,
        enrollment.certificate_url ? `certificate ${enrollment.certificate_url}` : null,
      ].filter((part): part is string => Boolean(part));
      add('learner.courses', {
        reference: `enrollment:${enrollment.id}`,
        text: clip(parts.join(', ')),
        source: 'skillpassport:course_enrollments',
        ...(asIso(enrollment.updated_at) ? { revision: asIso(enrollment.updated_at) } : {}),
        gatheredAt: nowIso,
      });
    }
  }

  // ── learner.progress ────────────────────────────────────────────────────
  if (requested.has('learner.progress')) {
    const [appliedResult, savedResult] = await Promise.all([
      supabase
        .from('applied_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('learner_id', learnerId),
      supabase
        .from('saved_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('learner_id', learnerId),
    ]);
    if (appliedResult.error || savedResult.error || appliedResult.count === null || savedResult.count === null) {
      // Unknown counts are unavailable, never evidence of zero activity.
      throw new Error('Evidence store is unavailable');
    }
    const appliedCount = appliedResult.count;
    const savedCount = savedResult.count;
    add('learner.progress', {
      reference: `progress:${learnerId}`,
      text: clip(
        `Applied to ${appliedCount} job(s), saved ${savedCount} job(s) in the career portal.`,
      ),
      source: 'skillpassport:career_progress',
      gatheredAt: nowIso,
    });
  }

  // ── opportunities.recommended ───────────────────────────────────────────
  if (requested.has('opportunities.recommended')) {
    const filters = deriveOpportunityFilters({ message: input.query ?? '', skills: technicalSkillNames,
      department: learner.branch_field ?? undefined, experienceCount: 0 });
    const { data: opportunities, error: opportunitiesError } = await buildQuery(supabase, filters,
      'id, title, company_name, employment_type, location, skills_required, application_link, updated_at');
    if (opportunitiesError) {
      console.error('[evidence] opportunity read failed', { code: opportunitiesError.code });
      throw new Error('Evidence store is unavailable');
    }
    // Same deterministic search and ranking as the legacy lookup, before the
    // evidence cap. A restrictive text query falls back to ranked query results.
    const parsedOpportunities = (opportunities ?? []).map((opportunity: any) => {
      let skills = opportunity.skills_required;
      if (typeof skills === 'string') {
        try { skills = JSON.parse(skills); }
        catch { skills = skills.split(',').map((value: string) => value.trim()).filter(Boolean); }
      }
      return { ...opportunity, skills_required: Array.isArray(skills) ? skills : [] };
    });
    const matching = parsedOpportunities.filter(opportunity => matchesSearchTerms(opportunity, filters.searchQuery ?? ''));
    const candidates = matching.length ? matching : parsedOpportunities;
    const searchTerms = (filters.searchQuery ?? '').split(' ').filter(term => term.length > 2);
    const ranked = candidates.map(opportunity => ({ opportunity,
      score: calculateMatchScore(opportunity, technicalSkillNames, searchTerms) }))
      .sort((a, b) => b.score - a.score);
    for (const { opportunity } of ranked) {
      const title = typeof opportunity.title === 'string' ? opportunity.title : null;
      if (!title) continue;
      const skills = namesOf(opportunity.skills_required, 6);
      const parts = [
        `Opportunity: ${title}`,
        opportunity.company_name ? `at ${opportunity.company_name}` : null,
        opportunity.employment_type ? `type ${opportunity.employment_type}` : null,
        opportunity.location ? `location ${opportunity.location}` : null,
        skills.length > 0 ? `skills ${skills.join(', ')}` : null,
        opportunity.application_link ? `apply ${opportunity.application_link}` : null,
      ].filter((part): part is string => Boolean(part));
      add('opportunities.recommended', {
        reference: `opportunity:${opportunity.id}`,
        text: clip(parts.join(', ')),
        source: 'skillpassport:opportunities',
        ...(asIso(opportunity.updated_at) ? { revision: asIso(opportunity.updated_at) } : {}),
        gatheredAt: nowIso,
      });
    }
  }

  // ── resource ownership ──────────────────────────────────────────────────
  // The caller may name resources; anything not owned by this learner is
  // refused rather than quietly dropped.
  const forbiddenResources: string[] = [];
  for (const resource of input.resources) {
    if (resource.kind === 'learner' && resource.id !== learnerId) {
      forbiddenResources.push(`${resource.kind}:${resource.id}`);
    }
  }

  // A requested kind that produced nothing is absent, not forbidden.
  const producedKinds = new Set(evidence.map((item) => item.kind));
  for (const kind of requested) {
    if (!producedKinds.has(kind)) missing.push(kind);
  }

  const bundle: ContextBundle = {
    evidence: evidence.slice(0, MAX_ITEMS),
    sources: [...sources],
    missing,
    absent: [],
    stale: [],
    invalid: [],
    gatheredAt: nowIso,
  };

  const finalize = () => {
    bundle.sources = [...new Set(bundle.evidence.map(item => item.source))];
    const keptKinds = new Set(bundle.evidence.map(item => item.kind));
    bundle.missing = [...requested].filter(kind => !keptKinds.has(kind));
  };
  finalize();
  while (new TextEncoder().encode(JSON.stringify(bundle)).byteLength > CONTEXT_MAX_BYTES && bundle.evidence.length > 0) {
    bundle.evidence.pop();
    finalize();
  }
  const checked = ContextBundleSchema.safeParse(bundle);
  if (!checked.success) throw new Error('Evidence projection violates the response contract');
  return { bundle: checked.data, learnerId, forbiddenResources };
}
