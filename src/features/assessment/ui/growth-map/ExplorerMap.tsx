import React, { useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Briefcase,
  Hammer,
  Palette,
  Users,
  Leaf,
  Laptop,
  HeartPulse,
  Lightbulb,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Style for hiding scrollbars
const hideScrollbarStyle = document.createElement('style');
hideScrollbarStyle.textContent = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(hideScrollbarStyle);
}

interface GrowthItem {
  label: string;
  score: number;
  status: string;
  percentage: number;
  score_out_of_5: number;
}

interface WorldInsight {
  worldName: string;
  icon: 'briefcase' | 'hammer' | 'palette' | 'users' | 'leaf' | 'laptop' | 'heart' | 'lightbulb';
  whyThisWorld: string;
  evidenceFromGrowth: string;
  whatItMeans: string;
  nextStep: string;
}

interface Props {
  explorerMap?: {
    explored?: GrowthItem[];
    to_explore?: GrowthItem[];
  };
  explorerInsights?: {
    exploredWorlds?: WorldInsight[];
    toExploreWorlds?: WorldInsight[];
  };
}

function getIconComponent(iconType?: string, size: number = 28) {
  switch (iconType) {
    case 'briefcase':
      return <Briefcase size={size} strokeWidth={2} />;
    case 'hammer':
      return <Hammer size={size} strokeWidth={2} />;
    case 'palette':
      return <Palette size={size} strokeWidth={2} />;
    case 'users':
      return <Users size={size} strokeWidth={2} />;
    case 'leaf':
      return <Leaf size={size} strokeWidth={2} />;
    case 'laptop':
      return <Laptop size={size} strokeWidth={2} />;
    case 'heart':
      return <HeartPulse size={size} strokeWidth={2} />;
    case 'lightbulb':
      return <Lightbulb size={size} strokeWidth={2} />;
    default:
      return null;
  }
}

function getIconColor(iconType?: string) {
  switch (iconType) {
    case 'briefcase':
      return 'text-blue-600';
    case 'hammer':
      return 'text-orange-600';
    case 'palette':
      return 'text-purple-600';
    case 'users':
      return 'text-green-600';
    case 'leaf':
      return 'text-emerald-600';
    case 'laptop':
      return 'text-indigo-600';
    case 'heart':
      return 'text-red-600';
    case 'lightbulb':
      return 'text-yellow-600';
    default:
      return 'text-blue-600';
  }
}

function getWorldBgClass(iconType?: string) {
  switch (iconType) {
    case 'briefcase':
      return 'bg-blue-50';
    case 'hammer':
      return 'bg-orange-50';
    case 'palette':
      return 'bg-purple-50';
    case 'users':
      return 'bg-green-50';
    case 'leaf':
      return 'bg-emerald-50';
    case 'laptop':
      return 'bg-indigo-50';
    case 'heart':
      return 'bg-red-50';
    case 'lightbulb':
      return 'bg-yellow-50';
    default:
      return 'bg-blue-50';
  }
}

export const ExplorerMap: React.FC<Props> = ({ explorerMap, explorerInsights }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeMissionWorld, setActiveMissionWorld] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!explorerMap) return null;

  // Check scroll position to enable/disable buttons
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Show ALL worlds - removed slice limits
  const explored = explorerMap.explored || [];
  const toExplore = explorerMap.to_explore || [];
  const allWorlds = [...explored, ...toExplore];

  // Scroll handler
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  // Check scroll on mount and when worlds change
  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [allWorlds]);

  if (allWorlds.length === 0) return null;

  const selectedWorld = allWorlds[selectedIdx];
  const isExplored = explored.includes(selectedWorld);

  // Get all insights mapped by world name (case-insensitive, trim spaces)
  const allInsights = [
    ...(explorerInsights?.exploredWorlds || []),
    ...(explorerInsights?.toExploreWorlds || []),
  ];

  // Debug: Log insights availability
  if (typeof window !== 'undefined' && allWorlds.length > 0) {
    console.log('ExplorerMap - Total insights:', allInsights.length, 'Total worlds:', allWorlds.length);
    if (allInsights.length > 0) {
      console.log('Sample insight:', allInsights[0]);
    }
    console.log('Sample world:', allWorlds[0]);
  }

  // Flexible matching: case-insensitive and trim spaces
  const matchInsight = (worldLabel: string) => {
    const match = allInsights.find((i) =>
      i.worldName?.trim().toLowerCase() === worldLabel?.trim().toLowerCase()
    );
    if (!match && allInsights.length > 0) {
      console.log(`No match for world: "${worldLabel}"`);
    }
    return match;
  };

  const selectedInsight = matchInsight(selectedWorld.label);

  // Get insight for each world in nodes
  const getInsightForWorld = (world: GrowthItem) => {
    return matchInsight(world.label);
  };

  // Assign varied icons based on world index (when insight icon not available)
  const getDefaultIconForWorld = (idx: number) => {
    const icons = ['briefcase', 'hammer', 'palette', 'users', 'leaf', 'laptop', 'heart', 'lightbulb'];
    return icons[idx % icons.length];
  };

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-8 md:p-9 border border-blue-100 shadow-[0_12px_32px_rgba(29,78,216,0.03)]">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#11145a] tracking-tight font-sans">
            4. My Explorer Map
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-2xl font-sans">
            A visual roadmap of the worlds you have explored and the new worlds you can try next.
          </p>
        </div>
        <div className="self-start px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100/60 uppercase tracking-wider font-sans whitespace-nowrap">
          Exposure Tracker
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">

        {/* LEFT PANEL: Selected World Details */}
        <div className="w-full lg:w-[35%] xl:w-[33%] order-2 lg:order-1 flex flex-col">
          <div className="bg-white rounded-[24px] border border-blue-100 shadow-[0_12px_32px_rgba(29,78,216,0.03)] overflow-hidden flex flex-col flex-1">

            {/* Header band — tinted by status */}
            <div className={`px-6 sm:px-7 pt-6 pb-5 border-b ${
              isExplored
                ? 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-100'
                : 'bg-gradient-to-br from-blue-50/70 to-white border-blue-100'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                {/* World icon — same icon as the node on the map */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 bg-white shadow-sm ${
                  isExplored ? 'border-emerald-200' : 'border-blue-200'
                }`}>
                  <div className={selectedInsight ? getIconColor(selectedInsight.icon) : getIconColor(getDefaultIconForWorld(selectedIdx))}>
                    {selectedInsight
                      ? getIconComponent(selectedInsight.icon, 30)
                      : getIconComponent(getDefaultIconForWorld(selectedIdx), 30)}
                  </div>
                </div>

                {/* Status pill */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border font-sans tracking-tight ${
                  isExplored
                    ? 'text-emerald-700 bg-white border-emerald-200'
                    : 'text-blue-700 bg-white border-blue-200'
                }`}>
                  {isExplored
                    ? <CheckCircle2 size={12} className="text-emerald-500" />
                    : <Compass size={12} className="text-blue-500" />}
                  {selectedWorld.status}
                </span>
              </div>

              {/* Title */}
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans mb-1">
                Stage {selectedIdx + 1} · Exposure Journey
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#11145a] tracking-tight leading-tight">
                {selectedWorld.label}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 flex flex-col flex-1 gap-5">
              {selectedInsight ? (
                <div className="space-y-5 flex-1">

                  {/* Why This is Here */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 font-sans">
                      Why this is here
                    </h4>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed font-sans">
                      {selectedInsight.whyThisWorld}
                    </p>
                  </div>

                  {/* Evidence */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 font-sans">
                      Evidence from your Growth Map
                    </h4>
                    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${
                      isExplored
                        ? 'bg-emerald-50/60 border-emerald-100'
                        : 'bg-blue-50/60 border-blue-100'
                    }`}>
                      <Sparkles size={12} className={`flex-shrink-0 mt-0.5 ${isExplored ? 'text-emerald-500' : 'text-blue-500'}`} />
                      <span className="text-[11px] font-bold text-[#11145a] font-sans leading-snug">
                        {selectedInsight.evidenceFromGrowth}
                      </span>
                    </div>
                  </div>

                  {/* What This Means */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 font-sans">
                      What this means
                    </h4>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed font-sans">
                      {selectedInsight.whatItMeans}
                    </p>
                  </div>

                  {/* Next Step */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5 font-sans">
                      Recommended Next Step
                    </h4>
                    <p className="text-xs font-extrabold text-[#11145a] flex items-start gap-2 font-sans leading-snug">
                      <ArrowRight size={14} className={`flex-shrink-0 mt-px ${isExplored ? 'text-emerald-500' : 'text-blue-500'}`} />
                      {selectedInsight.nextStep}
                    </p>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-6">
                  <p className="text-xs font-semibold text-slate-500 text-center leading-relaxed">
                    Explore this fascinating world and discover your potential!
                  </p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => setActiveMissionWorld(selectedWorld.label)}
                disabled={activeMissionWorld === selectedWorld.label}
                className={`w-full py-3.5 px-5 rounded-xl font-black text-xs transition-all duration-200 flex items-center justify-center gap-2 border font-sans ${
                  activeMissionWorld === selectedWorld.label
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98]'
                }`}
              >
                {activeMissionWorld === selectedWorld.label ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Activated in Resource Studio!</span>
                  </>
                ) : (
                  <>
                    <span>Explore This World</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Journey Map */}
        <div className="w-full lg:w-[65%] xl:w-[67%] order-1 lg:order-2 bg-white rounded-[24px] border border-blue-100 shadow-[0_12px_32px_rgba(29,78,216,0.01)] p-6 sm:p-8 flex flex-col flex-1">

          {/* Headers */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold uppercase text-emerald-700 tracking-wider flex items-center gap-2 font-sans">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Explored Worlds
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                {explored.length} Area{explored.length !== 1 ? 's' : ''} Covered
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold uppercase text-blue-700 tracking-wider flex items-center gap-2 justify-end font-sans">
                Worlds to Explore
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                {toExplore.length} Opportunity{toExplore.length !== 1 ? 'ies' : ''}
              </p>
            </div>
          </div>

          {/* Journey Path — wave line drawn inside the scroll area so it always stays connected to nodes */}
          {(() => {
            const COL_W = 132;        // fixed column width per node
            const CIRCLE = 64;        // node circle size (w-16)
            const WAVE_OFFSET = 44;   // vertical zigzag amplitude
            const TOP_PAD = 10;       // breathing room above the highest circle
            const LABEL_H = 64;       // reserved space for stage + label text

            const stripW = allWorlds.length * COL_W;
            const stripH = TOP_PAD + WAVE_OFFSET + CIRCLE;

            // Exact center of every circle — the path is computed from these
            const centers = allWorlds.map((_, i) => ({
              x: i * COL_W + COL_W / 2,
              y: TOP_PAD + (i % 2 === 0 ? 0 : WAVE_OFFSET) + CIRCLE / 2,
            }));

            const buildPath = (pts: { x: number; y: number }[]) =>
              pts
                .map((p, i) =>
                  i === 0
                    ? `M ${p.x} ${p.y}`
                    : `C ${(pts[i - 1].x + p.x) / 2} ${pts[i - 1].y}, ${(pts[i - 1].x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`
                )
                .join(' ');

            const exploredPts = centers.slice(0, explored.length);
            const futurePts = centers.slice(explored.length > 0 ? explored.length - 1 : 0);

            return (
              <div className="relative select-none flex-1">

                {/* Floating scroll buttons, vertically centered on the strip */}
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="absolute left-0 z-30 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 hover:shadow-lg disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
                  style={{ top: stripH / 2 + 8, transform: 'translateY(-50%)' }}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="absolute right-0 z-30 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 hover:shadow-lg disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
                  style={{ top: stripH / 2 + 8, transform: 'translateY(-50%)' }}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </button>

                {/* Edge fade hints */}
                {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-12 z-20 pointer-events-none bg-gradient-to-r from-white to-transparent" />}
                {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-12 z-20 pointer-events-none bg-gradient-to-l from-white to-transparent" />}

                {/* Scrollable strip — SVG and nodes share the same coordinate space */}
                <div
                  ref={scrollContainerRef}
                  onScroll={checkScroll}
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide py-2"
                >
                  <div className="relative mx-auto" style={{ width: stripW, height: stripH + LABEL_H }}>

                    {/* Wave path through the exact node centers */}
                    <svg
                      className="absolute left-0 top-0 pointer-events-none"
                      width={stripW}
                      height={stripH}
                      viewBox={`0 0 ${stripW} ${stripH}`}
                      fill="none"
                    >
                      {exploredPts.length >= 2 && (
                        <path
                          d={buildPath(exploredPts)}
                          stroke="rgb(16, 185, 129)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                      {futurePts.length >= 2 && toExplore.length > 0 && (
                        <path
                          d={buildPath(futurePts)}
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray="1 8"
                        />
                      )}
                    </svg>

                    {/* Nodes on the wave */}
                    <div className="absolute left-0 top-0 flex">
                      {allWorlds.map((world, idx) => {
                        const worldInsight = getInsightForWorld(world);
                        const isWorldExplored = explored.includes(world);
                        const isSelected = selectedIdx === idx;
                        const offsetTop = TOP_PAD + (idx % 2 === 0 ? 0 : WAVE_OFFSET);

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedIdx(idx)}
                            className="relative flex flex-col items-center focus:outline-none cursor-pointer flex-shrink-0 group"
                            style={{ width: COL_W, paddingTop: offsetTop }}
                          >
                            {/* Circle */}
                            <div
                              className={`w-16 h-16 rounded-full bg-white flex items-center justify-center transition-all duration-300 relative ${
                                isSelected
                                  ? isWorldExplored
                                    ? 'border-[3px] border-emerald-500 shadow-lg ring-4 ring-emerald-50 scale-105'
                                    : 'border-[3px] border-blue-500 shadow-lg ring-4 ring-blue-50 scale-105'
                                  : isWorldExplored
                                    ? 'border-2 border-emerald-300 shadow-sm group-hover:shadow-md group-hover:border-emerald-400 group-hover:-translate-y-0.5'
                                    : 'border-2 border-blue-300 shadow-sm group-hover:shadow-md group-hover:border-blue-400 group-hover:-translate-y-0.5'
                              }`}
                            >
                              {worldInsight ? (
                                <div className={`p-2.5 rounded-full ${getWorldBgClass(worldInsight.icon)}`}>
                                  <div className={getIconColor(worldInsight.icon)}>
                                    {getIconComponent(worldInsight.icon, 24)}
                                  </div>
                                </div>
                              ) : (
                                <div className={`p-2.5 rounded-full ${getWorldBgClass(getDefaultIconForWorld(idx))}`}>
                                  <div className={getIconColor(getDefaultIconForWorld(idx))}>
                                    {getIconComponent(getDefaultIconForWorld(idx), 24)}
                                  </div>
                                </div>
                              )}

                              {/* Status badge */}
                              <div className="absolute -top-0.5 -right-0.5">
                                {isWorldExplored ? (
                                  <div className="bg-emerald-500 text-white p-[3px] rounded-full border-2 border-white shadow-sm">
                                    <CheckCircle2 size={11} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div className="bg-blue-500 text-white p-[3px] rounded-full border-2 border-white shadow-sm">
                                    <Compass size={11} strokeWidth={2.5} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Label */}
                            <div className="text-center mt-2.5 px-1 w-full">
                              <p className={`text-[8px] font-bold tracking-widest uppercase ${isWorldExplored ? 'text-emerald-600' : 'text-blue-600'}`}>
                                Stage {idx + 1}
                              </p>
                              <h4 className={`text-[11px] leading-tight mt-0.5 whitespace-normal break-words ${isSelected ? 'font-bold text-[#11145a]' : 'font-semibold text-slate-700'}`}>
                                {world.label}
                              </h4>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}

            {/* Parent Guide Footer */}
            <div className="mt-10 pt-6 border-t border-slate-200 bg-blue-50/50 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">💡</span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                <strong className="font-semibold">Parent Guide:</strong> This section charts your child's hands-on exposure across diverse worlds. It's designed to spark healthy curiosity. Click any bubble to explore!
              </p>
            </div>

        </div>

      </div>

    </div>
  );
};
