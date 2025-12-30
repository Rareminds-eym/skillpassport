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
import KPICard from "../../../components/admin/KPICard";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../context/AuthContext";

interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  placementRate: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    placementRate: 0,
  });

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get college_id for current user from college_lecturers table
        const { data: collegeLecturer } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .eq('user_id', user.id)
          .single();

        const collegeId = collegeLecturer?.collegeId;

        if (!collegeId) {
          console.log('No college_id found for user');
          setLoading(false);
          return;
        }

        // Fetch students count
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', collegeId);

        // Fetch faculty count from college_lecturers
        const { count: facultyCount } = await supabase
          .from('college_lecturers')
          .select('*', { count: 'exact', head: true })
          .eq('collegeId', collegeId);

        // Fetch departments count
        const { count: departmentsCount } = await supabase
          .from('departments')
          .select('*', { count: 'exact', head: true })
          .eq('college_id', collegeId);

        // Calculate placement rate from placements table
        const { count: totalPlaced } = await supabase
          .from('placements')
          .select('*', { count: 'exact', head: true })
          .eq('placementStatus', 'hired');

        const placementRate = studentsCount && studentsCount > 0 
          ? Math.round(((totalPlaced || 0) / studentsCount) * 100) 
          : 0;

        setStats({
          totalStudents: studentsCount || 0,
          totalFaculty: facultyCount || 0,
          totalDepartments: departmentsCount || 0,
          placementRate: placementRate,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // ===== KPI Cards with real data =====
  const kpiData = [
    {
      title: "Total Students",
      value: loading ? "..." : stats.totalStudents.toLocaleString(),
      change: 0,
      changeLabel: "enrolled",
      icon: <Users className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Faculty",
      value: loading ? "..." : stats.totalFaculty.toLocaleString(),
      change: 0,
      changeLabel: "active members",
      icon: <Award className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Departments",
      value: loading ? "..." : stats.totalDepartments.toLocaleString(),
      change: 0,
      changeLabel: "across programs",
      icon: <Building2 className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Placement Rate",
      value: loading ? "..." : `${stats.placementRate}%`,
      change: 0,
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
      color: "bg-blue-500",
      route: "/college-admin/departments/management",
    },
    {
      title: "Student Admissions",
      description: "Process new admissions",
      icon: Users,
      color: "bg-purple-500",
      route: "/college-admin/students/data-management",
    },
    {
      title: "Attendance Tracking",
      description: "View attendance reports",
      icon: CheckCircle,
      color: "bg-green-500",
      route: "/college-admin/students/attendance",
    },
    {
      title: "Course Mapping",
      description: "Map courses to programs",
      icon: BookOpen,
      color: "bg-orange-500",
      route: "/college-admin/departments/mapping",
    },
    {
      title: "Exam Management",
      description: "Schedule & manage exams",
      icon: FileText,
      color: "bg-red-500",
      route: "/college-admin/examinations",
    },
    {
      title: "Placement Dashboard",
      description: "Track placement activities",
      icon: Briefcase,
      color: "bg-indigo-500",
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
          <div className="flex gap-2">
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
          </div>
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
                <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition`}>
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
