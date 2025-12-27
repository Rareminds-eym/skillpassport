import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FileText,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Target,
  Building2,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  AlertCircle,
  Video,
  Award,
  Bell,
  MessageSquare,
  ArrowRight,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';
import AppliedJobsService from '../../services/appliedJobsService';
import SavedJobsService from '../../services/savedJobsService';
import SearchHistoryService from '../../services/searchHistoryService';
import OpportunityCard from '../../components/Students/components/OpportunityCard';
import OpportunityListItem from '../../components/Students/components/OpportunityListItem';
import OpportunityPreview from '../../components/Students/components/OpportunityPreview';
import AdvancedFilters from '../../components/Students/components/AdvancedFilters';
import RecommendedJobs from '../../components/Students/components/RecommendedJobs';
import Pagination from '../../components/educator/Pagination';

// Import Applications component content
import StudentPipelineService from '../../services/studentPipelineService';
import MessageService from '../../services/messageService';
import useMessageNotifications from '../../hooks/useMessageNotifications';
import { supabase } from '../../lib/supabaseClient';

const Opportunities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData } = useStudentDataByEmail(userEmail);
  const studentId = user?.id || studentData?.id;

  // Left sidebar tab state
  const [activeTab, setActiveTab] = useState('my-jobs'); // 'my-jobs' or 'my-applications'

  // My Jobs state (existing opportunities logic)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Fetch opportunities with loader timing
  const [isLoading, setIsLoading] = useState(true);
  const { opportunities, loading: dataLoading, error } = useOpportunities({
    fetchOnMount: true,
    activeOnly: true,
    searchTerm: debouncedSearch
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pre-select opportunity from navigation state (from Dashboard)
  useEffect(() => {
    if (location.state?.selectedOpportunityId && opportunities.length > 0) {
      const preSelectedOpp = opportunities.find(
        opp => opp.id === location.state.selectedOpportunityId
      );
      if (preSelectedOpp) {
        setSelectedOpportunity(preSelectedOpp);
        // Scroll to top to show the selected opportunity
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Clear the navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, opportunities, navigate, location.pathname]);

  // Ensure loader displays for at least 5 seconds
  useEffect(() => {
    const startTime = Date.now();

    const checkLoading = async () => {
      if (!dataLoading) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 5000 - elapsedTime);

        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        setIsLoading(false);
      }
    };

    checkLoading();
  }, [dataLoading]);

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

  // Subscribe to real-time pipeline updates
  useEffect(() => {
    if (!studentId || activeTab !== 'my-applications') return;

    const channel = StudentPipelineService.subscribeToPipelineUpdates(
      studentId,
      (payload) => {
        // Refresh applications when pipeline updates
        const fetchApplications = async () => {
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
            console.error('Error refreshing applications:', err);
          }
        };

        fetchApplications();
      }
    );

    return () => {
      StudentPipelineService.unsubscribeFromPipelineUpdates(channel);
    };
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

  // Filter and sort opportunities for My Jobs tab with advanced filters
  const filteredAndSortedOpportunities = React.useMemo(() => {
    let filtered = opportunities.filter(opp => {
      // Search is now handled at DB level via useOpportunities hook
      // No need for client-side search filtering anymore

      // Grade-based filtering (same logic as Dashboard)
      const isSchoolStudent = studentData?.school_id || studentData?.school_class_id;
      const isUniversityStudent = studentData?.university_college_id || studentData?.universityId;

      // Apply filtering based on student type
      if (isSchoolStudent) {
        // School students: Show ONLY internships
        const isInternship = opp.employment_type && opp.employment_type.toLowerCase() === 'internship';
        if (!isInternship) return false;
      } else if (isUniversityStudent) {
        // College/University students: Show ALL opportunities (no filtering)
        // They see everything - internships, full-time, part-time, contracts, etc.
      }

      // Employment Type filter
      if (advancedFilters.employmentType.length > 0) {
        if (!advancedFilters.employmentType.includes(opp.employment_type)) {
          return false;
        }
      }

      // Experience Level filter
      if (advancedFilters.experienceLevel.length > 0) {
        if (!advancedFilters.experienceLevel.includes(opp.experience_level)) {
          return false;
        }
      }

      // Mode filter (Remote/Onsite/Hybrid)
      if (advancedFilters.mode.length > 0) {
        if (!advancedFilters.mode.includes(opp.mode)) {
          return false;
        }
      }

      // Salary filter
      if (advancedFilters.salaryMin && opp.salary_range_min) {
        if (opp.salary_range_min < parseInt(advancedFilters.salaryMin)) {
          return false;
        }
      }
      if (advancedFilters.salaryMax && opp.salary_range_max) {
        if (opp.salary_range_max > parseInt(advancedFilters.salaryMax)) {
          return false;
        }
      }

      // Skills filter
      if (advancedFilters.skills.length > 0) {
        const oppSkills = opp.required_skills || [];
        const hasMatchingSkill = advancedFilters.skills.some(skill =>
          oppSkills.some(oppSkill => 
            oppSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        if (!hasMatchingSkill) return false;
      }

      // Department filter
      if (advancedFilters.department.length > 0) {
        if (!advancedFilters.department.includes(opp.department)) {
          return false;
        }
      }

      // Posted Within filter
      if (advancedFilters.postedWithin) {
        const postedDate = new Date(opp.posted_date || opp.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
        
        const withinDays = parseInt(advancedFilters.postedWithin);
        if (daysDiff > withinDays) {
          return false;
        }
      }

      return true;
    });

    // Debug logging for opportunity filtering
    const isSchoolStudent = studentData?.school_id || studentData?.school_class_id;
    const isUniversityStudent = studentData?.university_college_id || studentData?.universityId;
    
    console.log('🎯 Opportunities Page Filtering Debug:', {
      isSchoolStudent,
      isUniversityStudent,
      studentType: isSchoolStudent ? 'School Student (Internships Only)' : isUniversityStudent ? 'College/University Student (All Jobs)' : 'Unknown',
      totalOpportunities: opportunities.length,
      filteredCount: filtered.length,
      studentData: {
        school_id: studentData?.school_id,
        school_class_id: studentData?.school_class_id,
        university_college_id: studentData?.university_college_id,
        grade: studentData?.grade
      }
    });

    // Sort filtered results
    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.posted_date || b.created_at) - new Date(a.posted_date || a.created_at);
      }
      if (sortBy === 'oldest') {
        return new Date(a.posted_date || a.created_at) - new Date(b.posted_date || b.created_at);
      }
      return 0;
    });
  }, [opportunities, sortBy, advancedFilters, studentData]);

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
      console.error('Please log in to apply for jobs');
      return;
    }

    if (appliedJobs.has(opportunity.id)) {
      console.log('You have already applied to this job');
      return;
    }

    setIsApplying(true);

    try {
      // Handle external application link
      if (opportunity.application_link) {
        // Save application to profile for tracking
        const result = await AppliedJobsService.applyToJob(studentId, opportunity.id);
        
        if (result.success) {
          setAppliedJobs(prev => new Set([...prev, opportunity.id]));
        }
        
        // Open external link
        window.open(opportunity.application_link, '_blank');
        setIsApplying(false);
        return;
      }

      // Handle regular application
      const result = await AppliedJobsService.applyToJob(studentId, opportunity.id);
      
      if (result.success) {
        setAppliedJobs(prev => new Set([...prev, opportunity.id]));
        console.log('Application submitted successfully');
      } else {
        console.error('Application failed:', result.message);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-8">
        {/* Loading State */}
        {isLoading && (
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
                <p className="text-xl font-semibold text-gray-800 mb-2">Loading Opportunities...</p>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  Powered by <span className="font-semibold text-indigo-600">RareMinds</span>
                </p>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Tab Switcher */}
        {!isLoading && (
          <div className="mb-8">
            {/* Tab Navigation with Subheadings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* My Jobs Tab */}
                <button
                  onClick={() => setActiveTab('my-jobs')}
                  className={`relative text-left p-4 rounded-lg transition-all ${
                    activeTab === 'my-jobs'
                      ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeTab === 'my-jobs' ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                      <Briefcase className={`w-6 h-6 ${
                        activeTab === 'my-jobs' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h1 className={`font-bold text-2xl ${
                        activeTab === 'my-jobs' ? 'text-indigo-600' : 'text-gray-900'
                      }`}>
                        My Jobs
                      </h1>
                      <p className="text-sm text-gray-600 mt-1">
                        Discover and apply to exciting career opportunities
                      </p>
                    </div>
                  </div>
                </button>

                {/* My Applications Tab */}
                <button
                  onClick={() => setActiveTab('my-applications')}
                  className={`relative text-left p-4 rounded-lg transition-all ${
                    activeTab === 'my-applications'
                      ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeTab === 'my-applications' ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-6 h-6 ${
                        activeTab === 'my-applications' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h1 className={`font-bold text-lg ${
                        activeTab === 'my-applications' ? 'text-indigo-600' : 'text-gray-900'
                      }`}>
                        My Applications
                      </h1>
                      <p className="text-sm text-gray-600 mt-1">
                        Track your application status and progress
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoading && (
          <div>
            {activeTab === 'my-jobs' && (
              <>
                {/* AI Recommended Jobs */}
                <RecommendedJobs
                  studentProfile={{ ...studentData, profile: studentData }}
                  opportunities={opportunities}
                  onSelectJob={setSelectedOpportunity}
                  appliedJobs={appliedJobs}
                  savedJobs={savedJobs}
                  onToggleSave={handleToggleSave}
                  onApply={handleApply}
                />

                <MyJobsContent
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  debouncedSearch={debouncedSearch}
                  setDebouncedSearch={setDebouncedSearch}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  opportunities={filteredAndSortedOpportunities}
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
                  studentData={studentData}
                />
              </>
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
                setActiveTab={setActiveTab}
                opportunities={opportunities}
                setSelectedOpportunity={setSelectedOpportunity}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// My Jobs Content Component
const MyJobsContent = ({
  searchTerm,
  setSearchTerm,
  debouncedSearch,
  setDebouncedSearch,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  opportunities,
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
  opportunitiesPerPage,
  recommendations,
  recommendationsLoading,
  recommendationsError,
  refreshRecommendations,
  cached,
  fallback,
  trackView,
  studentData
}) => {
  const totalPages = Math.max(1, Math.ceil(opportunities.length / opportunitiesPerPage));
  const paginatedOpportunities = React.useMemo(() => {
    const startIndex = (currentPage - 1) * opportunitiesPerPage;
    return opportunities.slice(startIndex, startIndex + opportunitiesPerPage);
  }, [opportunities, currentPage, opportunitiesPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, advancedFilters, sortBy, setCurrentPage]);

  return (
    <>
      {/* AI Recommendations Section - Always show if loading or has data */}
      {(recommendationsLoading || (recommendations && recommendations.length > 0)) && (
        <div className="relative z-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl shadow-sm p-6 mb-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  AI-Powered Recommendations
                  {cached && (
                    <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full">
                      Cached
                    </span>
                  )}
                  {fallback && (
                    <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Popular Jobs
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {fallback
                    ? 'Trending opportunities based on popularity'
                    : 'Personalized matches based on your profile and skills'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={refreshRecommendations}
              disabled={recommendationsLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${recommendationsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {recommendationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="ml-3 text-sm text-gray-600">Finding best matches...</p>
            </div>
          ) : recommendationsError ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">⚠️ {recommendationsError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {recommendations.slice(0, 5).map((rec, idx) => (
                <div
                  key={rec.id || idx}
                  onClick={() => {
                    trackView(rec.id);
                    setSelectedOpportunity(rec);
                  }}
                  className="bg-white rounded-lg p-4 border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Match Score */}
                  {rec.similarity && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                        <Target className="w-3 h-3" />
                        {Math.round(rec.similarity * 100)}% Match
                      </span>
                    </div>
                  )}

                  {/* Job Title */}
                  <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {rec.job_title || rec.title}
                  </h4>

                  {/* Company */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{rec.company_name || rec.company}</span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-gray-500">
                    {rec.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{rec.location}</span>
                      </div>
                    )}
                    {rec.employment_type && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{rec.employment_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Applied/Saved Status */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {appliedJobs.has(rec.id) ? (
                      <span className="text-xs text-green-600 font-medium">✓ Applied</span>
                    ) : savedJobs.has(rec.id) ? (
                      <span className="text-xs text-blue-600 font-medium">★ Saved</span>
                    ) : (
                      <span className="text-xs text-indigo-600 font-medium group-hover:underline">
                        View Details →
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="relative z-10 mb-8 space-y-4">
        {/* Search and Primary Controls - Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search job title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-12 bg-white border border-slate-200/60 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Control Buttons - Right side on desktop */}
          <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
            {/* Advanced Filters Button */}
            <AdvancedFilters
              onApplyFilters={setAdvancedFilters}
              initialFilters={advancedFilters}
            />

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-slate-200/60 rounded-2xl p-1 shadow-sm h-12">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Grid3x3 className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4 mx-auto" />
              </button>
            </div>

            {/* Sort Controls */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none lg:w-auto px-4 h-12 bg-white border border-slate-200/60 rounded-2xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm min-w-0 sm:min-w-[140px] lg:min-w-[140px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Results count and clear filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-slate-900">
              Showing {opportunities.length} Jobs Results
            </p>
            {opportunities.length > 0 && (
              <span className="text-xs text-slate-500">
                (Page {currentPage} of {Math.max(1, Math.ceil(opportunities.length / opportunitiesPerPage))})
              </span>
            )}
          </div>

          {/* Active Filters Summary */}
          {(advancedFilters.employmentType.length > 0 ||
            advancedFilters.experienceLevel.length > 0 ||
            advancedFilters.mode.length > 0 ||
            advancedFilters.skills.length > 0 ||
            advancedFilters.department.length > 0 ||
            advancedFilters.salaryMin ||
            advancedFilters.salaryMax ||
            advancedFilters.postedWithin) && (
            <button
              onClick={() => setAdvancedFilters({
                employmentType: [],
                experienceLevel: [],
                mode: [],
                salaryMin: '',
                salaryMax: '',
                skills: [],
                department: [],
                postedWithin: '',
              })}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Opportunities Grid/List */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Failed to load opportunities</p>
        </div>
      ) : (
        <>
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
                  <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
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

          {/* Pagination */}
          {opportunities.length > 0 && totalPages > 1 && (
            <div className="mt-8">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={opportunities.length}
                  itemsPerPage={opportunitiesPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

// My Applications Content Component (full-featured from Applications.jsx)
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
  queryClient,
  setActiveTab,
  opportunities,
  setSelectedOpportunity
}) => {
  // Helper function to get stage order
  const getStageOrder = (stage) => {
    const stageOrder = {
      sourced: 1,
      screened: 2,
      interview_1: 3,
      interview_2: 4,
      offer: 5,
      hired: 6,
      rejected: -1
    };
    return stageOrder[stage] || 0;
  };

  const getStatusConfig = (status) => {
    const configs = {
      applied: {
        label: 'Applied',
        icon: Clock,
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-300'
      },
      viewed: {
        label: 'Viewed',
        icon: Eye,
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-300'
      },
      under_review: {
        label: 'Under Review',
        icon: Clock,
        color: 'text-slate-700',
        bg: 'bg-slate-50',
        border: 'border-slate-300'
      },
      interview_scheduled: {
        label: 'Interview Scheduled',
        icon: Calendar,
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200'
      },
      interviewed: {
        label: 'Interviewed',
        icon: CheckCircle2,
        color: 'text-cyan-700',
        bg: 'bg-cyan-50',
        border: 'border-cyan-200'
      },
      offer_received: {
        label: 'Offer Received',
        icon: TrendingUp,
        color: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-200'
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle2,
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200'
      },
      rejected: {
        label: 'Rejected',
        icon: XCircle,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-300'
      },
      withdrawn: {
        label: 'Withdrawn',
        icon: XCircle,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-300'
      }
    };
    return configs[status] || configs.applied;
  };

  // Pipeline stage configuration
  const getPipelineStageConfig = (stage) => {
    const configs = {
      sourced: {
        label: 'Sourced',
        icon: Users,
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        order: 1,
        description: 'Your profile has been identified as a potential match!',
        studentAction: 'No action required - Wait for recruiter to review your profile'
      },
      screened: {
        label: 'Screened',
        icon: Eye,
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        order: 2,
        description: 'Your profile is being reviewed by the hiring team!',
        studentAction: 'Be ready to respond to interview invitations quickly'
      },
      interview_1: {
        label: 'Interview Round 1',
        icon: Video,
        color: 'text-indigo-700',
        bg: 'bg-indigo-100',
        order: 3,
        description: 'First interview scheduled - Great progress!',
        studentAction: 'Prepare well and attend your scheduled interview'
      },
      interview_2: {
        label: 'Interview Round 2',
        icon: Video,
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        order: 4,
        description: 'Advanced to second round - Excellent!',
        studentAction: 'Attend interview and follow up with thank you note'
      },
      offer: {
        label: 'Offer Stage',
        icon: Award,
        color: 'text-green-700',
        bg: 'bg-green-100',
        order: 5,
        description: 'Congratulations! Offer is being prepared 🎉',
        studentAction: 'Wait for formal offer letter and review terms'
      },
      hired: {
        label: 'Hired',
        icon: CheckCircle2,
        color: 'text-emerald-700',
        bg: 'bg-emerald-100',
        order: 6,
        description: 'You\'re hired! Welcome to the team! 🎊',
        studentAction: 'Prepare for your start date and complete all paperwork'
      },
      rejected: {
        label: 'Not Selected',
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
        order: 7,
        description: 'This position didn\'t work out, but don\'t give up!',
        studentAction: 'Learn from the experience and continue your job search'
      }
    };
    return configs[stage] || configs.sourced;
  };

  // Toggle function for pipeline status visibility
  const togglePipelineStatus = (applicationId) => {
    setShowPipelineStatus(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  // Handle messaging
  const handleMessage = async (app) => {
    console.log('🔍 handleMessage called with:', {
      appId: app.id,
      recruiterId: app.recruiterId,
      opportunityId: app.opportunityId,
      studentId: studentId,
      jobTitle: app.jobTitle
    });

    if (!app.recruiterId) {
      alert('Recruiter information not available for this application.');
      return;
    }

    if (!studentId) {
      alert('Student information not available. Please refresh the page.');
      return;
    }

    setMessagingApplicationId(app.id);
    
    try {
      console.log('📞 Calling MessageService.getOrCreateConversation...');
      
      const conversation = await MessageService.getOrCreateConversation(
        String(studentId), // Ensure string
        String(app.recruiterId), // Ensure string
        app.id, // applicationId
        app.opportunityId, // opportunityId
        `Application: ${app.jobTitle}` // subject
      );
      
      console.log('✅ Conversation created/found:', conversation);
      
      navigate('/student/messages', {
        state: {
          conversationId: conversation.id,
          recipientId: app.recruiterId,
          recipientName: app.company,
          recipientType: 'recruiter'
        }
      });
    } catch (error) {
      console.error('❌ Error opening message:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      alert(`Failed to open messaging: ${error.message || 'Please try again.'}`);
    } finally {
      setMessagingApplicationId(null);
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
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
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          applications.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            const StatusIcon = statusConfig.icon;
            const currentStageConfig = app.pipelineStage ? getPipelineStageConfig(app.pipelineStage) : null;
            const StageIcon = currentStageConfig?.icon;

            return (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Job Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                            {app.jobTitle}
                          </h3>
                          <p className="text-gray-600 font-medium mt-1">{app.company}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
                          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                          <span className={`text-sm font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{app.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{app.salary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Applied {new Date(app.appliedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span>Updated {app.lastUpdate}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                          {app.type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          {app.level}
                        </span>
                      </div>

                      {/* Pipeline Status Section - Only show when View Details is clicked */}
                      {app.hasPipelineStatus && app.pipelineStage && showPipelineStatus[app.id] && (
                        <div className="mt-4 p-5 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl border-2 border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Users className="w-5 h-5 text-slate-700" />
                              </div>
                              <h4 className="font-bold text-slate-900">Recruitment Pipeline Status</h4>
                            </div>
                          </div>

                          {/* Visual Pipeline Stepper */}
                          <div className="relative mb-6">
                            <div className="flex items-center justify-between">
                              {Object.entries({
                                sourced: 'Sourced',
                                screened: 'Screened',
                                interview_1: 'Interview 1',
                                interview_2: 'Interview 2',
                                offer: 'Offer',
                                hired: 'Hired'
                              }).map(([stageKey, stageLabel], index, array) => {
                                const isCompleted = getStageOrder(app.pipelineStage) > getStageOrder(stageKey);
                                const isCurrent = app.pipelineStage === stageKey;
                                const isRejected = app.pipelineStage === 'rejected';

                                return (
                                  <div key={stageKey} className="flex flex-col items-center flex-1 relative">
                                    {/* Stage Number Circle */}
                                    <div className="relative z-10 mb-2">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                        isCompleted
                                          ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                                          : isCurrent
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-200 animate-pulse'
                                            : isRejected && index > getStageOrder('sourced')
                                              ? 'bg-gray-200 text-gray-400'
                                              : 'bg-white text-gray-400 border-2 border-gray-300'
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-6 h-6" />
                                        ) : (
                                          index + 1
                                        )}
                                      </div>
                                    </div>

                                    {/* Connecting Line */}
                                    {index < array.length - 1 && (
                                      <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 transition-all ${
                                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                      }`} style={{ transform: 'translateY(-50%)' }} />
                                    )}

                                    {/* Stage Label */}
                                    <div className={`text-xs font-medium text-center px-1 transition-all ${
                                      isCurrent
                                        ? 'text-blue-700 font-bold'
                                        : isCompleted
                                          ? 'text-green-700'
                                          : 'text-gray-500'
                                    }`}>
                                      {stageLabel}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Current Status Info */}
                          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-lg ${currentStageConfig?.bg || 'bg-gray-100'}`}>
                                {StageIcon && <StageIcon className="w-6 h-6" />}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm text-gray-600">Current Stage</div>
                                <div className="text-lg font-bold text-gray-900">{currentStageConfig?.label || app.pipelineStage}</div>
                                {app.pipelineStageChangedAt && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    Updated {new Date(app.pipelineStageChangedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`px-4 py-2 rounded-lg font-semibold ${currentStageConfig?.bg || 'bg-gray-100'} ${currentStageConfig?.color || 'text-gray-800'}`}>
                                  Stage {getStageOrder(app.pipelineStage)} of 6
                                </div>
                              </div>
                            </div>

                            {/* Progress Message */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-700 font-medium">
                                {currentStageConfig?.description}
                              </p>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {showPipelineStatus[app.id] && currentStageConfig && (
                            <div className="mt-4 space-y-3">
                              {/* What You Need to Do */}
                              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h5 className="text-sm font-bold text-gray-900 mb-1">What You Need to Do:</h5>
                                    <p className="text-sm text-blue-700 font-semibold bg-blue-50 px-3 py-2 rounded-lg">
                                      {currentStageConfig.studentAction}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Next Action */}
                              {app.nextAction && (
                                <div className="flex items-start gap-2 p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                                  <Bell className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0 animate-pulse" />
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Upcoming Action:</p>
                                    <p className="text-sm font-semibold text-blue-800 mt-1">{app.nextAction.replace(/_/g, ' ').toUpperCase()}</p>
                                    {app.nextActionDate && (
                                      <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Scheduled: {new Date(app.nextActionDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Rejection Reason */}
                              {app.rejectionReason && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border-2 border-red-200">
                                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-bold text-red-900 uppercase tracking-wide">Feedback from Recruiter:</p>
                                    <p className="text-sm text-red-700 mt-1">{app.rejectionReason}</p>
                                  </div>
                                </div>
                              )}

                              {/* Scheduled Interviews */}
                              {app.interviews && app.interviews.length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-indigo-200">
                                  <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Video className="w-5 h-5 text-indigo-600" />
                                    Scheduled Interviews ({app.interviews.length})
                                  </h5>
                                  <div className="space-y-2">
                                    {app.interviews.map((interview, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900">{interview.type} Interview</p>
                                          <p className="text-sm text-gray-600 mt-0.5">with {interview.interviewer}</p>
                                          {interview.meeting_link && (
                                            <a
                                              href={interview.meeting_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                            >
                                              Join Meeting →
                                            </a>
                                          )}
                                        </div>
                                        <div className="text-right ml-4">
                                          <p className="font-bold text-indigo-700">
                                            {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {new Date(interview.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => {
                          // Toggle pipeline status visibility
                          togglePipelineStatus(app.id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        {showPipelineStatus[app.id] ? 'Hide Details' : 'View Details'}
                      </button>
                      
                      {app.recruiterId && (
                        <button
                          onClick={() => handleMessage(app)}
                          disabled={messagingApplicationId === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {messagingApplicationId === app.id ? 'Opening...' : 'Message'}
                        </button>
                      )}
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