/**
 * High School Profile-Synthesis Generator (Grades 9-10)
 *
 * Generates career exploration guidance and skill development roadmap.
 * Focus: Academic stream selection, early career awareness, foundational skills.
 */
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import type { StudentProfile } from './scoring-service';
import type { ClusterNarrativeContext } from '../types';

export interface HighSchoolSynthesis {
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

export async function generateHighSchoolSynthesis(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  env: Record<string, string>
): Promise<HighSchoolSynthesis | null> {
  const apiKeys = getAPIKeys(env);
  if (!apiKeys.openRouter) {
    console.error('[HIGHSCHOOL-SYNTH] OpenRouter API key not configured — skipping synthesis');
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

    const parsed = repairAndParseJSON(raw, true) as HighSchoolSynthesis;
    if (!parsed || typeof parsed !== 'object') {
      console.error('[HIGHSCHOOL-SYNTH] Synthesis returned no usable JSON');
      return null;
    }
    console.log('[HIGHSCHOOL-SYNTH] synthesis ok:', {
      hasNarrative: !!parsed.profileNarrative,
      hasSkillGap: !!parsed.skillGap,
      hasRoadmap: !!parsed.roadmap,
    });
    return parsed;
  } catch (e) {
    console.error('[HIGHSCHOOL-SYNTH] synthesis failed (non-fatal):', e instanceof Error ? e.message : e);
    return null;
  }
}

function buildPrompt(student: StudentProfile, context: ClusterNarrativeContext) {
  const system = `You are a career counselor analyzing a high school student's (Grades 9-10) assessment.

This is a critical stage for academic stream selection and early career exploration.

Return ONLY valid JSON in this exact shape:
{
  "profileNarrative": "<120-180 words: student's interests (RIASEC), strengths, aptitude areas, learning style — written as a coherent synthesis for career exploration>",
  "skillGap": {
    "currentStrengths": ["<strength>"],
    "priorityA": [{ "skill": "<skill>", "whyNeeded": "<reason>", "howToBuild": "<action>" }],
    "priorityB": [{ "skill": "<skill>" }],
    "recommendedFocus": "<focus area for next 2 years>"
  },
  "roadmap": {
    "academicPath": {
      "suggestedStreams": ["<stream>"],
      "subjectFocus": ["<subject>"],
      "reasoning": "<why these align with their profile>"
    },
    "skillBuilding": [{ "skill": "<skill>", "activities": ["<activity>"], "timeline": "<timeline>" }],
    "exploration": {
      "activities": ["<activity>"],
      "resources": ["<resource>"]
    }
  },
  "finalNote": { "advantage": "<advantage>", "growthFocus": "<focus>", "nextSteps": "<steps>" },
  "overallSummary": "<2-3 sentences (~40-50 words), THIRD PERSON. Sentence 1: their grade level, top 1-2 interest areas, and a key strength. Sentence 2: the most important skill/area to develop for their future path. Sentence 3: recommended academic stream or next exploration step. Plain language — no scores, no RIASEC letters.>"
}

Ground every statement in the scores provided. Be specific and age-appropriate.`;

  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => `${k}: ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ')
    : 'n/a';

  const user = `STUDENT COMPUTED SCORES (High School - Grades 9-10)

RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Top strengths: ${student.strength_scores.slice(0, 5).map(s => `${s.dimension} (${s.average}/5)`).join(', ')}
Learning preferences: ${JSON.stringify(student.learning_preferences || {})}
Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

Analyze this high school student and return the JSON exactly as specified.`;

  return { system, user };
}
