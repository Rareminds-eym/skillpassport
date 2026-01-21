import { useState } from 'react';
import {
  ClipboardIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import {
  Users,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

const StudentServiceRequests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'all', name: 'All Requests', icon: FileText, count: 156 },
    { id: 'pending', name: 'Pending', icon: Clock, count: 45 },
    { id: 'in-progress', name: 'In Progress', icon: AlertTriangle, count: 23 },
    { id: 'completed', name: 'Completed', icon: CheckCircle, count: 78 },
    { id: 'rejected', name: 'Rejected', icon: XCircleIcon, count: 10 },
  ];

  const serviceTypes = [
    'Library Card Renewal',
    'Book Reservation',
    'Research Material Access',
    'Inter-Library Loan',
    'Digital Resource Access',
    'Study Room Booking',
    'Equipment Booking',
    'Document Verification',
    'Transcript Request',
    'Certificate Request',
  ];

  const serviceRequests = [
    {
      id: 1,
      ticketId: 'SR2025001',
      studentName: 'John Doe',
      studentId: 'ST2025001',
      college: 'Engineering College A',
      serviceType: 'Library Card Renewal',
      priority: 'Medium',
      status: 'pending',
      requestDate: '2025-01-10',
      expectedCompletion: '2025-01-15',
      description: 'Need to renew library card for final semester',
      assignedTo: 'Library Staff A',
      documents: ['Student ID', 'Fee Receipt'],
      comments: 2,
    },
    {
      id: 2,
      ticketId: 'SR2025002',
      studentName: 'Jane Smith',
      studentId: 'ST2025002',
      college: 'Arts & Science College B',
      serviceType: 'Research Material Access',
      priority: 'High',
      status: 'in-progress',
      requestDate: '2025-01-09',
      expectedCompletion: '2025-01-12',
      description: 'Access to specialized research journals for thesis work',
      assignedTo: 'Research Librarian',
      documents: ['Research Proposal', 'Supervisor Approval'],
      comments: 5,
    },
    {
      id: 3,
      ticketId: 'SR2025003',
      studentName: 'Mike Johnson',
      studentId: 'ST2025003',
      college: 'Engineering College A',
      serviceType: 'Inter-Library Loan',
      priority: 'Low',
      status: 'completed',
      requestDate: '2025-01-05',
      expectedCompletion: '2025-01-10',
      completedDate: '2025-01-09',
      description: 'Request for books from partner university library',
      assignedTo: 'ILL Coordinator',
      documents: ['Book List', 'Faculty Recommendation'],
      comments: 3,
    },
  ];

  // KPI Data for consistent theming
  const kpiData = [
    {
      title: 'Total Requests',
      value: '156',
      change: 12,
      changeLabel: 'vs last month',
      icon: <FileText className="h-6 w-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Pending Requests',
      value: '45',
      change: 8,
      changeLabel: 'awaiting assignment',
      icon: <Clock className="h-6 w-6" />,
      color: 'yellow' as const,
    },
    {
      title: 'Avg Response Time',
      value: '2.4 hrs',
      change: -15,
      changeLabel: 'faster response',
      icon: <Calendar className="h-6 w-6" />,
      color: 'green' as const,
    },
    {
      title: 'Satisfaction Rate',
      value: '94%',
      change: 3,
      changeLabel: 'student satisfaction',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'purple' as const,
    },
  ];

  // Filter options
  const colleges = [
    'All Colleges',
    'Engineering College A',
    'Arts & Science College B',
    'Medical College C',
  ];
  const priorities = ['All Priorities', 'High', 'Medium', 'Low'];
  const assignees = [
    'All Assignees',
    'Library Staff A',
    'Research Librarian',
    'ILL Coordinator',
    'Digital Resources Team',
  ];
  const serviceTypeOptions = ['All Service Types', ...serviceTypes];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'in-progress':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const filteredRequests = serviceRequests.filter((request) => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesSearch =
      request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege =
      !filterCollege || filterCollege === 'All Colleges' || request.college === filterCollege;
    const matchesServiceType =
      !filterServiceType ||
      filterServiceType === 'All Service Types' ||
      request.serviceType === filterServiceType;
    const matchesPriority =
      !filterPriority || filterPriority === 'All Priorities' || request.priority === filterPriority;
    const matchesAssignee =
      !filterAssignee ||
      filterAssignee === 'All Assignees' ||
      request.assignedTo === filterAssignee;

    return (
      matchesTab &&
      matchesSearch &&
      matchesCollege &&
      matchesServiceType &&
      matchesPriority &&
      matchesAssignee
    );
  });

  const renderRequestCard = (request: any) => (
    <div
      key={request.id}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{request.ticketId}</h3>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}
              >
                {getStatusIcon(request.status)}
                {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {request.studentName} ({request.studentId})
            </p>
            <p className="text-sm text-gray-600">{request.college}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(request.priority)}`}
          >
            {request.priority}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-1">{request.serviceType}</h4>
        <p className="text-sm text-gray-600">{request.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Assigned To</p>
          <p className="text-sm text-gray-600">{request.assignedTo}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Request Date</p>
          <p className="text-sm text-gray-600">{request.requestDate}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Expected Completion</p>
          <p className="text-sm text-gray-600">{request.expectedCompletion}</p>
        </div>
        {request.completedDate && (
          <div>
            <p className="text-sm font-medium text-gray-700">Completed Date</p>
            <p className="text-sm text-gray-600">{request.completedDate}</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Documents</p>
        <div className="flex flex-wrap gap-2">
          {request.documents.map((doc: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
            >
              <DocumentTextIcon className="h-3 w-3" />
              {doc}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            <span>{request.comments} comments</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => console.log('View request:', request)}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 flex items-center gap-1 font-medium transition-all duration-200"
          >
            <EyeIcon className="h-4 w-4" />
            View
          </button>
          {request.status === 'pending' && (
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
              Assign
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderServiceTypeStats = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Service Type Distribution</h3>
      <div className="space-y-3">
        {serviceTypes.slice(0, 5).map((type) => (
          <div key={type} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{type}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.random() * 80 + 20}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.floor(Math.random() * 30 + 5)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BuildingLibraryIcon className="h-8 w-8 text-indigo-600" />
              Student Service Requests
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and track student service requests across all affiliated colleges
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
            <PlusIcon className="h-4 w-4" />
            New Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
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
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-xs rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by ticket ID, student name, or service type..."
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
                  {(filterCollege || filterServiceType || filterPriority || filterAssignee) && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                    <select
                      value={filterCollege}
                      onChange={(e) => setFilterCollege(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {colleges.map((college) => (
                        <option key={college} value={college === 'All Colleges' ? '' : college}>
                          {college}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type
                    </label>
                    <select
                      value={filterServiceType}
                      onChange={(e) => setFilterServiceType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {serviceTypeOptions.map((type) => (
                        <option key={type} value={type === 'All Service Types' ? '' : type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {priorities.map((priority) => (
                        <option
                          key={priority}
                          value={priority === 'All Priorities' ? '' : priority}
                        >
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <select
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {assignees.map((assignee) => (
                        <option key={assignee} value={assignee === 'All Assignees' ? '' : assignee}>
                          {assignee}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-4">{filteredRequests.map(renderRequestCard)}</div>

          {filteredRequests.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <ClipboardIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2 font-medium">No service requests found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">{renderServiceTypeStats()}</div>
      </div>
    </div>
  );
};

export default StudentServiceRequests;
