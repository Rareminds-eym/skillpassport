import React, { useEffect, useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  ChevronDownIcon,
  FunnelIcon,
  TagIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';

export interface ShortlistFilters {
  dateRange: {
    preset?: '7d' | '30d' | '90d' | 'ytd' | 'custom';
    startDate?: string;
    endDate?: string;
  };
  status: string[]; // 'active' | 'archived'
  shared: 'all' | 'shared' | 'private';
  tags: string[];
  createdBy: string[];
  candidateCountRange: 'all' | '0' | '1-5' | '6-20' | '21-50' | '50+';
}

interface AdvancedShortlistFiltersProps {
  filters: ShortlistFilters;
  onFiltersChange: (filters: ShortlistFilters) => void;
  onReset: () => void;
  onApply: () => void;
}

const COUNT_RANGES = [
  { value: 'all', label: 'All' },
  { value: '0', label: 'No candidates (0)' },
  { value: '1-5', label: '1 – 5' },
  { value: '6-20', label: '6 – 20' },
  { value: '21-50', label: '21 – 50' },
  { value: '50+', label: '50+' },
] as const;

const STATUSES = ['active', 'archived'];

const getDatePreset = (preset: string) => {
  const today = new Date();
  const startDate = new Date();
  switch (preset) {
    case '7d':
      startDate.setDate(today.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(today.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(today.getDate() - 90);
      break;
    case 'ytd':
      startDate.setMonth(0, 1);
      break;
    default:
      return { startDate: undefined, endDate: undefined } as const;
  }
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  } as const;
};

const AdvancedShortlistFilters: React.FC<AdvancedShortlistFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  onApply,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCreators, setAvailableCreators] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);

  useEffect(() => {
    const fetchTagsAndCreators = async () => {
      setLoadingTags(true);
      setLoadingCreators(true);
      try {
        const [{ data: tagRows, error: tagErr }, { data: creatorRows, error: creatorErr }] =
          await Promise.all([
            supabase.from('shortlists').select('tags').not('tags', 'is', null),
            supabase.from('shortlists').select('created_by').not('created_by', 'is', null),
          ]);
        if (!tagErr && tagRows) {
          const tagsSet = new Set<string>();
          tagRows.forEach((r: any) => {
            (r.tags || []).forEach((t: string) => tagsSet.add(t));
          });
          setAvailableTags(Array.from(tagsSet).sort((a, b) => a.localeCompare(b)));
        }
        if (!creatorErr && creatorRows) {
          const creators = Array.from(
            new Set(creatorRows.map((r: any) => r.created_by).filter(Boolean))
          );
          setAvailableCreators(
            creators.sort((a: string, b: string) => String(a).localeCompare(String(b)))
          );
        }
      } finally {
        setLoadingTags(false);
        setLoadingCreators(false);
      }
    };
    fetchTagsAndCreators();
  }, []);

  const activeCount = useMemo(() => {
    return (
      (filters.status?.length || 0) +
      (filters.tags?.length || 0) +
      (filters.createdBy?.length || 0) +
      (filters.shared !== 'all' ? 1 : 0) +
      (filters.candidateCountRange !== 'all' ? 1 : 0) +
      (filters.dateRange.startDate || filters.dateRange.endDate ? 1 : 0)
    );
  }, [filters]);

  const toggleArray = (key: keyof ShortlistFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const clearArray = (key: keyof ShortlistFilters) => {
    onFiltersChange({ ...filters, [key]: [] as any });
  };

  const applyAndClose = () => {
    onApply();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
          isOpen || activeCount > 0
            ? 'bg-primary-50 border-primary-300 text-primary-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Advanced Filters</span>
        {activeCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
            {activeCount}
          </span>
        )}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-900">Advanced Filters</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded">
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {activeCount > 0 && (
              <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-700">
                {activeCount} active
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {/* Status */}
              <div className="border-b">
                <button
                  onClick={() => setActiveSection(activeSection === 'status' ? null : 'status')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-800">Status</div>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 ${activeSection === 'status' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeSection === 'status' && (
                  <div className="px-6 pb-4 space-y-2 bg-gray-50">
                    {STATUSES.map((s) => (
                      <label key={s} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary-600"
                          checked={filters.status.includes(s)}
                          onChange={() => toggleArray('status', s)}
                        />
                        <span className="text-sm capitalize">{s}</span>
                      </label>
                    ))}
                    {filters.status.length > 0 && (
                      <button
                        onClick={() => clearArray('status')}
                        className="w-full mt-2 text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1"
                      >
                        Clear Status
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Shared */}
              <div className="border-b">
                <button
                  onClick={() => setActiveSection(activeSection === 'shared' ? null : 'shared')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-800">Sharing</div>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 ${activeSection === 'shared' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeSection === 'shared' && (
                  <div className="px-6 pb-4 space-y-2 bg-gray-50">
                    {['all', 'shared', 'private'].map((opt) => (
                      <label key={opt} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shared"
                          className="h-4 w-4 text-primary-600"
                          checked={filters.shared === (opt as any)}
                          onChange={() => onFiltersChange({ ...filters, shared: opt as any })}
                        />
                        <span className="text-sm capitalize">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Count */}
              <div className="border-b">
                <button
                  onClick={() => setActiveSection(activeSection === 'count' ? null : 'count')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-800">Candidate Count</div>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 ${activeSection === 'count' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeSection === 'count' && (
                  <div className="px-6 pb-4 space-y-2 bg-gray-50">
                    {COUNT_RANGES.map((r) => (
                      <label key={r.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="count"
                          className="h-4 w-4 text-primary-600"
                          checked={filters.candidateCountRange === r.value}
                          onChange={() =>
                            onFiltersChange({ ...filters, candidateCountRange: r.value })
                          }
                        />
                        <span className="text-sm">{r.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="border-b">
                <button
                  onClick={() => setActiveSection(activeSection === 'tags' ? null : 'tags')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <TagIcon className="h-4 w-4" /> Tags
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 ${activeSection === 'tags' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeSection === 'tags' && (
                  <div className="px-6 pb-4 space-y-2 bg-gray-50 max-h-64 overflow-y-auto">
                    {loadingTags ? (
                      <div className="text-sm text-gray-500 py-2">Loading...</div>
                    ) : availableTags.length === 0 ? (
                      <div className="text-sm text-gray-500 py-2">No tags</div>
                    ) : (
                      availableTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600"
                            checked={filters.tags.includes(tag)}
                            onChange={() => toggleArray('tags', tag)}
                          />
                          <span className="text-sm">{tag}</span>
                        </label>
                      ))
                    )}
                    {filters.tags.length > 0 && (
                      <button
                        onClick={() => clearArray('tags')}
                        className="w-full mt-2 text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1"
                      >
                        Clear Tags
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Created By */}
              <div className="border-b">
                <button
                  onClick={() => setActiveSection(activeSection === 'creators' ? null : 'creators')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <UserIcon className="h-4 w-4" /> Created By
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 ${activeSection === 'creators' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeSection === 'creators' && (
                  <div className="px-6 pb-4 space-y-2 bg-gray-50 max-h-64 overflow-y-auto">
                    {loadingCreators ? (
                      <div className="text-sm text-gray-500 py-2">Loading...</div>
                    ) : availableCreators.length === 0 ? (
                      <div className="text-sm text-gray-500 py-2">No creators</div>
                    ) : (
                      availableCreators.map((user) => (
                        <label key={user} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600"
                            checked={filters.createdBy.includes(user)}
                            onChange={() => toggleArray('createdBy', user)}
                          />
                          <span className="text-sm">{user}</span>
                        </label>
                      ))
                    )}
                    {filters.createdBy.length > 0 && (
                      <button
                        onClick={() => clearArray('createdBy')}
                        className="w-full mt-2 text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1"
                      >
                        Clear Created By
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="border-b">
                <button
                  onClick={() => setActiveSection(activeSection === 'date' ? null : 'date')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <CalendarIcon className="h-4 w-4" /> Created Date
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 ${activeSection === 'date' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeSection === 'date' && (
                  <div className="px-6 pb-4 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      {(['7d', '30d', '90d', 'ytd'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              dateRange: { preset: p, ...getDatePreset(p) },
                            })
                          }
                          className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${filters.dateRange.preset === p ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
                        >
                          {p === '7d'
                            ? 'Last 7 days'
                            : p === '30d'
                              ? 'Last 30 days'
                              : p === '90d'
                                ? 'Last 90 days'
                                : 'Year to date'}
                        </button>
                      ))}
                    </div>
                    <div className="border-t pt-3">
                      <label className="block text-xs text-gray-600 mb-1">Start</label>
                      <input
                        type="date"
                        value={filters.dateRange.startDate || ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            dateRange: {
                              ...filters.dateRange,
                              startDate: e.target.value || undefined,
                              preset: 'custom',
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End</label>
                      <input
                        type="date"
                        value={filters.dateRange.endDate || ''}
                        onChange={(e) =>
                          onFiltersChange({
                            ...filters,
                            dateRange: {
                              ...filters.dateRange,
                              endDate: e.target.value || undefined,
                              preset: 'custom',
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    {(filters.dateRange.startDate || filters.dateRange.endDate) && (
                      <button
                        onClick={() => onFiltersChange({ ...filters, dateRange: {} })}
                        className="w-full mt-1 text-xs text-red-600 hover:bg-red-50 rounded px-2 py-1"
                      >
                        Clear Date Range
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-white flex items-center gap-2">
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={applyAndClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedShortlistFilters;
