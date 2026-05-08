/**
 * Certificate Entity - Type Definitions
 * Core certificate interfaces and types for the application
 */

// ============================================================================
// Core Certificate Types
// ============================================================================

export type CertificateStatus = 'draft' | 'issued' | 'revoked' | 'expired';

export type CertificateType = 
  | 'course_completion'
  | 'skill_certification'
  | 'achievement'
  | 'participation'
  | 'professional'
  | 'academic';

export interface Certificate {
  id: string;
  learner_id: string;
  title: string;
  issuer: string;
  issuer_organization?: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  certificate_number?: string;
  verification_url?: string;
  type: CertificateType;
  status: CertificateStatus;
  description?: string;
  skills?: string[];
  credential_id?: string;
  metadata?: CertificateMetadata;
  created_at: string;
  updated_at: string;
}

export interface CertificateMetadata {
  course_id?: string;
  course_name?: string;
  grade?: string;
  score?: number;
  hours_completed?: number;
  instructor_name?: string;
  organization_logo?: string;
  [key: string]: any;
}

// ============================================================================
// Learner Certificate Types
// ============================================================================

export interface LearnerCertificate {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  verification_url?: string;
  credential_id?: string;
  description?: string;
  skills?: string[];
}

// ============================================================================
// Certificate Template Types
// ============================================================================

export interface CertificateTemplate {
  id: string;
  name: string;
  type: CertificateType;
  organization_id?: string;
  template_html?: string;
  template_url?: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Certificate Issuance Types
// ============================================================================

export interface CertificateIssuanceRequest {
  learner_id: string;
  template_id: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  metadata?: CertificateMetadata;
}

export interface BulkCertificateIssuance {
  template_id: string;
  learners: Array<{
    learner_id: string;
    metadata?: CertificateMetadata;
  }>;
  issue_date: string;
  expiry_date?: string;
}

export interface CertificateIssuanceResult {
  success: boolean;
  certificate_id?: string;
  certificate_url?: string;
  error?: string;
}

// ============================================================================
// Certificate Verification Types
// ============================================================================

export interface CertificateVerification {
  certificate_id: string;
  is_valid: boolean;
  status: CertificateStatus;
  issued_to: string;
  issued_by: string;
  issue_date: string;
  expiry_date?: string;
  verification_date: string;
  details?: Certificate;
}

// ============================================================================
// Certificate Statistics Types
// ============================================================================

export interface CertificateStats {
  total: number;
  issued: number;
  expired: number;
  revoked: number;
  by_type: Record<CertificateType, number>;
  recent_issuances: number;
}

// ============================================================================
// Certificate Filter Types
// ============================================================================

export interface CertificateFilters {
  learner_id?: string;
  type?: CertificateType[];
  status?: CertificateStatus[];
  issuer?: string;
  date_range?: {
    start: string;
    end: string;
  };
  skills?: string[];
  search?: string;
}
