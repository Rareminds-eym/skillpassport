import { supabase } from '../../../lib/supabaseClient';

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
    category: 'skills' | 'students' | 'opportunities' | 'pipeline';
    issue: string;
    recommendation: string;
    affectedCount?: number;
  }>;
  summary: {
    total_students: number;
    students_with_skills: number;
    total_skills: number;
    unique_skill_names: number;
    avg_skills_per_student: number;
    students_with_location: number;
    students_with_cgpa: number;
  };
}

class DataHealthCheckService {
  /**
   * Comprehensive data health check
   */
  async checkDataHealth(): Promise<DataHealthReport> {
    const issues: DataHealthReport['issues'] = [];

    // Check 1: Total students
    const { count: totalStudents } = await supabase
      .from('students')
      .select('user_id', { count: 'exact', head: true })
      .not('name', 'is', null);

    // Check 2: Students with skills
    const { data: studentsWithSkills } = await supabase
      .from('skills')
      .select('student_id')
      .eq('enabled', true);

    const uniqueStudentsWithSkills = new Set(studentsWithSkills?.map((s) => s.student_id) || [])
      .size;

    // Check 3: Total skills
    const { count: totalSkills } = await supabase
      .from('skills')
      .select('id', { count: 'exact', head: true })
      .eq('enabled', true);

    // Check 4: Unique skill names
    const { data: skillNames } = await supabase.from('skills').select('name').eq('enabled', true);

    const uniqueSkillNames = new Set(skillNames?.map((s) => s.name) || []).size;

    // Check 5: Students with location data
    const { count: studentsWithLocation } = await supabase
      .from('students')
      .select('user_id', { count: 'exact', head: true })
      .not('name', 'is', null)
      .not('city', 'is', null);

    // Check 6: Students with CGPA
    const { count: studentsWithCGPA } = await supabase
      .from('students')
      .select('user_id', { count: 'exact', head: true })
      .not('name', 'is', null)
      .not('currentCgpa', 'is', null);

    // Calculate metrics
    const avgSkillsPerStudent =
      uniqueStudentsWithSkills > 0 ? (totalSkills || 0) / uniqueStudentsWithSkills : 0;

    const skillCoveragePercent =
      totalStudents && totalStudents > 0 ? (uniqueStudentsWithSkills / totalStudents) * 100 : 0;

    const locationCoveragePercent =
      totalStudents && totalStudents > 0 ? ((studentsWithLocation || 0) / totalStudents) * 100 : 0;

    const cgpaCoveragePercent =
      totalStudents && totalStudents > 0 ? ((studentsWithCGPA || 0) / totalStudents) * 100 : 0;

    // Identify issues
    if (skillCoveragePercent < 50) {
      issues.push({
        severity: 'high',
        category: 'skills',
        issue: `Only ${skillCoveragePercent.toFixed(0)}% of students have skills listed`,
        recommendation: 'Import skills from resume parsing, LinkedIn, or manual entry',
        affectedCount: totalStudents ? totalStudents - uniqueStudentsWithSkills : 0,
      });
    }

    if (avgSkillsPerStudent < 3 && uniqueStudentsWithSkills > 0) {
      issues.push({
        severity: 'medium',
        category: 'skills',
        issue: `Average only ${avgSkillsPerStudent.toFixed(1)} skills per student`,
        recommendation: 'Encourage students to add more skills (target: 5-8 skills)',
        affectedCount: uniqueStudentsWithSkills,
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
        category: 'students',
        issue: `Only ${locationCoveragePercent.toFixed(0)}% have location data`,
        recommendation: 'Add city/state information for better location-based matching',
        affectedCount: totalStudents ? totalStudents - (studentsWithLocation || 0) : 0,
      });
    }

    if (cgpaCoveragePercent < 60) {
      issues.push({
        severity: 'low',
        category: 'students',
        issue: `Only ${cgpaCoveragePercent.toFixed(0)}% have CGPA data`,
        recommendation: 'Add academic performance data for better candidate assessment',
        affectedCount: totalStudents ? totalStudents - (studentsWithCGPA || 0) : 0,
      });
    }

    // Determine overall status
    const hasHighSeverity = issues.some((i) => i.severity === 'high');
    const hasMediumSeverity = issues.some((i) => i.severity === 'medium');

    const status: DataHealthReport['status'] = hasHighSeverity
      ? 'critical'
      : hasMediumSeverity
        ? 'warning'
        : 'healthy';

    return {
      status,
      issues,
      summary: {
        total_students: totalStudents || 0,
        students_with_skills: uniqueStudentsWithSkills,
        total_skills: totalSkills || 0,
        unique_skill_names: uniqueSkillNames,
        avg_skills_per_student: Number(avgSkillsPerStudent.toFixed(2)),
        students_with_location: studentsWithLocation || 0,
        students_with_cgpa: studentsWithCGPA || 0,
      },
    };
  }

  /**
   * Get common skills in the database
   */
  async getCommonSkills(limit: number = 20): Promise<Array<{ skill: string; count: number }>> {
    const { data: skills } = await supabase.from('skills').select('name').eq('enabled', true);

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

    return [...new Set(skills?.map((s) => s.name) || [])];
  }

  /**
   * Format health report for display
   */
  formatHealthReport(report: DataHealthReport): string {
    const { status, issues, summary } = report;

    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '🚨',
    }[status];

    let output = `${statusEmoji} Data Health Status: ${status.toUpperCase()}\n\n`;

    output += `📊 Summary:\n`;
    output += `• Total Students: ${summary.total_students}\n`;
    output += `• Students with Skills: ${summary.students_with_skills} (${((summary.students_with_skills / summary.total_students) * 100).toFixed(0)}%)\n`;
    output += `• Total Skills: ${summary.total_skills}\n`;
    output += `• Unique Skills: ${summary.unique_skill_names}\n`;
    output += `• Avg Skills/Student: ${summary.avg_skills_per_student}\n`;
    output += `• Students with Location: ${summary.students_with_location} (${((summary.students_with_location / summary.total_students) * 100).toFixed(0)}%)\n`;
    output += `• Students with CGPA: ${summary.students_with_cgpa} (${((summary.students_with_cgpa / summary.total_students) * 100).toFixed(0)}%)\n\n`;

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
