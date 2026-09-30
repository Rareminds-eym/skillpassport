import type { FC, KeyboardEvent } from 'react';
import { CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { STAGE_ORDER, type StageId, type StageStatus } from './growthStageConfig';

interface Props {
  statuses: Record<StageId, StageStatus>;
  onExplore(id: StageId): void;
  onHoverStage?(id: StageId | null): void;
}

// Matches the Bolt reference's arc-shaped stage list exactly:
// Math.sin((index / (total - 1)) * Math.PI) * 36, applied as a horizontal
// transform (not padding, which only eats into the row's own content width
// instead of visually offsetting the whole card).
const STAIRCASE_OFFSET_PX = [0, 15.62, 28.14, 35.09, 35.09, 28.14, 15.62, 0];

export const GrowthMapStageList: FC<Props> = ({ statuses, onExplore, onHoverStage }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {STAGE_ORDER.map((stage, index) => {
        const status = statuses[stage.id];
        const isLocked = status === 'locked';
        const isDone = status === 'done';

        return (
          <div
            key={stage.id}
            style={{ transform: `translateX(${STAIRCASE_OFFSET_PX[index] ?? 0}px)` }}
          >
            <div
              onMouseEnter={() => onHoverStage?.(stage.id)}
              onMouseLeave={() => onHoverStage?.(null)}
              onClick={isLocked ? undefined : () => onExplore(stage.id)}
              role={isLocked ? undefined : 'button'}
              tabIndex={isLocked ? undefined : 0}
              onKeyDown={
                isLocked
                  ? undefined
                  : (e: KeyboardEvent<HTMLDivElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onExplore(stage.id);
                      }
                    }
              }
              className={`group flex items-center gap-4 rounded-2xl border px-5 py-3.5 transition-all duration-300 ${
                isLocked
                  ? 'border-slate-100 bg-slate-50/60 opacity-55'
                  : 'cursor-pointer border-slate-200 bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200'
              }`}
            >
              <div
                className={`relative flex size-12 shrink-0 items-center justify-center rounded-full ${
                  isLocked ? 'bg-slate-200' : ''
                }`}
                style={
                  isLocked
                    ? undefined
                    : {
                        backgroundImage:
                          'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #1d4ed8 100%)',
                        boxShadow: '0px 4px 7px rgba(37,99,235,0.35)',
                      }
                }
              >
                {isLocked ? (
                  <Lock size={18} className="text-slate-400" />
                ) : (
                  <span className="text-white text-lg font-bold">{stage.order}</span>
                )}
                <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-white shadow-[0px_0px_0px_1px_#e2e8f0,0px_1px_2px_rgba(0,0,0,0.05)]">
                  <span className="text-[10px] font-bold text-blue-700">{stage.order}</span>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-base font-bold ${
                      isLocked ? 'text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {stage.title}
                  </h3>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {stage.growthLevelLabel}
                  </span>
                </div>
                <p className="truncate text-[13px] text-slate-500">{stage.description}</p>
              </div>

              {isDone && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
                  <CheckCircle2 size={13} />
                  Done
                </span>
              )}
              {status === 'current' && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition group-hover:bg-blue-700">
                  Explore
                  <ArrowRight size={13} />
                </span>
              )}
              {isLocked && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-400">
                  <Lock size={11} />
                  Locked
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
