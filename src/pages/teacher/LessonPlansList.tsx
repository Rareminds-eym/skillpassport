import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Eye, Edit, Trash2, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  date: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
}

const LessonPlansList: React.FC = () => {
  const navigate = useNavigate();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadLessonPlans();
  }, []);

  const loadLessonPlans = async () => {
    setLoading(true);
    try {
      // Get current teacher from AuthContext
      const userEmail = localStorage.getItem('userEmail');
      
      const { data: teacherData } = await supabase
        .from("school_educators")
        .select("id")
        .eq("email", userEmail)
        .single();

      if (!teacherData) {
        throw new Error("Teacher not found");
      }

      const { data, error } = await supabase
        .from("lesson_plans")
        .select("*")
        .eq("teacher_id", teacherData.id)
        .order("date", { ascending: false });

      if (error) throw error;

      setLessonPlans(data || []);
    } catch (error: any) {
      console.error("Error loading lesson plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLessonPlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson plan?")) return;

    try {
      const { error } = await supabase.from("lesson_plans").delete().eq("id", id);

      if (error) throw error;

      setLessonPlans(lessonPlans.filter((lp) => lp.id !== id));
    } catch (error: any) {
      alert("Error deleting lesson plan: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", icon: Clock, label: "Draft" },
      submitted: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Submitted" },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" },
      revision_required: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
        label: "Needs Revision",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const filteredPlans = lessonPlans.filter((lp) => {
    if (filter === "all") return true;
    return lp.status === filter;
  });

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
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Lesson Plans</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and track your lesson plans
            </p>
          </div>
          <button
            onClick={() => navigate("/educator/lesson-plans/create")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["all", "draft", "submitted", "approved", "rejected"].map((status) => {
          const count =
            status === "all"
              ? lessonPlans.length
              : lessonPlans.filter((lp) => lp.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`p-4 rounded-xl border-2 transition ${
                filter === status
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-600 capitalize">{status.replace(/_/g, " ")}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Lesson Plans List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredPlans.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No lesson plans found</p>
            <button
              onClick={() => navigate("/educator/lesson-plans/create")}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first lesson plan
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {plan.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {plan.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(plan.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(plan.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/educator/lesson-plans/${plan.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {plan.status === "draft" && (
                          <>
                            <button
                              onClick={() => navigate(`/educator/lesson-plans/${plan.id}/edit`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteLessonPlan(plan.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Comments */}
      {filteredPlans.some((lp) => lp.review_comments) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h2>
          <div className="space-y-4">
            {filteredPlans
              .filter((lp) => lp.review_comments)
              .slice(0, 3)
              .map((plan) => (
                <div key={plan.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{plan.title}</h3>
                    {getStatusBadge(plan.status)}
                  </div>
                  <p className="text-sm text-gray-700">{plan.review_comments}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Reviewed on {new Date(plan.reviewed_at!).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlansList;
