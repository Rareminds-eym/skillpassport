import {
    Award,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    Edit,
    ListChecks,
    Play,
    Target,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import { checkAssessmentStatus } from "../../../services/externalAssessmentService";

/**
 * Modern Learning Card Component - Completely Redesigned
 * Professional, enterprise-grade design with blue and green color scheme
 * Supports both grid and list view modes with enhanced visual hierarchy
 */
const ModernLearningCard = ({
  item,
  onEdit,
  viewMode = 'grid'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(null);
  const [checkingAssessment, setCheckingAssessment] = useState(true);
  
  const userEmail = user?.email;
  const { studentData } = useStudentDataByEmail(userEmail, false);

  // Check if this is a course enrollment (started from course player)
  const isCourseEnrollment = item.type === 'course_enrollment' || item.source === 'course_enrollment';

  // Check if course is from RareMinds platform (internal) or external
  const isInternalCourse = isCourseEnrollment || !!(item.course_id && item.source === "internal_course");
  const isExternalCourse = !isInternalCourse;

  // Memoize progress calculation to avoid recalculation on re-renders
  const progress = useMemo(() => {
    // External courses - show actual learning progress from modules
    if (isExternalCourse) {
      // If course has module data, calculate progress from modules
      if (item.totalModules > 0) {
        return Math.round(((item.completedModules || 0) / item.totalModules) * 100);
      }
      // If no module data but has progress field, use it
      if (item.progress !== undefined && item.progress !== null) {
        return Math.round(item.progress);
      }
      // If assessment completed but no progress data, show 100%
      if (assessmentCompleted) {
        return 100;
      }
      // Default to 0% if no progress data
      return 0;
    }
    
    // Course enrollments - calculate progress based on actual lesson completion
    if (isCourseEnrollment) {
      // Calculate progress from completed vs total modules (lessons)
      if (item.totalModules > 0) {
        return Math.round(((item.completedModules || 0) / item.totalModules) * 100);
      }
      // If no module data, check if status is completed
      if (item.status === "completed") return 100;
      // Fallback to stored progress if no module data
      if (item.progress !== undefined && item.progress !== null) {
        return Math.round(item.progress);
      }
      return 0;
    }
    
    // Regular trainings (internal courses not from enrollment)
    if (item.status === "completed") return 100;
    if (item.totalModules > 0) {
      return Math.round(((item.completedModules || 0) / item.totalModules) * 100);
    }
    return item.progress || 0;
  }, [
    isExternalCourse, 
    isCourseEnrollment, 
    item.totalModules, 
    item.completedModules, 
    item.progress, 
    item.status, 
    assessmentCompleted
  ]);
  // For external courses, completion is based on assessment completion
  // For internal courses, completion is based on actual progress (100% = all lessons completed)
  const isCompleted = isExternalCourse ? assessmentCompleted : progress >= 100;

  // Check if assessment is already completed or in progress
  useEffect(() => {
    const checkCompletion = async () => {
      if (isExternalCourse && studentData?.id && item.course) {
        setCheckingAssessment(true);
        const result = await checkAssessmentStatus(studentData.id, item.course);
        setAssessmentCompleted(result.status === 'completed');
        // Store the assessment score if completed
        if (result.status === 'completed' && result.attempt?.score !== undefined) {
          setAssessmentScore(result.attempt.score);
        }
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

  // Get progress color based on completion status - Only blue and green
  const getProgressColor = () => {
    if (isCompleted) return 'from-green-500 to-green-600';
    if (progress >= 75) return 'from-blue-500 to-blue-600';
    if (progress >= 50) return 'from-blue-500 to-blue-600';
    if (progress >= 25) return 'from-blue-500 to-blue-600';
    // Changed from gray to light blue for low progress
    return 'from-blue-500 to-blue-600';
  };

  // Get status badge styling - Updated logic for better differentiation
  const getStatusBadge = () => {
    if (isExternalCourse) {
      // For external courses, show assessment status
      if (assessmentCompleted) {
        return {
          bg: 'bg-gradient-to-r from-green-100 to-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          label: 'Assessment Completed'
        };
      } else if (progress >= 100) {
        // Course learning is complete but assessment not taken
        return {
          bg: 'bg-gradient-to-r from-orange-100 to-orange-200',
          text: 'text-orange-800',
          icon: Target,
          label: 'Assessment Pending'
        };
      } else if (progress > 0) {
        // Course has progress but not complete yet
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-blue-200',
          text: 'text-blue-600',
          icon: Clock,
          label: 'Learning in Progress'
        };
      } else {
        // No progress started
        return {
          bg: 'bg-gradient-to-r from-slate-100 to-slate-200',
          text: 'text-slate-700',
          icon: Clock,
          label: 'Not Started'
        };
      }
    } else {
      // For internal courses (enrollments), use the course completion status
      if (isCompleted) {
        return {
          bg: 'bg-gradient-to-r from-green-100 to-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          label: 'Completed'
        };
      }
      return {
        bg: 'bg-gradient-to-r from-blue-100 to-blue-200',
        text: 'text-blue-600',
        icon: Clock,
        label: 'In Progress'
      };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  // Helper functions for list view (different styling)
  const renderListCertificateButton = () => (
    <button
      onClick={() => window.open(item.certificateUrl, "_blank")}
      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/25"
    >
      <Award className="w-4 h-4" />
      <span>View Certificate</span>
    </button>
  );

  const renderListCompletedStatus = (label = "Completed") => (
    <div className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm bg-gradient-to-r from-green-100 to-green-200 text-green-800">
      <CheckCircle className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );

  const renderListOngoingStatus = () => (
    <div className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600">
      <Clock className="w-4 h-4" />
      <span>Ongoing</span>
    </div>
  );

  const renderListAssessmentButton = () => (
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
      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-300 hover:scale-105"
    >
      <Target className="w-4 h-4" />
      <span>Take Assessment</span>
    </button>
  );

  const renderListContinueButton = () => (
    <button 
      onClick={handleContinue}
      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
    >
      <Play className="w-4 h-4" />
      <span>{progress > 0 ? 'Continue' : 'Start Course'}</span>
    </button>
  );

  const renderListGenericContinueButton = () => (
    <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25">
      <TrendingUp className="w-4 h-4" />
      Continue Learning
    </button>
  );

  // Action button logic for list view
  const renderListActionButton = () => {
    // External courses logic
    if (isExternalCourse && !isCourseEnrollment && !checkingAssessment) {
      if (assessmentCompleted) {
        return item.certificateUrl ? renderListCertificateButton() : renderListCompletedStatus("Assessment Completed");
      }
      if (progress >= 100) {
        return renderListAssessmentButton();
      }
      return renderListOngoingStatus();
    }

    // Internal courses logic
    if (isCompleted) {
      return item.certificateUrl ? renderListCertificateButton() : renderListCompletedStatus("Course Completed");
    }
    
    if (isCourseEnrollment) {
      return renderListContinueButton();
    }
    
    return renderListGenericContinueButton();
  };

  // Helper function to render certificate button
  const renderCertificateButton = () => (
    <button
      onClick={() => window.open(item.certificateUrl, "_blank")}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/25"
    >
      <Award className="w-4 sm:w-5 h-4 sm:h-5" />
      <span className="hidden xs:inline">View Certificate</span>
      <span className="xs:hidden">Certificate</span>
    </button>
  );

  // Helper function to render completed status
  const renderCompletedStatus = (label = "Completed") => (
    <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-green-100 to-green-200 text-green-800">
      <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5" />
      <span className="hidden xs:inline">{label}</span>
      <span className="xs:hidden">Completed</span>
    </div>
  );

  // Helper function to render ongoing status
  const renderOngoingStatus = () => (
    <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600">
      <Clock className="w-4 sm:w-5 h-4 sm:h-5" />
      <span className="hidden xs:inline">Ongoing</span>
      <span className="xs:hidden">Ongoing</span>
    </div>
  );

  // Helper function to render take assessment button
  const renderAssessmentButton = () => (
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
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl sm:rounded-2xl font-semibold text-sm border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-300 hover:scale-105"
    >
      <Target className="w-4 h-4" />
      <span className="hidden xs:inline">Take Assessment</span>
      <span className="xs:hidden">Assessment</span>
    </button>
  );

  // Helper function to render continue/start button
  const renderContinueButton = () => (
    <button 
      onClick={handleContinue}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25"
    >
      <Play className="w-4 sm:w-5 h-4 sm:h-5" />
      <span className="hidden xs:inline">{progress > 0 ? 'Continue Learning' : 'Start Course'}</span>
      <span className="xs:hidden">{progress > 0 ? 'Continue' : 'Start'}</span>
    </button>
  );

  // Helper function to render generic continue button
  const renderGenericContinueButton = () => (
    <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25">
      <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5" />
      <span className="hidden xs:inline">Continue Learning</span>
      <span className="xs:hidden">Continue</span>
    </button>
  );

  // Main function to determine which action button to render
  const renderActionButton = () => {
    // External courses logic
    if (isExternalCourse && !isCourseEnrollment && !checkingAssessment) {
      if (assessmentCompleted) {
        return item.certificateUrl ? renderCertificateButton() : renderCompletedStatus("Assessment Completed");
      }
      if (progress >= 100) {
        return renderAssessmentButton();
      }
      return renderOngoingStatus();
    }

    // Internal courses logic
    if (isCompleted) {
      return item.certificateUrl ? renderCertificateButton() : renderCompletedStatus("Course Completed");
    }
    
    if (isCourseEnrollment) {
      return renderContinueButton();
    }
    
    return renderGenericContinueButton();
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`
          group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm
          transition-all duration-500 ease-out hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1
          overflow-hidden
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top Status Indicator - Blue Color */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div 
            className="h-full w-full transition-all duration-300 bg-blue-500"
          />
        </div>

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Course Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 line-clamp-2 sm:line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {item.course || item.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-1 mb-2">
                    {item.provider || item.organization}
                  </p>
                  
                  {/* Course Type Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`
                      inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold
                      ${statusBadge.bg} ${statusBadge.text}
                    `}>
                      <StatusIcon className="w-3 h-3 mr-1 sm:mr-1.5" />
                      {statusBadge.label}
                    </span>
                    
                    {isCourseEnrollment && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Zap className="w-3 h-3 mr-1" />
                        Platform
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress/Assessment Section */}
              <div className="mb-4">
                {isExternalCourse && assessmentScore !== null ? (
                  /* Assessment Score Display - Professional Design */
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-3 sm:p-4 border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          assessmentScore >= 80 ? 'bg-green-500' : 
                          assessmentScore >= 60 ? 'bg-blue-500' : 
                          'bg-orange-500'
                        }`} />
                        <span className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">
                          Assessment Result
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl sm:text-3xl font-black ${
                          assessmentScore >= 80 ? 'text-green-600' : 
                          assessmentScore >= 60 ? 'text-blue-600' : 
                          'text-orange-600'
                        }`}>
                          {assessmentScore}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">out of 100</div>
                      </div>
                    </div>
                    
                    {/* Performance Indicator */}
                    <div className="mt-3 flex justify-center">
                      <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        assessmentScore >= 80 ? 'bg-green-100 text-green-800' : 
                        assessmentScore >= 60 ? 'bg-blue-100 text-blue-600' : 
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {assessmentScore >= 80 ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                            <span className="hidden xs:inline">Excellent Performance</span>
                            <span className="xs:hidden">Excellent</span>
                          </>
                        ) : assessmentScore >= 60 ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            <span className="hidden xs:inline">Good Performance</span>
                            <span className="xs:hidden">Good</span>
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
                            <span className="hidden xs:inline">Needs Improvement</span>
                            <span className="xs:hidden">Needs Work</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular Progress Display - Enhanced */
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-xs sm:text-sm font-medium text-slate-600">Progress</span>
                      </div>
                      <span className={`text-base sm:text-lg font-bold ${
                        isCompleted ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-slate-500 mb-4">
                {item.totalModules > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4" />
                    <span>{item.completedModules || 0}/{item.totalModules} modules</span>
                  </div>
                )}
                {item.skills && item.skills.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>{item.skills.length} skills</span>
                  </div>
                )}
                {item.duration && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{item.duration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
              {renderListActionButton()}

              {/* Edit Button for External Courses */}
              {isExternalCourse && !isCourseEnrollment && (
                <button
                  onClick={() => onEdit?.(item)}
                  className="p-2.5 sm:p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-105 self-center"
                  title="Edit Course"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default) - Completely Redesigned
  return (
    <div
      className={`
        group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm
        transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2
        ${isHovered ? "shadow-2xl shadow-blue-500/10 -translate-y-2" : ""}
        flex flex-col h-full
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Top Status Indicator - Blue Color */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
        <div 
          className="h-full w-full transition-all duration-300 bg-blue-500"
        />
      </div>
      
      <div className="relative p-4 sm:p-6 flex flex-col flex-1">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          {/* Status Badge Only */}
          <span className={`
            inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold
            ${statusBadge.bg} ${statusBadge.text}
          `}>
            <StatusIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-1.5" />
            {statusBadge.label}
          </span>
          
          {/* Course Type & Edit Button */}
          <div className="flex items-center gap-2">
            {isCourseEnrollment && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Zap className="w-3 h-3 mr-1" />
                Platform
              </span>
            )}

            {/* Edit Button - Only for external courses */}
            {isExternalCourse && !isCourseEnrollment && (
              <button
                onClick={() => onEdit?.(item)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105"
                title="Edit Course"
              >
                <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Course Title & Provider */}
        <div className="mb-4 sm:mb-5">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.course || item.title}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-1 flex items-center gap-1.5">
            <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400" />
            {item.provider || item.organization}
          </p>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {item.totalModules > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
              <ListChecks className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400" />
              <div>
                <div className="font-semibold text-sm sm:text-base">{item.totalModules}</div>
                <div className="text-xs text-slate-500">{isCourseEnrollment ? 'lessons' : 'modules'}</div>
              </div>
            </div>
          )}
          
          {item.skills && item.skills.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
              <Briefcase className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400" />
              <div>
                <div className="font-semibold text-sm sm:text-base">{item.skills.length}</div>
                <div className="text-xs text-slate-500">skills</div>
              </div>
            </div>
          )}
          
          {item.duration && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 col-span-2">
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400" />
              <div>
                <div className="font-semibold text-sm sm:text-base">{item.duration}</div>
                <div className="text-xs text-slate-500">duration</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress/Assessment Section */}
        <div className="mb-4 sm:mb-6 flex-1">
          {isExternalCourse && assessmentScore !== null ? (
            /* Assessment Score Display - Professional Design */
            <div className="relative">
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl sm:rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${
                    assessmentScore >= 80 ? 'bg-green-500' : 
                    assessmentScore >= 60 ? 'bg-blue-500' : 
                    'bg-orange-500'
                  }`} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Assessment Result
                  </span>
                </div>
                
                <div className="relative">
                  <div className={`text-4xl sm:text-5xl font-black mb-2 ${
                    assessmentScore >= 80 ? 'text-green-600' : 
                    assessmentScore >= 60 ? 'text-blue-600' : 
                    'text-orange-600'
                  }`}>
                    {assessmentScore}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <div className="h-px bg-slate-300 flex-1 max-w-6 sm:max-w-8" />
                    <span className="text-xs font-medium">out of 100</span>
                    <div className="h-px bg-slate-300 flex-1 max-w-6 sm:max-w-8" />
                  </div>
                </div>
                
                {/* Performance Indicator */}
                <div className="mt-3 sm:mt-4">
                  <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                    assessmentScore >= 80 ? 'bg-green-100 text-green-800' : 
                    assessmentScore >= 60 ? 'bg-blue-100 text-blue-600' : 
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {assessmentScore >= 80 ? (
                      <>
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                        <span className="hidden xs:inline">Excellent Performance</span>
                        <span className="xs:hidden">Excellent</span>
                      </>
                    ) : assessmentScore >= 60 ? (
                      <>
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        <span className="hidden xs:inline">Good Performance</span>
                        <span className="xs:hidden">Good</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
                        <span className="hidden xs:inline">Needs Improvement</span>
                        <span className="xs:hidden">Needs Work</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Regular Progress Display - Enhanced */
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Learning Progress
                  </span>
                </div>
                <span className={`text-xl sm:text-2xl font-bold ${
                  isCompleted ? "text-green-600" : "text-blue-600"
                }`}>
                  {progress}%
                </span>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="relative">
                <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-1000 ease-out relative`}
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                  </div>
                </div>
                
                {/* Progress Milestones */}
                <div className="flex justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      (item.completedModules || 0) > 0 ? 'bg-blue-500' : 'bg-slate-300'
                    }`} />
                    <span className="text-xs text-slate-500 font-medium">
                      {item.completedModules || 0} completed
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">
                      {item.totalModules || 0} total
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Always at Bottom */}
        <div className="space-y-2 sm:space-y-3 mt-auto">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default ModernLearningCard;