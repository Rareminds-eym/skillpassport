/**
 * Career Cluster Generator — Simplified Pipeline
 *
 * Produces the `careerFit.clusters` structure consumed by the report page.
 *
 * Flow:
 * 1. RAG retrieval: hybrid (keyword + semantic) search for candidate occupations.
 * 2. OpenRouter: select 6-9, group into 3 clusters + narratives (no scoring).
 * 3. Deterministic scoring: 6-component match scores + fit bands, card reconciliation.
 */

import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../../shared/ai-config';
import type { StudentProfile, GradeLevel } from '../../types';
import { callEmbeddingWorker } from '../../../embedding/services/embeddingWorkerClient';
import { EMBEDDING_TASK_TYPES } from '../../../embedding/config/constants';
import { getClusterPrompt } from '../../prompts';
import type { ClusterNarrativeContext } from '../../types';
import {
  buildAssessmentRagContext,
} from './assessment-context-builder';
import { calculateCollegeMatchScore } from './scoring-service';

// Re-export so existing importers (analysis-*) keep working.
export type { ClusterNarrativeContext } from '../../types';


/**
 * Candidate pool pulled from RAG retrieval.
 * Optimized for cost and quality — 50 candidates provide good coverage while reducing token usage.
 */
const CANDIDATE_POOL_SIZE = 50;

/** OpenRouter configuration. */
const CLUSTER_GENERATION_CONFIG = {
  // gpt-4o-mini primary (matches production): strong instruction-following keeps the cluster
  // narrative + overallSummary concise and rule-compliant; gemini-2.0-flash is a cheap fallback.
  // Low temperature (0.1) for consistent, non-verbose output.
  models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'],
  // Output includes 3-cluster narrative + specificOptions + overallSummary only.
  // MatchScores are computed deterministically from DB occupation assessment profiles, not LLM.
  // Typical completion: ~2-3k tokens. 4000 token limit provides ample headroom.
  maxTokens: 4000,
  temperature: 0.1,
};

interface ScoredOccupation {
  occupation_id: string;
  code: string;
  name: string;
  riasecCodes: string[];
  semanticScore?: number;
  riasecAlignment?: number;
  streamAligned?: boolean;
  description?: string;
  degreeGate?: 'Mandatory' | 'Preferred';
  domainName?: string;
  aptitudeProfile?: Record<string, unknown>;
  bigFiveProfile?: Record<string, unknown>;
  workValuesProfile?: Record<string, unknown>;
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
 * Generate the after12 `careerFit` object — 3-component scoring (RIASEC + strengths +
 * adaptive aptitude). Thin wrapper. Separate from middle school to allow independent
 * evolution if after12 assessment expands to include Big Five/Values/Employability.
 */
export function generateAfter12CareerClusters(
  supabase: any,
  student: StudentProfile,
  env: Record<string, string>,
  context: ClusterNarrativeContext = {}
): Promise<{ clusters: unknown[]; specificOptions?: unknown; overallSummary?: string } | null> {
  return generateCareerClusters(supabase, student, env, context, 'after12');
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


  // Step 1: Context input
  console.log(`[CONTEXT] Stream=${student.stream} | RIASEC=${riasecCode} | Grade=${gradeLevel}`);

  // Step 2: RAG retrieval: semantic search → get all candidates.
  const candidates = await retrieveByEmbedding(supabase, student, context, riasecCode, env, gradeLevel);

  if (candidates.length === 0) {
    console.warn('[RAG] No candidates retrieved');
    return null;
  }

  console.log(`[RAG] Retrieved ${candidates.length} candidates | Top 3: ${candidates.slice(0, 3).map(c => c.name).join(' → ')}`);
  candidates.slice(0, 30).forEach((occ, i) => {
    console.log(`[RAG-${(i + 1).toString().padStart(2)}] ${occ.name.substring(0, 38).padEnd(38)} | ${(occ.riasecCodes?.join('/') || 'n/a').padEnd(8)} | Sem=${(occ.semanticScore || 0).toFixed(2)} | RIASEC=${(occ.riasecAlignment || 0).toFixed(2)}`);
  });

  // Pass top 50 for broader candidate evaluation
  // RAG hybrid score already ranks by relevance, so top 50 are highest-confidence matches
  const llmCandidates = candidates.slice(0, 50);
  console.log(`[LLM-INPUT] Sending ${llmCandidates.length} candidates to LLM (top 50 by RAG score, descriptions stripped)`);

  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[CLUSTER-GEN] OpenRouter API key not configured — skipping');
    return null;
  }

  const { system, user } = getClusterPrompt(gradeLevel, student, llmCandidates, context);

  // DEBUG: Log LLM prompt content
  console.log(`\n[LLM-PROMPT] System message length: ${system.length} chars`);
  console.log(`[LLM-PROMPT] User message length: ${user.length} chars`);
  console.log(`[LLM-PROMPT] System preview (first 300 chars):\n${system.substring(0, 300)}`);
  console.log(`[LLM-PROMPT] User profile section (first 500 chars):\n${user.substring(0, 500)}`);

  // Check if context is included in user prompt
  const hasRIASEC = user.includes('RIASEC code');
  const hasAptitude = user.includes('COGNITIVE CAPABILITIES') || user.includes('Adaptive aptitude');
  const hasKnowledge = user.includes('DOMAIN KNOWLEDGE') || user.includes('knowledge') || user.includes('Strong in');
  const hasPersonality = user.includes('Big Five') || user.includes('personality');
  const hasValues = user.includes('Autonomy') || user.includes('Financial') || user.includes('Work values');
  const hasProfile = user.includes('profile') || user.includes('PROFILE') || user.includes('Program / stream');

  console.log(`[LLM-PROMPT] Context sections included: RIASEC=${hasRIASEC} | Aptitude=${hasAptitude} | Knowledge=${hasKnowledge} | Personality=${hasPersonality} | Values=${hasValues} | Profile=${hasProfile}`);
  console.log(`[LLM-PROMPT] Candidate list included: ${user.includes('CANDIDATE OCCUPATIONS') ? 'YES' : 'NO'} | Count: ${llmCandidates.length}`);

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];

  const raw = await callOpenRouterWithRetry(apiKeys.openRouter, messages, {
    models: CLUSTER_GENERATION_CONFIG.models,
    maxTokens: CLUSTER_GENERATION_CONFIG.maxTokens,
    temperature: CLUSTER_GENERATION_CONFIG.temperature,
  });

  // Step 3: LLM Clustering
  console.log(`[LLM] Starting cluster generation with ${candidates.length} candidates`);
  const parsed = repairAndParseJSON(raw, true);
  const aiClusters: any[] = parsed?.clusters || parsed?.careerFit?.clusters || [];
  if (!Array.isArray(aiClusters) || aiClusters.length === 0) {
    console.error('[LLM] No clusters returned from LLM');
    return null;
  }

  console.log(`[LLM] Generated ${aiClusters.length} clusters`);
  aiClusters.forEach((cluster, i) => {
    const roleCount = cluster.occupationIds?.length || 0;
    console.log(`[CLUSTER-${i + 1}] ${cluster.title || 'Untitled'} | Roles=${roleCount}`);
  });

  const specificOptions = sanitizeSpecificOptions(parsed?.specificOptions || parsed?.careerFit?.specificOptions);
  const overallSummary = typeof parsed?.overallSummary === 'string' && parsed.overallSummary.trim()
    ? parsed.overallSummary.trim()
    : undefined;

  // Extract selected occupationIds from the LLM's clusters
  const selectedOccupationIds: string[] = [];
  const clusterCounts: number[] = [];

  aiClusters.forEach((cluster) => {
    if (Array.isArray(cluster.occupationIds)) {
      clusterCounts.push(cluster.occupationIds.length);
      cluster.occupationIds.forEach((id: string) => {
        if (!selectedOccupationIds.includes(id)) {
          selectedOccupationIds.push(id);
        }
      });
    }
  });

  // Structure validation
  const totalSelected = selectedOccupationIds.length;
  const isCountValid = totalSelected >= 6 && totalSelected <= 9;
  const eachClusterValid = clusterCounts.every(count => count >= 2 && count <= 3);

  console.log(`[MATCHSCORE] Validation: Total=${totalSelected} (expect 6-9) | Per-cluster=${clusterCounts.join(',')} (expect 2-3 each) | Valid=${isCountValid && eachClusterValid}`);

  if (!isCountValid || !eachClusterValid) {
    console.error(`[MATCHSCORE] ❌ FAILED: Got ${totalSelected} total, clusters [${clusterCounts.join(', ')}]`);
    return null;
  }

  console.log(`[ROLES] Processing ${totalSelected} selected roles across ${aiClusters.length} clusters`);

  // Validate each cluster's membership (id/name repair, stream filter) and score deterministically.
  const scoreById = new Map(candidates.map((o) => [o.occupation_id, o]));
  const clusters = aiClusters
    .map((c, idx) => finalizeCluster(c, scoreById, student, idx))
    .filter((c): c is Record<string, unknown> => c !== null);

  if (clusters.length === 0) {
    console.error('[ROLES] No valid clusters after scoring');
    return null;
  }

  // Trust LLM's cluster ordering: it already ordered by fit (Cluster 1=High, 2=Medium, 3=Explore)
  // Assign fit bands from LLM's intentional ordering (no sorting, no hardcoded thresholds)
  const fitBands = ['High', 'Medium', 'Explore'] as const;
  clusters.forEach((cluster, index) => {
    (cluster as any).fit = fitBands[index] || 'Explore';
  });

  // Final summary
  console.log(`[SUMMARY] Final clusters=${clusters.length} | Total roles=${selectedOccupationIds.length}`);
  clusters.forEach((cluster: any, i) => {
    console.log(`[CLUSTER-FINAL-${i + 1}] ${cluster.title} [${cluster.fit}] | Score=${cluster.matchScore?.toFixed(0) || '—'}`);
  });

  // The LLM writes specificOptions separately from occupationIds and regularly contradicts
  // itself (phantom roles with salaries that were never selected/scored). Reconcile: each
  // cluster's scored roles are the source of truth for what appears on the report cards.
  // Pass occupationIds to preserve role identities for backend queries (e.g., capability lookup).
  const reconciledOptions = reconcileSpecificOptions(specificOptions, clusters, scoreById);

  return { clusters, specificOptions: reconciledOptions, overallSummary };
}

/**
 * Force specificOptions groups (highFit/mediumFit/exploreLater) to contain ONLY roles that were
 * actually selected and scored in the corresponding cluster (1→highFit, 2→mediumFit, 3→exploreLater).
 * - LLM entries whose name doesn't match a cluster role are dropped (they were never scored).
 * - Cluster roles missing from the group are backfilled, reusing the group's median salary band
 *   as an approximation so the card still renders a range.
 * - Each role includes its occupationId (role_family_role_id) for backend queries.
 */
function reconcileSpecificOptions(
  specificOptions: Record<string, unknown> | undefined,
  clusters: Record<string, unknown>[],
  scoreById: Map<string, ScoredOccupation>
): Record<string, unknown> | undefined {
  if (!specificOptions) return specificOptions;
  const keys = ['highFit', 'mediumFit', 'exploreLater'] as const;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  // Long-form names ("Applied AI Engineer — Applied Industry AI Solutions") match their short form.
  const namesMatch = (a: string, b: string) => {
    const na = norm(a), nb = norm(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  };

  const result: Record<string, unknown> = { ...specificOptions };
  clusters.forEach((cluster, i) => {
    const key = keys[i];
    if (!key) return;
    const clusterRoles: string[] = Array.isArray((cluster as any).examples) ? (cluster as any).examples : [];
    if (clusterRoles.length === 0) return;
    const llmEntries: Array<{ name: string; salary?: { min: number; max: number } }> =
      Array.isArray((specificOptions as any)[key]) ? (specificOptions as any)[key] : [];

    // Keep only entries that correspond to a scored cluster role
    const kept = llmEntries
      .filter((e) => clusterRoles.some((r) => namesMatch(e.name, r)))
      .map((e) => {
        // Look up occupationId from scoreById using role name
        let occupationId: string | undefined;
        for (const [id, occupation] of scoreById.entries()) {
          if (namesMatch(e.name, occupation.name)) {
            occupationId = id;
            break;
          }
        }
        return { ...e, occupationId };
      });

    const dropped = llmEntries.filter((e) => clusterRoles.some((r) => namesMatch(e.name, r)) === false);
    if (dropped.length > 0) {
      console.log(`[OPTIONS-RECONCILE] ${key}: dropped unscored role(s): ${dropped.map((d) => d.name).join(', ')}`);
    }

    // Median salary band for backfilled roles: prefer kept entries; if nothing was kept,
    // fall back to the dropped entries' bands — the LLM priced those for this same cluster,
    // so they're a reasonable approximation (better than rendering no salary at all).
    const salaries = kept.map((e) => e.salary).filter((s): s is { min: number; max: number } => !!s);
    const droppedSalaries = dropped.map((e) => e.salary).filter((s): s is { min: number; max: number } => !!s);
    const pool = salaries.length ? salaries : droppedSalaries;
    const fallbackSalary = pool.length
      ? pool.sort((a, b) => a.min - b.min)[Math.floor(pool.length / 2)]
      : undefined;

    // Backfill scored cluster roles the LLM left off the card
    const missing = clusterRoles.filter((r) => !kept.some((e) => namesMatch(e.name, r)));
    for (const name of missing) {
      let occupationId: string | undefined;
      for (const [id, occupation] of scoreById.entries()) {
        if (namesMatch(name, occupation.name)) {
          occupationId = id;
          break;
        }
      }
      kept.push(fallbackSalary ? { name, salary: { ...fallbackSalary }, occupationId } : { name, occupationId });
      console.log(`[OPTIONS-RECONCILE] ${key}: backfilled scored role: ${name}`);
    }

    result[key] = kept;
  });
  return result;
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
        return (salary ? { name, salary } : { name }) as Record<string, unknown> | null;
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
 * Build RAG embedding query text from student profile and context.
 * Uses assessment-context-builder as the single source for context generation.
 */
function buildStudentEmbeddingText(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  _gradeLevel: GradeLevel
): string {
  // Single source of truth: assessment-context-builder handles all RAG context
  let ragContext = buildAssessmentRagContext(student, { degreeLevel: student.degreeLevel }, undefined);

  // Add profileNarrative from college.ts synthesis if available (most domain-specific signal)
  if (context.profileNarrative) {
    ragContext += `\n\nAI PROFILE SYNTHESIS (Domain-Grounded):\n${context.profileNarrative}`;
  }

  return ragContext;
}

/**
 * Build the keyword (BM25) query for the hybrid search. Deliberately SHORT and built only from
 * measured data: the program name and the student's proven strong topics. The full profile
 * context is far too long for full-text matching (it is used for the EMBEDDING instead) —
 * passing it as query_text made the keyword arm of the hybrid search match nothing.
 */
function buildKeywordQuery(student: StudentProfile): string {
  const parts: string[] = [];
  if (student.stream) parts.push(student.stream);
  for (const topic of student.knowledge_strengths || []) parts.push(topic);
  return parts.join(' ');
}

/**
 * RAG retrieval for all grades. Embeds the student query, asks hybrid_search_roles
 * for the top-K role contexts by hybrid relevance, and scores each with the grade-appropriate
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
    // STEP 1: Build RAG context text
    const text = buildStudentEmbeddingText(student, context, gradeLevel);
    console.log(`\n[RAG-CONTEXT] Text length: ${text.length} chars`);
    console.log(`[RAG-CONTEXT] Stream: ${student.stream} | RIASEC: ${riasecCode} | Grade: ${gradeLevel}`);

    // STEP 2: Embed the context
    const queryVec = await callEmbeddingWorker(text, env, EMBEDDING_TASK_TYPES.RETRIEVAL_QUERY);
    const literal = '[' + queryVec.map((x) => x.toFixed(6)).join(',') + ']';
    console.log(`[RAG-EMBED] Vector generated: ${queryVec.length} dimensions`);

    // STEP 3: Build keyword query
    const keywordQuery = buildKeywordQuery(student);
    console.log(`[RAG-KEYWORD] Query: "${keywordQuery}"`);

    // STEP 4: Call hybrid_search_roles RPC
    console.log(`[RAG-CALL] Calling hybrid_search_roles(match_count=${CANDIDATE_POOL_SIZE}, alpha=0.6, riasec=${riasecCode})`);
    const { data, error } = await supabase.rpc('hybrid_search_roles', {
      query_text: keywordQuery,
      query_embedding: literal,
      learner_riasec_code: riasecCode,
      match_count: CANDIDATE_POOL_SIZE,
      alpha: 0.6,
    });
    if (error) {
      console.error('[RAG-ERROR] hybrid_search_roles failed:', error.message);
      return [];
    }
    if (!data || data.length === 0) {
      console.warn('[RAG-RESULT] No data returned from hybrid_search_roles');
      return [];
    }

    console.log(`[RAG-RESULT] Retrieved ${data.length} candidates from database`);

    // Build candidates with job demand profiles for proper scoring.
    // occupation_id carries role_family_role_id (the context id mirrored by LTE).
    const candidates: ScoredOccupation[] = (data as any[]).map((occ, idx) => {
      const riasecCodes: string[] = occ.riasec_codes || [];
      const hybridScore = Number(occ.hybrid_score);
      const alignment = Number(occ.riasec_alignment);

      // DEBUG: Log first 5 candidates' raw data
      if (idx < 5) {
        console.log(`[RAG-DATA-${idx + 1}] id=${occ.role_family_role_id} | name=${occ.role_name} | riasec=${riasecCodes.join('/')} | domain=${occ.domain_name} | gate=${occ.degree_gate} | has_aptitude=${!!occ.aptitude_profile} | has_big5=${!!occ.big_five_profile} | has_values=${!!occ.work_values_profile}`);
      }

      return {
        occupation_id: occ.role_family_role_id,
        code: occ.role_code,
        name: occ.role_name,
        riasecCodes,
        semanticScore: !isNaN(hybridScore) ? Math.round(hybridScore * 1000) / 10 : undefined,
        riasecAlignment: !isNaN(alignment) ? Math.round(alignment * 100) : undefined,
        description: occ.description || occ.role_name,
        degreeGate: occ.degree_gate || 'Preferred',
        domainName: occ.domain_name && occ.domain_name !== 'Unclassified' ? occ.domain_name : undefined,
        streamAligned: isStreamAligned(student.stream, occ.direct_degree_mapping),
        // Job demand profiles for accurate fit scoring
        aptitudeProfile: occ.aptitude_profile ? (typeof occ.aptitude_profile === 'string' ? JSON.parse(occ.aptitude_profile) : occ.aptitude_profile) : undefined,
        bigFiveProfile: occ.big_five_profile ? (typeof occ.big_five_profile === 'string' ? JSON.parse(occ.big_five_profile) : occ.big_five_profile) : undefined,
        workValuesProfile: occ.work_values_profile ? (typeof occ.work_values_profile === 'string' ? JSON.parse(occ.work_values_profile) : occ.work_values_profile) : undefined,
      };
    });

    const alignedCount = candidates.filter((c) => c.streamAligned).length;
    const withDomain = candidates.filter((c) => c.domainName).length;
    console.log(`[RAG-SUMMARY] Stream-aligned: ${alignedCount}/${candidates.length} | With domain: ${withDomain}/${candidates.length} | Total passed to LLM: ${candidates.length}\n`);

    return candidates;
  } catch (e) {
    console.error('[RAG-ERROR] RAG retrieval exception:', e instanceof Error ? e.message : e);
    return [];
  }
}

/**
 * True when the learner's degree/stream appears in an occupation's direct_degree_mapping.
 * Matching layers (mappings store acronyms + subject names like "BCA, B.Sc CS, Hospitality, ..."):
 *  1. Full stream name as substring ("psychology", "hospitality")
 *  2. Acronym from significant words ("Bachelor of Computer Applications" → "bca")
 *  3. Individual SIGNIFICANT words as token-prefix matches ("Bachelor of Business Management" →
 *     "business"; "BBA Human Resources" → "bba"; "B.Pharma" → "pharma" matching "Pharmacy").
 *     Generic degree words (bachelor/management/science/...) are excluded so "...Management"
 *     degrees don't falsely match "Event Management" in unrelated mappings.
 */
function isStreamAligned(stream: string | undefined, degreeMapping: string | undefined): boolean {
  if (!stream || !degreeMapping) return false;
  const mapping = degreeMapping.toLowerCase();
  const streamLower = stream.toLowerCase().trim();
  if (!streamLower) return false;

  // 1. Direct substring match on the full stream name
  if (mapping.includes(streamLower)) return true;

  // Words that appear in nearly every degree name or mapping — useless as evidence on their own
  const genericWords = new Set([
    'of', 'in', 'and', 'the', 'for', 'with', 'bachelor', 'bachelors', 'master', 'masters',
    'degree', 'diploma', 'doctorate', 'management', 'science', 'sciences', 'arts', 'studies',
    'general', 'honours', 'honors', 'applications', 'technology',
  ]);
  const words = streamLower.split(/[^a-z]+/).filter((w) => w.length > 0);
  const significantWords = words.filter((w) => w.length >= 3 && !genericWords.has(w));

  const tokensToTry = new Set<string>();
  // 2. Acronym from non-connector words (keeps generic words so BCA/BBA derive correctly)
  const stopWords = new Set(['of', 'in', 'and', 'the', 'for', 'with']);
  const acronymWords = words.filter((w) => !stopWords.has(w));
  if (acronymWords.length >= 2) tokensToTry.add(acronymWords.map((w) => w[0]).join(''));
  // The stream may already be an acronym/id ("BCA", "MBA HR", "bca")
  if (streamLower.length <= 8) tokensToTry.add(streamLower.replace(/[^a-z]/g, ''));
  // 3. Each significant word as its own token
  for (const w of significantWords) tokensToTry.add(w);

  for (const token of tokensToTry) {
    if (token.length < 2) continue;
    // Short tokens (acronyms like "bba", "com") must match as EXACT standalone words —
    // otherwise "com" (B.Com) would prefix-match "Computer". Longer words may prefix-match
    // to catch word families ("pharma" → "Pharmacy", "finance" → "Finance").
    const re = token.length <= 3
      ? new RegExp(`(^|[^a-z])${token}([^a-z]|$)`, 'i')
      : new RegExp(`(^|[^a-z])${token}`, 'i');
    if (re.test(mapping)) return true;
  }
  return false;
}



/**
 * Validate cluster coherence: ensure roles grouped together are actually related by RIASEC,
 * domain, and work type. Rejects clusters where the LLM mixed unrelated domains
 * (e.g., ML Model Developer in Automation cluster).
 *
 * Returns true if cluster passes coherence validation.
 */
function validateClusterCoherence(
  occupations: ScoredOccupation[],
  clusterIndex: number,
  clusterTitle: string
): boolean {
  if (occupations.length < 2) return true; // Single or no occupations always cohere

  // Extract RIASEC primary letters (first char of code)
  const riasecPrimaries = occupations
    .map((o) => (o.riasecCodes?.[0]?.charAt(0) || '').toUpperCase())
    .filter((c) => c.length > 0);

  // Reject if primary RIASEC letters are too diverse
  // Allow 1-2 different primary letters (e.g., I-types can be ICR/IAE), but not 3+
  const uniquePrimaries = new Set(riasecPrimaries);
  if (uniquePrimaries.size > 2) {
    console.warn(
      `[COHERENCE-${clusterIndex + 1}] ❌ REJECTED: Cluster "${clusterTitle}" has roles with ${uniquePrimaries.size} different RIASEC primaries [${[...uniquePrimaries].join(', ')}]`
    );
    return false;
  }

  // Reject if role names suggest fundamentally different work types
  // (e.g., "ML Model Developer" should not be with "Test Automation Engineer")
  const roleNames = occupations.map((o) => o.name.toLowerCase());
  const workTypeKeywords: Record<string, RegExp> = {
    ml_ai: /\b(ml|machine learning|ai|artificial intelligence|deep learning|computer vision|neural|model|training)\b/i,
    automation: /\b(automation|test|qa|quality assurance|selenium|testing)\b/i,
    systems: /\b(system|infrastructure|devops|cloud|kubernetes|docker)\b/i,
    data: /\b(data|analytics|bi|business intelligence|data engineering|data science|sql)\b/i,
    frontend: /\b(frontend|web|react|vue|angular|ui|ux|javascript)\b/i,
    backend: /\b(backend|server|api|database|django|spring|java|python)\b/i,
  };

  const typesPerRole = roleNames.map((name) => {
    const matches = Object.keys(workTypeKeywords).filter((type) =>
      workTypeKeywords[type].test(name)
    );
    return matches.length > 0 ? matches : ['generic'];
  });

  // If any two roles have zero overlap in work type, reject
  for (let i = 0; i < typesPerRole.length; i++) {
    for (let j = i + 1; j < typesPerRole.length; j++) {
      const hasOverlap = typesPerRole[i].some((t) => typesPerRole[j].includes(t));
      if (!hasOverlap && typesPerRole[i][0] !== 'generic' && typesPerRole[j][0] !== 'generic') {
        console.warn(
          `[COHERENCE-${clusterIndex + 1}] ❌ REJECTED: "${roleNames[i]}" (${typesPerRole[i].join(',')}) and "${roleNames[j]}" (${typesPerRole[j].join(',')}) have no work-type overlap`
        );
        return false;
      }
    }
  }

  return true;
}

/**
 * Validate one AI cluster against the candidate list (id/name repair, dedup, stream filter),
 * compute the deterministic 6-component matchScore, and return the cluster payload.
 * Returns null if the cluster references no valid candidate occupations.
 */
function finalizeCluster(
  aiCluster: any,
  scoreById: Map<string, ScoredOccupation>,
  student: StudentProfile,
  clusterIndex: number = 0
): Record<string, unknown> | null {
  // Accept occupation ids from the model's grouping, keep only those in the candidate set.
  const requestedIds: string[] = Array.isArray(aiCluster?.occupationIds)
    ? aiCluster.occupationIds
    : [];
  const requestedNames: string[] = Array.isArray(aiCluster?.occupationNames)
    ? aiCluster.occupationNames
    : [];

  // The LLM sometimes copies the WRONG UUID for the role it means (e.g. names a "Cloud & Edge"
  // cluster with cloud role names but ids of unrelated roles). Names are what the model actually
  // reasons with, so when the id's role contradicts the stated name, trust the NAME and resolve
  // the candidate by name instead.
  const normName = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const rolesNamesMatch = (a: string, b: string) => {
    const na = normName(a), nb = normName(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  };
  const findByName = (name: string): ScoredOccupation | undefined => {
    for (const o of scoreById.values()) if (rolesNamesMatch(o.name, name)) return o;
    return undefined;
  };

  const resolved: ScoredOccupation[] = [];
  requestedIds.forEach((id, i) => {
    const byId = scoreById.get(id);
    const statedName = requestedNames[i];
    if (byId && (!statedName || rolesNamesMatch(byId.name, statedName))) {
      resolved.push(byId);
      return;
    }
    // id missing from candidates, or id's role contradicts the stated name — resolve by name
    if (statedName) {
      const byName = findByName(statedName);
      if (byName) {
        console.log(`[FINALIZE-${clusterIndex + 1}] Repaired id/name mismatch: id resolved to "${byId?.name ?? 'unknown'}" but LLM meant "${statedName}" — using name`);
        resolved.push(byName);
        return;
      }
    }
    if (byId) resolved.push(byId);
  });

  // De-duplicate (repair can map two entries onto the same candidate)
  const seen = new Set<string>();
  let validOccupations = resolved.filter((o) => {
    if (seen.has(o.occupation_id)) return false;
    seen.add(o.occupation_id);
    return true;
  });

  // Code-level stream enforcement for clusters 1-2 only: those tracks are degree-anchored, so a
  // non-stream role the LLM slips in (e.g. a career-services role inside an AI cluster) is
  // removed as long as the cluster keeps the minimum 2 roles. Cluster 3 is the deliberate
  // CROSS-INDUSTRY exposure track — non-stream roles there are by design, so it is exempt.
  if (clusterIndex < 2) {
    const streamOnly = validOccupations.filter((o) => o.streamAligned !== false);
    if (streamOnly.length >= 2 && streamOnly.length < validOccupations.length) {
      const removed = validOccupations.filter((o) => o.streamAligned === false).map((o) => o.name);
      console.log(`[FINALIZE-${clusterIndex + 1}] Removed non-stream role(s) from "${aiCluster?.title}": ${removed.join(', ')}`);
      validOccupations = streamOnly;
    }
  }

  if (validOccupations.length === 0) {
    console.warn(`[FINALIZE-${clusterIndex + 1}] No valid occupations in candidate set for "${aiCluster?.title}" (requested: ${requestedIds.length})`);
    return null;
  }

  // Note: Cluster coherence validation is informational only; all clusters are retained
  // for the learner to explore different career directions (even if unconventional combinations)
  validateClusterCoherence(validOccupations, clusterIndex, aiCluster?.title || '');

  // Compute matchScore using job demand profiles when available, otherwise use base scoring
  const occupationScores = validOccupations
    .map((occ, idx) => {
      try {
        // Get base 5-component score from deterministic formula
        const baseScores = calculateCollegeMatchScore(student, occ.riasecCodes?.[0] || '');
        let finalScore = baseScores.final;

        if (idx === 0) {
          // Debug: Log student profile for first role
          console.log(`[DEBUG-STUDENT] Aptitude by subtag:`, Object.entries(student.accuracy_by_subtag || {}).map(([k, v]) => `${k}=${v}%`).join(', '));
          console.log(`[DEBUG-STUDENT] Big Five:`, Object.entries(student.big_five_scores || {}).map(([k, v]) => `${k}=${(v as number).toFixed(1)}`).join(', '));
          console.log(`[DEBUG-STUDENT] Work Values:`, Object.entries(student.work_values || {}).map(([k, v]) => `${k}=${(v as number).toFixed(1)}`).join(', '));
        }

        // PROPER COMPONENT-BASED SCORING (no penalties, just proper weighting)
        // Calculate each component properly, then apply 6-component formula
        if (occ.aptitudeProfile || occ.bigFiveProfile || occ.workValuesProfile) {
          const numVal = (obj: Record<string, unknown>, key: string): number | undefined => {
            const v = obj[key];
            return typeof v === 'number' ? v : undefined;
          };

          // 1. Interest Fit (already calculated in baseScores) → 0-100
          const interestFit = baseScores.interestFit || 60;

          // 2. Cognitive Fit: Compare student's aptitude strengths vs role's cognitive demands
          let cognitiveFitScore = 50; // neutral default
          if (occ.aptitudeProfile && student.accuracy_by_subtag) {
            let totalScore = 0;
            let demandCount = 0;
            for (const [ability, score] of Object.entries(student.accuracy_by_subtag)) {
              const studentScore = typeof score === 'object' && score !== null
                ? (score as { accuracy?: number }).accuracy
                : (score as number);
              if (typeof studentScore !== 'number') continue;
              const demand = numVal(occ.aptitudeProfile, ability.toLowerCase());
              if (demand !== undefined && demand >= 70) {
                // Role demands this ability: score is weighted by demand importance
                totalScore += studentScore;
                demandCount++;
              }
            }
            if (demandCount > 0) {
              cognitiveFitScore = Math.round(totalScore / demandCount);
            }
          }

          // 3. Stream Aptitude Fit (already in baseScores)
          const streamAptitudeFit = student.stream_aptitude_score || 50;

          // 4. Personality Fit: Big Five alignment with role's personality demands
          let personalityFitScore = 50; // neutral default
          if (occ.bigFiveProfile && student.big_five_scores) {
            let totalScore = 0;
            let matchCount = 0;
            for (const [trait, score] of Object.entries(student.big_five_scores)) {
              const demand = numVal(occ.bigFiveProfile, trait.toLowerCase());
              if (demand !== undefined && demand >= 4) {
                // Role rewards this trait: alignment = how close they match (1-5 scale)
                const alignment = 100 - Math.abs((score as number) - 3) * 25; // Map 1-5 scale to 0-100
                totalScore += alignment;
                matchCount++;
              }
            }
            if (matchCount > 0) {
              personalityFitScore = Math.round(totalScore / matchCount);
            }
          }

          // 5. Knowledge Fit (already in baseScores)
          const knowledgeFit = baseScores.knowledgeFit || 50;

          // 6. Values Fit: Work values alignment with role rewards
          let valuesFitScore = 50; // neutral default
          if (occ.workValuesProfile && student.work_values) {
            const topValues = Object.entries(student.work_values)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 2);
            let totalScore = 0;
            for (const [value, score] of topValues) {
              const demand = numVal(occ.workValuesProfile, value.toLowerCase());
              if (demand !== undefined && demand >= 4) {
                // Role rewards this value: alignment based on overlap
                totalScore += (score as number) / 5 * 100;
              } else {
                totalScore += 30; // Partial alignment if role doesn't reward it
              }
            }
            if (topValues.length > 0) {
              valuesFitScore = Math.round(totalScore / topValues.length);
            }
          }

          // Apply 6-component formula with proper weights
          finalScore = Math.round(
            (interestFit * 0.25) +
            (cognitiveFitScore * 0.20) +
            (streamAptitudeFit * 0.15) +
            (personalityFitScore * 0.18) +
            (knowledgeFit * 0.12) +
            (valuesFitScore * 0.10)
          );
          finalScore = Math.max(0, Math.min(100, finalScore));

          if (idx < 3) {
            console.log(`[CLUSTER-GEN] ${occ.name}: IF=${interestFit} CF=${cognitiveFitScore} SAF=${streamAptitudeFit} PF=${personalityFitScore} KF=${knowledgeFit} VF=${valuesFitScore} → Final=${finalScore}`);
          }
        } else if (idx < 3) {
          console.log(`[CLUSTER-GEN] ${occ.name}: Using base score=${baseScores.final} (no demand profiles)`);
        }

        return finalScore;
      } catch (err) {
        console.warn(`[CLUSTER-GEN] Score calculation failed for ${occ.name}:`, err instanceof Error ? err.message : err);
        return null;
      }
    })
    .filter((score): score is number => score !== null);

  // Cluster matchScore: Computed from occupation scoring algorithm (RIASEC + aptitude + personality + knowledge + values)
  // THRESHOLD: Clamp between 0-100 (no negative, no above 100)
  let clusterScore = 0;
  if (occupationScores.length > 0) {
    const averageScore = occupationScores.reduce((sum, s) => sum + s, 0) / occupationScores.length;
    clusterScore = Math.round(Math.max(0, Math.min(100, averageScore)));
    const sorted = [...occupationScores].sort((a, b) => b - a);
    const scoreRange = `${sorted[sorted.length - 1]}-${sorted[0]}`;
    console.log(`[FINALIZE-${clusterIndex + 1}] "${aiCluster?.title}" matchScore: ${clusterScore} (range: ${scoreRange})`);
  }

  return {
    title: str(aiCluster?.title),
    matchScore: Math.max(0, Math.min(100, clusterScore)), // Ensure 0-100 threshold
    fit: 'Medium', // Placeholder: will be assigned after sorting by rank
    derivation: str(aiCluster?.derivation),
    description: str(aiCluster?.description),
    examples: validOccupations.map((o) => o.name),
    whatYoullDo: str(aiCluster?.whatYoullDo),
    whyItFits: str(aiCluster?.whyItFits),
    evidence: {
      interest: str(aiCluster?.evidence?.interest),
      aptitude: str(aiCluster?.evidence?.aptitude),
      personality: str(aiCluster?.evidence?.personality),
      values: str(aiCluster?.evidence?.values),
    },
    roles: {
      entry: arr(aiCluster?.roles?.entry),
      mid: arr(aiCluster?.roles?.mid),
    },
    domains: arr(aiCluster?.domains),
    futureOutlook: str(aiCluster?.futureOutlook),
    occupationIds: validOccupations.map((o) => o.occupation_id),
  };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

