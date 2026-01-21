import { supabase } from '../lib/supabaseClient';

export interface PlacementRecord {
  id: string;
  student_name: string;
  student_id: string;
  company_name: string;
  job_title: string;
  department: string;
  employment_type: 'Full-time' | 'Internship';
  salary_offered: number;
  placement_date: string;
  status:
    | 'applied'
    | 'viewed'
    | 'under_review'
    | 'interview_scheduled'
    | 'interviewed'
    | 'offer_received'
    | 'accepted'
    | 'rejected'
    | 'withdrawn';
  location: string;
}

export interface DepartmentAnalytics {
  department: string;
  total_students: number;
  placed_students: number;
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
  // Get placement records with student and company details
  async getPlacementRecords(filters?: {
    department?: string;
    year?: string;
    employmentType?: string;
    status?: string;
  }): Promise<PlacementRecord[]> {
    try {
      let query = supabase
        .from('applied_jobs')
        .select(
          `
          id,
          application_status,
          applied_at,
          viewed_at,
          responded_at,
          interview_scheduled_at,
          notes,
          students!fk_applied_jobs_student (
            user_id,
            name,
            student_id,
            branch_field,
            course_name,
            semester
          ),
          opportunities!fk_applied_jobs_opportunity (
            id,
            title,
            company_name,
            employment_type,
            location,
            salary_range_min,
            salary_range_max,
            department,
            posted_date,
            status
          )
        `
        )
        .eq('application_status', 'accepted'); // Only get successful placements

      // Apply filters
      if (filters?.department) {
        query = query.eq('students.branch_field', filters.department);
      }

      if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('applied_at', startDate).lte('applied_at', endDate);
      }

      if (filters?.employmentType && filters.employmentType !== 'all') {
        const empType = filters.employmentType === 'full-time' ? 'Full-time' : 'Internship';
        query = query.eq('opportunities.employment_type', empType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching placement records:', error);
        throw error;
      }

      // Transform data to match PlacementRecord interface
      return (data || []).map((record) => ({
        id: record.id.toString(),
        // @ts-expect-error - Auto-suppressed for migration
        student_name: record.students?.name || 'Unknown Student',
        // @ts-expect-error - Auto-suppressed for migration
        student_id: record.students?.student_id || '',
        // @ts-expect-error - Auto-suppressed for migration
        company_name: record.opportunities?.company_name || '',
        // @ts-expect-error - Auto-suppressed for migration
        job_title: record.opportunities?.title || '',
        // @ts-expect-error - Auto-suppressed for migration
        department: record.students?.branch_field || '',
        // @ts-expect-error - Auto-suppressed for migration
        employment_type: record.opportunities?.employment_type as 'Full-time' | 'Internship',
        salary_offered:
          // @ts-expect-error - Auto-suppressed for migration
          record.opportunities?.salary_range_max || record.opportunities?.salary_range_min || 0,
        placement_date: record.applied_at,
        status: record.application_status as any,
        // @ts-expect-error - Auto-suppressed for migration
        location: record.opportunities?.location || '',
      }));
    } catch (error) {
      console.error('Error in getPlacementRecords:', error);
      return [];
    }
  }

  // Get all applications (not just successful placements)
  async getAllApplications(filters?: { department?: string; year?: string; status?: string }) {
    try {
      let query = supabase.from('applied_jobs').select(`
          id,
          application_status,
          applied_at,
          students!fk_applied_jobs_student (
            user_id,
            name,
            student_id,
            branch_field,
            course_name
          ),
          opportunities!fk_applied_jobs_opportunity (
            id,
            title,
            company_name,
            employment_type,
            location,
            department
          )
        `);

      // Apply filters
      if (filters?.department) {
        query = query.eq('students.branch_field', filters.department);
      }

      if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('applied_at', startDate).lte('applied_at', endDate);
      }

      if (filters?.status) {
        query = query.eq('application_status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllApplications:', error);
      return [];
    }
  }

  // Get department-wise analytics
  async getDepartmentAnalytics(filters?: {
    year?: string;
    employmentType?: string;
  }): Promise<DepartmentAnalytics[]> {
    try {
      // Get all students by department (using branch_field)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('branch_field, user_id')
        .not('branch_field', 'is', null);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      // Get placement records
      const placementRecords = await this.getPlacementRecords(filters);

      // Group students by department (branch_field)
      const departmentStudents = (studentsData || []).reduce(
        (acc, student) => {
          const dept = student.branch_field || 'Unknown';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Group placements by department
      const departmentPlacements = placementRecords.reduce(
        (acc, placement) => {
          const dept = placement.department || 'Unknown';
          if (!acc[dept]) {
            acc[dept] = [];
          }
          acc[dept].push(placement);
          return acc;
        },
        {} as Record<string, PlacementRecord[]>
      );

      // Calculate analytics for each department
      const analytics: DepartmentAnalytics[] = Object.keys(departmentStudents).map((department) => {
        const totalStudents = departmentStudents[department] || 0;
        const deptPlacements = departmentPlacements[department] || [];
        const fullTimePlacements = deptPlacements.filter((p) => p.employment_type === 'Full-time');
        const internships = deptPlacements.filter((p) => p.employment_type === 'Internship');

        // Calculate CTC metrics for full-time positions only
        const fullTimeSalaries = fullTimePlacements
          .map((p) => p.salary_offered)
          .filter((salary) => salary > 0)
          .sort((a, b) => a - b);

        const avgCtc =
          fullTimeSalaries.length > 0
            ? fullTimeSalaries.reduce((sum, salary) => sum + salary, 0) / fullTimeSalaries.length
            : 0;

        const medianCtc =
          fullTimeSalaries.length > 0
            ? fullTimeSalaries.length % 2 === 0
              ? (fullTimeSalaries[fullTimeSalaries.length / 2 - 1] +
                  fullTimeSalaries[fullTimeSalaries.length / 2]) /
                2
              : fullTimeSalaries[Math.floor(fullTimeSalaries.length / 2)]
            : 0;

        const highestCtc = fullTimeSalaries.length > 0 ? Math.max(...fullTimeSalaries) : 0;

        return {
          department,
          total_students: totalStudents,
          placed_students: deptPlacements.length,
          placement_rate: totalStudents > 0 ? (deptPlacements.length / totalStudents) * 100 : 0,
          avg_ctc: avgCtc,
          median_ctc: medianCtc,
          highest_ctc: highestCtc,
          total_offers: deptPlacements.length,
          internships: internships.length,
          full_time: fullTimePlacements.length,
        };
      });

      return analytics.sort((a, b) => b.placed_students - a.placed_students);
    } catch (error) {
      console.error('Error in getDepartmentAnalytics:', error);
      return [];
    }
  }

  // Get overall placement statistics
  async getPlacementStats(filters?: {
    year?: string;
    department?: string;
  }): Promise<PlacementStats> {
    try {
      const placementRecords = await this.getPlacementRecords(filters);
      const allApplications = await this.getAllApplications(filters);

      const fullTimePlacements = placementRecords.filter((p) => p.employment_type === 'Full-time');
      const internships = placementRecords.filter((p) => p.employment_type === 'Internship');

      // Calculate CTC metrics for full-time positions
      const fullTimeSalaries = fullTimePlacements
        .map((p) => p.salary_offered)
        .filter((salary) => salary > 0)
        .sort((a, b) => a - b);

      const avgCTC =
        fullTimeSalaries.length > 0
          ? fullTimeSalaries.reduce((sum, salary) => sum + salary, 0) / fullTimeSalaries.length
          : 0;

      const medianCTC =
        fullTimeSalaries.length > 0
          ? fullTimeSalaries.length % 2 === 0
            ? (fullTimeSalaries[fullTimeSalaries.length / 2 - 1] +
                fullTimeSalaries[fullTimeSalaries.length / 2]) /
              2
            : fullTimeSalaries[Math.floor(fullTimeSalaries.length / 2)]
          : 0;

      const highestCTC = fullTimeSalaries.length > 0 ? Math.max(...fullTimeSalaries) : 0;

      // Get total students for placement rate calculation
      let totalStudentsQuery = supabase.from('students').select('user_id', { count: 'exact' });

      if (filters?.department) {
        totalStudentsQuery = totalStudentsQuery.eq('branch_field', filters.department);
      }

      const { count: totalStudents } = await totalStudentsQuery;

      const placementRate =
        totalStudents && totalStudents > 0 ? (placementRecords.length / totalStudents) * 100 : 0;

      return {
        totalPlacements: placementRecords.length,
        totalApplications: allApplications.length,
        avgCTC,
        medianCTC,
        highestCTC,
        totalInternships: internships.length,
        totalFullTime: fullTimePlacements.length,
        placementRate,
      };
    } catch (error) {
      console.error('Error in getPlacementStats:', error);
      return {
        totalPlacements: 0,
        totalApplications: 0,
        avgCTC: 0,
        medianCTC: 0,
        highestCTC: 0,
        totalInternships: 0,
        totalFullTime: 0,
        placementRate: 0,
      };
    }
  }

  // Get CTC distribution analysis
  async getCTCDistribution(filters?: { year?: string; department?: string }) {
    try {
      const placementRecords = await this.getPlacementRecords(filters);
      const fullTimePlacements = placementRecords.filter((p) => p.employment_type === 'Full-time');
      const internships = placementRecords.filter((p) => p.employment_type === 'Internship');

      const totalPlacements = placementRecords.length;

      // CTC ranges for full-time positions
      const above10L = fullTimePlacements.filter((p) => p.salary_offered >= 1000000).length;
      const between5L10L = fullTimePlacements.filter(
        (p) => p.salary_offered >= 500000 && p.salary_offered < 1000000
      ).length;
      const below5L = fullTimePlacements.filter(
        (p) => p.salary_offered > 0 && p.salary_offered < 500000
      ).length;

      return {
        above10L: {
          count: above10L,
          percentage: totalPlacements > 0 ? (above10L / totalPlacements) * 100 : 0,
        },
        between5L10L: {
          count: between5L10L,
          percentage: totalPlacements > 0 ? (between5L10L / totalPlacements) * 100 : 0,
        },
        below5L: {
          count: below5L,
          percentage: totalPlacements > 0 ? (below5L / totalPlacements) * 100 : 0,
        },
        internships: {
          count: internships.length,
          percentage: totalPlacements > 0 ? (internships.length / totalPlacements) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('Error in getCTCDistribution:', error);
      return {
        above10L: { count: 0, percentage: 0 },
        between5L10L: { count: 0, percentage: 0 },
        below5L: { count: 0, percentage: 0 },
        internships: { count: 0, percentage: 0 },
      };
    }
  }

  // Get recent placements (last 10)
  async getRecentPlacements(limit: number = 10): Promise<PlacementRecord[]> {
    try {
      const placementRecords = await this.getPlacementRecords();
      return placementRecords
        .sort((a, b) => new Date(b.placement_date).getTime() - new Date(a.placement_date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentPlacements:', error);
      return [];
    }
  }

  // Get companies with most placements
  async getTopCompanies(limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select(
          `
          opportunities!fk_applied_jobs_opportunity (
            company_name
          )
        `
        )
        .eq('application_status', 'accepted');

      if (error) {
        console.error('Error fetching top companies:', error);
        throw error;
      }

      // Count placements by company
      const companyCount = (data || []).reduce(
        (acc, record) => {
          // @ts-expect-error - Auto-suppressed for migration
          const companyName = record.opportunities?.company_name;
          if (companyName) {
            acc[companyName] = (acc[companyName] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Sort and return top companies
      return Object.entries(companyCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([company, count]) => ({ company, placements: count }));
    } catch (error) {
      console.error('Error in getTopCompanies:', error);
      return [];
    }
  }

  // Export placement data to CSV
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
        ['Placement Analytics Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [],
        ['OVERALL SUMMARY'],
        ['Total Placements', stats.totalPlacements],
        ['Total Applications', stats.totalApplications],
        ['Overall Placement Rate (%)', stats.placementRate.toFixed(1)],
        ['Overall Avg CTC (₹)', stats.avgCTC.toFixed(0)],
        ['Overall Median CTC (₹)', stats.medianCTC.toFixed(0)],
        ['Highest CTC (₹)', stats.highestCTC.toFixed(0)],
        ['Full-time Placements', stats.totalFullTime],
        ['Internships', stats.totalInternships],
        [],
        ['DEPARTMENT-WISE ANALYTICS'],
        [
          'Department',
          'Total Students',
          'Placed Students',
          'Placement Rate (%)',
          'Avg CTC (₹)',
          'Median CTC (₹)',
          'Highest CTC (₹)',
          'Full-time',
          'Internships',
        ],
        ...departmentAnalytics.map((dept) => [
          dept.department,
          dept.total_students,
          dept.placed_students,
          dept.placement_rate.toFixed(1),
          dept.avg_ctc.toFixed(0),
          dept.median_ctc.toFixed(0),
          dept.highest_ctc.toFixed(0),
          dept.full_time,
          dept.internships,
        ]),
        [],
        ['PLACEMENT RECORDS'],
        [
          'Student Name',
          'Student ID',
          'Company',
          'Job Title',
          'Department',
          'Employment Type',
          'CTC (₹)',
          'Location',
          'Placement Date',
          'Status',
        ],
        ...placementRecords.map((record) => [
          record.student_name,
          record.student_id,
          record.company_name,
          record.job_title,
          record.department,
          record.employment_type,
          record.salary_offered,
          record.location,
          record.placement_date,
          record.status,
        ]),
      ];

      // Convert to CSV string
      const csvContent = departmentCsvData
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error in exportPlacementData:', error);
      throw error;
    }
  }
}

export const placementAnalyticsService = new PlacementAnalyticsService();
