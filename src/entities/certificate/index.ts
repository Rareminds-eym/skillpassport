/**
 * Certificate Entity - Public API
 * Central export point for all certificate entity functionality
 */

// Model exports
export type {
  CertificateStatus,
  CertificateType,
  Certificate,
  CertificateMetadata,
  LearnerCertificate,
  CertificateTemplate,
  CertificateIssuanceRequest,
  BulkCertificateIssuance,
  CertificateIssuanceResult,
  CertificateVerification,
  CertificateStats,
  CertificateFilters
} from './model';

export {
  isValidCertificateStatus,
  isValidCertificateType,
  validateCertificate,
  validateCertificateIssuance,
  isValidCertificateUrl,
  isValidCertificateNumber,
  isValidCredentialId,
  getCertificateStatusDisplayName,
  getCertificateStatusColor,
  getCertificateTypeDisplayName,
  isCertificateExpired,
  getDaysUntilExpiry,
  isExpiringSoon,
  formatExpiryDate,
  isCertificateValid,
  getCertificateValidityStatus,
  filterCertificatesByStatus,
  filterCertificatesByType,
  filterValidCertificates,
  filterExpiredCertificates,
  filterExpiringCertificates,
  searchCertificates,
  sortCertificatesByIssueDate,
  sortCertificatesByExpiry,
  sortCertificatesByTitle,
  calculateCertificateStats,
  getActiveCertificatesCount,
  getCertificatesByIssuer,
  formatCertificateDate,
  getCertificateSummary,
  generateCertificateNumber,
  generateCredentialId
} from './model';
