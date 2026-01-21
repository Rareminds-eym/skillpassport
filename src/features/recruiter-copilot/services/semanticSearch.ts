import { supabase } from '../../../lib/supabaseClient';
import { CandidateSummary } from '../types';
import { ParsedRecruiterQuery } from './queryParser';

/**
 * Semantic Search Service for Recruiter AI
 *
 * Uses PostgreSQL pgvector extension for semantic similarity search
 * Leverages embeddings stored in:
 * - students.embedding (candidate profiles)
 * - opportunities.embedding (job descriptions)
 *
 * This enables finding candidates based on semantic understanding,
 * not just keyword matching.
 */

export interface SemanticSearchOptions {
  limit?: number;
  similarity_threshold?: number; // 0 to 1, higher = more similar
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
    const { limit = 20, similarity_threshold = 0.7, include_near_matches = true } = options;

    try {
      // Search using pgvector similarity
      // Note: This uses RPC function or direct SQL with pgvector operators
      const { data: matches, error } = await supabase.rpc('search_candidates_by_embedding', {
        query_embedding: queryEmbedding,
        match_threshold: similarity_threshold,
        match_count: limit,
      });

      if (error) {
        console.error('Semantic search error:', error);
        return [];
      }

      // Enrich with full candidate data
      return await this.enrichCandidates(matches || []);
    } catch (error) {
      console.error('Error in semantic search:', error);
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
        console.error('Opportunity not found or no embedding:', oppError);
        return [];
      }

      // Search candidates with similar embeddings
      const { data: matches, error } = await supabase.rpc('match_candidates_to_opportunity', {
        opportunity_embedding: opportunity.embedding,
        match_count: limit,
        min_similarity: 0.65,
      });

      if (error) {
        console.error('Opportunity matching error:', error);
        return [];
      }

      return await this.enrichCandidatesWithScore(matches || []);
    } catch (error) {
      console.error('Error matching candidates to opportunity:', error);
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
      console.log('🔍 Hybrid search with:', {
        skills: parsedQuery.required_skills,
        locations: parsedQuery.locations,
        min_cgpa: parsedQuery.min_cgpa,
        experience_level: parsedQuery.experience_level,
      });

      // Debug: Check total students with names
      const { count: totalWithNames } = await supabase
        .from('students')
        .select('user_id', { count: 'exact', head: true })
        .not('name', 'is', null);
      console.log(`📊 Total students with names in DB: ${totalWithNames}`);

      // Build SQL query with filters
      let query = supabase
        .from('students')
        .select(
          'user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, resumeUrl, embedding'
        )
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
      console.log('📡 Executing Supabase query...');

      // FIRST: Try to get students who have skills (prioritize them)
      const { data: studentsWithSkills } = await supabase
        .from('students')
        .select('user_id')
        .not('name', 'is', null);

      const studentIdsWithSkills = studentsWithSkills?.map((s) => s.user_id) || [];

      // Get unique student IDs that have skills
      const { data: skillsData } = await supabase
        .from('skills')
        .select('student_id')
        .eq('enabled', true);

      const uniqueStudentIdsWithSkills = [...new Set(skillsData?.map((s) => s.student_id) || [])];
      console.log(`📊 Found ${uniqueStudentIdsWithSkills.length} students with skills in database`);

      // If we have students with skills, prioritize them
      let priorityQuery = query;
      if (uniqueStudentIdsWithSkills.length > 0) {
        // Fetch students who have skills first
        priorityQuery = query.in('user_id', uniqueStudentIdsWithSkills);
      }

      const { data: initialStudents, error: baseError } = await priorityQuery.limit(limit * 3);
      console.log('📊 Query result:', {
        count: initialStudents?.length,
        error: baseError?.message,
      });
      const baseStudents = initialStudents;

      if (baseError) {
        console.error('❌ Supabase query error:', baseError);
        return [];
      }

      if (!baseStudents || baseStudents.length === 0) {
        console.log('⚠️ No students found matching CGPA/institution filters');
        return [];
      }

      console.log(`✅ Found ${baseStudents.length} students matching base filters`);

      // Now filter by skills and enrich
      const candidates = await this.filterBySkillsAndEnrich(
        baseStudents,
        parsedQuery.required_skills,
        parsedQuery.preferred_skills
      );
      console.log(`🎯 After skill filtering: ${candidates.length} candidates`);

      // Apply additional filters
      let filtered = candidates;

      // Filter by certifications if required
      if (parsedQuery.has_certifications) {
        filtered = filtered.filter((c) => c.experience_count > 0);
      }

      // Filter by training if required
      if (parsedQuery.has_training) {
        filtered = filtered.filter((c) => c.training_count > 0);
      }

      // Filter by projects if required
      if (parsedQuery.has_projects && parsedQuery.min_projects) {
        filtered = filtered.filter((c) => c.projects_count >= parsedQuery.min_projects);
      }

      // Apply location preference (not a hard filter)
      const withLocationScore = filtered.map((candidate) => {
        let locationScore = 0;
        if (parsedQuery.locations && parsedQuery.locations.length > 0) {
          const candidateLocation = (candidate.location || '').toLowerCase();
          const matchesLocation = parsedQuery.locations.some((loc) =>
            candidateLocation.includes(loc.toLowerCase())
          );
          locationScore = matchesLocation ? 10 : 0;
        }
        return { ...candidate, __location_score: locationScore };
      });

      // Sort by match quality (includes location preference)
      return this.rankCandidates(withLocationScore as any, parsedQuery).slice(0, limit);
    } catch (error) {
      console.error('Error in hybrid search:', error);
      return [];
    }
  }

  /**
   * Filter students by skills and enrich with full data
   */
  private async filterBySkillsAndEnrich(
    students: any[],
    requiredSkills: string[],
    preferredSkills: string[]
  ): Promise<CandidateSummary[]> {
    const studentIds = students.map((s) => s.user_id);

    if (studentIds.length === 0) return [];

    // Fetch all skills for these students
    console.log(
      '🔍 Fetching skills for student IDs:',
      studentIds.slice(0, 5),
      '... (total:',
      studentIds.length,
      ')'
    );
    const { data: allSkills, error: skillsError } = await supabase
      .from('skills')
      .select('student_id, name, level, type')
      .in('student_id', studentIds)
      .eq('enabled', true);

    console.log('📊 Skills query result:', {
      totalSkills: allSkills?.length || 0,
      error: skillsError?.message,
      sampleSkills: allSkills?.slice(0, 3),
    });

    // Group skills by student
    const skillsByStudent = new Map<string, any[]>();
    allSkills?.forEach((skill) => {
      const existing = skillsByStudent.get(skill.student_id) || [];
      skillsByStudent.set(skill.student_id, [...existing, skill]);
    });

    console.log('🗺️ Skills grouped by student:', {
      studentsWithSkills: skillsByStudent.size,
      totalStudents: students.length,
      sampleMapping: Array.from(skillsByStudent.entries())
        .slice(0, 2)
        .map(([id, skills]) => ({
          student_id: id,
          skillCount: skills.length,
          skills: skills.map((s) => s.name),
        })),
    });

    // Filter students who have required skills (if specified)
    let matchingStudents = students;

    if (requiredSkills.length > 0) {
      const studentsWithMatchingSkills = students.filter((student) => {
        const studentSkills = skillsByStudent.get(student.user_id) || [];
        const studentSkillNames = studentSkills.map((s) => s.name.toLowerCase());

        // Must have at least one required skill
        return requiredSkills.some((reqSkill) =>
          studentSkillNames.some(
            (ss) => ss.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(ss)
          )
        );
      });

      if (studentsWithMatchingSkills.length > 0) {
        matchingStudents = studentsWithMatchingSkills;
        console.log(`✅ Found ${studentsWithMatchingSkills.length} students with matching skills`);
      } else {
        // HONEST APPROACH: Return empty when skills don't exist
        console.log(`❌ No students have the required skills: ${requiredSkills.join(', ')}`);
        matchingStudents = []; // Return empty, not all students
      }
    }

    // Enrich with full candidate data
    return await Promise.all(
      matchingStudents.map(async (student) => {
        const skills = skillsByStudent.get(student.user_id) || [];

        // Get training count
        const { count: trainingCount } = await supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.user_id);

        // Get certificate count
        const { count: certCount } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.user_id)
          .eq('enabled', true);

        // Calculate profile score
        const profileScore = this.calculateProfileScore({
          hasName: !!student.name,
          skillCount: skills.length,
          trainingCount: trainingCount || 0,
          certCount: certCount || 0,
          hasCGPA: !!student.currentCgpa,
          hasResume: !!student.resumeUrl,
          hasLocation: !!(student.city || student.state),
        });

        // Calculate skill match score
        const skillMatchScore = this.calculateSkillMatch(
          skills.map((s) => s.name),
          requiredSkills,
          preferredSkills
        );

        return {
          id: student.user_id,
          name: student.name || 'Candidate',
          email: student.email,
          institution: student.university,
          graduation_year: student.expectedGraduationDate?.split('-')[0],
          cgpa: student.currentCgpa?.toString(),
          skills: skills.map((s) => s.name),
          projects_count: 0,
          training_count: trainingCount || 0,
          experience_count: certCount || 0,
          career_interests: [student.branch_field].filter(Boolean),
          location: [student.city, student.state].filter(Boolean).join(', '),
          last_active: student.updated_at,
          profile_completeness: profileScore,
          // Add match score for ranking
          __match_score: skillMatchScore + profileScore * 0.3,
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
    const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());

    // Check required skills (weighted heavily)
    requiredSkills.forEach((reqSkill) => {
      const hasSkill = candidateSkillsLower.some(
        (cs) => cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs)
      );
      if (hasSkill) score += 10;
    });

    // Check preferred skills (bonus points)
    preferredSkills.forEach((prefSkill) => {
      const hasSkill = candidateSkillsLower.some(
        (cs) => cs.includes(prefSkill.toLowerCase()) || prefSkill.toLowerCase().includes(cs)
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

    const studentIds = matches.map((m) => m.user_id || m.id);

    const { data: students } = await supabase
      .from('students')
      .select(
        'user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, resumeUrl'
      )
      .in('user_id', studentIds);

    if (!students) return [];

    return Promise.all(
      students.map(async (student) => {
        const { data: skills } = await supabase
          .from('skills')
          .select('name')
          .eq('student_id', student.user_id)
          .eq('enabled', true);

        const { count: trainingCount } = await supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.user_id);

        const { count: certCount } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.user_id)
          .eq('enabled', true);

        return {
          id: student.user_id,
          name: student.name || 'Candidate',
          email: student.email,
          institution: student.university,
          graduation_year: student.expectedGraduationDate?.split('-')[0],
          cgpa: student.currentCgpa?.toString(),
          skills: skills?.map((s) => s.name) || [],
          projects_count: 0,
          training_count: trainingCount || 0,
          experience_count: certCount || 0,
          career_interests: [student.branch_field].filter(Boolean),
          location: [student.city, student.state].filter(Boolean).join(', '),
          profile_completeness: 75,
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
      similarity_score: matches[idx]?.similarity || 0,
    }));
  }
}

export const semanticSearch = new SemanticSearchService();
