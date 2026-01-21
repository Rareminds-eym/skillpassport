/**
 * Assessment Question Data - Main Export
 *
 * Centralized exports for all assessment question banks.
 * These were moved from pages/student/assessment-data/ for better organization.
 *
 * @module features/assessment/data/questions
 */

// Career Assessment Questions - Aptitude
export {
  aptitudeQuestions,
  aptitudeModules,
  getAllAptitudeQuestions,
  getAptitudeQuestionCounts,
  getCurrentAptitudeModule,
  getModuleQuestionIndex,
} from './aptitudeQuestions.ts';
export type { AptitudeQuestion, AptitudeModule } from './aptitudeQuestions.ts';

// Career Assessment Questions - Big Five Personality
export { bigFiveQuestions } from './bigFiveQuestions.ts';
export type { BigFiveQuestion } from './bigFiveQuestions.ts';

// Career Assessment Questions - RIASEC Interest Inventory
export { riasecQuestions } from './riasecQuestions.ts';
export type { RIASECQuestion, RIASECType } from './riasecQuestions.ts';

// Career Assessment Questions - Work Values
export { workValuesQuestions } from './workValuesQuestions.ts';
export type { WorkValueQuestion, WorkValueType } from './workValuesQuestions.ts';

// Career Assessment Questions - Employability
export {
  selfRatingQuestions,
  sjtQuestions,
  employabilityQuestions,
  getCurrentEmployabilityModule,
  getEmployabilityQuestionCounts,
} from './employabilityQuestions.ts';
export type { SelfRatingQuestion, SJTQuestion, SJTOption } from './employabilityQuestions.ts';

// Middle School & High School Questions
export * from './middleSchoolQuestions.ts';

// Stream-Specific Knowledge Questions
export * from './streamKnowledgeQuestions.ts';

// Scoring Utilities
export {
  calculateRIASEC,
  calculateBigFive,
  calculateWorkValues,
  calculateEmployability,
  getCareerClusters,
  getSkillLevel,
  getTraitInterpretation,
} from './scoringUtils.ts';
export type {
  RIASECResult,
  BigFiveResult,
  WorkValuesResult,
  EmployabilityResult,
  CareerCluster as ScoringCareerCluster, // Renamed to avoid conflict with types
  SkillLevel,
} from './scoringUtils.ts';
