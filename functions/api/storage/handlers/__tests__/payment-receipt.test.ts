/**
 * Unit tests for payment receipt handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUploadPaymentReceipt, handleGetPaymentReceipt } from '../payment-receipt';

// Mock R2Client
vi.mock('../../utils/r2-client', () => {
  const mockUpload = vi.fn();
  const mockGetObject = vi.fn();
  const mockGetPublicUrl = vi.fn();
  const mockExtractKeyFromUrl = vi.fn();

  return {
    R2Client: class MockR2Client {
      static extractKeyFromUrl = mockExtractKeyFromUrl;
      upload = mockUpload;
      getObject = mockGetObject;
      getPublicUrl = mockGetPublicUrl;
    },
    mockUpload,
    mockGetObject,
    mockGetPublicUrl,
    mockExtractKeyFromUrl,
  };
});

// Import mocks after vi.mock
const { mockUpload, mockGetObject, mockGetPublicUrl, mockExtractKeyFromUrl } = await import(
  '../../utils/r2-client'
) as any;

describe('Payment Receipt Handlers', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-key',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret',
      CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
    };

    // Reset mocks
    vi.clearAllMocks();
    mockUpload.mockResolvedValue(undefined);
    mockGetPublicUrl.mockReturnValue('https://pub-123.r2.dev/payment_pdf/user_12345678/payment_123.pdf');
    mockGetObject.mockResolvedValue(
      new Response(new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46]) as any]), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      })
    );
    mockExtractKeyFromUrl.mockImplementation((url: string) => {
      if (url.includes('.r2.dev/')) {
        const parts = url.split('.r2.dev/');
        return parts[1] || null;
      }
      return null;
    });
  });

  describe('handleUploadPaymentReceipt', () => {
    it('should upload payment receipt with all parameters', async () => {
      const pdfBase64 = btoa('PDF content');
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          paymentId: 'payment-123',
          userId: 'user-456',
          userName: 'John Doe',
          filename: 'receipt.pdf',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBeDefined();
      expect(data.fileKey).toMatch(/^payment_pdf\/john_doe_user-456\/payment-123_\d+\.pdf$/);
      expect(data.filename).toBe('receipt.pdf');
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should upload payment receipt without optional parameters', async () => {
      const pdfBase64 = btoa('PDF content');
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          paymentId: 'payment-123',
          userId: 'user-456',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.fileKey).toMatch(/^payment_pdf\/user_user-456\/payment-123_\d+\.pdf$/);
      expect(data.filename).toMatch(/^Receipt-ment-123-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should sanitize userName in folder structure', async () => {
      const pdfBase64 = btoa('PDF content');
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64,
          paymentId: 'payment-123',
          userId: 'user-456',
          userName: 'John@Doe#123!',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.fileKey).toMatch(/^payment_pdf\/john_doe_123_user-456\/payment-123_\d+\.pdf$/);
    });

    it('should reject request missing pdfBase64', async () => {
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: 'payment-123',
          userId: 'user-456',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('pdfBase64, paymentId, and userId are required');
    });

    it('should reject request missing paymentId', async () => {
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: btoa('PDF content'),
          userId: 'user-456',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('pdfBase64, paymentId, and userId are required');
    });

    it('should reject request missing userId', async () => {
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: btoa('PDF content'),
          paymentId: 'payment-123',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('pdfBase64, paymentId, and userId are required');
    });

    it('should reject invalid base64 data', async () => {
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: 'invalid-base64!!!',
          paymentId: 'payment-123',
          userId: 'user-456',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid base64 data');
    });

    it('should reject invalid JSON body', async () => {
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: 'invalid json{{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'GET',
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should handle R2 upload errors', async () => {
      mockUpload.mockRejectedValueOnce(new Error('R2 upload failed'));

      const request = new Request('http://localhost/upload-payment-receipt', {
        method: 'POST',
        body: JSON.stringify({
          pdfBase64: btoa('PDF content'),
          paymentId: 'payment-123',
          userId: 'user-456',
        }),
      });

      const response = await handleUploadPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to upload payment receipt');
      expect(data.details).toBe('R2 upload failed');
    });
  });

  describe('handleGetPaymentReceipt', () => {
    it('should get payment receipt with key parameter in download mode', async () => {
      const request = new Request(
        'http://localhost/payment-receipt?key=payment_pdf/user_12345678/receipt.pdf&mode=download'
      );

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="receipt.pdf"');
    });

    it('should get payment receipt with key parameter in inline mode', async () => {
      const request = new Request(
        'http://localhost/payment-receipt?key=payment_pdf/user_12345678/receipt.pdf&mode=inline'
      );

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="receipt.pdf"');
    });

    it('should default to download mode when mode not specified', async () => {
      const request = new Request(
        'http://localhost/payment-receipt?key=payment_pdf/user_12345678/receipt.pdf'
      );

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="receipt.pdf"');
    });

    it('should extract key from URL parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce('payment_pdf/user_12345678/receipt.pdf');

      const request = new Request(
        'http://localhost/payment-receipt?url=https://pub-123.r2.dev/payment_pdf/user_12345678/receipt.pdf'
      );

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(mockExtractKeyFromUrl).toHaveBeenCalled();
    });

    it('should reject request without key or url parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce(null);

      const request = new Request('http://localhost/payment-receipt');

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File key or URL is required');
    });

    it('should reject non-GET requests', async () => {
      const request = new Request('http://localhost/payment-receipt?key=test.pdf', {
        method: 'POST',
      });

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 404 when receipt not found', async () => {
      mockGetObject.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const request = new Request(
        'http://localhost/payment-receipt?key=payment_pdf/nonexistent.pdf'
      );

      const response = await handleGetPaymentReceipt({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Receipt not found or access denied');
    });
  });
});
