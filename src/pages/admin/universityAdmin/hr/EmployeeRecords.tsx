import React, { useState } from 'react';
import {
  FolderOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  UserIcon,
  XMarkIcon,
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
  UserCheck,
  UserX,
  Clock,
} from 'lucide-react';
import KPICard from '../../../../components/admin/KPICard';

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  type: 'Faculty' | 'Staff';
  department: string;
  designation: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Retired';
  email: string;
  phone: string;
  documents: number;
}

const EmployeeRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [showFilters, setShowFilters] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'records', name: 'Employee Records', icon: Users },
    { id: 'documents', name: 'Document Management', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: Activity },
  ];

  // Mock data
  const recordStats = {
    totalRecords: 425,
    facultyRecords: 245,
    staffRecords: 180,
    incompleteRecords: 12,
  };

  const employees: Employee[] = [
    {
      id: '1',
      name: 'Dr. Priya Sharma',
      employeeId: 'FAC001',
      type: 'Faculty',
      department: 'Computer Science',
      designation: 'Professor',
      joiningDate: '2020-06-15',
      status: 'Active',
      email: 'priya.sharma@university.edu',
      phone: '+91 9876543210',
      documents: 8,
    },
    {
      id: '2',
      name: 'Ramesh Patel',
      employeeId: 'STF001',
      type: 'Staff',
      department: 'Administration',
      designation: 'Administrative Officer',
      joiningDate: '2021-03-20',
      status: 'Active',
      email: 'ramesh.patel@university.edu',
      phone: '+91 9876543211',
      documents: 6,
    },
    {
      id: '3',
      name: 'Prof. Rajesh Kumar',
      employeeId: 'FAC002',
      type: 'Faculty',
      department: 'Mathematics',
      designation: 'Associate Professor',
      joiningDate: '2019-08-10',
      status: 'Active',
      email: 'rajesh.kumar@university.edu',
      phone: '+91 9876543212',
      documents: 9,
    },
  ];

  // KPI Data based on stats
  const kpiData = [
    {
      title: "Total Records",
      value: recordStats.totalRecords.toLocaleString(),
      change: 5,
      changeLabel: "vs last month",
      icon: <Users className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Faculty Records",
      value: recordStats.facultyRecords.toLocaleString(),
      change: 3,
      changeLabel: "new additions",
      icon: <UserCheck className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Staff Records",
      value: recordStats.staffRecords.toLocaleString(),
      change: 2,
      changeLabel: "new additions",
      icon: <UserIcon className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Incomplete Records",
      value: recordStats.incompleteRecords.toLocaleString(),
      change: -15,
      changeLabel: "need attention",
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  const types = ['All', 'Faculty', 'Staff'];
  const statuses = ['All', 'Active', 'Inactive', 'On Leave', 'Retired'];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || employee.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || employee.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const documentTypes = [
    'Personal Information',
    'Educational Qualifications',
    'Experience Certificates',
    'Identity Documents',
    'Address Proof',
    'Bank Details',
    'Medical Records',
    'Emergency Contacts',
    'Appointment Letter',
    'Salary Structure',
  ];

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDownloadRecord = (employee: Employee) => {
    // Handle download logic here
    console.log('Downloading record for:', employee.name);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Recent Activity and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Additions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Additions</h3>
            <button 
              onClick={() => setActiveTab('records')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {employees.slice(0, 3).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    employee.type === 'Faculty' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <UserIcon className={`h-4 w-4 ${
                      employee.type === 'Faculty' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{employee.joiningDate}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.type === 'Faculty' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {employee.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Document Status</h3>
            <span className="text-sm text-red-600 font-medium">{recordStats.incompleteRecords} incomplete</span>
          </div>
          <div className="space-y-4">
            {employees.slice(0, 3).map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    employee.documents >= 8 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <DocumentTextIcon className={`h-4 w-4 ${
                      employee.documents >= 8 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-600">{employee.employeeId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{employee.documents}/10</p>
                  <p className="text-xs text-gray-500">
                    {employee.documents >= 8 ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Employee Records ({filteredEmployees.length})</h3>
        <button 
          onClick={() => console.log('Add employee functionality would be implemented here')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Employee
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
                placeholder="Search by name, employee ID, or department..."
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
              {(selectedType !== 'All' || selectedStatus !== 'All') && (
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
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
            </div>
          )}
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{employee.name}</h4>
                  <p className="text-sm text-gray-600">{employee.employeeId} • {employee.designation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEditEmployee(employee)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{employee.department}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  employee.type === 'Faculty' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {employee.type}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Documents:</span>
                <span className={`text-sm font-bold ${
                  employee.documents >= 8 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {employee.documents}/10
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Joining Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  employee.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' :
                  employee.status === 'On Leave' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleViewEmployee(employee)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-xl hover:bg-gray-200 flex items-center justify-center gap-1 font-medium transition-all duration-200"
              >
                <EyeIcon className="h-4 w-4" />
                View
              </button>
              <button 
                onClick={() => handleDownloadRecord(employee)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-1"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2">No employees found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500 mb-2">Document Management</p>
      <p className="text-sm text-gray-400">Centralized document management system for all employee records</p>
    </div>
  );

  const renderAnalytics = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p className="text-gray-500 mb-2">HR Analytics</p>
      <p className="text-sm text-gray-400">Comprehensive analytics and reporting for HR metrics</p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'records':
        return renderRecords();
      case 'documents':
        return renderDocuments();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-indigo-600" />
          Employee Records
        </h1>
        <p className="text-gray-600 mt-2">
          Maintain comprehensive records for all faculty and staff members across affiliated colleges
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
      {/* Employee Details Modal */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                      <UserIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {modalMode === 'view' ? 'Employee Details' : 'Edit Employee'}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedEmployee.name} - {selectedEmployee.employeeId}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employee Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Full Name</label>
                          {modalMode === 'edit' ? (
                            <input
                              type="text"
                              defaultValue={selectedEmployee.name}
                              className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEmployee.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Employee ID</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEmployee.employeeId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Department</label>
                          {modalMode === 'edit' ? (
                            <select
                              defaultValue={selectedEmployee.department}
                              className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            >
                              <option value="Computer Science">Computer Science</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Administration">Administration</option>
                            </select>
                          ) : (
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEmployee.department}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Designation</label>
                          {modalMode === 'edit' ? (
                            <input
                              type="text"
                              defaultValue={selectedEmployee.designation}
                              className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEmployee.designation}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Type</label>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                            selectedEmployee.type === 'Faculty' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {selectedEmployee.type}
                          </span>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          {modalMode === 'edit' ? (
                            <select
                              defaultValue={selectedEmployee.status}
                              className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="On Leave">On Leave</option>
                              <option value="Retired">Retired</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                              selectedEmployee.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                              selectedEmployee.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {selectedEmployee.status}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Joining Date</label>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            {new Date(selectedEmployee.joiningDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          {modalMode === 'edit' ? (
                            <input
                              type="email"
                              defaultValue={selectedEmployee.email}
                              className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEmployee.email}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          {modalMode === 'edit' ? (
                            <input
                              type="tel"
                              defaultValue={selectedEmployee.phone}
                              className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          ) : (
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedEmployee.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Checklist */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Document Checklist</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {documentTypes.map((docType, index) => (
                        <div key={docType} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                          <span className="text-sm text-gray-700 font-medium">{docType}</span>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                              index < selectedEmployee.documents 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {index < selectedEmployee.documents ? 'Complete' : 'Missing'}
                            </span>
                            {modalMode === 'edit' && (
                              <button className="text-purple-600 hover:text-purple-700 text-xs font-medium px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors">
                                Upload
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                {modalMode === 'edit' ? (
                  <>
                    <button
                      onClick={() => setModalMode('view')}
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        alert('Employee details would be updated in the database.');
                        setModalMode('view');
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all duration-200"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => setModalMode('edit')}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit Employee
                    </button>
                    <button
                      onClick={() => handleDownloadRecord(selectedEmployee)}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      Download Record
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRecords;