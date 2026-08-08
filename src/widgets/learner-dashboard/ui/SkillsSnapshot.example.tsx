/**
 * SkillsSnapshot Component Usage Example
 * 
 * This file demonstrates how to use the SkillsSnapshot widget
 * in the college dashboard redesign.
 */

import React from 'react';
import SkillsSnapshot from './SkillsSnapshot';
import type { SkillMetric } from '../model/types';

// Example 1: Basic Usage with Mock Data
export const BasicExample: React.FC = () => {
    const skills: SkillMetric[] = [
        {
            id: '1',
            name: 'Problem Solving',
            category: 'problem-solving',
            proficiency: 92,
            lastAssessed: new Date('2024-01-15'),
            assessmentSource: 'test',
            trend: 'up',
            recommendations: ['Practice algorithm challenges', 'Work on complex projects'],
        },
        {
            id: '2',
            name: 'Communication',
            category: 'communication',
            proficiency: 88,
            lastAssessed: new Date('2024-01-10'),
            assessmentSource: 'self',
            trend: 'stable',
            recommendations: ['Present more frequently', 'Join public speaking groups'],
        },
        {
            id: '3',
            name: 'Technical Skills',
            category: 'technical',
            proficiency: 74,
            lastAssessed: new Date('2024-01-20'),
            assessmentSource: 'project',
            trend: 'up',
            recommendations: ['Complete advanced tutorials', 'Build portfolio projects'],
        },
        {
            id: '4',
            name: 'Teamwork',
            category: 'teamwork',
            proficiency: 55,
            lastAssessed: new Date('2024-01-05'),
            assessmentSource: 'ai-evaluated',
            trend: 'down',
            recommendations: ['Participate in team projects', 'Improve collaboration skills'],
        },
        {
            id: '5',
            name: 'Critical Thinking',
            category: 'critical-thinking',
            proficiency: 63,
            lastAssessed: new Date('2024-01-12'),
            assessmentSource: 'test',
            trend: 'stable',
            recommendations: ['Solve case studies', 'Practice analytical reasoning'],
        },
        {
            id: '6',
            name: 'Leadership',
            category: 'teamwork',
            proficiency: 45,
            assessmentSource: 'self',
            trend: 'up',
        },
    ];

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">SkillsSnapshot - Basic Example</h1>
            <SkillsSnapshot skills={skills} />
        </div>
    );
};

// Example 2: With Callbacks
export const WithCallbacksExample: React.FC = () => {
    const skills: SkillMetric[] = [
        {
            id: '1',
            name: 'JavaScript',
            category: 'technical',
            proficiency: 85,
            lastAssessed: new Date(),
            assessmentSource: 'test',
            trend: 'up',
        },
        {
            id: '2',
            name: 'React',
            category: 'technical',
            proficiency: 78,
            assessmentSource: 'project',
            trend: 'up',
        },
        {
            id: '3',
            name: 'TypeScript',
            category: 'technical',
            proficiency: 70,
            assessmentSource: 'test',
            trend: 'stable',
        },
    ];

    const handleImproveSkill = (skillId: string) => {
        const skill = skills.find(s => s.id === skillId);
        console.log(`Navigate to improvement resources for: ${skill?.name}`);
        // Navigate to /learner/skills/improve/${skillId}
    };

    const handleViewAll = () => {
        console.log('Navigate to complete skills page');
        // Navigate to /learner/my-skills
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">SkillsSnapshot - With Callbacks</h1>
            <SkillsSnapshot
                skills={skills}
                onImproveSkill={handleImproveSkill}
                onViewAll={handleViewAll}
            />
        </div>
    );
};

// Example 3: Empty State
export const EmptyStateExample: React.FC = () => {
    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">SkillsSnapshot - Empty State</h1>
            <SkillsSnapshot skills={[]} />
        </div>
    );
};

// Example 4: Dashboard Integration
export const DashboardIntegrationExample: React.FC = () => {
    // In a real dashboard, this would come from API/state management
    const learnerSkills: SkillMetric[] = [
        {
            id: 'ps-1',
            name: 'Problem Solving',
            category: 'problem-solving',
            proficiency: 92,
            lastAssessed: new Date('2024-01-15'),
            assessmentSource: 'test',
            trend: 'up',
        },
        {
            id: 'comm-1',
            name: 'Communication',
            category: 'communication',
            proficiency: 88,
            assessmentSource: 'self',
            trend: 'stable',
        },
        {
            id: 'tech-1',
            name: 'Full Stack Development',
            category: 'technical',
            proficiency: 74,
            lastAssessed: new Date('2024-01-20'),
            assessmentSource: 'project',
            trend: 'up',
        },
        {
            id: 'team-1',
            name: 'Teamwork',
            category: 'teamwork',
            proficiency: 55,
            assessmentSource: 'ai-evaluated',
            trend: 'down',
        },
        {
            id: 'ct-1',
            name: 'Critical Thinking',
            category: 'critical-thinking',
            proficiency: 63,
            assessmentSource: 'test',
            trend: 'stable',
        },
        {
            id: 'tech-2',
            name: 'Data Analysis',
            category: 'technical',
            proficiency: 68,
            assessmentSource: 'project',
            trend: 'up',
        },
        {
            id: 'ps-2',
            name: 'Analytical Thinking',
            category: 'problem-solving',
            proficiency: 81,
            assessmentSource: 'test',
            trend: 'stable',
        },
    ];

    const handleImproveSkill = (skillId: string) => {
        // Navigate to skill improvement page
        window.location.href = `/learner/skills/improve/${skillId}`;
    };

    const handleViewAll = () => {
        // Navigate to all skills page
        window.location.href = '/learner/my-skills';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        College Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Welcome back! Here's your skills overview.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Other dashboard widgets would go here */}
                    <div className="lg:col-span-1">
                        <SkillsSnapshot
                            skills={learnerSkills}
                            onImproveSkill={handleImproveSkill}
                            onViewAll={handleViewAll}
                        />
                    </div>

                    {/* More widgets... */}
                </div>
            </div>
        </div>
    );
};

// Export all examples
export default {
    BasicExample,
    WithCallbacksExample,
    EmptyStateExample,
    DashboardIntegrationExample,
};
