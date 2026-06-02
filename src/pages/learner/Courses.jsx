import { motion } from 'framer-motion';
import {
    ArrowDownAZ,
    Award,
    BookOpen,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    Grid3x3,
    List,
    Lock,
    Play,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar, CertificateNameModal } from '@/shared/ui';
import { CourseDetailModal } from '@/features/courses';
import WeeklyLearningTracker from '@/entities/learner/ui/WeeklyLearningTracker';
import { CourseAdvancedFilters } from '@/widgets/learner-dashboard';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui';

import { supabase } from '@/shared/api/supabaseClient';
import { downloadCertificate } from '@/features/digital-portfolio';
import { enrollmentService as courseEnrollmentService } from '@/features/courses';
import { useSubscriptionContext } from '@/features/subscription/model/subscriptionStore';
import { PLAN_IDS, PLAN_HIERARCHY_LEVELS } from '@/shared/config/subscriptionPlans';
import { getLogger } from '@/shared/config/logging';
import toast from 'react-hot-toast';
import { useCertificateModal } from '@/shared/hooks';
import { viewCertificate } from '@/shared/lib/certificateUtils';

import { useUser } from '@/shared/model/authStore';

const logger = getLogger('courses-page');

const Courses = () => {
  const navigate = useNavigate();
  const user = useUser();
  const subscriptionContext = useSubscriptionContext();
  const subscription = subscriptionContext?.subscription;
  const userPlan = subscription?.plan ?? PLAN_IDS.FREEMIUM;
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [learnerGrade, setlearnerGrade] = useState(null);
  const [learnerBranch, setlearnerBranch] = useState(null);
  const [filterByBranch, setFilterByBranch] = useState(true); // Toggle for branch filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'Active', 'Upcoming'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'title', 'enrollment_count'
  const [advancedFilters, setAdvancedFilters] = useState({
    category: [],
    skillType: [],
    duration: [],
    enrollmentRange: '',
    postedWithin: '',
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0); // Total courses count for pagination
  const coursesPerPage = 6;
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'progress'
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [enrollmentProgress, setEnrollmentProgress] = useState({}); // Track progress per course
  const [certificateUrls, setCertificateUrls] = useState({}); // Track certificate URLs per course
  const [downloadingCertificate, setDownloadingCertificate] = useState(null); // Track which certificate is downloading
  const [preparingCertificate, setPreparingCertificate] = useState(null); // Track which certificate is being prepared
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Refs to prevent duplicate fetches and track initialization
  const isFetchingRef = useRef(false);
  const hasFetchedCoursesRef = useRef(false);
  const hasFetchedEnrollmentsRef = useRef(false);
  const userEmailRef = useRef(user?.email);
  const preparingCertificateRef = useRef(new Set()); // Track certificates currently being prepared
  
  // Helper function to check if user has access to a course
  const canAccessCourse = useCallback((course) => {
    const coursePlanType = course.plan_type?.toLowerCase() || 'freemium';
    
    // If course is freemium, everyone can access
    if (coursePlanType === 'freemium') {
      return true;
    }
    
    // For non-freemium courses, check user's plan level using shared constant
    const userPlanLevel = PLAN_HIERARCHY_LEVELS[userPlan?.toLowerCase()] || 0;
    const coursePlanLevel = PLAN_HIERARCHY_LEVELS[coursePlanType] || 0;
    
    return userPlanLevel >= coursePlanLevel;
  }, [userPlan]);

  // Memoized callback for fetching enrollments
  const fetchEnrollments = useCallback(async () => {
    const email = userEmailRef.current;
    if (!email) return;
    
    try {
      const result = await courseEnrollmentService.getlearnerEnrollments(email);
      if (result.success && result.data) {
        const enrolledIds = new Set(result.data.map(enrollment => enrollment.course_id));
        setEnrolledCourseIds(enrolledIds);
        
        // Track progress and certificate URLs for each enrolled course
        const progressMap = {};
        const certUrls = {};
        result.data.forEach(enrollment => {
          progressMap[enrollment.course_id] = {
            progress: enrollment.progress || 0,
            lastModuleIndex: enrollment.last_module_index || 0,
            lastLessonIndex: enrollment.last_lesson_index || 0,
            status: enrollment.status
          };
          // Track certificate URL if available
          if (enrollment.certificate_url) {
            certUrls[enrollment.course_id] = enrollment.certificate_url;
          }
        });
        setEnrollmentProgress(progressMap);
        setCertificateUrls(certUrls);
        
      }
    } catch (error) {
      logger.error('Error fetching enrollments', error);
    }
  }, []);

  /**
   * Certificate success handler - memoized to prevent unnecessary re-renders
   * 
   * Flow:
   * 1. Updates local state with new certificate URL for instant UI feedback
   * 2. Refreshes enrollments to sync with database
   * 
   * @param {Object} result - Certificate generation result
   * @param {string} result.certificateUrl - Generated certificate URL
   * @param {string} result.courseId - Course ID
   */
  const handleCertificateSuccess = useCallback(async ({ certificateUrl, courseId }) => {
    // Update local state with new certificate URL for immediate UI update
    if (courseId) {
      setCertificateUrls(prev => ({
        ...prev,
        [courseId]: certificateUrl
      }));
    }
    
    // Refresh enrollments to get updated certificate URL from database
    try {
      await fetchEnrollments();
    } catch (error) {
      logger.error('Error refreshing enrollments after certificate generation', 
        error instanceof Error ? error : new Error(String(error)));
    }
  }, [fetchEnrollments]);

  /**
   * Certificate modal hook for course certificate generation
   * 
   * Flow:
   * 1. User clicks "Get Certificate" on completed course
   * 2. handleGetCertificate fetches fresh learner data
   * 3. Opens modal with pre-filled certificate information
   * 4. User enters/confirms name and generates certificate
   * 5. onSuccess callback updates local state and refreshes enrollments
   * 
   * State Updates:
   * - certificateUrls: Updates with new certificate URL for instant UI feedback
   * - Triggers fetchEnrollments to sync with database
   */
  const certificateModal = useCertificateModal({
    user,
    onSuccess: handleCertificateSuccess
  });

  // Handle window resize for responsive pagination
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch courses and enrollments from Supabase
  // Use user?.email as dependency instead of user object to prevent re-fetches on object reference changes
  useEffect(() => {
    // Fetch courses once on mount - don't wait for learner info if it's taking too long
    // We'll show all courses if grade/branch is not available
    if (!hasFetchedCoursesRef.current) {
      hasFetchedCoursesRef.current = true;
      fetchCourses();
    }
  }, [fetchCourses]); // Include fetchCourses in dependencies

  // Fetch courses when search, filter, sort, or page changes
  useEffect(() => {
    // Skip initial load (handled by the effect above)
    if (hasFetchedCoursesRef.current) {
      fetchCourses();
    }
  }, [debouncedSearch, filterStatus, sortBy, advancedFilters, currentPage, filterByBranch, fetchCourses]);

  // Fetch learner grade and branch for filtering
  useEffect(() => {
    const fetchlearnerInfo = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('learners')
          .select('grade, branch_field')
          .eq('email', user.email)
          .maybeSingle();
        
        if (!error && data) {
          setlearnerGrade(data.grade);
          setlearnerBranch(data.branch_field);
          
          // Re-fetch courses with proper filtering once learner info is available
          // Only if courses have already been fetched once
          if (hasFetchedCoursesRef.current) {
            fetchCourses();
          }
        }
      } catch (error) {
        logger.error('Error fetching learner info', error);
      }
    };
    
    fetchlearnerInfo();
  }, [user?.email, fetchCourses]);

  // Separate effect for enrollments - only when user email changes
  useEffect(() => {
    const currentEmail = user?.email;
    
    // Only fetch if email exists and either hasn't been fetched or email changed
    if (currentEmail && (!hasFetchedEnrollmentsRef.current || userEmailRef.current !== currentEmail)) {
      userEmailRef.current = currentEmail;
      hasFetchedEnrollmentsRef.current = true;
      fetchEnrollments();
    }
  }, [user?.email, fetchEnrollments]);

  const fetchCourses = useCallback(async () => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    const isFirstLoad = initialLoad;

    try {
      setLoading(true);

      // Calculate pagination range
      const from = (currentPage - 1) * coursesPerPage;
      const to = from + coursesPerPage - 1;

      // Build base query for courses with status Active or Upcoming
      // Also exclude deleted courses
      let query = supabase
        .from('courses')
        .select('*', { count: 'exact' }) // Get total count for pagination
        .in('status', ['Active', 'Upcoming'])
        .is('deleted_at', null);

      // Apply classification filter based on learner grade (ALWAYS applied if grade exists)
      // If no grade, show all courses (fallback)
      if (learnerGrade) {
        let classification = null;
        
        // Handle numeric grades (6-12)
        if (/^(Grade\s*)?(\d+)$/i.test(learnerGrade)) {
          const gradeNum = parseInt(learnerGrade.match(/\d+/)[0]);
          
          if (gradeNum >= 6 && gradeNum <= 8) {
            classification = 'middle_school';
          } else if (gradeNum >= 9 && gradeNum <= 10) {
            classification = 'high_school';
          } else if (gradeNum >= 11 && gradeNum <= 12) {
            classification = 'higher_secondary';
          }
        }
        // Handle college/university grades (UG, PG, Diploma)
        else if (/^(UG|PG|Diploma)/i.test(learnerGrade)) {
          classification = 'college';
        }
        
        if (classification) {
          // Show courses that match classification OR have no classification (universal courses)
          query = query.or(`classification.eq.${classification},classification.is.null`);
        }
      }
      // FALLBACK: If no grade is set, show all courses (no classification filter)

      // Apply branch/category filter based on learner's branch_field
      // Only filter if learner has a branch AND toggle is enabled AND no category filter is already applied
      if (filterByBranch && learnerBranch && learnerBranch.trim() && advancedFilters.category.length === 0) {
        // Show courses where category matches learner's branch OR category is null
        // Use a more precise match to avoid showing unrelated courses
        query = query.or(`category.eq.${learnerBranch},category.is.null`);
      }

      // Apply search filter at database level
      if (debouncedSearch && debouncedSearch.trim()) {
        query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,code.ilike.%${debouncedSearch}%`);
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply advanced filters
      if (advancedFilters.category.length > 0) {
        query = query.in('category', advancedFilters.category);
      }

      if (advancedFilters.skillType.length > 0) {
        query = query.in('skill_type', advancedFilters.skillType.map(type => type.toLowerCase()));
      }

      if (advancedFilters.duration.length > 0) {
        query = query.in('duration', advancedFilters.duration);
      }

      // Apply enrollment range filter
      if (advancedFilters.enrollmentRange) {
        const range = advancedFilters.enrollmentRange;
        if (range === '1-25') {
          query = query.gte('enrollment_count', 1).lte('enrollment_count', 25);
        } else if (range === '26-100') {
          query = query.gte('enrollment_count', 26).lte('enrollment_count', 100);
        } else if (range === '101-500') {
          query = query.gte('enrollment_count', 101).lte('enrollment_count', 500);
        } else if (range === '500+') {
          query = query.gte('enrollment_count', 500);
        }
      }

      // Apply posted within filter
      if (advancedFilters.postedWithin) {
        const daysAgo = parseInt(advancedFilters.postedWithin);
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
        query = query.gte('created_at', dateThreshold.toISOString());
      }

      // Apply sorting
      switch (sortBy) {
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        case 'enrollment_count':
          query = query.order('enrollment_count', { ascending: false, nullsFirst: false });
          break;
        case 'created_at':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply pagination range
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCourses(data || []);
      setTotalCount(count || 0);

      if (isFirstLoad) {
        setInitialLoad(false);
      }
    } catch (error) {
      logger.error('Error fetching courses', error);
      if (isFirstLoad) {
        setInitialLoad(false);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearch, filterStatus, sortBy, initialLoad, advancedFilters, currentPage, learnerGrade, learnerBranch, filterByBranch]);

  // Check if course has resumable progress
  const hasResumableProgress = (courseId) => {
    const progress = enrollmentProgress[courseId];
    return progress && progress.progress > 0 && progress.progress < 100;
  };

  // Check if course is completed
  const isCourseCompleted = (courseId) => {
    const progress = enrollmentProgress[courseId];
    return progress && (progress.progress >= 100 || progress.status === 'completed');
  };

  // Get course progress percentage
  const getCourseProgress = (courseId) => {
    const progress = enrollmentProgress[courseId];
    return progress?.progress || 0;
  };

  /**
   * Get certificate URL for a course from local state
   * 
   * @param {string} courseId - Course ID to look up
   * @returns {string|null} Certificate URL or null if not available
   */
  const getCertificateUrl = (courseId) => {
    return certificateUrls[courseId] || null;
  };

  /**
   * Handle "Get Certificate" button click
   * 
   * Race Condition Protection:
   * - Uses ref-based guard to prevent duplicate simultaneous calls
   * - Tracks loading state per certificate
   * - Early returns if already processing
   * 
   * Two scenarios:
   * 1. Certificate exists: View it directly using viewCertificate utility
   * 2. Certificate doesn't exist: Open modal to generate new certificate
   * 
   * Generation Flow:
   * - Check if already preparing this certificate (guard)
   * - Set loading state
   * - Fetch fresh learner data from database
   * - Prepare certificate parameters (name, educator, course type, etc.)
   * - Guard check ensures modal is initialized
   * - Open modal with pre-filled data
   * - User confirms name and generates certificate
   * 
   * @param {string} courseId - ID of the course
   * @param {string} courseName - Name of the course
   * @param {Event} e - Click event (for stopPropagation)
   */
  const handleGetCertificate = useCallback(async (courseId, courseName, e) => {
    e?.stopPropagation();
    
    // Race condition guard: Prevent duplicate calls for the same certificate
    if (preparingCertificateRef.current.has(courseId)) {
      logger.warn('Certificate preparation already in progress for course', { courseId });
      return;
    }
    
    try {
      // Check if certificate already exists
      const existingCertUrl = getCertificateUrl(courseId);
      if (existingCertUrl) {
        // Certificate already exists, show it directly
        viewCertificate(existingCertUrl);
        return;
      }
      
      // Mark this certificate as being prepared
      preparingCertificateRef.current.add(courseId);
      setPreparingCertificate(courseId);
      
      // Get course details for certificate generation
      const course = courses.find(c => c.course_id === courseId);
      if (!course) {
        toast.error('Course not found');
        return;
      }
      
      // Get learner data - fetch fresh from database
      if (!user?.email) {
        toast.error('User email not found');
        return;
      }
      
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('id, learner_id, name, email')
        .eq('email', user.email)
        .maybeSingle();
      
      if (learnerError) {
        logger.error('Error fetching learner data', learnerError instanceof Error ? learnerError : new Error(String(learnerError)));
        toast.error('Failed to fetch learner information');
        return;
      }
      
      if (!learnerData) {
        toast.error('Learner profile not found. Please complete your profile first.');
        return;
      }
      
      /**
       * Prepare certificate data for modal
       * 
       * Data includes:
       * - educatorName: Instructor name or default
       * - courseType: 'webinar' or 'course'
       * - issuedOnDate: Only for webinars, null for courses
       */
      const educatorName = course.educator_name || 'Course Instructor';
      const courseType = course.course_type === 'webinar' ? 'webinar' : 'course';
      const issuedOnDate = courseType === 'webinar' ? course.issued_on : null;
      
      /**
       * Guard check: Ensure certificate modal is properly initialized
       * 
       * Prevents runtime errors if:
       * - Hook failed to initialize
       * - Component unmounted during async operation
       * - Hook returned undefined due to error
       * 
       * Logs detailed error context for debugging
       */
      if (!certificateModal?.openModal) {
        logger.error('Certificate modal not initialized', { certificateModal });
        toast.error('Certificate modal is not available. Please refresh the page.');
        return;
      }
      
      // Open certificate modal with all required data
      await certificateModal.openModal({
        learnerId: learnerData.id,
        learnerIdText: learnerData.learner_id,
        courseName,
        educatorName,
        courseType,
        issuedOnDate,
        courseId,
        prefillName: learnerData.name || ''
      });
    } catch (error) {
      logger.error('Error preparing certificate modal', error instanceof Error ? error : new Error(String(error)));
      toast.error('Failed to prepare certificate generation');
    } finally {
      // Always clean up loading state
      preparingCertificateRef.current.delete(courseId);
      setPreparingCertificate(null);
    }
  }, [courses, user?.email, certificateModal]);

  // Check if a course is new (posted within last 24 hours)
  const isNewCourse = (createdAt) => {
    if (!createdAt) return false;
    const courseDate = new Date(createdAt);
    const now = new Date();
    const hoursDifference = (now - courseDate) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  };

  // Reset to page 1 when search or filter changes (but not when page changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, sortBy, advancedFilters, filterByBranch]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Handle advanced filters
  const handleAdvancedFilters = (newFilters) => {
    setAdvancedFilters(newFilters);
  };

  // Check if any advanced filters are active
  const hasActiveAdvancedFilters = () => {
    return (
      advancedFilters.category.length > 0 ||
      advancedFilters.skillType.length > 0 ||
      advancedFilters.duration.length > 0 ||
      advancedFilters.enrollmentRange ||
      advancedFilters.postedWithin
    );
  };

  // Courses are already paginated from the server
  const currentCourses = courses;

  // Pagination logic - use totalCount from server
  const totalPages = Math.ceil(totalCount / coursesPerPage);

  // Generate page numbers for pagination - responsive version
  const getPageNumbers = () => {
    const pages = [];
    const isMobile = windowWidth < 640; // sm breakpoint
    const maxVisiblePages = isMobile ? 3 : 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if within limit
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (isMobile) {
        // Mobile: Show current page and adjacent pages
        if (currentPage <= 2) {
          pages.push(1, 2, 3);
          if (totalPages > 3) {
            pages.push('...');
            pages.push(totalPages);
          }
        } else if (currentPage >= totalPages - 1) {
          pages.push(1);
          if (totalPages > 3) {
            pages.push('...');
          }
          pages.push(totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1);
          pages.push('...');
          pages.push(currentPage);
          pages.push('...');
          pages.push(totalPages);
        }
      } else {
        // Desktop: Show more pages
        // Always show first 3 pages
        pages.push(1, 2, 3);

        // Add ellipsis and last page if there are more pages
        if (totalPages > 3) {
          if (currentPage > 4) {
            pages.push('...');
          }

          // Show current page if it's beyond page 3 and not the last page
          if (currentPage > 3 && currentPage < totalPages) {
            pages.push(currentPage);
          }

          // Add ellipsis before last page if needed
          if (currentPage < totalPages - 1) {
            pages.push('...');
          }

          // Always show last page
          pages.push(totalPages);
        }
      }
    }

    return pages;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handle course card click - show detail modal
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowDetailModal(true);
  };

  // Handle start course - navigate to course player
  const handleStartCourse = (course) => {
    setShowDetailModal(false);
    navigate(`/learner/courses/${course.course_id}/learn`);
  };

  return (
    <>
      {/* Course Detail Modal */}
      <CourseDetailModal
        course={selectedCourse}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStartCourse={handleStartCourse}
        enrollmentProgress={enrollmentProgress}
      />
      
      {/* Certificate Generation Modal */}
      <CertificateNameModal
        isOpen={certificateModal.showModal}
        onClose={certificateModal.closeModal}
        fullName={certificateModal.fullName}
        onFullNameChange={certificateModal.setFullName}
        onConfirm={certificateModal.showConfirmationDialog}
        onGenerate={certificateModal.generateCertificate}
        isGenerating={certificateModal.isGenerating}
        showConfirmation={certificateModal.showConfirmation}
        onCancelConfirmation={certificateModal.cancelConfirmation}
        validationError={certificateModal.validationError}
        generatedCertificateUrl={certificateModal.generatedUrl}
        onView={() => viewCertificate(certificateModal.generatedUrl)}
        onDownload={certificateModal.downloadGeneratedCertificate}
        courseName={certificateModal.pendingData?.courseName}
      />
      
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Initial Loading State - Full Page Loader */}
          {loading && initialLoad && (
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
                  <p className="text-xl font-semibold text-gray-800 mb-2">Loading Courses...</p>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    Powered by <span className="font-semibold text-indigo-600">RareMinds</span>
                  </p>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* Header with Tabs */}
          {!initialLoad && (
            <div className="mb-8">
              {/* Tab Navigation with Subheadings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Courses Tab */}
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`relative text-left p-4 rounded-lg transition-all ${
                      activeTab === 'courses'
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activeTab === 'courses' ? 'bg-indigo-600' : 'bg-gray-100'
                      }`}>
                        <BookOpen className={`w-6 h-6 ${
                          activeTab === 'courses' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h1 className={`font-bold text-2xl ${
                          activeTab === 'courses' ? 'text-indigo-600' : 'text-gray-900'
                        }`}>
                          Courses
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          Explore and enroll in courses to enhance your skills
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Weekly Learning Progress Tab */}
                  <button
                    onClick={() => setActiveTab('progress')}
                    className={`relative text-left p-4 rounded-lg transition-all ${
                      activeTab === 'progress'
                        ? 'bg-gradient-to-r from-indigo-50 to-blue-50 shadow-md'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activeTab === 'progress' ? 'bg-indigo-600' : 'bg-gray-100'
                      }`}>
                        <TrendingUp className={`w-6 h-6 ${
                          activeTab === 'progress' ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h1 className={`font-bold text-lg ${
                          activeTab === 'progress' ? 'text-indigo-600' : 'text-gray-900'
                        }`}>
                          Weekly Learning Progress
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                          Track your learning activity and achievements
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Weekly Learning Progress Tab - Only render when active to prevent chart dimension issues */}
        {!loading && activeTab === 'progress' && (
          <div>
            <WeeklyLearningTracker />
          </div>
        )}

        {/* Courses Tab Content */}
        {/* Search and Filters */}
        {!initialLoad && activeTab === 'courses' && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onDebouncedChange={setDebouncedSearch}
                  debounceMs={500}
                  placeholder="Search courses by title, code, or description..."
                  size="lg"
                  className="shadow-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 items-center w-full lg:w-auto flex-wrap">
                {/* Branch Filter Toggle - Only show if learner has a branch */}
                {learnerBranch && (
                  <button
                    onClick={() => {
                      isFetchingRef.current = false; // Reset fetch lock
                      setFilterByBranch(!filterByBranch);
                    }}
                    className={`h-12 px-4 rounded-lg transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${
                      filterByBranch 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {filterByBranch ? `My Branch (${learnerBranch})` : 'All Branches'}
                    </span>
                  </button>
                )}

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-12 px-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex-1 lg:flex-none lg:min-w-[150px]"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                </select>

                {/* Sort By Filter */}
                <div className="relative flex-1 lg:flex-none lg:min-w-[150px]">
                  <ArrowDownAZ className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-12 pl-10 pr-4 w-full bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="title">Name (A-Z)</option>
                    <option value="enrollment_count">Most Popular</option>
                  </select>
                </div>

                {/* Advanced Filters */}
                <CourseAdvancedFilters
                  onApplyFilters={handleAdvancedFilters}
                  initialFilters={advancedFilters}
                />

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden h-12 bg-white shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 flex items-center justify-center ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 flex items-center justify-center ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Clear Filters Button */}
                {(filterStatus !== 'all' || searchTerm !== '' || sortBy !== 'created_at' || hasActiveAdvancedFilters() || (learnerBranch && !filterByBranch)) && (
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchTerm('');
                      setDebouncedSearch('');
                      setSortBy('created_at');
                      setFilterByBranch(true);
                      setAdvancedFilters({
                        category: [],
                        skillType: [],
                        duration: [],
                        enrollmentRange: '',
                        postedWithin: '',
                      });
                    }}
                    className="h-12 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Count and Active Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Results Count */}
              {!loading && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{totalCount}</span> course{totalCount !== 1 ? 's' : ''} found
                  {(searchTerm || filterStatus !== 'all' || hasActiveAdvancedFilters()) && (
                    <span className="ml-1">matching your criteria</span>
                  )}
                  {learnerBranch && filterByBranch && (
                    <span className="ml-2 text-indigo-600 font-medium">
                      {/* • Filtered for {learnerBranch} */}
                    </span>
                  )}
                </div>
              )}

              {/* Active Filters Indicator */}
              {hasActiveAdvancedFilters() && (
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  <span className="text-gray-600 font-medium">Active filters:</span>
                  {advancedFilters.category.map(cat => (
                    <span key={cat} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      Category: {cat}
                    </span>
                  ))}
                  {advancedFilters.skillType.map(type => (
                    <span key={type} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Skill: {type}
                    </span>
                  ))}
                  {advancedFilters.duration.map(dur => (
                    <span key={dur} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Duration: {dur}
                    </span>
                  ))}
                  {advancedFilters.enrollmentRange && (
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                      Popularity: {
                        advancedFilters.enrollmentRange === '1-25' ? 'Intimate Learning' :
                        advancedFilters.enrollmentRange === '26-100' ? 'Interactive Groups' :
                        advancedFilters.enrollmentRange === '101-500' ? 'Popular Courses' :
                        advancedFilters.enrollmentRange === '500+' ? 'Massive Enrollment' :
                        'All Courses'
                      }
                    </span>
                  )}
                  {advancedFilters.postedWithin && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      Posted: Last {advancedFilters.postedWithin} days
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !initialLoad && activeTab === 'courses' && totalCount === 0 && (
          <Card className="text-center py-12 shadow-sm border border-gray-200">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No courses available at the moment'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Skeleton Loading - Grid View */}
        {loading && !initialLoad && activeTab === 'courses' && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <Card className="h-full border border-gray-200 overflow-hidden">
                  <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Courses Grid View */}
        {!loading && activeTab === 'courses' && viewMode === 'grid' && currentCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCourses.map((course) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden group">
                  {/* Course Thumbnail - Always show with placeholder if no image */}
                  <div className="h-40 overflow-hidden bg-slate-100 relative">
                    {course.thumbnail && (course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) ? (
                      <motion.img
                        src={course.thumbnail}
                        alt={course.title}
                        className={`w-full h-full object-cover ${!canAccessCourse(course) ? 'opacity-60' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-100 ${!canAccessCourse(course) ? 'opacity-60' : ''}`}>
                        <BookOpen className="h-12 w-12 text-slate-400 mb-2" />
                        <span className="text-slate-500 text-xs font-medium">No Image</span>
                      </div>
                    )}
                    
                    {/* Lock Overlay for restricted courses */}
                    {!canAccessCourse(course) && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3 shadow-lg">
                          <Lock className="w-6 h-6 text-gray-700" />
                        </div>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-2">
                      {isCourseCompleted(course.course_id) ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg font-semibold px-3 py-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </Badge>
                        </motion.div>
                      ) : hasResumableProgress(course.course_id) ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg font-semibold px-3 py-1 flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Resume ({enrollmentProgress[course.course_id]?.progress}%)
                          </Badge>
                        </motion.div>
                      ) : enrolledCourseIds.has(course.course_id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg font-semibold px-3 py-1">
                            Enrolled
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      {/* <div className="flex gap-2 flex-wrap">
                        <Badge className={`${getStatusColor(course.status)} border`}>
                          {course.status}
                        </Badge>
                      </div> */}
                      <span className="text-xs font-medium text-gray-500">{course.code}</span>
                      
                      {/* Issued Date - Right Side */}
                      {course.issued_on && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(course.issued_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollment_count || 0}</span>
                      </div>
                    </div>

                    {/* Educator Info */}
                    {course.educator_name && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {course.educator_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Instructor</p>
                          <p className="text-sm font-medium text-gray-900">{course.educator_name}</p>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar - Show for enrolled courses */}
                    {enrolledCourseIds.has(course.course_id) && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">Progress</span>
                          <span className={`text-xs font-semibold ${isCourseCompleted(course.course_id) ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {getCourseProgress(course.course_id)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getCourseProgress(course.course_id)}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              isCourseCompleted(course.course_id) 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Certificate Buttons for Completed Courses */}
                    {isCourseCompleted(course.course_id) ? (
                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          onClick={() => handleCourseClick(course)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          View Course
                        </Button>
                        <Button
                          onClick={(e) => handleGetCertificate(course.course_id, course.title, e)}
                          disabled={preparingCertificate === course.course_id}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {preparingCertificate === course.course_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Preparing...
                            </>
                          ) : (
                            <>
                              <Award className="w-4 h-4" />
                              {getCertificateUrl(course.course_id) ? 'View Certificate' : 'Get Certificate'}
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleCourseClick(course)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        View Course Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Skeleton Loading - List View */}
        {loading && !initialLoad && activeTab === 'courses' && viewMode === 'list' && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <Card className="border-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="w-full lg:w-48 h-32 flex-shrink-0 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300"></div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded w-40"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Courses List View */}
        {!loading && activeTab === 'courses' && viewMode === 'list' && currentCourses.length > 0 && (
          <div className="space-y-4">
            {currentCourses.map((course) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 border-0">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Thumbnail - Always show with placeholder if no image */}
                      <div className="w-full lg:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 relative">
                        {course.thumbnail && (course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                            <BookOpen className="h-10 w-10 text-slate-400 mb-1" />
                            <span className="text-slate-500 text-xs font-medium">No Image</span>
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-2">
                          {isCourseCompleted(course.course_id) ? (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg font-semibold px-3 py-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </Badge>
                          ) : hasResumableProgress(course.course_id) ? (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg font-semibold px-3 py-1 flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              Resume ({enrollmentProgress[course.course_id]?.progress}%)
                            </Badge>
                          ) : enrolledCourseIds.has(course.course_id) && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-lg font-semibold px-3 py-1">
                              Enrolled
                            </Badge>
                          )}
                          {/* {isNewCourse(course.created_at) && (
                            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg font-semibold px-3 py-1">
                              NEW
                            </Badge>
                          )} */}
                        </div>
                      </div>

                      {/* Course Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                              {/* <Badge className={`${getStatusColor(course.status)} border`}>
                                {course.status}
                              </Badge> */}
                            </div>
                            <p className="text-sm text-gray-500">Course Code: {course.code}</p>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollment_count || 0} learners</span>
                          </div>
                          {course.educator_name && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                {course.educator_name.charAt(0).toUpperCase()}
                              </div>
                              <span>{course.educator_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar - Show for enrolled courses */}
                        {enrolledCourseIds.has(course.course_id) && (
                          <div className="mb-4 max-w-md">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600">Progress</span>
                              <span className={`text-xs font-semibold ${isCourseCompleted(course.course_id) ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {getCourseProgress(course.course_id)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${getCourseProgress(course.course_id)}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCourseCompleted(course.course_id) 
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Certificate Buttons for Completed Courses */}
                        {isCourseCompleted(course.course_id) ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleCourseClick(course)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              View Course
                            </Button>
                            <Button
                              onClick={(e) => handleGetCertificate(course.course_id, course.title, e)}
                              disabled={preparingCertificate === course.course_id}
                              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {preparingCertificate === course.course_id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Preparing...
                                </>
                              ) : (
                                <>
                                  <Award className="w-4 h-4" />
                                  {getCertificateUrl(course.course_id) ? 'View Certificate' : 'Get Certificate'}
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleCourseClick(course)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            View Course Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !initialLoad && activeTab === 'courses' && totalCount > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <Pagination>
              <PaginationContent className="flex flex-wrap items-center justify-center gap-1">
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(prev => prev - 1);
                      }
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {getPageNumbers().map((pageNum, index) => (
                  <PaginationItem key={index}>
                    {pageNum === '...' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer min-w-[40px] text-center"
                      >
                        {pageNum}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage(prev => prev + 1);
                      }
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
        </div>
      </div>
    </>
  );
};

export default Courses;
