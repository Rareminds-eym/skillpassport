import { City, Country, State } from 'country-state-city';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye, EyeOff,
  Gift,
  Globe,
  Languages,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone, User,
  UserCircle
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
    <div className="flex items-center lg:py-8 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 min-h-screen lg:min-h-[700px] overflow-hidden">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="/login/login.jpg" alt="Signup background" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl text-center font-bold leading-tight">Join Our Platform</h2>
            <p className="mt-4 max-w-xl text-center text-[#edf2f9]">Create your account and start your journey with us</p>
          </div>
          <div className="relative z-10 flex justify-center items-center h-full">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                <UserCircle className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-semibold">Create Account</h3>
              <p className="text-white/80 text-sm mt-1">Quick & Easy Registration</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-8">
          <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#0a6aba] to-[#09277f]" />
          <div className="hidden lg:block absolute inset-0 bg-white" />
          <div className="relative w-full max-w-lg">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white lg:text-gray-900">Create Account</h3>
              <p className="text-sm text-white/80 lg:text-gray-600 mt-2">
                {currentStep === 1 ? 'Step 1: Personal Information' : 'Step 2: Account Setup'}
              </p>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-4 mt-8 mb-8">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md ${currentStep >= 1 ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-100 ring-offset-2' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>1</div>
                  <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${currentStep >= 1 ? 'text-blue-700' : 'text-gray-400'}`}>Personal Info</span>
                </div>

                {/* Connector Line */}
                <div className="flex-1 max-w-[100px] h-[2px] bg-gray-200 relative -top-3">
                  <div className={`h-full bg-blue-600 transition-all duration-500 ease-out`} style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
                </div>

                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md ${currentStep >= 2 ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-100 ring-offset-2' : 'bg-white text-gray-500 border-2 border-gray-200'}`}>2</div>
                  <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${currentStep >= 2 ? 'text-blue-700' : 'text-gray-400'}`}>Account Setup</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 sm:p-8 mx-auto w-full">
              {state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{state.error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* STEP 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          <input type="text" name="firstName" value={state.firstName} onChange={handleInputChange} placeholder="John" className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                        <div className="relative group">
                          <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          <input type="text" name="lastName" value={state.lastName} onChange={handleInputChange} placeholder="Doe" className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="relative group">
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

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="email" name="email" value={state.email} onChange={handleInputChange} placeholder="john.doe@example.com" className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none" />
                      </div>
                    </div>

                    {/* Mobile Number with OTP */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                      <div className="flex gap-3">
                        {/* Country Code Dropdown */}
                        <div className="relative">
                          <select
                            name="countryCode"
                            value={state.countryCode}
                            onChange={handleInputChange}
                            disabled={state.otpVerified}
                            className={`h-full pl-3 pr-8 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 appearance-none text-sm font-medium outline-none transition-all ${state.otpVerified ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200'}`}
                          >
                            {COUNTRY_CODES.map(cc => (
                              <option key={cc.code} value={cc.dialCode}>
                                {cc.code} ({cc.dialCode})
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                          </div>
                        </div>

                        <div className="relative flex-1 group">
                          <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          <input type="tel" name="phone" value={state.phone} onChange={handleInputChange} placeholder="Phone number" disabled={state.otpVerified} className={`block w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none ${state.otpVerified ? 'border-green-200 bg-green-50' : 'border-gray-200'}`} />
                          {state.otpVerified && <CheckCircle className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />}
                        </div>
                        {!state.otpVerified && (
                          <button type="button" onClick={handleSendOtp} disabled={state.sendingOtp || state.phone.length < 7} className="px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 shadow-md shadow-blue-200 transition-all active:scale-95 whitespace-nowrap">
                            {state.sendingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : state.otpSent ? 'Resend' : 'Send OTP'}
                          </button>
                        )}
                      </div>
                      {state.otpVerified && <p className="mt-2 text-xs font-medium text-green-600 flex items-center gap-1.5 animate-in slide-in-from-top-1"><CheckCircle className="w-3.5 h-3.5" /> Mobile number verified successfully</p>}
                    </div>

                    {/* OTP Input */}
                    {state.otpSent && !state.otpVerified && (
                      <div>
                        <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Enter OTP <span className="text-red-400">*</span></label>
                        <div className="flex gap-2">
                          <input type="text" name="otp" value={state.otp} onChange={handleInputChange} placeholder="6-digit OTP" maxLength={6} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-center tracking-widest font-mono" />
                          <button type="button" onClick={handleVerifyOtp} disabled={state.verifyingOtp || state.otp.length !== 6} className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {state.verifyingOtp ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-white/70 lg:text-gray-500">OTP sent to {state.countryCode} {state.phone}</p>
                      </div>
                    )}

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type={state.showPassword ? 'text' : 'password'} name="password" value={state.password} onChange={handleInputChange} placeholder="Min. 8 characters" className="block w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none" />
                        <button type="button" onClick={() => setState(p => ({ ...p, showPassword: !p.showPassword }))} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                          {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 ml-1">Must contain uppercase, lowercase, and number</p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type={state.showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={state.confirmPassword} onChange={handleInputChange} placeholder="Re-enter password" className="block w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none" />
                        <button type="button" onClick={() => setState(p => ({ ...p, showConfirmPassword: !p.showConfirmPassword }))} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                          {state.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button type="button" onClick={handleNextStep} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 border border-transparent rounded-xl shadow-lg shadow-blue-200 text-white bg-blue-600 hover:bg-blue-700 font-semibold mt-8 transition-all duration-200 active:scale-[0.98]">
                      Next Step <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <a href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                          Sign in
                        </a>
                      </p>
                    </div>
                  </>
                )}

                {/* STEP 2: Account Setup */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* User Role / Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">User Role / Category <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <UserCircle className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <select name="selectedRole" value={state.selectedRole || ''} onChange={handleInputChange} className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none appearance-none">
                          <option value="">Select your role...</option>
                          {allRoles.map(role => <option key={role} value={role}>{getRoleDisplayName(role)}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Globe className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <select name="country" value={state.country} onChange={handleInputChange} className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none appearance-none">
                          <option value="">Select Country</option>
                          {ALL_COUNTRIES.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* State / UT */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">State / UT <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <select name="state" value={state.state} onChange={handleInputChange} disabled={!state.country} className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none appearance-none disabled:bg-gray-100 disabled:text-gray-400">
                          <option value="">{!state.country ? 'Select country first' : 'Select State / UT'}</option>
                          {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* City / District */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">City / District <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <select name="city" value={state.city} onChange={handleInputChange} disabled={!state.state} className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none appearance-none disabled:bg-gray-100 disabled:text-gray-400">
                          <option value="">{!state.state ? 'Select state first' : 'Select City / District'}</option>
                          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* Preferred Language */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Language</label>
                      <div className="relative group">
                        <Languages className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <select name="preferredLanguage" value={state.preferredLanguage} onChange={handleInputChange} className="block w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none appearance-none">
                          {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* Referral Code / Partner ID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Referral Code / Partner ID</label>
                      <div className="relative group">
                        <Gift className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="text" name="referralCode" value={state.referralCode} onChange={handleInputChange} placeholder="Enter referral code (optional)" className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200 outline-none" />
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 ml-1">Have a referral code? Enter it here for special benefits</p>
                    </div>

                    {/* Terms & Privacy Policy */}
                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" name="agreeToTerms" checked={state.agreeToTerms} onChange={handleInputChange} className="peer h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer" />
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                          I agree to the <a href="/terms" target="_blank" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">Privacy Policy</a> <span className="text-red-500">*</span>
                        </span>
                      </label>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <button type="button" onClick={handlePrevStep} disabled={state.loading} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 border border-gray-200 rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 font-semibold transition-all duration-200 active:scale-[0.98]">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button type="submit" disabled={state.loading || !state.agreeToTerms} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 border border-transparent rounded-xl shadow-lg shadow-blue-200 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none font-semibold transition-all duration-200 active:scale-[0.98]">
                        {state.loading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Creating Account...</span></>) : <span>Create Account</span>}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignup;
