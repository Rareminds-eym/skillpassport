import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Certificate {
  id: string;
  studentName: string;
  studentId: string;
  program: string;
  college: string;
  certificateType: 'degree' | 'diploma' | 'completion' | 'achievement';
  issueDate: string;
  status: 'pending' | 'issued' | 'rejected';
  grade?: string;
  cgpa?: number;
  completionDate: string;
  certificateNumber?: string;
}

interface CertificateStats {
  total: number;
  pending: number;
  issued: number;
  rejected: number;
}

const StudentCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState<CertificateStats>({
    total: 0,
    pending: 0,
    issued: 0,
    rejected: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockCertificates: Certificate[] = [
      {
        id: '1',
        studentName: 'Rajesh Kumar',
        studentId: 'ST001',
        program: 'B.Tech Computer Science',
        college: 'Government College of Engineering',
        certificateType: 'degree',
        issueDate: '2024-06-15',
        status: 'issued',
        grade: 'First Class',
        cgpa: 8.5,
        completionDate: '2024-05-30',
        certificateNumber: 'CERT-2024-001',
      },
      {
        id: '2',
        studentName: 'Priya Sharma',
        studentId: 'ST002',
        program: 'Diploma in Data Science',
        college: 'Government Polytechnic College',
        certificateType: 'diploma',
        issueDate: '',
        status: 'pending',
        grade: 'Distinction',
        cgpa: 9.2,
        completionDate: '2024-12-20',
      },
      {
        id: '3',
        studentName: 'Arjun Patel',
        studentId: 'ST003',
        program: 'Certificate in AI/ML',
        college: 'Technical Training Institute',
        certificateType: 'completion',
        issueDate: '2024-11-10',
        status: 'issued',
        completionDate: '2024-10-25',
        certificateNumber: 'CERT-2024-002',
      },
      {
        id: '4',
        studentName: 'Sneha Reddy',
        studentId: 'ST004',
        program: 'B.Sc Mathematics',
        college: 'Government Arts and Science College',
        certificateType: 'degree',
        issueDate: '',
        status: 'pending',
        grade: 'Second Class',
        cgpa: 7.8,
        completionDate: '2024-04-15',
      },
      {
        id: '5',
        studentName: 'Vikram Singh',
        studentId: 'ST005',
        program: 'Excellence in Sports',
        college: 'Government College of Engineering',
        certificateType: 'achievement',
        issueDate: '',
        status: 'rejected',
        completionDate: '2024-03-10',
      },
    ];

    setCertificates(mockCertificates);
    setFilteredCertificates(mockCertificates);
    
    // Calculate stats
    const newStats = {
      total: mockCertificates.length,
      pending: mockCertificates.filter(c => c.status === 'pending').length,
      issued: mockCertificates.filter(c => c.status === 'issued').length,
      rejected: mockCertificates.filter(c => c.status === 'rejected').length,
    };
    setStats(newStats);
    setLoading(false);
  }, []);

  // Filter certificates based on search and filters
  useEffect(() => {
    let filtered = certificates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.college.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cert => cert.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(cert => cert.certificateType === typeFilter);
    }

    // College filter
    if (collegeFilter !== 'all') {
      filtered = filtered.filter(cert => cert.college === collegeFilter);
    }

    setFilteredCertificates(filtered);
  }, [certificates, searchTerm, statusFilter, typeFilter, collegeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'issued':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getCertificateTypeIcon = (type: string) => {
    switch (type) {
      case 'degree':
        return <AcademicCapIcon className="h-5 w-5 text-blue-500" />;
      case 'diploma':
        return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case 'completion':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'achievement':
        return <DocumentTextIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleStatusUpdate = (certificateId: string, newStatus: 'pending' | 'issued' | 'rejected') => {
    setCertificates(prev => prev.map(cert => 
      cert.id === certificateId 
        ? { 
            ...cert, 
            status: newStatus,
            issueDate: newStatus === 'issued' ? new Date().toISOString().split('T')[0] : '',
            certificateNumber: newStatus === 'issued' && !cert.certificateNumber 
              ? `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
              : cert.certificateNumber
          }
        : cert
    ));
    
    // Update stats
    const updatedCertificates = certificates.map(cert => 
      cert.id === certificateId 
        ? { ...cert, status: newStatus }
        : cert
    );
    
    const newStats = {
      total: updatedCertificates.length,
      pending: updatedCertificates.filter(c => c.status === 'pending').length,
      issued: updatedCertificates.filter(c => c.status === 'issued').length,
      rejected: updatedCertificates.filter(c => c.status === 'rejected').length,
    };
    setStats(newStats);
  };

  const handleStatusClick = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowStatusModal(true);
  };

  const handleStatusModalUpdate = (newStatus: 'pending' | 'issued' | 'rejected') => {
    if (selectedCertificate) {
      handleStatusUpdate(selectedCertificate.id, newStatus);
      setShowStatusModal(false);
      setSelectedCertificate(null);
    }
  };

  const uniqueColleges = Array.from(new Set(certificates.map(cert => cert.college)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Certificates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and issue certificates for students across all affiliated colleges
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export Report
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Generate Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Certificates</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Issued</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.issued}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.rejected}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students, programs..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="issued">Issued</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Type Filter */}
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="degree">Degree</option>
            <option value="diploma">Diploma</option>
            <option value="completion">Completion</option>
            <option value="achievement">Achievement</option>
          </select>

          {/* College Filter */}
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          >
            <option value="all">All Colleges</option>
            {uniqueColleges.map(college => (
              <option key={college} value={college}>{college}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Certificates ({filteredCertificates.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCertificates.map((certificate) => (
                <tr key={certificate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {certificate.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {certificate.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{certificate.program}</div>
                    {certificate.grade && (
                      <div className="text-sm text-gray-500">
                        {certificate.grade} {certificate.cgpa && `(CGPA: ${certificate.cgpa})`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificate.college}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCertificateTypeIcon(certificate.certificateType)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {certificate.certificateType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center cursor-pointer hover:bg-blue-50 rounded-md p-2 transition-colors duration-200 border border-transparent hover:border-blue-200"
                      onClick={() => handleStatusClick(certificate)}
                      title="Click to change status"
                    >
                      {getStatusIcon(certificate.status)}
                      <span className={`ml-2 ${getStatusBadge(certificate.status)}`}>
                        {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {new Date(certificate.completionDate).toLocaleDateString()}
                    </div>
                    {certificate.issueDate && (
                      <div className="text-xs text-gray-500">
                        Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {certificate.status === 'issued' && (
                        <button className="text-green-600 hover:text-green-900">
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCertificates.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedCertificate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Update Certificate Status</h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{selectedCertificate.studentName}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">ID:</span> {selectedCertificate.studentId}</p>
                      <p><span className="font-medium">Program:</span> {selectedCertificate.program}</p>
                      <p><span className="font-medium">College:</span> {selectedCertificate.college}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select New Status
                  </label>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStatusModalUpdate('pending')}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg hover:bg-yellow-50 transition-colors ${
                        selectedCertificate.status === 'pending' ? 'border-yellow-300 bg-yellow-50 ring-2 ring-yellow-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-yellow-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">Pending</div>
                          <div className="text-sm text-gray-500">Certificate is under review</div>
                        </div>
                      </div>
                      {selectedCertificate.status === 'pending' && (
                        <CheckCircleIcon className="h-5 w-5 text-yellow-500" />
                      )}
                    </button>

                    <button
                      onClick={() => handleStatusModalUpdate('issued')}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg hover:bg-green-50 transition-colors ${
                        selectedCertificate.status === 'issued' ? 'border-green-300 bg-green-50 ring-2 ring-green-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">Issued</div>
                          <div className="text-sm text-gray-500">Certificate has been issued to student</div>
                        </div>
                      </div>
                      {selectedCertificate.status === 'issued' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                    </button>

                    <button
                      onClick={() => handleStatusModalUpdate('rejected')}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg hover:bg-red-50 transition-colors ${
                        selectedCertificate.status === 'rejected' ? 'border-red-300 bg-red-50 ring-2 ring-red-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">Rejected</div>
                          <div className="text-sm text-gray-500">Certificate request has been rejected</div>
                        </div>
                      </div>
                      {selectedCertificate.status === 'rejected' && (
                        <CheckCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;