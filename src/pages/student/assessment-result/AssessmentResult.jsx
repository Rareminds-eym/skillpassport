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
    TrendingUp
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
import { calculateCourseMatchScores } from './utils/courseMatchingEngine';

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
        studentInfo,
        studentAcademicData,
        handleRetry,
        validateResults,
        navigate
    } = useAssessmentResults();

    // Calculate enhanced course recommendations with accurate match scores
    const enhancedCourseRecommendations = useMemo(() => {
        if (!results?.courseRecommendations) return [];
        
        // Use the powerful matching engine to calculate accurate scores
        return calculateCourseMatchScores(
            results.courseRecommendations,
            results.riasec?.scores || {},
            studentAcademicData
        );
    }, [results?.courseRecommendations, results?.riasec?.scores, studentAcademicData]);

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

    const { riasec, aptitude, knowledge, careerFit, skillGap, roadmap, employability } = results;
    const missingFields = validateResults();
    const hasIncompleteData = missingFields.length > 0;

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
                                    className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/50"
                                    style={{
                                        boxShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)'
                                    }}
                                >
                                    <img 
                                        src="/assets/HomePage/RMLogo.webp" 
                                        alt="RM Logo" 
                                        className="w-10 h-10 object-contain"
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

                    {/* Course Recommendations Section - Only for after12 students */}
                    {gradeLevel === 'after12' && enhancedCourseRecommendations && enhancedCourseRecommendations.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Recommended Programs for You</h2>
                                    <p className="text-gray-500">Based on your interests, academics, projects & experiences</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {enhancedCourseRecommendations.slice(0, 5).map((course, index) => (
                                    <div 
                                        key={course.courseId}
                                        className={`relative bg-white rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                                            index === 0 ? 'border-emerald-300 shadow-emerald-100 shadow-lg' : 'border-gray-100'
                                        }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                                            index === 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                            index === 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                            'bg-gradient-to-br from-gray-400 to-gray-500'
                                        }`}>
                                            #{index + 1}
                                        </div>

                                        {/* Top Pick Badge */}
                                        {index === 0 && (
                                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mb-2">
                                                <Star className="w-3 h-3 fill-current" />
                                                TOP RECOMMENDATION
                                            </div>
                                        )}

                                        {/* Course Name */}
                                        <h3 className="font-semibold text-gray-800 text-lg mb-2 pr-8">{course.courseName}</h3>

                                        {/* Category Badge */}
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
                                            course.category === 'Science' ? 'bg-blue-100 text-blue-700' :
                                            course.category === 'Commerce' ? 'bg-amber-100 text-amber-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                            {course.category}
                                        </span>

                                        {/* Match Score */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-gray-600">Match Score</span>
                                                <span className={`font-bold ${
                                                    course.matchScore >= 80 ? 'text-emerald-600' :
                                                    course.matchScore >= 65 ? 'text-blue-600' :
                                                    'text-gray-600'
                                                }`}>
                                                    {course.matchScore}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${
                                                        course.matchScore >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                                        course.matchScore >= 65 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                                        'bg-gradient-to-r from-gray-300 to-gray-400'
                                                    }`}
                                                    style={{ width: `${course.matchScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Match Level */}
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                            course.matchLevel === 'Exceptional' || course.matchLevel === 'Excellent' ? 'bg-emerald-50 text-emerald-700' :
                                            course.matchLevel === 'Very Good' || course.matchLevel === 'Good' ? 'bg-blue-50 text-blue-700' :
                                            course.matchLevel === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                                            'bg-gray-50 text-gray-600'
                                        }`}>
                                            {(course.matchLevel === 'Exceptional' || course.matchLevel === 'Excellent') && <TrendingUp className="w-3 h-3" />}
                                            {course.matchEmoji && <span>{course.matchEmoji}</span>}
                                            {course.matchLevel} Match
                                        </div>

                                        {/* Score Breakdown (for top 3 courses) */}
                                        {index < 3 && course.scoreBreakdown && (
                                            <div className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
                                                <div className="text-center p-1 bg-blue-50 rounded" title="Interest Alignment">
                                                    <div className="font-bold text-blue-600">{course.scoreBreakdown.interest || 0}</div>
                                                    <div className="text-blue-500">Interest</div>
                                                </div>
                                                <div className="text-center p-1 bg-green-50 rounded" title="Academic Performance">
                                                    <div className="font-bold text-green-600">{course.scoreBreakdown.academic || 0}</div>
                                                    <div className="text-green-500">Academic</div>
                                                </div>
                                                <div className="text-center p-1 bg-purple-50 rounded" title="Projects">
                                                    <div className="font-bold text-purple-600">{course.scoreBreakdown.projects || 0}</div>
                                                    <div className="text-purple-500">Projects</div>
                                                </div>
                                                <div className="text-center p-1 bg-orange-50 rounded" title="Experience">
                                                    <div className="font-bold text-orange-600">{course.scoreBreakdown.experience || 0}</div>
                                                    <div className="text-orange-500">Exp</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reasons */}
                                        {course.reasons && course.reasons.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-500 mb-2">Why this fits you:</p>
                                                <ul className="space-y-1">
                                                    {course.reasons.slice(0, 3).map((reason, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                            {reason}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Career Paths */}
                                        {course.careerPaths && course.careerPaths.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-500 mb-2">Career Paths:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {course.careerPaths.slice(0, 3).map((path, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                                                            {path}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Guidance Note */}
                            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-semibold mb-1">Next Steps</p>
                                        <p>Research these programs at universities you're interested in. Consider factors like curriculum, faculty expertise, placement records, location, and your personal preferences when making your final decision.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Career Recommendations Section - Matching ReportHeader styling */}
                    <div className="mb-8">
                        {/* Main Card - Light Glass */}
                        <div className="relative w-full rounded-xl overflow-hidden bg-white backdrop-blur-xl shadow-lg">
                            {/* Subtle gradient overlay */}
                            <div 
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03), transparent 50%, rgba(147, 197, 253, 0.03))'
                                }}
                            />

                            {/* Header Section */}
                            <div className="relative p-6 md:p-8 bg-gradient-to-r from-slate-800 to-slate-700">
                                <div>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                                        Your Career Recommendations
                                    </h2>
                                    {/* Animated Gradient Underline */}
                                    <div className="relative h-[2px] w-40 md:w-56 mb-2 rounded-full overflow-hidden">
                                        <div 
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                background: 'linear-gradient(90deg, #1E3A8A, #3B82F6, #60A5FA, #93C5FD, #BFDBFE)',
                                                backgroundSize: '200% 100%',
                                                animation: 'shimmer 3s linear infinite'
                                            }}
                                        />
                                    </div>
                                    <p className="text-slate-300 text-sm md:text-base">
                                        Personalized job matches based on your assessment
                                    </p>
                                </div>
                            </div>

                            {/* Career Cards Container */}
                            <div className="relative px-6 md:px-8 py-6 bg-gray-50">
                                <CareerCard
                                    cluster={careerFit?.clusters?.find(c => c.fit === 'High')}
                                    index={0}
                                    fitType="TRACK 1"
                                    color="green"
                                    reverse={false}
                                    specificRoles={careerFit?.specificOptions?.highFit || []}
                                    onCardClick={handleTrackClick}
                                />

                                <CareerCard
                                    cluster={careerFit?.clusters?.find(c => c.fit === 'Medium')}
                                    index={1}
                                    fitType="TRACK 2"
                                    color="yellow"
                                    reverse={true}
                                    specificRoles={careerFit?.specificOptions?.mediumFit || []}
                                    onCardClick={handleTrackClick}
                                />

                                <CareerCard
                                    cluster={careerFit?.clusters?.find(c => c.fit !== 'High' && c.fit !== 'Medium')}
                                    index={2}
                                    fitType="TRACK 3"
                                    color="purple"
                                    reverse={false}
                                    specificRoles={careerFit?.specificOptions?.exploreLater || []}
                                    onCardClick={handleTrackClick}
                                />
                            </div>
                        </div>

                        {/* Keyframes for shimmer animation */}
                        <style>{`
                            @keyframes shimmer {
                                0% { background-position: 200% 0; }
                                100% { background-position: -200% 0; }
                            }
                        `}</style>
                    </div>
                </div>

                {/* Detail Modal - COMMENTED OUT FOR NOW */}
                {/* <Dialog open={activeSection !== null} onOpenChange={() => setActiveSection(null)}>
                    <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] !p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                        <DialogHeader className="bg-slate-800 px-8 py-6 relative !mb-0">
                            <DialogTitle className="sr-only">
                                {activeSection === 'profile' && 'Student Profile Snapshot'}
                                {activeSection === 'career' && 'Career Fit Results'}
                                {activeSection === 'skills' && 'Skill Gap & Development'}
                                {activeSection === 'roadmap' && 'Action Roadmap'}
                            </DialogTitle>
                            <button
                                onClick={() => setActiveSection(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                            <div className="flex items-center gap-4 pr-12">
                                {activeSection === 'profile' && (
                                    <>
                                        <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Target className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold text-white">Student Profile Snapshot - Your interests, aptitudes & personality</span>
                                    </>
                                )}
                                {activeSection === 'career' && (
                                    <>
                                        <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Briefcase className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold text-white">Career Fit Results - Best-matching career paths for you</span>
                                    </>
                                )}
                                {activeSection === 'skills' && (
                                    <>
                                        <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Zap className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold text-white">Skill Gap & Development - Skills to build for career success</span>
                                    </>
                                )}
                                {activeSection === 'roadmap' && (
                                    <>
                                        <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Rocket className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold text-white">Action Roadmap - Your 6-12 month career plan</span>
                                    </>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="overflow-y-auto max-h-[calc(95vh-100px)] bg-gray-50">
                            <div className="p-6 pb-12">
                                {activeSection === 'profile' && (
                                    <ProfileSection
                                        results={results}
                                        riasecNames={RIASEC_NAMES}
                                        riasecColors={RIASEC_COLORS}
                                        traitNames={TRAIT_NAMES}
                                        traitColors={TRAIT_COLORS}
                                    />
                                )}
                                {activeSection === 'career' && careerFit && (
                                    <CareerSection careerFit={careerFit} />
                                )}
                                {activeSection === 'skills' && skillGap && employability && (
                                    <SkillsSection
                                        skillGap={skillGap}
                                        employability={employability}
                                        skillGapCourses={results.skillGapCourses}
                                    />
                                )}
                                {activeSection === 'roadmap' && roadmap && (
                                    <RoadmapSection
                                        roadmap={roadmap}
                                        platformCourses={results.platformCourses}
                                        coursesByType={results.coursesByType}
                                        skillGapCourses={results.skillGapCourses}
                                    />
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog> */}

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
        </>
    );
};

export default AssessmentResult;