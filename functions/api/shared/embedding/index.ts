/**
 * @deprecated This file is deprecated. Use the new structure instead:
 * - functions/api/embedding/services/embeddingWorkerClient.ts
 * - functions/api/embedding/services/textBuilder.ts
 * - functions/api/embedding/types/index.ts
 * - functions/api/embedding/config/constants.ts
 * 
 * This file re-exports for backward compatibility.
 */

// Re-export from new locations
export { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
export {
  buildlearnerTextFromDatabase,
  buildCourseTextFromDatabase,
  buildCourseText,
  buildOpportunityTextFromDatabase,
  buildOpportunityText,
  buildSkillSearchText,
} from '../../embedding/services/textBuilder';
export * from '../../embedding/types';
export * from '../../embedding/config/constants';
