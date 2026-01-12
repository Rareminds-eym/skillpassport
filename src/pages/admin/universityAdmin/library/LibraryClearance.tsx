import { useState } from 'react';
import {
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import {
  Users,
  Filter,
  Search,
  Book,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

const LibraryClearance = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'pending', name: 'Pending Clearances', icon: ClockIcon, count: 45 },
    { id: 'approved', name: 'Approved', icon: CheckCircleIcon, count: 234 },
    { id: 'rejected', name: 'Rejected', icon: XCircleIcon, count: 12 },
    { id: 'graduation', name: 'Graduation Integration', icon: GraduationCap, count: 0 },
  ];

  const clearanceRequests = [
    {
      id: 1,
      studentName: 'John Doe',
      studentId: 'ST2025001',
      college: 'Engineering College A',
      program: 'B.Tech Computer Science',
      semester: '8th Semester',
      requestDate: '2025-01-08',
      status: 'pending',
      booksIssued: 2,
      fineAmount: 150,
      documents: ['Library Card', 'ID Proof'],
      graduationDate: '2025-05-15',
    },
    {
      id: 2,
      studentName: 'Jane Smith',
      studentId: 'ST2025002',
      college: 'Arts & Science College B',
      program: 'M.Sc Physics',
      semester: '4th Semester',
      requestDate: '2025-01-07',
      status: 'approved',
      booksIssued: 0,
      fineAmount: 0,
      documents: ['Library Card', 'ID Proof', 'Clearance Form'],
      graduationDate: '2025-06-20',
    },
    {
      id: 3,
      studentName: 'Mike Johnson',
      studentId: 'ST2025003',
      college: 'Engineering College A',
      program: 'B.Tech Mechanical',
      semester: '8th Semester',
      requestDate: '2025-01-06',
      status: 'rejected',
      booksIssued: 1,
      fineAmount: 300,
      documents: ['Library Card'],
      graduationDate: '2025-05-15',
      rejectionReason: 'Outstanding fine not cleared',
    },
  ];

  // KPI Data for consistent theming
  const kpiData = [
    {
      title: "Total Requests",
      value: "291",
      change: 12,
      changeLabel: "vs last month",
      icon: <DocumentTextIcon className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Pending Clearances",
      value: "45",
      change: 8,
      changeLabel: "awaiting review",
      icon: <ClockIcon className="h-6 w-6" />,
      color: "yellow" as const,
    },
    {
      title: "Approved Today",
      value: "23",
      change: 15,
      changeLabel: "processed today",
      icon: <CheckCircleIcon className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Avg Processing Time",
      value: "2.3 days",
      change: -10,
      changeLabel: "faster than before",
      icon: <Calendar className="h-6 w-6" />,
      color: "purple" as const,
    },
  ];

  // Filter options
  const colleges = ['All Colleges', 'Engineering College A', 'Arts & Science College B', 'Medical College C'];
  const programs = ['All Programs', 'B.Tech Computer Science', 'M.Sc Physics', 'B.Tech Mechanical', 'MBBS'];
  const statuses = ['All Status', 'pending', 'approved', 'rejected'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const filteredRequests = clearanceRequests.filter(request => {
    const matchesTab = activeTab === 'graduation' || request.status === activeTab;
    const matchesSearch = request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = !filterCollege || filterCollege === 'All Colleges' || request.college === filterCollege;
    const matchesProgram = !filterProgram || filterProgram === 'All Programs' || request.program === filterProgram;
    const matchesStatus = !filterStatus || filterStatus === 'All Status' || request.status === filterStatus;
    
    return matchesTab && matchesSearch && matchesCollege && matchesProgram && matchesStatus;
  });

  const renderClearanceCard = (request: any) => (
    <div key={request.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{request.studentName}</h3>
            <p className="text-sm text-gray-600">ID: {request.studentId}</p>
            <p className="text-sm text-gray-600">{request.college}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Program</p>
          <p className="text-sm text-gray-600">{request.program}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Semester</p>
          <p className="text-sm text-gray-600">{request.semester}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Books Issued</p>
          <p className={`text-sm font-bold ${request.booksIssued > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {request.booksIssued}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Fine Amount</p>
          <p className={`text-sm font-bold ${request.fineAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ₹{request.fineAmount}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Documents Submitted</p>
        <div className="flex flex-wrap gap-2">
          {request.documents.map((doc: string, index: number) => (
            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
              <DocumentTextIcon className="h-3 w-3" />
              {doc}
            </span>
          ))}
        </div>
      </div>

      {request.status === 'rejected' && request.rejectionReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            <p className="text-sm font-medium text-red-800">Rejection Reason</p>
          </div>
          <p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          <p>Requested: {request.requestDate}</p>
          <p>Graduation: {request.graduationDate}</p>
        </div>
        {request.status === 'pending' && (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 hover:shadow-lg transition-all duration-200 font-medium">
              Reject
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderGraduationIntegration = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Graduation Integration Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div>
              <h4 className="font-semibold text-blue-900">Library Clearance Integration</h4>
              <p className="text-sm text-blue-700">Automatically integrate library clearance with graduation process</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Book className="h-4 w-4 text-purple-600" />
                Clearance Requirements
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All issued books returned</li>
                <li>• Outstanding fines cleared</li>
                <li>• Library card submitted</li>
                <li>• No damage claims pending</li>
              </ul>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                Integration Points
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Student Information System</li>
                <li>• Graduation Processing Module</li>
                <li>• Certificate Generation</li>
                <li>• Alumni Database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Graduations</h3>
        <div className="text-center py-8 text-gray-500">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Graduation integration dashboard will be implemented here</p>
          <p className="text-sm">Features: Batch processing, Clearance status tracking, Automated notifications</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BuildingLibraryIcon className="h-8 w-8 text-indigo-600" />
          Library Clearance
        </h1>
        <p className="text-gray-600 mt-2">
          Manage library clearances for graduation and student services across all affiliated colleges
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
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
              {tab.count > 0 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter */}
      {activeTab !== 'graduation' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, ID, or college..."
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
                {(filterCollege || filterProgram || filterStatus) && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  <select
                    value={filterCollege}
                    onChange={(e) => setFilterCollege(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    {colleges.map(college => (
                      <option key={college} value={college === 'All Colleges' ? '' : college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    {programs.map(program => (
                      <option key={program} value={program === 'All Programs' ? '' : program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status === 'All Status' ? '' : status}>
                        {status === 'All Status' ? status : status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'graduation' ? (
        renderGraduationIntegration()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map(renderClearanceCard)}
        </div>
      )}

      {filteredRequests.length === 0 && activeTab !== 'graduation' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2 font-medium">No clearance requests found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default LibraryClearance;