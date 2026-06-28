/**
 * Career Cluster Generator — Simplified Pipeline
 *
 * Produces the `careerFit.clusters` structure consumed by the report page.
 *
 * Simplified flow:
 * 1. RAG retrieval: semantic search for candidate occupations.
 * 2. Score and rank: top 15 by match score.
 * 3. OpenRouter: group into 3 clusters + narratives.
 * 4. Deterministic rescore: inject computed matchScores and fit bands.
 */

import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../../shared/ai-config';
import type { StudentProfile, GradeLevel } from '../../types';
import { callEmbeddingWorker } from '../../../embedding/services/embeddingWorkerClient';
import { EMBEDDING_TASK_TYPES } from '../../../embedding/config/constants';
import { getClusterPrompt } from '../../prompts';
import type { ClusterNarrativeContext } from '../../types';
import {
  compareBigFiveProfiles,
  compareWorkValues,
  buildAssessmentRagContext,
} from './assessment-context-builder';

// Re-export so existing importers (analysis-*) keep working.
export type { ClusterNarrativeContext } from '../../types';


/**
 * Candidate pool pulled from RAG retrieval.
 * Optimized for cost and quality — 50 candidates provide good coverage while reducing token usage.
 */
const CANDIDATE_POOL_SIZE = 20;

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
  score: number;
  semanticScore?: number;
  riasecAlignment?: number;  // 0-1 scale from RPC (how well occupation RIASEC matches learner)
  description?: string;
  // Win 1: Observable behaviours
  observable_behaviours?: string;
  // Wins 4, 5, 6: Profiles for profile matching
  aptitude_profile?: Record<string, number>;
  big_five_profile?: Record<string, number>;
  work_values_profile?: Record<string, number>;
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
  candidates.slice(0, 50).forEach((occ, i) => {
    console.log(`[RAG-${(i + 1).toString().padStart(2)}] ${occ.name.substring(0, 38).padEnd(38)} | ${(occ.riasecCodes?.join('/') || 'n/a').padEnd(8)} | Sem=${(occ.semanticScore || 0).toFixed(2)} | RIASEC=${(occ.riasecAlignment || 0).toFixed(2)}`);
  });


  // OpenRouter: group + narrative only.
  // Phase 1 LLM receives ALL candidates and uses full learner profile to intelligently select 12-15 best fits
  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[CLUSTER-GEN] OpenRouter API key not configured — skipping');
    return null;
  }

  const { system, user } = getClusterPrompt(gradeLevel, student, candidates, context);

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
    console.log(`[CLUSTER-${i + 1}] ${cluster.title || 'Untitled'} | Roles=${roleCount} | Score=${cluster.matchScore}`);
  });

  const specificOptions = sanitizeSpecificOptions(parsed?.specificOptions || parsed?.careerFit?.specificOptions);
  const overallSummary = typeof parsed?.overallSummary === 'string' && parsed.overallSummary.trim()
    ? parsed.overallSummary.trim()
    : undefined;

  // Extract selected occupationIds from Phase 1 clusters
  const selectedOccupationIds: string[] = [];
  const occupationMap: Record<string, { name: string; riasecCodes: string[] }> = {};
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

  // Build occupationMap from all candidates for Phase 2
  candidates.forEach((occ) => {
    occupationMap[occ.occupation_id] = {
      name: occ.name,
      riasecCodes: occ.riasecCodes,
    };
  });

  // Step 4: Match Score Calculation & Validation
  const totalSelected = selectedOccupationIds.length;
  const isCountValid = totalSelected >= 6 && totalSelected <= 9;
  const eachClusterValid = clusterCounts.every(count => count >= 2 && count <= 3);

  console.log(`[MATCHSCORE] Validation: Total=${totalSelected} (expect 6-9) | Per-cluster=${clusterCounts.join(',')} (expect 2-3 each) | Valid=${isCountValid && eachClusterValid}`);

  if (!isCountValid || !eachClusterValid) {
    console.error(`[MATCHSCORE] ❌ FAILED: Got ${totalSelected} total, clusters [${clusterCounts.join(', ')}]`);
    return null;
  }

  // Step 5: Roles extraction
  console.log(`[ROLES] Processing ${totalSelected} selected roles across ${aiClusters.length} clusters`);

  // Extract roleData from LLM response (embedded in each cluster)

  // Compute cluster scores from LLM-selected occupations using DB occupation assessment profiles.
  const scoreById = new Map(candidates.map((o) => [o.occupation_id, o]));
  const clusterResults = await Promise.all(
    aiClusters.map((c, idx) => finalizeCluster(c, scoreById, student, supabase, idx))
  );
  const clusters = clusterResults.filter((c): c is Record<string, unknown> => c !== null);

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
      learner_riasec_code: riasecCode,
      match_count: CANDIDATE_POOL_SIZE,
    });
    if (error) {
      console.error('[CLUSTER-GEN] match_occupations_by_embedding failed:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    // Build candidates - keep RAG order (no reranking here)
    // Profiles fetched on-demand in finalizeCluster() for actual scoring
    const candidates: ScoredOccupation[] = (data as any[]).map((occ) => {
      const riasecCodes: string[] = occ.occupation_codes || [];
      const sim = Number(occ.similarity);
      const alignment = Number(occ.riasec_alignment);

      return {
        occupation_id: occ.occupation_id,
        code: occ.occupation_code,
        name: occ.occupation_name,
        riasecCodes,
        score: 0,
        semanticScore: !isNaN(sim) ? Math.round(sim * 1000) / 10 : undefined,
        riasecAlignment: !isNaN(alignment) ? Math.round(alignment * 100) : undefined,
        description: occ.description || occ.occupation_description,
      };
    });

    return candidates;
  } catch (e) {
    console.error('[CLUSTER-GEN] RAG retrieval skipped (non-fatal):', e instanceof Error ? e.message : e);
    return [];
  }
}



/**
 * Validate one AI cluster against the candidate list, compute matchScores from LLM roleData
 * demands, and inject the code-derived matchScore and fit band. Returns null if the cluster
 * references no valid candidate occupations.
 */
/**
 * Compute matchScore from learner profile vs occupation assessment profiles (DB-sourced).
 * Uses normalized distance formula: ((5 - abs_difference) / 5.0) * 100 for 1-5 scale,
 * then weights: aptitude (35%), big_five (25%), work_values (40%).
 */
async function finalizeCluster(
  aiCluster: any,
  scoreById: Map<string, ScoredOccupation>,
  student: StudentProfile,
  supabase: any,
  clusterIndex: number = 0
): Promise<Record<string, unknown> | null> {
  // Accept occupation ids from the model's grouping, keep only those in the candidate set.
  const requestedIds: string[] = Array.isArray(aiCluster?.occupationIds)
    ? aiCluster.occupationIds
    : [];

  const validOccupations = requestedIds
    .map((id) => scoreById.get(id))
    .filter((o): o is ScoredOccupation => !!o);

  if (validOccupations.length === 0) {
    console.warn(`[FINALIZE-${clusterIndex + 1}] No valid occupations in candidate set for "${aiCluster?.title}" (requested: ${requestedIds.length})`);
    return null;
  }

  // Fetch occupation assessment profiles from DB for all occupations in this cluster.
  const { data: occupationProfiles, error } = await supabase
    .from('occupations')
    .select('id, code, aptitude_profile, big_five_profile, work_values_profile')
    .in('id', validOccupations.map((o) => o.occupation_id));

  if (error) {
    console.error(`[FINALIZE-${clusterIndex + 1}] Error fetching occupation profiles: ${error.message}`);
    return null;
  }

  // Build a map of occupation_id -> profiles
  const profileMap = new Map(
    (occupationProfiles || []).map((p: any) => [
      p.id,
      {
        aptitude_profile: p.aptitude_profile || {},
        big_five_profile: p.big_five_profile || {},
        work_values_profile: p.work_values_profile || {},
      },
    ])
  );

  // Compute matchScore for each occupation using normalized distance formula (ONLY REAL DATA).
  const occupationScores = validOccupations
    .map((occ, idx) => {
      const profiles = profileMap.get(occ.occupation_id);
      if (!profiles) {
        console.warn(
          `[CLUSTER-GEN] ⚠️ No profiles for occupation ${occ.occupation_id} (${occ.name}), skipping`
        );
        return null; // Skip: no profiles in DB
      }

    // For aptitude: convert accuracy_by_subtag percentages to 1-5 scale
    const learnerAptitude = convertAccuracyToAptitudeProfile(student.accuracy_by_subtag);

    // Compute component scores using ONLY REAL DATA (no neutral padding)
    const scores: { component: string; score: number; weight: number }[] = [];

    // Aptitude (if data exists) - Win 4
    if (Object.keys(learnerAptitude).length > 0 && Object.keys(profiles.aptitude_profile).length > 0) {
      const aptitudeScore = computeAssessmentMatchScore(learnerAptitude, profiles.aptitude_profile);
      scores.push({ component: 'aptitude', score: aptitudeScore, weight: 0.35 });
    }

    // Big Five (if data exists) - Win 5
    if (student.big_five_scores && Object.keys(student.big_five_scores).length > 0 && Object.keys(profiles.big_five_profile).length > 0) {
      // Use the enhanced comparison function
      const bigFiveScore = Math.round(compareBigFiveProfiles(student.big_five_scores, profiles.big_five_profile) || 0);
      if (!isNaN(bigFiveScore) && bigFiveScore > 0) {
        scores.push({ component: 'big_five', score: bigFiveScore, weight: 0.25 });
      }
    }

    // Work Values (if data exists) - Win 6
    if (student.work_values_scores && Object.keys(student.work_values_scores).length > 0 && Object.keys(profiles.work_values_profile).length > 0) {
      // Use the enhanced comparison function
      const workValuesScore = Math.round(compareWorkValues(student.work_values_scores, profiles.work_values_profile) || 0);
      if (!isNaN(workValuesScore) && workValuesScore > 0) {
        scores.push({ component: 'work_values', score: workValuesScore, weight: 0.4 });
      }
    }

    // If no data available, skip this occupation
    if (scores.length === 0) {
      return null; // Will be filtered out below
    }

    // Re-weight available components proportionally
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const matchScore = Math.round(
      scores.reduce((sum, s) => sum + (s.score * (s.weight / totalWeight)), 0)
    );

    // Debug: Log first 3 occupations for transparency
    if (idx < 3) {
      const componentsStr = scores.map((s) => `${s.component}=${s.score}`).join(', ');
      console.log(`[CLUSTER-GEN] ${occ.name}: ${componentsStr} → matchScore=${matchScore}`);
    }

      return matchScore;
    })
    .filter((score): score is number => score !== null); // Only use occupations with real data

  // Cluster matchScore = simple average of all occupation scores.
  let clusterScore = 0;
  if (occupationScores.length > 0) {
    clusterScore = Math.round(occupationScores.reduce((sum, s) => sum + s, 0) / occupationScores.length);
    const sorted = [...occupationScores].sort((a, b) => b - a);
    const scoreRange = `${sorted[sorted.length - 1]}-${sorted[0]}`;
    console.log(`[FINALIZE-${clusterIndex + 1}] "${aiCluster?.title}" avg matchScore: ${clusterScore} (range: ${scoreRange})`);
  }

  return {
    title: str(aiCluster?.title),
    matchScore: clusterScore,
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

/**
 * Convert accuracy_by_subtag (percentage-based) to 1-5 aptitude scale.
 * Formula: score = (accuracy_percent / 100) * 5, clamped to [1, 5]
 */
/**
 * Extract and normalize accuracy_by_subtag to 0-100 scale (same as occupation aptitude_profile).
 * The adaptive_aptitude_results.accuracy_by_subtag is an object with { accuracy: percentage },
 * so we extract the accuracy value. If it's a direct percentage, use it as-is.
 * This ensures learner and occupation aptitude values are on the same 0-100 scale for comparison.
 */
function convertAccuracyToAptitudeProfile(accuracy: Record<string, number | any> | undefined): Record<string, number> {
  if (!accuracy || Object.keys(accuracy).length === 0) {
    return {};
  }

  const profile: Record<string, number> = {};
  for (const [key, value] of Object.entries(accuracy)) {
    let percentValue = 0;

    // Handle two formats:
    // 1. Direct value: { "verbal_reasoning": 86.36 }
    // 2. Object with accuracy field: { "verbal_reasoning": { "accuracy": 86.36 } }
    if (typeof value === 'number' && !isNaN(value)) {
      percentValue = value; // Direct percentage (0-100)
    } else if (typeof value === 'object' && value !== null && 'accuracy' in value) {
      const acc = Number(value.accuracy);
      if (!isNaN(acc)) {
        percentValue = acc; // Extract accuracy from object (0-100)
      }
    }

    // Keep on 0-100 scale (same as occupation aptitude_profile)
    if (percentValue > 0) {
      profile[key] = Math.round(percentValue * 10) / 10; // Round to 1 decimal
    }
  }
  return profile;
}

/**
 * Compute normalized distance match score between learner and occupation profiles.
 * Data is on 0-100 scale: score = 100 - abs(learner - occupation)
 * Result: 0-100 scale score, or null if no matching data.
 *
 * Handles key mismatches by matching similar keys.
 */
function computeAssessmentMatchScore(
  learnerProfile: Record<string, number>,
  occupationProfile: Record<string, number>
): number | null {
  if (Object.keys(learnerProfile).length === 0 || Object.keys(occupationProfile).length === 0) {
    return null; // No data to compute
  }

  const scores: number[] = [];

  // Try direct key matches first
  for (const [key, learnerValue] of Object.entries(learnerProfile)) {
    const occupationValue = occupationProfile[key];
    if (occupationValue !== undefined && !isNaN(learnerValue) && !isNaN(occupationValue)) {
      const absDiff = Math.abs(learnerValue - occupationValue);
      // Data is 0-100 scale: max diff is 100, so score = 100 - absDiff
      const normalizedScore = Math.max(0, 100 - absDiff);
      scores.push(normalizedScore);
    }
  }

  // If no direct matches, try fuzzy key matching (for key name variations)
  if (scores.length === 0) {
    for (const [lKey, learnerValue] of Object.entries(learnerProfile)) {
      for (const [oKey, occupationValue] of Object.entries(occupationProfile)) {
        // Match if keys are similar (same words, different order/format)
        if (similarKeys(lKey, oKey) && !isNaN(learnerValue) && !isNaN(occupationValue)) {
          const absDiff = Math.abs(learnerValue - occupationValue);
          // Data is 0-100 scale: max diff is 100, so score = 100 - absDiff
          const normalizedScore = Math.max(0, 100 - absDiff);
          scores.push(normalizedScore);
        }
      }
    }
  }

  if (scores.length === 0) return null; // No matching dimensions
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Check if two keys are similar (handles variations like "verbal_reasoning" vs "verbalReasoning")
 */
function similarKeys(key1: string, key2: string): boolean {
  const normalize = (k: string) => k.toLowerCase().replace(/[-_]/g, '');
  return normalize(key1) === normalize(key2);
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

