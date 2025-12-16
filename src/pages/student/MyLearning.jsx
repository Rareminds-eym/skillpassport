import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import {
  Calendar,
  Award,
  Edit,
  Plus,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import LearningProgressBar from "../../components/Students/components/LearningProgressBar";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useAuth } from "../../context/AuthContext";
import { TrainingEditModal } from "../../components/Students/components/ProfileEditModals";
import SelectCourseModal from "../../components/Students/components/SelectCourseModal";
import { useStudentRealtimeActivities } from "../../hooks/useStudentRealtimeActivities";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { useAIJobMatching } from "../../hooks/useAIJobMatching";
import SuggestedNextSteps from "../../components/Students/components/SuggestedNextSteps";
import RecentUpdatesCard from "../../components/Students/components/RecentUpdatesCard";
import {
  suggestions as mockSuggestions,
} from "../../components/Students/data/mockData";

const MyLearning = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTraining, refresh } = useStudentDataByEmail(userEmail, false);

  const learning = studentData?.training || []; // Keep as 'training' from backend
  const enabledLearning = learning.filter((t) => t && t.enabled !== false);
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
  } = useStudentRealtimeActivities(userEmail, 10);

  // AI Job Matching - Get top 3 matched jobs for student
  const {
    matchedJobs,
    loading: matchingLoading,
    error: matchingError,
  } = useAIJobMatching(studentData, true, 3);

  const [activeModal, setActiveModal] = useState(null);
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [editingItem, setEditingItem] = useState(null); // Track specific item being edited

  // Refs for Recent Updates
  const recentUpdatesRef = useRef(null);

  const toggleSkillExpand = (id) => {
    setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning</h1>
            <p className="text-gray-600">
              Track your courses, certifications, and professional development
            </p>
          </div>
          <Button
            onClick={() => setActiveModal("learning")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Learning
          </Button>
        </div>

        {/* Main Content - Full Width */}
        <div className="space-y-8">
            {enabledLearning.length > 0 ? (
              <>
                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm">
                    <CardContent className="pt-6 p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mb-1">
                        {enabledLearning.length}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Learning
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-white border border-green-200 shadow-sm">
                    <CardContent className="pt-6 p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-green-600 mb-1">
                        {
                          enabledLearning.filter((t) => t.status === "completed")
                            .length
                        }
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-sm">
                    <CardContent className="pt-6 p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                      <p className="text-3xl font-bold text-amber-600 mb-1">
                        {
                          enabledLearning.filter((t) => t.status === "ongoing")
                            .length
                        }
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        In Progress
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Learning Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {enabledLearning.map((item, index) => (
                    <Card
                      key={index}
                      className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 shadow-sm overflow-hidden self-start"
                    >
                      <CardHeader className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <CardTitle className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                              {item.course}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">
                              {item.provider}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Only show edit button for external courses, not internal platform courses */}
                            {item.source !== 'internal_course' && (
                              <button
                                onClick={() => {
                                  setEditingItem(item); // Set the specific item to edit
                                  setActiveModal("edit");
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <Badge
                              className={
                                item.status === "completed"
                                  ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold"
                                  : "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold"
                              }
                            >
                              {item.status === "completed"
                                ? "Completed"
                                : "Ongoing"}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-4 p-6 space-y-5">
                        <div className="space-y-3 text-sm text-gray-700">
                          {item.duration && (
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span>{item.duration}</span>
                            </div>
                          )}
                          {item.certificationDate && (
                            <div className="flex items-center gap-3">
                              <Award className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span>
                                Certified: {item.certificationDate}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Skills Section - Fixed */}
                        {item.skills && item.skills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              Skills covered
                            </p>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                              {(expandedSkills[item.id]
                                ? item.skills
                                : item.skills.slice(0, 6)
                              ).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                            {item.skills.length > 6 && (
                              <button
                                onClick={() => toggleSkillExpand(item.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                              >
                                {expandedSkills[item.id]
                                  ? "Show Less"
                                  : `Show All (${item.skills.length})`}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Nike-style Progress Bar - Uses completedModules/totalModules for dynamic progress */}
                        <LearningProgressBar 
                          variant="card"
                          progress={
                            item.status === "completed" 
                              ? 100 
                              : item.totalModules > 0 
                                ? Math.round((item.completedModules || 0) / item.totalModules * 100)
                                : (item.progress || 0)
                          }
                          completedModules={item.completedModules || 0}
                          totalModules={item.totalModules || 0}
                        />

                        {item.certificateUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 font-medium text-sm rounded-lg transition-all"
                            onClick={() =>
                              window.open(item.certificateUrl, "_blank")
                            }
                          >
                            <Award className="w-4 h-4 mr-2" />
                            View Certificate
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <CardContent className="text-center py-20 px-6">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No learning records yet
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Start adding your courses and certifications to showcase your
                    learning journey
                  </p>
                  <Button
                    onClick={() => setActiveModal("learning")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Learning
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Select Course Modal - Shows internal courses + option for external */}
        <SelectCourseModal
          isOpen={activeModal === "learning"}
          onClose={() => setActiveModal(null)}
          studentId={studentId}
          onSuccess={() => {
            refresh(); // Refresh data after adding
          }}
        />

        {/* Edit Modal - Pass only the specific item being edited */}
        {activeModal === "edit" && editingItem && (
          <TrainingEditModal
            isOpen={true}
            onClose={() => {
              setActiveModal(null);
              setEditingItem(null);
              refresh(); // Refresh data after closing
            }}
            onSave={async (updatedItems) => {
              console.log('📝 onSave called with updatedItems:', updatedItems);
              console.log('📚 Current learning array:', learning);
              console.log('📚 Learning IDs:', learning.map(l => l.id));
              
              // updatedItems will be an array with the single edited item
              const updatedItem = updatedItems[0];
              
              if (!updatedItem) {
                console.error('❌ No updated item received');
                return;
              }
              
              console.log('🔍 Looking for item with id:', updatedItem.id);
              console.log('🔍 updatedItem full data:', updatedItem);
              
              // Check if the item exists in the learning array
              const existingIndex = learning.findIndex(item => item.id === updatedItem.id);
              console.log('🔍 Found at index:', existingIndex);
              
              let updatedLearning;
              if (existingIndex >= 0) {
                // Merge it back with the full learning array
                updatedLearning = learning.map((item) => {
                  if (item.id === updatedItem.id) {
                    console.log('✅ Found matching item, merging:', item.id);
                    // Merge the updated fields with the original item
                    return { ...item, ...updatedItem };
                  }
                  return item;
                });
              } else {
                // Item not found - this shouldn't happen for edits, but handle it
                console.warn('⚠️ Item not found in learning array, adding as new');
                updatedLearning = [...learning, updatedItem];
              }
              
              console.log('💾 Sending to updateTraining:', updatedLearning);
              console.log('💾 IDs being sent:', updatedLearning.map(l => l.id));
              
              const result = await updateTraining(updatedLearning);
              console.log('📤 updateTraining result:', result);
              
              // Refresh to get latest data
              await refresh();
            }}
            data={[editingItem]} // Pass only the single item as an array
            singleEditMode={true} // Flag to indicate single item edit
          />
        )}
      </div>
    </div>
  );
};

export default MyLearning;