import { supabase } from '@/shared/api/supabaseClient';
import { CandidateSummary } from '@/features/learner-profile/model';
import { ParsedRecruiterQuery } from './queryParser';

/**
 * Semantic Search Service for Recruiter AI
 * 
 * Uses PostgreSQL pgvector extension for semantic similarity search
 * Leverages embeddings stored in:
 * - learners.embedding (candidate profiles)
 * - opportunities.embedding (job descriptions)
 * 
 * This enables finding candidates based on semantic understanding,
 * not just keyword matching.
 */

export interface SemanticSearchOptions {
  limit?: number;
  similarity_threshold?: number;  // 0 to 1, higher = more similar
  include_near_matches?: boolean;
}

class SemanticSearchService {
  
  /**
   * Search candidates using semantic similarity
   * Uses pgvector's cosine similarity on embeddings
   */
  async searchCandidatesBySemantic(
    queryEmbedding: number[],
    options: SemanticSearchOptions = {}
  ): Promise<CandidateSummary[]> {
    const {
      limit = 20,
      similarity_threshold = 0.7,
      include_near_matches = true
    } = options;

    try {
      // Search using pgvector similarity
      // Note: This uses RPC function or direct SQL with pgvector operators
      const { data: matches, error } = await supabase.rpc(
        'search_candidates_by_embedding',
        {
          query_embedding: queryEmbedding,
          match_threshold: similarity_threshold,
          match_count: limit
        }
      );

      if (error) {
        return [];
      }

      // Enrich with full candidate data
      return await this.enrichCandidates(matches || []);
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Find candidates similar to an opportunity
   * Uses the opportunity's embedding to find matching candidates
   */
  async findCandidatesForOpportunity(
    opportunityId: number,
    limit: number = 20
  ): Promise<Array<CandidateSummary & { similarity_score: number }>> {
    try {
      // Fetch opportunity embedding
      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('embedding, skills_required, job_title, experience_required')
        .eq('id', opportunityId)
        .single();

      if (oppError || !opportunity || !opportunity.embedding) {
        return [];
      }

      // Search candidates with similar embeddings
      const { data: matches, error } = await supabase.rpc(
        'match_candidates_to_opportunity',
        {
          opportunity_embedding: opportunity.embedding,
          match_count: limit,
          min_similarity: 0.65
        }
      );

      if (error) {
        return [];
      }

      return await this.enrichCandidatesWithScore(matches || []);
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Hybrid search: Combine semantic search with structured filtering
   * Most powerful approach for recruiter queries
   */
  async hybridCandidateSearch(
    parsedQuery: ParsedRecruiterQuery,
    limit: number = 25
  ): Promise<CandidateSummary[]> {
    try {
      // Build SQL query with filters

      // Build SQL query with filters
      let query = supabase
        .from('learners')
        .select('user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, resumeUrl, embedding')
        .not('name', 'is', null);

      // Apply CGPA filter
      if (parsedQuery.min_cgpa) {
        query = query.gte('currentCgpa', parsedQuery.min_cgpa);
      }

      // Note: Location filtering is done in-memory after fetching to allow fallback
      // This ensures we show relevant candidates even if location data is missing

      // Apply institution filter
      if (parsedQuery.specific_institutions && parsedQuery.specific_institutions.length > 0) {
        query = query.in('university', parsedQuery.specific_institutions);
      }

      // Execute base query

      // FIRST: Try to get learners who have skills (prioritize them)
      const { data: learnersWithSkills } = await supabase
        .from('learners')
        .select('user_id')
        .not('name', 'is', null);
      
      const learnerIdsWithSkills = learnersWithSkills?.map(s => s.user_id) || [];
      
      // Get unique learner IDs that have skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('learner_id')
        .eq('enabled', true);
      
      const uniqueLearnerIdsWithSkills = [...new Set(skillsData?.map(s => s.learner_id) || [])];

      // If we have learners with skills, prioritize them
      let priorityQuery = query;
      if (uniqueLearnerIdsWithSkills.length > 0) {
        // Fetch learners who have skills first
        priorityQuery = query.in('user_id', uniqueLearnerIdsWithSkills);
      }
      
      const { data: initiallearners, error: baseError } = await priorityQuery.limit(limit * 3);
      let baselearners = initiallearners;

      if (baseError) {
        return [];
      }

      if (!baselearners || baselearners.length === 0) {
        return [];
      }

      // Now filter by skills and enrich
      const candidates = await this.filterBySkillsAndEnrich(
        baselearners,
        parsedQuery.required_skills,
        parsedQuery.preferred_skills
      );

      // Apply additional filters
      let filtered = candidates;

      // Filter by certifications if required
      if (parsedQuery.has_certifications) {
        filtered = filtered.filter(c => c.experience_count > 0);
      }

      // Filter by training if required
      if (parsedQuery.has_training) {
        filtered = filtered.filter(c => c.training_count > 0);
      }

      // Filter by projects if required
      if (parsedQuery.has_projects && parsedQuery.min_projects) {
        filtered = filtered.filter(c => c.projects_count >= parsedQuery.min_projects);
      }

      // Apply location preference (not a hard filter)
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

      // Sort by match quality (includes location preference)
      return this.rankCandidates(withLocationScore as any, parsedQuery).slice(0, limit);

    } catch (error) {
      return [];
    }
  }

  /**
   * Filter learners by skills and enrich with full data
   */
  private async filterBySkillsAndEnrich(
    learners: any[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): Promise<CandidateSummary[]> {
    const learnerIds = learners.map(s => s.user_id);

    if (learnerIds.length === 0) return [];

    // Fetch all skills for these learners
    const { data: allSkills, error: skillsError } = await supabase
      .from('skills')
      .select('learner_id, name, level, type')
      .in('learner_id', learnerIds)
      .eq('enabled', true);

    // Group skills by learner
    const skillsByLearner = new Map<string, any[]>();
    allSkills?.forEach(skill => {
      const existing = skillsByLearner.get(skill.learner_id) || [];
      skillsByLearner.set(skill.learner_id, [...existing, skill]);
    });

    // Filter learners who have required skills (if specified)
    let matchinglearners = learners;
    
    if (requiredSkills.length > 0) {
      const learnersWithMatchingSkills = learners.filter(learner => {
        const learnerSkills = skillsByLearner.get(learner.user_id) || [];
        const learnerSkillNames = learnerSkills.map(s => s.name.toLowerCase());
        
        // Must have at least one required skill
        return requiredSkills.some(reqSkill => 
          learnerSkillNames.some(ss => 
            ss.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(ss)
          )
        );
      });
      
      if (learnersWithMatchingSkills.length > 0) {
        matchinglearners = learnersWithMatchingSkills;
      } else {
        // HONEST APPROACH: Return empty when skills don't exist
        matchinglearners = []; // Return empty, not all learners
      }
    }

    // Enrich with full candidate data
    return await Promise.all(
      matchinglearners.map(async (learner) => {
        const skills = skillsByLearner.get(learner.user_id) || [];

        // Get training count
        const { count: trainingCount } = await supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner.user_id);

        // Get certificate count
        const { count: certCount } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner.user_id)
          .eq('enabled', true);

        // Calculate profile score
        const profileScore = this.calculateProfileScore({
          hasName: !!learner.name,
          skillCount: skills.length,
          trainingCount: trainingCount || 0,
          certCount: certCount || 0,
          hasCGPA: !!learner.currentCgpa,
          hasResume: !!learner.resumeUrl,
          hasLocation: !!(learner.city || learner.state)
        });

        // Calculate skill match score
        const skillMatchScore = this.calculateSkillMatch(
          skills.map(s => s.name),
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
          skills: skills.map(s => s.name),
          projects_count: 0,
          training_count: trainingCount || 0,
          experience_count: certCount || 0,
          career_interests: [learner.branch_field].filter(Boolean),
          location: [learner.city, learner.state].filter(Boolean).join(', '),
          last_active: learner.updated_at,
          profile_completeness: profileScore,
          // Add match score for ranking
          __match_score: skillMatchScore + (profileScore * 0.3)
        } as CandidateSummary & { __match_score?: number };
      })
    );
  }

  /**
   * Rank candidates based on query relevance
   */
  private rankCandidates(
    candidates: CandidateSummary[],
    parsedQuery: ParsedRecruiterQuery
  ): CandidateSummary[] {
    return candidates.sort((a, b) => {
      // Use match score if available
      const scoreA = (a as any).__match_score || 0;
      const scoreB = (b as any).__match_score || 0;
      
      // Add location preference bonus
      const locationA = (a as any).__location_score || 0;
      const locationB = (b as any).__location_score || 0;
      
      const totalA = scoreA + locationA;
      const totalB = scoreB + locationB;
      
      if (totalA !== totalB) return totalB - totalA;

      // Secondary sort by profile completeness
      return (b.profile_completeness || 0) - (a.profile_completeness || 0);
    });
  }

  /**
   * Calculate skill match score
   */
  private calculateSkillMatch(
    candidateSkills: string[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): number {
    let score = 0;
    const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());

    // Check required skills (weighted heavily)
    requiredSkills.forEach(reqSkill => {
      const hasSkill = candidateSkillsLower.some(cs => 
        cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs)
      );
      if (hasSkill) score += 10;
    });

    // Check preferred skills (bonus points)
    preferredSkills.forEach(prefSkill => {
      const hasSkill = candidateSkillsLower.some(cs => 
        cs.includes(prefSkill.toLowerCase()) || prefSkill.toLowerCase().includes(cs)
      );
      if (hasSkill) score += 3;
    });

    return score;
  }

  /**
   * Calculate profile completeness score
   */
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

  /**
   * Enrich basic matches with full candidate data
   */
  private async enrichCandidates(matches: any[]): Promise<CandidateSummary[]> {
    if (!matches || matches.length === 0) return [];

    const learnerIds = matches.map(m => m.user_id || m.id);
    
    const { data: learners } = await supabase
      .from('learners')
      .select('user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, resumeUrl')
      .in('user_id', learnerIds);

    if (!learners) return [];

    return Promise.all(
      learners.map(async (learner) => {
        const { data: skills } = await supabase
          .from('skills')
          .select('name')
          .eq('learner_id', learner.user_id)
          .eq('enabled', true);

        const { count: trainingCount } = await supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner.user_id);

        const { count: certCount } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner.user_id)
          .eq('enabled', true);

        return {
          id: learner.user_id,
          name: learner.name || 'Candidate',
          email: learner.email,
          institution: learner.university,
          graduation_year: learner.expectedGraduationDate?.split('-')[0],
          cgpa: learner.currentCgpa?.toString(),
          skills: skills?.map(s => s.name) || [],
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

  /**
   * Enrich matches with similarity scores
   */
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
