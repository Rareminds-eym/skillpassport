import { useEffect, useState, type FC } from 'react';
import { X } from 'lucide-react';

export interface CapabilityArea {
  capability_area: string;
  score_out_of_5: number;
  percentage: number;
  status: string;
}

interface BoltCapabilityWheelProps {
  capabilities?: CapabilityArea[];
  className?: string;
  // eslint-disable-next-line no-unused-vars
  onActiveCapabilityChange?: (capability: CapabilityArea | null) => void;
}

interface Props {
  capabilities?: CapabilityArea[];
  isActive?: boolean;
}

const BOLT_SEGMENT_COLORS = [
  '#9b87f5',
  '#f5b94c',
  '#668ee8',
  '#9fcf9f',
  '#a991dc',
  '#e9a4c2',
  '#f0b77d',
  '#8db8e8',
];

const LABEL_LINE_OVERRIDES: Record<string, string[]> = {
  'Exposure & Career Awareness': ['Exposure &', 'Career Awareness'],
  'Exposure & Exploration': ['Exposure &', 'Exploration'],
  'Thinking & Problem Solving': ['Thinking &', 'Problem Solving'],
  'Digital & AI Literacy': ['Digital & AI', 'Literacy'],
  'Execution & Independence': ['Execution &', 'Independence'],
  'Portfolio & Evidence': ['Portfolio &', 'Evidence'],
  'Communication / Teaching': ['Communication /', 'Teaching'],
  'Social / EQ': ['Social / EQ'],
  'Self / SQ': ['Self / SQ'],
};

const getWheelLabelLines = (label: string) => {
  if (LABEL_LINE_OVERRIDES[label]) return LABEL_LINE_OVERRIDES[label];
  if (label.includes(' & ')) {
    return label.split(' & ').map((part, i) => (i === 0 ? `${part} &` : part));
  }
  if (label.includes(' / ') || label.length <= 16) return [label];

  const words = label.split(/\s+/);
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')].filter(Boolean);
};

const clampPercentage = (value?: number) => Math.max(0, Math.min(100, value ?? 0));

/**
 * Shared Bolt-style Capability Wheel presentation.
 *
 * Mirrors the SVG treatment from:
 * C:\Users\anand\Downloads\school-assessment-design-v3\school-assessment-design-v3\src\components\CapabilityWheel.tsx
 *
 * It maps SkillPassport's real capability_wheel rows into Bolt's visual
 * structure without copying Bolt's mock percentages or labels.
 */
export const BoltCapabilityWheel: FC<BoltCapabilityWheelProps> = ({
  capabilities,
  className = '',
  onActiveCapabilityChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
        onActiveCapabilityChange?.(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex, onActiveCapabilityChange]);

  if (!capabilities?.length) return null;

  const cx = 260;
  const cy = 260;
  const maxR = 132;
  const minR = 26;
  const step = (Math.PI * 2) / capabilities.length;
  const polar = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const active = selectedIndex !== null ? capabilities[selectedIndex] : null;
  const activeColor =
    selectedIndex !== null ? BOLT_SEGMENT_COLORS[selectedIndex % BOLT_SEGMENT_COLORS.length] : '#000';

  return (
    <>
      <div className={`flex w-full max-w-lg items-center justify-center rounded-xl bg-[#fbfdff] p-4 ${className}`}>
        <svg viewBox="0 0 520 520" className="w-full max-w-[440px] overflow-visible" aria-label="Capability Wheel">
          <circle cx={cx} cy={cy} r="204" fill="#fbfdff" stroke="#e8eef6" />
          {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
            <circle
              key={level}
              cx={cx}
              cy={cy}
              r={minR + (maxR - minR) * level}
              fill="none"
              stroke="#dce5ef"
              strokeWidth="1"
              strokeDasharray={level === 1 ? undefined : '2 5'}
            />
          ))}
          {capabilities.map((item, index) => {
            const color = BOLT_SEGMENT_COLORS[index % BOLT_SEGMENT_COLORS.length];
            const value = clampPercentage(item.percentage);
            const start = step * index;
            const end = step * (index + 1);
            const radius = minR + (maxR - minR) * (value / 100);
            const startInner = polar(start, minR);
            const startOuter = polar(start, radius);
            const endOuter = polar(end, radius);
            const endInner = polar(end, minR);
            const path = `M ${startInner.x} ${startInner.y} L ${startOuter.x} ${startOuter.y} A ${radius} ${radius} 0 0 1 ${endOuter.x} ${endOuter.y} L ${endInner.x} ${endInner.y} A ${minR} ${minR} 0 0 0 ${startInner.x} ${startInner.y} Z`;

            return (
              <path
                key={`${item.capability_area}-${index}`}
                d={path}
                fill={color}
                opacity={hoveredIndex === null || hoveredIndex === index ? 0.88 : 0.2}
                stroke="white"
                strokeWidth="2"
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  onActiveCapabilityChange?.(item);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  if (selectedIndex === null) onActiveCapabilityChange?.(null);
                }}
                onClick={() => {
                  setSelectedIndex(index);
                  onActiveCapabilityChange?.(item);
                }}
                style={{ cursor: 'pointer', transition: 'opacity 180ms ease' }}
              />
            );
          })}
          <circle cx={cx} cy={cy} r="30" fill="white" stroke="#d5e0eb" strokeWidth="1.5" />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#34506c"
            letterSpacing="0.8"
          >
            GROWTH
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#34506c"
            letterSpacing="0.8"
          >
            MAP
          </text>
          {capabilities.map((item, index) => {
            const color = BOLT_SEGMENT_COLORS[index % BOLT_SEGMENT_COLORS.length];
            const value = clampPercentage(item.percentage);
            const position = polar(step * (index + 0.5), 164);
            const anchor = position.x > cx + 8 ? 'start' : position.x < cx - 8 ? 'end' : 'middle';
            const lines = getWheelLabelLines(item.capability_area);

            return (
              <text
                key={`${item.capability_area}-${index}-label`}
                x={position.x}
                y={position.y}
                textAnchor={anchor}
                fontSize="9"
                fontWeight="600"
                fill="#48627c"
                opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.35}
                style={{ transition: 'opacity 180ms ease' }}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  onActiveCapabilityChange?.(item);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  if (selectedIndex === null) onActiveCapabilityChange?.(null);
                }}
                onClick={() => {
                  setSelectedIndex(index);
                  onActiveCapabilityChange?.(item);
                }}
                className="cursor-pointer"
              >
                {lines.map((line, lineIndex) => (
                  <tspan key={`${line}-${lineIndex}`} x={position.x} dy={lineIndex === 0 ? 0 : 10}>
                    {line}
                  </tspan>
                ))}
                <tspan x={position.x} dy="12" fontSize="10" fontWeight="800" fill={color}>
                  {Math.round(value)}%
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/30 p-5"
          onClick={() => {
            setSelectedIndex(null);
            onActiveCapabilityChange?.(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`${active.capability_area} details`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Capability detail
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-800">{active.capability_area}</h3>
              </div>
              <button
                type="button"
                aria-label="Close capability details"
                onClick={() => {
                  setSelectedIndex(null);
                  onActiveCapabilityChange?.(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-end justify-between">
                <span className="text-xs text-slate-500">Current growth</span>
                <strong className="text-2xl" style={{ color: activeColor }}>
                  {Math.round(clampPercentage(active.percentage))}%
                </strong>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${clampPercentage(active.percentage)}%`,
                    backgroundColor: activeColor,
                  }}
                />
              </div>
              <span className="mt-3 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {active.status}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              You are building confidence in {active.capability_area.toLowerCase()}. Keep practising,
              exploring new experiences, and collecting examples of your progress.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Tabs / Stage Overview wrapper. The modal supplies its own outer shell,
 * sidebar, and navigation, so this only frames the shared Bolt wheel.
 */
export const CapabilityWheel: FC<Props> = ({ capabilities, isActive }) => {
  if (!capabilities?.length) return null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition-all duration-500 sm:p-8 flex justify-center items-center ${
        isActive ? 'ring-2 ring-indigo-300' : ''
      }`}
    >
      <BoltCapabilityWheel capabilities={capabilities} />
    </div>
  );
};
