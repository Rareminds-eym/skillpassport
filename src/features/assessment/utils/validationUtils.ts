/**
 * Validation Utility Functions
 * Runtime validation for assessment data structures
 */

import type {
  AssessmentResults,
  CourseRecommendation,
  RIASECScores,
  CareerFitResult,
  StreamRecommendation,
} from '../types/assessment.types';

/**
 * Validate assessment results structure
 * Returns array of missing/invalid fields
 */
export const validateAssessmentResults = (results: AssessmentResults | null): string[] => {
  const missingFields: string[] = [];

  if (!results) {
    return ['No results data'];
  }

  // Check RIASEC scores
  if (!results.riasec?.scores) {
    missingFields.push('RIASEC scores');
  } else {
    const riasecKeys = ['R', 'I', 'A', 'S', 'E', 'C'];
    const hasAnyRiasec = riasecKeys.some(
      key => results.riasec?.scores?.[key as keyof RIASECScores] !== undefined
    );
    if (!hasAnyRiasec) {
      missingFields.push('RIASEC scores (all empty)');
    }
  }

  // Check career fit
  if (!results.careerFit?.primaryFit) {
    missingFields.push('Career recommendations');
  }

  // Check aptitude (optional but flag if partially present)
  if (results.aptitude && !results.aptitude.scores) {
    missingFields.push('Aptitude scores (incomplete)');
  }

  return missingFields;
};

/**
 * Validate course recommendation structure
 */
export const validateCourseRecommendation = (course: any): course is CourseRecommendation => {
  if (!course || typeof course !== 'object') return false;

  // Must have at least one identifier
  const hasId = course.courseId || course.code || course.title;
  if (!hasId) return false;

  // Must have a title/name
  const hasTitle = course.title || course.name || course.courseName;
  if (!hasTitle) return false;

  return true;
};

/**
 * Validate array of course recommendations
 */
export const validateCourseRecommendations = (
  courses: any[]
): CourseRecommendation[] => {
  if (!Array.isArray(courses)) return [];
  return courses.filter(validateCourseRecommendation);
};

/**
 * Validate RIASEC scores
 */
export const validateRIASECScores = (scores: any): scores is RIASECScores => {
  if (!scores || typeof scores !== 'object') return false;

  const validKeys = ['R', 'I', 'A', 'S', 'E', 'C'];
  const hasValidKey = Object.keys(scores).some(key => validKeys.includes(key));

  return hasValidKey;
};

/**
 * Validate career fit result
 */
export const validateCareerFit = (careerFit: any): careerFit is CareerFitResult => {
  if (!careerFit || typeof careerFit !== 'object') return false;

  // Must have primary fit with title and matchScore
  if (!careerFit.primaryFit) return false;
  if (!careerFit.primaryFit.title) return false;
  if (typeof careerFit.primaryFit.matchScore !== 'number') return false;

  return true;
};

/**
 * Validate stream recommendation
 */
export const validateStreamRecommendation = (
  streamRec: any
): streamRec is StreamRecommendation => {
  if (!streamRec || typeof streamRec !== 'object') return false;

  // Must have recommended stream
  if (!streamRec.recommendedStream) return false;

  return true;
};

/**
 * Safe parse JSON - returns null if parsing fails
 */
export const safeParseJSON = <T>(
  jsonString: string | null,
  fallback: T
): T => {
  if (!jsonString) return fallback;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

/**
 * Validate and sanitize assessment results from AI
 */
export const sanitizeAssessmentResults = (
  rawResults: any
): AssessmentResults | null => {
  if (!rawResults || typeof rawResults !== 'object') {
    return null;
  }

  const sanitized: AssessmentResults = {};

  // Sanitize RIASEC
  if (rawResults.riasec?.scores) {
    sanitized.riasec = {
      scores: {},
      topThree: rawResults.riasec.topThree || [],
    };

    ['R', 'I', 'A', 'S', 'E', 'C'].forEach(key => {
      const value = rawResults.riasec.scores[key];
      if (typeof value === 'number' && !isNaN(value)) {
        sanitized.riasec!.scores[key as keyof RIASECScores] = Math.max(0, Math.min(100, value));
      }
    });
  }

  // Sanitize aptitude
  if (rawResults.aptitude?.scores) {
    sanitized.aptitude = {
      scores: {},
      adaptiveLevel: rawResults.aptitude.adaptiveLevel,
      adaptiveConfidence: rawResults.aptitude.adaptiveConfidence,
    };

    Object.entries(rawResults.aptitude.scores).forEach(([key, value]: [string, any]) => {
      if (value && typeof value === 'object') {
        sanitized.aptitude!.scores![key] = {
          score: typeof value.score === 'number' ? value.score : 0,
          percentage: typeof value.percentage === 'number' 
            ? Math.max(0, Math.min(100, value.percentage)) 
            : 0,
          adaptiveAccuracy: value.adaptiveAccuracy,
        };
      }
    });
  }

  // Sanitize Big Five
  if (rawResults.bigFive) {
    sanitized.bigFive = {};
    ['O', 'C', 'E', 'A', 'N'].forEach(key => {
      const value = rawResults.bigFive[key];
      if (typeof value === 'number' && !isNaN(value)) {
        sanitized.bigFive![key as keyof typeof sanitized.bigFive] = Math.max(0, Math.min(5, value));
      }
    });
  }

  // Sanitize career fit
  if (validateCareerFit(rawResults.careerFit)) {
    sanitized.careerFit = rawResults.careerFit;
  }

  // Sanitize course recommendations (handle both field names)
  const courses = rawResults.platformCourses || rawResults.courseRecommendations;
  if (Array.isArray(courses)) {
    sanitized.platformCourses = validateCourseRecommendations(courses);
  }

  // Sanitize stream recommendation
  if (validateStreamRecommendation(rawResults.streamRecommendation)) {
    sanitized.streamRecommendation = rawResults.streamRecommendation;
  }

  // Copy other fields
  if (rawResults.knowledge) {
    sanitized.knowledge = rawResults.knowledge;
  }
  if (rawResults.employability) {
    sanitized.employability = rawResults.employability;
  }
  if (rawResults.skillGap) {
    sanitized.skillGap = rawResults.skillGap;
  }
  if (rawResults.roadmap) {
    sanitized.roadmap = rawResults.roadmap;
  }
  if (rawResults.adaptiveAptitude) {
    sanitized.adaptiveAptitude = rawResults.adaptiveAptitude;
  }

  return sanitized;
};

/**
 * Check if results are complete enough to display
 */
export const areResultsDisplayable = (results: AssessmentResults | null): boolean => {
  if (!results) return false;

  // Must have either career fit or stream recommendation
  const hasCareerFit = validateCareerFit(results.careerFit);
  const hasStreamRec = validateStreamRecommendation(results.streamRecommendation);

  return hasCareerFit || hasStreamRec;
};

/**
 * Get completeness percentage of results
 */
export const getResultsCompleteness = (results: AssessmentResults | null): number => {
  if (!results) return 0;

  let score = 0;
  const weights = {
    riasec: 20,
    aptitude: 15,
    bigFive: 15,
    careerFit: 25,
    platformCourses: 15,
    streamRecommendation: 10,
  };

  if (results.riasec?.scores && Object.keys(results.riasec.scores).length > 0) {
    score += weights.riasec;
  }
  if (results.aptitude?.scores && Object.keys(results.aptitude.scores).length > 0) {
    score += weights.aptitude;
  }
  if (results.bigFive && Object.keys(results.bigFive).length > 0) {
    score += weights.bigFive;
  }
  if (validateCareerFit(results.careerFit)) {
    score += weights.careerFit;
  }
  if (results.platformCourses && results.platformCourses.length > 0) {
    score += weights.platformCourses;
  }
  if (validateStreamRecommendation(results.streamRecommendation)) {
    score += weights.streamRecommendation;
  }

  return score;
};
