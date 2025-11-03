import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import { Progress } from "../../components/Students/components/ui/progress";
import {
  Code,
  Calendar,
  Award,
  Edit,
  Plus,
  BookOpen,
  Bell,
  TrendingUp,
} from "lucide-react";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useAuth } from "../../context/AuthContext";
import { TrainingEditModal } from "../../components/Students/components/ProfileEditModals";
import { useRecentUpdates } from "../../hooks/useRecentUpdates";
import { useRecentUpdatesLegacy } from "../../hooks/useRecentUpdatesLegacy";
import {
  suggestions as mockSuggestions,
} from "../../components/Students/data/mockData";

const MyTraining = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTraining } = useStudentDataByEmail(userEmail, false);

  const training = studentData?.training || [];
  const enabledTraining = training.filter((t) => t && t.enabled !== false);
  const suggestions = studentData?.suggestions || mockSuggestions;

  // Recent Updates (same as Dashboard)
  const {
    recentUpdates,
    loading: recentUpdatesLoading,
    error: recentUpdatesError,
    refreshRecentUpdates,
  } = useRecentUpdates();

  const {
    recentUpdates: recentUpdatesLegacy,
    loading: recentUpdatesLoadingLegacy,
    error: recentUpdatesErrorLegacy,
    refreshRecentUpdates: refreshRecentUpdatesLegacy,
  } = useRecentUpdatesLegacy();

  const finalRecentUpdates =
    recentUpdates.length > 0 ? recentUpdates : recentUpdatesLegacy;
  const finalLoading = recentUpdatesLoading || recentUpdatesLoadingLegacy;
  const finalError = recentUpdatesError || recentUpdatesErrorLegacy;
  const finalRefresh = () => {
    refreshRecentUpdates();
    refreshRecentUpdatesLegacy();
  };

  const [activeModal, setActiveModal] = useState(null);
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState({});

  const handleSaveTraining = async (updatedTraining) => {
    await updateTraining(updatedTraining);
    setActiveModal(null);
  };

  const toggleSkillExpand = (id) => {
    setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Training</h1>
            <p className="text-gray-600">
              Track your courses, certifications, and professional development
            </p>
          </div>
          <Button
            onClick={() => setActiveModal("training")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Training
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Recent Updates */}
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      Recent Updates
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {finalLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                  ) : finalError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600 mb-4 font-medium">
                        Failed to load recent updates
                      </p>
                      <Button
                        onClick={finalRefresh}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-lg transition-colors"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : finalRecentUpdates.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        No recent updates available
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`space-y-3 ${
                          showAllRecentUpdates
                            ? "max-h-96 overflow-y-auto pr-2 scroll-smooth"
                            : ""
                        }`}
                      >
                        {(showAllRecentUpdates
                          ? finalRecentUpdates
                          : finalRecentUpdates.slice(0, 5)
                        )
                          .filter((update) => update && update.message)
                          .map((update, idx) => (
                            <div
                              key={update.id || `update-${idx}`}
                              className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-start gap-3 group"
                            >
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 mb-1 leading-relaxed">
                                  {update.message}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {update.timestamp}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                      {finalRecentUpdates.length > 5 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-lg transition-all"
                            onClick={() =>
                              setShowAllRecentUpdates(!showAllRecentUpdates)
                            }
                          >
                            {showAllRecentUpdates
                              ? "Show Less"
                              : `Show All (${finalRecentUpdates.length})`}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      Suggested Next Steps
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {suggestions && suggestions.length > 0 ? (
                    <div className="space-y-3">
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all"
                        >
                          <p className="text-sm font-medium text-gray-900 leading-relaxed">
                            {typeof suggestion === "string"
                              ? suggestion
                              : suggestion.message || suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        No suggestions available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {enabledTraining.length > 0 ? (
              <>
                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm">
                    <CardContent className="pt-6 p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mb-1">
                        {enabledTraining.length}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Total Trainings
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
                          enabledTraining.filter((t) => t.status === "completed")
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
                          enabledTraining.filter((t) => t.status === "ongoing")
                            .length
                        }
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        In Progress
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Training Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {enabledTraining.map((item, index) => (
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
                          <Badge
                            className={
                              item.status === "completed"
                                ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                                : "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                            }
                          >
                            {item.status === "completed"
                              ? "Completed"
                              : "Ongoing"}
                          </Badge>
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
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md font-medium"
                                >
                                  {skill}
                                </Badge>
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

                        {/* Progress */}
                        {item.progress !== undefined && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 font-medium">
                                Progress
                              </span>
                              <span className="text-blue-600 font-semibold">
                                {item.status === "completed"
                                  ? "100%"
                                  : `${item.progress}%`}
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{
                                  width: `${
                                    item.status === "completed"
                                      ? 100
                                      : item.progress
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

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
                    No training records yet
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Start adding your courses and certifications to showcase your
                    learning journey
                  </p>
                  <Button
                    onClick={() => setActiveModal("training")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Training
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {activeModal && (
          <TrainingEditModal
            isOpen={!!activeModal}
            onClose={() => setActiveModal(null)}
            onSave={handleSaveTraining}
            data={training}
          />
        )}
      </div>
    </div>
  );
};

export default MyTraining;