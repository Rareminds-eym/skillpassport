import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PauseCircleIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import {
  ProjectStatus,
  ProposalStatus,
  MilestoneStatus,
  ProjectCategory,
} from '../../../../types/project';

// Status Badge Component
interface StatusBadgeProps {
  status: ProjectStatus | ProposalStatus | MilestoneStatus;
  type?: 'project' | 'proposal' | 'milestone';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'project' }) => {
  const getStatusConfig = () => {
    const configs = {
      // Project statuses
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: DocumentTextIcon, label: 'Draft' },
      open: { bg: 'bg-blue-100', text: 'text-blue-700', icon: ClockIcon, label: 'Open' },
      in_progress: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: ClockIcon,
        label: 'In Progress',
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircleIcon,
        label: 'Completed',
      },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon, label: 'Cancelled' },

      // Proposal statuses
      submitted: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: DocumentTextIcon,
        label: 'Submitted',
      },
      under_review: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: ClockIcon,
        label: 'Under Review',
      },
      shortlisted: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        icon: CheckCircleIcon,
        label: 'Shortlisted',
      },
      accepted: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircleIcon,
        label: 'Accepted',
      },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircleIcon, label: 'Rejected' },
      withdrawn: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: XCircleIcon,
        label: 'Withdrawn',
      },

      // Milestone statuses
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: ClockIcon, label: 'Pending' },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircleIcon,
        label: 'Approved',
      },
      paid: {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        icon: CheckCircleIcon,
        label: 'Paid',
      },
    };

    return configs[status] || configs.draft;
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
    </span>
  );
};

// Priority Badge Component
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const configs = {
    low: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Low' },
    medium: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Medium' },
    high: { bg: 'bg-orange-100', text: 'text-orange-600', label: 'High' },
    urgent: { bg: 'bg-red-100', text: 'text-red-600', label: 'Urgent' },
  };

  const config = configs[priority];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// Budget Display Component
interface BudgetDisplayProps {
  min?: number;
  max?: number;
  currency?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BudgetDisplay: React.FC<BudgetDisplayProps> = ({
  min,
  max,
  currency = 'INR',
  showIcon = true,
  size = 'md',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center gap-1 font-semibold text-gray-900 ${sizeClasses[size]}`}>
      {showIcon && <CurrencyRupeeIcon className="w-4 h-4 text-gray-500" />}
      {min && max ? (
        <span>
          {formatCurrency(min)} - {formatCurrency(max)}
        </span>
      ) : max ? (
        <span>{formatCurrency(max)}</span>
      ) : min ? (
        <span>{formatCurrency(min)}</span>
      ) : (
        <span className="text-gray-500">Not specified</span>
      )}
    </div>
  );
};

// Skill Tag Component
interface SkillTagProps {
  skill: string;
  variant?: 'default' | 'purple' | 'outlined';
}

export const SkillTag: React.FC<SkillTagProps> = ({ skill, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
    outlined: 'bg-white border border-gray-300 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${variantClasses[variant]}`}
    >
      {skill}
    </span>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  percentage: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'purple' | 'blue' | 'green' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  showPercentage = true,
  color = 'purple',
  size = 'md',
}) => {
  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-600">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[size]} overflow-hidden`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};

// Milestone Progress Component
interface MilestoneProgressProps {
  completed: number;
  total: number;
  showLabel?: boolean;
}

export const MilestoneProgress: React.FC<MilestoneProgressProps> = ({
  completed,
  total,
  showLabel = true,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <ProgressBar percentage={percentage} showPercentage={false} color="purple" size="sm" />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
          {completed}/{total} milestones
        </span>
      )}
    </div>
  );
};

// Category Badge Component
interface CategoryBadgeProps {
  category: ProjectCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const categoryLabels: Record<ProjectCategory, string> = {
    web_development: 'Web Development',
    mobile_app: 'Mobile App',
    data_science: 'Data Science',
    ui_ux_design: 'UI/UX Design',
    content_writing: 'Content Writing',
    marketing: 'Marketing',
    devops: 'DevOps',
    blockchain: 'Blockchain',
    ai_ml: 'AI/ML',
    other: 'Other',
  };

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
      {categoryLabels[category]}
    </span>
  );
};

// Empty State Component
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Loading Skeleton Component
export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
