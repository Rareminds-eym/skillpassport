// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSendEmail = vi.fn();
const mockSendEmailSafe = vi.fn();

vi.mock('../lib/email-service', () => ({
  sendEmail: (...args: any[]) => mockSendEmail(...args),
  sendEmailSafe: (...args: any[]) => mockSendEmailSafe(...args),
}));

import { handleSalesEnquiryEmail } from '../api/email/handlers/sales-enquiry';

describe('handleSalesEnquiryEmail', () => {
  const fakeEnv = {
    EMAIL_SERVICE: { sendEmail: vi.fn() },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing or empty institution name', async () => {
    const res = await handleSalesEnquiryEmail({
      institution: '',
      email: 'admin@college.edu',
      phone: '+91 98765 43210',
    }, fakeEnv);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toMatch(/Institution name is required/i);
  });

  it('rejects invalid contact email', async () => {
    const res = await handleSalesEnquiryEmail({
      institution: 'State University',
      email: 'not-an-email',
      phone: '+91 98765 43210',
    }, fakeEnv);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toMatch(/valid contact email/i);
  });

  it('rejects missing or invalid phone number', async () => {
    const resEmpty = await handleSalesEnquiryEmail({
      institution: 'State University',
      email: 'admin@college.edu',
      phone: '',
    }, fakeEnv);
    expect(resEmpty.status).toBe(400);
    const dataEmpty = await resEmpty.json();
    expect(dataEmpty.error.message).toMatch(/valid phone number/i);

    const resTooShort = await handleSalesEnquiryEmail({
      institution: 'State University',
      email: 'admin@college.edu',
      phone: '123',
    }, fakeEnv);
    expect(resTooShort.status).toBe(400);
    const dataTooShort = await resTooShort.json();
    expect(dataTooShort.error.message).toMatch(/valid phone number/i);
  });

  it('rejects negative learner count', async () => {
    const res = await handleSalesEnquiryEmail({
      institution: 'State University',
      email: 'admin@college.edu',
      phone: '+91 98765 43210',
      learners: -5,
    }, fakeEnv);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message).toMatch(/non-negative whole number/i);
  });

  it('sends email to sales and sends confirmation to client on valid enquiry', async () => {
    mockSendEmail.mockResolvedValueOnce({
      success: true,
      messageId: 'msg-sales-123',
    });
    mockSendEmailSafe.mockResolvedValueOnce(true);

    const res = await handleSalesEnquiryEmail({
      institution: 'Apex Institute of Technology',
      email: 'director@apex.edu',
      phone: '+91 98765 43210',
      learners: 1500,
      educators: 75,
      requirements: 'Custom branding, SSO integration, dedicated account manager',
      planName: 'Hybrid',
      salesEmail: 'marketing@rareminds.in',
    }, fakeEnv);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.messageId).toBe('msg-sales-123');

    // Verify notification sent to sales team
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const [envArg, emailPayload] = mockSendEmail.mock.calls[0];
    expect(envArg).toBe(fakeEnv);
    expect(emailPayload.to).toBe('marketing@rareminds.in');
    expect(emailPayload.subject).toContain('Apex Institute of Technology');
    expect(emailPayload.html).toContain('Apex Institute of Technology');
    expect(emailPayload.html).toContain('director@apex.edu');
    expect(emailPayload.html).toContain('1500');
    expect(emailPayload.html).toContain('75');

    // Verify confirmation copy sent to client
    expect(mockSendEmailSafe).toHaveBeenCalledTimes(1);
    const [, confirmPayload] = mockSendEmailSafe.mock.calls[0];
    expect(confirmPayload.to).toBe('director@apex.edu');
    expect(confirmPayload.subject).toContain('Hybrid plan enquiry');
  });

  it('handles email-worker failure gracefully with 500 status', async () => {
    mockSendEmail.mockResolvedValueOnce({
      success: false,
      error: 'SMTP connection timeout',
    });

    const res = await handleSalesEnquiryEmail({
      institution: 'Apex Institute of Technology',
      email: 'director@apex.edu',
      phone: '+91 98765 43210',
    }, fakeEnv);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe('EMAIL_SEND_FAILED');
    expect(data.error.message).toContain('SMTP connection timeout');
  });
});
