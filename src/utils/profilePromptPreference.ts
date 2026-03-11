/**
 * Profile Completion Prompt Preference Manager
 * 
 * Manages user preferences for the Digital Passport profile completion prompt.
 * Stores whether a user has permanently dismissed the prompt in localStorage.
 */

const STORAGE_KEY_PREFIX = 'digitalPassport_completionPrompt_dismissed';

/**
 * Check if development mode is active
 */
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Log message in development mode only
 */
function devLog(message: string, data?: any): void {
  if (isDevelopment) {
    console.log(`[ProfilePromptPreference] ${message}`, data !== undefined ? data : '');
  }
}

/**
 * Generate the localStorage key for a specific user
 */
function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

/**
 * Get the dismissal preference for a user
 * 
 * @param userId - The unique identifier for the user
 * @returns true if the user has dismissed the prompt permanently, false otherwise
 */
export function getPromptDismissed(userId: string): boolean {
  try {
    const key = getStorageKey(userId);
    const value = localStorage.getItem(key);
    
    devLog(`Reading dismissal preference for user ${userId}`, { key, value });
    
    return value === 'true';
  } catch (error) {
    devLog(`Error reading dismissal preference for user ${userId}`, error);
    // If localStorage is unavailable, assume not dismissed (show prompt)
    return false;
  }
}

/**
 * Set the dismissal preference for a user
 * 
 * @param userId - The unique identifier for the user
 * @param dismissed - Whether the user has dismissed the prompt permanently
 */
export function setPromptDismissed(userId: string, dismissed: boolean): void {
  try {
    const key = getStorageKey(userId);
    const value = dismissed ? 'true' : 'false';
    
    localStorage.setItem(key, value);
    
    devLog(`Saved dismissal preference for user ${userId}`, { key, value });
  } catch (error) {
    devLog(`Error saving dismissal preference for user ${userId}`, error);
    // Fail silently - user will see prompt again on next visit
  }
}
