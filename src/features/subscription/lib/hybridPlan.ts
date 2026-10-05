/** Sales-only offering: never use this identifier to grant tier-based access. */
export const HYBRID_PLAN_CODE = 'hybrid';
export const DEFAULT_SALES_EMAIL = 'marketing@rareminds.in';
export const DEFAULT_SALES_PHONE = '+91 9902326951';

export interface HybridCatalogPlan {
  id: string;
  plan_code?: string;
  name: string;
  display_name?: string;
  contactSales?: boolean;
  tagline?: string;
  positioning?: string;
  description?: string;
  salesEmail?: string;
  salesPhone?: string;
  salesHighlights?: string[];
  priceLabel?: string;
  termsNote?: string;
}

export function isHybridPlan(plan: { plan_code?: string; planCode?: string; code?: string; name?: string }) {
  return [plan.plan_code, plan.planCode, plan.code, plan.name]
    .some(value => value?.trim().toLowerCase() === HYBRID_PLAN_CODE);
}

export interface HybridEnquiry {
  institution: string;
  email: string;
  phone: string;
  learners: string;
  educators: string;
  requirements: string;
}

export function buildHybridSalesLink(enquiry: HybridEnquiry, plan: HybridCatalogPlan) {
  const body = [
    'Hello SkillPassport Sales,',
    '',
    `I would like to discuss a ${plan.display_name || plan.name} subscription for our institution.`,
    `Institution: ${enquiry.institution.trim()}`,
    `Contact email: ${enquiry.email.trim()}`,
    `Contact phone: ${enquiry.phone.trim()}`,
    `Estimated students: ${enquiry.learners || 'To discuss'}`,
    `Estimated educators: ${enquiry.educators || 'To discuss'}`,
    '',
    'Features and requirements:',
    enquiry.requirements.trim() || 'Please help us choose features, usage allowances, integrations, support, and billing terms.',
  ].join('\n');
  const targetEmail =
    plan.salesEmail && plan.salesEmail.trim() && plan.salesEmail.trim() !== 'sales@skillpassport.in'
      ? plan.salesEmail.trim()
      : DEFAULT_SALES_EMAIL;

  return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(`${plan.display_name || plan.name} Plan Enquiry`)}&body=${encodeURIComponent(body)}`;
}
