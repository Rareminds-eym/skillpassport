import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    Target,
    Briefcase,
    Zap,
    Rocket,
    Download,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
    X
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

// Import constants and hooks
import { RIASEC_NAMES, RIASEC_COLORS, TRAIT_NAMES, TRAIT_COLORS, PRINT_STYLES } from './constants';
import { useAssessmentResults } from './hooks/useAssessmentResults';

/**
 * Animated Path Component - Creates dotted line animation
 */
const AnimatedPath = ({ d, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });
    const [pathLength, setPathLength] = useState(2000);

    useEffect(() => {
        if (ref.current) {
            setPathLength(ref.current.getTotalLength());
        }
    }, []);

    return (
        <motion.path
            ref={ref}
            d={d}
            stroke="black"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="10 15"
            initial={{
                strokeDashoffset: pathLength,
                opacity: 0
            }}
            animate={isInView ? {
                strokeDashoffset: 0,
                opacity: 1
            } : {
                strokeDashoffset: pathLength,
                opacity: 0
            }}
            transition={{ duration: 2, delay, ease: "easeInOut" }}
        />
    );
};

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
 * Animated Career Path Component - Dotted line connector
 */
const AnimatedCareerPath = ({ delay = 0, reverse = false }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, delay, ease: "easeOut" }}
        >
            <div className="hidden md:flex justify-center md:-mt-10 lg:-mt-8">
                <div className="relative w-full md:max-w-sm lg:max-w-xl" style={{
                    transform: reverse ? 'translateX(16%)' : 'translateX(-16%)'
                }}>
                    <div style={{ paddingTop: `${(495 / 758) * 100}%` }} />
                    <svg
                        viewBox="0 0 758 495"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="xMidYMid meet"
                        className="absolute top-0 left-0 w-full h-full"
                    >
                        {/* Starting circle */}
                        <motion.circle
                            cx={reverse ? "726.556" : "31.4439"}
                            cy={reverse ? "29.8572" : "29.8572"}
                            r="11.7417"
                            fill="white"
                            stroke="black"
                            strokeWidth="2.89"
                            strokeMiterlimit="10"
                            strokeDasharray="6.93 6.93"
                            initial={{ scale: 0, rotate: 0 }}
                            animate={isInView ? { scale: 1, rotate: 360 } : { scale: 0, rotate: 0 }}
                            transition={{ duration: 0.6, delay: delay + 0.2, ease: "easeOut" }}
                        />

                        {/* Animated dotted path */}
                        <AnimatedPath
                            d={reverse
                                ? "M693 18.2507C668.797 6.9557 632.826 2.6091 594.88 53.3601C532.468 136.833 520.437 312.778 462.044 370.936C414.568 418.198 370.699 393.22 341.67 365.886C238.732 99.7033 117.664 87.8267 54.5854 287.647C48.0564 308.339 40.8692 333.929 33.954 366.957C26.2841 403.627 21.2821 438.247 18 465"
                                : "M63 22.2507C87.203 10.9557 123.174 6.6091 161.12 57.3601C223.532 140.833 235.563 316.778 293.956 374.936C341.432 422.198 385.301 397.22 414.33 369.886C517.268 103.703 638.336 91.8267 701.415 291.647C707.944 312.339 715.131 337.929 722.046 370.957C729.716 407.627 734.718 442.247 738 469"
                            }
                            delay={delay + 0.3}
                        />

                        {/* Ending circle */}
                        <motion.circle
                            cx={reverse ? "13.7417" : "744.742"}
                            cy={reverse ? "476.819" : "480.819"}
                            r="11.7417"
                            fill="white"
                            stroke="black"
                            strokeWidth="2.89"
                            strokeMiterlimit="10"
                            strokeDasharray="6.93 6.93"
                            initial={{ scale: 0, rotate: 0 }}
                            animate={isInView ? { scale: 1, rotate: 360 } : { scale: 0, rotate: 0 }}
                            transition={{ duration: 0.6, delay: delay + 2, ease: "easeOut" }}
                        />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};

/**
 * Career Card Component
 * Displays individual career recommendation with animation
 */
const CareerCard = ({ cluster, index, fitType, color, reverse = false }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

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
                        {/* Outer Container with Gradient Border */}
                        <div
                            className="relative rounded-[10px] p-[1px]"
                            style={{
                                width: '100%',
                                maxWidth: '360px',
                                minHeight: '280px',
                                background: `radial-gradient(circle 230px at 0% 0%, ${config.accentLight}, #0c0d0d)`
                            }}
                        >
                            {/* Animated Dot */}
                            <div
                                className="absolute w-[5px] aspect-square rounded-full z-[2]"
                                style={{
                                    backgroundColor: '#fff',
                                    boxShadow: `0 0 10px ${config.accentLight}`,
                                    animation: 'moveDot 6s linear infinite'
                                }}
                            />

                            {/* Main Card */}
                            <div
                                className="relative w-full h-full rounded-[9px] border border-[#202222] flex flex-col justify-center p-5"
                                style={{
                                    background: `radial-gradient(circle 280px at 0% 0%, ${config.accent}40, #0c0d0d)`,
                                    backgroundSize: '20px 20px'
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
                                {/* Top Line */}
                                <div
                                    className="absolute w-[2px] h-[1px]"
                                    style={{
                                        top: '10%',
                                        background: `linear-gradient(90deg, ${config.accent}88 30%, #1d1f1f 70%)`
                                    }}
                                />
                                {/* Bottom Line */}
                                <div
                                    className="absolute w-[2px] h-[1px] "
                                    style={{ bottom: '10%' }}
                                />
                                {/* Left Line */}
                                <div
                                    className="absolute w-[2px] h-full"
                                    style={{
                                        left: '10%',
                                        background: `linear-gradient(180deg, ${config.accent}74 30%, #222424 70%)`
                                    }}
                                />
                                {/* Right Line */}
                                <div
                                    className="absolute w-[2px] h-full"
                                    style={{ right: '10%' }}
                                />

                                {/* Content */}
                                <div className="relative z-[1]">
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
                                </div>
                            </div>
                        </div>

                        {/* Keyframes for dot animation - inject into head */}
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
            {index < 2 && <AnimatedCareerPath delay={0.4} reverse={reverse} />}
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
        handleRetry,
        validateResults,
        navigate
    } = useAssessmentResults();

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
            <div className="web-view min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 px-4">
                {/* Floating Action Bar */}
                <div
                    className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4 transition-transform duration-300 ${
                        isNavbarVisible ? 'translate-y-0' : '-translate-y-24'
                    }`}
                >
                    <div className="flex justify-between items-center bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 p-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/student/dashboard')}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleRetry}
                                disabled={retrying}
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                {retrying ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Regenerate Report
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handlePrint}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200"
                            >
                                <Download className="w-4 h-4 mr-2" />
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
                <div className="max-w-6xl mx-auto print:max-w-none print-container pt-24">
                    {/* Header Section */}
                    <ReportHeader studentInfo={studentInfo} />

                    {/* Overall Summary Banner */}
                    <div className="bg-slate-800 rounded-2xl p-6 text-white my-8">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-2">Overall Career Direction</h4>
                                <p className="text-gray-300 leading-relaxed text-base">"{results.overallSummary}"</p>
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

                    {/* Zig-Zag Career Fit View */}
                    <div className="mb-8 relative py-20">
                        <div className="max-w-7xl mx-auto px-6 lg:px-6">
                            <h2 className="text-center font-extrabold text-gray-800 mb-4 text-2xl sm:text-3xl md:text-4xl">Your Career Recommendations</h2>
                            <p className="text-center text-gray-500 mb-12 text-sm sm:text-base md:text-lg">Personalized job matches based on your assessment</p>

                            {/* Career Cards */}
                            <CareerCard
                                cluster={careerFit?.clusters?.find(c => c.fit === 'High')}
                                index={0}
                                fitType="HIGH FIT"
                                color="green"
                                reverse={false}
                            />

                            <CareerCard
                                cluster={careerFit?.clusters?.find(c => c.fit === 'Medium')}
                                index={1}
                                fitType="MEDIUM FIT"
                                color="yellow"
                                reverse={true}
                            />

                            <CareerCard
                                cluster={careerFit?.clusters?.find(c => c.fit !== 'High' && c.fit !== 'Medium')}
                                index={2}
                                fitType="EXPLORE LATER"
                                color="purple"
                                reverse={false}
                            />
                        </div>
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
            </div>
        </>
    );
};

export default AssessmentResult;
