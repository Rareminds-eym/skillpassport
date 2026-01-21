/**
 * Salary Formatting Utility
 * Formats salary ranges for display in Indian Rupees (Lakhs notation)
 *
 * Feature: career-fit-salary-display
 * Requirements: 2.3, 3.3
 */

/**
 * Format a salary range for display
 * @param {Object|null} salary - Salary object with min and max values in lakhs
 * @param {number} salary.min - Minimum salary in lakhs (e.g., 4 for ₹4L)
 * @param {number} salary.max - Maximum salary in lakhs (e.g., 8 for ₹8L)
 * @returns {string|null} Formatted string like "₹4L - ₹8L" or null if invalid
 */
export const formatSalaryRange = (salary) => {
  // Handle null/undefined salary
  if (!salary) {
    return null;
  }

  // Validate min and max are numbers
  const { min, max } = salary;
  if (typeof min !== 'number' || typeof max !== 'number') {
    return null;
  }

  // Handle invalid values (negative or NaN)
  if (isNaN(min) || isNaN(max) || min < 0 || max < 0) {
    return null;
  }

  // Format the salary range
  // If min equals max, show single value
  if (min === max) {
    return `₹${formatLakhs(min)}`;
  }

  // Show range with min and max
  return `₹${formatLakhs(min)} - ₹${formatLakhs(max)}`;
};

/**
 * Format a number in lakhs notation
 * @param {number} value - Value in lakhs
 * @returns {string} Formatted string like "4L" or "4.5L"
 */
const formatLakhs = (value) => {
  // For whole numbers, don't show decimal
  if (Number.isInteger(value)) {
    return `${value}L`;
  }
  // For decimals, show one decimal place
  return `${value.toFixed(1)}L`;
};

/**
 * Extract role name from a role that could be string or object
 * Provides backward compatibility with old string format
 * @param {string|Object} role - Role as string or object with name property
 * @returns {string} The role name
 */
export const getRoleName = (role) => {
  if (typeof role === 'string') {
    return role;
  }
  return role?.name || '';
};

/**
 * Extract salary from a role object
 * Returns null for string roles (backward compatibility)
 * @param {string|Object} role - Role as string or object with salary property
 * @returns {Object|null} Salary object or null
 */
export const getRoleSalary = (role) => {
  if (typeof role === 'string') {
    return null;
  }
  return role?.salary || null;
};

export default formatSalaryRange;
