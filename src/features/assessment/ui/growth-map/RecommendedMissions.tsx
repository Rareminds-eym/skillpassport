import type { FC, ReactNode } from 'react';
import { ChevronRight, Clock, Cpu, Palette, Rocket, Users } from 'lucide-react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

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
  sectionIntro?: SectionIntro;
}

interface MissionVisual {
  icon: ReactNode;
  color: string;
}

function missionVisual(mission: Mission): MissionVisual {
  const text = `${mission.mission_name} ${mission.capability_target}`.toLowerCase();

  if (text.includes('social') || text.includes('team') || text.includes('communication')) {
    return {
      icon: <Users size={20} className="text-blue-600" />,
      color: 'border-blue-200',
    };
  }

  if (text.includes('digital') || text.includes('tech') || text.includes('ai')) {
    return {
      icon: <Cpu size={20} className="text-emerald-600" />,
      color: 'border-emerald-200',
    };
  }

  if (text.includes('creative') || text.includes('creativity') || text.includes('design')) {
    return {
      icon: <Palette size={20} className="text-amber-600" />,
      color: 'border-amber-200',
    };
  }

  return {
    icon: <Rocket size={20} className="text-blue-600" />,
    color: 'border-blue-200',
  };
}

export const RecommendedMissions: FC<Props> = ({ missions = [], sectionIntro }) => {
  if (!missions.length) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        {intro && <h2 className="text-base font-bold text-gray-800">{intro.heading}</h2>}
        <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline">
          START LEARNING <ChevronRight size={11} />
        </button>
      </div>
      {intro ? (
        <p className="mb-6 text-xs text-gray-500">{intro.description}</p>
      ) : (
        <div className="mb-5" />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...missions].sort((a, b) => a.priority - b.priority).map((mission) => {
          const visual = missionVisual(mission);
          const duration = mission.estimated_duration_days > 0
            ? `${mission.estimated_duration_days} day${mission.estimated_duration_days === 1 ? '' : 's'}`
            : mission.difficulty;

          return (
            <div
              key={mission.mission_name}
              className={`flex flex-col gap-3 rounded-2xl border ${visual.color} bg-white p-5 transition-shadow hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                  {visual.icon}
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
                  {mission.capability_target}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-800">{mission.mission_name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{mission.why_recommended}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> DURATION {duration}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-emerald-600">READY TO START</span>
                <button className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
                  <ChevronRight size={11} /> Start Mission
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
