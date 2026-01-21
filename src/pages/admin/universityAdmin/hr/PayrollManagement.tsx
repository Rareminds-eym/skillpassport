import React, { useState } from 'react';
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  Users,
  AlertTriangle,
  Edit2,
  Plus,
  BarChart3,
  Activity,
  Filter,
  Search,
  FileText,
  DollarSign,
  Calculator,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

interface PayrollRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  payPeriod: string;
  status: 'Processed' | 'Pending' | 'On Hold' | 'Approved';
  paymentDate: string;
  type: 'Faculty' | 'Staff';
}

const PayrollManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedPayPeriod, setSelectedPayPeriod] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'payroll', name: 'Payroll Records', icon: DollarSign },
    { id: 'processing', name: 'Salary Processing', icon: Calculator },
    { id: 'reports', name: 'Reports & Analytics', icon: Activity },
  ];

  // Mock data
  const payrollStats = {
    totalEmployees: 425,
    totalPayroll: 12500000,
    processedSalaries: 380,
    pendingSalaries: 45,
  };

  const payrollRecords: PayrollRecord[] = [
    {
      id: '1',
      employeeName: 'Dr. Priya Sharma',
      employeeId: 'FAC001',
      department: 'Computer Science',
      designation: 'Professor',
      basicSalary: 85000,
      allowances: 15000,
      deductions: 8500,
      netSalary: 91500,
      payPeriod: 'January 2025',
      status: 'Processed',
      paymentDate: '2025-01-31',
      type: 'Faculty',
    },
    {
      id: '2',
      employeeName: 'Ramesh Patel',
      employeeId: 'STF001',
      department: 'Administration',
      designation: 'Administrative Officer',
      basicSalary: 45000,
      allowances: 8000,
      deductions: 4500,
      netSalary: 48500,
      payPeriod: 'January 2025',
      status: 'Pending',
      paymentDate: '2025-01-31',
      type: 'Staff',
    },
    {
      id: '3',
      employeeName: 'Prof. Rajesh Kumar',
      employeeId: 'FAC002',
      department: 'Mathematics',
      designation: 'Associate Professor',
      basicSalary: 75000,
      allowances: 12000,
      deductions: 7500,
      netSalary: 79500,
      payPeriod: 'January 2025',
      status: 'Approved',
      paymentDate: '2025-01-31',
      type: 'Faculty',
    },
  ];

  // KPI Data
  const kpiData = [
    {
      title: 'Total Payroll',
      value: `₹${(payrollStats.totalPayroll / 100000).toFixed(1)}L`,
      change: 3.2,
      changeLabel: 'vs last month',
      icon: <DollarSign className="h-6 w-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Processed Salaries',
      value: payrollStats.processedSalaries.toLocaleString(),
      change: 5,
      changeLabel: 'completed this month',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'green' as const,
    },
    {
      title: 'Pending Salaries',
      value: payrollStats.pendingSalaries.toLocaleString(),
      change: -12,
      changeLabel: 'awaiting approval',
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const,
    },
    {
      title: 'Average Salary',
      value: `₹${Math.round(payrollStats.totalPayroll / payrollStats.totalEmployees / 1000)}K`,
      change: 2.8,
      changeLabel: 'per employee',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'purple' as const,
    },
  ];

  const departments = [
    'All',
    'Computer Science',
    'Mathematics',
    'Administration',
    'Physics',
    'Chemistry',
  ];
  const statuses = ['All', 'Processed', 'Pending', 'On Hold', 'Approved'];
  const payPeriods = ['All', 'January 2025', 'December 2024', 'November 2024'];

  const filteredRecords = payrollRecords.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || record.status === selectedStatus;
    const matchesDepartment =
      selectedDepartment === 'All' || record.department === selectedDepartment;
    const matchesPayPeriod = selectedPayPeriod === 'All' || record.payPeriod === selectedPayPeriod;

    return matchesSearch && matchesStatus && matchesDepartment && matchesPayPeriod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'On Hold':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'On Hold':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const handleViewRecord = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleProcessSalary = (record: PayrollRecord) => {
    alert(
      `Processing salary for ${record.employeeName}...\nThis would typically trigger the salary processing workflow.`
    );
  };

  const handleGeneratePayslip = (record: PayrollRecord) => {
    alert(
      `Generating payslip for ${record.employeeName}...\nThis would typically generate and download a PDF payslip.`
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Recent Activity and Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payroll Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Payroll Activity</h3>
            <button
              onClick={() => setActiveTab('payroll')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {payrollRecords.slice(0, 3).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      record.status === 'Processed'
                        ? 'bg-green-100'
                        : record.status === 'Pending'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                    }`}
                  >
                    <DollarSign
                      className={`h-4 w-4 ${
                        record.status === 'Processed'
                          ? 'text-green-600'
                          : record.status === 'Pending'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.employeeName}</p>
                    <p className="text-sm text-gray-600">{record.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{record.netSalary.toLocaleString()}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.status)}`}
                  >
                    {getStatusIcon(record.status)}
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Salary Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Department Distribution</h3>
            <span className="text-sm text-purple-600 font-medium">
              ₹{(payrollStats.totalPayroll / 100000).toFixed(1)}L total
            </span>
          </div>
          <div className="space-y-4">
            {departments.slice(1, 4).map((dept) => (
              <div
                key={dept}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dept}</p>
                    <p className="text-sm text-gray-600">
                      {Math.floor(Math.random() * 50 + 20)} employees
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{(Math.random() * 30 + 10).toFixed(1)}L
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.random() * 80 + 20}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Payroll Records ({filteredRecords.length})
        </h3>
        <button
          onClick={() => console.log('Process payroll functionality would be implemented here')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Plus className="h-4 w-4" />
          Process Payroll
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium transition-all duration-200 ${
                showFilters ? 'bg-purple-50 border-purple-300 text-purple-700' : ''
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedStatus !== 'All' ||
                selectedDepartment !== 'All' ||
                selectedPayPeriod !== 'All') && (
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pay Period</label>
                <select
                  value={selectedPayPeriod}
                  onChange={(e) => setSelectedPayPeriod(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  {payPeriods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payroll Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{record.employeeName}</h4>
                  <p className="text-sm text-gray-600">
                    {record.employeeId} • {record.designation}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewRecord(record)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{record.department}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Basic Salary:</span>
                <span className="text-sm font-medium text-gray-900">
                  ₹{record.basicSalary.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Net Salary:</span>
                <span className="text-sm font-bold text-green-600">
                  ₹{record.netSalary.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pay Period:</span>
                <span className="text-sm font-medium text-gray-900">{record.payPeriod}</span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}
                >
                  {getStatusIcon(record.status)}
                  {record.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleGeneratePayslip(record)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 flex items-center justify-center gap-1 font-medium transition-all duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Payslip
              </button>
              {record.status === 'Pending' && (
                <button
                  onClick={() => handleProcessSalary(record)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-1"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Process
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No payroll records found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );

  const renderProcessing = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500 mb-2">Salary Processing Center</p>
      <p className="text-sm text-gray-400">
        Automated salary calculation, tax computation, and payment processing
      </p>
    </div>
  );

  const renderReports = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500 mb-2">Payroll Reports & Analytics</p>
      <p className="text-sm text-gray-400">
        Comprehensive payroll analytics, tax reports, and compliance documentation
      </p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payroll':
        return renderPayroll();
      case 'processing':
        return renderProcessing();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CurrencyDollarIcon className="h-8 w-8 text-indigo-600" />
          Payroll Management
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive payroll management system for all faculty and staff across affiliated
          colleges
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Payroll Details Modal */}
      {showModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Payroll Details</h3>
                      <p className="text-sm text-gray-600">
                        {selectedRecord.employeeName} - {selectedRecord.payPeriod}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Employee Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                      Employee Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedRecord.employeeName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Employee ID</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedRecord.employeeId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Department</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedRecord.department}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Designation</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedRecord.designation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Salary Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Basic Salary</span>
                        <span className="text-sm font-bold text-gray-900">
                          ₹{selectedRecord.basicSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Allowances</span>
                        <span className="text-sm font-bold text-green-600">
                          +₹{selectedRecord.allowances.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Deductions</span>
                        <span className="text-sm font-bold text-red-600">
                          -₹{selectedRecord.deductions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                        <span className="text-sm font-bold text-gray-900">Net Salary</span>
                        <span className="text-lg font-bold text-purple-600">
                          ₹{selectedRecord.netSalary.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                      Payment Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Pay Period</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedRecord.payPeriod}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Payment Date</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {new Date(selectedRecord.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedRecord.status)}`}
                        >
                          {getStatusIcon(selectedRecord.status)}
                          {selectedRecord.status}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Employee Type</label>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                            selectedRecord.type === 'Faculty'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          {selectedRecord.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleGeneratePayslip(selectedRecord)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download Payslip
                </button>
                {selectedRecord.status === 'Pending' && (
                  <button
                    onClick={() => handleProcessSalary(selectedRecord)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Process Salary
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
