/**
 * Digital Portfolio API - Internal Module Re-exports
 * 
 * This file re-exports all API modules for internal feature use.
 * The parent index.ts exports specific functions for external consumption.
 * 
 * Structure:
 * - badgeService: Badge generation, progress tracking, definitions
 * - portfolioService: Fetch complete learner portfolio data from database
 * - resumeDataService: Save parsed resume data to database tables
 * - resumeParserService: AI-powered resume parsing functionality
 */

export * from './badgeService';
export * from './portfolioService';
export * from './resumeDataService';
export * from './resumeParserService';

/**
 * FSD Compliance Note: Cross-feature import removed
 * 
 * Change: Removed export of learnerDocumentService from @/features/learner-profile
 * Reason: Features should not re-export other features (FSD architectural rule)
 * 
 * ✅ IMPACT VERIFICATION COMPLETED:
 * - Searched codebase for imports of learnerDocumentService from digital-portfolio
 * - Result: ZERO matches found
 * - All consumers already import directly from @/features/learner-profile/api
 * - Files verified:
 *   - src/widgets/learner-dashboard/ui/DocumentManager.jsx ✅ (uses learner-profile)
 *   - src/features/learner-profile/ui/tabs/DocumentsTab.tsx ✅ (uses learner-profile)
 *   - src/entities/learner/ui/LearnerProfileDrawer/modals/DocumentsModal.tsx ✅ (uses learner-profile)
 * 
 * Migration Guide (if needed):
 * OLD: import { uploadlearnerDocument } from '@/features/digital-portfolio'  // Never actually used
 * NEW: import { uploadlearnerDocument } from '@/features/learner-profile/api'  // Correct path
 */
