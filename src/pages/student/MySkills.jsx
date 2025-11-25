import React, { useState, useRef } from 'react';
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
  X,
  MessageCircle as MessageCircleIcon
} from 'lucide-react';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useAuth } from '../../context/AuthContext';
import { SkillsEditModal } from '../../components/Students/components/ProfileEditModals';
import { useStudentRealtimeActivities } from '../../hooks/useStudentRealtimeActivities';
import { useStudentMessageNotifications } from '../../hooks/useStudentMessageNotifications';
import { useStudentUnreadCount } from '../../hooks/useStudentMessages';
import { useAIJobMatching } from '../../hooks/useAIJobMatching';
import SuggestedNextSteps from '../../components/Students/components/SuggestedNextSteps';
import RecentUpdatesCard from '../../components/Students/components/RecentUpdatesCard';
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

  // Get student ID for messaging
  const studentId = studentData?.id;

  // Setup message notifications with hot-toast
  useStudentMessageNotifications({
    studentId,
    enabled: !!studentId,
    playSound: true,
    onMessageReceived: () => {
      // Refresh Recent Updates to show new message activity
      setTimeout(() => {
        refreshRecentUpdates();
      }, 1000);
    },
  });

  // Get unread message count with realtime updates
  const { unreadCount } = useStudentUnreadCount(
    studentId,
    !!studentId
  );

  // Fetch recent updates data from recruitment tables (student-specific)
  const {
    activities: recentUpdates,
    isLoading: recentUpdatesLoading,
    isError: recentUpdatesError,
    refetch: refreshRecentUpdates,
    isConnected: realtimeConnected,
  } = useStudentRealtimeActivities(userEmail, 10);

  // AI Job Matching - Get top 3 matched jobs for student
  const {
    matchedJobs,
    loading: matchingLoading,
    error: matchingError,
  } = useAIJobMatching(studentData, true, 3);

  const [activeModal, setActiveModal] = useState(null);
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);

  // Refs for Recent Updates
  const recentUpdatesRef = useRef(null);

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

  // Skills selection options for the modal
  const skillsOptions = [
    {
      id: 'technicalSkills',
      title: 'Technical Skills',
      icon: Code,
      description: 'Programming languages, frameworks, and technical tools',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      count: technicalSkills.filter(s => s.enabled !== false).length
    },
    {
      id: 'softSkills',
      title: 'Soft Skills',
      icon: MessageCircle,
      description: 'Communication, leadership, and interpersonal skills',
      color: 'bg-green-50 text-green-700 border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      count: softSkills.filter(s => s.enabled !== false).length
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills</h1>
          <p className="text-gray-600">Showcase your technical and soft skills</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Recent Updates & Suggestions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sticky container for both cards */}
            <div className="sticky top-20 z-30 flex flex-col gap-6">
              {/* Recent Updates */}
              <RecentUpdatesCard
                ref={recentUpdatesRef}
                updates={recentUpdates}
                loading={recentUpdatesLoading}
                error={
                  recentUpdatesError ? "Failed to load recent updates" : null
                }
                onRetry={refreshRecentUpdates}
                emptyMessage="No recent updates available"
                isExpanded={showAllRecentUpdates}
                onToggle={(next) => setShowAllRecentUpdates(next)}
                badgeContent={
                  unreadCount > 0 ? (
                    <Badge className="bg-red-500 hover:bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                      <MessageCircleIcon className="w-3.5 h-3.5" />
                      {unreadCount} {unreadCount === 1 ? "message" : "messages"}
                    </Badge>
                  ) : null
                }
                getUpdateClassName={(update) => {
                  switch (update.type) {
                    case "shortlist_added":
                      return "bg-yellow-50 border-yellow-300";
                    case "offer_extended":
                      return "bg-green-50 border-green-300";
                    case "offer_accepted":
                      return "bg-emerald-50 border-emerald-300";
                    case "placement_hired":
                      return "bg-purple-50 border-purple-300";
                    case "stage_change":
                      return "bg-indigo-50 border-indigo-300";
                    case "application_rejected":
                      return "bg-red-50 border-red-300";
                    default:
                      return "bg-gray-50 border-gray-200";
                  }
                }}
              />

              {/* Suggested Next Steps */}
              <SuggestedNextSteps
                matchedJobs={matchedJobs}
                loading={matchingLoading}
                error={matchingError}
                fallbackSuggestions={suggestions}
              />
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

      {/* Skills Selection Modal */}
      {activeModal === 'skills' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add Skills</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-gray-600 mt-2">Choose the type of skills you want to add</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skillsOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Card
                      key={option.id}
                      className={`group relative overflow-hidden bg-white border-2 ${option.color} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02]`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          {option.count > 0 && (
                            <Badge className="bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium">
                              {option.count} added
                            </Badge>
                          )}
                        </div>
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{option.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
                        </div>
                        <Button
                          onClick={() => setActiveModal(option.id)}
                          className={`w-full ${option.buttonColor} text-white font-medium shadow-md hover:shadow-lg transition-all duration-300`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add {option.title}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {activeModal === 'technicalSkills' && (
        <SkillsEditModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={(updatedSkills) => handleSaveSkills({ technicalSkills: updatedSkills })}
          data={technicalSkills}
          title="Technical Skills"
          type="Skill"
        />
      )}

      {activeModal === 'softSkills' && (
        <SkillsEditModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSave={(updatedSkills) => handleSaveSkills({ softSkills: updatedSkills })}
          data={softSkills}
          title="Soft Skills"
          type="Skill"
        />
      )}
    </div>
  );
};

export default MySkills;
