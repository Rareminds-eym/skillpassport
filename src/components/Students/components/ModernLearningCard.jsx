import {
    Award,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Edit,
    ListChecks,
    Play,
    Target
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import { downloadCertificate } from "../../../services/certificateService";
import { checkAssessmentStatus } from "../../../services/externalAssessmentService";

/**
 * Modern Learning Card Component
 * Clean, minimal design with outer white card and inner colored card
 * Supports both trainings and course enrollments
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

  // Check if this is a course enrollment (started from course player)
  const isCourseEnrollment = item.type === 'course_enrollment' || item.source === 'course_enrollment';

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
  // Course enrollments are always internal platform courses
  const isInternalCourse = isCourseEnrollment || !!(item.course_id && item.source === "internal_course");
  const isExternalCourse = !isInternalCourse;

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

  // Handle continue/resume button click
  const handleContinue = () => {
    if (isCourseEnrollment && item.course_id) {
      // Navigate to course player for enrolled courses
      navigate(`/student/courses/${item.course_id}/learn`);
    }
  };

  // Format last accessed time
  const getLastAccessedText = () => {
    if (!item.lastAccessed) return null;
    const lastAccessed = new Date(item.lastAccessed);
    const now = new Date();
    const diffMs = now - lastAccessed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastAccessed.toLocaleDateString();
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
          <div className="flex items-center gap-2">
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
            
            {/* Course Enrollment Badge */}
            {isCourseEnrollment && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Platform Course
              </span>
            )}
          </div>

          {/* Edit Button - Only for external courses (not course enrollments) */}
          {isExternalCourse && !isCourseEnrollment && (
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
          {item.course || item.title}
        </h3>

        {/* Provider/Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {item.provider || item.organization}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-gray-700 mb-6">
          {item.totalModules > 0 && (
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-gray-500" />
              <span>{item.totalModules} {isCourseEnrollment ? 'lessons' : 'modules'}</span>
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
          {/* Last accessed for course enrollments */}
          {isCourseEnrollment && item.lastAccessed && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span>{getLastAccessedText()}</span>
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
          {isCourseEnrollment ? 'Lessons' : 'Modules'}:{" "}
          <span className="font-bold text-gray-900">
            {item.completedModules || 0}/{item.totalModules || 0}
          </span>
        </div>
        
        {/* Button Section */}
        <div className="flex items-center gap-3">
          {/* Assessment Button - ONLY show for EXTERNAL courses (not internal platform courses or enrollments) */}
          {isExternalCourse && !isCourseEnrollment && !checkingAssessment && (
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
          {isCompleted ? (
            item.certificateUrl ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open(item.certificateUrl, "_blank")}
                  className="px-5 py-2.5 rounded-full font-medium text-sm bg-green-500 text-white hover:bg-green-600 transition-all duration-300 flex items-center gap-2"
                  title="View Certificate"
                >
                  <Award className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => downloadCertificate(item.certificateUrl, item.course || item.title)}
                  className="p-2.5 rounded-full font-medium text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-300"
                  title="Download Certificate"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="px-6 py-2.5 rounded-full font-medium text-sm bg-green-100 text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed
              </div>
            )
          ) : isCourseEnrollment ? (
            <button 
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-full font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {progress > 0 ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button className="px-6 py-2.5 rounded-full font-medium text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernLearningCard;