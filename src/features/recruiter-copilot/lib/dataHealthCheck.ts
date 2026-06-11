import { apiPost } from '@/shared/api/apiClient';

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
  async checkDataHealth(): Promise<DataHealthReport> {
    const issues: DataHealthReport['issues'] = [];

    const totallearners = await apiPost<number>('/recruiter-copilot', {
      action: 'count-learners',
    });

    const learnersWithSkillsData = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-skills-learner-ids',
    });

    const uniquelearnersWithSkills = new Set(learnersWithSkillsData?.map((s: any) => s.learner_id) || []).size;

    const totalSkills = await apiPost<number>('/recruiter-copilot', {
      action: 'count-skills',
    });

    const skillNamesData = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-skills-names',
    });

    const uniqueSkillNames = new Set(skillNamesData?.map((s: any) => s.name) || []).size;

    const learnersWithLocation = await apiPost<number>('/recruiter-copilot', {
      action: 'count-learners-with-location',
    });

    const learnersWithCGPA = await apiPost<number>('/recruiter-copilot', {
      action: 'count-learners-with-cgpa',
    });

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

    if (skillCoveragePercent < 50) {
      issues.push({
        severity: 'high',
        category: 'skills',
        issue: `Only ${skillCoveragePercent.toFixed(0)}% of learners have skills listed`,
        recommendation: 'Import skills from resume parsing, LinkedIn, or manual entry',
        affectedCount: totallearners ? totallearners - uniquelearnersWithSkills : 0,
      });
    }

    if (avgSkillsPerLearner < 3 && uniquelearnersWithSkills > 0) {
      issues.push({
        severity: 'medium',
        category: 'skills',
        issue: `Average only ${avgSkillsPerLearner.toFixed(1)} skills per learner`,
        recommendation: 'Encourage learners to add more skills (target: 5-8 skills)',
        affectedCount: uniquelearnersWithSkills,
      });
    }

    if (uniqueSkillNames < 20) {
      issues.push({
        severity: 'medium',
        category: 'skills',
        issue: `Only ${uniqueSkillNames} unique skills in database`,
        recommendation: 'Skill diversity is low. Add more varied skills to improve matching',
        affectedCount: uniqueSkillNames,
      });
    }

    if (locationCoveragePercent < 70) {
      issues.push({
        severity: 'medium',
        category: 'learners',
        issue: `Only ${locationCoveragePercent.toFixed(0)}% have location data`,
        recommendation: 'Add city/state information for better location-based matching',
        affectedCount: totallearners ? totallearners - (learnersWithLocation || 0) : 0,
      });
    }

    if (cgpaCoveragePercent < 60) {
      issues.push({
        severity: 'low',
        category: 'learners',
        issue: `Only ${cgpaCoveragePercent.toFixed(0)}% have CGPA data`,
        recommendation: 'Add academic performance data for better candidate assessment',
        affectedCount: totallearners ? totallearners - (learnersWithCGPA || 0) : 0,
      });
    }

    const hasHighSeverity = issues.some(i => i.severity === 'high');
    const hasMediumSeverity = issues.some(i => i.severity === 'medium');

    const status: DataHealthReport['status'] =
      hasHighSeverity ? 'critical' : hasMediumSeverity ? 'warning' : 'healthy';

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
        learners_with_cgpa: learnersWithCGPA || 0,
      },
    };
  }

  async getCommonSkills(limit: number = 20): Promise<Array<{ skill: string; count: number }>> {
    const skills = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-skills-names',
    });

    if (!skills || skills.length === 0) return [];

    const skillCounts = new Map<string, number>();
    skills.forEach(({ name }: { name: string }) => {
      if (name) {
        skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
      }
    });

    return Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async skillExists(skillName: string): Promise<boolean> {
    return await apiPost<boolean>('/recruiter-copilot', {
      action: 'count-skill-by-name',
      skill_name: skillName,
    });
  }

  async suggestSimilarSkills(skillName: string, limit: number = 10): Promise<string[]> {
    const skills = await apiPost<any[]>('/recruiter-copilot', {
      action: 'fetch-skills',
      skill_name_filter: skillName,
      limit,
    });

    return [...new Set(skills?.map((s: any) => s.name) || [])];
  }

  formatHealthReport(report: DataHealthReport): string {
    const { status, issues, summary } = report;

    const statusEmoji = { healthy: '✅', warning: '⚠️', critical: '🚨' }[status];

    let output = `${statusEmoji} Data Health Status: ${status.toUpperCase()}\n\n`;
    output += 'Summary:\n';
    output += `• Total Learners: ${summary.total_learners}\n`;
    output += `• Learners with Skills: ${summary.learners_with_skills} (${((summary.learners_with_skills / summary.total_learners) * 100).toFixed(0)}%)\n`;
    output += `• Total Skills: ${summary.total_skills}\n`;
    output += `• Unique Skills: ${summary.unique_skill_names}\n`;
    output += `• Avg Skills/Learner: ${summary.avg_skills_per_learner}\n`;
    output += `• Learners with Location: ${summary.learners_with_location} (${((summary.learners_with_location / summary.total_learners) * 100).toFixed(0)}%)\n`;
    output += `• Learners with CGPA: ${summary.learners_with_cgpa} (${((summary.learners_with_cgpa / summary.total_learners) * 100).toFixed(0)}%)\n\n`;

    if (issues.length > 0) {
      output += `Issues Found (${issues.length}):\n\n`;
      issues.forEach((issue, idx) => {
        const icon = { high: '🔴', medium: '🟡', low: '🟢' }[issue.severity];
        output += `${idx + 1}. ${icon} ${issue.issue}\n`;
        output += `   Recommendation: ${issue.recommendation}\n`;
        if (issue.affectedCount) output += `   Affected: ${issue.affectedCount} records\n`;
        output += '\n';
      });
    } else {
      output += 'No issues found! Data quality is good.\n';
    }

    return output;
  }
}

export const dataHealthCheck = new DataHealthCheckService();
