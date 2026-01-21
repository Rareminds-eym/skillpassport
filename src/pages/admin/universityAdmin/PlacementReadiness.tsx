import React, { useState, useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
  Briefcase,
  Building2,
  TrendingUp,
  Award,
  Users,
  Calendar,
  MapPin,
  Search,
  Filter,
  Download,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  BookOpen,
  GraduationCap,
  BarChart3,
  Eye,
  Edit2,
  FileText,
  DollarSign,
  Star,
  TrendingDown,
  Activity,
} from 'lucide-react';
import KPICard from '../../../components/admin/KPICard';

// TypeScript Interfaces
interface Internship {
  id: string;
  studentName: string;
  rollNumber: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  duration: number; // in months
  stipend: number;
  status: 'ongoing' | 'completed' | 'pending' | 'cancelled';
  domain: string;
  mentorRating?: number;
  convertedToFullTime?: boolean;
}

interface IndustryVisit {
  id: string;
  company: string;
  location: string;
  date: string;
  department: string;
  studentsParticipated: number;
  totalStudents: number;
  objectives: string[];
  learnings: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
  coordinator: string;
}

interface ReadinessMetrics {
  studentId: string;
  studentName: string;
  rollNumber: string;
  technicalSkills: number; // 0-100
  softSkills: number; // 0-100
  projects: number; // 0-100
  internships: number; // 0-100
  certifications: number; // 0-100
  attendance: number; // 0-100
  overallReadiness: number; // 0-100
  readinessLevel: 'placement-ready' | 'developing' | 'needs-support' | 'at-risk';
}

const PlacementReadiness: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'internships' | 'visits' | 'readiness'>(
    'overview'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [internshipFilter, setInternshipFilter] = useState<string>('all');
  const [visitFilter, setVisitFilter] = useState<string>('all');

  // ===== Mock Data: Internships =====
  const internships: Internship[] = [
    {
      id: '1',
      studentName: 'Arjun Mehta',
      rollNumber: 'CS2021015',
      company: 'Google',
      role: 'Software Engineering Intern',
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      duration: 3,
      stipend: 80000,
      status: 'ongoing',
      domain: 'Cloud Computing',
      mentorRating: 4.5,
    },
    {
      id: '2',
      studentName: 'Sneha Reddy',
      rollNumber: 'CS2021032',
      company: 'Microsoft',
      role: 'Azure Cloud Intern',
      startDate: '2025-05-15',
      endDate: '2025-08-15',
      duration: 3,
      stipend: 75000,
      status: 'ongoing',
      domain: 'Cloud Infrastructure',
      mentorRating: 4.8,
      convertedToFullTime: true,
    },
    {
      id: '3',
      studentName: 'Karthik Sharma',
      rollNumber: 'CS2021048',
      company: 'Amazon',
      role: 'ML Engineering Intern',
      startDate: '2025-01-10',
      endDate: '2025-04-10',
      duration: 3,
      stipend: 70000,
      status: 'completed',
      domain: 'Machine Learning',
      mentorRating: 4.2,
    },
    {
      id: '4',
      studentName: 'Priya Iyer',
      rollNumber: 'CS2021067',
      company: 'Tata Consultancy Services',
      role: 'Full Stack Developer Intern',
      startDate: '2025-07-01',
      endDate: '2025-09-30',
      duration: 3,
      stipend: 25000,
      status: 'pending',
      domain: 'Web Development',
    },
    {
      id: '5',
      studentName: 'Rohan Patel',
      rollNumber: 'CS2021089',
      company: 'Infosys',
      role: 'Data Analytics Intern',
      startDate: '2024-12-01',
      endDate: '2025-02-28',
      duration: 3,
      stipend: 20000,
      status: 'completed',
      domain: 'Data Science',
      mentorRating: 4.0,
    },
  ];

  // ===== Mock Data: Industry Visits =====
  const industryVisits: IndustryVisit[] = [
    {
      id: '1',
      company: 'Tesla Gigafactory',
      location: 'Bangalore, Karnataka',
      date: '2025-12-10',
      department: 'Computer Science & Engineering',
      studentsParticipated: 45,
      totalStudents: 50,
      objectives: [
        'Understand EV manufacturing process',
        'Learn about automation and robotics',
        'Explore IoT applications in manufacturing',
      ],
      learnings: [],
      status: 'upcoming',
      coordinator: 'Dr. Ramesh Kumar',
    },
    {
      id: '2',
      company: 'Wipro Innovation Lab',
      location: 'Hyderabad, Telangana',
      date: '2025-10-22',
      department: 'Computer Science & Engineering',
      studentsParticipated: 38,
      totalStudents: 40,
      objectives: [
        'Explore AI/ML research projects',
        'Industry interaction with engineers',
        'Understand project lifecycle',
      ],
      learnings: [
        'Hands-on experience with GenAI tools',
        'Understanding of agile methodologies',
        'Career guidance from industry experts',
      ],
      status: 'completed',
      coordinator: 'Prof. Anita Desai',
    },
    {
      id: '3',
      company: 'Amazon Web Services Center',
      location: 'Mumbai, Maharashtra',
      date: '2025-09-15',
      department: 'Computer Science & Engineering',
      studentsParticipated: 52,
      totalStudents: 55,
      objectives: [
        'Learn cloud infrastructure management',
        'Understanding of AWS services',
        'Networking with cloud engineers',
      ],
      learnings: [
        'Deep dive into AWS architecture',
        'Serverless computing concepts',
        'Career opportunities in cloud domain',
      ],
      status: 'completed',
      coordinator: 'Dr. Suresh Babu',
    },
    {
      id: '4',
      company: 'ISRO Satellite Centre',
      location: 'Bangalore, Karnataka',
      date: '2026-01-20',
      department: 'Electronics & Communication',
      studentsParticipated: 0,
      totalStudents: 30,
      objectives: [
        'Understand satellite technology',
        'Learn about space research programs',
        'Explore career opportunities in ISRO',
      ],
      learnings: [],
      status: 'upcoming',
      coordinator: 'Dr. Lakshmi Narayan',
    },
  ];

  // ===== Mock Data: Readiness Metrics =====
  const readinessMetrics: ReadinessMetrics[] = [
    {
      studentId: '1',
      studentName: 'Sneha Reddy',
      rollNumber: 'CS2021032',
      technicalSkills: 92,
      softSkills: 88,
      projects: 90,
      internships: 95,
      certifications: 85,
      attendance: 94,
      overallReadiness: 91,
      readinessLevel: 'placement-ready',
    },
    {
      studentId: '2',
      studentName: 'Arjun Mehta',
      rollNumber: 'CS2021015',
      technicalSkills: 88,
      softSkills: 82,
      projects: 85,
      internships: 90,
      certifications: 80,
      attendance: 92,
      overallReadiness: 86,
      readinessLevel: 'placement-ready',
    },
    {
      studentId: '3',
      studentName: 'Karthik Sharma',
      rollNumber: 'CS2021048',
      technicalSkills: 78,
      softSkills: 75,
      projects: 80,
      internships: 85,
      certifications: 70,
      attendance: 88,
      overallReadiness: 79,
      readinessLevel: 'developing',
    },
    {
      studentId: '4',
      studentName: 'Priya Iyer',
      rollNumber: 'CS2021067',
      technicalSkills: 65,
      softSkills: 70,
      projects: 68,
      internships: 50,
      certifications: 60,
      attendance: 85,
      overallReadiness: 66,
      readinessLevel: 'developing',
    },
    {
      studentId: '5',
      studentName: 'Rohan Patel',
      rollNumber: 'CS2021089',
      technicalSkills: 52,
      softSkills: 58,
      projects: 55,
      internships: 60,
      certifications: 45,
      attendance: 72,
      overallReadiness: 57,
      readinessLevel: 'needs-support',
    },
  ];

  // ===== Computed Metrics =====
  const metrics = useMemo(() => {
    const totalInternships = internships.length;
    const ongoingInternships = internships.filter((i) => i.status === 'ongoing').length;
    const completedInternships = internships.filter((i) => i.status === 'completed').length;
    const conversionRate =
      (internships.filter((i) => i.convertedToFullTime).length / completedInternships) * 100;

    const avgStipend = internships.reduce((sum, i) => sum + i.stipend, 0) / totalInternships;

    const totalVisits = industryVisits.length;
    const completedVisits = industryVisits.filter((v) => v.status === 'completed').length;
    const upcomingVisits = industryVisits.filter((v) => v.status === 'upcoming').length;

    const avgReadiness =
      readinessMetrics.reduce((sum, r) => sum + r.overallReadiness, 0) / readinessMetrics.length;
    const placementReady = readinessMetrics.filter(
      (r) => r.readinessLevel === 'placement-ready'
    ).length;

    return {
      totalInternships,
      ongoingInternships,
      completedInternships,
      conversionRate: conversionRate || 0,
      avgStipend,
      totalVisits,
      completedVisits,
      upcomingVisits,
      avgReadiness,
      placementReady,
    };
  }, [internships, industryVisits, readinessMetrics]);

  // ===== KPI Data =====
  const kpiData = [
    {
      title: 'Active Internships',
      value: metrics.ongoingInternships.toString(),
      change: 15.3,
      changeLabel: 'vs last quarter',
      icon: <Briefcase className="h-6 w-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Industry Visits',
      value: metrics.totalVisits.toString(),
      change: 0,
      changeLabel: `${metrics.upcomingVisits} upcoming`,
      icon: <Building2 className="h-6 w-6" />,
      color: 'purple' as const,
    },
    {
      title: 'Avg Readiness Score',
      value: `${metrics.avgReadiness.toFixed(1)}%`,
      change: 8.5,
      changeLabel: 'improved this semester',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'green' as const,
    },
    {
      title: 'Placement Ready',
      value: metrics.placementReady.toString(),
      change: 12.1,
      changeLabel: 'students ready',
      icon: <Award className="h-6 w-6" />,
      color: 'yellow' as const,
    },
  ];

  // ===== Charts Data =====
  const internshipDistributionChart = {
    series: [
      internships.filter((i) => i.status === 'completed').length,
      internships.filter((i) => i.status === 'ongoing').length,
      internships.filter((i) => i.status === 'pending').length,
    ],
    options: {
      chart: { type: 'donut' },
      labels: ['Completed', 'Ongoing', 'Pending'],
      colors: ['#10b981', '#3b82f6', '#f59e0b'],
      dataLabels: { enabled: true },
      legend: { position: 'bottom' },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => internships.length.toString(),
              },
            },
          },
        },
      },
    },
  };

  const companyWiseInternshipsChart = {
    series: [
      {
        name: 'Internships',
        data: [
          internships.filter((i) => i.company === 'Google').length,
          internships.filter((i) => i.company === 'Microsoft').length,
          internships.filter((i) => i.company === 'Amazon').length,
          internships.filter((i) => i.company.includes('Tata') || i.company.includes('Infosys'))
            .length,
        ],
      },
    ],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 8,
        },
      },
      colors: ['#8b5cf6'],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Google', 'Microsoft', 'Amazon', 'Others'],
        labels: { style: { colors: '#6b7280' } },
      },
      yaxis: {
        labels: { style: { colors: '#6b7280' } },
        title: { text: 'Number of Internships', style: { color: '#6b7280' } },
      },
      grid: { borderColor: '#f1f5f9' },
    },
  };

  const readinessRadarChart = {
    series: [
      {
        name: 'Average Readiness',
        data: [
          readinessMetrics.reduce((sum, r) => sum + r.technicalSkills, 0) / readinessMetrics.length,
          readinessMetrics.reduce((sum, r) => sum + r.softSkills, 0) / readinessMetrics.length,
          readinessMetrics.reduce((sum, r) => sum + r.projects, 0) / readinessMetrics.length,
          readinessMetrics.reduce((sum, r) => sum + r.internships, 0) / readinessMetrics.length,
          readinessMetrics.reduce((sum, r) => sum + r.certifications, 0) / readinessMetrics.length,
          readinessMetrics.reduce((sum, r) => sum + r.attendance, 0) / readinessMetrics.length,
        ],
      },
    ],
    options: {
      chart: { type: 'radar', toolbar: { show: false } },
      colors: ['#3b82f6'],
      xaxis: {
        categories: [
          'Technical Skills',
          'Soft Skills',
          'Projects',
          'Internships',
          'Certifications',
          'Attendance',
        ],
      },
      yaxis: {
        show: true,
        max: 100,
      },
      fill: {
        opacity: 0.2,
      },
      stroke: {
        show: true,
        width: 2,
      },
      markers: {
        size: 4,
      },
    },
  };

  const readinessDistributionChart = {
    series: [
      {
        name: 'Students',
        data: [
          readinessMetrics.filter((r) => r.readinessLevel === 'placement-ready').length,
          readinessMetrics.filter((r) => r.readinessLevel === 'developing').length,
          readinessMetrics.filter((r) => r.readinessLevel === 'needs-support').length,
          readinessMetrics.filter((r) => r.readinessLevel === 'at-risk').length,
        ],
      },
    ],
    options: {
      chart: { type: 'bar', toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          distributed: true,
        },
      },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      dataLabels: { enabled: true },
      xaxis: {
        categories: ['Placement Ready', 'Developing', 'Needs Support', 'At Risk'],
        labels: { style: { colors: '#6b7280' } },
      },
      yaxis: {
        labels: { style: { colors: '#6b7280' } },
      },
      legend: { show: false },
      grid: { borderColor: '#f1f5f9' },
    },
  };

  // ===== Helper Functions =====
  const getStatusColor = (status: Internship['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getVisitStatusColor = (status: IndustryVisit['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
    }
  };

  const getReadinessColor = (level: ReadinessMetrics['readinessLevel']) => {
    switch (level) {
      case 'placement-ready':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'developing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'needs-support':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'at-risk':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getReadinessLabel = (level: ReadinessMetrics['readinessLevel']) => {
    switch (level) {
      case 'placement-ready':
        return 'Placement Ready';
      case 'developing':
        return 'Developing';
      case 'needs-support':
        return 'Needs Support';
      case 'at-risk':
        return 'At Risk';
    }
  };

  const filteredInternships = internships.filter((internship) => {
    const matchesSearch =
      internship.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = internshipFilter === 'all' || internship.status === internshipFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredVisits = industryVisits.filter((visit) => {
    const matchesFilter = visitFilter === 'all' || visit.status === visitFilter;
    return matchesFilter;
  });

  // ===== Render =====
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Placement Readiness & Industry Connect
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Track internships, industry visits, and student placement readiness
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
            <Download className="h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'internships', label: 'Internships', icon: Briefcase },
            { key: 'visits', label: 'Industry Visits', icon: Building2 },
            { key: 'readiness', label: 'Readiness Analysis', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Avg Stipend</p>
                  <p className="text-2xl font-bold">₹{(metrics.avgStipend / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-blue-100">Per month average</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-purple-100">Intern to full-time</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-green-100 text-sm mb-1">Completed Visits</p>
                  <p className="text-2xl font-bold">{metrics.completedVisits}</p>
                </div>
                <CheckCircle className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-green-100">This academic year</p>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Upcoming Visits</p>
                  <p className="text-2xl font-bold">{metrics.upcomingVisits}</p>
                </div>
                <Calendar className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-orange-100">Scheduled visits</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Internship Status Distribution
              </h2>
              <ReactApexChart
                // @ts-expect-error - Auto-suppressed for migration
                options={internshipDistributionChart.options}
                series={internshipDistributionChart.series}
                type="donut"
                height={300}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Company-wise Internship Distribution
              </h2>
              <ReactApexChart
                // @ts-expect-error - Auto-suppressed for migration
                options={companyWiseInternshipsChart.options}
                series={companyWiseInternshipsChart.series}
                type="bar"
                height={300}
              />
            </div>
          </div>

          {/* Readiness Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Placement Readiness Overview</h2>
              <button
                onClick={() => setActiveTab('readiness')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View Details <Eye className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReactApexChart
                // @ts-expect-error - Auto-suppressed for migration
                options={readinessRadarChart.options}
                series={readinessRadarChart.series}
                type="radar"
                height={350}
              />
              <div className="space-y-4">
                {[
                  { label: 'Technical Skills', value: 76, color: 'bg-blue-500' },
                  { label: 'Soft Skills', value: 74, color: 'bg-purple-500' },
                  { label: 'Projects', value: 76, color: 'bg-cyan-500' },
                  { label: 'Internships', value: 76, color: 'bg-green-500' },
                  { label: 'Certifications', value: 68, color: 'bg-orange-500' },
                  { label: 'Attendance', value: 86, color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <span className="font-bold text-gray-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${item.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'internships' && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student, company, or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={internshipFilter}
                  onChange={(e) => setInternshipFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
                  <Plus className="h-5 w-5" />
                  Add Internship
                </button>
              </div>
            </div>
          </div>

          {/* Internships Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredInternships.map((internship) => (
              <div
                key={internship.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{internship.company}</h3>
                      <p className="text-sm text-gray-600">{internship.role}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Student:
                    </span>
                    <span className="font-semibold text-gray-900">{internship.studentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Roll Number:
                    </span>
                    <span className="font-mono text-sm text-gray-900">{internship.rollNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Duration:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {internship.duration} months
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Stipend:
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      ₹{(internship.stipend / 1000).toFixed(0)}K/month
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Domain:
                    </span>
                    <span className="text-sm font-medium text-gray-900">{internship.domain}</span>
                  </div>
                  {internship.mentorRating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Rating:
                      </span>
                      <span className="text-sm font-semibold text-yellow-600 flex items-center gap-1">
                        {internship.mentorRating} <Star className="h-3 w-3 fill-yellow-600" />
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(internship.status)}`}
                  >
                    {internship.status === 'ongoing' && <Clock className="h-3 w-3 inline mr-1" />}
                    {internship.status === 'completed' && (
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                    )}
                    {internship.status === 'pending' && (
                      <Calendar className="h-3 w-3 inline mr-1" />
                    )}
                    {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
                  </span>
                  {internship.convertedToFullTime && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Converted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredInternships.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No internships found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <select
              value={visitFilter}
              onChange={(e) => setVisitFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              <option value="all">All Visits</option>
              <option value="completed">Completed</option>
              <option value="upcoming">Upcoming</option>
            </select>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
              <Plus className="h-5 w-5" />
              Schedule Visit
            </button>
          </div>

          {/* Industry Visits Timeline */}
          <div className="space-y-4">
            {filteredVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex-shrink-0">
                      <Building2 className="h-7 w-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{visit.company}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getVisitStatusColor(visit.status)}`}
                        >
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {visit.location}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(visit.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {visit.department}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {visit.studentsParticipated}/{visit.totalStudents} students
                          {visit.status === 'completed' && (
                            <span className="text-green-600 font-medium">
                              (
                              {((visit.studentsParticipated / visit.totalStudents) * 100).toFixed(
                                0
                              )}
                              % participation)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Coordinator</p>
                      <p className="font-semibold text-gray-900">{visit.coordinator}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Objectives
                      </h4>
                      <ul className="space-y-1">
                        {visit.objectives.map((obj, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {visit.learnings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-green-600" />
                          Key Learnings
                        </h4>
                        <ul className="space-y-1">
                          {visit.learnings.map((learning, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-600 mt-1">✓</span>
                              {learning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVisits.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No industry visits found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'readiness' && (
        <div className="space-y-6">
          {/* Readiness Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Multi-Dimensional Readiness Analysis
              </h2>
              <ReactApexChart
                // @ts-expect-error - Auto-suppressed for migration
                options={readinessRadarChart.options}
                series={readinessRadarChart.series}
                type="radar"
                height={350}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Readiness Level Distribution
              </h2>
              <ReactApexChart
                // @ts-expect-error - Auto-suppressed for migration
                options={readinessDistributionChart.options}
                series={readinessDistributionChart.series}
                type="bar"
                height={350}
              />
            </div>
          </div>

          {/* Student Readiness Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Student-wise Readiness Scores</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Student</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Overall</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">
                      Technical
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">
                      Soft Skills
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">
                      Projects
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">
                      Internships
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Certs</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {readinessMetrics.map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{student.studentName}</p>
                          <p className="text-sm text-gray-500">{student.rollNumber}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">
                            {student.overallReadiness}%
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                student.overallReadiness >= 80
                                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                                  : student.overallReadiness >= 60
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    : student.overallReadiness >= 40
                                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                      : 'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${student.overallReadiness}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {student.technicalSkills}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.softSkills}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.projects}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.internships}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">
                          {student.certifications}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getReadinessColor(student.readinessLevel)}`}
                          >
                            {getReadinessLabel(student.readinessLevel)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Insights & Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Strong Technical Foundation</p>
                  <p className="text-sm text-gray-600">
                    76% average in technical skills across cohort
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Good Project Engagement</p>
                  <p className="text-sm text-gray-600">
                    76% average project completion and quality
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <TrendingDown className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Certification Gap</p>
                  <p className="text-sm text-gray-600">
                    Only 68% average - recommend more industry certifications
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <Award className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Internship Experience</p>
                  <p className="text-sm text-gray-600">
                    76% average - ensure all students get opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementReadiness;
