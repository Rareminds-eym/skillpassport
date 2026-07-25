import React from 'react';
import { School, Star, Compass, CheckCircle2 } from 'lucide-react';

interface Props {
  learnerInfo: {
    name: string;
    grade: string;
    school: string;
  };
}

export const GrowthMapHero: React.FC<Props> = ({ learnerInfo }) => {
  // Extract first name for a friendlier greeting
  const firstName = learnerInfo.name.split(' ')[0];

  return (
    <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-[#E0E7FF] border-2 border-blue-200/50 shadow-[0_16px_40px_rgba(29,78,216,0.04)] p-8 sm:p-12 text-[#11145A] select-none">
      
      {/* Decorative Ornaments & Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.06),_transparent_70%)] pointer-events-none rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-start gap-6 max-w-4xl">
        
        {/* Assessment Completed Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider shadow-2xs">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Active Exploration Passport</span>
        </div>

        {/* Heading Block */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-[#11145A]">
            Hi <span className="text-blue-600">{firstName}!</span>
          </h1>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            Beyond Marks Growth Map
          </p>
        </div>

        {/* Warm Description */}
        <p className="text-sm sm:text-base text-slate-500 font-semibold leading-relaxed max-w-2xl">
          Welcome to your growth workspace. This report maps your personal interests, real-world strengths, and collaborative superpowers beyond traditional scores or rank tables.
        </p>

        {/* Metadata Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl shadow-xs transition hover:bg-slate-50">
            <School size={13} className="text-blue-600" />
            <span>{learnerInfo.school}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl shadow-xs transition hover:bg-slate-50">
            <Star size={13} className="text-pink-500 fill-pink-500/10" />
            <span>{learnerInfo.grade}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-xl shadow-xs transition hover:bg-slate-50">
            <Compass size={13} className="text-cyan-500" />
            <span>Explorer Passport Mode</span>
          </div>
        </div>

      </div>

    </div>
  );
};
