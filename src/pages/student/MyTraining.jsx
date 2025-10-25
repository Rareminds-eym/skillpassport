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
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-2 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Training</h1>
        <p className="text-gray-600">Track your courses, certifications, and professional development</p>
      </div>
      <div className="mb-8 flex justify-end">
        <Button 
          onClick={() => setActiveModal('training')} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : finalError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-3 font-medium">Failed to load recent updates</p>
                    <Button 
                      onClick={finalRefresh}
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                    >
                      Retry
                    </Button>
                  </div>
                ) : finalRecentUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-medium">No recent updates available</p>
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
                      <div className="mt-3">
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

        {/* RIGHT COLUMN - Training Content */}
        <div className="lg:col-span-2">
          {/* Training Grid */}
          {training.filter(t => t.enabled !== false).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {training.filter(t => t.enabled !== false).map((item, index) => (
            <Card key={index} className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
              <CardHeader className="px-6 py-4 border-b border-gray-100">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{item.course}</h3>
                    <p className="text-sm text-gray-600 font-medium mt-1">{item.provider}</p>
                  </div>
                  <Badge className={item.status === 'completed' 
                    ? 'bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium' 
                    : 'bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium'}>
                    {item.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{item.duration}</span>
                  </div>
                  {item.certificationDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>Certified: {item.certificationDate}</span>
                    </div>
                  )}
                </div>

                {item.skills && item.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-600">Skills Gained:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
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
                    <Progress value={item.progress} className="h-2 bg-gray-200" />
                  </div>
                )}

                {item.certificateUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
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
            <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <CardContent className="text-center py-16">
                <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No training records yet</h3>
                <p className="text-gray-500 mb-6">Start adding your courses and certifications to showcase your learning journey</p>
                <Button onClick={() => setActiveModal('training')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Training
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          {training.filter(t => t.enabled !== false).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {training.filter(t => t.enabled !== false).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Trainings</p>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {training.filter(t => t.status === 'completed' && t.enabled !== false).length}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
    </div>
  );
};

export default MyTraining;
