import React from 'react';
import { Rocket, Wrench, Megaphone, Compass, Tag, CheckCircle, ArrowRight, Clock } from 'lucide-react';

interface Mission {
  priority: number;
  mission_name: string;
  capability_target: string;
  why_recommended: string;
  difficulty: string;
  estimated_duration_days: number;
}

interface Props {
  missions?: Mission[];
}

// ==========================================
// SUB-COMPONENT: CapabilityTag
// ==========================================
function CapabilityTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-lg text-[10px] font-black text-[#11145A]/70 font-sans leading-none shadow-sm">
      <Tag size={10} className="text-blue-500 shrink-0" />
      <span>{text}</span>
    </span>
  );
}

// ==========================================
// SUB-COMPONENT: MissionCard
// ==========================================
function MissionCard({ mission }: { mission: Mission }) {
  const isMaker = mission.mission_name.toLowerCase().includes('maker');
  const isSpeak = mission.mission_name.toLowerCase().includes('speak') || mission.mission_name.toLowerCase().includes('share');
  const isExplorer = mission.mission_name.toLowerCase().includes('explorer');

  let bgClass = 'bg-white border-slate-100 hover:border-[#11145A]/20';
  let iconBg = 'bg-blue-50 text-blue-600';
  let MissionIcon = Compass;

  if (isMaker) {
    bgClass = 'bg-[#F8FAFF] border-blue-100/50 hover:border-[#11145A]/20';
    iconBg = 'bg-blue-600 text-white';
    MissionIcon = Wrench;
  } else if (isSpeak) {
    bgClass = 'bg-white border-slate-100 hover:border-[#11145A]/20';
    iconBg = 'bg-blue-50 text-[#11145A] border border-blue-100/50';
    MissionIcon = Megaphone;
  } else if (isExplorer) {
    bgClass = 'bg-white border-slate-100 hover:border-[#11145A]/20';
    iconBg = 'bg-[#11145A] text-white';
    MissionIcon = Compass;
  }

  return (
    <div className={`flex flex-col justify-between p-6 rounded-[24px] border ${bgClass} shadow-[0_4px_20px_rgba(29,78,216,0.015)] hover:shadow-[0_12px_24px_rgba(29,78,216,0.03)] hover:-translate-y-1 transition-all duration-300 h-full`}>
      {/* Top Content */}
      <div className="space-y-4">
        {/* Header Icon + Level */}
        <div className="flex items-center justify-between">
          <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            <MissionIcon size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-600 font-sans">
              {mission.difficulty}
            </span>
            {mission.estimated_duration_days > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-600 font-sans">
                <Clock size={9} className="shrink-0" />
                {mission.estimated_duration_days} day{mission.estimated_duration_days !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-[#11145A] font-sans tracking-tight">
            {mission.mission_name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed font-sans">
            {mission.why_recommended}
          </p>
        </div>

        {/* Capability Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <CapabilityTag text={mission.capability_target} />
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status */}
        <div className="flex items-center gap-1.5 text-xs font-black text-[#11145A]/50 uppercase tracking-wider font-sans">
          <CheckCircle size={14} className="text-blue-500 shrink-0" />
          <span>Ready to Start</span>
        </div>

        {/* Static Button */}
        <button
          className="px-5 py-2.5 rounded-full text-xs font-black tracking-tight flex items-center justify-center gap-2 transition-all duration-300 whitespace-nowrap bg-blue-600 hover:bg-[#11145A] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="relative">
            <Rocket size={16} className="shrink-0" />
          </span>
          <span>Start Mission</span>
          <ArrowRight size={14} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export const RecommendedMissions: React.FC<Props> = ({ missions = [] }) => {
  if (!missions.length) return null;

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-blue-100/80 shadow-[0_12px_32px_rgba(29,78,216,0.03)] space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
              <Rocket size={20} className="text-[#11145A]" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#11145A] tracking-tight font-sans">
              8. My Recommended Missions
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-sans leading-relaxed">
            Tasks designed to help you grow. Start a mission to add evidence to your growth map.
          </p>
        </div>

        <span className="px-3 py-1.5 bg-[#F8FAFF] border border-blue-100/40 text-[10px] font-black text-[#11145A] rounded-full tracking-wider uppercase select-none font-sans self-start sm:self-auto shrink-0">
          Start Learning
        </span>
      </div>

      {/* Grid of missions — scrolls when there are more than two rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[820px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {[...missions].sort((a, b) => a.priority - b.priority).map((mission) => (
          <MissionCard
            key={mission.mission_name}
            mission={mission}
          />
        ))}
      </div>

      {/* Supportive note */}
      <div className="pt-2 text-center">
        <p className="text-xs text-slate-400 font-semibold font-sans">
          Each mission helps you create evidence for your growth. You can do them in any order!
        </p>
      </div>
    </div>
  );
};
