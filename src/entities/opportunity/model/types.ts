/**
 * Opportunity and Career Tool Type Definitions
 * 
 * This module defines types for job/internship opportunities and AI-powered career tools
 * for the college student dashboard redesign.
 * 
 * @module entities/opportunity/model/types
 */

/**
 * Represents a job or internship opportunity
 */
export interface Opportunity {
    /** Unique identifier for the opportunity */
    id: string;

    /** Job title */
    title: string;

    /** Company name */
    company: string;

    /** Job location */
    location: string;

    /** Type of employment */
    employmentType: 'full-time' | 'internship' | 'contract';

    /** Date when the opportunity was posted */
    postedDate: Date;

    /** Industry sector (optional) */
    sector?: string;

    /** Salary range or details (optional) */
    salary?: string;

    /** Job description (optional) */
    description?: string;
}

/**
 * Represents an AI-matched job opportunity with matching details
 * Extends the base Opportunity interface with AI-generated matching information
 */
export interface AIMatchedJob extends Opportunity {
    /** AI-calculated match score (0-100) */
    matchScore: number;

    /** AI-generated reasons explaining why this job matches the learner's profile */
    matchReasons: string[];

    /** List of learner's skills that match the job requirements */
    skillsMatched: string[];

    /** List of required skills the learner doesn't have yet (skill gap) */
    skillsGap: string[];

    /** Flag indicating this is an AI-recommended opportunity */
    isAIRecommended: true;
}

/**
 * Represents an AI-powered career tool available to learners
 */
export interface CareerTool {
    /** Unique identifier for the tool */
    id: string;

    /** Display name of the tool */
    name: string;

    /** Brief description of what the tool does */
    description: string;

    /** Icon identifier or component for the tool */
    icon: string;

    /** Category of the career tool */
    category: 'assessment' | 'preparation' | 'guidance';

    /** Whether the tool requires a premium subscription */
    requiresSubscription: boolean;

    /** Navigation path/route for the tool */
    path: string;

    /** Estimated time to complete (optional, e.g., "10 mins") */
    estimatedTime?: string;
}

/**
 * Predefined array of 7 AI-powered career tools available to college students
 * 
 * These tools provide career guidance, skill assessment, and preparation resources.
 * 
 * **Validates Requirements**: 4.2-4.8, 7.1-7.9
 */
export const CAREER_TOOLS: CareerTool[] = [
    {
        id: 'skill-gap',
        name: 'Skill Gap Analysis',
        description: 'Identify skills you need to develop for your target career',
        icon: 'target',
        category: 'assessment',
        requiresSubscription: false,
        path: '/learner/career-ai/skill-gap',
        estimatedTime: '10 mins'
    },
    {
        id: 'resume-review',
        name: 'Resume Review',
        description: 'Get AI-powered feedback to improve your resume',
        icon: 'document',
        category: 'preparation',
        requiresSubscription: true,
        path: '/learner/career-ai/resume',
        estimatedTime: '15 mins'
    },
    {
        id: 'interview-prep',
        name: 'Interview Prep',
        description: 'Practice common interview questions with AI feedback',
        icon: 'chat',
        category: 'preparation',
        requiresSubscription: true,
        path: '/learner/career-ai/interview',
        estimatedTime: '20 mins'
    },
    {
        id: 'learning-path',
        name: 'Learning Path',
        description: 'Get personalized learning recommendations for your career goals',
        icon: 'path',
        category: 'guidance',
        requiresSubscription: false,
        path: '/learner/career-ai/path',
        estimatedTime: '5 mins'
    },
    {
        id: 'networking',
        name: 'Networking Tips',
        description: 'Learn strategies to build your professional network',
        icon: 'users',
        category: 'guidance',
        requiresSubscription: false,
        path: '/learner/career-ai/networking',
        estimatedTime: '10 mins'
    },
    {
        id: 'career-guidance',
        name: 'Career Guidance',
        description: 'Explore career paths aligned with your skills and interests',
        icon: 'compass',
        category: 'guidance',
        requiresSubscription: false,
        path: '/learner/career-ai/guidance',
        estimatedTime: '15 mins'
    },
    {
        id: 'career-advice',
        name: 'Career Advice',
        description: 'Get personalized career advice from AI career coach',
        icon: 'lightbulb',
        category: 'guidance',
        requiresSubscription: true,
        path: '/learner/career-ai/advice',
        estimatedTime: '10 mins'
    }
];
