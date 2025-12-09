import { useState } from 'react';
import {
    Target,
    Briefcase,
    Zap,
    Rocket,
    Download,
    AlertCircle,
    RefreshCw,
    ArrowLeft
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
 * Assessment Result Page
 * Displays comprehensive career assessment results with modular components
 */
const AssessmentResult = () => {
    const [activeSection, setActiveSection] = useState(null);
    
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
                <div className="max-w-6xl mx-auto mb-8">
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
                <div className="max-w-6xl mx-auto print:max-w-none print-container">
                    {/* Header Section */}
                    <ReportHeader studentInfo={studentInfo} />

                    {/* Summary Grid */}
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
                    </div>

                    {/* Overall Summary Banner */}
                    <div className="bg-slate-800 rounded-2xl p-6 text-white">
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
                </div>

                {/* Detail Modal */}
                <Dialog open={activeSection !== null} onOpenChange={() => setActiveSection(null)}>
                    <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] !p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                        {/* Header */}
                        <DialogHeader className="bg-slate-800 px-8 py-6">
                            <DialogTitle asChild>
                                <div className="flex items-center gap-4">
                                    {activeSection === 'profile' && (
                                        <>
                                            <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                                <Target className="w-8 h-8 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white">Student Profile Snapshot - Your interests, aptitudes & personality</h2>
                                        </>
                                    )}
                                    {activeSection === 'career' && (
                                        <>
                                            <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                                <Briefcase className="w-8 h-8 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white">Career Fit Results - Best-matching career paths for you</h2>
                                        </>
                                    )}
                                    {activeSection === 'skills' && (
                                        <>
                                            <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                                <Zap className="w-8 h-8 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white">Skill Gap & Development - Skills to build for career success</h2>
                                        </>
                                    )}
                                    {activeSection === 'roadmap' && (
                                        <>
                                            <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                                                <Rocket className="w-8 h-8 text-white" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white">Action Roadmap - Your 6-12 month career plan</h2>
                                        </>
                                    )}
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto max-h-[calc(95vh-100px)] bg-gray-50">
                            <div className="p-6">
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
                </Dialog>
            </div>
        </>
    );
};

export default AssessmentResult;
