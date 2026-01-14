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
  MagnifyingGlassIcon,
  BarsArrowDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Students/components/ui/card';
import { Button } from '../../../components/Students/components/ui/button';
import { Badge } from '../../../components/Students/components/ui/badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { curriculumApprovalService, type CurriculumApprovalDashboard } from '../../../services/curriculumApprovalService';
import { curriculumChangeRequestService } from '../../../services/curriculumChangeRequestService';
import { supabase } from '../../../lib/supabaseClient';

interface ApprovalFilters {
  status: string;
  collegeId: string;
  departmentId: string;
}

const SyllabusApproval: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'approvals' | 'changes'>('approvals');
  
  // Curriculum Approval states
  const [approvalRequests, setApprovalRequests] = useState<CurriculumApprovalDashboard[]>([]);
  
  // Change Request states
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [showChangeReviewModal, setShowChangeReviewModal] = useState(false);
  const [changeReviewNotes, setChangeReviewNotes] = useState('');
  const [changeReviewAction, setChangeReviewAction] = useState<'approve' | 'reject'>('approve');
  
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ApprovalFilters>({
    status: '', // Show all records by default instead of just pending
    collegeId: '',
    departmentId: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<CurriculumApprovalDashboard | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [showViewModal, setShowViewModal] = useState(false);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
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

  // Get current user's university ID from auth context
  const [universityId, setUniversityId] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch current user's organization ID
  useEffect(() => {
    const fetchUserUniversityId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('User not authenticated');
          setLoadingUser(false);
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('organizationId, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to load user data');
          setLoadingUser(false);
          return;
        }

        if (userData.role !== 'university_admin') {
          toast.error('Access denied: University admin role required');
          setLoadingUser(false);
          return;
        }

        if (!userData.organizationId) {
          toast.error('No university associated with your account');
          setLoadingUser(false);
          return;
        }

        setUniversityId(userData.organizationId);
        setLoadingUser(false);
      } catch (error) {
        console.error('Error in fetchUserUniversityId:', error);
        toast.error('Failed to load user information');
        setLoadingUser(false);
      }
    };

    fetchUserUniversityId();
  }, []);

  useEffect(() => {
    if (universityId && activeTab === 'approvals') {
      loadApprovalRequests();
      loadStatistics();
    } else if (universityId && activeTab === 'changes') {
      loadChangeRequests();
    }
  }, [filters, activeTab, universityId]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.status, sortBy]);

  const loadApprovalRequests = async () => {
    const startTime = Date.now();

    try {
      setLoading(true);
      
      // Handle the approved filter - include both 'approved' and 'published' statuses
      let statusFilter: string | undefined = filters.status;
      if (filters.status === 'approved') {
        // For "approved" filter, we need to get both approved and published records
        // since approved curricula are automatically published
        statusFilter = undefined; // We'll filter manually after fetching
      }
      
      const result = await curriculumApprovalService.getApprovalRequests(universityId, {
        status: statusFilter,
        collegeId: filters.collegeId || undefined,
        departmentId: filters.departmentId || undefined,
        limit: 50,
      });

      if (result.success) {
        let data = result.data || [];
        
        // Manual filtering for approved status (include both approved and published)
        if (filters.status === 'approved') {
          data = data.filter(item => item.request_status === 'approved' || item.request_status === 'published');
        }
        
        setApprovalRequests(data);
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
        // Adjust the statistics to combine approved and published counts
        const adjustedStats = {
          ...result.data,
          approved: result.data.approved + result.data.published, // Combine approved and published
        };
        setStatistics(adjustedStats);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadChangeRequests = async () => {
    const startTime = Date.now();

    try {
      setLoadingChanges(true);
      
      const result = await curriculumChangeRequestService.getAllPendingChangesForUniversity(universityId);

      if (result.success) {
        setChangeRequests(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load change requests');
      }

      // Ensure loader displays for at least 1 second
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } catch (error) {
      console.error('Error loading change requests:', error);
      toast.error('Failed to load change requests');
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
    } finally {
      setLoadingChanges(false);
    }
  };

  const handleReview = (request: CurriculumApprovalDashboard, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleViewCurriculum = async (request: CurriculumApprovalDashboard) => {
    setSelectedRequest(request);
    setShowViewModal(true);
    setLoadingCurriculum(true);
    setCurriculumData(null);

    try {
      // First, fetch the curriculum details
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('college_curriculums')
        .select('*')
        .eq('id', request.curriculum_id)
        .single();

      if (curriculumError) {
        console.error('Error fetching curriculum:', curriculumError);
        toast.error('Failed to load curriculum details');
        setLoadingCurriculum(false);
        return;
      }

      // Then fetch units separately
      const { data: unitsData, error: unitsError } = await supabase
        .from('college_curriculum_units')
        .select('*')
        .eq('curriculum_id', request.curriculum_id)
        .order('order_index', { ascending: true });

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        // Continue even if units fail - show curriculum without units
      }

      // Fetch outcomes for each unit
      const unitsWithOutcomes = await Promise.all(
        (unitsData || []).map(async (unit) => {
          const { data: outcomes, error: outcomesError } = await supabase
            .from('college_curriculum_outcomes')
            .select('*')
            .eq('unit_id', unit.id);

          if (outcomesError) {
            console.error('Error fetching outcomes for unit:', unit.id, outcomesError);
          }

          return {
            ...unit,
            college_curriculum_outcomes: outcomes || []
          };
        })
      );

      // Combine all data
      const completeData = {
        ...curriculumData,
        college_curriculum_units: unitsWithOutcomes
      };

      setCurriculumData(completeData);
    } catch (error) {
      console.error('Error loading curriculum:', error);
      toast.error('Failed to load curriculum details');
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const confirmReview = async () => {
    if (!selectedRequest) return;

    try {
      let result;
      if (reviewAction === 'approve') {
        result = await curriculumApprovalService.approveCurriculum(
          selectedRequest.curriculum_id,
          reviewNotes
        );
      } else {
        if (!reviewNotes.trim()) {
          toast.error('Please provide feedback for rejection');
          return;
        }
        result = await curriculumApprovalService.rejectCurriculum(
          selectedRequest.curriculum_id,
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
        
        // Reload data to reflect changes
        await loadApprovalRequests();
        await loadStatistics();
      } else {
        toast.error(result.error || `Failed to ${reviewAction} curriculum`);
      }
    } catch (error) {
      console.error(`Error ${reviewAction}ing curriculum:`, error);
      toast.error(`Failed to ${reviewAction} curriculum`);
    }
  };

  const handleReviewChange = (change: any, action: 'approve' | 'reject') => {
    setSelectedChange(change);
    setChangeReviewAction(action);
    setChangeReviewNotes('');
    setShowChangeReviewModal(true);
  };

  const confirmChangeReview = async () => {
    if (!selectedChange) return;

    try {
      let result;
      if (changeReviewAction === 'approve') {
        result = await curriculumChangeRequestService.approveChange(
          selectedChange.curriculum_id,
          selectedChange.change_id,
          changeReviewNotes
        );
      } else {
        if (!changeReviewNotes.trim()) {
          toast.error('Please provide feedback for rejection');
          return;
        }
        result = await curriculumChangeRequestService.rejectChange(
          selectedChange.curriculum_id,
          selectedChange.change_id,
          changeReviewNotes
        );
      }

      if (result.success) {
        toast.success(
          changeReviewAction === 'approve' 
            ? 'Change approved successfully!' 
            : 'Change rejected with feedback'
        );
        setShowChangeReviewModal(false);
        setSelectedChange(null);
        setChangeReviewNotes('');
        
        // Reload change requests
        await loadChangeRequests();
      } else {
        toast.error(result.error || `Failed to ${changeReviewAction} change`);
      }
    } catch (error) {
      console.error(`Error ${changeReviewAction}ing change:`, error);
      toast.error(`Failed to ${changeReviewAction} change`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, label: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XMarkIcon, label: 'Rejected' },
      published: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircleIcon, label: 'Published' },
      draft: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: DocumentTextIcon, label: 'Draft' },
      submitted: { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: ClockIcon, label: 'Submitted' },
      archived: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XMarkIcon, label: 'Archived' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_approval;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <Icon className="h-3.5 w-3.5 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getChangeTypeInfo = (changeType: string) => {
    const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
      unit_add: { icon: '➕', label: 'Add Unit', color: 'bg-green-100 text-green-800' },
      unit_edit: { icon: '📝', label: 'Edit Unit', color: 'bg-blue-100 text-blue-800' },
      unit_delete: { icon: '🗑️', label: 'Delete Unit', color: 'bg-red-100 text-red-800' },
      outcome_add: { icon: '➕', label: 'Add Outcome', color: 'bg-green-100 text-green-800' },
      outcome_edit: { icon: '📝', label: 'Edit Outcome', color: 'bg-blue-100 text-blue-800' },
      outcome_delete: { icon: '🗑️', label: 'Delete Outcome', color: 'bg-red-100 text-red-800' },
      curriculum_edit: { icon: '📋', label: 'Edit Curriculum', color: 'bg-purple-100 text-purple-800' },
    };

    return typeConfig[changeType] || { icon: '📄', label: changeType, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper function to get display date (request_date or published_date)
  const getDisplayDate = (request: CurriculumApprovalDashboard) => {
    return request.request_date || request.published_date || new Date().toISOString();
  };

  // Helper function to get display course name (course_name or program_name)
  const getDisplayCourseName = (request: CurriculumApprovalDashboard) => {
    return request.course_name || request.program_name || 'Untitled Course';
  };

  // Check if a request is new (submitted within last 24 hours)
  const isNewRequest = (request: CurriculumApprovalDashboard) => {
    const dateString = request.request_date || request.published_date;
    if (!dateString) return false;
    try {
      const reqDate = new Date(dateString);
      const now = new Date();
      const hoursDifference = (now.getTime() - reqDate.getTime()) / (1000 * 60 * 60);
      return hoursDifference <= 24;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return false;
    }
  };

  // Filter and search requests
  const filteredRequests = React.useMemo(() => {
    let filtered = approvalRequests.filter(request => {
      const matchesSearch = 
        (request.course_name || request.program_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.course_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.college_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.department_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.requester_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'college_name':
          return (a.college_name || '').localeCompare(b.college_name || '');
        case 'course_name':
          return (a.course_name || a.program_name || '').localeCompare(b.course_name || b.program_name || '');
        case 'request_date':
          return new Date(b.request_date || b.published_date || 0).getTime() - new Date(a.request_date || a.published_date || 0).getTime();
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
        {/* Loading User State */}
        {loadingUser && (
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
                <p className="text-lg font-semibold text-gray-700">Loading user information...</p>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* No University ID State */}
        {!loadingUser && !universityId && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <ExclamationTriangleIcon className="h-16 w-16 text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You must be a university admin to access this page.</p>
          </div>
        )}

        {/* Main Content - Only show when user is loaded and has universityId */}
        {!loadingUser && universityId && (
          <>
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
                    Review and approve curriculum submissions and change requests from affiliated colleges
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('approvals')}
                    className={`${
                      activeTab === 'approvals'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      <span>Curriculum Approvals</span>
                      {statistics.pending > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          {statistics.pending}
                        </Badge>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('changes')}
                    className={`${
                      activeTab === 'changes'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5" />
                      <span>Change Requests</span>
                      {changeRequests.length > 0 && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          {changeRequests.length}
                        </Badge>
                      )}
                    </div>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards - Only for Approvals Tab */}
        {!loading && activeTab === 'approvals' && (
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

        {/* Search and Filters - Only for Approvals Tab */}
        {!loading && activeTab === 'approvals' && (
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
                <option value="pending_approval">Pending Review</option>
                <option value="approved">Approved (Published)</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="archived">Archived</option>
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
              {(filters.status !== '' || searchTerm !== '' || sortBy !== 'request_date') && (
                <button
                  onClick={() => {
                    setFilters({ status: '', collegeId: '', departmentId: '' });
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

        {/* Empty State - Approvals */}
        {!loading && activeTab === 'approvals' && filteredRequests.length === 0 && (
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
        {!loading && activeTab === 'approvals' && viewMode === 'grid' && currentRequests.length > 0 && (
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
                    {isNewRequest(request) && (
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
                      <span className="text-xs font-medium text-gray-500">{request.course_code || 'N/A'}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{getDisplayCourseName(request)}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-grow flex flex-col">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        <span className="font-medium">{request.college_name || 'Unknown College'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>{request.department_name || 'Unknown Department'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDate(getDisplayDate(request))}</span>
                      </div>
                    </div>

                    {/* Requester Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {(request.requester_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Submitted by</p>
                        <p className="text-sm font-medium text-gray-900">{request.requester_name || 'Unknown User'}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      {request.request_status === 'pending_approval' && (
                        <>
                          <Button
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleReview(request, 'approve');
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2"
                          >
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={(e: React.MouseEvent) => {
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
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleViewCurriculum(request);
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
        {!loading && activeTab === 'approvals' && viewMode === 'list' && currentRequests.length > 0 && (
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
                        {isNewRequest(request) && (
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
                              <h3 className="text-xl font-bold text-gray-900">{getDisplayCourseName(request)}</h3>
                              {getStatusBadge(request.request_status)}
                            </div>
                            <p className="text-sm text-gray-500">Course Code: {request.course_code || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">College & Department</p>
                            <p className="text-sm text-gray-600">{request.college_name || 'Unknown College'}</p>
                            <p className="text-sm text-gray-600">{request.department_name || 'Unknown Department'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Submitted By</p>
                            <p className="text-sm text-gray-600">{request.requester_name || 'Unknown User'}</p>
                            <p className="text-sm text-gray-500">{request.requester_email || 'No email'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ClockIcon className="w-4 h-4" />
                            <span>Submitted {formatDate(getDisplayDate(request))}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {request.request_status === 'pending_approval' && (
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
                                handleViewCurriculum(request);
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

        {/* Pagination - Approvals */}
        {!loading && activeTab === 'approvals' && filteredRequests.length > 0 && totalPages > 1 && (
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

      {/* Change Requests Tab Content */}
      {!loading && activeTab === 'changes' && (
        <div className="space-y-6">
          {/* Change Requests Header */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Pending Change Requests</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Review changes to published curriculums submitted by college admins
                </p>
              </div>
            </div>
          </div>

          {/* Loading State for Changes */}
          {loadingChanges && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading change requests...</p>
            </div>
          )}

          {/* Empty State for Changes */}
          {!loadingChanges && changeRequests.length === 0 && (
            <Card className="text-center py-12 shadow-sm border border-gray-200">
              <CardContent>
                <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending change requests</h3>
                <p className="text-gray-600">
                  All change requests have been reviewed or there are no pending changes at this time.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Change Requests List */}
          {!loadingChanges && changeRequests.length > 0 && (
            <div className="space-y-4">
              {changeRequests.map((change) => {
                const typeInfo = getChangeTypeInfo(change.change_type);
                const changeData = change.change_data || {};
                
                return (
                  <motion.div
                    key={change.change_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Change Type Icon */}
                          <div className="w-full lg:w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 relative">
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {typeInfo.icon}
                            </div>
                          </div>

                          {/* Change Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h3 className="text-xl font-bold text-gray-900">{change.curriculum_name}</h3>
                                  <Badge className={`${typeInfo.color} border`}>
                                    {typeInfo.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">{change.college_name}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Requested By</p>
                                <p className="text-sm text-gray-600">{change.requester_name}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Request Date</p>
                                <p className="text-sm text-gray-600">{formatDate(change.change_timestamp)}</p>
                              </div>
                            </div>

                            {change.request_message && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">Reason for Change:</p>
                                <p className="text-sm text-gray-600">{change.request_message}</p>
                              </div>
                            )}

                            {/* Change Details Section */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <DocumentTextIcon className="h-4 w-4" />
                                Change Details
                              </h4>
                              
                              {/* For ADD operations */}
                              {(change.change_type === 'unit_add' || change.change_type === 'outcome_add') && changeData.data && (
                                <div className="space-y-2">
                                  <div className="bg-white rounded p-3 border border-blue-100">
                                    <p className="text-xs font-medium text-gray-500 mb-2">New {change.change_type === 'unit_add' ? 'Unit' : 'Outcome'}:</p>
                                    {change.change_type === 'unit_add' && (
                                      <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Name:</span> {changeData.data.name}</p>
                                        {changeData.data.code && <p><span className="font-medium">Code:</span> {changeData.data.code}</p>}
                                        {changeData.data.description && <p><span className="font-medium">Description:</span> {changeData.data.description}</p>}
                                        {changeData.data.credits && <p><span className="font-medium">Credits:</span> {changeData.data.credits}</p>}
                                      </div>
                                    )}
                                    {change.change_type === 'outcome_add' && (
                                      <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Outcome:</span> {changeData.data.outcome_text || changeData.data.outcome}</p>
                                        {changeData.data.bloom_level && <p><span className="font-medium">Bloom Level:</span> {changeData.data.bloom_level}</p>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* For EDIT operations */}
                              {(change.change_type === 'unit_edit' || change.change_type === 'outcome_edit' || change.change_type === 'curriculum_edit') && changeData.before && changeData.after && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-red-50 rounded p-3 border border-red-200">
                                    <p className="text-xs font-medium text-red-700 mb-2">Before:</p>
                                    <div className="space-y-1 text-sm text-gray-700">
                                      {Object.entries(changeData.before).map(([key, value]) => {
                                        if (changeData.after[key] !== value && typeof value !== 'object') {
                                          return (
                                            <p key={key} className="line-through">
                                              <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
                                            </p>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                  <div className="bg-green-50 rounded p-3 border border-green-200">
                                    <p className="text-xs font-medium text-green-700 mb-2">After:</p>
                                    <div className="space-y-1 text-sm text-gray-700">
                                      {Object.entries(changeData.after).map(([key, value]) => {
                                        if (changeData.before[key] !== value && typeof value !== 'object') {
                                          return (
                                            <p key={key} className="font-medium">
                                              <span className="capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
                                            </p>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* For DELETE operations */}
                              {(change.change_type === 'unit_delete' || change.change_type === 'outcome_delete') && changeData.data && (
                                <div className="space-y-2">
                                  <div className="bg-red-50 rounded p-3 border border-red-200">
                                    <p className="text-xs font-medium text-red-700 mb-2">{change.change_type === 'unit_delete' ? 'Unit' : 'Outcome'} to be Deleted:</p>
                                    {change.change_type === 'unit_delete' && (
                                      <div className="space-y-1 text-sm text-gray-700">
                                        <p><span className="font-medium">Name:</span> {changeData.data.name}</p>
                                        {changeData.data.code && <p><span className="font-medium">Code:</span> {changeData.data.code}</p>}
                                        {changeData.data.description && <p><span className="font-medium">Description:</span> {changeData.data.description}</p>}
                                      </div>
                                    )}
                                    {change.change_type === 'outcome_delete' && (
                                      <div className="space-y-1 text-sm text-gray-700">
                                        <p><span className="font-medium">Outcome:</span> {changeData.data.outcome_text || changeData.data.outcome}</p>
                                        {changeData.data.bloom_level && <p><span className="font-medium">Bloom Level:</span> {changeData.data.bloom_level}</p>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <ClockIcon className="w-4 h-4" />
                                <span>Submitted {formatDate(change.change_timestamp)}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleReviewChange(change, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                                >
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReviewChange(change, 'reject')}
                                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                                >
                                  <XMarkIcon className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                    {selectedRequest.course_code || 'N/A'} - {getDisplayCourseName(selectedRequest)}
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
                    <p><span className="font-medium">College:</span> {selectedRequest.college_name || 'Unknown College'}</p>
                    <p><span className="font-medium">Department:</span> {selectedRequest.department_name || 'Unknown Department'}</p>
                    <p><span className="font-medium">Program:</span> {selectedRequest.program_name || 'Unknown Program'}</p>
                    <p><span className="font-medium">Submitted by:</span> {selectedRequest.requester_name || 'Unknown User'}</p>
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

      {/* View Curriculum Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowViewModal(false)}
            />
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all max-h-[90vh] flex flex-col">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 flex-shrink-0">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Curriculum Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedRequest.course_code || 'N/A'} - {getDisplayCourseName(selectedRequest)}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {loadingCurriculum ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading curriculum details...</p>
                  </div>
                ) : curriculumData ? (
                  <div className="space-y-6">
                    {/* Curriculum Header */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Academic Year</p>
                          <p className="text-lg font-semibold text-gray-900">{curriculumData.academic_year}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Semester</p>
                          <p className="text-lg font-semibold text-gray-900">Semester {curriculumData.semester}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Department</p>
                          <p className="text-lg font-semibold text-gray-900">{selectedRequest.department_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Program</p>
                          <p className="text-lg font-semibold text-gray-900">{selectedRequest.program_name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Units/Modules */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                        Units & Learning Outcomes
                        <span className="text-sm font-normal text-gray-500">
                          ({curriculumData.college_curriculum_units?.length || 0} units)
                        </span>
                      </h3>

                      {curriculumData.college_curriculum_units && curriculumData.college_curriculum_units.length > 0 ? (
                        <div className="space-y-4">
                          {curriculumData.college_curriculum_units
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .map((unit: any, index: number) => (
                              <div key={unit.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-semibold">
                                          {index + 1}
                                        </span>
                                        <h4 className="font-semibold text-gray-900">{unit.name}</h4>
                                        {unit.code && (
                                          <span className="text-xs text-gray-500">({unit.code})</span>
                                        )}
                                      </div>
                                      {unit.description && (
                                        <p className="text-sm text-gray-600 mt-1 ml-8">{unit.description}</p>
                                      )}
                                    </div>
                                    <div className="flex gap-3 text-xs text-gray-500 ml-4">
                                      {unit.credits && (
                                        <span className="bg-white px-2 py-1 rounded border border-gray-200">
                                          {unit.credits} credits
                                        </span>
                                      )}
                                      {unit.estimated_duration && (
                                        <span className="bg-white px-2 py-1 rounded border border-gray-200">
                                          {unit.estimated_duration} {unit.duration_unit || 'hours'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Learning Outcomes */}
                                {unit.college_curriculum_outcomes && unit.college_curriculum_outcomes.length > 0 && (
                                  <div className="px-4 py-3 bg-white">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Learning Outcomes:</p>
                                    <ul className="space-y-3">
                                      {unit.college_curriculum_outcomes.map((outcome: any, idx: number) => (
                                        <li key={outcome.id} className="flex gap-2">
                                          <span className="text-xs text-indigo-600 font-medium flex-shrink-0 leading-relaxed">{idx + 1}.</span>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-xs text-gray-700 flex-1 min-w-0 leading-relaxed">{outcome.outcome_text || outcome.outcome}</span>
                                              {outcome.bloom_level && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0">
                                                  {outcome.bloom_level}
                                                </span>
                                              )}
                                            </div>
                                            {outcome.assessment_mappings && outcome.assessment_mappings.length > 0 && (
                                              <div className="flex gap-1 mt-2 flex-wrap">
                                                {outcome.assessment_mappings.map((mapping: any, mIdx: number) => (
                                                  <span key={mIdx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                    {mapping.assessmentType}
                                                    {mapping.weightage && ` (${mapping.weightage}%)`}
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No units defined for this curriculum</p>
                        </div>
                      )}
                    </div>

                    {/* Total Credits Summary */}
                    {curriculumData.college_curriculum_units && curriculumData.college_curriculum_units.length > 0 && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Total Credits:</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            {curriculumData.college_curriculum_units.reduce((sum: number, unit: any) => sum + (unit.credits || 0), 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Failed to load curriculum details</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Review Modal */}
      {showChangeReviewModal && selectedChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowChangeReviewModal(false)}
            />
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {changeReviewAction === 'approve' ? 'Approve Change Request' : 'Reject Change Request'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedChange.curriculum_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowChangeReviewModal(false)}
                  className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Change Details</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Type:</span> {getChangeTypeInfo(selectedChange.change_type).label}</p>
                    <p><span className="font-medium">College:</span> {selectedChange.college_name}</p>
                    <p><span className="font-medium">Curriculum:</span> {selectedChange.curriculum_name}</p>
                    <p><span className="font-medium">Requested by:</span> {selectedChange.requester_name}</p>
                    {selectedChange.request_message && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="font-medium mb-1">Reason:</p>
                        <p className="text-gray-700">{selectedChange.request_message}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {changeReviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Feedback (Required)'}
                  </label>
                  <textarea
                    value={changeReviewNotes}
                    onChange={(e) => setChangeReviewNotes(e.target.value)}
                    placeholder={
                      changeReviewAction === 'approve'
                        ? 'Add any notes about the approval...'
                        : 'Please provide specific feedback about why this change is being rejected...'
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                  />
                </div>

                {changeReviewAction === 'approve' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Upon approval:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• The change will be applied to the published curriculum</li>
                          <li>• The college admin will be notified</li>
                          <li>• The change will be visible to students and faculty</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {changeReviewAction === 'reject' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Upon rejection:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• The change request will be discarded</li>
                          <li>• The college admin will receive your feedback</li>
                          <li>• The published curriculum remains unchanged</li>
                          <li>• They can submit a new change request if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowChangeReviewModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmChangeReview}
                    className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      changeReviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {changeReviewAction === 'approve' ? 'Approve Change' : 'Reject with Feedback'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

          </>
        )}
      </div>
    </div>
  );
};

export default SyllabusApproval;