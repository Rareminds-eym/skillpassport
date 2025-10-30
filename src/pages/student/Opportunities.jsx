import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { 
  Search, 
  ChevronDown,
  Grid3x3,
  List,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import AppliedJobsService from '../../services/appliedJobsService';
import SavedJobsService from '../../services/savedJobsService';
import OpportunityCard from '../../components/Students/components/OpportunityCard';
import OpportunityListItem from '../../components/Students/components/OpportunityListItem';
import OpportunityPreview from '../../components/Students/components/OpportunityPreview';
import AdvancedFilters from '../../components/Students/components/AdvancedFilters';

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
    console.log('🔍 Opportunities Debug:', {
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
  
  // Fetch opportunities from database
  const { 
    opportunities, 
    loading, 
    error 
  } = useOpportunities({ 
    fetchOnMount: true,
    activeOnly: true 
  });

  // Set first opportunity as selected by default when data loads
  useEffect(() => {
    if (opportunities.length > 0 && !selectedOpportunity) {
      setSelectedOpportunity(opportunities[0]);
    }
  }, [opportunities]);

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

  // Load applied jobs on mount
  useEffect(() => {
    const loadAppliedJobs = async () => {
      if (!studentId) {
        console.log('⚠️ No studentId, skipping applied jobs load');
        return;
      }
      
      try {
        console.log('🔄 Loading applied jobs for student:', studentId);
        const applications = await AppliedJobsService.getStudentApplications(studentId);
        console.log('✅ Loaded applications:', applications);
        const appliedSet = new Set(applications.map(app => app.opportunity_id));
        console.log('✅ Applied jobs Set:', Array.from(appliedSet));
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
        console.log('⚠️ No studentId, skipping saved jobs load');
        return;
      }
      
      try {
        console.log('🔄 Loading saved jobs for student:', studentId);
        const savedIds = await SavedJobsService.getSavedJobIds(studentId);
        console.log('✅ Loaded saved job IDs:', savedIds);
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
          console.log('✅ Job saved:', opportunity.job_title || opportunity.title);
        } else {
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(opportunity.id);
            return newSet;
          });
          console.log('✅ Job unsaved:', opportunity.job_title || opportunity.title);
        }
      } else {
        console.error('❌ Failed to toggle save:', result.message);
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
    }
  };

  const handleApply = async (opportunity) => {
    console.log('🎯 handleApply called:', {
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
        {/* Search and Filters Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-8 mb-3 sm:mb-6">
          <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search job title here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
            </div>

            {/* Search Button */}
            <button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center gap-2 font-medium transition-colors min-h-[42px]">
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
                viewMode === 'grid' ? (
                  /* Grid View */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
                    {filteredAndSortedOpportunities.map((opp) => (
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
                    {filteredAndSortedOpportunities.map((opp) => (
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
                )
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
            <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
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
      </div>
    </div>
  );
};

export default Opportunities;
