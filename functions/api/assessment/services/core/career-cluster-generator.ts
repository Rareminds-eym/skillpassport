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
import {
  calculateMiddleSchoolMatchScore,
  calculateCollegeMatchScore,
  type StudentProfile,
  type GradeLevel,
} from './scoring-service';
import { callEmbeddingWorker } from '../../../embedding/services/embeddingWorkerClient';
import { EMBEDDING_TASK_TYPES } from '../../../embedding/config/constants';
import { getClusterPrompt } from '../../prompts';
import type { ClusterNarrativeContext } from '../../types';

// Re-export so existing importers (analysis-*) keep working.
export type { ClusterNarrativeContext } from '../../types';


/**
 * Candidate pool pulled from RAG retrieval.
 * Optimized for cost and quality — 50 candidates provide good coverage while reducing token usage.
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
  // Output includes 3-cluster narrative + specificOptions + overallSummary only.
  // MatchScores are computed deterministically from DB occupation assessment profiles, not LLM.
  // Typical completion: ~2-3k tokens. 4000 token limit provides ample headroom.
  maxTokens: 4000,
  temperature: 0.1,
};

/** Dynamic fit band assignment based on cluster rank (no hardcoded thresholds).
 * Highest-scoring cluster = High, lowest = Explore, middle = Medium.
 */
function fitBandByRank(index: number, totalClusters: number): 'High' | 'Medium' | 'Explore' {
  if (index === 0) return 'High';
  if (index === totalClusters - 1) return 'Explore';
  return 'Medium';
}

interface ScoredOccupation {
  occupation_id: string;
  code: string;
  name: string;
  riasecCodes: string[];
  score: number;
  semanticScore?: number;
  description?: string;  // Role description from occupations table
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


  // RAG retrieval: semantic search → get all candidates.
  const candidates = await retrieveByEmbedding(supabase, student, context, riasecCode, env, gradeLevel);

  if (candidates.length === 0) {
    console.warn('[CLUSTER-GEN] No candidates from RAG — skipping');
    return null;
  }

  // LOG RAG OUTPUT
  console.log('\n' + '='.repeat(120));
  console.log('[RAG OUTPUT] Retrieved ' + candidates.length + ' candidates from semantic search');
  console.log('='.repeat(120));
  candidates.forEach((occ, i) => {
    console.log(
      `[RAG] #${(i + 1).toString().padStart(3)} | ${occ.name.padEnd(50)} | RIASEC: ${(occ.riasecCodes.join('/') || 'n/a').padEnd(10)} | Semantic: ${(occ.semanticScore ?? 'n/a').toString().padEnd(8)}`
    );
  });
  console.log('='.repeat(120) + '\n');

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

  const parsed = repairAndParseJSON(raw, true);
  const aiClusters: any[] = parsed?.clusters || parsed?.careerFit?.clusters || [];
  if (!Array.isArray(aiClusters) || aiClusters.length === 0) {
    console.error('[CLUSTER-GEN] OpenRouter returned no clusters');
    return null;
  }

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

  // VALIDATE Phase 1 requirements
  const totalSelected = selectedOccupationIds.length;
  const isCountValid = totalSelected >= 12 && totalSelected <= 15;
  const eachClusterValid = clusterCounts.every(count => count >= 4 && count <= 5);

  console.log('\n' + '='.repeat(120));
  console.log('[CLUSTER-GEN] PHASE 1: Clustering complete. VALIDATION CHECK');
  console.log('='.repeat(120));
  console.log(`[CLUSTER-GEN] Total occupations selected: ${totalSelected} (required: 12-15) → ${isCountValid ? '✅' : '❌'}`);
  console.log(`[CLUSTER-GEN] Cluster sizes: ${clusterCounts.join('/')} (each required: 4-5)`);
  console.log(`[CLUSTER-GEN] Each cluster 4-5? → ${eachClusterValid ? '✅' : '❌'}`);

  if (!isCountValid || !eachClusterValid) {
    console.error('[CLUSTER-GEN] ❌ PHASE 1 VALIDATION FAILED');
    console.error(`[CLUSTER-GEN] Expected: 12-15 total occupations, each cluster 4-5 occupations`);
    console.error(`[CLUSTER-GEN] Got: ${totalSelected} total, clusters [${clusterCounts.join(', ')}]`);
    console.error('[CLUSTER-GEN] LLM did not follow Phase 1 requirements. Skipping career clustering.');
    return null;
  }

  console.log(`[CLUSTER-GEN] ✅ VALIDATION PASSED`);
  console.log(`[CLUSTER-GEN] Selected: ${selectedOccupationIds.map(id => occupationMap[id]?.name).filter(Boolean).join(', ')}`);
  console.log('='.repeat(120) + '\n');

  // Extract roleData from LLM response (embedded in each cluster)
  console.log('[CLUSTER-GEN] Computing matchScores from DB occupation assessment profiles...\n');

  // Compute cluster scores from LLM-selected occupations using DB occupation assessment profiles.
  const scoreById = new Map(candidates.map((o) => [o.occupation_id, o]));
  const clusters = (
    await Promise.all(
      aiClusters.map((c) => finalizeCluster(c, scoreById, student, supabase))
    )
  ).filter((c): c is Record<string, unknown> => c !== null);

  if (clusters.length === 0) {
    console.error('[CLUSTER-GEN] No valid clusters after validation');
    return null;
  }

  // Trust LLM's cluster ordering: it already ordered by fit (Cluster 1=High, 2=Medium, 3=Explore)
  // Assign fit bands from LLM's intentional ordering (no sorting, no hardcoded thresholds)
  const fitBands = ['High', 'Medium', 'Explore'] as const;
  clusters.forEach((cluster, index) => {
    (cluster as any).fit = fitBands[index] || 'Explore';
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
  gradeLevel: GradeLevel,
  aptitudeInsights?: { strengths: string[]; weaknesses: string[]; pattern: string } | null
): string {
  const strengths = (student.strength_scores || [])
    .slice().sort((a, b) => b.average - a.average).slice(0, 6)
    .map((s) => s.dimension).join(', ');
  const prefs = Object.values(student.learning_preferences || {})
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === 'string').join('; ');
  const subtags = context.adaptive?.accuracyBySubtag || {};
  // Only label an aptitude "strongest" if it clears a real floor (>= 50% accuracy).
  // Without this, a low-scoring student's query claimed e.g. "pattern recognition" (12.5%)
  // as a strength, injecting misleading positive signal into the embedding.
  const APTITUDE_FLOOR = 50;
  const strongAptitudes = Object.entries(subtags)
    .map(([k, v]) => [k, typeof v === 'object' && v ? Number(v.accuracy) : Number(v)] as [string, number])
    .filter(([, a]) => !isNaN(a) && a >= APTITUDE_FLOOR).sort((x, y) => y[1] - x[1]).slice(0, 3)
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

  // College/after12/higher grades: add JSON assessment profiles + Big Five, work values for richer semantic embedding.
  const richGrades = ['college', 'after12', 'higher_secondary'];
  if (richGrades.includes(gradeLevel)) {
    if (student.aptitude_scores) {
      lines.push(`aptitude_profile: ${JSON.stringify(student.aptitude_scores)}.`);
    }
    if (student.big_five_scores) {
      lines.push(`big_five_profile: ${JSON.stringify(student.big_five_scores)}.`);
    }
    if (student.work_values) {
      lines.push(`work_values_profile: ${JSON.stringify(student.work_values)}.`);
    }

    const VALUE_FLOOR = 3.5;
    const topAbove = (obj: Record<string, number> | undefined, n: number, floor: number) =>
      Object.entries(obj || {})
        .filter(([, v]) => v >= floor)
        .sort(([, a], [, b]) => b - a)
        .slice(0, n)
        .map(([k]) => k)
        .join(', ');
    const bigFive = topAbove(student.big_five_scores, 3, VALUE_FLOOR);
    const values = topAbove(student.work_values, 3, VALUE_FLOOR);
    if (bigFive) lines.push(`Strongest Big Five traits: ${bigFive}.`);
    if (values) lines.push(`Top work values: ${values}.`);

    // Add domain knowledge with insights (not just percentage)
    if (student.knowledge_score != null) {
      let knowledgeLine = `Domain knowledge score: ${student.knowledge_score}%.`;
      if (context.knowledgeInsights?.strengths?.length) {
        knowledgeLine += ` Strong in: ${context.knowledgeInsights.strengths.join(', ')}.`;
      }
      if (context.knowledgeInsights?.weaknesses?.length) {
        knowledgeLine += ` Weak in: ${context.knowledgeInsights.weaknesses.join(', ')}.`;
      }
      lines.push(knowledgeLine);
    }

    // Add aptitude insights from adaptive test difficulty-based performance
    if (aptitudeInsights?.strengths?.length) {
      lines.push(`Aptitude strengths: ${aptitudeInsights.strengths.join(', ')}.`);
    }
    if (aptitudeInsights?.weaknesses?.length) {
      lines.push(`Aptitude gaps to develop: ${aptitudeInsights.weaknesses.join(', ')}.`);
    }
    if (aptitudeInsights?.pattern) {
      lines.push(`Aptitude pattern: ${aptitudeInsights.pattern}.`);
    }
    // Structured signals above + the AI profile-synthesis narrative below (grounded + rich).
    if (context.profileNarrative) lines.push(`Profile synthesis: ${context.profileNarrative}`);
  }

  if (reflections) lines.push(`Reflection: ${reflections}`);

  // LOG: Show each line of learner context being added to RAG query
  const filteredLines = lines.filter(Boolean);
  console.log('\n' + '='.repeat(120));
  console.log('[RAG QUERY BUILDER] Learner context lines assembled for semantic embedding:');
  console.log('='.repeat(120));
  filteredLines.forEach((line, idx) => {
    const preview = line.length > 100 ? line.substring(0, 100) + '...' : line;
    console.log(`[Line ${idx + 1}/${filteredLines.length}] ${preview}`);
  });
  console.log('='.repeat(120) + '\n');

  return filteredLines.join('\n');
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
    const text = buildStudentEmbeddingText(student, context, gradeLevel, context.aptitudeInsights);
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


    const candidates: ScoredOccupation[] = (data as any[]).map((occ, i) => {
      const riasecCodes: string[] = occ.occupation_codes || [];
      const sim = Number(occ.similarity);
      return {
        occupation_id: occ.occupation_id,
        code: occ.occupation_code,
        name: occ.occupation_name,
        riasecCodes,
        score: 0, // Will be computed by finalizeCluster after LLM clustering
        semanticScore: !isNaN(sim) ? Math.round(sim * 1000) / 10 : undefined,
        description: occ.description || occ.occupation_description,  // From occupations table
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
  supabase: any
): Promise<Record<string, unknown> | null> {
  // Accept occupation ids from the model's grouping, keep only those in the candidate set.
  const requestedIds: string[] = Array.isArray(aiCluster?.occupationIds)
    ? aiCluster.occupationIds
    : [];
  const validOccupations = requestedIds
    .map((id) => scoreById.get(id))
    .filter((o): o is ScoredOccupation => !!o);

  if (validOccupations.length === 0) return null;

  // Fetch occupation assessment profiles from DB for all occupations in this cluster.
  const { data: occupationProfiles, error } = await supabase
    .from('occupations')
    .select('id, code, aptitude_profile, big_five_profile, work_values_profile')
    .in('id', validOccupations.map((o) => o.occupation_id));

  if (error) {
    console.error(`[CLUSTER-GEN] Error fetching occupation profiles: ${error.message}`);
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

    // Aptitude (if data exists)
    if (Object.keys(learnerAptitude).length > 0 && Object.keys(profiles.aptitude_profile).length > 0) {
      const aptitudeScore = computeAssessmentMatchScore(learnerAptitude, profiles.aptitude_profile);
      scores.push({ component: 'aptitude', score: aptitudeScore, weight: 0.35 });
    }

    // Big Five (if data exists)
    if (student.big_five_scores && Object.keys(student.big_five_scores).length > 0 && Object.keys(profiles.big_five_profile).length > 0) {
      const bigFiveScore = computeAssessmentMatchScore(student.big_five_scores, profiles.big_five_profile);
      scores.push({ component: 'big_five', score: bigFiveScore, weight: 0.25 });
    }

    // Work Values (if data exists)
    if (student.work_values && Object.keys(student.work_values).length > 0 && Object.keys(profiles.work_values_profile).length > 0) {
      const workValuesScore = computeAssessmentMatchScore(student.work_values, profiles.work_values_profile);
      scores.push({ component: 'work_values', score: workValuesScore, weight: 0.4 });
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
    console.log(`[CLUSTER-GEN] Cluster "${aiCluster?.title}" avg matchScore: ${clusterScore} (range: ${scoreRange})`);
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
function convertAccuracyToAptitudeProfile(accuracy: Record<string, number> | undefined): Record<string, number> {
  if (!accuracy || Object.keys(accuracy).length === 0) {
    return {};
  }

  const profile: Record<string, number> = {};
  for (const [key, percentValue] of Object.entries(accuracy)) {
    if (typeof percentValue === 'number' && !isNaN(percentValue)) {
      // Convert percentage (0-100) to 1-5 scale
      const scaled = Math.max(1, Math.min(5, (percentValue / 100) * 5));
      profile[key] = Math.round(scaled * 10) / 10; // Round to 1 decimal
    }
  }
  return profile;
}

/**
 * Compute normalized distance match score between learner and occupation profiles.
 * For 1-5 scale: score = ((5 - abs(learner - occupation)) / 5.0) * 100
 * Returns 0-100 scale score, or null if no matching data.
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
      const normalizedScore = ((5 - absDiff) / 5.0) * 100;
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
          const normalizedScore = ((5 - absDiff) / 5.0) * 100;
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

