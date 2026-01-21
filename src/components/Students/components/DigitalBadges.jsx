import React, { useRef } from 'react';
import { Award } from 'lucide-react';

const DigitalBadges = ({ earnedBadges = [], onBadgeHover, onBadgeLeave, onBadgeClick }) => {
  const badgeRefs = useRef([]);

  const handleMouseEnter = (i) => {
    if (badgeRefs.current[i] && onBadgeHover) {
      const rect = badgeRefs.current[i].getBoundingClientRect();
      onBadgeHover(i, rect);
    }
  };

  return (
    <>
      {earnedBadges.length > 0 && (
        <div className="ml-1">
          {/* Keep the existing Achievements heading untouched */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/20">
              <Award className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-black text-sm font-semibold tracking-wide">Achievements</span>
          </div>

          {/* Redesigned badges grid (matches social icon style) */}
          <div className="flex flex-wrap gap-3">
            {earnedBadges.slice(0, 6).map((badge, i) => (
              <div key={badge.id || i}>
                <div
                  ref={(el) => (badgeRefs.current[i] = el)}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={() => onBadgeLeave && onBadgeLeave()}
                  onClick={() => onBadgeClick && onBadgeClick(badge)}
                  title={badge.name}
                  className="group relative overflow-hidden flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${badge.color}15, ${badge.color}30)`,
                    borderColor: badge.color,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative z-10 text-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    {badge.icon}
                  </div>
                </div>
              </div>
            ))}

            {/* Show "+X" badge if more exist */}
            {earnedBadges.length > 6 && (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105">
                +{earnedBadges.length - 6}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DigitalBadges;
