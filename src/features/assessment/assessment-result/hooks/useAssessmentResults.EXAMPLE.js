/**
 * EXAMPLE: useAssessmentResults Hook with Transformation Integration
 * 
 * This is an example showing how to integrate the transformation service
 * into your existing useAssessmentResults hook.
 * 
 * Copy the relevant sections into your actual useAssessmentResults.js file
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';

// ✅ NEW: Import transformation service
import { 
  transformAssessmentResults, 
  validateTransformedResults 
} from '../../../../services/assessmentResultTransformer';

export const useAssessmentResults = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [gradeLevel, setGradeLevel] = useState(null);
  
  const navigate = useNavigate();
  const { resultId } = useParams();

  /**
   * Fetch assessment results from database
   */
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch result from database
      const { data: dbResult, error: resultError } = await supabase
        .from('personal_assessment_results')
        .select(`
          *,
          personal_assessment_attempts!inner(
            student_id,
            stream_id,
            grade_level,
            started_at,
            completed_at
          )
        `)
        .eq('id', resultId)
        .eq('student_id', user.id)
        .single();

      if (resultError) {
        throw new Error('Failed to fetch assessment results');
      }

      if (!dbResult) {
        throw new Error('Assessment result not found');
      }

      // Transform database result to PDF-compatible format
      const transformedResult = transformAssessmentResults(dbResult);

      // Validate transformed result
      const validation = validateTransformedResults(transformedResult);

      // Handle validation errors
      if (!validation.isValid) {
        setValidationWarnings([
          ...validation.errors,
          ...validation.warnings
        ]);
        
        // Still set results but show warnings
        setResults(transformedResult);
      } else if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
        setResults(transformedResult);
      } else {
        setValidationWarnings([]);
        setResults(transformedResult);
      }

      // Fetch student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!studentError && student) {
        setStudentInfo(student);
      }

      // Set grade level
      setGradeLevel(dbResult.grade_level || dbResult.personal_assessment_attempts?.grade_level);

      setLoading(false);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /**
   * Retry fetching results (useful if initial fetch had issues)
   */
  const handleRetry = async () => {
    setRetrying(true);
    await fetchResults();
    setRetrying(false);
  };

  /**
   * Regenerate AI analysis if needed
   */
  const regenerateAnalysis = async () => {
    try {
      setRetrying(true);

      // Call backend to regenerate AI analysis
      const { data, error } = await supabase.functions.invoke('regenerate-assessment-analysis', {
        body: { resultId }
      });

      if (error) throw error;

      // Refresh results
      await fetchResults();

    } catch (err) {
      setError(err.message);
    } finally {
      setRetrying(false);
    }
  };

  // Fetch results on mount
  useEffect(() => {
    if (resultId) {
      fetchResults();
    }
  }, [resultId]);

  return {
    results,
    loading,
    error,
    retrying,
    validationWarnings,
    studentInfo,
    gradeLevel,
    handleRetry,
    regenerateAnalysis,
    navigate
  };
};

/**
 * EXAMPLE: Alternative approach - Transform on result generation
 * 
 * If you prefer to transform during result generation instead of on fetch,
 * use this approach in your result generation service
 */

export const generateAndStoreResult = async (attemptId) => {
  try {
    // 1. Calculate scores from responses
    const scores = await calculateScoresFromResponses(attemptId);
    
    // 2. Generate AI analysis
    const aiAnalysis = await generateAIAnalysis(attemptId, scores);
    
    // 3. Structure data for database (keep original format)
    const dbResultData = {
      attempt_id: attemptId,
      student_id: scores.studentId,
      grade_level: scores.gradeLevel,
      
      // Store in database format
      riasec_scores: scores.riasec.scores,
      top_interests: scores.riasec.topThree,
      strengths_scores: scores.strengths.scores,
      top_strengths: scores.strengths.top,
      aptitude_scores: scores.aptitude, // Store as {taskType: {ease, enjoyment}}
      personality_scores: scores.bigFive,
      work_values_scores: scores.workValues,
      knowledge_score: scores.knowledge?.score,
      knowledge_percentage: scores.knowledge?.percentage,
      employability_score: scores.employability,
      
      // Store AI analysis in structured format
      gemini_analysis: {
        analysis: aiAnalysis.analysis,
        career_recommendations: aiAnalysis.careerRecommendations,
        skill_development: aiAnalysis.skillDevelopment,
        next_steps: aiAnalysis.nextSteps
      },
      
      // Store simple arrays for backward compatibility
      career_recommendations: aiAnalysis.careerRecommendations.map(c => c.title),
      skill_gaps: aiAnalysis.skillDevelopment.map(s => s.name || s),
      
      learning_styles: aiAnalysis.learningStyles || [],
      work_preferences: aiAnalysis.workPreferences || [],
      
      generated_at: new Date().toISOString()
    };
    
    // 4. Insert into database
    const { data: dbResult, error } = await supabase
      .from('personal_assessment_results')
      .insert(dbResultData)
      .select()
      .single();
    
    if (error) throw error;
    
    // 5. ✅ Transform for immediate use (optional)
    const transformedResult = transformAssessmentResults(dbResult);
    
    return {
      success: true,
      result: transformedResult,
      raw: dbResult
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Helper function to calculate scores from responses
 */
const calculateScoresFromResponses = async (attemptId) => {
  // Fetch attempt with responses
  const { data: attempt, error } = await supabase
    .from('personal_assessment_attempts')
    .select(`
      *,
      personal_assessment_responses(
        *,
        personal_assessment_questions(*)
      )
    `)
    .eq('id', attemptId)
    .single();

  if (error) throw error;

  // Calculate RIASEC scores
  const riasecScores = calculateRIASECScores(attempt.personal_assessment_responses);
  
  // Calculate strengths scores
  const strengthsScores = calculateStrengthsScores(attempt.personal_assessment_responses);
  
  // Calculate aptitude scores (if applicable)
  const aptitudeScores = attempt.grade_level !== 'middle' 
    ? calculateAptitudeScores(attempt.personal_assessment_responses)
    : null;
  
  // Calculate personality scores (if applicable)
  const bigFiveScores = attempt.grade_level === 'after12' || attempt.grade_level === 'college'
    ? calculateBigFiveScores(attempt.personal_assessment_responses)
    : null;
  
  // Calculate work values (if applicable)
  const workValuesScores = attempt.grade_level === 'after12' || attempt.grade_level === 'college'
    ? calculateWorkValuesScores(attempt.personal_assessment_responses)
    : null;
  
  // Calculate knowledge score (if applicable)
  const knowledgeScore = attempt.grade_level === 'after12'
    ? calculateKnowledgeScore(attempt.personal_assessment_responses)
    : null;
  
  // Calculate employability score (if applicable)
  const employabilityScore = attempt.grade_level === 'college'
    ? calculateEmployabilityScore(attempt.personal_assessment_responses)
    : null;

  return {
    studentId: attempt.student_id,
    gradeLevel: attempt.grade_level,
    riasec: riasecScores,
    strengths: strengthsScores,
    aptitude: aptitudeScores,
    bigFive: bigFiveScores,
    workValues: workValuesScores,
    knowledge: knowledgeScore,
    employability: employabilityScore
  };
};

/**
 * Helper function to generate AI analysis
 */
const generateAIAnalysis = async (attemptId, scores) => {
  // Call Gemini API or your AI service
  const response = await fetch('/api/generate-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attemptId,
      scores
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate AI analysis');
  }

  return await response.json();
};

// Placeholder calculation functions (implement based on your logic)
const calculateRIASECScores = (responses) => {
  // Your RIASEC calculation logic
  return { scores: {}, topThree: [] };
};

const calculateStrengthsScores = (responses) => {
  // Your strengths calculation logic
  return { scores: {}, top: [] };
};

const calculateAptitudeScores = (responses) => {
  // Your aptitude calculation logic
  return {};
};

const calculateBigFiveScores = (responses) => {
  // Your Big Five calculation logic
  return {};
};

const calculateWorkValuesScores = (responses) => {
  // Your work values calculation logic
  return {};
};

const calculateKnowledgeScore = (responses) => {
  // Your knowledge score calculation logic
  return { score: 0, percentage: 0 };
};

const calculateEmployabilityScore = (responses) => {
  // Your employability calculation logic
  return 0;
};

export default useAssessmentResults;
