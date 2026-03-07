import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Award,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Factory,
  FileText,
  Filter,
  Grid3x3,
  List,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
  X,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedFilters from '../../components/Students/components/AdvancedFilters';
import OpportunityCard from '../../components/Students/components/OpportunityCard';
import OpportunityListItem from '../../components/Students/components/OpportunityListItem';
import OpportunityPreview from '../../components/Students/components/OpportunityPreview';
import RecommendedJobs from '../../components/Students/components/RecommendedJobs';
import IndustrialVisitPreview from '../../components/Students/components/IndustrialVisitPreview';
import Pagination from '../../components/educator/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';
import AppliedJobsService from '../../services/appliedJobsService';
import SavedJobsService from '../../services/savedJobsService';
import factoryVisitsService from '../../services/factoryVisitsService';
import { isSchoolStudent, isCollegeStudent, isLearner } from '../../utils/studentType';

// Import Applications component content
import useMessageNotifications from '../../hooks/useMessageNotifications';
import MessageService from '../../services/messageService';
import StudentPipelineService from '../../services/studentPipelineService';

// Helper function to check if institution details are complete
const checkInstitutionDetailsComplete = (studentData) => {
  if (!studentData) return false;
  
  // Learners don't need institution details
  if (isLearner(studentData)) return true;
  
  console.log('🔍 Checking institution details:', {
    universityId: studentData.universityId,
    university: studentData.university,
    university_college_id: studentData.university_college_id,
    college_school_name: studentData.college_school_name,
    program_id: studentData.program_id,
    branch_field: studentData.branch_field,
    program_section_id: studentData.program_section_id,
    section: studentData.section,
    semester: studentData.semester,
    grade: studentData.grade
  });
  
  const gradeStr = String(studentData.grade || '').toUpperCase().trim();
  const isSchool = gradeStr.match(/(\d+)/) || gradeStr.includes('DIPLOMA');
  const isCollege = gradeStr.includes('UG') || gradeStr.includes('PG') || 
                    gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') || 
                    gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') || 
                    gradeStr.includes('MASTER');
  
  if (isSchool && !isCollege) {
    // School students need: school_id (or custom school name) + school_class_id (or custom section)
    const isComplete = !!(studentData.school_id || studentData.college_school_name);
    console.log('📚 School student check:', { isComplete, school_id: studentData.school_id, college_school_name: studentData.college_school_name });
    return isComplete;
  } else if (isCollege) {
    // College students need: university + college + program (semester is optional)
    const hasUniversity = !!(studentData.universityId || studentData.university);
    const hasCollege = !!(studentData.university_college_id || studentData.college_school_name);
    const hasProgram = !!(studentData.program_id || studentData.branch_field);
    const hasSemester = !!(studentData.program_section_id || studentData.section || studentData.semester);
    
    // Consider complete if at least university, college, and program are filled
    const isComplete = hasUniversity && hasCollege && hasProgram;
    console.log('🎓 College student check:', { 
      isComplete, 
      hasUniversity, 
      hasCollege, 
      hasProgram, 
      hasSemester 
    });
    return isComplete;
  }
  
  return false;
};

// Empty state component with modal
const EmptyOpportunitiesState = ({ studentData, navigate }) => {
  const [showModal, setShowModal] = useState(false);
  const isComplete = checkInstitutionDetailsComplete(studentData);
  
  useEffect(() => {
    // Show modal automatically if institution details are incomplete
    if (!isComplete) {
      setShowModal(true);
    }
  }, [isComplete]);
  
  const handleCompleteDetails = () => {
    navigate('/student/settings', { 
      state: { 
        activeTab: 'profile',
        activeSubTab: 'institution-details'
      } 
    });
  };
  
  if (!isComplete && showModal) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            
            {/* Content */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Complete Your Institution Details
            </h3>
            <p className="text-gray-600 text-center mb-6">
              To view relevant opportunities, please complete your institution information in your profile settings.
            </p>
            
            {/* Required fields info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-800 mb-2">Required Information:</p>
              {(() => {
                const gradeStr = String(studentData?.grade || '').toUpperCase().trim();
                const isSchool = gradeStr.match(/(\d+)/) || gradeStr.includes('DIPLOMA');
                const isCollege = gradeStr.includes('UG') || gradeStr.includes('PG') || 
                                  gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') || 
                                  gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') || 
                                  gradeStr.includes('MASTER');
                
                if (isSchool && !isCollege) {
                  return (
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        School Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Section (A, B, C, etc.)
                      </li>
                    </ul>
                  );
                } else if (isCollege) {
                  return (
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        University Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        College Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Program/Course Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Current Semester & Section
                      </li>
                    </ul>
                  );
                }
                
                return (
                  <p className="text-sm text-gray-700">
                    Please complete your institution details
                  </p>
                );
              })()}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Later
              </button>
              <button
                onClick={handleCompleteDetails}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Complete Now
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Background empty state */}
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No opportunities found</h3>
          <p className="text-gray-500 text-sm">Complete your profile to see relevant opportunities</p>
        </div>
      </>
    );
  }
  
  // If details are complete, show regular empty state
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
      <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 mb-2">No opportunities found</h3>
      <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
    </div>
  );
};

const Opportunities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  const { studentData } = useStudentDataByEmail(userEmail);
  const studentId = studentData?.id; // Use students.id (database ID)

  // Check institution details completion
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const isInstitutionComplete = checkInstitutionDetailsComplete(studentData);

  // Show modal on mount if institution details are incomplete
  useEffect(() => {
    if (studentData && !isInstitutionComplete) {
      setShowInstitutionModal(true);
    }
  }, [studentData, isInstitutionComplete]);

  // Check profile completion status
  const { canApplyToJobs, needsProfileCompletion, isLoading: profileCheckLoading } = useProfileCompletion(studentId, !!studentId);

  // Left sidebar tab state - Set default based on student type
  const getDefaultTab = () => {
    if (!studentData) return 'my-jobs'; // Temporary default while loading
    const gradeStr = String(studentData.grade || '').toUpperCase().trim();
    
    // Check for college/university grades (UG, PG, etc.) - default to my-jobs
    if (gradeStr.includes('UG') || gradeStr.includes('PG') || 
        gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') || 
        gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') || 
        gradeStr.includes('MASTER')) {
      return 'my-jobs';
    }
    
    // Check for Diploma explicitly - treat as high school
    if (gradeStr.includes('DIPLOMA')) {
      return 'industrial-visits';
    }
    
    // Extract numeric part from strings like "GRADE 10", "10", "10TH", etc.
    const match = gradeStr.match(/(\d+)/);
    
    if (match) {
      const gradeNum = parseInt(match[1], 10);
      
      // Middle school (6-8): Default to industrial visits
      if (gradeNum >= 6 && gradeNum <= 8) {
        return 'industrial-visits';
      }
      
      // High school (9-12): Default to industrial visits
      if (gradeNum >= 9 && gradeNum <= 12) {
        return 'industrial-visits';
      }
    }
    
    // College: Default to my-jobs
    return 'my-jobs';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab()); // 'my-jobs', 'my-applications', 'industrial-visits', or 'history'

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Update active tab when student data loads
  useEffect(() => {
    // Don't override if we have a navigation state
    if (location.state?.activeTab) return;
    
    if (studentData && studentData.grade) {
      const correctTab = getDefaultTab();
      if (activeTab !== correctTab) {
        setActiveTab(correctTab);
      }
    }
  }, [studentData, location.state]);

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
  const opportunitiesPerPage = 6;

  // My Applications state
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPipelineStatus, setShowPipelineStatus] = useState({});
  const [messagingApplicationId, setMessagingApplicationId] = useState(null);

  // Industrial Visits state
  const [industrialVisits, setIndustrialVisits] = useState([]);
  const [industrialVisitsLoading, setIndustrialVisitsLoading] = useState(false);
  const [selectedIndustrialVisit, setSelectedIndustrialVisit] = useState(null);
  const [ivSearchTerm, setIvSearchTerm] = useState('');
  const [ivSectorFilter, setIvSectorFilter] = useState('all');
  const [ivLocationFilter, setIvLocationFilter] = useState('all');
  const [ivViewMode, setIvViewMode] = useState('grid');
  const [ivCurrentPage, setIvCurrentPage] = useState(1);
  const ivItemsPerPage = 10;
  const [registeredVisits, setRegisteredVisits] = useState(new Set());
  const [isRegistering, setIsRegistering] = useState(false);

  // Memoize student type to prevent unnecessary recalculations
  const studentType = React.useMemo(() => {
    if (!studentData) return { isSchoolStudent: false, isUniversityStudent: false, isMiddleSchool: false, isHighSchool: false, isLearner: false };
    
    const isSchool = isSchoolStudent(studentData);
    const isUniversity = isCollegeStudent(studentData);
    const isLearnerType = isLearner(studentData);
    
    // Determine specific school level
    let isMiddleSchool = false;
    let isHighSchool = false;
    
    if (studentData.grade) {
      const gradeStr = String(studentData.grade).toUpperCase().trim();
      
      // Check for college/university grades (UG, PG, etc.)
      if (gradeStr.includes('UG') || gradeStr.includes('PG') || 
          gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') || 
          gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') || 
          gradeStr.includes('MASTER')) {
        // These are college students, not high school
        isMiddleSchool = false;
        isHighSchool = false;
      }
      // Check for Diploma explicitly - treat as high school
      else if (gradeStr.includes('DIPLOMA')) {
        isHighSchool = true;
      } else {
        // Extract numeric part from strings like "GRADE 10", "10", "10TH", etc.
        const match = gradeStr.match(/(\d+)/);
        
        if (match) {
          const gradeNum = parseInt(match[1], 10);
          isMiddleSchool = gradeNum >= 6 && gradeNum <= 8;
          isHighSchool = gradeNum >= 9 && gradeNum <= 12;
        }
      }
    }
    
    return { 
      isSchoolStudent: isSchool, 
      isUniversityStudent: isUniversity,
      isMiddleSchool,
      isHighSchool,
      isLearner: isLearnerType
    };
  }, [studentData]);

  // Build server-side filters (excluding skills which needs client-side filtering)
  const serverFilters = React.useMemo(() => {
    const filters = {};

    // Employment type filter based on student level
    // NOTE: Database stores employment_type with capital first letter (e.g., "Internship", "Full-time")
    if (studentType.isMiddleSchool) {
      // Middle school: No regular opportunities, only industrial visits
      filters.employmentType = []; // Will show no opportunities
    } else if (studentType.isHighSchool) {
      // High school (9-12): Only internships
      filters.employmentType = ['Internship'];
    } else if (studentType.isLearner) {
      // Learners: Only full-time jobs and internships (no industrial visits)
      if (advancedFilters.employmentType.length > 0) {
        filters.employmentType = advancedFilters.employmentType;
      } else {
        filters.employmentType = ['Internship', 'Full-time'];
      }
    } else if (studentType.isUniversityStudent) {
      // College: Both internships and full-time jobs
      if (advancedFilters.employmentType.length > 0) {
        filters.employmentType = advancedFilters.employmentType;
      }
      // No filter means show all (internships and jobs)
    } else if (advancedFilters.employmentType.length > 0) {
      filters.employmentType = advancedFilters.employmentType;
    }

    if (advancedFilters.experienceLevel.length > 0) {
      filters.experienceLevel = advancedFilters.experienceLevel;
    }
    if (advancedFilters.mode.length > 0) {
      filters.mode = advancedFilters.mode;
    }
    if (advancedFilters.department.length > 0) {
      filters.department = advancedFilters.department;
    }
    if (advancedFilters.salaryMin) {
      filters.salaryMin = advancedFilters.salaryMin;
    }
    if (advancedFilters.salaryMax) {
      filters.salaryMax = advancedFilters.salaryMax;
    }
    if (advancedFilters.postedWithin) {
      filters.postedWithin = advancedFilters.postedWithin;
    }

    return filters;
  }, [advancedFilters, studentType.isMiddleSchool, studentType.isHighSchool, studentType.isUniversityStudent, studentType.isLearner]);

  // Fetch opportunities with server-side pagination
  // IMPORTANT: Only fetch after studentData is loaded to ensure correct filters
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine if we should fetch opportunities based on student type and active tab
  const shouldFetchOpportunities = React.useMemo(() => {
    if (!studentData) return false;
    // Fetch opportunities for high school, college students, and learners when on my-jobs tab
    return (studentType.isHighSchool || studentType.isUniversityStudent || studentType.isLearner) && activeTab === 'my-jobs';
  }, [studentData, studentType.isHighSchool, studentType.isUniversityStudent, studentType.isLearner, activeTab]);
  
  const {
    opportunities,
    loading: dataLoading,
    error,
    totalCount,
    totalPages
  } = useOpportunities({
    fetchOnMount: shouldFetchOpportunities,
    activeOnly: true,
    searchTerm: debouncedSearch,
    page: currentPage,
    pageSize: opportunitiesPerPage,
    sortBy: sortBy,
    filters: serverFilters,
    serverSidePagination: true
  });

  // Client-side filter for skills (JSONB array filtering not supported well in Supabase)
  const filteredOpportunities = React.useMemo(() => {
    if (advancedFilters.skills.length === 0) {
      return opportunities;
    }

    return opportunities.filter(opp => {
      const oppSkills = opp.required_skills || opp.skills_required || [];
      return advancedFilters.skills.some(skill =>
        oppSkills.some(oppSkill =>
          oppSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
    });
  }, [opportunities, advancedFilters.skills]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      // Reset to page 1 when search changes
      if (searchTerm !== debouncedSearch) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [advancedFilters, sortBy]);

  // Clamp current page to valid range when totalPages changes
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage, totalCount]);

  // Pre-select opportunity from navigation state (from Dashboard) or auto-select first
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
    } else if (opportunities.length > 0 && !selectedOpportunity && activeTab === 'my-jobs') {
      // Auto-select first opportunity if none selected
      setSelectedOpportunity(opportunities[0]);
    }
  }, [location.state, opportunities, navigate, location.pathname, selectedOpportunity, activeTab]);

  // Set loading to false when data is ready (removed artificial 5-second delay)
  useEffect(() => {
    // For middle school students, wait for industrial visits to load
    if (studentType.isMiddleSchool) {
      if (!industrialVisitsLoading) {
        setIsLoading(false);
      }
    } 
    // For high school and college, wait for opportunities to load
    else if (studentType.isHighSchool || studentType.isUniversityStudent) {
      if (!dataLoading) {
        setIsLoading(false);
      }
    }
    // Fallback: if studentData is loaded but no specific type detected
    else if (studentData) {
      setIsLoading(false);
    }
  }, [dataLoading, industrialVisitsLoading, studentType.isMiddleSchool, studentType.isHighSchool, studentType.isUniversityStudent, studentData]);

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

  // Fetch applications with pipeline status - memoized to prevent duplicate fetches
  const fetchApplicationsData = React.useCallback(async () => {
    if (!studentId) return;

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
  }, [studentId, userEmail]);

  // Fetch applications when tab changes to my-applications or history
  useEffect(() => {
    if (activeTab === 'my-applications' || activeTab === 'history') {
      fetchApplicationsData();
    }
  }, [activeTab, fetchApplicationsData]);

  // Subscribe to real-time pipeline updates - reuse fetchApplicationsData
  useEffect(() => {
    if (!studentId || activeTab !== 'my-applications') return;

    const channel = StudentPipelineService.subscribeToPipelineUpdates(
      studentId,
      () => fetchApplicationsData() // Reuse the memoized function
    );

    return () => {
      StudentPipelineService.unsubscribeFromPipelineUpdates(channel);
    };
  }, [studentId, activeTab, fetchApplicationsData]);

  // Fetch industrial visits when tab is industrial-visits or on initial load for middle/high school
  useEffect(() => {
    const fetchIndustrialVisits = async () => {
      // Only fetch if on industrial-visits tab
      // OR if middle/high school student AND on their default view (not on my-applications)
      const shouldFetch = activeTab === 'industrial-visits' || 
                         ((studentType.isMiddleSchool || studentType.isHighSchool) && activeTab !== 'my-applications');
      
      if (shouldFetch) {
        setIndustrialVisitsLoading(true);
        try {
          // Fetch visits and registrations in parallel
          const promises = [factoryVisitsService.getAllFactoryVisits()];
          if (studentId) {
            promises.push(factoryVisitsService.getStudentRegistrations(studentId));
          }
          
          const [data, registrations] = await Promise.all(promises);
          
          setIndustrialVisits(data);
          // Auto-select first visit if none selected
          if (data && data.length > 0 && !selectedIndustrialVisit) {
            setSelectedIndustrialVisit(data[0]);
          }
          
          // Set registered visits
          if (registrations) {
            const registeredIds = new Set(registrations.map(r => r.opportunity_id));
            setRegisteredVisits(registeredIds);
          }
        } catch (error) {
          console.error('Error fetching industrial visits:', error);
        } finally {
          setIndustrialVisitsLoading(false);
        }
      }
    };

    fetchIndustrialVisits();
  }, [activeTab, studentType.isMiddleSchool, studentType.isHighSchool, studentId]);

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
  // NOTE: Most filtering is now done server-side. Only skills filtering remains client-side.
  const filteredAndSortedOpportunities = filteredOpportunities;

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

    // Check if profile is complete before allowing application
    if (needsProfileCompletion) {
      // Navigate to settings page
      navigate('/student/settings');
      return;
    }

    if (appliedJobs.has(opportunity.id)) {
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
      } else {
        console.error('Application failed:', result.message);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRegisterForVisit = async (visit) => {
    if (!studentId) {
      toast.error('Please log in to register for visits');
      return;
    }

    setIsRegistering(true);

    try {
      const result = await factoryVisitsService.registerForVisit(studentId, visit.id);

      if (result.success) {
        toast.success(result.message);
        setRegisteredVisits(prev => new Set([...prev, visit.id]));
        // Refresh applications to show in history
        if (activeTab === 'history') {
          fetchApplicationsData();
        }
      } else {
        toast.error(result.message);
        // Only navigate to settings if profile is incomplete (not if already registered)
        if (result.message.includes('complete your profile')) {
          setTimeout(() => navigate('/student/settings'), 1500);
        }
      }
    } catch (error) {
      console.error('Error registering for visit:', error);
      toast.error('An error occurred while registering');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Institution Details Modal - Shows on top of everything */}
      {showInstitutionModal && !isInstitutionComplete && (
        <>
          {/* Full white background overlay */}
          <div className="fixed inset-0 bg-white z-40"></div>
          
          {/* Modal backdrop and content */}
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
          >
            <button
              onClick={() => {
                setShowInstitutionModal(false);
                navigate('/student/dashboard');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Complete Your Institution Details
            </h3>
            <p className="text-gray-600 text-center mb-6">
              To view relevant opportunities, please complete your institution information in your profile settings.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-800 mb-2">Required Information:</p>
              {(() => {
                const gradeStr = String(studentData?.grade || '').toUpperCase().trim();
                const isSchool = gradeStr.match(/(\d+)/) || gradeStr.includes('DIPLOMA');
                const isCollege = gradeStr.includes('UG') || gradeStr.includes('PG') || 
                                  gradeStr.includes('YEAR') || gradeStr.includes('UNDERGRADUATE') || 
                                  gradeStr.includes('POSTGRADUATE') || gradeStr.includes('BACHELOR') || 
                                  gradeStr.includes('MASTER');
                
                if (isSchool && !isCollege) {
                  return (
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        School Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Section (A, B, C, etc.)
                      </li>
                    </ul>
                  );
                } else if (isCollege) {
                  return (
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        University Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        College Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Program/Course Name
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Current Semester & Section
                      </li>
                    </ul>
                  );
                }
                
                return (
                  <p className="text-sm text-gray-700">
                    Please complete your institution details
                  </p>
                );
              })()}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInstitutionModal(false);
                  navigate('/student/dashboard');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Later
              </button>
              <button
                onClick={() => {
                  navigate('/student/settings', { 
                    state: { 
                      activeTab: 'profile',
                      activeSubTab: 'institution'
                    } 
                  });
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Complete Now
              </button>
            </div>
          </motion.div>
        </div>
        </>
      )}

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

        {/* Tab Switcher - Show different tabs based on student level */}
        {!isLoading && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <div className={`grid ${
                studentType.isMiddleSchool 
                  ? 'grid-cols-2' 
                  : studentType.isHighSchool 
                    ? 'grid-cols-3'
                    : studentType.isLearner
                      ? 'grid-cols-3'
                      : 'grid-cols-3'
              } gap-2`}>
                {/* Industrial Visits Tab - Hide for learners */}
                {!studentType.isLearner && (
                  <button
                    onClick={() => setActiveTab('industrial-visits')}
                    className={`relative text-left p-4 rounded-lg transition-all ${
                      activeTab === 'industrial-visits'
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${activeTab === 'industrial-visits' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <Factory className={`w-6 h-6 ${activeTab === 'industrial-visits' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h1 className={`font-bold text-lg ${activeTab === 'industrial-visits' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          Industrial Visits
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          Explore factory visits and learning opportunities
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* History Tab - Show for middle school only */}
                {studentType.isMiddleSchool && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`relative text-left p-4 rounded-lg transition-all ${
                      activeTab === 'history'
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${activeTab === 'history' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <Clock className={`w-6 h-6 ${activeTab === 'history' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h1 className={`font-bold text-lg ${activeTab === 'history' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          History
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          View your past activities and visits
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* My Jobs Tab - Show for high school, college, and learners */}
                {(studentType.isHighSchool || studentType.isUniversityStudent || studentType.isLearner) && (
                  <button
                    onClick={() => setActiveTab('my-jobs')}
                    className={`relative text-left p-4 rounded-lg transition-all ${
                      activeTab === 'my-jobs'
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${activeTab === 'my-jobs' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <Briefcase className={`w-6 h-6 ${activeTab === 'my-jobs' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h1 className={`font-bold text-lg ${activeTab === 'my-jobs' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          My Jobs
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          {studentType.isUniversityStudent 
                            ? 'Browse internships and full-time opportunities'
                            : studentType.isLearner
                              ? 'Explore job opportunities'
                              : 'Explore internship opportunities'}
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* My Applications Tab - Show for high school, college, and learners */}
                {(studentType.isHighSchool || studentType.isUniversityStudent || studentType.isLearner) && (
                  <button
                    onClick={() => setActiveTab('my-applications')}
                    className={`relative text-left p-4 rounded-lg transition-all ${
                      activeTab === 'my-applications'
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${activeTab === 'my-applications' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <FileText className={`w-6 h-6 ${activeTab === 'my-applications' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h1 className={`font-bold text-lg ${activeTab === 'my-applications' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          My Applications
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          Track your application status and progress
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoading && (
          <div>
            {/* AI Recommended Jobs - Show for high school, college, and learners only */}
            {(studentType.isHighSchool || studentType.isUniversityStudent || studentType.isLearner) && activeTab === 'my-jobs' && (
              <RecommendedJobs
                studentProfile={{ ...studentData, id: studentId, profile: studentData }}
                onSelectJob={setSelectedOpportunity}
                appliedJobs={appliedJobs}
                savedJobs={savedJobs}
                onToggleSave={handleToggleSave}
                onApply={handleApply}
              />
            )}

            {/* My Jobs Tab - Show for high school, college, and learners */}
            {activeTab === 'my-jobs' && (studentType.isHighSchool || studentType.isUniversityStudent || studentType.isLearner) && (
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
                totalCount={totalCount}
                totalPages={totalPages}
                isServerPaginated={true}
                canApplyToJobs={canApplyToJobs}
                needsProfileCompletion={needsProfileCompletion}
                navigate={navigate}
                studentData={studentData}
              />
            )}

            {/* My Applications Tab - Show for high school, college, and learners */}
            {activeTab === 'my-applications' && (studentType.isHighSchool || studentType.isUniversityStudent || studentType.isLearner) && (
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

            {/* History Tab - Show for middle school only */}
            {activeTab === 'history' && studentType.isMiddleSchool && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">My Industrial Visit History</h2>
                  </div>
                  <p className="text-gray-600 ml-14">Track your registered industrial visits</p>
                </div>

                {/* Registrations List */}
                {(() => {
                  // Filter applications to only show factory visits
                  const visitRegistrations = applications.filter(app => 
                    app.type === 'factory_visit'
                  );

                  if (visitRegistrations.length === 0) {
                    return (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Factory className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Visit History Yet</h3>
                        <p className="text-gray-500 text-sm mb-4">You haven't registered for any industrial visits yet</p>
                        <button
                          onClick={() => setActiveTab('industrial-visits')}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Explore Industrial Visits
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {visitRegistrations.map((app) => {
                        const statusConfig = {
                          applied: { label: 'Registered', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
                          accepted: { label: 'Confirmed', color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircle2 },
                          rejected: { label: 'Not Selected', color: 'text-gray-600', bg: 'bg-gray-50', icon: XCircle },
                        }[app.status] || { label: 'Registered', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock };
                        
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div
                            key={app.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 p-6"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-indigo-50 rounded-lg">
                                    <Factory className="w-6 h-6 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                      {app.company}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        <span>{app.location}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        <span>Registered {new Date(app.appliedDate).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        <span>Updated {app.lastUpdate}</span>
                                      </div>
                                    </div>
                                    {app.jobTitle && app.jobTitle !== 'N/A' && (
                                      <p className="text-sm text-gray-600 mb-2">{app.jobTitle}</p>
                                    )}
                                    {app.level && app.level !== 'N/A' && (
                                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                                        {app.level}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} border border-gray-200`}>
                                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                                <span className={`text-sm font-semibold ${statusConfig.color}`}>
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Industrial Visits Tab - Show for all students */}
            {activeTab === 'industrial-visits' && (() => {
              // Filter logic
              const filteredVisits = industrialVisits.filter(visit => {
                const matchesSearch = ivSearchTerm === '' || 
                  visit.company_name.toLowerCase().includes(ivSearchTerm.toLowerCase()) ||
                  visit.location.toLowerCase().includes(ivSearchTerm.toLowerCase()) ||
                  visit.sector.toLowerCase().includes(ivSearchTerm.toLowerCase());
                const matchesSector = ivSectorFilter === 'all' || visit.sector === ivSectorFilter;
                const matchesLocation = ivLocationFilter === 'all' || visit.location.includes(ivLocationFilter);
                return matchesSearch && matchesSector && matchesLocation;
              });

              // Pagination logic
              const totalPages = Math.ceil(filteredVisits.length / ivItemsPerPage);
              const startIndex = (ivCurrentPage - 1) * ivItemsPerPage;
              const endIndex = startIndex + ivItemsPerPage;
              const paginatedVisits = filteredVisits.slice(startIndex, endIndex);

              return (
                <div className="space-y-6">
                  {/* Search and Filters - Matching Opportunities Style */}
                  <div className="space-y-4">
                    {/* Search Bar and Controls */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search company, location, or industry..."
                          value={ivSearchTerm}
                          onChange={(e) => {
                            setIvSearchTerm(e.target.value);
                            setIvCurrentPage(1);
                          }}
                          className="w-full h-12 pl-12 pr-12 bg-white border border-slate-200/60 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm"
                        />
                        {ivSearchTerm && (
                          <button
                            onClick={() => {
                              setIvSearchTerm('');
                              setIvCurrentPage(1);
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Control Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
                        {/* Sector Filter */}
                        <select
                          value={ivSectorFilter}
                          onChange={(e) => {
                            setIvSectorFilter(e.target.value);
                            setIvCurrentPage(1);
                          }}
                          className="flex-1 sm:flex-none lg:w-auto px-4 h-12 bg-white border border-slate-200/60 rounded-2xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm min-w-0 sm:min-w-[160px]"
                        >
                          <option value="all">All Industries</option>
                          {[...new Set(industrialVisits.map(v => v.sector))].sort().map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                          ))}
                        </select>

                        {/* Location Filter */}
                        <select
                          value={ivLocationFilter}
                          onChange={(e) => {
                            setIvLocationFilter(e.target.value);
                            setIvCurrentPage(1);
                          }}
                          className="flex-1 sm:flex-none lg:w-auto px-4 h-12 bg-white border border-slate-200/60 rounded-2xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm min-w-0 sm:min-w-[160px]"
                        >
                          <option value="all">All Locations</option>
                          {[...new Set(industrialVisits.map(v => v.location.split(',')[0].trim()))].sort().map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-white border border-slate-200/60 rounded-2xl p-1 shadow-sm h-12">
                          <button
                            onClick={() => setIvViewMode('grid')}
                            className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${
                              ivViewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Grid3x3 className="w-4 h-4 mx-auto" />
                          </button>
                          <button
                            onClick={() => setIvViewMode('list')}
                            className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${
                              ivViewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <List className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Results Count and Clear Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-xs md:text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredVisits.length)} of {filteredVisits.length} visits
                        {filteredVisits.length !== industrialVisits.length && (
                          <span className="hidden sm:inline"> (filtered from {industrialVisits.length} total)</span>
                        )}
                      </p>
                      {(ivSearchTerm || ivSectorFilter !== 'all' || ivLocationFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setIvSearchTerm('');
                            setIvSectorFilter('all');
                            setIvLocationFilter('all');
                            setIvCurrentPage(1);
                          }}
                          className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 self-start sm:self-auto"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Industrial Visits Grid with Preview Panel */}
                  {industrialVisitsLoading ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredVisits.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                      <Factory className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No industrial visits found</h3>
                      <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Cards Grid (2 columns, 6 cards) */}
                      <div className="lg:col-span-2">
                        {ivViewMode === 'grid' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {paginatedVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className={`bg-white border rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer ${
                                  selectedIndustrialVisit?.id === visit.id
                                    ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedIndustrialVisit(visit)}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="p-2 bg-blue-50 rounded-lg">
                                    <Factory className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                    Visit
                                  </span>
                                </div>
                                
                                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                                  {visit.company_name}
                                </h3>
                                
                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 flex-shrink-0" />
                                    <span className="line-clamp-1">{visit.sector}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="line-clamp-1">{visit.location}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {paginatedVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer ${
                                  selectedIndustrialVisit?.id === visit.id
                                    ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedIndustrialVisit(visit)}
                              >
                                <div className="flex items-start gap-4">
                                  <div className="p-3 bg-blue-50 rounded-lg flex-shrink-0">
                                    <Factory className="w-6 h-6 text-blue-600" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                      <h3 className="font-bold text-lg text-gray-900">
                                        {visit.company_name}
                                      </h3>
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                                        Visit
                                      </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{visit.sector}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <span>{visit.location}</span>
                                      </div>
                                    </div>
                                    
                                    {visit.description && (
                                      <p className="text-sm text-gray-600 line-clamp-2">
                                        {visit.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Fixed Preview Panel */}
                      <div className="hidden lg:block lg:sticky lg:top-16 lg:self-start">
                        <IndustrialVisitPreview
                          visit={selectedIndustrialVisit}
                          onRegister={handleRegisterForVisit}
                          isRegistered={selectedIndustrialVisit && registeredVisits.has(selectedIndustrialVisit.id)}
                          isRegistering={isRegistering}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {filteredVisits.length > ivItemsPerPage && (
                    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm">
                      <Pagination
                        currentPage={ivCurrentPage}
                        totalPages={totalPages}
                        totalItems={filteredVisits.length}
                        itemsPerPage={ivItemsPerPage}
                        onPageChange={(page) => {
                          const validPage = Math.max(1, Math.min(page, totalPages));
                          setIvCurrentPage(validPage);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
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
  studentData,
  totalCount = 0,
  totalPages: serverTotalPages = 1,
  isServerPaginated = false,
  canApplyToJobs,
  needsProfileCompletion,
  navigate
}) => {
  // Use server-side pagination values when available
  const totalPages = isServerPaginated ? serverTotalPages : Math.max(1, Math.ceil(opportunities.length / opportunitiesPerPage));
  const displayedOpportunities = isServerPaginated ? opportunities : (() => {
    const startIndex = (currentPage - 1) * opportunitiesPerPage;
    return opportunities.slice(startIndex, startIndex + opportunitiesPerPage);
  })();
  const displayCount = isServerPaginated ? totalCount : opportunities.length;

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
                        View Details
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
      <div className="mb-8 space-y-4">
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
                className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <Grid3x3 className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
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
              Showing {displayCount} Jobs Results
            </p>
            {displayCount > 0 && (
              <span className="text-xs text-slate-500">
                (Page {currentPage} of {totalPages})
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
                      {displayedOpportunities.map((opp) => (
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
                      {displayedOpportunities.map((opp) => (
                        <OpportunityListItem
                          key={opp.id}
                          opportunity={opp}
                          onClick={() => setSelectedOpportunity(opp)}
                          isSelected={selectedOpportunity?.id === opp.id}
                          isApplied={appliedJobs.has(opp.id)}
                          isSaved={savedJobs.has(opp.id)}
                          onApply={() => handleApply(opp)}
                          onToggleSave={handleToggleSave}
                          studentData={studentData}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <EmptyOpportunitiesState 
                  studentData={studentData}
                  navigate={navigate}
                />
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
                canApplyToJobs={canApplyToJobs}
                needsProfileCompletion={needsProfileCompletion}
                navigate={navigate}
                studentData={studentData}
              />
            </div>
          </div>

          {/* Pagination */}
          {displayCount > 0 && totalPages > 1 && (
            <div className="mt-8">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={displayCount}
                  itemsPerPage={opportunitiesPerPage}
                  onPageChange={(page) => {
                    const validPage = Math.max(1, Math.min(page, totalPages));
                    setCurrentPage(validPage);
                  }}
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
      const conversation = await MessageService.getOrCreateConversation(
        String(studentId), // Ensure string
        String(app.recruiterId), // Ensure string
        app.id, // applicationId
        app.opportunityId, // opportunityId
        `Application: ${app.jobTitle}` // subject
      );

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
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${isCompleted
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
                                      <div className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 transition-all ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                        }`} style={{ transform: 'translateY(-50%)' }} />
                                    )}

                                    {/* Stage Label */}
                                    <div className={`text-xs font-medium text-center px-1 transition-all ${isCurrent
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