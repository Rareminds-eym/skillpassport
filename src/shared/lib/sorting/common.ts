/**
 * Sorting Utilities
 * Consolidated from duplicate code across entities
 */

/**
 * Generic sort by name/title field
 */
export const sortByName = <T extends Record<string, any>>(
  entities: T[],
  nameField: keyof T = 'name' as keyof T
): T[] => {
  return [...entities].sort((a, b) => {
    const nameA = String(a[nameField] || '').toLowerCase();
    const nameB = String(b[nameField] || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
};
