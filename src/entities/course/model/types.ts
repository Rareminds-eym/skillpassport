/**
 * Course Entity - Type Definitions
 * Core course interfaces and types for the application
 */

// ============================================================================
// Core Course Types
// ============================================================================

export interface Course {
  id: string;
  title: string;
  code?: string;
  description: string;
  thumbnail?: string;
  icon?: React.ElementType;
  courseId?: number;
  status?: 'Active' | 'Draft' | 'Upcoming' | 'Archived' | 'Inactive' | 'Pending';
  skillsCovered?: string[];
  skillsMapped?: number;
  totalSkills?: number;
  enrollmentCount?: number;
  completionRate?: number;
  evidencePending?: number;
  linkedClasses?: string[];
  modules?: CourseModule[];
  targetOutcomes?: string[];
  duration?: string;
  createdAt?: string;
  updatedAt?: string;
  coEducators?: string[];
  college_id?: string;
  course_name?: string;
  category?: string;
  skillType?: string;
}

// ============================================================================
// Course Module Types
// ============================================================================

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  skillTags: string[];
  lessons: Lesson[];
  activities: string[];
  order: number;
  isExpanded?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  content: string; // Rich text HTML content
  description?: string;
  resources: Resource[];
  duration: string;
  order: number;
}

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'image' | 'document' | 'link' | 'youtube' | 'drive';
  url: string;
  size?: string;
  uploadProgress?: number;
  thumbnailUrl?: string;
  embedUrl?: string; // For YouTube/Vimeo
}

// ============================================================================
// Course Analytics Types
// ============================================================================

export interface CourseAnalytics {
  skillProgressionHeatmap: SkillProgress[];
  completionRate: number;
  evidenceSubmissionRate?: number;
  averageGrade?: number;
  enrolledLearners?: number;
}

export interface SkillProgress {
  skillName: string;
  learnerProgress: {
    learnerId: string;
    learnerName: string;
    proficiencyLevel: number;
  }[];
}

export interface CoursePerformance {
  name: string;
  totalCandidates: number;
  avgScore?: number;
  completionRate?: number;
}

// ============================================================================
// Course Progress Types
// ============================================================================

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessedAt?: string;
}

export interface CourseEnrollmentProgress {
  courseId: string;
  title: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
}

// ============================================================================
// Course Enrollment Types
// ============================================================================

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  progress?: number;
  completedAt?: string;
}

// ============================================================================
// Course Mapping Types
// ============================================================================

export interface CourseMapping {
  id: string;
  course_id: string;
  program_id: string;
  semester?: number;
  isCore?: boolean;
  credits?: number;
}

// ============================================================================
// Course Recommendation Types
// ============================================================================

export interface CourseRecommendation {
  courseId: string;
  title: string;
  description?: string;
  relevanceScore: number;
  matchReason?: string;
  skillsMatched?: string[];
}

export interface CourseForMatching {
  id: string;
  title: string;
  description: string;
  skills?: string[];
  category?: string;
}

export interface CourseMatchingResult {
  matchedCourseIds: string[];
  reasoning: string;
  confidence?: number;
}

// ============================================================================
// Course Context Types
// ============================================================================

export interface CourseContext {
  enrolledCourses: CourseEnrollment[];
  availableCourses: AvailableCourse[];
  recommendedCourses?: CourseRecommendation[];
  completedCourses?: Course[];
}

export interface AvailableCourse {
  id: string;
  title: string;
  description: string;
  category?: string;
  duration?: string;
  skillsCovered?: string[];
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedData?: {
    key: string;
    url: string;
    name: string;
    size: number;
    type: string;
  };
}

// ============================================================================
// Course Filters
// ============================================================================

export interface CourseFilters {
  category?: string;
  skillType?: string;
  status?: string;
  search?: string;
}
