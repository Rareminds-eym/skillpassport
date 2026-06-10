/**
 * Manage Recruitment Subscription Page
 * Allows users to view current plan and upgrade/downgrade
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check,
    Building2,
    Users,
    Sparkles,
    Crown,
    X,
    ArrowLeft,
    CheckCircle,
    Calendar,
    CreditCard,
} from 'lucide-react';
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
        cta: 'Current Plan',
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

export const ManageSubscription = () => {
    const navigate = useNavigate();
    const user = useUser();
    const [currentPlan] = useState<string>('starter'); // Mock current plan - would come from API
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handlePlanSelect = (planId: string) => {
        if (planId === currentPlan) return;
        setSelectedPlan(planId);
        setShowConfirmModal(true);
    };

    const handleConfirmUpgrade = () => {
        // In production, this would process payment and update subscription
        setShowConfirmModal(false);
        // Show success notification
        alert(`Successfully upgraded to ${plans.find(p => p.id === selectedPlan)?.name}!`);
        navigate('/recruitment/overview');
    };

    const currentPlanDetails = plans.find(p => p.id === currentPlan);
    const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Manage Subscription
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                View and manage your recruitment subscription plan
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Current Plan Card */}
                {currentPlanDetails && (
                    <div className="mb-8 bg-white rounded-xl border-2 border-blue-500 shadow-lg p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentPlanDetails.bgGradient} flex items-center justify-center`}
                                >
                                    <currentPlanDetails.icon
                                        className={`h-8 w-8 ${currentPlanDetails.iconColor}`}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {currentPlanDetails.name}
                                        </h2>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                            Current Plan
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        {currentPlanDetails.description}
                                    </p>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-700">
                                                <span className="font-bold text-gray-900">
                                                    {currentPlanDetails.price}
                                                </span>{' '}
                                                {currentPlanDetails.priceDetail}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-700">
                                                Active since January 2026
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-green-700 font-medium">
                                                All features unlocked (Beta)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Available Plans */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Available Plans
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const Icon = plan.icon;
                            const isCurrentPlan = plan.id === currentPlan;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${isCurrentPlan
                                            ? 'border-blue-500'
                                            : plan.popular
                                                ? 'border-purple-500'
                                                : 'border-gray-200'
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {plan.popular && !isCurrentPlan && (
                                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            POPULAR
                                        </div>
                                    )}

                                    {/* Current Plan Badge */}
                                    {isCurrentPlan && (
                                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            CURRENT
                                        </div>
                                    )}

                                    {/* Plan Header */}
                                    <div
                                        className={`bg-gradient-to-br ${plan.bgGradient} p-6`}
                                    >
                                        <Icon className={`w-12 h-12 ${plan.iconColor} mb-4`} />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {plan.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            {plan.description}
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-gray-900">
                                                {plan.price}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {plan.priceDetail}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Features List */}
                                    <div className="p-6">
                                        <ul className="space-y-3 mb-6">
                                            {plan.features.slice(0, 5).map((feature, index) => (
                                                <li
                                                    key={index}
                                                    className="flex items-start gap-2"
                                                >
                                                    {feature.included ? (
                                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <span
                                                        className={`text-sm ${feature.included
                                                                ? 'text-gray-700'
                                                                : 'text-gray-400'
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
                                            disabled={isCurrentPlan}
                                            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${isCurrentPlan
                                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                    : plan.popular
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                                                }`}
                                        >
                                            {isCurrentPlan ? '✓ Current Plan' : plan.cta}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Beta Notice */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">
                                🎉 Beta Access - All Features Unlocked
                            </h3>
                            <p className="text-sm text-blue-800">
                                During our beta period, all recruitment features are accessible
                                regardless of your plan. Enjoy unlimited access to Premium and
                                Enterprise features while we perfect the platform. Paid plans will
                                be enforced when we exit beta.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && selectedPlanDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Confirm Plan Change
                        </h3>
                        <p className="text-gray-600 mb-6">
                            You are about to change your plan from{' '}
                            <span className="font-semibold">{currentPlanDetails?.name}</span> to{' '}
                            <span className="font-semibold">{selectedPlanDetails.name}</span>.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">New Plan</span>
                                <span className="font-semibold text-gray-900">
                                    {selectedPlanDetails.name}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Amount</span>
                                <span className="font-bold text-gray-900 text-lg">
                                    {selectedPlanDetails.price}{' '}
                                    <span className="text-sm font-normal text-gray-600">
                                        {selectedPlanDetails.priceDetail}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpgrade}
                                className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageSubscription;
