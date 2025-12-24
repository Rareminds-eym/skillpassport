import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Award,
  Edit,
  Briefcase,
  ListChecks,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { checkAssessmentStatus } from "../../../services/externalAssessmentService";
import { useAuth } from "../../../context/AuthContext";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";

/**
 * Modern Learning Card Component
 * Clean, minimal design with outer white card and inner colored card
 */
const ModernLearningCard = ({
  item,
  onEdit,
  onContinue,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  
  const userEmail = user?.email;
  const { studentData } = useStudentDataByEmail(userEmail, false);

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

  // Check if assessment is already completed or in progress
  useEffect(() => {
    const checkCompletion = async () => {
      if (isExternalCourse && studentData?.id && item.course) {
        setCheckingAssessment(true);
        const result = await checkAssessmentStatus(studentData.id, item.course);
        setAssessmentCompleted(result.status === 'completed');
        setCheckingAssessment(false);
      } else {
        setCheckingAssessment(false);
      }
    };
    
    checkCompletion();
  }, [isExternalCourse, studentData?.id, item.course]);

  // Handle continue button click (only for internal courses)
  const handleContinueClick = () => {
    if (progress >= 100 || isExternalCourse) {
      // Course is 100% completed or external course - no continue button should be shown
      return;
    }
    
    // Internal course - navigate to course learning page
    if (onContinue) {
      onContinue(item);
    } else {
      // Fallback navigation if onContinue not provided
      navigate(`/student/courses/${item.course_id}/learn`);
    }
  };

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
      {/* Colored Left Border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      
      {/* Inner Card - White Background */}
      <div className="rounded-2xl p-6 bg-white">
        {/* Top Row - Status Badge & Edit */}
        <div className="flex items-center justify-between mb-4">
          {/* Status Badge - Top Left */}
          <span
            className={`
              inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
              ${isCompleted 
                ? "bg-green-100/80 text-green-800" 
                : "bg-blue-100/80 text-blue-800"}
            `}
          >
            {isCompleted ? "Completed" : "Ongoing"}
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
            <span className={`text-lg font-bold ${isCompleted ? "text-blue-600" : "text-blue-600"}`}>
              {progress}%
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isCompleted ? "bg-blue-200" : "bg-blue-200"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isCompleted ? "bg-blue-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Section - Outside the colored card, in white area */}
      <div className="px-3 py-4 flex items-center justify-between">
        {/* Modules Count */}
        <div className="text-sm text-gray-700">
          Modules:{" "}
          <span className="font-bold text-gray-900">
            {item.completedModules || 0}/{item.totalModules || 0}
          </span>
        </div>
        
        {/* Button Section */}
        <div className="flex items-center gap-3">
          {/* Assessment Button - ONLY show for EXTERNAL courses (not internal platform courses) */}
          {isExternalCourse && !checkingAssessment && (
            assessmentCompleted ? (
              <div className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm bg-green-100 text-green-700 border-2 border-green-300">
                <CheckCircle className="w-4 h-4" />
                Completed
              </div>
            ) : (
              <button
                onClick={() => navigate("/student/assessment/platform", {
                  state: {
                    courseName: item.course || item.title,
                    certificateName: item.course || item.title,
                    level: item.level || 'Intermediate',
                    courseId: item.id,
                    useDynamicGeneration: true
                  }
                })}
                className="px-6 py-2.5 rounded-full font-medium text-sm border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Assessment
              </button>
            )
          )}

{/* Certificate or Continue Button */}
{item.certificateUrl ? (
  <button
    onClick={() => window.open(item.certificateUrl, "_blank")}
    className={`
      px-6 py-2.5 rounded-full font-medium text-sm
      flex items-center gap-2 transition-all duration-300
      ${isCompleted
        ? "bg-blue-500 text-white hover:bg-blue-600"
        : "bg-blue-500 text-white hover:bg-blue-600"}
    `}
  >
    <Award className="w-4 h-4" />
    Certificate
  </button>
) : isExternalCourse ? (
  // External courses → NO continue button
  <div
    className={`px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 ${
      progress >= 100
        ? "bg-green-100 text-green-700"
        : "bg-blue-100 text-blue-700"
    }`}
  >
    <CheckCircle className="w-4 h-4" />
    {progress >= 100 ? "Completed" : "Ongoing"}
  </div>
) : progress >= 100 ? (
  // Internal course completed → status only
  <div className="px-6 py-2.5 rounded-full font-medium text-sm bg-green-100 text-green-700 flex items-center gap-2">
    <CheckCircle className="w-4 h-4" />
    Completed
  </div>
) : (
  // Internal course incomplete → Continue button
  <button
    onClick={handleContinueClick}
    className="px-6 py-2.5 rounded-full font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 flex items-center gap-2"
  >
    <ArrowRight className="w-4 h-4" />
    Continue
  </button>
)}

      </div>
    </div>
  );
};

export default ModernLearningCard;
