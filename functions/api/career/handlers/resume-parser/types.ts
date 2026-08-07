/**
 * Shared types for the deterministic (script-based) resume parser.
 *
 * ParsedResumeData mirrors the schema the AI prompt in parse-resume.ts used to
 * produce (see the JSON structure in the prompt template), so downstream code
 * (mergeResumeData, normalizeResumeDataForSettings, /resume/save) needs no changes.
 */

export interface EducationEntry {
  id: number;
  degree: string;
  department: string;
  university: string;
  yearOfPassing: string;
  cgpa: string;
  level: string;
  status: string;
}

export interface ExperienceEntry {
  id: number;
  organization: string;
  role: string;
  duration: string;
  description: string;
  verified: boolean;
}

export interface ProjectEntry {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  link: string;
  status: string;
}

export interface TechnicalSkillEntry {
  id: number;
  name: string;
  category: string;
  level: number;
  verified: boolean;
}

export interface SoftSkillEntry {
  id: number;
  name: string;
  level: number;
}

export interface CertificateEntry {
  id: number;
  title: string;
  issuer: string;
  issuedOn: string;
  credentialId: string;
  link: string;
}

export interface ParsedResumeData {
  name: string;
  email: string;
  contact_number: string;
  alternate_number: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  college_school_name: string;
  university: string;
  branch_field: string;
  registration_number: string;
  bio: string;
  linkedin_link: string;
  github_link: string;
  portfolio_link: string;
  twitter_link: string;
  facebook_link: string;
  instagram_link: string;
  interests: string[];
  languages: string[];
  hobbies: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  technicalSkills: TechnicalSkillEntry[];
  softSkills: SoftSkillEntry[];
  certificates: CertificateEntry[];
  training: Array<Record<string, unknown>>;
}
