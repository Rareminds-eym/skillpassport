import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { Progress } from '../../components/Students/components/ui/progress';
import { 
  Code, 
  Calendar,
  Award,
  Edit,
  Plus,
  BookOpen,
  Bell,
  TrendingUp
} from 'lucide-react';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import { TrainingEditModal } from '../../components/Students/components/ProfileEditModals';
import { useRecentUpdates } from '../../hooks/useRecentUpdates';
import { useRecentUpdatesLegacy } from '../../hooks/useRecentUpdatesLegacy';
import { 
  suggestions as mockSuggestions 
} from '../../components/Students/data/mockData';

const MyTraining = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTraining } = useStudentDataByEmail(userEmail, false);
  
  const training = studentData?.training || [];
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

  const handleSaveTraining = async (updatedData) => {
    await updateTraining(updatedData.training);
    setActiveModal(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Training</h1>
          <p className="text-gray-600">Track your courses, certifications, and professional development</p>
        </div>
        <Button 
          onClick={() => setActiveModal('training')} 
          className="bg-[#5378f1] hover:bg-[#4267d9]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Training
        </Button>
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

        {/* RIGHT COLUMN - Training Content */}
        <div className="lg:col-span-2">
          {/* Training Grid */}
          {training.filter(t => t.enabled !== false).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {training.filter(t => t.enabled !== false).map((item, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-[#5378f1]/10 to-[#5378f1]/20 border-2 border-[#5378f1]/30">
              <CardHeader className="bg-gradient-to-r from-[#5378f1]/20 to-[#5378f1]/30 border-b border-[#5378f1]/30">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[#5378f1]">{item.course}</h3>
                    <p className="text-sm text-gray-600 font-medium mt-1">{item.provider}</p>
                  </div>
                  <Badge className={item.status === 'completed' 
                    ? 'bg-emerald-500 hover:bg-emerald-500 text-white' 
                    : 'bg-[#5378f1] hover:bg-[#4267d9] text-white'}>
                    {item.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 bg-gradient-to-br from-[#5378f1]/5 to-[#5378f1]/10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-[#5378f1]" />
                    <span>{item.duration}</span>
                  </div>
                  {item.certificationDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Award className="w-4 h-4 text-[#5378f1]" />
                      <span>Certified: {item.certificationDate}</span>
                    </div>
                  )}
                </div>

                {item.skills && item.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#5378f1]">Skills Gained:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-white/70 text-[#5378f1] border border-[#5378f1]/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.status === 'in-progress' && item.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2 bg-white/50" />
                  </div>
                )}

                {item.certificateUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-[#5378f1] text-[#5378f1] hover:bg-[#5378f1]/10"
                    onClick={() => window.open(item.certificateUrl, '_blank')}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
            </div>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="text-center py-16">
                <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No training records yet</h3>
                <p className="text-gray-500 mb-6">Start adding your courses and certifications to showcase your learning journey</p>
                <Button onClick={() => setActiveModal('training')} className="bg-[#5378f1] hover:bg-[#4267d9]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Training
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          {training.filter(t => t.enabled !== false).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="bg-gradient-to-br from-[#5378f1]/10 to-[#5378f1]/20 border-2 border-[#5378f1]/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-[#5378f1]">
                    {training.filter(t => t.enabled !== false).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Trainings</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 border-2 border-emerald-500/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                    {training.filter(t => t.status === 'completed' && t.enabled !== false).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/20 border-2 border-amber-500/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {training.filter(t => t.status === 'in-progress' && t.enabled !== false).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">In Progress</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {activeModal && (
        <TrainingEditModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveTraining}
          userData={{ training }}
        />
      )}
    </div>
  );
};

export default MyTraining;
