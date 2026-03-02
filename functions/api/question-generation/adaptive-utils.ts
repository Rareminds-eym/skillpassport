/**
 * Utility functions for Adaptive Aptitude API
 */

import type { GradeLevel, TestPhase, DifficultyLevel, Subtag, Question } from './adaptive-types';

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
