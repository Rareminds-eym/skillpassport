/**
 * Generate Career Tracks Handler
 *
 * Generates personalized career exploration tracks for students
 * Flow: Embedding → Semantic Search → Backend Scoring → RAG → LLM Narratives
 *
 * Match Score Formula: (Interest Fit × 0.40) + (Capability Fit × 0.35) + (Personality Fit × 0.25)
 * Endpoint: POST /api/assessment/generate-tracks
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
import { calculateMatchScores, type GradeLevel } from '../services/scoring-service';
import type {
  CareerEvidence,
  CareerRoles,
  CareerCluster,
  ExplorationOption,
  SpecificOptions,
  CareerFitData,
  CareerFitResponse,
  StudentAssessmentData,
  OccupationMatch,
  CommonConfig,
  GradeLevelConfig,
} from '../types';

const COMMON_CONFIG: CommonConfig = {
  occupationCount: 30,
  models: ['deepseek/deepseek-r1', 'meta-llama/llama-3.3-70b-instruct'],
  temperature: 0.2,
};

const GRADE_LEVEL_SYSTEM_PROMPTS: Record<GradeLevel, string> = {
  middle: buildSystemPromptMiddleSchool(),
  high: buildSystemPromptHighSchool(),
  higher: buildSystemPromptHigherSecondary(),
  after10: buildSystemPromptAfter10(),
  after12: buildSystemPromptAfter12(),
};

function getGradeLevelConfig(gradeLevel: GradeLevel): GradeLevelConfig {
  return {
    ...COMMON_CONFIG,
    systemPrompt: GRADE_LEVEL_SYSTEM_PROMPTS[gradeLevel],
  };
}

export async function generateTracksHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const gradeLevel: GradeLevel = 'middle';
  const config = getGradeLevelConfig(gradeLevel);

  try {
    const body = (await context.request.json()) as { attemptId: string };
    const { attemptId } = body;

    if (!attemptId) {
      return Response.json({ error: 'attemptId required' }, { status: 400 });
    }

    const { data: learnerData } = await supabase
      .from('learners')
      .select('id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (!learnerData?.id) {
      return Response.json({ error: 'Learner not found' }, { status: 404 });
    }

    const learnerId = learnerData.id;

    const { data: result } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (!result) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const studentData: StudentAssessmentData = {
      attempt_id: result.attempt_id,
      learner_id: result.learner_id,
      grade_level: gradeLevel,
      riasec_scores: result.riasec_scores || {},
      riasec_code: result.riasec_code || '',
      strength_scores: result.strength_scores || [],
      aptitude_scores: result.aptitude_scores || undefined,
      aptitude_overall: result.aptitude_overall,
      learning_preferences: result.learning_preferences,
      accuracy_by_subtag:
        result.aptitude_scores && typeof result.aptitude_scores === 'object'
          ? (result.aptitude_scores as any).accuracy_by_subtag
          : undefined,
    };

    if (!studentData.riasec_code || !studentData.strength_scores.length) {
      return Response.json({ error: 'Invalid assessment data' }, { status: 400 });
    }

    const profileText = buildStudentProfile(studentData);
    const embedding = await callEmbeddingWorker(profileText, env, 'student_profile');

    if (!embedding.embedding || embedding.embedding.length === 0) {
      return Response.json({ error: 'Failed to generate embedding' }, { status: 500 });
    }

    const { data: occupations } = await supabase.rpc('match_occupations', {
      query_embedding: embedding.embedding,
      match_threshold: 0.6,
      match_count: config.occupationCount,
    });

    if (!occupations || occupations.length === 0) {
      return Response.json({ error: 'No occupations found' }, { status: 500 });
    }

    const selectedOccupations = selectClusterOccupations(occupations, 3);
    if (selectedOccupations.length < 3) {
      return Response.json({ error: 'Not enough occupations for clusters' }, { status: 500 });
    }

    const matchedOccupationsWithScores = selectedOccupations.map((occ) => ({
      ...occ,
      scores: calculateMatchScores(
        {
          riasec_scores: studentData.riasec_scores,
          riasec_code: studentData.riasec_code,
          strength_scores: studentData.strength_scores,
          aptitude_overall: studentData.aptitude_overall,
          accuracy_by_subtag: studentData.accuracy_by_subtag,
          learning_preferences: studentData.learning_preferences,
        },
        occ.primary_riasec,
        gradeLevel
      ),
    }));

    const ragContext = buildRAGContextWithScores(studentData, matchedOccupationsWithScores);

    const { openRouter } = getAPIKeys(env);
    if (!openRouter) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const messages = [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: ragContext },
    ];

    const responseText = await callOpenRouterWithRetry(openRouter, messages, {
      models: config.models,
      maxTokens: 3000,
      temperature: config.temperature,
    });

    const parsed = repairAndParseJSON(responseText, true);
    const careerFitData: CareerFitData = parsed.careerFit || parsed;

    careerFitData.clusters.forEach((cluster, idx) => {
      if (idx < matchedOccupationsWithScores.length) {
        cluster.matchScore = matchedOccupationsWithScores[idx].scores.final;
      }
    });

    const response: CareerFitResponse = {
      success: true,
      grade_level: gradeLevel,
      careerFit: careerFitData,
      generation_timestamp: new Date().toISOString(),
    };

    const errors = validateCareerFit(response);
    if (errors.length > 0) {
      return Response.json({ error: 'Invalid response structure', details: errors }, { status: 400 });
    }

    const { error: storeError } = await supabase
      .from('personal_assessment_results')
      .update({
        result: response,
        updated_at: new Date().toISOString(),
      })
      .eq('attempt_id', attemptId)
      .eq('learner_id', learnerId);

    if (storeError) {
      return Response.json({ error: 'Failed to store results' }, { status: 500 });
    }

    return Response.json({ success: true, careerFit: response }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: 'Generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function buildStudentProfile(data: StudentAssessmentData): string {
  const riasecSummary = Object.entries(data.riasec_scores)
    .filter(([_, v]) => v > 0)
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

interface OccupationWithScores extends OccupationMatch {
  scores: ReturnType<typeof calculateMatchScores>;
}

function buildRAGContextWithScores(
  student: StudentAssessmentData,
  occupations: OccupationWithScores[]
): string {
  const occupationsList = occupations
    .map((o) =>
      `- ${o.title} (${o.primary_riasec}): ${o.description.substring(0, 100)} [Backend Score: ${o.scores.final}/100]`
    )
    .join('\n');

  return `STUDENT PROFILE:
${buildStudentProfile(student)}

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

function buildSystemPromptMiddleSchool(): string {
  return `You are a career counselor for middle school students creating personalized career exploration narratives.

Your ONLY task is to generate compelling, age-appropriate narratives that explain why certain career domains match the student's profile.

CRITICAL:
- The match scores are ALREADY CALCULATED and will be injected after your response
- Your job is NARRATIVE ONLY: derivation, description, evidence, roles, futureOutlook
- Be specific about THIS student's actual scores
- Focus on FUTURE careers (age 20+), not entry jobs
- For exploration activities: suggest things they can do NOW (learn X, join Y, etc.)
- Return ONLY valid JSON`;
}

function buildSystemPromptHighSchool(): string {
  return `You are a career counselor for high school students creating personalized career exploration narratives.

Your ONLY task is to generate compelling, age-appropriate narratives that explain why certain career domains match the student's profile.

CRITICAL:
- The match scores are ALREADY CALCULATED and will be injected after your response
- Your job is NARRATIVE ONLY: derivation, description, evidence, roles, futureOutlook
- Be specific about THIS student's actual scores
- Focus on FUTURE careers (age 20+), realistic career pathways
- For exploration activities: suggest academic choices, internships, certifications
- Return ONLY valid JSON`;
}

function buildSystemPromptHigherSecondary(): string {
  return `You are a career counselor for higher secondary students creating personalized career exploration narratives.

Your ONLY task is to generate compelling, age-appropriate narratives that explain why certain career domains match the student's profile.

CRITICAL:
- The match scores are ALREADY CALCULATED and will be injected after your response
- Your job is NARRATIVE ONLY: derivation, description, evidence, roles, futureOutlook
- Be specific about THIS student's actual scores
- Focus on FUTURE careers and professional development pathways
- For exploration activities: suggest college majors, specializations, skill development
- Return ONLY valid JSON`;
}

function buildSystemPromptAfter10(): string {
  return `You are a career counselor for post-10th grade students creating personalized career exploration narratives.

Your ONLY task is to generate compelling, age-appropriate narratives that explain why certain career domains match the student's profile.

CRITICAL:
- The match scores are ALREADY CALCULATED and will be injected after your response
- Your job is NARRATIVE ONLY: derivation, description, evidence, roles, futureOutlook
- Be specific about THIS student's actual scores
- Focus on FUTURE careers and vocational pathways
- For exploration activities: suggest courses, certifications, hands-on training opportunities
- Return ONLY valid JSON`;
}

function buildSystemPromptAfter12(): string {
  return `You are a career counselor for post-12th grade students creating personalized career exploration narratives.

Your ONLY task is to generate compelling, age-appropriate narratives that explain why certain career domains match the student's profile.

CRITICAL:
- The match scores are ALREADY CALCULATED and will be injected after your response
- Your job is NARRATIVE ONLY: derivation, description, evidence, roles, futureOutlook
- Be specific about THIS student's actual scores
- Focus on FUTURE careers, professional growth, and specialization paths
- For exploration activities: suggest advanced studies, professional certifications, industry connections
- Return ONLY valid JSON`;
}

function selectClusterOccupations(occupations: OccupationMatch[], count: number): OccupationMatch[] {
  if (occupations.length <= count) return occupations;

  const selected: OccupationMatch[] = [];
  const step = Math.floor(occupations.length / count);

  for (let i = 0; i < count; i++) {
    const idx = Math.min(i * step, occupations.length - 1);
    selected.push(occupations[idx]);
  }

  return selected;
}

function validateCareerFit(response: CareerFitResponse): string[] {
  const errors: string[] = [];
  const cf = response.careerFit;

  if (!cf.clusters || !Array.isArray(cf.clusters) || cf.clusters.length !== 3) {
    errors.push('must have exactly 3 clusters');
    return errors;
  }

  cf.clusters.forEach((cluster, i) => {
    if (!cluster.title) errors.push(`Cluster ${i}: missing title`);
    if (typeof cluster.matchScore !== 'number' || cluster.matchScore < 0 || cluster.matchScore > 100) {
      errors.push(`Cluster ${i}: matchScore must be 0-100, got ${cluster.matchScore}`);
    }
    if (!['High', 'Medium', 'Explore'].includes(cluster.fit)) {
      errors.push(`Cluster ${i}: invalid fit level`);
    }
    if (!cluster.evidence) errors.push(`Cluster ${i}: missing evidence`);
    if (!Array.isArray(cluster.roles?.entry)) errors.push(`Cluster ${i}: missing roles.entry`);
  });

  if (!cf.specificOptions?.highFit?.length) errors.push('missing highFit activities');
  if (!cf.specificOptions?.mediumFit?.length) errors.push('missing mediumFit activities');
  if (!cf.specificOptions?.exploreLater?.length) errors.push('missing exploreLater activities');

  return errors;
}
