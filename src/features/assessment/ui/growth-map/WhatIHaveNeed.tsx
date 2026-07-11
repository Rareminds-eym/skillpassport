import React from 'react';
import { Lightbulb, BadgeCheck, Compass, Check, ArrowRight } from 'lucide-react';

interface CapabilityItem {
  capability_area: string;
  score_out_of_5: number;
}

interface Props {
  whatIHave?: CapabilityItem[];
  whatINeed?: CapabilityItem[];
}

export const WhatIHaveNeed: React.FC<Props> = ({ whatIHave = [], whatINeed = [] }) => {
  if (!whatIHave.length && !whatINeed.length) return null;

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-blue-100/80 shadow-[0_12px_32px_rgba(29,78,216,0.03)] flex flex-col gap-6">

      {/* ── HEADER ── */}
      <div className="space-y-1.5 pb-6 border-b border-slate-100 bg-white relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/60 flex items-center justify-center shrink-0">
            <Lightbulb size={20} />
          </span>
          <h2 className="text-lg sm:text-xl font-black text-[#11145A] tracking-tight font-sans">
            7. What I Have / What I Need Next
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans mt-2">
          A thoughtful, supportive map highlighting the talents you currently hold and your next growth pathways.
        </p>
      </div>

      {/* ── PREMIUM TEXT-ONLY CARDS ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Card: What I Have (Navy Foundation) */}
        <div className="flex-1 rounded-[24px] bg-[#11145A] p-7 sm:p-9 shadow-lg shadow-blue-900/10 flex flex-col relative overflow-hidden group">
          
          {/* Subtle Watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-[0.04] pointer-events-none group-hover:scale-105 transition-transform duration-700 text-white">
            <BadgeCheck size={180} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-[14px] bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm shadow-inner">
                <BadgeCheck size={22} className="text-blue-200" strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block mb-1">
                  Evidence-Backed Strengths
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-none font-sans">
                  What I Have
                </h3>
             </div>
          </div>

          <ul className="relative z-10 flex flex-col gap-5">
            {whatIHave.map((item, idx) => (
              <li key={idx} className="flex items-start gap-4">
                 <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Check size={13} strokeWidth={3} className="text-blue-300" />
                 </div>
                 <span className="text-[15px] sm:text-[16px] font-bold text-blue-50 leading-relaxed font-sans tracking-wide">
                   {item.capability_area}
                 </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Card: What I Need Next (Light Blue Growth) */}
        <div className="flex-1 rounded-[24px] bg-gradient-to-br from-[#F8FAFF] to-[#EFF6FF] border border-blue-100 p-7 sm:p-9 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col relative overflow-hidden group">
          
          {/* Subtle Watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-[0.03] text-blue-900 pointer-events-none group-hover:scale-105 transition-transform duration-700">
            <Compass size={180} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-[14px] bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                <Compass size={22} className="text-white" strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">
                  Exciting Next Steps
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#11145A] leading-none font-sans">
                  What I Need Next
                </h3>
             </div>
          </div>

          <ul className="relative z-10 flex flex-col gap-5">
            {whatINeed.map((item, idx) => (
              <li key={idx} className="flex items-start gap-4">
                 <div className="mt-0.5 w-6 h-6 rounded-full bg-white border border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
                    <ArrowRight size={13} strokeWidth={3} className="text-blue-600" />
                 </div>
                 <span className="text-[15px] sm:text-[16px] font-bold text-[#11145A]/90 leading-relaxed font-sans tracking-wide">
                   {item.capability_area}
                 </span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};
