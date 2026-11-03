export type EvaluationMode = "ai_first" | "human_only";

/**
 * How a school or college's LTE artifacts are evaluated until its administrator
 * chooses otherwise: by an educator, not the AI.
 *
 * This applies to organizations only. A learner who belongs to no school or
 * college has nobody who could review their work, so they are evaluated by the AI
 * (see the review:policy gateway action).
 */
export const DEFAULT_EVALUATION_MODE: EvaluationMode = "human_only";
