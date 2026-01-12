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
    Star,
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
    RoadmapSection
} from './components';

// Import Career Track Modal
import CareerTrackModal from './components/CareerTrackModal';

// Import UI effects
import { TextGenerateEffect } from '../../../components/ui/text-generate-effect';

// Import constants and hooks
import { RIASEC_NAMES, RIASEC_COLORS, TRAIT_NAMES, TRAIT_COLORS, PRINT_STYLES } from './constants';
import { useAssessmentResults } from './hooks/useAssessmentResults';

// Import course matching engine
import { calculateCourseMatchScores, DEGREE_PROGRAMS } from './utils/courseMatchingEngine';

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
                                    <div className="relative z-[1] px-8 py-4">
                                        {/* Header with number badge and title */}
                                        <div className="flex items-center gap-3 mb-4">
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

                                        {/* Description */}
                                        <p className="text-gray-300 mb-4 leading-relaxed text-sm">{cluster.description}</p>

                                        {/* Why It Fits / What You'll Do */}
                                        {(cluster.whyItFits || cluster.whatYoullDo) && (
                                            <div
                                                className="rounded-lg p-3 border"
                                                style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    borderColor: config.accent
                                                }}
                                            >
                                                <h5
                                                    className="text-xs font-bold uppercase mb-2"
                                                    style={{ color: config.accentLight }}
                                                >
                                                    {cluster.whyItFits ? 'Why It Fits You' : 'What You\'ll Do'}
                                                </h5>
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                    {cluster.whyItFits || cluster.whatYoullDo}
                                                </p>
                                            </div>
                                        )}

                                        {/* Specific Roles with Salary */}
                                        {specificRoles && specificRoles.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <h5
                                                    className="text-xs font-bold uppercase mb-2"
                                                    style={{ color: config.accentLight }}
                                                >
                                                    Top Roles & Salary
                                                </h5>
                                                <div className="space-y-1">
                                                    {specificRoles.slice(0, 3).map((role, idx) => {
                                                        const name = getRoleName(role);
                                                        const salary = formatSalary(role);
                                                        return (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-300">{name}</span>
                                                                {salary && (
                                                                    <span className="text-green-400 font-medium">{salary}</span>
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
                                            Click to view the complete career roadmap, required skills, and growth opportunities
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
        handleRetry,
        validateResults,
        navigate
    } = useAssessmentResults();

    // Determine if we should show program recommendations
    // Only show for: After 10 with 6+ months, After 12, College
    // DON'T show for: Grade 6-10 (middle, highschool), After 10 with < 6 months
    const shouldShowProgramRecommendations = useMemo(() => {
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
        if (gradeLevel === 'after12' || gradeLevel === 'college') {
            return true;
        }
        return false;
    }, [gradeLevel, monthsInGrade]);

    // Calculate enhanced course recommendations with accurate match scores
    // Only calculate for grade levels that should show recommendations
    const enhancedCourseRecommendations = useMemo(() => {
        // Don't calculate for middle school or high school
        if (gradeLevel === 'middle' || gradeLevel === 'highschool') {
            return [];
        }
        
        // Don't calculate for after10 with < 6 months
        if (gradeLevel === 'after10' && (monthsInGrade === null || monthsInGrade < 6)) {
            return [];
        }
        
        // For after12, college, and after10 with 6+ months - use DEGREE_PROGRAMS
        if (gradeLevel === 'after12' || gradeLevel === 'college' || 
            (gradeLevel === 'after10' && monthsInGrade !== null && monthsInGrade >= 6)) {
            // Use degree programs from knowledge base for proper scoring
            return calculateCourseMatchScores(
                DEGREE_PROGRAMS,
                results?.riasec?.scores || {},
                studentAcademicData
            );
        }
        
        return [];
    }, [gradeLevel, monthsInGrade, results, studentAcademicData]);

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
            />

            {/* Web View - Rich UI for screen */}
            <div className="web-view min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pt-14 pb-8 px-4">
                {/* Floating Action Bar */}
                <div
                    className={`fixed top-0 left-0 right-0 z-50 w-full transition-transform duration-300 ${
                        isNavbarVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
                >
                    <div className="relative flex justify-between items-center bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 px-6 py-2">
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

                {/* Report Container */}
                <div className="max-w-6xl mx-auto print:max-w-none print-container">
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
                    {/* RECOMMENDATION TOGGLE SECTION - For After 10th and After 12th students */}
                    {/* ═══════════════════════════════════════════════════════════════════════════════ */}
                    {(gradeLevel === 'after10' || gradeLevel === 'after12') && (
                        <div className="mb-8">
                            {/* Toggle Buttons */}
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex bg-gray-100 rounded-xl p-1 shadow-inner">
                                    <button
                                        onClick={() => setActiveRecommendationTab('primary')}
                                        className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                                            activeRecommendationTab === 'primary'
                                                ? 'bg-white text-indigo-600 shadow-md'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        {gradeLevel === 'after10' ? (
                                            <span className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                11th/12th Stream
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                Recommended Programs
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveRecommendationTab('career')}
                                        className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                                            activeRecommendationTab === 'career'
                                                ? 'bg-white text-indigo-600 shadow-md'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Career Recommendations
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* PRIMARY TAB CONTENT */}
                            {activeRecommendationTab === 'primary' && (
                                <>
                                    {/* After 10th: Stream Recommendation */}
                                    {gradeLevel === 'after10' && (enhancedStreamRecommendation || streamRecommendation) && (enhancedStreamRecommendation?.recommendedStream || streamRecommendation?.recommendedStream) && (
                                        (() => {
                                            const streamRec = enhancedStreamRecommendation || streamRecommendation;
                                            return (
                                                <div className="relative w-full rounded-xl overflow-hidden bg-white shadow-lg">
                                                    {/* Header with slate background matching assessment result style */}
                                                    <div className="relative px-6 md:px-8 py-6 bg-gradient-to-r from-slate-800 to-slate-700">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                                                                <GraduationCap className="w-7 h-7 text-white" />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                                                                    Your Recommended 11th/12th Stream
                                                                </h2>
                                                                <p className="text-slate-300 text-sm">Based on your marks, projects, experiences, and interests</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="px-6 md:px-8 py-8">
                                                        {/* Main Recommendation Card */}
                                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                                                                        <Star className="w-6 h-6 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-slate-600 font-medium">Best Match for You</p>
                                                                        <h3 className="text-2xl font-bold text-slate-800">{streamRec.recommendedStream || 'N/A'}</h3>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm text-slate-500">Confidence</p>
                                                                    <p className={`text-lg font-bold ${streamRec.streamFit === 'High' ? 'text-slate-800' : 'text-slate-700'}`}>
                                                                        {streamRec.streamFit || 'Medium'} Fit
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Reasoning */}
                                                            {streamRec.reasoning && (
                                                                <div className="space-y-3 mb-4">
                                                                    {streamRec.reasoning.interests && (
                                                                        <div className="flex gap-2">
                                                                            <span className="text-slate-700 font-medium text-sm min-w-[80px]">Interests:</span>
                                                                            <span className="text-slate-600 text-sm">{streamRec.reasoning.interests}</span>
                                                                        </div>
                                                                    )}
                                                                    {streamRec.reasoning.aptitude && (
                                                                        <div className="flex gap-2">
                                                                            <span className="text-slate-700 font-medium text-sm min-w-[80px]">Aptitude:</span>
                                                                            <span className="text-slate-600 text-sm">{streamRec.reasoning.aptitude}</span>
                                                                        </div>
                                                                    )}
                                                                    {streamRec.reasoning.personality && (
                                                                        <div className="flex gap-2">
                                                                            <span className="text-slate-700 font-medium text-sm min-w-[80px]">Activities:</span>
                                                                            <span className="text-slate-600 text-sm">{streamRec.reasoning.personality}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Subjects to Focus */}
                                                            {streamRec.subjectsToFocus && streamRec.subjectsToFocus.length > 0 && (
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-700 mb-2">Subjects to Focus On:</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {streamRec.subjectsToFocus.map((subject, idx) => (
                                                                            <span key={idx} className="px-3 py-1 bg-white text-slate-700 rounded-full text-sm font-medium border border-slate-300">
                                                                                {subject}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Alternative Stream */}
                                                        {streamRec.alternativeStream && (
                                                            <div className="mb-6">
                                                                <h4 className="text-lg font-semibold text-slate-800 mb-3">Alternative Option to Consider</h4>
                                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className="font-semibold text-slate-800">{streamRec.alternativeStream}</h5>
                                                                        <span className="text-sm px-2 py-1 rounded-full bg-slate-200 text-slate-700">Good Fit</span>
                                                                    </div>
                                                                    {streamRec.alternativeReason && (
                                                                        <p className="text-sm text-slate-600">{streamRec.alternativeReason}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Future Career Paths */}
                                                        {streamRec.careerPathsAfter12 && streamRec.careerPathsAfter12.length > 0 && (
                                                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                                                                <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                                    <TrendingUp className="w-5 h-5 text-slate-700" />
                                                                    Career Paths After 12th with {streamRec.recommendedStream}
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {streamRec.careerPathsAfter12.map((career, idx) => (
                                                                        <span key={idx} className="px-3 py-2 bg-white text-slate-700 rounded-lg text-sm border border-slate-300 shadow-sm">
                                                                            {career}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Entrance Exams */}
                                                        {streamRec.entranceExams && streamRec.entranceExams.length > 0 && (
                                                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                                                                <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                                    <Target className="w-5 h-5 text-slate-700" />
                                                                    Entrance Exams to Prepare For
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {streamRec.entranceExams.map((exam, idx) => (
                                                                        <span key={idx} className="px-3 py-2 bg-white text-slate-700 rounded-lg text-sm border border-slate-300 shadow-sm font-medium">
                                                                            {exam}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Advice Note */}
                                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                            <div className="flex gap-3">
                                                                <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                                                                <div className="text-sm text-slate-700">
                                                                    <p className="font-semibold mb-1">Important Note</p>
                                                                    <p>This recommendation is based on your marks, projects, experiences, and interests. Discuss with your parents, teachers, and career counselors before making your final decision.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}

                                    {/* Fallback for After 10th when no stream data */}
                                    {gradeLevel === 'after10' && !(enhancedStreamRecommendation?.recommendedStream || streamRecommendation?.recommendedStream) && (
                                        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                                            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Stream Recommendation Loading...</h3>
                                            <p className="text-slate-500 text-sm">Your personalized 11th/12th stream recommendation is being calculated based on your assessment results.</p>
                                        </div>
                                    )}

                                    {/* After 12th: Course Recommendations */}
                                    {shouldShowProgramRecommendations && enhancedCourseRecommendations && enhancedCourseRecommendations.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center shadow-lg">
                                                    <GraduationCap className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-800">Recommended Programs for You</h2>
                                                    <p className="text-slate-600">Based on your interests, academics, projects & experiences</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {enhancedCourseRecommendations.slice(0, 5).map((course, index) => (
                                                    <div 
                                                        key={course.courseId}
                                                        className={`relative bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                                                            index === 0 ? 'border-slate-300 shadow-slate-100 shadow-lg' : 'border-slate-100'
                                                        }`}
                                                    >
                                                        {/* Rank Badge */}
                                                        <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                                                            index === 0 ? 'bg-slate-700' :
                                                            index === 1 ? 'bg-slate-600' :
                                                            'bg-slate-500'
                                                        }`}>
                                                            #{index + 1}
                                                        </div>

                                                        {/* Top Pick Badge */}
                                                        {index === 0 && (
                                                            <div className="flex items-center gap-1 text-slate-700 text-xs font-semibold mb-2">
                                                                <Star className="w-3 h-3 fill-current" />
                                                                TOP RECOMMENDATION
                                                            </div>
                                                        )}

                                                        {/* Course Name */}
                                                        <h3 className="font-semibold text-slate-800 text-lg mb-2 pr-8">{course.courseName}</h3>

                                                        {/* Category Badge */}
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                                                            course.category === 'Science' ? 'bg-slate-100 text-slate-700' :
                                                            course.category === 'Commerce' ? 'bg-slate-100 text-slate-700' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {course.category}
                                                        </span>

                                                        {/* Match Score */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm text-slate-600">Match Score</span>
                                                                <span className={`font-bold ${
                                                                    course.matchScore >= 80 ? 'text-slate-800' :
                                                                    course.matchScore >= 65 ? 'text-slate-700' :
                                                                    'text-slate-600'
                                                                }`}>
                                                                    {course.matchScore}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all ${
                                                                        course.matchScore >= 80 ? 'bg-slate-700' :
                                                                        course.matchScore >= 65 ? 'bg-slate-600' :
                                                                        'bg-slate-400'
                                                                    }`}
                                                                    style={{ width: `${course.matchScore}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Reasons */}
                                                        {course.reasons && course.reasons.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                                <p className="text-xs font-medium text-slate-600 mb-2">Why this fits you:</p>
                                                                <ul className="space-y-1">
                                                                    {course.reasons.slice(0, 3).map((reason, idx) => (
                                                                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                                                            <CheckCircle2 className="w-3 h-3 text-slate-600 mt-0.5 flex-shrink-0" />
                                                                            {reason}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Guidance Note */}
                                            <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <div className="flex gap-3">
                                                    <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                                                    <div className="text-sm text-slate-700">
                                                        <p className="font-semibold mb-1">Next Steps</p>
                                                        <p>Research these programs at universities you're interested in. Consider factors like curriculum, faculty expertise, placement records, location, and your personal preferences.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback when no course data but should show recommendations */}
                                    {shouldShowProgramRecommendations && (!enhancedCourseRecommendations || enhancedCourseRecommendations.length === 0) && (
                                        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                                            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Program Recommendations Loading...</h3>
                                            <p className="text-slate-500 text-sm">Your personalized degree program recommendations are being calculated based on your assessment results.</p>
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
                                <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Career Recommendations Loading...</h3>
                                    <p className="text-slate-500 text-sm">Your personalized career recommendations are being calculated based on your assessment results.</p>
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
            </div>
        </>
    );
};

export default AssessmentResult;