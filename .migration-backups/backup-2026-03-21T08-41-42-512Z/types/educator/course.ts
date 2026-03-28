export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  thumbnail?: string;
  status: 'Active' | 'Draft' | 'Upcoming' | 'Archived';
  skillsCovered: string[];
  skillsMapped: number;
  totalSkills: number;
  enrollmentCount: number;
  completionRate: number;
  evidencePending: number;
  linkedClasses: string[];
  modules: CourseModule[];
  targetOutcomes: string[];
  duration: string;
  createdAt: string;
  updatedAt: string;
  coEducators?: string[];
}

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

export interface CourseAnalytics {
  skillProgressionHeatmap: SkillProgress[];
  completionRate: number;
  evidenceSubmissionRate: number;
  averageGrade: number;
  enrolledStudents: number;
}

export interface SkillProgress {
  skillName: string;
  studentProgress: {
    studentId: string;
    studentName: string;
    proficiencyLevel: number;
  }[];
}

// Upload types
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
