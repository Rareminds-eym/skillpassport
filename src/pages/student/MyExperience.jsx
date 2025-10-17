import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { 
  Users, 
  CheckCircle,
  Edit,
  Plus,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import { ExperienceEditModal } from '../../components/Students/components/ProfileEditModals';
import { useRecentUpdates } from '../../hooks/useRecentUpdates';
import { useRecentUpdatesLegacy } from '../../hooks/useRecentUpdatesLegacy';
import { 
  suggestions as mockSuggestions 
} from '../../components/Students/data/mockData';

const MyExperience = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateExperience } = useStudentDataByEmail(userEmail, false);
  
  const experience = studentData?.experience || [];
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
  
  const [activeModal, setActiveModal] = useState(null);
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  const [showAllExperience, setShowAllExperience] = useState(false);

  const handleSaveExperience = async (updatedData) => {
    await updateExperience(updatedData.experience);
    setActiveModal(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Experience</h1>
        <p className="text-gray-600">Showcase your professional journey and achievements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Recent Updates & Suggestions */}
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
                      ).map((update, idx) => (
                        <div key={update.id || `update-${update.timestamp}-${idx}`} className="flex items-start gap-3 px-6 py-4 bg-white rounded-xl border-l-4 border-[#2196F3] mb-2 hover:shadow-md transition-shadow">
                          <div className="w-2 h-2 bg-[#FF9800] rounded-full mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-base font-medium text-gray-900 mb-1">{update.message}</p>
                            <p className="text-xs text-[#1976D2] font-medium">{update.timestamp}</p>
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

        {/* RIGHT COLUMN - Experience Content */}
        <div className="lg:col-span-2">
          {/* Experience Card - Matches Dashboard Design */}
          <Card className="h-full border-2 border-[#5378f1] rounded-2xl shadow-none bg-white">
            <CardHeader className="bg-gradient-to-r from-white to-purple-50 rounded-t-2xl border-b-0 flex items-center justify-between">
              <div className="flex items-center w-full justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg font-semibold m-0 p-0">
                  <Users className="w-5 h-5" />
                  <span>My Experience</span>
                </CardTitle>
                <button
                  className="p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-2"
                  title="Edit Experience"
                  onClick={() => setActiveModal('experience')}
                >
                  <Edit className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {experience.filter(exp => exp.enabled !== false).length > 0 ? (
                <>
                  {(showAllExperience 
                    ? experience.filter(exp => exp.enabled !== false) 
                    : experience.filter(exp => exp.enabled !== false).slice(0, 2)
                  ).map((exp, idx) => (
                    <div key={exp.id || `${exp.role}-${exp.organization}-${idx}`} className="bg-white rounded-xl border-0 shadow-none px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'0 2px 8px 0 #e9e3fa'}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-base mb-1">{exp.role}</p>
                          <p className="text-gray-600 text-sm font-medium mb-1">{exp.organization}</p>
                          <p className="text-xs text-gray-500">{exp.duration}</p>
                        </div>
                        {exp.verified && (
                          <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-semibold shadow-none">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {experience.filter(exp => exp.enabled !== false).length > 2 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllExperience((v) => !v)}
                      className="w-full border-2 border-blue-400 text-blue-600 hover:bg-purple-50 font-semibold rounded-lg mt-2"
                    >
                      {showAllExperience ? 'Show Less' : 'View All Experience'}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-16 px-4">
                  <Users className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No experience records yet</h3>
                  <p className="text-gray-500 mb-6">Start building your professional portfolio by adding your work experience</p>
                  <Button onClick={() => setActiveModal('experience')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Experience
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {activeModal && (
        <ExperienceEditModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveExperience}
          userData={{ experience }}
        />
      )}
    </div>
  );
};

export default MyExperience;
