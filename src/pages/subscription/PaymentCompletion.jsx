import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle,
    CreditCard,
    Lock,
    Mail,
    Phone,
    Shield,
    Sparkles,
    User,
    Zap,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SubscriptionRouteGuard from '../../components/Subscription/SubscriptionRouteGuard';
import { useSubscription } from '../../hooks/Subscription/useSubscription';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { initiateRazorpayPayment } from '../../services/Subscriptions/razorpayService';

/**
 * Get the subscription manage path based on user role
 */
function getManagePath(userRole) {
  const manageRoutes = {
    super_admin: '/admin/subscription/manage',
    rm_admin: '/admin/subscription/manage',
    admin: '/admin/subscription/manage',
    school_admin: '/school-admin/subscription/manage',
    college_admin: '/college-admin/subscription/manage',
    university_admin: '/university-admin/subscription/manage',
    educator: '/educator/subscription/manage',
    school_educator: '/educator/subscription/manage',
    college_educator: '/educator/subscription/manage',
    recruiter: '/recruitment/subscription/manage',
    student: '/student/subscription/manage',
    school_student: '/student/subscription/manage',
    college_student: '/student/subscription/manage',
  };
  return manageRoutes[userRole] || '/student/subscription/manage';
}

// Clean Input Component
const FormInput = memo(
  ({
    id,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
    disabled,
    autoComplete,
    icon: Icon,
    label,
    optional = false,
    error,
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.length > 0;

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500">*</span>}
          {optional && <span className="text-gray-400 font-normal text-xs">(Optional)</span>}
        </label>

        <div className="relative">
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              error ? 'text-red-400' : isFocused ? 'text-[#2663EB]' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </div>

          <input
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`w-full h-12 pl-11 pr-11 text-sm text-gray-900 bg-white rounded-lg border transition-all outline-none ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 hover:border-gray-300 focus:border-[#2663EB] focus:ring-2 focus:ring-blue-100'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''} placeholder:text-gray-400`}
            required={required}
            disabled={disabled}
            autoComplete={autoComplete}
          />

          {hasValue && !error && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
              <Check className="w-5 h-5" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

// Plan Card - Blue gradient using #2663EB
const PlanCard = memo(({ plan }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2663EB] via-[#1D4ED8] to-[#1E40AF] p-6 text-white shadow-lg shadow-blue-500/20">
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
          Selected Plan
        </span>
      </div>

      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>

      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-4xl font-bold">₹{plan.price}</span>
        <span className="text-blue-200">/{plan.duration}</span>
      </div>

      <div className="border-t border-white/20 pt-4 space-y-2.5">
        {plan.features?.slice(0, 4).map((feature, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-blue-200" strokeWidth={2.5} />
            <span className="text-sm text-blue-100">{feature}</span>
          </div>
        ))}
        {plan.features?.length > 4 && (
          <p className="text-xs text-blue-200 pl-6">+{plan.features.length - 4} more features</p>
        )}
      </div>
    </div>
  </div>
));

PlanCard.displayName = 'PlanCard';

// Trust Features - Clean with blue accents
const TrustFeatures = memo(() => (
  <div className="bg-white rounded-xl border border-gray-100 p-5">
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
      Why Choose Us
    </h4>
    <div className="space-y-3.5">
      {[
        { icon: Shield, text: 'Secure & encrypted payments' },
        { icon: Zap, text: 'Instant activation' },
        { icon: CheckCircle, text: 'Premium support included' },
      ].map(({ icon: Icon, text }, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#2663EB]" strokeWidth={1.5} />
          </div>
          <span className="text-sm text-gray-600">{text}</span>
        </div>
      ))}
    </div>
  </div>
));

TrustFeatures.displayName = 'TrustFeatures';

// Payment Methods - Clean
const PaymentMethods = memo(() => (
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
));

PaymentMethods.displayName = 'PaymentMethods';

function PaymentCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading, role } = useAuth();
  const managePath = useMemo(() => getManagePath(role), [role]);

  const { plan, studentType } = useMemo(() => location.state || {}, [location.state]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [userDetails, setUserDetails] = useState({ name: '', email: '', phone: '' });

  const { subscriptionData, loading: subscriptionLoading } = useSubscription();

  const plansUrl = useMemo(() => {
    return studentType ? `/subscription/plans/${studentType}` : '/subscription/plans/student';
  }, [studentType]);

  // Validate user exists in database and redirect if not authenticated
  useEffect(() => {
    const validateAndFetchUser = async () => {
      if (authLoading) return;

      // If not authenticated at all, redirect to register
      if (!isAuthenticated || !user) {
        console.log('❌ User not authenticated, redirecting to signup');
        if (plan) {
          localStorage.setItem('payment_plan_details', JSON.stringify({ ...plan, studentType }));
        }
        navigate('/signup', {
          replace: true,
          state: { plan, studentType, returnTo: '/subscription/payment' },
        });
        return;
      }

      // CRITICAL: Verify user actually exists in database (not just localStorage)
      try {
        // First check if user exists in auth.users via session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          console.warn('⚠️ No valid Supabase session found, clearing stale data');
          // Clear stale localStorage data
          localStorage.removeItem('user');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('pendingUser');
          
          if (plan) {
            localStorage.setItem('payment_plan_details', JSON.stringify({ ...plan, studentType }));
          }
          navigate('/signup', {
            replace: true,
            state: { plan, studentType, returnTo: '/subscription/payment' },
          });
          return;
        }

        // Verify user exists in public.users table
        // Use maybeSingle() to avoid 406 error when user doesn't exist
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, firstName, lastName, phone, email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userError) {
          console.error('❌ Error fetching user from database:', userError);
        }

        if (!userData) {
          console.warn('⚠️ User not found in database, may need to complete registration');
          // User has auth account but no database record - this is a partial signup
          // Try to get details from auth metadata
          const authUser = session.user;
          const metadata = authUser.user_metadata || {};
          
          setUserDetails({
            name: metadata.name || metadata.full_name || '',
            email: authUser.email || '',
            phone: metadata.phone || '',
          });
          
          // Set error to inform user
          setError('Your account setup is incomplete. Please complete payment to finish registration.');
          return;
        }

        // User exists - populate form with their data
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        setUserDetails({
          name: fullName,
          email: userData.email || user.email || '',
          phone: userData.phone || '',
        });

        console.log('✅ User validated successfully');

      } catch (err) {
        console.error('❌ Error validating user:', err);
        // On error, try to use available data
        setUserDetails((prev) => ({
          name: prev.name || '',
          email: prev.email || user?.email || '',
          phone: prev.phone || '',
        }));
      }
    };

    validateAndFetchUser();
  }, [authLoading, isAuthenticated, user, navigate, plan, studentType]);

  // Redirect if active subscription (including cancelled but not expired)
  useEffect(() => {
    if (!subscriptionLoading && subscriptionData) {
      const status = subscriptionData.status;
      const endDate = subscriptionData.endDate ? new Date(subscriptionData.endDate) : null;
      const now = new Date();
      
      // Check if subscription has valid access
      const hasValidAccess = 
        status === 'active' || 
        status === 'paused' ||
        (status === 'cancelled' && endDate && endDate > now);
      
      if (hasValidAccess) {
        navigate(managePath, { replace: true });
      }
    }
  }, [subscriptionData, subscriptionLoading, navigate]);

  // Redirect if no plan
  useEffect(() => {
    if (!plan) navigate(plansUrl, { replace: true });
  }, [plan, navigate, plansUrl]);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'phone':
        if (value && !/^[+]?[\d\s-]{10,}$/.test(value.replace(/\s/g, '')))
          return 'Please enter a valid phone number';
        return '';
      default:
        return '';
    }
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setUserDetails((prev) => ({ ...prev, [name]: value }));
      if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
      if (error) setError('');
    },
    [fieldErrors, error]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;

      const errors = {
        name: validateField('name', userDetails.name),
        email: validateField('email', userDetails.email),
        phone: validateField('phone', userDetails.phone),
      };

      if (Object.values(errors).some((err) => err)) {
        setFieldErrors(errors);
        return;
      }

      setLoading(true);
      setError('');
      setFieldErrors({});

      try {
        await initiateRazorpayPayment({
          plan,
          userDetails: { ...userDetails, studentType },
          onSuccess: (verificationResult) => {
            const routes = { school: '/signin/school', university: '/signin/university', default: '/signup' };
            navigate(routes[studentType] || routes.default, {
              state: { paymentDetails: verificationResult },
              replace: true,
            });
          },
          onFailure: (err) => {
            setLoading(false);
            setError(err.message || 'Payment failed. Please try again.');
          },
        });
      } catch {
        setError('Failed to initiate payment. Please try again.');
        setLoading(false);
      }
    },
    [loading, userDetails, plan, studentType, navigate, validateField]
  );

  const handleBack = useCallback(() => navigate(plansUrl), [navigate, plansUrl]);

  // Loading states
  if (authLoading || !isAuthenticated || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-[#2663EB] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">
            {authLoading ? 'Checking authentication...' : !isAuthenticated ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionRouteGuard mode="payment">
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </button>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2663EB] to-[#1D4ED8] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                    <CreditCard className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Complete Payment</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Enter your details to proceed securely</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormInput
                    id="name"
                    name="name"
                    type="text"
                    value={userDetails.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                    autoComplete="name"
                    icon={User}
                    label="Full Name"
                    error={fieldErrors.name}
                  />

                  <FormInput
                    id="email"
                    name="email"
                    type="email"
                    value={userDetails.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                    icon={Mail}
                    label="Email Address"
                    error={fieldErrors.email}
                  />

                  <FormInput
                    id="phone"
                    name="phone"
                    type="tel"
                    value={userDetails.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                    autoComplete="tel"
                    icon={Phone}
                    label="Phone Number"
                    optional
                    error={fieldErrors.phone}
                  />

                  <PaymentMethods />

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
                      className="flex-[2] h-12 px-5 text-sm font-semibold text-white bg-gradient-to-r from-[#2663EB] to-[#1D4ED8] rounded-lg hover:from-[#1D4ED8] hover:to-[#1E40AF] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Pay ₹{plan.price} Securely
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <PlanCard plan={plan} />
              <TrustFeatures />
            </div>
          </div>
        </div>
      </div>
    </SubscriptionRouteGuard>
  );
}

export default memo(PaymentCompletion);
