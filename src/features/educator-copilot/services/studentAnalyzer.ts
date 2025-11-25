import { StudentProfile, Opportunity } from './educatorDataService';

/**
 * Student Analyzer Service
 * Provides deep analysis of individual student profiles
 */

export interface StudentAnalysis {
  studentId: string;
  studentName: string;
  overallScore: number; // 0-100
  careerReadiness: 'High' | 'Medium' | 'Low';
  riskLevel: 'High' | 'Medium' | 'Low' | 'None';
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  recommendations: string[];
  metrics: {
    technicalSkillCount: number;
    avgSkillLevel: number;
    projectCount: number;
    completedProjects: number;
    trainingCount: number;
    completedTraining: number;
    avgTrainingProgress: number;
    certificateCount: number;
    experienceYears: number;
  };
  flags: {
    hasStagnantTraining: boolean;
    hasLowSkillDiversity: boolean;
    hasNoProjects: boolean;
    hasInactiveProfile: boolean;
    hasHighPotential: boolean;
  };
}

export interface SkillMatch {
  skill: string;
  studentLevel: number;
  hasSkill: boolean;
}

export interface OpportunityMatch {
  opportunityId: number;
  opportunityTitle: string;
  companyName: string;
  matchScore: number; // 0-100
  matchingSkills: SkillMatch[];
  missingSkills: string[];
  experienceMatch: boolean;
  recommendation: 'Ready' | 'Close' | 'Needs Training';
}

class StudentAnalyzerService {
  /**
   * Analyze a single student comprehensively
   */
  analyzeStudent(student: StudentProfile): StudentAnalysis {
    const profile = student.profile;
    
    // Get enabled items only
    const technicalSkills = (profile.technicalSkills || []).filter(s => s.enabled !== false);
    const softSkills = (profile.softSkills || []);
    const projects = (profile.projects || []).filter(p => p.enabled !== false);
    const training = (profile.training || []).filter(t => t.enabled !== false);
    const experience = (profile.experience || []).filter(e => e.enabled !== false);
    const certificates = (profile.certificates || []).filter(c => c.enabled !== false);

    // Calculate metrics
    const metrics = {
      technicalSkillCount: technicalSkills.length,
      avgSkillLevel: this.calculateAverageSkillLevel(technicalSkills),
      projectCount: projects.length,
      completedProjects: projects.filter(p => p.status === 'Completed' || p.status === 'completed').length,
      trainingCount: training.length,
      completedTraining: training.filter(t => t.status === 'completed').length,
      avgTrainingProgress: this.calculateAverageProgress(training),
      certificateCount: certificates.length,
      experienceYears: this.estimateExperienceYears(experience),
    };

    // Detect flags
    const flags = {
      hasStagnantTraining: this.detectStagnantTraining(training),
      hasLowSkillDiversity: technicalSkills.length < 3,
      hasNoProjects: projects.length === 0,
      hasInactiveProfile: this.detectInactiveProfile(profile.updatedAt),
      hasHighPotential: this.detectHighPotential(metrics, technicalSkills, projects),
    };

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(metrics, flags);

    // Determine career readiness
    const careerReadiness = this.assessCareerReadiness(metrics, flags);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(metrics, flags);

    // Generate strengths
    const strengths = this.identifyStrengths(metrics, technicalSkills, projects, training);

    // Generate weaknesses
    const weaknesses = this.identifyWeaknesses(metrics, flags);

    // Identify skill gaps
    const skillGaps = this.identifySkillGaps(technicalSkills, training);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, flags, skillGaps);

    return {
      studentId: student.id,
      studentName: profile.name,
      overallScore,
      careerReadiness,
      riskLevel,
      strengths,
      weaknesses,
      skillGaps,
      recommendations,
      metrics,
      flags,
    };
  }

  /**
   * Match a student to opportunities
   */
  matchStudentToOpportunities(
    student: StudentProfile,
    opportunities: Opportunity[]
  ): OpportunityMatch[] {
    const profile = student.profile;
    const studentSkills = (profile.technicalSkills || [])
      .filter(s => s.enabled !== false)
      .map(s => s.name.toLowerCase());
    
    const studentSkillLevels = new Map(
      (profile.technicalSkills || [])
        .filter(s => s.enabled !== false)
        .map(s => [s.name.toLowerCase(), s.level])
    );

    const experienceYears = this.estimateExperienceYears(profile.experience || []);

    return opportunities.map(opp => {
      const requiredSkills = (opp.skills_required || []).map(s => s.toLowerCase());
      
      // Match skills
      const matchingSkills: SkillMatch[] = requiredSkills.map(reqSkill => {
        const hasSkill = studentSkills.includes(reqSkill);
        const level = studentSkillLevels.get(reqSkill) || 0;
        return {
          skill: reqSkill,
          studentLevel: level,
          hasSkill,
        };
      });

      const matchedCount = matchingSkills.filter(m => m.hasSkill).length;
      const totalRequired = requiredSkills.length || 1;
      const skillMatchScore = (matchedCount / totalRequired) * 100;

      // Check experience match
      const experienceMatch = this.checkExperienceMatch(experienceYears, opp.experience_level);

      // Calculate overall match score (70% skills, 30% experience)
      const matchScore = Math.round(skillMatchScore * 0.7 + (experienceMatch ? 30 : 0));

      // Determine recommendation
      let recommendation: 'Ready' | 'Close' | 'Needs Training';
      if (matchScore >= 80) recommendation = 'Ready';
      else if (matchScore >= 60) recommendation = 'Close';
      else recommendation = 'Needs Training';

      // Missing skills
      const missingSkills = matchingSkills
        .filter(m => !m.hasSkill)
        .map(m => m.skill);

      return {
        opportunityId: opp.id,
        opportunityTitle: opp.job_title,
        companyName: opp.company_name,
        matchScore,
        matchingSkills,
        missingSkills,
        experienceMatch,
        recommendation,
      };
    }).sort((a, b) => b.matchScore - a.matchScore); // Sort by best match first
  }

  // Private helper methods
  private calculateAverageSkillLevel(skills: any[]): number {
    if (skills.length === 0) return 0;
    const sum = skills.reduce((acc, s) => acc + (s.level || 0), 0);
    return Math.round(sum / skills.length);
  }

  private calculateAverageProgress(training: any[]): number {
    if (training.length === 0) return 0;
    const sum = training.reduce((acc, t) => acc + (t.progress || 0), 0);
    return Math.round(sum / training.length);
  }

  private estimateExperienceYears(experience: any[]): number {
    let totalYears = 0;
    for (const exp of experience) {
      if (exp.duration) {
        const match = exp.duration.match(/(\d+)\s*(year|yr)/i);
        if (match) {
          totalYears += parseInt(match[1]);
        }
      }
    }
    return totalYears;
  }

  private detectStagnantTraining(training: any[]): boolean {
    const ongoingTraining = training.filter(t => t.status === 'ongoing');
    return ongoingTraining.some(t => t.progress < 50);
  }

  private detectInactiveProfile(updatedAt?: string): boolean {
    if (!updatedAt) return true;
    const lastUpdate = new Date(updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 60; // Inactive if no update in 60 days
  }

  private detectHighPotential(metrics: any, skills: any[], projects: any[]): boolean {
    return (
      metrics.avgSkillLevel >= 4 &&
      metrics.technicalSkillCount >= 5 &&
      metrics.completedProjects >= 2
    );
  }

  private calculateRiskLevel(metrics: any, flags: any): 'High' | 'Medium' | 'Low' | 'None' {
    let riskPoints = 0;
    
    if (flags.hasNoProjects) riskPoints += 3;
    if (flags.hasLowSkillDiversity) riskPoints += 2;
    if (flags.hasStagnantTraining) riskPoints += 2;
    if (flags.hasInactiveProfile) riskPoints += 2;
    if (metrics.avgTrainingProgress < 30) riskPoints += 2;
    if (metrics.technicalSkillCount === 0) riskPoints += 3;

    if (riskPoints >= 6) return 'High';
    if (riskPoints >= 3) return 'Medium';
    if (riskPoints >= 1) return 'Low';
    return 'None';
  }

  private assessCareerReadiness(metrics: any, flags: any): 'High' | 'Medium' | 'Low' {
    let readinessScore = 0;
    
    if (metrics.technicalSkillCount >= 5) readinessScore += 2;
    else if (metrics.technicalSkillCount >= 3) readinessScore += 1;
    
    if (metrics.avgSkillLevel >= 4) readinessScore += 2;
    else if (metrics.avgSkillLevel >= 3) readinessScore += 1;
    
    if (metrics.completedProjects >= 2) readinessScore += 2;
    else if (metrics.completedProjects >= 1) readinessScore += 1;
    
    if (metrics.certificateCount >= 2) readinessScore += 1;
    if (metrics.experienceYears >= 1) readinessScore += 2;
    
    if (flags.hasHighPotential) readinessScore += 2;

    if (readinessScore >= 7) return 'High';
    if (readinessScore >= 4) return 'Medium';
    return 'Low';
  }

  private calculateOverallScore(metrics: any, flags: any): number {
    let score = 0;
    
    // Skills (30 points)
    score += Math.min(metrics.technicalSkillCount * 2, 15);
    score += metrics.avgSkillLevel * 3;
    
    // Projects (20 points)
    score += Math.min(metrics.completedProjects * 5, 20);
    
    // Training (20 points)
    score += Math.min(metrics.completedTraining * 4, 12);
    score += (metrics.avgTrainingProgress / 100) * 8;
    
    // Experience & Certificates (15 points)
    score += Math.min(metrics.experienceYears * 5, 10);
    score += Math.min(metrics.certificateCount * 2.5, 5);
    
    // Bonus for high potential (15 points)
    if (flags.hasHighPotential) score += 15;
    
    // Penalties
    if (flags.hasNoProjects) score -= 10;
    if (flags.hasLowSkillDiversity) score -= 5;
    if (flags.hasStagnantTraining) score -= 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private identifyStrengths(metrics: any, skills: any[], projects: any[], training: any[]): string[] {
    const strengths: string[] = [];
    
    if (metrics.avgSkillLevel >= 4) {
      strengths.push(`Strong technical skills (avg level ${metrics.avgSkillLevel}/5)`);
    }
    
    if (metrics.technicalSkillCount >= 5) {
      strengths.push(`Diverse skill set (${metrics.technicalSkillCount} technical skills)`);
    }
    
    if (metrics.completedProjects >= 2) {
      strengths.push(`Good project experience (${metrics.completedProjects} completed)`);
    }
    
    if (metrics.completedTraining >= 2) {
      strengths.push(`Continuous learner (${metrics.completedTraining} courses completed)`);
    }
    
    if (metrics.experienceYears >= 1) {
      strengths.push(`Professional experience (${metrics.experienceYears}+ years)`);
    }

    // Identify top skills
    const topSkills = skills
      .filter(s => s.level >= 4)
      .sort((a, b) => b.level - a.level)
      .slice(0, 3)
      .map(s => s.name);
    
    if (topSkills.length > 0) {
      strengths.push(`Expert in: ${topSkills.join(', ')}`);
    }
    
    return strengths;
  }

  private identifyWeaknesses(metrics: any, flags: any): string[] {
    const weaknesses: string[] = [];
    
    if (flags.hasNoProjects) {
      weaknesses.push('No practical project experience');
    }
    
    if (flags.hasLowSkillDiversity) {
      weaknesses.push(`Limited technical skills (only ${metrics.technicalSkillCount})`);
    }
    
    if (flags.hasStagnantTraining) {
      weaknesses.push('Incomplete training courses (low progress)');
    }
    
    if (metrics.avgSkillLevel < 3) {
      weaknesses.push('Skills need more development (low proficiency)');
    }
    
    if (metrics.certificateCount === 0) {
      weaknesses.push('No verified certifications');
    }
    
    if (flags.hasInactiveProfile) {
      weaknesses.push('Profile not updated recently');
    }
    
    return weaknesses;
  }

  private identifySkillGaps(skills: any[], training: any[]): string[] {
    const gaps: string[] = [];
    
    // Common industry skills
    const commonSkills = ['react', 'node', 'python', 'sql', 'git', 'docker', 'aws', 'typescript'];
    const studentSkills = skills.map(s => s.name.toLowerCase());
    
    const missing = commonSkills.filter(cs => !studentSkills.some(ss => ss.includes(cs)));
    
    return missing.slice(0, 5); // Top 5 gaps
  }

  private generateRecommendations(metrics: any, flags: any, skillGaps: string[]): string[] {
    const recommendations: string[] = [];
    
    if (flags.hasNoProjects) {
      recommendations.push('Start a portfolio project to demonstrate practical skills');
    }
    
    if (flags.hasStagnantTraining) {
      recommendations.push('Complete ongoing training courses to build momentum');
    }
    
    if (flags.hasLowSkillDiversity) {
      recommendations.push('Learn 2-3 complementary technologies to broaden skill set');
    }
    
    if (skillGaps.length > 0) {
      recommendations.push(`Focus on in-demand skills: ${skillGaps.slice(0, 3).join(', ')}`);
    }
    
    if (metrics.certificateCount === 0) {
      recommendations.push('Earn industry-recognized certifications to validate skills');
    }
    
    if (metrics.completedProjects >= 1 && metrics.avgSkillLevel >= 3) {
      recommendations.push('Apply to internships or entry-level positions');
    }
    
    if (flags.hasInactiveProfile) {
      recommendations.push('Update profile with recent activities and achievements');
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  private checkExperienceMatch(studentYears: number, requiredLevel: string): boolean {
    const level = (requiredLevel || '').toLowerCase();
    
    if (level.includes('entry') || level.includes('junior') || level.includes('fresher')) {
      return studentYears >= 0;
    }
    if (level.includes('mid') || level.includes('intermediate')) {
      return studentYears >= 2;
    }
    if (level.includes('senior') || level.includes('lead')) {
      return studentYears >= 5;
    }
    
    return true; // Default to true if level not specified
  }
}

export const studentAnalyzer = new StudentAnalyzerService();
