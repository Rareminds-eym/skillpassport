import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { 
  Search, 
  ChevronDown,
  Grid3x3,
  List,
  MapPin
} from 'lucide-react';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import { useAIRecommendations } from '../../hooks/useAIRecommendations';
import AppliedJobsService from '../../services/appliedJobsService';
import SearchHistoryService from '../../services/searchHistoryService';
import { Clock, X } from 'lucide-react';
import SavedJobsService from '../../services/savedJobsService';
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
const Opportunities = () => {
  // Get user context
  const { user } = useAuth();
  // Get user email from localStorage (same as Dashboard)
  const userEmail = localStorage.getItem('userEmail') || user?.email;
  
  // Use the hook to get student data by email (consistent with Dashboard)
  const { studentData } = useStudentDataByEmail(userEmail);
  
  // Get student ID - prioritize user.id for immediate availability, then studentData
  const studentId = user?.id || studentData?.id;
  
  // Debug logging
  useEffect(() => {
    console.log({
      user,
      userEmail,
      studentData,
      studentId,
      hasUser: !!user,
      userId: user?.id,
      studentDataId: studentData?.id
    });
  }, [user, userEmail, studentData, studentId]);

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);
  // Search history state
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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
  
  // Fetch opportunities from database
  const { 
    opportunities, 
    loading, 
    error 
  } = useOpportunities({ 
    fetchOnMount: true,
    activeOnly: true 
  });

  // Fetch AI-powered recommendations
  const {
    recommendations,
    loading: recommendationsLoading,
    error: recommendationsError,
    trackView,
    cached
  } = useAIRecommendations({
    autoFetch: true,
    enableTracking: true
  });

  // Debug: Log recommendations to see if similarity exists
  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
    }
  }, [recommendations]);

  // Set first opportunity as selected by default when data loads
  useEffect(() => {
    if (opportunities.length > 0 && !selectedOpportunity) {
      setSelectedOpportunity(opportunities[0]);
    }
  }, [opportunities]);

  // Load search history on mount
  useEffect(() => {
    const loadSearchHistory = async () => {
      if (!studentId) return;
      
      try {
        setIsLoadingHistory(true);
        const history = await SearchHistoryService.getSearchHistory(studentId);
        setSearchHistory(history);
      } catch (error) {
        console.error('Error loading search history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadSearchHistory();
  }, [studentId]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    if (studentId) {
      // Save to database
      await SearchHistoryService.addSearchTerm(studentId, searchTerm);
      
      // Reload history
      const history = await SearchHistoryService.getSearchHistory(studentId);
      setSearchHistory(history);
    }
    
    setShowHistory(false);
  };

  // Handle search term selection from history
  const handleHistorySelect = (term) => {
    setSearchTerm(term);
    setShowHistory(false);
  };

  // Handle delete search term from history
  const handleDeleteSearchTerm = async (e, searchHistoryId) => {
    e.stopPropagation();
    
    if (!studentId) return;
    
    const result = await SearchHistoryService.deleteSearchTerm(studentId, searchHistoryId);
    
    if (result.success) {
      // Reload history
      const history = await SearchHistoryService.getSearchHistory(studentId);
      setSearchHistory(history);
    }
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const advancedFiltersKey = React.useMemo(() => JSON.stringify(advancedFilters), [advancedFilters]);
  // Filter and sort opportunities
  const filteredAndSortedOpportunities = React.useMemo(() => {
    // First filter
    let filtered = opportunities.filter(opp => {
      const matchesSearch = 
        opp.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Advanced filters
      const matchesAdvancedEmploymentType =
      advancedFilters.employmentType.length === 0 ||
      advancedFilters.employmentType.some(type => 
        opp.employment_type?.toLowerCase() === type.toLowerCase()
      );
    
    const matchesExperienceLevel = 
      advancedFilters.experienceLevel.length === 0 ||
      advancedFilters.experienceLevel.some(level => 
        opp.experience_level?.toLowerCase().includes(level.toLowerCase())
      );
    
    const matchesWorkMode = 
      advancedFilters.mode.length === 0 ||
      advancedFilters.mode.some(mode => 
        opp.mode?.toLowerCase() === mode.toLowerCase()
      );
    
    const matchesAdvancedSalary = (() => {
      if (!advancedFilters.salaryMin && !advancedFilters.salaryMax) return true;
      const min = opp.salary_range_min || 0;
      const max = opp.salary_range_max || 0;
      const filterMin = parseInt(advancedFilters.salaryMin) || 0;
      const filterMax = parseInt(advancedFilters.salaryMax) || Infinity;
      
      return (min >= filterMin || max >= filterMin) && (min <= filterMax || max <= filterMax);
    })();
    
    const matchesDepartment = 
      advancedFilters.department.length === 0 ||
      advancedFilters.department.some(dept => 
        opp.department?.toLowerCase() === dept.toLowerCase()
      );
    
    const matchesSkills = (() => {
      if (advancedFilters.skills.length === 0) return true;
      const oppSkills = Array.isArray(opp.skills_required) 
        ? opp.skills_required 
        : typeof opp.skills_required === 'string' 
          ? JSON.parse(opp.skills_required || '[]')
          : [];
      
      return advancedFilters.skills.some(skill =>
        oppSkills.some(oppSkill => 
          oppSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
    })();
    
    const matchesPostedWithin = (() => {
      if (!advancedFilters.postedWithin) return true;
      const postedDate = new Date(opp.posted_date || opp.created_at);
      const daysAgo = parseInt(advancedFilters.postedWithin);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      return postedDate >= cutoffDate;
    })();
    
      return matchesSearch &&
             matchesAdvancedEmploymentType &&
             matchesExperienceLevel &&
             matchesWorkMode &&
             matchesAdvancedSalary &&
             matchesDepartment &&
             matchesSkills &&
             matchesPostedWithin;
    });

    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Sort by posted_date DESC (newest first)
          return new Date(b.posted_date || b.created_at) - new Date(a.posted_date || a.created_at);
        
        case 'oldest':
          // Sort by posted_date ASC (oldest first)
          return new Date(a.posted_date || a.created_at) - new Date(b.posted_date || b.created_at);
        
        case 'salary_high':
          // Sort by salary DESC (high to low)
          const bMaxSalary = b.salary_range_max || b.salary_range_min || 0;
          const aMaxSalary = a.salary_range_max || a.salary_range_min || 0;
          return bMaxSalary - aMaxSalary;
        
        case 'salary_low':
          // Sort by salary ASC (low to high)
          const aMinSalary = a.salary_range_min || a.salary_range_max || 0;
          const bMinSalary = b.salary_range_min || b.salary_range_max || 0;
          return aMinSalary - bMinSalary;
        
        case 'title_asc':
          // Sort by job title A-Z
          const titleA = (a.job_title || a.title || '').toLowerCase();
          const titleB = (b.job_title || b.title || '').toLowerCase();
          return titleA.localeCompare(titleB);
        
        case 'title_desc':
          // Sort by job title Z-A
          const titleA2 = (a.job_title || a.title || '').toLowerCase();
          const titleB2 = (b.job_title || b.title || '').toLowerCase();
          return titleB2.localeCompare(titleA2);
        
        case 'company_asc':
          // Sort by company name A-Z
          return (a.company_name || '').toLowerCase().localeCompare((b.company_name || '').toLowerCase());
        
        case 'deadline':
          // Sort by deadline/closing_date ASC (soonest first)
          const aDeadline = a.deadline || a.closing_date || '9999-12-31';
          const bDeadline = b.deadline || b.closing_date || '9999-12-31';
          return new Date(aDeadline) - new Date(bDeadline);
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [opportunities, searchTerm, advancedFilters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOpportunities.length / opportunitiesPerPage));
  const paginatedOpportunities = React.useMemo(() => {
    const startIndex = (currentPage - 1) * opportunitiesPerPage;
    return filteredAndSortedOpportunities.slice(startIndex, startIndex + opportunitiesPerPage);
  }, [filteredAndSortedOpportunities, currentPage]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, advancedFiltersKey]);
  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage - 1 > 1) pages.add(currentPage - 1);
    if (currentPage - 2 > 1) pages.add(currentPage - 2);
    if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
    if (currentPage + 2 < totalPages) pages.add(currentPage + 2);
    return Array.from(pages).sort((a, b) => a - b);
  }, [currentPage, totalPages]);
  const shouldShowPagination = filteredAndSortedOpportunities.length > opportunitiesPerPage;

  // Load applied jobs on mount
  useEffect(() => {
    const loadAppliedJobs = async () => {
      if (!studentId) {
        return;
      }
      
      try {
        const applications = await AppliedJobsService.getStudentApplications(studentId);
        const appliedSet = new Set(applications.map(app => app.opportunity_id));
        setAppliedJobs(appliedSet);
      } catch (error) {
        console.error('❌ Error loading applied jobs:', error);
      }
    };

    loadAppliedJobs();
  }, [studentId]);

  // Load saved jobs on mount
  useEffect(() => {
    const loadSavedJobs = async () => {
      if (!studentId) {
        return;
      }
      
      try {
        const savedIds = await SavedJobsService.getSavedJobIds(studentId);
        setSavedJobs(new Set(savedIds));
      } catch (error) {
        console.error('❌ Error loading saved jobs:', error);
      }
    };

    loadSavedJobs();
  }, [studentId]);

  // Handle save/unsave toggle
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
      } else {
        console.error('❌ Failed to toggle save:', result.message);
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApply = async (opportunity) => {
    console.log({
      studentId,
      user,
      userId: user?.id,
      studentData,
      studentDataId: studentData?.id,
      userEmail
    });
    
    if (!studentId) {
      console.error('❌ No studentId found!');
      alert('Please log in to apply for jobs');
      return;
    }

    if (appliedJobs.has(opportunity.id)) {
      alert('You have already applied to this job');
      return;
    }

    // If there's an external application link, open it
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
        } else {
          alert(result.message);
        }
      }
      
      window.open(opportunity.application_link, '_blank');
      return;
    }

    // Internal application
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
        
        {/* Recommendations Loading State */}
        {recommendationsLoading && (
          <div className="bg-gray-50 rounded-xl p-6 mb-4 sm:mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading personalized recommendations...</span>
            </div>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-8 mb-3 sm:mb-6">
          <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search Input */}
            {/* <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search job title here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
            </div> */}
             {/* Search Input with History */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search job title here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                onKeyPress={handleSearchKeyPress}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
              
              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase px-2">Recent Searches</p>
                  </div>
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleHistorySelect(item.search_term)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{item.search_term}</span>
                        {item.search_count > 1 && (
                          <span className="text-xs text-gray-400">({item.search_count}x)</span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteSearchTerm(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Search Button */}
            <button onClick={handleSearch}className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center gap-2 font-medium transition-colors min-h-[42px]">
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>

          {/* Results and View Toggle */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Results count and preferences */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                Showing {filteredAndSortedOpportunities.length} of {opportunities.length} Jobs Results
              </p>
              <span className="text-xs sm:text-sm text-gray-400">Based your preferences</span>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AdvancedFilters
                onApplyFilters={setAdvancedFilters}
                initialFilters={advancedFilters}
              />
              
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative flex-1 sm:flex-initial">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none bg-white text-sm font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                  <option value="title_asc">Title: A-Z</option>
                  <option value="title_desc">Title: Z-A</option>
                  <option value="company_asc">Company: A-Z</option>
                  <option value="deadline">Deadline: Soonest</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to load opportunities</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Main Content Area */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Left Side - Opportunities Grid or List */}
            <div className="lg:col-span-2">
              {filteredAndSortedOpportunities.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
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
                    /* List View */
                    <div className="space-y-2.5 sm:space-y-4">
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
                  {shouldShowPagination && (
                    <div className="mt-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) {
                                  handlePageChange(currentPage - 1);
                                }
                              }}
                            />
                          </PaginationItem>
                          {pageNumbers.map((page, index) => {
                            const previousPage = pageNumbers[index - 1];
                            const showEllipsis = previousPage && page - previousPage > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    isActive={page === currentPage}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePageChange(page);
                                    }}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            );
                          })}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) {
                                  handlePageChange(currentPage + 1);
                                }
                              }}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                  <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No opportunities found</h3>
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'Try adjusting your search or filters'
                      : 'Check back later for new opportunities'}
                  </p>
                </div>
              )}
            </div>

            {/* Right Side - Job Preview */}
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

        {/* Mobile Job Preview Modal */}
        {selectedOpportunity && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 p-4 overflow-y-auto"
               onClick={() => setSelectedOpportunity(null)}>
            <div className="min-h-screen py-8" onClick={(e) => e.stopPropagation()}>
              <OpportunityPreview
                opportunity={selectedOpportunity}
                onClose={() => setSelectedOpportunity(null)}
                onApply={handleApply}
                onToggleSave={handleToggleSave}
                isApplied={appliedJobs.has(selectedOpportunity?.id)}
                isSaved={savedJobs.has(selectedOpportunity?.id)}
                isApplying={isApplying}
              />
            </div>
          </div>
        )}

        {/* Recommended Jobs Section - Premium UI */}
        {!recommendationsLoading && recommendations && recommendations.length > 0 && (
          <div className="my-10">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Recommended for You
                </h2>
              </div>
              
              {/* View All Link */}
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                View all
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Jobs Grid with Enhanced Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 6).map((job, index) => {
                const matchScore = job.final_score || job.similarity;
                const matchPercentage = Math.round(matchScore * 100);
                const isTopMatch = matchScore >= 0.80;
                const postedDate = new Date(job.posted_date || job.created_at);
                const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={job.id}
                    className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => {
                      setSelectedOpportunity(job);
                      trackView(job.id);
                    }}
                  >
                    {/* Top Match Ribbon */}
                    {isTopMatch && (
                      <div className="absolute top-0 right-0 -mr-8 mt-4 rotate-45 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-bold py-1 px-8 shadow-sm">
                        TOP MATCH
                      </div>
                    )}
                    
                    {/* Card Content */}
                    <div className="relative">
                      {/* Header with Logo, Match Badge, and Save Button */}
                      <div className="flex items-start justify-between mb-5">
                        {/* Left: Logo with Match Badge */}
                        <div className="flex items-start gap-3">
                          {/* Company Logo */}
                          <div className="relative">
                            {job.company_logo ? (
                              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-gray-100 p-2.5 flex items-center justify-center group-hover:border-indigo-200 transition-all">
                                <img 
                                  src={job.company_logo} 
                                  alt={job.company_name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                  {job.company_name?.charAt(0) || 'C'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Match Percentage Badge - Unique SVG Design */}
                          {matchScore && (
                            <div className="flex-shrink-0">
                              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Outer circle with gradient */}
                                <circle cx="28" cy="28" r="26" fill="url(#gradient)" opacity="0.1"/>
                                
                                {/* Progress circle */}
                                <circle 
                                  cx="28" 
                                  cy="28" 
                                  r="23" 
                                  stroke="url(#gradient)" 
                                  strokeWidth="3.5" 
                                  fill="none"
                                  strokeDasharray={`${matchPercentage * 1.445} 144.5`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 28 28)"
                                  className="transition-all duration-500"
                                />
                                
                                {/* Inner circle background */}
                                <circle cx="28" cy="28" r="20" fill="white" />
                                
                                {/* Sparkle icon */}
                                <path 
                                  d="M28 14 L28.8 17 L32 17.8 L28.8 18.6 L28 22 L27.2 18.6 L24 17.8 L27.2 17 Z" 
                                  fill="#4F46E5" 
                                  opacity="0.6"
                                />
                                
                                {/* Percentage text */}
                                <text 
                                  x="28" 
                                  y="32" 
                                  textAnchor="middle" 
                                  dominantBaseline="middle"
                                  fontSize="14" 
                                  fontWeight="bold" 
                                  fill="#4F46E5"
                                >
                                  {matchPercentage}%
                                </text>
                                
                                {/* Gradient definition */}
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#4F46E5" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Right: Save Button */}
                        <button 
                          className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSave(job);
                          }}
                        >
                          <svg 
                            className={`w-5 h-5 transition-all ${
                              savedJobs.has(job.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-300 hover:text-red-400'
                            }`}
                            fill={savedJobs.has(job.id) ? 'currentColor' : 'none'}
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                            />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Job Info */}
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                          {job.job_title || job.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {job.company_name}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-1">{job.location?.split(',')[0] || 'Remote'}</span>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.employment_type && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                            {job.employment_type}
                          </span>
                        )}
                        {job.mode && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                            {job.mode}
                          </span>
                        )}
                      </div>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 leading-relaxed mb-5 line-clamp-2">
                        {job.description || job.job_description || 'Exciting opportunity to join our team and make an impact.'}
                      </p>
                      
                      {/* Gradient Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {/* Salary */}
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Salary</p>
                          <p className="text-lg font-bold text-gray-900">
                            {job.stipend_or_salary || 'Competitive'}
                          </p>
                        </div>
                        
                        {/* Posted Time */}
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Posted</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1d ago' : `${daysAgo}d ago`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Apply Button - Appears on Hover with Applied State */}
                      <div className="absolute inset-x-0 bottom-0 h-0 group-hover:h-16 bg-gradient-to-t from-white to-transparent transition-all duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                        <button 
                          className={`w-full py-2.5 font-semibold rounded-xl shadow-md transition-all transform ${
                            appliedJobs.has(job.id)
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!appliedJobs.has(job.id)) {
                              handleApply(job);
                            }
                          }}
                          disabled={appliedJobs.has(job.id)}
                        >
                          {appliedJobs.has(job.id) ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Applied
                            </span>
                          ) : (
                            'Quick Apply →'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities;
