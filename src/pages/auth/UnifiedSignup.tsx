import { City, Country, State } from 'country-state-city';
import {
    AlertCircle,
    Calendar,
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

type UserRole = 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';

interface SignupState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
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
const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'bn', name: 'বাংলা (Bengali)' }, { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' }, { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' }, { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' }, { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
];

const UnifiedSignup = () => {
  const navigate = useNavigate();
  
  const [state, setState] = useState<SignupState>({
    firstName: '', lastName: '', dateOfBirth: '', email: '', phone: '',
    password: '', confirmPassword: '', selectedRole: null,
    country: 'IN', state: '', city: '', preferredLanguage: 'en', referralCode: '',
    agreeToTerms: false, otp: '', otpSent: false, otpVerified: false,
    showPassword: false, showConfirmPassword: false,
    loading: false, sendingOtp: false, verifyingOtp: false, error: ''
  });

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
    if (name === 'phone') processedValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'otp') processedValue = value.replace(/\D/g, '').slice(0, 6);
    
    setState(prev => ({ ...prev, [name]: processedValue, error: '' }));
  };

  const handleSendOtp = async () => {
    if (!state.phone || state.phone.length !== 10) {
      setState(prev => ({ ...prev, error: 'Please enter a valid 10-digit phone number' }));
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

  const validateForm = (): boolean => {
    if (!state.firstName.trim()) { setState(prev => ({ ...prev, error: 'Please enter your first name' })); return false; }
    if (!state.lastName.trim()) { setState(prev => ({ ...prev, error: 'Please enter your last name' })); return false; }
    if (!state.dateOfBirth) { setState(prev => ({ ...prev, error: 'Please enter your date of birth' })); return false; }
    if (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) { setState(prev => ({ ...prev, error: 'Please enter a valid email' })); return false; }
    if (!state.phone || state.phone.length !== 10) { setState(prev => ({ ...prev, error: 'Please enter a valid 10-digit phone' })); return false; }
    if (!state.otpVerified) { setState(prev => ({ ...prev, error: 'Please verify your phone number with OTP' })); return false; }
    if (!state.password || state.password.length < 8) { setState(prev => ({ ...prev, error: 'Password must be at least 8 characters' })); return false; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(state.password)) { setState(prev => ({ ...prev, error: 'Password must contain uppercase, lowercase, and number' })); return false; }
    if (state.password !== state.confirmPassword) { setState(prev => ({ ...prev, error: 'Passwords do not match' })); return false; }
    if (!state.selectedRole) { setState(prev => ({ ...prev, error: 'Please select a user role' })); return false; }
    if (!state.country) { setState(prev => ({ ...prev, error: 'Please select your country' })); return false; }
    if (!state.state) { setState(prev => ({ ...prev, error: 'Please select your state' })); return false; }
    if (!state.city) { setState(prev => ({ ...prev, error: 'Please select your city' })); return false; }
    if (!state.agreeToTerms) { setState(prev => ({ ...prev, error: 'Please agree to Terms & Privacy Policy' })); return false; }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const firstName = state.firstName.charAt(0).toUpperCase() + state.firstName.slice(1).toLowerCase();
      const lastName = state.lastName.charAt(0).toUpperCase() + state.lastName.slice(1).toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.email.toLowerCase(), password: state.password,
        options: { data: { full_name: fullName, user_role: state.selectedRole, phone: state.phone } }
      });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user account');
      
      const userId = authData.user.id;
      await supabase.from('users').insert({
        id: userId, email: state.email.toLowerCase(), firstName, lastName, role: state.selectedRole, isActive: true,
        metadata: { phone: state.phone, fullName, dateOfBirth: state.dateOfBirth, country: state.country, 
          state: state.state, city: state.city, preferredLanguage: state.preferredLanguage, 
          referralCode: state.referralCode, registrationDate: new Date().toISOString() }
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
              <p className="text-sm text-white/80 lg:text-gray-600 mt-2">Fill in your details to get started</p>
            </div>
            <div className="rounded-2xl bg-transparent lg:bg-white/95 lg:shadow-xl lg:ring-1 lg:ring-black/5 p-5 sm:p-6 lg:p-8 max-h-[75vh] overflow-y-auto">
              {state.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{state.error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">First Name <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" name="firstName" value={state.firstName} onChange={handleInputChange} placeholder="First name" className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Last Name <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" name="lastName" value={state.lastName} onChange={handleInputChange} placeholder="Last name" className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Date of Birth <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="date" name="dateOfBirth" value={state.dateOfBirth} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Email Address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" name="email" value={state.email} onChange={handleInputChange} placeholder="you@example.com" className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                </div>

                {/* Mobile Number with OTP */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Mobile Number <span className="text-red-400">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="tel" name="phone" value={state.phone} onChange={handleInputChange} placeholder="10-digit number" disabled={state.otpVerified} className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${state.otpVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'}`} />
                      {state.otpVerified && <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />}
                    </div>
                    {!state.otpVerified && (
                      <button type="button" onClick={handleSendOtp} disabled={state.sendingOtp || state.phone.length !== 10} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                        {state.sendingOtp ? 'Sending...' : state.otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                  {state.otpVerified && <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Phone verified</p>}
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
                    <p className="mt-1 text-xs text-white/70 lg:text-gray-500">OTP sent to +91 {state.phone}</p>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type={state.showPassword ? 'text' : 'password'} name="password" value={state.password} onChange={handleInputChange} placeholder="Min. 8 characters" className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                    <button type="button" onClick={() => setState(p => ({ ...p, showPassword: !p.showPassword }))} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-white/70 lg:text-gray-500">Must contain uppercase, lowercase, and number</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Confirm Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type={state.showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={state.confirmPassword} onChange={handleInputChange} placeholder="Re-enter password" className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                    <button type="button" onClick={() => setState(p => ({ ...p, showConfirmPassword: !p.showConfirmPassword }))} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {state.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* User Role / Category */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">User Role / Category <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select name="selectedRole" value={state.selectedRole || ''} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                      <option value="">Select your role...</option>
                      {allRoles.map(role => <option key={role} value={role}>{getRoleDisplayName(role)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Country <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select name="country" value={state.country} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                      <option value="">Select Country</option>
                      {ALL_COUNTRIES.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* State / UT */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">State / UT <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select name="state" value={state.state} onChange={handleInputChange} disabled={!state.country} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none disabled:bg-gray-100">
                      <option value="">{!state.country ? 'Select country first' : 'Select State / UT'}</option>
                      {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* City / District */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">City / District <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select name="city" value={state.city} onChange={handleInputChange} disabled={!state.state} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none disabled:bg-gray-100">
                      <option value="">{!state.state ? 'Select state first' : 'Select City / District'}</option>
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Preferred Language</label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select name="preferredLanguage" value={state.preferredLanguage} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                      {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Referral Code / Partner ID */}
                <div>
                  <label className="block text-sm font-medium text-white lg:text-gray-700 mb-1">Referral Code / Partner ID</label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" name="referralCode" value={state.referralCode} onChange={handleInputChange} placeholder="Enter referral code (optional)" className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                  </div>
                  <p className="mt-1 text-xs text-white/70 lg:text-gray-500">Have a referral code? Enter it here for special benefits</p>
                </div>

                {/* Terms & Privacy Policy */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="agreeToTerms" checked={state.agreeToTerms} onChange={handleInputChange} className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-white lg:text-gray-600">
                      I agree to the <a href="/terms" target="_blank" className="text-blue-400 lg:text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-blue-400 lg:text-blue-600 hover:underline">Privacy Policy</a> <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                {/* OTP Verification Warning */}
                {!state.otpVerified && (
                  <p className="text-sm text-amber-400 lg:text-amber-600 text-center">Please verify your phone number with OTP to continue</p>
                )}

                {/* Submit Button */}
                <button type="submit" disabled={state.loading || !state.otpVerified || !state.agreeToTerms} className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium mt-4">
                  {state.loading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Creating Account...</span></>) : <span>Create Account</span>}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white lg:text-gray-600">Already have an account?{' '}<a href="/login" className="font-medium text-white lg:text-blue-600 hover:text-white/80 lg:hover:text-blue-500">Sign in</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignup;
