import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Filter,
  Download,
} from 'lucide-react';
import { StudentFeeSummary, PaymentStatus } from '../types';

interface Props {
  studentSummaries: StudentFeeSummary[];
  loading: boolean;
  stats: {
    totalDue: number;
    totalCollected: number;
    totalPending: number;
    totalStudents: number;
    paidCount: number;
    partialCount: number;
    pendingCount: number;
    overdueCount: number;
  };
  onViewLedger: (student: StudentFeeSummary) => void;
  onRecordPayment: (student: StudentFeeSummary) => void;
}

interface FeeTrackingFilters {
  status: PaymentStatus | 'all';
  amountRange: 'all' | '0-25k' | '25k-50k' | '50k-75k' | '75k+';
  balanceRange: 'all' | '0' | '0-10k' | '10k-25k' | '25k+';
  search: string;
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid: { label: 'Paid', color: 'text-green-700', bg: 'bg-green-100' },
  partial: { label: 'Partial', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  pending: { label: 'Pending', color: 'text-gray-700', bg: 'bg-gray-100' },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100' },
  waived: { label: 'Waived', color: 'text-blue-700', bg: 'bg-blue-100' },
};

export const FeeTrackingTab: React.FC<Props> = ({
  studentSummaries,
  loading,
  stats,
  onViewLedger,
  onRecordPayment,
}) => {
  const [filters, setFilters] = useState<FeeTrackingFilters>({
    status: 'all',
    amountRange: 'all',
    balanceRange: 'all',
    search: '',
  });
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'balance' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let result = studentSummaries;

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.student_name.toLowerCase().includes(searchTerm) ||
          s.roll_number.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter((s) => s.status === filters.status);
    }

    // Apply amount range filter
    if (filters.amountRange !== 'all') {
      result = result.filter((s) => {
        switch (filters.amountRange) {
          case '0-25k':
            return s.total_due <= 25000;
          case '25k-50k':
            return s.total_due > 25000 && s.total_due <= 50000;
          case '50k-75k':
            return s.total_due > 50000 && s.total_due <= 75000;
          case '75k+':
            return s.total_due > 75000;
          default:
            return true;
        }
      });
    }

    // Apply balance range filter
    if (filters.balanceRange !== 'all') {
      result = result.filter((s) => {
        switch (filters.balanceRange) {
          case '0':
            return s.balance === 0;
          case '0-10k':
            return s.balance > 0 && s.balance <= 10000;
          case '10k-25k':
            return s.balance > 10000 && s.balance <= 25000;
          case '25k+':
            return s.balance > 25000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.student_name.toLowerCase();
          bValue = b.student_name.toLowerCase();
          break;
        case 'amount':
          aValue = a.total_due;
          bValue = b.total_due;
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [studentSummaries, filters, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredAndSortedStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  // Handle filter changes
  const handleFilterChange = (key: keyof FeeTrackingFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      amountRange: 'all',
      balanceRange: 'all',
      search: '',
    });
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvHeaders = [
      'Student Name',
      'Roll Number',
      'Total Due',
      'Paid Amount',
      'Balance',
      'Status',
    ];
    const csvData = filteredAndSortedStudents.map((student) => [
      student.student_name,
      student.roll_number,
      student.total_due.toString(),
      student.total_paid.toString(),
      student.balance.toString(),
      student.status,
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fee_tracking_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== 'all' && value !== ''
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fee Tracking</h2>
          <p className="text-gray-600 text-sm">
            Monitor student fee payments and outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredAndSortedStudents.length === 0}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Students</p>
              <p className="text-xl font-bold text-blue-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg text-white">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-green-600">Collected</p>
              <p className="text-xl font-bold text-green-900">
                ₹{(stats.totalCollected / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-xl font-bold text-yellow-900">
                ₹{(stats.totalPending / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-red-600">Defaulters</p>
              <p className="text-xl font-bold text-red-900">{stats.overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition ${
                showFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
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
                placeholder="Search by name or roll number..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount</label>
              <select
                value={filters.amountRange}
                onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Amounts</option>
                <option value="0-25k">₹0 - ₹25,000</option>
                <option value="25k-50k">₹25,001 - ₹50,000</option>
                <option value="50k-75k">₹50,001 - ₹75,000</option>
                <option value="75k+">₹75,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outstanding Balance
              </label>
              <select
                value={filters.balanceRange}
                onChange={(e) => handleFilterChange('balanceRange', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Balances</option>
                <option value="0">Fully Paid (₹0)</option>
                <option value="0-10k">₹1 - ₹10,000</option>
                <option value="10k-25k">₹10,001 - ₹25,000</option>
                <option value="25k+">₹25,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as typeof sortBy);
                  setSortOrder(newSortOrder as typeof sortOrder);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="amount-desc">Amount (High-Low)</option>
                <option value="amount-asc">Amount (Low-High)</option>
                <option value="balance-desc">Balance (High-Low)</option>
                <option value="balance-asc">Balance (Low-High)</option>
                <option value="status-asc">Status</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} students
          {activeFiltersCount > 0 && ' (filtered)'}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>
      </div>

      {/* Student List */}
      {paginatedStudents.length === 0 ? (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 font-medium mb-1">
            {totalItems === 0 ? 'No student fee records found' : 'No matching students'}
          </p>
          <p className="text-sm text-gray-600">
            {totalItems === 0
              ? 'Student fee ledgers will appear here once fee structures are assigned to students'
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    className="text-left py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center">
                      Student
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Roll No
                  </th>
                  <th
                    className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('amount')}
                  >
                    <div className="flex items-center justify-end">
                      Total Due
                      {sortBy === 'amount' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Paid</th>
                  <th
                    className="text-right py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('balance')}
                  >
                    <div className="flex items-center justify-end">
                      Balance
                      {sortBy === 'balance' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-center py-3 px-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('status')}
                  >
                    <div className="flex items-center justify-center">
                      Status
                      {sortBy === 'status' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => {
                  const config = statusConfig[student.status] || statusConfig.pending;
                  return (
                    <tr
                      key={student.student_id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{student.student_name}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.roll_number}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        ₹{student.total_due.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        ₹{student.total_paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">
                        ₹{student.balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onViewLedger(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Ledger"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* {student.balance > 0 && (
                            <button
                              onClick={() => onRecordPayment(student)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Record Payment"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )} */}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                        onClick={() => setCurrentPage(page)}
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
  );
};
