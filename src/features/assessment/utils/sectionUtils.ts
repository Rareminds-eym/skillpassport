/**
 * Section Utility Functions
 * Centralized logic for section management and navigation
 */

import type { GradeLevel, AssessmentSection } from '../types/assessment.types';
import { SECTION_ID_MAPPINGS, SECTION_COLORS } from '../constants/config';

/**
 * Get section ID based on grade level
 * Maps base section names to grade-specific section IDs
 */
export const getSectionId = (
  baseSection: string,
  gradeLevel: GradeLevel | null
): string => {
  if (!gradeLevel) return baseSection;

  const mappings = SECTION_ID_MAPPINGS[gradeLevel];
  if (mappings && baseSection in mappings) {
    return mappings[baseSection as keyof typeof mappings];
  }

  return baseSection;
};

/**
 * Get section color
 */
export const getSectionColor = (sectionId: string): string => {
  return SECTION_COLORS[sectionId as keyof typeof SECTION_COLORS] || 'indigo';
};

/**
 * Get section color classes for Tailwind
 */
export const getSectionColorClasses = (sectionId: string): {
  bg: string;
  text: string;
  border: string;
  light: string;
} => {
  const color = getSectionColor(sectionId);
  
  return {
    bg: `bg-${color}-600`,
    text: `text-${color}-600`,
    border: `border-${color}-600`,
    light: `bg-${color}-100`,
  };
};

/**
 * Calculate total questions across all sections
 */
export const calculateTotalQuestions = (sections: AssessmentSection[]): number => {
  return sections.reduce((total, section) => {
    // For adaptive sections, estimate 15-20 questions
    if (section.isAdaptive) {
      return total + 15;
    }
    return total + (section.questions?.length || 0);
  }, 0);
};

/**
 * Get section progress info
 */
export const getSectionProgress = (
  currentSectionIndex: number,
  currentQuestionIndex: number,
  sections: AssessmentSection[]
): {
  currentSection: number;
  totalSections: number;
  currentQuestion: number;
  totalQuestionsInSection: number;
  overallProgress: number;
} => {
  const currentSection = sections[currentSectionIndex];
  const totalQuestionsInSection = currentSection?.questions?.length || 0;
  
  // Calculate overall progress
  let questionsCompleted = 0;
  let totalQuestions = 0;
  
  sections.forEach((section, idx) => {
    const sectionQuestions = section.questions?.length || 0;
    totalQuestions += sectionQuestions;
    
    if (idx < currentSectionIndex) {
      questionsCompleted += sectionQuestions;
    } else if (idx === currentSectionIndex) {
      questionsCompleted += currentQuestionIndex;
    }
  });

  return {
    currentSection: currentSectionIndex + 1,
    totalSections: sections.length,
    currentQuestion: currentQuestionIndex + 1,
    totalQuestionsInSection,
    overallProgress: totalQuestions > 0 
      ? Math.round((questionsCompleted / totalQuestions) * 100) 
      : 0,
  };
};

/**
 * Check if section is timed
 */
export const isSectionTimed = (section: AssessmentSection | null): boolean => {
  return Boolean(section?.isTimed && section?.timeLimit);
};

/**
 * Check if section has individual question timers
 */
export const hasIndividualTimers = (section: AssessmentSection | null): boolean => {
  return Boolean(section?.isAptitude && section?.individualTimeLimit);
};

/**
 * Get section time limit
 */
export const getSectionTimeLimit = (section: AssessmentSection | null): number | null => {
  if (!section) return null;
  return section.timeLimit || null;
};

/**
 * Get individual question time limit
 */
export const getQuestionTimeLimit = (section: AssessmentSection | null): number | null => {
  if (!section) return null;
  return section.individualTimeLimit || null;
};

/**
 * Check if current question is in individual timer phase
 */
export const isInIndividualTimerPhase = (
  section: AssessmentSection | null,
  questionIndex: number
): boolean => {
  if (!section?.isAptitude) return false;
  const individualCount = section.individualQuestionCount || 30;
  return questionIndex < individualCount;
};

/**
 * Get next section index
 */
export const getNextSectionIndex = (
  currentIndex: number,
  totalSections: number
): number | null => {
  const nextIndex = currentIndex + 1;
  return nextIndex < totalSections ? nextIndex : null;
};

/**
 * Get previous section index
 */
export const getPreviousSectionIndex = (currentIndex: number): number | null => {
  return currentIndex > 0 ? currentIndex - 1 : null;
};

/**
 * Check if at last question of section
 */
export const isLastQuestionOfSection = (
  questionIndex: number,
  section: AssessmentSection | null
): boolean => {
  if (!section?.questions) return true;
  return questionIndex >= section.questions.length - 1;
};

/**
 * Check if at first question of section
 */
export const isFirstQuestionOfSection = (questionIndex: number): boolean => {
  return questionIndex === 0;
};

/**
 * Check if at last section
 */
export const isLastSection = (
  sectionIndex: number,
  totalSections: number
): boolean => {
  return sectionIndex >= totalSections - 1;
};

/**
 * Check if at first section
 */
export const isFirstSection = (sectionIndex: number): boolean => {
  return sectionIndex === 0;
};

/**
 * Get section by ID
 */
export const getSectionById = (
  sections: AssessmentSection[],
  sectionId: string
): AssessmentSection | undefined => {
  return sections.find(s => s.id === sectionId);
};

/**
 * Get section index by ID
 */
export const getSectionIndexById = (
  sections: AssessmentSection[],
  sectionId: string
): number => {
  return sections.findIndex(s => s.id === sectionId);
};
