import { useState } from 'react';
import {
  AcademicCapIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  Filter,
  Search,
  Book,
  Calendar,
  GraduationCap,
  Download,
  RefreshCw,
  Settings,
  AlertCircle,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

const GraduationIntegration = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'batches', name: 'Graduation Batches', icon: UserGroupIcon },
    { id: 'clearances', name: 'Clearance Status', icon: ShieldCheckIcon },
    { id: 'settings', name: 'Integration Settings', icon: Cog6ToothIcon },
  ];

  // KPI Data for consistent theming with Library Management
  const kpiData = [
    {
      title: 'Upcoming Graduations',
      value: '1,247',
      change: 5,
      changeLabel: 'vs last batch',
      icon: <GraduationCap className="h-6 w-6" />,
      color: 'blue' as const,
    },
    {
      title: 'Pending Clearances',
      value: '89',
      change: -12,
      changeLabel: 'awaiting review',
      icon: <ClockIcon className="h-6 w-6" />,
      color: 'yellow' as const,
    },
    {
      title: 'Cleared Students',
      value: '1,158',
      change: 18,
      changeLabel: 'ready to graduate',
      icon: <CheckCircleIcon className="h-6 w-6" />,
      color: 'green' as const,
    },
    {
      title: 'Integration Success Rate',
      value: '98.2%',
      change: 2,
      changeLabel: 'system reliability',
      icon: <Settings className="h-6 w-6" />,
      color: 'purple' as const,
    },
  ];

  // Filter options
  const colleges = [
    'All Colleges',
    'Engineering College A',
    'Arts & Science College B',
    'Medical College C',
    'Commerce College D',
  ];
  const programs = [
    'All Programs',
    'B.Tech Computer Science',
    'M.Sc Physics',
    'B.Tech Mechanical',
    'MBBS',
    'B.Com',
    'MBA',
  ];
  const statuses = ['All Status', 'in-progress', 'completed', 'pending', 'on-hold'];

  const graduationBatches = [
    {
      id: 1,
      batchName: 'May 2025 - Engineering',
      college: 'Engineering College A',
      program: 'B.Tech',
      totalStudents: 245,
      clearedStudents: 198,
      pendingClearances: 47,
      graduationDate: '2025-05-15',
      status: 'in-progress',
      libraryCleared: 198,
      libraryPending: 47,
      finesPending: 12,
      booksReturned: 186,
    },
    {
      id: 2,
      batchName: 'June 2025 - Arts & Science',
      college: 'Arts & Science College B',
      program: 'M.Sc',
      totalStudents: 156,
      clearedStudents: 142,
      pendingClearances: 14,
      graduationDate: '2025-06-20',
      status: 'in-progress',
      libraryCleared: 142,
      libraryPending: 14,
      finesPending: 3,
      booksReturned: 153,
    },
    {
      id: 3,
      batchName: 'April 2025 - Commerce',
      college: 'Commerce College C',
      program: 'B.Com',
      totalStudents: 189,
      clearedStudents: 189,
      pendingClearances: 0,
      graduationDate: '2025-04-30',
      status: 'completed',
      libraryCleared: 189,
      libraryPending: 0,
      finesPending: 0,
      booksReturned: 189,
    },
    {
      id: 4,
      batchName: 'July 2025 - Medical',
      college: 'Medical College D',
      program: 'MBBS',
      totalStudents: 98,
      clearedStudents: 45,
      pendingClearances: 53,
      graduationDate: '2025-07-10',
      status: 'pending',
      libraryCleared: 45,
      libraryPending: 53,
      finesPending: 28,
      booksReturned: 70,
    },
  ];

  const clearanceRequirements = [
    {
      id: 1,
      requirement: 'All Library Books Returned',
      description: 'Student must return all issued books',
      automated: true,
      priority: 'High',
    },
    {
      id: 2,
      requirement: 'Outstanding Fines Cleared',
      description: 'All library fines must be paid',
      automated: true,
      priority: 'High',
    },
    {
      id: 3,
      requirement: 'Library Card Submitted',
      description: 'Physical library card must be returned',
      automated: false,
      priority: 'Medium',
    },
    {
      id: 4,
      requirement: 'No Damage Claims',
      description: 'No pending damage claims for library materials',
      automated: true,
      priority: 'High',
    },
  ];

  const integrationPoints = [
    {
      system: 'Student Information System (SIS)',
      status: 'connected',
      lastSync: '2025-01-10 14:30',
      description: 'Student enrollment and academic records',
    },
    {
      system: 'Library Management System',
      status: 'connected',
      lastSync: '2025-01-10 14:25',
      description: 'Book issues, returns, and fine tracking',
    },
    {
      system: 'Certificate Generation Module',
      status: 'connected',
      lastSync: '2025-01-10 14:20',
      description: 'Automated certificate generation',
    },
    {
      system: 'Alumni Database',
      status: 'pending',
      lastSync: 'Never',
      description: 'Post-graduation student tracking',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'on-hold':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'connected':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const handleRefreshData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      console.log('Data refreshed successfully');
    }, 1500);
  };

  const handleExportData = () => {
    console.log('Exporting graduation data...');
    // Simulate export functionality
    const data = {
      batches: graduationBatches,
      exportDate: new Date().toISOString(),
      totalStudents: graduationBatches.reduce((sum, batch) => sum + batch.totalStudents, 0),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graduation-integration-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcessBatch = (batchId: number) => {
    const batch = graduationBatches.find((b) => b.id === batchId);
    if (batch) {
      console.log(`Processing batch: ${batch.batchName}`);
      // Simulate batch processing
      alert(
        `Processing ${batch.batchName}\n\nThis will:\n• Verify all library clearances\n• Generate graduation certificates\n• Update student records\n• Send notifications\n\nEstimated time: 15-30 minutes`
      );
    }
  };

  const handleViewBatchDetails = (batchId: number) => {
    const batch = graduationBatches.find((b) => b.id === batchId);
    if (batch) {
      console.log(`Viewing details for batch: ${batch.batchName}`);
      alert(
        `Batch Details: ${batch.batchName}\n\nLibrary Status:\n• Books Returned: ${batch.booksReturned}/${batch.totalStudents}\n• Library Cleared: ${batch.libraryCleared}\n• Pending Clearances: ${batch.libraryPending}\n• Outstanding Fines: ${batch.finesPending} students\n\nNext Steps:\n• Follow up on pending returns\n• Process fine payments\n• Generate clearance reports`
      );
    }
  };

  const filteredBatches = graduationBatches.filter((batch) => {
    const matchesSearch =
      batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.program.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege =
      !filterCollege || filterCollege === 'All Colleges' || batch.college === filterCollege;
    const matchesProgram =
      !filterProgram || filterProgram === 'All Programs' || batch.program === filterProgram;
    const matchesStatus =
      !filterStatus || filterStatus === 'All Status' || batch.status === filterStatus;

    return matchesSearch && matchesCollege && matchesProgram && matchesStatus;
  });

  const renderOverview = () => (
    <div className="space-y-6">
      {/* ERP Requirements */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900">Library Clearance Integration</h3>
        </div>
        <p className="text-blue-700 mb-6">
          The system integrates library clearance with graduation process to ensure all students
          complete required library procedures before receiving their certificates.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              Key Features
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Automated clearance verification
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Real-time status tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Batch processing for graduations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Integration with certificate generation
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-purple-600" />
              Benefits
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Streamlined graduation process
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Reduced manual verification
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Improved compliance tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Enhanced student experience
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Integration Process Flow</h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Student Registration</p>
            <p className="text-xs text-gray-500 mt-1">Graduation batch created</p>
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-300 to-yellow-300 mx-4"></div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <BuildingLibraryIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Library Verification</p>
            <p className="text-xs text-gray-500 mt-1">Automated clearance check</p>
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-yellow-300 to-green-300 mx-4"></div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Clearance Approval</p>
            <p className="text-xs text-gray-500 mt-1">Status updated in SIS</p>
          </div>
          <div className="flex-1 h-0.5 bg-gradient-to-r from-green-300 to-purple-300 mx-4"></div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Certificate Generation</p>
            <p className="text-xs text-gray-500 mt-1">Graduation completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <div className="text-left">
              <p className="font-medium text-blue-900">Refresh Data</p>
              <p className="text-xs text-blue-600">Update all statistics</p>
            </div>
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <Download className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Export Data</p>
              <p className="text-xs text-green-600">Download reports</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <Settings className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">Settings</p>
              <p className="text-xs text-purple-600">Configure integration</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <Calendar className="h-5 w-5 text-yellow-600" />
            <div className="text-left">
              <p className="font-medium text-yellow-900">View Batches</p>
              <p className="text-xs text-yellow-600">Manage graduations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderBatches = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by batch name, college, or program..."
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
                  {colleges.map((college) => (
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
                  {programs.map((program) => (
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
                  {statuses.map((status) => (
                    <option key={status} value={status === 'All Status' ? '' : status}>
                      {status === 'All Status'
                        ? status
                        : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batches Grid */}
      <div className="space-y-4">
        {filteredBatches.map((batch) => (
          <div
            key={batch.id}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{batch.batchName}</h3>
                  <p className="text-sm text-gray-600">
                    {batch.college} - {batch.program}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Graduation Date: {batch.graduationDate}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}
              >
                {batch.status.charAt(0).toUpperCase() + batch.status.slice(1).replace('-', ' ')}
              </span>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-2xl font-bold text-gray-900">{batch.totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-2xl font-bold text-green-600">{batch.clearedStudents}</p>
                <p className="text-sm text-gray-600">Library Cleared</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-600">{batch.pendingClearances}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200">
                <p className="text-2xl font-bold text-red-600">{batch.finesPending}</p>
                <p className="text-sm text-gray-600">Fines Pending</p>
              </div>
            </div>

            {/* Library Details */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Book className="h-4 w-4" />
                Library Clearance Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Books Returned</p>
                  <p className="text-blue-900 font-bold">
                    {batch.booksReturned}/{batch.totalStudents}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Clearances Issued</p>
                  <p className="text-blue-900 font-bold">{batch.libraryCleared}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Outstanding Fines</p>
                  <p className="text-blue-900 font-bold">{batch.finesPending} students</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Clearance Progress</p>
                <p className="text-sm text-gray-600">
                  {Math.round((batch.clearedStudents / batch.totalStudents) * 100)}% completed
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-sm transition-all duration-300"
                  style={{ width: `${(batch.clearedStudents / batch.totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewBatchDetails(batch.id)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 hover:shadow-md transition-all duration-200 font-medium"
                >
                  View Details
                </button>
                {batch.finesPending > 0 && (
                  <button className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm rounded-xl hover:bg-yellow-200 hover:shadow-md transition-all duration-200 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Follow Up Fines
                  </button>
                )}
              </div>
              {batch.status === 'in-progress' && (
                <button
                  onClick={() => handleProcessBatch(batch.id)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Process Batch
                </button>
              )}
              {batch.status === 'completed' && (
                <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
                  Generate Report
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2 font-medium">No graduation batches found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );

  const renderClearances = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
          Clearance Requirements
        </h3>
        <div className="space-y-4">
          {clearanceRequirements.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    req.priority === 'High'
                      ? 'bg-red-100'
                      : req.priority === 'Medium'
                        ? 'bg-yellow-100'
                        : 'bg-green-100'
                  }`}
                >
                  <Book
                    className={`h-5 w-5 ${
                      req.priority === 'High'
                        ? 'text-red-600'
                        : req.priority === 'Medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{req.requirement}</h4>
                  <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    req.priority === 'High'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : req.priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                  }`}
                >
                  {req.priority} Priority
                </span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    req.automated
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  {req.automated ? 'Automated' : 'Manual'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clearance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            Clearance Status Overview
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-800 font-medium">Completed Clearances</span>
              <span className="text-green-900 font-bold">1,158</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-800 font-medium">Pending Reviews</span>
              <span className="text-yellow-900 font-bold">89</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-red-800 font-medium">Outstanding Issues</span>
              <span className="text-red-900 font-bold">43</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            Recent Activity
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Engineering Batch - 15 clearances approved
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Arts & Science - Batch processing started
                </p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Commerce - 8 fine payments pending
                </p>
                <p className="text-xs text-gray-500">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Cog6ToothIcon className="h-6 w-6 text-purple-600" />
          System Integration Status
        </h3>
        <div className="space-y-4">
          {integrationPoints.map((system, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    system.status === 'connected' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}
                >
                  <Settings
                    className={`h-5 w-5 ${
                      system.status === 'connected' ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{system.system}</h4>
                  <p className="text-sm text-gray-600 mt-1">{system.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Last sync: {system.lastSync}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(system.status)}`}
                >
                  {system.status === 'connected' ? (
                    <CheckCircleIcon className="h-3 w-3" />
                  ) : (
                    <ExclamationTriangleIcon className="h-3 w-3" />
                  )}
                  {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                </span>
                <button
                  onClick={() => console.log(`Configuring ${system.system}`)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-600" />
          Integration Settings
        </h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div>
              <h4 className="font-semibold text-blue-900">Auto-process Clearances</h4>
              <p className="text-sm text-blue-700 mt-1">
                Automatically process clearances when requirements are met
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div>
              <h4 className="font-semibold text-green-900">Email Notifications</h4>
              <p className="text-sm text-green-700 mt-1">
                Send email notifications for clearance status updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
            <div>
              <h4 className="font-semibold text-purple-900">Batch Processing</h4>
              <p className="text-sm text-purple-700 mt-1">
                Enable batch processing for multiple graduations
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
            <div>
              <h4 className="font-semibold text-yellow-900">Fine Tracking</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Track and manage outstanding library fines
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Configuration Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuration Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => console.log('Testing integration...')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <Settings className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Test Integration</p>
              <p className="text-xs text-blue-600">Verify connections</p>
            </div>
          </button>

          <button
            onClick={() => console.log('Syncing data...')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <RefreshCw className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Sync Data</p>
              <p className="text-xs text-green-600">Update all systems</p>
            </div>
          </button>

          <button
            onClick={() => console.log('Viewing logs...')}
            className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-200"
          >
            <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">View Logs</p>
              <p className="text-xs text-purple-600">Check activity</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'batches':
        return renderBatches();
      case 'clearances':
        return renderClearances();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <AcademicCapIcon className="h-8 w-8 text-indigo-600" />
          Graduation Integration
        </h1>
        <p className="text-gray-600 mt-2">
          Integrate library clearance with graduation process across all affiliated colleges
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
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default GraduationIntegration;
