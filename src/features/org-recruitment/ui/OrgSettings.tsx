/**
 * Organization Settings Component
 * Allows admins to manage organization profile, verification, and recruitment preferences
 */

import { useState } from 'react';
import { useOrgContext } from '@/entities/recruitment/model/useOrgContext';
import { EmailTemplateSettings } from './EmailTemplateSettings';
import {
    CompanyProfileTab,
    CompanyVerificationTab,
    CompanyContactsTab,
    RecruitmentConfigurationTab,
    OfferTemplatesTab,
    BillingTab,
} from './tabs';
import {
    BuildingOfficeIcon,
    ShieldCheckIcon,
    PhoneIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    CreditCardIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';

type SettingsTab =
    | 'company-profile'
    | 'verification'
    | 'contacts'
    | 'configuration'
    | 'templates'
    | 'billing'
    | 'email-templates';

export const OrgSettings = () => {
    const { orgContext, isLoading: orgLoading } = useOrgContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('company-profile');

    const tabs = [
        {
            id: 'company-profile' as SettingsTab,
            label: 'Company Profile',
            icon: BuildingOfficeIcon,
        },
        {
            id: 'verification' as SettingsTab,
            label: 'Verification',
            icon: ShieldCheckIcon,
        },
        {
            id: 'contacts' as SettingsTab,
            label: 'Contacts',
            icon: PhoneIcon,
        },
        {
            id: 'configuration' as SettingsTab,
            label: 'Recruitment Config',
            icon: Cog6ToothIcon,
        },
        {
            id: 'templates' as SettingsTab,
            label: 'Offer Templates',
            icon: DocumentTextIcon,
        },
        {
            id: 'email-templates' as SettingsTab,
            label: 'Email Templates',
            icon: EnvelopeIcon,
        },
        {
            id: 'billing' as SettingsTab,
            label: 'Billing',
            icon: CreditCardIcon,
            adminOnly: true,
        },
    ];

    // Filter tabs based on user role
    const visibleTabs = tabs.filter((tab) => {
        if (tab.adminOnly && !orgContext?.isAdmin) {
            return false;
        }
        return true;
    });

    if (orgLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Manage your organization profile, verification, and recruitment preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="max-w-6xl">
                {activeTab === 'company-profile' && <CompanyProfileTab />}
                {activeTab === 'verification' && <CompanyVerificationTab />}
                {activeTab === 'contacts' && <CompanyContactsTab />}
                {activeTab === 'configuration' && <RecruitmentConfigurationTab />}
                {activeTab === 'templates' && <OfferTemplatesTab />}
                {activeTab === 'billing' && <BillingTab />}
                {activeTab === 'email-templates' && <EmailTemplateSettings />}
            </div>
        </div>
    );
};
