// Types for StudentProfileDrawer
export interface Student {
  id: string;
  name: string;
  email: string;
  contact_number?: string;
  contactNumber?: string;
  phone?: string;
  
  // School-specific fields
  school_id?: string;
  school_name?: string; // Add this field
  grade?: string;
  section?: string;
  roll_number?: string;
  admission_number?: string;
  college_school_name?: string;
  subjects?: string[];
  school_class_id?: string;
  
  // College/University-specific fields
  college_id?: string;
  college?: string;
  university?: string;
  branch_field?: string;
  dept?: string;
  enrollment_number?: string;
  registration_number?: string;
  currentCgpa?: string;
  current_semester?: string;
  enrollmentDate?: string;
  expectedGraduationDate?: string;
  
  // Common fields
  approval_status?: 'pending' | 'approved' | 'rejected' | 'verified' | 'waitlisted';
  admission_status?: 'pending' | 'approved' | 'rejected' | 'verified' | 'waitlisted';
  date_of_birth?: string;
  age?: number;
  gender?: string;
  category?: string;
  quota?: string;
  district_name?: string;
  bloodGroup?: string;
  student_id?: string;
  student_type?: string;
  
  // Guardian info (school students)
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  
  // Address info
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  
  // Social Links
  linkedin_link?: string;
  github_link?: string;
  twitter_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  youtube_link?: string;
  portfolio_link?: string;
  other_social_links?: any[];
  
  // Additional fields
  hobbies?: string[];
  interests?: string[];
  languages?: Array<{ name: string; proficiency?: string } | string>;
  bio?: string;
  skill_summary?: string;
  user_id?: string;
  
  // Profile data (college/university students)
  profile?: {
    name?: string;
    email?: string;
    contact_number?: string;
    age?: number;
    bio?: string;
    university?: string;
    linkedin_link?: string;
    education?: Array<{
      id?: string;
      degree: string;
      level?: string;
      university?: string;
      cgpa: string;
      department?: string;
      yearOfPassing?: string;
      status?: string;
    }>;
    technicalSkills?: Array<{
      id?: string;
      name: string;
      level?: number;
      enabled?: boolean;
    }>;
    softSkills?: Array<{
      id?: string;
      name: string;
      level?: number;
      enabled?: boolean;
    }>;
  };
  
  // Projects and Certificates (can be stored directly on student or in separate tables)
  projects?: Project[];
  certificates?: Certificate[];
  
  // Metadata
  metadata?: {
    graduation_date?: string;
    approval_reason?: string;
    approval_date?: string;
    school_graduation_date?: string;
    college_enrollment_date?: string;
    transition_status?: 'school_active' | 'school_graduated' | 'college_applicant' | 'college_enrolled';
    [key: string]: any;
  };
  
  // Timestamps
  applied_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  organization?: string;
  status?: string;
  approval_status?: string;
  tech_stack?: string[];
  demo_link?: string;
  github_link?: string;
  start_date?: string;
  end_date?: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer?: string;
  level?: string;
  issued_on?: string;
  credential_id?: string;
  link?: string;
  description?: string;
  approval_status?: string;
}

export interface Course {
  id: string;
  title: string;
  organization?: string;
  description?: string;
  status?: string;
  approval_status?: string;
  progress?: number;
  completed_modules?: number;
  total_modules?: number;
  hours_spent?: number;
  start_date?: string;
  end_date?: string;
  duration?: string;
  course_id?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  course_details?: any;
  enrolled_at?: string;
  last_accessed?: string;
  completed_lessons?: string[];
  total_lessons?: number;
  enrollment_status?: string;
  skills_acquired?: string[];
  certificate_url?: string;
  grade?: string;
}

export interface AssessmentResult {
  id: string;
  student_id: string;
  assessment_type?: string;
  score?: number;
  total_score?: number;
  percentage?: number;
  status?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CurriculumData {
  id: string;
  subject: string;
  academic_year: string;
  class: string;
  status: string;
  school_id?: string;
  curriculum_chapters?: Array<{
    id: string;
    name: string;
    curriculum_id: string;
    curriculum_learning_outcomes?: any[];
  }>;
  lessonCount?: number;
}

export interface LessonPlan {
  id: string;
  title: string;
  class_name: string;
  status: string;
  date?: string;
  chapter_id?: string;
  curriculum_chapters?: {
    id: string;
    name: string;
    curriculum_id: string;
    curriculums: {
      id: string;
      school_id: string;
      subject: string;
      academic_year: string;
    };
  };
}

export interface AdmissionNote {
  id: string;
  admin: string;
  date: string;
  note: string;
}

export interface StudentProfileDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'school_admin' | 'college_admin' | 'university_admin' | 'educator' | 'school_educator' | 'college_educator';
  schoolId?: string;
  collegeId?: string;
  defaultTab?: string;
}

export interface TabConfig {
  key: string;
  label: string;
  shortLabel?: string;
  visible?: boolean;
}

export interface ActionConfig {
  showApproval?: boolean;
  showPromotion?: boolean;
  showGraduation?: boolean;
  showNotes?: boolean;
  showExport?: boolean;
  showMessage?: boolean;
}
