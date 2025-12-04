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
        studentInfo,
        handleRetry,
        validateResults,
        navigate
    } = useAssessmentResults();

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
            <style>{PRINT_STYLES}</style>

            {/* Print View - Simple document format for PDF */}
            <PrintView
                results={results}
                studentInfo={studentInfo}
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
                                onClick={() => window.print()}
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Assessment Summary</h2>
                        <p className="text-gray-500 text-center mb-8">Click on any section to view detailed insights</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SummaryCard
                                title="Profile Snapshot"
                                subtitle="Your core characteristics"
                                icon={Target}
                                gradient="from-indigo-500 to-blue-600"
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
                                gradient="from-emerald-500 to-teal-600"
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
                                gradient="from-amber-500 to-orange-600"
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
                                gradient="from-purple-500 to-pink-600"
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
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Rocket className="w-5 h-5" />
                                <h4 className="font-bold text-lg">Overall Career Direction</h4>
                            </div>
                            <p className="text-white/90 text-lg leading-relaxed italic">"{results.overallSummary}"</p>
                        </div>
                    </div>
                </div>

                {/* Detail Modal */}
                <Dialog open={activeSection !== null} onOpenChange={() => setActiveSection(null)}>
                    <DialogContent className="max-w-7xl max-h-[95vh] p-0 gap-0 overflow-hidden">
                        {/* Fixed Header */}
                        <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
                            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                                {activeSection === 'profile' && (
                                    <>
                                        <Target className="w-8 h-8 text-indigo-600" />
                                        Student Profile Snapshot
                                    </>
                                )}
                                {activeSection === 'career' && (
                                    <>
                                        <Briefcase className="w-8 h-8 text-emerald-600" />
                                        Career Fit Results
                                    </>
                                )}
                                {activeSection === 'skills' && (
                                    <>
                                        <Zap className="w-8 h-8 text-amber-600" />
                                        Skill Gap & Development Plan
                                    </>
                                )}
                                {activeSection === 'roadmap' && (
                                    <>
                                        <Rocket className="w-8 h-8 text-purple-600" />
                                        6-12 Month Action Roadmap
                                    </>
                                )}
                            </DialogTitle>
                            <p className="text-gray-500 text-sm mt-2">Detailed assessment insights and recommendations</p>
                        </DialogHeader>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto max-h-[calc(95vh-140px)] px-8 py-6">
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
                                <SkillsSection skillGap={skillGap} employability={employability} />
                            )}
                            {activeSection === 'roadmap' && roadmap && (
                                <RoadmapSection roadmap={roadmap} />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default AssessmentResult;
