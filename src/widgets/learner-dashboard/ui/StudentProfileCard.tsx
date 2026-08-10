import React, { useState, useEffect } from 'react';
import { GraduationCap, Building2, CreditCard, Award, TrendingUp, Target, User } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { CircularProgress } from '@/shared/ui/CircularProgress';
import { generateProfileQRCodeSync } from '@/shared/lib/utils/qrCode';
import { calculateEnrollabilityScore, type LearnerWithCourses } from '@/shared/lib/calculations/enrollability';
import type { StudentProfileCardProps, EnrollabilityScore } from '../model/types';

/**
 * StudentProfileCard Widget
 * 
 * Consolidated component merging functionality from:
 * - HeroSection.jsx (QR code generation and profile header)
 * - PersonalInfoSummary.jsx (profile information display)
 * - EmployabilityScoreCard.jsx (score visualization with circular progress)
 * 
 * Displays comprehensive student profile with:
 * - Student photo/avatar with QR code
 * - College identification (ID, program, semester, link range ID)
 * - Enrollability score with circular progress indicator
 * - Color-coded score status (excellent/good/average/needs-improvement)
 * - Quick access to full profile editing
 * 
 * **Performance Optimization**: Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * @param learnerData - Student profile data including scores and college info
 * @param onViewProfile - Callback when "View Full Profile" is clicked
 */
const StudentProfileCard: React.FC<StudentProfileCardProps> = React.memo(({
    learnerData,
    onViewProfile,
}) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [qrCodeError, setQrCodeError] = useState<boolean>(false);

    // Generate QR code on mount
    useEffect(() => {
        if (learnerData.id) {
            generateProfileQRCodeSync(
                learnerData.id,
                (dataUrl) => {
                    setQrCodeDataUrl(dataUrl);
                    setQrCodeError(false);
                },
                (error) => {
                    console.error('Failed to generate QR code:', error);
                    setQrCodeError(true);
                }
            );
        }
    }, [learnerData.id]);

    // Get color scheme based on enrollability score
    const getScoreColorScheme = (score: number) => {
        if (score >= 85) {
            return {
                gradient: 'from-green-500 to-emerald-500',
                text: 'text-green-600',
                bg: 'bg-green-100',
                border: 'border-green-300',
                status: 'Excellent',
                circularColor: '#10b981', // green-500
            };
        }
        if (score >= 70) {
            return {
                gradient: 'from-blue-500 via-indigo-500 to-blue-600',
                text: 'text-blue-600',
                bg: 'bg-blue-100',
                border: 'border-blue-300',
                status: 'Good',
                circularColor: '#3b82f6', // blue-500
            };
        }
        if (score >= 50) {
            return {
                gradient: 'from-amber-500 to-yellow-500',
                text: 'text-amber-600',
                bg: 'bg-amber-100',
                border: 'border-amber-300',
                status: 'Average',
                circularColor: '#f59e0b', // amber-500
            };
        }
        return {
            gradient: 'from-orange-500 to-red-500',
            text: 'text-red-600',
            bg: 'bg-red-100',
            border: 'border-red-300',
            status: 'Needs Improvement',
            circularColor: '#ef4444', // red-500
        };
    };

    const scoreColors = getScoreColorScheme(learnerData.enrollabilityScore);

    return (
        <Card className="border-2 border-blue-200 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500" />

            <CardContent className="p-6 pt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Left Column - Profile Information */}
                    <div className="space-y-6">
                        {/* Profile Header with Avatar */}
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                {learnerData.avatar ? (
                                    <img
                                        src={learnerData.avatar}
                                        alt={learnerData.name}
                                        className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md border-2 border-white">
                                        <GraduationCap className="w-8 h-8 text-white" />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                    <Award className="w-3 h-3 text-white" />
                                </div>
                            </div>

                            <div className="flex-1 pt-1">
                                <h2 className="text-2xl font-bold text-gray-900">{learnerData.name}</h2>
                                <p className="text-sm text-gray-600 mt-1">{learnerData.email}</p>
                            </div>
                        </div>

                        {/* College Information */}
                        <div className="space-y-3 ml-1">
                            <div className="flex items-center gap-2 text-gray-700">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{learnerData.collegeName}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-700">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">College ID: {learnerData.collegeId}</span>
                            </div>

                            {learnerData.linkRangeId && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm">Link Range ID: {learnerData.linkRangeId}</span>
                                </div>
                            )}
                        </div>

                        {/* Program and Semester Tags */}
                        <div className="flex flex-wrap gap-3 ml-1">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300 border px-4 py-1.5 text-sm font-medium rounded-full shadow-sm">
                                {learnerData.program}
                            </Badge>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 border px-4 py-1.5 text-sm font-medium rounded-full shadow-sm">
                                Semester {learnerData.semester}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-300 border px-4 py-1.5 text-sm font-medium rounded-full shadow-sm">
                                {learnerData.grade}
                            </Badge>
                        </div>

                        {/* View Full Profile Button */}
                        {onViewProfile && (
                            <button
                                onClick={onViewProfile}
                                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                View Full Profile
                            </button>
                        )}
                    </div>

                    {/* Right Column - QR Code and Enrollability Score */}
                    <div className="space-y-6">

                        {/* QR Code Card */}
                        <Card className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg">
                            <CardContent className="p-6 text-center">
                                <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-xl flex items-center justify-center shadow-md p-2">
                                    {qrCodeDataUrl && !qrCodeError ? (
                                        <img
                                            src={qrCodeDataUrl}
                                            alt="Profile QR Code"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : qrCodeError ? (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <div className="text-center">
                                                <Award className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-xs">QR Unavailable</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 font-semibold">
                                    PASSPORT-ID: {learnerData.collegeId}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Enrollability Score Section */}
                        <div className={`space-y-4 p-6 rounded-2xl shadow-lg border-2 ${scoreColors.border} bg-gradient-to-br ${scoreColors.bg} to-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className={`w-5 h-5 ${scoreColors.text}`} />
                                    <span className="font-bold text-gray-900">Enrollability Score</span>
                                </div>
                                <span className={`text-2xl font-bold ${scoreColors.text} drop-shadow-sm`}>
                                    {learnerData.enrollabilityScore}%
                                </span>
                            </div>

                            {/* Circular Progress Indicator */}
                            <div className="flex flex-col items-center justify-center py-4">
                                <CircularProgress
                                    value={learnerData.enrollabilityScore}
                                    size={120}
                                    strokeWidth={10}
                                    color={scoreColors.circularColor}
                                />
                                <p className={`text-sm font-semibold ${scoreColors.text} mt-3`}>
                                    {scoreColors.status}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-3 bg-white/60 rounded-full overflow-hidden border border-gray-200">
                                <div
                                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${scoreColors.gradient} rounded-full transition-all duration-500 shadow-md`}
                                    style={{ width: `${learnerData.enrollabilityScore}%` }}
                                />
                            </div>

                            {/* Score Range Labels */}
                            <div className="flex justify-between text-xs text-gray-600 font-medium">
                                <span>Beginner</span>
                                <span>Expert</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

StudentProfileCard.displayName = 'StudentProfileCard';

export default StudentProfileCard;
