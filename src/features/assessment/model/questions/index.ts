
// Career Assessment Question Banks
export { aptitudeQuestions } from './aptitudeQuestions';
export type { AptitudeQuestion } from './aptitudeQuestions';

export { default as bigFiveQuestions } from './bigFiveQuestions';
export type { BigFiveQuestion } from './bigFiveQuestions';

export { default as riasecQuestions } from './riasecQuestions';
export type { RIASECQuestion, RIASECType } from './riasecQuestions';

export { default as workValuesQuestions } from './workValuesQuestions';
export type { WorkValueQuestion, WorkValueType } from './workValuesQuestions';

export { employabilityQuestions } from './employabilityQuestions';

export * from './middleSchoolQuestions';
export * from './streamKnowledgeQuestions';

export {
  calculateRIASEC,
  calculateBigFive,
  calculateWorkValues,
  calculateEmployability,
  getCareerClusters,
  getTraitInterpretation,
} from './scoringUtils';
export type {
  RIASECResult,
  BigFiveResult,
  WorkValuesResult,
  EmployabilityResult,
  CareerCluster as ScoringCareerCluster,
} from './scoringUtils';

