import {
    BriefcaseIcon,
    ChartBarIcon,
    ClockIcon,
    DocumentTextIcon,
    FunnelIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    RectangleStackIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// @ts-ignore - FeatureGate is a JSX component
import { FeatureGate } from '../../components/Subscription/FeatureGate';

// Import components
import ProjectList from '../../components/Recruiter/Projects/ProjectList';
import Breadcrumb from '../../components/Recruiter/Projects/navigation/Breadcrumb';
import QuickActionsMenu from '../../components/Recruiter/Projects/navigation/QuickActionsMenu';
import TabNavigation, { MobileTabNavigation, ProjectTab } from '../../components/Recruiter/Projects/navigation/TabNavigation';

// Import mock data
import { getActiveContracts } from '../../data/mock/mockContracts';
import { getProjectStats, mockProjects } from '../../data/mock/mockProjects';
import { mockProposals } from '../../data/mock/mockProposals';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'purple' | 'blue' | 'yellow' | 'green';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className={`text-2xl p-3 rounded-lg border ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

/**
 * ProjectHiringWithNav - Project-based hiring management
 * 
 * Wrapped with FeatureGate for project_hiring add-on access control
 */
const ProjectHiringWithNavContent = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'all'
  const [activeTab, setActiveTab] = useState<ProjectTab>(
    (searchParams.get('tab') as ProjectTab) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get stats
  const projectStats = getProjectStats();
  const activeContracts = getActiveContracts();
  const totalProposals = mockProposals.length;

  // Define tabs with counts
  const tabs = [
    {
      id: 'all' as ProjectTab,
      label: 'All Projects',
      icon: RectangleStackIcon,
      count: projectStats.total,
    },
    {
      id: 'active-contracts' as ProjectTab,
      label: 'Active Contracts',
      icon: BriefcaseIcon,
      count: activeContracts.length,
      badge: activeContracts.length > 0 ? ('attention' as const) : null,
    },
    {
      id: 'proposals' as ProjectTab,
      label: 'Proposals',
      icon: DocumentTextIcon,
      count: totalProposals,
      badge: totalProposals > 0 ? ('new' as const) : null,
    },
    {
      id: 'milestones' as ProjectTab,
      label: 'Milestones',
      icon: ClockIcon,
      count: activeContracts.reduce((sum, c) => sum + c.agreed_milestones.length, 0),
    },
    {
      id: 'analytics' as ProjectTab,
      label: 'Analytics',
      icon: ChartBarIcon,
    },
  ];

  // Quick actions
  const quickActions = [
    {
      id: 'new-project',
      label: 'Post New Project',
      icon: PlusIcon,
      onClick: () => handleCreateProject(),
      color: 'purple' as const,
    },
    {
      id: 'view-proposals',
      label: 'View Proposals',
      icon: DocumentTextIcon,
      onClick: () => handleTabChange('proposals'),
      color: 'blue' as const,
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      icon: ChartBarIcon,
      onClick: () => handleTabChange('analytics'),
      color: 'green' as const,
    },
  ];

  // Handle tab change with URL update
  const handleTabChange = (tab: ProjectTab) => {
    setActiveTab(tab);
    setSearchParams({ tab, search: searchQuery, status: statusFilter });
  };

  // Filter projects based on search and status
  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewProject = (id: string) => {
    console.log('View project:', id);
    alert(`Project Details\n\nNavigating to project details for: ${id}\n\nThis will open a full project details page with:\n- Overview\n- Proposals\n- Milestones\n- Activity timeline`);
  };

  const handleCreateProject = () => {
    alert('Create Project Modal\n\nThis will open a multi-step wizard to create a new project:\n1. Basic Info\n2. Budget & Timeline\n3. Skills & Requirements\n4. Milestones\n5. Review & Post');
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <div>
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                { label: 'Project Hiring', onClick: () => handleTabChange('all'), current: true }
              ]}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard 
                title="Total Projects" 
                value={projectStats.total} 
                icon="📊"
                color="purple"
                subtitle="All time"
              />
              <StatsCard 
                title="Open Projects" 
                value={projectStats.open} 
                icon="🔓"
                color="blue"
                subtitle="Accepting proposals"
              />
              <StatsCard 
                title="In Progress" 
                value={projectStats.in_progress} 
                icon="⚡"
                color="yellow"
                subtitle="Active work"
              />
              <StatsCard 
                title="Completed" 
                value={projectStats.completed} 
                icon="✅"
                color="green"
                subtitle="Successfully delivered"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <FunnelIcon className="h-5 w-5 text-gray-400 hidden sm:block" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <Squares2X2Icon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <ListBulletIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> of <span className="font-semibold text-gray-900">{projectStats.total}</span> projects
            </div>

            {/* Project List */}
            <ProjectList
              projects={filteredProjects}
              viewMode={viewMode}
              onViewProject={handleViewProject}
              onCreateProject={handleCreateProject}
            />
          </div>
        );

      case 'active-contracts':
        return (
          <div>
            <Breadcrumb
              items={[
                { label: 'Project Hiring', onClick: () => handleTabChange('all') },
                { label: 'Active Contracts', current: true }
              ]}
            />
            <div className="text-center py-12">
              <BriefcaseIcon className="h-16 w-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Active Contracts View</h3>
              <p className="text-gray-600">
                Shows all ongoing contracts with milestone tracking, payment status, and progress updates.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Currently: {activeContracts.length} active contracts
              </p>
            </div>
          </div>
        );

      case 'proposals':
        return (
          <div>
            <Breadcrumb
              items={[
                { label: 'Project Hiring', onClick: () => handleTabChange('all') },
                { label: 'Proposals', current: true }
              ]}
            />
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Proposals Dashboard</h3>
              <p className="text-gray-600">
                Review, compare, and manage all incoming proposals across your projects.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Currently: {totalProposals} proposals awaiting review
              </p>
            </div>
          </div>
        );

      case 'milestones':
        return (
          <div>
            <Breadcrumb
              items={[
                { label: 'Project Hiring', onClick: () => handleTabChange('all') },
                { label: 'Milestones', current: true }
              ]}
            />
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Milestone Tracker</h3>
              <p className="text-gray-600">
                Track all milestones across active projects, approve deliverables, and release payments.
              </p>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div>
            <Breadcrumb
              items={[
                { label: 'Project Hiring', onClick: () => handleTabChange('all') },
                { label: 'Analytics', current: true }
              ]}
            />
            <div className="text-center py-12">
              <ChartBarIcon className="h-16 w-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project Analytics</h3>
              <p className="text-gray-600">
                Insights into project performance, budget utilization, completion rates, and ROI.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RocketLaunchIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Project-Based Hiring</h1>
            </div>
            <p className="text-sm md:text-base text-gray-600">
              Post projects, review proposals, and hire talented freelancers
            </p>
          </div>
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Post New Project</span>
            <span className="sm:hidden">New Project</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation - Desktop */}
      <div className="hidden md:block">
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={tabs}
        />
      </div>

      {/* Main Content */}
      <div className="p-6 pb-24 md:pb-6">
        {renderTabContent()}
      </div>

      {/* Quick Actions Menu */}
      <QuickActionsMenu actions={quickActions} />

      {/* Mobile Tab Navigation - Bottom */}
      <MobileTabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />
    </div>
  );
};

/**
 * Wrapped ProjectHiringWithNav with FeatureGate for project_hiring add-on
 */
const ProjectHiringWithNav = () => (
  <FeatureGate featureKey="project_hiring" showUpgradePrompt={true}>
    <ProjectHiringWithNavContent />
  </FeatureGate>
);

export default ProjectHiringWithNav;

