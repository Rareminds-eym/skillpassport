import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { 
  Code, 
  MessageCircle, 
  Star,
  CheckCircle,
  Edit,
  Plus,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import { SkillsEditModal } from '../../components/Students/components/ProfileEditModals';
import { useRecentUpdates } from '../../hooks/useRecentUpdates';
import { useRecentUpdatesLegacy } from '../../hooks/useRecentUpdatesLegacy';
import { 
  suggestions as mockSuggestions 
} from '../../components/Students/data/mockData';

const MySkills = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTechnicalSkills, updateSoftSkills } = useStudentDataByEmail(userEmail, false);
  
  const technicalSkills = studentData?.technicalSkills || [];
  const softSkills = studentData?.softSkills || [];
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

  const renderStars = (level) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < level ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleSaveSkills = async (updatedData) => {
    if (activeModal === 'technicalSkills') {
      await updateTechnicalSkills(updatedData.technicalSkills);
    } else if (activeModal === 'softSkills') {
      await updateSoftSkills(updatedData.softSkills);
    }
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Skills</h1>
        <p className="text-gray-600">Showcase your technical and soft skills</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Recent Updates & Suggestions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sticky container for both cards */}
          <div className="sticky top-20 z-30 flex flex-col gap-6">
            {/* Recent Updates */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <CardHeader className="px-6 py-4 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">Recent Updates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                        <div key={update.id || `update-${update.timestamp}-${idx}`} className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-0.5">{update.message}</p>
                            <p className="text-xs text-gray-600">{update.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {finalRecentUpdates.length > 5 && (
                      <div className="px-6 mt-4">
                        <Button
                          variant="outline"
                          className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
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
            <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <CardHeader className="px-6 py-4 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">Suggested Next Steps</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={suggestion.id || `suggestion-${idx}`} className="p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all">
                    <p className="text-sm font-medium text-gray-900">
                      {typeof suggestion === 'string' ? suggestion : suggestion.message || suggestion}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN - Skills Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => setActiveModal('skills')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Add Skills
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technical Skills */}
        <Card className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
          <CardHeader className="px-6 py-4 border-b border-gray-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Code className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-lg font-semibold text-gray-900">Technical Skills</span>
                <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium">
                  {technicalSkills.filter(s => s.enabled !== false).length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModal('technicalSkills')}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {technicalSkills.filter(skill => skill.enabled !== false).length > 0 ? (
              technicalSkills.filter(skill => skill.enabled !== false).map((skill, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{skill.name}</span>
                      {skill.verified && (
                        <Badge className="ml-2 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    {renderStars(skill.level)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Code className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No technical skills added yet</p>
                <Button onClick={() => setActiveModal('technicalSkills')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skills
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soft Skills */}
        <Card className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
          <CardHeader className="px-6 py-4 border-b border-gray-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-lg font-semibold text-gray-900">Soft Skills</span>
                <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium">
                  {softSkills.filter(s => s.enabled !== false).length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModal('softSkills')}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {softSkills.filter(skill => skill.enabled !== false).length > 0 ? (
              softSkills.filter(skill => skill.enabled !== false).map((skill, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{skill.name}</span>
                  <div className="flex">
                    {renderStars(skill.level)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No soft skills added yet</p>
                <Button onClick={() => setActiveModal('softSkills')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skills
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
      </div>
      </div>
    </div>
  );
      {/* Edit Modal */}
      {activeModal && (
        <SkillsEditModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveSkills}
          userData={{ technicalSkills, softSkills }}
        />
      )}
    </div>
  );
};

export default MySkills;
