/**
 * User Entity - Type Definitions
 * Core user interfaces and types for the application
 */

// ============================================================================
// Core User Types
// ============================================================================

export type UserRole = 
  | 'student' 
  | 'recruiter' 
  | 'educator' 
  | 'school_admin' 
  | 'college_admin' 
  | 'university_admin'
  | 'school_student'
  | 'college_student'
  | 'school_educator'
  | 'college_educator'
  | 'admin'
  | 'learner'
  | 'hr'
  | 'principal'
  | 'vice_principal'
  | 'it_admin'
  | 'class_teacher'
  | 'subject_teacher';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  user_metadata?: any;
  isDemoMode?: boolean;
  nmId?: string;
  teamname?: string;
  isActive?: boolean;
  organizationId?: string | null;
  phone?: string | null;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// User Profile Types
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  blood_group?: string;
  nationality?: string;
  phone_primary?: string;
  phone_secondary?: string;
  updatedAt: string;
  last_activity_at?: string;
}

export interface UserProfileExtended {
  id: string;
  user_id: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  nationality?: string;
  phone_primary?: string;
  phone_secondary?: string;
  email_secondary?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  current_address?: string;
  current_city?: string;
  current_state?: string;
  current_country?: string;
  current_pincode?: string;
  designation?: string;
  department?: string;
  employee_id?: string;
  date_of_joining?: string;
  years_of_experience?: number;
  specialization?: string;
  qualifications?: any[];
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  portfolio_url?: string;
  bio?: string;
  interests?: string[];
  languages_known?: string[];
  hobbies?: string[];
  profile_completion_percentage?: number;
  is_verified?: boolean;
  verified_at?: string;
}

// ============================================================================
// User Document Types
// ============================================================================

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size?: number;
  file_type?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  uploaded_at: string;
  expires_at?: string;
}

// ============================================================================
// User Activity Types
// ============================================================================

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  location_info?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// User Permissions Types
// ============================================================================

export interface UserPermissions {
  [module: string]: string[]; // module -> permissions array
}

export interface UserEntitlement {
  id: string;
  userId: string;
  subscriptionId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  features: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// User Presence Types (Realtime)
// ============================================================================

export interface UserPresence {
  userId: string;
  userType: UserRole;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

// ============================================================================
// User Data Types (Role Lookup)
// ============================================================================

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, any>;
}

// ============================================================================
// User Management Types
// ============================================================================

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  metadata?: Record<string, any>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface BulkImportResult {
  id: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  status: string;
  error_log: any[];
}
