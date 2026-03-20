/**
 * Certificate Entity - Model Exports
 */

// Type exports
export type {
  CertificateStatus,
  CertificateType,
  Certificate,
  CertificateMetadata,
  StudentCertificate,
  CertificateTemplate,
  CertificateIssuanceRequest,
  BulkCertificateIssuance,
  CertificateIssuanceResult,
  CertificateVerification,
  CertificateStats,
  CertificateFilters
} from './types';

// Validation exports
export {
  isValidCertificateStatus,
  isValidCertificateType,
  validateCertificate,
  validateCertificateIssuance,
  isValidCertificateUrl,
  isValidCertificateNumber,
  isValidCredentialId
} from './validation';

// Utility exports
export {
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
} from './utils';
