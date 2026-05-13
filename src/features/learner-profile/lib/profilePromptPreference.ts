/**
 * Profile Completion Prompt Preference Manager
 * 
 * Manages user preferences for the Digital Passport profile completion prompt.
 * Stores whether a user has permanently dismissed the prompt in localStorage.
 */

const STORAGE_KEY_PREFIX = 'digitalPassport_completionPrompt_dismissed';

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
    return value === 'true';
  } catch {
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
  } catch {
    // Fail silently - user will see prompt again on next visit
  }
}
