import {
    Bookmark,
    BookmarkCheck,
    CheckCircle,
    ChevronDown,
    Grid3x3,
    List,
    MapPin,
    Search,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { OpportunityCard, OpportunityListItem, OpportunityPreview } from '@/widgets/learner-dashboard';

import { useSavedJobs } from '@/features/opportunities';
import { SavedJobsService } from '@/features/opportunities';
import { getLogger } from '@/shared/config/logging';

import { useUser } from '@/shared/model/authStore';

const logger = getLogger('SavedJobs');

const SavedJobs = () => {
  const navigate = useNavigate();
  const user = useUser();
  const learnerId = user?.id;

  const {
    savedJobs,
    loading,
    error,
    searchTerm,
    sortBy,
    viewMode,
    selectedOpportunity,
    appliedJobs,
    isApplying,
    showActiveOnly,
    filteredAndSortedJobs,
    setSearchTerm,
    setSortBy,
    setViewMode,
    setSelectedOpportunity,
    setShowActiveOnly,
    handleUnsave,
    handleApply,
  } = useSavedJobs({ learnerId });

  // Log page state when data changes
  useEffect(() => {
    logger.info('SavedJobs page state updated', { learnerId, savedJobsCount: savedJobs?.length, loading, error });
  }, [learnerId, savedJobs?.length, loading, error]);

  // Handle clearing inactive jobs
  const handleClearInactive = async () => {
    try {
      if (!learnerId) {
        logger.warn('Cannot clear inactive jobs - no learnerId');
        toast.error('Please log in first');
        return;
      }
      logger.info('Clearing inactive jobs', { learnerId });
      const result = await SavedJobsService.removeInactiveSavedJobs(learnerId);
      if (result.success) {
        logger.info('Inactive jobs cleared successfully', { count: result.count, learnerId });
        toast.success(`Removed ${result.count || 0} inactive jobs`);
        // Reload saved jobs
        window.location.reload();
      } else {
        logger.error('Failed to clear inactive jobs', { message: result.message });
        toast.error(result.message || 'Failed to remove inactive jobs');
      }
    } catch (error) {
      logger.error('Error clearing inactive jobs', error);
      toast.error('Error clearing inactive jobs');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookmarkCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
                <p className="text-gray-600 mt-1">Jobs you've bookmarked for later</p>
              </div>
            </div>

            {/* Clear inactive button */}
            {!loading && savedJobs && savedJobs.length > 0 && savedJobs.some(job => !job.is_active) && (
              <button
                onClick={handleClearInactive}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Inactive
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-8 mb-3 sm:mb-6">
          <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search saved jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              />
            </div>

            <button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center gap-2 font-medium transition-colors min-h-[42px]">
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
            </button>
          </div>

          {/* Results and View Toggle */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                Showing {filteredAndSortedJobs?.length || 0} of {savedJobs?.length || 0} Saved Jobs
              </p>
              {savedJobs && savedJobs.filter(job => job.has_applied).length > 0 && (
                <span className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {savedJobs.filter(job => job.has_applied).length} already applied
                </span>
              )}
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Show Active Only Toggle */}
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active Jobs Only</span>
              </label>
              
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
                  <option value="newest">Recently Saved</option>
                  <option value="oldest">First Saved</option>
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
            <p className="text-red-600 font-medium mb-2">Failed to load saved jobs</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && savedJobs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No saved jobs yet</h3>
            <p className="text-gray-500 mb-6">
              Start saving jobs from the Opportunities page to keep track of interesting positions
            </p>
            <button
              onClick={() => navigate('/learner/opportunities')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Opportunities
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {!loading && !error && filteredAndSortedJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            {/* Left Side - Jobs Grid or List */}
            <div className="lg:col-span-2">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4">
                  {filteredAndSortedJobs.map((job) => (
                    <OpportunityCard
                      key={job.id}
                      opportunity={job}
                      onClick={() => setSelectedOpportunity(job)}
                      isSelected={selectedOpportunity?.id === job.id}
                      isApplied={appliedJobs.has(job.id)}
                      isSaved={true}
                      onToggleSave={() => handleUnsave(job)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-4">
                  {filteredAndSortedJobs.map((job) => (
                    <OpportunityListItem
                      key={job.id}
                      opportunity={job}
                      onClick={() => setSelectedOpportunity(job)}
                      isSelected={selectedOpportunity?.id === job.id}
                      isApplied={appliedJobs.has(job.id)}
                      isSaved={true}
                      onApply={() => handleApply(job)}
                      onToggleSave={() => handleUnsave(job)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Job Preview */}
            <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
              <OpportunityPreview
                opportunity={selectedOpportunity || filteredAndSortedJobs[0]}
                onApply={handleApply}
                onToggleSave={handleUnsave}
                isApplied={appliedJobs.has(selectedOpportunity?.id || filteredAndSortedJobs[0]?.id)}
                isSaved={true}
                isApplying={isApplying}
              />
            </div>
          </div>
        )}

        {/* No results after filtering */}
        {!loading && !error && savedJobs.length > 0 && filteredAndSortedJobs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs match your filters</h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
