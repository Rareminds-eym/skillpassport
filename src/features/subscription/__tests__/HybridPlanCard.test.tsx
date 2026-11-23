import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HybridPlanCard, { type HybridCatalogTerms } from '../ui/organization/HybridPlanCard';

const id = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
// A published sales-led catalog plan: copy comes from the owner's published configuration.
const plan = (copy: Partial<HybridCatalogTerms['presentation']['copy']> = {}): HybridCatalogTerms => ({
  plan: { id: id(1), code: `pln_${'a'.repeat(32)}`, productId: id(2) }, revisionId: id(3), revisionNumber: 1, name: 'Hybrid',
  audiences: ['school', 'college', 'university'], purchaseMode: 'contact_sales', prices: [], features: [],
  presentation: {
    priceLabel: 'exact', taxInclusive: false, badge: null, copy: {
      tagline: 'Your institution. Your plan.', positioning: 'Built around you',
      description: 'Work with our sales team.', priceText: 'Custom pricing', termsNote: 'Subject to the agreed proposal.',
      highlights: ['Tailored features'], ...copy
    }
  },
}) as HybridCatalogTerms;

describe('Hybrid sales offering', () => {
  it('renders the published owner copy, not hardcoded plan copy', () => {
    render(<HybridPlanCard plan={plan({ priceText: 'Request a proposal', highlights: ['Choose your reporting capacity'] })} />);
    expect(screen.getByRole('heading', { name: 'Hybrid' })).toBeInTheDocument();
    expect(screen.getByText('Request a proposal')).toBeInTheDocument();
    expect(screen.getByText('Choose your reporting capacity')).toBeInTheDocument();
    expect(screen.getByText('Your institution. Your plan.')).toBeInTheDocument();
    expect(screen.queryByText('Custom pricing')).not.toBeInTheDocument();
  });

  it('opens an accessible enquiry, prefills organization context, shows no client-side sales contact and returns focus', async () => {
    const user = userEvent.setup();
    render(<HybridPlanCard plan={plan()} organizationName="Example College" contactEmail="admin@example.edu" contactPhone="+91 98765 43210" />);
    const trigger = screen.getByRole('button', { name: 'Talk to Sales' });
    expect(screen.getByText('Custom pricing')).toBeInTheDocument();
    expect(screen.queryByText(/₹|Buy now|Checkout/i)).not.toBeInTheDocument();
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Institution name')).toHaveValue('Example College');
    expect(within(dialog).getByLabelText('Contact email')).toHaveValue('admin@example.edu');
    expect(within(dialog).getByLabelText('Phone number')).toHaveValue('+91 98765 43210');
    expect(within(dialog).getByRole('link', { name: 'contact page' })).toHaveAttribute('href', '/contact');
    expect(dialog.querySelector('a[href^="mailto:"], a[href^="tel:"]')).toBeNull();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('submits the enquiry with the published revision and never a recipient', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, json: async () => ({ success: true, message: 'Enquiry submitted successfully' }),
    } as Response);
    render(<HybridPlanCard plan={plan()} organizationName="Example College" contactEmail="admin@example.edu" contactPhone="+91 98765 43210" />);
    await user.click(screen.getByRole('button', { name: 'Talk to Sales' }));
    await user.click(screen.getByRole('button', { name: 'Send Enquiry' }));
    expect(fetchSpy).toHaveBeenCalledWith('/api/email/sales-enquiry', expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }));
    const callBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(callBody).toMatchObject({ institution: 'Example College', email: 'admin@example.edu', phone: '+91 98765 43210', planName: 'Hybrid', revisionId: id(3) });
    expect(callBody).not.toHaveProperty('salesEmail');
    expect(await screen.findByText('Enquiry Sent Successfully!')).toBeInTheDocument();
    expect(screen.getByText('+91 98765 43210')).toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it('requires valid contact details and nonnegative whole seat estimates', async () => {
    const user = userEvent.setup();
    render(<HybridPlanCard plan={plan()} organizationName="Your Organization" />);
    await user.click(screen.getByRole('button', { name: 'Talk to Sales' }));
    const institution = screen.getByLabelText('Institution name');
    expect(institution).toHaveValue('');
    expect(institution).toBeInvalid();
    const email = screen.getByLabelText('Contact email');
    fireEvent.change(email, { target: { value: 'invalid' } });
    expect(email).toBeInvalid();
    const phone = screen.getByLabelText('Phone number');
    expect(phone).toBeRequired();
    expect(phone).toBeInvalid();
    const learners = screen.getByLabelText('Students (optional)');
    fireEvent.change(learners, { target: { value: '-1' } });
    expect(learners).toBeInvalid();
    fireEvent.change(learners, { target: { value: '1.5' } });
    expect(learners).toBeInvalid();
  });
});
