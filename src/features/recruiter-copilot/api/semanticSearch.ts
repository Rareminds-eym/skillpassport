import { apiPost } from '@/shared/api/apiClient';
import { CandidateSummary } from '@/features/learner-profile/model';
import { ParsedRecruiterQuery } from './queryParser';

export interface SemanticSearchOptions {
  limit?: number;
  similarity_threshold?: number;
  include_near_matches?: boolean;
}

class SemanticSearchService {
  async searchCandidatesBySemantic(
    queryEmbedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<CandidateSummary[]> {
    const {
      limit = 20,
      similarity_threshold = 0.7,
    } = options;

    try {
      const matches = await apiPost<any[]>('/recruiter-copilot', {
        action: 'semantic-search-candidates',
        query_embedding: queryEmbedding,
        match_threshold: similarity_threshold,
        match_count: limit,
      });

      return await this.enrichCandidates(matches || []);
    } catch {
      return [];
    }
  }

  async findCandidatesForOpportunity(
    opportunityId: number,
    limit: number = 20
  ): Promise<Array<CandidateSummary & { similarity_score: number }>> {
    try {
      const matches = await apiPost<any[]>('/recruiter-copilot', {
        action: 'semantic-find-for-opportunity',
        opportunity_id: opportunityId,
        match_count: limit,
        min_similarity: 0.65,
      });

      return await this.enrichCandidatesWithScore(matches || []);
    } catch {
      return [];
    }
  }

  async hybridCandidateSearch(
    parsedQuery: ParsedRecruiterQuery,
    limit: number = 25
  ): Promise<CandidateSummary[]> {
    try {
      const { data: initiallearners } = await apiPost<any>('/recruiter-copilot', {
        action: 'fetch-learners-basic',
        limit: limit * 3,
      });

      if (!initiallearners || initiallearners.length === 0) return [];

      let baselearners = initiallearners;

      const learnerIdsWithSkills = await apiPost<string[]>('/recruiter-copilot', {
        action: 'fetch-skills-learner-ids',
      });

      const uniqueLearnerIdsWithSkills = [...new Set(learnerIdsWithSkills?.map((s: any) => s.learner_id) || [])];

      if (uniqueLearnerIdsWithSkills.length > 0) {
        baselearners = baselearners.filter((l: any) =>
          uniqueLearnerIdsWithSkills.includes(l.user_id)
        );
      }

      if (baselearners.length === 0) return [];

      const candidates = await this.filterBySkillsAndEnrich(
        baselearners,
        parsedQuery.required_skills,
        parsedQuery.preferred_skills
      );

      let filtered = candidates;

      if (parsedQuery.has_certifications) {
        filtered = filtered.filter(c => c.experience_count > 0);
      }

      if (parsedQuery.has_training) {
        filtered = filtered.filter(c => c.training_count > 0);
      }

      if (parsedQuery.has_projects && parsedQuery.min_projects) {
        filtered = filtered.filter(c => c.projects_count >= parsedQuery.min_projects);
      }

      const withLocationScore = filtered.map(candidate => {
        let locationScore = 0;
        if (parsedQuery.locations && parsedQuery.locations.length > 0) {
          const candidateLocation = (candidate.location || '').toLowerCase();
          const matchesLocation = parsedQuery.locations.some(loc =>
            candidateLocation.includes(loc.toLowerCase())
          );
          locationScore = matchesLocation ? 10 : 0;
        }
        return { ...candidate, __location_score: locationScore };
      });

      return this.rankCandidates(withLocationScore as any, parsedQuery).slice(0, limit);
    } catch {
      return [];
    }
  }

  private async filterBySkillsAndEnrich(
    learners: any[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): Promise<CandidateSummary[]> {
    const learnerIds = learners.map(s => s.user_id);
    if (learnerIds.length === 0) return [];

    const allSkills = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-skills',
      learner_ids: learnerIds,
    });

    const skillsByLearner = new Map<string, any[]>();
    allSkills?.forEach((skill: any) => {
      const existing = skillsByLearner.get(skill.learner_id) || [];
      skillsByLearner.set(skill.learner_id, [...existing, skill]);
    });

    let matchinglearners = learners;

    if (requiredSkills.length > 0) {
      const learnersWithMatchingSkills = learners.filter((learner: any) => {
        const learnerSkills = skillsByLearner.get(learner.user_id) || [];
        const learnerSkillNames = learnerSkills.map((s: any) => s.name.toLowerCase());
        return requiredSkills.some(reqSkill =>
          learnerSkillNames.some((ss: string) =>
            ss.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(ss)
          )
        );
      });

      if (learnersWithMatchingSkills.length > 0) {
        matchinglearners = learnersWithMatchingSkills;
      } else {
        matchinglearners = [];
      }
    }

    return await Promise.all(
      matchinglearners.map(async (learner: any) => {
        const skills = skillsByLearner.get(learner.user_id) || [];

        const trainingCount = await apiPost<number>('/recruiter-copilot', {
          action: 'count-trainings',
          learner_id: learner.user_id,
        });

        const certCount = await apiPost<number>('/recruiter-copilot', {
          action: 'count-certificates',
          learner_id: learner.user_id,
        });

        const profileScore = this.calculateProfileScore({
          hasName: !!learner.name,
          skillCount: skills.length,
          trainingCount: trainingCount || 0,
          certCount: certCount || 0,
          hasCGPA: !!learner.currentCgpa,
          hasResume: !!learner.resumeUrl,
          hasLocation: !!(learner.city || learner.state)
        });

        const skillMatchScore = this.calculateSkillMatch(
          skills.map((s: any) => s.name),
          requiredSkills,
          preferredSkills
        );

        return {
          id: learner.user_id,
          name: learner.name || 'Candidate',
          email: learner.email,
          institution: learner.university,
          graduation_year: learner.expectedGraduationDate?.split('-')[0],
          cgpa: learner.currentCgpa?.toString(),
          skills: skills.map((s: any) => s.name),
          projects_count: 0,
          training_count: trainingCount || 0,
          experience_count: certCount || 0,
          career_interests: [learner.branch_field].filter(Boolean),
          location: [learner.city, learner.state].filter(Boolean).join(', '),
          last_active: learner.updated_at,
          profile_completeness: profileScore,
          __match_score: skillMatchScore + (profileScore * 0.3)
        } as CandidateSummary & { __match_score?: number };
      })
    );
  }

  private rankCandidates(
    candidates: CandidateSummary[],
    _parsedQuery: ParsedRecruiterQuery
  ): CandidateSummary[] {
    return candidates.sort((a, b) => {
      const scoreA = (a as any).__match_score || 0;
      const scoreB = (b as any).__match_score || 0;
      const locationA = (a as any).__location_score || 0;
      const locationB = (b as any).__location_score || 0;
      const totalA = scoreA + locationA;
      const totalB = scoreB + locationB;
      if (totalA !== totalB) return totalB - totalA;
      return (b.profile_completeness || 0) - (a.profile_completeness || 0);
    });
  }

  private calculateSkillMatch(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): number {
    let score = 0;
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());

    requiredSkills.forEach(reqSkill => {
      const hasSkill = candidateSkillsLower.some(cs =>
        cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs)
      );
      if (hasSkill) score += 10;
    });

    preferredSkills.forEach(prefSkill => {
      const hasSkill = candidateSkillsLower.some(cs =>
        cs.includes(prefSkill.toLowerCase()) || prefSkill.toLowerCase().includes(cs)
      );
      if (hasSkill) score += 3;
    });

    return score;
  }

  private calculateProfileScore(profile: {
    hasName: boolean;
    skillCount: number;
    trainingCount: number;
    certCount: number;
    hasCGPA: boolean;
    hasResume: boolean;
    hasLocation: boolean;
  }): number {
    let score = 0;
    if (profile.hasName) score += 5;
    score += Math.min(profile.skillCount * 4, 35);
    score += Math.min(profile.trainingCount * 8, 25);
    score += Math.min(profile.certCount * 5, 15);
    if (profile.hasCGPA) score += 10;
    if (profile.hasResume) score += 8;
    if (profile.hasLocation) score += 2;
    return Math.min(score, 100);
  }

  private async enrichCandidates(matches: any[]): Promise<CandidateSummary[]> {
    if (!matches || matches.length === 0) return [];

    const learnerIds = matches.map(m => m.user_id || m.id);

    const learners = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-learners-basic',
      learner_ids: learnerIds,
    });

    if (!learners) return [];

    return Promise.all(
      learners.map(async (learner: any) => {
        const skills = await apiPost<any[]>('/recruiter-copilot', {
          action: 'fetch-skills',
          learner_ids: [learner.user_id],
        });

        const trainingCount = await apiPost<number>('/recruiter-copilot', {
          action: 'count-trainings',
          learner_id: learner.user_id,
        });

        const certCount = await apiPost<number>('/recruiter-copilot', {
          action: 'count-certificates',
          learner_id: learner.user_id,
        });

        return {
          id: learner.user_id,
          name: learner.name || 'Candidate',
          email: learner.email,
          institution: learner.university,
          graduation_year: learner.expectedGraduationDate?.split('-')[0],
          cgpa: learner.currentCgpa?.toString(),
          skills: skills?.map((s: any) => s.name) || [],
          projects_count: 0,
          training_count: trainingCount || 0,
          experience_count: certCount || 0,
          career_interests: [learner.branch_field].filter(Boolean),
          location: [learner.city, learner.state].filter(Boolean).join(', '),
          profile_completeness: 75
        };
      })
    );
  }

  private async enrichCandidatesWithScore(
    matches: any[]
  ): Promise<Array<CandidateSummary & { similarity_score: number }>> {
    const enriched = await this.enrichCandidates(matches);

    return enriched.map((candidate, idx) => ({
      ...candidate,
      similarity_score: matches[idx]?.similarity || 0
    }));
  }
}

export const semanticSearch = new SemanticSearchService();
