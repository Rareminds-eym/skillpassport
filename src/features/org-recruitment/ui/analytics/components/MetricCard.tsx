/**
 * Metric Card Component
 * Reusable card for displaying key metrics with trends
 */

import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import type { MetricCardProps } from '../types';

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  subtitle,
  onClick,
  loading = false,
}: MetricCardProps) {
  const showTrend = trend !== undefined && trend.value !== 0;
  const isPositive = trend?.isPositive ?? true;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="w-16 h-6 bg-gray-200 rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="w-24 h-4 bg-gray-200 rounded" />
          <div className="w-32 h-8 bg-gray-200 rounded" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        hover:shadow-md transition-shadow duration-200
        ${onClick ? 'cursor-pointer hover:border-gray-300' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Top Section: Icon & Trend */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${iconBg}
          `}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>

        {/* Trend Badge */}
        {showTrend && (
          <div
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
              ${isPositive
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
              }
            `}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-3 w-3" />
            ) : (
              <ArrowTrendingDownIcon className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Bottom Section: Content */}
      <div>
        {/* Title */}
        <p className="text-sm font-medium text-gray-600 mb-1">
          {title}
        </p>

        {/* Value */}
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>

        {/* Subtitle or Trend Label */}
        {(subtitle || trend?.label) && (
          <p className="text-xs text-gray-500 mt-1">
            {subtitle || trend?.label}
          </p>
        )}
      </div>
    </div>
  );
}

// Loading skeleton version
export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="w-16 h-6 bg-gray-200 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="w-24 h-4 bg-gray-200 rounded" />
        <div className="w-32 h-8 bg-gray-200 rounded" />
        <div className="w-20 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// Grid container for metric cards
interface MetricCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function MetricCardGrid({ children, columns = 4 }: MetricCardGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
