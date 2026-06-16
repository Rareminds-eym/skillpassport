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

import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

import { useUser } from '@/shared/model/authStore';
const logger = getLogger('college-admin-dashboard');

interface DashboardStats {
  totalLearners: number;
  totalFaculty: number;
  totalDepartments: number;
  placementRate: number;
  learnersChange: number | null;
  facultyChange: number | null;
  departmentsChange: number | null;
  placementRateChange: number | null;
}

interface DashboardStatsResponse {
  success: boolean;
  data?: {
    totalLearners: number;
    totalFaculty: number;
    totalDepartments: number;
    placementRate: number;
    learnersChange: number | null;
    facultyChange: number | null;
    departmentsChange: number | null;
    placementRateChange: number | null;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUser();
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLearners: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    placementRate: 0,
    learnersChange: null,
    facultyChange: null,
    departmentsChange: null,
    placementRateChange: null,
  });

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Resolve college ID from organizations table (authoritative source for admin logins)
        const orgRes = await apiPost<{ data?: { id: string } }>('/college-admin/actions', {
          action: 'get-org-by-admin-or-email',
          userId: user.id,
          email: user.email
        });
        const collegeId = orgRes?.data?.id || null;

        if (!collegeId) {
          logger.error('No college_id found for user', new Error('College ID resolution failed'));
          setLoading(false);
          return;
        }

        logger.info('College ID resolved via organizations table', { collegeId });

        // Fetch all stats in a single backend call
        const res = await apiPost<DashboardStatsResponse>('/college-admin/actions', {
          action: 'get-dashboard-stats',
          college_id: collegeId
        });

        if (res.success && res.data) {
          setStats({
            totalLearners: res.data.totalLearners || 0,
            totalFaculty: res.data.totalFaculty || 0,
            totalDepartments: res.data.totalDepartments || 0,
            placementRate: res.data.placementRate || 0,
            learnersChange: res.data.learnersChange ?? null,
            facultyChange: res.data.facultyChange ?? null,
            departmentsChange: res.data.departmentsChange ?? null,
            placementRateChange: res.data.placementRateChange ?? null,
          });
        }
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
      value: loading ? "..." : stats.totalLearners.toLocaleString(),
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

