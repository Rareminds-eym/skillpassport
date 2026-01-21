/**
 * Database Type Definitions
 * Type-safe interfaces for school_educators and schools tables
 *
 * These types map to the actual database schema and should be kept in sync.
 */

/**
 * school_educators table - Complete schema
 * Only necessary fields are used in the application
 */
export interface SchoolEducatorRow {
  // Primary identifiers
  id: string;
  user_id: string;
  school_id: string;

  // Personal information (used for AI context)
  first_name: string | null;
  last_name: string | null;
  email: string | null;

  // Professional information (used for AI context)
  designation: string | null; // e.g., "Senior Lecturer", "Professor"
  department: string | null; // e.g., "Computer Science", "Mathematics"
  specialization: string | null; // e.g., "Data Science", "Web Development"
  qualification: string | null; // e.g., "Ph.D. in Computer Science"
  experience_years: number | null; // Years of teaching experience
  subjects_handled: string[] | null; // Array of subjects taught

  // Account management
  account_status: string | null; // 'active' | 'deactivated' | 'suspended'

  // Fields NOT used in AI context (privacy & relevance)
  employee_id?: string | null; // Internal HR identifier
  date_of_joining?: Date | null; // Employment start date
  phone_number?: string | null; // Private contact
  dob?: Date | null; // Personal info
  gender?: string | null; // Personal info
  address?: string | null; // Private location
  city?: string | null; // Private location
  state?: string | null; // Private location
  country?: string | null; // Private location
  pincode?: string | null; // Private location
  resume_url?: string | null; // Sensitive document
  id_proof_url?: string | null; // Sensitive document
  photo_url?: string | null; // Profile image
  verification_status?: string | null; // Internal workflow
  verified_by?: string | null; // Internal workflow
  verified_at?: Date | null; // Internal workflow
  metadata?: Record<string, any> | null; // Generic JSONB field
  created_at?: Date | null; // Audit field
  updated_at?: Date | null; // Audit field
}

/**
 * schools table - Complete schema
 * Only necessary fields are used in the application
 */
export interface SchoolRow {
  // Primary identifier
  id: string;
  name: string;
  code: string;

  // Location information (used for AI context)
  city: string | null;
  state: string | null;
  board: string | null; // e.g., "CBSE", "ICSE", "State Board"

  // Fields NOT used in AI context
  address?: string | null;
  country?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  established_year?: number | null;
  principal_name?: string | null;
  principal_email?: string | null;
  principal_phone?: string | null;
  account_status?: string | null;
  approval_status?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  created_by?: string | null;
  updated_by?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Joined educator profile with school details
 * Used by buildEducatorContext function
 */
export interface EducatorWithSchool {
  // Educator fields
  id: string;
  user_id: string;
  school_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  designation: string | null;
  department: string | null;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  subjects_handled: string[] | null;
  account_status: string | null;

  // Nested school details
  schools: {
    id: string;
    name: string;
    code: string;
    city: string | null;
    state: string | null;
    board: string | null;
  };
}

/**
 * Type guard to check if educator has complete profile
 */
export function hasCompleteProfile(educator: SchoolEducatorRow): boolean {
  return !!(
    educator.first_name &&
    educator.last_name &&
    educator.department &&
    educator.subjects_handled &&
    educator.subjects_handled.length > 0
  );
}

/**
 * Helper to get full name from educator record
 */
export function getEducatorFullName(educator: SchoolEducatorRow): string {
  const parts = [educator.first_name, educator.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Educator';
}

/**
 * Helper to get school location string
 */
export function getSchoolLocation(school: SchoolRow): string {
  const parts = [school.city, school.state].filter(Boolean);
  return parts.join(', ');
}

/**
 * Account status enum for type safety
 */
export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * Educational boards enum
 */
export enum EducationalBoard {
  CBSE = 'CBSE',
  ICSE = 'ICSE',
  STATE_BOARD = 'State Board',
  IB = 'IB',
  IGCSE = 'IGCSE',
}

/**
 * Common designations for educators
 */
export enum EducatorDesignation {
  TEACHER = 'Teacher',
  SENIOR_TEACHER = 'Senior Teacher',
  LECTURER = 'Lecturer',
  SENIOR_LECTURER = 'Senior Lecturer',
  ASSISTANT_PROFESSOR = 'Assistant Professor',
  ASSOCIATE_PROFESSOR = 'Associate Professor',
  PROFESSOR = 'Professor',
  HEAD_OF_DEPARTMENT = 'Head of Department',
  PRINCIPAL = 'Principal',
  VICE_PRINCIPAL = 'Vice Principal',
}
