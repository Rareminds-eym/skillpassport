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
  const [latestAttemptId, setLatestAttemptId] = useState(null);

  useEffect(() => {
    if (!studentIdOrUserId || !enabled) {
      console.log('⏸️ useAssessmentRecommendations: Skipping (studentId:', studentIdOrUserId, 'enabled:', enabled, ')');
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 useAssessmentRecommendations: Checking for student:', studentIdOrUserId);
        console.log('🔍 Type of studentIdOrUserId:', typeof studentIdOrUserId);

        // Check for in-progress assessment first
        // getInProgressAttempt expects student.id (from students table)
        try {
          console.log('🔍 Calling getInProgressAttempt with studentId:', studentIdOrUserId);
          const inProgress = await getInProgressAttempt(studentIdOrUserId);
          console.log('📊 getInProgressAttempt result:', inProgress);
          
          if (inProgress) {
            console.log('✅ Found in-progress attempt:', inProgress.id);
            setHasInProgressAssessment(true);
            setInProgressAttempt(inProgress);
          } else {
            console.log('❌ No in-progress attempt found');
            setHasInProgressAssessment(false);
            setInProgressAttempt(null);
          }
        } catch (err) {
          console.error('❌ Error checking in-progress assessment:', err);
          setHasInProgressAssessment(false);
        }

        // getLatestResult can handle both student.id and user.id
        let result = await getLatestResult(studentIdOrUserId);
        
        if (!result) {
          console.log('❌ No assessment result found');
          setRecommendations(null);
          setHasCompletedAssessment(false);
          setLoading(false);
          return;
        }
        
        // Mark as having completed assessment if result exists with completed status
        if (result.status === 'completed') {
          console.log('✅ Found completed assessment result');
          setHasCompletedAssessment(true);
        } else {
          console.log('❌ No completed assessment result found (status:', result.status, ')');
          setHasCompletedAssessment(false);
          setRecommendations(null);
          setLoading(false);
          return;
        }

        // Store the attempt_id for navigation
        if (result.attempt_id) {
          console.log('✅ Found attempt_id:', result.attempt_id);
          setLatestAttemptId(result.attempt_id);
        } else {
          console.warn('⚠️ Result found but no attempt_id');
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
    // hasAssessment is true ONLY if there's a completed result
    hasAssessment: hasCompletedAssessment,
    // New: check for in-progress assessment
    hasInProgressAssessment,
    inProgressAttempt,
    // Latest attempt ID for navigation to results page
    latestAttemptId,
  };
};
