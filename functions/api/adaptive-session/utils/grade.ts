/**
 * Grade Utility Functions
 * Shared helpers for extracting and normalizing student grade values.
 */

/**
 * Extracts the numeric grade from a grade string like 'Grade 6', '7th', '12', etc.
 */
export function extractNumericGrade(grade: string | null | undefined): string | null {
  if (!grade) return null;
  const match = String(grade).match(/(\d+)/);
  return match ? match[1] : null;
}
