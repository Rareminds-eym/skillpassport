/**
 * Shared types for recruitment onboarding wizard
 */

export interface CompanyDetails {
    companyName: string;
    industry: string;
    companySize: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
}

export interface TeamSettings {
    maxRecruiters: number;
    hiringStages: string[];
    requireApproval: boolean;
}

export interface RecruitmentPreferences {
    jobBoards: string[];
    emailNotifications: {
        newApplications: boolean;
        dailyDigest: boolean;
        weeklyReport: boolean;
    };
    autoMatching: boolean;
}

export interface OnboardingData {
    companyDetails: CompanyDetails;
    teamSettings: TeamSettings;
    recruitmentPreferences: RecruitmentPreferences;
}

export const INDUSTRIES = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Real Estate',
    'Media & Entertainment',
    'Transportation',
    'Hospitality',
    'Energy',
    'Telecommunications',
    'Automotive',
    'Aerospace',
    'Agriculture',
    'Construction',
    'Legal',
    'Marketing & Advertising',
    'Pharmaceuticals',
    'Other',
] as const;

export const COMPANY_SIZES = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees',
] as const;

export const JOB_BOARDS = [
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'indeed', name: 'Indeed', icon: '🔍' },
    { id: 'naukri', name: 'Naukri.com', icon: '🇮🇳' },
    { id: 'glassdoor', name: 'Glassdoor', icon: '🏢' },
    { id: 'angellist', name: 'AngelList', icon: '🚀' },
    { id: 'monster', name: 'Monster', icon: '👹' },
] as const;

export const DEFAULT_HIRING_STAGES = [
    'Applied',
    'Screening',
    'Technical Round',
    'HR Round',
    'Offer',
    'Hired',
] as const;
