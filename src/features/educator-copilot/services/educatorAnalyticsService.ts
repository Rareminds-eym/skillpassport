import type { StudentWithAssignments } from './dataFetcherService';
import type { Opportunity } from './educatorDataService';

export interface AtRiskFlag {
  type:
    | 'low-skills'
    | 'no-projects'
    | 'stalled-training'
    | 'low-activity'
    | 'low-grades'
    | 'many-late'
    | 'missing-certificates';
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StudentInsightSummary {
  studentId: string;
  name: string;
  email?: string;
  skillsCount: number;
  topSkills: { name: string; level: number }[];
  projectsCount: number;
  trainingProgressAvg: number;
  assignmentStats?: StudentWithAssignments['assignmentStats'];
  flags: AtRiskFlag[];
}

export interface ClassAnalyticsSummary {
  totalStudents: number;
  avgSkillsPerStudent: number;
  topSkills: { name: string; count: number }[];
  projectsDistribution: { none: number; oneToTwo: number; threePlus: number };
  trainingCompletionRate: number;
}

export interface MatchResult {
  studentId: string;
  studentName: string;
  opportunityId: number;
  opportunityTitle: string;
  matchedSkills: string[];
  missingSkills: string[];
  readinessScore: number; // 0-100
}

const toArray = <T>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

class EducatorAnalyticsService {
  private normalizeSkillName(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9+#.]/g, ' ');
  }

  buildStudentInsights(students: StudentWithAssignments[]): StudentInsightSummary[] {
    const now = new Date();

    return students.map((s) => {
      const profile = s.profile || ({} as any);
      const tech = toArray<{ name: string; level: number }>(profile.technicalSkills).filter(
        Boolean
      );
      const projects = toArray<any>(profile.projects).filter((p) => p?.enabled !== false);
      const training = toArray<any>(profile.training).filter((t) => t?.enabled !== false);
      const certs = toArray<any>(profile.certificates).filter((c) => c?.enabled !== false);

      const skillsCount = tech.length;
      const topSkills = [...tech]
        .sort((a, b) => (b?.level || 0) - (a?.level || 0))
        .slice(0, 5)
        .map((t) => ({ name: t.name, level: t.level }));

      const trainingProgress = training.map((t) => Number(t?.progress || 0));
      const trainingProgressAvg = trainingProgress.length
        ? Math.round((trainingProgress.reduce((a, b) => a + b, 0) / trainingProgress.length) * 10) /
          10
        : 0;

      const flags: AtRiskFlag[] = [];
      // Low skills
      if (skillsCount < 3) {
        flags.push({
          type: 'low-skills',
          reason: `Only ${skillsCount} technical skills`,
          severity: 'high',
        });
      }
      // No or incomplete projects
      if (projects.length === 0) {
        flags.push({ type: 'no-projects', reason: 'No projects added', severity: 'medium' });
      } else if (projects.every((p) => p.processing === true)) {
        flags.push({
          type: 'no-projects',
          reason: 'All projects still processing',
          severity: 'low',
        });
      }
      // Stalled training: progress < 50 and last updated > 30 days
      const staleTraining = training
        .filter((t) => Number(t?.progress || 0) < 50)
        .some((t) => {
          const updatedAt = t?.updated_at ? new Date(t.updated_at) : null;
          if (!updatedAt) return true; // treat missing date as stale
          const days = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
          return days > 30;
        });
      if (staleTraining) {
        flags.push({
          type: 'stalled-training',
          reason: 'Training progress < 50% and stale > 30 days',
          severity: 'medium',
        });
      }
      // Low activity: profile.updatedAt > 30 days
      const updatedAtStr = profile?.updatedAt || profile?.updated_at;
      if (updatedAtStr) {
        const updatedAt = new Date(updatedAtStr);
        const days = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 30) {
          flags.push({
            type: 'low-activity',
            reason: 'Profile not updated in > 30 days',
            severity: 'low',
          });
        }
      }
      // Assignments: low grades or many late
      const avgGrade = s.assignmentStats?.avgGrade || 0;
      if (avgGrade > 0 && avgGrade < 60) {
        flags.push({ type: 'low-grades', reason: `Average grade ${avgGrade}%`, severity: 'high' });
      }
      const late = s.assignmentStats?.lateSubmissions || 0;
      if (late >= 2) {
        flags.push({ type: 'many-late', reason: `${late} late submissions`, severity: 'medium' });
      }
      // Missing verified certificates when some exist but pending
      if (certs.length > 0 && certs.every((c) => (c.status || '').toLowerCase() !== 'approved')) {
        flags.push({
          type: 'missing-certificates',
          reason: 'Certificates pending approval',
          severity: 'low',
        });
      }

      return {
        studentId: s.id,
        name: profile?.name || 'Unknown',
        email: profile?.email,
        skillsCount,
        topSkills,
        projectsCount: projects.length,
        trainingProgressAvg,
        assignmentStats: s.assignmentStats,
        flags,
      };
    });
  }

  buildClassAnalytics(students: StudentWithAssignments[]): ClassAnalyticsSummary {
    const totalStudents = students.length || 0;
    const skillCounts: Record<string, number> = {};
    let totalSkills = 0;
    let trainingCompleted = 0;
    const projectsDist = { none: 0, oneToTwo: 0, threePlus: 0 };

    students.forEach((s) => {
      const tech = toArray<any>(s.profile?.technicalSkills);
      totalSkills += tech.length;
      tech.forEach((t) => {
        const key = this.normalizeSkillName(t?.name || '');
        if (!key) return;
        skillCounts[key] = (skillCounts[key] || 0) + 1;
      });

      const projects = toArray<any>(s.profile?.projects).filter((p) => p?.enabled !== false);
      if (projects.length === 0) projectsDist.none += 1;
      else if (projects.length <= 2) projectsDist.oneToTwo += 1;
      else projectsDist.threePlus += 1;

      const training = toArray<any>(s.profile?.training);
      const anyCompleted = training.some((t) => (t?.status || '').toLowerCase() === 'completed');
      if (anyCompleted) trainingCompleted += 1;
    });

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      totalStudents,
      avgSkillsPerStudent: totalStudents ? Math.round((totalSkills / totalStudents) * 10) / 10 : 0,
      topSkills,
      projectsDistribution: projectsDist,
      trainingCompletionRate: totalStudents
        ? Math.round((trainingCompleted / totalStudents) * 100)
        : 0,
    };
  }

  matchStudentsToOpportunities(
    students: StudentWithAssignments[],
    opportunities: Opportunity[]
  ): MatchResult[] {
    const results: MatchResult[] = [];

    students.forEach((s) => {
      const profile = s.profile || ({} as any);
      const skillNames = toArray<any>(profile.technicalSkills).map((t) =>
        this.normalizeSkillName(String(t?.name || ''))
      );

      opportunities.forEach((op) => {
        const required = (Array.isArray(op.skills_required) ? op.skills_required : []).map(
          (k: any) => this.normalizeSkillName(String(k))
        );
        if (required.length === 0) return;

        const matched = required.filter((r) => skillNames.includes(r));
        const missing = required.filter((r) => !skillNames.includes(r));

        const skillsScore = Math.round((matched.length / required.length) * 100);
        const readinessScore = skillsScore; // extend later with experience, training

        if (readinessScore >= 40) {
          results.push({
            studentId: s.id,
            studentName: profile?.name || 'Unknown',
            opportunityId: op.id,
            opportunityTitle: op.job_title || op.title,
            matchedSkills: matched,
            missingSkills: missing,
            readinessScore,
          });
        }
      });
    });

    // Sort by score desc
    return results.sort((a, b) => b.readinessScore - a.readinessScore);
  }

  identifyAtRiskStudents(studentInsights: StudentInsightSummary[]): StudentInsightSummary[] {
    // Rank by severity and number of flags
    const severityScore = (f: AtRiskFlag) =>
      f.severity === 'high' ? 3 : f.severity === 'medium' ? 2 : 1;

    return [...studentInsights]
      .map((insight) => ({
        ...insight,
        riskScore:
          insight.flags.reduce((sum, f) => sum + severityScore(f), 0) +
          (insight.skillsCount < 3 ? 2 : 0) +
          (insight.projectsCount === 0 ? 1 : 0) +
          (insight.assignmentStats?.avgGrade && insight.assignmentStats.avgGrade < 60 ? 2 : 0),
      }))
      .sort((a, b) => (b as any).riskScore - (a as any).riskScore);
  }
}

export const educatorAnalyticsService = new EducatorAnalyticsService();
