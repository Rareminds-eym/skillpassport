import React, { useState, useRef } from 'react';
import {
  HeartHandshake,
  Brain,
  MessageCircle,
  HelpCircle,
  Waves,
  Layers,
  Crosshair,
  Shield,
  Smile,
  Users,
  BookOpen,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';

/* ──────────────────────────────────────────
   TYPES
────────────────────────────────────────── */
interface SkillItem {
  label: string;
  status: string;
}

interface Props {
  selfSocial?: {
    self_eq?: SkillItem[];
    social_sq?: SkillItem[];
  };
  isActive?: boolean;
}

/* ──────────────────────────────────────────
   ICON LOOKUP
────────────────────────────────────────── */
const iconMap: Record<string, React.ComponentType<any>> = {
  'self-belief': Brain, belief: Brain,
  communication: MessageCircle,
  'help-seeking': HelpCircle, help: HelpCircle,
  'emotional regulation': Waves, emotional: Waves,
  reflection: Layers,
  'goal setting': Crosshair, goal: Crosshair,
  resilience: Shield,
  empathy: Smile,
  collaboration: Users, teamwork: Users,
  learning: BookOpen,
  creativity: Lightbulb,
};

function getIcon(label: string): React.ComponentType<any> {
  const n = label.toLowerCase();
  return iconMap[Object.keys(iconMap).find(k => n.includes(k)) ?? ''] ?? Brain;
}

/* ──────────────────────────────────────────
   STATUS → visual config
────────────────────────────────────────── */
interface Cfg {
  level: number;        
  pct: number;          
  label: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
  pillBg: string;
  pillText: string;
}

function getCfg(status: string): Cfg {
  const n = status.toLowerCase();
  if (n.includes('ready') || n.includes('next level')) return {
    level: 4, pct: 95, label: 'Ready for Next Level',
    iconBg: '#11145A', iconColor: '#FFFFFF',
    barColor: '#11145A',
    pillBg: '#11145A', pillText: '#FFFFFF',
  };
  if (n.includes('confident')) return {
    level: 3, pct: 78, label: 'Confident',
    iconBg: '#DBEAFE', iconColor: '#1E40AF',
    barColor: '#2563EB',
    pillBg: '#EFF6FF', pillText: '#1E40AF',
  };
  if (n.includes('growing')) return {
    level: 2, pct: 52, label: 'Growing',
    iconBg: '#EFF6FF', iconColor: '#3B82F6',
    barColor: '#60A5FA',
    pillBg: '#F8FAFF', pillText: '#3B82F6',
  };
  if (n.includes('practicing')) return {
    level: 1, pct: 35, label: 'Practicing',
    iconBg: '#F8FAFF', iconColor: '#60A5FA',
    barColor: '#93C5FD',
    pillBg: '#F8FAFF', pillText: '#60A5FA',
  };
  return {
    level: 0, pct: 15, label: 'Starting',
    iconBg: '#F1F5F9', iconColor: '#94A3B8',
    barColor: '#CBD5E1',
    pillBg: '#F8FAFC', pillText: '#94A3B8',
  };
}

/* ──────────────────────────────────────────
   SEGMENTED BAR (Sleek Modern Style)
────────────────────────────────────────── */
const SegBar: React.FC<{ level: number; color: string }> = ({ level, color }) => (
  <div className="flex items-center gap-1 w-full pt-1">
    {[1, 2, 3, 4].map(i => (
      <div
        key={i}
        className="h-1.5 flex-1 rounded-full transition-all duration-500"
        style={{
          backgroundColor: i <= level ? color : '#F1F5F9',
        }}
      />
    ))}
  </div>
);

/* ──────────────────────────────────────────
   SKILL CARD 
────────────────────────────────────────── */
const SkillCard: React.FC<{ item: SkillItem; isEq: boolean }> = ({ item, isEq }) => {
  const cfg = getCfg(item.status);
  const Icon = getIcon(item.label);

  return (
    <div
      className={`
        group flex flex-col gap-3 p-4 sm:p-5 rounded-[20px] bg-white border border-slate-100
        hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(29,78,216,0.06)]
        transition-all duration-300 cursor-pointer select-none
      `}
    >
      {/* Top: icon only */}
      <div className="flex items-start justify-start">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: cfg.iconBg, color: cfg.iconColor }}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
      </div>

      {/* Label */}
      <div className="mt-1">
        <p className="text-[14px] font-bold text-[#11145A] font-sans leading-snug truncate">
          {item.label}
        </p>
        <p className="text-[9px] font-black text-slate-400 font-sans uppercase tracking-widest mt-0.5">
          {isEq ? 'Self · EQ' : 'Social · SQ'}
        </p>
      </div>

      {/* Segmented XP Bar */}
      <SegBar level={cfg.level} color={cfg.barColor} />

      {/* Status pill */}
      <span
        className="self-start text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mt-1 transition-colors"
        style={{
          background: cfg.pillBg,
          color: cfg.pillText,
        }}
      >
        {item.status}
      </span>
    </div>
  );
};

/* ──────────────────────────────────────────
   TAB TYPES
────────────────────────────────────────── */
type Tab = 'all' | 'eq' | 'sq';

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */
export const SelfSocialStrengths: React.FC<Props> = ({ selfSocial, isActive }) => {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!selfSocial) return null;

  const selfEq   = selfSocial.self_eq   || [];
  const socialSq = selfSocial.social_sq || [];
  if (!selfEq.length && !socialSq.length) return null;

  const allItems = [...selfEq, ...socialSq];

  /* filtered items based on active tab */
  const displayItems: Array<{ item: SkillItem; isEq: boolean }> =
    activeTab === 'eq'
      ? selfEq.map(i => ({ item: i, isEq: true }))
      : activeTab === 'sq'
      ? socialSq.map(i => ({ item: i, isEq: false }))
      : [
          ...selfEq.map(i  => ({ item: i, isEq: true  })),
          ...socialSq.map(i => ({ item: i, isEq: false })),
        ];

  /* mastery distribution */
  const dist = {
    expert:     allItems.filter(i => getCfg(i.status).level === 4).length,
    confident:  allItems.filter(i => getCfg(i.status).level === 3).length,
    growing:    allItems.filter(i => getCfg(i.status).level === 2).length,
    practicing: allItems.filter(i => getCfg(i.status).level <= 1).length,
  };

  /* average % */
  const avgPct = Math.round(
    allItems.reduce((s, i) => s + getCfg(i.status).pct, 0) / allItems.length
  );

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  /* tab definitions */
  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<any>; count: number }> = [
    { id: 'all', label: 'All Skills', icon: Layers,  count: allItems.length },
    { id: 'eq',  label: 'Self · EQ',  icon: Brain,   count: selfEq.length   },
    { id: 'sq',  label: 'Social · SQ',icon: Users,   count: socialSq.length },
  ].filter(t => t.count > 0);

  return (
    <div
      className={`bg-white rounded-[24px] p-6 sm:p-8 border border-blue-100 shadow-[0_12px_32px_rgba(29,78,216,0.03)] flex flex-col h-full gap-6 select-none transition-all duration-500 ${
        isActive ? 'ring-2 ring-blue-300' : ''
      }`}
    >
      {/* ── HEADER ── */}
      <div className="space-y-1.5 pb-5 border-b border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/60 flex items-center justify-center">
              <HeartHandshake size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#11145A] tracking-tight font-sans">
              3. My Self &amp; Social Strengths
            </h2>
          </div>

          {/* Skills count */}
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] font-sans border border-[#DBEAFE]">
            {allItems.length} Skills
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans mt-2">
          How you connect with your thoughts, feelings, and people around you.
        </p>
      </div>

      {/* ── MODERN TAB BAR (Segmented Control) ── */}
      <div>
        <div className="inline-flex items-center p-1.5 bg-slate-50/80 border border-slate-100 rounded-xl w-full sm:w-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
                  text-[12px] font-bold font-sans transition-all duration-300 outline-none
                  ${active
                    ? 'bg-white text-[#11145A] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-slate-500 hover:text-[#11145A] hover:bg-slate-100/50'
                  }
                `}
              >
                <Icon
                  size={14}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-[#11145A]' : 'text-slate-400'}
                />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                <span
                  className={`
                    flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full
                    text-[10px] font-bold font-sans transition-all duration-300
                    ${active
                      ? 'bg-[#EFF6FF] text-[#1E40AF]'
                      : 'bg-slate-200/50 text-slate-500'
                    }
                  `}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SKILLS BODY (scrollable grid) ── */}
      <div
        ref={scrollRef}
        className="
          flex-1 min-h-[300px] max-h-[460px] py-2 overflow-y-auto pr-2
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-slate-50
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-slate-200
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-slate-300
        "
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayItems.map(({ item, isEq }, i) => (
            <SkillCard key={`${activeTab}-${i}`} item={item} isEq={isEq} />
          ))}
        </div>

        {/* empty state */}
        {displayItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Brain size={32} className="text-slate-300" />
            <p className="text-[13px] font-medium text-slate-500 font-sans">No skills in this category</p>
          </div>
        )}
      </div>

      {/* Bottom note */}
      <div className="mt-auto bg-blue-50/35 p-4 rounded-xl border border-blue-100/40 flex items-start gap-2.5">
        <TrendingUp size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#11145A]/80 font-medium leading-relaxed font-sans">
          Skills grow through everyday choices and interactions with the world around you.
        </p>
      </div>
    </div>
  );
};
