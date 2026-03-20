/**
 * Assessment Entity - Validation Logic
 */

import type {
  GradeLevel,
  StreamCategory,
  AssessmentAttempt,
  Question,
  AssessmentSection,
  AnswerValue,
  SJTAnswer
} from './types';

// ============================================================================
// Grade Level Validation
// ============================================================================

const VALID_GRADE_LEVELS: GradeLevel[] = [
  'middle',
  'highschool',
  'higher_secondary',
  'after10',
  'after12',
  'college'
];

export function isValidGradeLevel(level: string): level is GradeLevel {
  return VALID_GRADE_LEVELS.includes(level as GradeLevel);
}

// ============================================================================
// Stream Category Validation
// ============================================================================

const VALID_STREAM_CATEGORIES: StreamCategory[] = ['science', 'commerce', 'arts'];

export function isValidStreamCategory(category: string): category is StreamCategory {
  return VALID_STREAM_CATEGORIES.includes(category as StreamCategory);
}

// ============================================================================
// Assessment Attempt Validation
// ============================================================================

export function validateAssessmentAttempt(attempt: Partial<AssessmentAttempt>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!attempt.student_id) {
    errors.push('Student ID is required');
  }

  if (!attempt.grade_level) {
    errors.push('Grade level is required');
  } else if (!isValidGradeLevel(attempt.grade_level)) {
    errors.push('Invalid grade level');
  }

  if (attempt.status && !['in_progress', 'completed', 'abandoned'].includes(attempt.status)) {
    errors.push('Invalid attempt status');
  }

  if (typeof attempt.current_section_index !== 'number' || attempt.current_section_index < 0) {
    errors.push('Invalid current section index');
  }

  if (typeof attempt.current_question_index !== 'number' || attempt.current_question_index < 0) {
    errors.push('Invalid current question index');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Question Validation
// ============================================================================

export function validateQuestion(question: Partial<Question>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!question.id) {
    errors.push('Question ID is required');
  }

  if (!question.text || question.text.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (question.type === 'mcq' || question.type === 'multiselect') {
    if (!question.options || question.options.length < 2) {
      errors.push('MCQ/Multiselect questions must have at least 2 options');
    }
  }

  if (question.type === 'multiselect' && question.maxSelections) {
    if (question.maxSelections < 1) {
      errors.push('Max selections must be at least 1');
    }
    if (question.options && question.maxSelections > question.options.length) {
      errors.push('Max selections cannot exceed number of options');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Section Validation
// ============================================================================

export function validateAssessmentSection(section: Partial<AssessmentSection>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!section.id) {
    errors.push('Section ID is required');
  }

  if (!section.title || section.title.trim().length === 0) {
    errors.push('Section title is required');
  }

  if (!section.questions || section.questions.length === 0) {
    errors.push('Section must have at least one question');
  }

  if (section.isTimed && (!section.timeLimit || section.timeLimit <= 0)) {
    errors.push('Timed sections must have a positive time limit');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Answer Validation
// ============================================================================

export function validateAnswer(
  answer: AnswerValue,
  question: Question
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (answer === undefined || answer === null) {
    errors.push('Answer is required');
    return { valid: false, errors };
  }

  switch (question.type) {
    case 'mcq':
      if (typeof answer !== 'string') {
        errors.push('MCQ answer must be a string');
      } else if (question.options && !question.options.includes(answer)) {
        errors.push('Answer must be one of the provided options');
      }
      break;

    case 'multiselect':
      if (!Array.isArray(answer)) {
        errors.push('Multiselect answer must be an array');
      } else {
        if (question.maxSelections && answer.length > question.maxSelections) {
          errors.push(`Cannot select more than ${question.maxSelections} options`);
        }
        if (question.options) {
          const invalidOptions = answer.filter(a => !question.options!.includes(a));
          if (invalidOptions.length > 0) {
            errors.push('All selected options must be valid');
          }
        }
      }
      break;

    case 'likert':
      if (typeof answer !== 'number') {
        errors.push('Likert answer must be a number');
      }
      break;

    case 'sjt':
      if (typeof answer !== 'object' || !answer) {
        errors.push('SJT answer must be an object');
      } else {
        const sjtAnswer = answer as SJTAnswer;
        if (!sjtAnswer.best || !sjtAnswer.worst) {
          errors.push('SJT answer must have both best and worst selections');
        }
        if (sjtAnswer.best === sjtAnswer.worst) {
          errors.push('Best and worst selections must be different');
        }
      }
      break;

    case 'text':
      if (typeof answer !== 'string') {
        errors.push('Text answer must be a string');
      } else if (answer.trim().length === 0) {
        errors.push('Text answer cannot be empty');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Score Validation
// ============================================================================

export function validateScore(score: number, maxScore: number): boolean {
  return score >= 0 && score <= maxScore && !isNaN(score);
}

export function validatePercentage(percentage: number): boolean {
  return percentage >= 0 && percentage <= 100 && !isNaN(percentage);
}
