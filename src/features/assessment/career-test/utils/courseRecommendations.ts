/**
 * Course Recommendations Utility
 * 
 * Generates course recommendations based on assessment results
 * using RIASEC, aptitude, and personality matching.
 * 
 * @module features/assessment/career-test/utils/courseRecommendations
 */

import { STREAMS_BY_CATEGORY, getAllStreams, type Stream } from '../config/streams';

interface RIASECScores {
  R?: number;
  I?: number;
  A?: number;
  S?: number;
  E?: number;
  C?: number;
}

interface AptitudeScore {
  percentage?: number;
  correct?: number;
  total?: number;
}

interface BigFiveScores {
  O?: number; // Openness
  C?: number; // Conscientiousness
  E?: number; // Extraversion
  A?: number; // Agreeableness
  N?: number; // Neuroticism
}

interface AnalysisResults {
  riasec?: {
    scores?: RIASECScores;
    maxScore?: number;
    topThree?: string[];
  };
  aptitude?: {
    scores?: Record<string, AptitudeScore>;
    topStrengths?: string[];
  };
  bigFive?: BigFiveScores;
}

interface CourseRecommendation {
  courseId: string;
  courseName: string;
  matchScore: number;
  matchLevel: 'Excellent' | 'Good' | 'Fair' | 'Low';
  reasons: string[];
  category: string;
}

/**
 * Generate course recommendations based on assessment results
 */
export const generateCourseRecommendations = (
  analysisResults: AnalysisResults
): CourseRecommendation[] => {
  try {
    const allCourses = getAllStreams();
    if (allCourses.length === 0) return [];

    // Extract scores from analysis results
    const riasec = analysisResults?.riasec || {};
    const riasecScores = riasec.scores || {};
    const riasecMaxScore = riasec.maxScore || 20;
    const riasecTopThree = riasec.topThree || [];

    const aptitudeResults = analysisResults?.aptitude || {};
    const aptitudeScores = aptitudeResults.scores || {};
    const aptitudeTopStrengths = aptitudeResults.topStrengths || [];

    const bigFive = analysisResults?.bigFive || {};

    // Calculate match scores for each course
    const courseMatches = allCourses.map((course) => {
      let matchScore = 0;
      const matchReasons: string[] = [];

      // RIASEC matching (40% weight)
      if (course.riasec && course.riasec.length > 0) {
        let riasecMatchPoints = 0;

        course.riasec.forEach((type) => {
          const typeUpper = type.toUpperCase();
          const score = riasecScores[typeUpper as keyof RIASECScores] || 0;
          const percentage = (score / riasecMaxScore) * 100;

          if (riasecTopThree.includes(typeUpper)) {
            riasecMatchPoints += percentage * 1.5;
          } else {
            riasecMatchPoints += percentage;
          }
        });

        const avgRiasecMatch = riasecMatchPoints / course.riasec.length;
        matchScore += avgRiasecMatch * 0.4;

        const matchingTopTypes = course.riasec.filter((type) =>
          riasecTopThree.includes(type.toUpperCase())
        );
        if (matchingTopTypes.length > 0) {
          matchReasons.push(`Aligns with your ${matchingTopTypes.join(', ')} interests`);
        }
      }

      // Aptitude matching (35% weight)
      if (course.aptitudeStrengths && course.aptitudeStrengths.length > 0) {
        let aptitudeMatchPoints = 0;

        course.aptitudeStrengths.forEach((strength) => {
          const strengthLower = strength.toLowerCase();
          const scoreData = aptitudeScores[strengthLower];
          const percentage = scoreData?.percentage || 0;

          const isTopStrength = aptitudeTopStrengths.some(
            (s) =>
              s.toLowerCase().includes(strengthLower) ||
              strengthLower.includes(s.toLowerCase())
          );

          if (isTopStrength) {
            aptitudeMatchPoints += percentage * 1.3;
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
      const O = ((bigFive.O || 3) / 5) * 100;
      const C = ((bigFive.C || 3) / 5) * 100;
      const E = ((bigFive.E || 3) / 5) * 100;
      const A = ((bigFive.A || 3) / 5) * 100;
      const N = ((bigFive.N || 3) / 5) * 100;

      let personalityFit = 50;

      // Adjust based on course type
      if (['cs', 'bca', 'engineering'].includes(course.id)) {
        personalityFit = O * 0.4 + C * 0.4 + (100 - N) * 0.2;
        if (O > 70) matchReasons.push('Your curiosity suits technical fields');
      } else if (['bba', 'dm', 'finance'].includes(course.id)) {
        personalityFit = E * 0.4 + C * 0.3 + A * 0.3;
        if (E > 70) matchReasons.push('Your outgoing nature fits business roles');
      } else if (['design', 'finearts', 'animation'].includes(course.id)) {
        personalityFit = O * 0.5 + E * 0.2 + (100 - C) * 0.3;
        if (O > 75) matchReasons.push('Your creativity aligns with design fields');
      } else if (['medical', 'pharmacy', 'psychology'].includes(course.id)) {
        personalityFit = A * 0.4 + C * 0.4 + (100 - N) * 0.2;
        if (A > 70) matchReasons.push('Your empathy suits healthcare careers');
      } else if (['law', 'journalism'].includes(course.id)) {
        personalityFit = E * 0.35 + O * 0.35 + C * 0.3;
      } else if (['bcom', 'ca'].includes(course.id)) {
        personalityFit = C * 0.5 + (100 - N) * 0.3 + A * 0.2;
        if (C > 75) matchReasons.push('Your attention to detail suits accounting');
      } else {
        personalityFit = O * 0.25 + C * 0.25 + E * 0.2 + A * 0.2 + (100 - N) * 0.1;
      }

      matchScore += personalityFit * 0.25;
      matchScore = Math.min(100, Math.max(0, matchScore));

      // Determine category
      const category = STREAMS_BY_CATEGORY.science.find((s) => s.id === course.id)
        ? 'Science'
        : STREAMS_BY_CATEGORY.commerce.find((s) => s.id === course.id)
        ? 'Commerce'
        : 'Arts';

      return {
        courseId: course.id,
        courseName: course.label,
        matchScore: Math.round(matchScore),
        matchLevel: (matchScore >= 75
          ? 'Excellent'
          : matchScore >= 60
          ? 'Good'
          : matchScore >= 45
          ? 'Fair'
          : 'Low') as CourseRecommendation['matchLevel'],
        reasons: matchReasons.slice(0, 3),
        category,
      };
    });

    // Sort by match score and return top 5
    return courseMatches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  } catch (error) {
    return [];
  }
};

export default generateCourseRecommendations;
