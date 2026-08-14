/**
 * OpportunitiesSection Component
 * 
 * Displays all job opportunities with tabs for Jobs and Applied
 * Features scrollable list to show all available jobs
 */

import { useState } from 'react';
import { BriefcaseIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/shared/ui';
import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';

const OpportunitiesSection = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'jobs' | 'applied'>('jobs');
    const { opportunities, opportunitiesLoading } = useCollegeDashboard();

    // Filter opportunities - separate jobs from factory visits
    const allJobs = Array.isArray(opportunities)
        ? opportunities.filter((opp: any) => opp.employment_type !== 'factory_visit')
        : [];

    // Add mock data for testing if no real data
    const mockJobs = [
        {
            id: 'mock-1',
            title: 'Frontend Developer/Intern',
            company_name: 'TechStart Solutions',
            location: 'Bangalore',
            employment_type: 'internship',
            sector: 'Technology',
            required_skills: ['React', 'TypeScript', 'JavaScript'],
            posted_date: new Date().toISOString(),
        },
        {
            id: 'mock-2',
            title: 'AI/ML Engineer',
            company_name: 'DataCloud Labs',
            location: 'Hyderabad',
            employment_type: 'full-time',
            sector: 'Data Science',
            required_skills: ['Python', 'TensorFlow', 'Machine Learning'],
            posted_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'mock-3',
            title: 'Full Stack Developer',
            company_name: 'Startup Innovations',
            location: 'Remote',
            employment_type: 'full-time',
            sector: 'Software',
            required_skills: ['Node.js', 'React', 'MongoDB'],
            posted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    // Use real data if available, otherwise use mock data for demonstration
    const jobsToDisplay = allJobs.length > 0 ? allJobs : mockJobs;

    // Mock applied jobs - replace with actual applied jobs data when available
    const appliedJobs: any[] = [];

    const jobsCount = jobsToDisplay.length;
    const appliedCount = appliedJobs.length;
    const displayedJobs = activeTab === 'jobs' ? jobsToDisplay : appliedJobs;

    if (opportunitiesLoading) {
        return (
            <Card className="h-full bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 m-0 p-0">
                            <div className="p-2 rounded-lg bg-blue-500">
                                <BriefcaseIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-base font-bold text-gray-900">Opportunities</span>
                        </CardTitle>
                        <span className="text-sm text-blue-600 font-medium cursor-pointer">View All →</span>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="p-2 rounded-lg bg-blue-500">
                            <BriefcaseIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-base font-bold text-gray-900">Opportunities</span>
                    </CardTitle>
                    <button
                        onClick={() => navigate('/learner/opportunities')}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                        View All →
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'jobs'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Jobs ({jobsCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('applied')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'applied'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Applied ({appliedCount})
                    </button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Scrollable Job List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {displayedJobs.length === 0 ? (
                        <div className="text-center py-8">
                            <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">
                                {activeTab === 'jobs' ? 'No job opportunities available' : 'No applied jobs yet'}
                            </p>
                        </div>
                    ) : (
                        displayedJobs.map((job: any) => {
                            // Parse job details
                            const title = job.title || job.job_title || 'Untitled Position';
                            const company = job.company_name || 'Company';
                            const location = job.location || 'Location not specified';

                            // Extract tags from job data
                            const tags: string[] = [];
                            if (job.employment_type) tags.push(job.employment_type);
                            if (job.sector) tags.push(job.sector);
                            if (job.required_skills && Array.isArray(job.required_skills)) {
                                tags.push(...job.required_skills.slice(0, 2));
                            }

                            // Check if job is new (posted within last 7 days)
                            const isNew = job.posted_date
                                ? (new Date().getTime() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24) < 7
                                : false;

                            return (
                                <div
                                    key={job.id}
                                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
                                >
                                    {/* Company Logo Placeholder */}
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <BriefcaseIcon className="w-6 h-6 text-gray-400" />
                                    </div>

                                    {/* Job Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 mb-1">
                                            <h4 className="text-base font-bold text-gray-900 line-clamp-1">
                                                {title}
                                            </h4>
                                            {isNew && (
                                                <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 rounded flex-shrink-0">
                                                    New
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap">
                                            <span className="truncate">{company}</span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <MapPinIcon className="w-4 h-4" />
                                                <span className="truncate">{location}</span>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tags.slice(0, 4).map((tag, index) => (
                                                    <Badge
                                                        key={index}
                                                        className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Apply Button */}
                                    <Button
                                        onClick={() => navigate(`/learner/opportunities`)}
                                        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 text-sm shadow-sm transition-all"
                                    >
                                        Apply
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default OpportunitiesSection;
