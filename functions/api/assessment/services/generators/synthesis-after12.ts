/**
 * After 12th Profile-Synthesis Generator
 *
 * Focus: College selection, career entry, gap year planning, immediate employment vs further education.
 */
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../../shared/ai-config';
import type { StudentProfile } from '../core/scoring-service';
import type { ClusterNarrativeContext } from '../../types';
import { buildAfter12SynthesisPrompt } from '../../prompts/synthesis/after12';

export interface After12Synthesis {
  profileNarrative?: string;
  skillGap?: unknown;
  roadmap?: unknown;
  finalNote?: unknown;
  overallSummary?: string;
}

const SYNTHESIS_CONFIG = {
  models: ['openai/gpt-4o-mini', 'meta-llama/llama-3.3-70b-instruct'],
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
    const { system, user } = buildAfter12SynthesisPrompt(student, context);
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
