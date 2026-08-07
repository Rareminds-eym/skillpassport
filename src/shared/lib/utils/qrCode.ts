import QRCode from 'qrcode';

/**
 * Generate QR code for learner public profile
 * @param learnerId - The learner's unique identifier
 * @returns Promise resolving to data URL string for QR code image
 * @throws Error if learnerId is empty or invalid, or QR code generation fails
 */
export async function generateProfileQRCode(learnerId: string): Promise<string> {
    // Validate learnerId type
    if (typeof learnerId !== 'string') {
        throw new Error('Invalid learnerId: must be a non-empty string');
    }

    // Sanitize learnerId to prevent injection attacks
    const sanitizedLearnerId = learnerId.trim();

    // Check if empty or whitespace only
    if (sanitizedLearnerId.length === 0) {
        throw new Error('Invalid learnerId: cannot be empty or whitespace only');
    }

    // Construct public profile URL
    // Use window.location.origin in browser context, fallback to production URL
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://skillpassport.com';

    const profileUrl = `${baseUrl}/learner/profile/${encodeURIComponent(sanitizedLearnerId)}`;

    try {
        // Generate QR code as data URL
        // Options:
        // - errorCorrectionLevel: 'H' (high, ~30% recovery capability)
        // - type: 'image/png'
        // - margin: 4 (quiet zone modules)
        const dataUrl = await QRCode.toDataURL(profileUrl, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 4,
            width: 300, // Generate at reasonable size (300x300px)
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return dataUrl;
    } catch (error) {
        throw new Error(
            `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Generate QR code synchronously for learner public profile
 * This is a convenience wrapper that handles the async operation
 * Use this when you need to generate QR code in a useEffect or event handler
 * 
 * @param learnerId - The learner's unique identifier
 * @param onSuccess - Callback when QR code is generated successfully
 * @param onError - Callback when QR code generation fails
 */
export function generateProfileQRCodeSync(
    learnerId: string,
    onSuccess: (dataUrl: string) => void,
    onError?: (error: Error) => void
): void {
    generateProfileQRCode(learnerId)
        .then(onSuccess)
        .catch((error) => {
            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)));
            } else {
                console.error('QR code generation failed:', error);
            }
        });
}
