/**
 * Certificate Entity - Validation Logic
 */

import type {
  Certificate,
  CertificateStatus,
  CertificateType,
  CertificateIssuanceRequest
} from './types';

// ============================================================================
// Certificate Status Validation
// ============================================================================

const VALID_CERTIFICATE_STATUSES: CertificateStatus[] = [
  'draft',
  'issued',
  'revoked',
  'expired'
];

export function isValidCertificateStatus(status: string): status is CertificateStatus {
  return VALID_CERTIFICATE_STATUSES.includes(status as CertificateStatus);
}

// ============================================================================
// Certificate Type Validation
// ============================================================================

const VALID_CERTIFICATE_TYPES: CertificateType[] = [
  'course_completion',
  'skill_certification',
  'achievement',
  'participation',
  'professional',
  'academic'
];

export function isValidCertificateType(type: string): type is CertificateType {
  return VALID_CERTIFICATE_TYPES.includes(type as CertificateType);
}

// ============================================================================
// Certificate Validation
// ============================================================================

export function validateCertificate(certificate: Partial<Certificate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!certificate.student_id) {
    errors.push('Student ID is required');
  }

  if (!certificate.title || certificate.title.trim().length === 0) {
    errors.push('Certificate title is required');
  } else if (certificate.title.length < 5) {
    errors.push('Certificate title must be at least 5 characters');
  }

  if (!certificate.issuer || certificate.issuer.trim().length === 0) {
    errors.push('Issuer is required');
  }

  if (!certificate.issue_date) {
    errors.push('Issue date is required');
  } else {
    const issueDate = new Date(certificate.issue_date);
    if (isNaN(issueDate.getTime())) {
      errors.push('Invalid issue date');
    }
  }

  if (certificate.expiry_date) {
    const expiryDate = new Date(certificate.expiry_date);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Invalid expiry date');
    } else if (certificate.issue_date) {
      const issueDate = new Date(certificate.issue_date);
      if (expiryDate <= issueDate) {
        errors.push('Expiry date must be after issue date');
      }
    }
  }

  if (certificate.type && !isValidCertificateType(certificate.type)) {
    errors.push('Invalid certificate type');
  }

  if (certificate.status && !isValidCertificateStatus(certificate.status)) {
    errors.push('Invalid certificate status');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Certificate Issuance Validation
// ============================================================================

export function validateCertificateIssuance(request: Partial<CertificateIssuanceRequest>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!request.student_id) {
    errors.push('Student ID is required');
  }

  if (!request.template_id) {
    errors.push('Template ID is required');
  }

  if (!request.title || request.title.trim().length === 0) {
    errors.push('Certificate title is required');
  }

  if (!request.issuer || request.issuer.trim().length === 0) {
    errors.push('Issuer is required');
  }

  if (!request.issue_date) {
    errors.push('Issue date is required');
  } else {
    const issueDate = new Date(request.issue_date);
    if (isNaN(issueDate.getTime())) {
      errors.push('Invalid issue date');
    }
  }

  if (request.expiry_date) {
    const expiryDate = new Date(request.expiry_date);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Invalid expiry date');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Certificate URL Validation
// ============================================================================

export function isValidCertificateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// ============================================================================
// Certificate Number Validation
// ============================================================================

export function isValidCertificateNumber(number: string): boolean {
  // Certificate numbers should be alphanumeric and at least 6 characters
  return /^[A-Z0-9]{6,}$/i.test(number);
}

// ============================================================================
// Credential ID Validation
// ============================================================================

export function isValidCredentialId(id: string): boolean {
  // Credential IDs should be alphanumeric and at least 8 characters
  return /^[A-Z0-9-]{8,}$/i.test(id);
}
