import { supabase } from '../../../lib/supabaseClient';
import { CandidateSummary, CandidateMatchResult } from '../types';

/**
 * Recruiter Insights Service
 * Intelligent candidate analysis using actual database schema:
 * - students, skills, trainings, certificates tables
 * - opportunities for job matching
 * - pipeline_candidates for recruitment tracking
 */

class RecruiterInsightsService {
  /**
   * Get top candidates based on skills, training, certificates, and profile quality
   */
  async getTopCandidates(limit: number = 20): Promise<CandidateSummary[]> {
    try {
      // Fetch students with complete profiles
      const { data: students, error } = await supabase
        .from('students')
        .select('user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, updated_at, resumeUrl')
        .not('name', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(limit * 2);

      if (error || !students || students.length === 0) {
        console.error('Error fetching students:', error);
        return [];
      }

      // Enrich candidates with skills, training, certificates
      const candidates: CandidateSummary[] = await Promise.all(
        students.map(async (student) => {
          // Fetch skills
          const { data: skills } = await supabase
            .from('skills')
            .select('name, level, type')
            .eq('student_id', student.user_id)
            .eq('enabled', true);

          // Fetch training count
          const { count: trainingCount } = await supabase
            .from('trainings')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', student.user_id);

          // Fetch certificates count
          const { count: certCount } = await supabase
            .from('certificates')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', student.user_id)
            .eq('enabled', true);

          // Calculate profile score
          const profileScore = this.calculateProfileScore({
            hasName: !!student.name,
            skillCount: skills?.length || 0,
            trainingCount: trainingCount || 0,
            certCount: certCount || 0,
            hasCGPA: !!student.currentCgpa,
            hasResume: !!student.resumeUrl,
            hasLocation: !!(student.city || student.state)
          });

          return {
            id: student.user_id,
            name: student.name || 'Candidate',
            email: student.email,
            institution: student.university,
            graduation_year: student.expectedGraduationDate?.split('-')[0],
            cgpa: student.currentCgpa?.toString(),
            skills: skills?.map(s => s.name) || [],
            projects_count: 0,
            training_count: trainingCount || 0,
            experience_count: certCount || 0,
            career_interests: [student.branch_field].filter(Boolean),
            location: [student.city, student.state].filter(Boolean).join(', '),
            last_active: student.updated_at,
            profile_completeness: profileScore
          };
        })
      );

      // Rank by quality: profile score + skill diversity
      return candidates
        .sort((a, b) => {
          const scoreA = (a.profile_completeness || 0) + (a.skills.length * 2) + (a.training_count * 3);
          const scoreB = (b.profile_completeness || 0) + (b.skills.length * 2) + (b.training_count * 3);
          return scoreB - scoreA;
        })
        .slice(0, limit);

    } catch (error) {
      console.error('Error in getTopCandidates:', error);
      return [];
    }
  }

  /**
   * Find candidates by specific skills (smart matching)
   */
  async findCandidatesBySkills(skillNames: string[], limit: number = 20): Promise<CandidateSummary[]> {
    try {
      // Search for skills (case-insensitive partial match)
      const { data: matchingSkills, error } = await supabase
        .from('skills')
        .select('student_id, name, level')
        .eq('enabled', true);

      if (error || !matchingSkills || matchingSkills.length === 0) {
        return [];
      }

      // Calculate match scores per student
      const studentScores = new Map<string, { score: number; matchedSkills: string[] }>();
      
      matchingSkills.forEach(skill => {
        const skillLower = skill.name.toLowerCase();
        const matchedInputSkills = skillNames.filter(inputSkill => 
          skillLower.includes(inputSkill.toLowerCase()) || 
          inputSkill.toLowerCase().includes(skillLower)
        );

        if (matchedInputSkills.length > 0) {
          const current = studentScores.get(skill.student_id) || { score: 0, matchedSkills: [] };
          const levelBonus = (skill.level || 1) * 0.5;
          studentScores.set(skill.student_id, {
            score: current.score + matchedInputSkills.length + levelBonus,
            matchedSkills: [...current.matchedSkills, skill.name]
          });
        }
      });

      // Get top matching students
      const topStudents = Array.from(studentScores.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, limit)
        .map(entry => entry[0]);

      if (topStudents.length === 0) return [];

      return await this.getCandidatesByIds(topStudents);

    } catch (error) {
      console.error('Error in findCandidatesBySkills:', error);
      return [];
    }
  }

  /**
   * Match candidates to opportunity (intelligent scoring)
   */
  async matchCandidatesToOpportunity(
    opportunityId: number,
    limit: number = 15
  ): Promise<CandidateMatchResult[]> {
    try {
      // Fetch opportunity
      const { data: opp, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();

      if (error || !opp) {
        console.error('Error fetching opportunity:', error);
        return [];
      }

      // Extract skills from JSONB
      const requiredSkills = Array.isArray(opp.skills_required) 
        ? opp.skills_required 
        : [];

      if (requiredSkills.length === 0) {
        return [];
      }

      // Find matching candidates
      const candidates = await this.findCandidatesBySkills(requiredSkills, limit * 2);

      // Score each match
      const matches: CandidateMatchResult[] = candidates.map(candidate => {
        const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());
        const requiredSkillsLower = requiredSkills.map((s: string) => s.toLowerCase());

        const matchedSkills = candidate.skills.filter(skill =>
          requiredSkillsLower.some(req => 
            skill.toLowerCase().includes(req) || req.includes(skill.toLowerCase())
          )
        );

        const missingSkills = requiredSkills.filter((req: string) =>
          !candidateSkillsLower.some(cs => 
            cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs)
          )
        );

        // Intelligent scoring algorithm
        const skillMatchPercent = (matchedSkills.length / requiredSkills.length) * 100;
        const skillScore = Math.min(skillMatchPercent * 0.6, 60);
        const profileBonus = (candidate.profile_completeness || 0) * 0.2;
        const trainingBonus = Math.min(candidate.training_count * 3, 15);
        const certBonus = Math.min(candidate.experience_count * 2, 10);
        
        const matchScore = Math.min(
          Math.round(skillScore + profileBonus + trainingBonus + certBonus),
          100
        );

        return {
          candidate,
          job: {
            id: opp.id.toString(),
            title: opp.job_title,
            company: opp.company_name,
            location: opp.location,
            job_type: opp.employment_type as any,
            required_skills: requiredSkills,
            preferred_skills: [],
            experience_required: opp.experience_required || '',
            applicants_count: opp.applications_count || 0,
            status: opp.is_active ? 'active' : 'closed'
          },
          match_score: matchScore,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          additional_strengths: this.identifyStrengths(candidate),
          recommendation: this.generateRecommendation(matchScore, missingSkills.length)
        };
      });

      return matches
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error matching candidates:', error);
      return [];
    }
  }

  /**
   * Get candidates by IDs with full details
   */
  private async getCandidatesByIds(userIds: string[]): Promise<CandidateSummary[]> {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, resumeUrl')
        .in('user_id', userIds);

      if (error || !students) return [];

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
            skills: skills?.map(s => s.name) || [],
            projects_count: 0,
            training_count: trainingCount || 0,
            experience_count: certCount || 0,
            career_interests: [student.branch_field].filter(Boolean),
            location: [student.city, student.state].filter(Boolean).join(', '),
            profile_completeness: 75
          };
        })
      );
    } catch (error) {
      console.error('Error fetching candidates by IDs:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive profile score
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
    score += Math.min(profile.skillCount * 4, 35); // Max 35 for skills
    score += Math.min(profile.trainingCount * 8, 25); // Max 25 for training
    score += Math.min(profile.certCount * 5, 15); // Max 15 for certs
    if (profile.hasCGPA) score += 10;
    if (profile.hasResume) score += 8;
    if (profile.hasLocation) score += 2;
    return Math.min(score, 100);
  }

  /**
   * Identify candidate strengths for recommendation
   */
  private identifyStrengths(candidate: CandidateSummary): string[] {
    const strengths: string[] = [];
    
    if (candidate.skills.length >= 5) {
      strengths.push(`${candidate.skills.length} verified skills`);
    }
    if (candidate.training_count >= 3) {
      strengths.push(`${candidate.training_count} training programs`);
    }
    if (candidate.experience_count >= 2) {
      strengths.push(`${candidate.experience_count} certifications`);
    }
    if (candidate.cgpa && parseFloat(candidate.cgpa) >= 8.0) {
      strengths.push(`Strong academics (${candidate.cgpa} CGPA)`);
    }
    if (candidate.institution) {
      strengths.push(`${candidate.institution}`);
    }

    return strengths.slice(0, 3); // Top 3 strengths
  }

  /**
   * Generate smart hiring recommendation
   */
  private generateRecommendation(matchScore: number, missingCount: number): string {
    if (matchScore >= 85) {
      return '🌟 Excellent match - Fast-track to interview';
    } else if (matchScore >= 70) {
      return '✅ Strong candidate - Recommend screening call';
    } else if (matchScore >= 55) {
      if (missingCount <= 2) {
        return '💡 Good potential - Trainable gaps';
      }
      return '⚡ Moderate fit - Consider for junior role';
    } else if (matchScore >= 40) {
      return '⚠️ Some alignment - Review for specific strengths';
    } else {
      return '❌ Low match - Consider alternative roles';
    }
  }
}

export const recruiterInsights = new RecruiterInsightsService();
