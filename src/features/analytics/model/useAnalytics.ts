import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { useUser } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('analytics');

export interface KPIData {
  activelearners: number;
  totalVerifiedActivities: number;
  pendingVerifications: number;
  avgSkillsPerLearner: number;
  attendanceRate: number;
  engagementRate: number;
}

export interface SkillSummary {
  category: string;
  totalActivities: number;
  verifiedActivities: number;
  participationRate: number;
  avgScore: number;
}

export interface AttendanceData {
  month: string;
  present: number;
  absent: number;
  late: number;
}

export interface SkillGrowthData {
  month: string;
  technical: number;
  communication: number;
  leadership: number;
  creativity: number;
}

export interface LeaderboardEntry {
  rank: number;
  learnerId: string;
  learnerName: string;
  totalActivities: number;
  verifiedActivities: number;
  awards: number;
  progress: number;
}

export interface ActivityHeatmapDay {
  date: string;
  count: number;
}

export interface CertificateStats {
  month: string;
  issued: number;
  pending: number;
  rejected: number;
}

export interface AssignmentStats {
  month: string;
  pending: number;
  submitted: number;
  graded: number;
}

export interface AssignmentDetailStats {
  assignmentId: string;
  title: string;
  total: number;
  submitted: number;
  graded: number;
  pending: number;
  averageGrade: number;
}

export interface SkillStats {
  skillName: string;
  learnerCount: number;
  averageLevel: number;
}

interface UseAnalyticsOptions {
  schoolId?: string;
  collegeId?: string;
  educatorType?: 'school' | 'college' | null;
  educatorRole?: string | null;
  assignedClassIds?: string[];
}

const callEducator = async <T>(action: string, params?: Record<string, unknown>): Promise<T> => {
  const response: any = await apiPost('/analytics/educator', { action, ...params });
  return response.data as T;
};

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds } = options;
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kpiData, setKpiData] = useState<KPIData>({
    activelearners: 0, totalVerifiedActivities: 0, pendingVerifications: 0,
    avgSkillsPerLearner: 0, attendanceRate: 0, engagementRate: 0,
  });

  const [skillSummary, setSkillSummary] = useState<SkillSummary[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [skillGrowthData, setSkillGrowthData] = useState<SkillGrowthData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<ActivityHeatmapDay[]>([]);
  const [certificateStats, setCertificateStats] = useState<CertificateStats[]>([]);
  const [assignmentStats, setAssignmentStats] = useState<AssignmentStats[]>([]);
  const [assignmentDetails, setAssignmentDetails] = useState<AssignmentDetailStats[]>([]);
  const [topSkills, setTopSkills] = useState<SkillStats[]>([]);

  const baseParams = { schoolId, collegeId, educatorType, educatorRole, assignedClassIds };

  const fetchKPIData = async () => {
    try {
      const data = await callEducator<KPIData>('get-kpi-data', baseParams);
      setKpiData(data);
    } catch (error) {
      logger.error('Error fetching KPI data', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchSkillSummary = async () => {
    try {
      const data = await callEducator<SkillSummary[]>('get-skill-summary', baseParams);
      setSkillSummary(data);
    } catch (error) {
      logger.error('Error fetching skill summary', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const data = await callEducator<AttendanceData[]>('get-attendance-data', baseParams);
      setAttendanceData(data);
    } catch (error) {
      logger.error('Error fetching attendance data', error instanceof Error ? error : new Error(String(error)));
      setAttendanceData([]);
    }
  };

  const fetchSkillGrowthData = async () => {
    try {
      const data = await callEducator<SkillGrowthData[]>('get-skill-growth', baseParams);
      setSkillGrowthData(data);
    } catch (error) {
      logger.error('Error fetching skill growth data', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const data = await callEducator<LeaderboardEntry[]>('get-leaderboard', baseParams);
      setLeaderboard(data);
    } catch (error) {
      logger.error('Error fetching leaderboard data', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchActivityHeatmap = async () => {
    try {
      const data = await callEducator<ActivityHeatmapDay[]>('get-activity-heatmap', baseParams);
      setActivityHeatmap(data);
    } catch (error) {
      logger.error('Error fetching activity heatmap', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchCertificateStats = async () => {
    try {
      const data = await callEducator<CertificateStats[]>('get-certificate-stats', baseParams);
      setCertificateStats(data);
    } catch (error) {
      logger.error('Error fetching certificate stats', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchAssignmentStats = async () => {
    try {
      const data = await callEducator<AssignmentStats[]>('get-assignment-stats', baseParams);
      setAssignmentStats(data);
    } catch (error) {
      logger.error('Error fetching assignment stats', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchAssignmentDetails = async () => {
    try {
      const data = await callEducator<AssignmentDetailStats[]>('get-assignment-details', baseParams);
      setAssignmentDetails(data);
    } catch (error) {
      logger.error('Error fetching assignment details', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchTopSkills = async () => {
    try {
      const data = await callEducator<SkillStats[]>('get-top-skills', baseParams);
      setTopSkills(data);
    } catch (error) {
      logger.error('Error fetching top skills', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchKPIData(), fetchSkillSummary(), fetchAttendanceData(), fetchSkillGrowthData(),
        fetchLeaderboardData(), fetchActivityHeatmap(), fetchCertificateStats(),
        fetchAssignmentStats(), fetchAssignmentDetails(), fetchTopSkills(),
      ]);
    } catch (error) {
      logger.error('Error fetching analytics data', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportAsCSV = () => {
    let csvContent = '';
    csvContent += 'KEY PERFORMANCE INDICATORS\nMetric,Value\n';
    csvContent += `Active Learners,${kpiData.activelearners}\nVerified Activities,${kpiData.totalVerifiedActivities}\nPending Verifications,${kpiData.pendingVerifications}\nAvg Skills/Learner,${kpiData.avgSkillsPerLearner}\nAttendance Rate,${kpiData.attendanceRate}%\nEngagement Rate,${kpiData.engagementRate}%\n\n\n`;
    csvContent += 'SKILL SUMMARY\nCategory,Total Activities,Verified Activities,Participation Rate,Average Score\n';
    skillSummary.forEach(s => { csvContent += `${s.category},${s.totalActivities},${s.verifiedActivities},${s.participationRate}%,${s.avgScore}\n`; });
    csvContent += '\n\nCOMPLETE LEADERBOARD\nRank,Learner ID,Learner Name,Total Activities,Verified Activities,Awards,Progress %\n';
    leaderboard.forEach(s => { csvContent += `${s.rank},${s.learnerId},"${s.learnerName}",${s.totalActivities},${s.verifiedActivities},${s.awards},${s.progress}%\n`; });
    csvContent += '\n\nATTENDANCE DATA\nMonth,Present,Absent,Late\n';
    attendanceData.forEach(a => { csvContent += `${a.month},${a.present},${a.absent},${a.late}\n`; });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Analytics Report', 14, 20);
    doc.setFontSize(14);
    doc.text('Key Performance Indicators', 14, 35);
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Active Learners', kpiData.activelearners.toString()],
        ['Verified Activities', kpiData.totalVerifiedActivities.toString()],
        ['Pending Verifications', kpiData.pendingVerifications.toString()],
        ['Avg Skills/Learner', kpiData.avgSkillsPerLearner.toFixed(1)],
        ['Attendance Rate', `${kpiData.attendanceRate}%`],
        ['Engagement Rate', `${kpiData.engagementRate}%`],
      ],
    });
    doc.addPage();
    doc.text('Skill Summary', 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [['Category', 'Total', 'Verified', 'Participation %', 'Avg Score']],
      body: skillSummary.map(s => [s.category, s.totalActivities.toString(), s.verifiedActivities.toString(), `${s.participationRate}%`, s.avgScore.toString()]),
    });
    doc.addPage();
    doc.text('Top 10 Learners', 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [['Rank', 'Learner Name', 'Total', 'Verified', 'Progress %']],
      body: leaderboard.slice(0, 10).map(s => [s.rank.toString(), s.learnerName, s.totalActivities.toString(), s.verifiedActivities.toString(), `${s.progress}%`]),
    });
    doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    if ((schoolId || collegeId) && educatorType) {
      fetchAnalyticsData();
    }
  }, [schoolId, collegeId, educatorType, assignedClassIds]);

  return {
    loading, refreshing,
    kpiData, skillSummary, attendanceData, skillGrowthData, leaderboard,
    activityHeatmap, certificateStats, assignmentStats, assignmentDetails, topSkills,
    fetchAnalyticsData, exportAsCSV, exportAsPDF,
  };
};
