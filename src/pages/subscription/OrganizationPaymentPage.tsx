/**
 * OrganizationPaymentPage
 *
 * Payment page for organization bulk purchases.
 * Handles Razorpay integration for organization subscriptions.
 */

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  initiateOrganizationPayment,
  OrganizationPurchaseData,
} from '../../services/organization/organizationPaymentService';

interface OrganizationConfig {
  organizationType: 'school' | 'college' | 'university';
  seatCount: number;
  memberType: 'educator' | 'student' | 'both';
  billingCycle: 'monthly' | 'annual';
  pricing: {
    basePrice: number;
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
  };
  assignmentMode: 'auto-all' | 'select-specific' | 'create-pool';
  selectedMemberIds: string[];
  poolName?: string;
  autoAssignNewMembers: boolean;
  billingEmail: string;
  billingName: string;
  gstNumber?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
}

interface LocationState {
  plan: Plan;
  isOrganizationPurchase: boolean;
  mode: 'new' | 'add-seats';
  existingSubscriptionId?: string;
  organizationId?: string; // Organization ID passed from BulkPurchasePage
  organizationConfig: OrganizationConfig;
}

function OrganizationPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const state = location.state as LocationState | null;
  const { plan, organizationConfig, organizationId: stateOrgId } = state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billingDetails, setBillingDetails] = useState({
    name: organizationConfig?.billingName || '',
    email: organizationConfig?.billingEmail || '',
    phone: '',
    gstNumber: organizationConfig?.gstNumber || '',
  });

  // Get organization ID from state first, then fallback to user context
  const organizationId = useMemo(() => {
    // First priority: from location state (passed from BulkPurchasePage)
    if (stateOrgId) {
      console.log('[OrgPaymentPage] Using organizationId from state:', stateOrgId);
      return stateOrgId;
    }

    // Fallback: Try to get from user object
    if (user?.school_id) return String(user.school_id);
    if (user?.college_id) return String(user.college_id);
    if (user?.university_id) return String(user.university_id);
    if (user?.schoolId) return String(user.schoolId);
    if (user?.collegeId) return String(user.collegeId);
    if (user?.universityId) return String(user.universityId);

    // Try localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.schoolId) return userData.schoolId;
        if (userData.collegeId) return userData.collegeId;
        if (userData.universityId) return userData.universityId;
      } catch (e) {
        /* ignore */
      }
    }

    console.log('[OrgPaymentPage] Could not find organizationId');
    return '';
  }, [stateOrgId, user]);

  // Get base path for navigation
  const basePath = useMemo(() => {
    const role = user?.role || '';
    if (role.includes('school')) return '/school-admin';
    if (role.includes('college')) return '/college-admin';
    if (role.includes('university')) return '/university-admin';
    return '/school-admin';
  }, [user?.role]);

  // Redirect if no plan data
  useEffect(() => {
    if (!plan || !organizationConfig) {
      navigate(`${basePath}/subscription/bulk-purchase`, { replace: true });
    }
  }, [plan, organizationConfig, navigate, basePath]);

  // Pre-fill billing details from user
  useEffect(() => {
    if (user && !billingDetails.email) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const userName = typeof user.name === 'string' ? user.name : fullName;
      const userEmail = typeof user.email === 'string' ? user.email : '';

      setBillingDetails((prev) => ({
        ...prev,
        email: prev.email || userEmail,
        name: prev.name || userName,
      }));
    }
  }, [user, billingDetails.email]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setBillingDetails((prev) => ({ ...prev, [name]: value }));
      if (error) setError('');
    },
    [error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading || !plan || !organizationConfig) return;

      // Validate required fields
      if (!billingDetails.name.trim()) {
        setError('Billing name is required');
        return;
      }
      if (!billingDetails.email.trim()) {
        setError('Billing email is required');
        return;
      }
      if (!organizationId) {
        setError('Organization ID not found. Please try again.');
        return;
      }

      setLoading(true);
      setError('');

      // Prepare purchase data
      const purchaseData: OrganizationPurchaseData = {
        organizationId,
        organizationType: organizationConfig.organizationType,
        planId: plan.id,
        planName: plan.name,
        seatCount: organizationConfig.seatCount,
        targetMemberType: organizationConfig.memberType,
        billingCycle: organizationConfig.billingCycle,
        autoRenew: true,
        pricing: organizationConfig.pricing,
        assignmentMode: organizationConfig.assignmentMode,
        selectedMemberIds: organizationConfig.selectedMemberIds,
        poolName: organizationConfig.poolName,
        autoAssignNewMembers: organizationConfig.autoAssignNewMembers,
        billingEmail: billingDetails.email,
        billingName: billingDetails.name,
        gstNumber: billingDetails.gstNumber || undefined,
      };

      try {
        await initiateOrganizationPayment({
          purchaseData,
          onSuccess: (result) => {
            console.log('[OrgPayment] Payment successful:', result);
            toast.success('Payment successful! Your subscription has been activated.');

            // Navigate to organization subscription page
            navigate(`${basePath}/subscription/organization`, {
              replace: true,
              state: { paymentSuccess: true, subscription: result.subscription },
            });
          },
          onFailure: (err) => {
            console.error('[OrgPayment] Payment failed:', err);
            setLoading(false);
            setError(err.message || 'Payment failed. Please try again.');
          },
        });
      } catch (err) {
        console.error('[OrgPayment] Error:', err);
        setLoading(false);
        setError(
          err instanceof Error ? err.message : 'Failed to process payment. Please try again.'
        );
      }
    },
    [loading, plan, organizationConfig, organizationId, billingDetails, navigate, basePath]
  );

  const handleBack = useCallback(() => {
    navigate(`${basePath}/subscription/bulk-purchase`);
  }, [navigate, basePath]);

  // Loading/redirect state
  if (!isAuthenticated || !user || !plan || !organizationConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const organizationLabel = {
    school: 'School',
    college: 'College',
    university: 'University',
  }[organizationConfig.organizationType];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase
        </button>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <CreditCard className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Complete Organization Payment</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {organizationConfig.seatCount} seats for {organizationLabel}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Billing Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                  >
                    Billing Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <User className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={billingDetails.name}
                      onChange={handleInputChange}
                      placeholder="Organization or contact name"
                      className="w-full h-12 pl-11 pr-4 text-sm text-gray-900 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Billing Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                  >
                    Billing Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={billingDetails.email}
                      onChange={handleInputChange}
                      placeholder="billing@organization.com"
                      className="w-full h-12 pl-11 pr-4 text-sm text-gray-900 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                  >
                    Phone Number{' '}
                    <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={billingDetails.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="w-full h-12 pl-11 pr-4 text-sm text-gray-900 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* GST Number */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="gstNumber"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                  >
                    GST Number <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Building2 className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      id="gstNumber"
                      name="gstNumber"
                      value={billingDetails.gstNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., 22AAAAA0000A1Z5"
                      className="w-full h-12 pl-11 pr-4 text-sm text-gray-900 bg-white rounded-lg border border-gray-200 hover:border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Provide your GST number for tax invoice purposes
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                    <h3 className="text-sm font-semibold text-gray-800">Payment Methods</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Cards', 'UPI', 'Net Banking', 'Wallets'].map((method) => (
                      <span
                        key={method}
                        className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-gray-600 border border-gray-200"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Payment Error</p>
                      <p className="text-xs text-red-600 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 h-12 px-5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] h-12 px-5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Pay ₹{organizationConfig.pricing.finalAmount.toLocaleString()} Securely
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Plan Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 text-white shadow-lg shadow-blue-500/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-blue-200" />
                  <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                    {organizationLabel} Purchase
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-1">{plan.name} Plan</h3>

                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100">{organizationConfig.seatCount} seats</span>
                </div>

                <div className="border-t border-white/20 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-200">Subtotal</span>
                    <span>₹{organizationConfig.pricing.subtotal.toLocaleString()}</span>
                  </div>
                  {organizationConfig.pricing.discountPercentage > 0 && (
                    <div className="flex justify-between text-sm text-green-300">
                      <span>
                        Volume Discount ({organizationConfig.pricing.discountPercentage}%)
                      </span>
                      <span>-₹{organizationConfig.pricing.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-200">GST (18%)</span>
                    <span>₹{organizationConfig.pricing.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20">
                    <span>Total</span>
                    <span>₹{organizationConfig.pricing.finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Features */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Why Choose Us
              </h4>
              <div className="space-y-3.5">
                {[
                  { icon: Shield, text: 'Secure & encrypted payments' },
                  { icon: Zap, text: 'Instant license activation' },
                  { icon: Check, text: 'Bulk management tools' },
                ].map(({ icon: Icon, text }, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                License Assignment
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {organizationConfig.assignmentMode.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Type</span>
                  <span className="text-gray-900 font-medium capitalize">
                    {organizationConfig.memberType}
                  </span>
                </div>
                {organizationConfig.assignmentMode === 'select-specific' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected Members</span>
                    <span className="text-gray-900 font-medium">
                      {organizationConfig.selectedMemberIds.length}
                    </span>
                  </div>
                )}
                {organizationConfig.assignmentMode === 'create-pool' &&
                  organizationConfig.poolName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pool Name</span>
                      <span className="text-gray-900 font-medium">
                        {organizationConfig.poolName}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(OrganizationPaymentPage);
