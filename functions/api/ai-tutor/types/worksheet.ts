/**
 * Worksheet Types and Configurations
 * 
 * Defines all types for the worksheet generation system.
 * These types are shared between frontend and backend.
 */

// ==================== WORKSHEET TEMPLATE TYPES ====================

/**
 * Available worksheet template types
 */
export type WorksheetTemplateType =
  | 'comprehensive'      // Mixed question types (default)
  | 'multiple_choice'    // Multiple choice questions only
  | 'short_answer'       // Short answer questions
  | 'fill_in_blank'      // Fill in the blank exercises
  | 'true_false'         // True/False questions
  | 'problem_solving';   // Math/logic problems

/**
 * Difficulty levels for worksheets
 */
export type DifficultyLevel =
  | 'low'                // Basic concepts, simple questions
  | 'medium'             // Intermediate concepts, moderate complexity
  | 'high';              // Advanced concepts, complex analysis

// ==================== WORKSHEET CONFIGURATION ====================

/**
 * Configuration for worksheet generation
 */
export interface WorksheetConfig {
  /** Type of worksheet template to use */
  templateType: WorksheetTemplateType;
  
  /** Difficulty level */
  difficulty: DifficultyLevel;
  
  /** Specific grade level (e.g., "9-12", "College") */
  gradeLevel?: string;
  
  /** Number of questions to generate */
  questionCount: number;
  
  /** Include answer key */
  includeAnswerKey: boolean;
  
  /** Include grading rubric */
  includeRubric: boolean;
  
  /** Include extension activity */
  includeExtension: boolean;
  
  /** Optional specific topic focus */
  topic?: string;
}

/**
 * Default worksheet configuration
 */
export const DEFAULT_WORKSHEET_CONFIG: WorksheetConfig = {
  templateType: 'comprehensive',
  difficulty: 'medium',
  questionCount: 10,
  includeAnswerKey: true,
  includeRubric: false,
  includeExtension: false,
};

// ==================== TEMPLATE METADATA ====================

/**
 * Metadata for a worksheet template
 */
export interface WorksheetTemplateMetadata {
  type: WorksheetTemplateType;
  name: string;
  description: string;
  icon: string;
  defaultQuestionCount: number;
  minQuestions: number;
  maxQuestions: number;
  supportedDifficulties: DifficultyLevel[];
}

/**
 * All available worksheet templates with metadata
 */
export const WORKSHEET_TEMPLATES: Record<WorksheetTemplateType, WorksheetTemplateMetadata> = {
  comprehensive: {
    type: 'comprehensive',
    name: 'Comprehensive Worksheet',
    description: 'Mixed question types for complete assessment',
    icon: '📋',
    defaultQuestionCount: 10,
    minQuestions: 5,
    maxQuestions: 20,
    supportedDifficulties: ['low', 'medium', 'high'],
  },
  multiple_choice: {
    type: 'multiple_choice',
    name: 'Multiple Choice Quiz',
    description: 'Multiple choice questions with 4 options each',
    icon: '✓',
    defaultQuestionCount: 10,
    minQuestions: 5,
    maxQuestions: 30,
    supportedDifficulties: ['low', 'medium', 'high'],
  },
  short_answer: {
    type: 'short_answer',
    name: 'Short Answer Questions',
    description: 'Questions requiring 2-3 sentence responses',
    icon: '✍️',
    defaultQuestionCount: 8,
    minQuestions: 3,
    maxQuestions: 15,
    supportedDifficulties: ['low', 'medium', 'high'],
  },
  fill_in_blank: {
    type: 'fill_in_blank',
    name: 'Fill in the Blank',
    description: 'Complete sentences with missing words',
    icon: '___',
    defaultQuestionCount: 12,
    minQuestions: 5,
    maxQuestions: 25,
    supportedDifficulties: ['low', 'medium', 'high'],
  },
  true_false: {
    type: 'true_false',
    name: 'True or False',
    description: 'True/False statements with explanations',
    icon: '✓✗',
    defaultQuestionCount: 15,
    minQuestions: 5,
    maxQuestions: 30,
    supportedDifficulties: ['low', 'medium', 'high'],
  },
  problem_solving: {
    type: 'problem_solving',
    name: 'Problem Solving',
    description: 'Math, logic, or analytical problems',
    icon: '🧮',
    defaultQuestionCount: 8,
    minQuestions: 3,
    maxQuestions: 15,
    supportedDifficulties: ['low', 'medium', 'high'],
  },
};

// ==================== DIFFICULTY METADATA ====================

/**
 * Metadata for difficulty levels
 */
export interface DifficultyMetadata {
  level: DifficultyLevel;
  name: string;
  description: string;
  gradeRange: string;
}

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyMetadata> = {
  low: {
    level: 'low',
    name: 'Low',
    description: 'Basic concepts, simple questions',
    gradeRange: 'Beginner',
  },
  medium: {
    level: 'medium',
    name: 'Medium',
    description: 'Intermediate concepts, moderate complexity',
    gradeRange: 'Intermediate',
  },
  high: {
    level: 'high',
    name: 'High',
    description: 'Advanced concepts, complex analysis',
    gradeRange: 'Advanced',
  },
};
