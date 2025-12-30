import { City, Country, State } from 'country-state-city';
import {
    AlertCircle,
    ArrowRight,
    Award,
    CheckCircle,
    ChevronDown,
    Eye, EyeOff,
    Globe,
    Loader2,
    Share2,
    TrendingUp
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
// @ts-ignore - JS module without types
import { sendOtp, verifyOtp as verifyOtpApi } from '../../services/otpService';
// @ts-ignore - JS module without types
import DatePicker from '../../components/Subscription/shared/DatePicker';

type UserRole = 'school_student' | 'college_student' | 'recruiter' | 'school_educator' | 'college_educator' | 'school_admin' | 'college_admin' | 'university_admin';

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

// Country codes for phone numbers with flags - comprehensive list
const COUNTRY_CODES = [
  // South Asia
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LK', dialCode: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'NP', dialCode: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: 'BT', dialCode: '+975', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'MV', dialCode: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: 'AF', dialCode: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  // North America
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'MX', dialCode: '+52', name: 'Mexico', flag: '🇲🇽' },
  // Europe
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'IT', dialCode: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', dialCode: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', dialCode: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: 'PT', dialCode: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'CH', dialCode: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', dialCode: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: 'SE', dialCode: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', dialCode: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', dialCode: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', dialCode: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: 'IE', dialCode: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PL', dialCode: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', dialCode: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HU', dialCode: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: 'RO', dialCode: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: 'GR', dialCode: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: 'UA', dialCode: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'RU', dialCode: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: 'TR', dialCode: '+90', name: 'Turkey', flag: '🇹🇷' },
  // Middle East
  { code: 'AE', dialCode: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', dialCode: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', dialCode: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'OM', dialCode: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: 'BH', dialCode: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'IL', dialCode: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: 'JO', dialCode: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', dialCode: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'IQ', dialCode: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IR', dialCode: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: 'EG', dialCode: '+20', name: 'Egypt', flag: '🇪🇬' },
  // East Asia
  { code: 'CN', dialCode: '+86', name: 'China', flag: '🇨🇳' },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', dialCode: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: 'HK', dialCode: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TW', dialCode: '+886', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'MO', dialCode: '+853', name: 'Macau', flag: '🇲🇴' },
  { code: 'MN', dialCode: '+976', name: 'Mongolia', flag: '🇲🇳' },
  // Southeast Asia
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'TH', dialCode: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', dialCode: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'MM', dialCode: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'KH', dialCode: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'LA', dialCode: '+856', name: 'Laos', flag: '🇱🇦' },
  { code: 'BN', dialCode: '+673', name: 'Brunei', flag: '🇧🇳' },
  // Oceania
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'FJ', dialCode: '+679', name: 'Fiji', flag: '🇫🇯' },
  { code: 'PG', dialCode: '+675', name: 'Papua New Guinea', flag: '🇵🇬' },
  // Africa
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', dialCode: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'GH', dialCode: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ET', dialCode: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'TZ', dialCode: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'UG', dialCode: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: 'MA', dialCode: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: 'DZ', dialCode: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: 'TN', dialCode: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'ZW', dialCode: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'MU', dialCode: '+230', name: 'Mauritius', flag: '🇲🇺' },
  // South America
  { code: 'BR', dialCode: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', dialCode: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', dialCode: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', dialCode: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', dialCode: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: 'VE', dialCode: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', dialCode: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'UY', dialCode: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', dialCode: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BO', dialCode: '+591', name: 'Bolivia', flag: '🇧🇴' },
  // Central America & Caribbean
  { code: 'PA', dialCode: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: 'CR', dialCode: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'GT', dialCode: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CU', dialCode: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: 'DO', dialCode: '+1', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'JM', dialCode: '+1', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'TT', dialCode: '+1', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'PR', dialCode: '+1', name: 'Puerto Rico', flag: '🇵🇷' },
  // Other European
  { code: 'LU', dialCode: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'SK', dialCode: '+421', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', dialCode: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'HR', dialCode: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: 'RS', dialCode: '+381', name: 'Serbia', flag: '🇷🇸' },
  { code: 'BG', dialCode: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'LT', dialCode: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LV', dialCode: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: 'EE', dialCode: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: 'CY', dialCode: '+357', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'MT', dialCode: '+356', name: 'Malta', flag: '🇲🇹' },
  { code: 'IS', dialCode: '+354', name: 'Iceland', flag: '🇮🇸' },
  // Central Asia
  { code: 'KZ', dialCode: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'UZ', dialCode: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'AZ', dialCode: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'GE', dialCode: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: 'AM', dialCode: '+374', name: 'Armenia', flag: '🇦🇲' },
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
  const [countryCodeDropdownOpen, setCountryCodeDropdownOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryCodeRef.current && !countryCodeRef.current.contains(event.target as Node)) {
        setCountryCodeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = COUNTRY_CODES.find(cc => cc.dialCode === state.countryCode) || COUNTRY_CODES[0];

  const allRoles: UserRole[] = ['school_student', 'college_student', 'school_educator', 'college_educator', 'recruiter', 'school_admin', 'college_admin', 'university_admin'];

  const getRoleDisplayName = (role: UserRole): string => {
    const names: Record<UserRole, string> = {
      school_student: 'School Student', college_student: 'College Student',
      school_educator: 'School Educator', college_educator: 'College Educator',
      recruiter: 'Recruiter',
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
    if (!state.preferredLanguage) { setState(prev => ({ ...prev, error: 'Please select your preferred language' })); return false; }
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
      const fullName = `${firstName} ${lastName}`.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: state.email.toLowerCase(), password: state.password,
        options: { data: { full_name: fullName, user_role: state.selectedRole, phone: state.phone } }
      });
      
      if (authError) {
        console.error('Auth signup error:', authError);
        // Handle specific error cases
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        if (authError.message.includes('password')) {
          throw new Error('Password must be at least 6 characters long.');
        }
        throw new Error(authError.message);
      }
      
      if (!authData.user) throw new Error('Failed to create user account');

      const userId = authData.user.id;
      
      // Insert into users table
      const { error: userError } = await supabase.from('users').insert({
        id: userId, email: state.email.toLowerCase(), firstName, lastName, role: state.selectedRole, isActive: true,
        metadata: {
          phone: state.phone, fullName, dateOfBirth: state.dateOfBirth, country: state.country,
          state: state.state, city: state.city, preferredLanguage: state.preferredLanguage,
          referralCode: state.referralCode, registrationDate: new Date().toISOString()
        }
      });
      if (userError) {
        console.error('Failed to create user record:', userError);
        throw new Error('Failed to create user profile');
      }

      // Create role-specific record
      if (state.selectedRole === 'school_student' || state.selectedRole === 'college_student') {
        const studentType = state.selectedRole === 'school_student' ? 'school' : 'college';
        const { error: studentError } = await supabase.from('students').insert({ 
          user_id: userId, 
          name: fullName, 
          email: state.email.toLowerCase(), 
          contact_number: state.phone,
          date_of_birth: state.dateOfBirth || null,
          student_type: studentType
        });
        if (studentError) console.error('Failed to create student record:', studentError);
      } else if (state.selectedRole === 'school_educator') {
        // School educators go to school_educators table
        const { error: educatorError } = await supabase.from('school_educators').insert({ 
          user_id: userId, 
          first_name: firstName, 
          last_name: lastName, 
          email: state.email.toLowerCase(), 
          phone_number: state.phone,
          account_status: 'active'
        });
        if (educatorError) console.error('Failed to create school educator record:', educatorError);
      } else if (state.selectedRole === 'college_educator') {
        // College educators go to college_lecturers table
        const { error: educatorError } = await supabase.from('college_lecturers').insert({ 
          user_id: userId,
          userId: userId,
          accountStatus: 'active'
        });
        if (educatorError) console.error('Failed to create college educator record:', educatorError);
      } else if (state.selectedRole === 'recruiter') {
        // Recruiters table - no status column, uses verificationstatus and isactive
        const { error: recruiterError } = await supabase.from('recruiters').insert({ 
          user_id: userId, 
          name: fullName, 
          email: state.email.toLowerCase(), 
          phone: state.phone,
          verificationstatus: 'pending',
          isactive: true
        });
        if (recruiterError) console.error('Failed to create recruiter record:', recruiterError);
      }

      // Map role to entity type for subscription plans
      const entityTypeMap: Record<UserRole, string> = {
        school_student: 'student',
        college_student: 'college-student',
        school_educator: 'educator',
        college_educator: 'college-educator',
        recruiter: 'recruitment-recruiter',
        school_admin: 'school',
        college_admin: 'college',
        university_admin: 'university-admin'
      };
      const entityType = state.selectedRole ? entityTypeMap[state.selectedRole] : 'student';

      // Redirect to subscription plans page to choose a plan
      navigate(`/subscription/plans/${entityType}/purchase`, { 
        state: { 
          message: 'Account created successfully! Please choose a plan to continue.',
          email: state.email,
          userId: userId
        } 
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDE: Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-center p-12 text-white">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        {/* Content Container */}
        <div className="relative z-10 max-w-lg mx-auto space-y-16">
          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Empower Students. Verify Real Skills.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Guide students and verify their skills for better opportunities.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Showcase verified skills</h3>
                <p className="text-slate-400 text-sm">Display your authenticated credentials to stand out.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Share with recruiters worldwide</h3>
                <p className="text-slate-400 text-sm">Connect with employers across the globe instantly.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Track employability score</h3>
                <p className="text-slate-400 text-sm">Monitor and improve your career readiness metrics.</p>
              </div>
            </div>
          </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
                    <input type="text" name="firstName" value={state.firstName} onChange={handleInputChange} placeholder="John" className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={state.email} onChange={handleInputChange} placeholder="john@example.com" className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                  <div className={`flex items-center border rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${state.otpVerified ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    {/* Custom Country Code Dropdown */}
                    <div className="relative" ref={countryCodeRef}>
                      <button
                        type="button"
                        onClick={() => !state.otpVerified && setCountryCodeDropdownOpen(!countryCodeDropdownOpen)}
                        disabled={state.otpVerified}
                        className="flex items-center gap-2 h-full pl-4 pr-3 py-3 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-100 rounded-l-xl transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-gray-700">{selectedCountry.dialCode}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${countryCodeDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {countryCodeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-64 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
                          {COUNTRY_CODES.map(cc => (
                            <button
                              key={cc.code}
                              type="button"
                              onClick={() => {
                                setState(prev => ({ ...prev, countryCode: cc.dialCode }));
                                setCountryCodeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors ${state.countryCode === cc.dialCode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                            >
                              <span className="text-xl">{cc.flag}</span>
                              <span className="flex-1 font-medium">{cc.name}</span>
                              <span className="text-gray-500 text-sm">{cc.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-300"></div>

                    <div className="relative flex-1">
                      <input type="tel" name="phone" value={state.phone} onChange={handleInputChange} placeholder="Phone number" disabled={state.otpVerified} className="block w-full px-3 py-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400" />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={state.showPassword ? 'text' : 'password'} name="password" value={state.password} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none pr-12" placeholder="••••••••" />
                      <button type="button" onClick={() => setState(p => ({ ...p, showPassword: !p.showPassword }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {state.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a... <span className="text-red-500">*</span></label>
                  <select name="selectedRole" value={state.selectedRole || ''} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none">
                    <option value="">Select your role</option>
                    {allRoles.map(role => <option key={role} value={role}>{getRoleDisplayName(role)}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
                    <select name="country" value={state.country} onChange={handleInputChange} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none">
                      <option value="">Select Country</option>
                      {ALL_COUNTRIES.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-red-500">*</span></label>
                    <select name="state" value={state.state} onChange={handleInputChange} disabled={!state.country} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select State</option>
                      {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
                    <select name="city" value={state.city} onChange={handleInputChange} disabled={!state.state} className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Language <span className="text-red-500">*</span></label>
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
                      I agree to the <a href="/terms" target="_blank" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Privacy Policy</a>. <span className="text-red-500">*</span>
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
            Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignup;
