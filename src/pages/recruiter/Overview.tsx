import React from 'react';
import {
  UsersIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { kpiData, recentActivity, savedSearches, shortlists } from '../../data/sampleData';

const KpiCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50'
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend > 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({ type, title, message, time, urgent = false }) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`border-l-4 p-4 ${urgent ? 'border-danger-400 bg-danger-50' : 'border-gray-200 bg-white'} rounded-r-lg shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          <p className="mt-2 text-xs text-gray-500">{time}</p>
        </div>
      </div>
    </div>
  );
};

const Overview = () => {
  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Verification Pending',
      message: '3 candidates waiting for document verification',
      time: '2 hours ago',
      urgent: true
    },
    {
      id: 2,
      type: 'error',
      title: 'Expiring Offers',
      message: 'Offer for Arjun Kumar expires in 24 hours',
      time: '4 hours ago',
      urgent: true
    },
    {
      id: 3,
      type: 'success',
      title: 'Interview Feedback',
      message: 'Positive feedback received for Priya S',
      time: '1 day ago'
    }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">What needs your attention in 30 seconds</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="New Profiles This Week"
          value={kpiData.newProfiles}
          icon={UsersIcon}
          trend={12}
          color="primary"
        />
        <KpiCard
          title="Shortlisted"
          value={kpiData.shortlisted}
          icon={BookmarkIcon}
          trend={8}
          color="success"
        />
        <KpiCard
          title="Interviews Scheduled"
          value={kpiData.interviewsScheduled}
          icon={CalendarDaysIcon}
          trend={-5}
          color="warning"
        />
        <KpiCard
          title="Offers Extended"
          value={kpiData.offersExtended}
          icon={DocumentTextIcon}
          trend={15}
          color="primary"
        />
        <KpiCard
          title="Time-to-hire (Days)"
          value={kpiData.timeToHire}
          icon={ClockIcon}
          trend={-8}
          color="success"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Alerts and Saved Searches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Alerts & Tasks</h3>
            </div>
            <div className="p-6 space-y-4">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} />
              ))}
            </div>
          </div>

          {/* Saved Searches */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Searches</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((search, index) => (
                  <button
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Shortlists */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Shortlists</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {shortlists.map((shortlist) => (
                  <div key={shortlist.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shortlist.name}</p>
                      <p className="text-xs text-gray-500">{shortlist.candidates.length} candidates • {shortlist.created_date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Open
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivity.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center ring-8 ring-white">
                              <UsersIcon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{activity.user}</span>
                                <span className="text-gray-500"> {activity.action} </span>
                                <span className="font-medium text-gray-900">{activity.candidate}</span>
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500">{activity.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;