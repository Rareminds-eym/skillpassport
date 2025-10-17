import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { 
  ExternalLink, 
  Search, 
  Filter,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import { useRecentUpdates } from '../../hooks/useRecentUpdates';
import { useRecentUpdatesLegacy } from '../../hooks/useRecentUpdatesLegacy';
import { formatTimeAgo } from '../../utils/timeFormat';
import { 
  suggestions as mockSuggestions 
} from '../../components/Students/data/mockData';

const Opportunities = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData } = useStudentDataByEmail(userEmail, false);
  
  const opportunities = studentData?.opportunities || [];
  const suggestions = studentData?.suggestions || mockSuggestions;
  
  // Fetch recent updates data from Supabase (same as Dashboard)
  const {
    recentUpdates,
    loading: recentUpdatesLoading,
    error: recentUpdatesError,
    refreshRecentUpdates
  } = useRecentUpdates();

  // Fallback to legacy hook if Supabase Auth is not set up
  const {
    recentUpdates: recentUpdatesLegacy,
    loading: recentUpdatesLoadingLegacy,
    error: recentUpdatesErrorLegacy,
    refreshRecentUpdates: refreshRecentUpdatesLegacy
  } = useRecentUpdatesLegacy();

  // Use legacy data if auth-based data is empty
  const finalRecentUpdates = recentUpdates.length > 0 ? recentUpdates : recentUpdatesLegacy;
  const finalLoading = recentUpdatesLoading || recentUpdatesLoadingLegacy;
  const finalError = recentUpdatesError || recentUpdatesErrorLegacy;
  const finalRefresh = () => {
    refreshRecentUpdates();
    refreshRecentUpdatesLegacy();
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || opp.type?.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 w-full flex justify-center items-center">Opportunities</h1>
        <p className="text-gray-600 w-full flex justify-center items-center">Track your Opportunities, certifications, and professional development</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sticky container for both cards */}
          <div className="sticky top-20 z-30 flex flex-col gap-6">
            {/* Recent Updates */}
            <div className="bg-white rounded-2xl shadow-none">
              <CardHeader className="bg-[#F3F8FF] rounded-t-2xl border-b-0 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-[#1976D2] text-lg font-bold">
                  <Bell className="w-5 h-5 text-[#1976D2]" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 py-4">
                {finalLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1976D2]"></div>
                  </div>
                ) : finalError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-2">Failed to load recent updates</p>
                    <Button 
                      onClick={finalRefresh}
                      size="sm" 
                      className="bg-[#1976D2] hover:bg-blue-700 text-white"
                    >
                      Retry
                    </Button>
                  </div>
                ) : finalRecentUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent updates available</p>
                  </div>
                ) : (
                  <>
                    <div 
                      className={`space-y-2 ${showAllRecentUpdates ? 'max-h-96 overflow-y-auto pr-2 scroll-smooth recent-updates-scroll' : ''}`}
                    >
                      {(showAllRecentUpdates 
                        ? finalRecentUpdates
                        : finalRecentUpdates.slice(0, 5)
                      ).filter(update => update && update.message).map((update, idx) => (
                        <div key={update.id || `update-${update.timestamp}-${idx}`} className="flex items-start gap-3 px-6 py-4 bg-white rounded-xl border-l-4 border-[#2196F3] mb-2 hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 bg-[#FF9800] rounded-full mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-base font-medium text-gray-900 mb-1">{update.message}</p>
                            <p className="text-xs text-[#1976D2] font-medium">{update.timestamp ? formatTimeAgo(update.timestamp) : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {finalRecentUpdates.length > 5 && (
                      <div className="px-6 mt-4">
                        <Button
                          variant="outline"
                          className="w-full border-2 border-[#2196F3] text-[#2196F3] hover:bg-blue-50 font-semibold rounded-lg transition-colors"
                          onClick={() => setShowAllRecentUpdates(!showAllRecentUpdates)}
                        >
                          {showAllRecentUpdates ? 'See Less' : 'See More'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </div>

            {/* Suggested Next Steps */}
            <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <TrendingUp className="w-5 h-5" />
                  Suggested Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div key={suggestion.id || `suggestion-${idx}`} className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border-l-2 border-l-amber-500 hover:shadow-sm transition-shadow">
                    <p className="text-sm font-medium text-amber-900">
                      {typeof suggestion === 'string' ? suggestion : suggestion.message || suggestion}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN - Content */}
        <div className="lg:col-span-2">
              {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opp, index) => (
                <Card key={index} className="border-2 border-[#FFB800] hover:shadow-xl transition-all">
                  <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                    <CardTitle className="text-lg">
                      <h3 className="font-bold text-gray-900">{opp.title}</h3>
                      <p className="text-base text-[#FFB800] font-medium mt-1">{opp.company}</p>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{opp.type || 'Internship'}</span>
                      </div>
                      {opp.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{opp.location}</span>
                        </div>
                      )}
                      {opp.duration && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{opp.duration}</span>
                        </div>
                      )}
                      {opp.stipend && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{opp.stipend}</span>
                        </div>
                      )}
                    </div>

                    {opp.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">{opp.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                        {opp.type || 'Internship'}
                      </Badge>
                      <Button 
                        size="sm" 
                        className="bg-[#FFB800] hover:bg-[#E5A600] text-black font-medium"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <ExternalLink className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No opportunities found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Check back later for new opportunities'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Opportunities;
