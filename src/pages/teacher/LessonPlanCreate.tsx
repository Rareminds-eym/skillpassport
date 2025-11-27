import React, { useState } from "react";
import { BookOpen, Plus, X, Save, Send, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface Activity {
  description: string;
  duration: number;
  type: string;
}

interface Resource {
  name: string;
  type: string;
  url?: string;
}

const LessonPlanCreate: React.FC = () => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class_name: "",
    date: "",
    duration: 45,
    learning_objectives: "",
    assessment_methods: "",
    homework: "",
    notes: "",
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity>({
    description: "",
    duration: 15,
    type: "lecture",
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [currentResource, setCurrentResource] = useState<Resource>({
    name: "",
    type: "textbook",
    url: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addActivity = () => {
    if (!currentActivity.description.trim()) return;
    setActivities([...activities, currentActivity]);
    setCurrentActivity({ description: "", duration: 15, type: "lecture" });
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const addResource = () => {
    if (!currentResource.name.trim()) return;
    setResources([...resources, currentResource]);
    setCurrentResource({ name: "", type: "textbook", url: "" });
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (action: "draft" | "submit") => {
    setLoading(true);
    setMessage(null);

    try {
      // Validation
      if (!formData.title || !formData.subject || !formData.class_name || !formData.date || !formData.learning_objectives) {
        throw new Error("Please fill all required fields (Title, Subject, Class, Date, Learning Objectives)");
      }

      if (activities.length === 0) {
        throw new Error("Please add at least one activity");
      }

      if (resources.length === 0) {
        throw new Error("Please add at least one resource");
      }

      // Get current teacher
      const { data: userData } = await supabase.auth.getUser();
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", userData?.user?.email)
        .single();

      if (!teacherData) {
        throw new Error("Teacher not found");
      }

      const status = action === "draft" ? "draft" : "submitted";
      const submitted_at = action === "submit" ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from("lesson_plans")
        .insert({
          teacher_id: teacherData.id,
          ...formData,
          activities,
          resources,
          status,
          submitted_at,
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Lesson plan ${action === "draft" ? "saved as draft" : "submitted for approval"} successfully!`,
      });

      // Reset form
      setFormData({
        title: "",
        subject: "",
        class_name: "",
        date: "",
        duration: 45,
        learning_objectives: "",
        assessment_methods: "",
        homework: "",
        notes: "",
      });
      setActivities([]);
      setResources([]);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Create Lesson Plan
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Plan your lesson with learning objectives, activities, and resources
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* Basic Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Introduction to Algebra"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
              <input
                type="text"
                required
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., 10-A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="15"
                step="15"
              />
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Objectives (LO) *</h2>
          <textarea
            required
            value={formData.learning_objectives}
            onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="What should students learn from this lesson? List specific, measurable objectives..."
          />
        </div>

        {/* Activities */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activities *</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              placeholder="Activity description"
              value={currentActivity.description}
              onChange={(e) =>
                setCurrentActivity({ ...currentActivity, description: e.target.value })
              }
              className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={currentActivity.type}
              onChange={(e) => setCurrentActivity({ ...currentActivity, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="lecture">Lecture</option>
              <option value="discussion">Discussion</option>
              <option value="group_work">Group Work</option>
              <option value="practical">Practical</option>
              <option value="assessment">Assessment</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={currentActivity.duration}
                onChange={(e) =>
                  setCurrentActivity({ ...currentActivity, duration: parseInt(e.target.value) })
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                min="5"
              />
              <button
                type="button"
                onClick={addActivity}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{activity.description}</span>
                  <span className="text-sm text-gray-600 ml-3">
                    {activity.type} • {activity.duration} min
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeActivity(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources *</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              placeholder="Resource name"
              value={currentResource.name}
              onChange={(e) => setCurrentResource({ ...currentResource, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={currentResource.type}
              onChange={(e) => setCurrentResource({ ...currentResource, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="textbook">Textbook</option>
              <option value="worksheet">Worksheet</option>
              <option value="video">Video</option>
              <option value="website">Website</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
            <input
              type="url"
              placeholder="URL (optional)"
              value={currentResource.url}
              onChange={(e) => setCurrentResource({ ...currentResource, url: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addResource}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="space-y-2">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{resource.name}</span>
                  <span className="text-sm text-gray-600 ml-3">{resource.type}</span>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 ml-3 hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeResource(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Fields */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Methods
              </label>
              <textarea
                value={formData.assessment_methods}
                onChange={(e) => setFormData({ ...formData, assessment_methods: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="How will you assess student learning?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Homework</label>
              <textarea
                value={formData.homework}
                onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Homework assignments (if any)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Additional notes or reminders"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition font-medium"
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit("submit")}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
          >
            <Send className="h-4 w-4" />
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlanCreate;
