export type LessonPlanTemplateType =
  | 'standard'
  | 'udl'
  | '5e'
  | 'project_based';

export interface LessonPlanConfig {
  templateType: LessonPlanTemplateType;
  duration: number; // in minutes
  subject?: string;
  gradeLevel?: string;
  
  // Optional sections to include
  includeTimestamps?: boolean;
  includeLearningObjectives?: boolean;
  includeStandards?: boolean;
  includeMaterials?: boolean;
  includeWarmUp?: boolean;
  includeDirectInstruction?: boolean;
  includeGuidedPractice?: boolean;
  includeIndependentPractice?: boolean;
  includeAssessment?: boolean;
  includeDifferentiation?: boolean;
  includeHomework?: boolean;
  includeClosure?: boolean;
  includeTeacherNotes?: boolean;
  
  // Two-pass prompting
  useTwoPass?: boolean;
}

export const DEFAULT_LESSON_PLAN_CONFIG: LessonPlanConfig = {
  templateType: 'standard',
  duration: 45,
  gradeLevel: 'Middle School',
  includeTimestamps: true,
  includeLearningObjectives: true,
  includeStandards: false,
  includeMaterials: true,
  includeWarmUp: true,
  includeDirectInstruction: true,
  includeGuidedPractice: true,
  includeIndependentPractice: true,
  includeAssessment: true,
  includeDifferentiation: true,
  includeHomework: false,
  includeClosure: true,
  includeTeacherNotes: false,
  useTwoPass: false,
};

export const LESSON_PLAN_TEMPLATES: Record<LessonPlanTemplateType, { name: string; description: string }> = {
  'standard': {
    name: 'Standard Lesson Plan',
    description: 'Traditional structured lesson format',
  },
  'udl': {
    name: 'UDL (Universal Design for Learning)',
    description: 'Inclusive design with multiple means of engagement',
  },
  '5e': {
    name: '5E Model',
    description: 'Engage, Explore, Explain, Elaborate, Evaluate',
  },
  'project_based': {
    name: 'Project-Based Learning',
    description: 'Real-world problem-solving and inquiry',
  },
};
