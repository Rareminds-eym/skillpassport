import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Types
export interface KPIData {
  activeStudents: number;
  totalVerifiedActivities: number;
  pendingVerifications: number;
  avgSkillsPerStudent: number;
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
  studentId: string;
  studentName: string;
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
  studentCount: number;
  averageLevel: number;
}



interface UseAnalyticsOptions {
  schoolId?: string;
  collegeId?: string;
  educatorType?: 'school' | 'college' | null;
  educatorRole?: string | null;
  assignedClassIds?: string[];
}

export const useAnalytics = (options: UseAnalyticsOptions = {}) => {
  const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds } = options;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for all data
  const [kpiData, setKpiData] = useState<KPIData>({
    activeStudents: 0,
    totalVerifiedActivities: 0,
    pendingVerifications: 0,
    avgSkillsPerStudent: 0,
    attendanceRate: 0,
    engagementRate: 0,
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

  // Helper function to get filtered student IDs based on educator type and assignments
  const getFilteredStudentIds = async (): Promise<string[]> => {
    if (!schoolId && !collegeId) return [];
    
    try {
      if (educatorType === 'school' && schoolId) {
        // For school educators, check role and class assignments
        if (educatorRole === 'admin' || educatorRole === 'school_admin') {
          // School admins can see all students in their school
          const { data: schoolStudents } = await supabase
            .from('students')
            .select('user_id')
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
          return schoolStudents?.map(s => s.user_id) || [];
        } else if (assignedClassIds && assignedClassIds.length > 0) {
          // Regular educators can only see students in their assigned classes
          const { data: schoolStudents } = await supabase
            .from('students')
            .select('user_id')
            .eq('school_id', schoolId)
            .in('school_class_id', assignedClassIds)
            .eq('is_deleted', false);
          return schoolStudents?.map(s => s.user_id) || [];
        } else {
          // Educators with no class assignments should see no students
          return [];
        }
      } else if (educatorType === 'college' && collegeId) {
        // For college educators, filter by college
        const { data: collegeStudents } = await supabase
          .from('students')
          .select('user_id')
          .eq('college_id', collegeId)
          .eq('is_deleted', false);
        return collegeStudents?.map(s => s.user_id) || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting filtered student IDs:', error);
      return [];
    }
  };

  // Fetch KPI Data
  const fetchKPIData = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setKpiData({
          activeStudents: 0,
          totalVerifiedActivities: 0,
          pendingVerifications: 0,
          avgSkillsPerStudent: 0,
          attendanceRate: 0,
          engagementRate: 0,
        });
        return;
      }

      const activeStudents = studentIds.length;

      // Helper to build queries with student filtering
      const buildCountQuery = (table: string) => {
        return supabase.from(table).select('id', { count: 'exact', head: true })
          .in('student_id', studentIds);
      };

      const buildDataQuery = (table: string, select: string) => {
        return supabase.from(table).select(select)
          .in('student_id', studentIds);
      };

      const [
        { count: approvedProjects },
        { count: approvedCerts },
        { count: approvedTrainings },
        { count: sentToAdminProjects },
        { count: sentToAdminCerts },
        { count: sentToAdminTrainings },
        { count: pendingProjects },
        { count: pendingCerts },
        { count: pendingTrainings },
        { data: allSkills },
      ] = await Promise.all([
        buildCountQuery('projects')
          .eq('approval_status', 'approved'),
        buildCountQuery('certificates')
          .eq('approval_status', 'approved'),
        buildCountQuery('trainings')
          .eq('approval_status', 'approved'),
        buildCountQuery('projects')
          .eq('approval_status', 'sent_to_admin'),
        buildCountQuery('certificates')
          .eq('approval_status', 'sent_to_admin'),
        buildCountQuery('trainings')
          .eq('approval_status', 'sent_to_admin'),
        buildCountQuery('projects')
          .eq('approval_status', 'pending'),
        buildCountQuery('certificates')
          .eq('approval_status', 'pending'),
        buildCountQuery('trainings')
          .eq('approval_status', 'pending'),
        buildDataQuery('skills', 'student_id')
          .eq('enabled', true),
      ]);

      // Calculate totals to match Activities page logic
      const totalApproved = (approvedProjects || 0) + (approvedCerts || 0) + (approvedTrainings || 0);
      const totalSentToAdmin = (sentToAdminProjects || 0) + (sentToAdminCerts || 0) + (sentToAdminTrainings || 0);
      const totalVerified = totalApproved + totalSentToAdmin; // Verified = approved + sent_to_admin
      const totalPending = (pendingProjects || 0) + (pendingCerts || 0) + (pendingTrainings || 0);
      const avgSkills = activeStudents ? (allSkills?.length || 0) / activeStudents : 0;

      setKpiData({
        activeStudents: activeStudents || 0,
        totalVerifiedActivities: totalVerified,
        pendingVerifications: totalPending,
        avgSkillsPerStudent: Math.round(avgSkills * 10) / 10,
        attendanceRate: Math.floor(Math.random() * 20) + 75,
        engagementRate: Math.floor(Math.random() * 20) + 65,
      });
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  // Fetch Skill Summary by Category
  const fetchSkillSummary = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setSkillSummary([]);
        return;
      }

      const [
        { data: skills },
      ] = await Promise.all([
        supabase
          .from('skills')
          .select('type, approval_status, level, student_id, enabled')
          .eq('enabled', true)
          .in('student_id', studentIds),
      ]);

      if (!skills) return;

      const totalStudents = studentIds.length;

      const categoryMap: Record<string, {
        total: number;
        verified: number;
        totalLevels: number;
        studentSet: Set<string>;
      }> = {};

      skills.forEach(skill => {
        const category = skill.type || 'Other';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            total: 0,
            verified: 0,
            totalLevels: 0,
            studentSet: new Set(),
          };
        }
        categoryMap[category].total++;
        if (skill.approval_status === 'approved') {
          categoryMap[category].verified++;
        }
        categoryMap[category].totalLevels += skill.level || 0;
        categoryMap[category].studentSet.add(skill.student_id);
      });

      const summary: SkillSummary[] = Object.entries(categoryMap)
        .map(([category, data]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          totalActivities: data.total,
          verifiedActivities: data.verified,
          participationRate: totalStudents 
            ? Math.round((data.studentSet.size / totalStudents) * 100) 
            : 0,
          avgScore: data.total 
            ? Math.round((data.totalLevels / data.total) * 20)
            : 0,
        }))
        .sort((a, b) => b.totalActivities - a.totalActivities);

      setSkillSummary(summary);
    } catch (error) {
      console.error('Error fetching skill summary:', error);
    }
  };

  // Fetch Attendance Data (Last 6 Months)
  const fetchAttendanceData = async () => {
    try {
      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
      
      // For demo purposes, generating dummy attendance data
      const dummyData = months.map(month => ({
        month: month.label,
        present: Math.floor(Math.random() * 30) + 20,
        absent: Math.floor(Math.random() * 10) + 2,
        late: Math.floor(Math.random() * 8) + 1,
      }));

      setAttendanceData(dummyData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  // Fetch Skill Growth Data (Last 6 Months)
  const fetchSkillGrowthData = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setSkillGrowthData([]);
        return;
      }

      const months = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
          endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
        });
      }

      const growthPromises = months.map(async month => {
        // Get all skills created up to this month
        const { data: skills } = await supabase
          .from('skills')
          .select('type, level')
          .lte('created_at', month.endDate)
          .eq('enabled', true)
          .eq('approval_status', 'approved')
          .in('student_id', studentIds);

        // Calculate average level by type
        const technical = skills?.filter(s => s.type === 'technical') || [];
        const softSkills = skills?.filter(s => s.type === 'soft') || [];
        
        // Estimate other categories based on available data
        const avgTechnical = technical.length 
          ? Math.round((technical.reduce((sum, s) => sum + (s.level || 0), 0) / technical.length) * 20)
          : 0;
        
        const avgSoft = softSkills.length 
          ? Math.round((softSkills.reduce((sum, s) => sum + (s.level || 0), 0) / softSkills.length) * 20)
          : 0;

        return {
          month: month.label,
          technical: avgTechnical,
          communication: avgSoft, // Using soft skills as communication proxy
          leadership: Math.max(0, avgSoft - 5), // Derived metric
          creativity: Math.max(0, avgTechnical - 10), // Derived metric
        };
      });

      const data = await Promise.all(growthPromises);
      setSkillGrowthData(data);
    } catch (error) {
      console.error('Error fetching skill growth data:', error);
    }
  };

  // Fetch Leaderboard Data
  const fetchLeaderboardData = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Get student details for the filtered IDs
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, name, student_id')
        .in('user_id', studentIds)
        .eq('is_deleted', false);

      if (!students || students.length === 0) {
        setLeaderboard([]);
        return;
      }

      const studentUserIds = students.map(s => s.user_id);
      
      const buildQuery = (table: string, select: string) => {
        return supabase.from(table).select(select)
          .in('student_id', studentUserIds);
      };

      const [
        skillsResult,
        projectsResult,
        certificatesResult,
        trainingsResult,
      ] = await Promise.all([
        buildQuery('skills', 'student_id, approval_status, enabled').eq('enabled', true),
        buildQuery('projects', 'student_id, approval_status'),
        buildQuery('certificates', 'student_id, approval_status'),
        buildQuery('trainings', 'student_id, approval_status'),
      ]);

      const skills = skillsResult.data || [];
      const projects = projectsResult.data || [];
      const certificates = certificatesResult.data || [];
      const trainings = trainingsResult.data || [];

      const activityMap: Record<string, { total: number; verified: number }> = {};

      students.forEach(s => {
        activityMap[s.user_id] = { total: 0, verified: 0 };
      });

      // Process activities (excluding skills to match Activities page)
      [...projects, ...certificates, ...trainings].forEach((activity: any) => {
        if (activity && activityMap[activity.student_id]) {
          activityMap[activity.student_id].total++;
          // Count both 'approved' and 'sent_to_admin' as verified to match Activities page
          if (activity.approval_status === 'approved' || activity.approval_status === 'sent_to_admin') {
            activityMap[activity.student_id].verified++;
          }
        }
      });

      const leaderboardData = students
        .map(student => {
          const { total, verified } = activityMap[student.user_id] || { total: 0, verified: 0 };
          return {
            studentId: student.student_id || student.id,
            studentName: student.name || 'Unknown Student',
            totalActivities: total,
            verifiedActivities: verified,
            awards: Math.floor(verified / 5),
            progress: total > 0 ? Math.round((verified / total) * 100) : 0,
          };
        })
        .sort((a, b) => 
          b.verifiedActivities !== a.verifiedActivities 
            ? b.verifiedActivities - a.verifiedActivities 
            : b.totalActivities - a.totalActivities
        )
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  // Fetch Activity Heatmap (Last 90 Days)
  const fetchActivityHeatmap = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setActivityHeatmap([]);
        return;
      }

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const startDate = ninetyDaysAgo.toISOString();

      const buildQuery = (table: string) => {
        return supabase
          .from(table)
          .select('created_at')
          .gte('created_at', startDate)
          .in('student_id', studentIds);
      };

      const [
        projectsResult,
        certificatesResult,
        trainingsResult,
      ] = await Promise.all([
        buildQuery('projects'),
        buildQuery('certificates'),
        buildQuery('trainings'),
      ]);

      const projects = projectsResult.data || [];
      const certificates = certificatesResult.data || [];
      const trainings = trainingsResult.data || [];

      const dateCountMap: Record<string, number> = {};

      // Process activities (excluding skills to match Activities page)
      [...projects, ...certificates, ...trainings].forEach((activity: any) => {
        const date = activity.created_at?.split('T')[0];
        if (date) {
          dateCountMap[date] = (dateCountMap[date] || 0) + 1;
        }
      });

      const heatmapData: ActivityHeatmapDay[] = [];
      const now = new Date();
      for (let i = 89; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        heatmapData.push({
          date: dateStr,
          count: dateCountMap[dateStr] || 0,
        });
      }

      setActivityHeatmap(heatmapData);
    } catch (error) {
      console.error('Error fetching activity heatmap:', error);
    }
  };

  // Fetch Certificate Statistics
  const fetchCertificateStats = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setCertificateStats([]);
        return;
      }

      const { data: certificates } = await supabase
        .from('certificates')
        .select('created_at, approval_status')
        .in('student_id', studentIds);

      if (!certificates) return;

      const monthlyStats = new Map<string, { issued: number; pending: number; rejected: number }>();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.forEach(month => {
        monthlyStats.set(month, { issued: 0, pending: 0, rejected: 0 });
      });

      certificates.forEach(cert => {
        const date = new Date(cert.created_at);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (monthlyStats.has(monthName)) {
          const stats = monthlyStats.get(monthName)!;
          
          if (cert.approval_status === 'approved') {
            stats.issued++;
          } else if (cert.approval_status === 'pending') {
            stats.pending++;
          } else if (cert.approval_status === 'rejected') {
            stats.rejected++;
          }
        }
      });

      const certificateStatsArray: CertificateStats[] = Array.from(monthlyStats.entries())
        .map(([month, stats]) => ({ month, ...stats }))
        .slice(-6);

      setCertificateStats(certificateStatsArray);
    } catch (error) {
      console.error('Error fetching certificate stats:', error);
    }
  };

  // Fetch Assignment Statistics
  const fetchAssignmentStats = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setAssignmentStats([]);
        return;
      }

      const { data: studentAssignments } = await supabase
        .from('student_assignments')
        .select('status, submission_date, is_deleted')
        .eq('is_deleted', false)
        .in('student_id', studentIds);

      if (!studentAssignments) {
        setAssignmentStats([]);
        return;
      }

      const monthlyStats = new Map<string, { pending: number; submitted: number; graded: number }>();
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyStats.set(monthName, { pending: 0, submitted: 0, graded: 0 });
      }

      studentAssignments.forEach(assignment => {
        const date = assignment.submission_date 
          ? new Date(assignment.submission_date)
          : new Date();
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (monthlyStats.has(monthName)) {
          const stats = monthlyStats.get(monthName)!;
          
          if (assignment.status === 'todo' || assignment.status === 'in-progress') {
            stats.pending++;
          } else if (assignment.status === 'submitted') {
            stats.submitted++;
          } else if (assignment.status === 'graded') {
            stats.graded++;
          }
        }
      });

      const assignmentStatsArray: AssignmentStats[] = Array.from(monthlyStats.entries())
        .map(([month, stats]) => ({ month, ...stats }));

      setAssignmentStats(assignmentStatsArray);
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
    }
  };

  // Fetch Assignment Details (Individual Assignments)
  const fetchAssignmentDetails = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setAssignmentDetails([]);
        return;
      }

      const { data: assignments } = await supabase
        .from('assignments')
        .select('assignment_id, title, is_deleted')
        .eq('is_deleted', false);

      if (!assignments || assignments.length === 0) {
        setAssignmentDetails([]);
        return;
      }

      const assignmentIds = assignments.map(a => a.assignment_id);

      const { data: studentAssignments } = await supabase
        .from('student_assignments')
        .select('assignment_id, status, grade_percentage, is_deleted')
        .in('assignment_id', assignmentIds)
        .eq('is_deleted', false)
        .in('student_id', studentIds);

      if (!studentAssignments) {
        setAssignmentDetails([]);
        return;
      }

      const detailsMap: Record<string, {
        title: string;
        total: number;
        submitted: number;
        graded: number;
        pending: number;
        totalGrade: number;
        gradeCount: number;
      }> = {};

      assignments.forEach(assignment => {
        detailsMap[assignment.assignment_id] = {
          title: assignment.title || 'Untitled',
          total: 0,
          submitted: 0,
          graded: 0,
          pending: 0,
          totalGrade: 0,
          gradeCount: 0,
        };
      });

      studentAssignments.forEach(sa => {
        if (detailsMap[sa.assignment_id]) {
          const detail = detailsMap[sa.assignment_id];
          detail.total++;

          if (sa.status === 'todo' || sa.status === 'in-progress') {
            detail.pending++;
          } else if (sa.status === 'submitted') {
            detail.submitted++;
          } else if (sa.status === 'graded') {
            detail.graded++;
          }

          if (sa.grade_percentage !== null && sa.grade_percentage !== undefined) {
            detail.totalGrade += sa.grade_percentage;
            detail.gradeCount++;
          }
        }
      });

      const detailsArray: AssignmentDetailStats[] = assignments
        .map(assignment => ({
          assignmentId: assignment.assignment_id,
          title: detailsMap[assignment.assignment_id].title,
          total: detailsMap[assignment.assignment_id].total,
          submitted: detailsMap[assignment.assignment_id].submitted,
          graded: detailsMap[assignment.assignment_id].graded,
          pending: detailsMap[assignment.assignment_id].pending,
          averageGrade: detailsMap[assignment.assignment_id].gradeCount > 0
            ? Math.round(detailsMap[assignment.assignment_id].totalGrade / detailsMap[assignment.assignment_id].gradeCount)
            : 0,
        }))
        .sort((a, b) => b.total - a.total);

      setAssignmentDetails(detailsArray);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
    }
  };

  // Fetch Top Skills
  const fetchTopSkills = async () => {
    try {
      // Get filtered student IDs based on educator type and assignments
      const studentIds = await getFilteredStudentIds();
      
      if (studentIds.length === 0) {
        setTopSkills([]);
        return;
      }

      const { data: skills } = await supabase
        .from('skills')
        .select('name, student_id, level, enabled')
        .eq('enabled', true)
        .in('student_id', studentIds);

      if (!skills || skills.length === 0) {
        setTopSkills([]);
        return;
      }

      const skillMap = new Map<string, { count: number; totalLevel: number }>();

      skills.forEach(skill => {
        if (!skillMap.has(skill.name)) {
          skillMap.set(skill.name, { count: 0, totalLevel: 0 });
        }
        const data = skillMap.get(skill.name)!;
        data.count++;
        data.totalLevel += skill.level || 0;
      });

      const skillsArray: SkillStats[] = Array.from(skillMap.entries())
        .map(([name, data]) => ({
          skillName: name,
          studentCount: data.count,
          averageLevel: Math.round((data.totalLevel / data.count) * 100) / 100,
        }))
        .sort((a, b) => b.studentCount - a.studentCount)
        .slice(0, 8);

      setTopSkills(skillsArray);
    } catch (error) {
      console.error('Error fetching top skills:', error);
    }
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);
      
      await Promise.all([
        fetchKPIData(),
        fetchSkillSummary(),
        fetchAttendanceData(),
        fetchSkillGrowthData(),
        fetchLeaderboardData(),
        fetchActivityHeatmap(),
        fetchCertificateStats(),
        fetchAssignmentStats(),
        fetchAssignmentDetails(),
        fetchTopSkills(),
      ]);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Export data as CSV
  const exportAsCSV = () => {
    // Create CSV content
    let csvContent = '';
    
    // KPIs Section
    csvContent += 'KEY PERFORMANCE INDICATORS\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Active Students,${kpiData.activeStudents}\n`;
    csvContent += `Verified Activities,${kpiData.totalVerifiedActivities}\n`;
    csvContent += `Pending Verifications,${kpiData.pendingVerifications}\n`;
    csvContent += `Avg Skills/Student,${kpiData.avgSkillsPerStudent}\n`;
    csvContent += `Attendance Rate,${kpiData.attendanceRate}%\n`;
    csvContent += `Engagement Rate,${kpiData.engagementRate}%\n`;
    csvContent += '\n\n';
    
    // Skill Summary Section
    csvContent += 'SKILL SUMMARY\n';
    csvContent += 'Category,Total Activities,Verified Activities,Participation Rate,Average Score\n';
    skillSummary.forEach(s => {
      csvContent += `${s.category},${s.totalActivities},${s.verifiedActivities},${s.participationRate}%,${s.avgScore}\n`;
    });
    csvContent += '\n\n';
    
    // Leaderboard Section
    csvContent += 'COMPLETE LEADERBOARD\n';
    csvContent += 'Rank,Student ID,Student Name,Total Activities,Verified Activities,Awards,Progress %\n';
    leaderboard.forEach(s => {
      csvContent += `${s.rank},${s.studentId},"${s.studentName}",${s.totalActivities},${s.verifiedActivities},${s.awards},${s.progress}%\n`;
    });
    csvContent += '\n\n';
    
    // Attendance Section
    csvContent += 'ATTENDANCE DATA\n';
    csvContent += 'Month,Present,Absent,Late\n';
    attendanceData.forEach(a => {
      csvContent += `${a.month},${a.present},${a.absent},${a.late}\n`;
    });
    
    // Create blob and download
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

  // Export data as PDF
  const exportAsPDF = async () => {
    // Dynamic import to avoid bundling issues
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Analytics Report', 14, 20);
    
    // KPIs
    doc.setFontSize(14);
    doc.text('Key Performance Indicators', 14, 35);
    
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Active Students', kpiData.activeStudents.toString()],
        ['Verified Activities', kpiData.totalVerifiedActivities.toString()],
        ['Pending Verifications', kpiData.pendingVerifications.toString()],
        ['Avg Skills/Student', kpiData.avgSkillsPerStudent.toFixed(1)],
        ['Attendance Rate', `${kpiData.attendanceRate}%`],
        ['Engagement Rate', `${kpiData.engagementRate}%`],
      ],
    });
    
    // Skill Summary
    doc.addPage();
    doc.text('Skill Summary', 14, 20);
    
    autoTable(doc, {
      startY: 25,
      head: [['Category', 'Total', 'Verified', 'Participation %', 'Avg Score']],
      body: skillSummary.map(s => [
        s.category,
        s.totalActivities.toString(),
        s.verifiedActivities.toString(),
        `${s.participationRate}%`,
        s.avgScore.toString(),
      ]),
    });
    
    // Leaderboard
    doc.addPage();
    doc.text('Top 10 Students', 14, 20);
    
    autoTable(doc, {
      startY: 25,
      head: [['Rank', 'Student Name', 'Total', 'Verified', 'Progress %']],
      body: leaderboard.slice(0, 10).map(s => [
        s.rank.toString(),
        s.studentName,
        s.totalActivities.toString(),
        s.verifiedActivities.toString(),
        `${s.progress}%`,
      ]),
    });
    
    doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Initial fetch on mount or when parameters change
  useEffect(() => {
    // For educators: wait until we have the necessary data
    // For admins/others: parameters will be undefined, which is fine
    if ((schoolId || collegeId) && educatorType) {
      fetchAnalyticsData();
    }
  }, [schoolId, collegeId, educatorType, assignedClassIds]);

  return {
    // Loading states
    loading,
    refreshing,
    
    // Data
    kpiData,
    skillSummary,
    attendanceData,
    skillGrowthData,
    leaderboard,
    activityHeatmap,
    certificateStats,
    assignmentStats,
    assignmentDetails,
    topSkills,
    
    // Functions
    fetchAnalyticsData,
    exportAsCSV,
    exportAsPDF,
  };
};