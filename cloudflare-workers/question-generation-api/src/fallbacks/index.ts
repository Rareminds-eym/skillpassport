/**
 * Fallback Questions barrel export and utilities
 */

import { MIDDLE_SCHOOL_FALLBACKS } from './middleSchool';
import { HIGH_SCHOOL_FALLBACKS } from './highSchool';
import { generateQuestionId } from '../utils/uuid';
import type { AdaptiveQuestion, DifficultyLevel, Subtag, TestPhase } from '../types';

export { MIDDLE_SCHOOL_FALLBACKS, HIGH_SCHOOL_FALLBACKS };

type GradeLevel = 'middle_school' | 'high_school';

type FallbackQuestion = {
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
};

/**
 * Get a fallback question when AI generation fails
 */
export function getFallbackQuestion(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  excludeTexts: Set<string> = new Set()
): AdaptiveQuestion {
  const fallbacks = gradeLevel === 'middle_school' ? MIDDLE_SCHOOL_FALLBACKS : HIGH_SCHOOL_FALLBACKS;
  const subtagFallbacks = fallbacks[subtag] || fallbacks.numerical_reasoning;
  
  // Find a fallback that hasn't been used yet
  const availableFallbacks = subtagFallbacks.filter((f: FallbackQuestion) => !excludeTexts.has(f.text));
  
  let fallback: FallbackQuestion | undefined;
  if (availableFallbacks.length > 0) {
    fallback = availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)];
  } else {
    // If all fallbacks for this subtag are used, try other subtags
    const allSubtags = Object.keys(fallbacks) as Subtag[];
    for (const otherSubtag of allSubtags) {
      const otherFallbacks = fallbacks[otherSubtag].filter((f: FallbackQuestion) => !excludeTexts.has(f.text));
      if (otherFallbacks.length > 0) {
        fallback = otherFallbacks[Math.floor(Math.random() * otherFallbacks.length)];
        break;
      }
    }
    // Last resort: use any fallback even if duplicate
    if (!fallback) {
      fallback = subtagFallbacks[Math.floor(Math.random() * subtagFallbacks.length)];
    }
  }

  return {
    id: generateQuestionId(gradeLevel, phase, difficulty, subtag),
    text: fallback!.text,
    options: fallback!.options,
    correctAnswer: fallback!.correctAnswer,
    difficulty,
    subtag,
    gradeLevel,
    phase,
    explanation: 'Fallback question',
    createdAt: new Date().toISOString(),
  };
}
