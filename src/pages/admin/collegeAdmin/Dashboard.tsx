import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Award,
  ChevronRight,
  Clock,
  BookOpen,
  FileText,
  DollarSign,
  Download,
  Filter,
  Bell,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { KPICard } from '@/features/analytics';
import { useNavigate } from "react-router-dom";
import { supabase } from '@/shared/api/supabaseClient';

import { getLogger } from '@/shared/config/logging';

import { useUser } from '@/shared/model/authStore';
const logger = getLogger('college-admin-dashboard');

interface DashboardStats {
  totallearners: number;
  totalFaculty: number;
  totalDepartments: number;
  placementRate: number;
  learnersChange: number;
  facultyChange: number;
  departmentsChange: number;
  placementRateChange: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totallearners: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    placementRate: 0,
    learnersChange: 0,
    facultyChange: 0,
    departmentsChange: 0,
    placementRateChange: 0,
  });

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get college_id for current user
        let collegeId = null;

        // First check college_lecturers table
        const { data: collegeLecturer } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        collegeId = collegeLecturer?.collegeId;

        // If not found, check organizations table for college admin
        if (!collegeId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('admin_id', user.id)
            .eq('organization_type', 'college')
            .maybeSingle();

          collegeId = org?.id;
        }

        if (!collegeId) {
          logger.info('No college_id found for user');
          setLoading(false);
          return;
        }

        // Calculate date ranges for comparison
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Fetch current learners count
        const { count: learnersCount } = await supabase
          .from('learners')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', collegeId);

        // Fetch learners count from 30 days ago
        const { count: learnersCountPrevious } = await supabase
          .from('learners')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', collegeId)
          .lte('created_at', thirtyDaysAgo.toISOString());

        // Calculate learners change percentage
        const learnersChange = learnersCountPrevious && learnersCountPrevious > 0
          ? Math.round(((learnersCount || 0) - learnersCountPrevious) / learnersCountPrevious * 100)
          : 0;

        // Fetch current faculty count from college_lecturers
        const { count: facultyCount } = await supabase
          .from('college_lecturers')
          .select('*', { count: 'exact', head: true })
          .eq('collegeId', collegeId);

        // Fetch faculty count from 30 days ago
        const { count: facultyCountPrevious } = await supabase
          .from('college_lecturers')
          .select('*', { count: 'exact', head: true })
          .eq('collegeId', collegeId)
          .lte('created_at', thirtyDaysAgo.toISOString());

        // Calculate faculty change percentage
        const facultyChange = facultyCountPrevious && facultyCountPrevious > 0
          ? Math.round(((facultyCount || 0) - facultyCountPrevious) / facultyCountPrevious * 100)
          : 0;

        // Fetch current departments count
        const { count: departmentsCount } = await supabase
          .from('departments')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', collegeId);

        // Fetch departments count from 30 days ago
        const { count: departmentsCountPrevious } = await supabase
          .from('departments')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', collegeId)
          .lte('created_at', thirtyDaysAgo.toISOString());

        // Calculate departments change percentage
        const departmentsChange = departmentsCountPrevious && departmentsCountPrevious > 0
          ? Math.round(((departmentsCount || 0) - departmentsCountPrevious) / departmentsCountPrevious * 100)
          : 0;

        // Calculate placement rate using the same logic as placement management
        // Filter by learners from this college
        const { data: collegelearners } = await supabase
          .from('learners')
          .select('id')
          .eq('college_id', collegeId);

        const learnerIds = collegelearners?.map(s => s.id) || [];
        
        let totalPlaced = 0;
        let totalPlacedPrevious = 0;
        
        if (learnerIds.length > 0) {
          // Count unique learners placed (not total offers) - current
          const { data: placedlearners } = await supabase
            .from('applied_jobs')
            .select('learner_id')
            .eq('application_status', 'accepted')
            .in('learner_id', learnerIds);
          
          const uniqueLearnerIds = new Set(placedlearners?.map(p => p.learner_id) || []);
          totalPlaced = uniqueLearnerIds.size;

          // Count unique learners placed 30 days ago
          const { data: placedlearnersPrevious } = await supabase
            .from('applied_jobs')
            .select('learner_id')
            .eq('application_status', 'accepted')
            .in('learner_id', learnerIds)
            .lte('updated_at', thirtyDaysAgo.toISOString());
          
          const uniqueLearnerIdsPrevious = new Set(placedlearnersPrevious?.map(p => p.learner_id) || []);
          totalPlacedPrevious = uniqueLearnerIdsPrevious.size;
        }

        const placementRate = learnersCount && learnersCount > 0 
          ? Math.round(((totalPlaced || 0) / learnersCount) * 100 * 10) / 10 // Round to 1 decimal place
          : 0;

        const placementRatePrevious = learnersCountPrevious && learnersCountPrevious > 0
          ? Math.round(((totalPlacedPrevious || 0) / learnersCountPrevious) * 100 * 10) / 10
          : 0;

        // Calculate placement rate change (absolute difference, not percentage)
        const placementRateChange = placementRatePrevious > 0
          ? Math.round((placementRate - placementRatePrevious) * 10) / 10
          : 0;

        setStats({
          totallearners: learnersCount || 0,
          totalFaculty: facultyCount || 0,
          totalDepartments: departmentsCount || 0,
          placementRate: placementRate,
          learnersChange: learnersChange,
          facultyChange: facultyChange,
          departmentsChange: departmentsChange,
          placementRateChange: placementRateChange,
        });
      } catch (error) {
        logger.error('Error fetching dashboard data:', error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // ===== KPI Cards with real data =====
  const kpiData = [
    {
      title: "Total Learners",
      value: loading ? "..." : stats.totallearners.toLocaleString(),
      change: stats.learnersChange,
      changeLabel: "enrolled",
      icon: <Users className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Faculty",
      value: loading ? "..." : stats.totalFaculty.toLocaleString(),
      change: stats.facultyChange,
      changeLabel: "active members",
      icon: <Award className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Departments",
      value: loading ? "..." : stats.totalDepartments.toLocaleString(),
      change: stats.departmentsChange,
      changeLabel: "across programs",
      icon: <Building2 className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Placement Rate",
      value: loading ? "..." : `${stats.placementRate}%`,
      change: stats.placementRateChange,
      changeLabel: "this academic year",
      icon: <Briefcase className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Quick Actions =====
  const quickActions = [
    {
      title: "Department Management",
      description: "Manage departments & faculty",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
      route: "/college-admin/departments/management",
    },
    {
      title: "Learner Admissions",
      description: "Process new admissions",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      route: "/college-admin/learners/data-management",
    },
    {
      title: "Attendance Tracking",
      description: "View attendance reports",
      icon: CheckCircle,
      color: "bg-blue-50 text-blue-600",
      route: "/college-admin/learners/attendance",
    },
    {
      title: "Course Mapping",
      description: "Map courses to programs",
      icon: BookOpen,
      color: "bg-blue-50 text-blue-600",
      route: "/college-admin/departments/mapping",
    },
    {
      title: "Exam Management",
      description: "Schedule & manage exams",
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      route: "/college-admin/examinations",
    },
    {
      title: "Placement Dashboard",
      description: "Track placement activities",
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
      route: "/college-admin/placements",
    },
  ];

  // ===== Render =====
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              College Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Overview of institutional performance and program analytics
            </p>
          </div>
          {/* <div className="flex gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export PDF</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.route)}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition group"
              >
                <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                    {action.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

