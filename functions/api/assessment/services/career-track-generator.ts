/**
 * Career Track Generator Service
 *
 * Generates personalized career exploration tracks for students
 * Flow: Student Profile → Embedding → Semantic Search → Match Scoring → RAG → LLM Narratives
 */

import type {
  StudentAssessmentData,
  CareerFitData,
  OccupationMatch,
  CommonConfig,
  GradeLevelConfig,
} from '../types';
import type { GradeLevel } from './scoring-service';
import { calculateMatchScores } from './scoring-service';
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
import { EMBEDDING_TASK_TYPES } from '../../embedding/config/constants';
import { getCareerSystemPromptByGradeLevel } from '../prompts/career-system-prompts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CAREER_GENERATION_CONFIG: CommonConfig = {
  occupationCount: 30,
  models: ['deepseek/deepseek-r1', 'meta-llama/llama-3.3-70b-instruct'],
  temperature: 0.2,
};

function getCareerTrackConfigByGradeLevel(gradeLevel: GradeLevel): GradeLevelConfig {
  return {
    ...CAREER_GENERATION_CONFIG,
    systemPrompt: getCareerSystemPromptByGradeLevel(gradeLevel),
  };
}

// ============================================================================
// MAIN CAREER TRACK GENERATION
// ============================================================================

export async function generateCareerTracksForStudent(
  supabase: any,
  studentData: StudentAssessmentData,
  env: Record<string, string>
): Promise<CareerFitData> {
  try {
    const gradeLevel = studentData.grade_level as GradeLevel;
    const config = getCareerTrackConfigByGradeLevel(gradeLevel);

    // Step 1: Build student career profile from assessment data
    const studentCareerProfile = buildStudentCareerProfile(studentData);
    console.log('[CareerTrackGenerator] Step 1 - Student profile built:', { profileLength: studentCareerProfile.length });

    // Step 2: Generate embedding for semantic search
    const embedding = await callEmbeddingWorker(studentCareerProfile, env, EMBEDDING_TASK_TYPES.RETRIEVAL_QUERY);

    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to generate student profile embedding');
    }
    console.log('[CareerTrackGenerator] Step 2 - Embedding generated:', { embeddingDimensions: embedding.length });

    // Step 3: Semantic search for matching occupations
    const MATCH_THRESHOLD = 0.55;
    const { data: allOccupations, error: occupationError } = await supabase.rpc('match_occupations', {
      query_embedding: embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: 30,
    });

    if (occupationError) {
      throw new Error(`Semantic search failed: ${occupationError.message}`);
    }

    if (!allOccupations || allOccupations.length === 0) {
      throw new Error('No occupations found matching student profile');
    }

    const occupations = allOccupations.filter((occ: any) => occ.similarity > MATCH_THRESHOLD);
    if (occupations.length === 0) {
      throw new Error('No occupations met similarity threshold');
    }

  // Step 4: Select 3 representative occupation clusters
  const selectedOccupations = selectOccupationClustersForStudent(occupations, 3);

  if (selectedOccupations.length < 3) {
    throw new Error('Not enough occupations found for career clusters');
  }

  // Step 5: Calculate match scores for selected occupations
  const occupationsWithMatchScores = selectedOccupations.map((occupation) => ({
    ...occupation,
    matchScores: calculateMatchScores(
      {
        riasec_scores: studentData.riasec_scores,
        riasec_code: studentData.riasec_code,
        strength_scores: studentData.strength_scores,
        aptitude_overall: studentData.aptitude_overall,
        accuracy_by_subtag: studentData.accuracy_by_subtag,
        learning_preferences: studentData.learning_preferences,
      },
      occupation.primary_riasec,
      gradeLevel
    ),
  }));

  // Step 6: Build RAG context for LLM
  const ragContext = buildCareerClusterRAGContext(studentData, occupationsWithMatchScores);

  // Step 7: Call LLM to generate career narratives
  const { openRouter } = getAPIKeys(env);
  if (!openRouter) {
    throw new Error('OpenRouter API key not configured');
  }

  const llmMessages = [
    { role: 'system', content: config.systemPrompt },
    { role: 'user', content: ragContext },
  ];

  const llmResponseText = await callOpenRouterWithRetry(openRouter, llmMessages, {
    models: config.models,
    maxTokens: 3000,
    temperature: config.temperature,
  });

  // Step 8: Parse and validate LLM response
  const parsedLLMResponse = repairAndParseJSON(llmResponseText, true);
  const careerFitData: CareerFitData = parsedLLMResponse.careerFit || parsedLLMResponse;

  // Step 9: Inject backend-calculated match scores into clusters
  careerFitData.clusters.forEach((cluster, idx) => {
    if (idx < occupationsWithMatchScores.length) {
      cluster.matchScore = occupationsWithMatchScores[idx].matchScores.final;
    }
  });

    // Step 10: Validate final response structure
    console.log('[CareerTrackGenerator] Step 10 - Validating response...');
    const validationErrors = validateCareerClusterResponse(careerFitData);
    if (validationErrors.length > 0) {
      throw new Error(`Career cluster validation failed: ${validationErrors.join(', ')}`);
    }

    console.log('[CareerTrackGenerator] Success - Career tracks generated');
    return careerFitData;
  } catch (error) {
    console.error('[CareerTrackGenerator] Failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildStudentCareerProfile(data: StudentAssessmentData): string {
  const riasecSummary = Object.entries(data.riasec_scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const strengthsSummary = data.strength_scores
    .filter((s) => s.average > 0)
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map((s) => `${s.dimension}: ${s.average.toFixed(1)}/5`)
    .join(', ');

  return `Grade: ${data.grade_level}
RIASEC: ${riasecSummary}
Strengths: ${strengthsSummary}
Aptitude: ${data.aptitude_overall ? (data.aptitude_overall * 100).toFixed(0) + '%' : 'N/A'}`;
}

function selectOccupationClustersForStudent(
  occupations: OccupationMatch[],
  clusterCount: number
): OccupationMatch[] {
  if (occupations.length <= clusterCount) {
    return occupations;
  }

  const selected: OccupationMatch[] = [];
  const step = Math.floor(occupations.length / clusterCount);

  for (let i = 0; i < clusterCount; i++) {
    const idx = Math.min(i * step, occupations.length - 1);
    selected.push(occupations[idx]);
  }

  return selected;
}

function buildCareerClusterRAGContext(
  student: StudentAssessmentData,
  occupations: Array<OccupationMatch & { matchScores: ReturnType<typeof calculateMatchScores> }>
): string {
  const occupationsList = occupations
    .map(
      (o) =>
        `- ${o.title} (${o.primary_riasec}): ${o.description.substring(0, 100)} [Backend Score: ${o.matchScores.final}/100]`
    )
    .join('\n');

  return `STUDENT PROFILE:
${buildStudentCareerProfile(student)}

SELECTED OCCUPATIONS (with pre-calculated match scores):
${occupationsList}

TASK:
For each occupation provided, create a career cluster with:
- title: Career domain
- fit: High/Medium/Explore
- derivation: Why this matches the student
- description: Future career overview
- examples: Exactly 3 future job titles in this domain
- whatYoullDo: Day-to-day activities
- whyItFits: Specific reasons it matches
- evidence: RIASEC, aptitude, personality factors
- roles: Entry and mid-career titles
- domains: Related industries
- futureOutlook: Growth and impact

NOTE: Match scores are ALREADY CALCULATED and embedded in the scores provided above.
Use these scores to rank the clusters appropriately.

For exploration activities:
- highFit: 3 activities for best-matching cluster
- mediumFit: 2 activities for second cluster
- exploreLater: 2 activities for third cluster

Return ONLY valid JSON:
{
  "careerFit": {
    "clusters": [
      {
        "title": "...",
        "matchScore": 0,
        "fit": "High",
        "derivation": "...",
        "description": "...",
        "examples": ["Job 1", "Job 2", "Job 3"],
        "whatYoullDo": "...",
        "whyItFits": "...",
        "evidence": {
          "interest": "...",
          "aptitude": "...",
          "personality": "..."
        },
        "roles": {
          "entry": ["Junior X"],
          "mid": ["Senior X"]
        },
        "domains": ["..."],
        "futureOutlook": "..."
      }
    ],
    "specificOptions": {
      "highFit": [{"name": "Activity", "whyThisRole": "..."}],
      "mediumFit": [{"name": "Activity", "whyThisRole": "..."}],
      "exploreLater": [{"name": "Activity", "whyThisRole": "..."}]
    }
  }
}`;
}

function validateCareerClusterResponse(careerFitData: CareerFitData): string[] {
  const errors: string[] = [];

  if (!careerFitData.clusters || !Array.isArray(careerFitData.clusters) || careerFitData.clusters.length !== 3) {
    errors.push('Must have exactly 3 career clusters');
    return errors;
  }

  careerFitData.clusters.forEach((cluster, i) => {
    if (!cluster.title) errors.push(`Cluster ${i}: Missing title`);
    if (typeof cluster.matchScore !== 'number' || cluster.matchScore < 0 || cluster.matchScore > 100) {
      errors.push(`Cluster ${i}: matchScore must be 0-100, got ${cluster.matchScore}`);
    }
    if (!['High', 'Medium', 'Explore'].includes(cluster.fit)) {
      errors.push(`Cluster ${i}: Invalid fit level (expected High/Medium/Explore)`);
    }
    if (!cluster.evidence) errors.push(`Cluster ${i}: Missing evidence`);
    if (!Array.isArray(cluster.roles?.entry)) errors.push(`Cluster ${i}: Missing roles.entry`);
  });

  if (!careerFitData.specificOptions?.highFit?.length) {
    errors.push('Missing highFit activities');
  }
  if (!careerFitData.specificOptions?.mediumFit?.length) {
    errors.push('Missing mediumFit activities');
  }
  if (!careerFitData.specificOptions?.exploreLater?.length) {
    errors.push('Missing exploreLater activities');
  }

  return errors;
}
