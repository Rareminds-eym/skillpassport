import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { CandidateSummary, CandidateMatchResult } from '@/features/learner-profile/model';

const logger = getLogger('recruiter-insights');

class RecruiterInsightsService {
  async getTopCandidates(limit: number = 20): Promise<CandidateSummary[]> {
    try {
      const learners = await apiPost<any[]>('/recruiter-copilot', {
        action: 'fetch-learners-basic',
        limit: limit * 2,
      });

      if (!learners || learners.length === 0) {
        logger.error('Error fetching learners', new Error('No learners found'));
        return [];
      }

      const candidates: CandidateSummary[] = await Promise.all(
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

          const profileScore = this.calculateProfileScore({
            hasName: !!learner.name,
            skillCount: skills?.length || 0,
            trainingCount: trainingCount || 0,
            certCount: certCount || 0,
            hasCGPA: !!learner.currentCgpa,
            hasResume: !!learner.resumeUrl,
            hasLocation: !!(learner.city || learner.state),
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
            last_active: learner.updated_at,
            profile_completeness: profileScore,
          };
        })
      );

      return candidates
        .sort((a, b) => {
          const scoreA = (a.profile_completeness || 0) + (a.skills.length * 2) + (a.training_count * 3);
          const scoreB = (b.profile_completeness || 0) + (b.skills.length * 2) + (b.training_count * 3);
          return scoreB - scoreA;
        })
        .slice(0, limit);
    } catch (error) {
      logger.error('Error in getTopCandidates', error as Error);
      return [];
    }
  }

  async findCandidatesBySkills(skillNames: string[], limit: number = 20): Promise<CandidateSummary[]> {
    try {
      const matchingSkills = await apiPost<any[]>('/recruiter-copilot', {
        action: 'fetch-skills',
      });

      if (!matchingSkills || matchingSkills.length === 0) return [];

      const learnerScores = new Map<string, { score: number; matchedSkills: string[] }>();

      matchingSkills.forEach((skill: any) => {
        const skillLower = skill.name.toLowerCase();
        const matchedInputSkills = skillNames.filter(inputSkill =>
          skillLower.includes(inputSkill.toLowerCase()) ||
          inputSkill.toLowerCase().includes(skillLower)
        );

        if (matchedInputSkills.length > 0) {
          const current = learnerScores.get(skill.learner_id) || { score: 0, matchedSkills: [] };
          const levelBonus = (skill.level || 1) * 0.5;
          learnerScores.set(skill.learner_id, {
            score: current.score + matchedInputSkills.length + levelBonus,
            matchedSkills: [...current.matchedSkills, skill.name],
          });
        }
      });

      const toplearners = Array.from(learnerScores.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, limit)
        .map(entry => entry[0]);

      if (toplearners.length === 0) return [];

      return await this.getCandidatesByIds(toplearners);
    } catch (error) {
      logger.error('Error in findCandidatesBySkills', error as Error);
      return [];
    }
  }

  async matchCandidatesToOpportunity(
    opportunityId: number,
    limit: number = 15
  ): Promise<CandidateMatchResult[]> {
    try {
      const opp = await apiPost<any>('/recruiter-copilot', {
        action: 'fetch-opportunity-by-id',
        id: opportunityId,
      });

      if (!opp) {
        logger.error('Error fetching opportunity', new Error('Opportunity not found'));
        return [];
      }

      const requiredSkills = Array.isArray(opp.skills_required)
        ? opp.skills_required
        : [];

      if (requiredSkills.length === 0) return [];

      const candidates = await this.findCandidatesBySkills(requiredSkills, limit * 2);

      const matches: CandidateMatchResult[] = candidates.map(candidate => {
        const candidateSkillsLower = candidate.skills.map(s => s.toLowerCase());
        const requiredSkillsLower = requiredSkills.map((s: string) => s.toLowerCase());

        const matchedSkills = candidate.skills.filter(skill =>
          requiredSkillsLower.some((req: string) =>
            skill.toLowerCase().includes(req) || req.includes(skill.toLowerCase())
          )
        );

        const missingSkills = requiredSkills.filter((req: string) =>
          !candidateSkillsLower.some((cs: string) =>
            cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs)
          )
        );

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
            status: opp.is_active ? 'active' : 'closed',
          },
          match_score: matchScore,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          additional_strengths: this.identifyStrengths(candidate),
          recommendation: this.generateRecommendation(matchScore, missingSkills.length),
        };
      });

      return matches
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error matching candidates', error as Error);
      return [];
    }
  }

  private async getCandidatesByIds(userIds: string[]): Promise<CandidateSummary[]> {
    try {
      const learners = await apiPost<any[]>('/recruiter-copilot', {
        action: 'fetch-learners-basic',
        learner_ids: userIds,
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
            profile_completeness: 75,
          };
        })
      );
    } catch (error) {
      logger.error('Error fetching candidates by IDs', error as Error);
      return [];
    }
  }

  private matchCertificatesToRole(
    certificates: Array<{ title: string; issuer?: string; level?: string }>,
    jobTitle: string,
    requiredSkills: string[]
  ): Array<{ title: string; issuer?: string; level?: string }> {
    if (!certificates || certificates.length === 0) return [];

    const jobTitleLower = jobTitle.toLowerCase();
    const skillsLower = requiredSkills.map(s => s.toLowerCase());

    const roleCertificateMap: { [key: string]: string[] } = {
      'software': ['programming', 'developer', 'software', 'coding', 'computer science', 'web development', 'full stack', 'backend', 'frontend'],
      'engineer': ['engineering', 'technical', 'certified engineer', 'professional engineer'],
      'data': ['data science', 'data analysis', 'analytics', 'big data', 'machine learning', 'ai', 'tableau', 'power bi', 'sql', 'python'],
      'cloud': ['aws', 'azure', 'google cloud', 'gcp', 'cloud practitioner', 'cloud architect', 'cloud developer', 'devops', 'kubernetes', 'docker'],
      'security': ['security', 'cybersecurity', 'cissp', 'ceh', 'ethical hacking', 'penetration testing', 'security+'],
      'ux': ['ux', 'user experience', 'user research', 'usability', 'interaction design', 'ux design', 'google ux', 'nielsen norman'],
      'ui': ['ui', 'user interface', 'interface design', 'visual design', 'figma', 'sketch', 'adobe xd'],
      'design': ['design', 'graphic design', 'creative', 'adobe', 'photoshop', 'illustrator', 'branding'],
      'product': ['product management', 'product owner', 'product manager', 'certified product manager', 'pragmatic marketing', 'product-led', 'product strategy', 'product roadmap', 'google product management', 'meta product management'],
      'project': ['project management', 'pmp', 'prince2', 'agile', 'scrum master', 'certified scrum', 'pmi'],
      'marketing': ['marketing', 'digital marketing', 'google ads', 'facebook ads', 'seo', 'content marketing', 'hubspot', 'hootsuite'],
      'sales': ['sales', 'salesforce', 'crm', 'sales training', 'negotiation'],
      'finance': ['cfa', 'accounting', 'cpa', 'financial', 'chartered', 'bookkeeping', 'quickbooks'],
      'hr': ['human resources', 'hr', 'shrm', 'phr', 'talent management', 'recruitment'],
    };

    const matched = certificates.filter(cert => {
      const certTitleLower = cert.title.toLowerCase();
      const certIssuerLower = (cert.issuer || '').toLowerCase();
      const certText = `${certTitleLower} ${certIssuerLower}`;

      const matchesSkills = skillsLower.some(skill =>
        certText.includes(skill) || skill.includes(certTitleLower)
      );
      if (matchesSkills) return true;

      for (const [roleKey, keywords] of Object.entries(roleCertificateMap)) {
        if (jobTitleLower.includes(roleKey)) {
          const matchesRoleKeywords = keywords.some(keyword => certText.includes(keyword));
          if (matchesRoleKeywords) return true;
        }
      }

      const universalMethodologies = [
        'agile', 'scrum master', 'pmp', 'six sigma', 'lean',
        'leadership', 'communication', 'problem solving',
        'time management', 'emotional intelligence',
        'project management professional',
      ];
      return universalMethodologies.some(keyword => certText.includes(keyword));
    });

    return matched;
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

  private identifyStrengths(candidate: CandidateSummary): string[] {
    const strengths: string[] = [];
    if (candidate.skills.length >= 5) strengths.push(`${candidate.skills.length} verified skills`);
    if (candidate.training_count >= 3) strengths.push(`${candidate.training_count} training programs`);
    if (candidate.experience_count >= 2) strengths.push(`${candidate.experience_count} certifications`);
    if (candidate.cgpa && parseFloat(candidate.cgpa) >= 8.0) strengths.push(`Strong academics (${candidate.cgpa} CGPA)`);
    if (candidate.institution) strengths.push(`${candidate.institution}`);
    return strengths.slice(0, 3);
  }

  private generateRecommendation(matchScore: number, missingCount: number): string {
    if (matchScore >= 85) return 'Excellent match - Fast-track to interview';
    if (matchScore >= 70) return 'Strong candidate - Recommend screening call';
    if (matchScore >= 55) {
      if (missingCount <= 2) return 'Good potential - Trainable gaps';
      return 'Moderate fit - Consider for junior role';
    }
    if (matchScore >= 40) return 'Some alignment - Review for specific strengths';
    return 'Low match - Consider alternative roles';
  }

  async analyzeApplicantsForRecommendation(applicants: Array<{
    id: number;
    learner_id: string;
    opportunity_id: number;
    pipeline_stage?: string;
    learner: {
      id: string;
      name: string;
      email: string;
      university?: string;
      cgpa?: string;
      branch_field?: string;
    };
    opportunity: {
      id: number;
      job_title: string;
      skills_required?: any;
    };
  }>): Promise<{
    topRecommendations: Array<{
      applicantId: number;
      learnerName: string;
      positionTitle: string;
      matchScore: number;
      confidence: 'high' | 'medium' | 'low';
      reasons: string[];
      nextAction: string;
      suggestedStage: string;
      matchedSkills: string[];
      missingSkills: string[];
    }>;
    summary: {
      totalAnalyzed: number;
      highPotential: number;
      mediumPotential: number;
      lowPotential: number;
    };
  }> {
    try {
      if (!applicants || applicants.length === 0) {
        return {
          topRecommendations: [],
          summary: { totalAnalyzed: 0, highPotential: 0, mediumPotential: 0, lowPotential: 0 },
        };
      }

      const recommendations = await Promise.all(
        applicants.map(async (applicant) => {
          try {
            const skills = await apiPost<any[]>('/recruiter-copilot', {
              action: 'fetch-skills',
              learner_ids: [applicant.learner_id],
            });

            const trainingCount = await apiPost<number>('/recruiter-copilot', {
              action: 'count-trainings',
              learner_id: applicant.learner_id,
            });

            const certificates = await apiPost<any[]>('/recruiter-copilot', {
              action: 'fetch-certificates',
              learner_ids: [applicant.learner_id],
            });

            const requiredSkills = Array.isArray(applicant.opportunity.skills_required)
              ? applicant.opportunity.skills_required
              : [];

            const relevantCertificates = this.matchCertificatesToRole(
              certificates || [],
              applicant.opportunity.job_title,
              requiredSkills
            );

            const candidateSkills = skills?.map((s: any) => s.name) || [];
            const certCount = certificates?.length || 0;
            const relevantCertCount = relevantCertificates.length;
            const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase().trim());
            const requiredSkillsLower = requiredSkills.map((s: string) => s.toLowerCase().trim());

            const normalizeSkill = (skill: string) => {
              return skill.toLowerCase().trim().replace(/ing$/i, '').replace(/ed$/i, '');
            };

            const matchedSkillsSet = new Set<string>();
            const matchedSkills: string[] = [];

            candidateSkills.forEach(skill => {
              const normalizedCandidate = normalizeSkill(skill);
              const hasMatch = requiredSkillsLower.some((req: string) => {
                const normalizedRequired = normalizeSkill(req);
                return normalizedCandidate.includes(normalizedRequired) ||
                       normalizedRequired.includes(normalizedCandidate) ||
                       skill.toLowerCase().includes(req) ||
                       req.includes(skill.toLowerCase());
              });
              if (hasMatch && !matchedSkillsSet.has(normalizedCandidate)) {
                matchedSkills.push(skill);
                matchedSkillsSet.add(normalizedCandidate);
              }
            });

            const missingSkills = requiredSkills.filter((req: string) => {
              const normalizedRequired = normalizeSkill(req);
              return !candidateSkillsLower.some((cs: string) => {
                const normalizedCandidate = normalizeSkill(cs);
                return normalizedCandidate.includes(normalizedRequired) ||
                       normalizedRequired.includes(normalizedCandidate) ||
                       cs.includes(req.toLowerCase()) ||
                       req.toLowerCase().includes(cs);
              });
            });

            const profileScore = this.calculateProfileScore({
              hasName: !!applicant.learner.name,
              skillCount: candidateSkills.length,
              trainingCount: trainingCount || 0,
              certCount: certCount,
              hasCGPA: !!applicant.learner.cgpa,
              hasResume: false,
              hasLocation: false,
            });

            const skillMatchPercent = requiredSkills.length > 0
              ? (matchedSkills.length / requiredSkills.length) * 100
              : 50;
            const skillScore = Math.min(skillMatchPercent * 0.6, 60);
            const profileBonus = profileScore * 0.2;
            const trainingBonus = Math.min((trainingCount || 0) * 3, 15);
            const certBonus = Math.min(relevantCertCount * 5, 10);

            const matchScore = Math.min(
              Math.round(skillScore + profileBonus + trainingBonus + certBonus),
              100
            );

            const reasons: string[] = [];
            if (matchedSkills.length > 0) {
              reasons.push(`${matchedSkills.length}/${requiredSkills.length} required skills matched`);
            }
            if ((trainingCount || 0) >= 2) {
              reasons.push(`${trainingCount} training programs completed`);
            }
            if (relevantCertCount >= 1) {
              const certNames = relevantCertificates.slice(0, 2).map(c => c.title).join(', ');
              const remaining = relevantCertCount > 2 ? ` +${relevantCertCount - 2} more` : '';
              reasons.push(`Relevant certifications: ${certNames}${remaining}`);
            } else if (certCount >= 1) {
              reasons.push(`${certCount} certifications (not role-specific)`);
            }
            const cgpa = parseFloat(applicant.learner.cgpa || '0');
            if (cgpa >= 7.5) reasons.push(`Strong academic performance (${cgpa} CGPA)`);
            if (profileScore >= 70) reasons.push(`Complete profile (${profileScore}% completeness)`);
            if (applicant.learner.university &&
                applicant.learner.university.length < 100 &&
                !applicant.learner.university.toLowerCase().includes('botany') &&
                !applicant.learner.university.toLowerCase().includes('zoology')) {
              reasons.push(`From ${applicant.learner.university}`);
            }

            let confidence: 'high' | 'medium' | 'low';
            let nextAction: string;
            let suggestedStage: string;

            if (matchScore >= 75) {
              confidence = 'high';
              nextAction = 'Move to Interview - Strong alignment with requirements';
              suggestedStage = applicant.pipeline_stage === 'sourced' ? 'screened' : 'interview_1';
            } else if (matchScore >= 55) {
              confidence = 'medium';
              nextAction = 'Schedule screening call - Good potential with trainable gaps';
              suggestedStage = 'screened';
            } else if (matchScore >= 40) {
              confidence = 'low';
              nextAction = 'Review carefully - Significant skill gaps to address';
              suggestedStage = 'screened';
            } else {
              confidence = 'low';
              nextAction = 'Not recommended - Consider alternative positions or training';
              suggestedStage = 'screened';
            }

            return {
              applicantId: applicant.id,
              learnerName: applicant.learner.name,
              positionTitle: applicant.opportunity.job_title,
              matchScore,
              confidence,
              reasons: reasons.slice(0, 4),
              nextAction,
              suggestedStage,
              matchedSkills,
              missingSkills,
            };
          } catch (error) {
            logger.error(`Error analyzing applicant ${applicant.id}`, error as Error);
            return null;
          }
        })
      );

      const validRecommendations = recommendations
        .filter(r => r !== null && r!.matchScore > 20)
        .sort((a, b) => b!.matchScore - a!.matchScore);

      return {
        topRecommendations: validRecommendations as any,
        summary: {
          totalAnalyzed: validRecommendations.length,
          highPotential: validRecommendations.filter(r => r!.confidence === 'high').length,
          mediumPotential: validRecommendations.filter(r => r!.confidence === 'medium').length,
          lowPotential: validRecommendations.filter(r => r!.confidence === 'low').length,
        },
      };
    } catch (error) {
      logger.error('Error analyzing applicants', error as Error);
      return {
        topRecommendations: [],
        summary: { totalAnalyzed: 0, highPotential: 0, mediumPotential: 0, lowPotential: 0 },
      };
    }
  }
}

export const recruiterInsights = new RecruiterInsightsService();
