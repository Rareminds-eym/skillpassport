import { useRef, useState, type FC, type PointerEvent } from 'react';
import { CheckCircle, ChevronRight, Circle, GripVertical } from 'lucide-react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface CapabilityItem {
  capability_area: string;
  score_out_of_5: number;
}

interface Props {
  whatIHave?: CapabilityItem[];
  whatINeed?: CapabilityItem[];
  sectionIntro?: SectionIntro;
}

function percentFromScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score * 20)));
}

export const WhatIHaveNeed: FC<Props> = ({ whatIHave = [], whatINeed = [], sectionIntro }) => {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  if (!whatIHave.length && !whatINeed.length) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  const updateFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    updateFromClientX(event.clientX);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div>
      {intro && (
        <>
          <h2 className="text-base font-bold text-gray-800 mb-1">{intro.heading}</h2>
          <p className="text-xs text-gray-500 mb-6">{intro.description}</p>
        </>
      )}

      <div
        ref={containerRef}
        className="relative w-full h-80 rounded-2xl overflow-hidden cursor-ew-resize select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 bg-blue-600">
          <div className="p-6 pt-11 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-blue-500 text-blue-100 px-2 py-0.5 rounded-full">
                EXCITING NEXT STEPS
              </span>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronRight size={15} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">What I Need Next</h3>
            </div>
            <div className="space-y-4 flex-1">
              {whatINeed.map((item) => {
                const level = percentFromScore(item.score_out_of_5);
                return (
                  <div key={item.capability_area}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Circle size={14} className="text-blue-200" />
                        <span className="text-sm text-blue-50">{item.capability_area}</span>
                      </div>
                      <span className="text-xs font-semibold text-blue-100">{level}%</span>
                    </div>
                    <div className="h-2 bg-blue-500/40 rounded-full overflow-hidden ml-6">
                      <div className="h-full bg-white/50 rounded-full" style={{ width: `${level}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-blue-200 mt-4">These are the skills that will unlock your next chapter.</p>
          </div>
        </div>

        <div className="absolute inset-0 bg-gray-900 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="p-6 pt-11 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                EVIDENCE-BACKED STRENGTHS
              </span>
            </div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <CheckCircle size={15} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">What I Have</h3>
            </div>
            <div className="space-y-4 flex-1">
              {whatIHave.map((item) => {
                const level = percentFromScore(item.score_out_of_5);
                return (
                  <div key={item.capability_area}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span className="text-sm text-gray-200">{item.capability_area}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">{level}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden ml-6">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${level}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4">Strengths you've built through your choices and actions so far.</p>
          </div>
        </div>

        <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-600">
            <GripVertical size={16} className="text-blue-600" />
          </div>
        </div>

        <div className="absolute top-3 left-4 z-20 pointer-events-none">
          <span className="text-xs font-bold text-white/80">TODAY</span>
        </div>
        <div className="absolute top-3 right-4 z-20 pointer-events-none">
          <span className="text-xs font-bold text-white/80">NEXT LEVEL</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Drag the handle to compare where you are with where you're going.
      </p>
    </div>
  );
};
