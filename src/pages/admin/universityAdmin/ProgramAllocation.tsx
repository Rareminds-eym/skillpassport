import React, { useState, useMemo } from 'react';
import {
  EyeIcon,
  FunnelIcon,
  PencilSquareIcon,
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Mock data for demonstration
const mockColleges = [
  {
    id: 1,
    name: 'Government College of Technology',
    code: 'GCT001',
    district: 'Coimbatore',
    type: 'Government',
    established: '1945',
    accreditation: 'NAAC A+',
    totalPrograms: 12,
    activePrograms: 10,
    totalStudents: 2500,
    status: 'active',
  },
  {
    id: 2,
    name: 'Anna University Regional Campus',
    code: 'AURC002',
    district: 'Madurai',
    type: 'Government',
    established: '1978',
    accreditation: 'NAAC A',
    totalPrograms: 8,
    activePrograms: 7,
    totalStudents: 1800,
    status: 'active',
  },
  {
    id: 3,
    name: 'Sri Krishna College of Engineering',
    code: 'SKCE003',
    district: 'Chennai',
    type: 'Private',
    established: '1985',
    accreditation: 'NAAC A',
    totalPrograms: 15,
    activePrograms: 12,
    totalStudents: 3200,
    status: 'active',
  },
  {
    id: 4,
    name: 'Thiagarajar College of Engineering',
    code: 'TCE004',
    district: 'Madurai',
    type: 'Private',
    established: '1957',
    accreditation: 'NAAC A+',
    totalPrograms: 10,
    activePrograms: 9,
    totalStudents: 2100,
    status: 'pending_review',
  },
];

const mockPrograms = [
  {
    id: 1,
    name: 'Computer Science and Engineering',
    code: 'CSE',
    duration: '4 Years',
    degree: 'B.E.',
    category: 'Engineering',
    intake: 120,
    fees: 85000,
    status: 'approved',
    accreditation: 'NBA',
    lastUpdated: '2024-01-15',
  },
  {
    id: 2,
    name: 'Information Technology',
    code: 'IT',
    duration: '4 Years',
    degree: 'B.E.',
    category: 'Engineering',
    intake: 60,
    fees: 80000,
    status: 'approved',
    accreditation: 'NBA',
    lastUpdated: '2024-01-10',
  },
  {
    id: 3,
    name: 'Mechanical Engineering',
    code: 'MECH',
    duration: '4 Years',
    degree: 'B.E.',
    category: 'Engineering',
    intake: 90,
    fees: 75000,
    status: 'pending',
    accreditation: 'Pending',
    lastUpdated: '2024-01-20',
  },
  {
    id: 4,
    name: 'Master of Business Administration',
    code: 'MBA',
    duration: '2 Years',
    degree: 'MBA',
    category: 'Management',
    intake: 60,
    fees: 120000,
    status: 'under_review',
    accreditation: 'AICTE',
    lastUpdated: '2024-01-18',
  },
  {
    id: 5,
    name: 'Master of Computer Applications',
    code: 'MCA',
    duration: '3 Years',
    degree: 'MCA',
    category: 'Computer Applications',
    intake: 40,
    fees: 65000,
    status: 'approved',
    accreditation: 'AICTE',
    lastUpdated: '2024-01-12',
  },
];

const ProgramAllocation: React.FC = () => {
  const [selectedCollege, setSelectedCollege] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showNewAllocationModal, setShowNewAllocationModal] = useState(false);
  const [showCollegeDetailsModal, setShowCollegeDetailsModal] = useState(false);
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter colleges based on search and filters
  const filteredColleges = useMemo(() => {
    return mockColleges.filter((college) => {
      const matchesSearch =
        college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.district.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || college.status === filterStatus;
      const matchesType = filterType === 'all' || college.type.toLowerCase() === filterType;
      const matchesDistrict = filterDistrict === 'all' || college.district === filterDistrict;

      return matchesSearch && matchesStatus && matchesType && matchesDistrict;
    });
  }, [searchTerm, filterStatus, filterType, filterDistrict]);

  // Pagination
  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
  const paginatedColleges = filteredColleges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Active' },
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: ClockIcon,
        text: 'Pending Review',
      },
      inactive: {
        color: 'bg-red-100 text-red-800',
        icon: ExclamationTriangleIcon,
        text: 'Inactive',
      },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: XMarkIcon, text: 'Suspended' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getProgramStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', text: 'Under Review' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const handleProgramSelection = (programId: number) => {
    setSelectedPrograms((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
    );
  };

  const handleBulkAllocation = () => {
    if (selectedPrograms.length > 0 && selectedCollege) {
      // Handle bulk program allocation logic here
      console.log('Allocating programs:', selectedPrograms, 'to college:', selectedCollege);
      setShowAllocationModal(false);
      setSelectedPrograms([]);
    }
  };

  const ProgramModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Program Allocation - {mockColleges.find((c) => c.id === selectedCollege)?.name}
          </h3>
          <button
            onClick={() => setShowProgramModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search programs..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="all">All Categories</option>
                <option value="engineering">Engineering</option>
                <option value="management">Management</option>
                <option value="computer_applications">Computer Applications</option>
              </select>
            </div>
            <button
              onClick={() => setShowAllocationModal(true)}
              disabled={selectedPrograms.length === 0}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Allocate Selected ({selectedPrograms.length})
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPrograms(mockPrograms.map((p) => p.id));
                      } else {
                        setSelectedPrograms([]);
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intake
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(program.id)}
                      onChange={() => handleProgramSelection(program.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{program.name}</div>
                      <div className="text-sm text-gray-500">
                        {program.code} - {program.degree}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.intake}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{program.fees.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getProgramStatusBadge(program.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowProgramModal(false)}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const AllocationModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Confirm Program Allocation</h3>
          <button
            onClick={() => setShowAllocationModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            You are about to allocate {selectedPrograms.length} program(s) to:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900">
              {mockColleges.find((c) => c.id === selectedCollege)?.name}
            </h4>
            <p className="text-sm text-gray-600">
              {mockColleges.find((c) => c.id === selectedCollege)?.code} -{' '}
              {mockColleges.find((c) => c.id === selectedCollege)?.district}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add any remarks or notes for this allocation..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowAllocationModal(false)}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkAllocation}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700"
          >
            Confirm Allocation
          </button>
        </div>
      </div>
    </div>
  );

  const NewAllocationModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Create New Program Allocation</h3>
          <button
            onClick={() => setShowNewAllocationModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* College Selection */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Select College</h4>
            <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
              {mockColleges.map((college) => (
                <div key={college.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="college"
                    value={college.id}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    onChange={() => setSelectedCollege(college.id)}
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900">{college.name}</div>
                    <div className="text-sm text-gray-500">
                      {college.code} - {college.district}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program Selection */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Select Programs</h4>
            <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
              {mockPrograms.map((program) => (
                <div key={program.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedPrograms.includes(program.id)}
                    onChange={() => handleProgramSelection(program.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900">{program.name}</div>
                    <div className="text-sm text-gray-500">
                      {program.code} - {program.degree} - Intake: {program.intake}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Allocation Details */}
        <div className="mt-6 space-y-4">
          <h4 className="text-md font-medium text-gray-900">Allocation Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="active">Active</option>
                <option value="pending">Pending Approval</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Allocation Notes</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add any notes or special instructions for this allocation..."
          />
        </div>

        {/* Summary */}
        {selectedCollege && selectedPrograms.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Allocation Summary</h5>
            <p className="text-sm text-blue-800">
              Allocating <strong>{selectedPrograms.length}</strong> program(s) to{' '}
              <strong>{mockColleges.find((c) => c.id === selectedCollege)?.name}</strong>
            </p>
            <div className="mt-2 text-xs text-blue-700">
              Selected Programs:{' '}
              {selectedPrograms.map((id) => mockPrograms.find((p) => p.id === id)?.code).join(', ')}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowNewAllocationModal(false)}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle new allocation creation
              console.log('Creating new allocation:', { selectedCollege, selectedPrograms });
              setShowNewAllocationModal(false);
              setSelectedCollege(null);
              setSelectedPrograms([]);
            }}
            disabled={!selectedCollege || selectedPrograms.length === 0}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Create Allocation
          </button>
        </div>
      </div>
    </div>
  );

  const CollegeDetailsModal = () => {
    const college = mockColleges.find((c) => c.id === selectedCollege);
    if (!college) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">College Details</h3>
            <button
              onClick={() => setShowCollegeDetailsModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">College Name:</span>
                    <span className="text-sm text-gray-900">{college.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">College Code:</span>
                    <span className="text-sm text-gray-900">{college.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className="text-sm text-gray-900">{college.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">District:</span>
                    <span className="text-sm text-gray-900">{college.district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Established:</span>
                    <span className="text-sm text-gray-900">{college.established}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Accreditation:</span>
                    <span className="text-sm text-gray-900">{college.accreditation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className="text-sm">{getStatusBadge(college.status)}</span>
                  </div>
                </div>
              </div>

              {/* Program Statistics */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Program Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{college.totalPrograms}</div>
                    <div className="text-sm text-blue-800">Total Programs</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {college.activePrograms}
                    </div>
                    <div className="text-sm text-green-800">Active Programs</div>
                  </div>
                </div>
              </div>

              {/* Current Programs */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Current Programs</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Program
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Intake
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockPrograms.slice(0, 3).map((program) => (
                        <tr key={program.id}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{program.name}</div>
                            <div className="text-sm text-gray-500">{program.code}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{program.intake}</td>
                          <td className="px-4 py-3">{getProgramStatusBadge(program.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Stats & Actions */}
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-lg font-semibold text-gray-900">
                      {college.totalStudents.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Students</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-lg font-semibold text-gray-900">85%</div>
                    <div className="text-sm text-gray-500">Placement Rate</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-lg font-semibold text-gray-900">4.2/5</div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowCollegeDetailsModal(false);
                      setShowProgramModal(true);
                    }}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Manage Programs
                  </button>
                  <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                    View Reports
                  </button>
                  <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                    Contact College
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Program approved - 2 days ago
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    New intake submitted - 1 week ago
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    Document updated - 2 weeks ago
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowCollegeDetailsModal(false)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Program Allocation</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and allocate academic programs to affiliated colleges
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Import
            </button>
            <button
              onClick={() => setShowNewAllocationModal(true)}
              className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Allocation
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Colleges</dt>
                  <dd className="text-lg font-medium text-gray-900">{mockColleges.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Programs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockColleges.reduce((sum, college) => sum + college.activePrograms, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockColleges
                      .reduce((sum, college) => sum + college.totalStudents, 0)
                      .toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Reviews</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mockColleges.filter((c) => c.status === 'pending_review').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search colleges by name, code, or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>

              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('table')}
                  className={`relative inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${
                    viewMode === 'table'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TableCellsIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`relative inline-flex items-center px-3 py-2 rounded-r-md border-t border-r border-b text-sm font-medium ${
                    viewMode === 'grid'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="aided">Aided</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Districts</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Trichy">Trichy</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Colleges ({filteredColleges.length})
            </h3>
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredColleges.length)} of{' '}
              {filteredColleges.length} results
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedColleges.length > 0 && (
            <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedColleges.length} college{selectedColleges.length > 1 ? 's' : ''}{' '}
                    selected
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-white border border-indigo-300 text-indigo-700 px-3 py-1 rounded text-sm font-medium hover:bg-indigo-50">
                    Bulk Program Assignment
                  </button>
                  <button className="bg-white border border-indigo-300 text-indigo-700 px-3 py-1 rounded text-sm font-medium hover:bg-indigo-50">
                    Export Selected
                  </button>
                  <button
                    onClick={() => setSelectedColleges([])}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedColleges.map((college) => (
                  <tr key={college.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedColleges.includes(college.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColleges([...selectedColleges, college.id]);
                          } else {
                            setSelectedColleges(selectedColleges.filter((id) => id !== college.id));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{college.name}</div>
                          <div className="text-sm text-gray-500">{college.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{college.type}</div>
                      <div className="text-sm text-gray-500">{college.district}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {college.activePrograms}/{college.totalPrograms}
                      </div>
                      <div className="text-sm text-gray-500">Active/Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {college.totalStudents.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(college.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCollege(college.id);
                            setShowProgramModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCollege(college.id);
                            setShowCollegeDetailsModal(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedColleges.map((college) => (
                <div
                  key={college.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <BuildingOffice2Icon className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{college.name}</h3>
                        <p className="text-sm text-gray-500">{college.code}</p>
                      </div>
                    </div>
                    {getStatusBadge(college.status)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-900">{college.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">District:</span>
                      <span className="text-gray-900">{college.district}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Programs:</span>
                      <span className="text-gray-900">
                        {college.activePrograms}/{college.totalPrograms}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Students:</span>
                      <span className="text-gray-900">
                        {college.totalStudents.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Accreditation:</span>
                      <span className="text-gray-900">{college.accreditation}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCollege(college.id);
                        setShowProgramModal(true);
                      }}
                      className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Manage Programs
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCollege(college.id);
                        setShowCollegeDetailsModal(true);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredColleges.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredColleges.length}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProgramModal && <ProgramModal />}
      {showAllocationModal && <AllocationModal />}
      {showNewAllocationModal && <NewAllocationModal />}
      {showCollegeDetailsModal && <CollegeDetailsModal />}
    </div>
  );
};

export default ProgramAllocation;
