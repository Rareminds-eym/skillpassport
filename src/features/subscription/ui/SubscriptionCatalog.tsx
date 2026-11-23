import { lazy, Suspense, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronUp, Shield, Sparkles } from 'lucide-react';
import { getEntityContent } from '@/shared/lib/getEntityContent';
import { useUser, useUserRole } from '@/shared/model/authStore';
import { ROUTES } from '@/shared/config/constants';
import type { Catalog, FeatureGrant } from '../api/subscriptionExecutionService';
import styles from './SubscriptionWorkspace.module.css';
import SubscriptionCatalogSummary, { CatalogHeading } from './SubscriptionCatalogSummary';

const AddOnMarketplace = lazy(() => import('./AddOnMarketplace'));
const headingFont = { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
const acronyms = (text: string) => text.replace(/\b(ai|lte)\b/gi, word => word.toUpperCase());
const featureName = (key: string) => acronyms(key.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase()));
const enumLabel = (value: string) => acronyms(value.replace(/_/g, ' ').replace(/^\w/, character => character.toUpperCase()));
function featureValue(feature?: FeatureGrant) {
  if (!feature?.enabled) return 'Not included';
  if (feature.type === 'boolean') return 'Included';
  if (feature.type === 'enum') return feature.value === null ? 'No configured value' : enumLabel(feature.value);
  if (feature.limit.kind === 'finite') return feature.limit.value.toLocaleString();
  if (feature.limit.kind === 'unlimited') return 'Unlimited';
  return feature.limit.kind === 'contract_required' ? 'Contract required' : 'Allocated by policy';
}

const featureCategories: Record<string, string> = {
    'included_learner_capacity': 'Essentials',
    'ai_credits': 'Essentials',
    'assessment_attempts': 'Learning',
    'assessment_access': 'Learning',
    'course_lte_assignments': 'Learning',
    'career_roadmap': 'Career',
    'learner_portfolio': 'Career',
    'profile_review': 'Career',
    'interview_practice': 'Career',
    'opportunity_access': 'Career',
    'support_tier': 'Support',
    // Essentials
    'access_basic_assessments': 'Essentials',
    '5_assessments_month': 'Essentials',
    '10_assessments_month': 'Essentials',
    'unlimited_assessments': 'Essentials',
    '3_projects': 'Essentials',
    '10_projects': 'Essentials',
    'unlimited_projects': 'Essentials',
    '5gb_storage': 'Essentials',
    '10gb_storage': 'Essentials',
    '50gb_storage': 'Essentials',

    // Learning
    'skill_analytics': 'Learning',
    'advanced_analytics': 'Learning',
    'portfolio_builder': 'Learning',
    'advanced_portfolio': 'Learning',
    'career_paths': 'Learning',
    'all_career_paths': 'Learning',
    'interview_prep': 'Learning',
    'mock_interviews': 'Learning',
    'linkedin_opt': 'Learning',
    'resume_builder': 'Learning',
    'certificates': 'Learning',
    'verified_certs': 'Learning',

    // Support
    'basic_support': 'Support',
    'priority_support': 'Support',
    'mentorship': 'Support',
    'placement_assist': 'Support'
  };

export function SubscriptionAddOns() {
  const { role } = useUserRole();
  return <Suspense fallback={<p role="status">Loading add-ons…</p>}><AddOnMarketplace role={role} showBundles showHeader={false} compact /></Suspense>;
}

/** Presentation from the QA plans page. Its data and actions remain owned by the published catalog. */
export function SubscriptionCatalogFrame({ children, type = 'learner' }: { children: ReactNode; type?: string }) {
  const [tab, setTab] = useState<'plans' | 'addons'>('plans');
  const user = useUser();
  const { title, subtitle } = getEntityContent(type);
  return <main className={`${styles.catalogPage} min-h-screen bg-gradient-to-b from-blue-400 via-blue-100 to-white`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {user ? <SubscriptionCatalogSummary title={title} subtitle={subtitle} /> : <CatalogHeading title={title} subtitle={subtitle} />}
      <div className="flex justify-center mb-12" role="tablist" aria-label="Subscription options">
        <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-lg border-2 border-slate-200">
          <button id="plans-tab" role="tab" aria-selected={tab === 'plans'} aria-controls="plans-panel" onClick={() => setTab('plans')}
            className={`px-5 sm:px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'plans' ? 'bg-black text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'}`}>
            <Shield className="w-4 h-4" aria-hidden="true" />Subscription Plans
          </button>
          <button id="addons-tab" role="tab" aria-label="Add-Ons" aria-selected={tab === 'addons'} aria-controls="addons-panel" onClick={() => setTab('addons')}
            className={`px-5 sm:px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'addons' ? 'bg-black text-white shadow-lg' : 'text-slate-600 hover:text-slate-900'}`}>
            <Sparkles className="w-4 h-4" aria-hidden="true" />Add-Ons
            <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-bold">New</span>
          </button>
        </div>
      </div>
      <div id="plans-panel" role="tabpanel" aria-labelledby="plans-tab" hidden={tab !== 'plans'}>{children}</div>
      {tab === 'addons' && <div id="addons-panel" role="tabpanel" aria-labelledby="addons-tab">
        <SubscriptionAddOns />
      </div>}
      <section className="mt-20 text-center relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 sm:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)' }} />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400" />
        <h2 className="text-4xl font-semibold text-white mb-3" style={headingFont}>Need Help Choosing?</h2>
        <p className="text-white/70 mb-8 text-lg font-light max-w-xl mx-auto">Our team can help you find the right plan for your needs.</p>
        <a href={ROUTES.CONTACT} className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold hover:bg-slate-100 transition-all shadow-xl">Contact Support</a>
      </section>
    </div>
  </main>;
}

function PublishedPlanCard({ plan, selected, current, organization, prices, purchase }: { current: boolean; plan: Catalog['plans'][number]; selected: boolean; organization: boolean; prices: ReactNode; purchase: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  // Preserve QA's action palette; commercial eligibility remains in the purchase owner.
  const actionColors = organization
    ? '[&_button]:bg-gradient-to-r [&_button]:from-purple-600 [&_button]:to-purple-700 [&_button]:text-white [&_button:hover]:from-purple-700 [&_button:hover]:to-purple-800'
    : plan.purchaseMode === 'free'
      ? '[&_button]:bg-gradient-to-r [&_button]:from-emerald-500 [&_button]:to-emerald-600 [&_button]:text-white [&_button:hover]:from-emerald-600 [&_button:hover]:to-emerald-700'
      : plan.presentation.badge
        ? '[&_button]:bg-black [&_button]:text-white [&_button:hover]:bg-gray-900'
        : '[&_button]:bg-slate-100 [&_button]:text-slate-900 [&_button]:border-2 [&_button]:border-slate-300 [&_button:hover]:bg-slate-200';
  return <article aria-current={selected ? 'true' : undefined} aria-label={plan.name}
    ref={selected ? node => node?.scrollIntoView?.({ block: 'center' }) : undefined}
    className={`relative bg-white rounded-3xl border-2 transition-all duration-300 h-full flex flex-col shadow-lg hover:shadow-2xl ${selected || current ? 'border-emerald-500 shadow-emerald-500/20' : plan.presentation.badge ? 'border-slate-900 shadow-slate-900/10' : 'border-slate-200 hover:border-slate-300'}`}>
    {plan.presentation.badge && <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-max max-w-[90%] text-center">
      <span className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-xl">{plan.presentation.badge}</span>
    </div>}
    <div className="p-8 flex flex-col h-full">
      <div className="mb-6 pt-2">
        {current ? <p className="text-emerald-700 font-semibold mb-2">Your current plan</p> : selected && <p className="text-emerald-700 font-semibold mb-2">Your selected plan</p>}
        <h3 className="text-3xl font-semibold text-slate-900 mb-2" style={headingFont}>{plan.name}</h3>
        {plan.presentation.copy && <p className="text-sm text-amber-600 font-semibold">{plan.presentation.copy.tagline}</p>}
        <div className="mt-6 text-slate-900 [&_strong]:text-5xl [&_strong]:font-bold [&_strong]:font-sans [&_small]:block [&_small]:text-slate-500">{prices}</div>
        {plan.purchaseMode === 'free' && <p className="text-3xl font-semibold text-slate-900" style={headingFont}>Free</p>}
        {plan.purchaseMode === 'contact_sales' && <p className="text-3xl font-semibold text-slate-900" style={headingFont}>Contact Sales</p>}
        {plan.presentation.copy && <p className="mt-4 text-sm text-slate-600 font-light leading-relaxed">{plan.presentation.copy.positioning}</p>}
      </div>
      <div className="flex-1 mb-6">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">What's Included</h4>
        <ul className="space-y-1">{plan.features.slice(0, expanded ? undefined : 6).map(feature => <li key={feature.key} className="flex items-start gap-3 py-2">
          <div className={`flex-shrink-0 w-5 h-5 rounded-2xl flex items-center justify-center mt-0.5 shadow-lg ${feature.enabled ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-slate-200'}`}>
            {feature.enabled && <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />}
          </div>
          <div className="flex-1 min-w-0"><span className="text-sm font-medium text-slate-700">{featureName(feature.key)}</span>
            <span className={`${styles.featureValue} block text-xs text-slate-500 mt-0.5`}>{featureValue(feature)}</span></div>
        </li>)}</ul>
        {plan.features.length > 6 && <button aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="mt-4 w-full py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2">
          {expanded ? <>Show less<ChevronUp className="h-4 w-4" /></> : <>Show all {plan.features.length} features<ChevronDown className="h-4 w-4" /></>}
        </button>}
      </div>
      <div className={`mt-auto space-y-3 [&_button]:w-full [&_button]:py-4 [&_button]:px-4 [&_button]:rounded-2xl [&_button]:font-semibold [&_button]:shadow-lg [&_button:hover]:shadow-xl [&_button]:transition-all [&_button:disabled]:opacity-50 [&_p]:text-sm [&_p]:text-slate-600 [&_p]:mb-3 ${actionColors}`}>
        {purchase}
      </div>
    </div>
  </article>;
}

/** Receives validated terms and caller-owned actions; never reads legacy plans or infers checkout authority. */
export default function SubscriptionCatalog({ catalog, selectedRevisionId, currentPlanId, renderPrices, renderPurchase }: {
  catalog: Catalog; selectedRevisionId?: string; currentPlanId?: string;
  renderPrices: (plan: Catalog['plans'][number]) => ReactNode;
  renderPurchase: (plan: Catalog['plans'][number]) => ReactNode;
}) {
  const [comparison, setComparison] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const keys = [...new Set(catalog.plans.flatMap(plan => plan.features.map(feature => feature.key)))];
  const categories = new Map<string, string[]>();
  for (const key of keys) {
    const category = featureCategories[key] ?? 'Extras';
    categories.set(category, [...(categories.get(category) ?? []), key]);
  }
  return <>
    <div className={`grid md:grid-cols-2 gap-6 ${catalog.plans.length >= 4 ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {catalog.plans.map(plan => <PublishedPlanCard key={plan.revisionId} plan={plan} selected={plan.revisionId === selectedRevisionId} current={plan.plan.id === currentPlanId} organization={catalog.subjectKind === 'organization'}
        prices={renderPrices(plan)} purchase={renderPurchase(plan)} />)}
    </div>
    <div className="mt-16 flex flex-wrap items-center justify-center gap-12 text-slate-600">
      {['Secure Payments', '24/7 Support', 'Cancel Anytime'].map(item => <div key={item} className="flex items-center gap-3 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Check className="h-4 w-4 text-white" strokeWidth={3} /></div>
        <span className="font-medium">{item}</span>
      </div>)}
    </div>
    {!comparison ? <div className="mt-16 text-center"><button onClick={() => setComparison(true)} aria-expanded={false}
      className="text-slate-600 hover:text-slate-900 flex items-center gap-2 text-sm mx-auto font-semibold transition-colors">
      <ChevronDown className="h-4 w-4" />Show Feature Comparison</button></div>
      : <section className="mt-20" aria-labelledby="comparison-heading">
        <div className="flex items-center justify-between mb-8"><div>
          <h2 id="comparison-heading" className="text-3xl sm:text-5xl font-semibold text-slate-900" style={headingFont}>Compare Plans</h2>
          <p className="text-slate-600 mt-2 text-lg font-light">See what's included in each plan</p>
        </div><button onClick={() => setComparison(false)} aria-expanded={true}
          className="text-slate-500 hover:text-slate-700 flex items-center gap-2 text-sm font-semibold transition-colors"><ChevronUp className="h-4 w-4" />Hide</button></div>
        <div role="region" aria-label="Plan comparison" tabIndex={0} className="bg-white rounded-3xl border-2 border-slate-200 overflow-x-auto shadow-2xl">
          <table className={`${styles.comparisonTable} w-full table-fixed`} style={{ minWidth: 250 + 220 * catalog.plans.length }}>
            <colgroup><col style={{ width: 250 }} />{catalog.plans.map(plan => <col key={plan.revisionId} />)}</colgroup>
            <thead className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-t-4 border-amber-400"><tr>
              <th scope="col" className="p-8 font-light text-xl text-left" style={headingFont}>Features</th>
              {catalog.plans.map(plan => <th scope="col" key={plan.revisionId} className="p-8 text-center border-l border-white/10">
                <div className="font-semibold text-xl mb-2" style={headingFont}>{plan.name}</div>
                <div className="text-sm text-white/70 font-medium">{plan.purchaseMode === 'contact_sales' ? 'Custom' : plan.purchaseMode === 'free' ? 'Free' : renderPrices(plan)}</div>
              </th>)}
            </tr></thead>
            {[...categories].map(([category, features]) => <tbody key={category} className="border-t-2 border-slate-100">
              <tr><th colSpan={catalog.plans.length + 1} className="p-0"><button aria-label={`${category} ${features.length} features`} aria-expanded={expanded[category] !== false}
                onClick={() => setExpanded(value => ({ ...value, [category]: value[category] === false }))}
                className="w-full p-6 flex items-center gap-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-all text-left group">
                <span className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all shadow-lg ${expanded[category] !== false ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white scale-110' : 'bg-white text-slate-600 border-2 border-slate-200'}`}>
                  {expanded[category] !== false ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span><span className="font-semibold text-2xl text-slate-900" style={headingFont}>{category}</span>
                <span className="ml-4 text-sm text-slate-500 font-medium">{features.length} features</span>
              </button></th></tr>
              {expanded[category] !== false && features.map((key, index) => <tr key={key} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                <th scope="row" className="p-6 text-sm text-slate-700 font-medium text-left">{featureName(key)}</th>
                {catalog.plans.map(plan => { const feature = plan.features.find(item => item.key === key); return <td key={plan.revisionId} className="p-6 text-center border-l border-slate-100">
                  {!feature?.enabled ? <span className="text-slate-300 text-xl" aria-label="Not available">—</span>
                    : feature.type === 'boolean' ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg" aria-label="Included"><Check className="h-4 w-4 text-white" strokeWidth={3} /></span>
                      : <span className="text-sm text-slate-900 font-semibold">{featureValue(feature)}</span>}
                </td>; })}
              </tr>)}
            </tbody>)}
          </table>
        </div>
        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-600">
          <div className="flex items-center gap-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg"><Check className="h-4 w-4 text-white" strokeWidth={3} /></span><span className="font-medium">Included</span></div>
          <div className="flex items-center gap-3"><span className="text-slate-300 text-xl">—</span><span className="font-medium">Not available</span></div>
        </div>
      </section>}

  </>;
}
