/**
 * Data Transformation Utilities
 * Centralized logic for transforming data between different formats
 */

import type {
  AssessmentResults,
  CourseRecommendation,
  RIASECScores,
  AptitudeScores,
  BigFiveScores,
  StreamOption,
} from '../types/assessment.types';
import { STREAMS_BY_CATEGORY, COURSE_PERSONALITY_MAPPINGS } from '../constants/config';

/**
 * Normalize course recommendations from AI response
 * Handles both platformCourses and courseRecommendations field names
 */
export const normalizeCourseRecommendations = (
  results: AssessmentResults | null
): CourseRecommendation[] => {
  if (!results) return [];

  // Use platformCourses (new) or courseRecommendations (legacy)
  const courses = results.platformCourses || results.courseRecommendations;
  if (!courses || courses.length === 0) return [];

  return courses.map(course => ({
    courseId: course.courseId || course.code || course.title,
    title: course.title || course.name || course.courseName || '',
    name: course.name || course.title,
    courseName: course.courseName || course.title,
    category: course.category || 'General',
    relevanceScore: course.relevanceScore || course.matchScore || 70,
    matchScore: course.matchScore || course.relevanceScore || 70,
    matchLevel: getMatchLevel(course.matchScore || course.relevanceScore || 70),
    matchReasons: course.matchReasons || course.reasons || [],
    reasons: course.reasons || course.matchReasons || [],
  }));
};

/**
 * Get match level from score
 */
export const getMatchLevel = (score: number): 'Excellent' | 'Good' | 'Fair' | 'Low' => {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Low';
};

/**
 * Get top N RIASEC types
 */
export const getTopRIASECTypes = (
  scores: RIASECScores,
  count: number = 3
): string[] => {
  return Object.entries(scores)
    .filter(([_, score]) => score !== undefined)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, count)
    .map(([type]) => type);
};

/**
 * Get top aptitude strengths
 */
export const getTopAptitudeStrengths = (
  scores: AptitudeScores,
  count: number = 3
): string[] => {
  return Object.entries(scores)
    .filter(([_, data]) => data?.percentage !== undefined)
    .sort(([, a], [, b]) => (b?.percentage || 0) - (a?.percentage || 0))
    .slice(0, count)
    .map(([type]) => type);
};

/**
 * Calculate course match scores based on RIASEC and aptitude
 */
export const calculateCourseMatchScore = (
  course: StreamOption,
  riasecScores: RIASECScores,
  aptitudeScores: AptitudeScores,
  bigFive: BigFiveScores
): { score: number; reasons: string[] } => {
  let matchScore = 0;
  const matchReasons: string[] = [];

  const riasecMaxScore = 5 * 10; // Assuming 10 questions per type, max 5 each
  const riasecTopThree = getTopRIASECTypes(riasecScores, 3);
  const aptitudeTopStrengths = getTopAptitudeStrengths(aptitudeScores, 3);

  // RIASEC matching (40% weight)
  if (course.riasec && course.riasec.length > 0) {
    let riasecMatchPoints = 0;

    course.riasec.forEach(type => {
      const typeUpper = type.toUpperCase();
      const score = riasecScores[typeUpper as keyof RIASECScores] || 0;
      const percentage = (score / riasecMaxScore) * 100;

      if (riasecTopThree.includes(typeUpper)) {
        riasecMatchPoints += percentage * 1.5; // 50% bonus for top 3
      } else {
        riasecMatchPoints += percentage;
      }
    });

    const avgRiasecMatch = riasecMatchPoints / course.riasec.length;
    matchScore += avgRiasecMatch * 0.4;

    const matchingTopTypes = course.riasec.filter(type =>
      riasecTopThree.includes(type.toUpperCase())
    );
    if (matchingTopTypes.length > 0) {
      matchReasons.push(`Aligns with your ${matchingTopTypes.join(', ')} interests`);
    }
  }

  // Aptitude matching (35% weight)
  if (course.aptitudeStrengths && course.aptitudeStrengths.length > 0) {
    let aptitudeMatchPoints = 0;

    course.aptitudeStrengths.forEach(strength => {
      const strengthLower = strength.toLowerCase();
      const scoreData = aptitudeScores[strengthLower];
      const percentage = scoreData?.percentage || 0;

      const isTopStrength = aptitudeTopStrengths.some(
        s => s.toLowerCase().includes(strengthLower) || strengthLower.includes(s.toLowerCase())
      );

      if (isTopStrength) {
        aptitudeMatchPoints += percentage * 1.3; // 30% bonus
      } else {
        aptitudeMatchPoints += percentage;
      }
    });

    const avgAptitudeMatch = aptitudeMatchPoints / course.aptitudeStrengths.length;
    matchScore += avgAptitudeMatch * 0.35;

    if (avgAptitudeMatch > 60) {
      matchReasons.push('Strong aptitude in required skills');
    }
  }

  // Personality fit (25% weight)
  const personalityFit = calculatePersonalityFit(course.id, bigFive);
  matchScore += personalityFit.score * 0.25;
  if (personalityFit.reason) {
    matchReasons.push(personalityFit.reason);
  }

  // Ensure score is between 0-100
  matchScore = Math.min(100, Math.max(0, matchScore));

  return {
    score: Math.round(matchScore),
    reasons: matchReasons.slice(0, 3),
  };
};

/**
 * Calculate personality fit for a course
 */
export const calculatePersonalityFit = (
  courseId: string,
  bigFive: BigFiveScores
): { score: number; reason: string | null } => {
  // Convert Big Five scores (0-5) to percentage
  const O = ((bigFive.O || 3) / 5) * 100;
  const C = ((bigFive.C || 3) / 5) * 100;
  const E = ((bigFive.E || 3) / 5) * 100;
  const A = ((bigFive.A || 3) / 5) * 100;
  const N = ((bigFive.N || 3) / 5) * 100;

  let personalityFit = 50; // Base score
  let reason: string | null = null;

  // Course-specific personality mappings
  const mapping = COURSE_PERSONALITY_MAPPINGS[courseId];
  
  if (mapping) {
    const traitScores: Record<string, number> = { O, C, E, A, N: 100 - N };
    personalityFit = mapping.traits.reduce((sum, trait, idx) => {
      return sum + (traitScores[trait] || 50) * mapping.weights[idx];
    }, 0);
  } else {
    // Default: balanced approach
    personalityFit = O * 0.25 + C * 0.25 + E * 0.2 + A * 0.2 + (100 - N) * 0.1;
  }

  // Generate reason based on dominant trait
  if (O > 70 && ['cs', 'bca', 'engineering', 'design', 'animation'].includes(courseId)) {
    reason = 'Your curiosity suits technical/creative fields';
  } else if (E > 70 && ['bba', 'dm', 'finance', 'journalism'].includes(courseId)) {
    reason = 'Your outgoing nature fits business/communication roles';
  } else if (A > 70 && ['medical', 'pharmacy', 'psychology'].includes(courseId)) {
    reason = 'Your empathy suits healthcare careers';
  } else if (C > 75 && ['bcom', 'ca'].includes(courseId)) {
    reason = 'Your attention to detail suits accounting';
  }

  return { score: personalityFit, reason };
};

/**
 * Generate course recommendations from assessment results
 */
export const generateCourseRecommendations = (
  results: AssessmentResults
): CourseRecommendation[] => {
  try {
    const riasecScores = results.riasec?.scores || {};
    const aptitudeScores = results.aptitude?.scores || {};
    const bigFive = results.bigFive || {};

    // Get all courses from all categories
    const allCourses = [
      ...STREAMS_BY_CATEGORY.science,
      ...STREAMS_BY_CATEGORY.commerce,
      ...STREAMS_BY_CATEGORY.arts,
    ];

    // Calculate match scores for each course
    const courseMatches = allCourses.map(course => {
      const { score, reasons } = calculateCourseMatchScore(
        course,
        riasecScores,
        aptitudeScores,
        bigFive
      );

      // Determine category
      const category = STREAMS_BY_CATEGORY.science.find(s => s.id === course.id)
        ? 'Science'
        : STREAMS_BY_CATEGORY.commerce.find(s => s.id === course.id)
        ? 'Commerce'
        : 'Arts';

      return {
        courseId: course.id,
        title: course.label,
        courseName: course.label,
        matchScore: score,
        matchLevel: getMatchLevel(score),
        reasons,
        matchReasons: reasons,
        category,
      } as CourseRecommendation;
    });

    // Sort by match score and return top 5
    return courseMatches
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 5);
  } catch (error) {
    return [];
  }
};

/**
 * Transform adaptive aptitude results to standard format
 */
export const transformAdaptiveResults = (
  adaptiveResults: any
): AssessmentResults['adaptiveAptitude'] => {
  if (!adaptiveResults) return undefined;

  return {
    aptitudeLevel: adaptiveResults.aptitudeLevel,
    confidenceTag: adaptiveResults.confidenceTag,
    tier: adaptiveResults.tier,
    overallAccuracy: adaptiveResults.overallAccuracy,
    accuracyBySubtag: adaptiveResults.accuracyBySubtag,
    pathClassification: adaptiveResults.pathClassification,
    totalQuestions: adaptiveResults.totalQuestions,
    totalCorrect: adaptiveResults.totalCorrect,
  };
};

/**
 * Enhance aptitude scores with adaptive test results
 */
export const enhanceAptitudeWithAdaptive = (
  aptitude: AssessmentResults['aptitude'],
  adaptiveResults: any
): AssessmentResults['aptitude'] => {
  if (!aptitude || !adaptiveResults) return aptitude;

  const enhanced = { ...aptitude };
  enhanced.adaptiveLevel = adaptiveResults.aptitudeLevel;
  enhanced.adaptiveConfidence = adaptiveResults.confidenceTag;

  // Map adaptive subtag accuracy to aptitude categories
  if (adaptiveResults.accuracyBySubtag && enhanced.scores) {
    const subtagMapping: Record<string, string> = {
      numerical_reasoning: 'numerical',
      logical_reasoning: 'abstract',
      verbal_reasoning: 'verbal',
      spatial_reasoning: 'spatial',
      data_interpretation: 'numerical',
      pattern_recognition: 'abstract',
    };

    Object.entries(adaptiveResults.accuracyBySubtag).forEach(([subtag, data]: [string, any]) => {
      const category = subtagMapping[subtag];
      if (category && enhanced.scores?.[category]) {
        enhanced.scores[category].adaptiveAccuracy = data.accuracy;
      }
    });
  }

  return enhanced;
};
