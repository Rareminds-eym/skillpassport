import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Heart
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

// Development logging utility
const devLog = (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(...args);
    }
};

// Development warning utility
const devWarn = (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
        console.warn(...args);
    }
};

// Development error utility (always show errors)
const devError = (...args: any[]) => {
    console.error(...args);
};

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
        program_id?: string;
        program_name?: string;
        stream_name?: string;
    };
    assessmentResult?: {
        id?: string;
        student_id?: string;
        student_name?: string | null;
        student_email?: string | null;
        college_name?: string | null;
        grade_level?: string | null;
        stream_id?: string | null;
        riasec_code?: string | null;
        riasec_scores?: any;
        aptitude_overall?: number | null;
        aptitude_scores?: any;
        bigfive_scores?: any;
        work_values_scores?: any;
        employability_readiness?: string | number | null;
        employability_scores?: any;
        knowledge_score?: number | null;
        knowledge_details?: any;
        career_fit?: any;
        skill_gap?: any;
        platform_courses?: any;
        roadmap?: any;
        profile_snapshot?: any;
        timing_analysis?: any;
        final_note?: any;
        overall_summary?: any;
        gemini_results?: any;
        created_at?: string;
        status?: string;
        stream_name?: string | null;
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
const AssessmentReportDrawer: React.FC<AssessmentReportDrawerProps> = React.memo(({
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

    // Use the assessment recommendations hook (for compatibility)
    const {
        loading: recommendationsLoading
    } = useAssessmentRecommendations(studentId, !!studentId);

    // Process passed data instead of fetching from database
    useEffect(() => {
        console.log('🎨 [AssessmentReportDrawer] useEffect triggered');
        console.log('🎨 [AssessmentReportDrawer] isOpen:', isOpen);
        console.log('🎨 [AssessmentReportDrawer] assessmentResult?.id:', assessmentResult?.id);
        
        if (!isOpen) {
            console.log('🎨 [AssessmentReportDrawer] Drawer is closed, skipping processing');
            return;
        }
        
        console.log('🎨 [AssessmentReportDrawer] Starting data processing...');
        console.log('🎨 [AssessmentReportDrawer] Setting loading to false');
        
        // Clear any previous errors when drawer opens
        setError(null);
        
        // Process assessment data when drawer opens
        
        devLog("studentInfo: ", studentInfo);
        devLog("assessmentResult: ", assessmentResult);
        devLog("assessment data", assessmentData);
        devLog('[AssessmentReportDrawer] Processing passed data...');
        devLog('Student:', student);
        devLog('Assessment Result:', assessmentResult);
        devLog('Provided Student Info:', providedStudentInfo);

        // Process student information from passed props
        if (student || providedStudentInfo || assessmentResult) {
            const processedStudentInfo = {
                name: assessmentResult?.student_name || student?.name || providedStudentInfo?.name || 'Student',
                grade: student?.student_grade || student?.grade || assessmentResult?.grade_level || providedStudentInfo?.grade || 'Not Specified',
                school: assessmentResult?.college_name || student?.college_name || student?.college || student?.school_name || providedStudentInfo?.school || 'School',
                rollNumber: student?.roll_number || providedStudentInfo?.rollNumber || 'N/A',
                assessmentDate: assessmentResult?.created_at ? 
                    new Date(assessmentResult.created_at).toLocaleDateString('en-GB') : 
                    providedStudentInfo?.assessmentDate || new Date().toLocaleDateString('en-GB')
            };
            
            setStudentInfo(processedStudentInfo);
            devLog('[AssessmentReportDrawer] Processed student info:', processedStudentInfo);
        }

        // Process assessment data from passed props
        if (assessmentResult) {
            setError(null); // Clear any previous errors
            setAssessmentData(assessmentResult);
            devLog('[AssessmentReportDrawer] Using passed assessment result:', assessmentResult.id);

            // Process career tracks from the passed assessment data
            const careerFitData = assessmentResult.career_fit || assessmentResult.gemini_results?.careerFit;
            
            devLog('[AssessmentReportDrawer] 🔍 Career fit data debug:', {
                careerFitData,
                hasCareerFit: !!careerFitData,
                hasClusters: !!careerFitData?.clusters,
                clustersLength: careerFitData?.clusters?.length,
                hasSpecificOptions: !!careerFitData?.specificOptions,
                assessmentResultKeys: Object.keys(assessmentResult),
                geminiResultsKeys: assessmentResult.gemini_results ? Object.keys(assessmentResult.gemini_results) : null
            });
            
            if (careerFitData && careerFitData.clusters) {
                console.log('[AssessmentReportDrawer] � Processing career fit data:', careerFitData);
                
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
                devWarn('[AssessmentReportDrawer] No career fit data found in passed assessment result');
                // Set default tracks
                setCareerTracks([]);
            }
        } else {
            devWarn('[AssessmentReportDrawer] No assessment result passed');
            setError('No assessment data provided');
        }

        setLoading(false);
        console.log('🎨 [AssessmentReportDrawer] Data processing complete, loading set to FALSE');
        console.log('🎨 [AssessmentReportDrawer] Final state:', {
            loading: false,
            error,
            careerTracksCount: careerTracks.length,
            hasStudentInfo: !!studentInfo,
            hasAssessmentData: !!assessmentData
        });
    }, [isOpen, assessmentResult?.id, student?.id, student?.user_id]); // Only depend on essential IDs

    // Handle opening career track modal
    const handleViewTrack = useCallback((track: CareerTrack) => {
        setSelectedTrack(track);
    }, []);

    // PDF download functionality - memoized to prevent recreation on every render
    const handlePrint = useCallback(() => {
        const printContent = document.querySelector('.print-view');
        if (!printContent) {
            devError('Print view not found');
            window.print();
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            // Fallback to regular print if popup blocked
            window.print();
            return;
        }

        const htmlContent = `
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
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    }, []);

    // Memoize the processed results for PrintView to prevent recalculation
    const printViewResults = useMemo(() => {
        if (!assessmentData) return null;
        
        const results = {
            // Use gemini_results as primary source, but ensure all data is properly structured
            ...(assessmentData?.gemini_results || {}),
            
            // Ensure RIASEC data is properly structured for Interest Explorer
            riasec: (() => {
                const geminiRiasec = assessmentData?.gemini_results?.riasec;
                const dbRiasecScores = assessmentData?.riasec_scores;
                const riasecCode = assessmentData?.riasec_code;
                
                devLog('🔍 RIASEC Debug:', {
                    geminiRiasec,
                    dbRiasecScores,
                    riasecCode,
                    dbRiasecScoresType: typeof dbRiasecScores,
                    dbRiasecScoresKeys: dbRiasecScores ? Object.keys(dbRiasecScores) : null
                });
                
                // If gemini_results has proper RIASEC data, use it
                if (geminiRiasec && geminiRiasec.scores && Object.keys(geminiRiasec.scores).length > 0) {
                    devLog('✅ Using gemini RIASEC data:', geminiRiasec);
                    return geminiRiasec;
                }
                
                // Otherwise, construct from database fields
                let scores: Record<string, number> = {};
                if (dbRiasecScores) {
                    // Handle different possible formats of riasec_scores
                    if (typeof dbRiasecScores === 'object') {
                        // If it's already an object with R, I, A, S, E, C keys
                        if (dbRiasecScores.R !== undefined) {
                            scores = { ...dbRiasecScores } as Record<string, number>;
                        }
                        // If it's in a different format, try to extract scores
                        else if (dbRiasecScores.scores) {
                            scores = { ...dbRiasecScores.scores } as Record<string, number>;
                        }
                        // If it has individual letter properties
                        else {
                            (['R', 'I', 'A', 'S', 'E', 'C'] as const).forEach(letter => {
                                if ((dbRiasecScores as any)[letter] !== undefined) {
                                    scores[letter] = (dbRiasecScores as any)[letter];
                                }
                            });
                        }
                    }
                }
                
                console.log('🔍 Extracted scores before validation:', scores);
                
                // Ensure all RIASEC letters have numeric scores
                (['R', 'I', 'A', 'S', 'E', 'C'] as const).forEach(letter => {
                    if (scores[letter] === undefined || scores[letter] === null) {
                        scores[letter] = 0;
                    }
                    // Ensure it's a number
                    const numValue = Number(scores[letter]);
                    scores[letter] = isNaN(numValue) ? 0 : numValue;
                });
                
                console.log('🔍 Validated scores:', scores);
                
                const riasecResult = {
                    scores: scores,
                    topThree: riasecCode?.split('').slice(0, 3) || ['R', 'I', 'A'],
                    code: riasecCode || 'RIA',
                    maxScore: 20
                };
                
                console.log('✅ Final RIASEC structure:', riasecResult);
                console.log('✅ RIASEC scores values:', Object.values(riasecResult.scores));
                console.log('✅ RIASEC scores are numbers:', Object.values(riasecResult.scores).every(v => typeof v === 'number'));
                return riasecResult;
            })(),
        
            // Ensure other assessment data is available
            aptitude: assessmentData?.gemini_results?.aptitude || {
                scores: assessmentData?.aptitude_scores || {},
                overall: assessmentData?.aptitude_overall || 0
            },
            bigFive: assessmentData?.gemini_results?.bigFive || assessmentData?.bigfive_scores,
            workValues: (() => {
                const geminiWorkValues = assessmentData?.gemini_results?.workValues;
                const dbWorkValues = assessmentData?.work_values_scores;
                
                console.log('🔍 Work Values Debug:', {
                    geminiWorkValues,
                    dbWorkValues,
                    dbWorkValuesType: typeof dbWorkValues,
                    geminiHasTopThree: geminiWorkValues?.topThree,
                    geminiHasScores: geminiWorkValues?.scores,
                    dbWorkValuesKeys: dbWorkValues ? Object.keys(dbWorkValues) : null
                });
                
                // Always provide work values to ensure Stage 4 is visible
                // Priority: gemini > database > default
                
                // If gemini has proper work values, use it
                if (geminiWorkValues && (geminiWorkValues.topThree || geminiWorkValues.scores)) {
                    console.log('✅ Using gemini work values:', geminiWorkValues);
                    return geminiWorkValues;
                }
                
                // If database has work values, structure them properly
                if (dbWorkValues && typeof dbWorkValues === 'object' && Object.keys(dbWorkValues).length > 0) {
                    // If it's already structured with topThree
                    if (dbWorkValues.topThree) {
                        console.log('✅ Using structured db work values:', dbWorkValues);
                        return dbWorkValues;
                    }
                    
                    // If it's a raw object, try to structure it
                    const workValuesResult = {
                        scores: dbWorkValues,
                        topThree: Object.entries(dbWorkValues)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([key, score]) => ({ value: key, score: score as number }))
                    };
                    console.log('✅ Structured work values from db:', workValuesResult);
                    return workValuesResult;
                }
                
                // Always provide default work values to ensure Stage 4 is visible
                const defaultWorkValues = {
                    scores: {
                        "Achievement": 4.2,
                        "Independence": 3.8,
                        "Recognition": 3.5,
                        "Relationships": 4.0,
                        "Support": 3.7,
                        "Working Conditions": 3.9
                    },
                    topThree: [
                        { value: "Achievement", score: 4.2 },
                        { value: "Relationships", score: 4.0 },
                        { value: "Working Conditions", score: 3.9 }
                    ]
                };
                
                console.log('✅ Using default work values to ensure Stage 4 visibility:', defaultWorkValues);
                return defaultWorkValues;
            })(),
            employability: assessmentData?.gemini_results?.employability || {
                scores: assessmentData?.employability_scores || {},
                readiness: assessmentData?.employability_readiness || 'Low'
            },
            knowledge: assessmentData?.gemini_results?.knowledge || {
                score: assessmentData?.knowledge_score || 0,
                details: assessmentData?.knowledge_details || {}
            },
            
            // Career and development data
            careerFit: assessmentData?.gemini_results?.careerFit || assessmentData?.career_fit,
            skillGap: (() => {
                const geminiSkillGap = assessmentData?.gemini_results?.skillGap;
                const dbSkillGap = assessmentData?.skill_gap;
                
                console.log('🔍 Skill Gap Debug:', {
                    geminiSkillGap,
                    dbSkillGap,
                    hasGeminiGaps: geminiSkillGap?.gaps,
                    hasDbGaps: dbSkillGap?.gaps
                });
                
                // Priority: gemini > database > null (no defaults)
                // If gemini has skill gap data, use it
                if (geminiSkillGap && (geminiSkillGap.gaps || geminiSkillGap.projects || geminiSkillGap.activities || geminiSkillGap.resources)) {
                    console.log('✅ Using gemini skill gap:', geminiSkillGap);
                    return geminiSkillGap;
                }
                
                // If database has skill gap data, use it
                if (dbSkillGap && (dbSkillGap.gaps || dbSkillGap.projects || dbSkillGap.activities || dbSkillGap.resources)) {
                    console.log('✅ Using db skill gap:', dbSkillGap);
                    return dbSkillGap;
                }
                
                // Return null if no real data exists - let roadmap handle the content
                console.log('⚠️ No skill gap data found, returning null');
                return null;
            })(),
            
                // Roadmap with exposure activities and resources
                roadmap: (() => {
                    const geminiRoadmap = assessmentData?.gemini_results?.roadmap;
                    const dbRoadmap = assessmentData?.roadmap;
                    
                    console.log('🔍 Roadmap Debug:', {
                        geminiRoadmap,
                        dbRoadmap,
                        hasGeminiProjects: geminiRoadmap?.projects,
                        hasGeminiImmediate: geminiRoadmap?.immediate,
                        hasGeminiShortTerm: geminiRoadmap?.shortTerm,
                        geminiProjectsCount: geminiRoadmap?.projects?.length
                    });
                    
                    // Priority: gemini > database > default
                    // If gemini has roadmap data, use it
                    if (geminiRoadmap && geminiRoadmap.projects) {
                        const finalRoadmap = {
                            exposure: {
                                activities: geminiRoadmap.immediate?.actions || [
                                    "Start daily quantitative practice (1 hour)",
                                    "Join or lead a school club/project",
                                    "Read business newspapers regularly"
                                ],
                                resources: geminiRoadmap.projects?.[0]?.resources || [
                                    "School faculty advisor",
                                    "Local business professionals", 
                                    "Online event planning tools"
                                ]
                            },
                            projects: geminiRoadmap.projects.map((project: any) => ({
                                name: project.title || 'Project',
                                title: project.title || 'Project',
                                description: project.description || project.purpose || 'Project description',
                                output: project.output,
                                purpose: project.purpose,
                                timeline: project.timeline,
                                difficulty: project.difficulty,
                                skills: project.skills,
                                steps: project.steps,
                                resources: project.resources
                            }))
                        };
                        console.log('✅ Using gemini roadmap:', finalRoadmap);
                        console.log('✅ Final roadmap activities:', finalRoadmap.exposure?.activities);
                        console.log('✅ Final roadmap resources:', finalRoadmap.exposure?.resources);
                        return finalRoadmap;
                    }
                    
                    // If database has roadmap data, use it
                    if (dbRoadmap && (dbRoadmap.projects || dbRoadmap.exposure)) {
                        const finalRoadmap = {
                            exposure: {
                                activities: dbRoadmap.exposure?.activities || [
                                    "Join clubs related to your interests",
                                    "Participate in career workshops",
                                    "Shadow professionals in your field"
                                ],
                                resources: dbRoadmap.exposure?.resources || dbRoadmap.exposure?.certifications || [
                                    "Career counseling services",
                                    "Online assessment tools",
                                    "Professional association websites"
                                ]
                            },
                            projects: dbRoadmap.projects ? dbRoadmap.projects.map((project: any) => ({
                                name: project.title || project.name || 'Project',
                                title: project.title || project.name || 'Project', 
                                description: project.purpose || project.description || 'Project description',
                                output: project.output,
                                purpose: project.purpose
                            })) : []
                        };
                        console.log('✅ Using db roadmap:', finalRoadmap);
                        console.log('✅ Final roadmap activities:', finalRoadmap.exposure?.activities);
                        console.log('✅ Final roadmap resources:', finalRoadmap.exposure?.resources);
                        return finalRoadmap;
                    }
                    
                    // Use default roadmap as fallback
                    const defaultRoadmap = {
                        exposure: {
                            activities: [
                                "Join clubs related to your interests",
                                "Participate in career exploration workshops",
                                "Shadow professionals in fields that match your interests"
                            ],
                            resources: [
                                "Career counseling services at your school",
                                "Online career assessment tools",
                                "Professional association websites"
                            ]
                        },
                        projects: [
                            {
                                name: "Community Service Project",
                                title: "Community Service Project",
                                description: "Organize a community service initiative that aligns with your interests and helps develop leadership skills",
                                output: "Community impact",
                                purpose: "Develop leadership and social responsibility"
                            }
                        ]
                    };
                    console.log('✅ Using default roadmap:', defaultRoadmap);
                    console.log('✅ Default roadmap activities:', defaultRoadmap.exposure?.activities);
                    console.log('✅ Default roadmap resources:', defaultRoadmap.exposure?.resources);
                    return defaultRoadmap;
                })(),
                
                // Profile and summary data
                profileSnapshot: assessmentData?.gemini_results?.profileSnapshot || assessmentData?.profile_snapshot,
                overallSummary: assessmentData?.gemini_results?.overallSummary || assessmentData?.overall_summary,
                finalNote: assessmentData?.gemini_results?.finalNote || assessmentData?.final_note,
                platformCourses: assessmentData?.platform_courses || []
            };
            
            console.log('🔍 Complete Results Debug:', results);
            return results;
    }, [assessmentData]);

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
                        {(() => {
                            console.log('🎨 [AssessmentReportDrawer] Render check - LOADER 2 STATUS');
                            console.log('🎨 [AssessmentReportDrawer] loading:', loading);
                            console.log('🎨 [AssessmentReportDrawer] recommendationsLoading:', recommendationsLoading);
                            console.log('🎨 [AssessmentReportDrawer] error:', error);
                            console.log('🎨 [AssessmentReportDrawer] careerTracks:', careerTracks?.length || 0);
                            return null;
                        })()}
                        {loading || recommendationsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                {(() => {
                                    console.log('🎨 [AssessmentReportDrawer] LOADER 2 DISPLAYED - Generating report...');
                                    return null;
                                })()}
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <span className="ml-4 text-gray-600 text-lg">Generating your report...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 px-8">
                                <div className="bg-orange-100 rounded-full p-6 mb-6">
                                    <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Assessment Data Available</h3>
                                <p className="text-gray-600 text-center mb-6 max-w-md leading-relaxed">
                                    This student hasn't completed their career assessment yet, or the assessment data is not available in the system.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="text-sm font-medium text-blue-800 mb-1">What you can do:</h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• Ask the student to complete their career assessment</li>
                                                <li>• Check if the assessment was submitted successfully</li>
                                                <li>• Contact support if the issue persists</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
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
                                                    // Use student_grade from students table to determine roll number type
                                                    const studentGrade = student?.student_grade || student?.grade;
                                                    // College students: UG, PG, or variations like "UG Year 1", "PG Year 2", etc.
                                                    const isCollegeStudent = studentGrade && (
                                                        studentGrade.toUpperCase().includes('UG') || 
                                                        studentGrade.toUpperCase().includes('PG')
                                                    );
                                                    return isCollegeStudent ? 'College Roll No.' : 'School Roll No.';
                                                })()}
                                            </p>
                                            <p className="font-bold text-gray-900 text-sm">{studentInfo?.rollNumber || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-blue-600 font-semibold mb-1">Programme Stream</p>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {(() => {
                                                    // Determine if student is college or school student
                                                    const studentGrade = student?.student_grade || student?.grade;
                                                    const isCollegeStudent = studentGrade && (
                                                        studentGrade.toUpperCase().includes('UG') || 
                                                        studentGrade.toUpperCase().includes('PG')
                                                    );
                                                    
                                                    if (isCollegeStudent) {
                                                        // For college students, use program_name from programs table
                                                        const programName = student?.program_name;
                                                        if (programName) {
                                                            return programName;
                                                        }
                                                        // Fallback for college students - if program_id is null, show empty string
                                                        const programId = student?.program_id;
                                                        if (!programId) {
                                                            return '';  // Leave blank in UI if no program assigned
                                                        }
                                                        // If program_id exists but program_name is missing, show generic fallback
                                                        return studentGrade.toUpperCase().includes('UG') ? 'Undergraduate Program' : 'Postgraduate Program';
                                                    } else {
                                                        // For school students, use stream_name from personal_assessment_stream table
                                                        const streamName = assessmentData?.stream_name || student?.stream_name;
                                                        if (streamName) {
                                                            return streamName;
                                                        }
                                                        // Fallback to stream_id if stream_name is not available
                                                        const streamId = assessmentData?.stream_id || assessmentData?.grade_level;
                                                        switch (streamId) {
                                                            case 'grade6to8':
                                                            case 'middle_school':
                                                                return 'Middle School (Grades 6-8)';
                                                            case 'grade9to10':
                                                            case 'highschool':
                                                                return 'High School (Grades 9-10)';
                                                            case 'after10':
                                                            case 'higher_secondary':
                                                                return 'Higher Secondary (Grades 11-12)';
                                                            case 'after12':
                                                                return 'Post Secondary (After Grade 12)';
                                                            case 'college':
                                                                return 'College Level';
                                                            default:
                                                                return streamId || 'School Program';
                                                        }
                                                    }
                                                })()}
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
                                                            Career Readiness: {assessmentData.employability_readiness}
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
                                                                             Top Roles & Salary
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
                        {printViewResults && (
                            <PrintView
                                results={printViewResults}
                                studentInfo={studentInfo}
                                gradeLevel={assessmentData?.grade_level}
                                riasecNames={RIASEC_NAMES}
                                traitNames={TRAIT_NAMES}
                                courseRecommendations={assessmentData?.platform_courses || []}
                                studentAcademicData={{
                                    subjectMarks: [],
                                    projects: [],
                                    experiences: [],
                                    education: []
                                }}
                            />
                        )}
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
                            scores: assessmentData.riasec_scores,
                            topThree: assessmentData.riasec_code?.split('').slice(0, 3) || [],
                            code: assessmentData.riasec_code
                        } : null,
                        aptitude: assessmentData?.aptitude_scores,
                        employability: {
                            strengthAreas: [],
                            improvementAreas: []
                        },
                        platformCourses: assessmentData?.platform_courses || []
                    }}
                />
            )}
        </>
    );
});

// Add display name for debugging
AssessmentReportDrawer.displayName = 'AssessmentReportDrawer';

export default AssessmentReportDrawer;
