import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AcademicCapIcon, ArrowDownTrayIcon, ArrowPathIcon, ArrowRightIcon,
  ChartBarIcon, ChartPieIcon, CheckCircleIcon, ChevronDownIcon, ClockIcon,
  ExclamationTriangleIcon, SparklesIcon, StarIcon, UsersIcon,
} from '@heroicons/react/24/outline';
import { DateRangePicker } from '@/features/recruiter';
import { useRecruitmentFunnel } from '@/entities/user';
import { getRecruitmentFunnelStats, useAnalyticsKPIs } from '@/features/analytics';
import { useCoursePerformance } from '@/features/courses';
import { useDiversityData, useQualityMetrics } from '@/features/educator';
import HiringTrendChart from './analytics/HiringTrendChart';
import {
  downloadCSV, formatNumber, getQueryRange, parseAnalyticsParams, periodLabel,
  type AnalyticsRange, type ChartType, type ExportRow,
} from './analytics/model';

const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';
const buttonClass = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`;
const panelClass = 'min-w-0 rounded-xl border border-gray-200 bg-white shadow-sm';
const stageDefinitions = [
  { key: 'sourced', label: 'Sourced', color: 'bg-blue-500' },
  { key: 'screened', label: 'Screened', color: 'bg-cyan-500' },
  { key: 'interviewed', label: 'Interviewed', color: 'bg-amber-500' },
  { key: 'offered', label: 'Offered', color: 'bg-indigo-500' },
  { key: 'hired', label: 'Hired', color: 'bg-emerald-500' },
] as const;

function Panel({ id, title, description, action, children }: {
  id: string; title: string; description?: string; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-heading`} className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ title, children, icon: Icon = ChartBarIcon }: {
  title: string; children: ReactNode; icon?: typeof ChartBarIcon;
}) {
  return (
    <div className="flex flex-col items-center px-5 py-9 text-center">
      <div className="rounded-full bg-gray-50 p-3"><Icon className="h-6 w-6 text-gray-400" aria-hidden /></div>
      <p className="mt-3 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">{children}</p>
    </div>
  );
}

function DataState({ loading, error, empty, onRetry, emptyTitle, children }: {
  loading: boolean; error: boolean; empty: boolean; onRetry: () => void;
  emptyTitle: string; children: ReactNode;
}) {
  if (loading) return (
    <div role="status" aria-label="Loading analytics" className="space-y-4 p-5 motion-safe:animate-pulse">
      <span className="sr-only">Loading analytics…</span>
      {[75, 55, 65].map(width => <div key={width} className="h-5 rounded bg-gray-100" style={{ width: `${width}%` }} />)}
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-start gap-3 p-5" role="alert">
      <p className="text-sm leading-6 text-gray-600">This report couldn't be loaded. Please try again.</p>
      <button type="button" className={buttonClass} onClick={onRetry}><ArrowPathIcon className="h-4 w-4" aria-hidden />Try again</button>
    </div>
  );
  if (empty) return <Empty title={emptyTitle}>Try another date range or return as your hiring activity grows.</Empty>;
  return children;
}

function MetricCard({ title, value, icon: Icon, color, detail, trend }: {
  title: string; value: string; icon: typeof UsersIcon; color: string; detail: string; trend?: number;
}) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend) && trend !== 0;
  return (
    <div className={`${panelClass} p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" aria-hidden /></div>
        {hasTrend && <span className={`rounded-md px-2 py-1 text-xs font-semibold ${trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend > 0 ? '+' : ''}{formatNumber(trend)}%
        </span>}
      </div>
      <p className="min-h-10 text-sm font-medium leading-5 text-gray-600">{title}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">{hasTrend ? 'vs. previous period' : detail}</p>
    </div>
  );
}

function Distribution({ rows, unit = 'candidates' }: {
  rows: { name: string; count: number; percentage: number }[]; unit?: string;
}) {
  return (
    <ul className="space-y-5">
      {rows.map((row, index) => (
        <li key={`${row.name}-${index}`}>
          <div className="mb-2 flex items-start justify-between gap-4 text-sm">
            <span className="min-w-0 break-words font-medium text-gray-700 [overflow-wrap:anywhere]">{row.name}</span>
            <span className="shrink-0 text-right tabular-nums"><span className="font-semibold text-gray-900">{formatNumber(row.count)}</span><span className="ml-2 text-xs text-gray-500">{formatNumber(row.percentage)}%</span></span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden>
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(0, Math.min(100, row.percentage || 0))}%` }} />
          </div>
          <span className="sr-only">{row.count} {unit}, {row.percentage} percent</span>
        </li>
      ))}
    </ul>
  );
}

export default function Analytics() {
  const [params, setParams] = useSearchParams();
  const state = parseAnalyticsParams(params);
  const range = getQueryRange(state);
  const label = periodLabel(state);
  const [showChartData, setShowChartData] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [exported, setExported] = useState(false);

  const funnel = useRecruitmentFunnel(range, getRecruitmentFunnelStats);
  const kpis = useAnalyticsKPIs(range);
  const quality = useQualityMetrics(range);
  const courses = useCoursePerformance({ ...range, limit: 4 });
  const diversity = useDiversityData({ ...range, geoLimit: 4, collegesLimit: 4 });

  const queries = [funnel, kpis, quality, courses, diversity.geographic, diversity.colleges];
  const busy = queries.some(query => query.isFetching);
  const hasError = queries.some(query => query.isError);
  const metrics = kpis.data;
  const qualityData = quality.data;
  const hasHires = (metrics?.successfulHires ?? 0) > 0;
  const hasQuality = (qualityData?.totalHired ?? 0) > 0;
  const score = hasQuality && (qualityData?.avgAiScore ?? 0) > 0 ? qualityData!.avgAiScore : undefined;
  const stages = stageDefinitions.map(stage => ({ ...stage, count: funnel.data?.[stage.key] ?? 0 }));
  const totalInPipeline = stages.reduce((sum, stage) => sum + stage.count, 0);
  const trend = (funnel.data?.hiresTrend ?? []).map((hires, index) => ({ period: funnel.data?.trendLabels[index] || `Period ${index + 1}`, hires }));
  const hasTrend = trend.some(point => point.hires > 0);
  const trendHires = trend.reduce((sum, point) => sum + point.hires, 0);
  const locations = diversity.geographic.data ?? [];
  const colleges = diversity.colleges.data ?? [];
  const courseData = courses.data ?? [];

  function updateParams(changes: { range?: AnalyticsRange; chart?: ChartType; start?: string; end?: string }) {
    const next = new URLSearchParams(params);
    next.set('range', changes.range ?? state.range);
    next.set('chart', changes.chart ?? state.chart);
    if ((changes.range ?? state.range) === 'custom') {
      next.set('start', changes.start ?? state.start);
      next.set('end', changes.end ?? state.end);
    } else { next.delete('start'); next.delete('end'); }
    setParams(next);
    setExported(false);
  }

  function refresh() {
    void funnel.refetch(); void kpis.refetch(); void quality.refetch(); void courses.refetch();
    diversity.refetchAll();
    setExported(false);
  }

  // Every exported value comes from the same reports currently shown on screen.
  const rows: ExportRow[] = [];
  const add = (section: string, metric: string, value: number | undefined, unit = 'candidates', period = label) => {
    if (typeof value === 'number' && Number.isFinite(value)) rows.push({ Section: section, Metric: metric, Value: value, Unit: unit, Period: period });
  };
  if (metrics && !kpis.isError && !kpis.isFetching) {
    add('Overview', 'Total candidates', metrics.totalCandidates);
    add('Overview', 'Successful hires', metrics.successfulHires, 'hires');
    if (hasHires) add('Hiring speed', 'Average time to hire', metrics.timeToHire, 'days');
  }
  if (funnel.data && !funnel.isError && !funnel.isFetching) {
    stages.forEach(stage => add('Current pipeline', stage.label, stage.count, 'candidates', 'Current snapshot · all dates'));
    trend.forEach(point => add('Hiring trend', point.period, point.hires, 'hires'));
  }
  if (qualityData && !quality.isError && !quality.isFetching) {
    add('Candidate quality', 'Hired candidates', qualityData.totalHired);
    if (score !== undefined) add('Candidate quality', 'Average recorded score', score, 'score');
    if (hasQuality && qualityData.avgCgpa > 0) add('Candidate quality', 'Average CGPA', qualityData.avgCgpa, 'CGPA');
    if (hasQuality && qualityData.ageDemographics.averageAge > 0) add('Candidate quality', 'Average age', qualityData.ageDemographics.averageAge, 'years');
    if (hasQuality) {
      const gender = qualityData.genderDiversity;
      add('Reported gender', 'Male', gender.male); add('Reported gender', 'Female', gender.female); add('Reported gender', 'Other / unspecified', gender.other);
      qualityData.ageDemographics.ageRanges.forEach(group => add('Age distribution', group.range, group.count));
      qualityData.topCourses.forEach(course => add('Hired candidate courses', course.name, course.count));
    }
  }
  if (!diversity.geographic.isError && !diversity.geographic.isFetching) locations.forEach(location => add('Top locations', location.city, location.count));
  if (!diversity.colleges.isError && !diversity.colleges.isFetching) colleges.forEach(college => add('Leading colleges', college.name, college.count));
  if (!courses.isError && !courses.isFetching) courseData.forEach(course => {
    add('Course candidates', course.name, course.totalCandidates);
    add('Course hires', course.name, course.hiredCandidates, 'hires');
    add('Course success rate', course.name, course.successRate, 'percent');
  });

  function exportReport(section?: string) {
    setExportError(false);
    try {
      const selected = section ? rows.filter(row => row.Section === section) : rows;
      downloadCSV(selected, `recruitment_analytics_${section ? section.toLowerCase().replace(/\s+/g, '_') + '_' : ''}${state.range === 'custom' ? `${state.start}_${state.end}` : state.range}`);
      setExported(true);
    } catch { setExportError(true); }
  }

  const reportState = (query: { isFetching?: boolean; isLoading: boolean; isError: boolean; refetch: () => unknown }) => ({
    loading: query.isLoading || !!query.isFetching,
    error: query.isError,
    onRetry: () => { void query.refetch(); },
  });
  const insights: string[] = [];
  if (funnel.data && !funnel.isError && hasTrend) insights.push(`${formatNumber(trendHires)} hires recorded in ${label.toLowerCase()}.`);
  if (metrics && !kpis.isError && metrics.totalCandidates > 0) insights.push(`${formatNumber(metrics.totalCandidates)} candidates entered your pipeline in this period.`);
  if (colleges.length && !diversity.colleges.isError) insights.push(`${colleges[0].name} leads the reported colleges with ${formatNumber(colleges[0].count)} candidates.`);
  if (courseData.length && !courses.isError) {
    const topCourse = [...courseData].sort((a, b) => b.successRate - a.successRate)[0];
    if (topCourse.successRate > 0) insights.push(`${topCourse.name} has the highest hire rate among the displayed courses (${formatNumber(topCourse.successRate)}%).`);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-700">Recruitment workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Hiring analytics</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">Understand your pipeline, hiring outcomes, and talent sources.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" onClick={refresh} disabled={busy} className={buttonClass}><ArrowPathIcon className={`h-4 w-4 ${busy ? 'motion-safe:animate-spin' : ''}`} aria-hidden />{busy ? 'Refreshing…' : 'Refresh'}</button>
          <button type="button" onClick={() => exportReport()} disabled={busy || !rows.length} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}><ArrowDownTrayIcon className="h-4 w-4" aria-hidden />Export CSV</button>
        </div>
      </div>

      <div className={`${panelClass} flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Reporting period</span>
          <DateRangePicker startDate={state.start} endDate={state.end} preset={state.range} onRangeChange={(preset, start, end) => updateParams({ range: preset, start, end })} />
          {(state.range !== '30d' || state.chart !== 'line') && <button type="button" onClick={() => updateParams({ range: '30d', chart: 'line' })} className={`min-h-11 rounded-lg px-2 text-sm font-medium text-primary-700 hover:bg-primary-50 ${focusClass}`}>Reset view</button>}
        </div>
        <p className="text-xs leading-5 text-gray-500" role="status">{busy ? 'Updating reports…' : 'Date range applies to reports; pipeline stages show the current snapshot.'}</p>
      </div>

      {hasError && !busy && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"><p className="flex items-start gap-2 text-sm leading-6 text-amber-900"><ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />Some reports couldn't be loaded. Available reports are shown below.</p><button type="button" onClick={refresh} className={`${buttonClass} border-amber-200`}>Retry reports</button></div>}
      {exportError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">The report couldn't be downloaded. Please try exporting again.</p>}
      <span role="status" className="sr-only">{exported ? 'CSV report downloaded.' : ''}</span>

      <section aria-label="Key hiring metrics" aria-busy={kpis.isLoading || kpis.isFetching}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {kpis.isLoading || kpis.isFetching ? Array.from({ length: 4 }, (_, index) => <div key={index} className={`${panelClass} min-h-[200px] space-y-4 p-5 motion-safe:animate-pulse`}><div className="h-10 w-10 rounded-lg bg-gray-100" /><div className="h-4 w-3/4 rounded bg-gray-100" /><div className="h-8 w-16 rounded bg-gray-100" /></div>) : <>
            <MetricCard title="Total candidates" value={kpis.isError ? '—' : formatNumber(metrics?.totalCandidates)} icon={UsersIcon} color="bg-primary-50 text-primary-700" trend={metrics?.totalCandidatesTrend} detail="Entered the pipeline this period" />
            <MetricCard title="Successful hires" value={kpis.isError ? '—' : formatNumber(metrics?.successfulHires)} icon={CheckCircleIcon} color="bg-emerald-50 text-emerald-700" trend={metrics?.successfulHiresTrend} detail="Hires recorded this period" />
            <MetricCard title="Average time to hire" value={!kpis.isError && hasHires ? `${formatNumber(metrics?.timeToHire)} days` : '—'} icon={ClockIcon} color="bg-indigo-50 text-indigo-700" detail={!hasHires ? 'Available after your first recorded hire' : 'From sourcing to a recorded hire'} />
            <MetricCard title="Quality score" value={quality.isError || quality.isFetching ? '—' : formatNumber(score)} icon={StarIcon} color="bg-amber-50 text-amber-700" detail="Based on recorded hired-candidate scores" />
          </>}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <Panel id="hiring-trend" title="Hiring trend" description={`${label} · completed hires over time`} action={<div role="group" aria-label="Chart type" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">{(['line', 'area', 'column'] as const).map(type => <button key={type} type="button" aria-pressed={state.chart === type} onClick={() => updateParams({ chart: type })} className={`min-h-9 rounded-md px-3 py-2 text-xs font-semibold ${focusClass} ${state.chart === type ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{type === 'column' ? 'Columns' : type === 'line' ? 'Line' : 'Area'}</button>)}</div>}>
            <DataState {...reportState(funnel)} empty={!hasTrend} emptyTitle="No hires recorded in this period">
              <div className="p-4 sm:p-5">
                <div className="mb-3 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-gray-900">{formatNumber(trendHires)}</span><span className="text-sm text-gray-500">total hires</span></div>
                <HiringTrendChart data={trend} type={state.chart} />
              </div>
            </DataState>
            {funnel.data && !funnel.isError && !funnel.isFetching && trend.length > 0 && <div className="border-t border-gray-100 px-5 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" aria-expanded={showChartData} aria-controls="hiring-trend-data" onClick={() => setShowChartData(value => !value)} className={`inline-flex min-h-11 items-center gap-2 rounded-lg py-2 text-sm font-medium text-primary-700 ${focusClass}`}>{showChartData ? 'Hide chart data' : 'View chart data'}<ChevronDownIcon className={`h-4 w-4 ${showChartData ? 'rotate-180' : ''}`} aria-hidden /></button>
                <button type="button" onClick={() => exportReport('Hiring trend')} className={`inline-flex min-h-11 items-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-600 ${focusClass}`}><ArrowDownTrayIcon className="h-4 w-4" aria-hidden />Export trend</button>
              </div>
              {showChartData && <table id="hiring-trend-data" className="mb-3 w-full text-left text-sm"><caption className="sr-only">Hiring trend for {label}</caption><thead><tr className="border-b border-gray-100 text-gray-500"><th scope="col" className="py-3 font-medium">Period</th><th scope="col" className="py-3 text-right font-medium">Hires</th></tr></thead><tbody>{trend.map((point, index) => <tr key={`${point.period}-${index}`} className="border-b border-gray-50"><th scope="row" className="py-2 font-normal text-gray-600">{point.period}</th><td className="py-2 text-right font-medium tabular-nums text-gray-900">{formatNumber(point.hires)}</td></tr>)}</tbody></table>}
            </div>}
          </Panel>
        </div>
        <Panel id="pipeline-snapshot" title="Current pipeline" description="Candidates at each stage · all dates">
          <DataState {...reportState(funnel)} empty={totalInPipeline === 0} emptyTitle="Your pipeline is ready to grow">
            <div className="p-5"><p className="mb-5 text-sm text-gray-500"><span className="font-semibold text-gray-900">{formatNumber(totalInPipeline)}</span> candidates currently in the pipeline</p><ul className="space-y-5">{stages.map(stage => <li key={stage.key}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-gray-600">{stage.label}</span><span className="font-semibold tabular-nums text-gray-900">{formatNumber(stage.count)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-gray-100" aria-hidden><div className={`h-full rounded-full ${stage.color}`} style={{ width: `${totalInPipeline > 0 ? stage.count / totalInPipeline * 100 : 0}%` }} /></div></li>)}</ul></div>
          </DataState>
          {!funnel.isLoading && !funnel.isFetching && !funnel.isError && totalInPipeline === 0 && <div className="px-5 pb-5 text-center"><Link to="/recruitment/pipelines" className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary-700 hover:bg-primary-50 ${focusClass}`}>Go to pipelines<ArrowRightIcon className="h-4 w-4" aria-hidden /></Link></div>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <Panel id="candidate-quality" title="Candidate quality" description="Reported academic and demographic data for hired candidates in this period">
            <DataState {...reportState(quality)} empty={!hasQuality} emptyTitle="No hired-candidate data yet">
              {qualityData && hasQuality && <div className="space-y-6 p-5">
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[{ label: 'Hired candidates', value: formatNumber(qualityData.totalHired) }, { label: 'Average CGPA', value: formatNumber(qualityData.avgCgpa > 0 ? qualityData.avgCgpa : undefined) }, { label: 'Average age', value: qualityData.ageDemographics.averageAge > 0 ? `${formatNumber(qualityData.ageDemographics.averageAge)} years` : '—' }].map(metric => <div key={metric.label} className="rounded-lg border border-gray-100 bg-gray-50 p-4"><dt className="text-xs leading-5 text-gray-500">{metric.label}</dt><dd className="mt-2 text-xl font-semibold tabular-nums text-gray-900">{metric.value}</dd></div>)}
                </dl>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div><h3 className="mb-4 text-sm font-semibold text-gray-900">Age distribution</h3>{qualityData.ageDemographics.ageRanges.some(group => group.count > 0) ? <Distribution rows={qualityData.ageDemographics.ageRanges.map(group => ({ name: group.range, count: group.count, percentage: group.percentage }))} unit="hires" /> : <p className="text-sm leading-6 text-gray-500">No reported age data for this period.</p>}</div>
                  <div><h3 className="mb-4 text-sm font-semibold text-gray-900">Top courses / branches</h3>{qualityData.topCourses.length > 0 ? <Distribution rows={qualityData.topCourses} unit="hires" /> : <p className="text-sm leading-6 text-gray-500">No reported course data for this period.</p>}</div>
                </div>
                <div className="border-t border-gray-100 pt-4"><h3 className="mb-3 text-sm font-semibold text-gray-900">Reported gender</h3><dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">{[{ label: 'Male', count: qualityData.genderDiversity.male }, { label: 'Female', count: qualityData.genderDiversity.female }, { label: 'Other / unspecified', count: qualityData.genderDiversity.other }].map(gender => <div key={gender.label} className="flex items-center gap-2"><dt className="text-gray-500">{gender.label}</dt><dd className="font-semibold tabular-nums text-gray-900">{formatNumber(gender.count)}</dd></div>)}</dl></div>
              </div>}
            </DataState>
          </Panel>
        </div>
        <Panel id="hiring-speed" title="Hiring speed" description="Time from sourcing to a recorded hire">
          <DataState {...reportState(kpis)} empty={!hasHires} emptyTitle="Hiring speed is not available yet">
            <div className="p-5"><div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-700"><ClockIcon className="h-6 w-6" aria-hidden /></div><p className="text-3xl font-semibold tabular-nums text-gray-900">{formatNumber(metrics?.timeToHire)} <span className="text-base font-medium text-gray-500">days</span></p><p className="mt-2 text-sm leading-6 text-gray-500">Average time to hire for {formatNumber(metrics?.successfulHires)} recorded hires in this period.</p></div>
          </DataState>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel id="top-locations" title="Top locations" description="Up to four regions represented by candidates added in this period">
          <DataState loading={diversity.geographic.isLoading || diversity.geographic.isFetching} error={diversity.geographic.isError} onRetry={diversity.refetchAll} empty={!locations.length} emptyTitle="No location data for this period">
            <div className="p-5"><Distribution rows={locations.map(location => ({ name: location.city, count: location.count, percentage: location.percentage }))} /></div>
          </DataState>
        </Panel>
        <Panel id="leading-colleges" title="Leading colleges" description="Up to four colleges represented by candidates added in this period">
          <DataState loading={diversity.colleges.isLoading || diversity.colleges.isFetching} error={diversity.colleges.isError} onRetry={diversity.refetchAll} empty={!colleges.length} emptyTitle="No college data for this period">
            <div className="p-5"><Distribution rows={colleges} /></div>
          </DataState>
        </Panel>
        <Panel id="course-performance" title="Course performance" description="Hiring outcomes for the courses represented in this period">
          <DataState {...reportState(courses)} empty={!courseData.length} emptyTitle="No course outcomes for this period">
            <ul className="divide-y divide-gray-100">{courseData.map((course, index) => <li key={`${course.name}-${index}`} className="p-5"><div className="flex items-start gap-3"><AcademicCapIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden /><h3 className="min-w-0 break-words text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">{course.name}</h3></div><dl className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-500"><div><dt>Candidates</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{formatNumber(course.totalCandidates)}</dd></div><div><dt>Hired</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-emerald-700">{formatNumber(course.hiredCandidates)}</dd></div><div><dt>Hire rate</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-primary-700">{formatNumber(course.successRate)}%</dd></div></dl></li>)}</ul>
          </DataState>
        </Panel>
        <Panel id="key-insights" title="Key insights" description="Highlights from the available reports">
          {busy ? <div className="space-y-3 p-5 motion-safe:animate-pulse" role="status" aria-label="Loading insights"><div className="h-4 rounded bg-gray-100" /><div className="h-4 w-3/4 rounded bg-gray-100" /></div> : insights.length > 0 ? <ul className="space-y-4 p-5">{insights.map(insight => <li key={insight} className="flex items-start gap-3 text-sm leading-6 text-gray-600"><SparklesIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" aria-hidden /><p className="min-w-0 break-words [overflow-wrap:anywhere]">{insight}</p></li>)}</ul> : hasError ? <p className="p-5 text-sm leading-6 text-gray-500">Insights will update when your reports are available.</p> : <Empty title="Insights will grow with your pipeline" icon={ChartPieIcon}>Your hiring activity will reveal useful patterns as candidates move through the pipeline.</Empty>}
        </Panel>
      </div>
      <p className="text-xs leading-5 text-gray-500">A dash means a metric isn't available yet. Exports include available report data and each metric's reporting period.</p>
    </div>
  );
}
