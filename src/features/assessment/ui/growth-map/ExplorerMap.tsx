import { useMemo, useRef, useState, type FC } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Rocket } from 'lucide-react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface GrowthItem {
  label: string;
  score: number;
  status: string;
  percentage: number;
  score_out_of_5: number;
}

interface WorldInsight {
  worldName: string;
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
  sectionIntro?: SectionIntro;
}

const NODE_SPACING = 132;
const NODE_RADIUS = 14;
const MAP_PADDING_X = 76;
const TOP_Y = 72;
const BOTTOM_Y = 132;
const VIEW_HEIGHT = 224;

// Map colors (design system: gray-200 / emerald-500 / emerald-100 / gray-100 / blue-500 / blue-600 / gray-300)
const TRACK_COLOR = '#e5e7eb';
const EXPLORED_COLOR = '#10b981';
const TO_EXPLORE_COLOR = '#3b82f6';
const ACTIVE_NODE_STROKE_COLOR = '#2563eb';
const EXPLORED_NODE_FILL_COLOR = '#d1fae5';
const UNEXPLORED_NODE_FILL_COLOR = '#f3f4f6';
const UNEXPLORED_NODE_STROKE_COLOR = '#d1d5db';

function buildCurvePath(points: { cx: number; cy: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].cx} ${points[0].cy}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev.cx + current.cx) / 2;
    d += ` C ${midX} ${prev.cy}, ${midX} ${current.cy}, ${current.cx} ${current.cy}`;
  }
  return d;
}

function splitLabel(label: string) {
  const parts = label.split(' / ').slice(0, 2);
  if (parts.length > 1) return parts;

  const words = label.split(/\s+/);
  if (words.length <= 1 || label.length <= 16) return [label];

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
}

export const ExplorerMap: FC<Props> = ({ explorerMap, explorerInsights, sectionIntro }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mapScrollRef = useRef<HTMLDivElement>(null);
  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;
  const insights = useMemo(
    () => [...(explorerInsights?.exploredWorlds || []), ...(explorerInsights?.toExploreWorlds || [])],
    [explorerInsights?.exploredWorlds, explorerInsights?.toExploreWorlds]
  );

  if (!explorerMap) return null;

  const explored = explorerMap.explored || [];
  const toExplore = explorerMap.to_explore || [];
  const allWorlds = [...explored, ...toExplore];
  if (!allWorlds.length) return null;

  const selectedWorld = allWorlds[Math.min(selectedIndex, allWorlds.length - 1)];
  const isSelectedExplored = selectedIndex < explored.length;
  const width = Math.max((allWorlds.length - 1) * NODE_SPACING + MAP_PADDING_X * 2, 520);

  const positions = allWorlds.map((_, index) => ({
    cx: MAP_PADDING_X + index * NODE_SPACING,
    cy: index % 2 === 0 ? TOP_Y : BOTTOM_Y,
  }));

  const selectedInsight = insights.find(
    (insight) => insight.worldName?.trim().toLowerCase() === selectedWorld.label?.trim().toLowerCase()
  );

  const exploredCount = explored.length;
  const unexploredCount = toExplore.length;
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < allWorlds.length - 1;

  const scrollToWorld = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, allWorlds.length - 1));
    setSelectedIndex(clampedIndex);

    const scrollNode = mapScrollRef.current;
    if (!scrollNode) return;

    const targetX = positions[clampedIndex]?.cx ?? 0;
    scrollNode.scrollTo({
      left: Math.max(targetX - scrollNode.clientWidth / 2, 0),
      behavior: 'smooth',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {intro && <h2 className="text-base font-bold text-gray-800">{intro.heading}</h2>}
        <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
          EXPLORER TRACKER <ExternalLink size={11} />
        </button>
      </div>
      {intro ? (
        <p className="text-xs text-gray-500 mb-6">{intro.description}</p>
      ) : (
        <div className="mb-5" />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-2xl p-6 text-white min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full font-semibold">
              {selectedWorld.status || 'Ready for Next Level'}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4 mt-2">
            <MapPin size={13} className="text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold">
              {isSelectedExplored ? 'CURRENTLY EXPLORING' : 'WORLD TO EXPLORE'}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-4">{selectedWorld.label}</h3>

          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1 font-semibold">WHY THIS IS YOU:</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {selectedInsight?.whyThisWorld || 'This world connects with your current growth pattern and interests.'}
            </p>
            {selectedInsight?.evidenceFromGrowth && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="max-w-full whitespace-normal break-words text-xs bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full">
                  {selectedInsight.evidenceFromGrowth}
                </span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1 font-semibold">ABOUT THIS WORLD:</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {selectedInsight?.whatItMeans || 'Explore this world to discover where your strengths can show up in real work.'}
            </p>
          </div>

          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-1 font-semibold">YOUR CHALLENGE NEXT:</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {selectedInsight?.nextStep || 'Try a small challenge in this world and collect evidence of what you learn.'}
            </p>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
          >
            <Rocket size={13} /> Explore This World
          </button>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <MapPin size={11} /> EXPLORED WORLDS
              <span className="text-gray-400 font-normal ml-1">
                {exploredCount} Area{exploredCount === 1 ? '' : 's'}
              </span>
            </span>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              WORLDS TO EXPLORE <ChevronRight size={11} />
              <span className="text-gray-400 font-normal">
                {unexploredCount} Opportunit{unexploredCount === 1 ? 'y' : 'ies'}
              </span>
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div ref={mapScrollRef} className="overflow-x-auto px-1 pb-3">
              <svg viewBox={`0 0 ${width} ${VIEW_HEIGHT}`} className="block" style={{ minWidth: width, height: VIEW_HEIGHT }}>
                <path d={buildCurvePath(positions)} fill="none" stroke={TRACK_COLOR} strokeWidth={2} strokeDasharray="5 4" />

                {exploredCount > 1 && (
                  <path
                    d={buildCurvePath(positions.slice(0, exploredCount))}
                    fill="none"
                    stroke={EXPLORED_COLOR}
                    strokeWidth={2.5}
                  />
                )}

                {toExplore.length > 0 && (
                  <path
                    d={buildCurvePath(positions.slice(Math.max(exploredCount - 1, 0)))}
                    fill="none"
                    stroke={TO_EXPLORE_COLOR}
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                  />
                )}

                {allWorlds.map((world, index) => {
                  const { cx, cy } = positions[index];
                  const isExplored = index < exploredCount;
                  const isActive = index === selectedIndex;
                  const labelBelow = index % 2 === 0;
                  const labelY = labelBelow ? cy + NODE_RADIUS + 24 : cy - NODE_RADIUS - 24;

                  return (
                    <g
                      key={`${world.label}-${index}`}
                      className="cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                      style={{ outline: 'none' }}
                      onClick={() => scrollToWorld(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          scrollToWorld(index);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${world.label}${isExplored ? ' (explored)' : ' (to explore)'}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isActive && (
                        <circle cx={cx} cy={cy} r={NODE_RADIUS + 6} fill="none" stroke={TO_EXPLORE_COLOR} strokeWidth={1.5} opacity={0.3} />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={NODE_RADIUS}
                        fill={isActive ? TO_EXPLORE_COLOR : isExplored ? EXPLORED_NODE_FILL_COLOR : UNEXPLORED_NODE_FILL_COLOR}
                        stroke={isActive ? ACTIVE_NODE_STROKE_COLOR : isExplored ? EXPLORED_COLOR : UNEXPLORED_NODE_STROKE_COLOR}
                        strokeWidth={1.5}
                      />
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight="700"
                        fill={isActive ? '#ffffff' : isExplored ? '#059669' : '#9ca3af'}
                      >
                        {index + 1}
                      </text>

                      {splitLabel(world.label).map((part, partIndex) => (
                        <text
                          key={part}
                          x={cx}
                          y={labelY + partIndex * 11}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={9.5}
                          fill={isActive ? '#1e40af' : isExplored ? '#047857' : '#6b7280'}
                          fontWeight={isActive || isExplored ? '600' : '400'}
                        >
                          {part}
                        </text>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-1 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => scrollToWorld(selectedIndex - 1)}
                disabled={!canGoPrev}
                aria-label="Previous explorer world"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => scrollToWorld(selectedIndex + 1)}
                disabled={!canGoNext}
                aria-label="Next explorer world"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
