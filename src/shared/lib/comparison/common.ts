/**
 * Comparison Utilities
 * Consolidated from duplicate code across entities
 */

/**
 * Generic comparison function for entities with IDs
 */
export const isSameEntity = <T extends { id: string }>(
  entity1: T | null,
  entity2: T | null
): boolean => {
  if (!entity1 || !entity2) return false;
  return entity1.id === entity2.id;
};
