import React, { useState } from 'react';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

interface Faculty {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  experience: number;
  college: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  empanelmentDate: string;
  assignedSubjects: string[];
  rating: number;
  documents: string[];
  profileImage?: string;
}

const FacultyEmpanelment: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFacultyDetails, setSelectedFacultyDetails] = useState<Faculty | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  // Mock data
  const facultyData: Faculty[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      phone: '+1-555-0123',
      qualification: 'Ph.D. Computer Science',
      specialization: 'Machine Learning, AI',
      experience: 8,
      college: 'Engineering College',
      department: 'Computer Science',
      status: 'active',
      empanelmentDate: '2023-01-15',
      assignedSubjects: ['Data Structures', 'Machine Learning', 'AI Fundamentals'],
      rating: 4.8,
      documents: ['CV', 'Certificates', 'Research Papers'],
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      email: 'michael.chen@university.edu',
      phone: '+1-555-0124',
      qualification: 'M.Tech Electronics',
      specialization: 'Digital Signal Processing',
      experience: 12,
      college: 'Engineering College',
      department: 'Electronics',
      status: 'pending',
      empanelmentDate: '2024-01-10',
      assignedSubjects: ['Digital Electronics', 'Signal Processing'],
      rating: 4.6,
      documents: ['CV', 'Certificates'],
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@university.edu',
      phone: '+1-555-0125',
      qualification: 'Ph.D. Mathematics',
      specialization: 'Applied Mathematics',
      experience: 6,
      college: 'Science College',
      department: 'Mathematics',
      status: 'approved',
      empanelmentDate: '2024-01-05',
      assignedSubjects: ['Calculus', 'Linear Algebra'],
      rating: 4.9,
      documents: ['CV', 'Certificates', 'Publications'],
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  ];

  const colleges = [
    'All Colleges',
    'Engineering College',
    'Science College',
    'Arts College',
    'Commerce College',
  ];
  const departments = [
    'All Departments',
    'Computer Science',
    'Electronics',
    'Mathematics',
    'Physics',
    'Chemistry',
  ];
  const subjects = [
    'Data Structures',
    'Machine Learning',
    'Digital Electronics',
    'Calculus',
    'Physics',
    'Chemistry',
  ];

  const filteredFaculty = facultyData.filter((faculty) => {
    const matchesSearch =
      faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || faculty.status === selectedStatus;
    const matchesCollege =
      selectedCollege === 'all' ||
      selectedCollege === 'All Colleges' ||
      faculty.college === selectedCollege;
    const matchesDepartment =
      selectedDepartment === 'all' ||
      selectedDepartment === 'All Departments' ||
      faculty.department === selectedDepartment;

    return matchesSearch && matchesStatus && matchesCollege && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig[status as keyof typeof statusConfig]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleApprove = (facultyId: string) => {
    console.log('Approving faculty:', facultyId);
    // Implementation for approval
  };

  const handleReject = (facultyId: string) => {
    console.log('Rejecting faculty:', facultyId);
    // Implementation for rejection
  };

  const handleAssignSubjects = (faculty: Faculty) => {
    setSelectedFacultyDetails(faculty);
    setShowAssignmentModal(true);
  };

  const handleViewDetails = (faculty: Faculty) => {
    setSelectedFacultyDetails(faculty);
    setShowDetailsModal(true);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing bulk action: ${action} on`, selectedFaculty);
    // Implementation for bulk actions
  };
  const AddFacultyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New Faculty</h3>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Ph.D. Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter specialization"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter years of experience"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select College</option>
                {colleges.slice(1).map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Department</option>
                {departments.slice(1).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Documents</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">CV, Certificates, Research Papers (PDF, DOC)</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Add Faculty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  const FacultyDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Faculty Details</h3>
          <button
            onClick={() => setShowDetailsModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {selectedFacultyDetails && (
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {selectedFacultyDetails.profileImage ? (
                  <img
                    src={selectedFacultyDetails.profileImage}
                    alt={selectedFacultyDetails.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserGroupIcon className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900">
                  {selectedFacultyDetails.name}
                </h4>
                <p className="text-gray-600">{selectedFacultyDetails.qualification}</p>
                <p className="text-gray-600">{selectedFacultyDetails.specialization}</p>
                <div className="flex items-center mt-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">
                    {selectedFacultyDetails.rating}/5.0
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">{getStatusBadge(selectedFacultyDetails.status)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Contact Information</h5>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {selectedFacultyDetails.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {selectedFacultyDetails.phone}
                  </p>
                </div>

                <h5 className="font-medium text-gray-900">Academic Information</h5>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">College:</span> {selectedFacultyDetails.college}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Department:</span>{' '}
                    {selectedFacultyDetails.department}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Experience:</span>{' '}
                    {selectedFacultyDetails.experience} years
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Empanelment Date:</span>{' '}
                    {selectedFacultyDetails.empanelmentDate}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Assigned Subjects</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedFacultyDetails.assignedSubjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {subject}
                    </span>
                  ))}
                </div>

                <h5 className="font-medium text-gray-900">Documents</h5>
                <div className="space-y-2">
                  {selectedFacultyDetails.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{doc}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => handleAssignSubjects(selectedFacultyDetails)}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200"
              >
                Assign Subjects
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                Edit Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  const SubjectAssignmentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Assign Subjects</h3>
          <button
            onClick={() => setShowAssignmentModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {selectedFacultyDetails && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedFacultyDetails.name}</h4>
              <p className="text-sm text-gray-600">
                {selectedFacultyDetails.department} - {selectedFacultyDetails.college}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Subjects
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {subjects.map((subject, index) => (
                  <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked={selectedFacultyDetails.assignedSubjects.includes(subject)}
                    />
                    <span className="ml-3 text-sm text-gray-900">{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                Update Assignment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Empanelment & Assignment</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage faculty empanelment, approval process, and subject assignments
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add Faculty
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Faculty</p>
              <p className="text-2xl font-semibold text-gray-900">156</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Faculty</p>
              <p className="text-2xl font-semibold text-gray-900">134</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Subjects Assigned</p>
              <p className="text-2xl font-semibold text-gray-900">89</p>
            </div>
          </div>
        </div>
      </div>
      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search faculty by name, email, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              <ChevronDownIcon
                className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2h4a1 1 0 100-2H3zM3 7a1 1 0 000 2h4a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM11 3a1 1 0 100 2h4a1 1 0 100-2h-4zM11 7a1 1 0 100 2h4a1 1 0 100-2h-4zM11 11a1 1 0 100 2h4a1 1 0 100-2h-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {colleges.map((college) => (
                    <option key={college} value={college === 'All Colleges' ? 'all' : college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept === 'All Departments' ? 'all' : dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Bulk Actions */}
      {selectedFaculty.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedFaculty.length} faculty selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200"
              >
                Bulk Reject
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200"
              >
                Export Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty List/Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qualification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFaculty.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                          <div className="text-sm text-gray-500">{faculty.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.college}</div>
                      <div className="text-sm text-gray-500">{faculty.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faculty.qualification}</div>
                      <div className="text-sm text-gray-500">{faculty.specialization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faculty.experience} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(faculty.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-900">{faculty.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(faculty)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAssignSubjects(faculty)}
                          className="text-green-600 hover:text-green-900"
                          title="Assign Subjects"
                        >
                          <AcademicCapIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900" title="Edit">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredFaculty.map((faculty) => (
              <div
                key={faculty.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center"></div>
                  {getStatusBadge(faculty.status)}
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{faculty.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{faculty.qualification}</p>
                  <p className="text-sm text-gray-500">{faculty.specialization}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    {faculty.college}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    {faculty.department}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {faculty.experience} years experience
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <StarIcon className="h-4 w-4 mr-2 text-yellow-400 fill-current" />
                    {faculty.rating}/5.0 rating
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleViewDetails(faculty)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <div className="flex space-x-2">
                    <button className="text-gray-600 hover:text-gray-900">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{' '}
              <span className="font-medium">10</span> of{' '}
              <span className="font-medium">{filteredFaculty.length}</span> results
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                1
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                3
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && <AddFacultyModal />}
      {showDetailsModal && <FacultyDetailsModal />}
      {showAssignmentModal && <SubjectAssignmentModal />}
    </div>
  );
};

export default FacultyEmpanelment;
