import React, { useState } from 'react';
import {
  Users, Activity, Heart, Sparkles, Search, ShieldCheck,
  Eye, Award, Zap, BookOpen, Smile, Target, Handshake, Star, ChevronDown
} from 'lucide-react';

interface StrengthItem { label: string; description: string; tag: string; }
interface Props { strengths: StrengthItem[]; isActive?: boolean; }

const iconMap: Record<string, React.ComponentType<any>> = {
  leadership: Users, leader: Users,
  perseverance: Activity, persistent: Activity, persistence: Activity,
  helpfulness: Handshake, helpful: Handshake,
  creativity: Sparkles, creative: Sparkles,
  curiosity: Search, curious: Search,
  responsibility: ShieldCheck, responsible: ShieldCheck,
  kindness: Heart, kind: Heart, observant: Eye, honest: ShieldCheck,
  teamwork: Users,
  discipline: Target, 'self-discipline': Target, focus: Target,
  learning: BookOpen, knowledge: BookOpen,
  empathy: Smile, energy: Zap,
};

function getIcon(label: string): React.ComponentType<any> {
  const n = label.toLowerCase();
  return iconMap[Object.keys(iconMap).find(k => n.includes(k)) ?? ''] ?? Award;
}

const isSuper = (tag: string) => tag?.toLowerCase().includes('super');

/* ── INTERACTIVE ACCORDION ITEM ── */
const AccordionRow: React.FC<{ item: StrengthItem; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
  const Icon = getIcon(item.label);
  const sup = isSuper(item.tag);

  return (
    <div
      className={`
        relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        border-b last:border-b-0
        ${isOpen ? 'bg-[#F8FAFF] border-[#DBEAFE]' : 'bg-white border-slate-100 hover:bg-slate-50/50'}
      `}
    >
      {/* Active Left Indicator Line */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${isOpen ? 'bg-[#11145A]' : 'bg-transparent'}`}
      />

      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-5 sm:px-8 py-5 outline-none cursor-pointer select-none"
      >
        <div className="flex items-center gap-5">
          {/* Icon Box */}
          <div className={`
            w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300
            ${isOpen ? 'bg-[#11145A] text-white shadow-md shadow-blue-900/10 scale-105' : 'bg-blue-50/50 text-[#11145A] border border-blue-100/50'}
          `}>
            <Icon size={22} strokeWidth={isOpen ? 2 : 1.8} />
          </div>

          {/* Text Info */}
          <div className="flex flex-col items-start gap-1">
            <h3 className={`text-[16px] font-black tracking-tight font-sans transition-colors ${isOpen ? 'text-[#11145A]' : 'text-[#11145A]/90'}`}>
              {item.label}
            </h3>

            <div className="flex items-center gap-2">
              {sup && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50">
                  <Star size={9} className="fill-amber-400" /> Signature
                </span>
              )}
              {item.tag && !sup && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
                  {item.tag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chevron Toggle */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
          ${isOpen ? 'bg-blue-100/50 text-[#11145A] rotate-180' : 'bg-transparent text-slate-300 group-hover:text-[#11145A]'}
        `}>
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{
          maxHeight: isOpen ? '200px' : '0',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="px-5 sm:px-8 pb-6 pt-0 ml-16">
          <p className="text-[14px] sm:text-[15px] font-medium text-slate-600 leading-relaxed max-w-2xl font-sans">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};


/* ── MAIN COMPONENT ── */
export const StrengthsCharacter: React.FC<Props> = ({ strengths, isActive }) => {
  const [openIdx, setOpenIdx] = useState<number>(0);

  if (!strengths?.length) return null;

  // Group signature strengths first
  const sorted = [
    ...strengths.filter(s => isSuper(s.tag)),
    ...strengths.filter(s => !isSuper(s.tag)),
  ];

  const superCount = sorted.filter(s => isSuper(s.tag)).length;

  return (
    <div className={`
      bg-white rounded-[24px] overflow-hidden
      border border-blue-100/80
      shadow-[0_12px_32px_rgba(29,78,216,0.03)]
      flex flex-col h-full
      transition-all duration-500
      ${isActive ? 'ring-2 ring-blue-300' : ''}
    `}>

      {/* ── HEADER ── */}
      <div className="space-y-1.5 pb-4 border-b border-slate-100 p-6 sm:p-8 bg-white z-10 relative">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/60 flex items-center justify-center">
              <ShieldCheck size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#11145A] tracking-tight font-sans">
              2. My Strengths & Character
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {superCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm">
                <Star size={12} className="fill-amber-400" />
                <span className="text-[11px] font-black tracking-widest uppercase">{superCount} Signature</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans mt-2">
          These are everyday strengths noticed through your choices, reflections, and activities.
        </p>
      </div>

      {/* ── ACCORDION LIST ── */}
      <div className="flex flex-col w-full flex-1">
        {sorted.map((item, i) => (
          <AccordionRow
            key={i}
            item={item}
            isOpen={openIdx === i}
            onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
          />
        ))}
      </div>

      {/* ── BOTTOM NOTE ── */}
      <div className="mt-auto m-6 sm:m-8 bg-blue-50/35 p-4 rounded-xl border border-blue-100/40 flex items-start gap-2.5">
        <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={14} />
        <p className="text-xs text-[#11145A]/80 font-medium leading-relaxed font-sans">
          These {strengths.length} strengths were noticed through your activities, reflections, and collaborative moments.
        </p>
      </div>

    </div>
  );
};
