/**
 * SkillPassportCard Example Usage
 * 
 * Demonstrates how to use the SkillPassportCard widget with various scenarios
 */

import React from 'react';
import { SkillPassportCard } from './SkillPassportCard';
import type { SkillPassportCardProps } from '../model/types';

/**
 * Example 1: Active verification with mixed skill levels
 */
export const ActivePassportExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 15,
            skillScore: 75,
            certificates: 8,
            verificationStatus: 'active',
            lastVerified: new Date('2024-01-15'),
            skills: [
                // Healthy skills (>75% proficiency)
                { name: 'JavaScript', proficiency: 90 },
                { name: 'React', proficiency: 85 },
                { name: 'TypeScript', proficiency: 88 },
                { name: 'Node.js', proficiency: 82 },
                { name: 'Git', proficiency: 95 },
                { name: 'CSS', proficiency: 80 },
                // Upskill skills (50-75% proficiency)
                { name: 'Python', proficiency: 70 },
                { name: 'Docker', proficiency: 65 },
                { name: 'AWS', proficiency: 60 },
                { name: 'MongoDB', proficiency: 68 },
                { name: 'GraphQL', proficiency: 72 },
                // Critical skills (<50% proficiency)
                { name: 'Kubernetes', proficiency: 45 },
                { name: 'Java', proficiency: 40 },
                { name: 'C++', proficiency: 35 },
                { name: 'Rust', proficiency: 30 },
            ],
        },
        onUpskill: () => {
            console.log('Navigate to skill improvement resources');
            // Navigate to /learner/my-skills or upskilling page
        },
        onViewDetails: () => {
            console.log('Navigate to digital portfolio');
            // Navigate to /learner/digital-portfolio
        },
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example 2: Pending verification status
 */
export const PendingVerificationExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 8,
            skillScore: 55,
            certificates: 3,
            verificationStatus: 'pending',
            skills: [
                { name: 'JavaScript', proficiency: 75 },
                { name: 'React', proficiency: 70 },
                { name: 'HTML/CSS', proficiency: 85 },
                { name: 'Git', proficiency: 65 },
                { name: 'Python', proficiency: 60 },
                { name: 'SQL', proficiency: 55 },
                { name: 'Docker', proficiency: 45 },
                { name: 'AWS', proficiency: 40 },
            ],
        },
        onUpskill: () => console.log('Upskill clicked'),
        onViewDetails: () => console.log('View details clicked'),
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example 3: Expired verification status - needs renewal
 */
export const ExpiredVerificationExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 12,
            skillScore: 68,
            certificates: 5,
            verificationStatus: 'expired',
            lastVerified: new Date('2023-06-01'),
            skills: [
                { name: 'JavaScript', proficiency: 80 },
                { name: 'React', proficiency: 78 },
                { name: 'Node.js', proficiency: 75 },
                { name: 'Python', proficiency: 70 },
                { name: 'SQL', proficiency: 72 },
                { name: 'Git', proficiency: 85 },
                { name: 'Docker', proficiency: 55 },
                { name: 'MongoDB', proficiency: 60 },
                { name: 'AWS', proficiency: 50 },
                { name: 'TypeScript', proficiency: 65 },
                { name: 'GraphQL', proficiency: 45 },
                { name: 'Kubernetes', proficiency: 40 },
            ],
        },
        onUpskill: () => console.log('Upskill clicked'),
        onViewDetails: () => console.log('View details clicked'),
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example 4: No verification - beginner with few skills
 */
export const NoVerificationExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 5,
            skillScore: 35,
            certificates: 1,
            verificationStatus: 'none',
            skills: [
                { name: 'HTML', proficiency: 70 },
                { name: 'CSS', proficiency: 65 },
                { name: 'JavaScript', proficiency: 50 },
                { name: 'Git', proficiency: 45 },
                { name: 'React', proficiency: 35 },
            ],
        },
        onUpskill: () => console.log('Upskill clicked'),
        onViewDetails: () => console.log('View details clicked'),
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example 5: High achiever - excellent skill score
 */
export const HighAchieverExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 25,
            skillScore: 92,
            certificates: 15,
            verificationStatus: 'active',
            lastVerified: new Date('2024-02-01'),
            skills: [
                // Mostly healthy skills
                { name: 'JavaScript', proficiency: 95 },
                { name: 'TypeScript', proficiency: 92 },
                { name: 'React', proficiency: 94 },
                { name: 'Node.js', proficiency: 90 },
                { name: 'Python', proficiency: 88 },
                { name: 'Java', proficiency: 85 },
                { name: 'Go', proficiency: 82 },
                { name: 'Rust', proficiency: 78 },
                { name: 'Docker', proficiency: 90 },
                { name: 'Kubernetes', proficiency: 87 },
                { name: 'AWS', proficiency: 92 },
                { name: 'Azure', proficiency: 85 },
                { name: 'GCP', proficiency: 80 },
                { name: 'Git', proficiency: 95 },
                { name: 'CI/CD', proficiency: 90 },
                { name: 'MongoDB', proficiency: 88 },
                { name: 'PostgreSQL', proficiency: 92 },
                { name: 'Redis', proficiency: 85 },
                { name: 'GraphQL', proficiency: 87 },
                { name: 'REST APIs', proficiency: 95 },
                // A few upskill areas
                { name: 'Machine Learning', proficiency: 65 },
                { name: 'Data Science', proficiency: 60 },
                { name: 'Blockchain', proficiency: 55 },
                // One critical area to improve
                { name: 'Embedded Systems', proficiency: 40 },
                { name: 'Assembly', proficiency: 35 },
            ],
        },
        onUpskill: () => console.log('Upskill clicked'),
        onViewDetails: () => console.log('View details clicked'),
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example 6: Empty skills array - edge case
 */
export const EmptySkillsExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 0,
            skillScore: 0,
            certificates: 0,
            verificationStatus: 'none',
            skills: [],
        },
        onUpskill: () => console.log('Upskill clicked'),
        onViewDetails: () => console.log('View details clicked'),
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example 7: Component without callbacks (optional props)
 */
export const WithoutCallbacksExample: React.FC = () => {
    const props: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 10,
            skillScore: 60,
            certificates: 4,
            verificationStatus: 'active',
            lastVerified: new Date('2024-01-01'),
            skills: [
                { name: 'JavaScript', proficiency: 75 },
                { name: 'React', proficiency: 70 },
                { name: 'CSS', proficiency: 80 },
                { name: 'HTML', proficiency: 85 },
                { name: 'Git', proficiency: 65 },
                { name: 'TypeScript', proficiency: 60 },
                { name: 'Node.js', proficiency: 55 },
                { name: 'Python', proficiency: 50 },
                { name: 'Docker', proficiency: 45 },
                { name: 'AWS', proficiency: 40 },
            ],
        },
        // No callbacks provided
    };

    return <SkillPassportCard {...props} />;
};

/**
 * Example Dashboard - All scenarios side by side
 */
export const SkillPassportCardExamples: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8">SkillPassportCard Examples</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl">
                <div>
                    <h2 className="text-xl font-semibold mb-4">1. Active Verification</h2>
                    <ActivePassportExample />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">2. Pending Verification</h2>
                    <PendingVerificationExample />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">3. Expired Verification</h2>
                    <ExpiredVerificationExample />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">4. No Verification</h2>
                    <NoVerificationExample />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">5. High Achiever</h2>
                    <HighAchieverExample />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">6. Empty Skills</h2>
                    <EmptySkillsExample />
                </div>
            </div>
        </div>
    );
};

export default SkillPassportCardExamples;
