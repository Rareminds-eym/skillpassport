import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Target, Briefcase, BookOpen, TrendingUp, CheckCircle, Download, Bell, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { useRoleOverview } from '../../../../hooks/useRoleOverview';
import { matchCoursesForRole } from '../../../../services/aiCareerPathService';
import jsPDF from 'jspdf';

/**
 * Career Track Modal Component
 * Multi-step wizard with VERTICAL sidebar navigation
 * Steps: Role Selection → Overview → Roadmap → Courses → Strengths → Get Started
 */
const CareerTrackModal = ({ selectedTrack, onClose, skillGap, roadmap, results }) => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const [currentPage, setCurrentPage] = useState(0); // 0 = role selection, 1-5 = wizard pages
    const [showReminderModal, setShowReminderModal] = useState(false);
    
    // AI Course Matching State
    const [aiMatchedCourses, setAiMatchedCourses] = useState([]);
    const [courseMatchingLoading, setCourseMatchingLoading] = useState(false);
    const [courseMatchingError, setCourseMatchingError] = useState(null);

    const accentColor = selectedTrack.index === 0 ? '#2563eb' : 
                       selectedTrack.index === 1 ? '#3b82f6' : '#60a5fa';

    const pages = [
        { id: 1, title: 'Overview', subtitle: 'Why You Fit', icon: Target },
        { id: 2, title: 'Roadmap', subtitle: '6-Month Plan', icon: TrendingUp },
        { id: 3, title: 'Courses', subtitle: 'Learn & Grow', icon: BookOpen },
        { id: 4, title: 'Strengths', subtitle: 'Your Plan', icon: Zap },
        { id: 5, title: 'Get Started', subtitle: 'Take Action', icon: ChevronRight }
    ];

    // Handle course click - navigate to course player
    const handleCourseClick = (course) => {
        const courseId = course.course_id || course.id;
        if (courseId) {
            onClose(); // Close the modal first
            navigate(`/student/courses/${courseId}/learn`);
        }
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setCurrentPage(1);
    };

    const goToNextPage = () => {
        if (currentPage < 5) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else if (currentPage === 1) {
            setCurrentPage(0);
            setSelectedRole(null);
        }
    };

    const goToPage = (pageId) => {
        if (pageId <= currentPage || pageId === currentPage + 1) {
            setCurrentPage(pageId);
        }
    };

    // Helper function to get role name
    const getRoleName = (role) => {
        if (typeof role === 'string') return role;
        // Check for 'role' property first (from COURSE_KNOWLEDGE_BASE)
        if (role?.role) return role.role;
        // Fallback to 'name' property (from other sources)
        return role?.name || '';
    };

    // Get AI-generated role overview (responsibilities + industry demand + career progression + learning roadmap + action items + suggested projects) in a single API call
    const { responsibilities, demandData, careerProgression, learningRoadmap, actionItems, suggestedProjects, loading: overviewLoading, error: overviewError } = useRoleOverview(
        selectedRole ? getRoleName(selectedRole) : null,
        selectedTrack.cluster?.title || ''
    );

    // Log error for debugging
    if (overviewError) {
        console.warn('[CareerTrackModal] API error, using fallback data:', overviewError.message);
    }

    // AI-powered course matching - fetch when role is selected and platform courses are available
    useEffect(() => {
        const fetchAIMatchedCourses = async () => {
            if (!selectedRole || !results?.platformCourses || results.platformCourses.length === 0) {
                setAiMatchedCourses([]);
                return;
            }

            const roleName = getRoleName(selectedRole);
            const clusterTitle = selectedTrack.cluster?.title || '';

            setCourseMatchingLoading(true);
            setCourseMatchingError(null);

            try {
                // Prepare courses for AI matching
                const coursesForMatching = results.platformCourses.map(course => ({
                    id: course.course_id || course.id || String(Math.random()),
                    title: course.title || course.name || '',
                    description: course.description || '',
                    skills: course.skills || [],
                    category: course.category || '',
                }));

                console.log(`[CareerTrackModal] Calling AI course matching for: ${roleName}`);
                const matchResult = await matchCoursesForRole(roleName, clusterTitle, coursesForMatching);

                let finalCourses = [];

                if (matchResult.matchedCourseIds && matchResult.matchedCourseIds.length > 0) {
                    // Filter platform courses by matched IDs
                    const matched = results.platformCourses.filter(course => {
                        const courseId = course.course_id || course.id;
                        return matchResult.matchedCourseIds.includes(courseId);
                    });
                    console.log(`[CareerTrackModal] AI matched ${matched.length} courses:`, matchResult.reasoning);
                    finalCourses = matched;
                }

                // ALWAYS ensure we have exactly 4 courses
                finalCourses = ensureFourCourses(finalCourses, roleName, clusterTitle, results.platformCourses);
                setAiMatchedCourses(finalCourses);
            } catch (error) {
                console.error('[CareerTrackModal] AI course matching failed:', error);
                setCourseMatchingError(error);
                // Use fallback on error - still ensure 4 courses
                const roleName = getRoleName(selectedRole);
                const clusterTitle = selectedTrack.cluster?.title || '';
                const fallbackCourses = ensureFourCourses([], roleName, clusterTitle, results.platformCourses);
                setAiMatchedCourses(fallbackCourses);
            } finally {
                setCourseMatchingLoading(false);
            }
        };

        fetchAIMatchedCourses();
    }, [selectedRole, results?.platformCourses, selectedTrack.cluster?.title]);

    // Ensure we ALWAYS return exactly 4 courses
    const ensureFourCourses = (aiMatchedCourses, roleName, clusterTitle, platformCourses) => {
        if (!platformCourses || platformCourses.length === 0) return [];
        
        // If AI already matched 4 or more, return top 4
        if (aiMatchedCourses.length >= 4) {
            return aiMatchedCourses.slice(0, 4);
        }

        // Get IDs of already matched courses to avoid duplicates
        const matchedIds = new Set(aiMatchedCourses.map(c => c.course_id || c.id));
        
        // Get remaining courses not yet matched
        const remainingCourses = platformCourses.filter(c => !matchedIds.has(c.course_id || c.id));
        
        // Score remaining courses for relevance
        const roleNameLower = (roleName || '').toLowerCase();
        const clusterLower = (clusterTitle || '').toLowerCase();
        const isInternOrEntry = roleNameLower.includes('intern') || roleNameLower.includes('trainee') || roleNameLower.includes('junior');
        
        const softSkillKeywords = ['communication', 'excel', 'presentation', 'teamwork', 'leadership', 'soft skill', 'professional', 'workplace', 'essential', 'basic', 'fundamental'];
        const domainKeywords = {
            'technology': ['programming', 'software', 'coding', 'tech', 'computer', 'it', 'digital', 'cyber', 'data'],
            'information technology': ['programming', 'software', 'coding', 'tech', 'computer', 'it', 'digital'],
            'business': ['business', 'management', 'finance', 'marketing', 'excel', 'leadership'],
            'finance': ['finance', 'accounting', 'bookkeeping', 'excel', 'financial'],
            'arts': ['design', 'creative', 'art', 'media'],
            'science': ['research', 'data', 'analysis', 'scientific'],
        };
        
        const scored = remainingCourses.map(course => {
            const text = `${course.title || ''} ${course.description || ''} ${(course.skills || []).join(' ')}`.toLowerCase();
            let score = 0;
            
            // Role keyword matching
            roleNameLower.split(/\s+/).forEach(word => {
                if (word.length > 2 && text.includes(word)) score += 50;
            });
            
            // Domain/cluster matching
            const domainWords = domainKeywords[clusterLower] || [];
            domainWords.forEach(word => {
                if (text.includes(word)) score += 20;
            });
            
            // Soft skills boost for interns/entry-level
            if (isInternOrEntry) {
                softSkillKeywords.forEach(word => {
                    if (text.includes(word)) score += 15;
                });
            }
            
            // Give a small random factor to avoid always showing same courses
            score += Math.random() * 5;
            
            return { ...course, _fillScore: score };
        });
        
        // Sort by score and take what we need to fill up to 4
        const sortedRemaining = scored.sort((a, b) => b._fillScore - a._fillScore);
        const needed = 4 - aiMatchedCourses.length;
        const fillers = sortedRemaining.slice(0, needed);
        
        // Combine AI matches with fillers
        return [...aiMatchedCourses, ...fillers].slice(0, 4);
    };

    // Use AI-matched courses (or empty array while loading)
    const relevantCourses = aiMatchedCourses;

    const getSalary = (role) => {
        if (typeof role === 'object' && role?.salary) {
            return `₹${role.salary.min}L - ₹${role.salary.max}L`;
        }
        return null;
    };

    const RIASEC_NAMES = {
        R: 'Realistic',
        I: 'Investigative',
        A: 'Artistic',
        S: 'Social',
        E: 'Enterprising',
        C: 'Conventional'
    };

    const getRoadmapProjects = () => {
        if (!roadmap?.projects) return [];
        return roadmap.projects.slice(0, 3);
    };

    // Handle enrolling in first relevant course
    const handleEnrollFirstCourse = () => {
        if (relevantCourses.length > 0) {
            const firstCourse = relevantCourses[0];
            const courseId = firstCourse.course_id || firstCourse.id;
            if (courseId) {
                onClose();
                navigate(`/student/courses/${courseId}/learn`);
                return;
            }
        }
        // Fallback to courses page if no relevant course found
        onClose();
        navigate('/student/courses');
    };

    // Generate PDF roadmap
    const handleDownloadRoadmap = () => {
        const doc = new jsPDF();
        const roleName = getRoleName(selectedRole);
        const clusterTitle = selectedTrack.cluster?.title || '';
        
        // Colors
        const primaryColor = [37, 99, 235]; // Blue
        const textColor = [55, 65, 81]; // Gray-700
        const lightGray = [156, 163, 175]; // Gray-400
        
        let yPos = 20;
        
        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Career Roadmap', 20, 25);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${roleName} - ${clusterTitle}`, 20, 33);
        
        yPos = 55;
        
        // Role Overview Section
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Role Overview', 20, yPos);
        yPos += 8;
        
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (responsibilities.length > 0) {
            responsibilities.forEach((resp, idx) => {
                const lines = doc.splitTextToSize(`${idx + 1}. ${resp}`, 170);
                doc.text(lines, 25, yPos);
                yPos += lines.length * 5 + 2;
            });
        }
        
        yPos += 5;
        
        // Industry Demand
        if (demandData) {
            doc.setTextColor(...primaryColor);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Industry Demand', 20, yPos);
            yPos += 8;
            
            doc.setTextColor(...textColor);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Demand Level: ${demandData.demandLevel} (${demandData.demandPercentage}%)`, 25, yPos);
            yPos += 6;
            const demandLines = doc.splitTextToSize(demandData.description, 170);
            doc.text(demandLines, 25, yPos);
            yPos += demandLines.length * 5 + 8;
        }
        
        // Career Progression
        if (careerProgression.length > 0) {
            doc.setTextColor(...primaryColor);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Career Progression', 20, yPos);
            yPos += 8;
            
            doc.setTextColor(...textColor);
            doc.setFontSize(10);
            careerProgression.forEach((stage, idx) => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${idx + 1}. ${stage.title}`, 25, yPos);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...lightGray);
                doc.text(` (${stage.yearsExperience})`, 25 + doc.getTextWidth(`${idx + 1}. ${stage.title}`), yPos);
                doc.setTextColor(...textColor);
                yPos += 6;
            });
            yPos += 5;
        }
        
        // 6-Month Learning Roadmap
        if (learningRoadmap.length > 0) {
            // Check if we need a new page
            if (yPos > 200) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setTextColor(...primaryColor);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('6-Month Learning Roadmap', 20, yPos);
            yPos += 10;
            
            learningRoadmap.forEach((phase, idx) => {
                // Check if we need a new page
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.setTextColor(...primaryColor);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${phase.month}: ${phase.title}`, 25, yPos);
                yPos += 6;
                
                doc.setTextColor(...textColor);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const descLines = doc.splitTextToSize(phase.description, 165);
                doc.text(descLines, 30, yPos);
                yPos += descLines.length * 4 + 3;
                
                if (phase.tasks && phase.tasks.length > 0) {
                    phase.tasks.forEach(task => {
                        doc.text(`• ${task}`, 35, yPos);
                        yPos += 5;
                    });
                }
                yPos += 5;
            });
        }
        
        // Action Items
        if (actionItems.length > 0) {
            if (yPos > 230) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setTextColor(...primaryColor);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Immediate Action Items', 20, yPos);
            yPos += 8;
            
            doc.setTextColor(...textColor);
            doc.setFontSize(10);
            actionItems.forEach((item, idx) => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${idx + 1}. ${item.title}`, 25, yPos);
                yPos += 5;
                doc.setFont('helvetica', 'normal');
                doc.text(item.description, 30, yPos);
                yPos += 7;
            });
        }
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(...lightGray);
            doc.setFontSize(8);
            doc.text(`Generated by Rareminds | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }
        
        // Save the PDF
        const fileName = `${roleName.replace(/\s+/g, '_')}_Career_Roadmap.pdf`;
        doc.save(fileName);
    };

    // Calculate next assessment date (6 months from now)
    const getNextAssessmentDate = () => {
        const today = new Date();
        const nextDate = new Date(today.setMonth(today.getMonth() + 6));
        return nextDate;
    };

    // Format date for display
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Generate ICS file content for calendar
    const generateICSContent = () => {
        const nextDate = getNextAssessmentDate();
        const roleName = getRoleName(selectedRole);
        
        // Format date for ICS (YYYYMMDD)
        const formatICSDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        };
        
        const startDate = formatICSDate(nextDate);
        const uid = `assessment-${Date.now()}@rareminds.com`;
        
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rareminds//Career Assessment//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(new Date())}T000000Z
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${startDate}
SUMMARY:Retake Career Assessment - ${roleName}
DESCRIPTION:Your 6-month career development period is complete! Time to retake the career assessment and track your progress as a ${roleName}.\\n\\nVisit Rareminds to take your assessment.
LOCATION:Rareminds Platform
STATUS:CONFIRMED
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Career Assessment Reminder
TRIGGER:-P1D
END:VALARM
END:VEVENT
END:VCALENDAR`;
    };

    // Download ICS file
    const handleDownloadICS = () => {
        const icsContent = generateICSContent();
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Career_Assessment_Reminder.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowReminderModal(false);
    };

    // Open Google Calendar
    const handleGoogleCalendar = () => {
        const nextDate = getNextAssessmentDate();
        const roleName = getRoleName(selectedRole);
        
        const formatGoogleDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        };
        
        const startDate = formatGoogleDate(nextDate);
        const title = encodeURIComponent(`Retake Career Assessment - ${roleName}`);
        const details = encodeURIComponent(`Your 6-month career development period is complete! Time to retake the career assessment and track your progress as a ${roleName}.\n\nVisit Rareminds to take your assessment.`);
        
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${startDate}&details=${details}`;
        window.open(url, '_blank');
        setShowReminderModal(false);
    };

    // Open Outlook Calendar
    const handleOutlookCalendar = () => {
        const nextDate = getNextAssessmentDate();
        const roleName = getRoleName(selectedRole);
        
        const title = encodeURIComponent(`Retake Career Assessment - ${roleName}`);
        const body = encodeURIComponent(`Your 6-month career development period is complete! Time to retake the career assessment and track your progress as a ${roleName}.`);
        const startDate = nextDate.toISOString();
        
        const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${body}&startdt=${startDate}&allday=true`;
        window.open(url, '_blank');
        setShowReminderModal(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative w-[95vw] h-[90vh] max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden flex"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Left Sidebar - Vertical Steps (only show when in wizard) */}
                {currentPage > 0 && (
                    <div className="w-64 shrink-0 bg-gradient-to-b from-slate-800 to-slate-700 p-6 flex flex-col">
                        {/* Header in sidebar */}
                        <div className="mb-6 pb-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {selectedTrack.index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span 
                                        className="inline-block px-2 py-0.5 text-white text-[10px] font-semibold rounded-full mb-0.5"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {selectedTrack.fitType}
                                    </span>
                                    <h3 className="text-sm font-semibold text-white truncate">
                                        {getRoleName(selectedRole)}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Vertical Steps */}
                        <div className="flex-1 space-y-2">
                            {pages.map((page, idx) => {
                                const Icon = page.icon;
                                const isActive = currentPage === page.id;
                                const isCompleted = currentPage > page.id;
                                const isClickable = page.id <= currentPage || page.id === currentPage + 1;
                                
                                return (
                                    <div key={page.id} className="relative">
                                        <button
                                            onClick={() => isClickable && goToPage(page.id)}
                                            disabled={!isClickable}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                                                isActive 
                                                    ? 'bg-white text-slate-900' 
                                                    : isCompleted
                                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                                        : isClickable
                                                            ? 'bg-white/5 text-white/60 hover:bg-white/10'
                                                            : 'bg-transparent text-white/30 cursor-not-allowed'
                                            }`}
                                        >
                                            <div 
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isActive 
                                                        ? 'bg-slate-900 text-white' 
                                                        : isCompleted
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-white/10'
                                                }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <Icon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${isActive ? 'text-slate-900' : ''}`}>
                                                    {page.title}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-slate-600' : 'text-white/40'}`}>
                                                    {page.subtitle}
                                                </p>
                                            </div>
                                        </button>
                                        
                                        {/* Connector line */}
                                        {idx < pages.length - 1 && (
                                            <div className="absolute left-[1.625rem] top-[3.25rem] w-0.5 h-2 bg-white/10" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Back to roles button */}
                        <button
                            onClick={() => { setCurrentPage(0); setSelectedRole(null); }}
                            className="mt-4 w-full py-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                            ← Change Role
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Content Header - Only for role selection */}
                    {currentPage === 0 && (
                        <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 shrink-0">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {selectedTrack.index + 1}
                                </div>
                                <div>
                                    <span 
                                        className="inline-block px-3 py-1 text-white text-xs font-semibold rounded-full mb-1"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {selectedTrack.fitType}
                                    </span>
                                    <h2 className="text-xl md:text-2xl font-bold text-white">
                                        {selectedTrack.cluster?.title}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
                        {/* Page 0: Role Selection */}
                        {currentPage === 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                        Choose Your Career Role
                                    </h3>
                                    <p className="text-gray-500">
                                        Select a role to view the detailed career roadmap and learning path
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                                    {selectedTrack.specificRoles?.map((role, idx) => {
                                        const roleName = getRoleName(role);
                                        const salary = getSalary(role);
                                        return (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ scale: 1.02, y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleRoleSelect(role)}
                                                className="p-5 rounded-xl bg-white border border-gray-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div 
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                                                        style={{ backgroundColor: accentColor }}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-gray-800 font-semibold mb-1">{roleName}</h4>
                                                        {salary && (
                                                            <p className="text-green-600 text-sm">{salary}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-end text-gray-500 text-sm">
                                                    <span>Explore Role</span>
                                                    <span className="ml-1">→</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Page 1: Role Overview & Why You Fit */}
                        {currentPage === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Role Title & Salary */}
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                        {getRoleName(selectedRole)}
                                    </h3>
                                    {getSalary(selectedRole) && (
                                        <p className="text-green-600 text-lg font-medium">
                                            {getSalary(selectedRole)} per annum
                                        </p>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* What This Role Does */}
                                    <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                        <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5" style={{ color: accentColor }} />
                                            What You'll Do
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                            {selectedTrack.cluster?.whatYoullDo || selectedTrack.cluster?.description || 
                                            `As a ${getRoleName(selectedRole)}, you'll work on exciting projects that match your interests and skills.`}
                                        </p>
                                        <ul className="space-y-2 text-sm text-gray-500">
                                            {overviewLoading ? (
                                                // Loading skeleton
                                                <>
                                                    {[1, 2, 3].map((i) => (
                                                        <li key={i} className="flex items-start gap-2 animate-pulse">
                                                            <div className="w-4 h-4 bg-gray-200 rounded-full mt-0.5 shrink-0" />
                                                            <div className="flex-1 h-4 bg-gray-200 rounded" />
                                                        </li>
                                                    ))}
                                                </>
                                            ) : responsibilities.length > 0 ? (
                                                // Dynamic AI-generated responsibilities
                                                responsibilities.map((responsibility, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <span>{responsibility}</span>
                                                    </li>
                                                ))
                                            ) : (
                                                // Empty state fallback (should rarely happen due to fallback in hook)
                                                <li className="text-gray-400 italic">No responsibilities available</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Why You're a Good Fit */}
                                    <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                        <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <Target className="w-5 h-5" style={{ color: accentColor }} />
                                            Why You're a Good Fit
                                        </h4>
                                        {overviewLoading ? (
                                            // Loading skeleton for visual consistency
                                            <div className="animate-pulse">
                                                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                                                <div className="mb-3">
                                                    <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
                                                    <div className="flex gap-2">
                                                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                                                        <div className="h-6 bg-gray-200 rounded-full w-24" />
                                                        <div className="h-6 bg-gray-200 rounded-full w-16" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="h-3 bg-gray-100 rounded w-28 mb-2" />
                                                    <div className="flex gap-2">
                                                        <div className="h-6 bg-gray-200 rounded-full w-24" />
                                                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                                                        <div className="h-6 bg-gray-200 rounded-full w-28" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                                    {selectedTrack.cluster?.whyItFits || 
                                                    `Based on your assessment, your interests and aptitudes align well with this career path.`}
                                                </p>
                                                
                                                {results?.riasec?.topThree && (
                                                    <div className="mb-3">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Interest Profile</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {results.riasec.topThree.slice(0, 3).map((code, idx) => (
                                                                <span 
                                                                    key={idx}
                                                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                                                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                                                >
                                                                    {RIASEC_NAMES[code] || code}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Aptitude Strengths - check multiple possible locations */}
                                                {(results?.aptitude?.topStrengths?.length > 0 || 
                                                  results?.aptitude?.scores || 
                                                  skillGap?.strengths?.length > 0) && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Your Aptitude Strengths</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {/* Try topStrengths first */}
                                                            {results?.aptitude?.topStrengths?.length > 0 ? (
                                                                results.aptitude.topStrengths.slice(0, 3).map((strength, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                                                                    >
                                                                        {strength}
                                                                    </span>
                                                                ))
                                                            ) : results?.aptitude?.scores ? (
                                                                /* Derive from scores if topStrengths not available */
                                                                Object.entries(results.aptitude.scores)
                                                                    .sort((a, b) => (b[1]?.percentage || 0) - (a[1]?.percentage || 0))
                                                                    .slice(0, 3)
                                                                    .map(([key, value], idx) => (
                                                                        <span 
                                                                            key={idx}
                                                                            className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                                                                        >
                                                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                                                        </span>
                                                                    ))
                                                            ) : skillGap?.strengths?.length > 0 ? (
                                                                /* Fallback to skillGap strengths */
                                                                skillGap.strengths.slice(0, 3).map((strength, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                                                                    >
                                                                        {typeof strength === 'string' ? strength : strength?.skill || 'Strength'}
                                                                    </span>
                                                                ))
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Industry Demand & Career Progression */}
                                <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div className="p-5 rounded-xl bg-green-50 border border-green-200">
                                        <h4 className="text-base font-semibold text-green-700 mb-2 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            Industry Demand
                                        </h4>
                                        {overviewLoading ? (
                                            // Loading skeleton
                                            <div className="animate-pulse">
                                                <div className="h-4 bg-green-200 rounded w-full mb-2" />
                                                <div className="h-4 bg-green-200 rounded w-3/4 mb-3" />
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-green-200 rounded-full" />
                                                    <div className="h-4 w-12 bg-green-200 rounded" />
                                                </div>
                                            </div>
                                        ) : demandData ? (
                                            <>
                                                <p className="text-gray-600 text-sm pt-8 mb-6">
                                                    {demandData.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-green-500 rounded-full transition-all duration-500" 
                                                            style={{ width: `${demandData.demandPercentage}%` }} 
                                                        />
                                                    </div>
                                                    <span className="text-green-600 text-sm font-medium">{demandData.demandLevel}</span>
                                                </div>
                                            </>
                                        ) : (
                                            // Fallback if no data
                                            <>
                                                <p className="text-gray-600 text-sm mb-3">
                                                    High demand in the job market with growing opportunities.
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                                                    </div>
                                                    <span className="text-green-600 text-sm font-medium">High</span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                        <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                                            Career Progression
                                        </h4>
                                        {overviewLoading ? (
                                            // Loading skeleton - vertical list
                                            <div className="space-y-2 animate-pulse">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                                                            <div className="h-2 bg-gray-100 rounded w-1/3" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : careerProgression.length > 0 ? (
                                            // Vertical timeline layout
                                            <div className="space-y-1">
                                                {careerProgression.map((stage, idx) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div 
                                                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                                                                style={{ 
                                                                    backgroundColor: idx === 0 ? '#3b82f6' : 
                                                                                   idx === 1 ? '#60a5fa' : 
                                                                                   idx === 2 ? '#93c5fd' : '#bfdbfe',
                                                                    color: idx >= 2 ? '#1e40af' : 'white'
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </div>
                                                            {idx < careerProgression.length - 1 && (
                                                                <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-1">
                                                            <p className={`text-sm font-medium leading-tight ${idx === 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                                                                {stage.title}
                                                            </p>
                                                            <p className="text-xs text-gray-400">{stage.yearsExperience}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Fallback - vertical list
                                            <div className="space-y-1">
                                                {['Junior', 'Mid-Level', 'Senior', 'Lead'].map((level, idx) => (
                                                    <div key={idx} className="flex items-start gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div 
                                                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                                                                style={{ 
                                                                    backgroundColor: idx === 0 ? '#3b82f6' : 
                                                                                   idx === 1 ? '#60a5fa' : 
                                                                                   idx === 2 ? '#93c5fd' : '#bfdbfe',
                                                                    color: idx >= 2 ? '#1e40af' : 'white'
                                                                }}
                                                            >
                                                                {idx + 1}
                                                            </div>
                                                            {idx < 3 && <div className="w-0.5 h-4 bg-gray-200 mt-1" />}
                                                        </div>
                                                        <div className="flex-1 pb-1">
                                                            <p className={`text-sm font-medium ${idx === 0 ? 'text-gray-800' : 'text-gray-600'}`}>{level}</p>
                                                            <p className="text-xs text-gray-400">{idx === 0 ? '0-2 yrs' : idx === 1 ? '2-5 yrs' : idx === 2 ? '5-8 yrs' : '8+ yrs'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Page 2: 6-Month Learning Roadmap */}
                        {currentPage === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                        6-Month Learning Roadmap
                                    </h3>
                                    <p className="text-gray-500">
                                        Your personalized path to becoming a {getRoleName(selectedRole)}
                                    </p>
                                </div>

                                {overviewLoading ? (
                                    // Loading skeleton for roadmap
                                    <div className="space-y-4 animate-pulse">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                                                    {i < 3 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                                                    <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
                                                    <div className="h-4 bg-gray-100 rounded w-60 mb-3" />
                                                    <div className="p-3 rounded-lg bg-white border border-gray-200">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[1, 2, 3, 4].map((j) => (
                                                                <div key={j} className="h-4 bg-gray-100 rounded" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {(learningRoadmap.length > 0 ? learningRoadmap : [
                                            { month: 'Month 1-2', title: 'Foundation Building', description: 'Learn core concepts and fundamentals', tasks: ['Complete foundational courses', 'Understand key concepts', 'Set up learning environment', 'Join communities'], color: '#22c55e' },
                                            { month: 'Month 3-4', title: 'Skill Development', description: 'Build practical skills through projects', tasks: ['Work on guided projects', 'Practice real-world scenarios', 'Build portfolio piece', 'Get mentor feedback'], color: '#3b82f6' },
                                            { month: 'Month 5-6', title: 'Portfolio & Applications', description: 'Create portfolio and apply for positions', tasks: ['Complete 2-3 portfolio projects', 'Optimize resume & LinkedIn', 'Apply for internships/jobs', 'Prepare for interviews'], color: '#a855f7' }
                                        ]).map((phase, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div 
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                                        style={{ backgroundColor: phase.color }}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    {idx < 2 && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
                                                </div>
                                                <div className="flex-1 pb-4">
                                                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: phase.color }}>{phase.month}</span>
                                                    <h4 className="text-base font-semibold text-gray-800">{phase.title}</h4>
                                                    <p className="text-gray-500 text-sm">{phase.description}</p>
                                                    <div className="mt-2 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                                                        <ul className="grid grid-cols-2 gap-2">
                                                            {phase.tasks.map((task, taskIdx) => (
                                                                <li key={taskIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                                                    <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: phase.color }} />
                                                                    <span>{task}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* AI-Generated Suggested Projects */}
                                {(suggestedProjects?.length > 0 || getRoadmapProjects().length > 0) && (
                                    <div className="mt-6">
                                        <h4 className="text-base font-semibold text-gray-800 mb-3">Suggested Projects</h4>
                                        {overviewLoading ? (
                                            // Loading skeleton for projects
                                            <div className="grid md:grid-cols-3 gap-3 animate-pulse">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="p-4 rounded-lg bg-white border border-gray-200">
                                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                                        <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                                                        <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                                                        <div className="flex gap-2">
                                                            <div className="h-5 bg-gray-100 rounded-full w-16" />
                                                            <div className="h-5 bg-gray-100 rounded-full w-20" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : suggestedProjects?.length > 0 ? (
                                            // AI-generated projects with full details
                                            <div className="grid md:grid-cols-3 gap-3">
                                                {suggestedProjects.map((project, idx) => (
                                                    <div key={idx} className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h5 className="text-gray-800 font-medium text-sm flex-1">{project.title}</h5>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ml-2 ${
                                                                project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                                                project.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {project.difficulty}
                                                            </span>
                                                        </div>
                                                        {project.description && (
                                                            <p className="text-gray-500 text-xs mt-1 line-clamp-3">{project.description}</p>
                                                        )}
                                                        {project.skills?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {project.skills.slice(0, 3).map((skill, sIdx) => (
                                                                    <span key={sIdx} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{skill}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {project.estimatedTime && (
                                                            <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {project.estimatedTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Fallback to roadmap projects if no AI projects
                                            <div className="grid md:grid-cols-3 gap-3">
                                                {getRoadmapProjects().map((project, idx) => (
                                                    <div key={idx} className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                                                        <h5 className="text-gray-800 font-medium text-sm">{project.title}</h5>
                                                        {project.description && (
                                                            <p className="text-gray-500 text-xs mt-1">{project.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Page 3: Recommended Courses */}
                        {currentPage === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                        Recommended Courses
                                    </h3>
                                    <p className="text-gray-500">
                                        AI-matched platform courses for your {getRoleName(selectedRole)} career path
                                    </p>
                                </div>

                                {/* Platform Courses - AI filtered by relevance to role */}
                                <div className="mb-6">
                                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                                        Rareminds Courses
                                        {courseMatchingLoading && (
                                            <span className="flex items-center gap-1 text-xs text-gray-400 font-normal">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Finding best matches...
                                            </span>
                                        )}
                                    </h4>
                                    
                                    {courseMatchingLoading ? (
                                        // Loading skeleton while AI is matching
                                        <div className="grid md:grid-cols-2 gap-4 animate-pulse">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="p-4 rounded-xl bg-white border border-gray-200">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                                            <div className="h-3 bg-gray-100 rounded w-1/4" />
                                                        </div>
                                                        <div className="h-6 bg-gray-200 rounded w-16" />
                                                    </div>
                                                    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                                                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-3" />
                                                    <div className="flex gap-2">
                                                        <div className="h-5 bg-gray-100 rounded w-16" />
                                                        <div className="h-5 bg-gray-100 rounded w-20" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : relevantCourses.length > 0 ? (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {relevantCourses.map((course, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => handleCourseClick(course)}
                                                    className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h5 className="text-gray-800 font-semibold text-sm">{course.title || course.name}</h5>
                                                            {course.duration && <p className="text-gray-500 text-xs mt-1">{course.duration}</p>}
                                                        </div>
                                                        {course.level && (
                                                            <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                                                                course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                                                                course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                                course.level === 'Advanced' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-purple-100 text-purple-700'
                                                            }`}>
                                                                {course.level}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {course.description && <p className="text-gray-500 text-xs mt-2 line-clamp-2">{course.description}</p>}
                                                    {course.skills && course.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {course.skills.slice(0, 3).map((skill, sIdx) => (
                                                                <span key={sIdx} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{skill}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="mt-3 flex items-center justify-end text-xs text-blue-600 font-medium">
                                                        <span>Start Learning</span>
                                                        <ChevronRight className="w-3 h-3 ml-1" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : !results?.platformCourses || results.platformCourses.length === 0 ? (
                                        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center">
                                            <p className="text-gray-500 text-sm">
                                                No platform courses available yet. Check back soon!
                                            </p>
                                        </div>
                                    ) : (
                                        // This shouldn't happen since we always ensure 4 courses, but just in case
                                        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center">
                                            <p className="text-gray-500 text-sm">
                                                Loading courses...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Page 4: Strengths & Growth Plan */}
                        {currentPage === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                        Your Strengths & Growth Plan
                                    </h3>
                                    <p className="text-gray-500">
                                        Personalized insights based on your assessment results
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div className="p-5 rounded-xl bg-green-50 border border-green-200">
                                        <h4 className="text-base font-semibold text-green-700 mb-3 flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Strengths to Leverage
                                        </h4>
                                        <ul className="space-y-2">
                                            {(() => {
                                                // Try multiple sources for strengths
                                                let strengths = [];
                                                
                                                if (skillGap?.strengths?.length > 0) {
                                                    strengths = skillGap.strengths;
                                                } else if (results?.aptitude?.topStrengths?.length > 0) {
                                                    strengths = results.aptitude.topStrengths;
                                                } else if (results?.aptitude?.scores) {
                                                    // Derive from aptitude scores
                                                    strengths = Object.entries(results.aptitude.scores)
                                                        .sort((a, b) => (b[1]?.percentage || 0) - (a[1]?.percentage || 0))
                                                        .slice(0, 4)
                                                        .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1) + ' Reasoning');
                                                } else if (results?.employability?.strengthAreas?.length > 0) {
                                                    strengths = results.employability.strengthAreas;
                                                } else {
                                                    // Fallback
                                                    strengths = ['Analytical thinking', 'Problem solving', 'Communication', 'Adaptability'];
                                                }
                                                
                                                return strengths.slice(0, 4).map((strength, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        {typeof strength === 'string' ? strength : strength?.skill || strength?.name || 'Strength'}
                                                    </li>
                                                ));
                                            })()}
                                        </ul>
                                    </div>

                                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
                                        <h4 className="text-base font-semibold text-amber-700 mb-3 flex items-center gap-2">
                                            <Target className="w-5 h-5" />
                                            Skills to Develop
                                        </h4>
                                        <ul className="space-y-2">
                                            {(() => {
                                                // Try multiple sources for skills to develop
                                                let skills = [];
                                                
                                                if (skillGap?.priorityA?.length > 0) {
                                                    skills = skillGap.priorityA;
                                                } else if (skillGap?.priorityB?.length > 0) {
                                                    skills = skillGap.priorityB;
                                                } else if (results?.aptitude?.areasToImprove?.length > 0) {
                                                    skills = results.aptitude.areasToImprove;
                                                } else if (results?.employability?.improvementAreas?.length > 0) {
                                                    skills = results.employability.improvementAreas;
                                                } else {
                                                    // Fallback
                                                    skills = [
                                                        { skill: 'Technical skills' }, 
                                                        { skill: 'Industry knowledge' }, 
                                                        { skill: 'Practical experience' },
                                                        { skill: 'Networking' }
                                                    ];
                                                }
                                                
                                                return skills.slice(0, 4).map((item, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                        {typeof item === 'string' ? item : item?.skill || item?.name || 'Skill'}
                                                    </li>
                                                ));
                                            })()}
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm mb-6">
                                    <h4 className="text-base font-semibold text-gray-800 mb-4">Immediate Action Items</h4>
                                    {overviewLoading ? (
                                        // Loading skeleton
                                        <div className="grid md:grid-cols-2 gap-4 animate-pulse">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-gray-200 shrink-0" />
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                                                        <div className="h-3 bg-gray-100 rounded w-32" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {(actionItems.length > 0 ? actionItems : [
                                                { title: 'Start Learning', description: 'Enroll in foundational course' },
                                                { title: 'Build Daily Habits', description: 'Dedicate 1-2 hours daily' },
                                                { title: 'Join Communities', description: 'Connect with others in your field' },
                                                { title: 'Track Progress', description: 'Set weekly goals and review' }
                                            ]).map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: accentColor }}>{idx + 1}</div>
                                                    <div>
                                                        <h5 className="text-gray-800 font-medium text-sm">{item.title}</h5>
                                                        <p className="text-gray-500 text-xs">{item.description || item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                    <h4 className="text-base font-semibold text-gray-800 mb-3">Development Timeline</h4>
                                    {overviewLoading ? (
                                        // Loading skeleton
                                        <div className="flex items-center justify-between text-sm animate-pulse">
                                            <div className="text-center">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 mx-auto mb-1" />
                                                <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                                            </div>
                                            <div className="flex-1 h-1 bg-gray-200 mx-3 rounded-full" />
                                            <div className="text-center">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 mx-auto mb-1" />
                                                <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                                            </div>
                                            <div className="flex-1 h-1 bg-gray-200 mx-3 rounded-full" />
                                            <div className="text-center">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 mx-auto mb-1" />
                                                <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="text-center max-w-[80px]">
                                                <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-1" />
                                                <span className="text-gray-700 font-medium text-xs block truncate">
                                                    {learningRoadmap[0]?.title || 'Foundation'}
                                                </span>
                                                <span className="text-gray-400 text-[10px]">{learningRoadmap[0]?.month || 'Month 1-2'}</span>
                                            </div>
                                            <div className="flex-1 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-2 rounded-full" />
                                            <div className="text-center max-w-[80px]">
                                                <div className="w-4 h-4 rounded-full bg-blue-400 mx-auto mb-1" />
                                                <span className="text-gray-600 text-xs block truncate">
                                                    {learningRoadmap[1]?.title || 'Development'}
                                                </span>
                                                <span className="text-gray-400 text-[10px]">{learningRoadmap[1]?.month || 'Month 3-4'}</span>
                                            </div>
                                            <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-2 rounded-full" />
                                            <div className="text-center max-w-[80px]">
                                                <div className="w-4 h-4 rounded-full bg-purple-400 mx-auto mb-1" />
                                                <span className="text-gray-500 text-xs block truncate">
                                                    {learningRoadmap[2]?.title || 'Portfolio'}
                                                </span>
                                                <span className="text-gray-400 text-[10px]">{learningRoadmap[2]?.month || 'Month 5-6'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Page 5: Get Started (CTA) */}
                        {currentPage === 5 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center justify-center min-h-[60vh]"
                            >
                                <div className="mb-6 text-center">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                                        Ready to Begin Your Journey?
                                    </h3>
                                    <p className="text-gray-500">
                                        Take the first step towards becoming a {getRoleName(selectedRole)}
                                    </p>
                                </div>

                                <div className="max-w-xl w-full">
                                    <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 mb-6">
                                        <div className="flex items-center justify-left gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: accentColor }}>
                                                {selectedTrack.index + 1}
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-xl font-bold text-gray-800">{getRoleName(selectedRole)}</h4>
                                                {getSalary(selectedRole) && <p className="text-green-600 text-base">{getSalary(selectedRole)} per annum</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-blue-700">6</p>
                                                <p className="text-gray-500 text-xs">Months</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-blue-700">{relevantCourses.length || 4}</p>
                                                <p className="text-gray-500 text-xs">Courses</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-blue-700">{getRoadmapProjects().length || 3}</p>
                                                <p className="text-gray-500 text-xs">Projects</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                                            style={{ backgroundColor: accentColor }}
                                            onClick={handleEnrollFirstCourse}
                                        >
                                            <BookOpen className="w-5 h-5" />
                                            {relevantCourses.length > 0 
                                                ? `Start: ${relevantCourses[0]?.title || relevantCourses[0]?.name || 'First Course'}`
                                                : 'Browse Courses'
                                            }
                                        </motion.button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleDownloadRoadmap}
                                                className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Roadmap
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setShowReminderModal(true)}
                                                className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm"
                                            >
                                                <Bell className="w-4 h-4" />
                                                Set Reminder
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Reminder Modal */}
                    <AnimatePresence>
                        {showReminderModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
                                onClick={() => setShowReminderModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Set Assessment Reminder</h3>
                                        <button 
                                            onClick={() => setShowReminderModal(false)}
                                            className="p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                                            <Calendar className="w-10 h-10 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-gray-600">Next assessment available on:</p>
                                                <p className="text-lg font-semibold text-blue-700">{formatDate(getNextAssessmentDate())}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            You can retake the assessment after 6 months to track your career progress
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleGoogleCalendar}
                                            className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#EA4335" d="M12 11v2h3.5c-.2 1.1-1.2 3-3.5 3-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8c1.2 0 2 .5 2.5 1l1.7-1.7C15 6.6 13.6 6 12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6c3.5 0 5.8-2.4 5.8-5.9 0-.4 0-.7-.1-1H12z"/>
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-medium">Add to Google Calendar</span>
                                        </button>
                                        
                                        <button
                                            onClick={handleOutlookCalendar}
                                            className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#0078D4" d="M21.5 3h-19C1.67 3 1 3.67 1 4.5v15c0 .83.67 1.5 1.5 1.5h19c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zM8 17H4v-4h4v4zm0-6H4V7h4v4zm6 6h-4v-4h4v4zm0-6h-4V7h4v4zm6 6h-4v-4h4v4zm0-6h-4V7h4v4z"/>
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 font-medium">Add to Outlook Calendar</span>
                                        </button>
                                        
                                        <button
                                            onClick={handleDownloadICS}
                                            className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Download className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <span className="text-gray-700 font-medium">Download .ics File</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Navigation - Only show when in wizard */}
                    {currentPage > 0 && (
                        <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
                            <div className="flex items-center justify-between">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={goToPrevPage}
                                    className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <span>←</span>
                                    <span>Previous</span>
                                </motion.button>

                                {currentPage < 5 ? (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={goToNextPage}
                                        className="px-5 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <span>Next</span>
                                        <span>→</span>
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className="px-5 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 text-sm"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <span>Complete</span>
                                        <span>✓</span>
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CareerTrackModal;
