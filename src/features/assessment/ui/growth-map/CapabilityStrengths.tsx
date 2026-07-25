import React from 'react';
import { Award, Compass, Heart, Users, MessageSquare, Brain, Lightbulb, Play } from 'lucide-react';

interface CapabilityInsight {
  insight: string;
  next_step: string;
}

interface Props {
  capabilities: Record<string, CapabilityInsight>;
}

const capabilityAreas = [
  { label: 'Self / EQ', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', borderColor: 'border-pink-100' },
  { label: 'Social / SQ', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  { label: 'Thinking & Problem Solving', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50', borderColor: 'border-purple-100' },
  { label: 'Communication', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', borderColor: 'border-blue-100' },
  { label: 'Digital & AI Literacy', icon: Play, color: 'text-indigo-600', bg: 'bg-indigo-50', borderColor: 'border-indigo-100' },
  { label: 'Execution & Independence', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-amber-100' },
  { label: 'Exposure & Career Awareness', icon: Compass, color: 'text-cyan-600', bg: 'bg-cyan-50', borderColor: 'border-cyan-100' },
  { label: 'Portfolio & Evidence', icon: Lightbulb, color: 'text-violet-600', bg: 'bg-violet-50', borderColor: 'border-violet-100' },
];

export const CapabilityStrengths: React.FC<Props> = ({ capabilities }) => {
  return (
    <div className="bg-slate-50/50 rounded-[32px] p-6 sm:p-8 border border-slate-100/80 shadow-sm relative overflow-hidden">
      {/* Subtle Visual Pattern */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-50/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-50/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#11145A] text-white rounded-lg shadow-sm">
              <Award size={18} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#11145A] tracking-tight font-sans">
              2. Capability Strengths
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-sans leading-relaxed">
            Here's what you're learning in 8 important areas of life and work.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-slate-200/60 w-full mb-6 relative z-10" />

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilityAreas.map((area) => {
          const insight = capabilities[area.label];
          if (!insight) return null;

          const IconComponent = area.icon;

          return (
            <div
              key={area.label}
              className={`rounded-3xl border ${area.borderColor} ${area.bg} p-6 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${area.bg} border ${area.borderColor} ${area.color}`}>
                  <IconComponent size={20} />
                </div>
                <h3 className="font-black text-[#11145A] text-base tracking-tight">{area.label}</h3>
              </div>

              <p className="text-sm text-slate-700 mb-4 leading-relaxed font-medium">{insight.insight}</p>

              <div className="bg-white/80 rounded-2xl p-4 border border-slate-100/50">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  <span className="font-black text-[#11145A]">Next Step:</span> {insight.next_step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
