import { useAuth } from "@/hooks/useAuth";
import { reportsService } from "@/services/college/reportsService";
import { ApexOptions } from "apexcharts";
import {
    Activity,
    Award,
    BarChart3,
    Briefcase,
    Calendar,
    ChevronDown,
    DollarSign,
    Download,
    FileText,
    Filter,
    Loader2,
    PieChart,
    Table,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";

interface FilterState {
  dateRange: string;
  department: string;
  semester: string;
  userRole: string;
}

interface ReportKPI {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

interface ReportData {
  kpis: ReportKPI[];
  chartData: any;
  tableData: any[];
}

const ReportsAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("attendance");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "current-month",
    department: "all",
    semester: "current",
    userRole: "admin"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [collegeId, setCollegeId] = useState<string>("");

  // Report Categories based on client requirements
  const reportCategories = [
    {
      id: "attendance",
      title: "Attendance",
      icon: <Users className="h-5 w-5" />,
      description: "Student and faculty attendance tracking",
      color: "blue"
    },
    {
      id: "performance",
      title: "Performance/Grades",
      icon: <Award className="h-5 w-5" />,
      description: "Academic performance and grading analytics",
      color: "green"
    },
    {
      id: "exam-progress",
      title: "Exam Progress",
      icon: <FileText className="h-5 w-5" />,
      description: "Examination schedules and progress tracking",
      color: "purple"
    },
    {
      id: "placement",
      title: "Placement Overview",
      icon: <Briefcase className="h-5 w-5" />,
      description: "Placement statistics and company analytics",
      color: "orange"
    },
    {
      id: "skill-analytics",
      title: "Skill Course Analytics",
      icon: <Target className="h-5 w-5" />,
      description: "Skill development course performance",
      color: "indigo"
    },
    {
      id: "budget",
      title: "Dept Budget Usage",
      icon: <DollarSign className="h-5 w-5" />,
      description: "Department-wise budget allocation and usage",
      color: "emerald"
    }
  ];

  // Fetch college ID on mount
  useEffect(() => {
    const fetchCollegeId = async () => {
      try {
        // Check localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'college_admin' && userData.collegeId) {
            setCollegeId(userData.collegeId);
            return;
          }
        }

        // Fallback to Supabase auth
        if (user?.id) {
          const { supabase } = await import('@/lib/supabaseClient');
          
          // Query organizations table for college
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', 'college')
            .or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
            .maybeSingle();
          
          if (org?.id) {
            setCollegeId(org.id);
          }
        }
      } catch (error) {
        console.error('Error fetching college ID:', error);
      }
    };
    fetchCollegeId();
  }, [user?.id, user?.email]);

  // Fetch departments for filter
  useEffect(() => {
    const fetchDepartments = async () => {
      // Departments will be fetched even without collegeId since service handles it
      const depts = await reportsService.getDepartments(collegeId);
      setDepartments(depts);
    };
    fetchDepartments();
  }, [collegeId]);

  // Fetch report data when category or filters change
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const reportFilters = {
          dateRange: filters.dateRange,
          department: filters.department,
          semester: filters.semester,
          collegeId: collegeId
        };

        let data: ReportData | null = null;

        switch (selectedCategory) {
          case "attendance":
            data = await reportsService.getAttendanceReport(reportFilters);
            break;
          case "performance":
            data = await reportsService.getPerformanceReport(reportFilters);
            break;
          case "placement":
            data = await reportsService.getPlacementReport(reportFilters);
            break;
          case "skill-analytics":
            data = await reportsService.getSkillAnalyticsReport(reportFilters);
            break;
          case "budget":
            data = await reportsService.getBudgetReport(reportFilters);
            break;
          case "exam-progress":
            data = await reportsService.getExamProgressReport(reportFilters);
            break;
          default:
            data = await reportsService.getAttendanceReport(reportFilters);
        }

        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedCategory, filters, collegeId]);

  // Build chart options based on category
  const getChartOptions = (): { options: ApexOptions; series: any; type: string } => {
    if (!reportData?.chartData) {
      return {
        options: { chart: { type: "line" } } as ApexOptions,
        series: [],
        type: "line"
      };
    }

    switch (selectedCategory) {
      case "attendance":
      case "exam-progress":
        return {
          options: {
            chart: { type: "line", toolbar: { show: false } },
            stroke: { curve: "smooth", width: 3 },
            colors: ["#3b82f6"],
            xaxis: { categories: reportData.chartData.labels },
            yaxis: { min: 0, max: 100 },
            grid: { show: true, borderColor: "#f1f5f9" },
            tooltip: { theme: "light" }
          } as ApexOptions,
          series: [{ name: selectedCategory === "attendance" ? "Attendance %" : "Completion %", data: reportData.chartData.values }],
          type: "line"
        };

      case "performance":
      case "skill-analytics":
        return {
          options: {
            chart: { type: "donut" },
            labels: reportData.chartData.labels,
            colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"],
            legend: { position: "bottom" },
            plotOptions: {
              pie: {
                donut: {
                  size: "70%",
                  labels: {
                    show: true,
                    total: {
                      show: true,
                      label: "Average",
                      formatter: () => `${Math.round(reportData.chartData.values.reduce((a: number, b: number) => a + b, 0) / reportData.chartData.values.length)}%`
                    }
                  }
                }
              }
            }
          } as ApexOptions,
          series: reportData.chartData.values,
          type: "donut"
        };

      case "placement":
        return {
          options: {
            chart: { type: "bar", toolbar: { show: false } },
            colors: ["#10b981", "#3b82f6"],
            xaxis: { categories: reportData.chartData.labels },
            plotOptions: {
              bar: { horizontal: false, columnWidth: "55%", borderRadius: 4 }
            },
            dataLabels: { enabled: false },
            legend: { position: "top" }
          } as ApexOptions,
          series: [
            { name: "Placements", data: reportData.chartData.placements },
            { name: "Applications", data: reportData.chartData.applications }
          ],
          type: "bar"
        };

      case "budget":
        return {
          options: {
            chart: { type: "bar", toolbar: { show: false }, stacked: false },
            colors: ["#3b82f6", "#10b981"],
            xaxis: { categories: reportData.chartData.labels },
            plotOptions: {
              bar: { horizontal: false, columnWidth: "60%", borderRadius: 4 }
            },
            dataLabels: { enabled: false },
            legend: { position: "top" },
            yaxis: {
              labels: {
                formatter: (val: number) => {
                  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
                  return `₹${val}`;
                }
              }
            }
          } as ApexOptions,
          series: [
            { name: "Allocated", data: reportData.chartData.allocated },
            { name: "Spent", data: reportData.chartData.spent }
          ],
          type: "bar"
        };

      default:
        return {
          options: { chart: { type: "line" } } as ApexOptions,
          series: [],
          type: "line"
        };
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: "from-blue-500 to-blue-600 bg-blue-50 border-blue-200 text-blue-700",
      green: "from-green-500 to-green-600 bg-green-50 border-green-200 text-green-700",
      purple: "from-purple-500 to-purple-600 bg-purple-50 border-purple-200 text-purple-700",
      orange: "from-orange-500 to-orange-600 bg-orange-50 border-orange-200 text-orange-700",
      red: "from-red-500 to-red-600 bg-red-50 border-red-200 text-red-700",
      indigo: "from-indigo-500 to-indigo-600 bg-indigo-50 border-indigo-200 text-indigo-700",
      emerald: "from-emerald-500 to-emerald-600 bg-emerald-50 border-emerald-200 text-emerald-700",
      gray: "from-gray-500 to-gray-600 bg-gray-50 border-gray-200 text-gray-700"
    };
    return colorMap[color] || colorMap.blue;
  };

  const chartConfig = getChartOptions();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Reports & Analytics Hub
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Unified access to comprehensive reports for Admin, Academic head, HoD, Exam cell, and Placement teams
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium min-w-0"
            >
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Filters</span>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-w-0">
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Export All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select 
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="current-semester">Current Semester</option>
                <option value="last-semester">Last Semester</option>
                <option value="current-year">Current Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select 
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select 
                value={filters.semester}
                onChange={(e) => setFilters({...filters, semester: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current">Current Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
              <select 
                value={filters.userRole}
                onChange={(e) => setFilters({...filters, userRole: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="admin">Admin</option>
                <option value="academic-head">Academic Head</option>
                <option value="hod">HoD</option>
                <option value="exam-cell">Exam Cell</option>
                <option value="placement">Placement Team</option>
                <option value="skill">Skill Team</option>
                <option value="finance">Finance Team</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Report Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {reportCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedCategory === category.id
                ? `border-${category.color}-500 bg-${category.color}-50 shadow-md`
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`p-2 sm:p-3 rounded-lg bg-gradient-to-r ${getColorClasses(category.color).split(' ')[0]} ${getColorClasses(category.color).split(' ')[1]} text-white flex-shrink-0`}>
                {category.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base leading-tight">{category.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{category.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Report Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Report Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                {reportCategories.find(cat => cat.id === selectedCategory)?.title} Report
              </h2>
              <p className="text-gray-600 text-sm">
                {reportCategories.find(cat => cat.id === selectedCategory)?.description}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full md:w-auto">
                <button
                  onClick={() => setViewMode("chart")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-none ${
                    viewMode === "chart" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Chart</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 md:flex-none ${
                    viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Table className="h-4 w-4" />
                  <span>Table</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-1 md:flex-none">
                  <Download className="h-4 w-4" />
                  <span className="md:hidden">PDF</span>
                  <span className="hidden md:inline">Export PDF</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex-1 md:flex-none">
                  <Download className="h-4 w-4" />
                  <span className="md:hidden">Excel</span>
                  <span className="hidden md:inline">Export Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading report data...</span>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {reportData?.kpis.map((kpi, index) => (
                <div key={index} className={`p-3 sm:p-4 rounded-xl border ${getColorClasses(kpi.color).split(' ').slice(2).join(' ')}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium truncate pr-2">{kpi.title}</p>
                    {kpi.trend === "up" && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />}
                    {kpi.trend === "down" && <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />}
                    {kpi.trend === "neutral" && <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />}
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                  <p className={`text-xs sm:text-sm ${
                    kpi.trend === "up" ? "text-green-600" : 
                    kpi.trend === "down" ? "text-red-600" : "text-gray-600"
                  }`}>
                    {kpi.change} vs last period
                  </p>
                </div>
              ))}
            </div>

            {/* Chart/Table Content */}
            {viewMode === "chart" ? (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-6">
                <ReactApexChart
                  options={chartConfig.options}
                  series={chartConfig.series}
                  type={chartConfig.type as any}
                  height={300}
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm">Period</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm">Department</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm">Value</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm">Change</th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.tableData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-white transition-colors">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-900 text-sm">{row.period}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-900 text-sm">{row.department}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-900 text-sm">{row.value}</td>
                          <td className={`py-2 sm:py-3 px-2 sm:px-4 font-medium text-sm ${
                            row.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>{row.change}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              row.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                              row.status === 'Good' || row.status === 'On Track' ? 'bg-blue-100 text-blue-800' :
                              row.status === 'Average' || row.status === 'Under Utilized' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Center */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Export Center</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">PDF Report</p>
              <p className="text-xs sm:text-sm text-gray-600">Formatted report</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Excel Export</p>
              <p className="text-xs sm:text-sm text-gray-600">Raw data</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Chart Export</p>
              <p className="text-xs sm:text-sm text-gray-600">PNG/SVG format</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Scheduled Reports</p>
              <p className="text-xs sm:text-sm text-gray-600">Auto-generated</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
