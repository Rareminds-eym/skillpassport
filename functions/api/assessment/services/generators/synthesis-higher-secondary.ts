/**
 * Higher Secondary Profile-Synthesis Generator (Grades 11-12)
 *
 * Focus: College entrance preparation, career specialization, competitive exam guidance.
 */
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../../shared/ai-config';
import type { StudentProfile } from '../core/scoring-service';
import type { ClusterNarrativeContext } from '../../types';

export interface HigherSecondarySynthesis {
  profileNarrative?: string;
  skillGap?: unknown;
  roadmap?: unknown;
  finalNote?: unknown;
  overallSummary?: string;
}

const SYNTHESIS_CONFIG = {
  models: ['meta-llama/llama-3.3-70b-instruct', 'openai/gpt-4o-mini'],
  maxTokens: 2200,
  temperature: 0.3,
};

export async function generateHigherSecondarySynthesis(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  env: Record<string, string>
): Promise<HigherSecondarySynthesis | null> {
  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[HIGHER-SEC-SYNTH] OpenRouter API key not configured');
    return null;
  }

  try {
    const { system, user } = buildPrompt(student, context);
    const raw = await callOpenRouterWithRetry(apiKeys.openRouter, [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], {
      models: SYNTHESIS_CONFIG.models,
      maxTokens: SYNTHESIS_CONFIG.maxTokens,
      temperature: SYNTHESIS_CONFIG.temperature,
    });

    const parsed = repairAndParseJSON(raw, true) as HigherSecondarySynthesis;
    if (!parsed || typeof parsed !== 'object') {
      console.error('[HIGHER-SEC-SYNTH] Synthesis returned no usable JSON');
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('[HIGHER-SEC-SYNTH] synthesis failed (non-fatal):', e instanceof Error ? e.message : e);
    return null;
  }
}

function buildPrompt(student: StudentProfile, context: ClusterNarrativeContext) {
  const system = `You are a career counselor analyzing a higher secondary student's (Grades 11-12) assessment.

This is THE critical stage for college entrance preparation and career specialization.

Return ONLY valid JSON:
{
  "profileNarrative": "<130-200 words: interests, strengths, aptitude, learning style, and career direction>",
  "skillGap": {
    "currentStrengths": ["<strength>"],
    "priorityA": [{ "skill": "<skill>", "whyNeeded": "<reason>", "howToBuild": "<action>" }],
    "entranceExamFocus": ["<area>"],
    "recommendedPreparation": "<preparation strategy>"
  },
  "roadmap": {
    "collegePreparation": {
      "targetFields": ["<field>"],
      "entranceExams": ["<exam>"],
      "preparationTimeline": "<timeline>",
      "keySubjects": ["<subject>"]
    },
    "skillBuilding": [{ "skill": "<skill>", "activities": ["<activity>"], "priority": "<High|Medium>" }],
    "careerExploration": {
      "activities": ["<activity>"],
      "mentorship": ["<suggestion>"]
    }
  },
  "finalNote": { "advantage": "<advantage>", "criticalFocus": "<focus>", "nextSteps": "<steps>" },
  "overallSummary": "<2-3 sentences (~45-55 words), THIRD PERSON. Sentence 1: grade level, current stream, top interest areas and key strength. Sentence 2: recommended college fields/programs and entrance exams to target. Sentence 3: the ONE most critical skill/preparation area for success. Plain language.>"
}`;

  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => `${k}: ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ')
    : 'n/a';

  const user = `STUDENT SCORES (Higher Secondary - Grades 11-12)

Current stream: ${student.stream || 'Not specified'}
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Top strengths: ${student.strength_scores.slice(0, 5).map(s => `${s.dimension} (${s.average}/5)`).join(', ')}
Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

Analyze and return JSON.`;

  return { system, user };
}
