/**
 * SkillPassportPreRegistration - Professional Landing Page
 * Route: /register/skill-passport
 * 
 * Features:
 * - Full landing page with hero, benefits, features
 * - Embedded SimpleEventRegistration form component
 * - Mobile-first responsive design
 * - Smooth scroll animations
 */

import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import {
  Award,
  BookOpen,
  Briefcase,
  Check,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useEffect } from 'react';
import Footer from '../../components/Footer';
import Header from '../../layouts/Header';
import { Sparkles } from '@/components/ui/sparkles';
import { PulseBeams } from '@/components/ui/pulse-beams';

import { BoltStyleChat } from '@/components/ui/bolt-style-chat';
const COLORS_TOP = ["#3B82F6", "#06B6D4", "#8B5CF6", "#EC4899"];

// Beam configuration for PulseBeams
const beams = [
  {
    path: "M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["0%", "0%", "200%"],
        x2: ["0%", "0%", "180%"],
        y1: ["80%", "0%", "0%"],
        y2: ["100%", "20%", "20%"],
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 0,
        delay: 0,
      },
    },
    connectionPoints: [
      { cx: 6.5, cy: 398.5, r: 6 },
      { cx: 269, cy: 220.5, r: 6 }
    ]
  },
  {
    path: "M568 200H841C846.523 200 851 195.523 851 190V40",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 0,
        delay: 0.5,
      },
    },
    connectionPoints: [
      { cx: 851, cy: 34, r: 6.5 },
      { cx: 568, cy: 200, r: 6 }
    ]
  },
  {
    path: "M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 0,
        delay: 1,
      },
    },
    connectionPoints: [
      { cx: 142, cy: 427, r: 6.5 },
      { cx: 425.5, cy: 274, r: 6 }
    ]
  },
  {
    path: "M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427",
    gradientConfig: {
      initial: {
        x1: "40%",
        x2: "50%",
        y1: "160%",
        y2: "180%",
      },
      animate: {
        x1: "0%",
        x2: "10%",
        y1: "-40%",
        y2: "-20%",
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 0,
        delay: 1.5,
      },
    },
    connectionPoints: [
      { cx: 770, cy: 427, r: 6.5 },
      { cx: 493, cy: 274, r: 6 }
    ]
  },
  {
    path: "M380 168V17C380 11.4772 384.477 7 390 7H414",
    gradientConfig: {
      initial: {
        x1: "-40%",
        x2: "-10%",
        y1: "0%",
        y2: "20%",
      },
      animate: {
        x1: ["40%", "0%", "0%"],
        x2: ["10%", "0%", "0%"],
        y1: ["0%", "0%", "180%"],
        y2: ["20%", "20%", "200%"],
      },
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 0,
        delay: 2,
      },
    },
    connectionPoints: [
      { cx: 420.5, cy: 6.5, r: 6 },
      { cx: 380, cy: 168, r: 6 }
    ]
  }
];

const gradientColors = {
  start: "#18CCFC",
  middle: "#6344F5",
  end: "#AE48FF"
};

export default function SkillPassportPreRegistration() {
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* HERO SECTION - Aurora Background with CSS Stars */}
      <motion.section
        style={{ backgroundImage }}
        className="relative grid min-h-screen place-content-center overflow-hidden bg-white px-4 py-24 text-gray-900"
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
            <div className="space-y-6 lg:space-y-8">
              {/* Badge with Lottie */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/70 backdrop-blur-md rounded-full border-2 border-gray-500"
              >
                <div className="w-7 h-7 flex-shrink-0">
                  <DotLottieReact
                    src="https://lottie.host/1689bbd3-291d-4b13-9da5-2882f580c526/7rNvhtQCvu.lottie"
                    loop
                    autoplay
                    style={{ width: '28px', height: '28px' }}
                  />
                </div>
                <span className="text-gray-800 text-sm font-bold tracking-wide">FOR STUDENTS ONLY</span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 text-gray-900">
                  Turn Your Skills Into Proof. Not Just a Resume.
                </h1>
              </motion.div>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed"
              >
                Skill Passport is a verified digital profile that helps students showcase real, job-ready skills—recognized by mentors, institutions, and employers.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.a
                  href="/register/event?campaign=skill-passport"
                  style={{ border, boxShadow }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/30 backdrop-blur-2xl text-gray-900 font-bold text-base lg:text-lg rounded-full transition-all duration-300 hover:bg-white/40 shadow-[0_8px_32px_0_rgba(255,255,255,0.3)] hover:shadow-[0_12px_48px_0_rgba(255,255,255,0.4)] border-2 border-gray-600"
                >
                  Pre-register Now
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
                </motion.a>

                <a
                  href="#what-is-skill-passport"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-black backdrop-blur-sm border-2 border-gray-800 text-white font-bold text-base lg:text-lg rounded-full hover:bg-gray-900 hover:border-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Learn More
                </a>
              </motion.div>

              {/* Trust Signal */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center gap-3 text-xs sm:text-sm text-gray-600"
              >
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>Built by Rareminds • ISO 9001 & ISO 21001 Certified</span>
              </motion.div>
            </div>

            {/* Right Column - Feature Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-2 gap-4 lg:gap-6"
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
                  icon: SparklesIcon,
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
                  <div className="relative bg-white/90 backdrop-blur-md border border-gray-200 p-5 lg:p-6 rounded-2xl hover:border-blue-400/50 transition-all duration-300 h-full shadow-sm">
                    <benefit.icon className="w-7 h-7 lg:w-8 lg:h-8 text-blue-600 mb-3" />
                    <h3 className="text-gray-900 font-bold text-sm lg:text-base mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">{benefit.desc}</p>
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
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* WHAT IS SKILL PASSPORT */}
      <section id="what-is-skill-passport" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What is Skill Passport?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">The Problem</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Most students have skills—but no credible way to prove them.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">The Solution</h3>
                <ul className="space-y-3 text-lg">
                  <li className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span>A single digital profile of your skills</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span>Verified learning and project credentials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span>A structured way to show what you can do</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <p className="text-2xl font-bold text-gray-900">
              This is your skill identity—designed for the real world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* WHO IS THIS FOR */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Who is This For?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Skill Passport is designed for students who are serious about their career
            </p>
          </motion.div>

          {/* Circular Orbit Layout */}
          <div className="relative max-w-5xl mx-auto">
            {/* Mobile: Stack vertically */}
            <div className="flex flex-col gap-8 lg:hidden">
              {[
                { 
                  icon: GraduationCap, 
                  desc: 'Undergraduate & postgraduate students',
                  color: 'from-blue-500 to-blue-600'
                },
                { 
                  icon: Briefcase, 
                  desc: 'Final-year students preparing for placements',
                  color: 'from-blue-500 to-blue-600'
                },
                { 
                  icon: Target, 
                  desc: 'Students applying for internships or apprenticeships',
                  color: 'from-blue-500 to-blue-600'
                },
                { 
                  icon: BookOpen, 
                  desc: 'Learners building skills beyond college curriculum',
                  color: 'from-blue-500 to-blue-600'
                }
              ].map((persona, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-lg"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${persona.color} rounded-full flex items-center justify-center flex-shrink-0 relative`}
                    style={{
                      boxShadow: '0 8px 30px rgba(59, 130, 246, 0.5), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 4px 8px rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <persona.icon className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{persona.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop: Circular Orbit */}
            <div className="hidden lg:block relative h-[300px]">
              {/* Center Circle - Lottie Animation */}
              <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div style={{ width: '250px', height: '250px' }}>
                  <DotLottieReact
                    src="https://lottie.host/8762c3c1-db94-4087-9ccc-46615033bf52/2wX4r7hVjN.lottie"
                    loop
                    autoplay
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Orbit Items */}
              {[
                { 
                  icon: GraduationCap, 
                  desc: 'Undergraduate & postgraduate students',
                  color: 'from-blue-500 to-blue-600',
                  position: 'top-[5%] right-[-5%]',
                  textAlign: 'left',
                  iconOrder: ''
                },
                { 
                  icon: Briefcase, 
                  desc: 'Final-year students preparing for placements',
                  color: 'from-blue-500 to-blue-600',
                  position: 'bottom-[15%] right-[8%]',
                  textAlign: 'left',
                  iconOrder: ''
                },
                { 
                  icon: Target, 
                  desc: 'Students applying for internships or apprenticeships',
                  color: 'from-blue-500 to-blue-600',
                  position: 'bottom-[15%] left-[8%]',
                  textAlign: 'right',
                  iconOrder: 'order-2'
                },
                { 
                  icon: BookOpen, 
                  desc: 'Learners building skills beyond college curriculum',
                  color: 'from-blue-500 to-blue-600',
                  position: 'top-[5%] left-[-5%]',
                  textAlign: 'right',
                  iconOrder: 'order-2'
                }
              ].map((persona, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className={`absolute ${persona.position} flex items-center gap-4`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon Circle */}
                    <div className={`w-24 h-24 bg-gradient-to-br ${persona.color} rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(59,130,246,0.5)] border-4 border-white relative ${persona.iconOrder}`}
                      style={{
                        boxShadow: '0 8px 30px rgba(59, 130, 246, 0.5), inset 0 -4px 8px rgba(0, 0, 0, 0.2), inset 0 4px 8px rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <persona.icon className="w-10 h-10 text-white relative z-10" />
                    </div>
                    
                    {/* Info Text */}
                    <div className={`flex flex-col justify-center max-w-[220px] text-${persona.textAlign}`}>
                      <p className="text-base  text-gray-900  leading-tight">{persona.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY SKILL PASSPORT MATTERS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Skill Passport Matters
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Today's Problem</h3>
              <div className="space-y-4">
                {[
                  'Degrees are common',
                  'Resumes look the same',
                  'Employers care about skills, not just scores'
                ].map((problem, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{problem}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Skill Passport Helps You</h3>
              <div className="space-y-4">
                {[
                  'Demonstrate industry-relevant skills',
                  'Organize learning, projects, and certifications',
                  'Present yourself with clarity and confidence'
                ].map((solution, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl shadow-sm border border-blue-200">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-900 font-medium">{solution}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center bg-white p-10 rounded-3xl shadow-xl border-2 border-gray-100"
          >
            <p className="text-2xl font-bold text-gray-900 mb-4">
              This is not another course.
            </p>
            <p className="text-xl text-gray-600">
              This is how your skills are seen and recognised.
            </p>
          </motion.div>
        </div>
      </section>

      {/* HERO DITHERING CTA SECTION */}
      <BoltStyleChat title="Ready to build your" subtitle="Secure your early access to Skill Passport with a one-time pre-registration fee of ₹250." announcementText="Early Access Pre-Registration" placeholder="What skills do you want to showcase?" onSend={(msg) => window.location.href = "/register/event?campaign=skill-passport"} />



      {/* WHAT YOU GET SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What You Get After Pre-Registration
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Mail, title: 'Instant Confirmation', desc: 'Confirmation email sent immediately' },
              { icon: Zap, title: 'Early Access', desc: 'Priority access to the platform' },
              { icon: Users, title: 'Priority Onboarding', desc: 'Dedicated support during launch' },
              { icon: Award, title: 'Exclusive Benefits', desc: 'Special perks for early users' }
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl shadow-lg border-2 border-blue-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center bg-gradient-to-r from-emerald-50 to-teal-50 p-10 rounded-3xl border-2 border-emerald-200"
          >
            <p className="text-2xl font-bold text-gray-900 mb-2">
              No recurring charges. No hidden fees.
            </p>
            <p className="text-lg text-gray-600">
              One-time payment of ₹250 for lifetime early access
            </p>
          </motion.div>
        </div>
      </section>

      {/* ABOUT RAREMINDS */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-8">
              <img 
                src="/RareMinds.webp" 
                alt="Rareminds Logo" 
                className="h-16 mx-auto mb-6"
              />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Rareminds
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Rareminds is a learning and transformation organization focused on building future-ready skills for students and professionals.
            </p>

            {/* Simple Flex List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-gray-700 text-lg mt-20 mb-16"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <span className="font-medium">ISO 9001 & ISO 21001 Certified</span>
              </div>
              <div className="hidden md:block w-px h-8 bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <span className="font-medium">Trusted by Educational Institutions</span>
              </div>
              <div className="hidden md:block w-px h-8 bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <span className="font-medium">Focused on Applied Learning</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Sparkles Background Effect - Positioned at Bottom */}
        <div className="absolute inset-0 top-2/3 pointer-events-none">
          <div className="relative h-full w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
            <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#8350e8,transparent_70%)] before:opacity-40" />
            <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-gray-900/20 bg-white" />
            <Sparkles
              density={1200}
              className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
              color="#8350e8"
            />
          </div>
        </div>
      </section>

      {/* NEED HELP */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Need Some Help?
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-[1.2fr,1fr] gap-16 items-center max-w-6xl mx-auto">
            {/* Left Column - Large Animation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center lg:justify-end"
            >
              <DotLottieReact
                src="https://lottie.host/3ae3ba03-21ac-4b70-90e3-f349c2360211/wRnTObzkdE.lottie"
                loop
                autoplay
                style={{ width: '500px', height: '500px' }}
              />
            </motion.div>

            {/* Right Column - Compact Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              {/* Email Card */}
              <motion.a
                href="mailto:support@rareminds.in"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group block p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">Email Support</h3>
                    <p className="text-xs text-gray-600 mb-1.5 leading-snug">
                      Have questions? Send us an email and we'll get back to you within 24 hours.
                    </p>
                    <div className="flex items-center gap-1 text-blue-600 font-medium text-xs group-hover:gap-1.5 transition-all">
                      <span>support@rareminds.in</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.a>

              {/* WhatsApp Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="block p-4 bg-white rounded-xl border-2 border-gray-200"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">WhatsApp Support</h3>
                    <p className="text-xs text-gray-600 mb-1.5 leading-snug">
                      Get instant support via WhatsApp after completing your registration.
                    </p>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Available after registration
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
