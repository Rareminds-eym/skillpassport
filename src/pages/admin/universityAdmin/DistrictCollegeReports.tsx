import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  Building2,
  GraduationCap,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  Edit2,
  Plus,
  BarChart3,
  Activity,
  MapPin,
  School,
  UserCheck,
  Calendar,
  Filter,
  Search,
  Eye,
  Settings,
  X,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

// TypeScript Interfaces
interface District {
  id: string;
  name: string;
  code: string;
  totalColleges: number;
  totalStudents: number;
  totalFaculty: number;
  performanceScore: number;
  status: "excellent" | "good" | "average" | "needs-improvement";
}

interface College {
  id: string;
  name: string;
  code: string;
  district: string;
  type: "Government" | "Private" | "Aided";
  totalStudents: number;
  totalFaculty: number;
  departments: number;
  accreditation: "A++" | "A+" | "A" | "B++" | "B+" | "B" | "Not Accredited";
  performanceScore: number;
  placementRate: number;
}

interface ReportModal {
  isOpen: boolean;
  type: "district" | "college" | "comparative" | "performance" | null;
  data?: any;
}

const DistrictCollegeReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "districts" | "colleges" | "analytics" | "reports">("overview");
  const [reportModal, setReportModal] = useState<ReportModal>({ isOpen: false, type: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ===== Mock Data: Districts =====
  const districts: District[] = [
    {
      id: "d1",
      name: "Chennai District",
      code: "CHN",
      totalColleges: 45,
      totalStudents: 125000,
      totalFaculty: 8500,
      performanceScore: 85,
      status: "excellent",
    },
    {
      id: "d2",
      name: "Coimbatore District",
      code: "CBE",
      totalColleges: 38,
      totalStudents: 98000,
      totalFaculty: 6800,
      performanceScore: 82,
      status: "excellent",
    },
    {
      id: "d3",
      name: "Madurai District",
      code: "MDU",
      totalColleges: 32,
      totalStudents: 78000,
      totalFaculty: 5200,
      performanceScore: 78,
      status: "good",
    },
    {
      id: "d4",
      name: "Salem District",
      code: "SLM",
      totalColleges: 28,
      totalStudents: 65000,
      totalFaculty: 4500,
      performanceScore: 75,
      status: "good",
    },
    {
      id: "d5",
      name: "Tirunelveli District",
      code: "TVL",
      totalColleges: 22,
      totalStudents: 52000,
      totalFaculty: 3800,
      performanceScore: 68,
      status: "average",
    },
    {
      id: "d6",
      name: "Vellore District",
      code: "VLR",
      totalColleges: 18,
      totalStudents: 42000,
      totalFaculty: 3200,
      performanceScore: 62,
      status: "needs-improvement",
    },
  ];

  // ===== Mock Data: Colleges =====
  const colleges: College[] = [
    {
      id: "c1",
      name: "Anna University",
      code: "AU001",
      district: "Chennai District",
      type: "Government",
      totalStudents: 15000,
      totalFaculty: 850,
      departments: 18,
      accreditation: "A++",
      performanceScore: 92,
      placementRate: 85,
    },
    {
      id: "c2",
      name: "PSG College of Technology",
      code: "PSG001",
      district: "Coimbatore District",
      type: "Private",
      totalStudents: 8500,
      totalFaculty: 520,
      departments: 12,
      accreditation: "A+",
      performanceScore: 88,
      placementRate: 82,
    },
    {
      id: "c3",
      name: "Thiagarajar College of Engineering",
      code: "TCE001",
      district: "Madurai District",
      type: "Private",
      totalStudents: 6200,
      totalFaculty: 380,
      departments: 10,
      accreditation: "A+",
      performanceScore: 85,
      placementRate: 78,
    },
    {
      id: "c4",
      name: "Government College of Engineering Salem",
      code: "GCE001",
      district: "Salem District",
      type: "Government",
      totalStudents: 4800,
      totalFaculty: 290,
      departments: 8,
      accreditation: "A",
      performanceScore: 80,
      placementRate: 72,
    },
    {
      id: "c5",
      name: "Francis Xavier Engineering College",
      code: "FXE001",
      district: "Tirunelveli District",
      type: "Private",
      totalStudents: 3500,
      totalFaculty: 220,
      departments: 6,
      accreditation: "B++",
      performanceScore: 75,
      placementRate: 68,
    },
    {
      id: "c6",
      name: "VIT University",
      code: "VIT001",
      district: "Vellore District",
      type: "Private",
      totalStudents: 12000,
      totalFaculty: 680,
      departments: 15,
      accreditation: "A++",
      performanceScore: 90,
      placementRate: 88,
    },
  ];

  // ===== KPI Data =====
  const kpiData = [
    {
      title: "Total Districts",
      value: "6",
      change: 0,
      changeLabel: "active districts",
      icon: <MapPin className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Colleges",
      value: "183",
      change: 5.2,
      changeLabel: "vs last year",
      icon: <School className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Total Students",
      value: "460K",
      change: 8.1,
      changeLabel: "enrollment growth",
      icon: <Users className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Avg Performance",
      value: "75.2%",
      change: 3.4,
      changeLabel: "improvement",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Charts Data =====
  const districtPerformanceChart = {
    series: [{
      name: "Performance Score",
      data: districts.map(d => d.performanceScore),
    }],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: districts.map(d => d.code),
        labels: { style: { colors: "#6b7280", fontSize: "11px" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#6b7280" },
          formatter: (val: number) => `${val}%`,
        },
        min: 0,
        max: 100,
      },
      grid: { borderColor: "#f1f5f9" },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val: number) => `${val}%`,
        },
      },
    },
  };

  const collegeTypeDistribution = {
    series: [
      colleges.filter(c => c.type === "Government").length,
      colleges.filter(c => c.type === "Private").length,
      colleges.filter(c => c.type === "Aided").length,
    ],
    options: {
      chart: { type: "donut" },
      labels: ["Government", "Private", "Aided"],
      colors: ["#3b82f6", "#8b5cf6", "#10b981"],
      legend: {
        position: "bottom",
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} colleges`,
        },
      },
    },
  };

  // ===== Helper Functions =====
  const getStatusColor = (status: District["status"]) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-700 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "average":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "needs-improvement":
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getAccreditationColor = (accreditation: string) => {
    if (accreditation.includes("A")) return "bg-green-100 text-green-700";
    if (accreditation.includes("B")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const openReportModal = (type: ReportModal["type"], data?: any) => {
    setReportModal({ isOpen: true, type, data });
  };

  const closeReportModal = () => {
    setReportModal({ isOpen: false, type: null, data: null });
  };

  const filteredColleges = colleges.filter(college => {
    const matchesSearch = college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         college.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         college.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || college.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // ===== Modal Component =====
  const ReportModalComponent = () => {
    if (!reportModal.isOpen) return null;

    const modalContent = () => {
      switch (reportModal.type) {
        case "district":
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate District Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select District</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <option value="">All Districts</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <option>Current Academic Year</option>
                    <option>Last 6 Months</option>
                    <option>Last Year</option>
                    <option>Custom Range</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Include Sections</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Performance Metrics", "College Statistics", "Student Enrollment", "Faculty Details", "Infrastructure", "Placement Data"].map(section => (
                    <label key={section} className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2 rounded" />
                      <span className="text-sm text-gray-700">{section}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );

        case "college":
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate College Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select College</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <option value="">All Colleges</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <option>Comprehensive Report</option>
                    <option>Performance Summary</option>
                    <option>Accreditation Status</option>
                    <option>Department-wise Analysis</option>
                  </select>
                </div>
              </div>
            </div>
          );

        case "comparative":
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate Comparative Analysis</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comparison Type</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <option>District vs District</option>
                    <option>College vs College</option>
                    <option>Year over Year</option>
                    <option>Performance Benchmarking</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Entity</label>
                    <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                      <option>Select...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Compare With</label>
                    <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                      <option>Select...</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );

        case "performance":
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Analytics Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Scope</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                    <option>University-wide</option>
                    <option>District-wise</option>
                    <option>College-wise</option>
                    <option>Department-wise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Performance Metrics</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Academic Performance", "Placement Rates", "Research Output", "Infrastructure Quality", "Faculty Ratio", "Student Satisfaction"].map(metric => (
                      <label key={metric} className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2 rounded" />
                        <span className="text-sm text-gray-700">{metric}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Report Generator</h2>
              </div>
              <button
                onClick={closeReportModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalContent()}

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={closeReportModal}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2">
                <Download className="h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== Render =====
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              District & College Reports
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Comprehensive analytics and reporting for districts and colleges across the university system
            </p>
          </div>
          <button 
            onClick={() => openReportModal("performance")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Download className="h-5 w-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "districts", label: "Districts", icon: MapPin },
            { key: "colleges", label: "Colleges", icon: School },
            { key: "analytics", label: "Analytics", icon: TrendingUp },
            { key: "reports", label: "Reports", icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                District Performance Overview
              </h2>
              <ReactApexChart
                options={districtPerformanceChart.options}
                series={districtPerformanceChart.series}
                type="bar"
                height={350}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                College Type Distribution
              </h2>
              <ReactApexChart
                options={collegeTypeDistribution.options}
                series={collegeTypeDistribution.series}
                type="donut"
                height={350}
              />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Top Performing District</p>
                  <p className="text-xl font-bold text-gray-900">Chennai</p>
                  <p className="text-sm text-green-600">85% Score</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">A++ Accredited</p>
                  <p className="text-xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-green-600">Colleges</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Placement Rate</p>
                  <p className="text-xl font-bold text-gray-900">78.5%</p>
                  <p className="text-sm text-green-600">+5.2% YoY</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <UserCheck className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Faculty-Student Ratio</p>
                  <p className="text-xl font-bold text-gray-900">1:18</p>
                  <p className="text-sm text-blue-600">Optimal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "districts" && (
        <div className="space-y-6">
          {/* Districts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {districts.map((district) => (
              <div
                key={district.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{district.name}</h3>
                      <p className="text-sm text-gray-600">Code: {district.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openReportModal("district", district)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openReportModal("district", district)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Performance Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Performance Score</span>
                      <span className="text-lg font-bold text-gray-900">{district.performanceScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          district.performanceScore >= 80
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : district.performanceScore >= 70
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : district.performanceScore >= 60
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                        style={{ width: `${district.performanceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Colleges</p>
                      <p className="text-lg font-bold text-blue-600">{district.totalColleges}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Students</p>
                      <p className="text-lg font-bold text-purple-600">{(district.totalStudents / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Faculty</p>
                      <p className="text-lg font-bold text-green-600">{(district.totalFaculty / 1000).toFixed(1)}K</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(district.status)}`}>
                      {district.status.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500">AY 2024-25</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "colleges" && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search colleges by name, code, or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                  <option value="Aided">Aided</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colleges Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Colleges ({filteredColleges.length})
                </h2>
                <button 
                  onClick={() => openReportModal("college")}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Generate Report
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">College</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">District</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Type</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Students</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Faculty</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Accreditation</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Performance</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColleges.map((college) => (
                    <tr
                      key={college.id}
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">{college.name}</p>
                          <p className="text-sm text-gray-500">{college.code}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-700">{college.district}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          college.type === "Government" ? "bg-blue-100 text-blue-700" :
                          college.type === "Private" ? "bg-purple-100 text-purple-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {college.type}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{college.totalStudents.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{college.totalFaculty}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccreditationColor(college.accreditation)}`}>
                          {college.accreditation}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">{college.performanceScore}%</span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                college.performanceScore >= 85
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : college.performanceScore >= 75
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              }`}
                              style={{ width: `${college.performanceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openReportModal("college", college)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openReportModal("college", college)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Generate Report"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openReportModal("college", college)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Performance Trends",
                description: "Track performance metrics over time",
                icon: TrendingUp,
                color: "blue",
                action: () => openReportModal("performance"),
              },
              {
                title: "Comparative Analysis",
                description: "Compare districts and colleges",
                icon: BarChart3,
                color: "purple",
                action: () => openReportModal("comparative"),
              },
              {
                title: "Enrollment Analytics",
                description: "Student enrollment patterns and trends",
                icon: Users,
                color: "green",
                action: () => openReportModal("performance"),
              },
              {
                title: "Faculty Analytics",
                description: "Faculty distribution and ratios",
                icon: UserCheck,
                color: "yellow",
                action: () => openReportModal("performance"),
              },
              {
                title: "Infrastructure Assessment",
                description: "Infrastructure quality metrics",
                icon: Building2,
                color: "indigo",
                action: () => openReportModal("performance"),
              },
              {
                title: "Accreditation Status",
                description: "Accreditation tracking and renewal",
                icon: Award,
                color: "pink",
                action: () => openReportModal("performance"),
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const colorClasses = {
                blue: "from-blue-600 to-blue-700",
                purple: "from-purple-600 to-purple-700",
                green: "from-green-600 to-green-700",
                yellow: "from-yellow-600 to-yellow-700",
                indigo: "from-indigo-600 to-indigo-700",
                pink: "from-pink-600 to-pink-700",
              };
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer"
                  onClick={item.action}
                >
                  <div className={`p-4 bg-gradient-to-br ${colorClasses[item.color as keyof typeof colorClasses]} rounded-xl mb-4 inline-block`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium w-full justify-center">
                    <Activity className="h-4 w-4" />
                    Analyze
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "District Summary Reports",
                description: "Comprehensive district-wise performance reports",
                icon: MapPin,
                color: "blue",
                format: "PDF",
                action: () => openReportModal("district"),
              },
              {
                title: "College Performance Reports",
                description: "Individual college performance analysis",
                icon: School,
                color: "purple",
                format: "PDF",
                action: () => openReportModal("college"),
              },
              {
                title: "Comparative Analysis",
                description: "Side-by-side comparison reports",
                icon: BarChart3,
                color: "green",
                format: "Excel",
                action: () => openReportModal("comparative"),
              },
              {
                title: "Enrollment Reports",
                description: "Student enrollment and demographic data",
                icon: Users,
                color: "yellow",
                format: "Excel",
                action: () => openReportModal("performance"),
              },
              {
                title: "Faculty Reports",
                description: "Faculty statistics and distribution",
                icon: UserCheck,
                color: "indigo",
                format: "PDF",
                action: () => openReportModal("performance"),
              },
              {
                title: "Accreditation Package",
                description: "Complete accreditation documentation",
                icon: Award,
                color: "pink",
                format: "ZIP",
                action: () => openReportModal("performance"),
              },
            ].map((report, index) => {
              const Icon = report.icon;
              const colorClasses = {
                blue: "from-blue-600 to-blue-700",
                purple: "from-purple-600 to-purple-700",
                green: "from-green-600 to-green-700",
                yellow: "from-yellow-600 to-yellow-700",
                indigo: "from-indigo-600 to-indigo-700",
                pink: "from-pink-600 to-pink-700",
              };
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer"
                >
                  <div className={`p-4 bg-gradient-to-br ${colorClasses[report.color as keyof typeof colorClasses]} rounded-xl mb-4 inline-block`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{report.format}</span>
                    <button 
                      onClick={report.action}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      Generate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => openReportModal("district")}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
              >
                <MapPin className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">District Report</p>
                  <p className="text-sm text-gray-600">Generate now</p>
                </div>
              </button>
              <button 
                onClick={() => openReportModal("college")}
                className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors"
              >
                <School className="h-6 w-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">College Report</p>
                  <p className="text-sm text-gray-600">Generate now</p>
                </div>
              </button>
              <button 
                onClick={() => openReportModal("comparative")}
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Compare</p>
                  <p className="text-sm text-gray-600">Side by side</p>
                </div>
              </button>
              <button 
                onClick={() => openReportModal("performance")}
                className="flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl border border-yellow-200 transition-colors"
              >
                <TrendingUp className="h-6 w-6 text-yellow-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">Deep dive</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModalComponent />
    </div>
  );
};

export default DistrictCollegeReports;