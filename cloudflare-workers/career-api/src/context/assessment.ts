// Assessment Context Builder - Cloudflare Workers Version

import type { SupabaseClient } from '@supabase/supabase-js';
import { interpretBigFive, interpretRIASEC } from '../ai/riasec';
import type { AssessmentResults } from '../types/career-ai';

export async function buildAssessmentContext(
  supabase: SupabaseClient, 
  studentId: string
): Promise<AssessmentResults> {
  const defaultResult: AssessmentResults = {
    hasAssessment: false,
    riasecCode: '',
    riasecScores: {},
    riasecInterpretation: '',
    aptitudeScores: {},
    aptitudeOverall: 0,
    bigFiveScores: {},
    personalityInterpretation: '',
    employabilityScores: {},
    employabilityReadiness: '',
    careerFit: [],
    skillGaps: [],
    roadmap: null,
    overallSummary: '',
    coursesByType: { technical: [], soft: [] }
  };

  try {
    const { data: assessment, error } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() to return null instead of error when no rows found

    if (error || !assessment) {
      return defaultResult;
    }

    const riasecScores = assessment.riasec_scores || {};
    const bigFiveScores = assessment.bigfive_scores || {};
    const geminiResults = assessment.gemini_results || {};
    const coursesByType = geminiResults.coursesByType || { technical: [], soft: [] };

    return {
      hasAssessment: true,
      riasecCode: assessment.riasec_code || '',
      riasecScores,
      riasecInterpretation: interpretRIASEC(assessment.riasec_code, riasecScores),
      aptitudeScores: assessment.aptitude_scores || {},
      aptitudeOverall: assessment.aptitude_overall || 0,
      bigFiveScores,
      personalityInterpretation: interpretBigFive(bigFiveScores),
      employabilityScores: assessment.employability_scores || {},
      employabilityReadiness: assessment.employability_readiness || 'Not assessed',
      careerFit: assessment.career_fit || [],
      skillGaps: assessment.skill_gap || [],
      roadmap: assessment.roadmap,
      overallSummary: assessment.overall_summary || '',
      coursesByType
    };
  } catch (error) {
    console.error('Error in buildAssessmentContext:', error);
    return defaultResult;
  }
}
