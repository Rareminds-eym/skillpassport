import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const DEFAULT_LEARNER_INFO = {
  name: '—', regNo: '—', rollNumberType: 'school', college: '—',
  school: '—', stream: '—', grade: '—', branchField: '—', courseName: '—',
};

export const useAssessmentResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('after12');
  const [learnerInfo, setLearnerInfo] = useState(DEFAULT_LEARNER_INFO);

  const attemptId = searchParams.get('attemptId');

  const loadResults = useCallback(async (isRetry = false) => {
    if (!attemptId) {
      setError('No attempt specified.');
      setLoading(false);
      return;
    }

    if (isRetry) setRetrying(true);
    setLoading(true);
    setError(null);

    try {
      const payload = await assessmentService.getResult(attemptId);

      if (payload?.attempt?.gradeLevel) setGradeLevel(payload.attempt.gradeLevel);
      if (payload?.learnerInfo) setLearnerInfo(payload.learnerInfo);

      if (!payload?.hasResult || !payload.result) {
        setResults(null);
        setError('Your assessment analysis is not ready yet. Please try again shortly.');
        return;
      }

      const transformed = transformAssessmentResults(payload.result);
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

  const handleRetry = useCallback(() => loadResults(true), [loadResults]);

  const monthsInGrade = null;

  // Only check fields that affect display; varies by grade level.
  const validateResults = useCallback(() => {
    if (!results) return [];
    const missing = [];
    const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap } = results;

    const hasScores = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0;
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

  return useMemo(() => ({
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
