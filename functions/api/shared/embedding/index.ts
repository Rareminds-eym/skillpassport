/**
 * @deprecated This file is deprecated. Use the new structure instead:
 * - functions/api/embedding/services/embeddingWorkerClient.ts
 * - functions/api/embedding/services/textBuilder.ts
 * - functions/api/embedding/types/index.ts
 * - functions/api/embedding/config/constants.ts
 * 
 * This file re-exports for backward compatibility.
 * 
 * VERIFIED EXPORTS (Last checked: 2026-04-30):
 * ✓ callEmbeddingWorker - exists in embeddingWorkerClient.ts
 * ✓ getEmbeddingConfig - exists in embeddingWorkerClient.ts
 * ✓ buildStudentTextFromDatabase - exists in textBuilder.ts
 * ✓ buildCourseTextFromDatabase - exists in textBuilder.ts
 * ✓ buildCourseText - exists in textBuilder.ts
 * ✓ buildOpportunityTextFromDatabase - exists in textBuilder.ts
 * ✓ buildOpportunityText - exists in textBuilder.ts
 * ✓ buildSkillSearchText - exists in textBuilder.ts
 * ✓ All types - exist in types/index.ts
 * ✓ All constants - exist in config/constants.ts
 */

// Re-export from new locations (verified to exist)
export { callEmbeddingWorker, getEmbeddingConfig } from '../../embedding/services/embeddingWorkerClient';
export {
  buildStudentTextFromDatabase,
  buildCourseTextFromDatabase,
  buildCourseText,
  buildOpportunityTextFromDatabase,
  buildOpportunityText,
  buildSkillSearchText,
} from '../../embedding/services/textBuilder';
export * from '../../embedding/types';
export * from '../../embedding/config/constants';
