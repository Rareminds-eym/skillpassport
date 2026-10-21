import {useUser} from '@/shared/model/authStore';
import {useOrgContext} from '@/entities/recruitment/model/useOrgContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPipelineCandidatesByStage,
  getPipelineCandidatesWithFilters
} from '@/features/opportunities';
// @ts-ignore
import { AppliedJobsService } from '@/features/opportunities';
import { recruiterInsights } from '@/features/recruiter-copilot';
import { PipelineFilters, PipelineSortOptions } from '@/shared/types/recruiter';
import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('usePipelineData');

import type {PipelineCandidate,PipelineData} from '@/features/recruiter-pipeline/ui/pipeline/types';
export type {PipelineCandidate,PipelineData};

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
  selectedJob: string | null,
  filters: PipelineFilters,
  sortOptions: PipelineSortOptions
) => {
  const user=useUser(),{organizationId}=useOrgContext();
  const cacheKey=`${AI_CACHE_KEY}:${user?.id||'none'}:${organizationId||user?.orgId||'none'}`;
  const currentScope=useRef(cacheKey),pendingRecommendations=useRef(new Set<string>());currentScope.current=cacheKey;
  const [pipelineData, setPipelineData] = useState<PipelineData>(initialPipelineData);
  const [loading, setLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [allPipelineCandidatesForAI, setAllPipelineCandidatesForAI] = useState<any[]>([]);

  const mapPipelineCandidate = (pc: any): PipelineCandidate => ({
    id: pc.id,
    recruiter_rating: pc.recruiter_rating,
    name: pc.candidate_name || 'N/A',
    email: pc.candidate_email || '',
    phone: pc.candidate_phone || '',
    dept: pc.learners?.dept || 'N/A',
    college: pc.learners?.college || 'N/A',
    location: pc.learners?.location || 'N/A',
    skills: Array.isArray(pc.learners?.skills) ? pc.learners.skills : [],
    ai_score_overall: pc.learners?.ai_score_overall || 0,
    last_updated: pc.updated_at || pc.created_at,
    learner_id: pc.learner_id,
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
              .filter((pc:any) => pc.stage === stage)
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

      if(currentScope.current===cacheKey)setPipelineData(newData);
    } catch (error) {
      logger.error('Failed to load pipeline candidates', error as Error);
    } finally {
      setLoading(false);
    }
  }, [selectedJob, filters, sortOptions,cacheKey]);

  const fetchAIRecommendations = useCallback(async (forceRefresh = false) => {
    if (!user?.id||!organizationId||pendingRecommendations.current.has(cacheKey)) return;
    
    // Check cache
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
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
        logger.error('Failed to read AI recommendations from cache', e as Error);
      }
    }

    pendingRecommendations.current.add(cacheKey);
    setLoadingRecommendations(true);
    try {
      const applicantsData = await AppliedJobsService.getAllApplicants();
      if(currentScope.current!==cacheKey)return;
      
      if (!applicantsData || applicantsData.length === 0) {
        setAiRecommendations({ 
          topRecommendations: [], 
          summary: { totalAnalyzed: 0, highPotential: 0, mediumPotential: 0, lowPotential: 0 } 
        });
        setLoadingRecommendations(false);
        return;
      }

      const applicantsForAnalysis = applicantsData
        .filter((app: any) => app.learner && app.opportunity)
        .map((app: any) => ({
          id: app.id,
          learner_id: app.learner_id,
          opportunity_id: app.opportunity_id,
          pipeline_stage: app.pipeline_stage,
          learner: {
            id: app.learner_id,
            name: app.learner?.name || 'Unknown',
            email: app.learner?.email || '',
            university: app.learner?.university,
            cgpa: app.learner?.cgpa,
            branch_field: app.learner?.department
          },
          opportunity: {
            id: app.opportunity_id,
            job_title: app.opportunity?.job_title || app.opportunity?.title,
            skills_required: []
          }
        }));

      const opportunityIds = [...new Set(applicantsForAnalysis.map((a: any) => a.opportunity_id))];
      
      const response2: any = await apiPost('/opportunities', { action: 'get-opportunities-by-ids', ids: opportunityIds });
      const opportunities = response2?.data?.opportunities || [];

      // Fetch skills for all learners from the skills table
      const learnerIds = [...new Set(applicantsData.map((a: any) => a.learner_id))];
      const response3: any = await apiPost('/opportunities', { action: 'get-skills-by-learner-ids', learner_ids: learnerIds });
      const skillsData = response3?.data?.skills || [];

      // Create a map of learner_id to skills array
      const skillsMap: Record<string, string[]> = {};
      (skillsData || []).forEach((skill: any) => {
        if (!skillsMap[skill.learner_id]) {
          skillsMap[skill.learner_id] = [];
        }
        if (skill.name) {
          skillsMap[skill.learner_id].push(skill.name);
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
        const learnerSkills = skillsMap[app.learner_id] || [];
        const profileSkill = app.learner?.skill;
        const skills = learnerSkills.length > 0 
          ? learnerSkills 
          : (profileSkill ? (Array.isArray(profileSkill) ? profileSkill : [profileSkill]) : []);

        return {
          id: app.id,
          learner_id: app.learner_id,
          opportunity_id: app.opportunity_id,
          name: app.learner?.name || 'Unknown',
          email: app.learner?.email || '',
          phone: app.learner?.phone || '',
          dept: app.learner?.department?.trim() || app.learner?.course?.trim() || 'N/A',
          college: app.learner?.college?.trim() || app.learner?.university?.trim() || 'N/A',
          location: app.learner?.district?.trim() || 'N/A',
          skills: skills,
          ai_score_overall: app.learner?.employability_score || 0,
          last_updated: app.updated_at || app.applied_at || new Date().toISOString(),
          created_at: app.applied_at,
          stage: app.pipeline_stage || app.application_status || 'applied',
          source: 'application',
          photo: app.learner?.photo || null,
          university: app.learner?.university?.trim() || '',
          cgpa: app.learner?.cgpa || '',
          year_of_passing: app.learner?.year_of_passing || '',
          verified: app.learner?.verified || false
        };
      });
      if(currentScope.current!==cacheKey)return;
      setAllPipelineCandidatesForAI(applicantsForPanel);
      
      const recommendations = await recruiterInsights.analyzeApplicantsForRecommendation(enrichedApplicants);
      if(currentScope.current!==cacheKey)return;
      setAiRecommendations(recommendations);
      
      // Cache results
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: recommendations,
          applicantsData: applicantsForPanel,
          timestamp: Date.now()
        }));
      } catch (error) {
        logger.error('Failed to cache AI recommendations', error as Error);
      }
    } catch (error) {
      logger.error('Failed to fetch AI recommendations', error as Error);
      if(currentScope.current===cacheKey)setAiRecommendations(null);
    } finally {
      pendingRecommendations.current.delete(cacheKey);
      if(currentScope.current===cacheKey)setLoadingRecommendations(false);
    }
  }, [cacheKey,user?.id,organizationId]);

  // Load pipeline candidates when job/filters/sort changes
  useEffect(() => {
    if (selectedJob) {
      loadPipelineCandidates();
    }
  }, [selectedJob, loadPipelineCandidates]);

  // Fetch AI recommendations on mount
  useEffect(() => {
    sessionStorage.removeItem(AI_CACHE_KEY);
    setPipelineData(initialPipelineData);setAiRecommendations(null);setAllPipelineCandidatesForAI([]);
    fetchAIRecommendations();
  }, [cacheKey,fetchAIRecommendations]);

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
