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
 * The 3 canonical guidance "kinds" every stage's sections are built from —
 * matches growthStageConfig.ts's GuidanceSectionKind on the frontend. A
 * stage's approved UI title for a kind lives ONLY in the frontend's
 * STAGE_GUIDANCE_SECTIONS registry (app-owned display copy) — Gemini and this
 * validator only ever deal with the kind + generated content, never a title.
 */
export type GuidanceSectionKind = 'parent' | 'teacher' | 'action';

/** Real generated content for one guidance section — no title/subtitle here;
 * those are app-owned and supplied by the frontend registry at render time. */
export interface GuidanceSectionContent {
  desc: string; // 12-18 words, one plain sentence naming the specific identified observation
  highlights: string[]; // 2-3 entries — 3 only when the stage's evidence genuinely supports a 3rd distinct point
}

/**
 * Learner-specific inner section heading + one-sentence description for a
 * Growth Map stage's own display card (e.g. replacing the hardcoded "My
 * Capability Wheel" / "Your growth across 8 core capabilities..." pair).
 * Grounded in the SAME Step-A identified evidence as that stage's guidance
 * sections — never fabricated. Optional: older reports predate this field and
 * the frontend falls back to its existing static copy when absent or invalid.
 */
export interface SectionIntro {
  heading: string; // short UI heading, not a sentence (e.g. "Your Curiosity in Action")
  description: string; // one short sentence for directly below the heading
}

/**
 * One Growth Map stage's guidance entry (v2 schema): Gemini supplies only
 * `sections[kind]` content for whichever kinds THIS stage's app-owned
 * registry actually lists (see STAGE_SECTION_KINDS below) — it never decides
 * which kinds exist, their order, or their titles.
 */
export interface StageGuidanceEntry {
  sectionIntro?: SectionIntro;
  sections: Partial<Record<GuidanceSectionKind, GuidanceSectionContent>>;
}

/** stage_guidance keyed by the 8 Growth Map stage IDs (growthStageConfig.ts StageId). */
export interface StageGuidance {
  version: 2;
  capabilityWheel: StageGuidanceEntry;
  interestWorlds: StageGuidanceEntry;
  characterConstellation: StageGuidanceEntry;
  selfSocial: StageGuidanceEntry;
  explorerMap: StageGuidanceEntry;
  thinkingStyle: StageGuidanceEntry;
  whatIHaveNeed: StageGuidanceEntry;
  missions: StageGuidanceEntry;
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
  stage_guidance: StageGuidance;
}

const REPORT_GENERATION_CONFIG = {
  models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'],
  // 8 reports incl. explorer insights for up to ~15 worlds — 2500 tokens truncated
  // the JSON mid-array and broke parsing, so give the response ample headroom.
  // Kept at 8000 (not raised for the 9th output, stage_guidance) — measured
  // estimate for all 9 outputs combined is ~5600 tokens, comfortably under
  // 8000, so no increase was needed. A live test at 10000 hit OpenRouter's
  // account credit ceiling (402, account could only afford ~9199 at test
  // time) even before stage_guidance content was generated — raising this
  // further trades token headroom for real request failures against a
  // credit balance that fluctuates, which is a worse trade than keeping the
  // existing, already-proven-safe 8000 value.
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

// Must match StageId in src/features/assessment/ui/growth-map/growthStageConfig.ts
const REQUIRED_STAGE_IDS = [
  'capabilityWheel',
  'interestWorlds',
  'characterConstellation',
  'selfSocial',
  'explorerMap',
  'thinkingStyle',
  'whatIHaveNeed',
  'missions',
] as const;

/**
 * App-owned mapping of which guidance section KINDS exist for each stage —
 * must match STAGE_GUIDANCE_SECTIONS in
 * src/features/assessment/ui/growth-map/growthStageConfig.ts (kind list only;
 * titles/subtitles are frontend-only display copy, irrelevant to validation).
 * This is the backend's enforcement that Gemini can only ever populate a
 * section kind that this stage's registry actually lists — an unknown kind,
 * or a kind not listed for this stage, is never accepted into stage_guidance.
 * Verified against the real Bolt reference (TabbedView.tsx sectionGuidance):
 * whatIHaveNeed has only parent+action (no teacher/classroom section), and
 * missions has only teacher (no parent/action section) — every other stage
 * has all 3 kinds.
 */
const STAGE_SECTION_KINDS: Record<(typeof REQUIRED_STAGE_IDS)[number], readonly GuidanceSectionKind[]> = {
  capabilityWheel: ['parent', 'teacher', 'action'],
  interestWorlds: ['parent', 'teacher', 'action'],
  characterConstellation: ['parent', 'teacher', 'action'],
  selfSocial: ['parent', 'teacher', 'action'],
  explorerMap: ['parent', 'teacher', 'action'],
  thinkingStyle: ['parent', 'teacher', 'action'],
  whatIHaveNeed: ['parent', 'action'],
  missions: ['teacher'],
};

/**
 * App-owned required highlight count per stage — verified against the real
 * Bolt reference (TabbedView.tsx sectionGuidance): Stages 1-6 always have
 * exactly 3 highlights per section (parent/teacher/action), while Stage 7
 * (whatIHaveNeed) and Stage 8 (missions) always have exactly 2. This is a
 * fixed per-stage count, not a "2-3, either is fine" range — Gemini must
 * hit the exact number for the stage it's writing, never pad or fall short.
 */
const STAGE_HIGHLIGHT_COUNT: Record<(typeof REQUIRED_STAGE_IDS)[number], number> = {
  capabilityWheel: 3,
  interestWorlds: 3,
  characterConstellation: 3,
  selfSocial: 3,
  explorerMap: 3,
  thinkingStyle: 3,
  whatIHaveNeed: 2,
  missions: 2,
};

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

const REQUIRED_MISSION_COUNT = 3;

function isValidMissions(missions: any): boolean {
  return (
    Array.isArray(missions) &&
    missions.length === REQUIRED_MISSION_COUNT &&
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

// The only 6 legitimate Thinking Style categories — each corresponds exactly
// to a real Adaptive Aptitude accuracy_by_subtag key (see the title-to-subtag
// lookup in analysis-middle-school.ts). Gemini selects 4 of these 6 per
// learner; the app never invents or substitutes a different title.
const LEGITIMATE_THINKING_STYLES = [
  'Pattern Recognition',
  'Spatial Reasoning',
  'Verbal Reasoning',
  'Logical Reasoning',
  'Numerical Reasoning',
  'Data Interpretation',
] as const;

function isValidThinkingStyles(styles: any): boolean {
  const validIcons = ['BrainCircuit', 'Lightbulb', 'Sparkles', 'BarChart3'];

  return (
    Array.isArray(styles) &&
    styles.length === 4 &&
    styles.every(
      (s) =>
        typeof s.title === 'string' &&
        (LEGITIMATE_THINKING_STYLES as readonly string[]).includes(s.title) &&
        typeof s.description === 'string' &&
        validIcons.includes(s.icon)
    ) &&
    new Set(styles.map((s) => s.title)).size === 4
  );
}

/** Validates one section's generated content only (desc + highlights) — no
 * title/subtitle field exists in Gemini's output at all in the v2 schema.
 * `expectedCount` is this stage's fixed required highlight count (see
 * STAGE_HIGHLIGHT_COUNT) — not a range; the array must match it exactly. */
function isValidGuidanceSectionContent(content: any, expectedCount: number): boolean {
  return (
    content &&
    typeof content === 'object' &&
    typeof content.desc === 'string' &&
    content.desc.trim().length > 0 &&
    Array.isArray(content.highlights) &&
    content.highlights.length === expectedCount &&
    content.highlights.every((h: any) => typeof h === 'string' && h.trim().length > 0)
  );
}

/**
 * Defensive length caps for sectionIntro (heading/description), independent
 * of isValidStageGuidance: a stage whose parent/instructional/actionSteps are
 * all valid must still render those even if sectionIntro alone is malformed
 * or excessively long, since the frontend falls back to static copy per
 * stage for this one field rather than losing the whole stage's guidance.
 * Caps are generous (not word-perfect enforcement of the prompt's guidance)
 * so minor LLM variance doesn't discard an otherwise-good heading/description.
 */
const SECTION_INTRO_MAX_HEADING_LENGTH = 60;
const SECTION_INTRO_MAX_DESCRIPTION_LENGTH = 220;

function isValidSectionIntro(intro: unknown): intro is SectionIntro {
  if (!intro || typeof intro !== 'object') return false;
  const i = intro as Record<string, unknown>;
  return (
    typeof i.heading === 'string' &&
    i.heading.trim().length > 0 &&
    i.heading.length <= SECTION_INTRO_MAX_HEADING_LENGTH &&
    typeof i.description === 'string' &&
    i.description.trim().length > 0 &&
    i.description.length <= SECTION_INTRO_MAX_DESCRIPTION_LENGTH
  );
}

/**
 * Validates the v2 stage_guidance shape: for each stage, `sections` must be
 * an object containing valid generated content for EXACTLY the kinds listed
 * in that stage's STAGE_SECTION_KINDS entry (app-owned) — no more, no fewer.
 * A stage returning an extra/unknown kind (one this stage's registry doesn't
 * list) fails validation entirely rather than silently being accepted and
 * possibly rendered — Gemini cannot introduce a section the app doesn't own.
 */
function isValidStageGuidance(guidance: any): boolean {
  if (!guidance || typeof guidance !== 'object') return false;
  if (guidance.version !== 2) return false;

  return REQUIRED_STAGE_IDS.every((stageId) => {
    const entry = guidance[stageId];
    if (!entry || typeof entry !== 'object' || !entry.sections || typeof entry.sections !== 'object') {
      return false;
    }

    const requiredKinds = STAGE_SECTION_KINDS[stageId];
    const returnedKinds = Object.keys(entry.sections);
    const expectedCount = STAGE_HIGHLIGHT_COUNT[stageId];

    // Every kind this stage requires must be present and valid, with EXACTLY
    // this stage's required highlight count — not a 2-3 range.
    const hasAllRequired = requiredKinds.every((kind) =>
      isValidGuidanceSectionContent(entry.sections[kind], expectedCount)
    );
    // No kind outside this stage's approved set may be present at all.
    const hasNoExtraKinds = returnedKinds.every((kind) =>
      (requiredKinds as readonly string[]).includes(kind)
    );

    return hasAllRequired && hasNoExtraKinds;
  });
}

/**
 * sectionIntro is validated and sanitized per-stage AFTER the required
 * stage_guidance shape check passes, dropping only the malformed/oversized
 * entries rather than failing the whole generation — this field is additive
 * UI copy, not part of the REQUIRED stage_guidance contract.
 */
function sanitizeSectionIntros(guidance: unknown): void {
  if (!guidance || typeof guidance !== 'object') return;
  const g = guidance as Record<string, { sectionIntro?: unknown } | undefined>;
  for (const stageId of REQUIRED_STAGE_IDS) {
    const entry = g[stageId];
    if (entry && typeof entry === 'object' && !isValidSectionIntro(entry.sectionIntro)) {
      delete entry.sectionIntro;
    }
  }
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
        stageGuidance: isValidStageGuidance(parsed.stage_guidance),
      };

      const allValid = Object.values(validations).every((v) => v);
      if (!allValid) {
        console.error(`[REPORT-GEN-MS] Validation failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, validations);
        continue;
      }

      // stage_guidance itself is valid (required fields above) — now drop any
      // malformed/oversized sectionIntro per-stage rather than failing the
      // whole generation over this additive field (frontend falls back to
      // static copy for a stage whose sectionIntro was stripped here).
      sanitizeSectionIntros(parsed.stage_guidance);

      console.log('[REPORT-GEN-MS] ✓ Generated:', {
        strengths: parsed.character_strengths_descriptions.length,
        capabilities: Object.keys(parsed.capability_insights).length,
        missions: parsed.mission_recommendations.length,
        worlds: parsed.my_interest_worlds.length,
        exploredWorlds: parsed.explorer_insights.exploredWorlds.length,
        toExploreWorlds: parsed.explorer_insights.toExploreWorlds.length,
        thinkingStyles: parsed.thinking_styles.length,
        stageGuidanceStages: Object.keys(parsed.stage_guidance || {}).length,
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
