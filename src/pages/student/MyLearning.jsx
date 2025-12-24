import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Plus, BookOpen, TrendingUp, Award, GraduationCap, Search, SlidersHorizontal, ArrowUpDown, X, BarChart3, RefreshCw, ArrowRight } from "lucide-react";
import ModernLearningCard from "../../components/Students/components/ModernLearningCard";
import LearningAnalyticsDashboard from "../../components/Students/components/LearningAnalyticsDashboard";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useStudentTrainings } from "../../hooks/useStudentTrainings";
import { useAuth } from "../../context/AuthContext";
import { TrainingEditModal } from "../../components/Students/components/ProfileEditModals";
import SelectCourseModal from "../../components/Students/components/SelectCourseModal";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import Pagination from "../../components/admin/Pagination";

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
    <div className="h-8 w-12 bg-gray-200 rounded mb-2" />
    <div className="h-3 w-20 bg-gray-200 rounded" />
  </div>
);

const LearningCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-16 h-16 rounded-xl bg-gray-200" />
      <div className="flex-1">
        <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>
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

// Continue Learning Hero Section
const ContinueLearningSection = ({ course, onContinue }) => {
  if (!course) return null;

  const progress = course.status === "completed"
    ? 100
    : course.totalModules > 0
      ? Math.round(((course.completedModules || 0) / course.totalModules) * 100)
      : course.progress || 0;

  return (
    <div className="relative mb-8">
      <div className="absolute -top-4 left-4 z-10 w-24 h-24 sm:w-28 sm:h-28">
        <img 
          src="/assets/learning-illustration.png" 
          alt="Learning" 
          className="w-full h-full object-contain drop-shadow-lg"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4361EE] via-[#4C6EF5] to-[#5C7CFA] shadow-xl shadow-blue-200/50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-white rounded-full blur-2xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 pl-32 sm:pl-36">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-blue-200" />
              <span className="text-blue-100 text-sm font-medium tracking-wide">Continue Learning</span>
            </div>
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-4 truncate pr-4">
              {course.course || course.title || "Untitled Course"}
            </h3>
            <div className="max-w-sm">
              <div className="relative h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/60 to-white/80 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <span className="text-white/90 text-sm font-semibold">{progress}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onContinue?.(course)}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-semibold rounded-full transition-all duration-300 border border-white/30 hover:border-white/50 group"
          >
            Continue
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MyLearning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTraining, refresh: refreshStudentData, loading: studentLoading } = useStudentDataByEmail(userEmail, false);
  const studentId = studentData?.id;

  // State for view toggle (my learning or analytics)
  const [activeView, setActiveView] = useState('learning'); // 'learning' or 'analytics'

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

  const { trainings = [], loading: trainingsLoading, stats = { total: 0, completed: 0, ongoing: 0 }, refetch: refetchTrainings } = useStudentTrainings(studentId, {
    sortBy, sortDirection, status: statusFilter, approvalStatus: approvalFilter, searchTerm,
  });

  const loading = studentLoading || trainingsLoading;
  const hasActiveFilters = statusFilter !== 'all' || approvalFilter !== 'all' || searchTerm.trim() !== '';

  // Continue learning course - find first in-progress course
  const continueLearningCourse = useMemo(() => {
    const inProgressCourses = trainings.filter(t => t.status !== 'completed');
    return inProgressCourses.length > 0 ? inProgressCourses[0] : null;
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
    const isInternalCourse = !!(course.course_id && course.source === "internal_course");
    
    if (isInternalCourse) {
      navigate(`/student/courses/${course.course_id}/learn`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* View Switcher Tabs */}
        <div className="mb-6 flex justify-center">
          <div className="bg-white shadow-sm border-0 p-2 w-full rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* My Learning Tab */}
              <button
                onClick={() => setActiveView('learning')}
                className={`relative text-left p-4 rounded-lg transition-all ${
                  activeView === 'learning'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeView === 'learning' ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <GraduationCap className={`w-6 h-6 ${
                      activeView === 'learning' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h1 className={`font-bold text-lg ${
                      activeView === 'learning' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      My Learning
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Track your courses, certifications, and professional development
                    </p>
                  </div>
                </div>
              </button>

              {/* Analytics Tab */}
              <button
                onClick={() => setActiveView('analytics')}
                className={`relative text-left p-4 rounded-lg transition-all ${
                  activeView === 'analytics'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    activeView === 'analytics' ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <BarChart3 className={`w-6 h-6 ${
                      activeView === 'analytics' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h1 className={`font-bold text-lg ${
                      activeView === 'analytics' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      Analytics
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      View your learning progress and performance insights
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Conditional Rendering based on active view */}
        {activeView === 'analytics' ? (
          <LearningAnalyticsDashboard trainings={trainings} stats={stats} />
        ) : (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div></div>
              <Button onClick={() => setActiveModal("learning")} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />Add Learning
              </Button>
            </div>

            {/* Continue Learning Section */}
            {!loading && continueLearningCourse && (
              <ContinueLearningSection course={continueLearningCourse} onContinue={handleContinueLearning} />
            )}

            {/* Filter and Sort Controls */}
            <div className="mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search by title or organization..." value={searchTerm} onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  {searchTerm && <button onClick={() => handleFilterChange('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${showFilters || hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <SlidersHorizontal className="w-4 h-4" />Filters{hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </Button>
                <div className="flex items-center gap-2">
                  <select value={sortBy} onChange={(e) => handleFilterChange('sort', e.target.value)} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer">
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <Button variant="outline" onClick={toggleSortDirection} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50" title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
                    <ArrowUpDown className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <select value={statusFilter} onChange={(e) => handleFilterChange('status', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer">
                      {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Approval:</span>
                    <select value={approvalFilter} onChange={(e) => handleFilterChange('approval', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm cursor-pointer">
                      {APPROVAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  {hasActiveFilters && <Button variant="ghost" onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 ml-auto"><X className="w-4 h-4 mr-1" />Clear</Button>}
                </div>
              )}
              {hasActiveFilters && !showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-500">Active:</span>
                  {statusFilter !== 'all' && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}<button onClick={() => handleFilterChange('status', 'all')}><X className="w-3 h-3" /></button></span>}
                  {approvalFilter !== 'all' && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{APPROVAL_OPTIONS.find(o => o.value === approvalFilter)?.label}<button onClick={() => handleFilterChange('approval', 'all')}><X className="w-3 h-3" /></button></span>}
                  {searchTerm && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">"{searchTerm}"<button onClick={() => handleFilterChange('search', '')}><X className="w-3 h-3" /></button></span>}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {loading ? (
                <><div className="grid grid-cols-3 gap-4"><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><LearningCardSkeleton /><LearningCardSkeleton /></div></>
              ) : trainings.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-3"><BookOpen className="w-5 h-5 text-white" /></div><p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p><p className="text-xs text-gray-500">Total Courses</p></div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-3"><Award className="w-5 h-5 text-white" /></div><p className="text-2xl font-bold text-gray-900">{stats?.completed ?? 0}</p><p className="text-xs text-gray-500">Completed</p></div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center mb-3"><TrendingUp className="w-5 h-5 text-white" /></div><p className="text-2xl font-bold text-gray-900">{stats?.ongoing ?? 0}</p><p className="text-xs text-gray-500">In Progress</p></div>
                  </div>
                  
                  {/* Courses Section with data attribute for smooth scrolling */}
                  <div data-courses-section>
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Your Courses
                        {hasActiveFilters && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({trainings.length} total)
                          </span>
                        )}
                      </h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                    </div>
                    
                    {/* Paginated Courses Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                      {paginatedTrainings.map((item, idx) => (
                        <ModernLearningCard 
                          key={item.id || idx} 
                          item={item} 
                          onEdit={handleEditItem}
                          onContinue={handleContinueLearning}
                          expandedSkills={expandedSkills} 
                          onToggleSkills={toggleSkillExpand} 
                        />
                      ))}
                    </div>
                    
                    {/* Pagination Component */}
                    {totalPages > 1 && (
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
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
                <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm"><CardContent className="text-center py-16 px-6"><Search className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-900 mb-2">No matching courses</h3><p className="text-gray-500 mb-6">Try adjusting your filters</p><Button onClick={clearFilters} variant="outline">Clear filters</Button></CardContent></Card>
              ) : (
                <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm"><CardContent className="text-center py-20 px-6"><BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-4" /><h3 className="text-2xl font-bold text-gray-900 mb-3">Start Your Learning Journey</h3><p className="text-gray-500 mb-8">Add courses to track your progress</p><Button onClick={() => setActiveModal("learning")} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl"><Plus className="w-5 h-5 mr-2" />Add Your First Course</Button></CardContent></Card>
              )}
            </div>
          </>
        )}

        <SelectCourseModal isOpen={activeModal === "learning"} onClose={() => setActiveModal(null)} studentId={studentId} onSuccess={refresh} />
        {activeModal === "edit" && editingItem && (
          <TrainingEditModal isOpen={true} onClose={() => { setActiveModal(null); setEditingItem(null); refresh(); }}
            onSave={async (updatedItems) => { const item = updatedItems[0]; if (!item) return; const learning = studentData?.training || []; const idx = learning.findIndex(l => l.id === item.id); const updated = idx >= 0 ? learning.map(l => l.id === item.id ? { ...l, ...item } : l) : [...learning, item]; await updateTraining(updated); await refresh(); }}
            data={[editingItem]} singleEditMode={true} />
        )}
      </div>
    </div>
  );
};

export default MyLearning;