import { useState, type FC, type ReactNode } from 'react';
import { BarChart2, Brain, Eye, Puzzle } from 'lucide-react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface ThinkingStyle {
  title: string;
  description: string;
  icon: string;
  value?: number;
}

interface Props {
  thinkingStyles?: ThinkingStyle[];
  isActive?: boolean;
  sectionIntro?: SectionIntro;
}

interface StyleCard {
  label: string;
  icon: ReactNode;
  color: string;
  description: string;
  value: number | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];
// viewBox is taller/wider than the ring radius so axis labels (up to
// "Pattern Recognition"-length text) have room to render without being
// clipped by the SVG's default overflow:hidden at the viewBox edge.
const RADAR_SIZE = 300;
const RADAR_CENTER = RADAR_SIZE / 2;
const RADAR_RADIUS = 82;
const RADAR_RINGS = [0.25, 0.5, 0.75, 1];
const NEUTRAL_RADIUS_RATIO = 0.68;

const STYLE_ICONS = [<Puzzle size={16} />, <Brain size={16} />, <Eye size={16} />, <BarChart2 size={16} />];

function iconFor(index: number) {
  return STYLE_ICONS[index % STYLE_ICONS.length];
}

function axisPoint(angle: number, radius: number) {
  return {
    x: RADAR_CENTER + radius * Math.cos(angle - Math.PI / 2),
    y: RADAR_CENTER + radius * Math.sin(angle - Math.PI / 2),
  };
}

export const ThinkingStyleSnapshot: FC<Props> = ({ thinkingStyles, isActive, sectionIntro }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!thinkingStyles?.length) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  const styles: StyleCard[] = thinkingStyles.map((style, index) => ({
    label: style.title,
    icon: iconFor(index),
    color: COLORS[index % COLORS.length],
    description: style.description,
    value: typeof style.value === 'number' ? Math.max(0, Math.min(100, style.value)) : null,
  }));
  // Each axis independently uses its own real Adaptive Aptitude value when
  // present (e.g. Pattern Recognition, Visual Thinking) — styles with no
  // legitimate real match (e.g. Problem Solving, Decision Making) fall back to
  // the fixed neutral radius for that one axis only, rather than fabricating a
  // number or forcing the whole radar to go neutral just because some styles
  // lack real data.
  const angles = styles.map((_, index) => (index * 2 * Math.PI) / styles.length);
  const radarPoints = styles.map((style, index) => {
    const radiusRatio = style.value !== null ? style.value / 100 : NEUTRAL_RADIUS_RATIO;
    return axisPoint(angles[index], RADAR_RADIUS * radiusRatio);
  });
  const radarPolygon = radarPoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className={isActive ? 'ring-2 ring-blue-300 rounded-2xl' : undefined}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-full">FREE THINKING ENGINE</span>
      </div>
      {intro && (
        <>
          <h2 className="text-base font-bold text-gray-800 mt-2 mb-1">{intro.heading}</h2>
          <p className="text-xs text-gray-500 mb-6">{intro.description}</p>
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="relative shrink-0" style={{ width: RADAR_SIZE, height: RADAR_SIZE }}>
            <svg viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="h-full w-full overflow-visible">
              {RADAR_RINGS.map((ring) => {
                const points = angles
                  .map((angle) => {
                    const point = axisPoint(angle, RADAR_RADIUS * ring);
                    return `${point.x},${point.y}`;
                  })
                  .join(' ');

                return (
                  <polygon
                    key={ring}
                    points={points}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                );
              })}

              {angles.map((angle, index) => {
                const point = axisPoint(angle, RADAR_RADIUS);
                return (
                  <line
                    key={styles[index].label}
                    x1={RADAR_CENTER}
                    y1={RADAR_CENTER}
                    x2={point.x}
                    y2={point.y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                );
              })}

              <polygon
                points={radarPolygon}
                fill="rgba(59,130,246,0.12)"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeLinejoin="round"
              />

              {radarPoints.map((point, index) => (
                <g key={styles[index].label}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hovered === index ? 7 : 5}
                    fill={styles[index].color}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${styles[index].label} thinking style`}
                  />
                  {hovered === index && (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={12}
                      fill="none"
                      stroke={styles[index].color}
                      strokeWidth={1.5}
                      opacity={0.4}
                      className="animate-ping"
                    />
                  )}
                </g>
              ))}

              <circle cx={RADAR_CENTER} cy={RADAR_CENTER} r={3} fill="#9ca3af" />

              {styles.map((style, index) => {
                const point = axisPoint(angles[index], RADAR_RADIUS + 28);
                return (
                  <text
                    key={style.label}
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="cursor-pointer text-[10px] font-semibold"
                    fill={hovered === index ? style.color : '#6b7280'}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={style.label}
                  >
                    {style.label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="w-full flex-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {styles.map((style, index) => (
                <div
                  key={style.label}
                  className="rounded-xl border p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: hovered === index ? style.color : '#e5e7eb',
                    borderWidth: hovered === index ? 2 : 1,
                    backgroundColor: hovered === index ? `${style.color}08` : '#f9fafb',
                  }}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ color: style.color, backgroundColor: `${style.color}15` }}
                    >
                      {style.icon}
                    </span>
                    <span className="text-sm font-bold text-gray-800">{style.label}</span>
                  </div>
                  {style.value !== null && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${style.value}%`, backgroundColor: style.color }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: style.color }}>
                        {style.value}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 min-h-[44px] rounded-xl border border-gray-100 bg-gray-50 p-3">
              {hovered !== null ? (
                <div className="flex items-start gap-2">
                  <span style={{ color: styles[hovered].color }} className="mt-0.5">
                    {styles[hovered].icon}
                  </span>
                  <span className="text-xs font-semibold text-gray-700">{styles[hovered].label}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Hover a point or label to see how this thinking power grows.
                </p>
              )}
              </div>
            </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-5">
        Thinking styles are mental modes you can switch on. Grow new branches by trying tasks outside your comfort zone!
      </p>
    </div>
  );
};
