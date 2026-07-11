/**
 * Middle School Report Generation Service
 *
 * Generates 5 outputs from growth_map data via OpenRouter:
 * 1. capability_insights - Personalized feedback per 8-area capability wheel
 * 2. assessmentReport - Educator-facing narrative (PRD 18.3)
 * 3. mission_recommendations - Structured for future LTE RAG lookup
 * 4. my_interest_worlds - Learner discovery display of explored career/interest worlds (BRD 8.1)
 * 5. character_strengths_descriptions - Learner-friendly descriptions for each character strength
 *
 * Mission recommendations are structured for future LTE mission matching via RAG.
 * Interest worlds show discovered career areas based on evidence (journeys, workshops, artifacts).
 * When LTE missions database is available, recommendations can be matched and ranked.
 *
 * Follows same structure as career-cluster-generator for consistency.
 * Non-fatal: Returns null on failure so analysis completes.
 *
 * Per BRD Section 8.1: Interest & Exposure discovery
 * Per BRD Section 11: Assessment-to-LTE Mapping Logic
 * Per PRD Section 5: Non-comparative, developmental language
 */

import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../../shared/ai-config';
import { buildMiddleSchoolReportPrompt } from '../../prompts/reports';
import type { BuildMiddleSchoolReportPromptInput } from '../../prompts/reports';

/**
 * Capability area insight (for each of 8 areas)
 * Personalized feedback per capability for dashboard display
 */
export interface CapabilityInsight {
  insight: string; // 2 sentences about strength + learning (30-40 words)
  next_step: string; // 1 sentence action they can take (20-25 words)
}

/**
 * Mission recommendation object (structured for future LTE mission RAG lookup)
 * When actual LTE missions exist, these recommendations can be matched to real missions.
 */
export interface MissionRecommendation {
  priority: number;
  mission_name: string;
  capability_target: string; // One of 8 capability wheel areas
  why_recommended: string;
  difficulty: string; // "Beginner", "Intermediate", "Advanced"
  estimated_duration_days: number;
}

/**
 * Interest world for learner discovery display
 * Simplified structure showing only essential information
 * Per BRD Section 8.1: Exposure - "Understand what careers/worlds learner has seen"
 */
export interface MyInterestWorld {
  worldName: string; // Career/interest world (e.g., "Science & Inquiry", "Technology & Making")
  evidenceSummary: string; // Why this is a good fit (15-20 words, learner-friendly)
  status?: string; // Optional: "Explored", "Started Exploring", or "Recommended Next"
}

/**
 * Character strength description for learner-facing display
 * Shows personality strengths and behavioral traits with learner-friendly descriptions and tags
 */
export interface CharacterStrengthDescription {
  label: string; // Strength name (e.g., "Curious", "Creative", "Kind")
  description: string; // Learner-friendly description in first-person (10-15 words)
  tag: string; // Uplifting tag (2-3 words, e.g., "Love Learning", "Idea Maker")
}

/**
 * Explorer world insight for the explorer map left panel
 */
export interface ExplorerWorldInsight {
  worldName: string;
  icon: string;
  whyThisWorld: string;
  evidenceFromGrowth: string;
  whatItMeans: string;
  nextStep: string;
}

/**
 * Thinking style snapshot showing how learner thinks
 */
export interface ThinkingStyle {
  title: string; // "Pattern Recognition", "Problem Solving", "Visual Thinking", "Decision Making"
  description: string; // Learner-friendly description (15-25 words)
  icon: string; // Icon name from Lucide (BrainCircuit, Lightbulb, Sparkles, BarChart3)
}

/**
 * Capability item for "What I Have / What I Need" section (BRD FR-33)
 * Shows learner's strongest and growth areas with evidence
 */
export interface WhatIHaveItem {
  capability_area: string; // One of 8 capability wheel areas
  score_out_of_5: number; // Numeric score (0-5)
}

/**
 * Complete report structure returned by LLM (8 outputs per PRD Section 18 + BRD Section 18.1)
 */
export interface MiddleSchoolReports {
  character_strengths_descriptions: CharacterStrengthDescription[];
  capability_insights: {
    "Self / EQ": CapabilityInsight;
    "Social / SQ": CapabilityInsight;
    "Thinking & Problem Solving": CapabilityInsight;
    "Communication": CapabilityInsight;
    "Digital & AI Literacy": CapabilityInsight;
    "Execution & Independence": CapabilityInsight;
    "Exposure & Career Awareness": CapabilityInsight;
    "Portfolio & Evidence": CapabilityInsight;
  };
  assessmentReport: string;
  mission_recommendations: MissionRecommendation[];
  my_interest_worlds: MyInterestWorld[];
  explorer_insights: {
    exploredWorlds: ExplorerWorldInsight[];
    toExploreWorlds: ExplorerWorldInsight[];
  };
  thinking_styles: ThinkingStyle[];
  what_i_have?: WhatIHaveItem[]; // BRD FR-33: Strengths with evidence
  what_i_need?: WhatIHaveItem[]; // BRD FR-33: Growth areas stated positively
}

const REPORT_GENERATION_CONFIG = {
  models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'],
  // 8 reports incl. explorer insights for up to ~15 worlds — 2500 tokens truncated
  // the JSON mid-array and broke parsing, so give the response ample headroom.
  maxTokens: 8000,
  temperature: 0.1,
};

const REQUIRED_CAPABILITIES = [
  'Self / EQ',
  'Social / SQ',
  'Thinking & Problem Solving',
  'Communication',
  'Digital & AI Literacy',
  'Execution & Independence',
  'Exposure & Career Awareness',
  'Portfolio & Evidence',
] as const;

function isValidCapabilityInsights(insights: any): boolean {
  return (
    insights &&
    typeof insights === 'object' &&
    REQUIRED_CAPABILITIES.every((cap) => {
      const insight = insights[cap];
      return insight && typeof insight.insight === 'string' && typeof insight.next_step === 'string';
    })
  );
}

function isValidCharacterStrengths(strengths: any): boolean {
  return (
    Array.isArray(strengths) &&
    strengths.length > 0 &&
    strengths.every((s) => s.label && typeof s.description === 'string' && typeof s.tag === 'string')
  );
}

function isValidMissions(missions: any): boolean {
  return (
    Array.isArray(missions) &&
    missions.length > 0 &&
    missions.every((m) =>
      m.priority &&
      typeof m.priority === 'number' &&
      m.mission_name &&
      m.capability_target &&
      m.why_recommended &&
      m.difficulty &&
      m.estimated_duration_days
    )
  );
}

function isValidInterestWorlds(worlds: any): boolean {
  return (
    Array.isArray(worlds) &&
    worlds.length > 0 &&
    worlds.every((w) => w.worldName && w.evidenceSummary)
  );
}

function isValidExplorerInsights(insights: any, explorerMap?: any): boolean {
  const validIcons = ['briefcase', 'hammer', 'palette', 'users', 'leaf', 'laptop', 'heart', 'lightbulb'];

  const validateWorld = (w: any) =>
    w.worldName &&
    validIcons.includes(w.icon) &&
    typeof w.whyThisWorld === 'string' &&
    typeof w.evidenceFromGrowth === 'string' &&
    typeof w.whatItMeans === 'string' &&
    typeof w.nextStep === 'string';

  const shapeValid =
    insights &&
    typeof insights === 'object' &&
    Array.isArray(insights.exploredWorlds) &&
    Array.isArray(insights.toExploreWorlds) &&
    insights.exploredWorlds.length > 0 &&
    insights.exploredWorlds.every(validateWorld) &&
    insights.toExploreWorlds.every(validateWorld);

  if (!shapeValid) return false;

  // Coverage check: every world in explorer_map must have an insight (case-insensitive match).
  // Without this, the LLM can silently skip worlds and the left panel loses its details.
  if (explorerMap) {
    const insightNames = new Set(
      [...insights.exploredWorlds, ...insights.toExploreWorlds].map((w: any) =>
        String(w.worldName).trim().toLowerCase()
      )
    );
    const requiredLabels: string[] = [
      ...(explorerMap.explored || []),
      ...(explorerMap.to_explore || []),
    ].map((w: any) => String(w.label).trim().toLowerCase());

    const missing = requiredLabels.filter((label) => !insightNames.has(label));
    if (missing.length > 0) {
      console.error('[REPORT-GEN-MS] explorer_insights missing worlds:', missing.join(', '));
      return false;
    }
  }

  return true;
}

function isValidThinkingStyles(styles: any): boolean {
  const validIcons = ['BrainCircuit', 'Lightbulb', 'Sparkles', 'BarChart3'];

  return (
    Array.isArray(styles) &&
    styles.length === 4 &&
    styles.every(
      (s) =>
        typeof s.title === 'string' &&
        typeof s.description === 'string' &&
        validIcons.includes(s.icon)
    )
  );
}

function isValidWhatIHaveNeed(items: any): boolean {
  return (
    Array.isArray(items) &&
    items.length >= 2 &&
    items.length <= 3 &&
    items.every(
      (item) =>
        typeof item.capability_area === 'string' &&
        typeof item.score_out_of_5 === 'number'
    )
  );
}

export async function generateMiddleSchoolReports(
  growthMap: any,
  learnerName: string,
  learnerGrade: string,
  schoolName: string,
  env: Record<string, string>,
  aptitudeScores?: any
): Promise<MiddleSchoolReports | null> {
  const apiKeys = getAPIKeys(env);

  if (!apiKeys.openRouter) {
    console.error('[REPORT-GEN-MS] OpenRouter API key not configured (non-fatal)');
    return null;
  }

  try {
    console.log('[REPORT-GEN-MS] Generating reports for', learnerName, 'Grade', learnerGrade);

    const promptInput: BuildMiddleSchoolReportPromptInput = {
      growth_map: growthMap,
      learner_name: learnerName,
      learner_grade: learnerGrade,
      school_name: schoolName,
      aptitude_scores: aptitudeScores,
    };

    const { system, user } = buildMiddleSchoolReportPrompt(promptInput);

    // Up to 2 generation attempts: a second try when the LLM output fails
    // validation (e.g. explorer_insights not covering every world).
    const MAX_ATTEMPTS = 2;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const rawResponse = await callOpenRouterWithRetry(
        apiKeys.openRouter,
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        REPORT_GENERATION_CONFIG
      );

      let parsed: MiddleSchoolReports | null = null;
      try {
        parsed = repairAndParseJSON(rawResponse, true) as MiddleSchoolReports;
      } catch (parseError) {
        console.error(
          `[REPORT-GEN-MS] JSON parse failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
          parseError instanceof Error ? parseError.message : parseError
        );
        continue;
      }

      if (!parsed || typeof parsed !== 'object') {
        console.error(`[REPORT-GEN-MS] Invalid JSON response (attempt ${attempt}/${MAX_ATTEMPTS})`);
        continue;
      }

      // Validate all required outputs (8 outputs per BRD FR-33 and PRD Section 18.1)
      const validations = {
        characterStrengths: isValidCharacterStrengths(parsed.character_strengths_descriptions),
        capabilityInsights: isValidCapabilityInsights(parsed.capability_insights),
        assessmentReport: !!parsed.assessmentReport && typeof parsed.assessmentReport === 'string',
        missions: isValidMissions(parsed.mission_recommendations),
        interestWorlds: isValidInterestWorlds(parsed.my_interest_worlds),
        explorerInsights: isValidExplorerInsights(parsed.explorer_insights, growthMap?.explorer_map),
        thinkingStyles: isValidThinkingStyles(parsed.thinking_styles),
        whatIHave: !parsed.what_i_have || isValidWhatIHaveNeed(parsed.what_i_have),
        whatINeed: !parsed.what_i_need || isValidWhatIHaveNeed(parsed.what_i_need),
      };

      const allValid = Object.values(validations).every((v) => v);
      if (!allValid) {
        console.error(`[REPORT-GEN-MS] Validation failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, validations);
        continue;
      }

      console.log('[REPORT-GEN-MS] ✓ Generated:', {
        strengths: parsed.character_strengths_descriptions.length,
        capabilities: Object.keys(parsed.capability_insights).length,
        missions: parsed.mission_recommendations.length,
        worlds: parsed.my_interest_worlds.length,
        exploredWorlds: parsed.explorer_insights.exploredWorlds.length,
        toExploreWorlds: parsed.explorer_insights.toExploreWorlds.length,
        thinkingStyles: parsed.thinking_styles.length,
        whatIHave: parsed.what_i_have?.length || 0,
        whatINeed: parsed.what_i_need?.length || 0,
      });

      return parsed;
    }

    console.error('[REPORT-GEN-MS] All generation attempts failed validation');
    return null;
  } catch (error) {
    console.error('[REPORT-GEN-MS] Generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
