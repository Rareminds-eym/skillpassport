/**
 * Analytics Dashboard Main Component
 * Container for all analytics tabs and global filters
 */

import { useState } from 'react';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { AnalyticsFiltersProvider, useAnalyticsFilters } from './hooks/useAnalyticsFilters';
import { DateRangeSelector } from './components/DateRangeSelector';
import { FilterDropdown } from './components/FilterDropdown';
import { ActiveFilters } from './components/ActiveFilters';
import { ExportMenu } from './components/ExportMenu';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { OverviewTab } from './tabs/OverviewTab';
import { PipelineTab } from './tabs/PipelineTab';
import { JobsTab } from './tabs/JobsTab';
import { TeamTab } from './tabs/TeamTab';
import { TrendsTab } from './tabs/TrendsTab';
import { InsightsTab } from './tabs/InsightsTab';

// Tab type
type AnalyticsTab = 'overview' | 'pipeline' | 'jobs' | 'team' | 'trends' | 'insights';

interface Tab {
  id: AnalyticsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: ChartBarIcon },
  { id: 'pipeline', label: 'Pipeline', icon: UserGroupIcon },
  { id: 'jobs', label: 'Jobs', icon: BriefcaseIcon },
  { id: 'team', label: 'Team', icon: UserGroupIcon },
  { id: 'trends', label: 'Trends', icon: ChartBarIcon },
  { id: 'insights', label: 'Insights', icon: ChartBarIcon },
];

function PipelineTab() {
  return (
    <div className="p-8 text-center">
      <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pipeline Analytics</h3>
      <p className="text-gray-600">Coming in Phase 2</p>
    </div>
  );
}

function JobsTab() {
  return (
    <div className="p-8 text-center">
      <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Jobs & Requisitions</h3>
      <p className="text-gray-600">Coming in Phase 3</p>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="p-8 text-center">
      <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Performance</h3>
      <p className="text-gray-600">Enhanced version coming in Phase 3</p>
    </div>
  );
}

function TrendsTab() {
  return (
    <div className="p-8 text-center">
      <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Trends & Analytics</h3>
      <p className="text-gray-600">Coming in Phase 4</p>
    </div>
  );
}

function InsightsTab() {
  return (
    <div className="p-8 text-center">
      <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Insights & Reports</h3>
      <p className="text-gray-600">Coming in Phase 4</p>
    </div>
  );
}

// Tab content renderer
function TabContent({ tab, orgId }: { tab: AnalyticsTab; orgId: string }) {
  switch (tab) {
    case 'overview':
      return <OverviewTab orgId={orgId} />;
    case 'pipeline':
      return <PipelineTab orgId={orgId} />;
    case 'jobs':
      return <JobsTab orgId={orgId} />;
    case 'team':
      return <TeamTab orgId={orgId} />;
    case 'trends':
      return <TrendsTab orgId={orgId} />;
    case 'insights':
      return <InsightsTab orgId={orgId} />;
    default:
      return null;
  }
}

// Dashboard content (needs to be inside provider)
function DashboardContent({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const { orgContext, isLoading: orgLoading } = useOrgContext();
  const {
    filters,
    updateDateRange,
    updateDepartments,
    updateLocations,
    updateJobTypes,
    updateRecruiters,
    resetFilters,
  } = useAnalyticsFilters();

  // Mock options (will be fetched from API in Phase 2+)
  const departmentOptions = [
    { value: 'engineering', label: 'Engineering', count: 42 },
    { value: 'sales', label: 'Sales', count: 28 },
    { value: 'marketing', label: 'Marketing', count: 18 },
    { value: 'operations', label: 'Operations', count: 12 },
  ];

  const locationOptions = [
    { value: 'remote', label: 'Remote', count: 45, icon: '🏠' },
    { value: 'bangalore', label: 'Bangalore', count: 34, icon: '📍' },
    { value: 'mumbai', label: 'Mumbai', count: 28, icon: '📍' },
    { value: 'delhi', label: 'Delhi', count: 18, icon: '📍' },
  ];

  const jobTypeOptions = [
    { value: 'job', label: 'Full-time Job', count: 85, icon: '💼' },
    { value: 'internship', label: 'Internship', count: 42, icon: '🎓' },
    { value: 'contract', label: 'Contract', count: 18, icon: '📝' },
  ];

  const recruiterOptions = [
    { value: 'user-1', label: 'John Doe', count: 45 },
    { value: 'user-2', label: 'Jane Smith', count: 38 },
    { value: 'user-3', label: 'Mike Johnson', count: 32 },
  ];

  // Loading state
  if (orgLoading || !orgContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const orgId = orgContext.orgId;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50'}>
      {/* Header - only show if not embedded */}
      {!embedded && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            {/* Title & Last Updated */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📊 Recruitment Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Export & Settings (placeholders) */}
              <div className="flex items-center gap-2">
                <ExportMenu orgId={orgId} currentTab={activeTab} />
                <button
                  className="
                    p-2 text-gray-700 bg-white border border-gray-300 rounded-lg
                    hover:bg-gray-50
                    transition-colors
                  "
                  title="Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Global Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <DateRangeSelector value={filters.dateRange} onChange={updateDateRange} />

              <FilterDropdown
                label="Departments"
                options={departmentOptions}
                selected={filters.departments}
                onChange={updateDepartments}
                icon={<BuildingOfficeIcon className="h-4 w-4" />}
              />

              <FilterDropdown
                label="Locations"
                options={locationOptions}
                selected={filters.locations}
                onChange={updateLocations}
                icon={<MapPinIcon className="h-4 w-4" />}
              />

              <FilterDropdown
                label="Job Types"
                options={jobTypeOptions}
                selected={filters.jobTypes}
                onChange={updateJobTypes}
                icon={<BriefcaseIcon className="h-4 w-4" />}
              />

              <FilterDropdown
                label="Recruiters"
                options={recruiterOptions}
                selected={filters.recruiters}
                onChange={updateRecruiters}
                icon={<UserGroupIcon className="h-4 w-4" />}
              />

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="
                  flex items-center gap-2 px-4 py-2
                  text-sm font-medium text-gray-600
                  hover:text-gray-900 hover:bg-gray-100
                  rounded-lg transition-colors
                "
              >
                <ArrowPathIcon className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Active Filters */}
          <ActiveFilters />
        </div>
      )}

      {/* Filters bar for embedded mode */}
      {embedded && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          {/* Global Filters */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <DateRangeSelector value={filters.dateRange} onChange={updateDateRange} />

            <FilterDropdown
              label="Departments"
              options={departmentOptions}
              selected={filters.departments}
              onChange={updateDepartments}
              icon={<BuildingOfficeIcon className="h-4 w-4" />}
            />

            <FilterDropdown
              label="Locations"
              options={locationOptions}
              selected={filters.locations}
              onChange={updateLocations}
              icon={<MapPinIcon className="h-4 w-4" />}
            />

            <FilterDropdown
              label="Job Types"
              options={jobTypeOptions}
              selected={filters.jobTypes}
              onChange={updateJobTypes}
              icon={<BriefcaseIcon className="h-4 w-4" />}
            />

            <FilterDropdown
              label="Recruiters"
              options={recruiterOptions}
              selected={filters.recruiters}
              onChange={updateRecruiters}
              icon={<UserGroupIcon className="h-4 w-4" />}
            />

            {/* Reset & Export */}
            <button
              onClick={resetFilters}
              className="
                flex items-center gap-2 px-4 py-2
                text-sm font-medium text-gray-600
                hover:text-gray-900 hover:bg-gray-100
                rounded-lg transition-colors
              "
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset
            </button>

            <ExportMenu orgId={orgId} currentTab={activeTab} />
          </div>

          {/* Active Filters */}
          <ActiveFilters />
        </div>
      )}

      {/* Tab Navigation */}
      <div className={`bg-white border-gray-200 ${embedded ? 'border rounded-lg overflow-hidden mb-6' : 'border-b sticky top-[140px] z-30'}`}>
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 text-sm font-medium
                  border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={embedded ? '' : 'p-6'}>
        <TabContent tab={activeTab} orgId={orgId} />
      </div>
    </div>
  );
}

// Main export with provider
export function AnalyticsDashboard({ embedded = false }: { embedded?: boolean }) {
  return (
    <AnalyticsFiltersProvider>
      <DashboardContent embedded={embedded} />
    </AnalyticsFiltersProvider>
  );
}
