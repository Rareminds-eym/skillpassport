import React, { useState } from 'react';
import { BrainCircuit, Lightbulb, Sparkles, BarChart3, Network } from 'lucide-react';

interface ThinkingStyle {
  title: string;
  description: string;
  icon: string;
}

interface Props {
  thinkingStyles?: ThinkingStyle[];
  isActive?: boolean;
}

const getIconComponent = (iconName?: string, size = 18) => {
  switch (iconName) {
    case 'BrainCircuit':
      return <BrainCircuit size={size} />;
    case 'Lightbulb':
      return <Lightbulb size={size} />;
    case 'Sparkles':
      return <Sparkles size={size} />;
    case 'BarChart3':
      return <BarChart3 size={size} />;
    default:
      return <Lightbulb size={size} />;
  }
};

interface NodeTheme {
  iconBg: string;
  iconText: string;
  dot: string;
  cardBorder: string;
  cardHoverBorder: string;
  connector: string;
}

// Unified minimal theme for all nodes to match the strict Navy/Blue brand colors
const minimalTheme: NodeTheme = {
  iconBg: 'bg-blue-50',
  iconText: 'text-blue-600',
  dot: 'bg-[#11145A]',
  cardBorder: 'border-slate-100',
  cardHoverBorder: 'border-[#11145A]/40',
  connector: 'bg-[#11145A]',
};

/**
 * Thinking Skills Tree — Section 5 of the Grade 6-8 Growth Map.
 * A vertical skill-tree: Navy root node feeding four themed thinking-style
 * branches. Spine, dots and connectors share exact pixel geometry so every
 * branch visibly attaches to the trunk.
 */
export const ThinkingStyleSnapshot: React.FC<Props> = ({ thinkingStyles, isActive }) => {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  if (!thinkingStyles?.length) return null;

  // Geometry constants — spine center sits at x = 18px
  // Root circle w-9 (36px) at left-0 → center 18. Dots w-4 (16px) at left 10px → center 18.
  return (
    <div
      className={`bg-white rounded-[24px] p-6 sm:p-8 border border-blue-100 shadow-[0_12px_32px_rgba(29,78,216,0.03)] flex flex-col h-full gap-6 select-none transition-all duration-500 ${
        isActive ? 'ring-2 ring-blue-300' : ''
      }`}
    >
      {/* Header */}
      <div className="space-y-1.5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/60">
            <Network size={20} />
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[#11145A] tracking-tight font-sans">
            5. My Thinking Style Snapshot
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
          Four thinking powers growing from one core. Hover a branch to light it up — every style is learnable.
        </p>
      </div>

      {/* Tree — grows to fill available height so the card matches its grid partner */}
      <div className="flex-1 flex flex-col">
        <div className="relative flex-1 flex flex-col">

        {/* Spine — runs from below the root circle down to the last branch dot */}
        <div className="absolute left-[17px] top-9 bottom-7 w-[2px] rounded-full bg-gradient-to-b from-[#11145A] via-blue-200 to-slate-200" />

        {/* Root node */}
        <div className="relative z-10 flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-[#11145A] border-[3px] border-white shadow-[0_4px_12px_rgba(17,20,90,0.35)] flex items-center justify-center text-white flex-shrink-0">
            <BrainCircuit size={16} />
          </div>
          <span className="bg-[#11145A] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Core Thinking Engine
          </span>
        </div>

        {/* Branches — distribute evenly across the available height */}
        <div className="flex-1 flex flex-col justify-around gap-4 pb-2">
          {thinkingStyles.map((style, idx) => {
            const isHovered = activeNode === idx;

            return (
               <div
                key={idx}
                onMouseEnter={() => setActiveNode(idx)}
                onMouseLeave={() => setActiveNode(null)}
                className="relative flex items-center group"
              >
                {/* Branch dot — centered on the spine */}
                <div
                  className={`absolute left-[10px] w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 transition-transform duration-300 ${minimalTheme.dot} ${
                    isHovered ? 'scale-125' : ''
                  }`}
                />

                {/* Connector from spine to card */}
                <div
                  className={`absolute left-[18px] w-7 h-[2px] transition-colors duration-300 ${
                    isHovered ? minimalTheme.connector : 'bg-slate-200'
                  }`}
                />

                {/* Branch card */}
                <div
                  className={`ml-12 flex-1 flex items-start gap-3.5 p-4 rounded-[16px] border bg-white transition-all duration-300 cursor-default ${
                    isHovered
                      ? `${minimalTheme.cardHoverBorder} shadow-md -translate-y-0.5`
                      : `${minimalTheme.cardBorder} shadow-sm`
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 ${minimalTheme.iconBg} ${minimalTheme.iconText}`}
                  >
                    {getIconComponent(style.icon)}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 space-y-1 mt-0.5">
                    <h3 className="text-sm font-black text-[#11145A] tracking-tight leading-tight font-sans">
                      {style.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
                      {style.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Footer tip */}
      <div className="bg-[#F8FAFF] p-4 rounded-[16px] border border-blue-100/80 flex items-start gap-2.5">
        <Sparkles className="text-[#11145A] flex-shrink-0 mt-0.5" size={14} />
        <p className="text-xs text-[#11145A]/80 font-bold leading-relaxed font-sans">
          Thinking styles are mental modes you can switch on. Grow new branches by trying tasks outside your comfort zone!
        </p>
      </div>
    </div>
  );
};
