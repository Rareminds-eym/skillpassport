/**
 * Hook to fetch and process assessment-based training recommendations
 */
import { useState, useEffect } from 'react';
import { getLatestResult } from '../services/assessmentService';

export const useAssessmentRecommendations = (studentId, enabled = true) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId || !enabled) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getLatestResult(studentId);
        
        if (!result) {
          setRecommendations(null);
          setLoading(false);
          return;
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
  }, [studentId, enabled]);

  return {
    recommendations,
    loading,
    error,
    hasAssessment: !!recommendations,
  };
};
