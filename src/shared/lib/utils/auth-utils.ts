/**
 * Shared auth utility functions
 */

/**
 * Checks if an error is a JWT expiration error
 */
export const isJwtExpiryError = (error: any): boolean => {
    if (!error) return false;
    if (error.code === 'PGRST303') return true;
    if (error.message && (
        error.message.includes('JWT expired') ||
        error.message.includes('Invalid token') ||
        error.message.includes('token is expired')
    )) {
        return true;
    }
    return false;
};
