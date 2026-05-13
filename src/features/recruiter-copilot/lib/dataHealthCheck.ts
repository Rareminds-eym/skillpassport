import { supabase } from '@/shared/api/supabaseClient';

/**
 * Data Health Check Utility
 * 
 * Senior-level database validation to ensure recruiter AI has quality data
 * Provides actionable insights when data is missing or incomplete
 */

export interface DataHealthReport {
  status: 'healthy' | 'warning' | 'critical';
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    category: 'skills' | 'learners' | 'opportunities' | 'pipeline';
    issue: string;
    recommendation: string;
    affectedCount?: number;
  }>;
  summary: {
    total_learners: number;
    learners_with_skills: number;
    total_skills: number;
    unique_skill_names: number;
    avg_skills_per_learner: number;
    learners_with_location: number;
    learners_with_cgpa: number;
  };
}

class DataHealthCheckService {
  
  /**
   * Comprehensive data health check
   */
  async checkDataHealth(): Promise<DataHealthReport> {
    const issues: DataHealthReport['issues'] = [];
    
    // Check 1: Total learners
    const { count: totallearners } = await supabase
      .from('learners')
      .select('user_id', { count: 'exact', head: true })
      .not('name', 'is', null);

    // Check 2: Learners with skills
    const { data: learnersWithSkills } = await supabase
      .from('skills')
      .select('learner_id')
      .eq('enabled', true);
    
    const uniquelearnersWithSkills = new Set(learnersWithSkills?.map(s => s.learner_id) || []).size;

    // Check 3: Total skills
    const { count: totalSkills } = await supabase
      .from('skills')
      .select('id', { count: 'exact', head: true })
      .eq('enabled', true);

    // Check 4: Unique skill names
    const { data: skillNames } = await supabase
      .from('skills')
      .select('name')
      .eq('enabled', true);
    
    const uniqueSkillNames = new Set(skillNames?.map(s => s.name) || []).size;

    // Check 5: Learners with location data
    const { count: learnersWithLocation } = await supabase
      .from('learners')
      .select('user_id', { count: 'exact', head: true })
      .not('name', 'is', null)
      .not('city', 'is', null);

    // Check 6: Learners with CGPA
    const { count: learnersWithCGPA } = await supabase
      .from('learners')
      .select('user_id', { count: 'exact', head: true })
      .not('name', 'is', null)
      .not('currentCgpa', 'is', null);

    // Calculate metrics
    const avgSkillsPerLearner = uniquelearnersWithSkills > 0 
      ? (totalSkills || 0) / uniquelearnersWithSkills 
      : 0;

    const skillCoveragePercent = totallearners && totallearners > 0
      ? (uniquelearnersWithSkills / totallearners) * 100
      : 0;

    const locationCoveragePercent = totallearners && totallearners > 0
      ? ((learnersWithLocation || 0) / totallearners) * 100
      : 0;

    const cgpaCoveragePercent = totallearners && totallearners > 0
      ? ((learnersWithCGPA || 0) / totallearners) * 100
      : 0;

    // Identify issues
    if (skillCoveragePercent < 50) {
      issues.push({
        severity: 'high',
        category: 'skills',
        issue: `Only ${skillCoveragePercent.toFixed(0)}% of learners have skills listed`,
        recommendation: 'Import skills from resume parsing, LinkedIn, or manual entry',
        affectedCount: totallearners ? totallearners - uniquelearnersWithSkills : 0
      });
    }

    if (avgSkillsPerLearner < 3 && uniquelearnersWithSkills > 0) {
      issues.push({
        severity: 'medium',
        category: 'skills',
        issue: `Average only ${avgSkillsPerLearner.toFixed(1)} skills per learner`,
        recommendation: 'Encourage learners to add more skills (target: 5-8 skills)',
        affectedCount: uniquelearnersWithSkills
      });
    }

    if (uniqueSkillNames < 20) {
      issues.push({
        severity: 'medium',
        category: 'skills',
        issue: `Only ${uniqueSkillNames} unique skills in database`,
        recommendation: 'Skill diversity is low. Add more varied skills to improve matching',
        affectedCount: uniqueSkillNames
      });
    }

    if (locationCoveragePercent < 70) {
      issues.push({
        severity: 'medium',
        category: 'learners',
        issue: `Only ${locationCoveragePercent.toFixed(0)}% have location data`,
        recommendation: 'Add city/state information for better location-based matching',
        affectedCount: totallearners ? totallearners - (learnersWithLocation || 0) : 0
      });
    }

    if (cgpaCoveragePercent < 60) {
      issues.push({
        severity: 'low',
        category: 'learners',
        issue: `Only ${cgpaCoveragePercent.toFixed(0)}% have CGPA data`,
        recommendation: 'Add academic performance data for better candidate assessment',
        affectedCount: totallearners ? totallearners - (learnersWithCGPA || 0) : 0
      });
    }

    // Determine overall status
    const hasHighSeverity = issues.some(i => i.severity === 'high');
    const hasMediumSeverity = issues.some(i => i.severity === 'medium');
    
    const status: DataHealthReport['status'] = 
      hasHighSeverity ? 'critical' :
      hasMediumSeverity ? 'warning' :
      'healthy';

    return {
      status,
      issues,
      summary: {
        total_learners: totallearners || 0,
        learners_with_skills: uniquelearnersWithSkills,
        total_skills: totalSkills || 0,
        unique_skill_names: uniqueSkillNames,
        avg_skills_per_learner: Number(avgSkillsPerLearner.toFixed(2)),
        learners_with_location: learnersWithLocation || 0,
        learners_with_cgpa: learnersWithCGPA || 0
      }
    };
  }

  /**
   * Get common skills in the database
   */
  async getCommonSkills(limit: number = 20): Promise<Array<{ skill: string; count: number }>> {
    const { data: skills } = await supabase
      .from('skills')
      .select('name')
      .eq('enabled', true);

    if (!skills || skills.length === 0) return [];

    const skillCounts = new Map<string, number>();
    skills.forEach(({ name }) => {
      if (name) {
        skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
      }
    });

    return Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Check if a specific skill exists in database
   */
  async skillExists(skillName: string): Promise<boolean> {
    const { count } = await supabase
      .from('skills')
      .select('id', { count: 'exact', head: true })
      .eq('enabled', true)
      .ilike('name', `%${skillName}%`);

    return (count || 0) > 0;
  }

  /**
   * Get skill suggestions based on query
   */
  async suggestSimilarSkills(skillName: string, limit: number = 10): Promise<string[]> {
    const { data: skills } = await supabase
      .from('skills')
      .select('name')
      .eq('enabled', true)
      .ilike('name', `%${skillName}%`)
      .limit(limit);

    return [...new Set(skills?.map(s => s.name) || [])];
  }

  /**
   * Format health report for display
   */
  formatHealthReport(report: DataHealthReport): string {
    const { status, issues, summary } = report;

    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '🚨'
    }[status];

    let output = `${statusEmoji} Data Health Status: ${status.toUpperCase()}\n\n`;
    
    output += `📊 Summary:\n`;
    output += `• Total Learners: ${summary.total_learners}\n`;
    output += `• Learners with Skills: ${summary.learners_with_skills} (${((summary.learners_with_skills / summary.total_learners) * 100).toFixed(0)}%)\n`;
    output += `• Total Skills: ${summary.total_skills}\n`;
    output += `• Unique Skills: ${summary.unique_skill_names}\n`;
    output += `• Avg Skills/Learner: ${summary.avg_skills_per_learner}\n`;
    output += `• Learners with Location: ${summary.learners_with_location} (${((summary.learners_with_location / summary.total_learners) * 100).toFixed(0)}%)\n`;
    output += `• Learners with CGPA: ${summary.learners_with_cgpa} (${((summary.learners_with_cgpa / summary.total_learners) * 100).toFixed(0)}%)\n\n`;

    if (issues.length > 0) {
      output += `⚠️ Issues Found (${issues.length}):\n\n`;
      issues.forEach((issue, idx) => {
        const icon = { high: '🔴', medium: '🟡', low: '🟢' }[issue.severity];
        output += `${idx + 1}. ${icon} ${issue.issue}\n`;
        output += `   Recommendation: ${issue.recommendation}\n`;
        if (issue.affectedCount) {
          output += `   Affected: ${issue.affectedCount} records\n`;
        }
        output += `\n`;
      });
    } else {
      output += `✅ No issues found! Data quality is good.\n`;
    }

    return output;
  }
}

export const dataHealthCheck = new DataHealthCheckService();
