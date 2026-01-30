/**
 * Utility functions for Adaptive Aptitude API
 */

import type { GradeLevel, TestPhase, DifficultyLevel, Subtag, Question } from './adaptive-types';
import { MIDDLE_SCHOOL_FALLBACKS, HIGH_SCHOOL_FALLBACKS } from './adaptive-constants';

export function generateQuestionId(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${gradeLevel}_${phase}_d${difficulty}_${subtag}_${timestamp}_${random}`;
}

export function getFallbackQuestion(
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty: DifficultyLevel,
  subtag: Subtag,
  excludeTexts: Set<string> = new Set()
): Question {
  // Select appropriate fallbacks based on grade level
  // higher_secondary uses high school fallbacks (same difficulty level)
  const fallbacks = gradeLevel === 'middle_school' ? MIDDLE_SCHOOL_FALLBACKS : HIGH_SCHOOL_FALLBACKS;
  const subtagFallbacks = fallbacks[subtag] || fallbacks.numerical_reasoning;

  // Find a fallback that hasn't been used yet
  const availableFallbacks = subtagFallbacks.filter((f) => !excludeTexts.has(f.text));

  let fallback;
  if (availableFallbacks.length > 0) {
    fallback = availableFallbacks[Math.floor(Math.random() * availableFallbacks.length)];
  } else {
    // If all fallbacks for this subtag are used, try other subtags
    const allSubtags = Object.keys(fallbacks) as Subtag[];
    for (const otherSubtag of allSubtags) {
      const otherFallbacks = fallbacks[otherSubtag].filter((f) => !excludeTexts.has(f.text));
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
    text: fallback.text,
    options: fallback.options,
    correctAnswer: fallback.correctAnswer,
    difficulty,
    subtag,
    gradeLevel,
    phase,
    explanation: 'Fallback question',
    createdAt: new Date().toISOString(),
  };
}

export function reorderToPreventConsecutiveSubtags(questions: Question[], maxConsecutive: number): Question[] {
  if (questions.length <= 1) return questions;

  const result: Question[] = [];
  const remaining = [...questions];

  while (remaining.length > 0) {
    let consecutiveCount = 0;
    let lastSubtag: Subtag | null = null;

    for (let i = result.length - 1; i >= 0 && i >= result.length - maxConsecutive; i--) {
      if (lastSubtag === null) {
        lastSubtag = result[i].subtag;
        consecutiveCount = 1;
      } else if (result[i].subtag === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    let selectedIndex = 0;
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const differentIndex = remaining.findIndex((q) => q.subtag !== lastSubtag);
      if (differentIndex !== -1) {
        selectedIndex = differentIndex;
      }
    }

    result.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }

  return result;
}
