import { ArrowRight, ArrowUpDown, Award, BarChart3, BookOpen, Filter, GraduationCap, Grid3X3, List, Plus, RefreshCw, Search, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/educator/Pagination";
import LearningAnalyticsDashboard from "../../components/Students/components/LearningAnalyticsDashboard";
import ModernLearningCard from "../../components/Students/components/ModernLearningCard";
import { TrainingEditModal } from "../../components/Students/components/ProfileEditModals";
import SelectCourseModal from "../../components/Students/components/SelectCourseModal";
import { Button } from "../../components/Students/components/ui/button";
import { Card, CardContent } from "../../components/Students/components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import { useStudentTrainings } from "../../hooks/useStudentTrainings";
import { supabase } from "../../lib/supabaseClient";

const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-8 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="w-12 h-12 rounded-xl bg-slate-200" />
    </div>
  </div>
);

const LearningCardSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm animate-pulse">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full" />
    </div>
  </div>
);

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Added' },
  { value: 'title', label: 'Title' },
  { value: 'organization', label: 'Organization' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'status', label: 'Status' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ongoing', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const APPROVAL_OPTIONS = [
  { value: 'all', label: 'All Approvals' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

// Continue Learning Hero Section - Compact Version
const ContinueLearningSection = ({ course, onContinue }) => {
  if (!course) return null;

  const progress = course.status === "completed"
    ? 100
    : course.totalModules > 0
      ? Math.round(((course.completedModules || 0) / course.totalModules) * 100)
      : course.progress || 0;

  return (
    <div className="relative mb-6 sm:mb-8">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg sm:shadow-xl shadow-blue-500/25">
        {/* Background Pattern - Simplified */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-24 sm:w-32 h-24 sm:h-32 bg-white rounded-full blur-2xl" />
          <div className="absolute -bottom-4 left-1/4 w-16 sm:w-20 h-16 sm:h-20 bg-green-400 rounded-full blur-xl" />
        </div>

        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 sm:p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                </div>
                <span className="text-blue-50 text-xs font-semibold tracking-wide uppercase">Continue Learning</span>
              </div>
              
              <h2 className="text-white text-lg sm:text-xl font-bold mb-1 leading-tight line-clamp-1">
                {course.course || course.title || "Untitled Course"}
              </h2>
              
              <p className="text-blue-50 text-xs sm:text-sm mb-3 opacity-90 line-clamp-1">
                Pick up where you left off and continue your learning journey
              </p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/90 text-xs font-medium">Progress</span>
                    <span className="text-white font-bold text-sm">{progress}%</span>
                  </div>
                  <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <button
                onClick={() => onContinue?.(course)}
                className="group flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-300 border border-white/30 hover:border-white/50 hover:scale-105 text-sm"
              >
                <span className="hidden sm:inline">Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyLearning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTraining, updateSingleTraining, refresh: refreshStudentData, loading: studentLoading } = useStudentDataByEmail(userEmail, false);
  const studentId = studentData?.id;

  // State for view toggle and layout
  const [activeView, setActiveView] = useState('learning'); // 'learning' or 'analytics'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Perfect for 3x3 grid layout

  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { trainings = [], loading: trainingsLoading, stats = { total: 0, completed: 0, ongoing: 0 }, refetch: refetchTrainings } = useStudentTrainings(studentId, {
    sortBy, sortDirection, status: statusFilter, approvalStatus: approvalFilter, searchTerm,
  });

  const loading = studentLoading || trainingsLoading;
  const hasActiveFilters = statusFilter !== 'all' || approvalFilter !== 'all' || searchTerm.trim() !== '';

  // Continue learning course - optimized selection of most complete (but not 100%) INTERNAL course
  const continueLearningCourse = useMemo(() => {
    // Helper function to calculate progress (avoid duplication)
    const calculateCourseProgress = (course) => {
      if (course.totalModules > 0) {
        return Math.round(((course.completedModules || 0) / course.totalModules) * 100);
      }
      return course.progress || 0;
    };

    // Filter and map in single pass for better performance
    const candidateCourses = trainings
      .filter(t => {
        // Quick early returns for performance
        if (t.status === 'completed') return false;
        
        const isInternalCourse = t.type === 'course_enrollment' || 
                                t.source === 'course_enrollment' || 
                                !!(t.course_id && t.source === "internal_course");
        if (!isInternalCourse) return false;

        const progress = calculateCourseProgress(t);
        const hasValidProgress = progress > 0 && progress < 100;
        const hasContent = t.totalModules > 0 || (t.progress !== undefined && t.progress !== null);
        
        return hasValidProgress && hasContent;
      })
      .map(course => ({
        course,
        progress: calculateCourseProgress(course),
        lastAccessTime: new Date(course.lastAccessed || course.updatedAt || 0).getTime()
      }))
      .sort((a, b) => {
        // Primary sort: highest progress first
        if (a.progress !== b.progress) {
          return b.progress - a.progress;
        }
        // Secondary sort: most recent access
        return b.lastAccessTime - a.lastAccessTime;
      });
    
    return candidateCourses.length > 0 ? candidateCourses[0].course : null;
  }, [trainings]);

  // Pagination calculations
  const totalPages = Math.ceil(trainings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrainings = trainings.slice(startIndex, endIndex);

  // Centralized filter handler that resets pagination
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1); // Reset to first page when filters change
    
    switch (filterType) {
      case 'status':
        setStatusFilter(value);
        break;
      case 'approval':
        setApprovalFilter(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      case 'sortDirection':
        setSortDirection(value);
        break;
    }
  };

  useStudentMessageNotifications({ studentId, enabled: !!studentId, playSound: true });

  const toggleSkillExpand = (id) => setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleEditItem = (item) => { setEditingItem(item); setActiveModal("edit"); };
  const handleDeleteItem = (item) => { setDeletingItem(item); setActiveModal("delete"); };
  
  const confirmDelete = async () => {
    if (!deletingItem) return;
    
    setIsDeleting(true);
    try {
      // Delete from certificates table first (if exists)
      await supabase
        .from('certificates')
        .delete()
        .eq('training_id', deletingItem.id);
      
      // Delete from skills table (if exists)
      await supabase
        .from('skills')
        .delete()
        .eq('training_id', deletingItem.id);
      
      // Delete from trainings table
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', deletingItem.id);
      
      if (error) throw error;
      
      // Refresh the list
      await refresh();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Failed to delete certificate. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
      setActiveModal(null);
    }
  };
  
  const toggleSortDirection = () => handleFilterChange('sortDirection', sortDirection === 'asc' ? 'desc' : 'asc');
  
  const clearFilters = () => { 
    setStatusFilter('all'); 
    setApprovalFilter('all'); 
    setSearchTerm(''); 
    setSortBy('created_at'); 
    setSortDirection('desc');
    setCurrentPage(1); // Reset pagination when clearing filters
  };
  
  const refresh = async () => { await refreshStudentData(); refetchTrainings(); };
  
  const handleContinueLearning = (course) => {
    // Check if this is an internal course that can be continued on the platform
    const isInternalCourse = !!(course.course_id && course.source === "internal_course");
    const isCourseEnrollment = course.type === 'course_enrollment' || course.source === 'course_enrollment';
    
    if (isInternalCourse || isCourseEnrollment) {
      // Use the course_id from the course object
      const courseId = course.course_id || course.id;
      navigate(`/student/courses/${courseId}/learn`);
    } else {
      console.log('Cannot continue external course on platform:', course);
    }
  };

  // Handle page change with smooth scroll
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const coursesSection = document.querySelector('[data-courses-section]');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Modern Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            {/* Title and Description */}
            <div className="space-y-1 sm:space-y-2 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                My Learning Journey
              </h1>
              <p className="text-slate-600 text-base sm:text-lg">
                Track your progress, explore new skills, and achieve your learning goals
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center sm:justify-end flex-shrink-0">
              <Button 
                onClick={() => setActiveModal("learning")} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 text-sm sm:text-base"
              >
                <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2" />
                Add Learning
              </Button>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 p-1.5 sm:p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {/* Learning Tab */}
              <button
                onClick={() => setActiveView('learning')}
                className={`relative flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${
                  activeView === 'learning'
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">My Courses</span>
                {activeView === 'learning' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 sm:w-12 h-0.5 sm:h-1 bg-blue-600 rounded-full" />
                )}
              </button>

              {/* Analytics Tab */}
              <button
                onClick={() => setActiveView('analytics')}
                className={`relative flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${
                  activeView === 'analytics'
                    ? 'bg-gradient-to-r from-green-50 to-green-100/80 text-green-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">Analytics</span>
                {activeView === 'analytics' && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 sm:w-12 h-0.5 sm:h-1 bg-green-600 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Conditional Rendering based on active view */}
        {activeView === 'analytics' ? (
          <LearningAnalyticsDashboard trainings={trainings} stats={stats} />
        ) : (
          <>
            {/* Continue Learning Section */}
            {!loading && continueLearningCourse && (
              <ContinueLearningSection course={continueLearningCourse} onContinue={handleContinueLearning} />
            )}

            {/* Enhanced Filter and Controls Section */}
            <div className="mb-8 space-y-4">
              {/* Search and Primary Controls - Responsive Layout:
                  Mobile/Tablet: Stacked vertically
                  Desktop (lg+): Search bar on left, controls on right */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search courses, skills, or organizations..." 
                    value={searchTerm} 
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full h-12 pl-12 pr-12 bg-white border border-slate-200/60 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => handleFilterChange('search', '')} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Control Buttons - Right side on desktop */}
                <div className="flex flex-col sm:flex-row lg:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
                  {/* Filters Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)} 
                    className={`flex items-center justify-center gap-2 px-4 h-12 rounded-2xl border-2 transition-all duration-300 font-medium ${
                      showFilters || hasActiveFilters 
                        ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {hasActiveFilters && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white border border-slate-200/60 rounded-2xl p-1 shadow-sm h-12">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 sm:flex-none p-2.5 rounded-xl transition-all duration-200 ${
                        viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4 mx-auto" />
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
                  <div className="flex items-center gap-2 flex-1 sm:flex-none lg:flex-none">
                    <select 
                      value={sortBy} 
                      onChange={(e) => handleFilterChange('sort', e.target.value)} 
                      className="flex-1 sm:flex-none lg:w-auto px-4 h-12 bg-white border border-slate-200/60 rounded-2xl text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm min-w-0 sm:min-w-[140px] lg:min-w-[140px]"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={toggleSortDirection} 
                      className="flex items-center justify-center w-12 h-12 bg-white border border-slate-200/60 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 shadow-sm flex-shrink-0" 
                      title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      <ArrowUpDown className={`w-4 h-4 transition-transform duration-300 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      <select 
                        value={statusFilter} 
                        onChange={(e) => handleFilterChange('status', e.target.value)} 
                        className="px-3 py-2 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[120px]"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">Approval:</span>
                      <select 
                        value={approvalFilter} 
                        onChange={(e) => handleFilterChange('approval', e.target.value)} 
                        className="px-3 py-2 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[120px]"
                      >
                        {APPROVAL_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters} 
                        className="flex items-center gap-2 px-4 py-2 h-10 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 ml-auto"
                      >
                        <X className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              {hasActiveFilters && !showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Active filters:</span>
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                      <button onClick={() => handleFilterChange('status', 'all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {approvalFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {APPROVAL_OPTIONS.find(o => o.value === approvalFilter)?.label}
                      <button onClick={() => handleFilterChange('approval', 'all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      "{searchTerm}"
                      <button onClick={() => handleFilterChange('search', '')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="space-y-8">
              {loading ? (
                <>
                  {/* Stats Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </div>
                  {/* Cards Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <LearningCardSkeleton />
                    <LearningCardSkeleton />
                    <LearningCardSkeleton />
                  </div>
                </>
              ) : trainings.length > 0 ? (
                <>
                  {/* Enhanced Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-slate-900">{stats?.total ?? 0}</p>
                          <p className="text-sm font-medium text-slate-600">Total Courses</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-slate-900">{stats?.completed ?? 0}</p>
                          <p className="text-sm font-medium text-slate-600">Completed</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-slate-900">{stats?.ongoing ?? 0}</p>
                          <p className="text-sm font-medium text-slate-600">In Progress</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Courses Section */}
                  <div data-courses-section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900">
                          Your Courses
                        </h2>
                        {hasActiveFilters && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                            {trainings.length} results
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Courses Grid/List */}
                    <div className={`mb-8 ${
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                        : 'space-y-4'
                    }`}>
                      {paginatedTrainings.map((item, idx) => (
                        <ModernLearningCard 
                          key={item.id || idx} 
                          item={item} 
                          onEdit={handleEditItem}
                          onDelete={handleDeleteItem}
                          onContinue={handleContinueLearning}
                          expandedSkills={expandedSkills} 
                          onToggleSkills={toggleSkillExpand}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                    
                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={trainings.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : hasActiveFilters ? (
                <Card className="bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                  <CardContent className="text-center py-20 px-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No matching courses found</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      We couldn't find any courses matching your current filters. Try adjusting your search criteria.
                    </p>
                    <Button 
                      onClick={clearFilters} 
                      variant="outline"
                      className="px-6 py-3 rounded-2xl border-2 border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                    >
                      Clear all filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                  <CardContent className="text-center py-24 px-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                      <BookOpen className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">Start Your Learning Journey</h3>
                    <p className="text-slate-600 mb-10 text-lg max-w-md mx-auto">
                      Add your first course and begin tracking your professional development and skill growth.
                    </p>
                    <Button 
                      onClick={() => setActiveModal("learning")} 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                    >
                      <Plus className="w-6 h-6 mr-3" />
                      Add Your First Course
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Modals */}
        <SelectCourseModal 
          isOpen={activeModal === "learning"} 
          onClose={() => setActiveModal(null)} 
          studentId={studentId} 
          onSuccess={refresh} 
        />
        
        {activeModal === "edit" && editingItem && (
          <TrainingEditModal 
            isOpen={true} 
            onClose={() => { 
              setActiveModal(null); 
              setEditingItem(null); 
              // Don't call refresh() here - only refresh when data is actually saved
            }}
            onSave={async (updatedItems) => { 
              const item = updatedItems[0]; 
              if (!item) return; 
              
              // Use the single training update function instead of updating all trainings
              await updateSingleTraining(item.id, item);
              await refresh(); 
            }}
            data={[editingItem]} 
            singleEditMode={true} 
          />
        )}

        {/* Delete Confirmation Modal */}
        {activeModal === "delete" && deletingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Delete Certificate?</h3>
                <p className="text-slate-600 text-center mb-6">
                  Are you sure you want to delete "<span className="font-semibold">{deletingItem.course || deletingItem.title}</span>"? This will also remove any associated skills and assessment data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setDeletingItem(null); setActiveModal(null); }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;