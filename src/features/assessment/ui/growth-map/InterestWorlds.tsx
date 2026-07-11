import React, { useState } from 'react';
import { Compass, Sparkles, Star, ArrowUpRight, Hammer, HeartHandshake, Palette, Laptop } from 'lucide-react';

interface Props {
  worlds: Array<{
    worldName: string;
    evidenceSummary: string;
    status?: string;
  }>;
  isActive?: boolean;
}

// Semantic helper to map interest world names to high-quality visual icons
function getWorldIconData(worldName: string) {
  const norm = worldName.toLowerCase();
  let icon = Compass;
  if (norm.includes('build') || norm.includes('make') || norm.includes('maker') || norm.includes('construct')) icon = Hammer;
  else if (norm.includes('help') || norm.includes('people') || norm.includes('social') || norm.includes('service')) icon = HeartHandshake;
  else if (norm.includes('create') || norm.includes('creating') || norm.includes('art') || norm.includes('design')) icon = Palette;
  else if (norm.includes('digital') || norm.includes('logic') || norm.includes('tech') || norm.includes('computer')) icon = Laptop;

  // Unified minimal color scheme
  return { icon, color: 'text-blue-600 bg-blue-50 border-blue-100/60', glow: 'shadow-[0_0_12px_rgba(37,99,235,0.06)]' };
}

// Helper to return colored status indicator dot and label styling
function getStatusIndicator(status?: string) {
  const norm = (status || '').toLowerCase();
  if (norm.includes('explored')) {
    return { dotBg: 'bg-[#11145A]', textClass: 'text-[#11145A]', label: 'Explored' };
  }
  if (norm.includes('started')) {
    return { dotBg: 'bg-blue-600', textClass: 'text-blue-700', label: 'Started Exploring' };
  }
  if (norm.includes('recommended') || norm.includes('next')) {
    return { dotBg: 'bg-blue-400', textClass: 'text-blue-600', label: 'Recommended Next' };
  }
  return { dotBg: 'bg-slate-400', textClass: 'text-slate-500', label: status || 'Discovered' };
}

export const InterestWorlds: React.FC<Props> = ({ worlds, isActive }) => {
  if (!worlds?.length) return null;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const topWorlds = worlds; // show all worlds from the DB (grid wraps beyond 5)

  return (
    <div className="glass-panel-light rounded-[32px] p-6 sm:p-8 border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)] relative overflow-hidden select-none transition-all duration-500">
      
      {/* Background Ornaments */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel (No Level prefix) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 border border-blue-100 text-[#11145A] rounded-xl shadow-2xs">
              <Compass size={18} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#11145A] tracking-tight font-sans">
              1. My Interest Worlds
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed font-sans">
            Your strongest explorer realms unlocked. Hover over each card to check your personalized reflection evidence!
          </p>
        </div>

        {/* Status indicator badge */}
        <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#11145A] text-white text-[11px] uppercase tracking-widest font-black rounded-full shadow-md">
          <Star size={12} className="fill-white" />
          <span>Stage Main Path</span>
        </div>
      </div>

      {/* Journey Map Flow Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {topWorlds.map((world, index) => {
          const isMainPath = index === 0;
          const isHovered = hoveredIdx === index;
          const iconData = getWorldIconData(world.worldName);
          const IconComponent = iconData.icon;
          const statusInfo = getStatusIndicator(world.status);

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`relative flex flex-col justify-between p-5 rounded-[24px] border transition-all duration-300 transform cursor-pointer h-[190px] overflow-hidden ${
                isMainPath 
                  ? 'border-[#11145A] bg-[#F8FAFF] shadow-[0_8px_24px_rgba(17,20,90,0.06)] hover:border-[#11145A]'
                  : 'border-[#F1F5F9] shadow-sm hover:border-[#CBD5E1] bg-white'
              } ${isHovered ? '-translate-y-1 scale-102 shadow-md' : 'scale-100'}`}
            >
              
              {/* Default Card View */}
              <div className={`flex flex-col justify-between h-full w-full transition-opacity duration-300 ${
                isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}>
                {/* Top Banner */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${
                    isMainPath ? 'bg-[#11145A] text-white shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}>
                    {isMainPath ? '★ Main Path' : '✓ Unlocked'}
                  </span>
                </div>

                {/* Center Icon & Label */}
                <div className="flex flex-col items-center justify-center text-center space-y-3 my-2">
                  <div className={`p-3 rounded-[14px] border transition-all duration-300 ${isMainPath ? 'text-[#11145A] bg-white border-[#11145A]/20 shadow-sm' : iconData.color} ${iconData.glow}`}>
                    <IconComponent size={22} strokeWidth={2} />
                  </div>
                  
                  <h3 className={`text-[13px] sm:text-sm font-black tracking-tight leading-snug font-sans ${isMainPath ? 'text-[#11145A]' : 'text-slate-800'}`}>
                    {world.worldName}
                  </h3>
                </div>

                {/* Bottom tag */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dotBg}`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider truncate font-sans ${statusInfo.textClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <ArrowUpRight size={12} className="text-slate-300 shrink-0" strokeWidth={3} />
                </div>
              </div>

              {/* Evidence Popover Overlay */}
              <div className={`absolute inset-0 rounded-[24px] bg-white p-5 flex flex-col justify-between transition-all duration-300 border-2 ${
                isMainPath ? 'border-[#11145A] shadow-xl' : 'border-blue-300 shadow-md'
              } ${
                isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
              } z-30`}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 font-sans">Evidence Reflection</span>
                    <Sparkles size={11} className={isMainPath ? 'text-[#11145A]' : 'text-blue-500'} />
                  </div>
                  <p className="text-xs font-bold leading-relaxed text-slate-600 font-sans line-clamp-5">
                    {world.evidenceSummary}
                  </p>
                </div>
                
                <span className={`text-[9px] font-black tracking-wider uppercase font-sans ${isMainPath ? 'text-[#11145A]' : 'text-blue-600'}`}>
                  Realm Discovery Complete
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
