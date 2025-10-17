import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MapPinIcon,
  AcademicCapIcon,
  TrophyIcon,
  CalendarIcon,
  SparklesIcon,
  BoltIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { candidates } from '../../data/sampleData';
import {
  SkeletonCard,
  SkeletonChart,
  EmptyState,
  ExportButton,
  InfoIcon,
  DrillDownModal,
  SectionHeaderWithActions
} from '../../components/Recruiter/components/AnalyticsComponents';
import { TrendLineChart, AreaChart, ColumnChart, BarChart, ProgressRing, Sparkline as AdvancedSparkline } from '../../components/Recruiter/components/AdvancedCharts';
import { exportSectionToCSV, exportComprehensiveAnalytics } from '../../utils/exportUtils';
import { getDataForPeriod, getPeriodDisplayName } from '../../utils/mockDataGenerator';

// Phase 1: Import new components
import AdvancedFilters from '../../components/Recruiter/components/AdvancedFilters';
import DateRangePicker from '../../components/Recruiter/components/DateRangePicker';
import ChartDownloadButton from '../../components/ChartDownloadButton';
import { AnalyticsFilters } from '../../types/recruiter';
import { useRecruitmentFunnel } from '../../hooks/useRecruitmentFunnel';
import { useAnalyticsKPIs } from '../../hooks/useAnalyticsKPIs';
import { useTopHiringColleges } from '../../hooks/useTopHiringColleges';
import type { FunnelRangePreset } from '../../services/analyticsService';

// Enhanced KPI Card with trend indicator
interface KpiCardProps {
  title: string | React.ReactNode;
  value: number | string;
  icon: any;
  iconColor: string;
  iconBg: string;
  trend?: number;
  trendLabel?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, iconColor, iconBg, trend, trendLabel }) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  const showTrend = trend !== undefined && trend !== 0;
  
  return (
    <div className="group bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200 relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {showTrend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${
            isPositive ? 'bg-green-50 text-green-700' : isNegative ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
          }`}>
            {isPositive && <ArrowUpIcon className="h-3 w-3" />}
            {isNegative && <ArrowDownIcon className="h-3 w-3" />}
            <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{title}</div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{trendLabel}</p>
      </div>
    </div>
  );
};

// Simple horizontal bar used in charts without external libs
const HBar = ({ percent, color = 'primary' }: { percent: number; color?: 'primary' | 'success' | 'warning' | 'danger' }) => {
  const colors: Record<string, string> = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500'
  };
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="w-full bg-gray-100 h-3 rounded">
      <div className={`${colors[color]} h-3 rounded`} style={{ width: `${p}%` }} />
    </div>
  );
};

// Tiny sparkline using inline SVG (no deps)
const Sparkline = ({ points, color = '#6366F1' }: { points: number[]; color?: string }) => {
  if (!points.length) return null;
  const w = 140;
  const h = 36;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = (v: number) => (max === min ? h / 2 : h - ((v - min) / (max - min)) * h);
  const step = w / (points.length - 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${norm(p)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

const SectionHeader: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    {right}
  </div>
);

const Analytics: React.FC = () => {
  // URL Parameters for bookmarkable state
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'ytd' | 'custom'>(
    (searchParams.get('range') as any) || '30d'
  );
  const [loading, setLoading] = useState(false);
  const [drillDownModal, setDrillDownModal] = useState<{ isOpen: boolean; title: string; data: any }>(
    { isOpen: false, title: '', data: null }
  );
  const [chartType, setChartType] = useState<'line' | 'area' | 'column'>(
    (searchParams.get('chart') as any) || 'line'
  );

  // Phase 1: Advanced Filters State
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      preset: '30d',
      startDate: '',
      endDate: ''
    },
    departments: [],
    jobLevels: [],
    sources: [],
    skills: [],
    locations: [],
    recruiters: []
  });

  // Get dynamic data based on selected period and filters (for sections other than funnel)
  const periodData = useMemo(() => {
    const baseData = getDataForPeriod(range === 'custom' ? '30d' : range);
    // NOTE: Keeping mock transformations for non-funnel sections to avoid regressions.
    return baseData;
  }, [range]);
  
  const periodName = useMemo(() => getPeriodDisplayName(range === 'custom' ? '30d' : range), [range]);

  // Live Funnel from DB via React Query + Realtime
  const funnelPreset = (range as FunnelRangePreset) || '30d';
  const { data: liveFunnel } = useRecruitmentFunnel({
    preset: funnelPreset,
    startDate: filters.dateRange.startDate || undefined,
    endDate: filters.dateRange.endDate || undefined,
  });

  // Live KPI Metrics from DB
  const { data: kpiMetrics, isLoading: kpiLoading } = useAnalyticsKPIs({
    preset: funnelPreset,
    startDate: filters.dateRange.startDate || undefined,
    endDate: filters.dateRange.endDate || undefined,
  });

  // Live Top Hiring Colleges from DB
  const { data: topColleges, isLoading: collegesLoading } = useTopHiringColleges({
    preset: funnelPreset,
    startDate: filters.dateRange.startDate || undefined,
    endDate: filters.dateRange.endDate || undefined,
    limit: 4,
  });

  const trendLabels = liveFunnel?.trendLabels || [];

  // Update URL when filters change
  useEffect(() => {
    const params: any = { range, chart: chartType };
    setSearchParams(params);
  }, [range, chartType]);


  // Drill-down handlers
  const handleDrillDown = (title: string, data: any) => {
    setDrillDownModal({ isOpen: true, title, data });
  };

  // Phase 1: Filter handlers
  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
    // In production, trigger data refetch with filters
    console.log('Filters changed:', newFilters);
  };

  const handleFiltersReset = () => {
    setFilters({
      dateRange: { preset: '30d', startDate: '', endDate: '' },
      departments: [],
      jobLevels: [],
      sources: [],
      skills: [],
      locations: [],
      recruiters: []
    });
    setRange('30d');
  };

  const handleDateRangeChange = (preset: '7d' | '30d' | '90d' | 'ytd' | 'custom', startDate?: string, endDate?: string) => {
    setRange(preset);
    setFilters({
      ...filters,
      dateRange: { preset, startDate: startDate || '', endDate: endDate || '' }
    });
  };

  // Phase 1: Export handler
  const handleComprehensiveExport = () => {
    exportComprehensiveAnalytics({
      funnel: periodData.funnel,
      quality: periodData.qualityMetrics,
      speed: periodData.speedMetrics,
      geography: periodData.geography,
      attribution: periodData.attribution
    }, 'excel');
  };

  // Calculate funnel stages from live data (without conversions)
  const funnelStages = useMemo(() => {
    const sourced = liveFunnel?.sourced || 0;
    const screened = liveFunnel?.screened || 0;
    const interviewed = liveFunnel?.interviewed || 0;
    const offered = liveFunnel?.offered || 0;
    const hired = liveFunnel?.hired || 0;
    return [
      { key: 'sourced', label: 'Sourced', value: sourced, color: 'bg-gray-600' },
      { key: 'screened', label: 'Screened', value: screened, color: 'bg-blue-500' },
      { key: 'interviewed', label: 'Interviewed', value: interviewed, color: 'bg-yellow-500' },
      { key: 'offered', label: 'Offered', value: offered, color: 'bg-green-500' },
      { key: 'hired', label: 'Hired', value: hired, color: 'bg-purple-600' }
    ];
  }, [liveFunnel]);

  const maxFunnel = Math.max(1, ...funnelStages.map((s) => s.value));

  return (
    <div className="bg-gray-50 min-h-screen -m-6">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 sticky top-0 z-50 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Phase 1: Date Range Picker */}
            <DateRangePicker
              startDate={filters.dateRange.startDate || ''}
              endDate={filters.dateRange.endDate || ''}
              preset={filters.dateRange.preset || '30d'}
              onRangeChange={handleDateRangeChange}
            />
            
            {/* Phase 1: Advanced Filters */}
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleFiltersReset}
            />
            
            {/* Phase 1: Comprehensive Export */}
            <button
              onClick={handleComprehensiveExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="px-8 pt-4 pb-20 md:pb-6 space-y-5">
        {/* KPI Cards */}
        {loading || kpiLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            title={
              <div className="flex items-center gap-2">
                <span>Total Candidates</span>
                <InfoIcon content="Total number of candidates who entered the recruitment pipeline in the selected period" />
              </div>
            }
            value={kpiMetrics?.totalCandidates ?? 0}
            icon={UsersIcon}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            trend={kpiMetrics?.totalCandidatesTrend ?? 0}
            trendLabel="from last period"
          />
          <KpiCard
            title={
              <div className="flex items-center gap-2">
                <span>Successful Hires</span>
                <InfoIcon content="Number of candidates successfully hired and onboarded" />
              </div>
            }
            value={kpiMetrics?.successfulHires ?? 0}
            icon={CheckCircleIcon}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            trend={kpiMetrics?.successfulHiresTrend ?? 0}
            trendLabel="from last period"
          />
          <KpiCard
            title={
              <div className="flex items-center gap-2">
                <span>Time to Hire</span>
                <InfoIcon content="Average number of days from candidate sourcing to hiring" />
              </div>
            }
            value={`${kpiMetrics?.timeToHire ?? 23} days`}
            icon={ClockIcon}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            trend={kpiMetrics?.timeToHireTrend ?? 0}
            trendLabel={kpiMetrics?.timeToHireTrend && kpiMetrics.timeToHireTrend < 0 ? 'faster than last period' : 'from last period'}
          />
          <KpiCard
            title={
              <div className="flex items-center gap-2">
                <span>Quality Score</span>
                <InfoIcon content="Average AI-powered quality score of hired candidates" />
              </div>
            }
            value={kpiMetrics?.qualityScore ?? 85.2}
            icon={StarIcon}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-50"
            trend={kpiMetrics?.qualityScoreTrend ?? 0}
            trendLabel="from last period"
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Funnel */}
        <div className="lg:col-span-2">
          <div id="recruitment-funnel-section" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <SectionHeaderWithActions
              title="Recruitment Funnel"
              description="Track candidates through each stage of your hiring process"
              actions={
                <div className="flex items-center gap-2">
                  <ChartDownloadButton
                    chartId="recruitment-funnel-section"
                    chartName="Recruitment_Funnel"
                    data={funnelStages}
                    compact
                  />
                  <ExportButton 
                    onClick={() => exportSectionToCSV('Recruitment Funnel', funnelStages)} 
                    label="Export CSV"
                  />
                </div>
              }
            />
            {/* Trend visualization */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-600">{periodName} Hiring Trend</p>
                
                {/* Chart Type Selector */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-300 shadow-sm">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      chartType === 'line'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Line Chart"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      chartType === 'area'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Area Chart"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 21h18v-2L18 14l-3 3-6-6-6 6v4z" opacity="0.5" />
                      <path d="M3 21l6-6 6 6 3-3 3 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setChartType('column')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      chartType === 'column'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Column Chart"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="14" width="3" height="7" rx="1" />
                      <rect x="10" y="10" width="3" height="11" rx="1" />
                      <rect x="16" y="6" width="3" height="15" rx="1" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Render selected chart type */}
              {chartType === 'line' && (
                <TrendLineChart 
                  data={liveFunnel?.hiresTrend || []}
                  labels={trendLabels}
                  height={150}
                />
              )}
              {chartType === 'area' && (
                <AreaChart 
                  data={liveFunnel?.hiresTrend || []}
                  labels={trendLabels}
                  height={150}
                />
              )}
              {chartType === 'column' && (
                <ColumnChart 
                  data={liveFunnel?.hiresTrend || []}
                  labels={trendLabels}
                  height={150}
                />
              )}
            </div>
            <div className="space-y-4">
              {funnelStages.map((stage, idx) => (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                    <span className="text-sm font-bold text-gray-900">{stage.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className={`${stage.color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${(stage.value / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div>
          <div id="quality-metrics-section" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Quality Metrics</h2>
              <ChartDownloadButton
                chartId="quality-metrics-section"
                chartName="Quality_Metrics"
                data={[
                  { metric: 'External Audited %', value: periodData.qualityMetrics.external_audited_percentage },
                  { metric: 'Avg AI Score (Hired)', value: periodData.qualityMetrics.avg_ai_score_hired },
                  { metric: 'Rubric Pass Rate %', value: periodData.qualityMetrics.rubric_pass_rate }
                ]}
                compact
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">External Audited Candidates</span>
                  <span className="text-lg font-bold text-orange-600">{periodData.qualityMetrics.external_audited_percentage}%</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Premium quality candidates</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average AI Score (Hired)</span>
                  <span className="text-lg font-bold text-blue-600">{periodData.qualityMetrics.avg_ai_score_hired}</span>
                </div>
                <p className="text-xs text-green-600">Quality of successful hires</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Interview Rubric Pass Rate</span>
                  <span className="text-lg font-bold text-indigo-600">{periodData.qualityMetrics.rubric_pass_rate}%</span>
                </div>
                <p className="text-xs text-blue-600">Candidates meeting interview standards</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-3">Top Skills in Hired Candidates</p>
                <div className="flex flex-wrap gap-2">
                  {periodData.qualityMetrics.top_skills_hired.map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
                      {skill}
                    </span>
                  ))}
                  <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200">
                    AutoCAD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Analytics */}
      <div id="speed-analytics-section" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Speed Analytics</h2>
          <ChartDownloadButton
            chartId="speed-analytics-section"
            chartName="Speed_Analytics"
            data={[
              { metric: 'Time to First Response', days: periodData.speedMetrics.median_time_to_first_response },
              { metric: 'Time to Hire', days: periodData.speedMetrics.median_time_to_hire },
              { metric: 'Interview to Offer', days: periodData.speedMetrics.avg_interview_to_offer },
              { metric: 'Fastest Hire', days: periodData.speedMetrics.fastest_hire }
            ]}
            compact
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 mb-3">
              <ClockIcon className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{periodData.speedMetrics.median_time_to_first_response} days</p>
            <p className="text-xs font-medium text-gray-600">Time to First Response</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-green-100 mb-3">
              <CheckCircleIcon className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{periodData.speedMetrics.median_time_to_hire} days</p>
            <p className="text-xs font-medium text-gray-600">Time to Hire</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-yellow-100 mb-3">
              <CalendarIcon className="h-7 w-7 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{periodData.speedMetrics.avg_interview_to_offer} days</p>
            <p className="text-xs font-medium text-gray-600">Interview to Offer</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-100 mb-3">
              <BoltIcon className="h-7 w-7 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{periodData.speedMetrics.fastest_hire} days</p>
            <p className="text-xs font-medium text-gray-600">Fastest Hire</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-2 text-sm">
          <SparklesIcon className="h-5 w-5 text-green-600" />
          <span className="text-gray-700">Process Efficiency</span>
          <span className="font-semibold text-green-600">28% faster than industry average (25 days)</span>
        </div>
      </div>

      {/* Diversity & Geography Section */}
      <div id="geography-section" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Diversity & Geography</h2>
            <p className="text-sm text-gray-600 mt-1">Understanding where your talent comes from</p>
          </div>
          <ChartDownloadButton
            chartId="geography-section"
            chartName="Geography_Analysis"
            data={periodData.geography}
            compact
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Geographic Distribution */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
            <div className="space-y-4">
              {periodData.geography.locations.map((l: any) => (
                <div key={l.city}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{l.city}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">({l.percentage}%)</span>
                      <span className="text-sm font-bold text-gray-900">{l.count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${l.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Total Hires: <span className="font-bold text-gray-900">{periodData.funnel.hired}</span></p>
            </div>
          </div>

          {/* Top Hiring Colleges */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Hiring Colleges</h3>
            {collegesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : topColleges && topColleges.length > 0 ? (
              <>
                <div className="space-y-3">
                  {topColleges.map((c, idx) => (
                    <div key={c.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-sm text-gray-700">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${c.percentage}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-6 text-right">{c.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Diversity Index</p>
                  <p className="text-sm text-blue-900 mt-1">Good distribution across {topColleges.length} institutions</p>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No college data available for this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attribution Analysis */}
      <div id="attribution-section" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Attribution Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Which programs and events yield the best hires</p>
          </div>
          <ChartDownloadButton
            chartId="attribution-section"
            chartName="Attribution_Analysis"
            data={periodData.attribution}
            compact
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hackathon Performance */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Hackathon Performance</h3>
            <div className="space-y-3">
              {periodData.attribution.hackathons.map((h: any) => (
                <div key={h.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrophyIcon className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-900">{h.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Applications</p>
                      <p className="text-lg font-bold text-gray-900">{h.applications}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hires</p>
                      <p className="text-lg font-bold text-green-600">{h.hires}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="text-lg font-bold text-purple-600">{((h.hires / h.applications) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Performance */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Course Performance</h3>
            <div className="space-y-3">
              {periodData.attribution.courses.map((c: any) => (
                <div key={c.name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Candidates</p>
                      <p className="text-lg font-bold text-gray-900">{c.applications}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hires</p>
                      <p className="text-lg font-bold text-green-600">{c.hires}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="text-lg font-bold text-indigo-600">{((c.hires / c.applications) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Executive Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-yellow-100 mb-3">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{periodData.qualityMetrics.external_audited_percentage}%</p>
            <p className="text-xs font-medium text-gray-600">Premium Quality</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-green-100 mb-3">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{periodData.speedMetrics.median_time_to_hire}d</p>
            <p className="text-xs font-medium text-gray-600">Avg Time to Hire</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-100 mb-3">
              <MapPinIcon className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">4</p>
            <p className="text-xs font-medium text-gray-600">Cities Covered</p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{periodData.qualityMetrics.external_audited_percentage}% of hires are externally audited</span> (above industry average)
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">18-day hiring process is 28% faster</span> than competitors
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Top performing course: GMP with 6.7% success rate</span>
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Geographic diversity across 4 major cities</span>
            </p>
          </li>
        </ul>
      </div>

        {/* Drill-down Modal */}
        <DrillDownModal
          isOpen={drillDownModal.isOpen}
          onClose={() => setDrillDownModal({ isOpen: false, title: '', data: null })}
          title={drillDownModal.title}
        >
          {drillDownModal.data && Array.isArray(drillDownModal.data) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  Showing {drillDownModal.data.length} {drillDownModal.data.length === 1 ? 'candidate' : 'candidates'}
                </p>
                <ExportButton 
                  onClick={() => exportSectionToCSV(drillDownModal.title, drillDownModal.data)}
                  label="Export List"
                  variant="primary"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {drillDownModal.data.map((candidate: any) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{candidate.college}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{candidate.location}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-semibold">{candidate.ai_score_overall}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DrillDownModal>
      </div>
    </div>
  );
};

export default Analytics;
