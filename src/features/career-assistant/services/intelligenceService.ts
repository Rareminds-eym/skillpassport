/**
 * Deep Database Intelligence Service
 * Provides advanced analytics, career readiness scoring, and intelligent insights
 */

import { supabase } from '../../../lib/supabaseClient';
import { StudentProfile } from '../types';

export interface CareerReadinessScore {
  overall_score: number;
  profile_completeness: number;
  skills_marketability: number;
  experience_level: number;
  project_quality: number;
  learning_consistency: number;
  breakdown: {
    strengths: string[];
    weaknesses: string[];
    criticalGaps: string[];
  };
  recommendations: string[];
}

export interface MarketIntelligence {
  topDemandSkills: Array<{ skill: string; demand: number; growth: string }>;
  salaryTrends: Record<string, { min: number; max: number; avg: number }>;
  emergingTechnologies: string[];
  jobGrowthAreas: string[];
}

export interface PeerComparison {
  cohort: string;
  yourRank: string; // "top 10%", "top 25%", etc
  avgSkillsCount: number;
  avgProjectsCount: number;
  avgTrainingHours: number;
  recommendations: string[];
}

export interface ProfileHealthAnalysis {
  completeness_score: number;
  missing_sections: string[];
  weak_sections: Array<{ section: string; reason: string; impact: string }>;
  improvement_suggestions: Array<{ action: string; priority: string; impact: string }>;
  estimated_impact: 'high' | 'medium' | 'low';
}

class IntelligenceService {
  /**
   * Calculate comprehensive career readiness score
   */
  async calculateCareerReadiness(profile: StudentProfile): Promise<CareerReadinessScore> {
    const scores = {
      profileCompleteness: this.scoreProfileCompleteness(profile),
      skillsMarketability: await this.scoreSkillsMarketability(profile),
      experienceLevel: this.scoreExperienceLevel(profile),
      projectQuality: this.scoreProjectQuality(profile),
      learningConsistency: this.scoreLearningConsistency(profile)
    };

    // Weighted overall score
    const overallScore = 
      scores.profileCompleteness * 0.20 +
      scores.skillsMarketability * 0.30 +
      scores.experienceLevel * 0.20 +
      scores.projectQuality * 0.20 +
      scores.learningConsistency * 0.10;

    const breakdown = this.analyzeScoreBreakdown(scores, profile);

    // Save to database
    await this.saveReadinessScore(profile.id, {
      overall_score: overallScore,
      ...scores,
      breakdown,
      recommendations: breakdown.recommendations
    });

    return {
      overall_score: Math.round(overallScore),
      profile_completeness: Math.round(scores.profileCompleteness),
      skills_marketability: Math.round(scores.skillsMarketability),
      experience_level: Math.round(scores.experienceLevel),
      project_quality: Math.round(scores.projectQuality),
      learning_consistency: Math.round(scores.learningConsistency),
      breakdown: {
        strengths: breakdown.strengths,
        weaknesses: breakdown.weaknesses,
        criticalGaps: breakdown.criticalGaps
      },
      recommendations: breakdown.recommendations
    };
  }

  /**
   * Score profile completeness (0-100)
   */
  private scoreProfileCompleteness(profile: StudentProfile): number {
    let score = 0;
    const weights = {
      basicInfo: 10,
      education: 15,
      skills: 25,
      projects: 20,
      training: 15,
      experience: 10,
      certificates: 5
    };

    // Basic info
    if (profile.name && profile.email) score += weights.basicInfo;

    // Education
    if (profile.profile?.education && profile.profile.education.length > 0) {
      score += weights.education;
    }

    // Skills
    const skillsCount = profile.profile?.technicalSkills?.length || 0;
    if (skillsCount >= 5) {
      score += weights.skills;
    } else if (skillsCount > 0) {
      score += weights.skills * (skillsCount / 5);
    }

    // Projects
    const projectsCount = profile.profile?.projects?.length || 0;
    if (projectsCount >= 3) {
      score += weights.projects;
    } else if (projectsCount > 0) {
      score += weights.projects * (projectsCount / 3);
    }

    // Training
    const trainingCount = profile.profile?.training?.length || 0;
    if (trainingCount >= 2) {
      score += weights.training;
    } else if (trainingCount > 0) {
      score += weights.training * (trainingCount / 2);
    }

    // Experience
    const experienceCount = profile.profile?.experience?.length || 0;
    if (experienceCount > 0) {
      score += weights.experience;
    }

    // Certificates
    const certsCount = profile.profile?.certificates?.length || 0;
    if (certsCount > 0) {
      score += weights.certificates;
    }

    return Math.min(100, score);
  }

  /**
   * Score how marketable the student's skills are
   */
  private async scoreSkillsMarketability(profile: StudentProfile): Promise<number> {
    const skills = profile.profile?.technicalSkills || [];
    
    if (skills.length === 0) return 0;

    // Get in-demand skills from market
    const marketSkills = await this.getInDemandSkills();
    
    let matchScore = 0;
    let totalLevel = 0;

    skills.forEach((skill: any) => {
      const skillName = skill.name?.toLowerCase();
      const isInDemand = marketSkills.some(ms => 
        ms.toLowerCase().includes(skillName) || skillName.includes(ms.toLowerCase())
      );

      if (isInDemand) {
        // Highly demanded skills weighted by proficiency level
        matchScore += (skill.level || 3) * 10;
      } else {
        // Other skills count less
        matchScore += (skill.level || 3) * 3;
      }
      
      totalLevel += skill.level || 3;
    });

    // Normalize: balance between demand match and skill depth
    const demandScore = Math.min(70, matchScore);
    const depthScore = Math.min(30, (totalLevel / skills.length) * 6);

    return Math.min(100, demandScore + depthScore);
  }

  /**
   * Score experience level
   */
  private scoreExperienceLevel(profile: StudentProfile): number {
    const experience = profile.profile?.experience || [];
    const projects = profile.profile?.projects || [];
    
    let score = 0;

    // Formal experience (internships, jobs)
    const formalExp = experience.filter((e: any) => 
      e.type !== 'project' && e.role && e.company
    );
    score += Math.min(50, formalExp.length * 25);

    // Project experience
    const completedProjects = projects.filter((p: any) => 
      p.status === 'Completed' || p.status === 'completed'
    );
    score += Math.min(50, completedProjects.length * 12);

    return Math.min(100, score);
  }

  /**
   * Score project quality
   */
  private scoreProjectQuality(profile: StudentProfile): number {
    const projects = profile.profile?.projects || [];
    
    if (projects.length === 0) return 0;

    let totalQuality = 0;

    projects.forEach((project: any) => {
      let quality = 0;

      // Has description
      if (project.description && project.description.length > 50) quality += 20;

      // Has technologies listed
      const techCount = (project.skills || project.technologies || project.techStack || []).length;
      quality += Math.min(30, techCount * 10);

      // Is completed
      if (project.status === 'Completed' || project.status === 'completed') quality += 20;

      // Has duration (shows commitment)
      if (project.duration) quality += 10;

      // Has link (deployed/accessible)
      if (project.link || project.github || project.demo) quality += 20;

      totalQuality += quality;
    });

    return Math.min(100, totalQuality / projects.length);
  }

  /**
   * Score learning consistency
   */
  private scoreLearningConsistency(profile: StudentProfile): number {
    const training = profile.profile?.training || [];
    
    if (training.length === 0) return 0;

    let score = 0;

    // Count completed courses
    const completed = training.filter((t: any) => t.status === 'completed');
    const ongoing = training.filter((t: any) => t.status === 'ongoing');

    // Completion rate
    if (training.length > 0) {
      const completionRate = completed.length / training.length;
      score += completionRate * 50;
    }

    // Active learning (ongoing courses)
    score += Math.min(30, ongoing.length * 15);

    // Diversity of learning
    const uniqueSkills = new Set<string>();
    training.forEach((t: any) => {
      if (t.skills && Array.isArray(t.skills)) {
        t.skills.forEach((skill: string) => uniqueSkills.add(skill.toLowerCase()));
      }
    });
    score += Math.min(20, uniqueSkills.size * 4);

    return Math.min(100, score);
  }

  /**
   * Analyze score breakdown to provide insights
   */
  private analyzeScoreBreakdown(scores: any, profile: StudentProfile) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const criticalGaps: string[] = [];
    const recommendations: string[] = [];

    // Analyze each component
    if (scores.profileCompleteness >= 80) {
      strengths.push('Complete and detailed profile');
    } else if (scores.profileCompleteness < 50) {
      weaknesses.push('Incomplete profile');
      criticalGaps.push('profile_completeness');
      recommendations.push('Complete your profile - add missing sections for better job matches');
    }

    if (scores.skillsMarketability >= 70) {
      strengths.push('High-demand skills');
    } else if (scores.skillsMarketability < 40) {
      weaknesses.push('Limited marketable skills');
      criticalGaps.push('skills');
      recommendations.push('Learn in-demand skills like React, Node.js, Python, or AWS');
    }

    if (scores.projectQuality >= 70) {
      strengths.push('Strong project portfolio');
    } else {
      weaknesses.push('Need better quality projects');
      criticalGaps.push('projects');
      recommendations.push('Build 2-3 substantial projects with clear descriptions and deployed demos');
    }

    if (scores.experienceLevel < 30) {
      weaknesses.push('Limited practical experience');
      criticalGaps.push('experience');
      recommendations.push('Apply for internships or contribute to open-source projects');
    }

    if (scores.learningConsistency < 50) {
      weaknesses.push('Inconsistent learning pattern');
      recommendations.push('Complete ongoing courses and maintain regular learning schedule');
    }

    return { strengths, weaknesses, criticalGaps, recommendations };
  }

  /**
   * Get in-demand skills from market intelligence
   */
  private async getInDemandSkills(): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('opportunities')
        .select('skills_required')
        .limit(50);

      if (!data) return this.getDefaultInDemandSkills();

      const skillsMap = new Map<string, number>();
      
      data.forEach((job: any) => {
        let skills: string[] = [];
        if (Array.isArray(job.skills_required)) {
          skills = job.skills_required;
        } else if (typeof job.skills_required === 'string') {
          try {
            skills = JSON.parse(job.skills_required);
          } catch (e) {}
        }

        skills.forEach(skill => {
          if (skill) {
            const normalized = skill.toLowerCase().trim();
            skillsMap.set(normalized, (skillsMap.get(normalized) || 0) + 1);
          }
        });
      });

      return Array.from(skillsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([skill]) => skill);
    } catch (error) {
      console.error('Error fetching in-demand skills:', error);
      return this.getDefaultInDemandSkills();
    }
  }

  /**
   * Default in-demand skills (fallback)
   */
  private getDefaultInDemandSkills(): string[] {
    return [
      'react', 'javascript', 'python', 'java', 'node.js', 'sql',
      'aws', 'docker', 'kubernetes', 'typescript', 'mongodb',
      'git', 'rest api', 'microservices', 'agile', 'ci/cd'
    ];
  }

  /**
   * Save readiness score to database
   */
  private async saveReadinessScore(studentId: string, data: any): Promise<void> {
    try {
      await supabase.from('career_readiness_scores').insert({
        student_id: studentId,
        overall_score: data.overall_score,
        profile_completeness: data.profileCompleteness,
        skills_marketability: data.skillsMarketability,
        experience_level: data.experienceLevel,
        project_quality: data.projectQuality,
        learning_consistency: data.learningConsistency,
        breakdown: data.breakdown,
        recommendations: data.recommendations
      });
    } catch (error) {
      console.error('Error saving readiness score:', error);
    }
  }

  /**
   * Analyze profile health and provide actionable insights
   */
  async analyzeProfileHealth(profile: StudentProfile): Promise<ProfileHealthAnalysis> {
    const missingSections: string[] = [];
    const weakSections: Array<{ section: string; reason: string; impact: string }> = [];
    const suggestions: Array<{ action: string; priority: string; impact: string }> = [];

    // Check missing sections
    if (!profile.profile?.education || profile.profile.education.length === 0) {
      missingSections.push('education');
      suggestions.push({
        action: 'Add your education details (degree, university, CGPA)',
        priority: 'high',
        impact: '+15% profile score'
      });
    }

    if (!profile.profile?.technicalSkills || profile.profile.technicalSkills.length === 0) {
      missingSections.push('skills');
      suggestions.push({
        action: 'Add at least 5 technical skills relevant to your field',
        priority: 'critical',
        impact: '+25% profile score, +40% job matches'
      });
    }

    if (!profile.profile?.projects || profile.profile.projects.length === 0) {
      missingSections.push('projects');
      suggestions.push({
        action: 'Add 2-3 projects with descriptions and tech stack',
        priority: 'high',
        impact: '+20% profile score, significantly improves job matches'
      });
    }

    if (!profile.profile?.training || profile.profile.training.length === 0) {
      missingSections.push('training');
      suggestions.push({
        action: 'Add completed courses or certifications',
        priority: 'medium',
        impact: '+15% profile score'
      });
    }

    // Check weak sections (exist but need improvement)
    const skills = profile.profile?.technicalSkills || [];
    if (skills.length > 0 && skills.length < 5) {
      weakSections.push({
        section: 'skills',
        reason: `Only ${skills.length} skills listed. Employers prefer 5-8 relevant skills.`,
        impact: 'medium'
      });
      suggestions.push({
        action: `Add ${5 - skills.length} more relevant skills to reach optimal count`,
        priority: 'medium',
        impact: '+10% job matches'
      });
    }

    const projects = profile.profile?.projects || [];
    if (projects.length > 0 && projects.length < 3) {
      weakSections.push({
        section: 'projects',
        reason: `Only ${projects.length} projects. 3+ projects show consistent building.`,
        impact: 'high'
      });
    }

    // Check project quality
    const projectsWithoutDescription = projects.filter((p: any) => 
      !p.description || p.description.length < 50
    );
    if (projectsWithoutDescription.length > 0) {
      weakSections.push({
        section: 'project_quality',
        reason: `${projectsWithoutDescription.length} projects lack detailed descriptions`,
        impact: 'medium'
      });
      suggestions.push({
        action: 'Add detailed descriptions to your projects (what, why, how, tech used)',
        priority: 'medium',
        impact: 'Better recruiter understanding'
      });
    }

    // Calculate completeness
    const totalSections = 6; // education, skills, projects, training, experience, certificates
    const completeSections = totalSections - missingSections.length - (weakSections.length * 0.5);
    const completenessScore = Math.round((completeSections / totalSections) * 100);

    // Estimate impact
    let estimatedImpact: 'high' | 'medium' | 'low' = 'low';
    if (missingSections.length >= 3 || weakSections.length >= 4) {
      estimatedImpact = 'high';
    } else if (missingSections.length >= 1 || weakSections.length >= 2) {
      estimatedImpact = 'medium';
    }

    // Save to database
    await supabase.from('profile_health_analysis').insert({
      student_id: profile.id,
      completeness_score: completenessScore,
      missing_sections: missingSections,
      weak_sections: weakSections,
      improvement_suggestions: suggestions,
      estimated_impact: estimatedImpact
    });

    return {
      completeness_score: completenessScore,
      missing_sections: missingSections,
      weak_sections: weakSections,
      improvement_suggestions: suggestions,
      estimated_impact: estimatedImpact
    };
  }

  /**
   * Get peer comparison insights
   */
  async getPeerComparison(profile: StudentProfile): Promise<PeerComparison> {
    // Determine cohort (e.g., "cs_2024", "engineering_fresher")
    const cohort = this.determineCohort(profile);

    try {
      // Get benchmark data for cohort
      const { data: benchmarks } = await supabase
        .from('peer_benchmarks')
        .select('*')
        .eq('cohort', cohort)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (benchmarks) {
        const yourSkills = profile.profile?.technicalSkills?.length || 0;
        const yourProjects = profile.profile?.projects?.length || 0;
        const avgSkills = benchmarks.metric_value.avg_skills || 5;
        const avgProjects = benchmarks.metric_value.avg_projects || 2;

        // Calculate rank
        const skillsRank = yourSkills >= avgSkills * 1.5 ? 'top 10%' : 
                          yourSkills >= avgSkills * 1.2 ? 'top 25%' :
                          yourSkills >= avgSkills ? 'top 50%' : 'below average';

        const recommendations: string[] = [];
        if (yourSkills < avgSkills) {
          recommendations.push(`Add ${Math.ceil(avgSkills - yourSkills)} more skills to match peer average`);
        }
        if (yourProjects < avgProjects) {
          recommendations.push(`Build ${Math.ceil(avgProjects - yourProjects)} more projects to match peers`);
        }

        return {
          cohort,
          yourRank: skillsRank,
          avgSkillsCount: avgSkills,
          avgProjectsCount: avgProjects,
          avgTrainingHours: benchmarks.metric_value.avg_training_hours || 40,
          recommendations
        };
      }
    } catch (error) {
      console.error('Error fetching peer comparison:', error);
    }

    // Return default comparison
    return {
      cohort,
      yourRank: 'Calculating...',
      avgSkillsCount: 5,
      avgProjectsCount: 2,
      avgTrainingHours: 40,
      recommendations: ['Complete your profile for accurate peer comparison']
    };
  }

  /**
   * Determine student cohort for comparison
   */
  private determineCohort(profile: StudentProfile): string {
    const department = profile.department?.toLowerCase() || 'general';
    const year = profile.year_of_passing || new Date().getFullYear().toString();
    
    // Simplify department to category
    let category = 'general';
    if (department.includes('computer') || department.includes('cs') || department.includes('software')) {
      category = 'cs';
    } else if (department.includes('engineer')) {
      category = 'engineering';
    } else if (department.includes('data') || department.includes('analytics')) {
      category = 'data';
    }

    return `${category}_${year}`;
  }
}

export const intelligenceService = new IntelligenceService();
export default intelligenceService;

