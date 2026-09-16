import { useState, type FC, type ReactNode } from 'react';
import { BarChart2, Brain, Eye, Puzzle } from 'lucide-react';
import { isValidSectionIntro, type SectionIntro } from './growthStageConfig';

interface ThinkingStyle {
  title: string;
  description: string;
  icon: string;
}

interface Props {
  thinkingStyles?: ThinkingStyle[];
  isActive?: boolean;
  sectionIntro?: SectionIntro;
}

interface StyleCard {
  label: string;
  icon: ReactNode;
  color: string;
  description: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

const STYLE_ICONS = [<Puzzle size={16} />, <Brain size={16} />, <Eye size={16} />, <BarChart2 size={16} />];

function iconFor(index: number) {
  return STYLE_ICONS[index % STYLE_ICONS.length];
}

export const ThinkingStyleSnapshot: FC<Props> = ({ thinkingStyles, isActive, sectionIntro }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!thinkingStyles?.length) return null;

  const intro = isValidSectionIntro(sectionIntro) ? sectionIntro : null;

  const styles: StyleCard[] = thinkingStyles.map((style, index) => ({
    label: style.title,
    icon: iconFor(index),
    color: COLORS[index % COLORS.length],
    description: style.description,
  }));

  return (
    <div className={isActive ? 'ring-2 ring-blue-300 rounded-2xl' : undefined}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold bg-gray-900 text-white px-3 py-1 rounded-full">FREE THINKING ENGINE</span>
      </div>
      {intro && (
        <>
          <h2 className="text-base font-bold text-gray-800 mt-2 mb-1">{intro.heading}</h2>
          <p className="text-xs text-gray-500 mb-6">{intro.description}</p>
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {styles.map((style, index) => (
            <div
              key={style.label}
              className="rounded-xl border p-4 cursor-pointer transition-all"
              style={{
                borderColor: hovered === index ? style.color : '#e5e7eb',
                borderWidth: hovered === index ? 2 : 1,
                backgroundColor: hovered === index ? `${style.color}08` : '#f9fafb',
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ color: style.color, backgroundColor: `${style.color}15` }}
                >
                  {style.icon}
                </span>
                <span className="text-sm font-bold text-gray-800">{style.label}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{style.description}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-5">
        Thinking styles are mental modes you can switch on. Grow new branches by trying tasks outside your comfort zone!
      </p>
    </div>
  );
};
