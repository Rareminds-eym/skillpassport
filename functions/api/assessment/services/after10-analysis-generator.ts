/**
 * After 10th Profile-Synthesis Generator
 *
 * Focus: Vocational training, diploma programs, skill-based careers, immediate employment.
 */
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import type { StudentProfile } from './scoring-service';
import type { ClusterNarrativeContext } from '../types';

export interface After10Synthesis {
  profileNarrative?: string;
  skillGap?: unknown;
  roadmap?: unknown;
  finalNote?: unknown;
  overallSummary?: string;
}

const SYNTHESIS_CONFIG = {
  models: ['meta-llama/llama-3.3-70b-instruct', 'openai/gpt-4o-mini'],
  maxTokens: 2000,
  temperature: 0.3,
};

export async function generateAfter10Synthesis(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  env: Record<string, string>
): Promise<After10Synthesis | null> {
  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[AFTER10-SYNTH] OpenRouter API key not configured');
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

    const parsed = repairAndParseJSON(raw, true) as After10Synthesis;
    if (!parsed || typeof parsed !== 'object') {
      console.error('[AFTER10-SYNTH] Synthesis returned no usable JSON');
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('[AFTER10-SYNTH] synthesis failed (non-fatal):', e instanceof Error ? e.message : e);
    return null;
  }
}

function buildPrompt(student: StudentProfile, context: ClusterNarrativeContext) {
  const system = `You are a career counselor analyzing a student who has completed 10th grade and is exploring vocational/skill-based career paths.

Focus on practical, skill-based careers, vocational training, diploma programs, and immediate employment opportunities.

Return ONLY valid JSON:
{
  "profileNarrative": "<120-170 words: interests, practical strengths, aptitude, and suitable vocational directions>",
  "skillGap": {
    "currentStrengths": ["<strength>"],
    "prioritySkills": [{ "skill": "<skill>", "whyNeeded": "<reason>", "howToBuild": "<action>", "timeline": "<timeline>" }],
    "vocationalFocus": "<recommended focus area>"
  },
  "roadmap": {
    "vocationalOptions": {
      "diplomas": ["<diploma program>"],
      "certifications": ["<certification>"],
      "apprenticeships": ["<field>"],
      "reasoning": "<why these fit>"
    },
    "skillDevelopment": [{ "skill": "<skill>", "trainingOptions": ["<option>"], "duration": "<duration>" }],
    "employmentPath": {
      "entryLevelRoles": ["<role>"],
      "industries": ["<industry>"],
      "preparationSteps": ["<step>"]
    }
  },
  "finalNote": { "advantage": "<advantage>", "focusArea": "<focus>", "immediateSteps": "<steps>" },
  "overallSummary": "<2-3 sentences (~40-50 words), THIRD PERSON. Sentence 1: completed 10th, top interest areas and practical strengths. Sentence 2: recommended vocational path or skill-based career direction. Sentence 3: immediate next step (training/certification/apprenticeship). Plain language.>"
}`;

  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => `${k}: ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ')
    : 'n/a';

  const user = `STUDENT SCORES (After 10th - Vocational Path)

RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Top strengths: ${student.strength_scores.slice(0, 5).map(s => `${s.dimension} (${s.average}/5)`).join(', ')}
Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

Analyze and return JSON.`;

  return { system, user };
}
