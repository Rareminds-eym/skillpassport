export * from './ui';

// API & Data Access - Explicit exports for clarity and FSD compliance
export {
  generateBadges,
  getBadgeProgress,
  getBadgesByCategory,
  BADGE_DEFINITIONS
} from './api/badgeService';

export {
  getlearnerPortfolioByEmail
} from './api/portfolioService';

export {
  saveResumeToTables,
  getResumeDataSummary
} from './api/resumeDataService';

export {
  parseResumeWithAI,
  mergeResumeData
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
