/**
 * Profile Validation Utilities
 * 
 * Provides validation functions for learner profile data
 */

import type { Learner } from '../ui/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format
 */
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

/**
 * Validates phone number format
 */
export const validatePhone = (phone: string): FieldValidationResult => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Check if it's a valid phone number (10-15 digits, optionally starting with +)
  const phoneRegex = /^\+?\d{10,15}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true };
};

/**
 * Validates date format and ensures it's not in the future
 */
export const validateDateOfBirth = (dob: string): FieldValidationResult => {
  if (!dob) {
    return { isValid: false, error: 'Date of birth is required' };
  }
  
  const date = new Date(dob);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  if (date > new Date()) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }
  
  // Check if age is reasonable (between 5 and 100 years)
  const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 5 || age > 100) {
    return { isValid: false, error: 'Age must be between 5 and 100 years' };
  }
  
  return { isValid: true };
};

/**
 * Validates CGPA/GPA value
 */
export const validateCGPA = (cgpa: string | number, maxScale: number = 10): FieldValidationResult => {
  if (!cgpa && cgpa !== 0) {
    return { isValid: false, error: 'CGPA is required' };
  }
  
  const cgpaNum = typeof cgpa === 'string' ? parseFloat(cgpa) : cgpa;
  
  if (isNaN(cgpaNum)) {
    return { isValid: false, error: 'CGPA must be a number' };
  }
  
  if (cgpaNum < 0 || cgpaNum > maxScale) {
    return { isValid: false, error: `CGPA must be between 0 and ${maxScale}` };
  }
  
  return { isValid: true };
};

/**
 * Validates URL format
 */
export const validateURL = (url: string, fieldName: string = 'URL'): FieldValidationResult => {
  if (!url) {
    return { isValid: true }; // URLs are typically optional
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: `Invalid ${fieldName} format` };
  }
};

/**
 * Validates basic profile fields
 */
export const validateBasicProfile = (learner: Partial<Learner>): ValidationResult => {
  const errors: string[] = [];
  
  // Name validation
  if (!learner.name || learner.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (learner.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  // Email validation
  const emailResult = validateEmail(learner.email || '');
  if (!emailResult.isValid) {
    errors.push(emailResult.error!);
  }
  
  // Phone validation (if provided)
  const phone = learner.contact_number || learner.contactNumber || learner.phone;
  if (phone) {
    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) {
      errors.push(phoneResult.error!);
    }
  }
  
  // Date of birth validation (if provided)
  if (learner.date_of_birth) {
    const dobResult = validateDateOfBirth(learner.date_of_birth);
    if (!dobResult.isValid) {
      errors.push(dobResult.error!);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates school-specific profile fields
 */
export const validateSchoolProfile = (learner: Partial<Learner>): ValidationResult => {
  const errors: string[] = [];
  
  // Basic validation first
  const basicResult = validateBasicProfile(learner);
  errors.push(...basicResult.errors);
  
  // School-specific fields
  if (!learner.school_id) {
    errors.push('School ID is required');
  }
  
  if (!learner.grade) {
    errors.push('Grade is required');
  }
  
  // Guardian info validation (required for school learners)
  if (!learner.guardianName) {
    errors.push('Guardian name is required');
  }
  
  if (learner.guardianPhone) {
    const phoneResult = validatePhone(learner.guardianPhone);
    if (!phoneResult.isValid) {
      errors.push(`Guardian ${phoneResult.error}`);
    }
  }
  
  if (learner.guardianEmail) {
    const emailResult = validateEmail(learner.guardianEmail);
    if (!emailResult.isValid) {
      errors.push(`Guardian ${emailResult.error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates college-specific profile fields
 */
export const validateCollegeProfile = (learner: Partial<Learner>): ValidationResult => {
  const errors: string[] = [];
  
  // Basic validation first
  const basicResult = validateBasicProfile(learner);
  errors.push(...basicResult.errors);
  
  // College-specific fields
  if (!learner.college_id) {
    errors.push('College ID is required');
  }
  
  if (!learner.branch_field && !learner.dept) {
    errors.push('Branch/Department is required');
  }
  
  if (learner.currentCgpa) {
    const cgpaResult = validateCGPA(learner.currentCgpa);
    if (!cgpaResult.isValid) {
      errors.push(cgpaResult.error!);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates social links
 */
export const validateSocialLinks = (learner: Partial<Learner>): ValidationResult => {
  const errors: string[] = [];
  
  const socialLinks = [
    { url: learner.linkedin_link, name: 'LinkedIn' },
    { url: learner.github_link, name: 'GitHub' },
    { url: learner.twitter_link, name: 'Twitter' },
    { url: learner.facebook_link, name: 'Facebook' },
    { url: learner.instagram_link, name: 'Instagram' },
    { url: learner.youtube_link, name: 'YouTube' },
    { url: learner.portfolio_link, name: 'Portfolio' }
  ];
  
  for (const link of socialLinks) {
    if (link.url) {
      const urlResult = validateURL(link.url, link.name);
      if (!urlResult.isValid) {
        errors.push(urlResult.error!);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates complete learner profile
 */
export const validatelearnerProfile = (learner: Partial<Learner>): ValidationResult => {
  const errors: string[] = [];
  
  // Determine profile type and validate accordingly
  if (learner.school_id) {
    const schoolResult = validateSchoolProfile(learner);
    errors.push(...schoolResult.errors);
  } else if (learner.college_id) {
    const collegeResult = validateCollegeProfile(learner);
    errors.push(...collegeResult.errors);
  } else {
    // Basic validation for other types
    const basicResult = validateBasicProfile(learner);
    errors.push(...basicResult.errors);
  }
  
  // Validate social links
  const socialResult = validateSocialLinks(learner);
  errors.push(...socialResult.errors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
