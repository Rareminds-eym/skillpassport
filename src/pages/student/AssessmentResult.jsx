import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Compass,
    Target,
    TrendingUp,
    Award,
    BookOpen,
    Code,
    Layers,
    CheckCircle,
    Star,
    Zap,
    Brain,
    Heart,
    Briefcase,
    Download,
    Share2,
    AlertCircle,
    RefreshCw,
    FileText,
    Map,
    GraduationCap,
    Layout
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Students/components/ui/card';
import { Badge } from '../../components/Students/components/ui/badge';
import { Progress } from '../../components/Students/components/ui/progress';
import { Button } from '../../components/Students/components/ui/button';
import {
    getSkillLevel,
    getTraitInterpretation
} from './assessment-data/scoringUtils';

// Import Gemini service
import { analyzeAssessmentWithGemini } from '../../services/geminiAssessmentService';
import { riasecQuestions } from './assessment-data/riasecQuestions';
import { bigFiveQuestions } from './assessment-data/bigFiveQuestions';
import { workValuesQuestions } from './assessment-data/workValuesQuestions';
import { employabilityQuestions } from './assessment-data/employabilityQuestions';
import { streamKnowledgeQuestions } from './assessment-data/streamKnowledgeQuestions';


const AssessmentResult = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retrying, setRetrying] = useState(false);

    const loadResults = async () => {
        setLoading(true);
        setError(null);

        // Load answers from localStorage
        const answersJson = localStorage.getItem('assessment_answers');
        const geminiResultsJson = localStorage.getItem('assessment_gemini_results');
        const stream = localStorage.getItem('assessment_stream');

        if (!answersJson) {
            // No assessment data found, redirect to test
            navigate('/student/assessment/test');
            return;
        }

        // Check if we have Gemini results
        if (geminiResultsJson) {
            try {
                const geminiResults = JSON.parse(geminiResultsJson);
                // Check if results have the new structure (e.g. careerFit instead of careerRecommendations)
                if (geminiResults.careerFit) {
                    setResults(geminiResults);
                    setLoading(false);
                    return;
                }
                // If old structure, we might need to re-analyze or adapt. 
                // For now, let's re-analyze to get the new detailed report.
                console.log('Old result format detected, re-analyzing...');
            } catch (e) {
                console.error('Error parsing Gemini results:', e);
            }
        }

        // Try to get Gemini analysis if not available or old format
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

        // No results available
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 mx-auto"></div>
                    <p className="text-gray-600">Generating your comprehensive 4-page report...</p>
                    <p className="text-sm text-gray-400 mt-2">This may take a moment as AI analyzes your profile in depth.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-none shadow-xl">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Analysis Error</h2>
                        <p className="text-red-600 mb-6">{error}</p>
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleRetry}
                                disabled={retrying}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                            >
                                {retrying ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Try Again
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/student/assessment/test')}
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

    const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, finalNote } = results;

    const riasecNames = {
        R: 'Realistic',
        I: 'Investigative',
        A: 'Artistic',
        S: 'Social',
        E: 'Enterprising',
        C: 'Conventional'
    };

    const traitNames = {
        O: 'Openness',
        C: 'Conscientiousness',
        E: 'Extraversion',
        A: 'Agreeableness',
        N: 'Neuroticism'
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
            {/* Action Bar - Hidden in Print */}
            <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                    Back to Dashboard
                </Button>
                <div className="flex gap-3">
                    <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report PDF
                    </Button>
                </div>
            </div>

            {/* Report Container */}
            <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none">

                {/* Page 1: Student Profile Snapshot */}
                <div className="p-12 min-h-[1100px] relative print:break-after-page">
                    <div className="border-b-2 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">CAREER PROFILING & SKILL REPORT</h1>
                            <p className="text-xl text-gray-600">4th Semester Assessment</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                            <p>Date: {new Date().toLocaleDateString()}</p>
                            <p>Generated by SkillPassport AI</p>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">1.1 Summary of Key Findings</h2>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* RIASEC */}
                            <div className="bg-blue-50 p-6 rounded-xl">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Compass className="w-5 h-5 text-blue-600" />
                                    Top Interest Themes (RIASEC)
                                </h3>
                                <div className="space-y-2">
                                    {riasec.topThree.map((code, idx) => (
                                        <div key={code} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                            <span className="font-semibold text-gray-700">{code} - {riasecNames[code]}</span>
                                            <Badge className="bg-blue-100 text-blue-700">{riasec.scores[code]} pts</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Aptitude/Knowledge */}
                            <div className="bg-green-50 p-6 rounded-xl">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-green-600" />
                                    Knowledge & Aptitude
                                </h3>
                                <div className="mb-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Stream Knowledge</span>
                                        <span className="text-sm font-bold">{knowledge.score}%</span>
                                    </div>
                                    <Progress value={knowledge.score} className="h-2" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600"><span className="font-semibold">Strong Topics:</span> {knowledge.strongTopics.join(', ')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* Personality */}
                            <div className="bg-purple-50 p-6 rounded-xl">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-purple-600" />
                                    Personality Highlights
                                </h3>
                                <div className="space-y-2">
                                    {['O', 'C', 'E', 'A', 'N'].map(trait => (
                                        <div key={trait} className="flex justify-between text-sm">
                                            <span className="text-gray-600">{traitNames[trait]}</span>
                                            <span className="font-medium text-gray-800">{getSkillLevel(bigFive[trait]).level}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Values */}
                            <div className="bg-amber-50 p-6 rounded-xl">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-amber-600" />
                                    Top Work Values
                                </h3>
                                <ul className="space-y-2">
                                    {workValues.topThree.map((val, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                            <span className="font-medium text-gray-700">{val.value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-2">Overall Career Direction</h3>
                            <p className="text-gray-700 italic text-lg leading-relaxed">"{results.overallSummary}"</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-l-4 border-indigo-500 pl-4">1.2 Interpretation (What this means for you)</h2>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-gray-700 mb-4">{riasec.interpretation}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-gray-900 block mb-1">Work Style:</span>
                                    <p className="text-gray-600">{bigFive.workStyleSummary}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-900 block mb-1">Motivation:</span>
                                    <p className="text-gray-600">{workValues.motivationSummary}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page 2: Career Fit Results */}
                <div className="p-12 min-h-[1100px] relative print:break-after-page bg-gray-50/30">
                    <div className="border-b border-gray-200 pb-4 mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Page 2 — Career Fit Results</h2>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">2.1 Best-Fit Career Clusters</h2>
                        <p className="text-gray-600 mb-6">We recommend clusters (broad areas) instead of a single job, so you have options.</p>

                        <div className="space-y-6">
                            {careerFit.clusters.map((cluster, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{cluster.title}</h3>
                                            <p className="text-sm text-gray-500">{cluster.domains.join(' • ')}</p>
                                        </div>
                                        <Badge className={`
                                            ${cluster.fit === 'High' ? 'bg-green-100 text-green-700' :
                                                cluster.fit === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'}
                                        `}>
                                            {cluster.fit} Fit ({cluster.matchScore}%)
                                        </Badge>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold text-gray-700 mb-1">Why this fits you:</h4>
                                        <p className="text-sm text-gray-600">{cluster.reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Entry Level Roles</span>
                                            <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                                                {cluster.roles.entry.map((role, rIdx) => <li key={rIdx}>{role}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase">Mid-Career Roles</span>
                                            <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                                                {cluster.roles.mid.map((role, rIdx) => <li key={rIdx}>{role}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">2.2 Specific Career Options (Ranked)</h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                    <Star className="w-4 h-4" /> High Fit
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 font-medium">
                                    {careerFit.specificOptions.highFit.map((role, idx) => (
                                        <li key={idx}>{role}</li>
                                    ))}
                                </ol>
                            </div>
                            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Medium Fit
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    {careerFit.specificOptions.mediumFit.map((role, idx) => (
                                        <li key={idx}>{role}</li>
                                    ))}
                                </ol>
                            </div>
                            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                                <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                                    <Compass className="w-4 h-4" /> Explore Later
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    {careerFit.specificOptions.exploreLater.map((role, idx) => (
                                        <li key={idx}>{role}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page 3: Skill Gap & Development Plan */}
                <div className="p-12 min-h-[1100px] relative print:break-after-page">
                    <div className="border-b border-gray-200 pb-4 mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Page 3 — Skill Gap & Development Plan</h2>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">3.1 Current Strength Skills</h2>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                            <h3 className="font-bold text-gray-800 mb-3">Technical / Domain Strengths</h3>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {skillGap.currentStrengths.map((skill, idx) => (
                                    <Badge key={idx} className="bg-green-100 text-green-700 px-3 py-1 text-sm">{skill}</Badge>
                                ))}
                            </div>

                            <h3 className="font-bold text-gray-800 mb-3">Employability Strengths</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {employability.strengthAreas.map((skill, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">3.2 Skill Gaps (Priority-based)</h2>

                        <div className="space-y-6">
                            {/* Priority A */}
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <h3 className="text-lg font-bold text-red-800">Priority A — Must build in next 6 months</h3>
                                </div>
                                <div className="space-y-4">
                                    {skillGap.priorityA.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-bold text-gray-800">{item.skill}</h4>
                                                <div className="text-xs text-gray-500">Target: {item.targetLevel}/5</div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Why:</span> {item.whyNeeded}</p>
                                            <p className="text-sm text-indigo-600"><span className="font-semibold text-gray-700">Action:</span> {item.howToBuild}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Priority B */}
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-5 h-5 text-orange-600" />
                                    <h3 className="text-lg font-bold text-orange-800">Priority B — Build in next 6–12 months</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {skillGap.priorityB.map((item, idx) => (
                                        <div key={idx} className="bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-100 text-gray-700 font-medium">
                                            {item.skill}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">3.3 Recommended Learning Tracks</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {skillGap.learningTracks.map((track, idx) => (
                                <div key={idx} className={`p-6 rounded-xl border-2 ${track.track === skillGap.recommendedTrack ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                                    {track.track === skillGap.recommendedTrack && <Badge className="mb-2 bg-indigo-600">Recommended</Badge>}
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">{track.track}</h3>
                                    <p className="text-sm text-gray-600 mb-3"><span className="font-semibold">Best if:</span> {track.suggestedIf}</p>
                                    <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">
                                        <span className="font-semibold block mb-1">Core Topics:</span>
                                        {track.topics}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Page 4: 6–12 Month Action Roadmap */}
                <div className="p-12 min-h-[1100px] relative bg-gray-50/30">
                    <div className="border-b border-gray-200 pb-4 mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Page 4 — 6–12 Month Action Roadmap</h2>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">4.1 Projects / Portfolio</h2>
                        <div className="grid grid-cols-1 gap-6">
                            {roadmap.projects.map((project, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Layers className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 mb-1">{project.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{project.purpose}</p>
                                        <div className="inline-block bg-gray-100 px-3 py-1 rounded text-xs font-medium text-gray-700">
                                            Output: {project.output}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">4.2 Internship Pathway</h2>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-indigo-600" />
                                    Target Profile
                                </h3>
                                <div className="space-y-3 mb-6">
                                    {roadmap.internship.types.map((type, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {type}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-lg">
                                    <h4 className="font-bold text-sm text-indigo-800 mb-2">Preparation Focus</h4>
                                    <ul className="space-y-2 text-sm text-indigo-700">
                                        <li><span className="font-semibold">Resume:</span> {roadmap.internship.preparation.resume}</li>
                                        <li><span className="font-semibold">Portfolio:</span> {roadmap.internship.preparation.portfolio}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-l-4 border-indigo-500 pl-4">4.3 Campus & Exposure</h2>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                                    Recommended Activities
                                </h3>
                                <ul className="space-y-3 mb-6">
                                    {roadmap.exposure.activities.map((activity, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                                            {activity}
                                        </li>
                                    ))}
                                </ul>
                                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-indigo-600" />
                                    Certifications
                                </h3>
                                <ul className="space-y-2">
                                    {roadmap.exposure.certifications.map((cert, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 italic">{cert}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-300" />
                            Final Counselor Note
                        </h2>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-indigo-100 mb-2 uppercase text-sm tracking-wider">Your Biggest Advantage</h3>
                                <p className="text-lg font-medium">{finalNote.advantage}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-100 mb-2 uppercase text-sm tracking-wider">Top Growth Focus</h3>
                                <p className="text-lg font-medium">{finalNote.growthFocus}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AssessmentResult;
