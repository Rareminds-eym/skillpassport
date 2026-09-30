import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildHybridSalesLink, isHybridPlan } from '../lib/hybridPlan';
import HybridPlanCard from '../ui/organization/HybridPlanCard';

const plan = {
  id: 'hybrid-test', plan_code: 'hybrid', name: 'Hybrid', contactSales: true,
  priceLabel: 'Custom pricing', salesEmail: 'marketing@rareminds.in', salesPhone: '+91 9902326951',
  salesHighlights: ['Tailored features'],
};

describe('Hybrid sales offering', () => {
  it('renders updated catalog content instead of hardcoded plan copy', () => {
    render(<HybridPlanCard plan={{ ...plan, display_name: 'Hybrid for institutions', priceLabel: 'Request a proposal', salesHighlights: ['Choose your reporting capacity'] }} />);
    expect(screen.getByRole('heading', { name: 'Hybrid for institutions' })).toBeInTheDocument();
    expect(screen.getByText('Request a proposal')).toBeInTheDocument();
    expect(screen.getByText('Choose your reporting capacity')).toBeInTheDocument();
    expect(screen.queryByText('Custom pricing')).not.toBeInTheDocument();
  });

  it('opens an accessible enquiry, prefills organization context, and returns focus on escape', async () => {
    const user = userEvent.setup();
    render(<HybridPlanCard plan={plan} organizationName="Example College" contactEmail="admin@example.edu" contactPhone="+91 98765 43210" />);
    const trigger = screen.getByRole('button', { name: 'Talk to Sales' });
    expect(screen.getByText('Custom pricing')).toBeInTheDocument();
    expect(screen.queryByText(/₹|Buy now|Checkout/i)).not.toBeInTheDocument();
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Institution name')).toHaveValue('Example College');
    expect(within(dialog).getByLabelText('Contact email')).toHaveValue('admin@example.edu');
    expect(within(dialog).getByLabelText('Phone number')).toHaveValue('+91 98765 43210');
    expect(within(dialog).getByText('+91 9902326951')).toBeInTheDocument();
    expect(within(dialog).getByText('marketing@rareminds.in')).toBeInTheDocument();
    expect(within(dialog).getByText(/Opening a draft does not submit a request/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('submits enquiry to /api/email/sales-enquiry and renders success state', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Enquiry submitted successfully' }),
    } as Response);

    render(<HybridPlanCard plan={plan} organizationName="Example College" contactEmail="admin@example.edu" contactPhone="+91 98765 43210" />);
    await user.click(screen.getByRole('button', { name: 'Talk to Sales' }));

    const submitBtn = screen.getByRole('button', { name: 'Send Enquiry' });
    await user.click(submitBtn);

    expect(fetchSpy).toHaveBeenCalledWith('/api/email/sales-enquiry', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));

    const callBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(callBody.institution).toBe('Example College');
    expect(callBody.email).toBe('admin@example.edu');
    expect(callBody.phone).toBe('+91 98765 43210');
    expect(callBody.planCode).toBe('hybrid');

    expect(await screen.findByText('Enquiry Sent Successfully!')).toBeInTheDocument();
    expect(screen.getByText(/We've received your requirements/)).toBeInTheDocument();
    expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it('requires valid contact details and nonnegative whole seat estimates', async () => {
    const user = userEvent.setup();
    render(<HybridPlanCard plan={plan} organizationName="Your Organization" />);
    await user.click(screen.getByRole('button', { name: 'Talk to Sales' }));
    const institution = screen.getByLabelText('Institution name');
    expect(institution).toHaveValue('');
    expect(institution).toBeInvalid();
    const email = screen.getByLabelText('Contact email');
    fireEvent.change(email, { target: { value: 'invalid' } });
    expect(email).toBeInvalid();
    const phone = screen.getByLabelText('Phone number');
    expect(phone).toBeRequired();
    expect(phone).toHaveValue('');
    expect(phone).toBeInvalid();
    const learners = screen.getByLabelText('Students (optional)');
    fireEvent.change(learners, { target: { value: '-1' } });
    expect(learners).toBeInvalid();
    fireEvent.change(learners, { target: { value: '1.5' } });
    expect(learners).toBeInvalid();
  });

  it('encodes requirements as email body without allowing extra recipients or headers', () => {
    const requirements = 'SSO & reports\nSupport? #priority &bcc=other@example.com';
    const link = new URL(buildHybridSalesLink({
      institution: 'School & College', email: 'admin@example.edu', phone: '+91 98765 43210', learners: '500', educators: '', requirements,
    }, plan));
    expect(link.protocol).toBe('mailto:');
    expect(decodeURIComponent(link.pathname)).toBe('marketing@rareminds.in');
    expect([...link.searchParams.keys()]).toEqual(['subject', 'body']);
    expect(link.searchParams.get('subject')).toBe('Hybrid Plan Enquiry');
    expect(link.searchParams.get('body')).toContain('Contact phone: +91 98765 43210');
    expect(link.searchParams.get('body')).toContain(requirements);
    expect(link.searchParams.get('body')).toContain('Estimated educators: To discuss');
  });

  it('identifies API Hybrid entries without treating Enterprise as Hybrid', () => {
    expect(isHybridPlan({ plan_code: 'hybrid', name: 'Custom institution plan' })).toBe(true);
    expect(isHybridPlan({ name: ' Hybrid ' })).toBe(true);
    expect(isHybridPlan({ planCode: 'hybrid' })).toBe(true);
    expect(isHybridPlan({ plan_code: 'enterprise', name: 'Enterprise' })).toBe(false);
  });
});
