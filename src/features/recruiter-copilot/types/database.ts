/**
 * Database Type Definitions for Recruiters
 * Type-safe interfaces for recruiters and related tables
 * 
 * These types map to the actual database schema and should be kept in sync.
 */

/**
 * recruiters table - Complete schema
 * Only necessary fields are used in the application
 */
export interface RecruiterRow {
  // Primary identifiers
  id: string;
  user_id: string;
  company_id?: string;
  
  // Personal information (used for AI context)
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  
  // Professional information (used for AI context)
  designation: string | null;           // e.g., "Senior Recruiter", "Talent Acquisition Manager"
  department: string | null;            // e.g., "Engineering", "Sales", "Operations"
  specialization: string[] | null;      // e.g., ["Tech Hiring", "Campus Recruitment"]
  experience_years: number | null;      // Years of recruitment experience
  
  // Account management
  account_status: string | null;        // 'active' | 'inactive' | 'suspended'
  
  // Fields NOT used in AI context (privacy & relevance)
  employee_id?: string | null;          // Internal HR identifier
  phone_number?: string | null;         // Private contact
  dob?: Date | null;                    // Personal info
  gender?: string | null;               // Personal info
  address?: string | null;              // Private location
  city?: string | null;                 // Private location
  state?: string | null;                // Private location
  country?: string | null;              // Private location
  pincode?: string | null;              // Private location
  photo_url?: string | null;            // Profile image
  verification_status?: string | null;  // Internal workflow
  verified_by?: string | null;          // Internal workflow
  verified_at?: Date | null;            // Internal workflow
  metadata?: Record<string, any> | null; // Generic JSONB field
  created_at?: Date | null;             // Audit field
  updated_at?: Date | null;             // Audit field
}

/**
 * companies table - Complete schema
 * Only necessary fields are used in the application
 */
export interface CompanyRow {
  // Primary identifier
  id: string;
  name: string;
  code: string;
  
  // Company information (used for AI context)
  industry: string | null;              // e.g., "Technology", "Finance", "Healthcare"
  size: string | null;                  // e.g., "1-50", "51-200", "201-500", "500+"
  description: string | null;           // Brief company description
  
  // Location information (used for AI context)
  city: string | null;
  state: string | null;
  country: string | null;
  
  // Fields NOT used in AI context
  address?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  founded_year?: number | null;
  ceo_name?: string | null;
  account_status?: string | null;
  approval_status?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  created_by?: string | null;
  updated_by?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * job_postings table - Schema
 */
export interface JobPostingRow {
  id: string;
  recruiter_id: string;
  company_id: string;
  title: string;
  description: string | null;
  department: string | null;
  location: string;
  job_type: 'full-time' | 'part-time' | 'internship' | 'contract';
  experience_required: string | null;   // e.g., "0-2 years", "2-5 years"
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  salary_range?: string | null;
  status: 'active' | 'closed' | 'draft';
  posted_date: Date | null;
  closing_date?: Date | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  metadata?: Record<string, any> | null;
}

/**
 * Joined recruiter profile with company details
 * Used by buildRecruiterContext function
 */
export interface RecruiterWithCompany {
  // Recruiter fields
  id: string;
  user_id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  designation: string | null;
  department: string | null;
  specialization: string[] | null;
  experience_years: number | null;
  account_status: string | null;
  
  // Nested company details
  companies?: {
    id: string;
    name: string;
    code: string;
    industry: string | null;
    size: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
}

/**
 * Type guard to check if recruiter has complete profile
 */
export function hasCompleteProfile(recruiter: RecruiterRow): boolean {
  return !!(
    recruiter.first_name &&
    recruiter.last_name &&
    recruiter.department &&
    recruiter.specialization &&
    recruiter.specialization.length > 0
  );
}

/**
 * Helper to get full name from recruiter record
 */
export function getRecruiterFullName(recruiter: RecruiterRow): string {
  const parts = [recruiter.first_name, recruiter.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Recruiter';
}

/**
 * Helper to get company location string
 */
export function getCompanyLocation(company: CompanyRow): string {
  const parts = [company.city, company.state, company.country].filter(Boolean);
  return parts.join(', ');
}

/**
 * Account status enum for type safety
 */
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

/**
 * Industry sectors enum
 */
export enum IndustrySector {
  TECHNOLOGY = 'Technology',
  FINANCE = 'Finance',
  HEALTHCARE = 'Healthcare',
  EDUCATION = 'Education',
  MANUFACTURING = 'Manufacturing',
  RETAIL = 'Retail',
  CONSULTING = 'Consulting',
  MEDIA = 'Media & Entertainment',
  GOVERNMENT = 'Government',
  OTHER = 'Other'
}

/**
 * Common designations for recruiters
 */
export enum RecruiterDesignation {
  RECRUITER = 'Recruiter',
  SENIOR_RECRUITER = 'Senior Recruiter',
  TALENT_ACQUISITION_SPECIALIST = 'Talent Acquisition Specialist',
  TALENT_ACQUISITION_MANAGER = 'Talent Acquisition Manager',
  HEAD_OF_TALENT = 'Head of Talent Acquisition',
  HR_MANAGER = 'HR Manager',
  HR_DIRECTOR = 'HR Director',
  HIRING_MANAGER = 'Hiring Manager',
  CAMPUS_RECRUITER = 'Campus Recruiter'
}

/**
 * Job posting status enum
 */
export enum JobPostingStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

/**
 * Job type enum
 */
export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract'
}
