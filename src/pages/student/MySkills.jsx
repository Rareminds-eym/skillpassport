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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Skills</h1>
        <p className="text-gray-600">Showcase your technical and soft skills</p>
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

        {/* RIGHT COLUMN - Skills Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-end mb-4">
            <Button onClick={() => setActiveModal('skills')} className="bg-slate-500 hover:bg-slate-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Skills
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technical Skills */}
        <Card className="border-t-4 border-t-slate-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Technical Skills
                <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  {technicalSkills.filter(s => s.enabled !== false).length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModal('technicalSkills')}
                className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 p-1"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {technicalSkills.filter(skill => skill.enabled !== false).length > 0 ? (
              technicalSkills.filter(skill => skill.enabled !== false).map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border-l-2 border-l-slate-400 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{skill.name}</span>
                      {skill.verified && (
                        <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-500 text-white text-xs px-2 py-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
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
                <Button onClick={() => setActiveModal('technicalSkills')} className="bg-slate-500 hover:bg-slate-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skills
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Soft Skills */}
        <Card className="border-t-4 border-t-teal-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center justify-between text-teal-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Soft Skills
                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                  {softSkills.filter(s => s.enabled !== false).length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveModal('softSkills')}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-100 p-1"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {softSkills.filter(skill => skill.enabled !== false).length > 0 ? (
              <>
                {/* Languages */}
                <div className="p-3 bg-gradient-to-r from-teal-50 to-white rounded-lg border-l-2 border-l-teal-400">
                  <p className="text-sm font-semibold mb-3 text-teal-700">Languages</p>
                  {softSkills.filter(skill => skill.type === 'language' && skill.enabled !== false).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between mb-2 p-2 bg-white rounded border border-teal-100">
                      <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                      <div className="flex">
                        {renderStars(skill.level)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Communication */}
                <div className="p-3 bg-gradient-to-r from-teal-50 to-white rounded-lg border-l-2 border-l-teal-400">
                  <p className="text-sm font-semibold mb-3 text-teal-700">Communication</p>
                  {softSkills.filter(skill => skill.type === 'communication' && skill.enabled !== false).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between mb-2 p-2 bg-white rounded border border-teal-100">
                      <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                      <div className="flex">
                        {renderStars(skill.level)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">No soft skills added yet</p>
                <Button onClick={() => setActiveModal('softSkills')} className="bg-teal-500 hover:bg-teal-600">
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
