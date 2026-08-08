/**
 * CareerAITools Widget - Usage Examples
 * 
 * This file demonstrates various usage scenarios for the CareerAITools component.
 */

import React from 'react';
import { CareerAITools } from './CareerAITools';
import { CAREER_TOOLS } from '@/entities/opportunity/model/types';

/**
 * Example 1: Basic Usage with Full Access
 * 
 * User has premium access to all AI career tools
 */
export const BasicUsageWithAccess = () => {
    const handleToolSelect = (toolId: string) => {
        console.log('Tool selected:', toolId);
    };

    return (
        <CareerAITools
            tools={CAREER_TOOLS}
            onToolSelect={handleToolSelect}
            userAccess={{
                hasAIAccess: true,
                remainingCredits: 50,
                planType: 'pro'
            }}
        />
    );
};

/**
 * Example 2: Free User (Limited Access)
 * 
 * User on free plan can only access non-premium tools.
 * Premium tools will show upgrade prompts.
 */
export const FreeUserLimitedAccess = () => {
    const handleToolSelect = (toolId: string) => {
        console.log('Tool selected:', toolId);
    };

    return (
        <CareerAITools
            tools={CAREER_TOOLS}
            onToolSelect={handleToolSelect}
            userAccess={{
                hasAIAccess: false,
                planType: 'free'
            }}
        />
    );
};

/**
 * Example 3: Pro User with Limited Credits
 * 
 * Premium user with remaining credits displayed
 */
export const ProUserWithCredits = () => {
    const handleToolSelect = (toolId: string) => {
        console.log('Tool selected:', toolId);
        // Could track credit usage here
    };

    return (
        <CareerAITools
            tools={CAREER_TOOLS}
            onToolSelect={handleToolSelect}
            userAccess={{
                hasAIAccess: true,
                remainingCredits: 5,
                planType: 'pro'
            }}
        />
    );
};

/**
 * Example 4: Custom Tools Subset
 * 
 * Display only specific tools (e.g., for a specialized dashboard)
 */
export const CustomToolsSubset = () => {
    // Filter to show only assessment and preparation tools
    const assessmentTools = CAREER_TOOLS.filter(
        tool => tool.category === 'assessment' || tool.category === 'preparation'
    );

    const handleToolSelect = (toolId: string) => {
        console.log('Assessment/Preparation tool selected:', toolId);
    };

    return (
        <CareerAITools
            tools={assessmentTools}
            onToolSelect={handleToolSelect}
            userAccess={{
                hasAIAccess: true,
                remainingCredits: 20,
                planType: 'pro'
            }}
        />
    );
};

/**
 * Example 5: Enterprise User (Unlimited Access)
 * 
 * Enterprise users typically don't have credit limits
 */
export const EnterpriseUser = () => {
    const handleToolSelect = (toolId: string) => {
        console.log('Enterprise user selected tool:', toolId);
    };

    return (
        <CareerAITools
            tools={CAREER_TOOLS}
            onToolSelect={handleToolSelect}
            userAccess={{
                hasAIAccess: true,
                // No remainingCredits means unlimited
                planType: 'enterprise'
            }}
        />
    );
};

/**
 * Example 6: Integration with Analytics
 * 
 * Track tool selections with custom analytics
 */
export const WithAnalytics = () => {
    const handleToolSelect = (toolId: string) => {
        // Custom analytics tracking
        if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('Career Tool Selected', {
                toolId,
                timestamp: new Date().toISOString(),
                source: 'dashboard'
            });
        }

        console.log('Tool selected with analytics:', toolId);
    };

    return (
        <CareerAITools
            tools={CAREER_TOOLS}
            onToolSelect={handleToolSelect}
            userAccess={{
                hasAIAccess: true,
                remainingCredits: 30,
                planType: 'pro'
            }}
        />
    );
};

/**
 * Example 7: In Dashboard Layout
 * 
 * Typical usage within the learner dashboard
 */
export const DashboardIntegration = () => {
    const [selectedTool, setSelectedTool] = React.useState<string | null>(null);

    const handleToolSelect = (toolId: string) => {
        setSelectedTool(toolId);
        console.log('Dashboard: Tool selected ->', toolId);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <CareerAITools
                    tools={CAREER_TOOLS}
                    onToolSelect={handleToolSelect}
                    userAccess={{
                        hasAIAccess: true,
                        remainingCredits: 15,
                        planType: 'pro'
                    }}
                />
            </div>

            {selectedTool && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-800">
                        Last selected tool: <strong>{selectedTool}</strong>
                    </p>
                </div>
            )}
        </div>
    );
};

/**
 * Example 8: Mobile-Optimized View
 * 
 * The component is responsive by default, but you can add container constraints
 */
export const MobileView = () => {
    const handleToolSelect = (toolId: string) => {
        console.log('Mobile: Tool selected ->', toolId);
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <CareerAITools
                tools={CAREER_TOOLS}
                onToolSelect={handleToolSelect}
                userAccess={{
                    hasAIAccess: true,
                    remainingCredits: 12,
                    planType: 'pro'
                }}
            />
        </div>
    );
};
