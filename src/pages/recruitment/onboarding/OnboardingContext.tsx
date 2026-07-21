/**
 * Onboarding Context
 * Manages state across all 4 onboarding steps
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import type { OnboardingData, CompanyDetails, TeamSettings, RecruitmentPreferences } from './types';
import { DEFAULT_HIRING_STAGES } from './types';

interface OnboardingContextType {
    data: OnboardingData;
    updateCompanyDetails: (details: Partial<CompanyDetails>) => void;
    updateTeamSettings: (settings: Partial<TeamSettings>) => void;
    updateRecruitmentPreferences: (prefs: Partial<RecruitmentPreferences>) => void;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const getInitialData = (): OnboardingData => {
    // Try to load from localStorage (draft save)
    const saved = localStorage.getItem('onboarding_draft');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            // If parse fails, use defaults
        }
    }

    return {
        companyDetails: {
            companyName: '',
            industry: '',
            companySize: '',
            address: '',
            phone: '',
            email: '',
            website: '',
        },
        teamSettings: {
            maxRecruiters: 10,
            hiringStages: [...DEFAULT_HIRING_STAGES],
            requireApproval: false,
        },
        recruitmentPreferences: {
            jobBoards: [],
            emailNotifications: {
                newApplications: true,
                dailyDigest: true,
                weeklyReport: false,
            },
            autoMatching: true,
        },
    };
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<OnboardingData>(getInitialData);
    const [currentStep, setCurrentStep] = useState(1);

    const updateCompanyDetails = (details: Partial<CompanyDetails>) => {
        setData(prev => {
            const updated = {
                ...prev,
                companyDetails: { ...prev.companyDetails, ...details },
            };
            // Save draft to localStorage
            localStorage.setItem('onboarding_draft', JSON.stringify(updated));
            return updated;
        });
    };

    const updateTeamSettings = (settings: Partial<TeamSettings>) => {
        setData(prev => {
            const updated = {
                ...prev,
                teamSettings: { ...prev.teamSettings, ...settings },
            };
            localStorage.setItem('onboarding_draft', JSON.stringify(updated));
            return updated;
        });
    };

    const updateRecruitmentPreferences = (prefs: Partial<RecruitmentPreferences>) => {
        setData(prev => {
            const updated = {
                ...prev,
                recruitmentPreferences: { ...prev.recruitmentPreferences, ...prefs },
            };
            localStorage.setItem('onboarding_draft', JSON.stringify(updated));
            return updated;
        });
    };

    const resetOnboarding = () => {
        localStorage.removeItem('onboarding_draft');
        setData(getInitialData());
        setCurrentStep(1);
    };

    return (
        <OnboardingContext.Provider
            value={{
                data,
                updateCompanyDetails,
                updateTeamSettings,
                updateRecruitmentPreferences,
                currentStep,
                setCurrentStep,
                resetOnboarding,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
};
