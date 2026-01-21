/**
 * Answer Utility Functions
 * Centralized logic for answer validation and manipulation
 */

import type { Question, AnswerValue, SJTAnswer, Answers } from '../types/assessment.types';

/**
 * Check if a question is answered
 */
export const isQuestionAnswered = (answer: AnswerValue, question: Question | null): boolean => {
  if (!answer) return false;
  if (!question) return false;

  // SJT questions need both best and worst
  if (question.partType === 'sjt') {
    const sjtAnswer = answer as SJTAnswer;
    return Boolean(sjtAnswer?.best && sjtAnswer?.worst);
  }

  // Multiselect questions need required number of selections
  if (question.type === 'multiselect' && question.maxSelections) {
    return Array.isArray(answer) && answer.length === question.maxSelections;
  }

  // Text questions need meaningful content (at least 10 characters)
  if (question.type === 'text') {
    return typeof answer === 'string' && answer.trim().length >= 10;
  }

  // For other types, any truthy value is considered answered
  return true;
};

/**
 * Generate question ID from section and question
 */
export const generateQuestionId = (sectionId: string, questionId: string | number): string => {
  return `${sectionId}_${questionId}`;
};

/**
 * Count answered questions in a section
 */
export const countAnsweredInSection = (
  answers: Answers,
  sectionId: string,
  questions: Question[]
): number => {
  return questions.filter((q) => {
    const questionId = generateQuestionId(sectionId, q.id);
    return isQuestionAnswered(answers[questionId], q);
  }).length;
};

/**
 * Calculate section completion percentage
 */
export const calculateSectionProgress = (
  answers: Answers,
  sectionId: string,
  questions: Question[]
): number => {
  if (questions.length === 0) return 0;
  const answered = countAnsweredInSection(answers, sectionId, questions);
  return (answered / questions.length) * 100;
};

/**
 * Calculate overall assessment progress
 */
export const calculateOverallProgress = (
  answers: Answers,
  totalQuestions: number,
  adaptiveQuestionsAnswered: number = 0
): number => {
  if (totalQuestions === 0) return 0;

  // Count regular answers (excluding adaptive)
  const regularAnswers = Object.keys(answers).filter(
    (key) => !key.startsWith('adaptive_aptitude')
  ).length;

  const totalAnswered = regularAnswers + adaptiveQuestionsAnswered;
  return (totalAnswered / totalQuestions) * 100;
};

/**
 * Auto-fill answers for testing
 */
export const autoFillAnswers = (
  sections: { id: string; questions: Question[]; responseScale?: any[] }[]
): Answers => {
  const filledAnswers: Answers = {};

  sections.forEach((section) => {
    section.questions.forEach((question) => {
      const questionId = generateQuestionId(section.id, question.id);

      if (question.partType === 'sjt') {
        const options = question.options || [];
        if (options.length >= 2) {
          filledAnswers[questionId] = {
            best: options[0],
            worst: options[options.length - 1],
          };
        }
      } else if (section.responseScale) {
        // Likert scale - pick middle value (3)
        filledAnswers[questionId] = 3;
      } else if (question.options && question.options.length > 0) {
        // MCQ - pick first option (or correct if available)
        filledAnswers[questionId] = question.correct || question.options[0];
      }
    });
  });

  return filledAnswers;
};

/**
 * Auto-fill answers up to a specific section
 */
export const autoFillUpToSection = (
  sections: { id: string; questions: Question[]; responseScale?: any[] }[],
  targetSectionIndex: number
): Answers => {
  const sectionsToFill = sections.slice(0, targetSectionIndex);
  return autoFillAnswers(sectionsToFill);
};

/**
 * Merge answers (for resuming assessment)
 */
export const mergeAnswers = (existingAnswers: Answers, newAnswers: Answers): Answers => {
  return { ...existingAnswers, ...newAnswers };
};

/**
 * Extract answers for a specific section
 */
export const extractSectionAnswers = (answers: Answers, sectionId: string): Answers => {
  const sectionAnswers: Answers = {};
  const prefix = `${sectionId}_`;

  Object.entries(answers).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      sectionAnswers[key] = value;
    }
  });

  return sectionAnswers;
};

/**
 * Validate SJT answer (best and worst must be different)
 */
export const validateSJTAnswer = (answer: SJTAnswer | undefined): boolean => {
  if (!answer) return false;
  return Boolean(answer.best && answer.worst && answer.best !== answer.worst);
};

/**
 * Update SJT answer
 */
export const updateSJTAnswer = (
  currentAnswer: SJTAnswer | undefined,
  type: 'best' | 'worst',
  value: string
): SJTAnswer | undefined => {
  const current = currentAnswer || { best: '', worst: '' };

  // Can't select same option for both
  if (type === 'best' && current.worst === value) return current;
  if (type === 'worst' && current.best === value) return current;

  // Toggle: if already selected, deselect it
  if (type === 'best' && current.best === value) {
    const { best, ...rest } = current;
    return rest.worst ? { best: '', worst: rest.worst } : undefined;
  }
  if (type === 'worst' && current.worst === value) {
    const { worst, ...rest } = current;
    return rest.best ? { best: rest.best, worst: '' } : undefined;
  }

  return { ...current, [type]: value };
};

/**
 * Update multiselect answer
 */
export const updateMultiselectAnswer = (
  currentAnswer: string[] | undefined,
  option: string,
  maxSelections: number
): string[] | undefined => {
  const current = currentAnswer || [];
  const isSelected = current.includes(option);

  if (isSelected) {
    // Deselect
    const newSelection = current.filter((opt) => opt !== option);
    return newSelection.length > 0 ? newSelection : undefined;
  } else if (current.length < maxSelections) {
    // Select
    return [...current, option];
  }

  return current;
};
