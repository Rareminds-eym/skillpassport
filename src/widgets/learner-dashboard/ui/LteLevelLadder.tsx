import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, ChevronDown } from 'lucide-react';
import { STATUS_LABELS, type LteLevel } from './LteLearningCard.types';

interface LteLevelLadderProps {
  levels: LteLevel[];
  /** Whether the level-progress popover is open (controlled by parent). */
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const isComplete = (status?: string, pct?: number | null) =>
  status === 'completed' || status === 'mastered' || Number(pct) >= 100;

const RING_RADIUS = 14;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Mini SVG progress ring: green when done, blue in progress, gray at 0. */
function LevelRing({ pct, done }: { pct: number; done: boolean }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 100);
  const track = done ? '#dcfce7' : clamped > 0 ? '#dbeafe' : '#f1f5f9';
  const stroke = done ? '#22c55e' : '#3b82f6';

  return (
    <span className="relative shrink-0" aria-hidden="true">
      <svg width="34" height="34" viewBox="0 0 34 34">
        <circle cx="17" cy="17" r={RING_RADIUS} fill="none" stroke={track} strokeWidth="4" />
        {clamped > 0 && (
          <circle
            cx="17"
            cy="17"
            r={RING_RADIUS}
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 17 17)"
          />
        )}
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[9.5px] font-bold ${
          done ? 'text-green-700' : clamped > 0 ? 'text-blue-700' : 'text-slate-400'
        }`}
      >
        {clamped}
      </span>
    </span>
  );
}

interface PanelPos {
  top: number;
  left: number;
  width: number;
}

/**
 * Level progress trigger + floating popover for an LTE course card. The popover
 * is portaled to `document.body` with fixed positioning, so the card's own
 * footprint never changes (no layout shift, uniform grid cards). Closes on
 * outside click or Escape; repositions on scroll/resize while open.
 */
export function LteLevelLadder({ levels, open, onToggle, onClose }: LteLevelLadderProps) {
  const regionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PanelPos | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const tr = trigger.getBoundingClientRect();
      const width = Math.min(Math.max(tr.width, 240), window.innerWidth - 16);
      const height = panel.offsetHeight;
      const top =
        tr.bottom + 8 + height > window.innerHeight - 8
          ? Math.max(8, tr.top - height - 8)
          : tr.bottom + 8;
      const left = Math.max(8, Math.min(tr.left, window.innerWidth - width - 8));
      setPos({ top, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panel?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        aria-haspopup="dialog"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 text-left hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Level progress
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {levels.length} {levels.length === 1 ? 'level' : 'levels'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            id={regionId}
            ref={panelRef}
            role="region"
            aria-label="Level progress"
            tabIndex={-1}
            className="fixed z-50 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 focus-visible:outline-none"
            style={pos ? { top: pos.top, left: pos.left, width: pos.width } : undefined}
          >
            <ul className="space-y-2">
              {levels.map((level, index) => {
                const done = isComplete(level.status, level.completionPercentage);
                const pct = Number(level.completionPercentage) || 0;
                const statusLabel = STATUS_LABELS[level.status ?? 'not_started'] ?? 'Not started';

                return (
                  <li
                    key={level.id ?? index}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200/70 bg-white"
                  >
                    <LevelRing pct={pct} done={done} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        <span className="mr-2 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-slate-500 align-middle">
                          {level.code ?? `L${index + 1}`}
                        </span>
                        {level.title}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[10.5px] font-medium ${
                        done ? 'text-green-600' : pct > 0 ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {statusLabel}
                    </span>
                    {(level.totalModules ?? 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {level.completedModules ?? 0}/{level.totalModules}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}