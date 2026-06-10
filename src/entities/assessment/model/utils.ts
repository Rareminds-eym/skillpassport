/**
 * Assessment Entity - Utility Functions
 */

import type {
  GradeLevel,
  AssessmentResults,
  RIASECScores,
  AptitudeScores,
  CareerCluster,
  AssessmentAttempt
} from '@/shared/types';

// ============================================================================
// Grade Level Utilities
// ============================================================================

export function getGradeLevelDisplayName(level: GradeLevel): string {
  const displayNames: Record<GradeLevel, string> = {
    middle: 'Middle School (Grades 6-8)',
    highschool: 'High School (Grades 9-10)',
    higher_secondary: 'Higher Secondary (Grades 11-12)',
    after10: 'After 10th Grade',
    after12: 'After 12th Grade',
    college: 'College/University'
  };
  return displayNames[level] || level;
}

export function getGradeRange(level: GradeLevel): { min: number; max: number } | null {
  const ranges: Record<GradeLevel, { min: number; max: number } | null> = {
    middle: { min: 6, max: 8 },
    highschool: { min: 9, max: 10 },
    higher_secondary: { min: 11, max: 12 },
    after10: null,
    after12: null,
    college: null
  };
  return ranges[level];
}

// ============================================================================
// RIASEC Utilities
// ============================================================================


export function getRIASECCodeName(code: string): string {
  const names: Record<string, string> = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional'
  };
  return names[code] || code;
}

export function getRIASECCodeDescription(code: string): string {
  const descriptions: Record<string, string> = {
    R: 'Prefers hands-on, practical work with tools, machines, or physical activities',
    I: 'Enjoys analytical thinking, research, and solving complex problems',
    A: 'Values creativity, self-expression, and working in unstructured environments',
    S: 'Likes helping, teaching, and working with people',
    E: 'Enjoys leading, persuading, and managing projects or businesses',
    C: 'Prefers organized, detail-oriented work with clear procedures'
  };
  return descriptions[code] || '';
}

// ============================================================================
// Aptitude Utilities
// ============================================================================

export function getAptitudeDisplayName(aptitudeKey: string): string {
  const displayNames: Record<string, string> = {
    numerical: 'Numerical Reasoning',
    verbal: 'Verbal Reasoning',
    abstract: 'Abstract Reasoning',
    spatial: 'Spatial Reasoning',
    clerical: 'Clerical Aptitude'
  };
  return displayNames[aptitudeKey] || aptitudeKey;
}

export function getTopAptitudes(scores: AptitudeScores, count: number = 3): string[] {
  const entries = Object.entries(scores)
    .filter(([_, score]) => score !== undefined)
    .sort(([_, a], [__, b]) => (b?.percentage || 0) - (a?.percentage || 0));
  
  return entries.slice(0, count).map(([key]) => key);
}

// ============================================================================
// Career Fit Utilities
// ============================================================================

export function getCareerFitLevel(matchScore: number): 'High' | 'Medium' | 'Low' {
  if (matchScore >= 80) return 'High';
  if (matchScore >= 60) return 'Medium';
  return 'Low';
}

export function sortCareerClustersByMatch(clusters: CareerCluster[]): CareerCluster[] {
  return [...clusters].sort((a, b) => b.matchScore - a.matchScore);
}

export function filterHighMatchCareers(
  clusters: CareerCluster[],
  threshold: number = 70
): CareerCluster[] {
  return clusters.filter(c => c.matchScore >= threshold);
}

// ============================================================================
// Assessment Results Utilities
// ============================================================================

export function hasCompletedAssessment(results: AssessmentResults | null): boolean {
  if (!results) return false;
  return !!(results.riasec || results.aptitude || results.careerFit);
}

export function getAssessmentCompletionPercentage(results: AssessmentResults | null): number {
  if (!results) return 0;
  
  const sections = [
    'riasec',
    'aptitude',
    'bigFive',
    'employability',
    'careerFit'
  ];
  
  const completedSections = sections.filter(section => 
    results[section as keyof AssessmentResults] !== undefined
  ).length;
  
  return Math.round((completedSections / sections.length) * 100);
}

export function extractKeyInsights(results: AssessmentResults): string[] {
  const insights: string[] = [];
  
  if (results.riasec?.topThree && results.riasec.topThree.length > 0) {
    const topCode = results.riasec.topThree[0];
    insights.push(`Strong ${getRIASECCodeName(topCode)} interests`);
  }
  
  if (results.aptitude?.scores) {
    const topAptitudes = getTopAptitudes(results.aptitude.scores, 2);
    if (topAptitudes.length > 0) {
      insights.push(`Excels in ${getAptitudeDisplayName(topAptitudes[0])}`);
    }
  }
  
  if (results.careerFit?.primaryFit) {
    insights.push(`Best fit: ${results.careerFit.primaryFit.title}`);
  }
  
  if (results.streamRecommendation?.recommendedStream) {
    insights.push(`Recommended: ${results.streamRecommendation.recommendedStream}`);
  }
  
  return insights;
}

// ============================================================================
// Assessment Attempt Utilities
// ============================================================================

export function calculateAttemptDuration(attempt: AssessmentAttempt): number {
  if (!attempt.completed_at) return 0;
  
  const start = new Date(attempt.started_at).getTime();
  const end = new Date(attempt.completed_at).getTime();
  
  return Math.round((end - start) / 1000 / 60); // Duration in minutes
}

export function isAttemptExpired(attempt: AssessmentAttempt, expiryHours: number = 24): boolean {
  if (attempt.status !== 'in_progress') return false;
  
  const start = new Date(attempt.started_at).getTime();
  const now = Date.now();
  const hoursPassed = (now - start) / 1000 / 60 / 60;
  
  return hoursPassed > expiryHours;
}

export function canResumeAttempt(attempt: AssessmentAttempt): boolean {
  return attempt.status === 'in_progress' && !isAttemptExpired(attempt);
}

// ============================================================================
// Score Formatting Utilities
// ============================================================================

export function formatScore(score: number, maxScore: number): string {
  return `${score}/${maxScore}`;
}

export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100 * 10) / 10;
}

// ============================================================================
// Time Formatting Utilities
// ============================================================================

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
