/**
 * Component Showcase
 * 
 * This file demonstrates all the reusable UI components created for the college dashboard redesign.
 * Used for visual testing and documentation purposes.
 */

import React from 'react';
import { CircularProgress } from './CircularProgress';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { StatCard } from './StatCard';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton, SkeletonCard, SkeletonAvatar, SkeletonText } from './LoadingSkeleton';

export const ComponentShowcase: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl space-y-12">
                <div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">
                        UI Component Showcase
                    </h1>
                    <p className="text-gray-600">
                        Reusable components for the college dashboard redesign
                    </p>
                </div>

                {/* CircularProgress */}
                <Card>
                    <CardHeader>
                        <CardTitle>Circular Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-8">
                            <CircularProgress value={85} color="green" label="Excellent" />
                            <CircularProgress value={75} color="blue" label="Good" />
                            <CircularProgress value={60} color="yellow" label="Average" />
                            <CircularProgress value={35} color="red" label="Needs Work" />
                        </div>
                    </CardContent>
                </Card>

                {/* ProgressBar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Progress Bars</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <ProgressBar value={92} label="Problem Solving" showPercentage />
                            <ProgressBar value={88} label="Communication" showPercentage />
                            <ProgressBar value={74} label="Technical Skills" showPercentage />
                            <ProgressBar value={55} label="Teamwork" showPercentage />
                            <ProgressBar value={63} label="Critical Thinking" showPercentage />
                        </div>
                    </CardContent>
                </Card>

                {/* Badges */}
                <Card>
                    <CardHeader>
                        <CardTitle>Badges</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Badge variant="success">Active</Badge>
                            <Badge variant="warning">Pending</Badge>
                            <Badge variant="error">Expired</Badge>
                            <Badge variant="info">Verified</Badge>
                            <Badge variant="default">Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* StatCards */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stat Cards</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <StatCard
                                title="Current Streak"
                                value={15}
                                subtitle="days"
                                icon={
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                }
                                trend={{ value: 5, direction: 'up' }}
                            />
                            <StatCard
                                title="Total Badges"
                                value={42}
                                subtitle="earned"
                                icon={
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                }
                            />
                            <StatCard
                                title="Certificates"
                                value={8}
                                subtitle="verified"
                                icon={
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card Variants */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card variant="default" padding="md" shadow="sm">
                        <CardContent>
                            <h3 className="font-semibold">Default Card</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Clean white background with subtle border
                            </p>
                        </CardContent>
                    </Card>
                    <Card variant="blue" padding="md" shadow="sm">
                        <CardContent>
                            <h3 className="font-semibold">Blue Card</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Blue tinted background for information
                            </p>
                        </CardContent>
                    </Card>
                    <Card variant="orange" padding="md" shadow="sm">
                        <CardContent>
                            <h3 className="font-semibold">Orange Card</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Orange tinted background for highlights
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Loading Skeletons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loading Skeletons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <h4 className="mb-3 text-sm font-medium text-gray-700">
                                    Text Skeleton
                                </h4>
                                <SkeletonText lines={3} />
                            </div>
                            <div>
                                <h4 className="mb-3 text-sm font-medium text-gray-700">
                                    Avatar Skeleton
                                </h4>
                                <SkeletonAvatar size={60} />
                            </div>
                            <div>
                                <h4 className="mb-3 text-sm font-medium text-gray-700">
                                    Card Skeleton
                                </h4>
                                <SkeletonCard />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Boundary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Error Boundary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ErrorBoundary>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <p className="text-sm text-green-800">
                                    ✓ This content is wrapped in an ErrorBoundary and renders
                                    successfully
                                </p>
                            </div>
                        </ErrorBoundary>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ComponentShowcase;
