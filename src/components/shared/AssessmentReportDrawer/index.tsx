import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Target,
    Briefcase,
    Download,
    ArrowRight,
    Eye,
    Palette,
    Code,
    Heart,
    Lightbulb
} from 'lucide-react';
import { Button } from '../../Students/components/ui/button';
// @ts-ignore - JS file without types
import { useAssessmentRecommendations } from '../../../hooks/useAssessmentRecommendations';
// @ts-ignore - JS file without types
import { getStudentPreGeneratedCourses, getAllCoursesFlat } from '../../../services/courseRecommendation/preGeneratedCoursesService';
// Import CareerTrackModal
// @ts-ignore - JS file without types
import CareerTrackModal from '../../../features/assessment/assessment-result/components/CareerTrackModal';
// Import PrintView and constants for PDF download
// @ts-ignore - JS file without types
import PrintView from '../../../features/assessment/assessment-result/components/PrintView';
// @ts-ignore - JS file without types
import { RIASEC_NAMES, RIASEC_COLORS, TRAIT_NAMES, TRAIT_COLORS, PRINT_STYLES } from '../../../features/assessment/assessment-result/constants';

interface AssessmentReportDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    studentId?: string;
    onViewFullReport?: () => void;
    student?: {
        id?: string;
        user_id?: string;
        name?: string;
        email?: string;
        college?: string;
        college_name?: string;
        grade?: string;
        school_name?: string;
        roll_number?: string;
        student_grade?: string;
    };
    assessmentResult?: {
        id?: string;
        student_id?: string;
        student_name?: string;
        student_email?: string;
        college_name?: string;
        grade_level?: string;
        stream_id?: string;
        riasec_scores?: any;
        riasec_code?: string;
        aptitude_scores?: any;
        aptitude_overall?: number;
        employability_readiness?: number;
        career_fit?: any;
        skill_gap?: any;
        platform_courses?: any;
        roadmap?: any;
        profile_snapshot?: any;
        overall_summary?: any;
        gemini_results?: any;
        created_at?: string;
        status?: string;
    };
    studentInfo?: {
        name?: string;
        grade?: string;
        school?: string;
        rollNumber?: string;
        assessmentDate?: string;
    };
}

interface CareerTrack {
    id: number;
    title: string;
    description: string;
    matchPercentage: number;
    topRoles: Array<{
        name: string;
        salaryRange: string;
        fit: string;
    }>;
    icon: any;
    color: string;
    bgGradient: string;
    // Additional properties for CareerTrackModal
    cluster?: any;
    index?: number;
    fitType?: string;
    specificRoles?: Array<{
        name: string;
        salary: { min: number; max: number };
    }>;
}

// Track icons mapping
const getTrackIcon = (trackTitle: string) => {
    const title = trackTitle.toLowerCase();
    if (title.includes('creative') || title.includes('arts') || title.includes('design')) return Palette;
    if (title.includes('science') || title.includes('technology') || title.includes('engineering')) return Code;
    if (title.includes('community') || title.includes('social') || title.includes('service')) return Heart;
    if (title.includes('business') || title.includes('management')) return Briefcase;
    if (title.includes('health') || title.includes('medical')) return Heart;
    return Target;
};
// Track color schemes
const getTrackColors = (index: number) => {
    const colorSchemes = [
        {
            color: 'text-blue-600',
            bgGradient: 'from-blue-600 to-blue-800',
            lightBg: 'from-blue-50 to-blue-100'
        },
        {
            color: 'text-purple-600',
            bgGradient: 'from-purple-600 to-purple-800',
            lightBg: 'from-purple-50 to-purple-100'
        },
        {
            color: 'text-green-600',
            bgGradient: 'from-green-600 to-green-800',
            lightBg: 'from-green-50 to-green-100'
        },
        {
            color: 'text-orange-600',
            bgGradient: 'from-orange-600 to-orange-800',
            lightBg: 'from-orange-50 to-orange-100'
        }
    ];
    return colorSchemes[index % colorSchemes.length];
};

// Generate realistic salary range based on role name and career track
const generateSalaryRange = (roleName: string, trackTitle: string, roleLevel: string = 'entry') => {
    // Base salary ranges by track type (in Lakhs INR)
    const trackSalaryBases: Record<string, Record<string, number[]>> = {
        'software': { entry: [4, 8], mid: [8, 15], senior: [15, 25] },
        'data': { entry: [5, 9], mid: [9, 18], senior: [18, 30] },
        'engineering': { entry: [4, 7], mid: [7, 14], senior: [14, 22] },
        'technology': { entry: [4, 8], mid: [8, 16], senior: [16, 28] },
        'creative': { entry: [3, 6], mid: [6, 12], senior: [12, 20] },
        'business': { entry: [4, 7], mid: [7, 15], senior: [15, 25] },
        'healthcare': { entry: [5, 10], mid: [10, 20], senior: [20, 35] },
        'finance': { entry: [5, 9], mid: [9, 18], senior: [18, 30] },
        'default': { entry: [3, 6], mid: [6, 12], senior: [12, 20] }
    };
    
    // Determine track category
    const trackLower = trackTitle.toLowerCase();
    let trackCategory = 'default';
    
    if (trackLower.includes('software') || trackLower.includes('programming')) trackCategory = 'software';
    else if (trackLower.includes('data') || trackLower.includes('analytics')) trackCategory = 'data';
    else if (trackLower.includes('engineering')) trackCategory = 'engineering';
    else if (trackLower.includes('technology') || trackLower.includes('tech')) trackCategory = 'technology';
    else if (trackLower.includes('creative') || trackLower.includes('design') || trackLower.includes('arts')) trackCategory = 'creative';
    else if (trackLower.includes('business') || trackLower.includes('management')) trackCategory = 'business';
    else if (trackLower.includes('health') || trackLower.includes('medical')) trackCategory = 'healthcare';
    else if (trackLower.includes('finance') || trackLower.includes('banking')) trackCategory = 'finance';
    
    // Determine role level
    const roleLower = roleName.toLowerCase();
    let level = roleLevel;
    
    if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('manager') || roleLower.includes('director')) {
        level = 'senior';
    } else if (roleLower.includes('junior') || roleLower.includes('entry') || roleLower.includes('trainee') || roleLower.includes('intern')) {
        level = 'entry';
    } else if (roleLower.includes('mid') || roleLower.includes('associate') || (!roleLower.includes('senior') && !roleLower.includes('junior'))) {
        level = 'mid';
    }
    
    // Get salary range
    const salaryRange = trackSalaryBases[trackCategory]?.[level] || trackSalaryBases['default'][level];
    return `₹${salaryRange[0]}L - ₹${salaryRange[1]}L`;
};
const AssessmentReportDrawer: React.FC<AssessmentReportDrawerProps> = ({
    isOpen,
    onClose,
    studentId,
    student,
    assessmentResult,
    studentInfo: providedStudentInfo
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [careerTracks, setCareerTracks] = useState<CareerTrack[]>([]);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [assessmentData, setAssessmentData] = useState<any>(null);
    const [selectedTrack, setSelectedTrack] = useState<any>(null);

    // PDF download functionality
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

    // Use the assessment recommendations hook (for compatibility)
    const {
        loading: recommendationsLoading
    } = useAssessmentRecommendations(studentId, !!studentId);

    // Process passed data instead of fetching from database
    useEffect(() => {
        if (!isOpen) return;

        console.log('[AssessmentReportDrawer] Processing passed data...');
        console.log('Student:', student);
        console.log('Assessment Result:', assessmentResult);

        // Process student information from passed props
        if (student || providedStudentInfo) {
            const processedStudentInfo = {
                name: student?.name || providedStudentInfo?.name || 'Student',
                grade: assessmentResult?.grade_level || student?.grade || providedStudentInfo?.grade || 'Grade 6',
                school: student?.college_name || student?.college || student?.school_name || providedStudentInfo?.school || 'School',
                rollNumber: student?.roll_number || providedStudentInfo?.rollNumber || 'N/A',
                assessmentDate: assessmentResult?.created_at ? 
                    new Date(assessmentResult.created_at).toLocaleDateString('en-GB') : 
                    providedStudentInfo?.assessmentDate || new Date().toLocaleDateString('en-GB')
            };
            
            setStudentInfo(processedStudentInfo);
            console.log('[AssessmentReportDrawer] Processed student info:', processedStudentInfo);
        }

        // Process assessment data from passed props
        if (assessmentResult) {
            setAssessmentData(assessmentResult);
            console.log('[AssessmentReportDrawer] Using passed assessment result:', assessmentResult.id);

            // Process career tracks from the passed assessment data
            const careerFitData = assessmentResult.career_fit || assessmentResult.gemini_results?.careerFit;
            
            if (careerFitData && careerFitData.clusters) {
                console.log('[AssessmentReportDrawer] 🔍 Processing career fit data:', careerFitData);
                
                const tracks: CareerTrack[] = careerFitData.clusters.slice(0, 3).map((cluster: any, index: number) => {
                    const colors = getTrackColors(index);
                    const IconComponent = getTrackIcon(cluster.title || cluster.name);
                    
                    console.log(`[AssessmentReportDrawer] 📋 Processing track ${index + 1}: ${cluster.title}`);
                    
                    // Extract top roles with improved logic
                    let topRoles: Array<{name: string; salaryRange: string; fit: string}> = [];
                    
                    // Method 1: Try to get roles from specificOptions with proper mapping
                    if (careerFitData.specificOptions) {
                        console.log('[AssessmentReportDrawer] 🔍 Found specificOptions:', careerFitData.specificOptions);
                        
                        // Map track index to fit level
                        const fitLevelMapping = ['highFit', 'mediumFit', 'exploreLater'];
                        const targetFitLevel = fitLevelMapping[index];
                        
                        if (targetFitLevel && careerFitData.specificOptions[targetFitLevel]) {
                            console.log(`[AssessmentReportDrawer] ✅ Using ${targetFitLevel} for track ${index + 1}`);
                            const careers = careerFitData.specificOptions[targetFitLevel];
                            
                            careers.slice(0, 3).forEach((career: any) => {
                                if (career && (career.name || career.title)) {
                                    const roleName = career.name || career.title;
                                    let salaryRange = career.salary || career.salaryRange;
                                    
                                    // Convert object salary to string format if needed
                                    if (typeof salaryRange === 'object' && salaryRange && (salaryRange as any)?.min && (salaryRange as any)?.max) {
                                        salaryRange = `₹${(salaryRange as any).min}L - ₹${(salaryRange as any).max}L`;
                                    }
                                    
                                    // If no salary provided, generate realistic one
                                    if (!salaryRange || salaryRange === 'Competitive') {
                                        salaryRange = generateSalaryRange(roleName, cluster.title, 'entry');
                                    }
                                    
                                    topRoles.push({
                                        name: roleName,
                                        salaryRange: salaryRange,
                                        fit: targetFitLevel === 'highFit' ? 'High' : targetFitLevel === 'mediumFit' ? 'Medium' : 'Explore'
                                    });
                                }
                            });
                            console.log(`[AssessmentReportDrawer] ✅ Extracted ${topRoles.length} roles from ${targetFitLevel}`);
                        } else {
                            console.log(`[AssessmentReportDrawer] ⚠️ No ${targetFitLevel} found, trying alternative approach`);
                            
                            // Alternative: Try to get roles from any available fit level
                            const allFitLevels = ['highFit', 'mediumFit', 'exploreLater'];
                            for (const fitLevel of allFitLevels) {
                                if (careerFitData.specificOptions[fitLevel] && topRoles.length === 0) {
                                    const careers = careerFitData.specificOptions[fitLevel];
                                    careers.slice(0, 3).forEach((career: any) => {
                                        if (career && (career.name || career.title) && topRoles.length < 3) {
                                            const roleName = career.name || career.title;
                                            let salaryRange = career.salary || career.salaryRange;
                                            
                                            // Convert object salary to string format if needed
                                            if (typeof salaryRange === 'object' && salaryRange && (salaryRange as any)?.min && (salaryRange as any)?.max) {
                                                salaryRange = `₹${(salaryRange as any).min}L - ₹${(salaryRange as any).max}L`;
                                            }
                                            
                                            // If no salary provided, generate realistic one
                                            if (!salaryRange || salaryRange === 'Competitive') {
                                                salaryRange = generateSalaryRange(roleName, cluster.title, 'entry');
                                            }
                                            
                                            topRoles.push({
                                                name: roleName,
                                                salaryRange: salaryRange,
                                                fit: fitLevel === 'highFit' ? 'High' : fitLevel === 'mediumFit' ? 'Medium' : 'Explore'
                                            });
                                        }
                                    });
                                    if (topRoles.length > 0) {
                                        console.log(`[AssessmentReportDrawer] ✅ Used alternative ${fitLevel} for track ${index + 1}`);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Method 2: Fallback to cluster roles if available
                    if (topRoles.length === 0 && cluster.roles) {
                        console.log('[AssessmentReportDrawer] 🔄 Falling back to cluster roles');
                        const allRoles = [
                            ...(cluster.roles.entry || []),
                            ...(cluster.roles.mid || []),
                            ...(cluster.roles.senior || [])
                        ];
                        
                        topRoles = allRoles.slice(0, 3).map((role: string) => {
                            // Determine role level based on position and name
                            let roleLevel = 'entry';
                            if (cluster.roles.senior && cluster.roles.senior.includes(role)) {
                                roleLevel = 'senior';
                            } else if (cluster.roles.mid && cluster.roles.mid.includes(role)) {
                                roleLevel = 'mid';
                            }
                            
                            return {
                                name: role,
                                salaryRange: generateSalaryRange(role, cluster.title, roleLevel),
                                fit: cluster.fit || 'Medium'
                            };
                        });
                        console.log(`[AssessmentReportDrawer] ✅ Extracted ${topRoles.length} roles from cluster`);
                    }
                    
                    // Method 3: Default roles if nothing found
                    if (topRoles.length === 0) {
                        console.log('[AssessmentReportDrawer] 🔄 Using default roles');
                        const trackTitle = cluster.title || 'General';
                        topRoles = [
                            { 
                                name: 'Entry Level Role', 
                                salaryRange: generateSalaryRange('Entry Level Role', trackTitle, 'entry'), 
                                fit: 'High' 
                            },
                            { 
                                name: 'Mid Level Role', 
                                salaryRange: generateSalaryRange('Mid Level Role', trackTitle, 'mid'), 
                                fit: 'Medium' 
                            },
                            { 
                                name: 'Senior Role', 
                                salaryRange: generateSalaryRange('Senior Role', trackTitle, 'senior'), 
                                fit: 'High' 
                            }
                        ];
                    }
                    
                    console.log(`[AssessmentReportDrawer] 📝 Final roles for ${cluster.title}:`, topRoles);

                    return {
                        id: index + 1,
                        title: cluster.title || cluster.name || `Career Track ${index + 1}`,
                        description: cluster.description || `Explore opportunities in ${cluster.title || cluster.name}`,
                        matchPercentage: typeof cluster.matchScore === 'number' ? cluster.matchScore : Math.max(85 - index * 10, 50),
                        topRoles: topRoles,
                        icon: IconComponent,
                        color: colors.color,
                        bgGradient: colors.bgGradient,
                        // Add data needed for CareerTrackModal
                        cluster: cluster,
                        index: index,
                        fitType: 'HIGH FIT',
                        specificRoles: topRoles.map(role => ({
                            name: role.name,
                            salary: typeof role.salaryRange === 'string' 
                                ? { min: 3, max: 15 } // Default when string format
                                : (role.salaryRange as any)?.min && (role.salaryRange as any)?.max
                                    ? { min: (role.salaryRange as any).min, max: (role.salaryRange as any).max }
                                    : { min: 3, max: 15 } // Default salary range
                        }))
                    };
                });
                
                setCareerTracks(tracks);
                console.log('[AssessmentReportDrawer] Processed', tracks.length, 'career tracks from passed data');
            } else {
                console.warn('[AssessmentReportDrawer] No career fit data found in passed assessment result');
                // Set default tracks
                setCareerTracks([]);
            }
        } else {
            console.warn('[AssessmentReportDrawer] No assessment result passed');
            setError('No assessment data provided');
        }

        setLoading(false);
    }, [isOpen, student, assessmentResult, providedStudentInfo]);

    // Handle opening career track modal
    const handleViewTrack = (track: CareerTrack) => {
        setSelectedTrack(track);
    };

    if (!isOpen) return null;
    
    return (
        <>
            <AnimatePresence mode="wait">
                <div key="assessment-drawer-container" className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        key="assessment-drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        key="assessment-drawer-content"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 h-full w-full max-w-6xl bg-white shadow-2xl overflow-hidden"
                    >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold">Career Profiling & Skill Development Report</h1>
                                <p className="text-slate-300 text-sm mt-1">AI-Powered Career Assessment</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Download Report Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handlePrint}
                                    className="text-white hover:bg-white/20 rounded-lg px-3 py-2 flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Report
                                </Button>
                                {/* Close Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-white hover:bg-white/20 rounded-full p-2"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 assessment-drawer-scrollbar" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 120px)' }}>
                        {loading || recommendationsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <span className="ml-4 text-gray-600 text-lg">Generating your report...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20">
                                <div className="text-red-500 mb-4 text-4xl">⚠️</div>
                                <p className="text-gray-600 text-lg">{error}</p>
                            </div>
                        ) : (
                            <>
                                {/* Student Information Grid - Dynamic Data from Props */}
                                <div className="bg-white p-8 border-b border-gray-200">
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Row 1 */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Student Name</p>
                                            <p className="font-bold text-gray-900 text-sm">{studentInfo?.name || 'Student'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">
                                                {(() => {
                                                    const grade = student?.student_grade || student?.grade;
                                                    // Check if it's a college grade (anything beyond after12/Grade 12)
                                                    const isCollegeStudent = grade && !['6', '7', '8', '9', '10', '11', '12', 'grade6to8', 'grade9to10', 'after10', 'after12'].includes(grade.toLowerCase());
                                                    return isCollegeStudent ? 'College Roll No.' : 'School Roll No.';
                                                })()}
                                            </p>
                                            <p className="font-bold text-gray-900 text-sm">{studentInfo?.rollNumber || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Programme Stream</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {assessmentData?.grade_level === 'after10' ? 'High School (Grades 11-12)' :
                                                 assessmentData?.grade_level === 'after12' ? 'College Level' :
                                                 assessmentData?.grade_level === 'grade6to8' ? 'Middle School (Grades 6-8)' :
                                                 'Middle School (Grades 6-8)'}
                                            </p>
                                        </div>
                                        
                                        {/* Row 2 */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Grade</p>
                                            <p className="font-bold text-gray-900 text-sm">{studentInfo?.grade || 'Grade 6'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">School</p>
                                            <p className="font-bold text-gray-900 text-sm">{studentInfo?.school || 'School'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Assessment Date</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {studentInfo?.assessmentDate || new Date().toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Assessment Summary - Dynamic Message */}
                                <div className="bg-slate-800 text-white p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3">
                                            <img src="/assets/HomePage/Ai Logo.png" alt="AI" className="w-12 h-12 object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-white leading-relaxed">
                                                {assessmentData?.overall_summary}
                                            </p>
                                            {assessmentData?.riasec_code && (
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <span className="text-xs bg-blue-600 px-3 py-1 rounded-full font-semibold">
                                                        Interest Profile: {assessmentData.riasec_code}
                                                    </span>
                                                    {assessmentData.employability_readiness && (
                                                        <span className="text-xs bg-green-600 px-3 py-1 rounded-full font-semibold">
                                                            Career Readiness: {assessmentData.employability_readiness}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Career Tracks - Grid Layout with Student Assessment Result Design */}
                                {careerTracks.length > 0 ? (
                                    <div className="p-8 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                            {careerTracks.slice(0, 3).map((track, index) => (
                                                <motion.div
                                                    key={track.id}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.2 }}
                                                    className={`${index === 2 ? 'md:col-start-1' : ''}`}
                                                >
                                                    {/* Outer Container with Gradient Border - Matching Student Assessment Result Design */}
                                                    <div
                                                        className="relative rounded-[10px] p-[1px] cursor-pointer transition-all duration-300 hover:scale-105"
                                                        style={{
                                                            width: '100%',
                                                            maxWidth: '320px',
                                                            minHeight: '280px',
                                                            background: `radial-gradient(circle 230px at 0% 0%, #60a5fa, #0c0d0d)`,
                                                            borderRadius: '10px',
                                                            boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 15px 3px rgba(37, 99, 235, 0.3)`,
                                                        }}
                                                        onClick={() => handleViewTrack(track)}
                                                    >
                                                        {/* Animated Dot - Always visible */}
                                                        <div
                                                            className="absolute w-[5px] aspect-square rounded-full z-[2]"
                                                            style={{
                                                                backgroundColor: '#fff',
                                                                boxShadow: `0 0 10px #60a5fa`,
                                                                animation: 'moveDot 6s linear infinite',
                                                            }}
                                                        />

                                                        {/* Main Card */}
                                                        <div
                                                            className="relative w-full h-full rounded-[9px] overflow-hidden"
                                                            style={{
                                                                background: `radial-gradient(circle 280px at 0% 0%, #2563eb40, #0c0d0d)`,
                                                                backgroundSize: '20px 20px',
                                                                minHeight: '280px'
                                                            }}
                                                        >
                                                            {/* Ray Light Effect */}
                                                            <div
                                                                className="absolute w-[220px] h-[45px] rounded-[100px] opacity-40 blur-[10px]"
                                                                style={{
                                                                    backgroundColor: '#60a5fa',
                                                                    boxShadow: `0 0 50px #60a5fa`,
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
                                                                    background: `linear-gradient(90deg, #2563eb88 30%, #1d1f1f 70%)`
                                                                }}
                                                            />
                                                            <div className="absolute w-[2px] h-[1px]" style={{ bottom: '10%' }} />
                                                            <div
                                                                className="absolute w-[2px] h-full"
                                                                style={{
                                                                    left: '10%',
                                                                    background: `linear-gradient(180deg, #2563eb74 30%, #222424 70%)`
                                                                }}
                                                            />
                                                            <div className="absolute w-[2px] h-full" style={{ right: '10%' }} />

                                                            {/* Main Card Content */}
                                                            <div className="relative z-[1] px-8 py-6">
                                                                {/* Header with number badge and title */}
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <div
                                                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg"
                                                                        style={{ backgroundColor: '#2563eb' }}
                                                                    >
                                                                        {track.id}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span
                                                                            className="inline-block px-3 py-1 text-white text-xs font-semibold rounded-full mb-1"
                                                                            style={{ backgroundColor: '#2563eb' }}
                                                                        >
                                                                            TRACK {track.id}
                                                                        </span>
                                                                        <h3 className="text-lg sm:text-xl font-bold text-white">{track.title}</h3>
                                                                    </div>
                                                                </div>

                                                                {/* Top Roles & Salary Section */}
                                                                {track.topRoles && track.topRoles.length > 0 && (
                                                                    <div className="mt-2 mb-4">
                                                                        <h5
                                                                            className="text-xs font-bold uppercase mb-3 tracking-wider"
                                                                            style={{ color: '#60a5fa' }}
                                                                        >
                                                                            TOP ROLES & SALARY
                                                                        </h5>
                                                                        <div className="space-y-2">
                                                                            {track.topRoles.slice(0, 3).map((role, roleIndex) => (
                                                                                <div key={roleIndex} className="flex items-center justify-between">
                                                                                    <span className="text-gray-200 text-base">
                                                                                        {role?.name || `Role ${roleIndex + 1}`}
                                                                                    </span>
                                                                                    <span className="text-green-400 font-semibold text-base">
                                                                                        {typeof role?.salaryRange === 'string' 
                                                                                            ? role.salaryRange 
                                                                                            : (role?.salaryRange as any)?.min && (role?.salaryRange as any)?.max
                                                                                                ? `₹${(role.salaryRange as any).min}L - ₹${(role.salaryRange as any).max}L`
                                                                                                : 'Competitive'
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* View Full Track Indicator */}
                                                                <div className="flex items-center justify-center mt-6 pt-4 border-t border-white/10">
                                                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                                                            <Eye className="w-3 h-3" />
                                                                        </div>
                                                                        <span>Click to View Full Track</span>
                                                                        <motion.div
                                                                            key={`arrow-animation-${track.id}`}
                                                                            animate={{ x: [0, 4, 0] }}
                                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                                        >
                                                                            <ArrowRight className="w-4 h-4" />
                                                                        </motion.div>
                                                                    </div>
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
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Show message when no career tracks available
                                    <div className="p-8 bg-gray-50">
                                        <div className="text-center py-12">
                                            <div className="text-gray-400 mb-4 text-4xl">📊</div>
                                            <p className="text-gray-600 text-lg">No career track data available</p>
                                            <p className="text-gray-500 text-sm mt-2">Assessment results don't contain career fit information</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Hidden Print View for PDF Generation */}
                    <div className="print-view" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}>
                        <PrintView
                            results={assessmentData}
                            studentInfo={studentInfo}
                            gradeLevel={assessmentData?.grade_level}
                            riasecNames={RIASEC_NAMES}
                            traitNames={TRAIT_NAMES}
                        />
                    </div>
                </motion.div>
            </div>
            </AnimatePresence>

            {/* Inject print styles */}
            <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

            {/* Custom Scrollbar Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* Custom scrollbar for AssessmentReportDrawer */
                .assessment-drawer-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #9ca3af #f3f4f6;
                    scroll-behavior: smooth;
                }
                
                .assessment-drawer-scrollbar::-webkit-scrollbar {
                    width: 8px !important;
                    -webkit-appearance: none !important;
                }
                
                .assessment-drawer-scrollbar::-webkit-scrollbar-track {
                    background: #f3f4f6 !important;
                    border-radius: 4px !important;
                }
                
                .assessment-drawer-scrollbar::-webkit-scrollbar-thumb {
                    background: #9ca3af !important;
                    border-radius: 4px !important;
                    border: 1px solid #e5e7eb !important;
                    transition: all 0.2s ease !important;
                }
                
                .assessment-drawer-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280 !important;
                    border-color: #d1d5db !important;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                }
                
                .assessment-drawer-scrollbar::-webkit-scrollbar-thumb:active {
                    background: #4b5563 !important;
                }
                
                .assessment-drawer-scrollbar::-webkit-scrollbar-corner {
                    background: #f3f4f6 !important;
                }
                
                /* Mobile responsive */
                @media (max-width: 768px) {
                    .assessment-drawer-scrollbar::-webkit-scrollbar {
                        width: 6px !important;
                    }
                }
                
                /* Dark mode compatibility */
                @media (prefers-color-scheme: dark) {
                    .assessment-drawer-scrollbar {
                        scrollbar-color: #6b7280 #374151;
                    }
                    
                    .assessment-drawer-scrollbar::-webkit-scrollbar-track {
                        background: #374151 !important;
                    }
                    
                    .assessment-drawer-scrollbar::-webkit-scrollbar-thumb {
                        background: #6b7280 !important;
                        border-color: #4b5563 !important;
                    }
                    
                    .assessment-drawer-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #9ca3af !important;
                        border-color: #6b7280 !important;
                    }
                    
                    .assessment-drawer-scrollbar::-webkit-scrollbar-corner {
                        background: #374151 !important;
                    }
                }
            ` }} />

            {/* Career Track Modal - Outside AnimatePresence to avoid key conflicts */}
            {selectedTrack && (
                <CareerTrackModal
                    key={`career-track-modal-${selectedTrack.id}-${Date.now()}`}
                    selectedTrack={selectedTrack}
                    onClose={() => {
                        setSelectedTrack(null);
                    }}
                    skillGap={assessmentData?.skill_gap}
                    roadmap={assessmentData?.roadmap}
                    results={{
                        riasec: assessmentData?.riasec_scores ? {
                            topThree: assessmentData.riasec_code?.split('').slice(0, 3) || []
                        } : null,
                        aptitude: assessmentData?.aptitude_scores,
                        employability: {
                            strengthAreas: [],
                            improvementAreas: []
                        },
                        platformCourses: []
                    }}
                />
            )}
        </>
    );
};

export default AssessmentReportDrawer;
