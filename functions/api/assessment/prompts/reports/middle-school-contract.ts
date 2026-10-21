/** Shared generation/validation contract. UI section titles remain app-owned. */
export const MIDDLE_SCHOOL_CAPABILITIES = [
  'Self / EQ', 'Social / SQ', 'Thinking & Problem Solving', 'Communication',
  'Digital & AI Literacy', 'Execution & Independence', 'Exposure & Career Awareness', 'Portfolio & Evidence',
] as const;

export const MIDDLE_SCHOOL_STAGE_CONTRACT = {
  capabilityWheel: { kinds: ['parent', 'teacher', 'action'], highlights: 3, evidence: 'growth_map.capability_wheel' },
  interestWorlds: { kinds: ['parent', 'teacher', 'action'], highlights: 3, evidence: 'growth_map.interest_worlds' },
  characterConstellation: { kinds: ['parent', 'teacher', 'action'], highlights: 3, evidence: 'growth_map.character_strengths' },
  selfSocial: { kinds: ['parent', 'teacher', 'action'], highlights: 3, evidence: 'growth_map.self_social' },
  explorerMap: { kinds: ['parent', 'teacher', 'action'], highlights: 3, evidence: 'growth_map.explorer_map' },
  thinkingStyle: { kinds: ['parent', 'teacher', 'action'], highlights: 3, evidence: 'aptitude_scores; use Thinking & Problem Solving only as non-test context if aptitude evidence is absent' },
  whatIHaveNeed: { kinds: ['parent', 'action'], highlights: 2, evidence: 'parent: growth_map.what_i_have; action: growth_map.what_i_need_next' },
  missions: { kinds: ['teacher'], highlights: 2, evidence: 'mission_recommendations grounded in growth_map.capability_wheel and growth_map.what_i_need_next' },
} as const;

export const MIDDLE_SCHOOL_THINKING_STYLES = {
  'Pattern Recognition': 'pattern_recognition',
  'Spatial Reasoning': 'spatial_reasoning',
  'Verbal Reasoning': 'verbal_reasoning',
  'Logical Reasoning': 'logical_reasoning',
  'Numerical Reasoning': 'numerical_reasoning',
  'Data Interpretation': 'data_interpretation',
} as const;

