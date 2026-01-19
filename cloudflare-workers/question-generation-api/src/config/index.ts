/**
 * Configuration Constants
 */

import type { Subtag } from '../types';

// =============================================================================
// API MODELS
// =============================================================================

// AI Models to try in order of preference (same as Assessment Evaluation/Analysis)
export const FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',  // Google's Gemini 2.0 - free, fast, 1M context
  'google/gemini-flash-1.5-8b',        // Gemini 1.5 Flash 8B - fast and efficient
  'anthropic/claude-3.5-sonnet',       // Claude 3.5 Sonnet - best quality (paid)
  'xiaomi/mimo-v2-flash:free'          // Fallback: Xiaomi's free model
];

export const OPENROUTER_MODEL = 'google/gemini-2.0-flash-exp:free';
export const CLAUDE_MODEL = 'claude-3-haiku-20240307';

// =============================================================================
// ADAPTIVE TEST CONFIG (21 questions total: 6 + 11 + 4)
// =============================================================================

export const ALL_SUBTAGS: Subtag[] = [
  'numerical_reasoning',
  'logical_reasoning',
  'verbal_reasoning',
  'spatial_reasoning',
  'data_interpretation',
  'pattern_recognition',
];

// Phase 1: Diagnostic Screener - 6 questions at Level 3 (baseline)
export const DIAGNOSTIC_QUESTION_COUNT = 6;

// Phase 2: Adaptive Core - 11 truly adaptive questions
export const ADAPTIVE_MIN_QUESTIONS = 11;
export const ADAPTIVE_MAX_QUESTIONS = 11;

// Phase 3: Stability Confirmation - 4 questions to confirm aptitude level
export const STABILITY_MIN_QUESTIONS = 4;
export const STABILITY_MAX_QUESTIONS = 4;

// =============================================================================
// CAREER ASSESSMENT CONFIG
// =============================================================================

export const APTITUDE_TOTAL_QUESTIONS = 50;
export const KNOWLEDGE_TOTAL_QUESTIONS = 20;
export const COURSE_DEFAULT_QUESTIONS = 15;

// =============================================================================
// DIFFICULTY DESCRIPTIONS
// =============================================================================

export const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: 'Very Easy - Basic concepts, straightforward questions, minimal steps required',
  2: 'Easy - Simple concepts with slight complexity, 1-2 steps to solve',
  3: 'Medium - Moderate complexity, requires careful thinking, 2-3 steps',
  4: 'Hard - Complex reasoning required, multiple steps, some tricky elements',
  5: 'Very Hard - Advanced concepts, multi-step reasoning, requires deep analysis',
};

// =============================================================================
// SUBTAG DESCRIPTIONS
// =============================================================================

export const SUBTAG_DESCRIPTIONS: Record<Subtag, string> = {
  numerical_reasoning: 'Questions involving numbers, calculations, percentages, ratios, and mathematical patterns',
  logical_reasoning: 'Questions testing deductive reasoning, syllogisms, and logical conclusions',
  verbal_reasoning: 'Questions involving word relationships, analogies, and language comprehension',
  spatial_reasoning: 'Questions about shapes, patterns, rotations, and visual-spatial relationships',
  data_interpretation: 'Questions requiring analysis of charts, graphs, tables, and data sets',
  pattern_recognition: 'Questions identifying sequences, patterns, and relationships in data',
};
