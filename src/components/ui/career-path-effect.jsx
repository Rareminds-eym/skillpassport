/**
 * Career Path Effect Component
 * Inspired by Google Gemini Effect from Aceternity UI
 * Creates animated gradient paths connecting career fit cards
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../lib/utils.js';

/**
 * SVG Path definitions for the career journey
 * Creates a flowing S-curve path connecting the three career cards
 */
const CareerPathSVG = ({ pathLengths, className }) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('absolute inset-0 pointer-events-none', className)}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="careerGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="careerGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="careerGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="careerGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="careerGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.4" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="careerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Path 1 - Primary (Indigo to Purple) */}
      <motion.path
        d="M0 300 Q 200 100, 400 250 T 720 200 Q 900 150, 1000 350 T 1200 400 Q 1350 450, 1440 350"
        stroke="url(#careerGradient1)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        filter="url(#careerGlow)"
        style={{
          pathLength: pathLengths[0],
          opacity: pathLengths[0],
        }}
      />

      {/* Path 2 - Secondary (Cyan to Blue) */}
      <motion.path
        d="M0 320 Q 180 80, 380 230 T 700 180 Q 880 130, 980 330 T 1180 380 Q 1330 430, 1440 330"
        stroke="url(#careerGradient2)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        filter="url(#careerGlow)"
        style={{
          pathLength: pathLengths[1],
          opacity: pathLengths[1],
        }}
      />

      {/* Path 3 - Tertiary (Green to Cyan) */}
      <motion.path
        d="M0 340 Q 160 60, 360 210 T 680 160 Q 860 110, 960 310 T 1160 360 Q 1310 410, 1440 310"
        stroke="url(#careerGradient3)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        filter="url(#careerGlow)"
        style={{
          pathLength: pathLengths[2],
          opacity: pathLengths[2],
        }}
      />

      {/* Path 4 - Quaternary (Amber to Green) */}
      <motion.path
        d="M0 360 Q 140 40, 340 190 T 660 140 Q 840 90, 940 290 T 1140 340 Q 1290 390, 1440 290"
        stroke="url(#careerGradient4)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        filter="url(#careerGlow)"
        style={{
          pathLength: pathLengths[3],
          opacity: pathLengths[3],
        }}
      />

      {/* Path 5 - Quinary (Pink to Amber) */}
      <motion.path
        d="M0 380 Q 120 20, 320 170 T 640 120 Q 820 70, 920 270 T 1120 320 Q 1270 370, 1440 270"
        stroke="url(#careerGradient5)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        filter="url(#careerGlow)"
        style={{
          pathLength: pathLengths[4],
          opacity: pathLengths[4],
        }}
      />

      {/* Animated particles along the path */}
      <motion.circle
        cx="0"
        cy="0"
        r="6"
        fill="#4F46E5"
        filter="url(#careerGlow)"
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          offsetPath:
            "path('M0 300 Q 200 100, 400 250 T 720 200 Q 900 150, 1000 350 T 1200 400 Q 1350 450, 1440 350')",
        }}
      />
    </svg>
  );
};

/**
 * Career Path Effect Component
 * Main component that wraps the career cards section with animated paths
 */
export const CareerPathEffect = ({
  children,
  title = 'Your Career Recommendations',
  description = 'Personalized job matches based on your assessment',
  className,
}) => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Transform scroll progress to path lengths with staggered timing
  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const pathLengthSecond = useTransform(scrollYProgress, [0.05, 0.45], [0, 1]);
  const pathLengthThird = useTransform(scrollYProgress, [0.1, 0.5], [0, 1]);
  const pathLengthFourth = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);
  const pathLengthFifth = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);

  const pathLengths = [
    pathLengthFirst,
    pathLengthSecond,
    pathLengthThird,
    pathLengthFourth,
    pathLengthFifth,
  ];

  return (
    <div ref={containerRef} className={cn('relative w-full overflow-hidden mb-8', className)}>
      {/* Main Card - Light Glass (matching ReportHeader) */}
      <div className="relative w-full rounded-xl overflow-hidden bg-white backdrop-blur-xl shadow-lg">
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.03), transparent 50%, rgba(147, 197, 253, 0.03))',
          }}
        />

        {/* Header Section - Dark gradient like ReportHeader */}
        <div className="relative p-6 md:p-8 bg-gradient-to-r from-slate-800 to-slate-700">
          {/* Animated path background (subtle) */}
          <div className="absolute inset-0 opacity-30 overflow-hidden">
            <CareerPathSVG pathLengths={pathLengths} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">{title}</h2>
            {/* Animated Gradient Underline */}
            <div className="relative h-[2px] w-40 md:w-56 mb-2 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #1E3A8A, #3B82F6, #60A5FA, #93C5FD, #BFDBFE)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                }}
              />
            </div>
            <p className="text-slate-300 text-sm md:text-base">{description}</p>
          </motion.div>
        </div>

        {/* Career cards container - Light background like ReportHeader info section */}
        <div className="relative px-6 md:px-8 py-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>

      {/* Keyframes for animations */}
      <style>{`
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
    </div>
  );
};

/**
 * Simplified Career Path Connector
 * A simpler version that just connects two cards with animated gradient lines
 */
export const CareerPathConnector = ({ reverse = false, className }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <div ref={ref} className={cn('relative h-32 md:h-48 w-full overflow-hidden', className)}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={`connectorGradient${reverse ? 'R' : 'L'}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="25%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="75%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <filter id="connectorGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main flowing path */}
        <motion.path
          d={
            reverse
              ? 'M800 20 Q 600 20, 500 100 T 200 100 Q 100 100, 0 180'
              : 'M0 20 Q 200 20, 300 100 T 600 100 Q 700 100, 800 180'
          }
          stroke={`url(#connectorGradient${reverse ? 'R' : 'L'})`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          filter="url(#connectorGlow)"
          style={{
            pathLength,
            opacity,
          }}
        />

        {/* Secondary path for depth */}
        <motion.path
          d={
            reverse
              ? 'M800 30 Q 580 30, 480 110 T 180 110 Q 80 110, 0 190'
              : 'M0 30 Q 220 30, 320 110 T 620 110 Q 720 110, 800 190'
          }
          stroke={`url(#connectorGradient${reverse ? 'R' : 'L'})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.5"
          filter="url(#connectorGlow)"
          style={{
            pathLength,
            opacity,
          }}
        />

        {/* Tertiary path */}
        <motion.path
          d={
            reverse
              ? 'M800 40 Q 560 40, 460 120 T 160 120 Q 60 120, 0 200'
              : 'M0 40 Q 240 40, 340 120 T 640 120 Q 740 120, 800 200'
          }
          stroke={`url(#connectorGradient${reverse ? 'R' : 'L'})`}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.3"
          filter="url(#connectorGlow)"
          style={{
            pathLength,
            opacity,
          }}
        />
      </svg>
    </div>
  );
};

export default CareerPathEffect;
