/**
 * Constants for Adaptive Aptitude API
 * Includes live subtags and difficulty descriptions.
 *
 * Removed 2026-09-12 (Phase 5 cleanup): GRADE_LEVEL_CONTEXT,
 * buildSystemPrompt and ADAPTIVE_AI_MODELS were dead pre-bank-era
 * provider code with zero callers tree-wide. bronze bank retrieval
 * (adaptive-bank.ts) uses ALL_SUBTAGS only and never called them.
 * Recorded in ai-worker/docs/migration.md.
 */

import type { Subtag } from './adaptive-types';

/* ======================================================
   SUBTAGS
====================================================== */

export const ALL_SUBTAGS: Subtag[] = [
  'numerical_reasoning',
  'logical_reasoning',
  'verbal_reasoning',
  'spatial_reasoning',
  'data_interpretation',
  'pattern_recognition',
];

export const SUBTAG_DESCRIPTIONS: Record<Subtag, string> = {
  numerical_reasoning: 'Questions involving numbers, calculations, percentages, ratios, and mathematical patterns',
  logical_reasoning: 'Questions testing deductive reasoning, syllogisms, and logical conclusions',
  verbal_reasoning: 'Questions involving word relationships, analogies, and language comprehension',
  spatial_reasoning: 'Questions about shapes, patterns, rotations, and visual-spatial relationships',
  data_interpretation: 'Questions requiring analysis of charts, graphs, tables, and data sets',
  pattern_recognition: 'Questions identifying sequences, patterns, and relationships in data',
};
