import React, { useState } from 'react';
import {
  Download,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  IndianRupee,
  Eye,
  Calendar,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useExpenditureReports } from '../hooks/useExpenditureReports';
import { ExpenditureFilters } from '../services/expenditureService';

interface ExpenditureReportsTabProps {
  onViewStudent?: (studentId: string) => void;
}

export const ExpenditureReportsTab: React.FC<ExpenditureReportsTabProps> = ({ onViewStudent }) => {
  const {
    studentLedgerData,
    summary,
    departmentData,
    programData,
    filterOptions,
    loading,
    error,
    filters,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    startIndex,
    endIndex,
    applyFilters,
    clearFilters,
    changePage,
    changePageSize,
    exportToCSV,
    refreshData,
  } = useExpenditureReports();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<
    'overview' | 'detailed' | 'departments' | 'programs'
  >('overview');

  // Handle filter changes
  const handleFilterChange = (key: keyof ExpenditureFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    applyFilters(newFilters);
  };

  // Handle search
  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm };
    applyFilters(newFilters);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expenditure Reports</h2>
          <p className="text-gray-600 text-sm">
            Track fee collection, outstanding amounts, and financial analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => exportToCSV()}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Due Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_due_amount)}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg text-white">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.total_paid_amount)}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.total_balance)}
                </p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg text-white">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPercentage(summary.collection_percentage)}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg text-white">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            // { id: 'detailed', label: 'Detailed View', icon: Eye },
            { id: 'departments', label: 'By Department', icon: Building2 },
            { id: 'programs', label: 'By Program', icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  activeView === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      {activeView === 'detailed' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>

              {Object.keys(filters).length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students, roll numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={filters.academic_year || ''}
                  onChange={(e) => handleFilterChange('academic_year', e.target.value || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {filterOptions.academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={filters.semester || ''}
                  onChange={(e) => handleFilterChange('semester', e.target.value || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Semesters</option>
                  {filterOptions.semesters.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={filters.payment_status || ''}
                  onChange={(e) =>
                    handleFilterChange('payment_status', e.target.value || undefined)
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {filterOptions.paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Only</label>
                <select
                  value={filters.is_overdue === undefined ? '' : filters.is_overdue.toString()}
                  onChange={(e) =>
                    handleFilterChange(
                      'is_overdue',
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Records</option>
                  <option value="true">Overdue Only</option>
                  <option value="false">Not Overdue</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content based on active view */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeView === 'overview' && summary && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Financial Overview</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Student Distribution</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">Paid Students</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {summary.paid_students}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-900">Pending Students</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">
                      {summary.pending_students}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-900">Overdue Students</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {summary.overdue_students}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Collection Progress</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Collection Rate</span>
                    <span className="font-medium">
                      {formatPercentage(summary.collection_percentage)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(summary.collection_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Collected: {formatCurrency(summary.total_paid_amount)}</span>
                    <span>Remaining: {formatCurrency(summary.total_balance)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'detailed' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Fee Records</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => changePageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            ) : studentLedgerData.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No records found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Student
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Program
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                          Fee Head
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                          Due Amount
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                          Paid Amount
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                          Balance
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                          Status
                        </th>
                        <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentLedgerData.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{record.student_name}</div>
                              <div className="text-sm text-gray-500">
                                {record.roll_number && `Roll: ${record.roll_number}`}
                                {record.admission_number && ` | Adm: ${record.admission_number}`}
                              </div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.program_name_full || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">{record.department_name}</div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3">
                            <div className="text-sm text-gray-900">{record.fee_head_name}</div>
                            <div className="text-xs text-gray-500">
                              {record.academic_year} - {record.semester}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-right font-medium">
                            {formatCurrency(record.due_amount)}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-right font-medium text-green-600">
                            {formatCurrency(record.paid_amount)}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-right font-medium text-red-600">
                            {formatCurrency(record.balance)}
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status_description)}`}
                            >
                              {getStatusIcon(record.status_description)}
                              <span className="ml-1">{record.status_description}</span>
                            </span>
                          </td>
                          <td className="border border-gray-200 px-4 py-3 text-center">
                            <div className="text-sm text-gray-900">
                              {new Date(record.due_date).toLocaleDateString()}
                            </div>
                            {record.days_overdue > 0 && (
                              <div className="text-xs text-red-600">
                                {record.days_overdue} days overdue
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex} to {endIndex} of {totalCount} entries
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const page = i + Math.max(1, currentPage - 2);
                          if (page > totalPages) return null;

                          return (
                            <button
                              key={page}
                              onClick={() => changePage(page)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeView === 'departments' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Department-wise Expenditure</h3>

            {departmentData.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No department data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Department
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Total Due
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Collected
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Balance
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                        Students
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                        Collection %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentData.map((dept) => (
                      <tr key={dept.department_id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="font-medium text-gray-900">{dept.department_name}</div>
                          {dept.department_code && (
                            <div className="text-sm text-gray-500">{dept.department_code}</div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium">
                          {formatCurrency(dept.total_due_amount)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium text-green-600">
                          {formatCurrency(dept.total_paid_amount)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium text-red-600">
                          {formatCurrency(dept.total_balance)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          {dept.student_count}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(dept.collection_percentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {formatPercentage(dept.collection_percentage)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === 'programs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Program-wise Expenditure</h3>

            {programData.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No program data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Program
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Department
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Total Due
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Collected
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Balance
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                        Students
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-900">
                        Collection %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {programData.map((program) => (
                      <tr key={program.program_id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="font-medium text-gray-900">{program.program_name}</div>
                          {program.program_code && (
                            <div className="text-sm text-gray-500">{program.program_code}</div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="text-sm text-gray-900">{program.department_name}</div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium">
                          {formatCurrency(program.total_due_amount)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium text-green-600">
                          {formatCurrency(program.total_paid_amount)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-medium text-red-600">
                          {formatCurrency(program.total_balance)}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          {program.student_count}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(program.collection_percentage, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {formatPercentage(program.collection_percentage)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
