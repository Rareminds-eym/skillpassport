/**
 * Certificate Entity - Utility Functions
 */

import type {
  Certificate,
  CertificateStatus,
  CertificateType,
  CertificateStats
} from './types';

// ============================================================================
// Certificate Status Utilities
// ============================================================================

export function getCertificateStatusDisplayName(status: CertificateStatus): string {
  const displayNames: Record<CertificateStatus, string> = {
    draft: 'Draft',
    issued: 'Issued',
    revoked: 'Revoked',
    expired: 'Expired'
  };
  return displayNames[status] || status;
}

export function getCertificateStatusColor(status: CertificateStatus): string {
  const colors: Record<CertificateStatus, string> = {
    draft: 'gray',
    issued: 'green',
    revoked: 'red',
    expired: 'orange'
  };
  return colors[status] || 'gray';
}

// ============================================================================
// Certificate Type Utilities
// ============================================================================

export function getCertificateTypeDisplayName(type: CertificateType): string {
  const displayNames: Record<CertificateType, string> = {
    course_completion: 'Course Completion',
    skill_certification: 'Skill Certification',
    achievement: 'Achievement',
    participation: 'Participation',
    professional: 'Professional Certification',
    academic: 'Academic Certificate'
  };
  return displayNames[type] || type;
}

// ============================================================================
// Certificate Expiry Utilities
// ============================================================================

export function isCertificateExpired(certificate: Certificate): boolean {
  if (!certificate.expiry_date) return false;
  return new Date(certificate.expiry_date) < new Date();
}

export function getDaysUntilExpiry(certificate: Certificate): number | null {
  if (!certificate.expiry_date) return null;
  
  const now = new Date().getTime();
  const expiryDate = new Date(certificate.expiry_date).getTime();
  const diff = expiryDate - now;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(certificate: Certificate, daysThreshold: number = 30): boolean {
  const daysUntil = getDaysUntilExpiry(certificate);
  return daysUntil !== null && daysUntil > 0 && daysUntil <= daysThreshold;
}

export function formatExpiryDate(certificate: Certificate): string {
  if (!certificate.expiry_date) return 'No expiry';
  
  if (isCertificateExpired(certificate)) {
    return 'Expired';
  }
  
  const daysUntil = getDaysUntilExpiry(certificate);
  if (daysUntil === null) return 'No expiry';
  
  if (daysUntil <= 0) return 'Expired';
  if (daysUntil === 1) return 'Expires tomorrow';
  if (daysUntil <= 7) return `Expires in ${daysUntil} days`;
  if (daysUntil <= 30) return `Expires in ${Math.ceil(daysUntil / 7)} weeks`;
  
  return new Date(certificate.expiry_date).toLocaleDateString();
}

// ============================================================================
// Certificate Validity Utilities
// ============================================================================

export function isCertificateValid(certificate: Certificate): boolean {
  if (certificate.status === 'revoked') return false;
  if (certificate.status === 'draft') return false;
  if (isCertificateExpired(certificate)) return false;
  return true;
}

export function getCertificateValidityStatus(certificate: Certificate): {
  valid: boolean;
  reason?: string;
} {
  if (certificate.status === 'revoked') {
    return { valid: false, reason: 'Certificate has been revoked' };
  }
  
  if (certificate.status === 'draft') {
    return { valid: false, reason: 'Certificate is in draft status' };
  }
  
  if (isCertificateExpired(certificate)) {
    return { valid: false, reason: 'Certificate has expired' };
  }
  
  return { valid: true };
}

// ============================================================================
// Certificate Filtering Utilities
// ============================================================================

export function filterCertificatesByStatus(
  certificates: Certificate[],
  statuses: CertificateStatus[]
): Certificate[] {
  if (statuses.length === 0) return certificates;
  return certificates.filter(c => statuses.includes(c.status));
}

export function filterCertificatesByType(
  certificates: Certificate[],
  types: CertificateType[]
): Certificate[] {
  if (types.length === 0) return certificates;
  return certificates.filter(c => types.includes(c.type));
}

export function filterValidCertificates(certificates: Certificate[]): Certificate[] {
  return certificates.filter(c => isCertificateValid(c));
}

export function filterExpiredCertificates(certificates: Certificate[]): Certificate[] {
  return certificates.filter(c => isCertificateExpired(c));
}

export function filterExpiringCertificates(
  certificates: Certificate[],
  daysThreshold: number = 30
): Certificate[] {
  return certificates.filter(c => isExpiringSoon(c, daysThreshold));
}

export function searchCertificates(certificates: Certificate[], query: string): Certificate[] {
  if (!query || query.trim().length === 0) return certificates;
  
  const lowerQuery = query.toLowerCase();
  return certificates.filter(c =>
    c.title.toLowerCase().includes(lowerQuery) ||
    c.issuer.toLowerCase().includes(lowerQuery) ||
    c.description?.toLowerCase().includes(lowerQuery) ||
    c.skills?.some(skill => skill.toLowerCase().includes(lowerQuery))
  );
}

// ============================================================================
// Certificate Sorting Utilities
// ============================================================================

export function sortCertificatesByIssueDate(
  certificates: Certificate[],
  order: 'asc' | 'desc' = 'desc'
): Certificate[] {
  return [...certificates].sort((a, b) => {
    const dateA = new Date(a.issue_date).getTime();
    const dateB = new Date(b.issue_date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortCertificatesByExpiry(
  certificates: Certificate[],
  order: 'asc' | 'desc' = 'asc'
): Certificate[] {
  return [...certificates].sort((a, b) => {
    if (!a.expiry_date && !b.expiry_date) return 0;
    if (!a.expiry_date) return 1;
    if (!b.expiry_date) return -1;
    
    const dateA = new Date(a.expiry_date).getTime();
    const dateB = new Date(b.expiry_date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function sortCertificatesByTitle(
  certificates: Certificate[],
  order: 'asc' | 'desc' = 'asc'
): Certificate[] {
  return [...certificates].sort((a, b) => {
    const comparison = a.title.localeCompare(b.title);
    return order === 'desc' ? -comparison : comparison;
  });
}

// ============================================================================
// Certificate Statistics Utilities
// ============================================================================

export function calculateCertificateStats(certificates: Certificate[]): CertificateStats {
  const stats: CertificateStats = {
    total: certificates.length,
    issued: 0,
    expired: 0,
    revoked: 0,
    by_type: {
      course_completion: 0,
      skill_certification: 0,
      achievement: 0,
      participation: 0,
      professional: 0,
      academic: 0
    },
    recent_issuances: 0
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  certificates.forEach(cert => {
    if (cert.status === 'issued') stats.issued++;
    if (cert.status === 'revoked') stats.revoked++;
    if (isCertificateExpired(cert)) stats.expired++;
    
    stats.by_type[cert.type]++;
    
    if (new Date(cert.issue_date) >= thirtyDaysAgo) {
      stats.recent_issuances++;
    }
  });

  return stats;
}

export function getActiveCertificatesCount(certificates: Certificate[]): number {
  return certificates.filter(c => isCertificateValid(c)).length;
}

export function getCertificatesByIssuer(certificates: Certificate[]): Record<string, number> {
  const byIssuer: Record<string, number> = {};
  
  certificates.forEach(cert => {
    byIssuer[cert.issuer] = (byIssuer[cert.issuer] || 0) + 1;
  });
  
  return byIssuer;
}

// ============================================================================
// Certificate Display Utilities
// ============================================================================

export function formatCertificateDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getCertificateSummary(certificate: Certificate): string {
  const parts = [certificate.title, `issued by ${certificate.issuer}`];
  
  if (certificate.issue_date) {
    parts.push(`on ${formatCertificateDate(certificate.issue_date)}`);
  }
  
  return parts.join(' ');
}

export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export function generateCredentialId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${timestamp}-${random}`;
}
