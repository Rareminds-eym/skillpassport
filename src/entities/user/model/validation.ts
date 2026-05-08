/**
 * User Entity - Validation Logic
 * Validation rules and functions for user data
 */

import { isValidEmail } from '@/shared/lib/validation';
import type { User, UserRole, CreateUserData, UpdateUserData } from '@/shared/types';

// ============================================================================
// Role Validation
// ============================================================================

const VALID_ROLES: UserRole[] = [
  'learner',
  'recruiter',
  'educator',
  'school_admin',
  'college_admin',
  'university_admin',
  'learner',
  'learner',
  'school_educator',
  'college_educator',
  'admin',
  'learner',
  'hr',
  'principal',
  'vice_principal',
  'it_admin',
  'class_teacher',
  'subject_teacher',
];

export const isValidRole = (role: string): role is UserRole => {
  return VALID_ROLES.includes(role as UserRole);
};

// ============================================================================
// Role Checks
// ============================================================================

export const islearnerRole = (role: string | null | undefined): boolean =>
  role === 'learner';

export const isEducatorRole = (role: string | null | undefined): boolean =>
  role === 'educator' || role === 'school_educator' || role === 'college_educator';

export const isAdminRole = (role: string | null | undefined): boolean =>
  role === 'admin' ||
  role === 'school_admin' ||
  role === 'college_admin' ||
  role === 'university_admin';

export const isRecruiterRole = (role: string | null | undefined): boolean =>
  role === 'recruiter' || role === 'hr';

export const isLearnerRole = (role: string | null | undefined): boolean =>
  role === 'learner';

// ============================================================================
// Password Validation
// ============================================================================

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (password.length < 8) {
    errors.push('Password should be at least 8 characters for better security');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// User Data Validation
// ============================================================================

export const validateCreateUserData = (data: CreateUserData): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else if (!isValidPassword(data.password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!data.role) {
    errors.push('Role is required');
  } else if (!isValidRole(data.role)) {
    errors.push('Invalid role');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUpdateUserData = (data: UpdateUserData): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (data.role && !isValidRole(data.role)) {
    errors.push('Invalid role');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// User Object Validation
// ============================================================================

export const validateUser = (user: Partial<User>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!user.id) {
    errors.push('User ID is required');
  }

  if (!user.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(user.email)) {
    errors.push('Invalid email format');
  }

  if (user.role && !isValidRole(user.role)) {
    errors.push('Invalid role');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
