import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  RefreshCw,
  Search,
  Settings
} from 'lucide-react';

interface ReportData {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'collection' | 'overdue' | 'summary' | 'analytics';
  icon: any;
  color: string;
  lastGenerated?: string;
  size?: string;
  status: 'ready' | 'generating' | 'error';
}

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  collectionRate: number;
  overdueAmount: number;
  averagePaymentTime: number;
  topPayingCollege: string;
  revenueGrowth: number;
  collectionTrend: number;
}

interface CollegeRevenueData {
  college_name: string;
  total_revenue: number;
  pending_amount: number;
  collection_rate: number;
  student_count: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  payments: number;
  growth: number;
}

// Mock Data
const mockReports: ReportData[] = [
  {
    id: '1',
    name: 'Revenue Summary Report',
    description: 'Comprehensive revenue analysis across all colleges and programs',
    type: 'revenue',
    icon: DollarSign,
    color: 'bg-green-500',
    lastGenerated: '2024-01-09T10:30:00Z',
    size: '2.4 MB',
    status: 'ready'
  },
  {
    id: '2',
    name: 'Collection Efficiency Report',
    description: 'Fee collection status and pending amounts by college',
    type: 'collection',
    icon: CheckCircle,
    color: 'bg-blue-500',
    lastGenerated: '2024-01-09T09:15:00Z',
    size: '1.8 MB',
    status: 'ready'
  },
  {
    id: '3',
    name: 'Overdue Payments Report',
    description: 'Students with overdue payments and late fees analysis',
    type: 'overdue',
    icon: AlertTriangle,
    color: 'bg-red-500',
    lastGenerated: '2024-01-09T08:45:00Z',
    size: '1.2 MB',
    status: 'ready'
  },
  {
    id: '4',
    name: 'Monthly Financial Summary',
    description: 'Month-wise financial performance and trends',
    type: 'summary',
    icon: BarChart3,
    color: 'bg-purple-500',
    lastGenerated: '2024-01-08T16:20:00Z',
    size: '3.1 MB',
    status: 'ready'
  },
  {
    id: '5',
    name: 'Payment Analytics Dashboard',
    description: 'Interactive analytics with charts and visualizations',
    type: 'analytics',
    icon: PieChart,
    color: 'bg-indigo-500',
    status: 'generating'
  },
  {
    id: '6',
    name: 'College-wise Revenue Breakdown',
    description: 'Detailed revenue analysis for each affiliated college',
    type: 'revenue',
    icon: Building2,
    color: 'bg-teal-500',
    lastGenerated: '2024-01-07T14:10:00Z',
    size: '4.2 MB',
    status: 'ready'
  }
];

const mockMetrics: FinancialMetrics = {
  totalRevenue: 15750000,
  monthlyRevenue: 2340000,
  collectionRate: 85.2,
  overdueAmount: 890000,
  averagePaymentTime: 12,
  topPayingCollege: 'Anna University College of Engineering',
  revenueGrowth: 12.5,
  collectionTrend: 8.3
};

const mockCollegeData: CollegeRevenueData[] = [
  {
    college_name: 'Anna University College of Engineering',
    total_revenue: 4500000,
    pending_amount: 320000,
    collection_rate: 93.2,
    student_count: 2800
  },
  {
    college_name: 'PSG College of Technology',
    total_revenue: 3200000,
    pending_amount: 180000,
    collection_rate: 89.7,
    student_count: 2100
  },
  {
    college_name: 'Coimbatore Institute of Technology',
    total_revenue: 2800000,
    pending_amount: 240000,
    collection_rate: 85.4,
    student_count: 1900
  },
  {
    college_name: 'Thiagarajar College of Engineering',
    total_revenue: 2600000,
    pending_amount: 150000,
    collection_rate: 91.8,
    student_count: 1700
  },
  {
    college_name: 'Madras Institute of Technology',
    total_revenue: 2650000,
    pending_amount: 200000,
    collection_rate: 88.1,
    student_count: 1800
  }
];

const mockMonthlyData: MonthlyRevenueData[] = [
  { month: 'Aug 2024', revenue: 2800000, payments: 1250, growth: 15.2 },
  { month: 'Sep 2024', revenue: 2200000, payments: 980, growth: -8.5 },
  { month: 'Oct 2024', revenue: 2600000, payments: 1180, growth: 18.2 },
  { month: 'Nov 2024', revenue: 2400000, payments: 1050, growth: -7.7 },
  { month: 'Dec 2024', revenue: 3100000, payments: 1420, growth: 29.2 },
  { month: 'Jan 2025', revenue: 2340000, payments: 1080, growth: -24.5 }
];

const FinancialReports: React.FC = () => {
  const [reports, setReports] = useState<ReportData[]>(mockReports);
  const [metrics, setMetrics] = useState<FinancialMetrics>(mockMetrics);
  const [collegeData, setCollegeData] = useState<CollegeRevenueData[]>(mockCollegeData);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenueData[]>(mockMonthlyData);
  const [loading, setLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedCollege, setSelectedCollege] = useState<string>('');

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)} K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'generating':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleGenerateReport = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'generating' as const }
        : report
    ));

    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: 'ready' as const,
              lastGenerated: new Date().toISOString(),
              size: `${(Math.random() * 3 + 1).toFixed(1)} MB`
            }
          : report
      ));
    }, 3000);
  };

  const MetricCard = ({ title, value, icon: Icon, color, change, subtitle }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const filteredReports = reports.filter(report => {
    return !selectedReportType || report.type === selectedReportType;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Financial Reports
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Generate comprehensive financial reports and analytics for university operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          color="bg-green-500"
          change={metrics.revenueGrowth}
          subtitle="All time"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(metrics.monthlyRevenue)}
          icon={TrendingUp}
          color="bg-blue-500"
          change={-24.5}
          subtitle="Current month"
        />
        <MetricCard
          title="Collection Rate"
          value={`${metrics.collectionRate}%`}
          icon={CheckCircle}
          color="bg-purple-500"
          change={metrics.collectionTrend}
          subtitle="Overall efficiency"
        />
        <MetricCard
          title="Overdue Amount"
          value={formatCurrency(metrics.overdueAmount)}
          icon={AlertTriangle}
          color="bg-red-500"
          change={-15.7}
          subtitle="Pending collections"
        />
      </div>

      {/* Quick Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Colleges by Revenue</h3>
          <div className="space-y-4">
            {collegeData.slice(0, 5).map((college, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{college.college_name}</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(college.total_revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{college.student_count} students</span>
                    <span>Collection: {college.collection_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${college.collection_rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-3">
            {monthlyData.slice(-6).map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{month.month}</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(month.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{month.payments} payments</span>
                    <div className="flex items-center gap-1">
                      {month.growth > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={month.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {month.growth > 0 ? '+' : ''}{month.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Reports</option>
              <option value="revenue">Revenue Reports</option>
              <option value="collection">Collection Reports</option>
              <option value="overdue">Overdue Reports</option>
              <option value="summary">Summary Reports</option>
              <option value="analytics">Analytics Reports</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Colleges</option>
              {collegeData.map((college, index) => (
                <option key={index} value={college.college_name}>
                  {college.college_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const IconComponent = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {getStatusIcon(report.status)}
                  {report.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>

              {report.lastGenerated && (
                <div className="text-xs text-gray-500 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                    {report.size && <span>Size: {report.size}</span>}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {report.status === 'ready' ? (
                  <>
                    <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button 
                      onClick={() => handleGenerateReport(report.id)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </>
                ) : report.status === 'generating' ? (
                  <button disabled className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </button>
                ) : (
                  <button 
                    onClick={() => handleGenerateReport(report.id)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generate Report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Report Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
            <input
              type="text"
              placeholder="Enter report name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Source</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="">Select data source</option>
              <option value="payments">Payment Records</option>
              <option value="fees">Fee Structures</option>
              <option value="colleges">College Data</option>
              <option value="students">Student Data</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Create Report
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Available Fields</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'Student Name', 'College Name', 'Fee Type', 'Amount Due', 'Amount Paid',
              'Payment Date', 'Status', 'Transaction ID', 'Late Fee', 'Discount'
            ].map((field, index) => (
              <label key={index} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>{field}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule New
          </button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Weekly Revenue Summary', schedule: 'Every Monday at 9:00 AM', nextRun: '2024-01-15' },
            { name: 'Monthly Collection Report', schedule: 'First day of month at 8:00 AM', nextRun: '2024-02-01' },
            { name: 'Overdue Payments Alert', schedule: 'Every Friday at 5:00 PM', nextRun: '2024-01-12' }
          ].map((scheduled, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{scheduled.name}</div>
                <div className="text-sm text-gray-500">{scheduled.schedule}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Next run: {scheduled.nextRun}</div>
                <div className="flex items-center gap-2 mt-1">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;