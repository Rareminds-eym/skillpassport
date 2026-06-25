/**
 * Safely parse float with fallback for NaN
 * 
 * JavaScript's parseFloat() returns NaN for invalid input, and NaN ?? fallback
 * still returns NaN (not the fallback). This utility ensures you never get NaN.
 * 
 * @param value - Value to parse (string, number, null, or undefined)
 * @param fallback - Default value if parsing fails (default: 0)
 * @returns Parsed number or fallback (never NaN)
 * 
 * @example
 * ```ts
 * safeParseFloat('123.45')        // 123.45
 * safeParseFloat('invalid')       // 0
 * safeParseFloat(null)            // 0
 * safeParseFloat('', 10)          // 10
 * safeParseFloat('abc') ?? 5      // 0 (not 5, because result is never NaN)
 * ```
 */
export function safeParseFloat(
    value: string | number | null | undefined,
    fallback = 0
): number {
    // Handle null/undefined immediately
    if (value === null || value === undefined) {
        return fallback;
    }

    // If already a number, validate it's not NaN or Infinity
    if (typeof value === 'number') {
        return isNaN(value) || !isFinite(value) ? fallback : value;
    }

    // Parse string to number
    const parsed = parseFloat(String(value));

    // Check if parsing resulted in NaN
    if (isNaN(parsed)) {
        // Development warning to help catch issues early
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[safeParseFloat] NaN detected, using fallback ${fallback}`, { value });
        }
        return fallback;
    }

    // Check for Infinity
    if (!isFinite(parsed)) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[safeParseFloat] Infinity detected, using fallback ${fallback}`, { value });
        }
        return fallback;
    }

    return parsed;
}

/**
 * Safely parse integer with fallback for NaN
 * 
 * @param value - Value to parse
 * @param fallback - Default value if parsing fails (default: 0)
 * @param radix - Radix for parseInt (default: 10)
 * @returns Parsed integer or fallback (never NaN)
 */
export function safeParseInt(
    value: string | number | null | undefined,
    fallback = 0,
    radix = 10
): number {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'number') {
        return isNaN(value) || !isFinite(value) ? fallback : Math.floor(value);
    }

    const parsed = parseInt(String(value), radix);

    if (isNaN(parsed) || !isFinite(parsed)) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[safeParseInt] Invalid number detected, using fallback ${fallback}`, { value });
        }
        return fallback;
    }

    return parsed;
}
