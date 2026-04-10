/**
 * Organization Entity - Validation Logic
 * Validation rules and functions for organization data
 */

import { isValidEmail } from '@/shared/lib/validation';
import type { Organization, OrganizationType } from '@/shared/types';

// ============================================================================
// Organization Type Validation
// ============================================================================

const VALID_ORGANIZATION_TYPES: OrganizationType[] = ['school', 'college', 'university'];

export const isValidOrganizationType = (type: string): type is OrganizationType => {
  return VALID_ORGANIZATION_TYPES.includes(type as OrganizationType);
};

// ============================================================================
// Organization Validation
// ============================================================================

export const validateOrganization = (org: Partial<Organization>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!org.name || org.name.trim().length === 0) {
    errors.push('Organization name is required');
  }

  if (org.name && org.name.length > 200) {
    errors.push('Organization name must be less than 200 characters');
  }

  if (!org.organization_type) {
    errors.push('Organization type is required');
  } else if (!isValidOrganizationType(org.organization_type)) {
    errors.push('Invalid organization type');
  }

  if (org.email && !isValidEmail(org.email)) {
    errors.push('Invalid email format');
  }

  if (org.phone && !isValidPhone(org.phone)) {
    errors.push('Invalid phone number format');
  }

  if (org.website && !isValidWebsite(org.website)) {
    errors.push('Invalid website URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Phone Validation
// ============================================================================

export const isValidPhone = (phone: string): boolean => {
  // Basic phone validation - digits, spaces, hyphens, parentheses, plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// ============================================================================
// Website Validation
// ============================================================================

export const isValidWebsite = (website: string): boolean => {
  try {
    const url = new URL(website);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// ============================================================================
// Subscription Validation
// ============================================================================

export const validateSeatCount = (seatCount: number): {
  isValid: boolean;
  error?: string;
} => {
  if (seatCount < 1) {
    return { isValid: false, error: 'Seat count must be at least 1' };
  }

  if (seatCount > 10000) {
    return { isValid: false, error: 'Seat count cannot exceed 10,000' };
  }

  return { isValid: true };
};

export const canReduceSeats = (
  currentSeats: number,
  assignedSeats: number,
  newSeats: number
): {
  canReduce: boolean;
  reason?: string;
} => {
  if (newSeats < assignedSeats) {
    return {
      canReduce: false,
      reason: `Cannot reduce seats below assigned count (${assignedSeats})`,
    };
  }

  return { canReduce: true };
};
