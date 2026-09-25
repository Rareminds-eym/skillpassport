import { type FC } from 'react';
import {
  ArrowRight,
  Compass,
  Cpu,
  FlaskConical,
  Hammer,
  Heart,
  Palette,
  Star,
} from 'lucide-react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface InterestWorld {
  worldName: string;
  evidenceSummary: string;
  status?: string;
}

interface Props {
  worlds: InterestWorld[];
  isActive?: boolean;
  sectionIntro?: SectionIntro;
}

function getWorldIcon(worldName: string) {
  const normalized = worldName.toLowerCase();
  if (normalized.includes('science') || normalized.includes('inquiry')) return FlaskConical;
  if (normalized.includes('tech') || normalized.includes('digital') || normalized.includes('computer')) return Cpu;
  if (normalized.includes('creative') || normalized.includes('design') || normalized.includes('art')) return Palette;
  if (normalized.includes('help') || normalized.includes('people') || normalized.includes('care')) return Heart;
  if (normalized.includes('build') || normalized.includes('make') || normalized.includes('construct')) return Hammer;
  return Compass;
}

function getStatusStyle(status?: string) {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('recommended') || normalized.includes('next')) {
    return { label: 'RECOMMENDED NEXT', className: 'text-amber-500' };
  }
  if (normalized.includes('started')) {
    return { label: 'STARTED EXPLORING', className: 'text-blue-500' };
  }
  if (normalized.includes('explored')) {
    return { label: 'EXPLORED', className: 'text-emerald-600' };
  }
  return { label: (status || 'UNLOCKED').toUpperCase(), className: 'text-slate-500' };
}

export const InterestWorlds: FC<Props> = ({ worlds, isActive, sectionIntro }) => {
  if (!worlds?.length) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  return (
    <div className={isActive ? 'ring-2 ring-blue-300 rounded-2xl' : undefined}>
      <div className="flex items-center justify-between mb-1">
        {intro ? <h2 className="text-base font-bold text-gray-800">{intro.heading}</h2> : <span />}
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors"
        >
          <Star size={11} />
          STAGE MAIN PATH
        </button>
      </div>
      {intro ? (
        <p className="text-xs text-gray-500 mb-5">{intro.description}</p>
      ) : (
        <div className="mb-4" />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {worlds.map((world, index) => {
          const isMain = index === 0;
          const Icon = getWorldIcon(world.worldName);
          const status = getStatusStyle(world.status);

          return (
            <div
              key={`${world.worldName}-${index}`}
              title={world.evidenceSummary}
              className={`rounded-xl border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer min-h-[150px] ${
                isMain ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isMain ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isMain ? 'MAIN PATH' : 'UNLOCKED'}
                </span>
              </div>
              <div className="flex justify-center">
                <Icon size={22} className={isMain ? 'text-blue-600' : 'text-gray-500'} />
              </div>
              <p className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {world.worldName}
              </p>
              <div className={`mt-auto flex items-center justify-center gap-1 text-xs font-semibold ${status.className}`}>
                <ArrowRight size={10} />
                {status.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
