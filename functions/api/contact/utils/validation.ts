/**
 * Contact form validation utilities
 */

import type { ContactFormRequest } from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Email validation regex (practical RFC-5322 subset)
 */
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Validate contact form request
 */
export function validateContactForm(body: any): ValidationResult {
  // Check if body is an object
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: 'Request body must be a JSON object'
    };
  }

  const { name, email, user_type, message } = body;

  // Required field: name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      valid: false,
      error: 'Name is required and must be a non-empty string'
    };
  }

  if (name.trim().length > 255) {
    return {
      valid: false,
      error: 'Name must be less than 255 characters'
    };
  }

  // Required field: email
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email is required and must be a non-empty string'
    };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }

  if (email.trim().length > 255) {
    return {
      valid: false,
      error: 'Email must be less than 255 characters'
    };
  }

  // Required field: user_type
  const validUserTypes = ['learner', 'institution', 'employer', 'other'];
  if (!user_type || !validUserTypes.includes(user_type)) {
    return {
      valid: false,
      error: `User type must be one of: ${validUserTypes.join(', ')}`
    };
  }

  // Required field: message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      valid: false,
      error: 'Message is required and must be a non-empty string'
    };
  }

  if (message.trim().length < 10) {
    return {
      valid: false,
      error: 'Message must be at least 10 characters long'
    };
  }

  if (message.trim().length > 5000) {
    return {
      valid: false,
      error: 'Message must be less than 5000 characters'
    };
  }

  // Optional field: organization
  if (body.organization !== undefined && body.organization !== null) {
    if (typeof body.organization !== 'string') {
      return {
        valid: false,
        error: 'Organization must be a string'
      };
    }
    if (body.organization.trim().length > 255) {
      return {
        valid: false,
        error: 'Organization must be less than 255 characters'
      };
    }
  }

  return { valid: true };
}
