import { supabase } from '../../../lib/supabaseClient';
import { TalentPoolAnalytics } from '../types';

/**
 * Talent Analytics Service
 * Provides aggregated insights about talent pool using actual database schema
 */

class TalentAnalyticsService {
  /**
   * Get comprehensive talent pool analytics
   */
  async getTalentPoolAnalytics(): Promise<TalentPoolAnalytics> {
    try {
      // Get total candidates count
      const { count: totalCandidates } = await supabase
        .from('students')
        .select('user_id', { count: 'exact', head: true })
        .not('name', 'is', null);

      // Get skill distribution from skills table
      const { data: skillsData } = await supabase
        .from('skills')
        .select('name')
        .eq('enabled', true);

      const skillCounts = new Map<string, number>();
      skillsData?.forEach(({ name }) => {
        if (name) {
          const count = skillCounts.get(name) || 0;
          skillCounts.set(name, count + 1);
        }
      });

      const by_skill = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Get location distribution
      const { data: studentsWithLocation } = await supabase
        .from('students')
        .select('city, state')
        .not('city', 'is', null);

      const locationCounts = new Map<string, number>();
      studentsWithLocation?.forEach(({ city, state }) => {
        const location = [city, state].filter(Boolean).join(', ');
        if (location) {
          const count = locationCounts.get(location) || 0;
          locationCounts.set(location, count + 1);
        }
      });

      const by_location = Array.from(locationCounts.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Get institution distribution
      const { data: institutions } = await supabase
        .from('students')
        .select('university')
        .not('university', 'is', null);

      const institutionCounts = new Map<string, number>();
      institutions?.forEach(({ university }) => {
        if (university) {
          const count = institutionCounts.get(university) || 0;
          institutionCounts.set(university, count + 1);
        }
      });

      const top_institutions = Array.from(institutionCounts.entries())
        .map(([institution, count]) => ({ institution, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Identify emerging skills (skills with good distribution but not oversaturated)
      const emerging_skills = this.identifyEmergingSkills(by_skill, totalCandidates || 1);

      // Experience level distribution based on graduation year
      const currentYear = new Date().getFullYear();
      const { data: gradYears } = await supabase
        .from('students')
        .select('expectedGraduationDate');

      const experienceLevels = {
        'Fresh Graduates': 0,
        '1-2 years': 0,
        '2-5 years': 0,
        '5+ years': 0
      };

      gradYears?.forEach(({ expectedGraduationDate }) => {
        if (expectedGraduationDate) {
          const gradYear = parseInt(expectedGraduationDate.split('-')[0]);
          const yearsSinceGrad = currentYear - gradYear;
          
          if (yearsSinceGrad <= 0) {
            experienceLevels['Fresh Graduates']++;
          } else if (yearsSinceGrad <= 2) {
            experienceLevels['1-2 years']++;
          } else if (yearsSinceGrad <= 5) {
            experienceLevels['2-5 years']++;
          } else {
            experienceLevels['5+ years']++;
          }
        }
      });

      const by_experience = Object.entries(experienceLevels).map(
        ([level, count]) => ({ level, count })
      );

      // Estimate availability (mock data - can be enhanced with actual availability tracking)
      const total = totalCandidates || 0;
      const availability_summary = {
        immediate: Math.floor(total * 0.25),
        within_month: Math.floor(total * 0.40),
        within_three_months: Math.floor(total * 0.35)
      };

      return {
        total_candidates: total,
        by_skill,
        by_location,
        by_experience,
        emerging_skills,
        top_institutions,
        availability_summary
      };

    } catch (error) {
      console.error('Error fetching talent pool analytics:', error);
      return {
        total_candidates: 0,
        by_skill: [],
        by_location: [],
        by_experience: [],
        emerging_skills: [],
        top_institutions: [],
        availability_summary: {
          immediate: 0,
          within_month: 0,
          within_three_months: 0
        }
      };
    }
  }

  /**
   * Get skill trends (identify rising skills)
   */
  async getSkillTrends(): Promise<{ skill: string; trend: 'rising' | 'stable' | 'declining' }[]> {
    // Mock implementation - would need historical data tracking
    const trendingSkills = [
      { skill: 'React', trend: 'rising' as const },
      { skill: 'Python', trend: 'rising' as const },
      { skill: 'Machine Learning', trend: 'rising' as const },
      { skill: 'AWS', trend: 'rising' as const },
      { skill: 'TypeScript', trend: 'rising' as const },
      { skill: 'Node.js', trend: 'stable' as const },
      { skill: 'Java', trend: 'stable' as const },
      { skill: 'Docker', trend: 'rising' as const }
    ];
    return trendingSkills;
  }

  /**
   * Identify emerging skills (not oversaturated, good potential)
   */
  private identifyEmergingSkills(
    skillData: { skill: string; count: number }[],
    totalCandidates: number
  ): string[] {
    // Skills that have 5-20% adoption (emerging, not yet oversaturated)
    return skillData
      .filter(s => {
        const adoptionRate = (s.count / totalCandidates) * 100;
        return adoptionRate >= 5 && adoptionRate <= 20;
      })
      .slice(0, 10)
      .map(s => s.skill);
  }

  /**
   * Get market intelligence summary
   */
  async getMarketIntelligence(): Promise<{
    in_demand_skills: string[];
    competitive_roles: string[];
    hiring_velocity: string;
  }> {
    // Analyze from opportunities table
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('skills_required, job_title')
      .eq('is_active', true)
      .limit(100);

    // Extract most requested skills
    const skillDemand = new Map<string, number>();
    opportunities?.forEach(opp => {
      if (Array.isArray(opp.skills_required)) {
        opp.skills_required.forEach((skill: string) => {
          const count = skillDemand.get(skill) || 0;
          skillDemand.set(skill, count + 1);
        });
      }
    });

    const in_demand_skills = Array.from(skillDemand.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);

    // Extract most common roles
    const roleCounts = new Map<string, number>();
    opportunities?.forEach(opp => {
      if (opp.job_title) {
        const count = roleCounts.get(opp.job_title) || 0;
        roleCounts.set(opp.job_title, count + 1);
      }
    });

    const competitive_roles = Array.from(roleCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(entry => entry[0]);

    return {
      in_demand_skills: in_demand_skills.length > 0 ? in_demand_skills : [
        'React', 'Python', 'Java', 'JavaScript', 'SQL', 'Node.js', 'AWS', 'Docker'
      ],
      competitive_roles: competitive_roles.length > 0 ? competitive_roles : [
        'Software Engineer',
        'Full Stack Developer',
        'Data Scientist',
        'Frontend Developer',
        'Backend Developer'
      ],
      hiring_velocity: opportunities && opportunities.length > 10 
        ? 'High - Strong demand in the market' 
        : 'Moderate - Steady hiring activity'
    };
  }
}

export const talentAnalytics = new TalentAnalyticsService();
