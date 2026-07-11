import React, { useState } from 'react';
import { Trophy, Compass, ArrowRight } from 'lucide-react';

interface JourneyFinaleProps {
  name: string;
  unlockedCount: number;
}

/**
 * Closing celebration band of the Growth Map.
 * Bold navy banner congratulating the learner, linking onward to the portfolio.
 */
export const JourneyFinale: React.FC<JourneyFinaleProps> = ({ name, unlockedCount }) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#11145A] via-[#1a2273] to-[#1D4ED8] shadow-[0_16px_40px_rgba(17,20,90,0.25)] p-6 sm:p-8">

      {/* Decorative glows */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-8">

        {/* Avatar / trophy */}
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center overflow-hidden backdrop-blur-sm">
          {!avatarError ? (
            <img
              src="/student_avatar.png"
              alt="Student Avatar"
              className="w-full h-full object-cover rounded-full"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <Trophy className="text-amber-400 w-8 h-8" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2 min-w-0 flex-1 text-center lg:text-left">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight font-sans">
            Congratulations, {name}!
          </h2>

          <p className="text-xs sm:text-sm font-medium text-blue-100/90 leading-relaxed font-sans max-w-2xl">
            You've completed your Growth Map Journey! Every question answered, reflection written, and
            activity completed has unlocked a piece of your potential. You are growing into a curious,
            capable, and confident learner! 🎉
          </p>
        </div>

        {/* CTA */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            onClick={() => (window.location.href = '/learner/digital-portfolio')}
            className="w-full sm:w-auto px-7 py-4 bg-white text-[#11145A] hover:bg-blue-50 font-black text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] font-sans"
          >
            <Compass size={16} className="text-blue-600" />
            <span>Explore My Portfolio</span>
            <ArrowRight size={14} className="text-blue-600" />
          </button>
        </div>

      </div>
    </div>
  );
};
