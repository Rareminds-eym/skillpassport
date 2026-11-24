import { useState, useEffect, useMemo, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, Search, X } from 'lucide-react';
import { OpportunityDialog } from '@/features/opportunities/ui/OpportunityDialog';
import {
  emptyOpportunityFilters,
  salaryFilterError,
} from '@/features/opportunities/lib/filters';
import { opportunitiesService } from '@/features/opportunities/api/opportunitiesService';

// These options are fixed / well-known fallback values
const STATIC_OPTIONS = {
  employmentType: [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary',
  ],
  mode: ['On-site', 'Remote', 'Hybrid'],
  skills: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'React',
    'Vue.js',
    'Angular',
    'Node.js',
    'Django',
    'Flask',
    'SQL',
    'MongoDB',
    'PostgreSQL',
    'MySQL',
    'AWS',
    'Azure',
    'GCP',
    'Docker',
    'Kubernetes',
    'Git',
    'CI/CD',
    'Agile',
    'Scrum',
  ],
};

// Fallback values shown while facets are loading or if the fetch fails
const FALLBACK_DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Customer Support',
  'Legal',
];
const FALLBACK_EXPERIENCE_LEVELS = [
  'Entry',
  'Fresher / Entry level',
  'Fresher to 2 years',
  'Fresher to 4 years',
  'Junior',
  'Mid',
  'Senior',
];

/**
 * Collapsible accordion filter section with Chevron toggle — matches the College Admin filter style.
 */
function FilterSection({ title, children, defaultOpen = false, selectedCount = 0, loading = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left py-1 group focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {title}
          </span>
          {loading && <span className="text-xs font-normal text-slate-400">loading…</span>}
          {selectedCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-blue-700 bg-blue-100 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="mt-2.5 pt-1">{children}</div>}
    </div>
  );
}

/**
 * Checkbox list with right-aligned counts and optional quick search — matches the College Admin style.
 */
function CheckboxGroup({
  options,
  selectedValues,
  onChange,
  emptyHint,
  searchable = false,
  searchPlaceholder = 'Search...',
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter options based on mini search term
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, searchable, searchTerm]);

  // Keep selected items at the top when browsing for fast visibility
  const sortedOptions = useMemo(() => {
    if (!filteredOptions || filteredOptions.length === 0) return [];
    if (selectedValues.length === 0 || searchTerm.trim()) return filteredOptions;
    const selected = [];
    const unselected = [];
    filteredOptions.forEach((opt) => {
      if (selectedValues.includes(opt.value)) {
        selected.push(opt);
      } else {
        unselected.push(opt);
      }
    });
    return [...selected, ...unselected];
  }, [filteredOptions, selectedValues, searchTerm]);

  if (!options || options.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic py-1">
        {emptyHint || 'No options available.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mini search bar for long option lists */}
      {searchable && options.length > 5 && (
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-7 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {sortedOptions.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-1">
          {searchTerm ? 'No matching options found.' : emptyHint || 'No options available.'}
        </p>
      ) : (
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {sortedOptions.map((option) => {
            const isChecked = selectedValues.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer text-sm transition-colors ${
                  isChecked ? 'bg-blue-50/70 text-blue-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center min-w-0 mr-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        onChange(selectedValues.filter((v) => v !== option.value));
                      } else {
                        onChange([...selectedValues, option.value]);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="ml-2.5 text-sm select-none truncate">
                    {option.label}
                  </span>
                </div>
                {option.count !== undefined && (
                  <span className={`text-xs font-medium shrink-0 ${isChecked ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                    ({option.count})
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdvancedFilters({
  onApplyFilters,
  initialFilters = emptyOpportunityFilters(),
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyOpportunityFilters);
  const [error, setError] = useState('');

  // Dynamic options loaded from the DB
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [experienceLevels, setExperienceLevels] = useState(FALLBACK_EXPERIENCE_LEVELS);
  const [locations, setLocations] = useState([]);
  const [facetCounts, setFacetCounts] = useState({
    employmentType: {},
    experienceLevel: {},
    mode: {},
    department: {},
    skills: {},
    location: {},
  });
  const [facetsLoading, setFacetsLoading] = useState(false);

  // Load facets and counts once on mount
  useEffect(() => {
    let cancelled = false;
    setFacetsLoading(true);
    opportunitiesService
      .getFacets()
      .then((data) => {
        if (cancelled) return;
        const { departments: deps, experienceLevels: levels, locations: locs, counts } = data || {};
        if (deps && deps.length > 0) setDepartments(deps);
        if (levels && levels.length > 0) setExperienceLevels(levels);
        if (locs && locs.length > 0) setLocations(locs);
        if (counts) {
          setFacetCounts({
            employmentType: counts.employmentType || {},
            experienceLevel: counts.experienceLevel || {},
            mode: counts.mode || {},
            department: counts.department || {},
            skills: counts.skills || {},
            location: counts.location || {},
          });
        }
      })
      .catch(() => {
        // Silently fall back to static values — already set as default state
      })
      .finally(() => {
        if (!cancelled) setFacetsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const count = Object.values(initialFilters).reduce(
    (n, v) => n + (Array.isArray(v) ? v.length : v ? 1 : 0),
    0,
  );

  const show = () => {
    setDraft({ ...emptyOpportunityFilters(), ...initialFilters });
    setError('');
    setOpen(true);
  };

  const apply = () => {
    const message = salaryFilterError(draft.salaryMin, draft.salaryMax);
    setError(message);
    if (!message) {
      onApplyFilters(draft);
      setOpen(false);
    }
  };

  const handleClearAll = () => {
    setDraft(emptyOpportunityFilters());
    setError('');
  };

  const input =
    'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

  // Build options with counts
  const employmentTypeOptions = useMemo(() => {
    const canonical = STATIC_OPTIONS.employmentType;
    const allKeys = [...new Set([...canonical, ...Object.keys(facetCounts.employmentType)])];
    return allKeys.map((type) => ({
      value: type,
      label: type,
      count: facetCounts.employmentType[type] ?? 0,
    }));
  }, [facetCounts.employmentType]);

  const experienceLevelOptions = useMemo(() => {
    return experienceLevels.map((level) => ({
      value: level,
      label: level,
      count: facetCounts.experienceLevel[level] ?? 0,
    }));
  }, [experienceLevels, facetCounts.experienceLevel]);

  const modeOptions = useMemo(() => {
    return STATIC_OPTIONS.mode.map((m) => ({
      value: m,
      label: m,
      count: facetCounts.mode[m] ?? 0,
    }));
  }, [facetCounts.mode]);

  const departmentOptions = useMemo(() => {
    return departments.map((dept) => ({
      value: dept,
      label: dept,
      count: facetCounts.department[dept] ?? 0,
    }));
  }, [departments, facetCounts.department]);

  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc,
      label: loc,
      count: facetCounts.location[loc] ?? 0,
    }));
  }, [locations, facetCounts.location]);

  const skillsOptions = useMemo(() => {
    const skillsList = [...STATIC_OPTIONS.skills];
    Object.keys(facetCounts.skills).forEach((s) => {
      if (!skillsList.includes(s)) skillsList.push(s);
    });
    return skillsList
      .map((skill) => ({
        value: skill,
        label: skill,
        count: facetCounts.skills[skill] ?? 0,
      }))
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [facetCounts.skills]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <SlidersHorizontal size={16} />
        Advanced Filters
        {count > 0 && (
          <span className="rounded bg-blue-50 px-1.5 text-xs text-blue-700 font-semibold">
            {count}
          </span>
        )}
      </button>

      <OpportunityDialog
        open={open}
        onOpenChange={setOpen}
        variant="filters"
        title="Advanced Filters"
        description="Choose the criteria for your job search."
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Reset selection
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-1">
          {/* Top Filter header with quick Clear all */}
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Filters
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>

          {/* 1. Employment type */}
          <FilterSection
            title="Employment type"
            defaultOpen={true}
            selectedCount={draft.employmentType.length}
          >
            <CheckboxGroup
              options={employmentTypeOptions}
              selectedValues={draft.employmentType}
              onChange={(values) => setDraft((prev) => ({ ...prev, employmentType: values }))}
            />
          </FilterSection>

          {/* 2. Experience level */}
          <FilterSection
            title="Experience level"
            defaultOpen={true}
            selectedCount={draft.experienceLevel.length}
            loading={facetsLoading && experienceLevels.length === 0}
          >
            <CheckboxGroup
              options={experienceLevelOptions}
              selectedValues={draft.experienceLevel}
              onChange={(values) => setDraft((prev) => ({ ...prev, experienceLevel: values }))}
            />
          </FilterSection>

          {/* 3. Work mode */}
          <FilterSection
            title="Work mode"
            defaultOpen={true}
            selectedCount={draft.mode.length}
          >
            <CheckboxGroup
              options={modeOptions}
              selectedValues={draft.mode}
              onChange={(values) => setDraft((prev) => ({ ...prev, mode: values }))}
            />
          </FilterSection>

          {/* 4. Location */}
          <FilterSection
            title="Location"
            defaultOpen={false}
            selectedCount={draft.location?.length || 0}
            loading={facetsLoading && locations.length === 0}
          >
            <CheckboxGroup
              options={locationOptions}
              selectedValues={draft.location || []}
              onChange={(values) => setDraft((prev) => ({ ...prev, location: values }))}
              searchable={true}
              searchPlaceholder="Search locations..."
              emptyHint="No locations found in active opportunities."
            />
          </FilterSection>

          {/* 5. Department */}
          <FilterSection
            title="Department"
            defaultOpen={false}
            selectedCount={draft.department.length}
            loading={facetsLoading && departments.length === 0}
          >
            <CheckboxGroup
              options={departmentOptions}
              selectedValues={draft.department}
              onChange={(values) => setDraft((prev) => ({ ...prev, department: values }))}
              searchable={true}
              searchPlaceholder="Search departments..."
              emptyHint="No departments found."
            />
          </FilterSection>

          {/* 6. Required skills */}
          <FilterSection
            title="Required skills"
            defaultOpen={false}
            selectedCount={draft.skills.length}
          >
            <CheckboxGroup
              options={skillsOptions}
              selectedValues={draft.skills}
              onChange={(values) => setDraft((prev) => ({ ...prev, skills: values }))}
              searchable={true}
              searchPlaceholder="Search skills..."
              emptyHint="No skills found."
            />
          </FilterSection>

          {/* 7. Salary range */}
          <FilterSection
            title="Salary range (₹)"
            defaultOpen={false}
            selectedCount={draft.salaryMin || draft.salaryMax ? 1 : 0}
          >
            <p className="mb-3 text-xs leading-5 text-slate-500">
              Filter the amounts listed by employers. Confirm the pay period in the job description.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['salaryMin', 'Minimum'],
                ['salaryMax', 'Maximum'],
              ].map(([key, label]) => (
                <label key={key} className="text-xs text-slate-600">
                  {label}
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    aria-invalid={!!error}
                    aria-describedby={error ? 'salary-filter-error' : undefined}
                    className={`${input} mt-1`}
                    placeholder={key === 'salaryMin' ? '0' : 'Any amount'}
                  />
                </label>
              ))}
            </div>
            {error && (
              <p
                role="alert"
                id="salary-filter-error"
                className="mt-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </FilterSection>

          {/* 8. Posted within */}
          <FilterSection
            title="Posted within"
            defaultOpen={false}
            selectedCount={draft.postedWithin ? 1 : 0}
          >
            <select
              value={draft.postedWithin}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, postedWithin: e.target.value }))
              }
              className={`${input} font-normal`}
            >
              <option value="">Any time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </FilterSection>
        </div>
      </OpportunityDialog>
    </>
  );
}
