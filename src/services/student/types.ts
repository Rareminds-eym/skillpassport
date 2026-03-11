/**
 * Student Service Types
 * Centralized type definitions for student data operations
 */

// ==================== CORE TYPES ====================

export interface Student {
  id: string; // UUID - primary key
  user_id: string | null; // UUID - links to auth.users
  email: string;
  name: string | null;
  
  // Personal Info
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  bio: string | null;
  
  // Contact
  contact_number: string | null;
  contact_dial_code: string | null;
  alternate_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  district_name: string | null;
  
  // Guardian Info
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_relation: string | null;
  
  // Academic Info
  student_type: string | null;
  grade: string | null;
  section: string | null;
  roll_number: string | null;
  admission_number: string | null;
  enrollment_number: string | null;
  registration_number: string | null;
  semester: number | null;
  current_cgpa: number | null;
  
  // Institutional Links
  school_id: string | null;
  school_class_id: string | null;
  college_id: string | null;
  college_class_id: string | null;
  university_id: string | null;
  university_college_id: string | null;
  program_id: string | null;
  program_section_id: string | null;
  course_name: string | null;
  branch_field: string | null;
  university: string | null;
  university_main: string | null;
  college_school_name: string | null;
  
  // Dates
  enrollment_date: string | null;
  expected_graduation_date: string | null;
  grade_start_date: string | null;
  admission_academic_year: string | null;
  
  // Gap Year Info
  gap_in_studies: boolean | null;
  gap_years: number | null;
  gap_reason: string | null;
  work_experience: string | null;
  
  // Academic Status
  current_backlogs: number | null;
  backlogs_history: string | null;
  
  // Social Links
  github_link: string | null;
  linkedin_link: string | null;
  twitter_link: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  youtube_link: string | null;
  portfolio_link: string | null;
  other_social_links: any[] | null;
  
  // Files & Media
  resume_url: string | null;
  profile_picture: string | null;
  documents: any[] | null;
  
  // Metadata
  hobbies: any[] | null;
  languages: any[] | null;
  interests: any[] | null;
  category: string | null;
  quota: string | null;
  skill_summary: string | null;
  notification_settings: any | null;
  metadata: any | null;
  
  // System Fields
  approval_status: string | null;
  is_deleted: boolean | null;
  deleted_at: string | null;
  deleted_by: string | null;
  tour_progress: any | null;
  embedding: any | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  imported_at: string | null;
  resume_imported_at: string | null;
}

// ==================== RELATED ENTITY TYPES ====================

export interface Education {
  id: string;
  student_id: string;
  level: string | null;
  degree: string | null;
  department: string | null;
  university: string | null;
  year_of_passing: string | null;
  cgpa: string | null;
  status: string | null;
  approval_status: string | null;
  enabled: boolean | null;
  has_pending_edit: boolean | null;
  pending_edit_data: any | null;
  verified_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  student_id: string;
  organization: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: string | null;
  description: string | null;
  verified: boolean | null;
  approval_status: string | null;
  approval_authority: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  approval_notes: string | null;
  enabled: boolean | null;
  has_pending_edit: boolean | null;
  pending_edit_data: any | null;
  verified_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  student_id: string;
  name: string;
  type: string | null;
  level: number | null;
  description: string | null;
  proficiency_level: string | null;
  verified: boolean | null;
  enabled: boolean | null;
  approval_status: string | null;
  training_id: string | null;
  has_pending_edit: boolean | null;
  pending_edit_data: any | null;
  verified_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: string | null;
  tech_stack: string[] | null;
  demo_link: string | null;
  github_link: string | null;
  certificate_url: string | null;
  video_url: string | null;
  ppt_url: string | null;
  organization: string | null;
  role: string | null;
  approval_status: string | null;
  approval_authority: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  approval_notes: string | null;
  enabled: boolean | null;
  has_pending_edit: boolean | null;
  pending_edit_data: any | null;
  verified_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  title: string;
  issuer: string | null;
  level: string | null;
  credential_id: string | null;
  link: string | null;
  issued_on: string | null;
  expiry_date: string | null;
  description: string | null;
  status: string | null;
  approval_status: string | null;
  upload: string | null;
  document_url: string | null;
  training_id: string | null;
  platform: string | null;
  instructor: string | null;
  category: string | null;
  enabled: boolean | null;
  has_pending_edit: boolean | null;
  pending_edit_data: any | null;
  verified_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Training {
  id: string;
  student_id: string;
  title: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: string | null;
  description: string | null;
  status: string | null;
  completed_modules: number | null;
  total_modules: number | null;
  hours_spent: number | null;
  course_id: string | null;
  source: string | null;
  approval_status: string | null;
  approval_authority: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  enabled: boolean | null;
  has_pending_edit: boolean | null;
  pending_edit_data: any | null;
  verified_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  certificate_name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== AGGREGATE TYPE ====================

export interface StudentProfile extends Student {
  education?: Education[];
  experience?: Experience[];
  skills?: Skill[];
  projects?: Project[];
  trainings?: Training[];
  certificates?: Certificate[];
}

// ==================== SERVICE RESPONSE TYPES ====================

export interface ServiceResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== INPUT TYPES ====================

export interface CreateStudentInput {
  user_id: string;
  email: string;
  name?: string;
  student_type?: string;
  school_id?: string;
  college_id?: string;
  contact_number?: string;
  date_of_birth?: string;
  [key: string]: any;
}

export interface UpdateStudentInput {
  name?: string;
  date_of_birth?: string;
  contact_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  github_link?: string;
  linkedin_link?: string;
  portfolio_link?: string;
  [key: string]: any;
}

export interface CreateEducationInput {
  student_id: string;
  institution_name?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  is_current?: boolean;
}

export interface CreateExperienceInput {
  student_id: string;
  company_name?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_current?: boolean;
  location?: string;
}

export interface CreateSkillInput {
  student_id: string;
  skill_name?: string;
  skill_type?: 'technical' | 'soft';
  proficiency_level?: string;
  years_of_experience?: number;
}

export interface CreateProjectInput {
  student_id: string;
  title?: string;
  description?: string;
  technologies?: any[];
  start_date?: string;
  end_date?: string;
  project_url?: string;
  github_url?: string;
  image_url?: string;
  is_featured?: boolean;
}

export interface CreateTrainingInput {
  student_id: string;
  title: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  description?: string;
  status?: string;
  completed_modules?: number;
  total_modules?: number;
  hours_spent?: number;
  course_id?: string;
  source?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_authority?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  approval_notes?: string;
  enabled?: boolean;
  has_pending_edit?: boolean;
  pending_edit_data?: any;
  verified_data?: any;
}

export interface CreateCertificateInput {
  student_id: string;
  certificate_name?: string;
  issuing_organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  description?: string;
}
