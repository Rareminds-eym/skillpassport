/**
 * Aptitude and School Subject Categories
 */

import type { AptitudeCategory } from '../types';

// Standard aptitude categories for after12/college (total: 50 questions)
export const APTITUDE_CATEGORIES: AptitudeCategory[] = [
  { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies', count: 8 },
  { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation', count: 8 },
  { id: 'abstract', name: 'Abstract / Logical Reasoning', description: 'Pattern recognition, deductive reasoning, sequences', count: 8 },
  { id: 'spatial', name: 'Spatial / Mechanical Reasoning', description: 'Visual-spatial relationships, gears, rotation', count: 6 },
  { id: 'clerical', name: 'Clerical Speed & Accuracy', description: 'String comparison, attention to detail - mark Same or Different', count: 20 }
];

// School subject categories for after10 students (total: 50 questions)
export const SCHOOL_SUBJECT_CATEGORIES: AptitudeCategory[] = [
  { id: 'mathematics', name: 'Mathematics', description: 'Algebra, geometry, arithmetic, problem-solving - tests analytical and numerical skills', count: 10 },
  { id: 'science', name: 'Science (Physics, Chemistry, Biology)', description: 'Scientific concepts, experiments, formulas, natural phenomena', count: 10 },
  { id: 'english', name: 'English Language', description: 'Grammar, vocabulary, comprehension, communication skills', count: 10 },
  { id: 'social_studies', name: 'Social Studies (History, Geography, Civics)', description: 'Historical events, geography, civics, current affairs, society', count: 10 },
  { id: 'computer', name: 'Computer & Logical Thinking', description: 'Basic computer concepts, logical reasoning, problem-solving, digital literacy', count: 10 }
];

// Category to module title mapping for UI display
export const APTITUDE_MODULE_TITLES: Record<string, string> = {
  'verbal': 'A) Verbal Reasoning',
  'numerical': 'B) Numerical Ability',
  'abstract': 'C) Abstract / Logical Reasoning',
  'spatial': 'D) Spatial / Mechanical Reasoning',
  'clerical': 'E) Clerical Speed & Accuracy'
};

export const SCHOOL_SUBJECT_MODULE_TITLES: Record<string, string> = {
  'mathematics': 'A) Mathematics',
  'science': 'B) Science',
  'english': 'C) English Language',
  'social_studies': 'D) Social Studies',
  'computer': 'E) Computer & Logical Thinking'
};

export function getCategories(isAfter10: boolean): AptitudeCategory[] {
  return isAfter10 ? SCHOOL_SUBJECT_CATEGORIES : APTITUDE_CATEGORIES;
}

export function getModuleTitles(isAfter10: boolean): Record<string, string> {
  return isAfter10 ? SCHOOL_SUBJECT_MODULE_TITLES : APTITUDE_MODULE_TITLES;
}
