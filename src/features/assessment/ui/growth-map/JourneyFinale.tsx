import type { FC } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';

interface JourneyFinaleProps {
  name: string;
  unlockedCount: number;
  variant?: 'band' | 'card';
  ctaLabel?: string;
  showCta?: boolean;
}

export const JourneyFinale: FC<JourneyFinaleProps> = ({
  name,
  variant = 'card',
  ctaLabel = 'Explore My Portfolio',
  showCta = true,
}) => {
  const content = (
    <div className="flex flex-col items-center gap-8 md:flex-row">
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg">
        <Trophy size={36} className="text-white" />
      </div>

      <div className="flex-1 text-center md:text-left">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
          <Trophy size={12} />
          CONGRATULATIONS!
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">Congratulations, {name}!</h2>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-gray-300">
          You've completed your Growth Map Journey. Every question answered, reflection written, and activity
          completed has unlocked a piece of your potential. You are growing into a curious, capable, and
          confident learner!
        </p>
        {showCta && (
          <button
            onClick={() => {
              window.location.href = '/learner/courses';
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {ctaLabel} <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );

  if (variant === 'band') {
    return content;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 shadow-lg sm:p-8">
      {content}
    </div>
  );
};
