/**
 * Digital Portfolio Feature - Public API
 * 
 * FSD Layer: features/digital-portfolio
 * 
 * This feature handles learner portfolio data aggregation, badge generation,
 * resume parsing, and portfolio export functionality.
 * 
 * ⚠️ IMPORTANT CLARIFICATION FOR CODE REVIEWERS:
 * 
 * Certificate GENERATION functions (generateCourseCertificate, downloadCertificate, 
 * getCertificateProxyUrl) were NEVER part of this feature. They belong to and are 
 * exported from @/features/certificate-generation.
 * 
 * This feature only handles certificate DATA:
 * - Fetching certificate records from database
 * - Displaying certificate information in portfolio
 * - Badge generation based on certificate count
 * 
 * For certificate generation functionality, use:
 * import { generateCourseCertificate, downloadCertificate } from '@/features/certificate-generation'
 */

export * from './ui';

// API & Data Access - Explicit exports for clarity and FSD compliance
// Changed from wildcard export to prevent unintended cross-feature exports

// Badge Service - Badge generation and progress tracking
export {
  generateBadges,          // ✅ Verified export exists
  getBadgeProgress,        // ✅ Verified export exists
  getBadgesByCategory,     // ✅ Verified export exists
  BADGE_DEFINITIONS        // ✅ Verified export exists
} from './api/badgeService';

// Portfolio Service - Fetch complete learner portfolio data
export {
  getlearnerPortfolioByEmail  // ✅ Verified export exists
} from './api/portfolioService';

// Resume Data Service - Save and retrieve resume data
export {
  saveResumeToTables,       // ✅ Verified export exists
  getResumeDataSummary      // ✅ Verified export exists
} from './api/resumeDataService';

// Resume Parser Service - AI-powered resume parsing
export {
  parseResumeWithAI,        // ✅ Verified export exists
  mergeResumeData           // ✅ Verified export exists
} from './api/resumeParserService';

// Utility exports
export { exportAsPDF } from './lib/exportppUtils';
export { copyToClipboard } from './lib/exportppUtils';
export { exportAsJSON } from './lib/exportppUtils';
export { generateQRCode } from './lib/exportppUtils';
export { generateShareableLink } from './lib/exportppUtils';
export { downloadQRCode } from './lib/exportppUtils';
export { exportResume } from './lib/exportppUtils';
export { sharePortfolio } from './lib/exportppUtils';
export { exportAsHTML } from './lib/exportppUtils';

// Type exports
export type { default as ThemeToggle } from './ui/shared/ThemeToggle';
export type { default as CompactResumeDashboard } from './ui/portfolio/layouts/CompactResumeDashboard';
export type { default as JourneyMapLayout } from './ui/portfolio/layouts/JourneyMapLayout';
export type { default as CreativeLayout } from './ui/portfolio/layouts/CreativeLayout';
export type { BackgroundRippleEffect } from './ui/shared/background-ripple-effect';
export type { default as ProfileCompletionModal } from './ui/shared/ProfileCompletionModal';
export type { default as InfographicDashboard } from './ui/portfolio/layouts/InfographicDashboard';
export type { default as ModernLayout } from './ui/portfolio/layouts/ModernLayout';
export type { default as AIPersonaLayout } from './ui/portfolio/layouts/AIPersonaLayout';
export type { default as SplitScreenLayout } from './ui/portfolio/layouts/SplitScreenLayout';
export type { ProfileCompletionErrorBoundary } from './ui/shared/ProfileCompletionErrorBoundary';

// Store exports
export * from './model/portfolioStore';
