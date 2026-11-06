import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { OpportunityDialog } from '@/features/opportunities/ui/OpportunityDialog';
import {
  emptyOpportunityFilters,
  salaryFilterError,
} from '@/features/opportunities/lib/filters';

const options = {
  employmentType: [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary',
  ],
  experienceLevel: [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Lead',
    'Executive',
  ],
  mode: ['On-site', 'Remote', 'Hybrid'],
  department: [
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
  ],
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
const labels = {
  employmentType: 'Employment type',
  experienceLevel: 'Experience level',
  mode: 'Work mode',
  department: 'Department',
  skills: 'Required skills (any selected)',
};
export default function AdvancedFilters({
  onApplyFilters,
  initialFilters = emptyOpportunityFilters(),
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyOpportunityFilters);
  const [error, setError] = useState('');
  const count = Object.values(initialFilters).reduce(
    (n, v) => n + (Array.isArray(v) ? v.length : v ? 1 : 0),
    0,
  );
  const show = () => {
    setDraft({ ...emptyOpportunityFilters(), ...initialFilters });
    setError('');
    setOpen(true);
  };
  const toggle = (key, value) =>
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  const apply = () => {
    const message = salaryFilterError(draft.salaryMin, draft.salaryMax);
    setError(message);
    if (!message) {
      onApplyFilters(draft);
      setOpen(false);
    }
  };
  const input =
    'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
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
          <span className="rounded bg-blue-50 px-1.5 text-xs text-blue-700">
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
              onClick={() => {
                setDraft(emptyOpportunityFilters());
                setError('');
              }}
              className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Reset selection
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <div className="space-y-5">
          {Object.entries(options).map(([key, values]) => (
            <fieldset key={key}>
              <legend className="mb-2 text-sm font-semibold text-slate-900">
                {labels[key]}
              </legend>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {values.map((value) => (
                  <label
                    key={value}
                    className="flex min-h-9 items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={draft[key].includes(value)}
                      onChange={() => toggle(key, value)}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-900">
              Salary range (₹)
            </legend>
            <p className="mb-3 text-xs leading-5 text-slate-500">
              Filter the amounts listed by employers. Confirm the pay period in
              the job description.
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
          </fieldset>
          <label className="block text-sm font-semibold text-slate-900">
            Posted within
            <select
              value={draft.postedWithin}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, postedWithin: e.target.value }))
              }
              className={`${input} mt-2 font-normal`}
            >
              <option value="">Any time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </label>
        </div>
      </OpportunityDialog>
    </>
  );
}
