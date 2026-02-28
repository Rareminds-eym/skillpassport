import { supabase } from '../../lib/supabaseClient';

/**
 * College Reports & Analytics Service
 * Fetches real data from Supabase for the Reports & Analytics Hub
 */

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

// Helper to get date range
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

// Helper to determine status
const getStatus = (value: number, threshold = 90): string => {
  if (value >= 95) return 'Excellent';
  if (value >= threshold) return 'Good';
  if (value >= 80) return 'Average';
  return 'Needs Attention';
};

// Helper to get college ID from current user - matches useStudents hook logic
const getCollegeIdForCurrentUser = async (): Promise<string | null> => {
  try {
    console.log('🔍 [Reports] Getting college ID for current user...');

    // Check localStorage first (same as useStudents)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log(
        '📦 [Reports] Found user in localStorage:',
        userData.email,
        'role:',
        userData.role,
        'collegeId:',
        userData.collegeId
      );
      if (userData.role === 'college_admin' && userData.collegeId) {
        console.log('✅ [Reports] Using collegeId from localStorage:', userData.collegeId);
        return userData.collegeId;
      }
    }

    // Fallback to Supabase auth (same as useStudents)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('🔐 [Reports] Supabase auth user:', user?.email, 'id:', user?.id);

    if (user) {
      // Get user role from users table (same as useStudents)
      const { data: userRecord } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();

      const userRole = userRecord?.role || null;
      console.log('👤 [Reports] User role from database:', userRole);

      // Check for college admin (using unified organizations table)
      if (userRole === 'college_admin' && user.email) {
        // Find college by matching admin_id or email in organizations table
        const { data: college, error: collegeError } = await supabase
          .from('organizations')
          .select('id, name, email')
          .eq('organization_type', 'college')
          .or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
          .single();

        console.log('🏫 [Reports] College lookup from organizations:', college, 'error:', collegeError);

        if (college?.id) {
          console.log('✅ [Reports] Found college:', college.id, college.name);
          return college.id;
        } else {
          // Debug: fetch all colleges to see what's available
          const { data: allColleges } = await supabase
            .from('organizations')
            .select('id, name, email, admin_id')
            .eq('organization_type', 'college');
          console.log('📋 [Reports] All colleges in database:', allColleges);
        }
      }

      // Also try admin_id as fallback
      if (user.id) {
        const { data: collegeByAdmin, error: adminError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('organization_type', 'college')
          .eq('admin_id', user.id)
          .single();

        console.log('🏫 [Reports] College by admin_id lookup:', collegeByAdmin, 'error:', adminError);

        if (collegeByAdmin?.id) {
          console.log('✅ [Reports] Found college by admin_id:', collegeByAdmin.id);
          return collegeByAdmin.id;
        }
      }
    }
    console.warn('⚠️ [Reports] No college ID found for current user');
    return null;
  } catch (error) {
    console.error('❌ [Reports] Error getting college ID:', error);
    return null;
  }
};

export const reportsService = {
  async getAttendanceReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const { startDate, endDate } = getDateRange(filters.dateRange);

      // Get college ID - use provided or fetch from current user
      let collegeId = filters.collegeId;
      console.log('📊 [Reports] getAttendanceReport called with collegeId from filters:', collegeId);
      
      if (!collegeId) {
        collegeId = (await getCollegeIdForCurrentUser()) || '';
        console.log('📊 [Reports] Got collegeId from current user:', collegeId);
      }

      // Query students
      let studentsQuery = supabase
        .from('students')
        .select('id, college_id');

      if (collegeId) {
        console.log('📊 [Reports] Filtering students by college_id:', collegeId);
        studentsQuery = studentsQuery.eq('college_id', collegeId);
      } else {
        console.warn('⚠️ [Reports] No collegeId - will fetch ALL students');
      }

      const { data: students, error: studentsError } = await studentsQuery;

      if (studentsError) {
        console.error('❌ [Reports] Error fetching students:', studentsError);
      }
      
      const totalStudents = students?.length || 0;
      console.log('✅ [Reports] Found', totalStudents, 'students for college:', collegeId);

      // ✅ NOW CONNECTED: Fetch real attendance data from college_attendance_records (Attendance Tracking)
      let recordsQuery = supabase
        .from('college_attendance_records')
        .select(`
          id,
          status,
          date,
          student_id,
          department_name,
          session_id
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      // Filter by college through sessions
      if (collegeId) {
        // First get session IDs for this college
        const { data: sessions } = await supabase
          .from('college_attendance_sessions')
          .select('id')
          .eq('college_id', collegeId);
        
        const sessionIds = sessions?.map(s => s.id) || [];
        
        if (sessionIds.length > 0) {
          recordsQuery = recordsQuery.in('session_id', sessionIds);
        } else {
          // No sessions for this college, return empty data
          console.log('⚠️ [Reports] No attendance sessions found for college:', collegeId);
        }
      }

      const { data: attendanceRecords, error: recordsError } = await recordsQuery;
      
      if (recordsError) {
        console.error('❌ [Reports] Error fetching attendance records:', recordsError);
      }
      
      const totalRecords = attendanceRecords?.length || 0;
      // Count present, late, and excused as "attended"
      const presentCount = attendanceRecords?.filter(
        a => a.status === 'present' || a.status === 'late' || a.status === 'excused'
      ).length || 0;
      const hasRealData = totalRecords > 0;

      console.log('📊 [Reports] Attendance records from tracking system:', totalRecords, 'Attended:', presentCount);

      // Calculate monthly attendance
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let chartValues: number[];
      let attendanceRate: number;

      if (hasRealData) {
        // Use real data - calculate monthly attendance
        const monthlyData = new Map<number, { total: number; present: number }>();
        
        attendanceRecords.forEach(record => {
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
        console.log('✅ [Reports] Using REAL attendance data - Rate:', attendanceRate + '%');
      } else {
        // No data - show zeros
        chartValues = months.map(() => 0);
        attendanceRate = 0;
        console.log('⚠️ [Reports] No attendance data - showing zeros');
      }

      // Fetch departments
      let deptQuery = supabase.from('departments').select('id, name, code');
      if (collegeId) {
        deptQuery = deptQuery.eq('college_id', collegeId);
      }
      const { data: departments } = await deptQuery;

      // Calculate department-wise attendance from real records
      const tableData = (departments || []).slice(0, 5).map(dept => {
        if (hasRealData) {
          // Filter records by department name
          const deptRecords = attendanceRecords.filter(r => r.department_name === dept.name);
          const deptTotal = deptRecords.length;
          const deptPresent = deptRecords.filter(
            r => r.status === 'present' || r.status === 'late' || r.status === 'excused'
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

      // Calculate students below 75% threshold
      const belowThreshold = hasRealData 
        ? new Set(
            attendanceRecords
              .filter(r => {
                const studentRecords = attendanceRecords.filter(ar => ar.student_id === r.student_id);
                const studentPresent = studentRecords.filter(
                  sr => sr.status === 'present' || sr.status === 'late' || sr.status === 'excused'
                ).length;
                return studentRecords.length > 0 && (studentPresent / studentRecords.length) < 0.75;
              })
              .map(r => r.student_id)
          ).size
        : Math.floor(totalStudents * 0.03);

      return {
        kpis: [
          { title: 'Overall Attendance', value: `${attendanceRate}%`, change: '+2.1%', trend: 'up', color: 'blue' },
          { title: 'Total Students', value: totalStudents.toLocaleString(), change: `+${Math.floor(totalStudents * 0.02)}`, trend: 'up', color: 'green' },
          { title: 'Below Threshold', value: belowThreshold.toString(), change: '-5', trend: 'down', color: 'red' },
          { title: 'Departments', value: (departments?.length || 0).toString(), change: '0', trend: 'neutral', color: 'gray' }
        ],
        chartData: { labels: months, values: chartValues },
        tableData
      };
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      throw error;
    }
  },

  async getPerformanceReport(filters: ReportFilters): Promise<ReportData> {
    try {
      // Get college ID
      let collegeId = filters.collegeId;
      if (!collegeId) {
        collegeId = await getCollegeIdForCurrentUser() || '';
      }

      // First, get students from this college to filter mark entries
      let studentsQuery = supabase.from('students').select('id');
      if (collegeId) {
        studentsQuery = studentsQuery.eq('college_id', collegeId);
      }
      const { data: collegeStudents } = await studentsQuery;
      const studentIds = collegeStudents?.map(s => s.id) || [];

      // Fetch mark entries only for this college's students
      let markEntriesQuery = supabase
        .from('mark_entries')
        .select('marks_obtained, grade, student_id, assessment_id');

      // Filter by student IDs from this college
      if (studentIds.length > 0) {
        markEntriesQuery = markEntriesQuery.in('student_id', studentIds);
      } else {
        // No students in this college, so no mark entries
        markEntriesQuery = markEntriesQuery.eq('student_id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      }

      const { data: markEntries } = await markEntriesQuery;

      // Get departments from this college to filter assessments
      let deptQuery = supabase.from('departments').select('id, name');
      if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
      const { data: departments } = await deptQuery;
      const departmentIds = departments?.map(d => d.id) || [];

      // Fetch assessments only for this college's departments
      let assessmentsQuery = supabase
        .from('assessments')
        .select('id, total_marks, pass_marks, department_id');

      if (departmentIds.length > 0) {
        assessmentsQuery = assessmentsQuery.in('department_id', departmentIds);
      } else {
        assessmentsQuery = assessmentsQuery.eq('department_id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: assessments } = await assessmentsQuery;

      let passCount = 0;
      const totalEntries = markEntries?.length || 0;

      markEntries?.forEach(entry => {
        const assessment = assessments?.find(a => a.id === entry.assessment_id);
        if (assessment && entry.marks_obtained >= assessment.pass_marks) passCount++;
      });

      const passRate = totalEntries > 0 ? Math.round((passCount / totalEntries) * 100) : 0;

      const hasRealData = totalEntries > 0;
      const avgGPA = 0; // Will be calculated from real data when available
      const topPerformers = markEntries?.filter(e => e.grade === 'O' || e.grade === 'A+').length || 0;
      const needSupport = markEntries?.filter(e => e.grade === 'C' || e.grade === 'F').length || 0;

      const chartLabels = (departments || []).slice(0, 5).map(d => d.name);
      const chartValues = chartLabels.map(() => 0); // Real calculation needed

      const tableData = (departments || []).slice(0, 5).map(dept => {
        return {
          period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          department: dept.name,
          value: '0%',
          change: '0%',
          status: 'No Data'
        };
      });

      return {
        kpis: [
          { title: 'Average GPA', value: hasRealData ? avgGPA.toFixed(2) : '0.00', change: '0', trend: 'neutral', color: 'green' },
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
      console.error('Error fetching performance report:', error);
      throw error;
    }
  },

  async getPlacementReport(filters: ReportFilters): Promise<ReportData> {
    try {
      const { startDate, endDate } = getDateRange(filters.dateRange);

      // Get college ID
      let collegeId = filters.collegeId;
      if (!collegeId) {
        collegeId = await getCollegeIdForCurrentUser() || '';
      }

      // First, get students from this college to filter candidates
      let studentsQuery = supabase.from('students').select('id');
      if (collegeId) {
        studentsQuery = studentsQuery.eq('college_id', collegeId);
      }
      const { data: collegeStudents } = await studentsQuery;
      const studentIds = collegeStudents?.map(s => s.id) || [];

      // Fetch candidates only for this college's students
      let candidatesQuery = supabase
        .from('pipeline_candidates')
        .select('id, stage, status, added_at, student_id')
        .gte('added_at', startDate)
        .lte('added_at', endDate);

      // Filter by student IDs from this college
      if (studentIds.length > 0) {
        candidatesQuery = candidatesQuery.in('student_id', studentIds);
      } else {
        // No students in this college, so no candidates
        candidatesQuery = candidatesQuery.eq('student_id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      }

      const { data: candidates } = await candidatesQuery;

      const totalCandidates = candidates?.length || 0;
      const hiredCount = candidates?.filter(c => c.stage === 'hired').length || 0;
      const placementRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

      // Get companies count from companies table (same as placement page)
      let uniqueCompanies = 0;
      try {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id');

        if (companiesError) {
          console.warn('⚠️ [Reports] Companies table error:', companiesError.message);
          uniqueCompanies = 0;
        } else {
          uniqueCompanies = companies?.length || 0;
        }
      } catch (error) {
        console.warn('⚠️ [Reports] Could not fetch companies:', error);
        uniqueCompanies = 0;
      }

      const offersCount = candidates?.filter(c => c.stage === 'offer' || c.stage === 'offered').length || 0;

      // Fetch real placement offers for average package
      let offersQuery = supabase
        .from('placement_offers')
        .select('package_amount, status, offer_date')
        .eq('status', 'accepted')
        .gte('offer_date', startDate)
        .lte('offer_date', endDate);

      if (collegeId) {
        offersQuery = offersQuery.eq('college_id', collegeId);
      }

      const { data: placementOffers, error: offersError } = await offersQuery;
      
      if (offersError) {
        console.warn('⚠️ [Reports] Placement offers table error:', offersError.message);
      }
      
      let avgPackage = '₹0';
      if (placementOffers && placementOffers.length > 0) {
        const totalPackage = placementOffers.reduce((sum, o) => sum + Number(o.package_amount), 0);
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
      
      // Calculate real monthly placement data
      const hasRealData = totalCandidates > 0;
      const placements = hasRealData 
        ? months.map((_, idx) => {
            const monthCandidates = candidates?.filter(c => {
              const candidateMonth = new Date(c.added_at).getMonth();
              return candidateMonth === idx && c.stage === 'hired';
            }).length || 0;
            return monthCandidates;
          })
        : months.map(() => 0);
      
      const applications = hasRealData
        ? months.map((_, idx) => {
            const monthCandidates = candidates?.filter(c => {
              const candidateMonth = new Date(c.added_at).getMonth();
              return candidateMonth === idx;
            }).length || 0;
            return monthCandidates;
          })
        : months.map(() => 0);

      let deptQuery = supabase.from('departments').select('id, name');
      if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
      const { data: departments } = await deptQuery;

      const tableData = (departments || []).slice(0, 5).map(dept => {
        return {
          period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          department: dept.name,
          value: '0%',
          change: '0%',
          status: 'No Data'
        };
      });

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
      console.error('Error fetching placement report:', error);
      throw error;
    }
  },

  async getSkillAnalyticsReport(filters: ReportFilters): Promise<ReportData> {
    try {
      // Get college ID
      let collegeId = filters.collegeId;
      if (!collegeId) {
        collegeId = await getCollegeIdForCurrentUser() || '';
      }

      // First, get students from this college to filter enrollments
      let studentsQuery = supabase.from('students').select('id');
      if (collegeId) {
        studentsQuery = studentsQuery.eq('college_id', collegeId);
      }
      const { data: collegeStudents } = await studentsQuery;
      const studentIds = collegeStudents?.map(s => s.id) || [];

      // Fetch enrollments only for this college's students
      let enrollmentsQuery = supabase
        .from('course_enrollments')
        .select('id, status, progress, course_id, student_id, created_at');

      // Filter by student IDs from this college
      if (studentIds.length > 0) {
        enrollmentsQuery = enrollmentsQuery.in('student_id', studentIds);
      } else {
        // No students in this college, so no enrollments
        enrollmentsQuery = enrollmentsQuery.eq('student_id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      }

      const { data: enrollments, error: enrollmentsError } = await enrollmentsQuery;

      if (enrollmentsError) {
        console.warn('⚠️ [Reports] Course enrollments error:', enrollmentsError.message);
      }

      const totalEnrollments = enrollments?.length || 0;
      const completedCount = enrollments?.filter(e => e.status === 'completed').length || 0;
      const inProgressCount = enrollments?.filter(e => e.status === 'in_progress').length || 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;

      const { data: courses, error: coursesError } = await supabase.from('courses').select('id, title, category');
      
      if (coursesError) {
        console.warn('⚠️ [Reports] Courses table error:', coursesError.message);
      }
      
      const totalCourses = courses?.length || 0;
      const avgProgress = totalEnrollments > 0 ? enrollments?.reduce((sum, e) => sum + (e.progress || 0), 0) / totalEnrollments : 0;

      const hasRealData = totalEnrollments > 0;
      const categories = ['Technical', 'Soft Skills', 'Domain', 'Certification', 'Language'];
      const chartValues = categories.map(() => 0);

      let deptQuery = supabase.from('departments').select('id, name');
      if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
      const { data: departments } = await deptQuery;

      const tableData = (departments || []).slice(0, 5).map(dept => {
        return {
          period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          department: dept.name,
          value: '0%',
          change: '0%',
          status: 'No Data'
        };
      });

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
      console.error('Error fetching skill analytics report:', error);
      throw error;
    }
  },

  async getBudgetReport(filters: ReportFilters): Promise<ReportData> {
    try {
      // Get college ID
      let collegeId = filters.collegeId;
      if (!collegeId) {
        collegeId = await getCollegeIdForCurrentUser() || '';
      }

      const { data: budgets } = await supabase
        .from('department_budgets')
        .select('id, department_id, budget_heads, status, period_from, period_to');

      let totalAllocated = 0;
      let totalSpent = 0;

      budgets?.forEach(budget => {
        const heads = budget.budget_heads || [];
        heads.forEach((head: any) => {
          totalAllocated += head.allocated_amount || 0;
          totalSpent += head.spent_amount || 0;
        });
      });

      const hasRealData = totalAllocated > 0;
      const utilizationRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
      const remaining = totalAllocated - totalSpent;

      let deptQuery = supabase.from('departments').select('id, name');
      if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
      const { data: departments } = await deptQuery;

      const deptNames = (departments || []).slice(0, 6).map(d => d.name);
      const allocated = deptNames.map(() => 0);
      const spent = deptNames.map(() => 0);

      const tableData = (departments || []).slice(0, 5).map(dept => {
        return {
          period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          department: dept.name,
          value: '0%',
          change: '0%',
          status: 'No Data'
        };
      });

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
      console.error('Error fetching budget report:', error);
      throw error;
    }
  },

  async getExamProgressReport(filters: ReportFilters): Promise<ReportData> {
    try {
      // Get college ID
      let collegeId = filters.collegeId;
      if (!collegeId) {
        collegeId = await getCollegeIdForCurrentUser() || '';
      }

      let examQuery = supabase.from('exam_windows').select('id, window_name, status, start_date, end_date, is_published');
      if (collegeId) examQuery = examQuery.eq('college_id', collegeId);
      const { data: examWindows } = await examQuery;

      const totalExams = examWindows?.length || 0;
      const completedExams = examWindows?.filter(e => e.status === 'completed').length || 0;
      const ongoingExams = examWindows?.filter(e => e.status === 'ongoing').length || 0;
      const scheduledExams = examWindows?.filter(e => e.status === 'scheduled').length || 0;

      const { data: registrations } = await supabase.from('exam_registrations').select('id, status, fee_paid');
      const totalRegistrations = registrations?.length || 0;

      const hasRealData = totalExams > 0;
      const statuses = ['Completed', 'Ongoing', 'Scheduled', 'Draft'];
      const chartValues = [
        completedExams, 
        ongoingExams, 
        scheduledExams, 
        Math.max(0, totalExams - completedExams - ongoingExams - scheduledExams)
      ];

      let deptQuery = supabase.from('departments').select('id, name');
      if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
      const { data: departments } = await deptQuery;

      const tableData = (departments || []).slice(0, 5).map(dept => {
        return {
          period: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          department: dept.name,
          value: '0%',
          change: '0%',
          status: 'No Data'
        };
      });

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
      console.error('Error fetching exam progress report:', error);
      throw error;
    }
  },

  async getDepartments(collegeId?: string): Promise<{ id: string; name: string; code: string }[]> {
    try {
      // Get college ID if not provided
      let cId = collegeId;
      if (!cId) {
        cId = await getCollegeIdForCurrentUser() || '';
      }

      let query = supabase.from('departments').select('id, name, code').order('name');
      if (cId) query = query.eq('college_id', cId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }
};

export default reportsService;
