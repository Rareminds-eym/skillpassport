import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface ConversionMetric {
  label: string;
  from: string;
  to: string;
  rate: number;
  fromCount: number;
  toCount: number;
}

interface PipelineStatsProps {
  metrics: ConversionMetric[];
}

export const PipelineStats: React.FC<PipelineStatsProps> = ({ metrics }) => {
  const getColorClass = (rate: number) => {
    if (rate >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-500';
    if (rate >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 70) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
    if (rate >= 40) return null;
    return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="flex items-center space-x-4">
      {metrics.map((metric, index) => (
        <div key={index} className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${getColorClass(metric.rate)}`}>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium">{metric.label}</span>
              {getTrendIcon(metric.rate)}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tabular-nums">{metric.rate}%</span>
              <span className="text-xs text-gray-500 tabular-nums">
                ({metric.toCount}/{metric.fromCount})
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(metric.rate)} transition-all duration-500`}
                style={{ width: `${Math.min(metric.rate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface QuickStatsProps {
  total: number;
  company: string;
  daysAging: number;
  activeStages: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ total, company, daysAging, activeStages }) => {
  return (
    <div className="flex items-center space-x-6 text-sm">
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs mb-0.5">Total Candidates</span>
        <span className="font-bold text-gray-900 text-lg tabular-nums">{total}</span>
      </div>
      <div className="h-10 w-px bg-gray-200" />
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs mb-0.5">Company</span>
        <span className="font-medium text-gray-900">{company}</span>
      </div>
      <div className="h-10 w-px bg-gray-200" />
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs mb-0.5">Days Open</span>
        <span className="font-bold text-gray-900 text-lg tabular-nums">{daysAging}</span>
      </div>
      <div className="h-10 w-px bg-gray-200" />
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs mb-0.5">Active Stages</span>
        <span className="font-bold text-gray-900 text-lg tabular-nums">{activeStages}/6</span>
      </div>
    </div>
  );
};

