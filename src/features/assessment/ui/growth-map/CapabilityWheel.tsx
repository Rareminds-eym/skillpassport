import React, { useState } from 'react';
import {
  Award,
  Compass,
  Heart,
  Users,
  MessageSquare,
  Brain,
  Lightbulb,
  Play,
  FolderCheck,
  PieChart,
  MousePointer2,
} from 'lucide-react';

interface CapabilityArea {
  capability_area: string;
  score_out_of_5: number;
  percentage: number;
  status: string;
}

interface Props {
  capabilities?: CapabilityArea[];
  isActive?: boolean;
}

const LEVEL_VALUE_MAP: Record<string, number> = {
  'Starting': 1,
  'Practicing': 2,
  'Growing': 3,
  'Confident': 4,
  'Ready for Next Level': 5,
};

interface WheelTheme {
  color: string;      // main hex — SVG petal fill + arc stroke
  soft: string;       // light hex — chips / backgrounds
  text: string;       // Tailwind text class for labels
  chipBg: string;     // Tailwind bg class for chips
  icon: React.ReactNode;
}

const COLOR_THEMES: Record<string, WheelTheme> = {
  'Exposure & Career Awareness': { color: '#f59e0b', soft: '#fffbeb', text: 'text-amber-600', chipBg: 'bg-amber-50', icon: <Compass size={13} /> },
  'Curiosity':                   { color: '#eab308', soft: '#fefce8', text: 'text-yellow-600', chipBg: 'bg-yellow-50', icon: <Lightbulb size={13} /> },
  'Self / EQ':                   { color: '#ec4899', soft: '#fdf2f8', text: 'text-pink-600', chipBg: 'bg-pink-50', icon: <Heart size={13} /> },
  'Social / SQ':                 { color: '#10b981', soft: '#ecfdf5', text: 'text-emerald-600', chipBg: 'bg-emerald-50', icon: <Users size={13} /> },
  'Communication':               { color: '#3b82f6', soft: '#eff6ff', text: 'text-blue-600', chipBg: 'bg-blue-50', icon: <MessageSquare size={13} /> },
  'Thinking & Problem Solving':  { color: '#a855f7', soft: '#faf5ff', text: 'text-purple-600', chipBg: 'bg-purple-50', icon: <Brain size={13} /> },
  'Digital & AI Literacy':       { color: '#8b5cf6', soft: '#f5f3ff', text: 'text-violet-600', chipBg: 'bg-violet-50', icon: <Lightbulb size={13} /> },
  'Execution & Independence':    { color: '#6366f1', soft: '#eef2ff', text: 'text-indigo-600', chipBg: 'bg-indigo-50', icon: <Play size={13} /> },
  'Portfolio & Evidence':        { color: '#06b6d4', soft: '#ecfeff', text: 'text-cyan-600', chipBg: 'bg-cyan-50', icon: <FolderCheck size={13} /> },
};

const FALLBACK_THEME = COLOR_THEMES['Thinking & Problem Solving'];

const STATUS_FEEDBACK: Record<string, string> = {
  'Ready for Next Level': 'You can apply this strongly — ready to take it to the next level and help others!',
  'Confident': 'You show this consistently. Keep using it in bigger challenges!',
  'Growing': "You are improving steadily — you're making progress every day.",
  'Practicing': 'You can do this with support. Keep taking on related missions!',
  'Starting': 'You are beginning to build this. Every quest helps you level up!',
};

/** Legend: the 5 growth stages matching the radar's concentric rings */
export function CapabilityLegend() {
  const steps = ['Starting', 'Practicing', 'Growing', 'Confident', 'Ready for Next Level'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/70 border border-slate-100 p-4 rounded-xl">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-white text-[#11145A] font-black flex items-center justify-center text-[9px] border border-slate-200 shrink-0">
            {i + 1}
          </span>
          <span className="text-[10px] font-bold text-slate-600 font-sans leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface CapabilityLogBoxProps {
  hoveredSlice: string | null;
  items: CapabilityArea[];
}

/** Detail box: shows the hovered capability's status and encouragement */
export function CapabilityLogBox({ hoveredSlice, items }: CapabilityLogBoxProps) {
  const selectedItem = hoveredSlice ? items.find((i) => i.capability_area === hoveredSlice) : null;

  if (selectedItem) {
    const theme = COLOR_THEMES[selectedItem.capability_area] || FALLBACK_THEME;

    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 min-h-[120px] flex flex-col justify-center gap-3 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className={`p-2.5 rounded-xl ${theme.chipBg} ${theme.text} border border-slate-100 shrink-0`}>
            {theme.icon}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-[#11145A] font-sans leading-tight">
              {selectedItem.capability_area}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold font-sans">
              Capability Area
            </span>
          </div>
          <span className={`ml-auto px-2.5 py-1 text-[10px] font-black rounded-full ${theme.chipBg} ${theme.text} uppercase tracking-wide whitespace-nowrap font-sans`}>
            {selectedItem.status}
          </span>
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">
          {STATUS_FEEDBACK[selectedItem.status] || 'Keep exploring to grow this capability!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 min-h-[120px] flex flex-col justify-center gap-1.5 shadow-sm">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-sans">
        Interactive Power Radar
      </h3>
      <p className="text-sm text-indigo-600 font-bold flex items-center gap-1.5 font-sans">
        <MousePointer2 size={14} className="text-indigo-500" /> Hover or tap any petal on the wheel
      </p>
      <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
        Instantly view your current growth stage and feedback.
      </p>
    </div>
  );
}

/**
 * Skill Power Radar — Section 6 of the Grade 6-8 Growth Map.
 * SVG petal wheel: each capability is a sector whose radius encodes its
 * growth stage (1-5). Labels ring the wheel; hover highlights the petal
 * and shows details in the log box below.
 */
export const CapabilityWheel: React.FC<Props> = ({ capabilities, isActive }) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  if (!capabilities?.length) return null;

  const items = capabilities;
  const size = 420;
  const center = size / 2;
  const maxRadius = 130;
  const innerRadius = 38;
  const angleStep = (2 * Math.PI) / items.length;

  const petals = items.map((item, idx) => {
    const levelVal = LEVEL_VALUE_MAP[item.status] || 3;
    const r = innerRadius + (maxRadius - innerRadius) * (levelVal / 5);
    const theme = COLOR_THEMES[item.capability_area] || FALLBACK_THEME;
    const isSelected = hoveredSlice === item.capability_area;

    // Small gap between petals for a clean segmented look
    const gap = 0.03;
    const startAngle = idx * angleStep - Math.PI / 2 + gap;
    const endAngle = (idx + 1) * angleStep - Math.PI / 2 - gap;

    const x1 = center + r * Math.cos(startAngle);
    const y1 = center + r * Math.sin(startAngle);
    const x2 = center + r * Math.cos(endAngle);
    const y2 = center + r * Math.sin(endAngle);
    const ix1 = center + innerRadius * Math.cos(endAngle);
    const iy1 = center + innerRadius * Math.sin(endAngle);
    const ix2 = center + innerRadius * Math.cos(startAngle);
    const iy2 = center + innerRadius * Math.sin(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const pathData = `M ${ix2} ${iy2} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    const edgeArc = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

    // Faint "full potential" track behind the petal
    const fx1 = center + maxRadius * Math.cos(startAngle);
    const fy1 = center + maxRadius * Math.sin(startAngle);
    const fx2 = center + maxRadius * Math.cos(endAngle);
    const fy2 = center + maxRadius * Math.sin(endAngle);
    const trackData = `M ${ix2} ${iy2} L ${fx1} ${fy1} A ${maxRadius} ${maxRadius} 0 ${largeArc} 1 ${fx2} ${fy2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    return { item, theme, isSelected, pathData, edgeArc, trackData };
  });

  return (
    <div
      className={`bg-white rounded-[24px] p-6 sm:p-8 border border-blue-100 shadow-[0_12px_32px_rgba(29,78,216,0.03)] flex flex-col h-full space-y-6 select-none transition-all duration-500 ${
        isActive ? 'ring-2 ring-indigo-300' : ''
      }`}
    >
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/60">
            <PieChart size={20} />
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[#11145A] tracking-tight font-sans">
            6. My Capability Wheel
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
          Your growth across {items.length} core capabilities — the further a petal reaches, the stronger that power.
        </p>
      </div>

      {/* Wheel */}
      <div className="flex flex-col items-center gap-6 w-full flex-1">
        <div className="relative w-full max-w-[420px] aspect-square">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">

            {/* Level rings */}
            {[1, 2, 3, 4, 5].map((level) => (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={innerRadius + (maxRadius - innerRadius) * (level / 5)}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            ))}

            {/* Petals */}
            {petals.map(({ item, theme, isSelected, pathData, edgeArc, trackData }) => (
              <g
                key={item.capability_area}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSlice(item.capability_area)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => setHoveredSlice(item.capability_area)}
              >
                {/* Full-potential track */}
                <path d={trackData} fill={theme.color} opacity={0.06} />
                {/* Petal */}
                <path
                  d={pathData}
                  fill={theme.color}
                  opacity={isSelected ? 0.9 : 0.55}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-all duration-300"
                />
                {/* Bold edge arc marking the reached level */}
                <path
                  d={edgeArc}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth={isSelected ? 5 : 3.5}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </g>
            ))}

            {/* Hub */}
            <circle cx={center} cy={center} r={innerRadius} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          </svg>

          {/* Center badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-[76px] h-[76px] bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full border-4 border-white text-white z-20 shadow-[0_4px_16px_rgba(99,102,241,0.3)] pointer-events-none">
            <Award size={16} className="text-yellow-300" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-none mt-1 font-sans">Skill</p>
            <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest font-sans">Radar</p>
          </div>

          {/* Labels around the wheel */}
          {items.map((item, idx) => {
            const labelAngle = idx * angleStep + angleStep / 2 - Math.PI / 2;
            const distance = maxRadius + 42;
            const lxPct = ((center + distance * Math.cos(labelAngle)) / size) * 100;
            const lyPct = ((center + distance * Math.sin(labelAngle)) / size) * 100;
            const theme = COLOR_THEMES[item.capability_area] || FALLBACK_THEME;
            const isHovered = hoveredSlice === item.capability_area;

            return (
              <button
                key={item.capability_area}
                style={{ position: 'absolute', left: `${lxPct}%`, top: `${lyPct}%`, transform: 'translate(-50%, -50%)' }}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-300 cursor-pointer focus:outline-none w-[92px] ${
                  isHovered ? 'bg-white border border-slate-200 shadow-md z-30 scale-105' : 'z-10'
                }`}
                onMouseEnter={() => setHoveredSlice(item.capability_area)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => setHoveredSlice(item.capability_area)}
              >
                <span className={theme.text}>{theme.icon}</span>
                <span className={`text-[10px] font-black leading-tight text-center whitespace-normal break-words font-sans ${theme.text}`}>
                  {item.capability_area}
                </span>
                {isHovered && (
                  <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none font-sans whitespace-nowrap">
                    {item.status}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail box + legend */}
        <div className="w-full space-y-3">
          <CapabilityLogBox hoveredSlice={hoveredSlice} items={items} />
          <CapabilityLegend />
        </div>
      </div>
    </div>
  );
};
