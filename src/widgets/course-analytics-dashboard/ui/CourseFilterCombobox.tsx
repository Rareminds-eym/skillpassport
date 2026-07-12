/**
 * CourseFilterCombobox - searchable course selector for the Academic Status card.
 *
 * Replaces the plain <Select> with a searchable combobox matching the approved
 * design: a wide trigger button, a search input (with icon) at the top of the
 * dropdown, "All Courses" pinned first, a scrollable max-height list, and the
 * selected item shown in blue text with a trailing blue dot (not a checkmark).
 *
 * Built on the project's new shared `Command` primitive (cmdk) + the existing
 * shared `Popover` — no other searchable-select existed to reuse, so this is the
 * first consumer of that new shared primitive rather than a one-off pattern.
 */

import { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import type { FilterOption } from '@/entities/course-analytics';

interface CourseFilterComboboxProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function CourseFilterCombobox({ options, value, onChange }: CourseFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-64 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="flex-1 truncate text-left">{selected?.label}</span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search courses..." />
          <CommandList>
            <CommandEmpty>No courses found.</CommandEmpty>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'justify-between',
                    isSelected && 'text-blue-600 data-[selected=true]:bg-blue-50',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                  )}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
