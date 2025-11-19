import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import { Users, CheckCircle, Edit, Plus, Bell, MessageCircleIcon } from "lucide-react";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useAuth } from "../../context/AuthContext";
import { ExperienceEditModal } from "../../components/Students/components/ProfileEditModals";
import { useRecentUpdates } from "../../hooks/useRecentUpdates";
import { useRecentUpdatesLegacy } from "../../hooks/useRecentUpdatesLegacy";
import { useAIJobMatching } from "../../hooks/useAIJobMatching";
import SuggestedNextSteps from "../../components/Students/components/SuggestedNextSteps";
import { suggestions as mockSuggestions } from "../../components/Students/data/mockData";
import RecentUpdatesCard from "../../components/Students/components/RecentUpdatesCard";
import useStudentMessageNotifications from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { useStudentRealtimeActivities } from "../../hooks/useStudentRealtimeActivities";

const MyExperience = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateExperience, refresh } = useStudentDataByEmail(
    userEmail,
    false
  );

  const experience = studentData?.experience || [];
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
  const { unreadCount } = useStudentUnreadCount(studentId, !!studentId);

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
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [localExperience, setLocalExperience] = useState(experience);
  const recentUpdatesRef = React.useRef(null);
  // Update local experience when studentData changes
  useEffect(() => {
    setLocalExperience(experience);
  }, [experience]);

  const handleSaveExperience = async (updatedData) => {
    console.log("💾 Saving experience data:", updatedData);
    try {
      // Update local state immediately for instant UI feedback
      setLocalExperience(updatedData);

      const result = await updateExperience(updatedData);
      console.log("✅ Save result:", result);

      // Refresh the data to ensure consistency
      if (refresh) {
        await refresh();
      }

      setActiveModal(null);
    } catch (error) {
      console.error("❌ Error saving experience:", error);
      // Revert local state on error
      setLocalExperience(experience);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Experience
          </h1>
          <p className="text-gray-600">
            Showcase your professional journey and achievements
          </p>
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

          {/* RIGHT COLUMN - Experience Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-end mb-4">
              <Button
                onClick={() => setActiveModal("experience")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>

            {/* Experience Card - Matches Dashboard Design */}
            <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
              <CardHeader className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center w-full justify-between">
                  <CardTitle className="flex items-center gap-3 m-0 p-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      My Experience
                    </span>
                  </CardTitle>
                  <button
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="Edit Experience"
                    onClick={() => setActiveModal("experience")}
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {localExperience.filter((exp) => exp.enabled !== false).length >
                0 ? (
                  <>
                    {(showAllExperience
                      ? localExperience.filter((exp) => exp.enabled !== false)
                      : localExperience
                          .filter((exp) => exp.enabled !== false)
                          .slice(0, 2)
                    ).map((exp, idx) => (
                      <div
                        key={exp.id || `${exp.role}-${exp.organization}-${idx}`}
                        className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 text-base mb-1">
                              {exp.role}
                            </p>
                            <p className="text-blue-600 text-sm font-medium mb-1">
                              {exp.organization}
                            </p>
                            <p className="text-xs text-gray-600">
                              {exp.duration}
                            </p>
                          </div>
                          {exp.verified && (
                            <Badge className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {localExperience.filter((exp) => exp.enabled !== false)
                      .length > 2 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAllExperience((v) => !v)}
                        className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
                      >
                        {showAllExperience
                          ? "Show Less"
                          : "View All Experience"}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 px-4">
                    <Users className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No experience records yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Start building your professional portfolio by adding your
                      work experience
                    </p>
                    <Button
                      onClick={() => setActiveModal("experience")}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Experience
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {activeModal === "experience" && (
        <ExperienceEditModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          data={localExperience}
          onSave={handleSaveExperience}
        />
      )}
    </div>
  );
};

export default MyExperience;
