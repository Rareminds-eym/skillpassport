import { useId, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CalendarIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Preset = '7d' | '30d' | '90d' | 'ytd' | 'custom';
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  preset: Preset;
  onRangeChange: (preset: Preset, startDate?: string, endDate?: string) => void;
}
const options: { value: Exclude<Preset, 'custom'>; label: string }[] = [
  { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' }, { value: 'ytd', label: 'Year to date' },
];
function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const focusClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

export default function DateRangePicker({ startDate, endDate, preset, onRangeChange }: DateRangePickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(startDate.slice(0, 10));
  const [end, setEnd] = useState(endDate.slice(0, 10));
  const today = localDate();
  const valid = !!start && !!end && start <= end && end <= today;
  const rangeError = start && end && start > end ? 'End date must be on or after the start date.'
    : end && end > today ? 'Choose an end date on or before today.' : '';
  const format = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const label = preset === 'custom' && startDate && endDate
    ? `${format(startDate)} – ${format(endDate)}`
    : options.find(option => option.value === preset)?.label || 'Select dates';

  function onOpenChange(value: boolean) {
    if (value) { setStart(startDate.slice(0, 10)); setEnd(endDate.slice(0, 10)); }
    setOpen(value);
  }
  function selectPreset(value: Exclude<Preset, 'custom'>) {
    const from = new Date();
    if (value === 'ytd') from.setMonth(0, 1);
    else from.setDate(from.getDate() - (value === '7d' ? 7 : value === '30d' ? 30 : 90));
    onRangeChange(value, localDate(from), today);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Reporting period: ${label}`} className={`inline-flex min-h-11 max-w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusClass}`}>
          <CalendarIcon className="h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="min-w-0 break-words">{label}</span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} collisionPadding={16} aria-labelledby={`${id}-title`} className="z-[80] max-h-[min(620px,var(--radix-popover-content-available-height))] w-[min(320px,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-4 shadow-xl focus:outline-none">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id={`${id}-title`} className="text-sm font-semibold text-gray-900">Reporting period</h2>
            <Popover.Close aria-label="Close date picker" className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 ${focusClass}`}><XMarkIcon className="h-5 w-5" aria-hidden="true" /></Popover.Close>
          </div>
          <div className="grid grid-cols-2 gap-1 border-b border-gray-100 pb-3">
            {options.map(option => <button key={option.value} type="button" aria-pressed={preset === option.value} onClick={() => selectPreset(option.value)} className={`flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-sm ${focusClass} ${preset === option.value ? 'bg-primary-50 font-semibold text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`}>{option.label}</button>)}
          </div>
          <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); if (valid) { onRangeChange('custom', start, end); setOpen(false); } }}>
            <h3 className="text-sm font-semibold text-gray-900">Custom range</h3>
            <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor={`${id}-start`} className="mb-1 block text-xs font-medium text-gray-600">Start date</label><input id={`${id}-start`} required type="date" value={start} onChange={event => setStart(event.target.value)} max={end || today} className="min-h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label htmlFor={`${id}-end`} className="mb-1 block text-xs font-medium text-gray-600">End date</label><input id={`${id}-end`} required type="date" value={end} onChange={event => setEnd(event.target.value)} min={start} max={today} aria-invalid={!!rangeError} aria-describedby={rangeError ? `${id}-error` : undefined} className="min-h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
            </div>
            {rangeError && <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-rose-700">{rangeError}</p>}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button type="button" onClick={() => { setStart(''); setEnd(''); }} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 ${focusClass}`}>Clear dates</button>
              <button type="submit" disabled={!valid} className={`min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusClass}`}>Apply range</button>
            </div>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
