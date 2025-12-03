import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Compass,
    Target,
    TrendingUp,
    Award,
    BookOpen,
    CheckCircle,
    Star,
    Zap,
    Brain,
    Heart,
    Briefcase,
    Download,
    AlertCircle,
    RefreshCw,
    Rocket,
    Sparkles,
    GraduationCap,
    ArrowLeft,
    ChevronRight,
    Users,
    Lightbulb,
    Trophy,
    Calendar,
    FileCheck,
    Layers
} from 'lucide-react';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { Badge } from '../../components/Students/components/ui/badge';
import { Button } from '../../components/Students/components/ui/button';
import {
    getSkillLevel
} from './assessment-data/scoringUtils';

// Import Gemini service
import { analyzeAssessmentWithGemini } from '../../services/geminiAssessmentService';
import { riasecQuestions } from './assessment-data/riasecQuestions';
import { bigFiveQuestions } from './assessment-data/bigFiveQuestions';
import { workValuesQuestions } from './assessment-data/workValuesQuestions';
import { employabilityQuestions } from './assessment-data/employabilityQuestions';
import { streamKnowledgeQuestions } from './assessment-data/streamKnowledgeQuestions';

// Animated Progress Ring Component
const ProgressRing = ({ value, size = 80, strokeWidth = 8, color = "#6366f1" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-gray-200"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color }}>{value}%</span>
            </div>
        </div>
    );
};

// Section Header Component
const SectionHeader = ({ icon: Icon, title, subtitle, gradient = "from-indigo-600 to-purple-600" }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, color = "indigo" }) => {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100"
    };

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
            <div>
                <p className="text-xs font-medium opacity-70">{label}</p>
                <p className="font-semibold text-sm">{value}</p>
            </div>
        </div>
    );
};

const AssessmentResult = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    const loadResults = async () => {
        setLoading(true);
        setError(null);

        const answersJson = localStorage.getItem('assessment_answers');
        const geminiResultsJson = localStorage.getItem('assessment_gemini_results');
        const stream = localStorage.getItem('assessment_stream');

        if (!answersJson) {
            navigate('/student/assessment/test');
            return;
        }

        if (geminiResultsJson) {
            try {
                const geminiResults = JSON.parse(geminiResultsJson);
                if (geminiResults.careerFit) {
                    setResults(geminiResults);
                    setLoading(false);
                    return;
                }
                console.log('Old result format detected, re-analyzing...');
            } catch (e) {
                console.error('Error parsing Gemini results:', e);
            }
        }

        if (stream) {
            try {
                const answers = JSON.parse(answersJson);
                const questionBanks = {
                    riasecQuestions,
                    bigFiveQuestions,
                    workValuesQuestions,
                    employabilityQuestions,
                    streamKnowledgeQuestions
                };

                const geminiResults = await analyzeAssessmentWithGemini(answers, stream, questionBanks);

                if (geminiResults) {
                    localStorage.setItem('assessment_gemini_results', JSON.stringify(geminiResults));
                    setResults(geminiResults);
                    setLoading(false);
                    return;
                } else {
                    throw new Error('AI analysis returned no results');
                }
            } catch (e) {
                console.error('Gemini analysis failed:', e);
                setError(e.message || 'Failed to analyze assessment with AI. Please try again.');
                setLoading(false);
                return;
            }
        }

        setError('No AI analysis results found. Please retake the assessment.');
        setLoading(false);
    };

    const handleRetry = async () => {
        setRetrying(true);
        localStorage.removeItem('assessment_gemini_results');
        await loadResults();
        setRetrying(false);
    };

    useEffect(() => {
        loadResults();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Generating Your Report</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Our AI is analyzing your profile to create a comprehensive 4-page career report...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                    <CardContent className="pt-10 pb-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                            <AlertCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Analysis Error</h2>
                        <p className="text-gray-600 mb-8">{error}</p>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleRetry}
                                disabled={retrying}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full h-12 text-base shadow-lg"
                            >
                                {retrying ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2" />
                                        Try Again
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/student/assessment/test')}
                                className="h-12 text-base"
                            >
                                Retake Assessment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!results) return null;

    const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, finalNote, profileSnapshot } = results;

    // Validate if all required data sections are present
    const validateResults = () => {
        const missingFields = [];
        
        if (!riasec || !riasec.topThree || riasec.topThree.length === 0) missingFields.push('RIASEC Interests');
        if (!bigFive || typeof bigFive.O === 'undefined') missingFields.push('Big Five Personality');
        if (!workValues || !workValues.topThree || workValues.topThree.length === 0) missingFields.push('Work Values');
        if (!employability || !employability.strengthAreas) missingFields.push('Employability Skills');
        if (!knowledge || typeof knowledge.score === 'undefined') missingFields.push('Knowledge Assessment');
        if (!careerFit || !careerFit.clusters || careerFit.clusters.length === 0) missingFields.push('Career Fit');
        if (!skillGap || !skillGap.priorityA) missingFields.push('Skill Gap Analysis');
        if (!roadmap || !roadmap.projects) missingFields.push('Action Roadmap');
        if (!finalNote) missingFields.push('Final Recommendations');
        
        return missingFields;
    };

    const missingFields = validateResults();
    const hasIncompleteData = missingFields.length > 0;

    const riasecNames = {
        R: 'Realistic',
        I: 'Investigative',
        A: 'Artistic',
        S: 'Social',
        E: 'Enterprising',
        C: 'Conventional'
    };

    const riasecColors = {
        R: '#ef4444',
        I: '#8b5cf6',
        A: '#f59e0b',
        S: '#10b981',
        E: '#3b82f6',
        C: '#6366f1'
    };

    const traitNames = {
        O: 'Openness',
        C: 'Conscientiousness',
        E: 'Extraversion',
        A: 'Agreeableness',
        N: 'Neuroticism'
    };

    const traitColors = {
        O: '#8b5cf6',
        C: '#10b981',
        E: '#f59e0b',
        A: '#ec4899',
        N: '#6366f1'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8 px-4 print:bg-white print:p-0">
            {/* Floating Action Bar */}
            <div className="max-w-6xl mx-auto mb-8 print:hidden">
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
                <div className="max-w-6xl mx-auto mb-6 print:hidden">
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
            <div className="max-w-6xl mx-auto print:max-w-none">

                {/* ==================== PAGE 1: Student Profile Snapshot ==================== */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 print:shadow-none print:rounded-none print:mb-0 print:break-after-page">
                    {/* Header with Gradient */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 left-4 w-20 h-20 border border-white/30 rounded-full"></div>
                            <div className="absolute top-12 right-12 w-32 h-32 border border-white/20 rounded-full"></div>
                            <div className="absolute bottom-4 left-1/3 w-16 h-16 border border-white/25 rounded-full"></div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-5 h-5" />
                                        <span className="text-indigo-200 text-sm font-medium">AI-Powered Assessment</span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-1">Career Profiling & Skill</h1>
                                    <h1 className="text-3xl md:text-4xl font-bold">Development Report</h1>
                                    <p className="text-indigo-200 mt-2 text-lg">4th Semester Analysis</p>
                                </div>
                                <img src="/logo.png" alt="SkillPassport" className="h-14 opacity-90 hidden md:block" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        </div>
                    </div>

                    {/* Student Info Cards */}
                    <div className="p-8 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <InfoCard icon={Users} label="Student Name" value={localStorage.getItem('studentName') || '—'} color="indigo" />
                            <InfoCard icon={FileCheck} label="Register No." value={localStorage.getItem('studentRegNo') || '—'} color="purple" />
                            <InfoCard icon={GraduationCap} label="Programme/Stream" value={(localStorage.getItem('assessment_stream') || '—').toUpperCase()} color="emerald" />
                            <InfoCard icon={Briefcase} label="College" value={localStorage.getItem('collegeName') || '—'} color="amber" />
                            <InfoCard icon={Calendar} label="Assessment Date" value={new Date().toLocaleDateString()} color="rose" />
                            <InfoCard icon={Brain} label="Assessor" value="SkillPassport AI" color="indigo" />
                        </div>
                    </div>

                    {/* Profile Snapshot Content */}
                    <div className="p-8">
                        <SectionHeader icon={Target} title="Student Profile Snapshot" subtitle="Summary of your key assessment findings" gradient="from-indigo-500 to-blue-600" />

                        {/* Key Findings Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* RIASEC Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                        <Compass className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Top Interest Themes (RIASEC)</h3>
                                </div>
                                <div className="space-y-3">
                                    {riasec.topThree.map((code, idx) => (
                                        <div key={code} className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                                            <div 
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: riasecColors[code] }}
                                            >
                                                {code}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{riasecNames[code]}</p>
                                                <p className="text-xs text-gray-500">Code {idx + 1}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Aptitude Strengths Card */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Aptitude Strengths (Top 2)</h3>
                                </div>
                                <div className="space-y-3">
                                    {profileSnapshot?.aptitudeStrengths ? (
                                        profileSnapshot.aptitudeStrengths.map((strength, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white/70 rounded-xl p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{strength.name}</span>
                                                </div>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-0">P{strength.percentile}</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between bg-white/70 rounded-xl p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">1</div>
                                                    <span className="font-semibold text-gray-800">Stream Knowledge</span>
                                                </div>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-0">{knowledge.score}%</Badge>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/70 rounded-xl p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">2</div>
                                                    <span className="font-semibold text-gray-800">{knowledge.strongTopics[0] || 'General Aptitude'}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Personality Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Personality Highlights (Big Five)</h3>
                                </div>
                                <div className="space-y-2">
                                    {['O', 'C', 'E', 'A', 'N'].map(trait => {
                                        const score = bigFive[trait] || 0;
                                        const level = getSkillLevel(score);
                                        // Convert 0-5 scale to percentage for progress bar (0-5 → 0-100%)
                                        const percentage = (score / 5) * 100;
                                        return (
                                            <div key={trait} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                                                <span className="text-sm font-medium text-gray-700">{traitNames[trait]}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${percentage}%`, backgroundColor: traitColors[trait] }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600 w-12">{level.level}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Work Values Card */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                                        <Star className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Top Work Values / Ambition Drivers</h3>
                                </div>
                                <div className="space-y-3">
                                    {workValues.topThree.map((val, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <Trophy className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <span className="font-semibold text-gray-800">{val.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Overall Career Direction */}
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
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

                        {/* Interpretation Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">What This Means For You</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                                    <Compass className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Interests</p>
                                        <p className="text-gray-600 text-sm">The kind of work environments you naturally enjoy</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Aptitude</p>
                                        <p className="text-gray-600 text-sm">Areas you may learn quickly and perform strongly in</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                                    <Heart className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Personality</p>
                                        <p className="text-gray-600 text-sm">Your preferred work style and approach</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                                    <Star className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Values</p>
                                        <p className="text-gray-600 text-sm">What will keep you motivated long-term</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-800 mb-4">Your Key Patterns</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Enjoyment pattern', value: profileSnapshot?.keyPatterns?.enjoyment || riasec.interpretation, color: 'blue' },
                                        { label: 'Strength pattern', value: profileSnapshot?.keyPatterns?.strength || `Strong in ${knowledge.strongTopics.join(', ')}`, color: 'emerald' },
                                        { label: 'Work-style pattern', value: profileSnapshot?.keyPatterns?.workStyle || bigFive.workStyleSummary, color: 'purple' },
                                        { label: 'Motivation pattern', value: profileSnapshot?.keyPatterns?.motivation || workValues.motivationSummary, color: 'amber' }
                                    ].map((pattern, idx) => (
                                        <div key={idx} className="flex gap-4 items-start">
                                            <span className={`text-sm font-semibold text-${pattern.color}-600 min-w-[140px]`}>• {pattern.label}:</span>
                                            <span className="text-gray-600 text-sm">{pattern.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ==================== PAGE 2: Career Fit Results ==================== */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 print:shadow-none print:rounded-none print:mb-0 print:break-after-page">
                    <div className="p-8">
                        <SectionHeader icon={Briefcase} title="Career Fit Results" subtitle="Best-fit career clusters based on your profile" gradient="from-emerald-500 to-teal-600" />

                        {/* Career Clusters */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-800">Best-Fit Career Clusters</h3>
                                <Badge className="bg-indigo-100 text-indigo-700 border-0">Top 3-5</Badge>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">We recommend clusters (broad areas) instead of a single job, so you have options.</p>

                            <div className="space-y-6">
                                {careerFit.clusters.map((cluster, idx) => {
                                    const gradients = [
                                        'from-emerald-500 to-teal-500',
                                        'from-blue-500 to-indigo-500',
                                        'from-amber-500 to-orange-500',
                                        'from-purple-500 to-pink-500',
                                        'from-rose-500 to-red-500'
                                    ];
                                    const bgColors = [
                                        'from-emerald-50 to-teal-50 border-emerald-200',
                                        'from-blue-50 to-indigo-50 border-blue-200',
                                        'from-amber-50 to-orange-50 border-amber-200',
                                        'from-purple-50 to-pink-50 border-purple-200',
                                        'from-rose-50 to-red-50 border-rose-200'
                                    ];

                                    return (
                                        <div key={idx} className={`bg-gradient-to-br ${bgColors[idx % 5]} rounded-2xl p-6 border relative overflow-hidden print:break-inside-avoid`}>
                                            <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${gradients[idx % 5]}`}></div>
                                            
                                            <div className="pl-4">
                                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[idx % 5]} flex items-center justify-center text-white font-bold text-sm`}>
                                                                {idx + 1}
                                                            </span>
                                                            <h4 className="text-xl font-bold text-gray-800">{cluster.title}</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-500 ml-11">Fit Level: <span className="font-semibold">{cluster.fit}</span></p>
                                                    </div>
                                                    <ProgressRing value={cluster.matchScore} size={70} strokeWidth={6} color={idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f59e0b'} />
                                                </div>

                                                <div className="bg-white/60 rounded-xl p-4 mb-4">
                                                    <h5 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        Why this fits you
                                                    </h5>
                                                    {cluster.evidence ? (
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex gap-2">
                                                                <span className="font-semibold text-gray-600 min-w-[120px]">Interest:</span>
                                                                <span className="text-gray-700">{cluster.evidence.interest}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-semibold text-gray-600 min-w-[120px]">Aptitude:</span>
                                                                <span className="text-gray-700">{cluster.evidence.aptitude}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-semibold text-gray-600 min-w-[120px]">Personality:</span>
                                                                <span className="text-gray-700">{cluster.evidence.personality}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-700 text-sm">{cluster.reason}</p>
                                                    )}
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="bg-white/60 rounded-xl p-4">
                                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Typical Roles</h5>
                                                        <div className="space-y-1 text-sm">
                                                            <p>
                                                                <span className="font-semibold text-gray-700">Entry:</span>{' '}
                                                                <span className="text-gray-600">
                                                                    {cluster.roles?.entry?.length > 0 
                                                                        ? cluster.roles.entry.join(', ') 
                                                                        : <span className="text-gray-400 italic">Not specified</span>}
                                                                </span>
                                                            </p>
                                                            <p>
                                                                <span className="font-semibold text-gray-700">Mid:</span>{' '}
                                                                <span className="text-gray-600">
                                                                    {cluster.roles?.mid?.length > 0 
                                                                        ? cluster.roles.mid.join(', ') 
                                                                        : <span className="text-gray-400 italic">Not specified</span>}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/60 rounded-xl p-4">
                                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Related Domains</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {cluster.domains?.length > 0 ? (
                                                                cluster.domains.map((domain, dIdx) => (
                                                                    <Badge key={dIdx} variant="outline" className="bg-white text-gray-700 border-gray-300">{domain}</Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-gray-400 italic text-sm">Not specified</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Specific Career Options */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg">Specific Career Options (Ranked)</h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* High Fit */}
                                <div className="bg-white rounded-xl p-5 border-2 border-emerald-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <h4 className="font-bold text-emerald-700">High Fit</h4>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Top 3-4</Badge>
                                    </div>
                                    <ol className="space-y-2">
                                        {careerFit.specificOptions.highFit.map((role, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-sm">
                                                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{idx + 1}</span>
                                                <span className="font-medium text-gray-800">{role}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Medium Fit */}
                                <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <h4 className="font-bold text-blue-700">Medium Fit</h4>
                                    </div>
                                    <ol className="space-y-2">
                                        {careerFit.specificOptions.mediumFit.map((role, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-sm">
                                                <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{idx + 1}</span>
                                                <span className="text-gray-700">{role}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Explore Later */}
                                <div className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <h4 className="font-bold text-amber-700">Explore Later</h4>
                                    </div>
                                    <ol className="space-y-2">
                                        {careerFit.specificOptions.exploreLater.map((role, idx) => (
                                            <li key={idx} className="flex items-center gap-3 text-sm">
                                                <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">{idx + 1}</span>
                                                <span className="text-gray-500">{role}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ==================== PAGE 3: Skill Gap & Development Plan ==================== */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 print:shadow-none print:rounded-none print:mb-0 print:break-after-page">
                    <div className="p-8">
                        <SectionHeader icon={Zap} title="Skill Gap & Development Plan" subtitle="Your current strengths and areas for growth" gradient="from-amber-500 to-orange-600" />

                        {/* Current Strengths */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-gray-800">Current Strength Skills</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Technical Skills */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        Technical / Domain Skills
                                    </h4>
                                    <div className="space-y-2">
                                        {skillGap.currentStrengths.map((skill, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span className="text-gray-700 text-sm">{skill}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Employability Skills */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Employability Strengths
                                    </h4>
                                    <div className="space-y-2">
                                        {employability.strengthAreas.map((skill, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                                                <span className="text-gray-700 text-sm">{skill}</span>
                                                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">High</Badge>
                                            </div>
                                        ))}
                                        {employability.improvementAreas.map((skill, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white/70 rounded-lg p-3 opacity-70">
                                                <span className="text-gray-600 text-sm">{skill}</span>
                                                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Needs Work</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skill Gaps */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-red-600" />
                                <h3 className="text-lg font-bold text-gray-800">Skill Gaps (Priority-based)</h3>
                            </div>

                            {/* Priority A */}
                            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200 mb-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                                        <span className="text-white font-bold">A</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-800">Priority A — Must build in next 6 months</h4>
                                        <p className="text-red-600 text-sm">Critical skills for your career path</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {skillGap.priorityA.map((item, idx) => (
                                        <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-red-100 print:break-inside-avoid">
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold">{idx + 1}</span>
                                                    <h5 className="font-bold text-gray-800 text-lg">{item.skill}</h5>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                                                    <span className="text-xs text-gray-500">Level:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-red-600">{item.currentLevel}</span>
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                        <span className="font-bold text-emerald-600">{item.targetLevel}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">/ 5</span>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="bg-red-50 rounded-lg p-4">
                                                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Why needed</p>
                                                    <p className="text-gray-700 text-sm">{item.whyNeeded}</p>
                                                </div>
                                                <div className="bg-indigo-50 rounded-lg p-4">
                                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">How to build</p>
                                                    <p className="text-gray-700 text-sm">{item.howToBuild}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Priority B */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                                        <span className="text-white font-bold">B</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-800">Priority B — Build in next 6–12 months</h4>
                                        <p className="text-amber-600 text-sm">Important skills for career advancement</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    {skillGap.priorityB.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">{idx + 1}</span>
                                            <span className="text-gray-700 text-sm font-medium">{item.skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Learning Tracks */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Recommended Learning Tracks</h3>
                                    <p className="text-gray-500 text-sm">Based on your profile, choose one depth track</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {skillGap.learningTracks.map((track, idx) => {
                                    const isRecommended = track.track === skillGap.recommendedTrack;
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`rounded-xl p-5 border-2 transition-all ${
                                                isRecommended 
                                                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-400 shadow-lg' 
                                                    : 'bg-white border-gray-200 border-dashed'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h5 className="font-bold text-gray-800">Track {idx + 1}: {track.track}</h5>
                                                {isRecommended && (
                                                    <Badge className="bg-indigo-600 text-white border-0">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        Recommended
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-semibold text-gray-600">Suggested if:</span> <span className="text-gray-700">{track.suggestedIf}</span></p>
                                                <p><span className="font-semibold text-gray-600">Core topics:</span> <span className="text-gray-700">{track.topics}</span></p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="bg-white rounded-xl p-4 flex items-center justify-between">
                                <span className="text-gray-600">Your recommended track:</span>
                                <span className="text-xl font-bold text-indigo-600">{skillGap.recommendedTrack}</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* ==================== PAGE 4: 6-12 Month Action Roadmap ==================== */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
                    <div className="p-8">
                        <SectionHeader icon={Rocket} title="6–12 Month Action Roadmap" subtitle="Your personalized path to career success" gradient="from-purple-500 to-pink-600" />

                        {/* Projects Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Briefcase className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-gray-800">Projects / Portfolio (Stream-specific)</h3>
                            </div>

                            <div className="space-y-4">
                                {roadmap.projects.map((project, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 print:break-inside-avoid">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 text-lg mb-3">{project.title}</h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="bg-white/70 rounded-lg p-4">
                                                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Purpose</p>
                                                        <p className="text-gray-700 text-sm">{project.purpose}</p>
                                                    </div>
                                                    <div className="bg-white/70 rounded-lg p-4">
                                                        <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-1">Output / Proof</p>
                                                        <p className="text-indigo-600 text-sm font-medium">{project.output}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Internship & Exposure Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Internship Pathway */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Internship Pathway</h3>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Best internship type(s)</p>
                                    <div className="space-y-2">
                                        {roadmap.internship.types.map((type, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <span className="text-gray-700 text-sm">{type}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 bg-blue-100 rounded-lg p-3">
                                        <span className="text-xs font-bold text-blue-700">Target Timeline:</span>
                                        <span className="text-blue-800 text-sm ml-2">{roadmap.internship.timeline}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">How to prepare</p>
                                    <div className="space-y-3 text-sm">
                                        <div className="bg-white/70 rounded-lg p-3">
                                            <span className="font-semibold text-gray-700">Resume:</span>
                                            <span className="text-gray-600 ml-2">{roadmap.internship.preparation.resume}</span>
                                        </div>
                                        <div className="bg-white/70 rounded-lg p-3">
                                            <span className="font-semibold text-gray-700">Portfolio:</span>
                                            <span className="text-gray-600 ml-2">{roadmap.internship.preparation.portfolio}</span>
                                        </div>
                                        <div className="bg-white/70 rounded-lg p-3">
                                            <span className="font-semibold text-gray-700">Interview:</span>
                                            <span className="text-gray-600 ml-2">{roadmap.internship.preparation.interview}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Campus & External Exposure */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-gray-800">Campus & External Exposure</h3>
                                </div>

                                <div className="mb-6">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Join / Lead these activities</p>
                                    <div className="space-y-2">
                                        {roadmap.exposure.activities.map((activity, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{idx + 1}</span>
                                                <span className="text-gray-700 text-sm">{activity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Certifications Recommended</p>
                                    <div className="space-y-2">
                                        {roadmap.exposure.certifications.map((cert, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                                <Award className="w-4 h-4 text-emerald-500" />
                                                <span className="text-gray-700 text-sm">{cert}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Final Counselor Note */}
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-bold text-xl">Final Counselor Note</h3>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Trophy className="w-5 h-5 text-amber-300" />
                                            <p className="text-white/80 text-sm font-semibold">Your biggest advantage</p>
                                        </div>
                                        <p className="text-white text-lg">{finalNote.advantage}</p>
                                    </div>

                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target className="w-5 h-5 text-emerald-300" />
                                            <p className="text-white/80 text-sm font-semibold">Your top growth focus</p>
                                        </div>
                                        <p className="text-white text-lg">{finalNote.growthFocus}</p>
                                    </div>

                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="w-5 h-5 text-blue-300" />
                                            <p className="text-white/80 text-sm font-semibold">Next review suggested</p>
                                        </div>
                                        <p className="text-white text-lg">{finalNote.nextReview || 'End of 5th Semester'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AssessmentResult;
