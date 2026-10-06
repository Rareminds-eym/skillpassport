/**
 * College Profile-Synthesis Generator.
 *
 * One LLM "thinking" pass over the student's deterministic scores → narrative report sections
 * + a profileNarrative reused in the RAG embedding query. Does NOT select occupations, rank,
 * compute scores, or produce clusters (those are deterministic + RAG, generated separately).
 *
 * Fully non-fatal: returns null on any failure so analysis + clusters still complete.
 */
import { callCloudflareWithRetry, getCloudflareConfig, repairAndParseJSON, CLOUDFLARE_MODELS } from '../../../shared/ai-config';
import type { StudentProfile, ClusterNarrativeContext } from '../../types';
import { buildCollegeSynthesisPrompt } from '../../prompts/synthesis/college';

export interface CollegeSynthesis {
  profileNarrative?: string;
  employability?: {
    overallReadiness?: 'High' | 'Medium' | 'Low' | string;
    strengthAreas?: string[];
    improvementAreas?: string[];
    recommendation?: string;
  };
  skillGap?: unknown;
  roadmap?: unknown;
  finalNote?: unknown;
  overallSummary?: string;
}

const SYNTHESIS_CONFIG = {
  models: CLOUDFLARE_MODELS,
  maxTokens: 2500,
  temperature: 0.1,
};

export async function generateCollegeSynthesis(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  env: Record<string, string>
): Promise<CollegeSynthesis | null> {
  const cfConfig = getCloudflareConfig(env);
  if (!cfConfig) {
    console.error('[COLLEGE-SYNTH] Cloudflare AI binding not configured — skipping synthesis');
    return null;
  }

  try {
    const { system, user } = buildCollegeSynthesisPrompt(student, context);
    const raw = await callCloudflareWithRetry(env, [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], {
      models: SYNTHESIS_CONFIG.models,
      maxTokens: SYNTHESIS_CONFIG.maxTokens,
      temperature: SYNTHESIS_CONFIG.temperature,
    });

    const parsed = repairAndParseJSON(raw, true) as CollegeSynthesis;
    if (!parsed || typeof parsed !== 'object') {
      console.error('[COLLEGE-SYNTH] Synthesis returned no usable JSON');
      return null;
    }
    console.log('[COLLEGE-SYNTH] synthesis ok:', {
      hasNarrative: !!parsed.profileNarrative,
      readiness: parsed.employability?.overallReadiness,
      hasSkillGap: !!parsed.skillGap,
      hasRoadmap: !!parsed.roadmap,
    });
    return parsed;
  } catch (e) {
    console.error('[COLLEGE-SYNTH] synthesis failed (non-fatal):', e instanceof Error ? e.message : e);
    return null;
  }
}
