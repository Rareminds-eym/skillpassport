import React, { useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  Users,
  AlertTriangle,
  Plus,
  BarChart3,
  Filter,
  Search,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  leaveType: 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'Emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  approvedBy?: string;
}

const LeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'requests', name: 'Leave Requests', icon: Clock },
    { id: 'calendar', name: 'Leave Calendar', icon: CalendarDaysIcon },
    { id: 'policies', name: 'Leave Policies', icon: FileText },
  ];

  // Mock data
  const leaveStats = {
    pendingRequests: 15,
    approvedRequests: 142,
    rejectedRequests: 8,
    totalDaysApproved: 1250,
  };

  const leaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employeeName: 'Dr. Priya Sharma',
      employeeId: 'FAC001',
      leaveType: 'Casual',
      startDate: '2025-01-20',
      endDate: '2025-01-22',
      days: 3,
      reason: 'Personal work',
      status: 'Pending',
      appliedDate: '2025-01-15',
    },
    {
      id: '2',
      employeeName: 'Prof. Rajesh Kumar',
      employeeId: 'FAC002',
      leaveType: 'Sick',
      startDate: '2025-01-18',
      endDate: '2025-01-19',
      days: 2,
      reason: 'Medical treatment',
      status: 'Approved',
      appliedDate: '2025-01-17',
      approvedBy: 'Dean Office',
    },
    {
      id: '3',
      employeeName: 'Ramesh Patel',
      employeeId: 'STF001',
      leaveType: 'Earned',
      startDate: '2025-02-01',
      endDate: '2025-02-05',
      days: 5,
      reason: 'Family function',
      status: 'Pending',
      appliedDate: '2025-01-12',
    },
  ];

  const leaveTypes = [
    { name: 'Casual Leave', allocation: 12, used: 8, remaining: 4 },
    { name: 'Sick Leave', allocation: 12, used: 5, remaining: 7 },
    { name: 'Earned Leave', allocation: 30, used: 15, remaining: 15 },
    { name: 'Maternity Leave', allocation: 180, used: 0, remaining: 180 },
    { name: 'Paternity Leave', allocation: 15, used: 0, remaining: 15 },
  ];

  // KPI Data
  const kpiData = [
    {
      title: 'Pending Requests',
      value: leaveStats.pendingRequests.toLocaleString(),
      change: 8,
      changeLabel: 'awaiting approval',
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const,
    },
    {
      title: 'Approved Requests',
      value: leaveStats.approvedRequests.toLocaleString(),
      change: 12,
      changeLabel: 'this month',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'green' as const,
    },
    {
      title: 'Total Days Approved',
      value: leaveStats.totalDaysApproved.toLocaleString(),
      change: 5,
      changeLabel: 'vs last month',
      icon: <Calendar className="h-6 w-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Rejection Rate',
      value: `${Math.round((leaveStats.rejectedRequests / (leaveStats.approvedRequests + leaveStats.rejectedRequests)) * 100)}%`,
      change: -3,
      changeLabel: 'improved rate',
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'purple' as const,
    },
  ];

  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesStatus = selectedStatus === 'All' || request.status === selectedStatus;
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'Rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Casual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Earned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Maternity':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Paternity':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Recent Activity and Leave Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Leave Requests</h3>
            <button
              onClick={() => setActiveTab('requests')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {leaveRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      request.status === 'Pending'
                        ? 'bg-yellow-100'
                        : request.status === 'Approved'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                    }`}
                  >
                    <Users
                      className={`h-4 w-4 ${
                        request.status === 'Pending'
                          ? 'text-yellow-600'
                          : request.status === 'Approved'
                            ? 'text-green-600'
                            : 'text-red-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{request.employeeName}</p>
                    <p className="text-sm text-gray-600">
                      {request.leaveType} - {request.days} days
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{request.appliedDate}</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}
                  >
                    {getStatusIcon(request.status)}
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Type Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Leave Type Distribution</h3>
            <span className="text-sm text-purple-600 font-medium">
              {leaveStats.totalDaysApproved} total days
            </span>
          </div>
          <div className="space-y-4">
            {leaveTypes.slice(0, 4).map((leave) => (
              <div
                key={leave.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{leave.name}</p>
                    <p className="text-sm text-gray-600">
                      {leave.used}/{leave.allocation} days used
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{leave.remaining} remaining</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                      style={{ width: `${(leave.used / leave.allocation) * 100}%` }}
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

  const renderRequests = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Leave Requests ({filteredRequests.length})
        </h3>
        <button
          onClick={() => console.log('Add leave request functionality would be implemented here')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Leave Request
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
                placeholder="Search by employee name, ID, or leave type..."
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
              {selectedStatus !== 'All' && (
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 text-xs rounded-full">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status} Requests
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leave Requests Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{request.employeeName}</h4>
                  <p className="text-sm text-gray-600">{request.employeeId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => console.log('View request:', request)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Leave Type:</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLeaveTypeColor(request.leaveType)}`}
                >
                  {request.leaveType}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium text-gray-900">{request.days} days</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Period:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(request.startDate).toLocaleDateString()} -{' '}
                  {new Date(request.endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Applied:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(request.appliedDate).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}
                >
                  {getStatusIcon(request.status)}
                  {request.status}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Reason:</span> {request.reason}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => console.log('View details:', request)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 flex items-center justify-center gap-1 font-medium transition-all duration-200"
                >
                  <EyeIcon className="h-4 w-4" />
                  View Details
                </button>
                {request.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => console.log('Approve request:', request)}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-1"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => console.log('Reject request:', request)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-1"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No leave requests found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );

  const renderCalendar = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Leave Calendar</h3>
      <p className="mt-2 text-sm text-gray-500">
        Visual calendar showing all approved leaves and holidays across the university.
      </p>
      <div className="mt-6">
        <button
          onClick={() => console.log('Calendar functionality would be implemented here')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          View Calendar
        </button>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      {/* Leave Allocation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Leave Allocation & Balance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveTypes.map((leave) => (
              <div key={leave.name} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">{leave.name}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allocated:</span>
                    <span className="text-gray-900 font-medium">{leave.allocation} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used:</span>
                    <span className="text-red-600 font-medium">{leave.used} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="text-green-600 font-medium">{leave.remaining} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                      style={{ width: `${(leave.used / leave.allocation) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Policies */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Leave Policies</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="border-l-4 border-blue-400 pl-4 bg-blue-50 rounded-r-xl p-4">
              <h4 className="font-semibold text-gray-900">Casual Leave</h4>
              <p className="text-sm text-gray-600 mt-1">
                12 days per year. Can be taken for personal reasons. Requires 1 day advance notice.
              </p>
            </div>
            <div className="border-l-4 border-red-400 pl-4 bg-red-50 rounded-r-xl p-4">
              <h4 className="font-semibold text-gray-900">Sick Leave</h4>
              <p className="text-sm text-gray-600 mt-1">
                12 days per year. Medical certificate required for leaves exceeding 3 consecutive
                days.
              </p>
            </div>
            <div className="border-l-4 border-green-400 pl-4 bg-green-50 rounded-r-xl p-4">
              <h4 className="font-semibold text-gray-900">Earned Leave</h4>
              <p className="text-sm text-gray-600 mt-1">
                30 days per year. Can be accumulated up to 60 days. Requires 7 days advance notice.
              </p>
            </div>
            <div className="border-l-4 border-pink-400 pl-4 bg-pink-50 rounded-r-xl p-4">
              <h4 className="font-semibold text-gray-900">Maternity Leave</h4>
              <p className="text-sm text-gray-600 mt-1">
                180 days (26 weeks) as per Maternity Benefit Act. Can be taken before and after
                delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'requests':
        return renderRequests();
      case 'calendar':
        return renderCalendar();
      case 'policies':
        return renderPolicies();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CalendarDaysIcon className="h-8 w-8 text-indigo-600" />
          Leave Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage leave requests, policies, and employee leave balances across all affiliated
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
    </div>
  );
};

export default LeaveManagement;
