import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Award,
  Edit,
  Briefcase,
  ListChecks,
  Target,
} from "lucide-react";

/**
 * Modern Learning Card Component
 * Clean, minimal design with outer white card and inner colored card
 */
const ModernLearningCard = ({
  item,
  onEdit,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // Calculate progress
  const progress =
    item.status === "completed"
      ? 100
      : item.totalModules > 0
      ? Math.round(((item.completedModules || 0) / item.totalModules) * 100)
      : item.progress || 0;

  const isCompleted = item.status === "completed";
  
  // Check if course is from RareMinds platform (internal) or external
  // Internal courses: have course_id (linking to courses table) AND source='internal_course'
  // External courses: everything else (manual, external_course, or no course_id)
  const isInternalCourse = !!(item.course_id && item.source === "internal_course");
  const isExternalCourse = !isInternalCourse;

  // Debug logging - DETAILED
  console.log('🔍 Course Debug:', {
    title: item.course || item.title,
    course_id: item.course_id,
    courseId: item.courseId,
    source: item.source,
    isInternalCourse,
    isExternalCourse,
    allFields: Object.keys(item)
  });

  return (
    <div
      className={`
        group relative bg-white rounded-3xl overflow-hidden p-3
        transition-all duration-300 ease-out border border-gray-100
        ${isHovered ? "shadow-md -translate-y-0.5" : "shadow-sm"}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Inner Colored Card */}
      <div className={`rounded-2xl p-6 ${isCompleted ? "bg-green-50" : "bg-blue-50"}`}>
        {/* Top Row - Status Badge & Edit */}
        <div className="flex items-center justify-between mb-4">
          {/* Status Badge - Top Left */}
          <span
            className={`
              inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
              ${isCompleted 
                ? "bg-green-100/80 text-green-800" 
                : "bg-white/80 text-gray-700"}
            `}
          >
            {isCompleted ? "Completed" : "In Progress"}
          </span>

          {/* Edit Button - Only for external courses */}
          {isExternalCourse && (
            <button
              onClick={() => onEdit?.(item)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white/50 rounded-lg transition-all duration-200"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Course Title */}
        <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
          {item.course}
        </h3>

        {/* Provider/Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {item.provider}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-gray-700 mb-6">
          {item.totalModules > 0 && (
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-gray-500" />
              <span>{item.totalModules} modules</span>
            </div>
          )}
          {item.skills && item.skills.length > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <span>{item.skills.length} skills</span>
              </div>
            </>
          )}
          {item.duration && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span>{item.duration}</span>
              </div>
            </>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className={`text-lg font-bold ${isCompleted ? "text-green-600" : "text-blue-600"}`}>
              {progress}%
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isCompleted ? "bg-green-200" : "bg-blue-200"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isCompleted ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Section - Outside the colored card, in white area */}
      <div className="px-3 py-4 flex items-center justify-between">
        {/* Modules Count with Assessment Button */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Modules:{" "}
            <span className="font-bold text-gray-900">
              {item.completedModules || 0}/{item.totalModules || 0}
            </span>
          </div>
          
          {/* Assessment Button - ONLY show for EXTERNAL courses (not internal platform courses) */}
          {isExternalCourse && (
            <button
              onClick={() => navigate("/student/assessment/platform")}
              className="px-6 py-2.5 rounded-full font-medium text-sm border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Assessment
            </button>
          )}
        </div>

        {/* Certificate or Continue Button */}
        {item.certificateUrl ? (
          <button
            onClick={() => window.open(item.certificateUrl, "_blank")}
            className={`
              px-6 py-2.5 rounded-full font-medium text-sm
              flex items-center gap-2 transition-all duration-300
              ${isCompleted
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-blue-500 text-white hover:bg-blue-600"}
            `}
          >
            <Award className="w-4 h-4" />
            Certificate
          </button>
        ) : (
          <button className="px-6 py-2.5 rounded-full font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300">
            Continue
          </button>
        )}
      </div>
    </div>
  );
};

export default ModernLearningCard;
