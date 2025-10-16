import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PrinterIcon,
  InformationCircleIcon,
  XMarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Loading Skeleton Components
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="w-12 h-12 rounded-full bg-gray-200 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>
    </div>
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="flex-1 h-3 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
      ))}
    </div>
  </div>
);

// Empty State Component
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = ChartBarIcon,
  title,
  description,
  action
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
      <Icon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// Tooltip Component
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div
          className={`absolute z-50 ${positionClasses[position]} w-max max-w-xs`}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
            {content}
            <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
          </div>
        </div>
      )}
    </div>
  );
};

// Export Button Component
interface ExportButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  label = 'Export CSV',
  variant = 'secondary'
}) => {
  const baseClasses = 'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
  const variantClasses = variant === 'primary'
    ? 'bg-primary-600 text-white hover:bg-primary-700'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      {label}
    </button>
  );
};

// Refresh Button Component
interface RefreshButtonProps {
  onClick: () => void;
  lastUpdated?: Date;
  loading?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  lastUpdated,
  loading = false
}) => {
  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
};

// Print Button Component
interface PrintButtonProps {
  onClick: () => void;
}

export const PrintButton: React.FC<PrintButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
  >
    <PrinterIcon className="h-4 w-4" />
    Print / PDF
  </button>
);

// Info Icon with Tooltip
interface InfoIconProps {
  content: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ content }) => (
  <Tooltip content={content}>
    <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
  </Tooltip>
);

// Drill-down Modal Component
interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison Badge Component
interface ComparisonBadgeProps {
  current: number;
  previous: number;
  format?: (val: number) => string;
}

export const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({
  current,
  previous,
  format = (val) => val.toString()
}) => {
  if (previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className="inline-flex items-center gap-1 text-xs">
      <span className="text-gray-500">vs last period:</span>
      <span
        className={`font-semibold ${
          isNeutral
            ? 'text-gray-600'
            : isPositive
            ? 'text-green-600'
            : 'text-red-600'
        }`}
      >
        {isPositive && '+'}{change.toFixed(1)}%
      </span>
    </div>
  );
};

// Section Header with Actions
interface SectionHeaderWithActionsProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const SectionHeaderWithActions: React.FC<SectionHeaderWithActionsProps> = ({
  title,
  description,
  actions
}) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
