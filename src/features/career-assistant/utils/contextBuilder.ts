import { StudentProfile, StudentContext, Opportunity, OpportunityContext } from '../types';

/**
 * Context Builder Utilities
 * Build structured context for AI prompts
 */

/**
 * Build comprehensive student context for AI
 */
export function buildStudentContext(profile: StudentProfile): StudentContext {
  const technicalSkills = profile.profile?.technicalSkills || [];
  const softSkills = profile.profile?.softSkills || [];
  const experience = profile.profile?.experience || [];
  const training = profile.profile?.training || [];
  const education = profile.profile?.education || [];

  return {
    name: profile.name,
    department: profile.department,
    university: profile.university,
    cgpa: profile.cgpa,
    year_of_passing: profile.year_of_passing,
    technical_skills: technicalSkills.map((s: any) => ({
      name: s.name,
      level: s.level || 3,
      category: s.category,
    })),
    soft_skills: softSkills.map((s: any) => s.name),
    experience_years: calculateExperienceYears(experience),
    experience_roles: experience.map((e: any) => e.role),
    completed_training: training
      .filter((t: any) => t.status === 'completed')
      .map((t: any) => t.course),
    education_level: education[0]?.level || 'Bachelor',
    total_experience_count: experience.length,
    total_training_count: training.length,
  };
}

/**
 * Calculate total years of experience
 */
export function calculateExperienceYears(experience: any[]): number {
  // Simple calculation - can be enhanced
  return experience.length > 0 ? experience.length * 0.5 : 0; // Rough estimate
}

/**
 * Build opportunities context for AI matching
 */
export function buildOpportunitiesContext(opportunities: Opportunity[]): OpportunityContext[] {
  return opportunities.map((opp, index) => ({
    index: index + 1,
    id: opp.id,
    title: opp.title,
    company: opp.company_name,
    type: opp.employment_type,
    location: opp.location,
    mode: opp.mode,
    experience: opp.experience_required,
    skills: Array.isArray(opp.skills_required)
      ? opp.skills_required
      : typeof opp.skills_required === 'string'
        ? JSON.parse(opp.skills_required || '[]')
        : [],
    description: opp.description,
    salary: opp.stipend_or_salary,
    deadline: opp.deadline,
  }));
}

/**
 * Extract in-demand skills from job opportunities
 */
export function extractInDemandSkills(opportunities: any[]): string[] {
  const skillsMap = new Map<string, number>();

  opportunities.forEach((opp) => {
    let skills: string[] = [];

    if (Array.isArray(opp.skills_required)) {
      skills = opp.skills_required;
    } else if (typeof opp.skills_required === 'string') {
      try {
        skills = JSON.parse(opp.skills_required);
      } catch (e) {
        // Ignore parse errors
      }
    }

    skills.forEach((skill) => {
      if (skill && typeof skill === 'string') {
        const normalized = skill.toLowerCase().trim();
        skillsMap.set(normalized, (skillsMap.get(normalized) || 0) + 1);
      }
    });
  });

  // Sort by frequency and return top skills
  return Array.from(skillsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);
}
