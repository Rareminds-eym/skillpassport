/**
 * Certificate Generation Feature
 * 
 * FSD-compliant feature for generating and managing course completion certificates
 * 
 * @module certificate-generation
 * 
 * ## Exports
 * - certificateService: Core certificate generation and download functionality
 * - certificateLearnerService: Learner name management for certificates  
 * - certificateTemplate: HTML template generation for certificates
 * - useCertificateModal: React hook for certificate modal UI state management
 * 
 * ## Implementation Status
 * ✅ All exported modules verified and implemented
 */

// API exports - certificate generation business logic
export {
  generateCourseCertificate,
  downloadCertificate,
  getCertificateProxyUrl
} from './api/certificateService';

// Learner-specific services
export {
  fetchLearnerName,
  updateLearnerName,
  generateCertificateWithNameUpdate
} from './api/certificateLearnerService';

export type { 
  User,
  CertificateGenerationParams
} from './api/certificateLearnerService';

// Template exports
export { generateCertificateHTML } from './lib/certificateTemplate';

// Hooks - UI logic with business feature integration
export { useCertificateModal } from './hooks/useCertificateModal';

// Types
export type { CertificateResult } from './api/certificateService';
