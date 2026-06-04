import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NavigateFunction } from 'react-router-dom';
import * as assessmentService from '../api/assessmentService';
import { transformAssessmentResults } from '../api/assessmentResultTransformer';

/**
 * useAssessmentResults
 *
 * Backend-first result loader: store → hook → service → Pages Function.
 * The hook holds UI state only. All data access goes through
 * assessmentService.getResult() (GET /api/assessment/result), which verifies
 * ownership and returns the stored result row, attempt metadata, and learner info.
 * No direct Supabase calls, no AI regeneration.
 */

// ===== TYPE DEFINITIONS =====

interface LearnerInfo {
  name: string;
  regNo: string;
  rollNumberType: string;
  college: string;
  school: string;
  stream: string;
  grade: string;
  branchField: string;
  courseName: string;
}

interface RiasecScores {
  [key: string]: number;
}

interface Riasec {
  scores: RiasecScores;
  topThree?: string[];
  code?: string;
  maxScore?: number;
}

interface BigFive {
  [trait: string]: number;
}

interface WorkValues {
  [value: string]: number;
}

interface EmployabilityScores {
  [skill: string]: number;
}

interface Employability {
  scores?: EmployabilityScores;
  readiness?: string;
  level?: string;
}

interface Knowledge {
  score: number;
  percentage: number;
  details?: any;
  totalQuestions?: number;
}

interface CareerCluster {
  title: string;
  matchScore: number;
  description: string;
  roles?: string[];
  skills?: string[];
  salary?: string | null;
  growthPotential?: string;
  education?: string | null;
  index?: number;
}

interface CareerFit {
  clusters: CareerCluster[];
  degreePrograms?: any[];
}

interface SkillGap {
  priorityA?: any[];
  gaps?: any[];
  strengths?: any[];
  currentStrengths?: any[];
}

interface Roadmap {
  steps?: any[];
  projects?: any[];
}

interface AttemptData {
  gradeLevel?: string;
  [key: string]: any;
}

interface AptitudeResults {
  scores?: any;
  topStrengths?: string[];
  overallScore?: number | null;
  adaptiveTest?: any;
  adaptiveLevel?: any;
}

interface TransformedResults {
  riasec?: Riasec;
  bigFive?: BigFive;
  workValues?: WorkValues;
  employability?: Employability;
  knowledge?: Knowledge;
  careerFit?: CareerFit;
  skillGap?: SkillGap;
  roadmap?: Roadmap;
  aptitude?: AptitudeResults;
  gemini_results?: any;
  attempt_data?: AttemptData | null;
  adaptiveAptitudeResults?: any;
}

interface ServicePayload {
  hasResult?: boolean;
  result?: any;
  attempt?: AttemptData;
  learnerInfo?: LearnerInfo;
}

interface LearnerAcademicData {
  subjectMarks: any[];
  projects: any[];
  experiences: any[];
  education: any[];
}

interface UseAssessmentResultsReturn {
  results: TransformedResults | null;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  retryAttemptCount: number;
  gradeLevel: string;
  monthsInGrade: null;
  learnerInfo: LearnerInfo;
  learnerAcademicData: LearnerAcademicData;
  validationWarnings: string[];
  handleRetry: () => void;
  validateResults: () => string[];
  navigate: NavigateFunction;
  attemptData: AttemptData | null;
  resultData: TransformedResults | null;
}

// ===== CONSTANTS =====

const DEFAULT_LEARNER_INFO: LearnerInfo = {
  name: '—',
  regNo: '—',
  rollNumberType: 'school',
  college: '—',
  school: '—',
  stream: '—',
  grade: '—',
  branchField: '—',
  courseName: '—',
};

// ===== MAIN HOOK =====

export const useAssessmentResults = (): UseAssessmentResultsReturn => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [results, setResults] = useState<TransformedResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [gradeLevel, setGradeLevel] = useState<string>('after12');
  const [learnerInfo, setLearnerInfo] = useState<LearnerInfo>(DEFAULT_LEARNER_INFO);

  const attemptId = searchParams.get('attemptId');

  const loadResults = useCallback(async (isRetry: boolean = false): Promise<void> => {
    if (!attemptId) {
      setError('No attempt specified.');
      setLoading(false);
      return;
    }

    if (isRetry) setRetrying(true);
    setLoading(true);
    setError(null);

    try {
      const payload = await assessmentService.getResult(attemptId) as ServicePayload;

      if (payload?.attempt?.gradeLevel) setGradeLevel(payload.attempt.gradeLevel);
      if (payload?.learnerInfo) setLearnerInfo(payload.learnerInfo);

      if (!payload?.hasResult || !payload.result) {
        setResults(null);
        setError('Your assessment analysis is not ready yet. Please try again shortly.');
        return;
      }

      const transformed = transformAssessmentResults(payload.result) as TransformedResults;
      transformed.gemini_results = payload.result.gemini_results || null;
      transformed.attempt_data = payload.attempt || null;
      setResults(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assessment results.');
      setResults(null);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadResults(false);
  }, [loadResults]);

  const handleRetry = useCallback((): void => {
    loadResults(true);
  }, [loadResults]);

  const monthsInGrade = null;

  // Only check fields that affect display; varies by grade level.
  const validateResults = useCallback((): string[] => {
    if (!results) return [];
    const missing: string[] = [];
    const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap } = results;

    const hasScores = (obj: any): boolean => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
    const hasRiasec = hasScores(riasec?.scores);

    if (gradeLevel === 'middle' || gradeLevel === 'highschool' || gradeLevel === 'higher_secondary') {
      if (!hasRiasec) missing.push('Interest Explorer');
      if (gradeLevel === 'highschool' || gradeLevel === 'after10' || gradeLevel === 'higher_secondary') {
        const hasAdaptive = results.adaptiveAptitudeResults ||
          (results.gemini_results && results.gemini_results.adaptiveAptitudeResults) ||
          (results.aptitude && (results.aptitude.adaptiveTest || results.aptitude.adaptiveLevel));
        if (!hasAdaptive) missing.push('Adaptive Aptitude Test');
      }
      return missing;
    }

    if (!hasRiasec) missing.push('RIASEC Interests');
    if (!hasScores(bigFive)) missing.push('Big Five Personality');
    if (!hasScores(workValues)) missing.push('Work Values');
    if (!employability || !hasScores(employability.scores)) missing.push('Employability Skills');
    if (!knowledge) missing.push('Knowledge Assessment');
    if (!careerFit || !careerFit.clusters || careerFit.clusters.length === 0) missing.push('Career Fit');
    if (!skillGap) missing.push('Skill Gap Analysis');
    if (!roadmap) missing.push('Action Roadmap');
    return missing;
  }, [results, gradeLevel]);

  return useMemo((): UseAssessmentResultsReturn => ({
    results,
    loading,
    error,
    retrying,
    retryAttemptCount: 0,
    gradeLevel,
    monthsInGrade,
    learnerInfo,
    learnerAcademicData: { subjectMarks: [], projects: [], experiences: [], education: [] },
    validationWarnings: [],
    handleRetry,
    validateResults,
    navigate,
    attemptData: results?.attempt_data || null,
    resultData: results,
  }), [results, loading, error, retrying, gradeLevel, monthsInGrade, learnerInfo, handleRetry, validateResults, navigate]);
};
