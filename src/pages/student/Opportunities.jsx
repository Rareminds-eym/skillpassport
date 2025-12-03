import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  ChevronDown,
  Grid3x3,
  List,
  MapPin,
  Clock,
  X,
  Briefcase,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useOpportunities } from '../../hooks/useOpportunities';
import AppliedJobsService from '../../services/appliedJobsService';
import SavedJobsService from '../../services/savedJobsService';
import SearchHistoryService from '../../services/searchHistoryService';
import OpportunityCard from '../../components/Students/components/OpportunityCard';
import OpportunityListItem from '../../components/Students/components/OpportunityListItem';
import OpportunityPreview from '../../components/Students/components/OpportunityPreview';
import AdvancedFilters from '../../components/Students/components/AdvancedFilters';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '../../components/Students/components/ui/pagination';

// Import Applications component content
import StudentPipelineService from '../../services/studentPipelineService';
import MessageService from '../../services/messageService';
import useMessageNotifications from '../../hooks/useMessageNotifications';
import { supabase } from '../../lib/supabaseClient';

const Opportunities = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData } = useStudentDataByEmail(userEmail);
  const studentId = user?.id || studentData?.id;

  // Left sidebar tab state
  const [activeTab, setActiveTab] = useState('my-jobs'); // 'my-jobs' or 'my-applications'

  // My Jobs state (existing opportunities logic)
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    employmentType: [],
    experienceLevel: [],
    mode: [],
    salaryMin: '',
    salaryMax: '',
    skills: [],
    department: [],
    postedWithin: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const opportunitiesPerPage = 12;

  // My Applications state
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPipelineStatus, setShowPipelineStatus] = useState({});
  const [messagingApplicationId, setMessagingApplicationId] = useState(null);

  // Fetch opportunities
  const { opportunities, loading, error } = useOpportunities({ 
    fetchOnMount: true,
    activeOnly: true 
  });

  useMessageNotifications({
    userId: studentId,
    userType: 'student',
    enabled: !!studentId
  });

  // Load applied and saved jobs
  useEffect(() => {
    const loadJobsData = async () => {
      if (!studentId) return;
      
      try {
        const [applicationsData, savedIds] = await Promise.all([
          AppliedJobsService.getStudentApplications(studentId),
          SavedJobsService.getSavedJobIds(studentId)
        ]);
        
        setAppliedJobs(new Set(applicationsData.map(app => app.opportunity_id)));
        setSavedJobs(new Set(savedIds));
      } catch (error) {
        console.error('Error loading jobs data:', error);
      }
    };

    loadJobsData();
  }, [studentId]);

  // Fetch applications with pipeline status
  useEffect(() => {
    const fetchApplications = async () => {
      if (!studentId || activeTab !== 'my-applications') return;

      try {
        const applicationsData = await StudentPipelineService.getStudentApplicationsWithPipeline(
          studentId,
          userEmail
        );

        const transformedApplications = applicationsData.map(app => ({
          id: app.id,
          studentId: app.student_id,
          jobTitle: app.opportunity?.job_title || app.opportunity?.title || 'N/A',
          company: app.opportunity?.company_name || 'N/A',
          location: app.opportunity?.location || 'N/A',
          salary: app.opportunity?.salary_range_min && app.opportunity?.salary_range_max
            ? `₹${(app.opportunity.salary_range_min / 1000).toFixed(0)}k - ₹${(app.opportunity.salary_range_max / 1000).toFixed(0)}k`
            : 'Not specified',
          appliedDate: app.applied_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: app.application_status,
          logo: app.opportunity?.company_logo,
          type: app.opportunity?.employment_type || 'N/A',
          level: app.opportunity?.experience_level || app.opportunity?.department || 'N/A',
          lastUpdate: formatLastUpdate(app.updated_at || app.applied_at),
          opportunityId: app.opportunity_id,
          recruiterId: app.opportunity?.recruiter_id || app.pipeline_recruiter_id || app.pipeline_status?.assigned_to || null,
          pipelineStatus: app.pipeline_status,
          hasPipelineStatus: app.has_pipeline_status,
          pipelineStage: app.pipeline_stage,
          pipelineStageChangedAt: app.pipeline_stage_changed_at,
          rejectionReason: app.rejection_reason,
          nextAction: app.next_action,
          nextActionDate: app.next_action_date,
          interviews: app.interviews || []
        }));

        setApplications(transformedApplications);
        setFilteredApplications(transformedApplications);
      } catch (err) {
        console.error('Error fetching applications:', err);
      }
    };

    fetchApplications();
  }, [studentId, userEmail, activeTab]);

  const formatLastUpdate = (dateString) => {
    if (!dateString) return 'Recently';
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApplications(filtered);
  }, [searchQuery, statusFilter, applications]);

  // Filter and sort opportunities for My Jobs tab
  const filteredAndSortedOpportunities = React.useMemo(() => {
    let filtered = opportunities.filter(opp => {
      const matchesSearch = 
        opp.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply advanced filters (keeping existing logic)
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.posted_date || b.created_at) - new Date(a.posted_date || a.created_at);
      }
      return 0;
    });
  }, [opportunities, searchTerm, sortBy]);

  const handleToggleSave = async (opportunity) => {
    if (!studentId) {
      alert('Please log in to save jobs');
      return;
    }

    try {
      const result = await SavedJobsService.toggleSaveJob(studentId, opportunity.id);
      
      if (result.success) {
        if (result.isSaved) {
          setSavedJobs(prev => new Set([...prev, opportunity.id]));
        } else {
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(opportunity.id);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleApply = async (opportunity) => {
    if (!studentId) {
      alert('Please log in to apply for jobs');
      return;
    }

    if (appliedJobs.has(opportunity.id)) {
      alert('You have already applied to this job');
      return;
    }

    if (opportunity.application_link) {
      const confirmExternal = window.confirm(
        'This will open an external application page. Would you also like to save this application to your profile?'
      );
      
      if (confirmExternal) {
        setIsApplying(true);
        const result = await AppliedJobsService.applyToJob(studentId, opportunity.id);
        setIsApplying(false);
        
        if (result.success) {
          setAppliedJobs(prev => new Set([...prev, opportunity.id]));
          alert(result.message);
        }
      }
      
      window.open(opportunity.application_link, '_blank');
      return;
    }

    const confirmApply = window.confirm(
      `Apply to ${opportunity.job_title} at ${opportunity.company_name}?`
    );

    if (!confirmApply) return;

    setIsApplying(true);
    const result = await AppliedJobsService.applyToJob(studentId, opportunity.id);
    setIsApplying(false);

    if (result.success) {
      setAppliedJobs(prev => new Set([...prev, opportunity.id]));
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-8">
        {/* Tab Switcher */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('my-jobs')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'my-jobs'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>My Jobs</span>
              </button>
              <button
                onClick={() => setActiveTab('my-applications')}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'my-applications'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'bg-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>My Applications</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div>
          {activeTab === 'my-jobs' && (
              <MyJobsContent
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
                opportunities={filteredAndSortedOpportunities}
                loading={loading}
                error={error}
                selectedOpportunity={selectedOpportunity}
                setSelectedOpportunity={setSelectedOpportunity}
                appliedJobs={appliedJobs}
                savedJobs={savedJobs}
                handleToggleSave={handleToggleSave}
                handleApply={handleApply}
                isApplying={isApplying}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                opportunitiesPerPage={opportunitiesPerPage}
              />
            )}

            {activeTab === 'my-applications' && (
              <MyApplicationsContent
                applications={filteredApplications}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                showPipelineStatus={showPipelineStatus}
                setShowPipelineStatus={setShowPipelineStatus}
                messagingApplicationId={messagingApplicationId}
                setMessagingApplicationId={setMessagingApplicationId}
                studentId={studentId}
                navigate={navigate}
                queryClient={queryClient}
              />
            )}
        </div>
      </div>
    </div>
  );
};

// My Jobs Content Component
const MyJobsContent = ({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  opportunities,
  loading,
  error,
  selectedOpportunity,
  setSelectedOpportunity,
  appliedJobs,
  savedJobs,
  handleToggleSave,
  handleApply,
  isApplying,
  advancedFilters,
  setAdvancedFilters,
  currentPage,
  setCurrentPage,
  opportunitiesPerPage
}) => {
  const totalPages = Math.max(1, Math.ceil(opportunities.length / opportunitiesPerPage));
  const paginatedOpportunities = React.useMemo(() => {
    const startIndex = (currentPage - 1) * opportunitiesPerPage;
    return opportunities.slice(startIndex, startIndex + opportunitiesPerPage);
  }, [opportunities, currentPage, opportunitiesPerPage]);

  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search job title here..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />
          </div>
          <button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-6 py-3 flex items-center gap-2 font-medium">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              Showing {opportunities.length} Jobs Results
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AdvancedFilters
              onApplyFilters={setAdvancedFilters}
              initialFilters={advancedFilters}
            />
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities Grid/List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Failed to load opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {opportunities.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paginatedOpportunities.map((opp) => (
                      <OpportunityCard
                        key={opp.id}
                        opportunity={opp}
                        onClick={() => setSelectedOpportunity(opp)}
                        isSelected={selectedOpportunity?.id === opp.id}
                        isApplied={appliedJobs.has(opp.id)}
                        isSaved={savedJobs.has(opp.id)}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedOpportunities.map((opp) => (
                      <OpportunityListItem
                        key={opp.id}
                        opportunity={opp}
                        onClick={() => setSelectedOpportunity(opp)}
                        isSelected={selectedOpportunity?.id === opp.id}
                        isApplied={appliedJobs.has(opp.id)}
                        isSaved={savedJobs.has(opp.id)}
                        onApply={() => handleApply(opp)}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No opportunities found</h3>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:sticky lg:top-16 lg:self-start">
            <OpportunityPreview
              opportunity={selectedOpportunity}
              onApply={handleApply}
              onToggleSave={handleToggleSave}
              isApplied={appliedJobs.has(selectedOpportunity?.id)}
              isSaved={savedJobs.has(selectedOpportunity?.id)}
              isApplying={isApplying}
            />
          </div>
        </div>
      )}
    </>
  );
};

// My Applications Content Component (simplified from Applications.jsx)
const MyApplicationsContent = ({
  applications,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  showPipelineStatus,
  setShowPipelineStatus,
  messagingApplicationId,
  setMessagingApplicationId,
  studentId,
  navigate,
  queryClient
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      applied: { label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50' },
      under_review: { label: 'Under Review', color: 'text-slate-700', bg: 'bg-slate-50' },
      interview_scheduled: { label: 'Interview Scheduled', color: 'text-indigo-700', bg: 'bg-indigo-50' },
      accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50' },
      rejected: { label: 'Rejected', color: 'text-gray-600', bg: 'bg-gray-50' }
    };
    return configs[status] || configs.applied;
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
          </div>
        ) : (
          applications.map((app) => {
            const statusConfig = getStatusConfig(app.status);

            return (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{app.jobTitle}</h3>
                    <p className="text-gray-600 font-medium mt-1">{app.company}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{app.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                        {app.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default Opportunities;
