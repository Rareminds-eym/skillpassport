import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  getPipelineCandidatesByStage,
  getPipelineCandidatesWithFilters
} from '../services/pipelineService';
// @ts-ignore
import AppliedJobsService from '../services/AppliedJobsService';
import { recruiterInsights } from '../features/recruiter-copilot/services/recruiterInsights';
import { PipelineFilters, PipelineSortOptions } from '../types/recruiter';

export interface PipelineCandidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  dept: string;
  college: string;
  location: string;
  skills: string[];
  ai_score_overall: number;
  last_updated: string;
  created_at?: string;
  student_id: number;
  stage: string;
  source: string;
  next_action?: string;
  next_action_date?: string;
  added_at?: string;
}

export interface PipelineData {
  sourced: PipelineCandidate[];
  screened: PipelineCandidate[];
  interview_1: PipelineCandidate[];
  interview_2: PipelineCandidate[];
  offer: PipelineCandidate[];
  hired: PipelineCandidate[];
}

const AI_CACHE_KEY = 'pipelines_ai_recommendations_cache_v2'; // Updated cache key to invalidate old cache
const AI_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const initialPipelineData: PipelineData = {
  sourced: [],
  screened: [],
  interview_1: [],
  interview_2: [],
  offer: [],
  hired: []
};

export const usePipelineData = (
  selectedJob: number | null,
  filters: PipelineFilters,
  sortOptions: PipelineSortOptions
) => {
  const [pipelineData, setPipelineData] = useState<PipelineData>(initialPipelineData);
  const [loading, setLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [allPipelineCandidatesForAI, setAllPipelineCandidatesForAI] = useState<any[]>([]);

  const mapPipelineCandidate = (pc: any): PipelineCandidate => ({
    id: pc.id,
    name: pc.candidate_name || 'N/A',
    email: pc.candidate_email || '',
    phone: pc.candidate_phone || '',
    dept: pc.students?.dept || 'N/A',
    college: pc.students?.college || 'N/A',
    location: pc.students?.location || 'N/A',
    skills: Array.isArray(pc.students?.skills) ? pc.students.skills : [],
    ai_score_overall: pc.students?.ai_score_overall || 0,
    last_updated: pc.updated_at || pc.created_at,
    student_id: pc.student_id,
    stage: pc.stage,
    source: pc.source,
    next_action: pc.next_action,
    next_action_date: pc.next_action_date,
    added_at: pc.added_at || pc.created_at
  });

  const loadPipelineCandidates = useCallback(async () => {
    if (!selectedJob) return;

    setLoading(true);
    
    const hasActiveFilters = 
      filters.stages.length > 0 ||
      filters.skills.length > 0 ||
      filters.departments.length > 0 ||
      filters.locations.length > 0 ||
      filters.sources.length > 0 ||
      filters.aiScoreRange.min !== undefined ||
      filters.aiScoreRange.max !== undefined ||
      filters.nextActionTypes.length > 0 ||
      filters.hasNextAction !== null ||
      filters.assignedTo.length > 0;

    const stages = ['sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired'];
    const newData: PipelineData = { ...initialPipelineData };

    try {
      if (hasActiveFilters || sortOptions.field !== 'updated_at' || sortOptions.direction !== 'desc') {
        const { data, error } = await getPipelineCandidatesWithFilters(selectedJob, filters, sortOptions);
        
        if (!error && data) {
          stages.forEach(stage => {
            newData[stage as keyof PipelineData] = data
              .filter(pc => pc.stage === stage)
              .map(mapPipelineCandidate);
          });
        }
      } else {
        for (const stage of stages) {
          const { data, error } = await getPipelineCandidatesByStage(selectedJob, stage);
          if (!error && data) {
            newData[stage as keyof PipelineData] = data.map(mapPipelineCandidate);
          }
        }
      }

      setPipelineData(newData);
    } catch (error) {
      console.error('[usePipelineData] Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedJob, filters, sortOptions]);

  const fetchAIRecommendations = useCallback(async (forceRefresh = false) => {
    if (loadingRecommendations) return;
    
    // Check cache
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(AI_CACHE_KEY);
        if (cached) {
          const { data, timestamp, applicantsData: cachedApplicants } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > AI_CACHE_DURATION;
          
          if (!isExpired && data) {
            setAiRecommendations(data);
            if (cachedApplicants) {
              setAllPipelineCandidatesForAI(cachedApplicants);
            }
            return;
          }
        }
      } catch (e) {
        console.log('[usePipelineData] Cache read error');
      }
    }
    
    setLoadingRecommendations(true);
    try {
      const applicantsData = await AppliedJobsService.getAllApplicants();
      
      if (!applicantsData || applicantsData.length === 0) {
        setAiRecommendations({ 
          topRecommendations: [], 
          summary: { totalAnalyzed: 0, highPotential: 0, mediumPotential: 0, lowPotential: 0 } 
        });
        setLoadingRecommendations(false);
        return;
      }

      const applicantsForAnalysis = applicantsData
        .filter((app: any) => app.student && app.opportunity)
        .map((app: any) => ({
          id: app.id,
          student_id: app.student_id,
          opportunity_id: app.opportunity_id,
          pipeline_stage: app.pipeline_stage,
          student: {
            id: app.student_id,
            name: app.student?.name || 'Unknown',
            email: app.student?.email || '',
            university: app.student?.university,
            cgpa: app.student?.cgpa,
            branch_field: app.student?.department
          },
          opportunity: {
            id: app.opportunity_id,
            job_title: app.opportunity?.job_title || app.opportunity?.title,
            skills_required: []
          }
        }));

      const opportunityIds = [...new Set(applicantsForAnalysis.map((a: any) => a.opportunity_id))];
      
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('id, skills_required')
        .in('id', opportunityIds);

      // Fetch skills for all students from the skills table
      const studentIds = [...new Set(applicantsData.map((a: any) => a.student_id))];
      const { data: skillsData } = await supabase
        .from('skills')
        .select('student_id, name, enabled')
        .in('student_id', studentIds)
        .eq('enabled', true);

      // Create a map of student_id to skills array
      const skillsMap: Record<string, string[]> = {};
      (skillsData || []).forEach((skill: any) => {
        if (!skillsMap[skill.student_id]) {
          skillsMap[skill.student_id] = [];
        }
        if (skill.name) {
          skillsMap[skill.student_id].push(skill.name);
        }
      });
      
      const enrichedApplicants = applicantsForAnalysis.map((app: any) => {
        const opp = opportunities?.find((o: any) => o.id === app.opportunity_id);
        return {
          ...app,
          opportunity: {
            ...app.opportunity,
            skills_required: opp?.skills_required || []
          }
        };
      });
      
      // Map applicants to PipelineCandidate-like structure for profile view compatibility
      const applicantsForPanel = applicantsData.map((app: any) => {
        // Get skills from skills table, fallback to profile skill field
        const studentSkills = skillsMap[app.student_id] || [];
        const profileSkill = app.student?.skill;
        const skills = studentSkills.length > 0 
          ? studentSkills 
          : (profileSkill ? (Array.isArray(profileSkill) ? profileSkill : [profileSkill]) : []);

        return {
          id: app.id,
          student_id: app.student_id,
          opportunity_id: app.opportunity_id,
          name: app.student?.name || 'Unknown',
          email: app.student?.email || '',
          phone: app.student?.phone || '',
          dept: app.student?.department?.trim() || app.student?.course?.trim() || 'N/A',
          college: app.student?.college?.trim() || app.student?.university?.trim() || 'N/A',
          location: app.student?.district?.trim() || 'N/A',
          skills: skills,
          ai_score_overall: app.student?.employability_score || 0,
          last_updated: app.updated_at || app.applied_at || new Date().toISOString(),
          created_at: app.applied_at,
          stage: app.pipeline_stage || app.application_status || 'applied',
          source: 'application',
          photo: app.student?.photo || null,
          university: app.student?.university?.trim() || '',
          cgpa: app.student?.cgpa || '',
          year_of_passing: app.student?.year_of_passing || '',
          verified: app.student?.verified || false
        };
      });
      setAllPipelineCandidatesForAI(applicantsForPanel);
      
      const recommendations = await recruiterInsights.analyzeApplicantsForRecommendation(enrichedApplicants);
      setAiRecommendations(recommendations);
      
      // Cache results
      try {
        sessionStorage.setItem(AI_CACHE_KEY, JSON.stringify({
          data: recommendations,
          applicantsData: applicantsForPanel,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log('[usePipelineData] Cache write error');
      }
    } catch (error) {
      console.error('[usePipelineData] Error fetching AI recommendations:', error);
      setAiRecommendations(null);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [loadingRecommendations]);

  // Load pipeline candidates when job/filters/sort changes
  useEffect(() => {
    if (selectedJob) {
      loadPipelineCandidates();
    }
  }, [selectedJob, loadPipelineCandidates]);

  // Fetch AI recommendations on mount
  useEffect(() => {
    fetchAIRecommendations();
  }, []);

  const getTotalCandidates = useCallback(() => {
    return Object.values(pipelineData).reduce((total, stage) => total + stage.length, 0);
  }, [pipelineData]);

  const getConversionRate = useCallback((fromStage: string, toStage: string) => {
    const fromCount = pipelineData[fromStage as keyof PipelineData]?.length || 0;
    const toCount = pipelineData[toStage as keyof PipelineData]?.length || 0;
    if (fromCount === 0) return 0;
    return Math.round((toCount / fromCount) * 100);
  }, [pipelineData]);

  return {
    pipelineData,
    setPipelineData,
    loading,
    loadPipelineCandidates,
    aiRecommendations,
    loadingRecommendations,
    allPipelineCandidatesForAI,
    fetchAIRecommendations,
    getTotalCandidates,
    getConversionRate
  };
};

export default usePipelineData;
