/**
 * StudentProfileCard Example Usage
 * 
 * This file demonstrates how to use the StudentProfileCard component
 * in the college student dashboard.
 */

import React from 'react';
import StudentProfileCard from './StudentProfileCard';
import type { StudentProfileCardProps } from '../model/types';

/**
 * Example 1: Basic usage with complete data
 */
export function BasicExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-123',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@stanford.edu',
        avatar: 'https://example.com/avatars/sarah.jpg',
        collegeId: 'SU2024-8421',
        collegeName: 'Stanford University',
        linkRangeId: 'LR-2024-CS-001',
        program: 'B.Tech Computer Science',
        semester: 5,
        enrollabilityScore: 78,
        grade: 'UG',
    };

    const handleViewProfile = () => {
        console.log('Navigating to full profile page...');
        // In real implementation: navigate('/learner/profile')
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Student Profile Card - Basic Example</h1>
            <StudentProfileCard
                learnerData={learnerData}
                onViewProfile={handleViewProfile}
            />
        </div>
    );
}

/**
 * Example 2: Excellent Score (>= 85)
 */
export function ExcellentScoreExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-456',
        name: 'Alex Chen',
        email: 'alex.chen@mit.edu',
        collegeId: 'MIT2024-1234',
        collegeName: 'Massachusetts Institute of Technology',
        program: 'M.Tech Artificial Intelligence',
        semester: 3,
        enrollabilityScore: 92,
        grade: 'PG',
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Student Profile Card - Excellent Score</h1>
            <StudentProfileCard learnerData={learnerData} />
        </div>
    );
}

/**
 * Example 3: Average Score (50-69)
 */
export function AverageScoreExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-789',
        name: 'Priya Sharma',
        email: 'priya.sharma@iit.edu',
        avatar: 'https://example.com/avatars/priya.jpg',
        collegeId: 'IIT2023-5678',
        collegeName: 'Indian Institute of Technology',
        linkRangeId: 'LR-2023-ECE-042',
        program: 'B.E. Electronics and Communication',
        semester: 7,
        enrollabilityScore: 58,
        grade: 'UG',
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Student Profile Card - Average Score</h1>
            <StudentProfileCard
                learnerData={learnerData}
                onViewProfile={() => alert('View Profile Clicked')}
            />
        </div>
    );
}

/**
 * Example 4: Needs Improvement Score (< 50)
 */
export function NeedsImprovementExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-101',
        name: 'John Smith',
        email: 'john.smith@college.edu',
        collegeId: 'COLL2024-9999',
        collegeName: 'Community College',
        program: 'Diploma in Web Development',
        semester: 2,
        enrollabilityScore: 35,
        grade: 'Diploma',
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Student Profile Card - Needs Improvement</h1>
            <StudentProfileCard learnerData={learnerData} />
        </div>
    );
}

/**
 * Example 5: Without optional fields
 */
export function MinimalDataExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-202',
        name: 'Maria Garcia',
        email: 'maria.garcia@university.edu',
        collegeId: 'UNI2024-3333',
        collegeName: 'State University',
        program: 'B.A. Business Administration',
        semester: 4,
        enrollabilityScore: 65,
        grade: 'UG',
        // No avatar
        // No linkRangeId
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Student Profile Card - Minimal Data</h1>
            <StudentProfileCard learnerData={learnerData} />
        </div>
    );
}

/**
 * Example 6: High School Student (Grade 11/12)
 */
export function HighSchoolStudentExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-303',
        name: 'Rahul Verma',
        email: 'rahul.verma@school.edu',
        avatar: 'https://example.com/avatars/rahul.jpg',
        collegeId: 'HS2024-1122',
        collegeName: 'Delhi Public School',
        linkRangeId: 'LR-2024-12-045',
        program: 'Science Stream',
        semester: 1,
        enrollabilityScore: 72,
        grade: '12',
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Student Profile Card - High School Student</h1>
            <StudentProfileCard
                learnerData={learnerData}
                onViewProfile={() => window.location.href = '/student/profile'}
            />
        </div>
    );
}

/**
 * Example 7: Responsive Grid Layout (Dashboard Context)
 */
export function DashboardGridExample() {
    const learnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-404',
        name: 'Emma Wilson',
        email: 'emma.wilson@university.edu',
        avatar: 'https://example.com/avatars/emma.jpg',
        collegeId: 'UNI2024-7788',
        collegeName: 'Oxford University',
        linkRangeId: 'LR-2024-CS-099',
        program: 'B.Sc. Computer Science',
        semester: 6,
        enrollabilityScore: 88,
        grade: 'UG',
    };

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Dashboard Grid Layout</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* StudentProfileCard spans 2 columns on large screens */}
                <div className="lg:col-span-2">
                    <StudentProfileCard
                        learnerData={learnerData}
                        onViewProfile={() => console.log('Navigate to profile')}
                    />
                </div>

                {/* Other widgets would go in the third column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="font-bold mb-2">Achievement Stats</h3>
                        <p className="text-sm text-gray-600">Other dashboard widgets...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * All examples in one view for demonstration
 */
export function AllExamples() {
    return (
        <div className="space-y-12 p-8 bg-gray-50">
            <BasicExample />
            <ExcellentScoreExample />
            <AverageScoreExample />
            <NeedsImprovementExample />
            <MinimalDataExample />
            <HighSchoolStudentExample />
            <DashboardGridExample />
        </div>
    );
}

export default BasicExample;
