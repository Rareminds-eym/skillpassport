import { useState, type ComponentType, type FC } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Eye,
  Handshake,
  Heart,
  Search,
  ShieldCheck,
  Smile,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';

import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface StrengthItem {
  label: string;
  description: string;
  tag: string;
}

interface Props {
  strengths: StrengthItem[];
  isActive?: boolean;
  sectionIntro?: SectionIntro;
}

const POSITIONS = [
  { vx: 200, vy: 50, color: '#3b82f6' },
  { vx: 70, vy: 110, color: '#10b981' },
  { vx: 330, vy: 110, color: '#f9a8d4' },
  { vx: 70, vy: 250, color: '#8b5cf6' },
  { vx: 200, vy: 310, color: '#f59e0b' },
  { vx: 330, vy: 250, color: '#06b6d4' },
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [2, 5],
  [5, 4],
  [4, 3],
  [3, 1],
  [1, 2],
  [0, 4],
];

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  leadership: Users,
  leader: Users,
  perseverance: Target,
  persistent: Activity,
  helpfulness: Handshake,
  helpful: Handshake,
  creativity: Zap,
  creative: Zap,
  curiosity: Search,
  curious: Search,
  responsibility: ShieldCheck,
  responsible: ShieldCheck,
  kindness: Heart,
  kind: Heart,
  observant: Eye,
  honest: ShieldCheck,
  teamwork: Users,
  discipline: BookOpen,
  focus: Target,
  learning: BookOpen,
  empathy: Smile,
};

function getIcon(label: string) {
  const normalized = label.toLowerCase();
  const key = Object.keys(ICONS).find((candidate) => normalized.includes(candidate));
  return key ? ICONS[key] : Award;
}

function getStage(tag: string) {
  const normalized = tag?.toLowerCase() || '';
  if (normalized.includes('super') || normalized.includes('signature') || normalized.includes('strong')) {
    return 'STRONG';
  }
  if (normalized.includes('develop')) return 'DEVELOPING';
  if (normalized.includes('build')) return 'BUILDING';
  return tag?.toUpperCase() || 'DEVELOPING';
}

export const StrengthsCharacter: FC<Props> = ({ strengths, isActive, sectionIntro }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!strengths?.length) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  const nodes = strengths.slice(0, 6).map((strength, index) => ({
    ...strength,
    ...POSITIONS[index % POSITIONS.length],
    stage: getStage(strength.tag),
  }));

  const isEdgeActive = (a: number, b: number) =>
    hovered !== null && (a === hovered || b === hovered);

  const isNodeDim = (index: number) =>
    hovered !== null &&
    index !== hovered &&
    !EDGES.some(([a, b]) => (a === hovered && b === index) || (b === hovered && a === index));

  const connectedNames = (index: number) =>
    EDGES.filter(([a, b]) => a === index || b === index)
      .map(([a, b]) => (a === index ? b : a))
      .filter((nodeIndex) => nodeIndex < nodes.length)
      .map((nodeIndex) => nodes[nodeIndex].label);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm ${
        isActive ? 'ring-2 ring-blue-300' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {intro && <h2 className="text-base font-bold text-gray-800">{intro.heading}</h2>}
        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
          <Sparkles size={10} /> CONSTELLATION
        </span>
      </div>
      {intro ? (
        <p className="text-xs text-gray-500 mb-4">{intro.description}</p>
      ) : (
        <div className="mb-3" />
      )}

      <div className="relative w-full" style={{ aspectRatio: '400 / 340' }}>
        <svg viewBox="0 0 400 340" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          {EDGES.filter(([a, b]) => a < nodes.length && b < nodes.length).map(([a, b], index) => {
            const active = isEdgeActive(a, b);
            const dim = hovered !== null && !active;
            return (
              <line
                key={`${a}-${b}-${index}`}
                x1={nodes[a].vx}
                y1={nodes[a].vy}
                x2={nodes[b].vx}
                y2={nodes[b].vy}
                stroke={active && hovered !== null ? nodes[hovered].color : '#d1d5db'}
                strokeWidth={active ? 2.5 : 1}
                strokeDasharray={active ? '0' : '4 3'}
                opacity={dim ? 0.15 : 1}
                style={{ transition: 'stroke 0.25s, stroke-width 0.25s, opacity 0.25s' }}
              />
            );
          })}
        </svg>

        {nodes.map((strength, index) => {
          const Icon = getIcon(strength.label);
          const isActiveNode = hovered === index;
          const isDim = isNodeDim(index);

          return (
            <div
              key={`${strength.label}-${index}`}
              className="absolute flex flex-col items-center cursor-pointer"
              style={{
                left: `${(strength.vx / 400) * 100}%`,
                top: `${(strength.vy / 340) * 100}%`,
                transform: 'translate(-50%, -50%)',
                opacity: isDim ? 0.3 : 1,
                transition: 'opacity 0.25s',
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: strength.color,
                  opacity: isActiveNode ? 0.3 : 0.12,
                  animationDuration: isActiveNode ? '1s' : '2.5s',
                }}
              />
              <div
                className="relative w-11 h-11 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-200"
                style={{
                  backgroundColor: isActiveNode ? strength.color : 'white',
                  borderColor: strength.color,
                  color: isActiveNode ? 'white' : strength.color,
                  transform: isActiveNode ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                <Icon size={16} />
              </div>
              <span
                className="text-xs font-semibold mt-1.5 whitespace-nowrap transition-colors"
                style={{ color: isActiveNode ? strength.color : '#374151' }}
              >
                {strength.label}
              </span>
              <span className="text-[10px] font-medium mt-0.5" style={{ color: strength.color, opacity: 0.7 }}>
                {strength.stage}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 min-h-[72px] rounded-xl border transition-all"
        style={{
          borderColor: hovered !== null ? nodes[hovered].color : '#e5e7eb',
          backgroundColor: hovered !== null ? `${nodes[hovered].color}08` : '#f9fafb',
        }}
      >
        {hovered !== null ? (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: nodes[hovered].color }} />
              <span className="text-sm font-bold" style={{ color: nodes[hovered].color }}>
                {nodes[hovered].label}
              </span>
              <span className="text-xs text-gray-400">-</span>
              <span className="text-xs font-semibold" style={{ color: nodes[hovered].color }}>
                {nodes[hovered].stage}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">{nodes[hovered].description}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400">Connects to:</span>
              {connectedNames(hovered).map((name) => (
                <span key={name} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 flex items-center gap-2">
            <Sparkles size={14} className="text-gray-300" />
            <p className="text-xs text-gray-400">
              Hover over a strength star to see how it was noticed and what it connects to.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
