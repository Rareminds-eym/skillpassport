import React, { useState, useEffect } from "react";
import { BookOpen, CheckCircle, XCircle, Eye, MessageSquare, Clock } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

interface LessonPlan {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  subject: string;
  class_name: string;
  date: string;
  duration: number;
  learning_objectives: string;
  activities: any[];
  resources: any[];
  assessment_methods: string;
  homework: string;
  notes: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

const LessonPlanApprovals: React.FC = () => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingLessonPlans();
  }, []);

  const loadPendingLessonPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lesson_plans")
        .select(`
          *,
          teachers!inner(first_name, last_name)
        `)
        .in("status", ["submitted", "revision_required"])
        .order("submitted_at", { ascending: true });

      if (error) throw error;

      const formattedData = data?.map((lp: any) => ({
        ...lp,
        teacher_name: `${lp.teachers.first_name} ${lp.teachers.last_name}`,
      }));

      setLessonPlans(formattedData || []);
    } catch (error: any) {
      console.error("Error loading lesson plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (planId: string) => {
    setActionLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("lesson_plans")
        .update({
          status: "approved",
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
          review_comments: reviewComments || "Approved",
        })
        .eq("id", planId);

      if (error) throw error;

      setSelectedPlan(null);
      setReviewComments("");
      loadPendingLessonPlans();
    } catch (error: any) {
      alert("Error approving lesson plan: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (planId: string) => {
    if (!reviewComments.trim()) {
      alert("Please provide feedback for rejection");
      return;
    }

    setActionLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("lesson_plans")
        .update({
          status: "rejected",
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
          review_comments: reviewComments,
        })
        .eq("id", planId);

      if (error) throw error;

      setSelectedPlan(null);
      setReviewComments("");
      loadPendingLessonPlans();
    } catch (error: any) {
      alert("Error rejecting lesson plan: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (planId: string) => {
    if (!reviewComments.trim()) {
      alert("Please provide feedback for revision");
      return;
    }

    setActionLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("lesson_plans")
        .update({
          status: "revision_required",
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
          review_comments: reviewComments,
        })
        .eq("id", planId);

      if (error) throw error;

      setSelectedPlan(null);
      setReviewComments("");
      loadPendingLessonPlans();
    } catch (error: any) {
      alert("Error requesting revision: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Lesson Plan Approvals
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Review and approve lesson plans submitted by teachers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessonPlans.filter((lp) => lp.status === "submitted").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Needs Revision</p>
              <p className="text-2xl font-bold text-gray-900">
                {lessonPlans.filter((lp) => lp.status === "revision_required").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{lessonPlans.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Plans List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {lessonPlans.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No lesson plans pending approval</p>
              </div>
            ) : (
              lessonPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 cursor-pointer transition ${
                    selectedPlan?.id === plan.id ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.status === "submitted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {plan.status === "submitted" ? "New" : "Revision"}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Teacher:</span> {plan.teacher_name}
                    </p>
                    <p>
                      <span className="font-medium">Subject:</span> {plan.subject} • Class{" "}
                      {plan.class_name}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(plan.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted {new Date(plan.submitted_at!).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {selectedPlan ? (
            <>
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lesson Plan Details</h2>
              </div>

              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {/* Basic Info */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedPlan.title}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Teacher:</span>
                      <p className="font-medium text-gray-900">{selectedPlan.teacher_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Subject:</span>
                      <p className="font-medium text-gray-900">{selectedPlan.subject}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Class:</span>
                      <p className="font-medium text-gray-900">{selectedPlan.class_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium text-gray-900">{selectedPlan.duration} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Learning Objectives */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Learning Objectives</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedPlan.learning_objectives}
                  </p>
                </div>

                {/* Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Activities</h4>
                  <div className="space-y-2">
                    {selectedPlan.activities.map((activity: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{activity.description}</span>
                          <span className="text-xs text-gray-600">
                            {activity.type} • {activity.duration} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Resources</h4>
                  <div className="space-y-2">
                    {selectedPlan.resources.map((resource: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{resource.name}</span>
                          <span className="text-xs text-gray-600">{resource.type}</span>
                        </div>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline mt-1 block"
                          >
                            View Resource
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comments
                  </label>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Provide feedback to the teacher..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedPlan.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRequestRevision(selectedPlan.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 transition font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request Revision
                  </button>
                  <button
                    onClick={() => handleReject(selectedPlan.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Select a lesson plan to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonPlanApprovals;
