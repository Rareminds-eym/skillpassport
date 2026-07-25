/**
 * Core Assessment Services — Reusable Utilities
 */

export {
  calculateMiddleSchoolMatchScore,
  calculateCollegeMatchScore,
  calculateCollegeMatchScoreFromDemand,
} from './scoring-service';
export type {
  GradeLevel,
  StudentProfile,
  MatchScores,
  CollegeMatchScores,
  RoleDemandProfile,
} from './scoring-service';

export {
  generateMiddleSchoolCareerClusters,
  generateHighSchoolCareerClusters,
  generateHigherSecondaryCareerClusters,
  generateAfter10CareerClusters,
  generateAfter12CareerClusters,
  generateCollegeCareerClusters,
} from './career-cluster-generator';

export {
  getSavedQuestionsForLearner,
  saveAptitudeQuestions,
  saveKnowledgeQuestions,
  clearSavedQuestionsForLearner,
} from './assessment-repository';
