/**
 * Filter Utilities
 * Consolidated from duplicate code across entities
 */

/**
 * Generic search filter for entities with common text fields
 */
export const searchEntities = <T extends Record<string, any>>(
  entities: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  const term = searchTerm.toLowerCase();
  return entities.filter(entity => {
    return searchFields.some(field => {
      const value = entity[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      return false;
    });
  });
};

/**
 * Generic filter by status
 */
export const filterByStatus = <T extends { status?: string }>(
  entities: T[],
  status: string
): T[] => {
  return entities.filter(entity => entity.status === status);
};

/**
 * Generic filter for active entities
 */
export const filterActive = <T extends { isActive?: boolean; is_active?: boolean }>(
  entities: T[]
): T[] => {
  return entities.filter(entity => 
    (entity.isActive !== false) && (entity.is_active !== false)
  );
};
