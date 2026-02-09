/**
 * InternalTestingRegistration - Student registration form for internal testing
 * Route: /internal-testing
 * No payment required - for testing purposes only
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  User,
  X,
  GraduationCap,
  Send,
  Lock
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { signupStudent } from '../../services/studentAuthService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';

const validateForm = (form) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  if (!form.name?.trim() || form.name.trim().length < 2) {
    errors.name = 'Please enter your full name';
  }
  if (!form.email?.trim() || !emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!form.phone?.trim() || !phoneRegex.test(form.phone.replace(/\D/g, ''))) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }
  if (!form.password?.trim() || form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

const sendOTPEmail = async (email, otp, name) => {
  const response = await fetch(`${EMAIL_API_URL}/event-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, name }),
  });

  if (!response.ok) throw new Error('Failed to send verification email');
  return true;
};

const submitRegistration = async (formData) => {
  // Submit to your backend API for storing test registrations
  const response = await fetch(`${EMAIL_API_URL}/test-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  if (!response.ok) throw new Error('Failed to submit registration');
  return response.json();
};

const InputField = ({ label, icon: Icon, error, verified, disabled, rightElement, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
      {label} <span className="text-blue-600">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 ${verified ? 'text-emerald-600' : 'text-gray-400'} transition-colors`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}
      <input
        {...props}
        disabled={disabled}
        className={`
          w-full h-11 sm:h-12 md:h-14 bg-white border-2 rounded-xl outline-none transition-all duration-200
          ${Icon ? 'pl-10 sm:pl-11 md:pl-12' : 'pl-3 sm:pl-4'} ${rightElement ? 'pr-24 sm:pr-32' : 'pr-3 sm:pr-4'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : ''}
          ${verified
            ? 'border-emerald-400 bg-emerald-50/30 shadow-sm shadow-emerald-100'
            : error
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 shadow-sm shadow-red-100'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm hover:shadow-md'
          }
          text-gray-900 placeholder:text-gray-400 text-sm sm:text-base
        `}
      />
      {rightElement && (
        <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
      {verified && !rightElement && (
        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1 font-medium"
      >
        <X className="w-3 h-3" /> {error}
      </motion.p>
    )}
  </motion.div>
);

const SelectField = ({ label, icon: Icon, error, options, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
      {label} <span className="text-blue-600">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}
      <select
        {...props}
        className={`
          w-full h-11 sm:h-12 md:h-14 bg-white border-2 rounded-xl outline-none transition-all duration-200
          ${Icon ? 'pl-10 sm:pl-11 md:pl-12' : 'pl-3 sm:pl-4'} pr-3 sm:pr-4
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-50 shadow-sm shadow-red-100'
            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm hover:shadow-md'
          }
          text-gray-900 text-sm sm:text-base
        `}
      >
        <option value="">Select {label}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1 font-medium"
      >
        <X className="w-3 h-3" /> {error}
      </motion.p>
    )}
  </motion.div>
);

export default function InternalTestingRegistration() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    institutionType: 'school' // Default to school
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    setRegistrationError(null);
  }, [errors]);

  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setRegistrationError(null);

    try {
      // Determine if school or college based on selection
      const isCollege = form.institutionType === 'college';
      
      // Parse name into firstName and lastName
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || 'Rareminds';
      
      console.log('Signup data:', {
        email: form.email.trim(),
        firstName,
        lastName,
        role: isCollege ? 'college_student' : 'school_student',
        institution: 'Rareminds',
        institutionType: form.institutionType,
        grade: form.grade
      });
      
      // Create student account with all required fields
      // For internal testing: auto-approve and set full subscription access
      const signupResult = await signupStudent({
        email: form.email.trim(),
        password: form.password,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        phone: form.phone.replace(/\D/g, ''),
        contact_number: form.phone.replace(/\D/g, ''),
        school_id: isCollege ? null : 'internal-testing-school',
        university_college_id: isCollege ? 'internal-testing-college' : null,
        institution: 'Rareminds',
        institution_type: form.institutionType, // Store institution type
        approval_status: 'approved',
        role: isCollege ? 'college_student' : 'school_student',
        // Subscription fields for full access
        subscription_status: 'active',
        subscription_tier: 'premium',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        trial_end_date: null,
        features_access: {
          career_assessment: true,
          skill_verification: true,
          digital_portfolio: true,
          job_applications: true,
          courses: true,
          analytics: true,
          ai_counseling: true,
          unlimited_access: true
        }
      });

      if (!signupResult.success) {
        throw new Error(signupResult.error || 'Failed to create account');
      }

      console.log('Signup successful:', signupResult);

      // Show redirecting loader immediately
      setRedirecting(true);

      // Get the current session from Supabase (user was auto-logged in during signup)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check:', { 
        hasSession: !!session, 
        sessionError,
        userId: session?.user?.id 
      });

      if (session && session.user) {
        console.log('Session found, fetching student record...');
        
        // Fetch the student record
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        console.log('Student record:', { hasStudent: !!student, studentError });

        if (student) {
          console.log('Student record found, updating auth context...');
          
          // Update auth context with session and student
          login(student, session);
          
          console.log('Navigating to dashboard...');
          
          // Redirect to student dashboard
          setTimeout(() => {
            navigate('/student/dashboard');
          }, 500);
        } else {
          console.log('Student record not found, redirecting to login...');
          // Student record not found, redirect to login
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Account created! Please log in to continue.',
                email: form.email.trim()
              }
            });
          }, 1500);
        }
      } else {
        console.log('No session found, redirecting to login...');
        // No session, redirect to login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account created! Please log in with your credentials.',
              email: form.email.trim()
            }
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError(error.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  // Redirecting Loader Screen
  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6"
          >
            <div className="w-full h-full border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
          >
            Account Created Successfully!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-gray-600 mb-6"
          >
            Redirecting to your dashboard...
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Success View
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <section className="py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 text-center overflow-hidden bg-emerald-600">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-20" />
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
                  >
                    <Check className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-emerald-600" strokeWidth={3} />
                  </motion.div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">Registration Successful!</h2>
                  <p className="text-emerald-100 text-base sm:text-lg">Welcome to Internal Testing</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 md:p-8 lg:p-10">
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 py-3 sm:py-4 border-b-2 border-gray-100">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">Student Name</span>
                    <span className="text-sm sm:text-base text-gray-900 font-bold break-words">{form.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 py-3 sm:py-4 border-b-2 border-gray-100">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">Email</span>
                    <span className="text-sm sm:text-base text-gray-900 font-bold break-words">{form.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 py-3 sm:py-4">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">Institution</span>
                    <span className="text-sm sm:text-base text-gray-900 font-bold break-words">{form.institution}</span>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border-2 border-blue-100">
                  <p className="text-xs sm:text-sm text-blue-900 font-medium text-center">
                    Thank you for registering! Our team will contact you soon with further instructions.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <section className="py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 rounded-full mb-3 sm:mb-4"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
                <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
                  <DotLottieReact
                    src="https://lottie.host/1689bbd3-291d-4b13-9da5-2882f580c526/7rNvhtQCvu.lottie"
                    loop
                    autoplay
                    style={{ width: '32px', height: '32px' }}
                  />
                </div>
              </div>
              <span className="text-gray-900 text-sm sm:text-base font-bold">Internal Testing</span>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">
              Student Registration
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto px-4">
              Join our internal testing program - No payment required
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6 md:p-8 lg:p-10"
          >
            <div className="space-y-4 sm:space-y-5">
              <InputField
                label="Full Name"
                icon={User}
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                error={errors.name}
              />

              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                error={errors.email}
              />

              <InputField
                label="Phone Number"
                icon={Phone}
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                error={errors.phone}
              />

              <InputField
                label="Password"
                icon={Lock}
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a password (min 6 characters)"
                error={errors.password}
              />
            </div>

            <AnimatePresence>
              {registrationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl shadow-sm"
                >
                  <p className="text-xs sm:text-sm text-red-700 flex items-center gap-2 font-medium">
                    <X className="w-4 h-4" />
                    {registrationError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 sm:py-4 text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] sm:min-h-[56px] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Register</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs sm:text-sm text-gray-500 mt-5 sm:mt-6 px-4"
          >
            Need help?{' '}
            <a href="https://rareminds.in/contact" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2">
              Contact Support
            </a>
          </motion.p>
        </div>
      </section>
    </div>
  );
}
