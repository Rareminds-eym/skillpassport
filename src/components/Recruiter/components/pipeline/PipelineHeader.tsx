import React from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface Opportunity {
  id: number;
  job_title?: string;
  title?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface PipelineHeaderProps {
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  opportunities: Opportunity[];
  selectedJob: number | null;
  setSelectedJob: (id: number) => void;
  getTotalCandidates: () => number;
  onAddCandidates: () => void;
  onExportPipeline: () => void;
  onRefresh: () => void;
}

export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  globalSearch,
  setGlobalSearch,
  opportunities,
  selectedJob,
  setSelectedJob,
  getTotalCandidates,
  onAddCandidates,
  onExportPipeline,
  onRefresh,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Management</h1>

        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search candidates..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={onAddCandidates}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Add Candidates
          </button>
          <button
            onClick={onExportPipeline}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Job Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {opportunities.slice(0, 5).map((job) => (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedJob === job.id
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{job.job_title || job.title}</span>
              {selectedJob === job.id && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-800 tabular-nums">
                  {getTotalCandidates()}
                </span>
              )}
            </div>
          </button>
        ))}
        {opportunities.length > 5 && (
          <select
            value={selectedJob || ''}
            onChange={(e) => setSelectedJob(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">More jobs...</option>
            {opportunities.slice(5).map((job) => (
              <option key={job.id} value={job.id}>
                {job.job_title || job.title}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default PipelineHeader;
