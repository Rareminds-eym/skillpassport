import { useState } from "react";
import {
  Card,
  CardContent,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import {
  Plus,
  BookOpen,
  TrendingUp,
  Award,
  GraduationCap,
} from "lucide-react";
import ModernLearningCard from "../../components/Students/components/ModernLearningCard";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useAuth } from "../../context/AuthContext";
import { TrainingEditModal } from "../../components/Students/components/ProfileEditModals";
import SelectCourseModal from "../../components/Students/components/SelectCourseModal";
import { useStudentMessageNotifications } from "../../hooks/useStudentMessageNotifications";

const MyLearning = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const { studentData, updateTraining, refresh } = useStudentDataByEmail(userEmail, false);

  const learning = studentData?.training || [];
  const enabledLearning = learning.filter((t) => t && t.enabled !== false);

  // Get student ID for messaging
  const studentId = studentData?.id;

  // Setup message notifications
  useStudentMessageNotifications({
    studentId,
    enabled: !!studentId,
    playSound: true,
  });

  const [activeModal, setActiveModal] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  const toggleSkillExpand = (id) => {
    setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setActiveModal("edit");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                My Learning
              </h1>
            </div>
            <p className="text-gray-500 text-base max-w-lg">
              Track your courses, certifications, and professional development journey
            </p>
          </div>
          <Button
            onClick={() => setActiveModal("learning")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50 hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Learning
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {enabledLearning.length > 0 ? (
            <>
              {/* Compact Stats Summary */}
              <div className="grid grid-cols-3 gap-4">
                {/* Total Learning Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{enabledLearning.length}</p>
                  <p className="text-xs text-gray-500">Total Courses</p>
                </div>

                {/* Completed Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center mb-3">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {enabledLearning.filter((t) => t.status === "completed").length}
                  </p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>

                {/* In Progress Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-400 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {enabledLearning.filter((t) => t.status === "ongoing").length}
                  </p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
              </div>

              {/* Section Header */}
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-800">Your Courses</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
              </div>

              {/* Modern Learning Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enabledLearning.map((item, index) => (
                  <ModernLearningCard
                    key={item.id || index}
                    item={item}
                    onEdit={handleEditItem}
                    expandedSkills={expandedSkills}
                    onToggleSkills={toggleSkillExpand}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="text-center py-20 px-6">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl rotate-6" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white rounded-3xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Start Your Learning Journey
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                  Add your courses and certifications to track your progress and showcase your professional development
                </p>
                <Button
                  onClick={() => setActiveModal("learning")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50 hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Course
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