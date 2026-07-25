/**
 * Analysis Helper Functions
 * Shared utilities for grade-level specific analysis
 */

import type { RIASECScores, StrengthScore } from '../types';

export function getTopCategories(scores: RIASECScores): string[] {
  // Holland hexagon order (scientific basis for tie-breaking)
  const HOLLAND_HEXAGON = ['E', 'I', 'A', 'S', 'C', 'R'];

  return Object.entries(scores)
    .sort(([keyA, scoreA], [keyB, scoreB]) => {
      if (scoreA !== scoreB) return scoreB - scoreA;
      // Tie-break using Holland hexagon proximity (not arbitrary filtering)
      return HOLLAND_HEXAGON.indexOf(keyA[0].toUpperCase()) -
             HOLLAND_HEXAGON.indexOf(keyB[0].toUpperCase());
    })
    .slice(0, 3)
    .map(([key]) => key[0].toUpperCase());
}

export function getTopStrengths(strengths: StrengthScore[], n: number): StrengthScore[] {
  return strengths.sort((a, b) => b.average - a.average).slice(0, n);
}

export function getTopScores(
  scores: Record<string, number>,
  n: number
): Array<{ dimension: string; score: number }> {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([dimension, score]) => ({ dimension, score }));
}
