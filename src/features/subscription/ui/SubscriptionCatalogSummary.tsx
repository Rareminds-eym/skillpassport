import { z } from 'zod';
import { featureGrant } from '../api/subscriptionExecutionService';
import { Calendar, Check, Clock, Shield, Sparkles } from 'lucide-react';
import { useSubscriptionQuery } from '../model/useSubscriptionQuery';
import { calculateDaysRemaining, formatDate } from '../lib/subscriptionHelpers';

const headingFont = { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
export function CatalogHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="text-center mb-16">
    <h1 className="text-4xl sm:text-6xl font-normal text-white mb-4 tracking-tight" style={headingFont}>{title}</h1>
    <p className="text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed" style={headingFont}>{subtitle}</p>
    <a href="/subscription/manage" className="inline-block mt-5 text-sm font-semibold text-white underline underline-offset-4">Manage your subscription</a>
  </header>;
}

/** Reuse QA's existing account query for display, independently of published checkout authority. */
export default function SubscriptionCatalogSummary({ title, subtitle }: { title: string; subtitle: string }) {
  const { subscriptionData: subscription, loading, error, refreshSubscription, hasActiveOrPausedSubscription } = useSubscriptionQuery();
  // Explicit failure reporting never substitutes subscription data or claims success.
  if (error) return <div role="alert" className="mb-8 bg-red-50 border-2 border-red-200 rounded-3xl p-6">
    <p>Unable to load your current subscription.</p><button onClick={() => void refreshSubscription()}>Try reading again</button>
  </div>;
  if (loading) return <p role="status" className="mb-8 text-white">Loading your current subscription…</p>;
  // A successful empty account read is the normal new-subscriber page, not an error recovery path.
  if (!subscription || !hasActiveOrPausedSubscription) return <CatalogHeading title={title} subtitle={subtitle} />;
  const features = z.array(z.union([z.string().min(1), featureGrant])).safeParse(subscription.features);
  if (!features.success) return <div role="alert" className="mb-8 bg-red-50 border-2 border-red-200 rounded-3xl p-6">Unable to read your current subscription features. Please try again.</div>;
  const activeFeatures = features.data.flatMap(feature => typeof feature === 'string' ? [feature] : feature.enabled ? [feature.key] : []);
  const days = calculateDaysRemaining(subscription.endDate);
  return <>
    <section aria-label="Current subscription" className="mb-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)' }} />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400" />
        <div className="relative z-10 p-6 sm:p-10 flex items-start justify-between gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border-2 border-white/10 mb-6">
              <span className={`w-2 h-2 rounded-full ${subscription.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-medium tracking-wider uppercase text-white/70">{subscription.status === 'active' ? 'Currently Active' : 'Paused'}</span>
            </div>
            <h2 className="text-5xl font-semibold text-white mb-3 tracking-tight leading-none" style={headingFont}>{subscription.planName}</h2>
            <p className="text-xl text-white/60 font-normal tracking-wide mb-6">{subscription.status === 'active' ? 'Your subscription is active' : 'Your subscription is paused'}</p>
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-400" /><span className="text-white/50 font-light">Started</span><span className="text-white font-medium">{formatDate(subscription.startDate)}</span></div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2"><span className="text-white/50 font-light">Expires</span><span className="text-white font-medium">{formatDate(subscription.endDate)}</span></div>
            </div>
          </div>
          {days !== null && <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-8 shadow-2xl border-2 border-white/10 min-w-[180px]">
            <Clock className="absolute top-3 right-3 h-5 w-5 text-white/30" />
            <div className="text-center"><div className="text-6xl font-semibold text-white mb-1" style={headingFont}>{days}</div><div className="text-sm text-white/70 uppercase tracking-widest font-medium">Days Left</div></div>
          </div>}
        </div>
      </div>
      <div className="mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-slate-200 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-50 to-transparent rounded-full -translate-y-32 translate-x-32" />
          <div className="relative p-8"><div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg"><Sparkles className="h-5 w-5 text-white" /></div><h3 className="text-2xl font-semibold text-slate-900" style={headingFont}>Active Features</h3></div>
            <div className="grid sm:grid-cols-2 gap-4">{activeFeatures.map(feature => <div key={feature} className="flex items-start gap-3"><div className="flex-shrink-0 w-6 h-6 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg"><Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /></div><span className="text-sm text-slate-700 font-medium">{feature.replace(/_/g, ' ')}</span></div>)}</div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg"><Shield className="h-5 w-5 text-white" /></div><h3 className="text-2xl font-semibold text-slate-900" style={headingFont}>Details</h3></div>
          <dl className="space-y-6"><div><dt className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">Billing Cycle</dt><dd className="text-lg text-slate-900 font-medium">{subscription.billingCycle}</dd></div>
            <div className="border-t border-slate-200 pt-6"><dt className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-medium">Auto Renewal</dt><dd className="flex items-center gap-3">
              <span aria-hidden="true" className={`relative w-12 h-6 rounded-full ${subscription.autoRenew ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md ${subscription.autoRenew ? 'translate-x-6' : ''}`} /></span>
              <span className={`text-sm font-semibold ${subscription.autoRenew ? 'text-emerald-700' : 'text-slate-600'}`}>{subscription.autoRenew ? 'Enabled' : 'Disabled'}</span>
            </dd></div>
            <div className="border-t border-slate-200 pt-6"><a href="/subscription/manage" className="text-sm font-semibold text-slate-900 underline underline-offset-4">Manage Subscription</a></div>
          </dl>
        </div>
      </div>
    </section><CatalogHeading title="Manage Your Plan" subtitle="Upgrade to unlock more features" />
  </>;
}
