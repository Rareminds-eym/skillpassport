export interface Student {
  id: string;
  universityId?: string;
  profile?: StudentProfile;
  createdAt?: string;
  updatedAt?: string;
  email: string;
  name: string | null;
  age: number | null;
  date_of_birth: string | null;
  contact_number: string | null;
  contactNumber?: string;
  phone?: string;
  alternate_number: string | null;
  district_name: string | null;
  university: string | null;
  branch_field: string | null;
  college_school_name: string | null;
  registration_number: string | null;
  github_link: string | null;
  linkedin_link: string | null;
  twitter_link: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  youtube_link?: string;
  portfolio_link: string | null;
  other_social_links: SocialLink[] | any[];
  approval_status: 'pending' | 'approved' | 'rejected' | 'verified' | 'waitlisted';
  admission_status?: 'pending' | 'approved' | 'rejected' | 'verified' | 'waitlisted';
  created_at: string;
  updated_at: string;

  // School-specific fields
  school_id?: string;
  school_name?: string;
  grade?: string;
  section?: string;
  roll_number?: string;
  admission_number?: string;
  subjects?: string[];
  school_class_id?: string;

  // College/University-specific fields
  college_id?: string;
  college?: string;
  dept?: string;
  enrollment_number?: string;
  currentCgpa?: number | string;
  current_semester?: string;
  semester?: number;
  enrollmentDate?: string;
  expectedGraduationDate?: string;
  admission_academic_year?: string;

  // Guardian info (school students)
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;

  // Common fields
  gender?: string;
  category?: string;
  quota?: string;
  bloodGroup?: string;
  student_id?: string;
  student_type?: string;

  // Address info
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Additional fields
  hobbies?: string[];
  interests?: string[];
  languages?: Array<{ name: string; proficiency?: string } | string> | Language[];
  bio?: string;
  skill_summary?: string;
  user_id?: string;

  // Projects and Certificates
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
  } | Record<string, any>;

  // Timestamps
  applied_date?: string;

  // Academic fields
  school?: {
    id: string;
    name: string;
    code?: string;
    city?: string;
    state?: string;
  };

  // University relationship
  universityInfo?: {
    id: string;
    name: string;
    code?: string;
    state?: string;
  };
}

export interface StudentProfile {
  email?: string;
  name?: string;
  passportId?: string;
  profileImage?: string;
  bio?: string;
  skills?: Skill[];
  technicalSkills?: TechnicalSkill[];
  projects?: Project[];
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  languages?: Language[];
  hobbies?: string[];
  interests?: string[];
  achievements?: Achievement[];
  training?: Training[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: string;
}

export interface TechnicalSkill {
  name: string;
  level: number; // 1-10
  category: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  role?: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies?: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  image?: string;
}

export interface Language {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category?: string;
}

export interface Training {
  id: string;
  name: string;
  provider: string;
  completionDate: string;
  skills: string[];
}

export type PortfolioLayout = 'modern' | 'classic' | 'creative' | 'minimal' | 'splitscreen' | 'aipersona' | 'infographic' | 'resume' | 'journey';

export type AnimationType = 'fade' | 'slide' | 'bounce' | 'float' | 'none';

export interface DisplayPreferences {
  showSocialLinks: boolean;
  showSkillBars: boolean;
  showProjectImages: boolean;
  enableAnimations: boolean;
  showContactForm: boolean;
  showDownloadResume: boolean;
}

export interface PortfolioSettings {
  layout: PortfolioLayout;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animation: AnimationType;
  fontSize: number;
  profileImage?: string;
  displayPreferences?: DisplayPreferences;
}

// Certificate types
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

// Course types (extended from educator/course.ts)
export interface CourseExtended {
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

// Assessment types
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

// Curriculum types
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

// Admission types
export interface AdmissionNote {
  id: string;
  admin: string;
  date: string;
  note: string;
}

// StudentProfileDrawer types
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
