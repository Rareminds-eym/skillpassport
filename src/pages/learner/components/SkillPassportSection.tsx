/**
 * SkillPassportSection Component
 * 
 * Displays skill passport with profile strength and verification status
 */

import { IdentificationIcon, CheckCircleIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/ui';
import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';

const SkillPassportSection = () => {
    const navigate = useNavigate();
    const { skillHealth, skills, achievements, skillsLoading, achievementsLoading } = useCollegeDashboard();

    // Calculate profile strength percentage
    const profileStrength = skillHealth?.overallHealthPercentage || 40;

    // Determine status based on profile strength
    const getStatus = (percentage: number) => {
        if (percentage >= 70) return { label: 'Healthy', color: 'text-green-600', bgColor: 'bg-green-50', dotColor: 'bg-green-500' };
        if (percentage >= 40) return { label: 'Update Your Profile', color: 'text-yellow-600', bgColor: 'bg-yellow-50', dotColor: 'bg-yellow-500' };
        return { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', dotColor: 'bg-red-500' };
    };

    const status = getStatus(profileStrength);

    // Calculate metrics
    const verifiedSkillsCount = Array.isArray(skills) ? skills.filter(skill => skill.verified).length : 0;
    const skillScore = Math.round(profileStrength * 1.5); // Convert to 0-100+ scale
    const certificatesCount = achievements?.certificates?.length || 4;
    const isPassportVerified = profileStrength >= 70;

    if (skillsLoading || achievementsLoading) {
        return (
            <Card className="h-full bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                    <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="p-2 rounded-lg bg-blue-500">
                            <IdentificationIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900">Skill Passport</div>
                            <div className="text-xs text-gray-500 font-normal">Status & verification</div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 animate-pulse">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 m-0 p-0">
                    <div className="p-2 rounded-lg bg-blue-500">
                        <IdentificationIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900">Skill Passport</div>
                        <div className="text-xs text-gray-500 font-normal">Status & verification</div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Profile Strength Circle and Status Indicators */}
                <div className="flex items-start justify-between gap-6">
                    {/* Left: Circular Progress */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-36 h-36">
                            {/* Background circle */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="64"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="72"
                                    cy="72"
                                    r="64"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 64}`}
                                    strokeDashoffset={`${2 * Math.PI * 64 * (1 - profileStrength / 100)}`}
                                    className={profileStrength >= 70 ? 'text-green-500' : profileStrength >= 40 ? 'text-yellow-400' : 'text-red-500'}
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* Center text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className={`text-4xl font-bold ${profileStrength >= 70 ? 'text-green-600' : profileStrength >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {Math.round(profileStrength)}%
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                    Profile
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                    Strength
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Status Indicators */}
                    <div className="flex-1 space-y-2">
                        {/* Healthy Status */}
                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${profileStrength >= 70 ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <div className={`w-3 h-3 rounded-full ${profileStrength >= 70 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm font-medium ${profileStrength >= 70 ? 'text-green-700' : 'text-gray-500'}`}>
                                Healthy
                            </span>
                        </div>

                        {/* Update Profile Status */}
                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${profileStrength >= 40 && profileStrength < 70 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                            <div className={`w-3 h-3 rounded-full ${profileStrength >= 40 && profileStrength < 70 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm font-medium ${profileStrength >= 40 && profileStrength < 70 ? 'text-yellow-700' : 'text-gray-500'}`}>
                                Update Your Profile
                            </span>
                        </div>

                        {/* Critical Status */}
                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${profileStrength < 40 ? 'bg-red-50' : 'bg-gray-50'}`}>
                            <div className={`w-3 h-3 rounded-full ${profileStrength < 40 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm font-medium ${profileStrength < 40 ? 'text-red-700' : 'text-gray-500'}`}>
                                Critical
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="space-y-3">
                    {/* Verified Skills */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Verified Skills</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">{verifiedSkillsCount}</span>
                    </div>

                    {/* Skill Score */}
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <StarIcon className="w-5 h-5 text-yellow-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Skill Score</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">{skillScore}</span>
                    </div>

                    {/* Certificates */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <IdentificationIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Certificates</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">{certificatesCount}</span>
                    </div>
                </div>

                {/* Passport Verified Badge */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${isPassportVerified ? 'bg-green-100 border border-green-200' : 'bg-gray-100 border border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                        <CheckCircleSolid className={`w-5 h-5 ${isPassportVerified ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold ${isPassportVerified ? 'text-green-700' : 'text-gray-600'}`}>
                            Passport Verified
                        </span>
                    </div>
                    <span className={`text-sm font-bold ${isPassportVerified ? 'text-green-700' : 'text-gray-500'}`}>
                        {isPassportVerified ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Update CTA Button */}
                <Button
                    onClick={() => navigate('/learner/digital-portfolio')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 shadow-sm hover:shadow-md transition-all duration-200"
                >
                    Update
                </Button>
            </CardContent>
        </Card>
    );
};

export default SkillPassportSection;
