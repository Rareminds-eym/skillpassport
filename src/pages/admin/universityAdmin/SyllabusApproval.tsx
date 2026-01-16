import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  BarsArrowDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Students/components/ui/card';
import { Button } from '../../../components/Students/components/ui/button';
import { Badge } from '../../../components/Students/components/ui/badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { curriculumApprovalService, type CurriculumApprovalDashboard } from '../../../services/curriculumApprovalService';

interface ApprovalFilters {
  status: string;
  collegeId: string;
  departmentId: string;
}

const SyllabusApproval: React.FC = () => {
  const [approvalRequests, setApprovalRequests] = useState<CurriculumApprovalDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ApprovalFilters>({
    status: 'pending',
    collegeId: '',
    departmentId: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<CurriculumApprovalDashboard | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    published: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('request_date'); // 'request_date', 'college_name', 'course_name'
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 6;

  // Get current user's university ID (mock for now)
  const [universityId] = useState('mock-university-id'); // Replace with actual auth

  useEffect(() => {
    loadApprovalRequests();
    loadStatistics();
  }, [filters]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.status, sortBy]);

  const loadApprovalRequests = async () => {
    const startTime = Date.now();

    try {
      setLoading(true);
      const result = await curriculumApprovalService.getApprovalRequests(universityId, {
        status: filters.status || undefined,
        collegeId: filters.collegeId || undefined,
        departmentId: filters.departmentId || undefined,
        limit: 50,
      });

      if (result.success) {
        setApprovalRequests(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load approval requests');
      }

      // Ensure loader displays for at least 1 second
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error('Error loading approval requests:', error);
      toast.error('Failed to load approval requests');
      
      // Still wait for 1 second even on error
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await curriculumApprovalService.getApprovalStatistics(universityId);
      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleReview = (request: CurriculumApprovalDashboard, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedRequest) return;

    try {
      let result;
      if (reviewAction === 'approve') {
        result = await curriculumApprovalService.approveCurriculum(
          selectedRequest.request_id,
          reviewNotes
        );
      } else {
        if (!reviewNotes.trim()) {
          toast.error('Please provide feedback for rejection');
          return;
        }
        result = await curriculumApprovalService.rejectCurriculum(
          selectedRequest.request_id,
          reviewNotes
        );
      }

      if (result.success) {
        toast.success(
          reviewAction === 'approve' 
            ? 'Curriculum approved and published successfully!' 
            : 'Curriculum rejected with feedback'
        );
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewNotes('');
        loadApprovalRequests();
        loadStatistics();
      } else {
        toast.error(result.error || `Failed to ${reviewAction} curriculum`);
      }
    } catch (error) {
      console.error(`Error ${reviewAction}ing curriculum:`, error);
      toast.error(`Failed to ${reviewAction} curriculum`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, label: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XMarkIcon, label: 'Rejected' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <Icon className="h-3.5 w-3.5 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if a request is new (submitted within last 24 hours)
  const isNewRequest = (requestDate: string) => {
    if (!requestDate) return false;
    const reqDate = new Date(requestDate);
    const now = new Date();
    const hoursDifference = (now.getTime() - reqDate.getTime()) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  };

  // Filter and search requests
  const filteredRequests = React.useMemo(() => {
    let filtered = approvalRequests.filter(request => {
      const matchesSearch = 
        request.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.college_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester_name.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'college_name':
          return a.college_name.localeCompare(b.college_name);
        case 'course_name':
          return a.course_name.localeCompare(b.course_name);
        case 'request_date':
          return new Date(b.request_date).getTime() - new Date(a.request_date).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [approvalRequests, searchTerm, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1, 2, 3);
      if (totalPages > 3) {
        if (currentPage > 4) {
          pages.push('...');
        }
        if (currentPage > 3 && currentPage < totalPages) {
          pages.push(currentPage);
        }
        if (currentPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="relative">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                <img
                  src="/assets/HomePage/RMLogo.webp"
                  alt="RareMinds Logo"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <p className="text-xl font-semibold text-gray-800 mb-2">Loading Approval Requests...</p>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  Powered by <span className="font-semibold text-indigo-600">RareMinds</span>
                </p>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Header */}
        {!loading && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-600">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="font-bold text-2xl text-indigo-600">
                    Syllabus Approval
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Review and approve curriculum submissions from affiliated colleges
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XMarkIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold text-indigo-600">{statistics.published}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        {!loading && (
          <div className="mb-6 flex flex-col lg:flex-row items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 w-full relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by course, college, department, or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 items-center w-full lg:w-auto flex-wrap">
              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="h-12 px-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex-1 lg:flex-none lg:min-w-[150px]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Sort By Filter */}
              <div className="relative flex-1 lg:flex-none lg:min-w-[150px]">
                <BarsArrowDownIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-12 pl-10 pr-4 w-full bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  <option value="request_date">Newest First</option>
                  <option value="college_name">College (A-Z)</option>
                  <option value="course_name">Course (A-Z)</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden h-12 bg-white shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Clear Filters Button */}
              {(filters.status !== 'pending' || searchTerm !== '' || sortBy !== 'request_date') && (
                <button
                  onClick={() => {
                    setFilters({ status: 'pending', collegeId: '', departmentId: '' });
                    setSearchTerm('');
                    setSortBy('request_date');
                  }}
                  className="h-12 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRequests.length === 0 && (
          <Card className="text-center py-12 shadow-sm border border-gray-200">
            <CardContent>
              <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No approval requests found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No curriculum approval requests match your current filters.'}
              </p>
            </CardContent>
          </Card>
        )}
        {/* Approval Requests Grid View */}
        {!loading && viewMode === 'grid' && currentRequests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentRequests.map((request) => (
              <motion.div
                key={request.request_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden group flex flex-col">
                  {/* Course Header */}
                  <div className="h-32 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 relative flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                      <AcademicCapIcon className="h-12 w-12 text-white opacity-90" />
                    </div>
                    {/* NEW Badge */}
                    {isNewRequest(request.request_date) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 left-2"
                      >
                        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg font-semibold px-3 py-1">
                          NEW
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex gap-2 flex-wrap">
                        {getStatusBadge(request.request_status)}
                      </div>
                      <span className="text-xs font-medium text-gray-500">{request.course_code}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{request.course_name}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-grow flex flex-col">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span className="font-medium">{request.college_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>{request.department_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDate(request.request_date)}</span>
                      </div>
                    </div>

                    {/* Requester Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {request.requester_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Submitted by</p>
                        <p className="text-sm font-medium text-gray-900">{request.requester_name}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      {request.request_status === 'pending' && (
                        <>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(request, 'approve');
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2"
                          >
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(request, 'reject');
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2"
                          >
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Curriculum preview coming soon');
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-2"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Approval Requests List View */}
        {!loading && viewMode === 'list' && currentRequests.length > 0 && (
          <div className="space-y-4">
            {currentRequests.map((request) => (
              <motion.div
                key={request.request_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="cursor-pointer"
              >
                <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Course Icon */}
                      <div className="w-full lg:w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                          <AcademicCapIcon className="h-8 w-8 text-white opacity-90" />
                        </div>
                        {/* NEW Badge */}
                        {isNewRequest(request.request_date) && (
                          <div className="absolute top-1 left-1">
                            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg font-semibold px-2 py-0.5 text-xs">
                              NEW
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Request Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900">{request.course_name}</h3>
                              {getStatusBadge(request.request_status)}
                            </div>
                            <p className="text-sm text-gray-500">Course Code: {request.course_code}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">College & Department</p>
                            <p className="text-sm text-gray-600">{request.college_name}</p>
                            <p className="text-sm text-gray-600">{request.department_name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Submitted By</p>
                            <p className="text-sm text-gray-600">{request.requester_name}</p>
                            <p className="text-sm text-gray-500">{request.requester_email}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ClockIcon className="w-4 h-4" />
                            <span>Submitted {formatDate(request.request_date)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {request.request_status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleReview(request, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                                >
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReview(request, 'reject')}
                                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                                >
                                  <XMarkIcon className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              onClick={() => {
                                toast.info('Curriculum preview coming soon');
                              }}
                              className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredRequests.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex justify-center items-center gap-2"
          >
            {/* Previous Button */}
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>

            {/* Page Numbers */}
            <div className="flex gap-2">
              {getPageNumbers().map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <Button
                      onClick={() => setCurrentPage(pageNum as number)}
                      className={`px-4 py-2 min-w-[40px] ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next Button */}
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>

            {/* Page Info */}
            <span className="ml-4 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
          </motion.div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowReviewModal(false)}
            />
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {reviewAction === 'approve' ? 'Approve Curriculum' : 'Reject Curriculum'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedRequest.course_code} - {selectedRequest.course_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Curriculum Details</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">College:</span> {selectedRequest.college_name}</p>
                    <p><span className="font-medium">Department:</span> {selectedRequest.department_name}</p>
                    <p><span className="font-medium">Program:</span> {selectedRequest.program_name}</p>
                    <p><span className="font-medium">Submitted by:</span> {selectedRequest.requester_name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Feedback (Required)'}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Add any notes about the approval...'
                        : 'Please provide specific feedback about what needs to be improved...'
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                  />
                </div>

                {reviewAction === 'approve' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Upon approval:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• The curriculum will be automatically published</li>
                          <li>• The college will be notified of the approval</li>
                          <li>• Students and faculty will have access to the curriculum</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {reviewAction === 'reject' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Upon rejection:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• The curriculum will be returned to draft status</li>
                          <li>• The college will receive your feedback</li>
                          <li>• They can make changes and resubmit for approval</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReview}
                    className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {reviewAction === 'approve' ? 'Approve & Publish' : 'Reject with Feedback'}
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

export default SyllabusApproval;