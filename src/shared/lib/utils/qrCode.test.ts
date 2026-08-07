import { describe, it, expect, vi, beforeEach } from 'vitest';
import QRCode from 'qrcode';
import { generateProfileQRCode, generateProfileQRCodeSync } from './qrCode';

// Mock the qrcode library
vi.mock('qrcode');

describe('generateProfileQRCode', () => {
    const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location.origin
        Object.defineProperty(window, 'location', {
            value: { origin: 'https://test.skillpassport.com' },
            writable: true
        });
    });

    describe('valid inputs', () => {
        it('should generate QR code for valid learnerId', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

            const result = await generateProfileQRCode('learner123');

            expect(result).toBe(mockDataUrl);
            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                'https://test.skillpassport.com/learner/profile/learner123',
                expect.objectContaining({
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    margin: 4,
                    width: 300
                })
            );
        });

        it('should URL-encode special characters in learnerId', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

            await generateProfileQRCode('learner@123');

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                'https://test.skillpassport.com/learner/profile/learner%40123',
                expect.any(Object)
            );
        });

        it('should trim whitespace from learnerId', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

            await generateProfileQRCode('  learner123  ');

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                'https://test.skillpassport.com/learner/profile/learner123',
                expect.any(Object)
            );
        });

        it('should use window.location.origin when available', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);
            Object.defineProperty(window, 'location', {
                value: { origin: 'https://prod.skillpassport.com' },
                writable: true
            });

            await generateProfileQRCode('learner123');

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                'https://prod.skillpassport.com/learner/profile/learner123',
                expect.any(Object)
            );
        });

        it('should return data URL string starting with data:image/png', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

            const result = await generateProfileQRCode('learner123');

            expect(result).toMatch(/^data:image\/png;base64,/);
        });
    });

    describe('edge cases - invalid learnerId', () => {
        it('should throw error for empty string learnerId', async () => {
            await expect(generateProfileQRCode('')).rejects.toThrow(
                'Invalid learnerId: cannot be empty or whitespace only'
            );
        });

        it('should throw error for whitespace-only learnerId', async () => {
            await expect(generateProfileQRCode('   ')).rejects.toThrow(
                'Invalid learnerId: cannot be empty or whitespace only'
            );
        });

        it('should throw error for null learnerId', async () => {
            await expect(generateProfileQRCode(null as any)).rejects.toThrow(
                'Invalid learnerId: must be a non-empty string'
            );
        });

        it('should throw error for undefined learnerId', async () => {
            await expect(generateProfileQRCode(undefined as any)).rejects.toThrow(
                'Invalid learnerId: must be a non-empty string'
            );
        });

        it('should throw error for non-string learnerId (number)', async () => {
            await expect(generateProfileQRCode(123 as any)).rejects.toThrow(
                'Invalid learnerId: must be a non-empty string'
            );
        });

        it('should throw error for non-string learnerId (object)', async () => {
            await expect(generateProfileQRCode({ id: 'learner123' } as any)).rejects.toThrow(
                'Invalid learnerId: must be a non-empty string'
            );
        });
    });

    describe('QR code generation failure', () => {
        it('should throw error when QRCode.toDataURL fails', async () => {
            vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error('QR generation failed'));

            await expect(generateProfileQRCode('learner123')).rejects.toThrow(
                'Failed to generate QR code: QR generation failed'
            );
        });

        it('should handle non-Error exceptions from QRCode.toDataURL', async () => {
            vi.mocked(QRCode.toDataURL).mockRejectedValue('String error');

            await expect(generateProfileQRCode('learner123')).rejects.toThrow(
                'Failed to generate QR code: Unknown error'
            );
        });
    });

    describe('security requirements', () => {
        it('should only include profile URL without sensitive data', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

            await generateProfileQRCode('learner123');

            const calledUrl = vi.mocked(QRCode.toDataURL).mock.calls[0][0];

            // Ensure URL only contains learnerId, not email, phone, scores, etc.
            expect(calledUrl).toMatch(/^https:\/\/[^/]+\/learner\/profile\/[^/]+$/);
            expect(calledUrl).not.toContain('email');
            expect(calledUrl).not.toContain('phone');
            expect(calledUrl).not.toContain('score');
            expect(calledUrl).not.toContain('password');
        });

        it('should generate QR code with high error correction level', async () => {
            vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);

            await generateProfileQRCode('learner123');

            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ errorCorrectionLevel: 'H' })
            );
        });
    });
});

describe('generateProfileQRCodeSync', () => {
    const mockDataUrl = 'data:image/png;base64,mockDataUrl';

    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'location', {
            value: { origin: 'https://test.skillpassport.com' },
            writable: true
        });
    });

    it('should call onSuccess callback with data URL on success', async () => {
        vi.mocked(QRCode.toDataURL).mockResolvedValue(mockDataUrl);
        const onSuccess = vi.fn();

        generateProfileQRCodeSync('learner123', onSuccess);

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(onSuccess).toHaveBeenCalledWith(mockDataUrl);
    });

    it('should call onError callback on failure', async () => {
        const error = new Error('Generation failed');
        vi.mocked(QRCode.toDataURL).mockRejectedValue(error);
        const onSuccess = vi.fn();
        const onError = vi.fn();

        generateProfileQRCodeSync('learner123', onSuccess, onError);

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toContain('Failed to generate QR code');
    });

    it('should log error to console if onError callback not provided', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error('Generation failed'));
        const onSuccess = vi.fn();

        generateProfileQRCodeSync('learner123', onSuccess);

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'QR code generation failed:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });

    it('should handle validation errors through onError callback', async () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();

        generateProfileQRCodeSync('', onSuccess, onError);

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toContain('Invalid learnerId');
    });
});
