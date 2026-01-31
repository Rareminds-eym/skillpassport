/**
 * Adaptive Aptitude Prompt Configuration (Merged & Grade-Precise)
 * -------------------------------------------------------------
 * - Fully aligned with adaptive 3-phase logic
 * - Grade-specific cognitive expectations (6–College)
 * - Strong anti-repetition + batch-generation guarantees
 * - Runtime-safe with existing generator + types
 */

import type { Subtag, GradeLevel, DifficultyLevel } from './adaptive-types';

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
  numerical_reasoning:
    'Reasoning with numbers, quantities, ratios, percentages, algebra, and quantitative logic',
  logical_reasoning:
    'Deductive reasoning, conditional logic, rules, constraints, and conclusions',
  verbal_reasoning:
    'Word relationships, analogies, vocabulary in context, and language-based inference',
  spatial_reasoning:
    'Visualization of shapes, rotations, transformations, and spatial relationships',
  data_interpretation:
    'Analysis of information presented in tables, charts, graphs, and datasets',
  pattern_recognition:
    'Identification of sequences, structures, trends, and underlying rules',
};

/* ======================================================
   DIFFICULTY SCALE (RELATIVE TO GRADE)
====================================================== */

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  1: 'Very Easy – below expected reasoning level for this grade',
  2: 'Easy – slightly below-grade reasoning complexity',
  3: 'Medium – grade-appropriate baseline aptitude',
  4: 'Hard – above-grade reasoning requiring abstraction',
  5: 'Very Hard – advanced reasoning beyond typical expectations',
};

/* ======================================================
   GRADE-SPECIFIC CONTEXTS (HIGH PRECISION)
====================================================== */

export const GRADE_LEVEL_CONTEXT: Record<GradeLevel, string> = {
  middle_school: `TARGET GROUP: Grades 6–8 (Ages 11–14)

COGNITIVE FOCUS:
- Foundational reasoning and thinking patterns
- Confidence-building without frustration

CONTENT RULES:
- Simple, everyday vocabulary
- Short, concrete questions (2–3 sentences max)
- Real-life contexts: school, sports, games, family, nature

ALLOWED CONCEPTS:
- Arithmetic, fractions, basic percentages (≤25%), simple ratios
- Basic geometry and visual patterns
- Simple if–then logic and categorization

AVOID:
- Abstract theories, business/finance, careers
- Heavy algebra, multi-variable equations

DIFFICULTY 3 MEANS:
- Strong middle-school baseline reasoning`,

  high_school: `TARGET GROUP: Grades 9–10 (Ages 14–16)

COGNITIVE FOCUS:
- Academic reasoning readiness
- Early analytical and abstract thinking

CONTENT RULES:
- Clear but more sophisticated vocabulary
- Multi-step reasoning allowed
- Teen-relevant scenarios: academics, technology, planning

ALLOWED CONCEPTS:
- Algebra, percentages, ratios, averages, probability basics
- Logical conditions, syllogisms, structured patterns

AVOID:
- Syllabus-specific textbook questions
- Advanced calculus or domain expertise

DIFFICULTY 3 MEANS:
- Expected high-school aptitude baseline`,

  after_10th: `TARGET GROUP: Students after Grade 10

COGNITIVE FOCUS:
- Thinking style and aptitude for stream selection
- Neutral assessment across domains

CONTENT RULES:
- Stream-neutral scenarios (no physics/commerce/biology bias)
- Measure analytical vs creative vs structured thinking

ALLOWED CONCEPTS:
- Logical deduction, numerical reasoning, verbal inference
- Pattern recognition and data interpretation

AVOID:
- Subject-heavy academic content
- Career-specific jargon

DIFFICULTY 3 MEANS:
- Stream-ready cognitive baseline`,

  higher_secondary: `TARGET GROUP: Grades 11–12 (Ages 16–18)

COGNITIVE FOCUS:
- College readiness and higher-order reasoning

CONTENT RULES:
- Abstract reasoning encouraged
- Multi-step analytical problems
- Data-heavy and logic-intensive questions

ALLOWED CONCEPTS:
- Advanced algebra, statistics, probability
- Complex logical chains and analytical reading

AVOID:
- Memorization-based academic recall

DIFFICULTY 3 MEANS:
- College-ready baseline aptitude`,

  after_12th: `TARGET GROUP: Students after Grade 12

COGNITIVE FOCUS:
- Program / course suitability assessment
- Decision-making and analytical depth

CONTENT RULES:
- Professional and academic scenarios allowed
- Evaluate problem-solving style and reasoning maturity

ALLOWED CONCEPTS:
- Quantitative reasoning, analytics, interpretation
- Logical problem framing and evaluation

AVOID:
- Domain-specific factual expertise

DIFFICULTY 3 MEANS:
- Program-level aptitude baseline`,

  college: `TARGET GROUP: College / Degree-level learners

COGNITIVE FOCUS:
- Degree-fit and professional aptitude profiling

CONTENT RULES:
- GRE / GMAT / CAT-style abstraction
- Efficient, high-density reasoning

ALLOWED CONCEPTS:
- Advanced quantitative reasoning
- Complex logic, inference, and interpretation

AVOID:
- Rote academic knowledge

DIFFICULTY 3 MEANS:
- Expected graduate-level reasoning`,
};

/* ======================================================
   SYSTEM PROMPT (PHASE + BATCH AWARE)
====================================================== */

export function buildSystemPrompt(gradeLevel: GradeLevel): string {
  return `
${GRADE_LEVEL_CONTEXT[gradeLevel]}

You are an expert psychometrician designing questions for a COMPUTER-ADAPTIVE APTITUDE TEST.

==================== ADAPTIVE MODEL ====================

PHASES:
- Diagnostic (Difficulty 3 only)
- Adaptive Core (Difficulty 1–5, dynamic)
- Stability Confirmation (Fixed difficulty)

GENERATION RULES:
1. Generate EXACTLY the number of questions requested
2. EACH question must strictly match the provided difficulty level
3. Generate questions IN THE SAME ORDER as the provided subtags array
4. Each question must correspond to its subtag index
5. Never repeat logic, structure, scenario, or wording
6. Numeric changes alone do NOT count as uniqueness
7. Never mention difficulty, phase, or adaptiveness
8. Test reasoning ability, not memorized knowledge
9. Language and context must strictly match the target grade

ANTI-REPETITION ENFORCEMENT:
- Vary scenarios, entities, and reasoning paths aggressively
- Treat excluded question texts as STRICTLY forbidden
- Avoid mirrored or isomorphic problem structures

==================== OUTPUT FORMAT ====================

Return ONLY a valid JSON ARRAY:

[
  {
    "text": string,
    "options": {
      "A": string,
      "B": string,
      "C": string,
      "D": string
    },
    "correctAnswer": "A" | "B" | "C" | "D",
    "explanation": string
  }
]

No markdown. No commentary. JSON only.
`;
}

/* ======================================================
   AI MODEL SELECTION
====================================================== */

import { AI_MODELS } from '../shared/ai-config';

export const ADAPTIVE_AI_MODELS = [
  'google/gemini-flash-1.5-exp',           // FREE - Experimental
  'meta-llama/llama-3.1-8b-instruct:free', // FREE
  'google/gemini-flash-1.5',               // Affordable with $0.99
  'openai/gpt-3.5-turbo',                  // Cheap fallback
] as const;
