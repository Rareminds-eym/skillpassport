/**
 * String manipulation utilities
 */

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatClubName = (name: string | undefined): string => {
  return capitalizeFirstLetter(name || 'Club');
};
