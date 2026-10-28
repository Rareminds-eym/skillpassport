// Bump preprocessing whenever learner text selection, normalization, ordering,
// truncation or embedding request preprocessing changes. A model name alone is
// not a complete vector identity.
export const RECOMMENDATION_PREPROCESSING_VERSION = 'learner-text-1';

// Bump for ranking weights, thresholds, candidate selection or V2/V1 fallback
// policy changes, including deployed SQL changes. Keep this deployment contract
// aligned with the installed rankers before enabling personalization.
export const RECOMMENDATION_RANKING_POLICY_VERSION =
  'semantic-ranking-4-jobs-only';
