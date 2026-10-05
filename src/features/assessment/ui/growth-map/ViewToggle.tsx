import type { FC } from 'react';
import { LayoutGrid, ScrollText } from 'lucide-react';

export type GrowthMapViewMode = 'tabbed' | 'scroll';

interface Props {
  mode: GrowthMapViewMode;
  onChange(mode: GrowthMapViewMode): void;
}

/**
 * Tabs / Scroll switch, matching the Bolt reference's ViewToggle
 * (TabbedView.tsx) exactly — same structure, spacing, and active-state
 * styling. Visual/interaction pattern only; carries no data of its own.
 */
export const ViewToggle: FC<Props> = ({ mode, onChange }) => {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('tabbed')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
          mode === 'tabbed' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutGrid size={13} /> Tabs
      </button>
      <button
        type="button"
        onClick={() => onChange('scroll')}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
          mode === 'scroll' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <ScrollText size={13} /> Scroll
      </button>
    </div>
  );
};
