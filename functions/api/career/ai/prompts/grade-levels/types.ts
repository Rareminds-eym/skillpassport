// Grade-Level Prompt Configuration Types

export type GradeLevel = 'middle' | 'highschool' | 'higher_secondary' | 'after10' | 'after12' | 'college';

export type GuardrailSeverity = 'critical' | 'warning';

export interface Guardrail {
  rule: string;
  severity: GuardrailSeverity;
  explanation?: string;
}

export interface PromptExample {
  intent: string;
  userQuery: string;
  chainOfThought?: string; // Optional: Step-by-step reasoning process
  idealResponse: string;
  reasoning?: string; // Why this response is good
}

export interface GradePromptConfig {
  gradeLevel: GradeLevel;
  displayName: string;
  ageRange: string;
  role: string;
  constraints: string[];
  vocabulary: string;
  focusAreas: string[];
  avoidTopics: string[];
  responseStyle: string;
  examples: PromptExample[];
  guardrails: Guardrail[];
  subjectGuidance: {
    approach: string;
    recommendations: string;
    exampleMapping: string;
  };
}
