export interface Student {
  id: string;
  universityId: string;
  profile: StudentProfile;
  createdAt: string;
  updatedAt: string;
  email: string;
  name: string | null;
  age: number | null;
  date_of_birth: string | null;
  contact_number: string | null;
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
  portfolio_link: string | null;
  other_social_links: SocialLink[];
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  
  // Academic fields
  semester?: number;
  current_semester?: string;

  // Additional fields for school students
  student_type?: string;
  student_id?: string;
  school?: {
    id: string;
    name: string;
    code?: string;
    city?: string;
    state?: string;
  };
  grade?: string;
  section?: string;

  // Location fields
  city?: string;
  state?: string;
  country?: string;

  // University relationship
  universityInfo?: {
    id: string;
    name: string;
    code?: string;
    state?: string;
  };

  // Portfolio fields
  hobbies?: string[];
  languages?: Language[];
  interests?: string[];
  
  // Additional database fields
  school_id?: string;
  college_id?: string;
  enrollmentDate?: string;
  expectedGraduationDate?: string;
  admission_academic_year?: string; // Academic year when student was admitted (e.g., "2024-25")
  currentCgpa?: number | string;
  metadata?: Record<string, any>;
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