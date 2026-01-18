import { Brain, Target, Heart, Compass, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

/**
 * StageScoresSection - Detailed breakdown of each assessment stage
 * Shows comprehensive scores for all assessment stages
 */

// Helper function to get color based on percentage
const getScoreColor = (percentage) => {
    if (percentage >= 70) return { 
        bg: 'bg-green-500', 
        text: 'text-green-600', 
        light: 'bg-green-100', 
        border: 'border-green-200', 
        stroke: '#22c55e',
        gradient: 'from-green-500 to-emerald-500'
    };
    if (percentage >= 40) return { 
        bg: 'bg-yellow-500', 
        text: 'text-yellow-600', 
        light: 'bg-yellow-100', 
        border: 'border-yellow-200', 
        stroke: '#eab308',
        gradient: 'from-yellow-500 to-amber-500'
    };
    return { 
        bg: 'bg-red-500', 
        text: 'text-red-600', 
        light: 'bg-red-100', 
        border: 'border-red-200', 
        stroke: '#ef4444',
        gradient: 'from-red-500 to-rose-500'
    };
};

const StageScoresSection = ({ results, riasecNames }) => {
    const { riasec, aptitude, bigFive, workValues } = results;

    // Calculate stage completion and scores
    const stages = [
        {
            id: 'interest',
            name: 'Interest Explorer',
            icon: Compass,
            description: 'Career interests based on RIASEC model',
            color: 'blue',
            data: riasec,
            scores: riasec?.scores ? Object.entries(riasec.scores).map(([code, score]) => ({
                label: `${code} - ${riasecNames[code]}`,
                value: score,
                max: riasec.maxScore || 20,
                percentage: Math.round((score / (riasec.maxScore || 20)) * 100)
            })) : []
        },
        {
            id: 'aptitude',
            name: 'Cognitive Abilities',
            icon: Brain,
            description: 'Mental abilities and problem-solving skills',
            color: 'purple',
            data: aptitude,
            scores: aptitude?.scores ? Object.entries(aptitude.scores).map(([domain, data]) => {
                const configs = {
                    verbal: 'Verbal Reasoning',
                    numerical: 'Numerical Ability',
                    abstract: 'Abstract Reasoning',
                    spatial: 'Spatial Reasoning',
                    clerical: 'Clerical Speed'
                };
                const correct = typeof data === 'object' ? (data.correct || 0) : 0;
                const total = typeof data === 'object' ? (data.total || 1) : 1;
                const percentage = typeof data === 'object' 
                    ? (data.percentage || Math.round((correct / total) * 100))
                    : (typeof data === 'number' ? data : 0);
                
                return {
                    label: configs[domain.toLowerCase()] || domain,
                    value: correct,
                    max: total,
                    percentage
                };
            }) : []
        },
        {
            id: 'personality',
            name: 'Personality Traits',
            icon: Heart,
            description: 'Big Five personality dimensions',
            color: 'pink',
            data: bigFive,
            scores: bigFive ? [
                { label: 'Openness', value: bigFive.O || 0, max: 5, percentage: Math.round(((bigFive.O || 0) / 5) * 100) },
                { label: 'Conscientiousness', value: bigFive.C || 0, max: 5, percentage: Math.round(((bigFive.C || 0) / 5) * 100) },
                { label: 'Extraversion', value: bigFive.E || 0, max: 5, percentage: Math.round(((bigFive.E || 0) / 5) * 100) },
                { label: 'Agreeableness', value: bigFive.A || 0, max: 5, percentage: Math.round(((bigFive.A || 0) / 5) * 100) },
                { label: 'Neuroticism', value: bigFive.N || 0, max: 5, percentage: Math.round(((bigFive.N || 0) / 5) * 100) }
            ] : []
        },
        {
            id: 'values',
            name: 'Work Values',
            icon: Target,
            description: 'What motivates you in your career',
            color: 'indigo',
            data: workValues,
            scores: workValues?.topThree?.map((val, idx) => ({
                label: val.value,
                value: val.score,
                max: 5,
                percentage: Math.round((val.score / 5) * 100)
            })) || []
        }
    ];

    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-violet-500',
        pink: 'from-pink-500 to-rose-500',
        indigo: 'from-indigo-500 to-blue-500'
    };

    const iconBgMap = {
        blue: 'bg-blue-100',
        purple: 'bg-purple-100',
        pink: 'bg-pink-100',
        indigo: 'bg-indigo-100'
    };

    const iconColorMap = {
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        pink: 'text-pink-600',
        indigo: 'text-indigo-600'
    };

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">Detailed Assessment Breakdown</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Stage-by-Stage Performance</h2>
                <p className="text-gray-600 text-lg">Comprehensive analysis of each assessment component</p>
            </div>

            {/* Stage Cards */}
            <div className="grid gap-6">
                {stages.map((stage, stageIndex) => {
                    const IconComponent = stage.icon;
                    const hasData = stage.data && stage.scores.length > 0;
                    
                    // Calculate average score for the stage
                    const avgPercentage = hasData 
                        ? Math.round(stage.scores.reduce((sum, s) => sum + s.percentage, 0) / stage.scores.length)
                        : 0;
                    
                    const stageColor = getScoreColor(avgPercentage);

                    return (
                        <div 
                            key={stage.id} 
                            className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            {/* Stage Header */}
                            <div className={`bg-gradient-to-r ${colorMap[stage.color]} p-6`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-white/80 font-semibold text-sm">Stage {stageIndex + 1}</span>
                                                {hasData && <CheckCircle2 className="w-5 h-5 text-white" />}
                                            </div>
                                            <h3 className="text-2xl font-bold text-white">{stage.name}</h3>
                                            <p className="text-white/90 text-sm mt-1">{stage.description}</p>
                                        </div>
                                    </div>
                                    {hasData && (
                                        <div className="text-right">
                                            <div className="text-5xl font-bold text-white">{avgPercentage}%</div>
                                            <div className="text-white/90 text-sm font-medium mt-1">Average Score</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stage Scores */}
                            <div className="p-6">
                                {hasData ? (
                                    <div className="space-y-4">
                                        {stage.scores.map((score, idx) => {
                                            const scoreColor = getScoreColor(score.percentage);
                                            return (
                                                <div key={idx} className="group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg ${scoreColor.light} flex items-center justify-center`}>
                                                                <span className={`text-sm font-bold ${scoreColor.text}`}>{idx + 1}</span>
                                                            </div>
                                                            <span className="text-gray-800 font-semibold text-lg">{score.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-gray-600 font-medium">
                                                                {score.value.toFixed(1)}/{score.max}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${scoreColor.light} ${scoreColor.text} min-w-[60px] text-center`}>
                                                                {score.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full bg-gradient-to-r ${scoreColor.gradient} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`}
                                                            style={{ width: `${score.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Stage Summary */}
                                        <div className={`mt-6 p-4 rounded-xl ${stageColor.light} border ${stageColor.border}`}>
                                            <div className="flex items-start gap-3">
                                                <Award className={`w-6 h-6 ${stageColor.text} mt-0.5`} />
                                                <div>
                                                    <h4 className={`font-bold ${stageColor.text} text-lg mb-1`}>
                                                        {avgPercentage >= 70 ? 'Excellent Performance' : avgPercentage >= 40 ? 'Good Performance' : 'Room for Growth'}
                                                    </h4>
                                                    <p className="text-gray-700 text-sm leading-relaxed">
                                                        {avgPercentage >= 70 
                                                            ? `You demonstrated strong capabilities in ${stage.name.toLowerCase()}, showing clear strengths that will benefit your career path.`
                                                            : avgPercentage >= 40
                                                            ? `You showed solid performance in ${stage.name.toLowerCase()}. Continue developing these areas for even better results.`
                                                            : `This area presents opportunities for growth. Focus on developing skills in ${stage.name.toLowerCase()} to enhance your profile.`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500 italic">No data available for this stage</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Overall Summary */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-8 text-white">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-3">Overall Assessment Summary</h3>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Your assessment covered {stages.filter(s => s.data).length} key areas of career development. 
                            Each stage provides unique insights into your strengths, interests, and potential career paths. 
                            Use these detailed scores to understand where you excel and where you can focus your development efforts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StageScoresSection;
