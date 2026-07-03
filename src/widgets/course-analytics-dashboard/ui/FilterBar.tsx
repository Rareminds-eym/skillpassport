/**
 * FilterBar - the "Filters" button + dropdown panel (UI-only for this phase).
 *
 * Renders the filter controls from typed FilterDefinition[] using the shared
 * DropdownMenu + Select primitives, so the styling matches the app. No filtering
 * logic is wired: selections are local-only and do not affect the data. This is
 * intentional for phase 1 and leaves a clear seam for backend integration later
 * (lift selected values via a future `onChange`/`onApply` prop).
 */

import { Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/DropdownMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { FilterDefinition } from '@/entities/course-analytics';

interface FilterBarProps {
  filters: FilterDefinition[];
}

export function FilterBar({ filters }: FilterBarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Filters
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Filter Analytics
        </p>

        <div className="flex flex-col gap-4">
          {filters.map((filter) => (
            <div key={filter.id} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">{filter.label}</label>
              {/* UI-only: no value/onChange wired this phase. */}
              <Select defaultValue={filter.options[0]?.value}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
