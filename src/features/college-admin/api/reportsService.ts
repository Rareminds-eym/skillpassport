import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('reports-service');

export interface ReportKPI {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

export interface ReportData {
  kpis: ReportKPI[];
  chartData: any;
  tableData: {
    period: string;
    department: string;
    value: string;
    change: string;
    status: string;
  }[];
}

export interface ReportFilters {
  dateRange: string;
  department: string;
  semester: string;
  collegeId: string;
}

const getDateRange = (dateRange: string): { startDate: string; endDate: string } => {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  let startDate: string;

  switch (dateRange) {
    case 'current-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      break;
    case 'current-semester':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
      break;
    case 'last-semester':
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1).toISOString().split('T')[0];
      break;
    case 'current-year':
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
  return { startDate, endDate };
};

const getStatus = (value: number, threshold = 90): string => {
  if (value >= 95) return 'Excellent';
  if (value >= threshold) return 'Good';
  if (value >= 80) return 'Average';
  return 'Needs Attention';
};

const getCollegeIdFromStorage = (): string | null => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role === 'college_admin' && userData.collegeId) {
        return userData.collegeId;
      }
    }
  } catch {
  }
  return null;
};

export const reportsService = {
  async getAttendanceReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const { startDate, endDate } = getDateRange(filters.dateRange);
      const collegeId = filters.collegeId || getCollegeIdFromStorage() || '';

      const result: any = await apiPost('/college-admin/reports', {
        action: 'attendance',
        collegeId,
        dateRange: filters.dateRange,
      });

      const { learners, attendanceRecords, departments } = result.data || {};
      const totallearners = learners?.length || 0;
      const totalRecords = attendanceRecords?.length || 0;
      const presentCount = attendanceRecords?.filter(
        (a: any) => a.status === 'present' || a.status === 'late' || a.status === 'excused'
      ).length || 0;
      const hasRealData = totalRecords > 0;

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let chartValues: number[];
      let attendanceRate: number;

      if (hasRealData) {
        const monthlyData = new Map<number, { total: number; present: number }>();
        attendanceRecords.forEach((record: any) => {
          const month = new Date(record.date).getMonth();
          const current = monthlyData.get(month) || { total: 0, present: 0 };
          current.total++;
          if (record.status === 'present' || record.status === 'late' || record.status === 'excused') {
            current.present++;
          }
          monthlyData.set(month, current);
        });

        chartValues = months.map((_, idx) => {
          const data = monthlyData.get(idx);
          return data ? Math.round((data.present / data.total) * 100) : 0;
        });

        attendanceRate = Math.round((presentCount / totalRecords) * 100);
      } else {
        chartValues = months.map(() => 0);
        attendanceRate = 0;
      }

      const tableData = (departments || []).slice(0, 5).map((dept: any) => {
        if (hasRealData) {
          const deptRecords = attendanceRecords.filter((r: any) => r.department_name === dept.name);
          const deptTotal = deptRecords.length;
          const deptPresent = deptRecords.filter(
            (r: any) => r.status === 'present' || r.status === 'late' || r.status === 'excused'
          ).length;
          const deptRate = deptTotal > 0 ? (deptPresent / deptTotal) * 100 : 0;

          return {
            period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            department: dept.name,
            value: `${deptRate.toFixed(1)}%`,
            change: '0%',
            status: deptTotal > 0 ? getStatus(deptRate) : 'No Data'
          };
        } else {
          return {
            period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            department: dept.name,
            value: '0%',
            change: '0%',
            status: 'No Data'
          };
        }
      });

      const belowThreshold = hasRealData
        ? new Set(
            attendanceRecords
              .filter((r: any) => {
                const learnerRecords = attendanceRecords.filter((ar: any) => ar.learner_id === r.learner_id);
                const learnerPresent = learnerRecords.filter(
                  (sr: any) => sr.status === 'present' || sr.status === 'late' || sr.status === 'excused'
                ).length;
                return learnerRecords.length > 0 && (learnerPresent / learnerRecords.length) < 0.75;
              })
              .map((r: any) => r.learner_id)
          ).size
        : Math.floor(totallearners * 0.03);

      return {
        kpis: [
          { title: 'Overall Attendance', value: `${attendanceRate}%`, change: '+2.1%', trend: 'up', color: 'blue' },
          { title: 'Total Learners', value: totallearners.toLocaleString(), change: `+${Math.floor(totallearners * 0.02)}`, trend: 'up', color: 'green' },
          { title: 'Below Threshold', value: belowThreshold.toString(), change: '-5', trend: 'down', color: 'red' },
          { title: 'Departments', value: (departments?.length || 0).toString(), change: '0', trend: 'neutral', color: 'gray' }
        ],
        chartData: { labels: months, values: chartValues },
        tableData
      };
    } catch (error) {
      logger.error('Error fetching attendance report', error as Error, { collegeId: filters.collegeId });
      throw error;
    }
  },

  async getPerformanceReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const collegeId = filters.collegeId || getCollegeIdFromStorage() || '';

      const result: any = await apiPost('/college-admin/reports', {
        action: 'performance',
        collegeId,
        dateRange: filters.dateRange,
      });

      const { markEntries, assessments, departments } = result.data || {};

      let passCount = 0;
      const totalEntries = markEntries?.length || 0;
      markEntries?.forEach((entry: any) => {
        const assessment = assessments?.find((a: any) => a.id === entry.assessment_id);
        if (assessment && entry.marks_obtained >= assessment.pass_marks) passCount++;
      });

      const passRate = totalEntries > 0 ? Math.round((passCount / totalEntries) * 100) : 0;
      const hasRealData = totalEntries > 0;
      const topPerformers = markEntries?.filter((e: any) => e.grade === 'O' || e.grade === 'A+').length || 0;
      const needSupport = markEntries?.filter((e: any) => e.grade === 'C' || e.grade === 'F').length || 0;

      const chartLabels = (departments || []).slice(0, 5).map((d: any) => d.name);
      const chartValues = chartLabels.map(() => 0);

      const tableData = (departments || []).slice(0, 5).map((dept: any) => ({
        period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        department: dept.name,
        value: '0%',
        change: '0%',
        status: 'No Data'
      }));

      return {
        kpis: [
          { title: 'Average GPA', value: hasRealData ? '0.00' : '0.00', change: '0', trend: 'neutral', color: 'green' },
          { title: 'Pass Rate', value: `${passRate}%`, change: '0%', trend: 'neutral', color: 'blue' },
          { title: 'Top Performers', value: topPerformers.toString(), change: '0', trend: 'neutral', color: 'purple' },
          { title: 'Need Support', value: needSupport.toString(), change: '0', trend: 'neutral', color: 'orange' }
        ],
        chartData: {
          labels: chartLabels.length > 0 ? chartLabels : [],
          values: chartValues.length > 0 ? chartValues : []
        },
        tableData
      };
    } catch (error) {
      logger.error('Error fetching performance report', error as Error, { collegeId: filters.collegeId });
      throw error;
    }
  },

  async getPlacementReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const { startDate, endDate } = getDateRange(filters.dateRange);
      const collegeId = filters.collegeId || getCollegeIdFromStorage() || '';

      const result: any = await apiPost('/college-admin/reports', {
        action: 'placement',
        collegeId,
        dateRange: filters.dateRange,
      });

      const { candidates, companies, placementOffers, departments } = result.data || {};

      const totalCandidates = candidates?.length || 0;
      const hiredCount = candidates?.filter((c: any) => c.stage === 'hired').length || 0;
      const placementRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;
      const uniqueCompanies = companies?.length || 0;
      const offersCount = candidates?.filter((c: any) => c.stage === 'offer' || c.stage === 'offered').length || 0;

      let avgPackage = '₹0';
      if (placementOffers && placementOffers.length > 0) {
        const totalPackage = placementOffers.reduce((sum: number, o: any) => sum + Number(o.package_amount), 0);
        const avgAmount = totalPackage / placementOffers.length;
        if (avgAmount >= 10000000) {
          avgPackage = `₹${(avgAmount / 10000000).toFixed(1)}Cr`;
        } else if (avgAmount >= 100000) {
          avgPackage = `₹${(avgAmount / 100000).toFixed(1)}L`;
        } else {
          avgPackage = `₹${avgAmount.toLocaleString()}`;
        }
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hasRealData = totalCandidates > 0;
      const placements = hasRealData
        ? months.map((_, idx) => {
            return candidates?.filter((c: any) => {
              const candidateMonth = new Date(c.added_at).getMonth();
              return candidateMonth === idx && c.stage === 'hired';
            }).length || 0;
          })
        : months.map(() => 0);

      const applications = hasRealData
        ? months.map((_, idx) => {
            return candidates?.filter((c: any) => {
              const candidateMonth = new Date(c.added_at).getMonth();
              return candidateMonth === idx;
            }).length || 0;
          })
        : months.map(() => 0);

      const tableData = (departments || []).slice(0, 5).map((dept: any) => ({
        period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        department: dept.name,
        value: '0%',
        change: '0%',
        status: 'No Data'
      }));

      return {
        kpis: [
          { title: 'Placement Rate', value: `${placementRate}%`, change: '0%', trend: 'neutral', color: 'green' },
          { title: 'Avg Package', value: avgPackage, change: '₹0', trend: 'neutral', color: 'blue' },
          { title: 'Companies', value: uniqueCompanies.toString(), change: '0', trend: 'neutral', color: 'purple' },
          { title: 'Offers Made', value: (offersCount + hiredCount).toString(), change: '0', trend: 'neutral', color: 'orange' }
        ],
        chartData: { labels: months, placements, applications },
        tableData
      };
    } catch (error) {
      logger.error('Error fetching placement report', error as Error, { collegeId: filters.collegeId });
      throw error;
    }
  },

  async getSkillAnalyticsReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const collegeId = filters.collegeId || getCollegeIdFromStorage() || '';

      const result: any = await apiPost('/college-admin/reports', {
        action: 'skill-analytics',
        collegeId,
        dateRange: filters.dateRange,
      });

      const { enrollments, courses, departments } = result.data || {};

      const totalEnrollments = enrollments?.length || 0;
      const completedCount = enrollments?.filter((e: any) => e.status === 'completed').length || 0;
      const inProgressCount = enrollments?.filter((e: any) => e.status === 'in_progress').length || 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;
      const totalCourses = courses?.length || 0;
      const avgProgress = totalEnrollments > 0 ? enrollments?.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / totalEnrollments : 0;

      const categories = ['Technical', 'Soft Skills', 'Domain', 'Certification', 'Language'];
      const chartValues = categories.map(() => 0);

      const tableData = (departments || []).slice(0, 5).map((dept: any) => ({
        period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        department: dept.name,
        value: '0%',
        change: '0%',
        status: 'No Data'
      }));

      return {
        kpis: [
          { title: 'Completion Rate', value: `${completionRate}%`, change: '0%', trend: 'neutral', color: 'green' },
          { title: 'Active Courses', value: totalCourses.toString(), change: '0', trend: 'neutral', color: 'blue' },
          { title: 'In Progress', value: inProgressCount.toString(), change: '0', trend: 'neutral', color: 'purple' },
          { title: 'Avg Progress', value: `${Math.round(avgProgress)}%`, change: '0%', trend: 'neutral', color: 'indigo' }
        ],
        chartData: { labels: categories, values: chartValues },
        tableData
      };
    } catch (error) {
      logger.error('Error fetching skill analytics report', error as Error, { collegeId: filters.collegeId });
      throw error;
    }
  },

  async getBudgetReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const collegeId = filters.collegeId || getCollegeIdFromStorage() || '';

      const result: any = await apiPost('/college-admin/reports', {
        action: 'budget',
        collegeId,
        dateRange: filters.dateRange,
      });

      const { budgets, departments } = result.data || {};

      let totalAllocated = 0;
      let totalSpent = 0;
      budgets?.forEach((budget: any) => {
        const heads = budget.budget_heads || [];
        heads.forEach((head: any) => {
          totalAllocated += head.allocated_amount || 0;
          totalSpent += head.spent_amount || 0;
        });
      });

      const hasRealData = totalAllocated > 0;
      const utilizationRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
      const remaining = totalAllocated - totalSpent;

      const deptNames = (departments || []).slice(0, 6).map((d: any) => d.name);
      const allocated = deptNames.map(() => 0);
      const spent = deptNames.map(() => 0);

      const tableData = (departments || []).slice(0, 5).map((dept: any) => ({
        period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        department: dept.name,
        value: '0%',
        change: '0%',
        status: 'No Data'
      }));

      const formatCurrency = (amount: number): string => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        return `₹${amount.toLocaleString()}`;
      };

      return {
        kpis: [
          { title: 'Total Allocated', value: formatCurrency(totalAllocated), change: '0%', trend: 'neutral', color: 'blue' },
          { title: 'Total Spent', value: formatCurrency(totalSpent), change: '0%', trend: 'neutral', color: 'green' },
          { title: 'Utilization', value: `${utilizationRate}%`, change: '0%', trend: 'neutral', color: 'purple' },
          { title: 'Remaining', value: formatCurrency(remaining), change: '0%', trend: 'neutral', color: 'orange' }
        ],
        chartData: {
          labels: deptNames.length > 0 ? deptNames : [],
          allocated: allocated.length > 0 ? allocated : [],
          spent: spent.length > 0 ? spent : []
        },
        tableData
      };
    } catch (error) {
      logger.error('Error fetching budget report', error as Error, { collegeId: filters.collegeId });
      throw error;
    }
  },

  async getExamProgressReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const collegeId = filters.collegeId || getCollegeIdFromStorage() || '';

      const result: any = await apiPost('/college-admin/reports', {
        action: 'exam-progress',
        collegeId,
        dateRange: filters.dateRange,
      });

      const { examWindows, registrations, departments } = result.data || {};

      const totalExams = examWindows?.length || 0;
      const completedExams = examWindows?.filter((e: any) => e.status === 'completed').length || 0;
      const ongoingExams = examWindows?.filter((e: any) => e.status === 'ongoing').length || 0;
      const scheduledExams = examWindows?.filter((e: any) => e.status === 'scheduled').length || 0;
      const totalRegistrations = registrations?.length || 0;

      const statuses = ['Completed', 'Ongoing', 'Scheduled', 'Draft'];
      const chartValues = [
        completedExams,
        ongoingExams,
        scheduledExams,
        Math.max(0, totalExams - completedExams - ongoingExams - scheduledExams)
      ];

      const tableData = (departments || []).slice(0, 5).map((dept: any) => ({
        period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        department: dept.name,
        value: '0%',
        change: '0%',
        status: 'No Data'
      }));

      return {
        kpis: [
          { title: 'Total Exams', value: totalExams.toString(), change: '0', trend: 'neutral', color: 'blue' },
          { title: 'Completed', value: completedExams.toString(), change: '0', trend: 'neutral', color: 'green' },
          { title: 'Ongoing', value: ongoingExams.toString(), change: '0', trend: 'neutral', color: 'purple' },
          { title: 'Registrations', value: totalRegistrations.toLocaleString(), change: '0', trend: 'neutral', color: 'orange' }
        ],
        chartData: { labels: statuses, values: chartValues },
        tableData
      };
    } catch (error) {
      logger.error('Error fetching exam progress report', error as Error, { collegeId: filters.collegeId });
      throw error;
    }
  },

  async getDepartments(collegeId?: string): Promise<{ id: string; name: string; code: string }[]> {
    try {
      const cId = collegeId || getCollegeIdFromStorage() || '';
      const result: any = await apiPost('/college-admin/reports', {
        action: 'departments',
        collegeId: cId,
      });
      return result.data || [];
    } catch (error) {
      logger.error('Error fetching departments', error as Error, { collegeId });
      return [];
    }
  }
};

export default reportsService;