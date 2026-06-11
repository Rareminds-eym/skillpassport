import { apiPost } from '@/shared/api/apiClient';

export interface PlacementRecord {
  id: string;
  learner_name: string;
  learner_id: string;
  company_name: string;
  job_title: string;
  department: string;
  employment_type: 'Full-time' | 'Internship';
  salary_offered: number;
  placement_date: string;
  status: 'applied' | 'viewed' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
  location: string;
}

export interface DepartmentAnalytics {
  department: string;
  total_learners: number;
  placed_learners: number;
  placement_rate: number;
  avg_ctc: number;
  median_ctc: number;
  highest_ctc: number;
  total_offers: number;
  internships: number;
  full_time: number;
}

export interface PlacementStats {
  totalPlacements: number;
  totalApplications: number;
  avgCTC: number;
  medianCTC: number;
  highestCTC: number;
  totalInternships: number;
  totalFullTime: number;
  placementRate: number;
}

class PlacementAnalyticsService {
  async getPlacementRecords(filters?: {
    department?: string;
    year?: string;
    employmentType?: string;
    status?: string;
  }): Promise<PlacementRecord[]> {
    try {
      const params: Record<string, any> = { action: 'get-placement-records' };
      if (filters?.department) params.department = filters.department;
      if (filters?.year) params.year = filters.year;
      if (filters?.employmentType) params.employmentType = filters.employmentType;
      if (filters?.status) params.status = filters.status;
      const res = await apiPost('/placement/actions', params);
      return res?.data || [];
    } catch (error) {
      return [];
    }
  }

  async getAllApplications(filters?: {
    department?: string;
    year?: string;
    status?: string;
  }) {
    try {
      const params: Record<string, any> = { action: 'get-all-applications' };
      if (filters?.department) params.department = filters.department;
      if (filters?.year) params.year = filters.year;
      if (filters?.status) params.status = filters.status;
      const res = await apiPost('/placement/actions', params);
      return res?.data || [];
    } catch (error) {
      return [];
    }
  }

  async getDepartmentAnalytics(filters?: {
    year?: string;
    employmentType?: string;
  }): Promise<DepartmentAnalytics[]> {
    try {
      const learnersRes = await apiPost('/placement/actions', { action: 'get-all-learners-analytics' });
      const learnersData = learnersRes?.data || [];

      // Get placement records
      const placementRecords = await this.getPlacementRecords(filters);

      // Group learners by department (branch_field)
      const departmentlearners = (learnersData || []).reduce((acc, learner) => {
        const dept = learner.branch_field || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group placements by department
      const departmentPlacements = placementRecords.reduce((acc, placement) => {
        const dept = placement.department || 'Unknown';
        if (!acc[dept]) {
          acc[dept] = [];
        }
        acc[dept].push(placement);
        return acc;
      }, {} as Record<string, PlacementRecord[]>);

      // Calculate analytics for each department
      const analytics: DepartmentAnalytics[] = Object.keys(departmentlearners).map(department => {
        const totallearners = departmentlearners[department] || 0;
        const deptPlacements = departmentPlacements[department] || [];
        const fullTimePlacements = deptPlacements.filter(p => p.employment_type === 'Full-time');
        const internships = deptPlacements.filter(p => p.employment_type === 'Internship');

        // Calculate CTC metrics for full-time positions only
        const fullTimeSalaries = fullTimePlacements
          .map(p => p.salary_offered)
          .filter(salary => salary > 0)
          .sort((a, b) => a - b);

        const avgCtc = fullTimeSalaries.length > 0 
          ? fullTimeSalaries.reduce((sum, salary) => sum + salary, 0) / fullTimeSalaries.length 
          : 0;

        const medianCtc = fullTimeSalaries.length > 0 
          ? fullTimeSalaries.length % 2 === 0
            ? (fullTimeSalaries[fullTimeSalaries.length / 2 - 1] + fullTimeSalaries[fullTimeSalaries.length / 2]) / 2
            : fullTimeSalaries[Math.floor(fullTimeSalaries.length / 2)]
          : 0;

        const highestCtc = fullTimeSalaries.length > 0 ? Math.max(...fullTimeSalaries) : 0;

        return {
          department,
          total_learners: totallearners,
          placed_learners: deptPlacements.length,
          placement_rate: totallearners > 0 ? (deptPlacements.length / totallearners) * 100 : 0,
          avg_ctc: avgCtc,
          median_ctc: medianCtc,
          highest_ctc: highestCtc,
          total_offers: deptPlacements.length,
          internships: internships.length,
          full_time: fullTimePlacements.length,
        };
      });

      return analytics.sort((a, b) => b.placed_learners - a.placed_learners);

    } catch (error) {
      return [];
    }
  }

  async getPlacementStats(filters?: {
    year?: string;
    department?: string;
  }): Promise<PlacementStats> {
    try {
      const placementRecords = await this.getPlacementRecords(filters);
      const allApplications = await this.getAllApplications(filters);

      const fullTimePlacements = placementRecords.filter(p => p.employment_type === 'Full-time');
      const internships = placementRecords.filter(p => p.employment_type === 'Internship');

      const fullTimeSalaries = fullTimePlacements
        .map(p => p.salary_offered)
        .filter(salary => salary > 0)
        .sort((a, b) => a - b);

      const avgCTC = fullTimeSalaries.length > 0
        ? fullTimeSalaries.reduce((sum, salary) => sum + salary, 0) / fullTimeSalaries.length
        : 0;

      const medianCTC = fullTimeSalaries.length > 0
        ? fullTimeSalaries.length % 2 === 0
          ? (fullTimeSalaries[fullTimeSalaries.length / 2 - 1] + fullTimeSalaries[fullTimeSalaries.length / 2]) / 2
          : fullTimeSalaries[Math.floor(fullTimeSalaries.length / 2)]
        : 0;

      const highestCTC = fullTimeSalaries.length > 0 ? Math.max(...fullTimeSalaries) : 0;

      const countRes = await apiPost('/placement/actions', { action: 'get-learner-count', department: filters?.department });
      const totallearners = countRes?.data?.count || 0;

      const placementRate = totallearners > 0 ? (placementRecords.length / totallearners) * 100 : 0;

      return {
        totalPlacements: placementRecords.length,
        totalApplications: allApplications.length,
        avgCTC, medianCTC, highestCTC,
        totalInternships: internships.length,
        totalFullTime: fullTimePlacements.length,
        placementRate,
      };
    } catch (error) {
      return { totalPlacements: 0, totalApplications: 0, avgCTC: 0, medianCTC: 0, highestCTC: 0, totalInternships: 0, totalFullTime: 0, placementRate: 0 };
    }
  }

  async getCTCDistribution(filters?: { year?: string; department?: string }) {
    try {
      const placementRecords = await this.getPlacementRecords(filters);
      const fullTimePlacements = placementRecords.filter(p => p.employment_type === 'Full-time');
      const internships = placementRecords.filter(p => p.employment_type === 'Internship');
      const totalPlacements = placementRecords.length;

      const above10L = fullTimePlacements.filter(p => p.salary_offered >= 1000000).length;
      const between5L10L = fullTimePlacements.filter(p => p.salary_offered >= 500000 && p.salary_offered < 1000000).length;
      const below5L = fullTimePlacements.filter(p => p.salary_offered > 0 && p.salary_offered < 500000).length;

      return {
        above10L: { count: above10L, percentage: totalPlacements > 0 ? (above10L / totalPlacements) * 100 : 0 },
        between5L10L: { count: between5L10L, percentage: totalPlacements > 0 ? (between5L10L / totalPlacements) * 100 : 0 },
        below5L: { count: below5L, percentage: totalPlacements > 0 ? (below5L / totalPlacements) * 100 : 0 },
        internships: { count: internships.length, percentage: totalPlacements > 0 ? (internships.length / totalPlacements) * 100 : 0 },
      };
    } catch (error) {
      return { above10L: { count: 0, percentage: 0 }, between5L10L: { count: 0, percentage: 0 }, below5L: { count: 0, percentage: 0 }, internships: { count: 0, percentage: 0 } };
    }
  }

  async getRecentPlacements(limit: number = 10): Promise<PlacementRecord[]> {
    try {
      const res = await apiPost('/placement/actions', { action: 'get-recent-placements', limit });
      return res?.data || [];
    } catch (error) {
      return [];
    }
  }

  async getTopCompanies(limit: number = 5) {
    try {
      const res = await apiPost('/placement/actions', { action: 'get-top-companies', limit });
      return res?.data || [];
    } catch (error) {
      return [];
    }
  }

  async exportPlacementData(filters?: {
    department?: string;
    year?: string;
    employmentType?: string;
  }) {
    try {
      const placementRecords = await this.getPlacementRecords(filters);
      const departmentAnalytics = await this.getDepartmentAnalytics(filters);
      const stats = await this.getPlacementStats(filters);

      // Department Analytics CSV
      const departmentCsvData = [
        ["Placement Analytics Report"],
        ["Generated on:", new Date().toLocaleDateString()],
        [],
        ["OVERALL SUMMARY"],
        ["Total Placements", stats.totalPlacements],
        ["Total Applications", stats.totalApplications],
        ["Overall Placement Rate (%)", stats.placementRate.toFixed(1)],
        ["Overall Avg CTC (₹)", stats.avgCTC.toFixed(0)],
        ["Overall Median CTC (₹)", stats.medianCTC.toFixed(0)],
        ["Highest CTC (₹)", stats.highestCTC.toFixed(0)],
        ["Full-time Placements", stats.totalFullTime],
        ["Internships", stats.totalInternships],
        [],
        ["DEPARTMENT-WISE ANALYTICS"],
        ["Department", "Total Learners", "Placed Learners", "Placement Rate (%)", "Avg CTC (₹)", "Median CTC (₹)", "Highest CTC (₹)", "Full-time", "Internships"],
        ...departmentAnalytics.map(dept => [
          dept.department,
          dept.total_learners,
          dept.placed_learners,
          dept.placement_rate.toFixed(1),
          dept.avg_ctc.toFixed(0),
          dept.median_ctc.toFixed(0),
          dept.highest_ctc.toFixed(0),
          dept.full_time,
          dept.internships
        ]),
        [],
        ["PLACEMENT RECORDS"],
        ["Learner Name", "Learner ID", "Company", "Job Title", "Department", "Employment Type", "CTC (₹)", "Location", "Placement Date", "Status"],
        ...placementRecords.map(record => [
          record.learner_name,
          record.learner_id,
          record.company_name,
          record.job_title,
          record.department,
          record.employment_type,
          record.salary_offered,
          record.location,
          record.placement_date,
          record.status
        ])
      ];

      // Convert to CSV string
      const csvContent = departmentCsvData.map(row => 
        row.map(cell => `"${cell}"`).join(",")
      ).join("\n");

      return csvContent;

    } catch (error) {
      throw error;
    }
  }
}

export const placementAnalyticsService = new PlacementAnalyticsService();
