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

    const { riasec, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, finalNote, profileSnapshot } = results;

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
            <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none print:overflow-visible">

                {/* Page 1: Student Profile Snapshot */}
                <div className="p-12 min-h-[1100px] relative print:break-after-page print:min-h-0 print:h-auto print:p-8">
                    <div className="border-b-2 border-indigo-600 pb-6 mb-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">Career Profiling & Skill</h1>
                                <h1 className="text-3xl font-bold text-indigo-700 uppercase tracking-wide">Development Report <span className="text-lg text-gray-500 normal-case">(4th Semester)</span></h1>
                            </div>
                            <div className="text-right">
                                <img src="/logo.png" alt="SkillPassport" className="h-12 opacity-80" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span className="font-semibold">Student Name:</span>
                                <span>{localStorage.getItem('studentName') || '___________________________'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span className="font-semibold">Register No.:</span>
                                <span>{localStorage.getItem('studentRegNo') || '___________________________'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span className="font-semibold">Programme/Stream:</span>
                                <span className="uppercase">{localStorage.getItem('assessment_stream') || '_______________________'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span className="font-semibold">College:</span>
                                <span>{localStorage.getItem('collegeName') || '________________________________'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Assessment Date:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Counselor/Assessor:</span>
                                <span>SkillPassport AI</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Student Profile Snapshot</h2>
                        <h3 className="text-lg font-bold text-indigo-700 mb-4">1.1 Summary of Key Findings</h3>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            {/* RIASEC */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider border-l-2 border-blue-500 pl-2">Top Interest Themes (RIASEC)</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                                        {riasec.topThree.map((code, idx) => (
                                            <li key={code}><span className="font-semibold">Code {idx + 1}:</span> {riasecNames[code]} ({code})</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider border-l-2 border-green-500 pl-2">Aptitude Strengths (Top 2)</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                                        {profileSnapshot?.aptitudeStrengths ? (
                                            profileSnapshot.aptitudeStrengths.map((strength, idx) => (
                                                <li key={idx}>{strength.name} <span className="text-gray-500 text-xs">(Percentile: {strength.percentile})</span></li>
                                            ))
                                        ) : (
                                            <>
                                                <li>Stream Knowledge <span className="text-gray-500 text-xs">(Score: {knowledge.score}%)</span></li>
                                                <li>{knowledge.strongTopics[0] || 'General Aptitude'}</li>
                                            </>
                                        )}
                                    </ol>
                                </div>
                            </div>

                            {/* Personality & Values */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider border-l-2 border-purple-500 pl-2">Personality Highlights (Big Five)</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                                        {['O', 'C', 'E', 'A', 'N'].map(trait => (
                                            <li key={trait}>
                                                <span className="font-semibold">{traitNames[trait]}:</span> {getSkillLevel(bigFive[trait]).level}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider border-l-2 border-amber-500 pl-2">Top Work Values / Ambition Drivers</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                                        {workValues.topThree.map((val, idx) => (
                                            <li key={idx}>{val.value}</li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-8">
                            <h4 className="font-bold text-indigo-900 mb-1 text-sm">Overall Career Direction:</h4>
                            <p className="text-indigo-800 italic text-sm leading-relaxed">"{results.overallSummary}"</p>
                        </div>

                        <h3 className="text-lg font-bold text-indigo-700 mb-4">1.2 Interpretation (What this means for you)</h3>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-sm">
                            <div className="mb-4">
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                    <li><span className="font-semibold text-gray-800">Interests</span> indicate the kind of work environments you naturally enjoy.</li>
                                    <li><span className="font-semibold text-gray-800">Aptitude</span> indicates the areas you may learn quickly and perform strongly in.</li>
                                    <li><span className="font-semibold text-gray-800">Personality</span> indicates your preferred work style.</li>
                                    <li><span className="font-semibold text-gray-800">Values</span> indicate what will keep you motivated long-term.</li>
                                </ul>
                            </div>

                            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-1">Your Key Patterns:</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 min-w-[140px]">• Enjoyment pattern:</span>
                                    <span className="text-gray-600">{profileSnapshot?.keyPatterns?.enjoyment || riasec.interpretation}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 min-w-[140px]">• Strength pattern:</span>
                                    <span className="text-gray-600">{profileSnapshot?.keyPatterns?.strength || `Strong in ${knowledge.strongTopics.join(', ')}`}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 min-w-[140px]">• Work-style pattern:</span>
                                    <span className="text-gray-600">{profileSnapshot?.keyPatterns?.workStyle || bigFive.workStyleSummary}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-semibold text-gray-700 min-w-[140px]">• Motivation pattern:</span>
                                    <span className="text-gray-600">{profileSnapshot?.keyPatterns?.motivation || workValues.motivationSummary}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page 2: Career Fit Results */}
                <div className="p-12 min-h-[1100px] relative print:break-after-page bg-gray-50/30 print:bg-white print:min-h-0 print:h-auto print:p-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Career Fit Results</h2>
                        <h3 className="text-lg font-bold text-indigo-700 mb-2">2.1 Best-Fit Career Clusters (Top 3–5)</h3>
                        <p className="text-sm text-gray-500 italic mb-6">We recommend clusters (broad areas) instead of a single job, so you have options.</p>

                        <div className="space-y-8">
                            {careerFit.clusters.map((cluster, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden print:break-inside-avoid">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800">Cluster {idx + 1}: {cluster.title}</h4>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Fit: {cluster.fit}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-gray-50">{cluster.matchScore}% Match</Badge>
                                    </div>

                                    <div className="mb-4 pl-2">
                                        <h5 className="text-sm font-bold text-gray-700 mb-2 underline decoration-gray-300 underline-offset-4">Why this fits you:</h5>
                                        <ul className="space-y-1 text-sm text-gray-600">
                                            {cluster.evidence ? (
                                                <>
                                                    <li className="flex gap-2"><span className="font-semibold min-w-[140px]">• Interest evidence:</span> {cluster.evidence.interest}</li>
                                                    <li className="flex gap-2"><span className="font-semibold min-w-[140px]">• Aptitude evidence:</span> {cluster.evidence.aptitude}</li>
                                                    <li className="flex gap-2"><span className="font-semibold min-w-[140px]">• Personality evidence:</span> {cluster.evidence.personality}</li>
                                                </>
                                            ) : (
                                                <li>{cluster.reason}</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pl-2 mt-4 border-t border-gray-100 pt-4">
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Typical Roles</span>
                                            <div className="text-sm text-gray-700 space-y-1">
                                                <p><span className="font-semibold">Entry:</span> {cluster.roles.entry.join(', ')}</p>
                                                <p><span className="font-semibold">Mid:</span> {cluster.roles.mid.join(', ')}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Related Domains</span>
                                            <p className="text-sm text-gray-700">{cluster.domains.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-indigo-700 mb-4">2.2 Specific Career Options (Ranked List)</h3>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 border-b-2 border-green-500 pb-1 inline-block">High Fit (Top 3-4)</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 font-medium">
                                    {careerFit.specificOptions.highFit.map((role, idx) => (
                                        <li key={idx}>{role}</li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-1 inline-block">Medium Fit</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    {careerFit.specificOptions.mediumFit.map((role, idx) => (
                                        <li key={idx}>{role}</li>
                                    ))}
                                </ol>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 border-b-2 border-orange-500 pb-1 inline-block">Explore Later</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 text-gray-500">
                                    {careerFit.specificOptions.exploreLater.map((role, idx) => (
                                        <li key={idx}>{role}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page 3: Skill Gap & Development Plan */}
                <div className="p-12 min-h-[1100px] relative print:break-after-page print:min-h-0 print:h-auto print:p-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Skill Gap & Development Plan</h2>

                        <h3 className="text-lg font-bold text-indigo-700 mb-4">3.1 Current Strength Skills</h3>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                            <div className="mb-4">
                                <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Technical / Domain Skills:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                                    {skillGap.currentStrengths.map((skill, idx) => (
                                        <li key={idx}>{skill}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Employability Strengths Observed:</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                    {employability.strengthAreas.map((skill, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1">
                                            <span className="text-gray-700">{skill}</span>
                                            <div className="flex gap-2">
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">High</span>
                                            </div>
                                        </div>
                                    ))}
                                    {employability.improvementAreas.map((skill, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm border-b border-gray-100 pb-1 opacity-70">
                                            <span className="text-gray-700">{skill}</span>
                                            <div className="flex gap-2">
                                                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Needs Work</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-indigo-700 mb-4">3.2 Skill Gaps (Priority-based)</h3>
                        <div className="space-y-6 mb-8">
                            {/* Priority A */}
                            <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                <h4 className="font-bold text-red-800 mb-4 text-lg border-b border-red-200 pb-2">Priority A — Must build in next 6 months</h4>
                                <div className="space-y-6">
                                    {skillGap.priorityA.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm print:break-inside-avoid">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-gray-800 text-lg">{idx + 1}. {item.skill}</span>
                                                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    Current: {item.currentLevel}/5 → Target: {item.targetLevel}/5
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-semibold text-gray-600 block mb-1">Why needed:</span>
                                                    <p className="text-gray-700">{item.whyNeeded}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-indigo-600 block mb-1">How to build:</span>
                                                    <p className="text-gray-700">{item.howToBuild}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Priority B */}
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                <h4 className="font-bold text-orange-800 mb-4 text-lg border-b border-orange-200 pb-2">Priority B — Build in next 6–12 months</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800 font-medium ml-2">
                                    {skillGap.priorityB.map((item, idx) => (
                                        <li key={idx}>{item.skill}</li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-indigo-700 mb-4">3.3 Recommended Learning Tracks</h3>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-sm text-gray-600 mb-4">Based on your current profile, choose one depth track:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {skillGap.learningTracks.map((track, idx) => (
                                    <div key={idx} className={`p-4 rounded-lg border-2 ${track.track === skillGap.recommendedTrack ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 border-dashed'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h5 className="font-bold text-gray-800">Track {idx + 1}: {track.track}</h5>
                                            {track.track === skillGap.recommendedTrack && <Badge className="bg-indigo-600 text-[10px]">Recommended</Badge>}
                                        </div>
                                        <p className="text-xs text-gray-600 mb-2"><span className="font-semibold">Suggested if:</span> {track.suggestedIf}</p>
                                        <p className="text-xs text-gray-600"><span className="font-semibold">Core topics:</span> {track.topics}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <p className="text-sm font-bold text-gray-800">Your recommended track: <span className="text-indigo-600 text-lg ml-2">{skillGap.recommendedTrack}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page 4: 6–12 Month Action Roadmap */}
                <div className="p-12 min-h-[1100px] relative bg-gray-50/30 print:bg-white print:min-h-0 print:h-auto print:p-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">6–12 Month Action Roadmap</h2>

                        <h3 className="text-lg font-bold text-indigo-700 mb-4">4.1 Projects / Portfolio (stream-specific)</h3>
                        <div className="space-y-6 mb-8">
                            {roadmap.projects.map((project, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm print:break-inside-avoid">
                                    <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-1">Project {idx + 1}:</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-600 min-w-[100px]">Title:</span>
                                            <span className="text-gray-800 font-medium">{project.title}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-600 min-w-[100px]">Purpose:</span>
                                            <span className="text-gray-700">{project.purpose}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-600 min-w-[100px]">Output/Proof:</span>
                                            <span className="text-indigo-600">{project.output}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-700 mb-4">4.2 Internship Pathway</h3>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full">
                                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Best internship type(s):</h4>
                                    <div className="space-y-2 mb-4">
                                        {roadmap.internship.types.map((type, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <div className="w-4 h-4 border-2 border-indigo-600 rounded flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>
                                                </div>
                                                <span className="text-gray-700">{type}</span>
                                            </div>
                                        ))}
                                        <div className="mt-2 text-sm"><span className="font-semibold">Target Timeline:</span> {roadmap.internship.timeline}</div>
                                    </div>

                                    <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider mt-6">How to prepare:</h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li><span className="font-semibold text-gray-700">Resume:</span> {roadmap.internship.preparation.resume}</li>
                                        <li><span className="font-semibold text-gray-700">Portfolio:</span> {roadmap.internship.preparation.portfolio}</li>
                                        <li><span className="font-semibold text-gray-700">Interview:</span> {roadmap.internship.preparation.interview}</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-indigo-700 mb-4">4.3 Campus & External Exposure</h3>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-full">
                                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Join / Lead these activities:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-6">
                                        {roadmap.exposure.activities.map((activity, idx) => (
                                            <li key={idx}>{activity}</li>
                                        ))}
                                    </ol>

                                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Certifications Recommended:</h4>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                        {roadmap.exposure.certifications.map((cert, idx) => (
                                            <li key={idx}>{cert}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
                            <h3 className="text-lg font-bold text-indigo-700 mb-4">4.4 Final Counselor Note</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="font-bold text-gray-800 block mb-1">Your biggest advantage right now:</span>
                                    <p className="text-gray-700 border-b border-gray-300 pb-2">{finalNote.advantage}</p>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-800 block mb-1">Your top growth focus:</span>
                                    <p className="text-gray-700 border-b border-gray-300 pb-2">{finalNote.growthFocus}</p>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-800 block mb-1">Next review suggested:</span>
                                    <p className="text-gray-700">{finalNote.nextReview || 'End of 5th Semester'}</p>
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
