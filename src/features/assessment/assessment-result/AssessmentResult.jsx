import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
    Target,
    Briefcase,
    Zap,
    Rocket,
    Download,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
    X,
    GraduationCap,
    CheckCircle2,
    ClipboardCheck,
    TrendingUp,
    ChevronRight
} from 'lucide-react';
import { Button } from '../../../components/Students/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../../components/Students/components/ui/dialog';

// Import modular components
import {
    PrintView,
    LoadingState,
    ErrorState,
    ReportHeader,
    SummaryCard,
    ProfileSection,
    CareerSection,
    SkillsSection,
    RoadmapSection,
    StageScoresSection
} from './components';

// Import Career Track Modal
import CareerTrackModal from './components/CareerTrackModal';

// Import UI effects
import { TextGenerateEffect } from '../../../components/ui/text-generate-effect';

// Import constants and hooks
import { RIASEC_NAMES, RIASEC_COLORS, TRAIT_NAMES, TRAIT_COLORS, PRINT_STYLES } from './constants';
import { useAssessmentResults } from './hooks/useAssessmentResults';

// Import course matching engine
import { calculateCourseMatchScores, DEGREE_PROGRAMS, COURSE_KNOWLEDGE_BASE } from './utils/courseMatchingEngine';

// Import AI career paths service
import { generateProgramCareerPathsWithFallback } from '../../../services/programCareerPathsService';

// Import stream matching engine for after 10th students
import { calculateStreamRecommendations } from './utils/streamMatchingEngine';

// Import centralized utilities from assessment feature
import { normalizeCourseRecommendations } from '../index';

/**
 * Gemini-Style Career Path Connector
 * Animated gradient paths connecting career cards (inspired by Aceternity UI)
 */
const GeminiCareerPath = ({ reverse = false }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

    return (
        <div ref={ref} className="relative h-24 md:h-32 lg:h-40 w-full overflow-hidden hidden md:block">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={`geminiGradient${reverse ? 'R' : 'L'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1E3A8A" />
                        <stop offset="25%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#60A5FA" />
                        <stop offset="75%" stopColor="#93C5FD" />
                        <stop offset="100%" stopColor="#BFDBFE" />
                    </linearGradient>
                    <filter id="geminiGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main flowing path - thickest */}
                <motion.path
                    d={reverse
                        ? "M800 20 Q 600 20, 500 80 T 200 80 Q 100 80, 0 140"
                        : "M0 20 Q 200 20, 300 80 T 600 80 Q 700 80, 800 140"
                    }
                    stroke={`url(#geminiGradient${reverse ? 'R' : 'L'})`}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    filter="url(#geminiGlow)"
                    style={{
                        pathLength,
                        opacity
                    }}
                />

                {/* Secondary path */}
                <motion.path
                    d={reverse
                        ? "M800 30 Q 580 30, 480 90 T 180 90 Q 80 90, 0 150"
                        : "M0 30 Q 220 30, 320 90 T 620 90 Q 720 90, 800 150"
                    }
                    stroke={`url(#geminiGradient${reverse ? 'R' : 'L'})`}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeOpacity="0.6"
                    filter="url(#geminiGlow)"
                    style={{
                        pathLength,
                        opacity
                    }}
                />

                {/* Tertiary path */}
                <motion.path
                    d={reverse
                        ? "M800 40 Q 560 40, 460 100 T 160 100 Q 60 100, 0 160"
                        : "M0 40 Q 240 40, 340 100 T 640 100 Q 740 100, 800 160"
                    }
                    stroke={`url(#geminiGradient${reverse ? 'R' : 'L'})`}
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeOpacity="0.4"
                    filter="url(#geminiGlow)"
                    style={{
                        pathLength,
                        opacity
                    }}
                />

                {/* Fourth path - thinnest */}
                <motion.path
                    d={reverse
                        ? "M800 50 Q 540 50, 440 110 T 140 110 Q 40 110, 0 170"
                        : "M0 50 Q 260 50, 360 110 T 660 110 Q 760 110, 800 170"
                    }
                    stroke={`url(#geminiGradient${reverse ? 'R' : 'L'})`}
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                    strokeOpacity="0.25"
                    filter="url(#geminiGlow)"
                    style={{
                        pathLength,
                        opacity
                    }}
                />
            </svg>
        </div>
    );
};

/**
 * Animated Path Component - Creates dotted line animation (LEGACY - kept for reference)
 */
// const AnimatedPath = ({ d, delay = 0 }) => { ... } // Removed - replaced by GeminiCareerPath

/**
 * Animated Progress Ring Component - Circular percentage display
 */
const AnimatedProgressRing = ({ percentage, color, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const [displayValue, setDisplayValue] = useState(0);

    const size = 180;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const duration = 2000; // 2 seconds
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (easeOutCubic)
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * percentage);

                setDisplayValue(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [isInView, percentage]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, delay, ease: "backOut" }}
            className="relative"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                />

                {/* Animated progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={isInView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
                    transition={{ duration: 2, delay, ease: "easeOut" }}
                    style={{
                        filter: `drop-shadow(0 0 8px ${color}40)`
                    }}
                />
            </svg>

            {/* Percentage text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-5xl font-bold"
                    style={{ color }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: delay + 0.3 }}
                >
                    {displayValue}%
                </motion.span>
                <motion.span
                    className="text-sm text-gray-400 mt-1"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.6, delay: delay + 0.5 }}
                >
                    Match
                </motion.span>
            </div>
        </motion.div>
    );
};

/**
 * Career Card Component
 * Displays individual career recommendation with animation
 * Features flip effect on hover - content fades out, CTA rotates in
 */
const CareerCard = ({ cluster, index, fitType, color, reverse = false, specificRoles = [], onCardClick }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const [isHovered, setIsHovered] = useState(false);

    if (!cluster) return null;

    const colorConfig = {
        green: {
            bg: '#1a2236',
            accent: '#2563eb',
            accentLight: '#60a5fa',
            shadow: 'rgba(37, 99, 235, 0.3)'
        },
        yellow: {
            bg: '#1e293b',
            accent: '#3b82f6',
            accentLight: '#93c5fd',
            shadow: 'rgba(59, 130, 246, 0.3)'
        },
        purple: {
            bg: '#1e293b',
            accent: '#60a5fa',
            accentLight: '#bfdbfe',
            shadow: 'rgba(96, 165, 250, 0.3)'
        }
    };

    const config = colorConfig[color];

    // Helper to get role name (handles both string and object formats)
    const getRoleName = (role) => {
        if (typeof role === 'string') return role;
        return role?.name || '';
    };

    // Helper to format salary
    const formatSalary = (role) => {
        if (typeof role === 'string') return null;
        const salary = role?.salary;
        if (!salary || typeof salary.min !== 'number' || typeof salary.max !== 'number') return null;
        if (salary.min === salary.max) return `₹${salary.min}L`;
        return `₹${salary.min}L - ₹${salary.max}L`;
    };

    const handleCardClick = () => {
        if (onCardClick) {
            onCardClick(cluster, index, fitType, specificRoles);
        }
    };

    return (
        <>
            <div className={index > 0 ? "mt-20 md:mt-0 lg:-mt-16" : ""}>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 50 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="grid md:grid-cols-2 gap-16 md:gap-12 items-center relative z-10"
                >
                    {/* Card (appears first on mobile, order changes on desktop) */}
                    <motion.div
                        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 50 : -50 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={`flex justify-center ${reverse ? 'md:order-2' : 'md:order-1'}`}
                    >
                        {/* Outer Container with Gradient Border - Flip Card Effect */}
                        <div
                            className="relative rounded-[10px] p-[1px] cursor-pointer"
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                minHeight: '280px',
                                background: isHovered
                                    ? `radial-gradient(circle 230px at 0% 0%, ${config.accent}, #0c0d0d)`
                                    : `radial-gradient(circle 230px at 0% 0%, ${config.accentLight}, #0c0d0d)`,
                                borderRadius: isHovered ? '15px' : '10px',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isHovered
                                    ? `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px 5px ${config.shadow}`
                                    : `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 15px 3px ${config.shadow}`,
                                transition: 'all 0.4s ease'
                            }}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={handleCardClick}
                        >
                            {/* Animated Dot - Hidden on hover */}
                            <div
                                className="absolute w-[5px] aspect-square rounded-full z-[2] transition-opacity duration-300"
                                style={{
                                    backgroundColor: '#fff',
                                    boxShadow: `0 0 10px ${config.accentLight}`,
                                    animation: 'moveDot 6s linear infinite',
                                    opacity: isHovered ? 0 : 1
                                }}
                            />

                            {/* Main Card */}
                            <div
                                className="relative w-full h-full rounded-[9px] overflow-hidden"
                                style={{
                                    background: `radial-gradient(circle 280px at 0% 0%, ${config.accent}40, #0c0d0d)`,
                                    backgroundSize: '20px 20px',
                                    minHeight: '280px'
                                }}
                            >
                                {/* Ray Light Effect */}
                                <div
                                    className="absolute w-[220px] h-[45px] rounded-[100px] opacity-40 blur-[10px]"
                                    style={{
                                        backgroundColor: config.accentLight,
                                        boxShadow: `0 0 50px ${config.accentLight}`,
                                        transformOrigin: '10%',
                                        top: '0%',
                                        left: '0',
                                        transform: 'rotate(40deg)'
                                    }}
                                />

                                {/* Grid Lines */}
                                <div
                                    className="absolute w-[2px] h-[1px]"
                                    style={{
                                        top: '10%',
                                        background: `linear-gradient(90deg, ${config.accent}88 30%, #1d1f1f 70%)`
                                    }}
                                />
                                <div className="absolute w-[2px] h-[1px]" style={{ bottom: '10%' }} />
                                <div
                                    className="absolute w-[2px] h-full"
                                    style={{
                                        left: '10%',
                                        background: `linear-gradient(180deg, ${config.accent}74 30%, #222424 70%)`
                                    }}
                                />
                                <div className="absolute w-[2px] h-full" style={{ right: '10%' }} />

                                {/* First Content - Main Card Content (visible by default) */}
                                <div
                                    className="absolute inset-0 flex flex-col justify-center transition-all duration-400 rounded-[9px]"
                                    style={{
                                        opacity: isHovered ? 0 : 1,
                                        height: isHovered ? '0px' : '100%',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div className="relative z-[1] px-8 py-6">
                                        {/* Header with number badge and title */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
                                                style={{ backgroundColor: config.accent }}
                                            >
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <span
                                                    className="inline-block px-3 py-1 text-white text-xs font-semibold rounded-full mb-1"
                                                    style={{ backgroundColor: config.accent }}
                                                >
                                                    {fitType}
                                                </span>
                                                <h3 className="text-lg sm:text-xl font-bold text-white">{cluster.title}</h3>
                                            </div>
                                        </div>

                                        {/* Top Roles & Salary Section */}
                                        {specificRoles && specificRoles.length > 0 && (
                                            <div className="mt-2">
                                                <h5
                                                    className="text-xs font-bold uppercase mb-3 tracking-wider"
                                                    style={{ color: config.accentLight }}
                                                >
                                                    TOP ROLES & SALARY
                                                </h5>
                                                <div className="space-y-2">
                                                    {specificRoles.slice(0, 3).map((role, idx) => {
                                                        const name = getRoleName(role);
                                                        const salary = formatSalary(role);
                                                        return (
                                                            <div key={idx} className="flex items-center justify-between">
                                                                <span className="text-gray-200 text-base">{name}</span>
                                                                {salary && (
                                                                    <span className="text-green-400 font-semibold text-base">{salary}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Second Content - CTA (visible on hover, rotates in) */}
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-400 rounded-[9px]"
                                    style={{
                                        opacity: isHovered ? 1 : 0,
                                        height: isHovered ? '100%' : '0%',
                                        transform: isHovered ? 'rotate(0deg)' : 'rotate(90deg) scale(-1)',
                                        overflow: 'hidden',
                                        background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #000000 100%)'
                                    }}
                                >
                                    <div className="text-center px-6">
                                        <motion.div
                                            animate={{
                                                y: isHovered ? [0, -5, 0] : 0,
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="mb-4"
                                        >
                                            <div
                                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                                                style={{
                                                    backgroundColor: '#2a2a2a',
                                                    border: '2px solid #404040',
                                                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                                                }}
                                            >
                                                <Rocket className="w-8 h-8 text-white" />
                                            </div>
                                        </motion.div>
                                        <h4 className="text-xl font-bold mb-2 text-white">
                                            Explore {cluster.title}
                                        </h4>
                                        <p className="text-gray-300 text-sm mb-4">
                                            View role-specific courses, career roadmap, required skills, and growth opportunities
                                        </p>
                                        <motion.div
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer"
                                            style={{
                                                backgroundColor: '#333333',
                                                color: '#ffffff',
                                                border: '1px solid #4a4a4a'
                                            }}
                                            whileHover={{
                                                backgroundColor: '#ffffff',
                                                color: '#000000',
                                                scale: 1.05,
                                                boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <span>View Full Track</span>
                                            <motion.span
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                →
                                            </motion.span>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keyframes for dot animation */}
                        <style>{`
                            @keyframes moveDot {
                                0%, 100% {
                                    top: 10%;
                                    right: 10%;
                                }
                                25% {
                                    top: 10%;
                                    right: calc(100% - 35px);
                                }
                                50% {
                                    top: calc(100% - 30px);
                                    right: calc(100% - 35px);
                                }
                                75% {
                                    top: calc(100% - 30px);
                                    right: 10%;
                                }
                            }
                        `}</style>
                    </motion.div>

                    {/* Animated Progress Ring (appears second on mobile, order changes on desktop) */}
                    <motion.div
                        initial={{ opacity: 0, x: reverse ? -50 : 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? -50 : 50 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className={`flex flex-col items-center text-center px-4 ${reverse ? 'md:order-1' : 'md:order-2'}`}
                    >
                        <AnimatedProgressRing
                            percentage={cluster.matchScore}
                            color={config.accentLight}
                            delay={0.5}
                        />
                        <p className="text-gray-400 leading-relaxed max-w-xl text-sm mt-6">
                            {index === 0 && "This career path aligns perfectly with your skills and interests"}
                            {index === 1 && "A promising career option with good alignment to your profile"}
                            {index === 2 && "Worth exploring as you develop additional skills and experience"}
                        </p>
                    </motion.div>
                </motion.div>
            </div>
            {index < 2 && <GeminiCareerPath reverse={index === 0} />}
        </>
    );
};

/**
 * Assessment Result Page
 * Displays comprehensive career assessment results with modular components
 */
const AssessmentResult = () => {
    const [activeSection, setActiveSection] = useState(null);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); // 0 = role selection, 1-3 = wizard pages
    const [activeRecommendationTab, setActiveRecommendationTab] = useState('primary'); // 'primary' or 'career' - default to primary (stream for after10, degree for after12)
    const [after10Step, setAfter10Step] = useState(1); // 1 = Stream Recommendation, 2 = Career Clusters (stepper for after10)
    const [aiCareerPathsLoading, setAiCareerPathsLoading] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                // Scrolling down
                setIsNavbarVisible(false);
            } else {
                // Scrolling up
                setIsNavbarVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const {
        results,
        loading,
        error,
        retrying,
        gradeLevel,
        monthsInGrade,
        studentInfo,
        studentAcademicData,
        validationWarnings,
        handleRetry,
        validateResults,
        navigate
    } = useAssessmentResults();

    // Determine if we should show program recommendations
    // Only show for: After 10 with 6+ months, After 12, College
    // DON'T show for: Grade 6-10 (middle, highschool), After 10 with < 6 months
    // IMPORTANT: Use student's ACTUAL grade from database, not the assessment's grade_level
    const shouldShowProgramRecommendations = useMemo(() => {
        // Get the student's actual grade from studentInfo (from database)
        const actualGrade = studentInfo?.grade;

        // Parse the actual grade number
        let actualGradeNum = null;
        if (actualGrade) {
            const match = actualGrade.toString().match(/\d+/);
            if (match) {
                actualGradeNum = parseInt(match[0], 10);
            }
        }

        console.log('shouldShowProgramRecommendations check:', {
            gradeLevel,
            actualGrade,
            actualGradeNum,
            monthsInGrade
        });

        // If we have actual grade from database, use it for the decision
        if (actualGradeNum !== null) {
            // Grade 6-8 (middle school) - DON'T show
            if (actualGradeNum >= 6 && actualGradeNum <= 8) {
                console.log('Not showing recommendations: Middle school (Grade 6-8)');
                return false;
            }
            // Grade 9-10 (high school) - DON'T show
            if (actualGradeNum >= 9 && actualGradeNum <= 10) {
                console.log('Not showing recommendations: High school (Grade 9-10)');
                return false;
            }
            // Grade 11 (After 10th) - only show if 6+ months in grade
            if (actualGradeNum === 11) {
                const show = monthsInGrade !== null && monthsInGrade >= 6;
                console.log(`Grade 11 with ${monthsInGrade} months: ${show ? 'showing' : 'not showing'} recommendations`);
                return show;
            }
            // Grade 12 and above - always show
            if (actualGradeNum >= 12) {
                console.log('Showing recommendations: Grade 12+');
                return true;
            }
        }

        // Fallback to gradeLevel from assessment if no actual grade
        // Middle school (6-8) - DON'T show
        if (gradeLevel === 'middle') {
            return false;
        }
        // High school (9-10) - DON'T show
        if (gradeLevel === 'highschool') {
            return false;
        }
        // After 10 (11th grade) - only show if 6+ months in grade
        if (gradeLevel === 'after10') {
            return monthsInGrade !== null && monthsInGrade >= 6;
        }
        // After 12 and college - always show
        // IMPORTANT: higher_secondary (grades 11-12) should NOT show program recommendations
        if (gradeLevel === 'after12' || gradeLevel === 'college') {
            return true;
        }
        // Higher secondary (grades 11-12) - DON'T show program recommendations
        if (gradeLevel === 'higher_secondary') {
            return false;
        }
        return false;
    }, [gradeLevel, monthsInGrade, studentInfo?.grade]);

    // Calculate enhanced course recommendations with accurate match scores
    // Only calculate for grade levels that should show recommendations
    // IMPORTANT: Use student's ACTUAL grade from database, not the assessment's grade_level
    const enhancedCourseRecommendations = useMemo(() => {
        // DIAGNOSTIC: Check if we have results and RIASEC data
        console.log('🔍 Course Recommendations - Initial Check:', {
            'hasResults': !!results,
            'loading': loading,
            'retrying': retrying,
            'hasRiasec': !!results?.riasec,
            'hasScores': !!results?.riasec?.scores,
            'scoresKeys': results?.riasec?.scores ? Object.keys(results.riasec.scores) : [],
            'scoresValues': results?.riasec?.scores ? Object.values(results.riasec.scores) : []
        });

        // Don't calculate if still loading or retrying
        if (loading || retrying) {
            console.log('⏳ Skipping course recommendations - still loading/retrying');
            return [];
        }

        // Don't calculate if no results yet
        if (!results) {
            console.log('⏳ Skipping course recommendations - no results yet');
            return [];
        }

        // Get the student's actual grade from studentInfo (from database)
        const actualGrade = studentInfo?.grade;
        let actualGradeNum = null;
        if (actualGrade) {
            const match = actualGrade.toString().match(/\d+/);
            if (match) {
                actualGradeNum = parseInt(match[0], 10);
            }
        }

        // If we have actual grade, use it for the decision
        if (actualGradeNum !== null) {
            // Grade 6-10 - DON'T calculate
            if (actualGradeNum >= 6 && actualGradeNum <= 10) {
                return [];
            }
            // Grade 11 - only calculate if 6+ months
            if (actualGradeNum === 11 && (monthsInGrade === null || monthsInGrade < 6)) {
                return [];
            }
        } else {
            // Fallback to gradeLevel from assessment
            // Don't calculate for middle school or high school
            if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
                return [];
            }
            // Don't calculate for after10 with < 6 months
            if (gradeLevel === 'after10' && (monthsInGrade === null || monthsInGrade < 6)) {
                return [];
            }
        }

        // For eligible students - use DEGREE_PROGRAMS
        // Use degree programs from knowledge base for proper scoring
        // FIXED: Pass assessment results as academic data if profile is empty
        const assessmentBasedAcademicData = {
            subjectMarks: studentAcademicData?.subjectMarks || [],
            projects: studentAcademicData?.projects || [],
            experiences: studentAcademicData?.experiences || [],
            // Add assessment results as fallback data source
            _assessmentResults: {
                riasec: results?.riasec,
                aptitude: results?.aptitude,
                bigFive: results?.bigFive,
                workValues: results?.workValues,
                employability: results?.employability,
                knowledge: results?.knowledge
            }
        };

        // DEBUG: Log RIASEC data structure
        console.log('🔍 RIASEC Debug:', {
            hasResults: !!results,
            hasRiasec: !!results?.riasec,
            riasecKeys: results?.riasec ? Object.keys(results.riasec) : [],
            scores: results?.riasec?.scores,
            fullRiasec: results?.riasec
        });

        // STREAM FILTERING: Get student's stream from assessment results or profile
        // Priority: 1) Stream from current assessment, 2) Stream recommendation from after10, 3) Profile stream, 4) No filter
        let studentStream = null;

        console.log('🔍 Stream Detection - Checking sources:', {
            'results exists': !!results,
            'results keys': results ? Object.keys(results) : [],
            'has streamRecommendation': !!results?.streamRecommendation?.recommendedStream,
            'streamRecommendation value': results?.streamRecommendation?.recommendedStream,
            'studentInfo exists': !!studentInfo,
            'studentInfo.stream': studentInfo?.stream,
            'stream check': studentInfo?.stream && studentInfo.stream !== '—' && studentInfo.stream.toUpperCase() !== 'N/A',
            'academicData.stream': studentAcademicData?.stream,
            'gradeLevel': gradeLevel
        });
        
        // PRIORITY 1: Check if results contain stream information (for after12/higher_secondary/college)
        // The stream is stored in the assessment results when student selects it during assessment
        if (results?.stream || results?.streamId || results?.stream_id) {
            studentStream = results.stream || results.streamId || results.stream_id;
            console.log('📚 Using stream from assessment results:', studentStream);
        }
        // PRIORITY 2: Check if student has completed after10 assessment and has stream recommendation
        // IMPORTANT: Validate that the stream recommendation is not a placeholder value
        else if (results?.streamRecommendation?.recommendedStream && 
                 results.streamRecommendation.recommendedStream !== 'N/A' &&
                 results.streamRecommendation.recommendedStream !== '—' &&
                 results.streamRecommendation.recommendedStream !== '') {
            studentStream = results.streamRecommendation.recommendedStream;
            console.log('📚 Using stream from after10 assessment:', studentStream);
        } 
        // PRIORITY 3: Check if student has stream in their profile (for after12/college students)
        else if (studentInfo?.stream && studentInfo.stream !== '—' && studentInfo.stream.toUpperCase() !== 'N/A') {
            studentStream = studentInfo.stream;
            console.log('📚 Using stream from student profile:', studentStream);
        }
        // PRIORITY 4: Check academic data for stream indicators
        else if (studentAcademicData?.stream) {
            studentStream = studentAcademicData.stream;
            console.log('📚 Using stream from academic data:', studentStream);
        }
        else {
            console.log('⚠️ No valid stream found in any source!');
            console.log('📋 Full results object:', results);
        }

        // Debug: Log all stream sources
        console.log('🔍 Stream Detection Debug:', {
            'results.streamRecommendation': results?.streamRecommendation?.recommendedStream,
            'studentInfo.stream': studentInfo?.stream,
            'academicData.stream': studentAcademicData?.stream,
            'finalStream': studentStream
        });

        console.log('🎯 About to call calculateCourseMatchScores with stream:', studentStream);

        // DIAGNOSTIC: Final check before calling calculateCourseMatchScores
        const riasecScores = results?.riasec?.scores || {};
        console.log('📊 Final RIASEC Check Before Calculation:', {
            'riasecScores': riasecScores,
            'hasKeys': Object.keys(riasecScores).length > 0,
            'hasNonZeroValues': Object.values(riasecScores).some(s => s > 0),
            'allValues': Object.values(riasecScores)
        });

        // Don't call if no valid RIASEC data
        if (!riasecScores || Object.keys(riasecScores).length === 0) {
            console.log('⚠️ Aborting calculateCourseMatchScores - no RIASEC scores');
            return [];
        }

        if (!Object.values(riasecScores).some(s => s > 0)) {
            console.log('⚠️ Aborting calculateCourseMatchScores - all RIASEC scores are zero');
            return [];
        }

        return calculateCourseMatchScores(
            DEGREE_PROGRAMS,
            riasecScores,
            assessmentBasedAcademicData,
            studentStream // Pass student's stream for filtering
        );
    }, [gradeLevel, monthsInGrade, results, studentAcademicData, studentInfo?.grade, studentInfo?.stream, loading, retrying]);

    // Calculate stream recommendations for after 10th students using academic data
    const enhancedStreamRecommendation = useMemo(() => {
        if (gradeLevel !== 'after10') return null;

        // Use the stream matching engine with academic data (marks, projects, experiences)
        const streamRec = calculateStreamRecommendations(results, studentAcademicData);

        // Merge with AI recommendation if available, PREFERRING AI results over engine calculations
        // AI has analyzed the full assessment context and provides more accurate recommendations
        if (results?.streamRecommendation) {
            return {
                ...streamRec,                      // Engine results as base
                ...results.streamRecommendation,   // AI results OVERRIDE engine (AI is more accurate)
                // Merge reasoning - prefer AI reasoning, fallback to engine
                reasoning: {
                    interests: results.streamRecommendation.reasoning?.interests || streamRec.reasoning?.interests,
                    aptitude: results.streamRecommendation.reasoning?.aptitude || streamRec.reasoning?.aptitude,
                    personality: results.streamRecommendation.reasoning?.personality || streamRec.reasoning?.personality
                },
                // Keep engine's additional data that AI doesn't provide
                subjectsToFocus: results.streamRecommendation.subjectsToFocus || streamRec.subjectsToFocus,
                careerPathsAfter12: results.streamRecommendation.careerPathsAfter12 || streamRec.careerPathsAfter12,
                entranceExams: results.streamRecommendation.entranceExams || streamRec.entranceExams,
                collegeTypes: results.streamRecommendation.collegeTypes || streamRec.collegeTypes,
                alternativeStream: results.streamRecommendation.alternativeStream || streamRec.alternativeStream,
                alternativeReason: results.streamRecommendation.alternativeReason || streamRec.alternativeReason,
                allStreamScores: streamRec.allStreamScores // Keep engine's detailed scores for reference
            };
        }

        return streamRec;
    }, [gradeLevel, results, studentAcademicData]);

    // Custom print function that opens print view in new window
    const handlePrint = () => {
        const printContent = document.querySelector('.print-view');
        if (!printContent) {
            console.error('Print view not found');
            window.print();
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            // Fallback to regular print if popup blocked
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Career Assessment Report</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, Helvetica, sans-serif;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    img {
                        max-width: 100%;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    };

    // Handle career track card click
    const handleTrackClick = (cluster, index, fitType, specificRoles) => {
        setSelectedTrack({
            cluster,
            index,
            fitType,
            specificRoles
        });
        setSelectedRole(null);
        setCurrentStep(0);
    };

    // Close track modal
    const closeTrackModal = () => {
        setSelectedTrack(null);
        setSelectedRole(null);
        setCurrentStep(0);
    };

    // Handle role selection
    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setCurrentStep(1);
    };

    // Navigate to next step
    const goToNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Navigate to previous step
    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else if (currentStep === 1) {
            setCurrentStep(0);
            setSelectedRole(null);
        }
    };

    // Loading state
    if (loading) {
        return <LoadingState />;
    }

    // Error state
    if (error) {
        return (
            <ErrorState
                error={error}
                onRetry={handleRetry}
                retrying={retrying}
                onRetake={() => navigate('/student/assessment/test')}
            />
        );
    }

    if (!results) return null;

    const { riasec, aptitude, knowledge, careerFit, skillGap, roadmap, employability, streamRecommendation } = results;
    const missingFields = validateResults();
    const hasIncompleteData = missingFields.length > 0;

    // Debug log for stream recommendation
    console.log('AssessmentResult Debug:', {
        gradeLevel,
        hasStreamRecommendation: !!streamRecommendation,
        streamRecommendation: streamRecommendation,
        isAfter10: streamRecommendation?.isAfter10,
        recommendedStream: streamRecommendation?.recommendedStream
    });

    return (
        <>
            {/* Inject print styles */}
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

            {/* Print View - Simple document format for PDF */}
            <PrintView
                results={results}
                studentInfo={studentInfo}
                gradeLevel={gradeLevel}
                riasecNames={RIASEC_NAMES}
                traitNames={TRAIT_NAMES}
                courseRecommendations={enhancedCourseRecommendations}
                streamRecommendation={enhancedStreamRecommendation || streamRecommendation}
                studentAcademicData={studentAcademicData}
            />

            {/* Web View - Rich UI for screen */}
            <div className="web-view min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pt-16 pb-8 px-4">
                {/* Floating Action Bar */}
                <div
                    className={`fixed top-0 left-0 right-0 z-50 w-full transition-transform duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
                        }`}
                >
                    <div className="relative flex justify-between items-center bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 px-6 py-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/student/dashboard')}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 h-8 text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>

                        {/* Center Logo */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <img
                                src="/RareMinds.webp"
                                alt="RareMinds Logo"
                                className="h-8 w-auto object-contain"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleRetry}
                                disabled={retrying}
                                className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 h-8 text-sm"
                            >
                                {retrying ? (
                                    <>
                                        <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-3 h-3 mr-1.5" />
                                        Regenerate
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handlePrint}
                                className="bg-slate-800 text-white hover:bg-slate-700 shadow-sm h-8 text-sm font-medium"
                            >
                                <Download className="w-3 h-3 mr-1.5" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Incomplete Data Warning Banner */}
                {hasIncompleteData && (
                    <div className="max-w-6xl mx-auto mb-6 print:hidden print-hidden">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-amber-800 mb-1">Incomplete Report Data</h4>
                                <p className="text-amber-700 text-sm mb-2">
                                    Some sections of your report may be missing or incomplete: {missingFields.join(', ')}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleRetry}
                                    disabled={retrying}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {retrying ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Regenerate Report
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Aptitude Data Quality Warning Banner */}
                {results?._aptitudeWarning && !results._aptitudeWarning.isValid && (
                    <div className="max-w-6xl mx-auto mb-6 print:hidden print-hidden">
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-orange-800 mb-1">Aptitude Data Quality Notice</h4>
                                <p className="text-orange-700 text-sm mb-2">
                                    {results._aptitudeWarning.message}
                                </p>
                                <p className="text-orange-600 text-xs">
                                    {results._aptitudeWarning.recommendation}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Container */}
                <div className="max-w-6xl mx-auto print:max-w-none print-container mt-4">
                    {/* Header Section */}
                    <ReportHeader studentInfo={studentInfo} gradeLevel={gradeLevel} />

                    {/* Overall Summary Banner */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden my-8">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6">
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/50"
                                    style={{
                                        boxShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <img
                                        src="/assets/HomePage/Ai Logo.png"
                                        alt="AI Logo"
                                        className="w-14 h-14 object-contain"
                                    />
                                </div>
                                <div className="flex-1">
                                    {results.overallSummary && (
                                        <TextGenerateEffect
                                            words={`"${results.overallSummary}"`}
                                            className="text-slate-300 text-lg"
                                            filter={true}
                                            duration={0.4}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Grid 
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Assessment Summary</h2>
                        <p className="text-gray-500 text-center mb-8 text-lg">Click on any section to view detailed insights</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SummaryCard
                                title="Profile Snapshot"
                                subtitle="Your core characteristics"
                                icon={Target}
                                gradient="from-indigo-500 to-indigo-600"
                                onClick={() => setActiveSection('profile')}
                                delay={0}
                                data={[
                                    { label: 'Top Interest', value: riasec?.topThree?.[0] ? RIASEC_NAMES[riasec.topThree[0]] : 'N/A' },
                                    { label: 'Top Aptitude', value: aptitude?.topStrengths?.[0] || 'N/A' },
                                    { label: 'Knowledge Score', value: `${knowledge?.score || 0}%` },
                                ]}
                            />

                            <SummaryCard
                                title="Career Fit"
                                subtitle="Best-matching career paths"
                                icon={Briefcase}
                                gradient="from-indigo-500 to-indigo-600"
                                onClick={() => setActiveSection('career')}
                                delay={100}
                                data={[
                                    { label: 'Top Cluster', value: careerFit?.clusters?.[0]?.title || 'N/A' },
                                    { label: 'Match Score', value: `${careerFit?.clusters?.[0]?.matchScore || 0}%` },
                                    { label: 'High Fit Roles', value: careerFit?.specificOptions?.highFit?.length || 0 },
                                ]}
                            />

                            <SummaryCard
                                title="Skill Gap Analysis"
                                subtitle="Areas for development"
                                icon={Zap}
                                gradient="from-indigo-500 to-indigo-600"
                                onClick={() => setActiveSection('skills')}
                                delay={200}
                                data={[
                                    { label: 'Priority Skills', value: skillGap?.priorityA?.length || 0 },
                                    { label: 'Top Focus', value: skillGap?.priorityA?.[0]?.skill || 'N/A' },
                                    { label: 'Learning Track', value: skillGap?.recommendedTrack || 'N/A' },
                                ]}
                            />

                            <SummaryCard
                                title="Action Roadmap"
                                subtitle="Your next 6-12 months"
                                icon={Rocket}
                                gradient="from-indigo-500 to-indigo-600"
                                onClick={() => setActiveSection('roadmap')}
                                delay={300}
                                data={[
                                    { label: 'Projects', value: roadmap?.projects?.length || 0 },
                                    { label: 'Next Project', value: roadmap?.projects?.[0]?.title || 'N/A' },
                                    { label: 'Internship Type', value: roadmap?.internship?.types?.[0] || 'N/A' },
                                ]}
                            />
                        </div>
                    </div>*/}

                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {/* AFTER 10TH - STEPPER BASED FLOW (Stream → Career Clusters) */}
                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {gradeLevel === 'after10' && (
                        <div className="mb-8">
                            {/* Stepper Header */}
                            <div className="flex justify-center mb-8">
                                <div className="flex items-center gap-4">
                                    {/* Step 1 */}
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${after10Step === 1 ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                                        onClick={() => setAfter10Step(1)}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${after10Step === 1
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : after10Step > 1
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {after10Step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                                        </div>
                                        <span className={`font-medium text-sm hidden sm:block ${after10Step === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                                            11th/12th Stream
                                        </span>
                                    </div>

                                    {/* Connector */}
                                    <div className={`w-16 h-1 rounded-full transition-all duration-500 ${after10Step > 1 ? 'bg-green-500' : 'bg-gray-200'}`} />

                                    {/* Step 2 */}
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${after10Step === 2 ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                                        onClick={() => after10Step > 1 && setAfter10Step(2)}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${after10Step === 2
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            2
                                        </div>
                                        <span className={`font-medium text-sm hidden sm:block ${after10Step === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                                            Career Paths
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 1: Stream Recommendation - Single Card with Purple/Track 3 Theme */}
                            {after10Step === 1 && (enhancedStreamRecommendation || streamRecommendation) && (enhancedStreamRecommendation?.recommendedStream || streamRecommendation?.recommendedStream) && (
                                (() => {
                                    const streamRec = enhancedStreamRecommendation || streamRecommendation;
                                    // Purple/Track 3 color config
                                    const purpleConfig = {
                                        bg: '#1e293b',
                                        accent: '#60a5fa',
                                        accentLight: '#bfdbfe',
                                        shadow: 'rgba(96, 165, 250, 0.3)'
                                    };
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="max-w-6xl mx-auto"
                                        >
                                            {/* Single Card Container - Purple/Track 3 Theme */}
                                            <div
                                                className="relative rounded-[10px] p-[1px]"
                                                style={{
                                                    background: `radial-gradient(circle 230px at 0% 0%, ${purpleConfig.accentLight}, #0c0d0d)`,
                                                    boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 15px 3px ${purpleConfig.shadow}`,
                                                }}
                                            >
                                                {/* Animated Dot - moves along the grid lines */}
                                                <div
                                                    className="absolute w-[6px] aspect-square rounded-full z-[3]"
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        boxShadow: `0 0 10px ${purpleConfig.accentLight}, 0 0 20px ${purpleConfig.accent}`,
                                                        animation: 'moveStreamDot 10s linear infinite',
                                                    }}
                                                />

                                                {/* Keyframes for stream card dot animation */}
                                                <style>{`
                                                    @keyframes moveStreamDot {
                                                        0%, 100% {
                                                            top: 2%;
                                                            right: 2%;
                                                        }
                                                        25% {
                                                            top: 2%;
                                                            right: calc(100% - 10px);
                                                        }
                                                        50% {
                                                            top: calc(100% - 10px);
                                                            right: calc(100% - 10px);
                                                        }
                                                        75% {
                                                            top: calc(100% - 10px);
                                                            right: 2%;
                                                        }
                                                    }
                                                `}</style>

                                                {/* Main Card Inner */}
                                                <div
                                                    className="relative w-full rounded-[9px] overflow-hidden"
                                                    style={{
                                                        background: `radial-gradient(circle 280px at 0% 0%, ${purpleConfig.accent}40, #0c0d0d)`,
                                                        backgroundSize: '20px 20px',
                                                    }}
                                                >
                                                    {/* Ray Light Effect */}
                                                    <div
                                                        className="absolute w-[220px] h-[45px] rounded-[100px] opacity-40 blur-[10px]"
                                                        style={{
                                                            backgroundColor: purpleConfig.accentLight,
                                                            boxShadow: `0 0 50px ${purpleConfig.accentLight}`,
                                                            transformOrigin: '10%',
                                                            top: '0%',
                                                            left: '0',
                                                            transform: 'rotate(40deg)'
                                                        }}
                                                    />

                                                    {/* Grid Lines - Vertical (at 2% from edges) */}
                                                    <div
                                                        className="absolute w-[1px] h-full"
                                                        style={{
                                                            left: '2%',
                                                            background: `linear-gradient(180deg, ${purpleConfig.accent}74 30%, #222424 70%)`
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute w-[1px] h-full"
                                                        style={{
                                                            right: '2%',
                                                            background: `linear-gradient(180deg, ${purpleConfig.accent}40 30%, #222424 70%)`
                                                        }}
                                                    />
                                                    {/* Grid Lines - Horizontal (at 2% from edges) */}
                                                    <div
                                                        className="absolute w-full h-[1px]"
                                                        style={{
                                                            top: '2%',
                                                            background: `linear-gradient(90deg, ${purpleConfig.accent}74 30%, #1d1f1f 70%)`
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute w-full h-[1px]"
                                                        style={{
                                                            bottom: '2%',
                                                            background: `linear-gradient(90deg, ${purpleConfig.accent}40 30%, #1d1f1f 70%)`
                                                        }}
                                                    />

                                                    {/* Content */}
                                                    <div className="relative z-[1] px-16 py-12">
                                                        {/* Header Section */}
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div
                                                                className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg"
                                                                style={{ backgroundColor: purpleConfig.accent }}
                                                            >
                                                                <GraduationCap className="w-7 h-7" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span
                                                                    className="inline-block px-3 py-1 text-white text-xs font-semibold rounded-full mb-1"
                                                                    style={{ backgroundColor: purpleConfig.accent }}
                                                                >
                                                                    RECOMMENDED STREAM
                                                                </span>
                                                                <h3 className="text-2xl sm:text-3xl font-bold text-white">{streamRec.recommendedStream || 'N/A'}</h3>
                                                            </div>
                                                            {/* Fit Badge */}
                                                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                                                                <ClipboardCheck className="w-5 h-5 text-blue-400" />
                                                                <span className={`text-base font-semibold ${streamRec.streamFit === 'High' ? 'text-green-400' : 'text-blue-300'}`}>
                                                                    {streamRec.streamFit || 'Medium'} Fit
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Two Column Layout for Main Content */}
                                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                            {/* Left Column - Why This Stream */}
                                                            {streamRec.reasoning && (
                                                                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                                                    <h5 className="text-xs font-bold uppercase mb-3 tracking-wider" style={{ color: purpleConfig.accentLight }}>
                                                                        WHY THIS STREAM
                                                                    </h5>
                                                                    <div className="space-y-2">
                                                                        {streamRec.reasoning.interests && (
                                                                            <p className="text-gray-300 text-sm">• {streamRec.reasoning.interests}</p>
                                                                        )}
                                                                        {streamRec.reasoning.aptitude && (
                                                                            <p className="text-gray-300 text-sm">• {streamRec.reasoning.aptitude}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Right Column - Subjects to Focus */}
                                                            {streamRec.subjectsToFocus && streamRec.subjectsToFocus.length > 0 && (
                                                                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                                                    <h5 className="text-xs font-bold uppercase mb-3 tracking-wider" style={{ color: purpleConfig.accentLight }}>
                                                                        SUBJECTS TO FOCUS
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {streamRec.subjectsToFocus.map((subject, idx) => (
                                                                            <span key={idx} className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm border border-white/20">
                                                                                {subject}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Alternative Stream Section */}
                                                        {streamRec.alternativeStream && (
                                                            <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-6">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <div
                                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
                                                                        style={{ backgroundColor: purpleConfig.accent }}
                                                                    >
                                                                        <span className="text-sm font-bold">ALT</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: purpleConfig.accentLight }}>Alternative Option</span>
                                                                        <h4 className="text-lg font-bold text-white">{streamRec.alternativeStream}</h4>
                                                                    </div>
                                                                </div>
                                                                {streamRec.alternativeReason && (
                                                                    <p className="text-gray-300 text-sm ml-13">{streamRec.alternativeReason}</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Career Paths & Entrance Exams - Two Column */}
                                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                            {/* Career Paths After 12th */}
                                                            {streamRec.careerPathsAfter12 && streamRec.careerPathsAfter12.length > 0 && (
                                                                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                                                    <h5 className="text-xs font-bold uppercase mb-3 tracking-wider flex items-center gap-2" style={{ color: purpleConfig.accentLight }}>
                                                                        <TrendingUp className="w-4 h-4" />
                                                                        Career Paths After 12th
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {streamRec.careerPathsAfter12.map((career, idx) => (
                                                                            <span key={idx} className="px-3 py-1.5 bg-white/10 text-gray-200 rounded-lg text-sm border border-white/10">
                                                                                {career}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Entrance Exams */}
                                                            {streamRec.entranceExams && streamRec.entranceExams.length > 0 && (
                                                                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                                                    <h5 className="text-xs font-bold uppercase mb-3 tracking-wider flex items-center gap-2" style={{ color: purpleConfig.accentLight }}>
                                                                        <Target className="w-4 h-4" />
                                                                        Entrance Exams to Prepare
                                                                    </h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {streamRec.entranceExams.map((exam, idx) => (
                                                                            <span key={idx} className="px-3 py-1.5 bg-white/10 text-gray-200 rounded-lg text-sm border border-white/10 font-medium">
                                                                                {exam}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Next Button - Dark theme with hover effect like back card */}
                                                        <div className="flex justify-center pt-4">
                                                            <motion.button
                                                                onClick={() => setAfter10Step(2)}
                                                                className="group flex items-center gap-3 px-4 py-2 text-white font-semibold rounded-xl transition-all duration-300"
                                                                style={{
                                                                    backgroundColor: '#333333',
                                                                    border: '1px solid #4a4a4a',
                                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                                                }}
                                                                whileHover={{
                                                                    backgroundColor: '#ffffff',
                                                                    color: '#000000',
                                                                    scale: 1.05,
                                                                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                                                                }}
                                                                whileTap={{ scale: 0.95 }}
                                                            >
                                                                <span>View Career Clusters</span>
                                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })()
                            )}

                            {/* Step 1 Fallback - No stream data */}
                            {after10Step === 1 && !(enhancedStreamRecommendation?.recommendedStream || streamRecommendation?.recommendedStream) && (
                                <div className="bg-slate-900 rounded-xl p-8 text-center border border-slate-700">
                                    <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Stream Recommendation Loading...</h3>
                                    <p className="text-slate-400 text-sm">Your personalized 11th/12th stream recommendation is being calculated.</p>
                                </div>
                            )}

                            {/* Step 2: Career Clusters */}
                            {after10Step === 2 && (
                                <div className="space-y-8">
                                    {/* Back Button & Header */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="flex items-center gap-4 mb-6"
                                    >
                                        <button
                                            onClick={() => setAfter10Step(1)}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            <span className="text-sm">Back to Stream</span>
                                        </button>
                                    </motion.div>

                                    {/* Section Header */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="text-center mb-8"
                                    >
                                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                            Career Paths for {(enhancedStreamRecommendation || streamRecommendation)?.recommendedStream || 'Your Stream'}
                                        </h2>
                                        <p className="text-gray-400">
                                            Explore career clusters aligned with your recommended stream
                                        </p>
                                    </motion.div>

                                    {/* Career Cards */}
                                    {careerFit && careerFit.clusters && careerFit.clusters.length > 0 ? (
                                        careerFit.clusters.map((cluster, index) => (
                                            <CareerCard
                                                key={index}
                                                cluster={cluster}
                                                index={index}
                                                fitType={index === 0 ? 'TRACK 1' : index === 1 ? 'TRACK 2' : 'TRACK 3'}
                                                color={index === 0 ? 'green' : index === 1 ? 'yellow' : 'purple'}
                                                reverse={index === 1}
                                                specificRoles={careerFit?.specificOptions?.[
                                                    index === 0 ? 'highFit' :
                                                        index === 1 ? 'mediumFit' :
                                                            'exploreLater'
                                                ] || cluster.specificRoles || []}
                                                onCardClick={handleTrackClick}
                                            />
                                        ))
                                    ) : (
                                        <div className="bg-slate-900 rounded-xl p-8 text-center border border-slate-700">
                                            <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-white mb-2">Career Recommendations Loading...</h3>
                                            <p className="text-slate-400 text-sm">Your personalized career recommendations are being calculated.</p>
                                        </div>
                                    )}

                                    {/* Career Track Detail Modal */}
                                    {selectedTrack && (
                                        <CareerTrackModal
                                            selectedTrack={selectedTrack}
                                            onClose={closeTrackModal}
                                            skillGap={skillGap}
                                            roadmap={roadmap}
                                            results={results}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {/* AFTER 12TH - STEPPER BASED (matching After 10th design) */}
                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {gradeLevel === 'after12' && (
                        <div className="mb-8">
                            {/* Stepper Header */}
                            <div className="flex justify-center mb-8">
                                <div className="flex items-center gap-4">
                                    {/* Step 1 - Recommended Programs */}
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${activeRecommendationTab === 'primary' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                                        onClick={() => setActiveRecommendationTab('primary')}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${activeRecommendationTab === 'primary'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : activeRecommendationTab === 'career'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {activeRecommendationTab === 'career' ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                                        </div>
                                        <span className={`font-medium text-sm hidden sm:block ${activeRecommendationTab === 'primary' ? 'text-blue-600' : 'text-gray-500'}`}>
                                            Recommended Programs
                                        </span>
                                    </div>

                                    {/* Connector */}
                                    <div className={`w-16 h-1 rounded-full transition-all duration-500 ${activeRecommendationTab === 'career' ? 'bg-green-500' : 'bg-gray-200'}`} />

                                    {/* Step 2 - Career Recommendations */}
                                    <div
                                        className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${activeRecommendationTab === 'career' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                                        onClick={() => setActiveRecommendationTab('career')}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${activeRecommendationTab === 'career'
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            2
                                        </div>
                                        <span className={`font-medium text-sm hidden sm:block ${activeRecommendationTab === 'career' ? 'text-blue-600' : 'text-gray-500'}`}>
                                            Career Recommendations
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* PRIMARY TAB CONTENT */}
                            {activeRecommendationTab === 'primary' && (
                                <>
                                    {/* After 12th: Course Recommendations - Dark Theme matching After 10 */}
                                    {shouldShowProgramRecommendations && (
                                        <div>
                                            {/* Check if we have AI-generated programs from Gemini */}
                                            {(() => {
                                                // Check both nested (gemini_results.careerFit) and flattened (careerFit) structures
                                                const degreePrograms = results?.gemini_results?.careerFit?.degreePrograms || results?.careerFit?.degreePrograms;
                                                const hasAIPrograms = degreePrograms && degreePrograms.length >= 3;
                                                
                                                // DEBUG: Log first program to check for new fields
                                                if (degreePrograms && degreePrograms.length > 0) {
                                                    console.log('🎓 DEGREE PROGRAM DEBUG - First Program:', degreePrograms[0]);
                                                    console.log('📊 Field Check:', {
                                                        programName: degreePrograms[0].programName,
                                                        duration: degreePrograms[0].duration || '❌ MISSING',
                                                        roleDescription: degreePrograms[0].roleDescription ? '✅ Present' : '❌ MISSING',
                                                        topUniversities: degreePrograms[0].topUniversities ? `✅ ${degreePrograms[0].topUniversities.length} universities` : '❌ MISSING'
                                                    });
                                                }
                                                
                                                console.log('🔍 After12 Layout Check:', {
                                                    hasGeminiResults: !!results?.gemini_results,
                                                    hasCareerFit: !!(results?.gemini_results?.careerFit || results?.careerFit),
                                                    hasDegreePrograms: !!degreePrograms,
                                                    programCount: degreePrograms?.length || 0,
                                                    willShowNewLayout: hasAIPrograms,
                                                    willShowFallback: !hasAIPrograms && enhancedCourseRecommendations?.length > 0,
                                                    dataSource: results?.gemini_results?.careerFit ? 'nested' : results?.careerFit ? 'flattened' : 'none',
                                                    careerFitKeys: results?.careerFit ? Object.keys(results.careerFit) : 'no careerFit',
                                                    firstProgramSample: degreePrograms?.[0] ? {
                                                        programName: degreePrograms[0].programName,
                                                        hasDuration: !!degreePrograms[0].duration,
                                                        hasRoleDescription: !!degreePrograms[0].roleDescription,
                                                        hasTopUniversities: !!degreePrograms[0].topUniversities,
                                                        duration: degreePrograms[0].duration,
                                                        universitiesCount: degreePrograms[0].topUniversities?.length || 0
                                                    } : 'no programs'
                                                });
                                                
                                                // DETAILED DEBUG - Show what's actually in careerFit
                                                if (results?.careerFit && !degreePrograms) {
                                                    console.log('⚠️ careerFit exists but NO degreePrograms!');
                                                    console.log('   careerFit.clusters:', results.careerFit.clusters?.length || 0, 'items');
                                                    console.log('   careerFit.specificOptions:', results.careerFit.specificOptions);
                                                    console.log('   careerFit.degreePrograms:', results.careerFit.degreePrograms);
                                                    console.log('   👉 You need to run: fix-career-fit-degree-programs.sql');
                                                }
                                                
                                                return hasAIPrograms;
                                            })() ? (
                                                // NEW LAYOUT: Single Card with 3 AI Programs (After10 Style)
                                                (() => {
                                                    // Get degreePrograms from either nested or flattened structure
                                                    const degreePrograms = results?.gemini_results?.careerFit?.degreePrograms || results?.careerFit?.degreePrograms;
                                                    const aiPrograms = degreePrograms.slice(0, 3);
                                                    // Purple/Track 3 color config
                                                    const purpleConfig = {
                                                        bg: '#1e293b',
                                                        accent: '#60a5fa',
                                                        accentLight: '#bfdbfe',
                                                        shadow: 'rgba(96, 165, 250, 0.3)'
                                                    };
                                                    return (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 50 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                                            className="max-w-6xl mx-auto"
                                                        >
                                                            {/* Single Card Container - Purple/Track 3 Theme */}
                                                            <div
                                                                className="relative rounded-[10px] p-[1px]"
                                                                style={{
                                                                    background: `radial-gradient(circle 230px at 0% 0%, ${purpleConfig.accentLight}, #0c0d0d)`,
                                                                    boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 15px 3px ${purpleConfig.shadow}`,
                                                                }}
                                                            >
                                                                {/* Animated Dot */}
                                                                <div
                                                                    className="absolute w-[6px] aspect-square rounded-full z-[3]"
                                                                    style={{
                                                                        backgroundColor: '#fff',
                                                                        boxShadow: `0 0 10px ${purpleConfig.accentLight}, 0 0 20px ${purpleConfig.accent}`,
                                                                        animation: 'moveProgramDot 10s linear infinite',
                                                                    }}
                                                                />

                                                                {/* Keyframes for program card dot animation */}
                                                                <style>{`
                                                                    @keyframes moveProgramDot {
                                                                        0%, 100% {
                                                                            top: 2%;
                                                                            right: 2%;
                                                                        }
                                                                        25% {
                                                                            top: 2%;
                                                                            right: calc(100% - 10px);
                                                                        }
                                                                        50% {
                                                                            top: calc(100% - 10px);
                                                                            right: calc(100% - 10px);
                                                                        }
                                                                        75% {
                                                                            top: calc(100% - 10px);
                                                                            right: 2%;
                                                                        }
                                                                    }
                                                                `}</style>

                                                                {/* Main Card Inner */}
                                                                <div
                                                                    className="relative w-full rounded-[9px] overflow-hidden"
                                                                    style={{
                                                                        background: `radial-gradient(circle 280px at 0% 0%, ${purpleConfig.accent}40, #0c0d0d)`,
                                                                        backgroundSize: '20px 20px',
                                                                    }}
                                                                >
                                                                    {/* Ray Light Effect */}
                                                                    <div
                                                                        className="absolute w-[220px] h-[45px] rounded-[100px] opacity-40 blur-[10px]"
                                                                        style={{
                                                                            backgroundColor: purpleConfig.accentLight,
                                                                            boxShadow: `0 0 50px ${purpleConfig.accentLight}`,
                                                                            transformOrigin: '10%',
                                                                            top: '0%',
                                                                            left: '0',
                                                                            transform: 'rotate(40deg)'
                                                                        }}
                                                                    />

                                                                    {/* Grid Lines */}
                                                                    <div className="absolute w-[1px] h-full" style={{ left: '2%', background: `linear-gradient(180deg, ${purpleConfig.accent}74 30%, #222424 70%)` }} />
                                                                    <div className="absolute w-[1px] h-full" style={{ right: '2%', background: `linear-gradient(180deg, ${purpleConfig.accent}40 30%, #222424 70%)` }} />
                                                                    <div className="absolute w-full h-[1px]" style={{ top: '2%', background: `linear-gradient(90deg, ${purpleConfig.accent}74 30%, #1d1f1f 70%)` }} />
                                                                    <div className="absolute w-full h-[1px]" style={{ bottom: '2%', background: `linear-gradient(90deg, ${purpleConfig.accent}40 30%, #1d1f1f 70%)` }} />

                                                                    {/* Content */}
                                                                    <div className="relative z-[1] px-16 py-12">
                                                                        {/* Header Section */}
                                                                        <div className="flex items-center gap-4 mb-8">
                                                                            <div
                                                                                className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg"
                                                                                style={{ backgroundColor: purpleConfig.accent }}
                                                                            >
                                                                                <GraduationCap className="w-7 h-7" />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <span
                                                                                    className="inline-block px-3 py-1 text-white text-xs font-semibold rounded-full mb-1"
                                                                                    style={{ backgroundColor: purpleConfig.accent }}
                                                                                >
                                                                                    RECOMMENDED DEGREE PROGRAMS
                                                                                </span>
                                                                                <h3 className="text-2xl sm:text-3xl font-bold text-white">Your Best-Fit Programs</h3>
                                                                            </div>
                                                                        </div>

                                                                        {/* 3 Program Cards */}
                                                                        <div className="space-y-6 mb-8">
                                                                            {aiPrograms.map((program, index) => (
                                                                                <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                                                                                    {/* Program Header */}
                                                                                    <div className="flex items-start justify-between mb-4">
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                                <div
                                                                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg ${
                                                                                                        index === 0 ? 'bg-green-500' :
                                                                                                        index === 1 ? 'bg-yellow-500' :
                                                                                                        'bg-purple-500'
                                                                                                    }`}
                                                                                                >
                                                                                                    #{index + 1}
                                                                                                </div>
                                                                                                <div>
                                                                                                    <h4 className="text-xl font-bold text-white">{program.programName}</h4>
                                                                                                    {/* Duration and Aligned Cluster on same line */}
                                                                                                    {program.duration && (
                                                                                                        <div className="flex items-center gap-2 mt-1">
                                                                                                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
                                                                                                                {program.duration}
                                                                                                            </span>
                                                                                                            {program.alignedWithCluster && (
                                                                                                                <span className="text-xs text-gray-400">
                                                                                                                    • Aligned with: <span className="text-blue-300">{program.alignedWithCluster}</span>
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {!program.duration && program.alignedWithCluster && (
                                                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                                                            Aligned with: <span className="text-blue-300">{program.alignedWithCluster}</span>
                                                                                                        </p>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        {/* Match Score Badge */}
                                                                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                                                                                            <ClipboardCheck className="w-5 h-5 text-blue-400" />
                                                                                            <span className={`text-base font-semibold ${
                                                                                                program.matchScore >= 85 ? 'text-green-400' : 
                                                                                                program.matchScore >= 75 ? 'text-blue-300' : 
                                                                                                'text-purple-300'
                                                                                            }`}>
                                                                                                {program.matchScore}% Match
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Why This Fits You */}
                                                                                    {program.whyThisFitsYou && (
                                                                                        <div className="mb-4">
                                                                                            <h5 className="text-xs font-bold uppercase mb-2 tracking-wider" style={{ color: purpleConfig.accentLight }}>
                                                                                                WHY THIS FITS YOU
                                                                                            </h5>
                                                                                            <p className="text-gray-300 text-sm leading-relaxed">{program.whyThisFitsYou}</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Role Description */}
                                                                                    {program.roleDescription && (
                                                                                        <div className="mb-4 bg-white/5 rounded-lg p-4 border border-white/10">
                                                                                            <h5 className="text-xs font-bold uppercase mb-2 tracking-wider flex items-center gap-2" style={{ color: purpleConfig.accentLight }}>
                                                                                                <Briefcase className="w-3.5 h-3.5" />
                                                                                                WHAT YOU'LL DO
                                                                                            </h5>
                                                                                            <p className="text-gray-300 text-sm leading-relaxed">{program.roleDescription}</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Top Universities */}
                                                                                    {program.topUniversities && program.topUniversities.length > 0 && (
                                                                                        <div className="mb-4">
                                                                                            <h5 className="text-xs font-bold uppercase mb-3 tracking-wider flex items-center gap-2" style={{ color: purpleConfig.accentLight }}>
                                                                                                <GraduationCap className="w-3.5 h-3.5" />
                                                                                                TOP UNIVERSITIES
                                                                                            </h5>
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {program.topUniversities.slice(0, 5).map((university, idx) => (
                                                                                                    <span key={idx} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs border border-white/20 hover:bg-white/15 transition-colors">
                                                                                                        {university}
                                                                                                    </span>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Evidence Summary (Compact) */}
                                                                                    {program.evidence && (
                                                                                        <div className="grid md:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                                                                                            {program.evidence.interest && (
                                                                                                <div className="text-xs">
                                                                                                    <span className="font-semibold text-blue-300">Interest:</span>
                                                                                                    <span className="text-gray-400 ml-1">{program.evidence.interest.substring(0, 80)}...</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {program.evidence.aptitude && (
                                                                                                <div className="text-xs">
                                                                                                    <span className="font-semibold text-green-300">Aptitude:</span>
                                                                                                    <span className="text-gray-400 ml-1">{program.evidence.aptitude.substring(0, 80)}...</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* View Career Clusters Button */}
                                                                        <div className="flex justify-center pt-4">
                                                                            <motion.button
                                                                                onClick={() => setActiveRecommendationTab('career')}
                                                                                className="group flex items-center gap-3 px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300"
                                                                                style={{
                                                                                    backgroundColor: '#333333',
                                                                                    border: '1px solid #4a4a4a',
                                                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                                                                }}
                                                                                whileHover={{ 
                                                                                    backgroundColor: '#ffffff',
                                                                                    color: '#000000',
                                                                                    scale: 1.05,
                                                                                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                                                                                }}
                                                                                whileTap={{ scale: 0.95 }}
                                                                            >
                                                                                <span>View Career Clusters</span>
                                                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                                            </motion.button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })()
                                            ) : enhancedCourseRecommendations && enhancedCourseRecommendations.length > 0 ? (
                                                // FALLBACK: Old grid layout if AI programs not available
                                                <div>
                                                    {/* Header Section - Dark Theme */}
                                                    <div className="bg-slate-800 rounded-xl p-6 mb-6 shadow-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center shadow-lg">
                                                                <GraduationCap className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-bold text-white">Top 3 Recommended Programs</h2>
                                                                <p className="text-slate-300 text-sm">Based on your assessment results and profile</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Cards Grid - Dark Theme */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {enhancedCourseRecommendations.slice(0, 3).map((course, index) => {
                                                    // Get career paths from COURSE_KNOWLEDGE_BASE (fallback)
                                                    const courseProfile = COURSE_KNOWLEDGE_BASE[course.courseId];
                                                    const fallbackCareerPaths = courseProfile?.careerPaths || [];

                                                    const handleProgramClick = async () => {
                                                        setAiCareerPathsLoading(true);

                                                        try {
                                                            // Prepare student profile for AI
                                                            const studentProfile = {
                                                                riasecScores: results?.riasec?.scores || {},
                                                                aptitudeScores: results?.aptitude?.scores ? {
                                                                    verbal: results.aptitude.scores.verbal?.percentage,
                                                                    numerical: results.aptitude.scores.numerical?.percentage,
                                                                    abstract: results.aptitude.scores.abstract?.percentage,
                                                                    spatial: results.aptitude.scores.spatial?.percentage,
                                                                    clerical: results.aptitude.scores.clerical?.percentage
                                                                } : undefined,
                                                                topSkills: results?.aptitude?.topStrengths || [],
                                                                interests: results?.riasec?.topThree?.map(code => {
                                                                    const names = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
                                                                    return names[code];
                                                                }) || [],
                                                                projects: studentAcademicData?.projects || [],
                                                                experiences: studentAcademicData?.experiences || []
                                                            };

                                                            // Fetch AI-generated career paths with fallback
                                                            const aiCareerPaths = await generateProgramCareerPathsWithFallback(
                                                                {
                                                                    programName: course.courseName,
                                                                    programCategory: course.category,
                                                                    programStream: courseProfile?.stream || 'general',
                                                                    studentProfile
                                                                },
                                                                fallbackCareerPaths
                                                            );

                                                            // Open modal with AI-generated career paths
                                                            setSelectedTrack({
                                                                cluster: {
                                                                    title: course.courseName,
                                                                    matchScore: course.matchScore,
                                                                    description: course.description
                                                                },
                                                                index: index,
                                                                fitType: index === 0 ? 'TOP RECOMMENDATION' : `OPTION ${index + 1}`,
                                                                specificRoles: aiCareerPaths,
                                                                isProgramBased: true,
                                                                programDetails: {
                                                                    category: course.category,
                                                                    stream: courseProfile?.stream,
                                                                    reasons: course.reasons
                                                                }
                                                            });
                                                        } catch (error) {
                                                            // Silently fallback to hardcoded paths - this is expected when Worker is not deployed
                                                            console.log('[PROGRAM_CLICK] Using fallback career paths');
                                                            // Fallback to hardcoded paths on error
                                                            setSelectedTrack({
                                                                cluster: {
                                                                    title: course.courseName,
                                                                    matchScore: course.matchScore,
                                                                    description: course.description
                                                                },
                                                                index: index,
                                                                fitType: index === 0 ? 'TOP RECOMMENDATION' : `OPTION ${index + 1}`,
                                                                specificRoles: fallbackCareerPaths,
                                                                isProgramBased: true,
                                                                programDetails: {
                                                                    category: course.category,
                                                                    stream: courseProfile?.stream,
                                                                    reasons: course.reasons
                                                                }
                                                            });
                                                        } finally {
                                                            setAiCareerPathsLoading(false);
                                                        }
                                                    };

                                                    return (
                                                        <div
                                                            key={course.courseId}
                                                            onClick={handleProgramClick}
                                                            className={`relative bg-slate-800 rounded-xl border p-5 transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer ${index === 0 ? 'border-slate-600 shadow-lg shadow-slate-900/50' : 'border-slate-700'
                                                                } ${aiCareerPathsLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                                        >
                                                            {/* Rank Badge */}
                                                            <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${index === 0 ? 'bg-slate-600' :
                                                                index === 1 ? 'bg-slate-700' :
                                                                    'bg-slate-700'
                                                                }`}>
                                                                #{index + 1}
                                                            </div>

                                                            {/* Top Pick Badge */}
                                                            {index === 0 && (
                                                                <div className="flex items-center gap-1 text-blue-400 text-xs font-semibold mb-2">
                                                                    <ClipboardCheck className="w-3 h-3" />
                                                                    TOP RECOMMENDATION
                                                                </div>
                                                            )}

                                                            {/* Course Name */}
                                                            <h3 className="font-semibold text-white text-lg mb-2 pr-8">{course.courseName}</h3>

                                                            {/* Category Badge */}
                                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${course.category === 'Science' ? 'bg-slate-700 text-slate-200' :
                                                                course.category === 'Commerce' ? 'bg-slate-700 text-slate-200' :
                                                                    'bg-slate-700 text-slate-200'
                                                                }`}>
                                                                {course.category}
                                                            </span>

                                                            {/* Match Score */}
                                                            <div className="mb-3">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm text-slate-400">Match Score</span>
                                                                    <span className={`font-bold ${course.matchScore >= 80 ? 'text-green-400' :
                                                                        course.matchScore >= 65 ? 'text-blue-400' :
                                                                            'text-slate-300'
                                                                        }`}>
                                                                        {course.matchScore}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${course.matchScore >= 80 ? 'bg-green-500' :
                                                                            course.matchScore >= 65 ? 'bg-blue-500' :
                                                                                'bg-slate-500'
                                                                            }`}
                                                                        style={{ width: `${course.matchScore}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Reasons */}
                                                            {course.reasons && course.reasons.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-slate-700">
                                                                    <p className="text-xs font-medium text-slate-400 mb-2">Why this fits you:</p>
                                                                    <ul className="space-y-1">
                                                                        {course.reasons.slice(0, 3).map((reason, idx) => (
                                                                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                                                                                <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                                                                {reason}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            {/* View Careers CTA */}
                                                            {fallbackCareerPaths.length > 0 && (
                                                                <div className="mt-4 pt-4 border-t border-slate-700">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="text-slate-400">Click to view career tracks</span>
                                                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Guidance Note - Dark Theme */}
                                            <div className="mt-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
                                                <div className="flex gap-3">
                                                    <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <div className="text-sm text-slate-300">
                                                        <p className="font-semibold mb-1 text-white">Next Steps</p>
                                                        <p>Research these programs at universities you're interested in. Consider factors like curriculum, faculty expertise, placement records, location, and your personal preferences.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                            ) : null}
                                        </div>
                                    )}

                                </>
                            )}

                            {/* CAREER TAB CONTENT */}
                            {activeRecommendationTab === 'career' && careerFit && careerFit.clusters && careerFit.clusters.length > 0 && (
                                <div className="space-y-8">
                                    {/* Career Recommendations using CareerCard components */}
                                    {careerFit.clusters.map((cluster, index) => (
                                        <CareerCard
                                            key={index}
                                            cluster={cluster}
                                            index={index}
                                            fitType={index === 0 ? 'TRACK 1' : index === 1 ? 'TRACK 2' : 'TRACK 3'}
                                            color={index === 0 ? 'green' : index === 1 ? 'yellow' : 'purple'}
                                            reverse={index === 1}
                                            specificRoles={careerFit?.specificOptions?.[
                                                index === 0 ? 'highFit' :
                                                    index === 1 ? 'mediumFit' :
                                                        'exploreLater'
                                            ] || cluster.specificRoles || []}
                                            onCardClick={handleTrackClick}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Fallback for Career tab when no career data */}
                            {activeRecommendationTab === 'career' && (!careerFit || !careerFit.clusters || careerFit.clusters.length === 0) && (
                                <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
                                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-white mb-2">Career Recommendations Loading...</h3>
                                    <p className="text-slate-300 text-sm">Your personalized career recommendations are being calculated based on your assessment results.</p>
                                </div>
                            )}

                            {/* Career Track Detail Modal - Multi-Step Wizard */}
                            {selectedTrack && (
                                <CareerTrackModal
                                    selectedTrack={selectedTrack}
                                    onClose={closeTrackModal}
                                    skillGap={skillGap}
                                    roadmap={roadmap}
                                    results={results}
                                />
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {/* CAREER RECOMMENDATIONS - For all other grade levels (middle, high school, etc.) */}
                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {gradeLevel !== 'after10' && gradeLevel !== 'after12' && careerFit && careerFit.clusters && careerFit.clusters.length > 0 && (
                        <div className="mb-8">
                            <div className="space-y-8">
                                {/* Career Recommendations using CareerCard components with original colorful design */}
                                {careerFit.clusters.map((cluster, index) => (
                                    <CareerCard
                                        key={index}
                                        cluster={cluster}
                                        index={index}
                                        fitType={index === 0 ? 'TRACK 1' : index === 1 ? 'TRACK 2' : 'TRACK 3'}
                                        color={index === 0 ? 'green' : index === 1 ? 'yellow' : 'purple'}
                                        reverse={index === 1}
                                        specificRoles={careerFit?.specificOptions?.[
                                            index === 0 ? 'highFit' :
                                                index === 1 ? 'mediumFit' :
                                                    'exploreLater'
                                        ] || cluster.specificRoles || []}
                                        onCardClick={handleTrackClick}
                                    />
                                ))}
                            </div>

                            {/* Career Track Detail Modal */}
                            {selectedTrack && (
                                <CareerTrackModal
                                    selectedTrack={selectedTrack}
                                    onClose={closeTrackModal}
                                    skillGap={skillGap}
                                    roadmap={roadmap}
                                    results={results}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Section Detail Dialogs */}
                <Dialog open={!!activeSection} onOpenChange={() => setActiveSection(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {activeSection === 'profile' && "Detailed Profile Analysis"}
                                {activeSection === 'career' && "Career Path Recommendations"}
                                {activeSection === 'skills' && "Skills & Development"}
                                {activeSection === 'roadmap' && "Your Action Plan"}
                            </DialogTitle>
                        </DialogHeader>

                        {activeSection === 'profile' && <ProfileSection results={results} />}
                        {activeSection === 'career' && <CareerSection results={results} />}
                        {activeSection === 'skills' && <SkillsSection results={results} />}
                        {activeSection === 'roadmap' && <RoadmapSection results={results} />}
                    </DialogContent>
                </Dialog>
            </div>

        </>
    );
};

export default AssessmentResult;