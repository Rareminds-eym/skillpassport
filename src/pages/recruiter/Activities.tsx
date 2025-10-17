import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ActivityFeed from '../../components/ActivityFeed';
import { useRealtimeActivities } from '../../hooks/useRealtimeActivities';

const Activities: React.FC = () => {
  const { activities, loading } = useRealtimeActivities();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Recent Activity</h1>
        <p className="mt-2 text-sm text-gray-700">
          Track all recruitment activities and team actions in real-time
        </p>
      </div>

      {/* Activities Card with Accordion */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {/* Accordion Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-lg font-medium text-gray-900">All Activities</h2>
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live</span>
            </div>
            
            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </button>

        {/* Accordion Content */}
        {isExpanded && (
          <div className="p-6">
            <ActivityFeed 
              activities={activities} 
              loading={loading}
              showRealtimeIndicator={false}
            />
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Total Activities</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{activities.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Shortlists</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {activities.filter(a => a.type === 'shortlist').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Offers</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {activities.filter(a => a.type === 'offer' || a.type === 'offer_extended').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Placements</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {activities.filter(a => a.type === 'placement').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Activities;
