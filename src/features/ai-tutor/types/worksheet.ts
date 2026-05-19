export type WorksheetTemplateType = 
  | 'comprehensive'      // Mixed question types (default)
  | 'multiple_choice'    // Multiple choice questions only
  | 'short_answer'       // Short answer questions
  | 'fill_in_blank'      // Fill in the blank exercises
  | 'true_false'         // True/False questions
  | 'problem_solving';   // Math/logic problems

export type DifficultyLevel =
  | 'low'                // Basic concepts, simple questions
  | 'medium'             // Intermediate concepts, moderate complexity
  | 'high';              // Advanced concepts, complex analysis

export interface WorksheetConfig {
  templateType: WorksheetTemplateType;
  difficulty: DifficultyLevel;
  gradeLevel?: string;
  questionCount: number;
  includeAnswerKey: boolean;
  includeRubric: boolean;
  includeExtension: boolean;
  topic?: string;
}

export const DEFAULT_WORKSHEET_CONFIG: WorksheetConfig = {
  templateType: 'comprehensive',
  difficulty: 'medium',
  questionCount: 10,
  includeAnswerKey: true,
  includeRubric: false,
  includeExtension: false,
};

export const WORKSHEET_TEMPLATES: Record<WorksheetTemplateType, { name: string; description: string }> = {
  'comprehensive': {
    name: 'Comprehensive Worksheet',
    description: 'Mixed question types for complete assessment',
  },
  'multiple_choice': {
    name: 'Multiple Choice Quiz',
    description: 'Multiple choice questions with 4 options each',
  },
  'short_answer': {
    name: 'Short Answer Questions',
    description: 'Questions requiring 2-3 sentence responses',
  },
  'fill_in_blank': {
    name: 'Fill in the Blank',
    description: 'Complete sentences with missing words',
  },
  'true_false': {
    name: 'True or False',
    description: 'True/False statements with explanations',
  },
  'problem_solving': {
    name: 'Problem Solving',
    description: 'Math, logic, or analytical problems',
  },
};
