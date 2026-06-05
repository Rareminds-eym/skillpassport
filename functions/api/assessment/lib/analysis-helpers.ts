/**
 * Analysis Helper Functions
 * Shared utilities for grade-level specific analysis
 */

import type { RIASECScores, StrengthScore } from '../types';

export function getTopCategories(scores: RIASECScores): string[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key.toUpperCase());
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
