import React, { useState } from 'react';
import {
  UserPlusIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  Users,
  BarChart3,
  Search,
  UserCheck,
  Clock,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

interface Faculty {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Retired';
  email: string;
  phone: string;
}

const FacultyLifecycle: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'recruitment', name: 'Recruitment', icon: UserPlusIcon },
    { id: 'onboarding', name: 'Onboarding', icon: AcademicCapIcon },
    { id: 'performance', name: 'Performance', icon: ClipboardDocumentListIcon },
    { id: 'separation', name: 'Separation', icon: UserGroupIcon },
  ];

  // Mock data
  const facultyStats = {
    totalFaculty: 245,
    activeFaculty: 230,
    onLeave: 8,
    newJoinees: 7,
  };

  const recentFaculty: Faculty[] = [
    {
      id: '1',
      name: 'Dr. Priya Sharma',
      employeeId: 'FAC001',
      department: 'Computer Science',
      designation: 'Professor',
      joiningDate: '2024-01-15',
      status: 'Active',
      email: 'priya.sharma@university.edu',
      phone: '+91 9876543210',
    },
    {
      id: '2',
      name: 'Prof. Rajesh Kumar',
      employeeId: 'FAC002',
      department: 'Mathematics',
      designation: 'Associate Professor',
      joiningDate: '2024-01-10',
      status: 'Active',
      email: 'rajesh.kumar@university.edu',
      phone: '+91 9876543211',
    },
  ];

  // KPI Data
  const kpiData = [
    {
      title: "Total Faculty",
      value: facultyStats.totalFaculty.toLocaleString(),
      change: 3,
      changeLabel: "vs last month",
      icon: <Users className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Active Faculty",
      value: facultyStats.activeFaculty.toLocaleString(),
      change: 2,
      changeLabel: "currently active",
      icon: <UserCheck className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "On Leave",
      value: facultyStats.onLeave.toLocaleString(),
      change: 0,
      changeLabel: "temporary absence",
      icon: <Clock className="h-6 w-6" />,
      color: "yellow" as const,
    },
    {
      title: "New Joinees",
      value: facultyStats.newJoinees.toLocaleString(),
      change: 15,
      changeLabel: "this month",
      icon: <UserPlusIcon className="h-6 w-6" />,
      color: "purple" as const,
    },
  ];

  // Handler functions
  const handleViewFaculty = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setShowViewModal(true);
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setShowEditModal(true);
  };

  const handleDeleteFaculty = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setShowDeleteModal(true);
  };

  const handleStartRecruitment = () => {
    // Navigate to recruitment process or open recruitment modal
    alert('Starting recruitment process...\nThis would typically open a recruitment workflow or navigate to a detailed recruitment page.');
  };

  const handleCreateOnboarding = () => {
    // Navigate to onboarding checklist creation
    alert('Creating onboarding checklist...\nThis would typically open a form to create customized onboarding checklists for new faculty.');
  };

  const handleStartPerformanceReview = () => {
    // Navigate to performance review system
    alert('Starting performance review...\nThis would typically open the performance evaluation system with review templates and criteria.');
  };

  const handleProcessSeparation = () => {
    // Navigate to separation process
    alert('Processing separation...\nThis would typically open the exit procedure workflow including clearance forms and documentation.');
  };

  const confirmDelete = () => {
    if (selectedFaculty) {
      // Here you would typically call an API to delete the faculty
      alert(`Faculty ${selectedFaculty.name} would be deleted from the system.\nThis action would typically require additional confirmation and proper data handling.`);
      setShowDeleteModal(false);
      setSelectedFaculty(null);
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

      {/* Recent Faculty and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Faculty Additions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Faculty Additions</h3>
            <button 
              onClick={() => setActiveTab('recruitment')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentFaculty.map((faculty) => (
              <div key={faculty.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{faculty.name}</p>
                    <p className="text-sm text-gray-600">{faculty.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{new Date(faculty.joiningDate).toLocaleDateString()}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    faculty.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {faculty.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="space-y-4">
            <button
              onClick={handleStartRecruitment}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserPlusIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Start Recruitment</p>
                <p className="text-sm text-gray-600">Begin faculty hiring process</p>
              </div>
            </button>
            
            <button
              onClick={handleCreateOnboarding}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Create Onboarding</p>
                <p className="text-sm text-gray-600">Setup new faculty checklist</p>
              </div>
            </button>

            <button
              onClick={handleStartPerformanceReview}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-200"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Performance Review</p>
                <p className="text-sm text-gray-600">Conduct faculty evaluation</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Faculty Additions</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Faculty Details</th>
                <th className="text-left p-4 font-semibold text-gray-700 text-sm">Department</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Joining Date</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Status</th>
                <th className="text-center p-4 font-semibold text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentFaculty
                .filter(faculty => 
                  faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  faculty.department.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((faculty) => (
                <tr key={faculty.id} className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-gray-900">{faculty.name}</p>
                      <p className="text-sm text-gray-500">{faculty.employeeId} • {faculty.designation}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-700">{faculty.department}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-gray-700">{new Date(faculty.joiningDate).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      faculty.status === 'Active' ? 'bg-green-100 text-green-800' :
                      faculty.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {faculty.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleViewFaculty(faculty)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditFaculty(faculty)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Faculty"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteFaculty(faculty)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Faculty"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRecruitment = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <UserPlusIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Faculty Recruitment</h3>
      <p className="mt-2 text-sm text-gray-500">
        Manage faculty recruitment process, job postings, and candidate evaluation across all affiliated colleges.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleStartRecruitment}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Start Recruitment Process
        </button>
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Faculty Onboarding</h3>
      <p className="mt-2 text-sm text-gray-500">
        Streamline the onboarding process for new faculty members with comprehensive checklists and workflows.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleCreateOnboarding}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <AcademicCapIcon className="h-4 w-4 mr-2" />
          Create Onboarding Checklist
        </button>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Performance Management</h3>
      <p className="mt-2 text-sm text-gray-500">
        Track and evaluate faculty performance, conduct appraisals, and manage career development programs.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleStartPerformanceReview}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
          Start Performance Review
        </button>
      </div>
    </div>
  );

  const renderSeparation = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Faculty Separation</h3>
      <p className="mt-2 text-sm text-gray-500">
        Manage faculty resignations, retirements, and exit procedures with proper documentation and clearance processes.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={handleProcessSeparation}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <UserGroupIcon className="h-4 w-4 mr-2" />
          Process Separation
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'recruitment':
        return renderRecruitment();
      case 'onboarding':
        return renderOnboarding();
      case 'performance':
        return renderPerformance();
      case 'separation':
        return renderSeparation();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <UserGroupIcon className="h-8 w-8 text-indigo-600" />
          Faculty Lifecycle Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage the complete lifecycle of faculty members from recruitment to separation across all affiliated colleges
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

      {/* View Faculty Modal */}
      {showViewModal && selectedFaculty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Faculty Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedFaculty.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <p className="text-sm text-gray-900">{selectedFaculty.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="text-sm text-gray-900">{selectedFaculty.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <p className="text-sm text-gray-900">{selectedFaculty.designation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedFaculty.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedFaculty.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedFaculty.joiningDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedFaculty.status === 'Active' ? 'bg-green-100 text-green-800' :
                    selectedFaculty.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedFaculty.status}
                  </span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditModal && selectedFaculty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Faculty</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    defaultValue={selectedFaculty.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    defaultValue={selectedFaculty.department}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <input
                    type="text"
                    defaultValue={selectedFaculty.designation}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    defaultValue={selectedFaculty.email}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    defaultValue={selectedFaculty.phone}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    defaultValue={selectedFaculty.status}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Faculty details would be updated in the database.');
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFaculty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Faculty</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{selectedFaculty.name}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyLifecycle;