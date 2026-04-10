import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useEffect } from 'react';
import { FileCheck, TrendingUp, Award, Rocket } from 'lucide-react';

const COLORS_TOP = ["#3B82F6"];

export default function HeroSection() {
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #FFFFFF 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  return (
    <motion.section
      style={{ backgroundImage }}
      className="relative grid min-h-screen place-content-center overflow-hidden bg-white px-4 py-16 sm:py-20 md:py-24 text-gray-900"
    >
      {/* CSS Animated Stars Background */}
      <div className="absolute inset-0 z-0">
        <div className="stars-container">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .stars-container {
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #000000;
          border-radius: 50%;
          animation: twinkle linear infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-[1400px] mx-auto">
          {/* Left Column - Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Badge with Lottie */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/70 backdrop-blur-md rounded-full border-2 border-gray-500"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                <DotLottieReact
                  src="https://lottie.host/1689bbd3-291d-4b13-9da5-2882f580c526/7rNvhtQCvu.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <span className="text-gray-800 text-xs sm:text-sm font-bold tracking-wide">FOR STUDENTS ONLY</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 sm:mb-4 text-gray-900">
                Turn Your Skills Into Proof.{' '}
                <span className="whitespace-nowrap">Not Just a Resume.</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed"
            >
              Skill Passport is a verified digital profile that helps students showcase real, job-ready skills—recognized by mentors, institutions, and employers.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <motion.a
                href="#registration-form"
                style={{ border, boxShadow }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/30 backdrop-blur-2xl text-gray-900 font-bold text-sm sm:text-base lg:text-lg rounded-full transition-all duration-300 hover:bg-white/40 shadow-[0_8px_32px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_48px_0_rgba(255,255,255,0.4)] border-2 border-gray-600"
              >
                Pre-register Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
              </motion.a>

              <a
                href="#what-is-skill-passport"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-black backdrop-blur-sm border-2 border-gray-800 text-white font-bold text-sm sm:text-base lg:text-lg rounded-full hover:bg-gray-900 hover:border-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Learn More
              </a>
            </motion.div>

            {/* Trust Signal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600"
            >
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span>Built by Rareminds • ISO 9001 & ISO 21001 Certified</span>
            </motion.div>
          </div>

          {/* Right Column - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
          >
            {[
              {
                icon: FileCheck,
                title: 'Verified Skills',
                desc: 'Build a verified record of your skills, projects, and learning',
              },
              {
                icon: TrendingUp,
                title: 'Stand Out',
                desc: 'Excel in internships, placements, and early career opportunities',
              },
              {
                icon: Award,
                title: 'Beyond Resumes',
                desc: 'Go beyond marksheets with skill-based proof',
              },
              {
                icon: Rocket,
                title: 'Future Ready',
                desc: 'Showcase what you can do, not just what you studied',
              },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative bg-white/90 backdrop-blur-md border border-gray-200 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl hover:border-blue-400/50 transition-all duration-300 h-full shadow-sm">
                  <benefit.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 mb-2 sm:mb-3" />
                  <h3 className="text-gray-900 font-bold text-xs sm:text-sm lg:text-base mb-1 sm:mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-[10px] sm:text-xs leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider">Scroll to explore</span>
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </motion.div>
    </motion.section>
  );
}
