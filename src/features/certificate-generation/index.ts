/**
 * Certificate Generation Feature
 * 
 * FSD-compliant feature for generating and managing course completion certificates
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
