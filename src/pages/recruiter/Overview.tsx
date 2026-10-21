import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('RecruiterOverview');
import {
  UsersIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getDashboardData } from '@/features/analytics';
import { ActivityFeed } from '@/features/recruiter';
import { useRealtimeActivities } from '@/features/analytics/model/useRealtimeActivities';
import { trackSearchUsage } from '@/features/opportunities';
import { OrgSetupBanner, OrgSetupModal } from '@/components/recruitment/OrgSetupChecklist';
import { ssoClient } from '@/shared/api/ssoClient';

type SavedSearch = { id?: string; name: string; search_criteria?: { query?: string; skills?: string[]; location?: string; experience?: string } };
type DashboardAlert = { id: string; source?: string; type?: string; title: string; message: string; time?: string; urgent?: boolean };
type DashboardData = {
  kpis?: Record<string, number | null>;
  alerts?: DashboardAlert[];
  shortlists?: { id: string; name: string; candidates?: unknown[]; candidate_count?: number; created_date?: string }[];
  savedSearches?: (SavedSearch | string)[];
};
type SetupProgress = React.ComponentProps<typeof OrgSetupModal>['initialProgress'] & { banner_dismissed?: boolean };

const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';
const panelClass = 'min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm';

const KpiCard = ({ title, value, icon: Icon, trend, color = 'primary', lowerIsBetter = false, href }: {
  title: string; value: number | string; icon: typeof UsersIcon; trend?: number; color?: string; lowerIsBetter?: boolean; href: string;
}) => {
  const colorClasses: Record<string, string> = {
    primary: 'text-primary-700 bg-primary-50',
    success: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
  };
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend) && trend !== 0;
  const improving = lowerIsBetter ? (trend ?? 0) < 0 : (trend ?? 0) > 0;

  return (
    <Link to={href} className={`${panelClass} group flex flex-col p-4 transition-colors hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:p-5`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
        <ArrowUpRightIcon className="h-4 w-4 text-gray-400 group-hover:text-primary-600" aria-hidden="true" />
      </div>
      <p className="min-h-10 text-sm font-medium leading-5 text-gray-600">{title}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {hasTrend && <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${improving ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`} aria-label={`${Math.abs(trend!)}% ${trend! > 0 ? 'increase' : 'decrease'}`}>
          {trend! > 0 ? '+' : ''}{trend}%
        </span>}
      </div>
    </Link>
  );
};

const EmptyState = ({ icon: Icon, title, children, action }: { icon: typeof UsersIcon; title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center px-4 py-7 text-center">
    <div className="rounded-full bg-gray-50 p-3"><Icon className="h-6 w-6 text-gray-400" aria-hidden="true" /></div>
    <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
    <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">{children}</p>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

const AlertCard = ({ type, title, message, time, urgent = false, onActionClick }: DashboardAlert & { onActionClick: () => void }) => {
  const Icon = type === 'success' ? CheckCircleIcon : type === 'error' ? XCircleIcon : ExclamationTriangleIcon;
  return (
    <div className={`rounded-lg border p-4 ${urgent ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50/50'}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${type === 'success' ? 'text-emerald-600' : type === 'error' ? 'text-rose-600' : 'text-amber-600'}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{message}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {time && <p className="text-xs text-gray-500">{time}</p>}
            <button type="button" onClick={onActionClick} className={`${actionClass} -mr-2`} aria-label={`View details: ${title}`}>View details <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Overview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);

  // Org setup state
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [orgSetupComplete, setOrgSetupComplete] = useState(true); // Assume complete until we check
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [orgData, setOrgData] = useState<React.ComponentProps<typeof OrgSetupModal>['orgData'] | null>(null);

  // Real-time activities hook
  const { activities: realtimeActivities, isLoading: activitiesLoading, isError: activityError, refetch: refreshActivities } = useRealtimeActivities(15);

  // Show only 4 activities by default, all when expanded
  const displayedActivities = isActivityExpanded ? realtimeActivities : realtimeActivities.slice(0, 4);

  // Check if org setup should be shown (from location.state or API)
  useEffect(() => {
    const checkOrgSetupStatus = async () => {
      // Check if redirected from subscription with showOrgSetup flag
      const stateShowSetup = location.state?.showOrgSetup;

      if (stateShowSetup) {
        setShowOrgSetup(true);
        // Clear the state to prevent showing on refresh
        window.history.replaceState({}, document.title);
      }

      // Check org setup progress from new API (only if authenticated)
      if (!ssoClient.getAccessToken()) {
        return;
      }

      try {
        const response = await ssoClient.fetch('/api/recruitment/setup/progress');

        if (response.ok) {
          const data = await response.json() as { setup_progress: SetupProgress; orgData: React.ComponentProps<typeof OrgSetupModal>['orgData'] };

          // Check if setup is complete
          const setupProgress = data.setup_progress || {};
          const isComplete = setupProgress.step1_completed &&
            setupProgress.step2_completed &&
            (setupProgress.step3_completed || setupProgress.step3_skipped) &&
            setupProgress.step4_completed;

          setSetupProgress(setupProgress);
          setOrgData(data.orgData);
          setOrgSetupComplete(isComplete);
          setSetupDismissed(setupProgress.banner_dismissed || false);

          // Calculate completed steps
          const completed = [
            setupProgress.step1_completed,
            setupProgress.step2_completed,
            (setupProgress.step3_completed || setupProgress.step3_skipped),
            setupProgress.step4_completed
          ].filter(Boolean).length;

          setCompletedSteps(completed);
          setProgressPercentage(completed * 25);

          // Show banner if setup is incomplete and not dismissed
          if (!isComplete && !setupProgress.banner_dismissed) {
            setShowOrgSetup(true);
          }
        }
      } catch (error) {
        console.error('[Overview] Error checking org setup status:', error);
      }
    };

    checkOrgSetupStatus();
  }, [location.state]);

  const handleDismissSetup = async () => {
    try {
      await fetch('/api/recruitment/setup/dismiss-banner', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ssoClient.getAccessToken()}`,
        },
      });
      setSetupDismissed(true);
      setShowOrgSetup(false);
    } catch (error) {
      console.error('[Overview] Error dismissing setup:', error);
    }
  };

  const handleOpenModal = () => {
    setIsSetupModalOpen(true);
  };

  const handleSetupComplete = async () => {
    setOrgSetupComplete(true);
    setShowOrgSetup(false);
    setIsSetupModalOpen(false);

    // Refresh org setup data (only if authenticated)
    if (!ssoClient.getAccessToken()) return;

    try {
      const response = await ssoClient.fetch('/api/recruitment/setup/progress');

      if (response.ok) {
        const data = await response.json() as { setup_progress: SetupProgress; orgData: React.ComponentProps<typeof OrgSetupModal>['orgData'] };
        const setupProgress = data.setup_progress || {};

        setSetupProgress(setupProgress);
        setOrgData(data.orgData);
        setCompletedSteps(4);
        setProgressPercentage(100);
      }
    } catch (error) {
      console.error('[Overview] Error refreshing org data:', error);
    }
  };

  // Handle quick search click
  const handleQuickSearchClick = async (search: SavedSearch) => {
    const criteria = search.search_criteria || {};
    const params = new URLSearchParams();
    if (criteria.query) params.set('q', criteria.query);
    if (criteria.skills?.length) params.set('skills', criteria.skills.join(','));
    if (criteria.location) params.set('location', criteria.location);
    if (criteria.experience) params.set('experience', criteria.experience);
    navigate(`/recruitment/talent-pool?${params.toString()}`);
    if (search.id && !search.id.startsWith('default-')) {
      void trackSearchUsage(search.id).catch(error => logger.error('Error tracking quick search', error));
    }
  };

  // Handle alert action clicks
  const handleAlertAction = (alert: DashboardAlert) => {
    // Route based on alert source and ID
    const alertId = String(alert.id || '');
    const source = alert.source;

    // Handle by source - navigate to basic pages without advanced filters
    if (source === 'talent_pool' || alertId.startsWith('talent-pool')) {
      navigate('/recruitment/talent-pool');
    } else if (source === 'shortlists' || alertId.startsWith('shortlist')) {
      navigate('/recruitment/shortlists');
    } else if (source === 'interviews' || alertId.startsWith('interview')) {
      navigate('/recruitment/interviews');
    } else if (source === 'offers' || alertId.startsWith('offer')) {
      navigate('/recruitment/offers-decisions');
    } else if (source === 'pipelines' || alertId.startsWith('pipeline')) {
      navigate('/recruitment/pipelines');
    } else {
      // Fallback for legacy alert IDs - navigate to basic pages
      switch (alertId) {
        case 'verification-pending':
          navigate('/recruitment/talent-pool');
          break;
        case 'expiring-offers':
          navigate('/recruitment/offers-decisions');
          break;
        case 'positive-feedback':
          navigate('/recruitment/interviews');
          break;
        case 'upcoming-interviews':
          navigate('/recruitment/interviews');
          break;
        default:
      }
    }
  };

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await getDashboardData();
        if (!active) return;
        if (result.error || !result.data) setError(true);
        else setDashboardData(result.data);
      } catch (err) {
        logger.error('Error fetching dashboard data', err instanceof Error ? err : new Error(String(err)));
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchDashboardData();
    return () => { active = false; };
  }, [refreshKey]);

  const data = dashboardData;
  const alerts = data?.alerts || [];
  const shortlists = data?.shortlists || [];
  const searches = data?.savedSearches || [];
  const kpis = [
    { title: 'New profiles this week', key: 'newProfiles', trend: 'newProfilesTrend', icon: UsersIcon, color: 'primary', href: '/recruitment/talent-pool' },
    { title: 'Shortlisted candidates', key: 'shortlisted', trend: 'shortlistedTrend', icon: BookmarkIcon, color: 'success', href: '/recruitment/shortlists' },
    { title: 'Interviews scheduled', key: 'interviewsScheduled', trend: 'interviewsTrend', icon: CalendarDaysIcon, color: 'warning', href: '/recruitment/interviews' },
    { title: 'Offers extended', key: 'offersExtended', trend: 'offersTrend', icon: DocumentTextIcon, color: 'primary', href: '/recruitment/offers-decisions' },
    { title: 'Time to hire (days)', key: 'timeToHire', trend: 'timeToHireTrend', icon: ClockIcon, color: 'success', href: '/recruitment/analytics' },
  ];
  const sectionLoading = loading && !data;
  const sectionUnavailable = error && !data;
  const skeleton = <div className="space-y-3 p-5 motion-safe:animate-pulse" aria-label="Loading dashboard section" role="status"><div className="h-4 w-2/3 rounded bg-gray-100" /><div className="h-4 w-1/2 rounded bg-gray-100" /><div className="h-4 w-3/4 rounded bg-gray-100" /></div>;
  const unavailable = <p className="p-5 text-sm text-gray-500">This section is temporarily unavailable. Retry loading the dashboard.</p>;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Org Setup Banner */}
      {showOrgSetup && !orgSetupComplete && !setupDismissed && (
        <OrgSetupBanner
          completedSteps={completedSteps}
          totalSteps={4}
          progressPercentage={progressPercentage}
          onOpenModal={handleOpenModal}
          onDismiss={handleDismissSetup}
        />
      )}

      {/* Org Setup Modal */}
      {setupProgress && orgData && (
        <OrgSetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          onComplete={handleSetupComplete}
          initialProgress={{
            step1_completed: setupProgress.step1_completed,
            step2_completed: setupProgress.step2_completed,
            step3_completed: setupProgress.step3_completed,
            step3_skipped: setupProgress.step3_skipped,
            step4_completed: setupProgress.step4_completed,
          }}
          orgData={orgData}
        />
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-700">Recruitment workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Dashboard overview</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">Your hiring progress, priorities, and team activity in one place.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setRefreshKey(key => key + 1); void refreshActivities(); }} disabled={loading} className={`${actionClass} border border-gray-200 bg-white text-gray-600 disabled:cursor-wait disabled:opacity-60`}>
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />{loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/recruitment/talent-pool" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />Find candidates
          </Link>
        </div>
      </div>

      {error && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" /><div><p className="text-sm font-semibold text-amber-900">Couldn't load the dashboard</p><p className="mt-1 text-sm text-amber-800">{data ? 'Showing the last loaded data. Refresh to try again.' : 'Your hiring data is temporarily unavailable. Please try again.'}</p></div></div>
        <button type="button" onClick={() => setRefreshKey(key => key + 1)} className={`${actionClass} shrink-0 text-amber-900`}>Try again</button>
      </div>}

      <section aria-label="Hiring metrics" aria-busy={loading}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
          {kpis.map(metric => sectionLoading ? <div key={metric.key} className={`${panelClass} min-h-[184px] p-5 motion-safe:animate-pulse`}><div className="mb-4 h-10 w-10 rounded-lg bg-gray-100" /><div className="mb-3 h-4 w-3/4 rounded bg-gray-100" /><div className="h-8 w-12 rounded bg-gray-100" /></div> :
            <KpiCard key={metric.key} title={metric.title} value={sectionUnavailable ? '—' : data?.kpis?.[metric.key] ?? '—'} icon={metric.icon} trend={data?.kpis?.[metric.trend]} color={metric.color} lowerIsBetter={metric.key === 'timeToHire'} href={metric.href} />)}
        </div>
        {sectionLoading && <p className="sr-only" role="status">Loading hiring metrics…</p>}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <section className={panelClass} aria-labelledby="overview-tasks">
            <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <h2 id="overview-tasks" className="text-base font-semibold text-gray-900">Alerts & tasks</h2>
              {alerts.length > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{alerts.length} to review</span>}
            </div>
            {sectionLoading ? skeleton : sectionUnavailable ? unavailable : alerts.length ? <div className="space-y-3 p-5">{alerts.map(alert => <AlertCard key={alert.id} {...alert} onActionClick={() => handleAlertAction(alert)} />)}</div> :
              <EmptyState icon={CheckCircleIcon} title="You're all caught up">Upcoming tasks and hiring updates will appear here when they need your attention.</EmptyState>}
          </section>

          <section className={panelClass} aria-labelledby="overview-searches">
            <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
              <h2 id="overview-searches" className="text-base font-semibold text-gray-900">Quick searches</h2>
              <Link to="/recruitment/talent-pool" className={actionClass}>Browse talent <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            {sectionLoading ? skeleton : sectionUnavailable ? unavailable : searches.length ? <div className="flex flex-wrap gap-2 p-5">{searches.map((search, index) => {
              const item = typeof search === 'string' ? { id: `default-${index}`, name: search, search_criteria: { query: search } } : search;
              return <button type="button" key={item.id || index} onClick={() => handleQuickSearchClick(item)} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-left text-sm font-medium text-primary-800 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-words [overflow-wrap:anywhere]">{item.name}</span></button>;
            })}</div> : <EmptyState icon={MagnifyingGlassIcon} title="Your next great hire starts with a search">Save searches in the talent pool to quickly revisit the skills and experience you need.</EmptyState>}
          </section>

          <section className={panelClass} aria-labelledby="overview-shortlists">
            <div className="flex min-h-[72px] items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
              <h2 id="overview-shortlists" className="text-base font-semibold text-gray-900">Recent shortlists</h2>
              <Link to="/recruitment/shortlists" className={actionClass}>View all <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            {sectionLoading ? skeleton : sectionUnavailable ? unavailable : shortlists.length ? <ul className="divide-y divide-gray-100">{shortlists.map(shortlist => {
              const count = shortlist.candidates?.length ?? shortlist.candidate_count ?? 0;
              return <li key={shortlist.id}><Link to={`/recruitment/shortlists?q=${encodeURIComponent(shortlist.name)}`} className="group flex items-center justify-between gap-3 p-5 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"><div className="min-w-0"><p className="break-words text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">{shortlist.name}</p><p className="mt-1 text-xs text-gray-500">{count} {count === 1 ? 'candidate' : 'candidates'}{shortlist.created_date ? ` · ${shortlist.created_date}` : ''}</p></div><ArrowRightIcon className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-primary-600" aria-hidden="true" /><span className="sr-only">View shortlist</span></Link></li>;
            })}</ul> : <EmptyState icon={BookmarkIcon} title="Keep promising candidates together" action={<Link to="/recruitment/shortlists" className={actionClass}>Go to shortlists <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>}>Create a shortlist to organize candidates and collaborate with your hiring team.</EmptyState>}
          </section>
        </div>

        <section className={panelClass} aria-labelledby="overview-activity">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
            <h2 id="overview-activity" className="text-base font-semibold text-gray-900">Recent activity</h2>
            <Link to="/recruitment/activities" className={actionClass}>View all <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="p-5">{activityError?<div role="alert" className="text-sm text-red-800">Activity could not be loaded. <button type="button" onClick={()=>refreshActivities()} className="underline">Try again</button></div>:<ActivityFeed activities={displayedActivities} loading={activitiesLoading} />}</div>
          {realtimeActivities.length > 4 && <div className="border-t border-gray-100 px-5 py-2"><button type="button" aria-expanded={isActivityExpanded} onClick={() => setIsActivityExpanded(expanded => !expanded)} className={`${actionClass} w-full`}>{isActivityExpanded ? 'Show less' : 'Show more activity'}{isActivityExpanded ? <ChevronUpIcon className="h-4 w-4" aria-hidden="true" /> : <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />}</button></div>}
        </section>
      </div>
    </div>
  );
};

export default Overview;
