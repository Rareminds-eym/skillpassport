/**
 * After 12th Profile-Synthesis Generator
 *
 * Focus: College selection, career entry, gap year planning, immediate employment vs further education.
 */
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import type { StudentProfile } from './scoring-service';
import type { ClusterNarrativeContext } from '../types';

export interface After12Synthesis {
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

export async function generateAfter12Synthesis(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  env: Record<string, string>
): Promise<After12Synthesis | null> {
  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[AFTER12-SYNTH] OpenRouter API key not configured');
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

    const parsed = repairAndParseJSON(raw, true) as After12Synthesis;
    if (!parsed || typeof parsed !== 'object') {
      console.error('[AFTER12-SYNTH] Synthesis returned no usable JSON');
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('[AFTER12-SYNTH] synthesis failed (non-fatal):', e instanceof Error ? e.message : e);
    return null;
  }
}

function buildPrompt(student: StudentProfile, context: ClusterNarrativeContext) {
  const system = `You are a career counselor analyzing a student who has completed 12th grade and is at a critical decision point.

Focus on college selection, career entry options, skill development, and the choice between further education vs immediate employment.

Return ONLY valid JSON:
{
  "profileNarrative": "<130-200 words: interests, strengths, aptitude, 12th stream background, and career readiness>",
  "skillGap": {
    "currentStrengths": ["<strength>"],
    "prioritySkills": [{ "skill": "<skill>", "whyNeeded": "<reason>", "howToBuild": "<action>" }],
    "careerReadiness": "<assessment of readiness for work vs further study>"
  },
  "roadmap": {
    "higherEducation": {
      "recommendedPrograms": ["<program>"],
      "colleges": ["<type of college>"],
      "entranceExams": ["<exam>"],
      "reasoning": "<why these fit>"
    },
    "alternativePaths": {
      "certifications": ["<certification>"],
      "skillPrograms": ["<program>"],
      "internships": ["<field>"]
    },
    "immediateEmployment": {
      "suitableRoles": ["<role>"],
      "industries": ["<industry>"],
      "preparationNeeded": ["<preparation>"]
    },
    "recommendedPath": "<education|employment|hybrid> with reasoning"
  },
  "finalNote": { "advantage": "<advantage>", "criticalDecision": "<decision>", "nextSteps": "<steps>" },
  "overallSummary": "<2-3 sentences (~45-55 words), THIRD PERSON. Sentence 1: completed 12th in <stream>, top interest areas and key strengths. Sentence 2: recommended path (college program OR career entry OR hybrid) with reasoning. Sentence 3: immediate next step. Plain language.>"
}`;

  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => `${k}: ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ')
    : 'n/a';

  const user = `STUDENT SCORES (After 12th - Career Decision Point)

12th stream: ${student.stream || 'Not specified'}
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Top strengths: ${student.strength_scores.slice(0, 5).map(s => `${s.dimension} (${s.average}/5)`).join(', ')}
Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

Analyze and return JSON.`;

  return { system, user };
}
