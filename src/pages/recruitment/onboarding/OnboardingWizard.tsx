/**
 * Onboarding Wizard Wrapper
 * Simple navbar with RareMinds logo (copied from recruiter dashboard)
 */

import { OnboardingProvider } from './OnboardingContext';

interface OnboardingWizardProps {
    children: React.ReactNode;
    currentStep: number;
}

export const OnboardingWizard = ({ children, currentStep }: OnboardingWizardProps) => {
    return (
        <OnboardingProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* RareMinds Navbar - copied from recruiter dashboard Header.tsx */}
                <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <img
                                    src="/RareMinds ISO Logo-01.png"
                                    alt="RareMinds Logo"
                                    className="h-12 w-auto"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {children}
                </div>
            </div>
        </OnboardingProvider>
    );
};
