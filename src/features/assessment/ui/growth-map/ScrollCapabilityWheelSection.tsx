import { useEffect, useRef, useState, type FC } from 'react';
import { Sprout } from 'lucide-react';
import { BoltCapabilityWheel, type CapabilityArea } from './CapabilityWheel';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface Props {
  capabilities: CapabilityArea[];
  sectionIntro?: SectionIntro;
}

const GROWTH_STAGES = [
  { label: 'Nurturing', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  { label: 'Practicing', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Growing', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { label: 'Confident', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  { label: 'Ready for Next Level', className: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
];

/**
 * Scroll-view section wrapper for the shared Bolt-style Capability Wheel.
 * The heading/card/reveal are scroll-view-specific; the SVG wheel itself is
 * shared with Tabs / Stage 1 Overview through BoltCapabilityWheel.
 */
export const ScrollCapabilityWheelSection: FC<Props> = ({ capabilities, sectionIntro }) => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!capabilities.length) return null;

  return (
    <div ref={sectionRef}>
      {intro && (
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Sprout size={19} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{intro.heading}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{intro.description}</p>
          </div>
        </div>
      )}

      <div
        className={`grid min-h-[410px] items-center gap-9 overflow-hidden rounded-2xl border border-slate-100 bg-white px-7 py-8 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition-all duration-700 sm:px-10 sm:py-9 lg:grid-cols-[minmax(390px,500px)_minmax(470px,520px)] lg:gap-12 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="flex min-w-0 justify-center">
          <BoltCapabilityWheel capabilities={capabilities} className="max-w-[390px] p-2 sm:max-w-[410px] sm:p-3" />
        </div>

        <aside className="min-w-0 self-center">
          <div className="max-w-[500px] rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 shadow-[0_8px_24px_rgba(37,99,235,0.04)]">
            <p className="text-[11px] font-extrabold uppercase leading-none tracking-wide text-blue-700">
              Interactive Power Wheel
            </p>
            <p className="mt-2.5 text-sm font-bold leading-snug text-slate-900">
              Hover or tap your petal on the wheel!
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Instantly see your current growth stage and feedback.
            </p>
          </div>

          <div className="mt-5 max-w-[520px]">
            <p className="mb-2.5 text-[11px] font-extrabold uppercase leading-none tracking-wide text-slate-400">
              Growth Stages
            </p>
            <div className="flex flex-nowrap items-center gap-2 overflow-visible">
              {GROWTH_STAGES.map((stage) => (
                <span
                  key={stage.label}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold leading-none ${stage.className}`}
                >
                  {stage.label}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
