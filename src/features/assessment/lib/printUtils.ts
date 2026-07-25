/**
 * Shared Utility Functions
 * Helper functions used across all grade-level PrintView components
 * Requirements: 3.3, 3.4 - Shared utility functions
 */

/**
 * Safely render items that might be objects, strings, null, or undefined
 * Requirements: 3.4 - Safe rendering of potentially null/object values
 *
 * @param item - The item to render
 * @returns A string representation of the item
 */
export const safeRender = (item: any): string => {
  if (item === null || item === undefined) return '';
  if (typeof item === 'object') {
    return item.name || item.title || item.skill || JSON.stringify(item);
  }
  return String(item);
};

/**
 * Safely join array items into a string
 * Requirements: 3.4 - Safe rendering of potentially null/object values
 *
 * @param arr - The array to join
 * @param separator - The separator to use (default: ', ')
 * @returns A joined string representation
 */
export const safeJoin = (arr: any, separator: string = ', '): string => {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.map(safeRender).join(separator);
};

/**
 * Get score style colors based on percentage
 * Requirements: 3.3 - Score color calculations
 *
 * @param pct - The percentage value (0-100)
 * @returns Object with bg, color, and border properties
 */
export const getScoreStyle = (pct: number): { bg: string; color: string; border: string } => {
  if (pct >= 70) return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
  if (pct >= 40) return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
  return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
};

/**
 * Default RIASEC names mapping
 */
export const defaultRiasecNames: Record<string, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

/**
 * Default Big Five trait names mapping
 */
export const defaultTraitNames: Record<string, string> = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  N: 'Neuroticism',
};

/**
 * RIASEC descriptions for each code
 */
export const riasecDescriptions: Record<string, string> = {
  R: 'Measures preference for hands-on, practical activities involving tools, machines, or physical tasks.',
  I: 'Assesses interest in analytical thinking, problem-solving, and understanding ideas or data.',
  A: 'Evaluates inclination toward creative, expressive, and unstructured activities.',
  S: 'Measures preference for helping, teaching, or working with people in supportive roles.',
  E: 'Assesses interest in leadership, persuasion, and goal-oriented business activities.',
  C: 'Evaluates preference for structured tasks involving organization, data, and routine procedures.',
};

/**
 * Get safe learner info with defaults
 *
 * @param learnerInfo - The learner info object
 * @returns Learner info with default values for missing fields
 */
export const getSafelearnerInfo = (learnerInfo: any) => ({
  name: learnerInfo?.name || '—',
  regNo: learnerInfo?.regNo || '—',
  college: learnerInfo?.college || '—',
  stream: learnerInfo?.stream || '—',
  grade: learnerInfo?.grade || '—',
  school: learnerInfo?.school || learnerInfo?.college || '—',
});
