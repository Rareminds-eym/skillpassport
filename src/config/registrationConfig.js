/**
 * Registration Configuration
 * 
 * Controls the pre-registration and full registration periods.
 * 
 * Pre-registration: Available until end of Feb 8, 2026 (IST)
 * Full Registration: Opens Feb 9, 2026 00:00:00 IST
 */

// Pre-registration ends at 23:59:59.999 IST on Feb 8, 2026
// This is equivalent to 18:29:59.999 UTC on Feb 8, 2026
// Using Feb 9, 00:00:00 IST as the cutoff point
export const PRE_REGISTRATION_END_DATE = new Date('2026-02-08T23:59:59.999+05:30');

// Full registration opens Feb 9, 2026 00:00:00 IST
export const FULL_REGISTRATION_START_DATE = new Date('2026-02-09T00:00:00.000+05:30');

/**
 * Check if pre-registration is currently active
 * Pre-registration is active until end of Feb 8, 2026 IST
 */
export const isPreRegistrationActive = () => {
    const now = new Date();
    return now <= PRE_REGISTRATION_END_DATE;
};

/**
 * Check if full registration is currently available
 * Full registration opens Feb 9, 2026 00:00:00 IST
 */
export const isFullRegistrationOpen = () => {
    const now = new Date();
    return now >= FULL_REGISTRATION_START_DATE;
};

/**
 * Get remaining time until pre-registration ends
 * Returns object with days, hours, minutes, seconds
 */
export const getTimeUntilPreRegEnds = () => {
    const now = new Date();
    const diff = PRE_REGISTRATION_END_DATE - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false,
        totalMs: diff
    };
};

/**
 * Get remaining time until full registration opens
 * Returns object with days, hours, minutes, seconds
 */
export const getTimeUntilFullRegOpens = () => {
    const now = new Date();
    const diff = FULL_REGISTRATION_START_DATE - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, open: true };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        open: false,
        totalMs: diff
    };
};

/**
 * Format date for display
 */
export const formatRegistrationDate = (date) => {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
};
