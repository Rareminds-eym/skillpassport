/**
 * Career Cluster Generator — Middle School (Grades 6–8)
 *
 * Produces the `careerFit.clusters` structure consumed by the report page.
 *
 * Division of responsibility (HARD RULES):
 * - DETERMINISTIC backend (this file, code only):
 *     1. Retrieve candidate occupations via RAG (match_occupations_by_embedding, semantic). No C-Index.
 *     2. Score each candidate with the grade-appropriate scorer (college = 5-component,
 *        others = 3-component). Interest Fit uses the Holland hexagon, not C-Index.
 *     3. Rank and select a domain-diverse Top-15 (ties broken by semantic relevance).
 *     4. After OpenRouter groups them, compute each cluster's matchScore
 *        (simple average of its occupations' scores) and the High/Medium/Explore fit band.
 * - OpenRouter (narrative + grouping ONLY):
 *     groups the provided occupations into clusters and writes title / description /
 *     derivation / whyItFits / futureOutlook / educational pathways / narratives.
 *     It MUST NOT invent or remove occupations, change ranking, or compute scores.
 *
 * The match score the model emits (if any) is discarded; scores are injected by code.
 */

import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import {
  calculateMiddleSchoolMatchScore,
  calculateCollegeMatchScore,
  type StudentProfile,
  type GradeLevel,
} from './scoring-service';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
import { EMBEDDING_TASK_TYPES } from '../../embedding/config/constants';
import { getClusterPrompt } from '../prompts';
import type { ClusterNarrativeContext } from '../types';

// Re-export so existing importers (analysis-*) keep working.
export type { ClusterNarrativeContext } from '../types';

/** Number of top candidate occupations sent to OpenRouter (Phase 1 decision). */
const TOP_N_OCCUPATIONS = 15;

/**
 * Larger candidate pool pulled from RAG retrieval before domain-aware diversification.
 * A wider semantic pool can be dominated by near-duplicate occupations from a single domain,
 * so we pull this many and then diversify across domains when selecting the Top-15.
 */
const CANDIDATE_POOL_SIZE = 50;

/**
 * OpenRouter configuration.
 * llama-3.3-70b leads because it reliably returns JSON content in ~1s. deepseek-r1
 * is a reasoning model that returns its output in a `reasoning` field, so the content
 * parser sees an empty response and wastes all retries (~100s) — keep it only as a
 * last-resort fallback, not first.
 */
const CLUSTER_GENERATION_CONFIG = {
  // gpt-4o-mini primary (matches production): strong instruction-following keeps the cluster
  // narrative + overallSummary concise and rule-compliant; gemini-2.0-flash is a cheap fallback.
  // Low temperature (0.1) for consistent, non-verbose output.
  models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'],
  maxTokens: 3500,
  temperature: 0.1,
};

/** Fit band thresholds derived from a cluster's computed matchScore. */
function fitBandFor(matchScore: number): 'High' | 'Medium' | 'Explore' {
  if (matchScore >= 80) return 'High';
  if (matchScore >= 65) return 'Medium';
  return 'Explore';
}

interface ScoredOccupation {
  occupation_id: string;
  code: string;
  name: string;
  riasecCodes: string[];
  score: number; // match score .final — for ranking + cluster averaging only
  domain: string; // primary domain name (occupations_context -> domains), or 'Unknown'
  semanticScore?: number;  // cosine similarity ×100 vs student embedding (RAG relevance)
  semanticRank?: number;   // 1-based rank by semanticScore within the pool
  // [DIAG] TEMP — component breakdown for flat-score investigation. Remove after validation.
  diagInterestFit?: number;
  diagCapabilityFit?: number;
  diagPersonalityFit?: number;
}

/**
 * Generate the middle-school `careerFit` object — 3-component scoring (RIASEC + strengths +
 * learning preferences). Thin wrapper over the shared core.
 */
export function generateMiddleSchoolCareerClusters(
  supabase: any,
  student: StudentProfile,
  env: Record<string, string>,
  context: ClusterNarrativeContext = {}
): Promise<{ clusters: unknown[]; specificOptions?: unknown; overallSummary?: string } | null> {
  return generateCareerClusters(supabase, student, env, context, 'middle');
}

/**
 * Generate the college `careerFit` object — 5-component scoring (RIASEC + aptitude/strengths +
 * Big Five + Knowledge + Work Values) and a richer semantic-query embedding. Thin wrapper.
 */
export function generateCollegeCareerClusters(
  supabase: any,
  student: StudentProfile,
  env: Record<string, string>,
  context: ClusterNarrativeContext = {}
): Promise<{ clusters: unknown[]; specificOptions?: unknown; overallSummary?: string } | null> {
  return generateCareerClusters(supabase, student, env, context, 'college');
}

/**
 * Shared cluster-generation core for all grade levels. `gradeLevel` selects the scorer
 * (`calculateMiddleSchoolMatchScore` vs `calculateCollegeMatchScore`) and the richness of the
 * student embedding text; everything else (retrieval, RAG re-rank, diversify, OpenRouter,
 * score injection) is identical.
 *
 * @returns the careerFit object, or null when there are no candidate occupations
 *          (caller should then skip cluster storage — analysis itself still succeeds).
 */
async function generateCareerClusters(
  supabase: any,
  student: StudentProfile,
  env: Record<string, string>,
  context: ClusterNarrativeContext,
  gradeLevel: GradeLevel
): Promise<{ clusters: unknown[]; specificOptions?: unknown; overallSummary?: string } | null> {
  const riasecCode = (student.riasec_code || '').slice(0, 3);
  if (!riasecCode) {
    console.warn('[CLUSTER-GEN] No RIASEC code — skipping cluster generation');
    return null;
  }

  // RAG retrieval (semantic) for all grades. C-Index is not used anywhere in this pipeline.
  const pool = await retrieveByEmbedding(supabase, student, context, riasecCode, env, gradeLevel);

  if (pool.length === 0) {
    console.warn('[CLUSTER-GEN] No candidate occupations — skipping');
    return null;
  }

  await attachDomains(supabase, pool);

  const topN = diversifyByDomain(pool, TOP_N_OCCUPATIONS);

  // [DIAG] student primary RIASEC + scores used for Interest Fit.
  console.log('[CLUSTER-GEN][DIAG] student riasec_code=', student.riasec_code,
    'riasec_scores=', JSON.stringify(student.riasec_scores));
  console.log(`[CLUSTER-GEN][DIAG] POOL (semantic order, ${pool.length}):`);
  pool.forEach((o, i) => {
    console.log(
      `[CLUSTER-GEN][DIAG]  #${i + 1} ${o.name} | domain=${o.domain} ` +
        `| score=${o.score} | semanticScore=${o.semanticScore ?? 'n/a'} | semanticRank=${o.semanticRank ?? 'n/a'}`
    );
  });
  console.log('[CLUSTER-GEN][DIAG] DOMAIN DISTRIBUTION (before):', JSON.stringify(domainCounts(pool)));
  console.log(`[CLUSTER-GEN][DIAG] DIVERSIFIED TOP ${topN.length} (occupation | score | semanticScore | semanticRank | finalRank):`);
  topN.forEach((o, i) => {
    console.log(
      `[CLUSTER-GEN][DIAG]  ${o.name} | domain=${o.domain} ` +
        `| score=${o.score} | semanticScore=${o.semanticScore ?? 'n/a'} | semanticRank=${o.semanticRank ?? 'n/a'} | finalRank=${i + 1}`
    );
  });
  console.log('[CLUSTER-GEN][DIAG] DOMAIN DISTRIBUTION (after):', JSON.stringify(domainCounts(topN)));

  // 4. OpenRouter: group + narrative only.
  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[CLUSTER-GEN] OpenRouter API key not configured — skipping');
    return null;
  }

  const { system, user } = getClusterPrompt(gradeLevel, student, topN, context);
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  const raw = await callOpenRouterWithRetry(apiKeys.openRouter, messages, {
    models: CLUSTER_GENERATION_CONFIG.models,
    maxTokens: CLUSTER_GENERATION_CONFIG.maxTokens,
    temperature: CLUSTER_GENERATION_CONFIG.temperature,
  });

  const parsed = repairAndParseJSON(raw, true);
  const aiClusters: any[] = parsed?.clusters || parsed?.careerFit?.clusters || [];
  if (!Array.isArray(aiClusters) || aiClusters.length === 0) {
    console.error('[CLUSTER-GEN] OpenRouter returned no clusters');
    return null;
  }
  const specificOptions = sanitizeSpecificOptions(parsed?.specificOptions || parsed?.careerFit?.specificOptions);
  // Capstone summary written in the SAME call as the clusters, so it can name the real best-fit
  // direction (cluster 1) instead of a vague skill. Used to overwrite the synthesis summary.
  const overallSummary = typeof parsed?.overallSummary === 'string' && parsed.overallSummary.trim()
    ? parsed.overallSummary.trim()
    : undefined;

  // 5. DETERMINISTIC: validate occupations, compute cluster scores + fit bands, inject.
  const scoreById = new Map(topN.map((o) => [o.occupation_id, o]));
  const clusters = aiClusters
    .map((c) => finalizeCluster(c, scoreById))
    .filter((c): c is Record<string, unknown> => c !== null);

  if (clusters.length === 0) {
    console.error('[CLUSTER-GEN] No valid clusters after validation');
    return null;
  }

  console.log('[CLUSTER-GEN] Generated clusters:', {
    count: clusters.length,
    scores: clusters.map((c) => c.matchScore),
  });

  return { clusters, specificOptions, overallSummary };
}

/**
 * Sanitize the LLM's specificOptions into { highFit, mediumFit, exploreLater } of
 * { name, salary?: { min, max } }. Salary is an approximate LLM estimate (INR LPA),
 * narrative-only. Returns undefined when nothing usable is present.
 */
function sanitizeSpecificOptions(raw: any): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const group = (items: any): Array<Record<string, unknown>> => {
    if (!Array.isArray(items)) return [];
    return items
      .map((it) => {
        const name = typeof it === 'string' ? it : str(it?.name);
        if (!name) return null;
        const min = Number(it?.salary?.min);
        const max = Number(it?.salary?.max);
        const salary = !isNaN(min) && !isNaN(max) ? { min, max } : undefined;
        return salary ? { name, salary } : { name };
      })
      .filter((x): x is Record<string, unknown> => x !== null);
  };
  const highFit = group(raw.highFit);
  const mediumFit = group(raw.mediumFit);
  const exploreLater = group(raw.exploreLater);
  if (!highFit.length && !mediumFit.length && !exploreLater.length) return undefined;
  return { highFit, mediumFit, exploreLater };
}

/**
 * Build the student "query" document embedded for semantic retrieval.
 * College adds the richer signals (Big Five, work values, knowledge) to sharpen the query.
 */
function buildStudentEmbeddingText(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  gradeLevel: GradeLevel
): string {
  const strengths = (student.strength_scores || [])
    .slice().sort((a, b) => b.average - a.average).slice(0, 6)
    .map((s) => s.dimension).join(', ');
  const prefs = Object.values(student.learning_preferences || {})
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === 'string').join('; ');
  const subtags = context.adaptive?.accuracyBySubtag || {};
  const strongAptitudes = Object.entries(subtags)
    .map(([k, v]) => [k, typeof v === 'object' && v ? Number(v.accuracy) : Number(v)] as [string, number])
    .filter(([, a]) => !isNaN(a)).sort((x, y) => y[1] - x[1]).slice(0, 3)
    .map(([k]) => k.replace(/_/g, ' ')).join(', ');
  const reflections = (context.reflections || []).map((r) => r.answer).join(' ');

  const lines = [
    student.stream ? `Enrolled program / stream: ${student.stream}.` : '',
    student.degreeLevel ? `Study level: ${student.degreeLevel} (${student.degreeLevel === 'postgraduate' ? 'targeting advanced / specialist roles' : 'targeting entry-level roles'}).` : '',
    `Student interest profile (RIASEC ${student.riasec_code}).`,
    `RIASEC scores: ${JSON.stringify(student.riasec_scores)}.`,
    strengths ? `Top character strengths: ${strengths}.` : '',
    strongAptitudes ? `Strongest aptitude areas: ${strongAptitudes}.` : '',
    prefs ? `Learning preferences: ${prefs}.` : '',
  ];

  // College/higher grades: add Big Five, work values, knowledge for a richer query vector.
  if (gradeLevel === 'college') {
    const topN = (obj: Record<string, number> | undefined, n: number) =>
      Object.entries(obj || {}).sort(([, a], [, b]) => b - a).slice(0, n).map(([k]) => k).join(', ');
    const bigFive = topN(student.big_five_scores, 3);
    const values = topN(student.work_values, 3);
    if (bigFive) lines.push(`Strongest Big Five traits: ${bigFive}.`);
    if (values) lines.push(`Top work values: ${values}.`);
    if (student.knowledge_score != null) lines.push(`Domain knowledge score: ${student.knowledge_score}%.`);
    // Structured signals above + the AI profile-synthesis narrative below (grounded + rich).
    if (context.profileNarrative) lines.push(`Profile synthesis: ${context.profileNarrative}`);
  }

  if (reflections) lines.push(`Reflection: ${reflections}`);
  return lines.filter(Boolean).join('\n');
}

/**
 * RAG retrieval for all grades. Embeds the student query, asks match_occupations_by_embedding
 * for the top-K occupations by semantic similarity, and scores each with the grade-appropriate
 * scorer (college = 5-component, others = 3-component). Interest Fit uses the Holland hexagon —
 * C-Index is not used. Non-fatal: returns [] on any failure (caller then skips clusters).
 */
async function retrieveByEmbedding(
  supabase: any,
  student: StudentProfile,
  context: ClusterNarrativeContext,
  riasecCode: string,
  env: Record<string, string>,
  gradeLevel: GradeLevel
): Promise<ScoredOccupation[]> {
  try {
    const text = buildStudentEmbeddingText(student, context, gradeLevel);
    const queryVec = await callEmbeddingWorker(text, env, EMBEDDING_TASK_TYPES.RETRIEVAL_QUERY);
    const literal = '[' + queryVec.map((x) => x.toFixed(6)).join(',') + ']';

    const { data, error } = await supabase.rpc('match_occupations_by_embedding', {
      query_embedding: literal,
      match_count: CANDIDATE_POOL_SIZE,
    });
    if (error) {
      console.error('[CLUSTER-GEN] match_occupations_by_embedding failed:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return (data as any[]).map((occ, i) => {
      const riasecCodes: string[] = occ.occupation_codes || [];
      const jobRIASEC = riasecCodes[0] || riasecCode;
      const ms = gradeLevel === 'college'
        ? calculateCollegeMatchScore(student, jobRIASEC)
        : calculateMiddleSchoolMatchScore(student, jobRIASEC, gradeLevel);
      const cf = 'cognitiveFit' in ms ? ms.cognitiveFit : ms.capabilityFit;
      const sim = Number(occ.similarity);
      return {
        occupation_id: occ.occupation_id,
        code: occ.occupation_code,
        name: occ.occupation_name,
        riasecCodes,
        score: ms.final,
        domain: 'Unknown',
        semanticScore: !isNaN(sim) ? Math.round(sim * 1000) / 10 : undefined,
        semanticRank: i + 1,
        diagInterestFit: ms.interestFit,
        diagCapabilityFit: cf,
        diagPersonalityFit: ms.personalityFit,
      };
    });
  } catch (e) {
    console.error('[CLUSTER-GEN] RAG retrieval skipped (non-fatal):', e instanceof Error ? e.message : e);
    return [];
  }
}


/**
 * Populate each occupation's `domain` from role_domains -> domains (v2 schema).
 * Mutates the passed array in place. Roles with multiple domains use the first;
 * roles with none stay 'Unknown'. Failures are non-fatal (diversification just
 * falls back to treating everything as one domain).
 */
async function attachDomains(supabase: any, occupations: ScoredOccupation[]): Promise<void> {
  const ids = occupations.map((o) => o.occupation_id);
  if (ids.length === 0) return;

  const { data, error } = await supabase
    .from('role_domains')
    .select('role_id, domains(name)')
    .in('role_id', ids);

  if (error) {
    console.error('[CLUSTER-GEN] attachDomains failed (non-fatal):', error.message);
    return;
  }

  // First domain wins per role.
  const domainByOcc = new Map<string, string>();
  for (const row of data || []) {
    const name = (row as any).domains?.name;
    if (name && !domainByOcc.has((row as any).role_id)) {
      domainByOcc.set((row as any).role_id, name);
    }
  }
  for (const o of occupations) {
    o.domain = domainByOcc.get(o.occupation_id) || 'Unknown';
  }
}

/** Count occupations per domain (for diagnostics). */
function domainCounts(occupations: ScoredOccupation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const o of occupations) counts[o.domain] = (counts[o.domain] || 0) + 1;
  return counts;
}

/**
 * Score-preserving, domain-aware diversification.
 *
 * Greedily fills `limit` slots from the score-sorted pool. At each step it adds a small
 * penalty proportional to how many times a candidate's domain has already been picked,
 * so when scores are close, an under-represented domain wins — but a clearly higher score
 * still beats the penalty (we never discard a meaningfully better occupation just for variety).
 *
 * effectiveScore = score - (domainCount * DOMAIN_PENALTY)
 */
function diversifyByDomain(pool: ScoredOccupation[], limit: number): ScoredOccupation[] {
  // Penalty per prior pick from the same domain (score points). Tuned so a >~6pt score
  // gap always wins, but ties/near-ties favor variety.
  const DOMAIN_PENALTY = 6;

  const remaining = [...pool];
  const selected: ScoredOccupation[] = [];
  const usedByDomain: Record<string, number> = {};

  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestEff = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const o = remaining[i];
      const eff = o.score - (usedByDomain[o.domain] || 0) * DOMAIN_PENALTY;
      // Tiebreak: higher raw score, then higher semantic relevance (RAG). C-Index is not used.
      if (
        eff > bestEff ||
        (eff === bestEff && o.score > remaining[bestIdx].score) ||
        (eff === bestEff && o.score === remaining[bestIdx].score &&
          (o.semanticScore ?? 0) > (remaining[bestIdx].semanticScore ?? 0))
      ) {
        bestEff = eff;
        bestIdx = i;
      }
    }
    const picked = remaining.splice(bestIdx, 1)[0];
    selected.push(picked);
    usedByDomain[picked.domain] = (usedByDomain[picked.domain] || 0) + 1;
  }

  return selected;
}

/**
 * Validate one AI cluster against the candidate list, then compute and inject the
 * code-derived matchScore (simple average) and fit band. Returns null if the cluster
 * references no valid candidate occupations.
 */
function finalizeCluster(
  aiCluster: any,
  scoreById: Map<string, ScoredOccupation>
): Record<string, unknown> | null {
  // Accept occupation ids from the model's grouping, keep only those in the candidate set.
  const requestedIds: string[] = Array.isArray(aiCluster?.occupationIds)
    ? aiCluster.occupationIds
    : [];
  const validOccupations = requestedIds
    .map((id) => scoreById.get(id))
    .filter((o): o is ScoredOccupation => !!o);

  if (validOccupations.length === 0) return null;

  // 4. Cluster matchScore = simple average of assigned occupations' scores (Phase 1).
  const matchScore = Math.round(
    validOccupations.reduce((sum, o) => sum + o.score, 0) / validOccupations.length
  );

  // [DIAG] TEMP — cluster assignment + score math. Remove after validation.
  // Shows which occupations OpenRouter put in this cluster, their individual scores,
  // any requested ids the model invented (dropped), and the computed average.
  const droppedIds = requestedIds.filter((id) => !scoreById.has(id));
  console.log('[CLUSTER-GEN][DIAG] Cluster "' + str(aiCluster?.title) + '":', {
    assignedOccupations: validOccupations.map((o) => ({ name: o.name, score: o.score })),
    scoresUsed: validOccupations.map((o) => o.score),
    computedAverage: matchScore,
    droppedInvalidIds: droppedIds,
  });

  return {
    title: str(aiCluster?.title),
    matchScore,                       // CODE-derived
    fit: fitBandFor(matchScore),      // CODE-derived
    derivation: str(aiCluster?.derivation),
    description: str(aiCluster?.description),
    // Names come from the deterministic candidate list — never from the model.
    examples: validOccupations.map((o) => o.name),
    whatYoullDo: str(aiCluster?.whatYoullDo),
    whyItFits: str(aiCluster?.whyItFits),
    evidence: {
      interest: str(aiCluster?.evidence?.interest),
      aptitude: str(aiCluster?.evidence?.aptitude),
      personality: str(aiCluster?.evidence?.personality),
      values: str(aiCluster?.evidence?.values),
      employability: str(aiCluster?.evidence?.employability),
      adaptiveAptitude: str(aiCluster?.evidence?.adaptiveAptitude),
    },
    roles: {
      entry: arr(aiCluster?.roles?.entry),
      mid: arr(aiCluster?.roles?.mid),
    },
    domains: arr(aiCluster?.domains),
    futureOutlook: str(aiCluster?.futureOutlook),
    occupationIds: validOccupations.map((o) => o.occupation_id), // provenance + Phase 2
  };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

