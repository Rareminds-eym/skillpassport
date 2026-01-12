/**
 * Section Configuration by Grade Level
 * 
 * Defines assessment sections for each grade level with their properties,
 * icons, colors, and instructions.
 * 
 * @module features/assessment/career-test/config/sections
 */

import type { ReactNode } from 'react';

export type GradeLevel = 'middle' | 'highschool' | 'higher_secondary' | 'after10' | 'after12' | 'college';

export interface ResponseScaleItem {
  value: number;
  label: string;
}

export interface SectionConfig {
  id: string;
  title: string;
  icon: ReactNode;
  description: string;
  color: string;
  instruction: string;
  responseScale?: ResponseScaleItem[];
  isTimed?: boolean;
  timeLimit?: number;
  isAptitude?: boolean;
  isAdaptive?: boolean;
  individualTimeLimit?: number;
  individualQuestionCount?: number;
}

/**
 * Response scales for different question types
 */
export const RESPONSE_SCALES: Record<string, ResponseScaleItem[]> = {
  likert5: [
    { value: 1, label: "Strongly Dislike" },
    { value: 2, label: "Dislike" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "Like" },
    { value: 5, label: "Strongly Like" }
  ],
  accuracy5: [
    { value: 1, label: "Very Inaccurate" },
    { value: 2, label: "Moderately Inaccurate" },
    { value: 3, label: "Neither" },
    { value: 4, label: "Moderately Accurate" },
    { value: 5, label: "Very Accurate" }
  ],
  importance5: [
    { value: 1, label: "Not Important" },
    { value: 2, label: "Slightly Important" },
    { value: 3, label: "Moderately Important" },
    { value: 4, label: "Very Important" },
    { value: 5, label: "Extremely Important" }
  ],
  selfDescription5: [
    { value: 1, label: "Not Like Me" },
    { value: 2, label: "Slightly" },
    { value: 3, label: "Somewhat" },
    { value: 4, label: "Mostly" },
    { value: 5, label: "Very Much Like Me" }
  ],
  strengths4: [
    { value: 1, label: "Not like me" },
    { value: 2, label: "Sometimes" },
    { value: 3, label: "Mostly me" },
    { value: 4, label: "Very me" }
  ],
  highSchool4: [
    { value: 1, label: "Not me" },
    { value: 2, label: "A bit" },
    { value: 3, label: "Mostly" },
    { value: 4, label: "Strongly me" }
  ],
  aptitude4: [
    { value: 1, label: "Very difficult" },
    { value: 2, label: "Somewhat difficult" },
    { value: 3, label: "Somewhat easy" },
    { value: 4, label: "Very easy" }
  ]
} as const;

/**
 * Section definitions for Middle School (Grades 6-8)
 * Simplified assessment with 4 sections including adaptive aptitude
 */
export const MIDDLE_SCHOOL_SECTIONS: Omit<SectionConfig, 'icon'>[] = [
  {
    id: 'middle_interest_explorer',
    title: 'Interest Explorer',
    description: "Let's discover what kinds of activities and subjects you enjoy most!",
    color: "rose",
    instruction: "There are no right or wrong answers. Pick what feels most like you today."
  },
  {
    id: 'middle_strengths_character',
    title: 'Strengths & Character',
    description: "Discover your personal strengths and character traits.",
    color: "amber",
    responseScale: RESPONSE_SCALES.strengths4,
    instruction: "Rate each statement: 1 = not like me, 2 = sometimes, 3 = mostly me, 4 = very me"
  },
  {
    id: 'middle_learning_preferences',
    title: 'Learning & Work Preferences',
    description: "Learn about how you like to work and learn best.",
    color: "blue",
    instruction: "Choose the options that best describe you."
  },
  {
    id: 'adaptive_aptitude',
    title: 'Adaptive Aptitude Test',
    description: "A smart test that adjusts to your skill level. It gets easier or harder based on how you're doing!",
    color: "indigo",
    isAdaptive: true,
    instruction: "Take your time with each question. There's no rush - just do your best!"
  }
];

/**
 * Section definitions for High School (Grades 9-10)
 * Detailed assessment with 5 sections
 */
export const HIGH_SCHOOL_SECTIONS: Omit<SectionConfig, 'icon'>[] = [
  {
    id: 'hs_interest_explorer',
    title: 'Interest Explorer',
    description: "Discover what activities and subjects truly excite you.",
    color: "rose",
    instruction: "Answer honestly based on your real preferences, not what others expect."
  },
  {
    id: 'hs_strengths_character',
    title: 'Strengths & Character',
    description: "Identify your personal strengths and character traits.",
    color: "amber",
    responseScale: RESPONSE_SCALES.highSchool4,
    instruction: "Rate each: 1 = not me, 2 = a bit, 3 = mostly, 4 = strongly me"
  },
  {
    id: 'hs_learning_preferences',
    title: 'Learning & Work Preferences',
    description: "Understand how you work, learn, and contribute best.",
    color: "blue",
    instruction: "Select the options that best describe you."
  },
  {
    id: 'hs_aptitude_sampling',
    title: 'Aptitude Sampling',
    description: "Rate your experience with different types of tasks.",
    color: "purple",
    responseScale: RESPONSE_SCALES.aptitude4,
    instruction: "After each task, rate: Ease 1–4, Enjoyment 1–4"
  },
  {
    id: 'adaptive_aptitude',
    title: 'Adaptive Aptitude Test',
    description: "An intelligent test that adapts to your ability level for accurate aptitude measurement.",
    color: "indigo",
    isAdaptive: true,
    instruction: "Answer each question carefully. The test will adapt to your performance level."
  }
];

/**
 * Section definitions for Higher Secondary (Grades 11-12)
 * Same as high school but with stream focus
 */
export const HIGHER_SECONDARY_SECTIONS = HIGH_SCHOOL_SECTIONS;

/**
 * Section definitions for After 10th, After 12th, and College
 * Full comprehensive assessment with 6 sections
 */
export const COMPREHENSIVE_SECTIONS: Omit<SectionConfig, 'icon'>[] = [
  {
    id: 'riasec',
    title: 'Career Interests',
    description: "Discover what types of work environments and activities appeal to you most.",
    color: "rose",
    responseScale: RESPONSE_SCALES.likert5,
    instruction: "Rate how much you would LIKE or DISLIKE each activity."
  },
  {
    id: 'bigfive',
    title: 'Big Five Personality',
    description: "Understand your work style, approach to tasks, and how you interact with others.",
    color: "purple",
    responseScale: RESPONSE_SCALES.accuracy5,
    instruction: "How accurately does each statement describe you?"
  },
  {
    id: 'values',
    title: 'Work Values & Motivators',
    description: "Identify what drives your career satisfaction and choices.",
    color: "indigo",
    responseScale: RESPONSE_SCALES.importance5,
    instruction: "How important is each factor in your ideal career?"
  },
  {
    id: 'employability',
    title: 'Employability Skills',
    description: "Assess your job-readiness and 21st-century skills.",
    color: "green",
    responseScale: RESPONSE_SCALES.selfDescription5,
    instruction: "How well does each statement describe you?"
  },
  {
    id: 'aptitude',
    title: 'Multi-Aptitude',
    description: "Measure your cognitive strengths across verbal, numerical, logical, spatial, and clerical domains.",
    color: "amber",
    isTimed: true,
    timeLimit: 15 * 60, // 15 minutes fallback
    isAptitude: true,
    individualTimeLimit: 60, // 1 minute per question
    instruction: "Choose the correct answer. You have 1 minute per question."
  },
  {
    id: 'knowledge',
    title: 'Stream Knowledge',
    description: "Test your understanding of core concepts in your field.",
    color: "blue",
    isTimed: true,
    timeLimit: 30 * 60, // 30 minutes
    instruction: "Choose the best answer for each question."
  }
];

/**
 * Get section configurations for a specific grade level
 */
export const getSectionsForGrade = (gradeLevel: GradeLevel): Omit<SectionConfig, 'icon'>[] => {
  switch (gradeLevel) {
    case 'middle':
      return MIDDLE_SCHOOL_SECTIONS;
    case 'highschool':
      return HIGH_SCHOOL_SECTIONS;
    case 'higher_secondary':
      return HIGHER_SECONDARY_SECTIONS;
    case 'after10':
    case 'after12':
    case 'college':
      return COMPREHENSIVE_SECTIONS;
    default:
      return [];
  }
};

/**
 * Check if a grade level uses AI-powered questions
 */
export const usesAIQuestions = (gradeLevel: GradeLevel): boolean => {
  return ['after10', 'after12', 'college'].includes(gradeLevel);
};

/**
 * Get the database section ID mapping for a grade level
 */
export const getSectionIdMapping = (gradeLevel: GradeLevel, baseSection: string): string => {
  if (gradeLevel === 'middle') {
    const map: Record<string, string> = {
      'riasec': 'middle_interest_explorer',
      'bigfive': 'middle_strengths_character',
      'knowledge': 'middle_learning_preferences'
    };
    return map[baseSection] || baseSection;
  }
  if (gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
    const map: Record<string, string> = {
      'riasec': 'hs_interest_explorer',
      'bigfive': 'hs_strengths_character',
      'knowledge': 'hs_learning_preferences'
    };
    return map[baseSection] || baseSection;
  }
  return baseSection;
};
