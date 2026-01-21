import React from 'react';
import { ClockIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ActivityIndicatorsProps {
  lastUpdated: string | Date;
  createdAt?: string | Date;
}

export const ActivityIndicators: React.FC<ActivityIndicatorsProps> = ({
  lastUpdated,
  createdAt,
}) => {
  const getActivityStatus = () => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const created = createdAt ? new Date(createdAt) : null;

    const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
    const hoursSinceCreation = created
      ? (now.getTime() - created.getTime()) / (1000 * 60 * 60)
      : null;

    // New candidate (created in last 24 hours)
    if (hoursSinceCreation !== null && hoursSinceCreation < 24) {
      return {
        type: 'new',
        badge: (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 animate-pulse">
            <SparklesIcon className="h-3 w-3 mr-1" />
            New
          </span>
        ),
      };
    }

    // Stale (no activity in 7 days)
    if (hoursSinceUpdate > 168) {
      return {
        type: 'stale',
        badge: (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            {Math.floor(hoursSinceUpdate / 24)}d ago
          </span>
        ),
      };
    }

    // Recent activity (less than 2 days)
    if (hoursSinceUpdate < 48) {
      return {
        type: 'recent',
        badge: (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <ClockIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        ),
      };
    }

    return { type: 'normal', badge: null };
  };

  const status = getActivityStatus();

  return status.badge;
};

// Utility to format relative time
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return then.toLocaleDateString();
};
