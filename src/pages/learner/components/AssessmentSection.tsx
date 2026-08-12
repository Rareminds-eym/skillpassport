/**
 * AssessmentSection Component
 * 
 * Assessment card from previous dashboard
 * Shows assessment status and Career AI Tools
 */

import {
    ClipboardList,
    ChevronRight,
    Eye,
    Clock,
    Sparkles,
    CheckCircle,
    Rocket,
    Briefcase,
    Target,
    BookOpen,
    FileText,
    GraduationCap,
    TrendingUp,
    Users2,
    Lightbulb,
    MoreVertical,
    Trash2
} from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/ui';
import {
    useHasAssessment,
    useHasInProgressAssessment,
    useLatestAttemptId,
    useLearnerId
} from '@/shared/model/learnerStore';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('AssessmentSection');

const AssessmentSection = () => {
    const navigate = useNavigate();
    const hasAssessment = useHasAssessment();
    const hasInProgressAssessment = useHasInProgressAssessment();
    const latestAttemptId = useLatestAttemptId();
    const learnerId = useLearnerId();

    return (
        <Card
            data-tour="assessment-card"
            className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm"
        >
            <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 rounded-t-xl">
                <div className="flex items-center w-full justify-between">
                    <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="p-2 rounded-lg bg-blue-600">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-800">
                            Assessment
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10">
                            <DotLottieReact
                                src="/animations/assessment.lottie"
                                loop
                                autoplay
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        {/* DEV ONLY: Menu with Clear Assessment option */}
                        {import.meta.env.DEV && hasAssessment && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 rounded-md hover:bg-blue-100 transition-colors">
                                        <MoreVertical className="w-5 h-5 text-gray-500" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg">
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            if (!learnerId) return;
                                            if (!window.confirm('DEV: Are you sure you want to clear your assessment data? This will delete all your assessment results.')) return;

                                            try {
                                                await apiPost('/learner-pages/actions', { action: 'clear-assessment-data', learnerId });

                                                localStorage.removeItem('assessment_gemini_results');
                                                localStorage.removeItem('assessment_section_timings');

                                                alert('Assessment data cleared! Refreshing page...');
                                                window.location.reload();
                                            } catch (err) {
                                                logger.error('Error clearing assessment:', err);
                                                alert('Failed to clear assessment: ' + err.message);
                                            }
                                        }}
                                        className="text-red-600 hover:bg-red-50 cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        🧪 Clear Assessment
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
                <p className="text-gray-900 text-base leading-normal font-medium">
                    {hasAssessment
                        ? "You've completed your assessment! View your personalized career insights and recommendations."
                        : hasInProgressAssessment
                            ? "You have an assessment in progress. Continue where you left off to get your personalized career roadmap."
                            : "Take our comprehensive assessment to discover your strengths and get a personalized career roadmap."
                    }
                </p>

                <div className="flex justify-center py-4">
                    {(() => {
                        if (hasAssessment) {
                            return (
                                <Button
                                    onClick={() => navigate(latestAttemptId ? `/learner/assessment/result?attemptId=${latestAttemptId}` : "/learner/assessment/result")}
                                    className="w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
                                >
                                    <Eye className="w-5 h-5 mr-2" />
                                    View Results
                                </Button>
                            );
                        } else if (hasInProgressAssessment) {
                            return (
                                <Button
                                    onClick={() => navigate("/learner/assessment/test")}
                                    className="w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
                                >
                                    <Clock className="w-5 h-5 mr-2" />
                                    Continue Assessment
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            );
                        } else {
                            return (
                                <Button
                                    onClick={() => navigate("/learner/assessment/test")}
                                    className="w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
                                >
                                    Start Assessment
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            );
                        }
                    })()}
                </div>

                {/* Conditional content below Start Assessment button */}
                {!hasAssessment ? (
                    // Show detailed assessment info when NOT completed
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                        <p className="text-gray-900 text-sm leading-relaxed mb-4 font-medium">
                            Take this comprehensive assessment to uncover your strengths, identify areas for growth, and explore potential opportunities tailored to you. Gain insights that can help guide your learning, career, or personal development journey.
                        </p>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 rounded-lg p-5 mb-4 shadow-sm">
                            <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                Why Take This Assessment?
                            </h4>
                            <ul className="space-y-3 text-sm text-gray-900">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">Understand your unique strengths and skills</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">Identify opportunities for growth and improvement</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">Get insights that can help guide your career or personal goals</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-sm text-gray-900 italic font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                            💡 It's simple, quick, and tailored just for you—discover more about yourself today!
                        </p>
                    </div>
                ) : (
                    // Show Career AI Tools when assessment completed
                    <div className="mt-6 pt-6 border-t-2 border-gray-200">
                        <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-blue-600" />
                            Career AI Tools
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'What jobs match my skills and experience?' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Find Jobs</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'Analyze my skill gaps for my target career' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Target className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Skill Gap Analysis</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'Help me prepare for upcoming interviews' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Interview Prep</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'Review my resume and suggest improvements?' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Resume Review</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'Create a learning roadmap for my career goals' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Learning Path</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'What career paths are best suited for me?' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Career Guidance</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'Give me networking strategies for my field' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Users2 className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Networking Tips</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>

                            <button
                                onClick={() => navigate("/learner/career-ai", { state: { query: 'I need career advice and guidance' } })}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg p-4 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex items-center gap-2"
                            >
                                <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Lightbulb className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-sm flex-1">Career Advice</span>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AssessmentSection;
