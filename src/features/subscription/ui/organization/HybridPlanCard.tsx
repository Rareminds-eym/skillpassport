import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Check, Loader2, SlidersHorizontal, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import {
  buildHybridSalesLink,
  DEFAULT_SALES_EMAIL,
  DEFAULT_SALES_PHONE,
  type HybridCatalogPlan,
} from '../../lib/hybridPlan';

interface HybridPlanCardProps {
  plan: HybridCatalogPlan;
  organizationName?: string;
  contactEmail?: string;
  contactPhone?: string;
  compact?: boolean;
}

const SF = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/**
 * Sales-only plan card whose DOM structure is a 1:1 mirror of PlanCard in
 * SubscriptionPlans.jsx so they share identical heights, baselines, and rhythm
 * when rendered side-by-side in the same CSS Grid.
 */
export default function HybridPlanCard({
  plan,
  organizationName = '',
  contactEmail = '',
  contactPhone = '',
  compact = false,
}: HybridPlanCardProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const effectiveSalesEmail =
    plan.salesEmail && plan.salesEmail.trim() && plan.salesEmail.trim() !== 'sales@skillpassport.in'
      ? plan.salesEmail.trim()
      : DEFAULT_SALES_EMAIL;

  const effectiveSalesPhone =
    plan.salesPhone && plan.salesPhone.trim()
      ? plan.salesPhone.trim()
      : DEFAULT_SALES_PHONE;
  const [enquiry, setEnquiry] = useState({
    institution: '',
    email: '',
    phone: '',
    learners: '',
    educators: '',
    requirements: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setEnquiry((prev) => ({
        ...prev,
        institution:
          prev.institution ||
          (organizationName === 'Your Organization' ? '' : organizationName),
        email: prev.email || contactEmail,
        phone: prev.phone || contactPhone,
      }));
      setSubmitted(false);
      setErrorMessage(null);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/email/sales-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: enquiry.institution.trim(),
          email: enquiry.email.trim(),
          phone: enquiry.phone.trim(),
          learners: enquiry.learners ? Number(enquiry.learners) : undefined,
          educators: enquiry.educators ? Number(enquiry.educators) : undefined,
          requirements: enquiry.requirements.trim(),
          planName: plan.display_name || plan.name,
          planCode: plan.plan_code || 'hybrid',
          salesEmail: effectiveSalesEmail,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to submit enquiry. Please try again.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send enquiry. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600';

  /* ── Compact mode (BulkPurchaseWizard / OrganizationSubscriptionDashboard) ── */
  if (compact) {
    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-4 rounded-xl border-2 border-gray-200 text-left transition-all hover:border-gray-300 hover:bg-gray-50 h-full flex flex-col"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{plan.display_name || plan.name}</h4>
          </div>
          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">
              {plan.priceLabel || 'Custom'}
            </span>
            <span className="text-sm text-gray-500">/custom</span>
          </div>
          {plan.description && (
            <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
          )}
          <ul className="space-y-1">
            {(plan.salesHighlights || []).slice(0, 3).map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-500" />
                {h}
              </li>
            ))}
          </ul>
        </button>
        {renderDialog()}
      </Dialog.Root>
    );
  }

  /* ── Full-size mode (SubscriptionPlans grid) ── */
  /* Outer wrapper matches PlanCard line 505-513 exactly */
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <div
        className="relative bg-white rounded-3xl border-2 transition-all duration-300 h-full flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-2 border-slate-200 hover:border-slate-300"
        role="region"
        aria-label={`${plan.display_name || plan.name} plan`}
      >
        {/* Badge — matches PlanCard badge at line 523-528 */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-1.5 whitespace-nowrap capitalize">
            <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {(plan.positioning && plan.positioning.length <= 25 ? plan.positioning : null) || 'Built Around You'}
          </span>
        </div>

        {/* Inner content wrapper — matches PlanCard line 537 */}
        <div className="p-8 flex flex-col h-full">
          {/* Header — matches PlanCard lines 538-610 */}
          <div className="mb-6 pt-2">
            {/* Plan name — matches line 540 */}
            <h3
              className="text-3xl font-semibold text-slate-900 mb-2"
              style={{ fontFamily: SF }}
            >
              {plan.display_name || plan.name}
            </h3>

            {/* Subtitle — matches lines 544-552 pattern */}
            <p className="text-sm text-slate-500 font-normal mb-2">
              {plan.tagline || 'Custom plan for your institution'}
            </p>

            {/* Price — matches line 564-567 (isContactSales branch: text-3xl font-semibold) */}
            <div className="mt-6">
              <span
                className="text-3xl font-semibold text-slate-900"
                style={{ fontFamily: SF }}
              >
                {plan.priceLabel || 'Contact Sales'}
              </span>
            </div>

            {/* Description — matches line 595-597 (plan.positioning) */}
            {plan.description && (
              <p className="mt-4 text-sm text-slate-500 font-normal leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>

          {/* Features — matches PlanCard lines 637-657 */}
          <div className="flex-1 mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              What's Included
            </h4>
            <div className="space-y-1">
              {(plan.salesHighlights || []).map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2 group">
                  <div className="flex-shrink-0 w-5 h-5 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mt-0.5 shadow-lg group-hover:scale-110 transition-transform">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700">{highlight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action — matches PlanCard lines 659-725 (isContactSales branch: line 683-689) */}
          <div className="mt-auto space-y-3">
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="w-full py-4 px-4 rounded-2xl font-semibold bg-black text-white hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Talk to Sales <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
          </div>
        </div>
      </div>

      {renderDialog()}
    </Dialog.Root>
  );

  function renderDialog() {
    return (
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="pr-8 text-xl font-semibold text-slate-900">
            Let's build your {plan.display_name || plan.name} plan
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-slate-600">
            {submitted
              ? 'Your enquiry has been received by our enterprise team.'
              : "Tell us what your institution needs. We'll send your request directly to our enterprise sales team."}
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close enquiry"
              className="absolute right-4 top-4 rounded p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-teal-600"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>

          {submitted ? (
            <div className="mt-6 space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-slate-900">Enquiry Sent Successfully!</h4>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Thank you! We've received your requirements for the{' '}
                  <span className="font-semibold text-slate-900">{plan.display_name || plan.name}</span> plan.
                  Our enterprise team will review your proposal and reach out to{' '}
                  <span className="font-semibold text-slate-900">{enquiry.email}</span> within 1 business day.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-700">Institution:</span> {enquiry.institution}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Phone:</span> {enquiry.phone}
                </div>
                {enquiry.learners && (
                  <div>
                    <span className="font-semibold text-slate-700">Estimated students:</span> {enquiry.learners}
                  </div>
                )}
                {enquiry.educators && (
                  <div>
                    <span className="font-semibold text-slate-700">Estimated educators:</span> {enquiry.educators}
                  </div>
                )}
                {enquiry.requirements && (
                  <div className="pt-1 text-slate-500 italic truncate">
                    "{enquiry.requirements}"
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500">
                A confirmation has been sent to your email. You can also reach our team directly at{' '}
                <a className="font-semibold text-teal-700 underline" href={`mailto:${effectiveSalesEmail}`}>
                  {effectiveSalesEmail}
                </a>{' '}
                or{' '}
                <a className="font-semibold text-teal-700 underline" href={`tel:${effectiveSalesPhone.replace(/\s+/g, '')}`}>
                  {effectiveSalesPhone}
                </a>.
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor={`${id}-institution`} className="text-sm font-medium text-slate-700">
                  Institution name
                </label>
                <input
                  id={`${id}-institution`}
                  required
                  maxLength={150}
                  autoComplete="organization"
                  value={enquiry.institution}
                  onChange={(e) => setEnquiry({ ...enquiry, institution: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={`${id}-email`} className="text-sm font-medium text-slate-700">
                  Contact email
                </label>
                <input
                  id={`${id}-email`}
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={enquiry.email}
                  onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={`${id}-phone`} className="text-sm font-medium text-slate-700">
                  Phone number
                </label>
                <input
                  id={`${id}-phone`}
                  type="tel"
                  required
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={enquiry.phone}
                  onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(['learners', 'educators'] as const).map((field) => (
                  <div key={field}>
                    <label htmlFor={`${id}-${field}`} className="text-sm font-medium text-slate-700">
                      {field === 'learners' ? 'Students' : 'Educators'} (optional)
                    </label>
                    <input
                      id={`${id}-${field}`}
                      type="number"
                      min="0"
                      max="10000000"
                      step="1"
                      value={enquiry[field]}
                      onChange={(e) => setEnquiry({ ...enquiry, [field]: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label htmlFor={`${id}-requirements`} className="text-sm font-medium text-slate-700">
                  Features and requirements (optional)
                </label>
                <textarea
                  id={`${id}-requirements`}
                  rows={4}
                  maxLength={1000}
                  placeholder="Features, usage limits, integrations, support, or preferred start date…"
                  value={enquiry.requirements}
                  onChange={(e) => setEnquiry({ ...enquiry, requirements: e.target.value })}
                  className={inputClass}
                />
              </div>

              {errorMessage && (
                <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending enquiry...
                  </>
                ) : (
                  'Send Enquiry'
                )}
              </button>

              <div className="pt-2 border-t border-slate-100 leading-relaxed text-slate-500 space-y-1">
                <p className="text-[14px]">
                  Prefer direct contact? Email{' '}
                  <a
                    className="font-semibold text-teal-700 underline"
                    href={`mailto:${effectiveSalesEmail}`}
                  >
                    {effectiveSalesEmail}
                  </a>{' '}
                  or call{' '}
                  <a
                    className="font-semibold text-teal-700 underline"
                    href={`tel:${effectiveSalesPhone.replace(/\s+/g, '')}`}
                  >
                    {effectiveSalesPhone}
                  </a>.
                </p>
                <p className="text-[14px]">
                  Prefer using your email app?{' '}
                  <a
                    className="font-medium text-teal-700 underline"
                    href={buildHybridSalesLink(enquiry, { ...plan, salesEmail: effectiveSalesEmail, salesPhone: effectiveSalesPhone })}
                  >
                    Open email draft
                  </a>
                  . Opening a draft does not submit a request.
                </p>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    );
  }
}
