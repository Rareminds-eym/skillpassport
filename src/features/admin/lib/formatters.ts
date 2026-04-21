/**
 * Admin Feature - Formatting Utilities
 */

/**
 * Format a date string to a localized date format
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a time string to a localized time format
 */
export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format role type for display
 */
export const formatRoleName = (roleType: string): string => {
  switch (roleType) {
    case 'college_admin':
      return 'Dean (College Admin)';
    case 'college_educator':
      return 'Faculty (College Educator)';
    default:
      return roleType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};
