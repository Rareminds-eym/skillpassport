import React, { useState, useEffect } from 'react';
import AppliedJobsService from '../../services/appliedJobsService';
import { EyeIcon, ChatBubbleLeftIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  department: string;
  university: string;
  cgpa?: string;
  year_of_passing?: string;
  verified: boolean;
  employability_score?: number;
}

interface Opportunity {
  id: number;
  job_title: string;
  title: string;
  company_name: string;
  department: string;
  location: string;
  employment_type: string;
  experience_level: string;
}

interface Applicant {
  id: number;
  student_id: string;
  opportunity_id: number;
  application_status: string;
  applied_at: string;
  viewed_at?: string;
  responded_at?: string;
  interview_scheduled_at?: string;
  notes?: string;
  student: Student;
  opportunity: Opportunity;
}

const ApplicantsList: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      // Fetch all applicants from applied_jobs table
      const applicantsData = await AppliedJobsService.getAllApplicants();
      setApplicants(applicantsData || []);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string; icon: string } } = {
      applied: { label: 'Applied', color: 'bg-indigo-100 text-indigo-700', icon: '○' },
      viewed: { label: 'Viewed', color: 'bg-blue-100 text-blue-700', icon: '👁' },
      under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: '📝' },
      interview_scheduled: { label: 'Interview Scheduled', color: 'bg-blue-100 text-blue-700', icon: '📅' },
      interviewed: { label: 'Interviewed', color: 'bg-purple-100 text-purple-700', icon: '✓' },
      offer_received: { label: 'Offer Received', color: 'bg-orange-100 text-orange-700', icon: '📋' },
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: '✓' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '✗' },
      withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-700', icon: '←' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700', icon: '' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return '1 week ago';
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getExperienceYears = (applicant: Applicant) => {
    const yearOfPassing = applicant.student?.year_of_passing;
    if (!yearOfPassing) return 'N/A';
    
    const currentYear = new Date().getFullYear();
    const passingYear = parseInt(yearOfPassing);
    const years = currentYear - passingYear;
    
    if (years <= 0) return 'Fresher';
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  const renderStars = (score: number = 0) => {
    // Convert employability_score (0-100) to 5-star rating
    const rating = Math.round((score / 100) * 5);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const filteredApplicants = applicants.filter((applicant) => {
    // Filter by search term
    const matchesSearch = 
      applicant.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.opportunity?.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.opportunity?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || applicant.application_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'name':
        return (a.student?.name || '').localeCompare(b.student?.name || '') * multiplier;
      case 'date':
        return (new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()) * multiplier;
      case 'rating':
        return ((a.student?.employability_score || 0) - (b.student?.employability_score || 0)) * multiplier;
      default:
        return 0;
    }
  });

  const paginatedApplicants = sortedApplicants.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const totalPages = Math.ceil(sortedApplicants.length / entriesPerPage);

  const exportToCSV = () => {
    const headers = ['Candidate', 'Email', 'Position', 'Status', 'Applied'];
    const rows = sortedApplicants.map(applicant => [
      applicant.student?.name || '',
      applicant.student?.email || '',
      applicant.opportunity?.job_title || applicant.opportunity?.title || '',
      applicant.application_status,
      getTimeAgo(applicant.applied_at)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applicants List</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sortedApplicants.length} applicant{sortedApplicants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export As CSV
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          {/* Results Count */}
          {sortedApplicants.length > 0 && (
            <div className="hidden md:flex items-center px-3 py-2 bg-gray-100 rounded-md text-xs text-gray-600">
              <span className="font-medium">{sortedApplicants.length}</span>
              <span className="mx-1">results</span>
              <span className="mx-1">•</span>
              <span>sorted by</span>
              <span className="ml-1 font-medium">
                {sortBy === 'name' ? 'Name' :
                 sortBy === 'date' ? 'Date Added' :
                 sortBy === 'rating' ? 'Rating' : sortBy}
              </span>
            </div>
          )}
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="viewed">Viewed</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="interviewed">Interviewed</option>
            <option value="offer_received">Offer Received</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'rating')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="date">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="rating">Highest Rating</option>
          </select>

          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value={10}>Show 10</option>
            <option value={25}>Show 25</option>
            <option value={50}>Show 50</option>
            <option value={100}>Show 100</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                  Candidate ▲
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedApplicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applicants found
                  </td>
                </tr>
              ) : (
                paginatedApplicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {applicant.student?.photo ? (
                            <img
                              src={applicant.student.photo}
                              alt={applicant.student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                              {applicant.student?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {applicant.student?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {applicant.student?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {applicant.opportunity?.job_title || applicant.opportunity?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(applicant.application_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTimeAgo(applicant.applied_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-primary-600 border border-primary-600 rounded hover:bg-primary-50 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 border border-green-600 rounded hover:bg-green-50 transition-colors"
                          title="Send Message"
                        >
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, sortedApplicants.length)} of{' '}
            {sortedApplicants.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded text-sm ${
                  currentPage === page
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ApplicantsList;

