/**
 * Assessment Entity - Model Exports
 */

// Type exports
export type {
  GradeLevel,
  StreamCategory,
  QuestionType,
  AttemptStatus,
  AssessmentFlowStatus,
  Question,
  ResponseScaleOption,
  AssessmentSection,
  SJTAnswer,
  AnswerValue,
  Answers,
  SectionTimings,
  AssessmentAttempt,
  RIASECScores,
  AptitudeScore,
  AptitudeScores,
  BigFiveScores,
  EmployabilityScores,
  CareerClusterEvidence,
  CareerCluster,
  CareerFitResult,
  SkillGapItem,
  RoadmapStep,
  StreamRecommendation,
  CourseRecommendation,
  AdaptiveAptitudeResult,
  AssessmentResults,
  AssessmentFlowState,
  AssessmentEligibility,
  CollegeAssessment,
  AssessmentType,
  AssessmentMapping,
  StudentInfo,
  SubjectMark,
  AssessmentResult
} from '@/shared/types';

// Validation exports
export {
  isValidGradeLevel,
  isValidStreamCategory,
  validateAssessmentAttempt,
  validateQuestion,
  validateAssessmentSection,
  validateAnswer,
  validateScore,
  validatePercentage
} from './validation';

// Utility exports
export {
  getGradeLevelDisplayName,
  getGradeRange,
  getTopRIASECCodes,
  getRIASECCodeName,
  getRIASECCodeDescription,
  getAptitudeDisplayName,
  getTopAptitudes,
  calculateOverallAptitudeScore,
  getCareerFitLevel,
  sortCareerClustersByMatch,
  filterHighMatchCareers,
  hasCompletedAssessment,
  getAssessmentCompletionPercentage,
  extractKeyInsights,
  calculateAttemptDuration,
  isAttemptExpired,
  canResumeAttempt,
  formatScore,
  formatPercentage,
  calculatePercentage,
  formatDuration,
  formatTimeRemaining
} from './utils';
