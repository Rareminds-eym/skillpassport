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
    Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Students/components/ui/card';
import { Badge } from '../../components/Students/components/ui/badge';
import { Progress } from '../../components/Students/components/ui/progress';
import { Button } from '../../components/Students/components/ui/button';
import {
    calculateRIASEC,
    calculateBigFive,
    calculateWorkValues,
    calculateEmployability,
    calculateKnowledgeScore,
    getCareerClusters,
    getSkillLevel,
    getTraitInterpretation
} from './assessment-data/scoringUtils';

const AssessmentResult = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load answers from localStorage
        const answersJson = localStorage.getItem('assessment_answers');

        if (!answersJson) {
            // No assessment data found, redirect to test
            navigate('/student/assessment/test');
            return;
        }

        const answers = JSON.parse(answersJson);

        // Calculate all scores
        const riasecResults = calculateRIASEC(answers);
        const bigFiveResults = calculateBigFive(answers);
        const workValuesResults = calculateWorkValues(answers);
        const employabilityResults = calculateEmployability(answers);
        const knowledgeResults = calculateKnowledgeScore(answers);
        const careerClusters = getCareerClusters(riasecResults.code);

        setResults({
            riasec: riasecResults,
            bigFive: bigFiveResults,
            workValues: workValuesResults,
            employability: employabilityResults,
            knowledge: knowledgeResults,
            clusters: careerClusters
        });

        setLoading(false);
    }, [navigate]);

    if (loading || !results) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4 mx-auto"></div>
                    <p className="text-gray-600">Loading your results...</p>
                </div>
            </div>
        );
    }

    const { riasec, bigFive, workValues, employability, knowledge, clusters } = results;

    const traitNames = {
        O: 'Openness',
        C: 'Conscientiousness',
        E: 'Extraversion',
        A: 'Agreeableness',
        N: 'Neuroticism'
    };

    const riasecNames = {
        R: 'Realistic',
        I: 'Investigative',
        A: 'Artistic',
        S: 'Social',
        E: 'Enterprising',
        C: 'Conventional'
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in-up">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-8 h-8 text-green-300" />
                                <h1 className="text-3xl font-bold">Assessment Complete!</h1>
                            </div>
                            <p className="text-blue-100 text-lg">Your personalized career profiling report is ready.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
                            <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">RIASEC Code</div>
                            <div className="font-bold text-2xl">{riasec.code}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
                            <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Top Career Cluster</div>
                            <div className="font-semibold text-sm">{clusters[0]?.title || 'Exploratory'}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
                            <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Knowledge Score</div>
                            <div className="font-bold text-2xl">{knowledge.score}%</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
                            <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Employability</div>
                            <div className="font-bold text-2xl">{Math.round(employability.sjtScore)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Career Interest Profile (RIASEC) */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <Compass className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Career Interest Profile (RIASEC)</h2>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Your Holland Code: {riasec.code}</CardTitle>
                        <CardDescription>Based on your top three interest areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(riasec.scores).map(([type, score]) => {
                                const isTop3 = riasec.topThree.includes(type);
                                return (
                                    <div key={type}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">{type} - {riasecNames[type]}</span>
                                                {isTop3 && <Badge className="bg-green-100 text-green-700">Top 3</Badge>}
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">{score.toFixed(1)} / 5.0</span>
                                        </div>
                                        <Progress
                                            value={(score / 5) * 100}
                                            className="h-3"
                                            indicatorClassName={isTop3 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-400'}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="font-semibold text-blue-900 mb-2">What this means:</h4>
                            <p className="text-sm text-blue-800">
                                Your top interests are <strong>{riasec.topThree.map(t => riasecNames[t]).join(', ')}</strong>.
                                This combination suggests you would thrive in roles that blend {riasec.topThree[0] === 'I' ? 'analytical thinking' : riasec.topThree[0] === 'A' ? 'creativity' : riasec.topThree[0] === 'S' ? 'helping others' : riasec.topThree[0] === 'E' ? 'leadership' : riasec.topThree[0] === 'C' ? 'organization' : 'hands-on work'} with complementary skills.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Best-Fit Career Clusters */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <Target className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Best-Fit Career Clusters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clusters.slice(0, 2).map((cluster, idx) => (
                        <Card key={idx} className={`border-t-4 border-t-green-500 shadow-md ${idx === 0 ? 'ring-2 ring-green-500/20' : ''}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className="bg-green-100 text-green-700">
                                        {idx === 0 ? 'Top Match' : 'Strong Fit'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg">{cluster.title}</CardTitle>
                                <CardDescription>{cluster.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span>Match Score: {idx === 0 ? '95%' : '85%'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Personality Profile (Big Five) */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Personality Profile</h2>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Big Five Personality Traits</CardTitle>
                        <CardDescription>Understanding your work style and preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(bigFive).map(([trait, score]) => {
                                const level = getSkillLevel(score);
                                return (
                                    <div key={trait} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-800">{traitNames[trait]}</span>
                                            <Badge variant="outline" className={`bg-${level.color}-50 text-${level.color}-700 border-${level.color}-200`}>
                                                {level.level}
                                            </Badge>
                                        </div>
                                        <Progress value={(score / 5) * 100} className="h-2" />
                                        <p className="text-sm text-gray-600 italic">
                                            {getTraitInterpretation(trait, score)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Work Values */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <Heart className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Work Values & Motivators</h2>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle>What Drives Your Career Satisfaction</CardTitle>
                        <CardDescription>Your top 3 career motivators</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {workValues.topThree.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                            {idx + 1}
                                        </div>
                                        <h4 className="font-bold text-gray-800">{item.value}</h4>
                                    </div>
                                    <Progress value={(item.score / 5) * 100} className="h-2 mb-2" />
                                    <p className="text-xs text-gray-600">{(item.score).toFixed(1)} / 5.0</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Employability Skills */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">employability Skills Assessment</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Skill Readiness</CardTitle>
                            <CardDescription>Your current proficiency levels</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(employability.skillScores).map(([skill, score]) => {
                                    const level = getSkillLevel(score);
                                    return (
                                        <div key={skill}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-700">{skill}</span>
                                                <span className="text-xs text-gray-500">{score.toFixed(1)}/5</span>
                                            </div>
                                            <Progress value={(score / 5) * 100} className="h-2" />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader>
                            <CardTitle>Situational Judgement Score</CardTitle>
                            <CardDescription>Decision-making in workplace scenarios</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <div className="w-32 h-32 mx-auto mb-4 relative">
                                    <svg className="transform -rotate-90 w-32 h-32">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="#10b981"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 56}`}
                                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - employability.sjtScore / 100)}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-800">{Math.round(employability.sjtScore)}%</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {employability.sjtScore >= 80 ? 'Excellent decision-making skills' :
                                        employability.sjtScore >= 60 ? 'Good workplace judgement' :
                                            'Room for improvement in scenario handling'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Stream Knowledge */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <Code className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Stream Knowledge Assessment</h2>
                </div>

                <Card className="border-none shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{knowledge.score}%</h3>
                                <p className="text-gray-600">Overall Score</p>
                            </div>
                            <div className="text-right">
                                <Badge className={knowledge.score >= 70 ? 'bg-green-100 text-green-700' : knowledge.score >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}>
                                    {knowledge.score >= 70 ? 'Strong' : knowledge.score >= 50 ? 'Good' : 'Needs Improvement'}
                                </Badge>
                            </div>
                        </div>
                        <Progress value={knowledge.score} className="h-4 mb-4" />
                        <p className="text-sm text-gray-600">
                            You demonstrated {knowledge.score >= 70 ? 'strong' : knowledge.score >= 50 ? 'good' : 'foundational'} understanding of core concepts in your field.
                            {knowledge.score < 70 && ' Consider reviewing areas where you scored lower to strengthen your knowledge base.'}
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Next Steps */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Recommended Next Steps</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                            <Briefcase className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Explore Career Paths</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Research roles in {clusters[0]?.title} and related fields that match your {riasec.code} profile.
                            </p>
                            <Button variant="outline" className="w-full">View Opportunities</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                            <Layers className="w-12 h-12 text-blue-600 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Build Skills</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Focus on developing areas where you scored lower to become more well-rounded.
                            </p>
                            <Button variant="outline" className="w-full">Browse Courses</Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                            <Award className="w-12 h-12 text-amber-600 mb-4" />
                            <h3 className="font-bold text-lg mb-2">Connect with Mentors</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Speak with professionals in your target fields for guidance and insights.
                            </p>
                            <Button variant="outline" className="w-full">Find Mentors</Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-8">
                <Button
                    onClick={() => navigate('/student/dashboard')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                >
                    Back to Dashboard
                </Button>
                <Button
                    onClick={() => navigate('/student/assessment/test')}
                    variant="outline"
                >
                    Retake Assessment
                </Button>
            </div>
        </div>
    );
};

export default AssessmentResult;
