import { City, Country, State } from 'country-state-city';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye, EyeOff,
  Globe,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
// @ts-ignore - JS module without types
import { sendOtp, verifyOtp as verifyOtpApi } from '../../services/otpService';
// @ts-ignore - JS module without types
import DatePicker from '../../components/Subscription/shared/DatePicker';

type UserRole = 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';

interface SignupState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  selectedRole: UserRole | null;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  referralCode: string;
  agreeToTerms: boolean;
  otp: string;
  otpSent: boolean;
  otpVerified: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  sendingOtp: boolean;
  verifyingOtp: boolean;
  error: string;
}

const ALL_COUNTRIES = Country.getAllCountries();

// Country codes for phone numbers
const COUNTRY_CODES = [
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'US', dialCode: '+1', name: 'United States' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
  { code: 'CA', dialCode: '+1', name: 'Canada' },
  { code: 'AU', dialCode: '+61', name: 'Australia' },
  { code: 'AE', dialCode: '+971', name: 'UAE' },
  { code: 'SG', dialCode: '+65', name: 'Singapore' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia' },
  { code: 'DE', dialCode: '+49', name: 'Germany' },
  { code: 'FR', dialCode: '+33', name: 'France' },
  { code: 'IT', dialCode: '+39', name: 'Italy' },
  { code: 'ES', dialCode: '+34', name: 'Spain' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia' },
  { code: 'QA', dialCode: '+974', name: 'Qatar' },
  { code: 'KW', dialCode: '+965', name: 'Kuwait' },
  { code: 'OM', dialCode: '+968', name: 'Oman' },
  { code: 'BH', dialCode: '+973', name: 'Bahrain' },
  { code: 'JP', dialCode: '+81', name: 'Japan' },
  { code: 'KR', dialCode: '+82', name: 'South Korea' },
  { code: 'CN', dialCode: '+86', name: 'China' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa' },
  { code: 'BR', dialCode: '+55', name: 'Brazil' },
  { code: 'MX', dialCode: '+52', name: 'Mexico' },
  { code: 'PH', dialCode: '+63', name: 'Philippines' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia' },
  { code: 'TH', dialCode: '+66', name: 'Thailand' },
  { code: 'VN', dialCode: '+84', name: 'Vietnam' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh' },
  { code: 'LK', dialCode: '+94', name: 'Sri Lanka' },
  { code: 'NP', dialCode: '+977', name: 'Nepal' },
];

// International Languages
const LANGUAGES = [
  // Major International Languages
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'nl', name: 'Nederlands (Dutch)' },
  { code: 'pl', name: 'Polski (Polish)' },
  { code: 'tr', name: 'Türkçe (Turkish)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu (Malay)' },
  { code: 'tl', name: 'Tagalog (Filipino)' },
  // Indian Languages
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
  { code: 'ur', name: 'اردو (Urdu)' },
  // Other Languages
  { code: 'he', name: 'עברית (Hebrew)' },
  { code: 'fa', name: 'فارسی (Persian)' },
  { code: 'sw', name: 'Kiswahili (Swahili)' },
  { code: 'uk', name: 'Українська (Ukrainian)' },
  { code: 'el', name: 'Ελληνικά (Greek)' },
  { code: 'cs', name: 'Čeština (Czech)' },
  { code: 'sv', name: 'Svenska (Swedish)' },
  { code: 'da', name: 'Dansk (Danish)' },
  { code: 'no', name: 'Norsk (Norwegian)' },
  { code: 'fi', name: 'Suomi (Finnish)' },
  { code: 'hu', name: 'Magyar (Hungarian)' },
  { code: 'ro', name: 'Română (Romanian)' },
];

const UnifiedSignup = () => {
  const navigate = useNavigate();

  const [state, setState] = useState<SignupState>({
    firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '', countryCode: '+91',
    password: '', confirmPassword: '', selectedRole: null,
    country: 'IN', state: '', city: '', preferredLanguage: 'en', referralCode: '',
    agreeToTerms: false, otp: '', otpSent: false, otpVerified: false,
    showPassword: false, showConfirmPassword: false,
    loading: false, sendingOtp: false, verifyingOtp: false, error: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const allRoles: UserRole[] = ['student', 'educator', 'recruiter', 'school_admin', 'college_admin', 'university_admin'];

  const getRoleDisplayName = (role: UserRole): string => {
    const names: Record<UserRole, string> = {
      student: 'Student', recruiter: 'Recruiter', educator: 'Educator',
      school_admin: 'School Administrator', college_admin: 'College Administrator', university_admin: 'University Administrator'
    };
    return names[role];
  };

  // Load states when country changes
  useEffect(() => {
    if (state.country) {
      const stateList = State.getStatesOfCountry(state.country);
      setStates(stateList || []);
      setState(prev => ({ ...prev, state: '', city: '' }));
    }
  }, [state.country]);

  // Load cities when state changes
  useEffect(() => {
    if (state.state && state.country) {
      const stateObj = states.find(s => s.name === state.state);
      if (stateObj) {
        const cityList = City.getCitiesOfState(state.country, stateObj.isoCode);
        setCities(cityList || []);
      }
    }
  }, [state.state, state.country, states]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | boolean = value;

    if (type === 'checkbox') processedValue = (e.target as HTMLInputElement).checked;
    if (name === 'phone') processedValue = value.replace(/\D/g, '').slice(0, 15);
    if (name === 'otp') processedValue = value.replace(/\D/g, '').slice(0, 6);

    setState(prev => ({ ...prev, [name]: processedValue, error: '' }));
  };

  const handleSendOtp = async () => {
    if (!state.phone || state.phone.length < 7 || state.phone.length > 15) {
      setState(prev => ({ ...prev, error: 'Please enter a valid phone number (7-15 digits)' }));
      return;
    }
    setState(prev => ({ ...prev, sendingOtp: true, error: '' }));
    try {
      const result = await sendOtp(state.phone);
      if (result.success) setState(prev => ({ ...prev, otpSent: true, sendingOtp: false }));
      else setState(prev => ({ ...prev, error: result.error || 'Failed to send OTP', sendingOtp: false }));
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to send OTP. Please try again.', sendingOtp: false }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!state.otp || state.otp.length !== 6) {
      setState(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }
    setState(prev => ({ ...prev, verifyingOtp: true, error: '' }));
    try {
      const result = await verifyOtpApi(state.phone, state.otp);
      if (result.success) setState(prev => ({ ...prev, otpVerified: true, verifyingOtp: false }));
      else setState(prev => ({ ...prev, error: result.error || 'Invalid OTP', verifyingOtp: false }));
    } catch {
      setState(prev => ({ ...prev, error: 'Failed to verify OTP. Please try again.', verifyingOtp: false }));
    }
  };

  // Validate Step 1 fields
  const validateStep1 = (): boolean => {
    if (!state.firstName.trim()) { setState(prev => ({ ...prev, error: 'Please enter your first name' })); return false; }
    if (!state.lastName.trim()) { setState(prev => ({ ...prev, error: 'Please enter your last name' })); return false; }
    if (!state.dateOfBirth) { setState(prev => ({ ...prev, error: 'Please enter your date of birth' })); return false; }
    if (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) { setState(prev => ({ ...prev, error: 'Please enter a valid email' })); return false; }
    if (!state.phone || state.phone.length < 7 || state.phone.length > 15) { setState(prev => ({ ...prev, error: 'Please enter a valid phone number' })); return false; }
    if (!state.otpVerified) { setState(prev => ({ ...prev, error: 'Please verify your phone number with OTP' })); return false; }
    if (!state.password || state.password.length < 8) { setState(prev => ({ ...prev, error: 'Password must be at least 8 characters' })); return false; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(state.password)) { setState(prev => ({ ...prev, error: 'Password must contain uppercase, lowercase, and number' })); return false; }
    if (state.password !== state.confirmPassword) { setState(prev => ({ ...prev, error: 'Passwords do not match' })); return false; }
    return true;
  };

  // Validate Step 2 fields
  const validateStep2 = (): boolean => {
    if (!state.selectedRole) { setState(prev => ({ ...prev, error: 'Please select a user role' })); return false; }
    if (!state.country) { setState(prev => ({ ...prev, error: 'Please select your country' })); return false; }
    if (!state.state) { setState(prev => ({ ...prev, error: 'Please select your state' })); return false; }
    if (!state.city) { setState(prev => ({ ...prev, error: 'Please select your city' })); return false; }
    if (!state.agreeToTerms) { setState(prev => ({ ...prev, error: 'Please agree to Terms & Privacy Policy' })); return false; }
    return true;
  };

  // Handle Next Step
  const handleNextStep = () => {
    if (validateStep1()) {
      setState(prev => ({ ...prev, error: '' }));
      setCurrentStep(2);
    }
  };

  // Handle Previous Step
  const handlePrevStep = () => {
    setState(prev => ({ ...prev, error: '' }));
    setCurrentStep(1);
  };

  const validateForm = (): boolean => {
    if (!validateStep1()) return false;
    if (!validateStep2()) return false;
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const firstName = state.firstName.charAt(0).toUpperCase() + state.firstName.slice(1).toLowerCase();
      const lastName = state.lastName.charAt(0).toUpperCase() + state.lastName.slice(1).toLowerCase();
      const fullName = `${firstName} ${lastName} `.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.email.toLowerCase(), password: state.password,
        options: { data: { full_name: fullName, user_role: state.selectedRole, phone: state.phone } }
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user account');

      const userId = authData.user.id;
      await supabase.from('users').insert({
        id: userId, email: state.email.toLowerCase(), firstName, lastName, role: state.selectedRole, isActive: true,
        metadata: {
          phone: state.phone, fullName, dateOfBirth: state.dateOfBirth, country: state.country,
          state: state.state, city: state.city, preferredLanguage: state.preferredLanguage,
          referralCode: state.referralCode, registrationDate: new Date().toISOString()
        }
      });

      // Create role-specific record
      if (state.selectedRole === 'student') {
        await supabase.from('students').insert({ user_id: userId, first_name: firstName, last_name: lastName, email: state.email.toLowerCase(), phone: state.phone, date_of_birth: state.dateOfBirth, status: 'active' });
      } else if (state.selectedRole === 'educator') {
        await supabase.from('educators').insert({ user_id: userId, first_name: firstName, last_name: lastName, email: state.email.toLowerCase(), phone: state.phone, status: 'active' });
      } else if (state.selectedRole === 'recruiter') {
        await supabase.from('recruiters').insert({ user_id: userId, name: fullName, email: state.email.toLowerCase(), phone: state.phone, status: 'active' });
      }

      navigate('/login', { state: { message: 'Account created successfully! Please login.', email: state.email } });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDE: Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        {/* Logo Area */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">SkillPassport</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Start your global career journey today.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-md">
            Join thousands of students and professionals accessing verified opportunities worldwide. Secure, transparent, and built for your future.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Verified Security</h3>
              <p className="text-slate-400 text-sm">Your data is encrypted and protected with enterprise-grade security.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Global Reach</h3>
              <p className="text-slate-400 text-sm">Connect with institutions and recruiters from over 30 countries.</p>
            </div>
          </div>
        </div>

        {/* Footer Brand */}
        <div className="relative z-10 text-sm text-slate-500">
          © 2024 SkillPassport. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12 relative">
        <div className="w-full max-w-lg space-y-8">

          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Create your account</h2>
            <p className="text-gray-500">
              {currentStep === 1 ? 'Please enter your details to get started.' : 'Almost done! Set up your account preferences.'}
            </p>
          </div>

          {/* Stepper Header (Minimalist) */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${currentStep === 1 ? 'bg-blue-600' : 'bg-blue-600'}`}></div>
            <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
          </div>

          {/* Error Alert */}
          {state.error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{state.error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* STEP 1 FIELDS */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                    <input type="text" name="firstName" value={state.firstName} onChange={handleInputChange} placeholder="John" className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                    <input type="text" name="lastName" value={state.lastName} onChange={handleInputChange} placeholder="Doe" className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none" />
                  </div>
                </div>

                <div>
                  <DatePicker
                    name="dateOfBirth"
                    label="Date of Birth"
                    required
                    value={state.dateOfBirth}
                    onChange={handleInputChange}
                    placeholder="Select date"
                    maxDate={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" name="email" value={state.email} onChange={handleInputChange} placeholder="john@example.com" className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="flex gap-3">
                    <div className="relative w-32">
                      <select name="countryCode" value={state.countryCode} onChange={handleInputChange} disabled={state.otpVerified} className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 appearance-none outline-none">
                        {COUNTRY_CODES.map(cc => <option key={cc.code} value={cc.dialCode}>{cc.code} ({cc.dialCode})</option>)}
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <input type="tel" name="phone" value={state.phone} onChange={handleInputChange} placeholder="Phone number" disabled={state.otpVerified} className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none ${state.otpVerified ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200'}`} />
                      {state.otpVerified && <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                    </div>
                  </div>
                  {!state.otpVerified && (
                    <button type="button" onClick={handleSendOtp} disabled={state.sendingOtp || state.phone.length < 7} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">
                      {state.sendingOtp ? 'Sending code...' : state.otpSent ? 'Resend Verification Code' : 'Send Verification Code'}
                    </button>
                  )}
                  {state.otpVerified && <p className="mt-2 text-xs font-medium text-green-600 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Verified</p>}
                </div>

                {state.otpSent && !state.otpVerified && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                    <div className="flex gap-3">
                      <input type="text" name="otp" value={state.otp} onChange={handleInputChange} placeholder="123456" maxLength={6} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-center tracking-[0.5em] font-mono text-lg transition-all outline-none" />
                      <button type="button" onClick={handleVerifyOtp} disabled={state.verifyingOtp || state.otp.length !== 6} className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                        {state.verifyingOtp ? '...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={state.showPassword ? 'text' : 'password'} name="password" value={state.password} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none pr-12" placeholder="••••••••" />
                      <button type="button" onClick={() => setState(p => ({ ...p, showPassword: !p.showPassword }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input type={state.showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={state.confirmPassword} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none pr-12" placeholder="••••••••" />
                      <button type="button" onClick={() => setState(p => ({ ...p, showConfirmPassword: !p.showConfirmPassword }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {state.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="button" onClick={handleNextStep} className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                    Continue <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 FIELDS */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a...</label>
                  <select name="selectedRole" value={state.selectedRole || ''} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none">
                    <option value="">Select your role</option>
                    {allRoles.map(role => <option key={role} value={role}>{getRoleDisplayName(role)}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                    <select name="country" value={state.country} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none">
                      <option value="">Select Country</option>
                      {ALL_COUNTRIES.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                    <select name="state" value={state.state} onChange={handleInputChange} disabled={!state.country} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select State</option>
                      {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                    <select name="city" value={state.city} onChange={handleInputChange} disabled={!state.state} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
                    <select name="preferredLanguage" value={state.preferredLanguage} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none">
                      {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Referral Code <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input type="text" name="referralCode" value={state.referralCode} onChange={handleInputChange} placeholder="Code" className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none" />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="relative flex items-center pt-0.5">
                      <input type="checkbox" name="agreeToTerms" checked={state.agreeToTerms} onChange={handleInputChange} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                    </div>
                    <span className="text-sm text-gray-600 leading-relaxed">
                      I agree to the <a href="/terms" target="_blank" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Privacy Policy</a>.
                    </span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={handlePrevStep} disabled={state.loading} className="px-6 py-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all">Back</button>
                  <button type="submit" disabled={state.loading || !state.agreeToTerms} className="flex-1 py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {state.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Already have an account? <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignup;
