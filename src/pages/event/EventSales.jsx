/**
 * Event Sales Page
 * Simple page for selling plans at events without authentication
 * Route: /register/plans
 */

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Shield, CreditCard, User, Mail, Phone, AlertCircle, Lock, Zap, CheckCircle, Sparkles, GraduationCap, School, Building2, Briefcase, Users, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getEntityContent } from '../../utils/getEntityContent';
import { PAYMENT_CONFIG, isTestPricing } from '../../config/payment';

const RAZORPAY_KEY_ID = import.meta.env.TEST_VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID;

// Entity and Role configurations
const ENTITIES = [
  { id: 'school', name: 'School', icon: School, color: 'bg-emerald-500' },
  { id: 'college', name: 'College', icon: Building2, color: 'bg-blue-500' },
  { id: 'university', name: 'University', icon: GraduationCap, color: 'bg-purple-500' },
  { id: 'recruitment', name: 'Recruitment', icon: Briefcase, color: 'bg-orange-500' },
];

const ROLES_BY_ENTITY = {
  school: [
    { id: 'student', name: 'Student', icon: Users, description: 'Access skill assessments & career tools' },
    { id: 'educator', name: 'Educator', icon: BookOpen, description: 'Manage students & track progress' },
    { id: 'admin', name: 'Admin', icon: Shield, description: 'Institution management tools' },
  ],
  college: [
    { id: 'student', name: 'Student', icon: Users, description: 'Access skill assessments & career tools' },
    { id: 'educator', name: 'Educator', icon: BookOpen, description: 'Manage students & track progress' },
    { id: 'admin', name: 'Admin', icon: Shield, description: 'Institution management tools' },
  ],
  university: [
    { id: 'student', name: 'Student', icon: Users, description: 'Access skill assessments & career tools' },
    { id: 'educator', name: 'Educator', icon: BookOpen, description: 'Manage students & track progress' },
    { id: 'admin', name: 'Admin', icon: Shield, description: 'University management tools' },
  ],
  recruitment: [
    { id: 'recruiter', name: 'Recruiter', icon: Users, description: 'Access verified candidates' },
    { id: 'admin', name: 'Admin', icon: Shield, description: 'Manage recruitment team' },
  ],
};

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Form Input Component
const FormInput = memo(({ id, name, type = 'text', value, onChange, placeholder, required, disabled, icon: Icon, label, error }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : isFocused ? 'text-[#2663EB]' : 'text-gray-400'}`}>
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
            error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300 focus:border-[#2663EB] focus:ring-2 focus:ring-blue-100'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''} placeholder:text-gray-400`}
          required={required}
          disabled={disabled}
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
});

FormInput.displayName = 'FormInput';

// Plan Card Component
const PlanCard = memo(({ plan, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(plan)}
    className={`relative rounded-2xl bg-white p-6 shadow-lg flex flex-col transition-all cursor-pointer ${
      isSelected ? 'ring-2 ring-[#2663EB] shadow-xl' : plan.recommended ? 'ring-2 ring-blue-200' : 'hover:shadow-xl'
    }`}
  >
    {plan.recommended && !isSelected && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-medium">Recommended</span>
      </div>
    )}
    {isSelected && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <span className="bg-[#2663EB] text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <Check className="w-3 h-3" /> Selected
        </span>
      </div>
    )}
    <div className="mb-4">
      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-bold tracking-tight text-gray-900">₹{plan.price}</span>
        <span className="ml-1 text-lg font-semibold text-gray-600">/{plan.duration}</span>
      </div>
    </div>
    <ul className="mb-4 space-y-2 flex-1">
      {plan.features.slice(0, 4).map((feature, index) => (
        <li key={index} className="flex items-start text-sm">
          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="ml-2 text-gray-600">{feature}</span>
        </li>
      ))}
      {plan.features.length > 4 && (
        <li className="text-xs text-gray-400 ml-6">+{plan.features.length - 4} more features</li>
      )}
    </ul>
  </div>
));

PlanCard.displayName = 'PlanCard';

// Trust Features
const TrustFeatures = memo(() => (
  <div className="bg-white rounded-xl border border-gray-100 p-5">
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Why Choose Us</h4>
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

// Payment Methods
const PaymentMethods = memo(() => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
    <div className="flex items-center gap-2 mb-3">
      <CreditCard className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
      <h3 className="text-sm font-semibold text-gray-800">Payment Methods</h3>
    </div>
    <div className="flex flex-wrap gap-2">
      {['Cards', 'UPI', 'Net Banking', 'Wallets'].map((method) => (
        <span key={method} className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-gray-600 border border-gray-200">
          {method}
        </span>
      ))}
    </div>
  </div>
));

PaymentMethods.displayName = 'PaymentMethods';

// Role Selector Component
const RoleSelector = memo(({ selectedEntity, selectedRole, onEntityChange, onRoleChange }) => {
  const availableRoles = selectedEntity ? ROLES_BY_ENTITY[selectedEntity] : [];

  return (
    <div className="space-y-6">
      {/* Entity Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">I am from a...</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ENTITIES.map((entity) => {
            const Icon = entity.icon;
            const isSelected = selectedEntity === entity.id;
            return (
              <button
                key={entity.id}
                onClick={() => onEntityChange(entity.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#2663EB] bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${isSelected ? 'bg-[#2663EB]' : entity.color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-[#2663EB]' : 'text-gray-700'}`}>
                  {entity.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#2663EB] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Selection */}
      {selectedEntity && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">I am a...</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availableRoles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => onRoleChange(role.id)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#2663EB] bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${isSelected ? 'bg-[#2663EB]' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#2663EB]' : 'text-gray-800'}`}>
                        {role.name}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#2663EB] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

RoleSelector.displayName = 'RoleSelector';

function EventSales() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventName = searchParams.get('event') || 'Event Registration';

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [userDetails, setUserDetails] = useState({ name: '', email: '', phone: '' });

  // Build the student type string for getEntityContent
  const studentType = useMemo(() => {
    if (!selectedEntity || !selectedRole) return 'student';
    if (selectedEntity === 'school' && selectedRole === 'student') return 'student';
    return `${selectedEntity}-${selectedRole}`;
  }, [selectedEntity, selectedRole]);

  // Get plans from entity content based on selected role
  const { plans } = useMemo(() => getEntityContent(studentType), [studentType]);

  // Reset selected plan when role changes
  useEffect(() => {
    if (plans.length > 0) {
      const recommended = plans.find(p => p.recommended) || plans[0];
      setSelectedPlan(recommended);
    }
  }, [plans]);

  // Handle entity change - reset role when entity changes
  const handleEntityChange = useCallback((entity) => {
    setSelectedEntity(entity);
    setSelectedRole(null);
    setSelectedPlan(null);
  }, []);

  const handleRoleChange = useCallback((role) => {
    setSelectedRole(role);
  }, []);

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
        if (!value.trim()) return 'Phone number is required';
        if (!/^[+]?[\d\s-]{10,}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number';
        return '';
      default:
        return '';
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) setError('');
  }, [fieldErrors, error]);

  const handlePayment = useCallback(async (e) => {
    e.preventDefault();
    if (loading || !selectedPlan) return;

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
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load payment gateway');

      // Create registration record with role info
      const roleType = selectedEntity && selectedRole 
        ? `${selectedEntity}-${selectedRole}` 
        : 'student';
      
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          full_name: userDetails.name,
          email: userDetails.email,
          phone: userDetails.phone,
          plan_type: selectedPlan.name,
          plan_amount: parseInt(selectedPlan.price),
          payment_status: 'pending',
          event_name: eventName,
          role_type: roleType,
        })
        .select()
        .single();

      if (regError) throw regError;

      const amount = parseInt(selectedPlan.price) * 100; // Convert to paise

      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'RareMinds Skill Passport',
        description: `${selectedPlan.name} Plan - ${eventName}`,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone,
        },
        notes: {
          registration_id: registration.id,
          plan: selectedPlan.name,
          event: eventName,
        },
        theme: { color: '#2663EB' },
        handler: async (response) => {
          // Update registration as completed
          await supabase
            .from('event_registrations')
            .update({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              payment_status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', registration.id);

          // Navigate to success page
          navigate(`/register/plans/success?id=${registration.id}&plan=${selectedPlan.name}`);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', async () => {
        await supabase
          .from('event_registrations')
          .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', registration.id);
        setLoading(false);
        setError('Payment failed. Please try again.');
      });
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }, [loading, selectedPlan, userDetails, validateField, eventName, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {eventName}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get Your Skill Passport</h1>
          <p className="text-lg text-gray-600">Quick registration - No account needed</p>
        </div>

        {/* Test Mode Indicator */}
        {isTestPricing() && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-semibold">
              🧪 Test Mode: All plans are ₹1 for testing on {PAYMENT_CONFIG.HOSTNAME}
            </p>
          </div>
        )}

        {/* Role Selection */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <Users className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Select Your Role</h2>
              <p className="text-sm text-gray-500 mt-0.5">Choose your institution type and role</p>
            </div>
          </div>
          <RoleSelector
            selectedEntity={selectedEntity}
            selectedRole={selectedRole}
            onEntityChange={handleEntityChange}
            onRoleChange={handleRoleChange}
          />
        </div>

        {/* Plans Selection - Only show when role is selected */}
        {selectedRole && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Select Your Plan</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan?.id === plan.id}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>
          </div>
        )}

        {/* Form Section - Only show when plan is selected */}
        {selectedPlan && selectedRole && (
        <div className="grid lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2663EB] to-[#1D4ED8] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <User className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">3. Your Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Enter your information to proceed</p>
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-5">
                <FormInput
                  id="name"
                  name="name"
                  type="text"
                  value={userDetails.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
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
                  required
                  disabled={loading}
                  icon={Phone}
                  label="Phone Number"
                  error={fieldErrors.phone}
                />

                <PaymentMethods />

                {error && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Payment Error</p>
                      <p className="text-xs text-red-600 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !selectedPlan}
                  className="w-full h-12 px-5 text-sm font-semibold text-white bg-gradient-to-r from-[#2663EB] to-[#1D4ED8] rounded-lg hover:from-[#1D4ED8] hover:to-[#1E40AF] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay ₹{selectedPlan?.price || '0'} Securely
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {selectedPlan && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2663EB] via-[#1D4ED8] to-[#1E40AF] p-6 text-white shadow-lg shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Selected Plan</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{selectedPlan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-bold">₹{selectedPlan.price}</span>
                    <span className="text-blue-200">/{selectedPlan.duration}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4 space-y-2.5">
                    {selectedPlan.features?.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-blue-200" strokeWidth={2.5} />
                        <span className="text-sm text-blue-100">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <TrustFeatures />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default memo(EventSales);
