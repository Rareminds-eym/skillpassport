/**
 * Analytics Dashboard Types & Interfaces
 * Comprehensive type definitions for recruitment analytics
 */

// ============================================================================
// Date Range & Filter Types
// ============================================================================

export type DateRangePreset =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'year_to_date'
  | 'all_time'
  | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from: string | null; // ISO date string
  to: string | null; // ISO date string
}

export interface FilterState {
  dateRange: DateRange;
  departments: string[];
  locations: string[];
  jobTypes: string[];
  recruiters: string[];
  status?: string[];
  priority?: string[];
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: string;
  disabled?: boolean;
}

// ============================================================================
// Metric & Trend Types
// ============================================================================

export interface TrendIndicator {
  value: number; // percentage change
  label: string; // e.g., "vs last month"
  isPositive: boolean;
  comparisonPeriod?: string;
}

export interface MetricData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendIndicator;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
}

// ============================================================================
// Overview Tab Types
// ============================================================================

export interface OverviewMetrics {
  activeJobs: {
    count: number;
    trend: TrendIndicator;
  };
  totalPipeline: {
    count: number;
    trend: TrendIndicator;
  };
  hiresThisMonth: {
    count: number;
    trend: TrendIndicator;
  };
  avgTimeToHire: {
    days: number;
    trend: TrendIndicator;
  };
}

export interface PipelineStageData {
  stage: string;
  count: number;
  conversion?: number; // percentage
  avgDays?: number;
}

export interface HiringTrendPoint {
  date: string; // ISO date or month label
  jobs: number;
  candidates: number;
  hires: number;
}

export interface ActionItem {
  id: string;
  type: 'overdue_candidates' | 'expiring_invitations' | 'overdue_requisitions' | 'past_deadline_jobs';
  title: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  link?: string;
}

export interface QuickStats {
  jobsByStatus: {
    active: number;
    draft: number;
    closed: number;
    paused: number;
  };
  topDepartment: {
    name: string;
    count: number;
  };
  topLocation: {
    name: string;
    count: number;
  };
}

export interface OverviewData {
  metrics: OverviewMetrics;
  pipelineFunnel: PipelineStageData[];
  hiringTrend: HiringTrendPoint[];
  actionItems: ActionItem[];
  quickStats: QuickStats;
}

// ============================================================================
// Pipeline Tab Types
// ============================================================================

export interface PipelineMetrics {
  totalCandidates: {
    count: number;
    trend: TrendIndicator;
  };
  activeCandidates: {
    count: number;
    percentage: number;
  };
  overallConversion: {
    rate: number; // percentage
    trend: TrendIndicator;
  };
  avgStageTime: {
    days: number;
    trend: TrendIndicator;
  };
}

export interface StageConversion {
  fromStage: string;
  toStage: string;
  rate: number; // percentage
  count: number;
  totalAttempts: number;
}

export interface PipelineBottleneck {
  stage: string;
  issue: 'high_dropout' | 'slow_movement' | 'stuck_candidates';
  metric: number; // dropout percentage or avg days
  count: number;
  severity: 'high' | 'medium' | 'low';
}

export interface PipelineData {
  metrics: PipelineMetrics;
  stageDistribution: PipelineStageData[];
  conversions: StageConversion[];
  bottlenecks: PipelineBottleneck[];
}

// ============================================================================
// Jobs Tab Types
// ============================================================================

export interface JobPerformance {
  id: string;
  title: string;
  department: string;
  location: string;
  status: 'active' | 'draft' | 'closed' | 'paused';
  applicationsCount: number;
  viewsCount: number;
  applicationRate: number; // percentage
  postedDate: string;
  closingDate: string | null;
  daysOpen: number;
  daysUntilClosing: number | null;
}

export interface RequisitionStatus {
  active: number;
  filled: number;
  onHold: number;
  cancelled: number;
  pastTargetDate: number;
  avgFillTimeDays: number;
}

export interface DepartmentDistribution {
  department: string;
  count: number;
  percentage: number;
}

export interface LocationDistribution {
  location: string;
  count: number;
  percentage: number;
  type: 'remote' | 'hybrid' | 'onsite';
}

export interface JobsData {
  jobPerformance: JobPerformance[];
  requisitionStatus: RequisitionStatus;
  departmentDistribution: DepartmentDistribution[];
  locationDistribution: LocationDistribution[];
  totalJobs: number;
}

// ============================================================================
// Team Tab Types
// ============================================================================

export interface RecruiterPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  candidatesSourced: number;
  candidatesHired: number;
  successRate: number; // percentage
  avgTimeToHire: number; // days
  qualityScore: number; // 0-100
}

export interface TeamActivityDay {
  date: string; // ISO date
  actions: number;
  level: 'high' | 'medium' | 'low' | 'off';
}

export interface RecruiterActivity {
  recruiterId: string;
  recruiterName: string;
  activityByDay: TeamActivityDay[];
}

export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number;
  admins: number;
  recruiters: number;
  inactiveMembers: number;
  pendingInvitations: number;
  totalCandidatesSourced: number;
  totalCandidatesHired: number;
  avgTimeToHire: number;
  avgQualityScore: number;
  successRate: number;
}

export interface TeamData {
  metrics: TeamMetrics;
  performance: RecruiterPerformance[];
  activityHeatmap: RecruiterActivity[];
  topPerformers: RecruiterPerformance[];
}

// ============================================================================
// Trends Tab Types
// ============================================================================

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface TrendDataPoint {
  date: string; // ISO date or label
  jobsPosted: number;
  candidatesAdded: number;
  hires: number;
  avgTimeToHire: number;
  conversionRate: number;
  applicationRate: number;
}

export interface ComparisonPeriod {
  current: TrendDataPoint[];
  comparison: TrendDataPoint[];
  comparisonLabel: string;
}

export interface MonthOverMonth {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage
  isPositive: boolean;
}

export interface TrendsData {
  trendData: TrendDataPoint[];
  timeToHireTrend: Array<{
    date: string;
    avg: number;
    min: number;
    max: number;
  }>;
  monthOverMonth: MonthOverMonth[];
  yearOverYear: MonthOverMonth[];
  comparison?: ComparisonPeriod;
}

// ============================================================================
// Insights Tab Types
// ============================================================================

export interface SourceEffectiveness {
  source: string;
  candidatesSourced: number;
  candidatesHired: number;
  successRate: number; // percentage
  avgTimeToHire: number;
  roi: number; // 0-100 score
}

export interface RejectionReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface RejectionAnalysis {
  topReasons: RejectionReason[];
  rejectionsByStage: {
    stage: string;
    count: number;
    percentage: number;
  }[];
  totalRejections: number;
}

export interface InvitationAnalytics {
  totalSent: number;
  accepted: number;
  pending: number;
  expired: number;
  acceptanceRate: number; // percentage
  avgAcceptanceTimeDays: number;
  bestDayToSend: string;
}

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'action_required' | 'recommendation';
  title: string;
  description: string;
  metric?: number;
  icon?: string;
}

export interface InsightsData {
  performanceHighlights: Insight[];
  sourceEffectiveness: SourceEffectiveness[];
  rejectionAnalysis: RejectionAnalysis;
  invitationAnalytics: InvitationAnalytics;
  recommendations: Insight[];
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: any; // Allow additional properties for multi-series
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'funnel' | 'heatmap';
  data: ChartDataPoint[];
  xAxisKey?: string;
  yAxisKey?: string | string[];
  colors?: string[];
  height?: number;
  responsive?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  includeTables: boolean;
  tabs?: string[]; // specific tabs to export
  filters: FilterState;
}

// ============================================================================
// Saved Filter Presets
// ============================================================================

export interface SavedFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  createdBy: string;
  createdAt: string;
  isDefault?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  trend?: TrendIndicator;
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
}

export interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  showSelectAll?: boolean;
  multiSelect?: boolean;
  loading?: boolean;
}

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRangePreset[];
  maxRange?: number; // days
}
