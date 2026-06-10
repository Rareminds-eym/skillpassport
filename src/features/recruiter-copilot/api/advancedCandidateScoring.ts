import { apiPost } from '@/shared/api/apiClient';

export interface EnrichedCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university: string;
  branch: string;
  cgpa: number | null;
  graduationYear: string;
  city: string;
  state: string;
  country: string;
  skills: Array<{ name: string; level: number; type: string; verified: boolean }>;
  skillCategories: { technical: string[]; soft: string[]; tools: string[] };
  totalSkillCount: number;
  trainings: Array<{ title: string; organization: string; completedDate: string }>;
  certificates: Array<{ name: string; issuer: string; issueDate: string }>;
  projectCount: number;
  hasGitHub: boolean;
  hasLinkedIn: boolean;
  hasPortfolio: boolean;
  resumeUrl: string | null;
  profileCompleteness: number;
  lastActive: string;
  accountAge: number;
  responsiveness: 'high' | 'medium' | 'low' | 'unknown';
  applicationCount: number;
  interviewCount: number;
  scores: {
    technical: number;
    education: number;
    experience: number;
    engagement: number;
    overall: number;
    hiringReadiness: number;
  };
  redFlags: string[];
  greenFlags: string[];
  dataQualityIssues: string[];
}

export interface MatchAnalysis {
  candidate: EnrichedCandidate;
  jobId: string;
  jobTitle: string;
  matchScore: number;
  matchBreakdown: { skillMatch: number; experienceMatch: number; educationMatch: number; locationMatch: number };
  matchedSkills: string[];
  missingSkills: string[];
  transferableSkills: string[];
  recommendation: 'strong-hire' | 'hire' | 'maybe' | 'pass';
  confidenceLevel: number;
  riskLevel: 'low' | 'medium' | 'high';
  nextSteps: string[];
  interviewQuestions: string[];
  assessmentAreas: string[];
}

class AdvancedCandidateScoringService {
  async fetchEnrichedCandidates(limit: number = 50): Promise<EnrichedCandidate[]> {
    try {
      const learners = await apiPost<any[]>('/recruiter-copilot', {
        action: 'fetch-learners-enriched',
        limit,
      });

      if (!learners) return [];

      const learnerIds = learners.map((s: any) => s.user_id);

      const [skillsData, trainingsData, certsData, appliedJobsData] = await Promise.all([
        apiPost<any[]>('/recruiter-copilot', { action: 'fetch-skills', learner_ids: learnerIds }),
        apiPost<any[]>('/recruiter-copilot', { action: 'fetch-trainings', learner_ids: learnerIds }),
        apiPost<any[]>('/recruiter-copilot', { action: 'fetch-certificates', learner_ids: learnerIds }),
        apiPost<any[]>('/recruiter-copilot', {
          action: 'fetch-applied-jobs',
          learner_ids: learnerIds,
          limit: 1000,
        }),
      ]);

      const skillsByLearner = this.groupByLearner(skillsData || []);
      const trainingsByLearner = this.groupByLearner(trainingsData || []);
      const certsByLearner = this.groupByLearner(certsData || []);
      const applicationsByLearner = this.groupByLearner(appliedJobsData || []);

      return learners.map((learner: any) =>
        this.enrichCandidate(
          learner,
          skillsByLearner.get(learner.user_id) || [],
          trainingsByLearner.get(learner.user_id) || [],
          certsByLearner.get(learner.user_id) || [],
          applicationsByLearner.get(learner.user_id) || []
        )
      );
    } catch {
      return [];
    }
  }

  private enrichCandidate(
    learner: any,
    skills: any[],
    trainings: any[],
    certs: any[],
    applications: any[]
  ): EnrichedCandidate {
    const skillCategories = this.categorizeSkills(skills);
    const technicalScore = this.calculateTechnicalScore(skills, trainings, certs);
    const educationScore = this.calculateEducationScore(learner);
    const experienceScore = this.calculateExperienceScore(trainings, certs, applications);
    const engagementScore = this.calculateEngagementScore(learner, applications);

    const overallScore = Math.round(
      technicalScore * 0.35 + educationScore * 0.20 + experienceScore * 0.25 + engagementScore * 0.20
    );

    const hiringReadiness = this.calculateHiringReadiness({
      technical: technicalScore, education: educationScore,
      experience: experienceScore, engagement: engagementScore,
      hasResume: !!learner.resumeUrl,
      profileComplete: this.calculateProfileCompleteness(learner, skills, trainings, certs),
    });

    const redFlags = this.detectRedFlags(learner, skills, applications);
    const greenFlags = this.detectGreenFlags(learner, skills, trainings, certs);
    const dataQualityIssues = this.detectDataQualityIssues(learner, skills);

    const accountAge = Math.floor(
      (new Date().getTime() - new Date(learner.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: learner.user_id,
      name: learner.name,
      email: learner.email,
      phone: learner.phone,
      university: learner.university || 'Not specified',
      branch: learner.branch_field || 'Not specified',
      cgpa: learner.currentCgpa,
      graduationYear: learner.expectedGraduationDate?.split('-')[0] || 'Unknown',
      city: learner.city || '',
      state: learner.state || '',
      country: learner.country || 'India',
      skills: skills.map((s: any) => ({
        name: s.name, level: s.level || 1, type: s.type || 'technical', verified: true,
      })),
      skillCategories,
      totalSkillCount: skills.length,
      trainings: trainings.map((t: any) => ({
        title: t.trainingName, organization: t.organization, completedDate: t.completedDate,
      })),
      certificates: certs.map((c: any) => ({
        name: c.certificateName || c.title,
        issuer: c.issuedBy || c.issuer,
        issueDate: c.issuedDate || c.issueDate,
      })),
      projectCount: 0,
      hasGitHub: !!learner.githubUrl,
      hasLinkedIn: !!learner.linkedinUrl,
      hasPortfolio: !!learner.portfolioUrl,
      resumeUrl: learner.resumeUrl,
      profileCompleteness: this.calculateProfileCompleteness(learner, skills, trainings, certs),
      lastActive: learner.updated_at,
      accountAge,
      responsiveness: this.assessResponsiveness(applications),
      applicationCount: applications.length,
      interviewCount: 0,
      scores: {
        technical: technicalScore, education: educationScore,
        experience: experienceScore, engagement: engagementScore,
        overall: overallScore, hiringReadiness,
      },
      redFlags,
      greenFlags,
      dataQualityIssues,
    };
  }

  private calculateTechnicalScore(skills: any[], trainings: any[], certs: any[]): number {
    let score = 0;
    const skillCount = skills.length;
    score += Math.min(skillCount * 3, 30);
    const avgLevel = skills.reduce((sum: number, s: any) => sum + (s.level || 1), 0) / (skillCount || 1);
    score += avgLevel * 4;
    const techCerts = certs.filter((c: any) =>
      /AWS|Azure|Google Cloud|Oracle|Microsoft|Cisco|CompTIA/i.test(c.issuedBy || c.issuer || '')
    );
    score += Math.min(techCerts.length * 10, 20);
    const advancedTrainings = trainings.filter((t: any) =>
      /Advanced|Expert|Professional|Senior/i.test(t.trainingName || '')
    );
    score += Math.min(advancedTrainings.length * 5, 20);
    return Math.min(Math.round(score), 100);
  }

  private calculateEducationScore(learner: any): number {
    let score = 50;
    if (learner.currentCgpa) {
      if (learner.currentCgpa >= 9.0) score += 30;
      else if (learner.currentCgpa >= 8.0) score += 25;
      else if (learner.currentCgpa >= 7.0) score += 20;
      else if (learner.currentCgpa >= 6.0) score += 10;
    }
    if (learner.university) {
      const topUniversities = ['IIT', 'NIT', 'BITS', 'VIT', 'Manipal', 'SRM'];
      if (topUniversities.some(uni => learner.university.includes(uni))) {
        score += 20;
      } else {
        score += 10;
      }
    }
    return Math.min(score, 100);
  }

  private calculateExperienceScore(trainings: any[], certs: any[], applications: any[]): number {
    let score = 0;
    score += Math.min(trainings.length * 7, 35);
    score += Math.min(certs.length * 7, 35);
    const applicationCount = applications.length;
    if (applicationCount >= 5) score += 30;
    else if (applicationCount >= 3) score += 20;
    else if (applicationCount >= 1) score += 10;
    return Math.min(score, 100);
  }

  private calculateEngagementScore(learner: any, applications: any[]): number {
    let score = 0;
    const profileFields = [
      learner.phone, learner.city, learner.university,
      learner.branch_field, learner.currentCgpa, learner.resumeUrl,
    ];
    const completedFields = profileFields.filter((f: any) => !!f).length;
    score += (completedFields / profileFields.length) * 30;
    if (learner.linkedinUrl) score += 10;
    if (learner.githubUrl) score += 10;

    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(learner.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate <= 7) score += 25;
    else if (daysSinceUpdate <= 30) score += 15;
    else if (daysSinceUpdate <= 90) score += 5;

    const recentApps = applications.filter((app: any) => {
      const appDate = new Date(app.applied_at);
      const daysSince = (new Date().getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    score += Math.min(recentApps.length * 5, 25);

    return Math.min(Math.round(score), 100);
  }

  private calculateHiringReadiness(metrics: {
    technical: number; education: number; experience: number; engagement: number;
    hasResume: boolean; profileComplete: number;
  }): number {
    let readiness = metrics.technical * 0.30 + metrics.education * 0.20 +
      metrics.experience * 0.25 + metrics.engagement * 0.15;
    if (!metrics.hasResume) readiness *= 0.7;
    if (metrics.profileComplete < 50) readiness *= 0.8;
    return Math.min(Math.round(readiness), 100);
  }

  private calculateProfileCompleteness(learner: any, skills: any[], trainings: any[], certs: any[]): number {
    const checks = {
      hasName: !!learner.name,
      hasEmail: !!learner.email,
      hasPhone: !!learner.phone,
      hasUniversity: !!learner.university,
      hasBranch: !!learner.branch_field,
      hasCGPA: !!learner.currentCgpa,
      hasLocation: !!(learner.city && learner.state),
      hasGradYear: !!learner.expectedGraduationDate,
      hasResume: !!learner.resumeUrl,
      hasSkills: skills.length >= 3,
      hasTraining: trainings.length > 0,
      hasCerts: certs.length > 0,
      hasLinkedIn: !!learner.linkedinUrl,
      hasGitHub: !!learner.githubUrl,
    };
    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return Math.round((completed / total) * 100);
  }

  private detectRedFlags(learner: any, skills: any[], applications: any[]): string[] {
    const flags: string[] = [];
    if (skills.length === 0) flags.push('No skills listed in profile');
    const genericSkills = ['testing', 'communication', 'teamwork', 'leadership'];
    const onlyGeneric = skills.every((s: any) =>
      genericSkills.some(g => s.name.toLowerCase().includes(g))
    );
    if (skills.length > 0 && onlyGeneric) flags.push('Only generic/soft skills listed, no technical skills');
    if (!learner.resumeUrl) flags.push('No resume uploaded');
    if (learner.currentCgpa && learner.currentCgpa < 5.5) flags.push(`Low CGPA: ${learner.currentCgpa}/10`);
    if (applications.length > 10) {
      const progressed = applications.filter((a: any) =>
        a.application_status !== 'applied' && a.application_status !== 'rejected'
      );
      if (progressed.length === 0) flags.push('High application volume with no interview progress');
    }
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(learner.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate > 180) flags.push(`Inactive profile (last updated ${Math.floor(daysSinceUpdate / 30)} months ago)`);
    return flags;
  }

  private detectGreenFlags(learner: any, skills: any[], trainings: any[], certs: any[]): string[] {
    const flags: string[] = [];
    if (learner.currentCgpa && learner.currentCgpa >= 8.5) flags.push(`Excellent academics: ${learner.currentCgpa}/10 CGPA`);
    if (skills.length >= 8) flags.push(`Diverse skill set: ${skills.length} skills`);
    if (certs.length >= 3) flags.push(`Well-certified: ${certs.length} certifications`);
    if (trainings.length >= 3) flags.push(`Continuous learner: ${trainings.length} training programs`);
    if (learner.githubUrl) flags.push('Active GitHub profile');
    const completeness = this.calculateProfileCompleteness(learner, skills, trainings, certs);
    if (completeness >= 80) flags.push(`Complete profile: ${completeness}%`);
    const daysSinceUpdate = Math.floor(
      (new Date().getTime() - new Date(learner.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate <= 7) flags.push('Recently active');
    return flags;
  }

  private detectDataQualityIssues(learner: any, skills: any[]): string[] {
    const issues: string[] = [];
    const suspiciousSkills = skills.filter((s: any) =>
      /life|evaluation|test|testing/i.test(s.name) && s.name.split(' ').length <= 2
    );
    if (suspiciousSkills.length > 0) issues.push(`Data quality: Vague skills like "${suspiciousSkills[0].name}"`);
    if (!learner.phone) issues.push('Missing phone number');
    if (!learner.city && !learner.state) issues.push('Missing location');
    if (!learner.expectedGraduationDate) issues.push('Missing graduation date');
    return issues;
  }

  private assessResponsiveness(applications: any[]): 'high' | 'medium' | 'low' | 'unknown' {
    if (applications.length === 0) return 'unknown';
    const recentApps = applications.filter((app: any) => {
      const daysSince = (new Date().getTime() - new Date(app.applied_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    if (recentApps.length >= 3) return 'high';
    if (recentApps.length >= 1) return 'medium';
    return 'low';
  }

  private categorizeSkills(skills: any[]): { technical: string[]; soft: string[]; tools: string[] } {
    const technical: string[] = [];
    const soft: string[] = [];
    const tools: string[] = [];
    const softSkillKeywords = ['communication', 'leadership', 'teamwork', 'management', 'presentation'];
    const toolKeywords = ['git', 'docker', 'kubernetes', 'jenkins', 'jira', 'figma', 'photoshop'];

    skills.forEach((skill: any) => {
      const skillLower = skill.name.toLowerCase();
      if (softSkillKeywords.some(k => skillLower.includes(k))) {
        soft.push(skill.name);
      } else if (toolKeywords.some(k => skillLower.includes(k))) {
        tools.push(skill.name);
      } else {
        technical.push(skill.name);
      }
    });
    return { technical, soft, tools };
  }

  private groupByLearner<T extends { learner_id: string }>(items: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    items.forEach(item => {
      const existing = map.get(item.learner_id) || [];
      map.set(item.learner_id, [...existing, item]);
    });
    return map;
  }
}

export const advancedCandidateScoring = new AdvancedCandidateScoringService();
