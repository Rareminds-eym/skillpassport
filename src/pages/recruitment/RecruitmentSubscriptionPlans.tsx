/**
 * Recruitment Subscription Plans Page
 * Shows the 4 recruitment plans: Starter, Pro, Premium, Enterprise
 * Currently UI-only - all features are accessible regardless of plan
 */

import { Check, Building2, Users, Sparkles, Crown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { SubscriptionPurchaseHeader } from '@/features/subscription';
import { useUser } from '@/shared/model/authStore';

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    price: string;
    priceDetail: string;
    icon: typeof Building2;
    iconColor: string;
    bgGradient: string;
    features: PlanFeature[];
    cta: string;
    popular?: boolean;
}

const plans: Plan[] = [
    {
        id: 'starter',
        name: 'Recruiter Starter',
        description: 'For small employers hiring occasionally',
        price: 'Free',
        priceDetail: 'Limited features',
        icon: Building2,
        iconColor: 'text-blue-600',
        bgGradient: 'from-blue-50 to-blue-100',
        cta: 'Get Started',
        features: [
            { text: 'Recruiter login', included: true },
            { text: 'Talent pool access with limited searches', included: true },
            { text: 'Basic filters: skills, location, graduation year', included: true },
            { text: 'Candidate profile preview', included: true },
            { text: 'Shortlist creation', included: true },
            { text: 'Basic messaging/contact request', included: true },
            { text: 'Limited job postings', included: true },
            { text: 'AI match score', included: false },
            { text: 'Advanced analytics', included: false },
        ],
    },
    {
        id: 'pro',
        name: 'Recruiter Pro',
        description: 'For active hiring teams',
        price: '₹4,999',
        priceDetail: 'per month',
        icon: Users,
        iconColor: 'text-purple-600',
        bgGradient: 'from-purple-50 to-purple-100',
        cta: 'Upgrade to Pro',
        popular: true,
        features: [
            { text: 'Everything in Starter, plus:', included: true },
            { text: 'Requisitions / job management', included: true },
            { text: 'Applicants list', included: true },
            { text: 'AI match score', included: true },
            { text: 'Saved searches', included: true },
            { text: 'Candidate comparison', included: true },
            { text: 'Interview scheduling', included: true },
            { text: 'Shareable shortlists', included: true },
            { text: 'Basic analytics', included: true },
            { text: 'Export mini-profiles', included: true },
        ],
    },
    {
        id: 'premium',
        name: 'Recruiter Premium',
        description: 'For serious placement and recruitment partners',
        price: '₹9,999',
        priceDetail: 'per month',
        icon: Sparkles,
        iconColor: 'text-amber-600',
        bgGradient: 'from-amber-50 to-amber-100',
        cta: 'Upgrade to Premium',
        features: [
            { text: 'Everything in Pro, plus:', included: true },
            { text: 'AI Recruiter Copilot', included: true },
            { text: 'External-audited candidate filter', included: true },
            { text: 'Verified evidence tabs: projects, assessments, certificates, videos', included: true },
            { text: 'Pipeline Kanban', included: true },
            { text: 'Offer and decision tracking', included: true },
            { text: 'Team notes and ratings', included: true },
            { text: 'WhatsApp/email templates', included: true },
            { text: 'CSV/ATS export', included: true },
            { text: 'Advanced analytics: funnel, time-to-hire, quality, geography', included: true },
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise Recruitment Suite',
        description: 'For large employers, colleges, universities, and placement partnerships',
        price: 'Custom',
        priceDetail: 'Contact sales',
        icon: Crown,
        iconColor: 'text-rose-600',
        bgGradient: 'from-rose-50 to-rose-100',
        cta: 'Contact Sales',
        features: [
            { text: 'Everything in Premium, plus:', included: true },
            { text: 'Multiple recruiter seats', included: true },
            { text: 'Organisation-level subscription', included: true },
            { text: 'Bulk hiring campaigns', included: true },
            { text: 'Campus placement workflows', included: true },
            { text: 'Custom assessment/rubric', included: true },
            { text: 'Branded hiring page', included: true },
            { text: 'API / ATS webhook integration', included: true },
            { text: 'Compliance audit log', included: true },
            { text: 'Dedicated account support', included: true },
            { text: 'Custom reports', included: true },
        ],
    },
];

const RecruitmentSubscriptionPlans = () => {
    const navigate = useNavigate();
    const user = useUser();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const handlePlanSelect = (planId: string) => {
        setSelectedPlan(planId);

        // For now, just navigate to admin dashboard
        // In the future, this would handle actual subscription purchase
        setTimeout(() => {
            navigate('/recruitment/admin', {
                state: {
                    message: `${plans.find(p => p.id === planId)?.name} plan selected! All features are currently accessible.`,
                },
            });
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Simple Header with Email and Logout */}
            <SubscriptionPurchaseHeader userEmail={user?.email} />

            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Choose Your Recruitment Plan
                        </h1>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Select the plan that best fits your hiring needs. All features are currently accessible for testing.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-blue-800 font-medium">
                                🎉 All features unlocked during beta - No payment required
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const isSelected = selectedPlan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${plan.popular ? 'ring-2 ring-purple-500' : ''
                                    } ${isSelected ? 'ring-2 ring-blue-500 scale-105' : ''}`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                        POPULAR
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className={`bg-gradient-to-br ${plan.bgGradient} p-6`}>
                                    <Icon className={`w-12 h-12 ${plan.iconColor} mb-4`} />
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                        <span className="text-sm text-gray-600">{plan.priceDetail}</span>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="p-6">
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                {feature.included ? (
                                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                                )}
                                                <span
                                                    className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'
                                                        }`}
                                                >
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handlePlanSelect(plan.id)}
                                        disabled={isSelected}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${plan.popular
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : isSelected
                                                ? 'bg-green-600 text-white cursor-not-allowed'
                                                : 'bg-gray-900 hover:bg-gray-800 text-white'
                                            }`}
                                    >
                                        {isSelected ? '✓ Selected' : plan.cta}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Best For Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Best for:</h4>
                        <p className="text-sm text-gray-600">SMEs, local employers, first-time partners</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Best for:</h4>
                        <p className="text-sm text-gray-600">Companies hiring regularly from the ecosystem</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Best for:</h4>
                        <p className="text-sm text-gray-600">Recruitment agencies, corporates, sector-specific hiring drives</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Best for:</h4>
                        <p className="text-sm text-gray-600">Universities, large corporates, government/CSR placement programs</p>
                    </div>
                </div>

                {/* Skip Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/recruitment/admin')}
                        className="text-gray-600 hover:text-gray-900 font-medium underline"
                    >
                        Skip for now and explore the dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecruitmentSubscriptionPlans;
