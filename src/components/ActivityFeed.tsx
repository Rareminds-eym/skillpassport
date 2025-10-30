import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  BookmarkIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Format relative time (e.g., "2 hours ago")
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMs = now - activityTime;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return activityTime.toLocaleDateString();
};

// Get icon based on activity type
const getActivityIcon = (iconType, type) => {
  const iconClass = 'h-4 w-4';
  
  switch (iconType || type) {
    case 'pipeline':
    case 'pipeline_activity':
      return <ArrowRightIcon className={iconClass} />;
    case 'search':
    case 'recruiter_activity':
      return <MagnifyingGlassIcon className={iconClass} />;
    case 'bookmark':
    case 'shortlist':
      return <BookmarkIcon className={iconClass} />;
    case 'document':
    case 'offer':
    case 'offer_extended':
      return <DocumentTextIcon className={iconClass} />;
    case 'offer_accepted':
      return <CheckCircleIcon className={iconClass} />;
    case 'offer_rejected':
    case 'candidate_rejected':
      return <XCircleIcon className={iconClass} />;
    case 'briefcase':
    case 'placement':
      return <BriefcaseIcon className={iconClass} />;
    case 'user-group':
      return <UserGroupIcon className={iconClass} />;
    case 'folder':
    case 'shortlist_created':
      return <FolderIcon className={iconClass} />;
    case 'delete':
    case 'deletion':
      return <TrashIcon className={iconClass} />;
    case 'calendar':
    case 'interview':
    case 'interview_completed':
    case 'interview_cancelled':
      return <CalendarIcon className={iconClass} />;
    default:
      return <UserPlusIcon className={iconClass} />;
  }
};

// Get color based on activity type
const getActivityColor = (type) => {
  switch (type) {
    case 'offer_accepted':
    case 'placement':
      return 'bg-green-100 text-green-600 ring-green-50';
    case 'offer_rejected':
    case 'candidate_rejected':
      return 'bg-red-100 text-red-600 ring-red-50';
    case 'offer':
    case 'offer_extended':
      return 'bg-purple-100 text-purple-600 ring-purple-50';
    case 'shortlist':
    case 'shortlist_created':
      return 'bg-yellow-100 text-yellow-600 ring-yellow-50';
    case 'pipeline_activity':
    case 'pipeline':
      return 'bg-blue-100 text-blue-600 ring-blue-50';
    case 'recruiter_activity':
      return 'bg-gray-100 text-gray-600 ring-gray-50';
    case 'deletion':
      return 'bg-red-100 text-red-600 ring-red-50';
    case 'interview':
      return 'bg-indigo-100 text-indigo-600 ring-indigo-50';
    case 'interview_completed':
      return 'bg-green-100 text-green-600 ring-green-50';
    case 'interview_cancelled':
      return 'bg-orange-100 text-orange-600 ring-orange-50';
    default:
      return 'bg-primary-100 text-primary-600 ring-primary-50';
  }
};

interface ActivityItemProps {
  activity: {
    id: string;
    user: string;
    action: string;
    candidate: string;
    details?: string;
    timestamp: string;
    type: string;
    icon?: string;
    metadata?: any;
  };
  isLast: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, isLast }) => {
  const colorClasses = getActivityColor(activity.type);

  return (
    <li>
      <div className="relative pb-8">
        {!isLast && (
          <span
            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <div className="relative flex space-x-3">
          <div>
            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${colorClasses}`}>
              {getActivityIcon(activity.icon, activity.type)}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span>
                {' '}
                <span className="text-gray-600">{activity.action}</span>
                {' '}
                <span className="font-medium">{activity.candidate}</span>
              </p>
              {activity.details && (
                <p className="mt-0.5 text-xs text-gray-500">{activity.details}</p>
              )}
              {activity.metadata?.status && (
                <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  activity.metadata.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  activity.metadata.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  activity.metadata.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.metadata.status}
                </span>
              )}
            </div>
            <div className="whitespace-nowrap text-right text-xs text-gray-500">
              <time dateTime={activity.timestamp}>{formatRelativeTime(activity.timestamp)}</time>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

interface ActivityFeedProps {
  activities: any[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showRealtimeIndicator?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities = [], 
  loading = false,
  onLoadMore,
  hasMore = false,
  showRealtimeIndicator = false
}) => {
  const [filter, setFilter] = useState('all');
  
  const filteredActivities = filter === 'all' 
    ? activities 
    : filter === 'interview'
    ? activities.filter(a => a.type === 'interview' || a.type === 'interview_completed' || a.type === 'interview_cancelled' || a.icon === 'calendar')
    : activities.filter(a => a.type === filter || a.icon === filter);

  if (loading && activities.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No activities yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Activities will appear here as your team works with candidates.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      {/* Filter */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="all">All Activities</option>
          <option value="shortlist">Shortlists</option>
          <option value="interview">Interviews</option>
          <option value="offer">Offers</option>
          <option value="placement">Placements</option>
          <option value="pipeline">Pipeline Changes</option>
          <option value="recruiter_activity">Recruiter Actions</option>
        </select>
      </div>

      {/* Activity List */}
      <ul className="-mb-8">
        {filteredActivities.map((activity, activityIdx) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isLast={activityIdx === filteredActivities.length - 1}
          />
        ))}
      </ul>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
