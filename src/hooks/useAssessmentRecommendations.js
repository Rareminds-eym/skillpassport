/**
 * Hook to fetch and process assessment-based training recommendations
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getLatestResult, getInProgressAttempt } from '../services/assessmentService';

export const useAssessmentRecommendations = (studentIdOrUserId, enabled = true) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [hasInProgressAssessment, setHasInProgressAssessment] = useState(false);
  const [inProgressAttempt, setInProgressAttempt] = useState(null);

  useEffect(() => {
    if (!studentIdOrUserId || !enabled) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check for in-progress assessment first
        // getInProgressAttempt expects student.id (from students table)
        try {
          const inProgress = await getInProgressAttempt(studentIdOrUserId);
          if (inProgress) {
            setHasInProgressAssessment(true);
            setInProgressAttempt(inProgress);
          } else {
            setHasInProgressAssessment(false);
            setInProgressAttempt(null);
          }
        } catch (err) {
          console.warn('Error checking in-progress assessment:', err);
          setHasInProgressAssessment(false);
        }

        // getLatestResult can handle both student.id and user.id
        // It will try to find the student record if needed
        let result = await getLatestResult(studentIdOrUserId);
        
        // If no result found and we might have been passed student.id instead of user.id,
        // try querying directly with student_id
        if (!result) {
          try {
            const { data: directResult } = await supabase
              .from('personal_assessment_results')
              .select('*')
              .eq('student_id', studentIdOrUserId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (directResult) {
              result = directResult;
              console.log('✅ Found assessment result using student_id directly');
            }
          } catch (directErr) {
            console.warn('Direct student_id lookup also failed:', directErr);
          }
        }
        
        if (!result) {
          setRecommendations(null);
          setHasCompletedAssessment(false);
          setLoading(false);
          return;
        }
        
        // Mark as having completed assessment if result exists with completed status
        if (result.status === 'completed') {
          setHasCompletedAssessment(true);
        }

        // Extract recommendations from assessment results
        const skillGap = result.skill_gap || {};
        const careerFit = result.career_fit || {};
        const roadmap = result.roadmap || {};
        const geminiResults = result.gemini_results || {};

        // Build comprehensive recommendations
        const processedRecommendations = {
          // Primary recommended track
          recommendedTrack: skillGap.recommendedTrack || geminiResults.skillGap?.recommendedTrack,
          
          // Learning tracks with topics
          learningTracks: skillGap.learningTracks || geminiResults.skillGap?.learningTracks || [],
          
          // Courses by type (technical and soft skills) - NEW
          coursesByType: geminiResults.coursesByType || {
            technical: [],
            soft: []
          },
          
          // Career clusters (High fit careers)
          careerClusters: careerFit.clusters?.filter(c => c.fit === 'High') || 
                         geminiResults.careerFit?.clusters?.filter(c => c.fit === 'High') || [],
          
          // Priority skills to develop
          prioritySkills: [
            ...(skillGap.priorityA || geminiResults.skillGap?.priorityA || []),
            ...(skillGap.priorityB || geminiResults.skillGap?.priorityB || [])
          ],
          
          // Current strengths
          strengths: skillGap.currentStrengths || geminiResults.skillGap?.currentStrengths || [],
          
          // Certifications to pursue
          certifications: roadmap.exposure?.certifications || geminiResults.roadmap?.exposure?.certifications || [],
          
          // Projects to build
          projects: roadmap.projects || geminiResults.roadmap?.projects || [],
          
          // Overall career readiness
          readiness: result.employability_readiness,
          
          // RIASEC code for interest alignment
          riasecCode: result.riasec_code,
          
          // Top aptitude strengths
          aptitudeStrengths: result.profile_snapshot?.aptitudeStrengths || 
                            geminiResults.profileSnapshot?.aptitudeStrengths || [],
          
          // Assessment metadata
          assessmentDate: result.created_at,
          streamId: result.stream_id,
        };

        setRecommendations(processedRecommendations);
      } catch (err) {
        console.error('Error fetching assessment recommendations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [studentIdOrUserId, enabled]);

  return {
    recommendations,
    loading,
    error,
    // hasAssessment is true if there's a completed result, even without detailed recommendations
    hasAssessment: hasCompletedAssessment || !!recommendations,
    // New: check for in-progress assessment
    hasInProgressAssessment,
    inProgressAttempt,
  };
};
