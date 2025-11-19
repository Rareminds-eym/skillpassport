import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  Target,
  BookOpen,
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
  Users,
  Zap,
  Globe,
  Heart,
  UserCheck,
  MessageSquare,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

// TypeScript Interfaces
interface ProgramOutcome {
  id: string;
  code: string;
  title: string;
  description: string;
  targetAttainment: number; // percentage
  actualAttainment: number; // percentage
  directAttainment: number;
  indirectAttainment: number;
  status: "achieved" | "on-track" | "needs-improvement" | "critical";
}

interface CourseOutcome {
  id: string;
  courseCode: string;
  courseName: string;
  coNumber: string;
  description: string;
  bloomLevel: "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";
  attainment: number;
}

interface COPOMapping {
  courseOutcomeId: string;
  programOutcomeId: string;
  correlationLevel: 0 | 1 | 2 | 3; // 0=None, 1=Low, 2=Medium, 3=High
}

interface GapAnalysis {
  poId: string;
  poCode: string;
  target: number;
  actual: number;
  gap: number;
  trend: "improving" | "stable" | "declining";
  actionTaken: string;
}

const OutcomeBasedEducation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"outcomes" | "mapping" | "attainment" | "gaps" | "reports">("outcomes");

  // ===== Mock Data: Program Outcomes (NBA Standard) =====
  const programOutcomes: ProgramOutcome[] = [
    {
      id: "po1",
      code: "PO1",
      title: "Engineering Knowledge",
      description: "Apply knowledge of mathematics, science, engineering fundamentals, and an engineering specialization",
      targetAttainment: 70,
      actualAttainment: 75,
      directAttainment: 78,
      indirectAttainment: 68,
      status: "achieved",
    },
    {
      id: "po2",
      code: "PO2",
      title: "Problem Analysis",
      description: "Identify, formulate, review research literature, and analyze complex engineering problems",
      targetAttainment: 70,
      actualAttainment: 72,
      directAttainment: 75,
      indirectAttainment: 66,
      status: "achieved",
    },
    {
      id: "po3",
      code: "PO3",
      title: "Design/Development of Solutions",
      description: "Design solutions for complex engineering problems and design system components or processes",
      targetAttainment: 70,
      actualAttainment: 68,
      directAttainment: 70,
      indirectAttainment: 64,
      status: "on-track",
    },
    {
      id: "po4",
      code: "PO4",
      title: "Conduct Investigations",
      description: "Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data",
      targetAttainment: 70,
      actualAttainment: 65,
      directAttainment: 67,
      indirectAttainment: 61,
      status: "on-track",
    },
    {
      id: "po5",
      code: "PO5",
      title: "Modern Tool Usage",
      description: "Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools",
      targetAttainment: 70,
      actualAttainment: 80,
      directAttainment: 82,
      indirectAttainment: 76,
      status: "achieved",
    },
    {
      id: "po6",
      code: "PO6",
      title: "Engineer and Society",
      description: "Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues",
      targetAttainment: 70,
      actualAttainment: 62,
      directAttainment: 64,
      indirectAttainment: 58,
      status: "needs-improvement",
    },
    {
      id: "po7",
      code: "PO7",
      title: "Environment and Sustainability",
      description: "Understand the impact of professional engineering solutions in societal and environmental contexts",
      targetAttainment: 70,
      actualAttainment: 58,
      directAttainment: 60,
      indirectAttainment: 54,
      status: "needs-improvement",
    },
    {
      id: "po8",
      code: "PO8",
      title: "Ethics",
      description: "Apply ethical principles and commit to professional ethics and responsibilities and norms of engineering practice",
      targetAttainment: 70,
      actualAttainment: 78,
      directAttainment: 80,
      indirectAttainment: 74,
      status: "achieved",
    },
    {
      id: "po9",
      code: "PO9",
      title: "Individual and Team Work",
      description: "Function effectively as an individual, and as a member or leader in diverse teams",
      targetAttainment: 70,
      actualAttainment: 76,
      directAttainment: 78,
      indirectAttainment: 72,
      status: "achieved",
    },
    {
      id: "po10",
      code: "PO10",
      title: "Communication",
      description: "Communicate effectively on complex engineering activities with the engineering community and with society at large",
      targetAttainment: 70,
      actualAttainment: 70,
      directAttainment: 72,
      indirectAttainment: 66,
      status: "achieved",
    },
    {
      id: "po11",
      code: "PO11",
      title: "Project Management",
      description: "Demonstrate knowledge and understanding of engineering and management principles and apply these to one's own work",
      targetAttainment: 70,
      actualAttainment: 66,
      directAttainment: 68,
      indirectAttainment: 62,
      status: "on-track",
    },
    {
      id: "po12",
      code: "PO12",
      title: "Lifelong Learning",
      description: "Recognize the need for, and have the preparation and ability to engage in independent and life-long learning",
      targetAttainment: 70,
      actualAttainment: 74,
      directAttainment: 76,
      indirectAttainment: 70,
      status: "achieved",
    },
  ];

  // ===== Mock Data: Course Outcomes =====
  const courseOutcomes: CourseOutcome[] = [
    {
      id: "co1",
      courseCode: "CS301",
      courseName: "Data Structures & Algorithms",
      coNumber: "CO1",
      description: "Analyze the performance of algorithms using asymptotic notation",
      bloomLevel: "Analyze",
      attainment: 78,
    },
    {
      id: "co2",
      courseCode: "CS301",
      courseName: "Data Structures & Algorithms",
      coNumber: "CO2",
      description: "Design and implement efficient data structures for given problem",
      bloomLevel: "Create",
      attainment: 75,
    },
    {
      id: "co3",
      courseCode: "CS302",
      courseName: "Database Management Systems",
      coNumber: "CO1",
      description: "Apply normalization techniques to design efficient databases",
      bloomLevel: "Apply",
      attainment: 80,
    },
    {
      id: "co4",
      courseCode: "CS303",
      courseName: "Computer Networks",
      coNumber: "CO1",
      description: "Understand the OSI and TCP/IP protocol stack",
      bloomLevel: "Understand",
      attainment: 72,
    },
  ];

  // ===== Mock Data: CO-PO Mapping Matrix =====
  const copoMapping: COPOMapping[] = [
    // CO1 (DS&A - Analyze algorithms)
    { courseOutcomeId: "co1", programOutcomeId: "po1", correlationLevel: 3 },
    { courseOutcomeId: "co1", programOutcomeId: "po2", correlationLevel: 3 },
    { courseOutcomeId: "co1", programOutcomeId: "po3", correlationLevel: 2 },
    { courseOutcomeId: "co1", programOutcomeId: "po5", correlationLevel: 2 },
    { courseOutcomeId: "co1", programOutcomeId: "po12", correlationLevel: 1 },
    
    // CO2 (DS&A - Design & implement)
    { courseOutcomeId: "co2", programOutcomeId: "po1", correlationLevel: 3 },
    { courseOutcomeId: "co2", programOutcomeId: "po3", correlationLevel: 3 },
    { courseOutcomeId: "co2", programOutcomeId: "po5", correlationLevel: 3 },
    { courseOutcomeId: "co2", programOutcomeId: "po9", correlationLevel: 2 },
    
    // CO3 (DBMS - Normalization)
    { courseOutcomeId: "co3", programOutcomeId: "po1", correlationLevel: 3 },
    { courseOutcomeId: "co3", programOutcomeId: "po2", correlationLevel: 2 },
    { courseOutcomeId: "co3", programOutcomeId: "po3", correlationLevel: 3 },
    { courseOutcomeId: "co3", programOutcomeId: "po5", correlationLevel: 2 },
    
    // CO4 (Networks - Protocol understanding)
    { courseOutcomeId: "co4", programOutcomeId: "po1", correlationLevel: 3 },
    { courseOutcomeId: "co4", programOutcomeId: "po2", correlationLevel: 2 },
    { courseOutcomeId: "co4", programOutcomeId: "po12", correlationLevel: 1 },
  ];

  // ===== Mock Data: Gap Analysis =====
  const gapAnalysis: GapAnalysis[] = [
    {
      poId: "po7",
      poCode: "PO7",
      target: 70,
      actual: 58,
      gap: -12,
      trend: "improving",
      actionTaken: "Introduced sustainability-focused projects and case studies in core courses",
    },
    {
      poId: "po6",
      poCode: "PO6",
      target: 70,
      actual: 62,
      gap: -8,
      trend: "stable",
      actionTaken: "Organized guest lectures on societal impact of technology; included ethics module",
    },
    {
      poId: "po4",
      poCode: "PO4",
      target: 70,
      actual: 65,
      gap: -5,
      trend: "improving",
      actionTaken: "Enhanced lab experiments with research-oriented problem statements",
    },
    {
      poId: "po11",
      poCode: "PO11",
      target: 70,
      actual: 66,
      gap: -4,
      trend: "improving",
      actionTaken: "Integrated project management tools training in capstone projects",
    },
    {
      poId: "po3",
      poCode: "PO3",
      target: 70,
      actual: 68,
      gap: -2,
      trend: "stable",
      actionTaken: "Increased design-oriented assignments and mini-projects",
    },
  ];

  // ===== KPI Data =====
  const kpiData = [
    {
      title: "Overall Attainment",
      value: "69.8%",
      change: 4.2,
      changeLabel: "vs last year",
      icon: <Target className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "POs Achieved",
      value: "7/12",
      change: 0,
      changeLabel: "above 70% target",
      icon: <CheckCircle className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Courses Mapped",
      value: "48",
      change: 0,
      changeLabel: "CO-PO mapping done",
      icon: <BookOpen className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Action Items",
      value: "5",
      change: 0,
      changeLabel: "improvement plans",
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Charts Data =====
  const attainmentOverviewChart = {
    series: [{
      name: "Target",
      data: programOutcomes.map(po => po.targetAttainment),
    }, {
      name: "Actual",
      data: programOutcomes.map(po => po.actualAttainment),
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
      colors: ["#94a3b8", "#3b82f6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: programOutcomes.map(po => po.code),
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
      legend: {
        position: "top",
        horizontalAlign: "right",
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

  const directVsIndirectChart = {
    series: [{
      name: "Direct Attainment",
      data: programOutcomes.map(po => po.directAttainment),
    }, {
      name: "Indirect Attainment",
      data: programOutcomes.map(po => po.indirectAttainment),
    }],
    options: {
      chart: { type: "line", toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#3b82f6", "#8b5cf6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: programOutcomes.map(po => po.code),
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#6b7280" },
          formatter: (val: number) => `${val}%`,
        },
        min: 0,
        max: 100,
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
      },
      grid: { borderColor: "#f1f5f9" },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val: number) => `${val}%`,
        },
      },
      markers: {
        size: 4,
      },
    },
  };

  const gapAnalysisChart = {
    series: [{
      name: "Gap",
      data: gapAnalysis.map(g => g.gap),
    }],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          dataLabels: {
            position: "top",
          },
        },
      },
      colors: ["#ef4444"],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        style: {
          colors: ["#fff"],
        },
      },
      xaxis: {
        categories: gapAnalysis.map(g => g.poCode),
        labels: {
          style: { colors: "#6b7280" },
          formatter: (val: string) => `${val}%`,
        },
      },
      yaxis: {
        labels: { style: { colors: "#6b7280" } },
      },
      grid: { borderColor: "#f1f5f9" },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val: number) => `${val}% gap`,
        },
      },
    },
  };

  // ===== Helper Functions =====
  const getStatusColor = (status: ProgramOutcome["status"]) => {
    switch (status) {
      case "achieved":
        return "bg-green-100 text-green-700 border-green-200";
      case "on-track":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "needs-improvement":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getStatusLabel = (status: ProgramOutcome["status"]) => {
    switch (status) {
      case "achieved":
        return "Achieved";
      case "on-track":
        return "On Track";
      case "needs-improvement":
        return "Needs Improvement";
      case "critical":
        return "Critical";
    }
  };

  const getStatusIcon = (status: ProgramOutcome["status"]) => {
    switch (status) {
      case "achieved":
        return <CheckCircle className="h-4 w-4" />;
      case "on-track":
        return <Activity className="h-4 w-4" />;
      case "needs-improvement":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getCorrelationColor = (level: number) => {
    switch (level) {
      case 3:
        return "bg-green-600 text-white";
      case 2:
        return "bg-blue-500 text-white";
      case 1:
        return "bg-yellow-500 text-white";
      case 0:
        return "bg-gray-200 text-gray-400";
    }
  };

  const getCorrelationLabel = (level: number) => {
    switch (level) {
      case 3:
        return "High";
      case 2:
        return "Medium";
      case 1:
        return "Low";
      case 0:
        return "-";
    }
  };

  const getBloomLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Remember: "bg-gray-100 text-gray-700",
      Understand: "bg-blue-100 text-blue-700",
      Apply: "bg-cyan-100 text-cyan-700",
      Analyze: "bg-purple-100 text-purple-700",
      Evaluate: "bg-orange-100 text-orange-700",
      Create: "bg-green-100 text-green-700",
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  const getMapping = (coId: string, poId: string): number => {
    const mapping = copoMapping.find(
      m => m.courseOutcomeId === coId && m.programOutcomeId === poId
    );
    return mapping ? mapping.correlationLevel : 0;
  };

  const getPOIcon = (code: string) => {
    const icons: Record<string, React.ReactNode> = {
      PO1: <Zap className="h-5 w-5" />,
      PO2: <Target className="h-5 w-5" />,
      PO3: <Award className="h-5 w-5" />,
      PO4: <Activity className="h-5 w-5" />,
      PO5: <BarChart3 className="h-5 w-5" />,
      PO6: <Globe className="h-5 w-5" />,
      PO7: <Heart className="h-5 w-5" />,
      PO8: <UserCheck className="h-5 w-5" />,
      PO9: <Users className="h-5 w-5" />,
      PO10: <MessageSquare className="h-5 w-5" />,
      PO11: <Briefcase className="h-5 w-5" />,
      PO12: <GraduationCap className="h-5 w-5" />,
    };
    return icons[code] || <Target className="h-5 w-5" />;
  };

  // ===== Render =====
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Outcome-Based Education (OBE) Tracking
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Track Program Outcomes, Course Outcomes, and CO-PO mapping for accreditation readiness
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
            <Download className="h-5 w-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "outcomes", label: "Program Outcomes", icon: Target },
            { key: "mapping", label: "CO-PO Mapping", icon: BarChart3 },
            { key: "attainment", label: "Attainment Analysis", icon: TrendingUp },
            { key: "gaps", label: "Gap Analysis", icon: AlertTriangle },
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
      {activeTab === "outcomes" && (
        <div className="space-y-6">
          {/* Program Outcomes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {programOutcomes.map((po) => (
              <div
                key={po.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                      {getPOIcon(po.code)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{po.code}: {po.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{po.description}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Attainment Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Overall Attainment</span>
                      <span className="text-lg font-bold text-gray-900">{po.actualAttainment}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          po.actualAttainment >= po.targetAttainment
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : po.actualAttainment >= po.targetAttainment * 0.9
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : po.actualAttainment >= po.targetAttainment * 0.7
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                        style={{ width: `${po.actualAttainment}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">Target: {po.targetAttainment}%</span>
                      <span className={`text-xs font-medium ${
                        po.actualAttainment >= po.targetAttainment ? "text-green-600" : "text-red-600"
                      }`}>
                        {po.actualAttainment >= po.targetAttainment ? "+" : ""}
                        {(po.actualAttainment - po.targetAttainment).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Direct vs Indirect */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Direct</p>
                      <p className="text-lg font-bold text-blue-600">{po.directAttainment}%</p>
                      <p className="text-xs text-gray-500">Assessments</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Indirect</p>
                      <p className="text-lg font-bold text-purple-600">{po.indirectAttainment}%</p>
                      <p className="text-xs text-gray-500">Surveys</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(po.status)}`}>
                      {getStatusIcon(po.status)}
                      {getStatusLabel(po.status)}
                    </span>
                    <span className="text-xs text-gray-500">AY 2024-25</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "mapping" && (
        <div className="space-y-6">
          {/* CO-PO Mapping Matrix */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Course Outcome - Program Outcome Mapping Matrix</h2>
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="h-4 w-4" />
                Add Course
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-purple-50">
                      Course Outcome
                    </th>
                    {programOutcomes.map((po) => (
                      <th
                        key={po.id}
                        className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 min-w-[60px]"
                        title={po.title}
                      >
                        {po.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courseOutcomes.map((co) => (
                    <tr key={co.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 sticky left-0 bg-white">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {co.courseCode} - {co.coNumber}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{co.description}</p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${getBloomLevelColor(co.bloomLevel)}`}>
                            {co.bloomLevel}
                          </span>
                        </div>
                      </td>
                      {programOutcomes.map((po) => {
                        const level = getMapping(co.id, po.id);
                        return (
                          <td
                            key={`${co.id}-${po.id}`}
                            className="border border-gray-300 p-2 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                            title={`Correlation: ${getCorrelationLabel(level)}`}
                          >
                            <div
                              className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold text-sm ${getCorrelationColor(level)}`}
                            >
                              {level > 0 ? level : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-600" />
                <span className="text-sm text-gray-600">High (3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-500" />
                <span className="text-sm text-gray-600">Medium (2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-yellow-500" />
                <span className="text-sm text-gray-600">Low (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-200" />
                <span className="text-sm text-gray-600">None (0)</span>
              </div>
            </div>
          </div>

          {/* Course Outcomes Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Outcomes Summary</h3>
            <div className="space-y-3">
              {courseOutcomes.map((co) => (
                <div key={co.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{co.courseCode} - {co.coNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBloomLevelColor(co.bloomLevel)}`}>
                        {co.bloomLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{co.description}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Attainment</p>
                      <p className="text-lg font-bold text-gray-900">{co.attainment}%</p>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                        style={{ width: `${co.attainment}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "attainment" && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Target vs Actual Attainment
              </h2>
              <ReactApexChart
                options={attainmentOverviewChart.options}
                series={attainmentOverviewChart.series}
                type="bar"
                height={350}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Direct vs Indirect Attainment
              </h2>
              <ReactApexChart
                options={directVsIndirectChart.options}
                series={directVsIndirectChart.series}
                type="line"
                height={350}
              />
            </div>
          </div>

          {/* Attainment Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Detailed Attainment Analysis
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">PO Code</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Program Outcome</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Target</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Direct</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Indirect</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Overall</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {programOutcomes.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-bold text-gray-900">{po.code}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{po.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{po.description}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-600">{po.targetAttainment}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-blue-600">{po.directAttainment}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-purple-600">{po.indirectAttainment}%</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">{po.actualAttainment}%</span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                po.actualAttainment >= 70
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : po.actualAttainment >= 60
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              }`}
                              style={{ width: `${po.actualAttainment}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(po.status)}`}>
                            {getStatusIcon(po.status)}
                            {getStatusLabel(po.status)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attainment Formula */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Attainment Calculation Formula</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm font-mono text-gray-700">
                  Overall Attainment = (0.7 × Direct Attainment) + (0.3 × Indirect Attainment)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Direct Attainment (70%)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Course assessments (exams, quizzes)</li>
                    <li>• Assignments and projects</li>
                    <li>• Lab experiments</li>
                    <li>• Presentations</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Indirect Attainment (30%)</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Student feedback surveys</li>
                    <li>• Alumni feedback</li>
                    <li>• Employer feedback</li>
                    <li>• Exit surveys</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "gaps" && (
        <div className="space-y-6">
          {/* Gap Analysis Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Attainment Gap Analysis
            </h2>
            <ReactApexChart
              options={gapAnalysisChart.options}
              series={gapAnalysisChart.series}
              type="bar"
              height={300}
            />
          </div>

          {/* Gap Details Cards */}
          <div className="space-y-4">
            {gapAnalysis.map((gap) => {
              const po = programOutcomes.find(p => p.id === gap.poId);
              return (
                <div
                  key={gap.poId}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{gap.poCode}: {po?.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{po?.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gap.trend === "improving"
                        ? "bg-green-100 text-green-700"
                        : gap.trend === "stable"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {gap.trend === "improving" && "↗"}
                      {gap.trend === "stable" && "→"}
                      {gap.trend === "declining" && "↘"}
                      {" "}
                      {gap.trend.charAt(0).toUpperCase() + gap.trend.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Target Attainment</p>
                      <p className="text-2xl font-bold text-gray-900">{gap.target}%</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Actual Attainment</p>
                      <p className="text-2xl font-bold text-blue-600">{gap.actual}%</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Gap</p>
                      <p className="text-2xl font-bold text-red-600">{gap.gap}%</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Action Taken</p>
                        <p className="text-sm text-gray-700">{gap.actionTaken}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Continuous Improvement Recommendations */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Continuous Improvement Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Curriculum Enhancement</p>
                  <p className="text-sm text-gray-600">Integrate sustainability and social impact modules in core courses</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Users className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Faculty Development</p>
                  <p className="text-sm text-gray-600">Conduct workshops on outcome-based teaching methodologies</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <Activity className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Assessment Methods</p>
                  <p className="text-sm text-gray-600">Implement more project-based assessments and real-world problem solving</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <Target className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Industry Collaboration</p>
                  <p className="text-sm text-gray-600">Increase guest lectures and industry visits for practical exposure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Accreditation Ready Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "PO Attainment Summary",
                description: "Comprehensive Program Outcome attainment report",
                icon: Target,
                color: "blue",
                format: "PDF",
              },
              {
                title: "CO-PO Mapping Matrix",
                description: "Complete Course-Program outcome mapping",
                icon: BarChart3,
                color: "purple",
                format: "Excel",
              },
              {
                title: "Attainment Analysis",
                description: "Direct and indirect attainment breakdown",
                icon: TrendingUp,
                color: "green",
                format: "PDF",
              },
              {
                title: "Gap Analysis Report",
                description: "Detailed gap analysis with action plans",
                icon: AlertTriangle,
                color: "yellow",
                format: "PDF",
              },
              {
                title: "Course-wise Performance",
                description: "Individual course outcome attainment",
                icon: BookOpen,
                color: "indigo",
                format: "Excel",
              },
              {
                title: "NBA Submission Package",
                description: "Complete NBA accreditation package",
                icon: FileText,
                color: "pink",
                format: "ZIP",
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
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Generation Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Report Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                  <option>2022-2023</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>Computer Science & Engineering</option>
                  <option>Electronics & Communication</option>
                  <option>Mechanical Engineering</option>
                  <option>All Departments</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program
                </label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none">
                  <option>B.Tech - CSE</option>
                  <option>B.Tech - ECE</option>
                  <option>B.Tech - ME</option>
                  <option>M.Tech - CSE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">Action plans</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm text-gray-700">Charts and graphs</span>
                  </label>
                </div>
              </div>
            </div>
            <button className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
              <Download className="h-5 w-5" />
              Generate Custom Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutcomeBasedEducation;

