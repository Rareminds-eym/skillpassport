// Shared utilities for profile edit modals

export const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate) return "";
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  if (isNaN(start.getTime())) return "";
  if (endDate && isNaN(end.getTime())) return "";
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  const startLabel = formatDate(start);
  const endLabel = endDate ? formatDate(end) : 'Present';
  
  return `${startLabel} - ${endLabel}`;
};

export const calculateProgress = (completedModules, totalModules) => {
  if (!totalModules || totalModules === 0) return 0;
  const completed = Math.min(completedModules, totalModules);
  return Math.max(0, Math.min(100, Math.round((completed / totalModules) * 100)));
};

export const parseSkills = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
};

export const formatDateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

export const parsePositiveNumber = (value) => {
  const num = Number(value);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num);
};

/**
 * Validates if a string is a valid URL
 * @param {string} value - The URL string to validate
 * @returns {boolean} - True if valid URL or empty, false otherwise
 */
export const isValidUrl = (value) => {
  // Allow empty values (URL fields are optional)
  if (!value || !value.trim()) return true;
  
  try {
    const url = new URL(value);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};
