/**
 * Assessment Configuration Constants
 * Centralized configuration for the assessment system
 */

import type { GradeLevel, GradeRange, CategoryOption, StreamOption } from '../types/assessment.types';

// ============================================
// Grade Level Configuration
// ============================================

export const GRADE_LEVELS = {
  MIDDLE: 'middle' as GradeLevel,
  HIGHSCHOOL: 'highschool' as GradeLevel,
  HIGHER_SECONDARY: 'higher_secondary' as GradeLevel,
  AFTER_10: 'after10' as GradeLevel,
  AFTER_12: 'after12' as GradeLevel,
  COLLEGE: 'college' as GradeLevel,
} as const;

export const GRADE_RANGES: Record<string, GradeRange> = {
  MIDDLE: { min: 6, max: 8 },
  HIGHSCHOOL: { min: 9, max: 10 },
  HIGHER_SECONDARY: { min: 11, max: 12 },
};

export const PROGRAM_GRADE_MAPPINGS: Record<string, GradeLevel> = {
  'UG': 'college',
  'UNDERGRADUATE': 'college',
  'PG': 'college',
  'POSTGRADUATE': 'college',
  'DIPLOMA': 'after10',
  'CERTIFICATE': 'college',
};

// ============================================
// Timer Configuration
// ============================================

export const TIMERS = {
  // Adaptive aptitude
  ADAPTIVE_QUESTION_TIME_LIMIT: 90, // seconds per question
  
  // Regular aptitude
  APTITUDE_INDIVIDUAL_TIME_LIMIT: 60, // 1 minute per question
  APTITUDE_SHARED_TIME_LIMIT: 15 * 60, // 15 minutes for shared section
  
  // Knowledge section
  KNOWLEDGE_TIME_LIMIT: 30 * 60, // 30 minutes
  
  // Auto-save interval
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  
  // Warning thresholds
  TIME_WARNING_THRESHOLD: 60, // Show warning when 60 seconds left
  TIME_CRITICAL_THRESHOLD: 10, // Critical warning at 10 seconds
} as const;

// ============================================
// Assessment Restriction
// ============================================

export const ASSESSMENT_RESTRICTION = {
  MONTHS_BETWEEN_ATTEMPTS: 6,
} as const;

// ============================================
// Section IDs by Grade Level
// ============================================

export const SECTION_ID_MAPPINGS = {
  middle: {
    riasec: 'middle_interest_explorer',
    bigfive: 'middle_strengths_character',
    knowledge: 'middle_learning_preferences',
  },
  highschool: {
    riasec: 'hs_interest_explorer',
    aptitude: 'hs_aptitude_sampling',
    bigfive: 'hs_strengths_character',
    knowledge: 'hs_learning_preferences',
  },
  higher_secondary: {
    riasec: 'hs_interest_explorer',
    aptitude: 'hs_aptitude_sampling',
    bigfive: 'hs_strengths_character',
    knowledge: 'hs_learning_preferences',
  },
  after10: {},
  after12: {},
  college: {},
} as const;

// ============================================
// Stream Categories
// ============================================

export const STREAM_CATEGORIES: Omit<CategoryOption, 'icon'>[] = [
  { 
    id: 'science', 
    label: 'Science', 
    description: 'Engineering, Medical, Pure Sciences' 
  },
  { 
    id: 'commerce', 
    label: 'Commerce', 
    description: 'Business, Finance, Accounting' 
  },
  { 
    id: 'arts', 
    label: 'Arts/Humanities', 
    description: 'Literature, Social Sciences, Design' 
  },
];

// ============================================
// Streams by Category
// ============================================

export const STREAMS_BY_CATEGORY: Record<string, StreamOption[]> = {
  science: [
    { id: 'cs', label: 'B.Sc Computer Science / B.Tech CS/IT', riasec: ['I', 'C', 'R'], aptitudeStrengths: ['logical', 'numerical', 'abstract'] },
    { id: 'engineering', label: 'B.Tech / B.E (Other Engineering)', riasec: ['R', 'I', 'C'], aptitudeStrengths: ['numerical', 'spatial', 'logical'] },
    { id: 'medical', label: 'MBBS / BDS / Nursing', riasec: ['I', 'S', 'R'], aptitudeStrengths: ['verbal', 'logical', 'numerical'] },
    { id: 'pharmacy', label: 'B.Pharm / Pharm.D', riasec: ['I', 'C', 'S'], aptitudeStrengths: ['numerical', 'verbal', 'logical'] },
    { id: 'bsc', label: 'B.Sc (Physics/Chemistry/Biology/Maths)', riasec: ['I', 'R', 'C'], aptitudeStrengths: ['numerical', 'logical', 'abstract'] },
    { id: 'animation', label: 'B.Sc Animation / Game Design', riasec: ['A', 'I', 'R'], aptitudeStrengths: ['spatial', 'abstract', 'logical'] },
  ],
  commerce: [
    { id: 'bba', label: 'BBA General', riasec: ['E', 'S', 'C'], aptitudeStrengths: ['verbal', 'numerical', 'logical'] },
    { id: 'bca', label: 'BCA General', riasec: ['I', 'C', 'E'], aptitudeStrengths: ['logical', 'numerical', 'abstract'] },
    { id: 'dm', label: 'BBA Digital Marketing', riasec: ['E', 'A', 'S'], aptitudeStrengths: ['verbal', 'abstract', 'logical'] },
    { id: 'bcom', label: 'B.Com / B.Com (Hons)', riasec: ['C', 'E', 'I'], aptitudeStrengths: ['numerical', 'logical', 'verbal'] },
    { id: 'ca', label: 'CA / CMA / CS', riasec: ['C', 'I', 'E'], aptitudeStrengths: ['numerical', 'logical', 'verbal'] },
    { id: 'finance', label: 'BBA Finance / Banking', riasec: ['E', 'C', 'I'], aptitudeStrengths: ['numerical', 'logical', 'verbal'] },
  ],
  arts: [
    { id: 'ba', label: 'BA (English/History/Political Science)', riasec: ['S', 'A', 'I'], aptitudeStrengths: ['verbal', 'abstract', 'logical'] },
    { id: 'journalism', label: 'BA Journalism / Mass Communication', riasec: ['A', 'S', 'E'], aptitudeStrengths: ['verbal', 'abstract', 'logical'] },
    { id: 'design', label: 'B.Des / Fashion Design', riasec: ['A', 'R', 'E'], aptitudeStrengths: ['spatial', 'abstract', 'verbal'] },
    { id: 'law', label: 'BA LLB / BBA LLB', riasec: ['E', 'S', 'I'], aptitudeStrengths: ['verbal', 'logical', 'abstract'] },
    { id: 'psychology', label: 'BA/B.Sc Psychology', riasec: ['S', 'I', 'A'], aptitudeStrengths: ['verbal', 'logical', 'abstract'] },
    { id: 'finearts', label: 'BFA / Visual Arts', riasec: ['A', 'R', 'S'], aptitudeStrengths: ['spatial', 'abstract', 'verbal'] },
  ],
};

// ============================================
// After 10th Streams by Category (11th/12th Class)
// ============================================

export const AFTER10_STREAMS_BY_CATEGORY: Record<string, StreamOption[]> = {
  science: [
    { id: 'science_pcmb', label: 'Science (PCMB)', riasec: ['I', 'R', 'C'], aptitudeStrengths: ['numerical', 'logical', 'verbal'], description: 'Physics, Chemistry, Maths, Biology - Medical & Engineering' },
    { id: 'science_pcms', label: 'Science (PCMS)', riasec: ['I', 'C', 'R'], aptitudeStrengths: ['logical', 'numerical', 'abstract'], description: 'Physics, Chemistry, Maths, Computer Science - Engineering/IT' },
    { id: 'science_pcm', label: 'Science (PCM)', riasec: ['R', 'I', 'C'], aptitudeStrengths: ['numerical', 'spatial', 'logical'], description: 'Physics, Chemistry, Maths - Engineering' },
    { id: 'science_pcb', label: 'Science (PCB)', riasec: ['I', 'S', 'R'], aptitudeStrengths: ['verbal', 'logical', 'numerical'], description: 'Physics, Chemistry, Biology - Medical' },
  ],
  commerce: [
    { id: 'commerce_maths', label: 'Commerce with Maths', riasec: ['C', 'E', 'I'], aptitudeStrengths: ['numerical', 'logical', 'verbal'], description: 'For CA, Finance, Economics, Statistics' },
    { id: 'commerce_general', label: 'Commerce without Maths', riasec: ['E', 'C', 'S'], aptitudeStrengths: ['verbal', 'numerical', 'logical'], description: 'For Business, Accounting, Management' },
  ],
  arts: [
    { id: 'arts_psychology', label: 'Arts with Psychology', riasec: ['S', 'I', 'A'], aptitudeStrengths: ['verbal', 'logical', 'abstract'], description: 'Psychology, Sociology, English - For Counseling, HR, Social Work' },
    { id: 'arts_economics', label: 'Arts with Economics', riasec: ['I', 'E', 'S'], aptitudeStrengths: ['verbal', 'numerical', 'logical'], description: 'Economics, Political Science, English - For Civil Services, Policy' },
    { id: 'arts', label: 'Arts/Humanities General', riasec: ['A', 'S', 'I'], aptitudeStrengths: ['verbal', 'abstract', 'logical'], description: 'English, History, Geography - For Journalism, Law, Teaching' },
  ],
};

// ============================================
// Response Scales
// ============================================

export const RESPONSE_SCALES = {
  RIASEC: [
    { value: 1, label: 'Strongly Dislike' },
    { value: 2, label: 'Dislike' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Like' },
    { value: 5, label: 'Strongly Like' },
  ],
  BIG_FIVE: [
    { value: 1, label: 'Very Inaccurate' },
    { value: 2, label: 'Moderately Inaccurate' },
    { value: 3, label: 'Neither' },
    { value: 4, label: 'Moderately Accurate' },
    { value: 5, label: 'Very Accurate' },
  ],
  WORK_VALUES: [
    { value: 1, label: 'Not Important' },
    { value: 2, label: 'Slightly Important' },
    { value: 3, label: 'Moderately Important' },
    { value: 4, label: 'Very Important' },
    { value: 5, label: 'Extremely Important' },
  ],
  EMPLOYABILITY: [
    { value: 1, label: 'Not Like Me' },
    { value: 2, label: 'Slightly' },
    { value: 3, label: 'Somewhat' },
    { value: 4, label: 'Mostly' },
    { value: 5, label: 'Very Much Like Me' },
  ],
  HIGH_SCHOOL: [
    { value: 1, label: 'Not me' },
    { value: 2, label: 'A bit' },
    { value: 3, label: 'Mostly' },
    { value: 4, label: 'Strongly me' },
  ],
  APTITUDE_RATING: [
    { value: 1, label: 'Very Difficult' },
    { value: 2, label: 'Difficult' },
    { value: 3, label: 'Easy' },
    { value: 4, label: 'Very Easy' },
  ],
} as const;

// ============================================
// Section Colors
// ============================================

export const SECTION_COLORS = {
  riasec: 'rose',
  bigfive: 'purple',
  values: 'indigo',
  employability: 'green',
  aptitude: 'amber',
  knowledge: 'blue',
  adaptive_aptitude: 'indigo',
  hs_interest_explorer: 'rose',
  hs_strengths_character: 'amber',
  hs_learning_preferences: 'blue',
  hs_aptitude_sampling: 'purple',
  middle_interest_explorer: 'rose',
  middle_strengths_character: 'amber',
  middle_learning_preferences: 'blue',
} as const;

// ============================================
// RIASEC Type Names
// ============================================

export const RIASEC_NAMES: Record<string, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

export const RIASEC_COLORS: Record<string, string> = {
  R: '#ef4444', // red
  I: '#3b82f6', // blue
  A: '#a855f7', // purple
  S: '#22c55e', // green
  E: '#f59e0b', // amber
  C: '#6366f1', // indigo
};

// ============================================
// Big Five Trait Names
// ============================================

export const TRAIT_NAMES: Record<string, string> = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  N: 'Neuroticism',
};

export const TRAIT_COLORS: Record<string, string> = {
  O: '#8b5cf6', // violet
  C: '#3b82f6', // blue
  E: '#f59e0b', // amber
  A: '#22c55e', // green
  N: '#ef4444', // red
};

// ============================================
// Aptitude Subtag Mappings
// ============================================

export const APTITUDE_SUBTAG_MAPPINGS: Record<string, string> = {
  numerical_reasoning: 'numerical',
  logical_reasoning: 'abstract',
  verbal_reasoning: 'verbal',
  spatial_reasoning: 'spatial',
  data_interpretation: 'numerical',
  pattern_recognition: 'abstract',
};

// ============================================
// Course Personality Fit Mappings
// ============================================

export const COURSE_PERSONALITY_MAPPINGS: Record<string, { traits: string[]; weights: number[] }> = {
  cs: { traits: ['O', 'C'], weights: [0.4, 0.4] },
  bca: { traits: ['O', 'C'], weights: [0.4, 0.4] },
  engineering: { traits: ['O', 'C'], weights: [0.4, 0.4] },
  bba: { traits: ['E', 'C', 'A'], weights: [0.4, 0.3, 0.3] },
  dm: { traits: ['E', 'C', 'A'], weights: [0.4, 0.3, 0.3] },
  finance: { traits: ['E', 'C', 'A'], weights: [0.4, 0.3, 0.3] },
  design: { traits: ['O', 'E'], weights: [0.5, 0.2] },
  finearts: { traits: ['O', 'E'], weights: [0.5, 0.2] },
  animation: { traits: ['O', 'E'], weights: [0.5, 0.2] },
  medical: { traits: ['A', 'C'], weights: [0.4, 0.4] },
  pharmacy: { traits: ['A', 'C'], weights: [0.4, 0.4] },
  psychology: { traits: ['A', 'C'], weights: [0.4, 0.4] },
  law: { traits: ['E', 'O', 'C'], weights: [0.35, 0.35, 0.3] },
  journalism: { traits: ['E', 'O', 'C'], weights: [0.35, 0.35, 0.3] },
  bcom: { traits: ['C', 'A'], weights: [0.5, 0.2] },
  ca: { traits: ['C', 'A'], weights: [0.5, 0.2] },
};
