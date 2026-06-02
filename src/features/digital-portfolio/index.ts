export * from './ui';

// API & Data Access
export * from './api';
export { exportAsPDF } from './lib/exportppUtils';
export { copyToClipboard } from './lib/exportppUtils';
export { saveResumeToTables } from './api/resumeDataService';
export { exportAsJSON } from './lib/exportppUtils';
export { generateQRCode } from './lib/exportppUtils';
export { generateShareableLink } from './lib/exportppUtils';
export { getlearnerPortfolioByEmail } from './api/portfolioService';
export { parseResumeWithAI } from './api/resumeParserService';
export { downloadQRCode } from './lib/exportppUtils';
export { getBadgeProgress } from './api/badgeService';
export { generateBadges } from './api/badgeService';
export { mergeResumeData } from './api/resumeParserService';
export { exportResume } from './lib/exportppUtils';
export { sharePortfolio } from './lib/exportppUtils';
export { exportAsHTML } from './lib/exportppUtils';
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

// Re-export certificate functions from certificate-generation feature for backward compatibility
// DEPRECATED: Import directly from @/features/certificate-generation instead
export {
  getCertificateProxyUrl,
  downloadCertificate,
  generateCourseCertificate
} from '@/features/certificate-generation';
