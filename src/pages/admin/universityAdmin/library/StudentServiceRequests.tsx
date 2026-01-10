import React, { useState } from 'react';
import {
  ClipboardIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const StudentServiceRequests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const tabs = [
    { id: 'all', name: 'All Requests', count: 156 },
    { id: 'pending', name: 'Pending', count: 45 },
    { id: 'in-progress', name: 'In Progress', count: 23 },
    { id: 'completed', name: 'Completed', count: 78 },
    { id: 'rejected', name: 'Rejected', count: 10 },
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

  const stats = [
    { name: 'Total Requests', value: '156', change: '+12%', changeType: 'increase' },
    { name: 'Pending Requests', value: '45', change: '+8%', changeType: 'increase' },
    { name: 'Avg Response Time', value: '2.4 hrs', change: '-15%', changeType: 'decrease' },
    { name: 'Satisfaction Rate', value: '94%', change: '+3%', changeType: 'increase' },
  ];

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

  const filteredRequests = serviceRequests.filter(request => {
    const matchesTab = activeTab === 'all' || request.status === activeTab;
    const matchesSearch = request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderRequestCard = (request: any) => (
    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{request.ticketId}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
              {getStatusIcon(request.status)}
              {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('-', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600">{request.studentName} ({request.studentId})</p>
          <p className="text-sm text-gray-600">{request.college}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium text-gray-900 mb-1">{request.serviceType}</h4>
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
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              <DocumentTextIcon className="h-3 w-3" />
              {doc}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            <span>{request.comments} comments</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedRequest(request)}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 flex items-center gap-1"
          >
            <EyeIcon className="h-4 w-4" />
            View
          </button>
          {request.status === 'pending' && (
            <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
              Assign
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderServiceTypeStats = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Service Type Distribution</h3>
      <div className="space-y-3">
        {serviceTypes.slice(0, 5).map((type, index) => (
          <div key={type} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{type}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${Math.random() * 80 + 20}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{Math.floor(Math.random() * 30 + 5)}</span>
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
              <ClipboardIcon className="h-8 w-8 text-indigo-600" />
              Student Service Requests
            </h1>
            <p className="text-gray-600 mt-2">
              ERP-FR-20: Manage and track student service requests across all colleges
            </p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
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
                  {tab.name}
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-xs rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ticket ID, student name, or service type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.map(renderRequestCard)}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No service requests found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {renderServiceTypeStats()}
        </div>
      </div>
    </div>
  );
};

export default StudentServiceRequests;