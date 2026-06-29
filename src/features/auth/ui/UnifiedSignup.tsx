import { City, Country, State } from 'country-state-city';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye, EyeOff,
  Globe,
  Loader2,
  Share2,
  TrendingUp
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
// @ts-ignore - JS module without types
import {
  formatRegistrationDate,
  FULL_REGISTRATION_START_DATE,
  getTimeUntilFullRegOpens,
  isFullRegistrationOpen
} from '@/shared/config/registrationConfig';
// Import OTP functions directly from otpService (not from index which has stubs)
import { sendOtp, verifyOtp as verifyOtpApi } from '@/features/auth/api/otpService';
// @ts-ignore - JS module without types
import { DatePicker } from '@/features/subscription';
import { ssoClient } from '@/shared/api/ssoClient';
import { PASSWORD_MIN } from '@/shared/constants';
import { isLocalhost } from '@/shared/lib';
import { trackSignup } from '@/shared/lib/analytics';
import { useAuthStore } from '@/shared/model/authStore';
import { OtpInput } from '@/shared/ui';
import { AuthFetchError } from '@rareminds-eym/auth-client';
// `UserRole` is canonically defined ONCE in the generated module (task 6.2).
import type { UserRole } from '@/shared/types/generated/roles';

/**
 * UI-ONLY redirect label — NOT a canonical SSO `UserRole`.
 *
 * `recruitment_admin` is never sent to the SSO backend and is NEVER used in any
 * authorization / role check. Selecting it in the signup dropdown simply means
 * "I want to create a company": `handleSubmit` redirects to `/signup/company`
 * and returns early before any SSO signup call (see the early `return` below).
 *
 * It is deliberately kept OUT of the canonical `UserRole` so the phantom role is
 * never reintroduced into the authorization type (RBAC migration §2.4 / §6.4).
 */
const RECRUITMENT_ADMIN_REDIRECT = 'recruitment_admin' as const;

/**
 * The set of options the signup dropdown can offer: a curated subset of real
 * SSO `UserRole`s plus the UI-only `recruitment_admin` redirect label above.
 * This is a UI concern, distinct from the canonical `UserRole`.
 */
type SignupRoleOption = UserRole | typeof RECRUITMENT_ADMIN_REDIRECT;

/**
 * The concrete, ordered list of roles offered by the signup dropdown.
 * `satisfies readonly SignupRoleOption[]` validates every real role against the
 * canonical `UserRole` (typo-safe) while permitting the `recruitment_admin`
 * redirect label. `OfferedSignupRole` is the exact union of these options, so
 * the display-name and entity-type maps below stay exhaustive (no missing keys)
 * without covering all 16 SSO roles.
 */
// NOTE: Educators (school_educator / college_educator) are intentionally NOT
// offered here. Institutions onboard educators via the admin "Teacher/Educator
// onboarding" (seat-based) flow, not the public self-signup. Their roles still
// exist for login and admin-created accounts.
const SIGNUP_ROLE_OPTIONS = [
  'learner',
  'recruiter',
  RECRUITMENT_ADMIN_REDIRECT,
  'school_admin',
  'college_admin',
  'university_admin',
] as const satisfies readonly SignupRoleOption[];

type OfferedSignupRole = (typeof SIGNUP_ROLE_OPTIONS)[number];

interface SignupState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  selectedRole: OfferedSignupRole | null;
  country: string;
  state: string;
  city: string;
  preferredLanguage: string;
  referralCode: string;
  agreeToTerms: boolean;
  otp: string;
  otpSent: boolean;
  otpVerified: boolean;
  verificationId: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  loading: boolean;
  sendingOtp: boolean;
  verifyingOtp: boolean;
  error: string;
  roleDropdownOpen: boolean;
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check if running on localhost using utility function
  const isDevEnvironment = isLocalhost();

  // Get plan context from location.state (if user selected a plan before signing up)
  const planFromState = (location.state as any)?.plan;
  const learnerTypeFromState = (location.state as any)?.learnerType || (location.state as any)?.studentType;
  const returnToFromState = (location.state as any)?.returnTo;

  // Get return URL from query params or session storage (for invitation flow)
  const returnUrl = searchParams.get('returnUrl') || sessionStorage.getItem('invitation_return_url');
  const invitationEmail = searchParams.get('email') || sessionStorage.getItem('invitation_email');
  const invitationToken = sessionStorage.getItem('invitation_token');

  const [state, setState] = useState<SignupState>({
    firstName: '', lastName: '', dateOfBirth: '', email: invitationEmail || '', phone: '', countryCode: '+91',
    password: '', confirmPassword: '', selectedRole: null,
    country: 'IN', state: '', city: '', preferredLanguage: 'en', referralCode: '',
    agreeToTerms: false, otp: '', otpSent: false, otpVerified: false, verificationId: '',
    showPassword: false, showConfirmPassword: false,
    loading: false, sendingOtp: false, verifyingOtp: false, error: '', roleDropdownOpen: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [countryCodeDropdownOpen, setCountryCodeDropdownOpen] = useState(false);
  const countryCodeRef = useRef<HTMLDivElement>(null);
  const verifyingOtpRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  // Guard: signup_start fires only once per signup attempt
  const hasStartedFormRef = useRef(false);

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

  // Clear persisted auth state when starting invitation signup
  // This prevents old user email from localStorage interfering with invitation email
  useEffect(() => {
    if (invitationToken && invitationEmail) {
      console.log('[UnifiedSignup] Invitation detected, clearing persisted auth state');
      console.log('[UnifiedSignup] Invitation email:', invitationEmail);

      // Clear the Zustand persisted state
      localStorage.removeItem('skillpassport-auth-v1');

      // Ensure the email state matches the invitation email
      setState(prev => {
        if (prev.email !== invitationEmail) {
          console.log('[UnifiedSignup] Correcting email from', prev.email, 'to', invitationEmail);
          return { ...prev, email: invitationEmail };
        }
        return prev;
      });
    }
  }, [invitationToken, invitationEmail]);

  const selectedCountry = COUNTRY_CODES.find(cc => cc.dialCode === state.countryCode) || COUNTRY_CODES[0];

  // `allRoles` is the curated set of options the signup dropdown offers
  // (SIGNUP_ROLE_OPTIONS above, which excludes educators — onboarded via the
  // admin flow). 'recruitment_admin' is the UI-only redirect label (NOT an SSO
  // role): it redirects to the company signup page (see handleSubmit early-return).
  // 'recruiter' is for invitation-based signups (no company creation).
  const allRoles = SIGNUP_ROLE_OPTIONS;

  const getRoleDisplayName = (role: OfferedSignupRole): string => {
    const names: Record<OfferedSignupRole, string> = {
      learner: 'Learner',
      recruiter: 'Recruiter (I have an invitation)',
      recruitment_admin: 'Recruitment Admin',
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

    // Fire signup_start once on first meaningful form interaction
    if (!hasStartedFormRef.current && (name === 'firstName' || name === 'lastName' || name === 'email')) {
      hasStartedFormRef.current = true;
      trackSignup.start(state.selectedRole || undefined);
    }

    if (type === 'checkbox') processedValue = (e.target as HTMLInputElement).checked;
    if (name === 'phone') processedValue = value.replace(/\D/g, '').slice(0, 15);
    // OTP length is 4 digits - verified with backend MessageCentral service
    // Backend accepts 4-8 digits (MessageCentralService.ts:35-37), provider sends 4 digits
    if (name === 'otp') processedValue = value.replace(/\D/g, '').slice(0, 4);

    setState(prev => ({ ...prev, [name]: processedValue, error: '' }));
  };

  const handleSendOtp = useCallback(async () => {
    const { phone, countryCode } = stateRef.current;

    if (!phone || phone.length < 7 || phone.length > 15) {
      setState(prev => ({ ...prev, error: 'Please enter a valid phone number (7-15 digits)' }));
      return;
    }

    setState(prev => ({ ...prev, sendingOtp: true, error: '' }));

    try {
      // VERIFIED: countryCode parameter is supported throughout the stack
      // - otpService.ts:175 - sendOtp(phone, countryCode = '+91')
      // - functions/api/otp/handlers/send.ts:62 - accepts countryCode
      // - email-worker client:7 - SendOtpRequest includes countryCode
      // - MessageCentralService.ts:197 - sendOTP(mobileNumber, countryCode)
      const result = await sendOtp(phone, countryCode);

      if (result.success && result.data?.verificationId) {
        setState(prev => ({
          ...prev,
          otpSent: true,
          sendingOtp: false,
          verificationId: result.data?.verificationId || ''
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to send OTP',
          sendingOtp: false
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Failed to send OTP. Please try again.',
        sendingOtp: false
      }));
    }
  }, []);

  const handleVerifyOtp = useCallback(async (otpValue?: string) => {
    const { otp, verificationId, phone, countryCode } = stateRef.current;

    // Use the passed OTP value if provided (from auto-verification), otherwise use state
    // ?? not || to handle '0' correctly; otpValue from onComplete is always authoritative
    const otpToVerify = otpValue ?? otp;

    // VERIFIED: Backend accepts 4-digit OTPs via MessageCentral service
    // - otpService.ts:13 - OTP_DIGIT_LENGTH = 4
    // - MessageCentralService.ts:35-37 - MIN_LENGTH: 4, MAX_LENGTH: 8
    // - MessageCentral provider sends 4-digit OTPs
    if (!otpToVerify || otpToVerify.length !== 4) {
      setState(prev => ({ ...prev, error: 'Please enter a valid 4 digit OTP' }));
      return;
    }

    if (!verificationId?.trim()) {
      setState(prev => ({ ...prev, error: 'Verification session expired. Please request a new OTP.' }));
      return;
    }

    // Prevent duplicate verification calls using ref (not state)
    if (verifyingOtpRef.current) {
      return;
    }

    // Set ref immediately to prevent race condition
    verifyingOtpRef.current = true;

    // VERIFIED: All 4 parameters (phone, otp, countryCode, verificationId) are supported
    // - otpService.ts:217 - VerifyOtpOptions interface with all 4 params
    // - functions/api/otp/handlers/verify.ts:16-20 - VerifyOtpBody accepts all 4
    // - email-worker client:20-24 - VerifyOtpRequest includes all 4
    // - MessageCentralService.ts:265-268 - verifyOTP(mobileNumber, verificationId, code, countryCode)
    setState(prev => ({ ...prev, verifyingOtp: true, error: '' }));

    try {
      const result = await verifyOtpApi({
        phone,
        otp: otpToVerify,
        countryCode,
        verificationId,
      });

      if (result.success) setState(prev => ({ ...prev, otpVerified: true, verifyingOtp: false }));
      else setState(prev => ({ ...prev, error: result.error || 'Invalid OTP', verifyingOtp: false }));
    } catch {
      setState(prev => ({
        ...prev,
        error: 'Failed to verify OTP. Please try again.',
        verifyingOtp: false
      }));
    } finally {
      // Always reset ref in finally block
      verifyingOtpRef.current = false;
    }
  }, []);

  // Validate Step 1 fields
  const validateStep1 = (): boolean => {
    if (!state.firstName.trim()) { setState(prev => ({ ...prev, error: 'Please enter your first name' })); return false; }
    if (!state.lastName.trim()) { setState(prev => ({ ...prev, error: 'Please enter your last name' })); return false; }
    if (!state.dateOfBirth) { setState(prev => ({ ...prev, error: 'Please enter your date of birth' })); return false; }
    if (!state.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) { setState(prev => ({ ...prev, error: 'Please enter a valid email' })); return false; }

    // Phone number validation based on environment
    if (!isDevEnvironment) {
      // Production: Phone number is required
      if (!state.phone) { setState(prev => ({ ...prev, error: 'Please enter your mobile number' })); return false; }
      if (state.phone.length < 7 || state.phone.length > 15) { setState(prev => ({ ...prev, error: 'Please enter a valid phone number (7-15 digits)' })); return false; }
      if (!state.otpVerified) { setState(prev => ({ ...prev, error: 'Please verify your phone number' })); return false; }
    } else {
      // Localhost: Phone number is optional, but if provided, must be verified
      if (state.phone && (state.phone.length < 7 || state.phone.length > 15)) { setState(prev => ({ ...prev, error: 'Please enter a valid phone number (7-15 digits)' })); return false; }
      if (state.phone && !state.otpVerified) { setState(prev => ({ ...prev, error: 'Please verify your phone number' })); return false; }
    }

    if (!state.password || state.password.length < PASSWORD_MIN) { setState(prev => ({ ...prev, error: `Password must be at least ${PASSWORD_MIN} characters` })); return false; }
    const typesCount = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(state.password!)).length;
    if (typesCount < 3) { setState(prev => ({ ...prev, error: 'Password must contain at least 3 of: uppercase letters, lowercase letters, numbers, special characters' })); return false; }
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

    console.log('=== SIGNUP FORM SUBMITTED ===');
    console.log('[UnifiedSignup] Checking invitation token at form submit');
    console.log('[UnifiedSignup] invitationToken constant:', invitationToken);
    console.log('[UnifiedSignup] invitationToken from sessionStorage (fresh):', sessionStorage.getItem('invitation_token'));
    console.log('[UnifiedSignup] invitationEmail:', invitationEmail);
    console.log('[UnifiedSignup] returnUrl:', returnUrl);
    console.log('[UnifiedSignup] selectedRole:', state.selectedRole);

    // CRITICAL: Force email to match invitation email if invitation token exists
    // This prevents using a stale email from a previous session
    const emailToUse = invitationToken ? (invitationEmail || state.email) : state.email;
    console.log('[UnifiedSignup] Email being used for signup:', emailToUse);
    console.log('[UnifiedSignup] state.email value:', state.email);

    if (invitationToken && emailToUse !== invitationEmail) {
      console.error('[UnifiedSignup] ❌ EMAIL MISMATCH DETECTED!');
      console.error('[UnifiedSignup] Expected (invitation):', invitationEmail);
      console.error('[UnifiedSignup] Got (state.email):', state.email);
      console.error('[UnifiedSignup] Using invitation email:', emailToUse);
    }

    // If user selected the UI-only Recruitment Admin label, redirect to company
    // signup with their details. NOTE: `recruitment_admin` is never sent to the
    // SSO backend and is not a real role — this branch returns early so every
    // value passed to the backend below is a genuine SSO `UserRole`.
    if (state.selectedRole === 'recruitment_admin') {
      navigate('/signup/company', {
        state: {
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
          phone: state.phone,
          countryCode: state.countryCode,
          password: state.password,
          country: state.country,
          state: state.state,
          city: state.city,
          preferredLanguage: state.preferredLanguage,
          dateOfBirth: state.dateOfBirth,
        }
      });
      return;
    }

    // Track signup_submit — form is valid, API call is about to start
    trackSignup.submit(
      state.selectedRole || undefined,
      ALL_COUNTRIES.find(c => c.isoCode === state.country)?.name
    );

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const isAdminRole = ['school_admin', 'college_admin', 'university_admin'].includes(state.selectedRole!);

      // Step 1: Create SSO user
      let ssoUserId: string;

      if (isAdminRole) {
        // Admin signup creates user + org
        const orgName = `${state.firstName} ${state.lastName}'s Institution`;
        const ssoResult = await ssoClient.signup({
          email: emailToUse,
          password: state.password,
          org_name: orgName,
          role: state.selectedRole!,
          redirect_url: window.location.origin,
          user_metadata: {
            firstName: state.firstName.trim(),
            lastName: state.lastName.trim(),
            phone: state.phone.trim() || null,
            avatarUrl: null,
          },
        });
        ssoUserId = ssoResult.user.id;
        if (ssoResult.email_sent === false) {
          sessionStorage.setItem('email_sent_failed', 'true');
        }
      } else {
        // Member signup (learner, educator, recruiter) — no org creation
        const ssoResult = await ssoClient.signupMember({
          email: emailToUse, // Use the forced email, not state.email
          password: state.password,
          role: state.selectedRole!,
          redirect_url: window.location.origin,
          user_metadata: {
            firstName: state.firstName.trim(),
            lastName: state.lastName.trim(),
            phone: state.phone.trim() || null,
            avatarUrl: null,
          },
        });
        ssoUserId = ssoResult.user.id;
        if (ssoResult.email_sent === false) {
          sessionStorage.setItem('email_sent_failed', 'true');
        }
      }

      // Update auth store with the new user
      const me = await ssoClient.getMe();
      useAuthStore.setState({
        user: {
          id: me.sub,
          email: me.email,
          role: state.selectedRole ?? undefined,
          orgId: me.org_id,
          roles: me.roles,
          products: me.products,
          membershipStatus: me.membership_status,
          isEmailVerified: me.is_email_verified,
          isDemoMode: false,
        },
        isAuthenticated: true,
        role: state.selectedRole,
      });

      // Step 2: Create app profile via Pages Function
      const { getApiUrl } = await import('@/shared/api/apiUtils');
      const USER_API_URL = getApiUrl('user');

      const response = await ssoClient.fetch(`${USER_API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ssoUserId,
          email: emailToUse, // Use the forced email, not state.email
          firstName: state.firstName,
          lastName: state.lastName,
          phone: state.phone || undefined,
          role: state.selectedRole,
          dateOfBirth: state.dateOfBirth || undefined,
          country: state.country || undefined,
          state: state.state || undefined,
          city: state.city || undefined,
          preferredLanguage: state.preferredLanguage || undefined,
          referralCode: state.referralCode || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error((result as any).error || 'Failed to create profile');
      }

      // Step 3: Redirect based on role
      const entityTypeMap: Record<OfferedSignupRole, string> = {
        learner: 'learner',
        recruiter: 'recruitment-recruiter',
        recruitment_admin: 'recruitment-recruiter',
        school_admin: 'school',
        college_admin: 'college',
        university_admin: 'university-admin'
      };
      const entityType = state.selectedRole ? entityTypeMap[state.selectedRole] : 'learner';

      // Track signup_success — profile created, about to redirect
      trackSignup.success(ssoUserId, state.email, state.selectedRole || 'unknown');

      console.log('=== INVITATION AUTO-ACCEPTANCE DEBUG ===');
      console.log('[UnifiedSignup] Signup successful, checking for invitation token');

      // IMPORTANT: Read fresh from sessionStorage, not the stale constant
      const freshInvitationToken = sessionStorage.getItem('invitation_token');
      console.log('[UnifiedSignup] invitationToken (constant from mount):', invitationToken);
      console.log('[UnifiedSignup] invitationToken (fresh from sessionStorage):', freshInvitationToken);
      console.log('[UnifiedSignup] ssoUserId:', ssoUserId);
      console.log('[UnifiedSignup] selectedRole:', state.selectedRole);
      console.log('[UnifiedSignup] user email:', state.email);
      console.log('[UnifiedSignup] Current origin:', window.location.origin);

      // Check for invitation token and auto-accept if present
      // This is important for recruiter signups via invitation
      if (freshInvitationToken) {
        console.log('[UnifiedSignup] ✓ Invitation token found, attempting auto-accept');
        console.log('[UnifiedSignup] Request payload:', {
          token: freshInvitationToken,
        });

        try {
          // Auto-accept the invitation
          // IMPORTANT: Use relative URL to ensure it goes to the Pages Functions server, not SSO-Worker
          const apiUrl = '/api/recruitment/invitations/accept';
          console.log('[UnifiedSignup] Making POST request to:', apiUrl);
          console.log('[UnifiedSignup] Full URL will be:', `${window.location.origin}${apiUrl}`);

          const invitationResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: freshInvitationToken,
            }),
          });

          console.log('[UnifiedSignup] Invitation API response status:', invitationResponse.status);
          console.log('[UnifiedSignup] Invitation API response ok:', invitationResponse.ok);

          if (invitationResponse.ok) {
            const invitationResult = await invitationResponse.json();
            console.log('[UnifiedSignup] ✓ Invitation accepted successfully:', invitationResult);

            // CRITICAL FIX: After accepting invitation, force logout and redirect to login
            // This is necessary because:
            // 1. The invitation acceptance created a membership in SSO database
            // 2. But the current JWT doesn't include this membership yet
            // 3. User needs to login again to get a fresh JWT with the new role/membership
            console.log('[UnifiedSignup] Step: Force logout to clear stale JWT');

            // Store invitation context for post-login verification flow
            sessionStorage.setItem('post_signup_verification_redirect', '/recruitment/overview');
            sessionStorage.setItem('invitation_just_accepted', 'true');
            sessionStorage.setItem('invitation_org_id', invitationResult.organizationId);
            sessionStorage.setItem('invitation_role', invitationResult.role);

            console.log('[UnifiedSignup] ✓ Stored post-verification context');
            console.log('[UnifiedSignup] ✓ Clearing invitation tokens (no longer needed)');
            sessionStorage.removeItem('invitation_token');
            sessionStorage.removeItem('invitation_email');
            sessionStorage.removeItem('invitation_return_url');

            // Logout to clear the current JWT and reset auth state
            await useAuthStore.getState().logout();
            console.log('[UnifiedSignup] ✓ Logged out successfully');

            // Redirect to verify-email page
            // User will verify email, then get redirected based on stored context
            console.log('[UnifiedSignup] ✓ Redirecting to verify-email page');
            console.log('=== INVITATION AUTO-ACCEPTANCE SUCCESS - AWAITING EMAIL VERIFICATION ===');
            navigate('/verify-email', { replace: true });
            return; // Exit early, don't continue with normal flow
          } else {
            // If invitation acceptance fails, show error
            const errorData = await invitationResponse.json();
            console.error('[UnifiedSignup] ✗ Invitation API returned error:', errorData);
            console.error('[UnifiedSignup] Response status:', invitationResponse.status);
            console.error('[UnifiedSignup] Response statusText:', invitationResponse.statusText);
            throw new Error(errorData.error || 'Failed to accept invitation');
          }
        } catch (invitationError) {
          console.error('=== INVITATION AUTO-ACCEPTANCE FAILED ===');
          console.error('[UnifiedSignup] ✗ Exception during auto-accept:', invitationError);
          console.error('[UnifiedSignup] Error type:', invitationError instanceof Error ? 'Error' : typeof invitationError);
          console.error('[UnifiedSignup] Error message:', invitationError instanceof Error ? invitationError.message : String(invitationError));
          console.error('[UnifiedSignup] Error stack:', invitationError instanceof Error ? invitationError.stack : 'N/A');

          // Show error to user instead of continuing
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to accept invitation. Please try logging in to accept the invitation.'
          }));
          return;
        }
      } else {
        console.log('[UnifiedSignup] ✗ No invitation token found in sessionStorage');
        console.log('[UnifiedSignup] Continuing with normal signup flow');
        console.log('=== INVITATION AUTO-ACCEPTANCE SKIPPED ===');
      }

      // Check for return URL (invitation flow) - redirect there instead of subscription plans
      if (returnUrl) {
        // Clear the stored return URL
        sessionStorage.removeItem('invitation_return_url');
        navigate(returnUrl);
      } else if (returnToFromState === '/subscription/payment' && planFromState) {
        // User selected a plan before signing up - go directly to payment
        if (import.meta.env.DEV) console.log('[UnifiedSignup] User had pre-selected plan, redirecting to payment page');
        navigate('/subscription/payment', {
          state: {
            plan: planFromState,
            learnerType: learnerTypeFromState || entityType,
            isUpgrade: false
          }
        });
      } else {
        // Redirect to subscription plans page to choose a plan
        navigate(`/subscription/plans/${entityType}/purchase`, {
          state: {
            message: 'Account created successfully! Please choose a plan to continue.',
            email: state.email,
            userId: ssoUserId
          }
        });
      }
    } catch (error: unknown) {
      let errorMessage = 'An error occurred during signup';
      if (error instanceof AuthFetchError) {
        if (error.status === 409) errorMessage = 'An account with this email already exists';
        else if (error.status === 429) errorMessage = 'Too many attempts. Please try again later.';
        else errorMessage = error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Rollback: If SSO user was created but app profile failed,
      // delete the SSO account entirely so the user can retry cleanly.
      if (ssoClient.isAuthenticated()) {
        try {
          // Delete the SSO user (cascades to sessions, memberships, etc.)
          await ssoClient.fetch(`${import.meta.env.VITE_SSO_URL}/auth/delete-account`, {
            method: 'POST',
          });
        } catch {
          // If delete fails, still clear auth state
        }
        await useAuthStore.getState().logout();
      }

      // Track signup_failed — error message and role captured for GTM
      trackSignup.failed(errorMessage, state.selectedRole || undefined);

      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };
  const [countdown, setCountdown] = useState(getTimeUntilFullRegOpens());

  // Update countdown every second
  useEffect(() => {
    if (isFullRegistrationOpen()) return; // Don't run timer if already open

    const timer = setInterval(() => {
      const newCountdown = getTimeUntilFullRegOpens();
      setCountdown(newCountdown);
      if (newCountdown.open) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Registration Not Yet Open View - Show before Feb 9, 2026
  if (!isFullRegistrationOpen()) {
    return (
      <div className="flex min-h-screen bg-white">
        {/* LEFT SIDE: Branding */}
        <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-center p-12 text-white">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

          <div className="relative z-10 max-w-lg mx-auto space-y-16">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Empower Learners. Verify Real Skills.
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Guide learners and verify their skills for better opportunities.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Showcase verified skills</h3>
                  <p className="text-slate-400 text-sm">Display your authenticated credentials to stand out.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Share with recruiters worldwide</h3>
                  <p className="text-slate-400 text-sm">Connect with employers across the globe instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
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

        {/* RIGHT SIDE: Coming Soon Message */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24 py-12">
          <div className="w-full max-w-lg space-y-8 text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Clock className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Registration Opens Soon</h2>
              <p className="text-gray-500">
                Full registration will be available on {formatRegistrationDate(FULL_REGISTRATION_START_DATE)}
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="grid grid-cols-4 gap-4 py-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-3xl font-bold text-blue-600">{countdown.days}</p>
                <p className="text-sm text-gray-500 mt-1">Days</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-3xl font-bold text-blue-600">{countdown.hours}</p>
                <p className="text-sm text-gray-500 mt-1">Hours</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-3xl font-bold text-blue-600">{countdown.minutes}</p>
                <p className="text-sm text-gray-500 mt-1">Minutes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-3xl font-bold text-blue-600">{countdown.seconds}</p>
                <p className="text-sm text-gray-500 mt-1">Seconds</p>
              </div>
            </div>

            {/* Pre-registration CTA */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <p className="text-gray-700 font-medium mb-3">
                Want early access?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Pre-register now to secure your spot and get notified when full registration opens!
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                Pre-Register Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Login Link */}
            <p className="text-sm text-gray-600">
              Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              Empower Learners. Verify Real Skills.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Guide learners and verify their skills for better opportunities.
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                    {invitationEmail && <span className="text-xs text-blue-600 ml-2">(From invitation)</span>}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={state.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    readOnly={!!invitationEmail}
                    disabled={!!invitationEmail}
                    autoComplete={invitationEmail ? "off" : "email"}
                    data-lpignore="true"
                    data-form-type="other"
                    className={`block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${invitationEmail ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'
                      }`}
                  />
                  {invitationEmail && (
                    <p className="text-xs text-gray-500 mt-1">
                      This email is locked because you're accepting an invitation
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mobile Number
                    {isDevEnvironment && <span className="text-gray-400 text-xs">(Optional)</span>}
                    {!isDevEnvironment && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center border rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all border-gray-200">
                      {/* Custom Country Code Dropdown */}
                      <div className="relative" ref={countryCodeRef}>
                        <button
                          type="button"
                          onClick={() => setCountryCodeDropdownOpen(!countryCodeDropdownOpen)}
                          className="flex items-center gap-2 h-full pl-4 pr-3 py-3 bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer hover:bg-gray-100 rounded-l-xl transition-colors"
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
                        <input type="tel" name="phone" value={state.phone} onChange={handleInputChange} placeholder="Phone number" className="block w-full px-3 py-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400" />
                      </div>
                    </div>

                    {/* Verify Button - Shows when phone is entered and not verified */}
                    {!state.otpVerified && state.phone.length >= 7 && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={state.sendingOtp}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
                      >
                        {state.sendingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : state.otpSent ? (
                          'Resend'
                        ) : (
                          'Verify'
                        )}
                      </button>
                    )}

                    {/* Verified Badge */}
                    {state.otpVerified && (
                      <div className="px-4 py-3 bg-green-50 text-green-700 font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>

                {/* Show OTP input */}
                {state.otpSent && !state.otpVerified && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code (4 digits)</label>
                    {/* Reusable OTP Input Component */}
                    <OtpInput
                      length={4}
                      value={state.otp}
                      onChange={(value) => setState(prev => ({ ...prev, otp: value }))}
                      onComplete={(completedOtp) => {
                        handleVerifyOtp(completedOtp);
                      }}
                      disabled={state.verifyingOtp}
                      autoFocus={true}
                      error={state.error && state.error.toLowerCase().includes('otp')}
                    />

                    {/* Verify Button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleVerifyOtp()}
                        disabled={state.verifyingOtp || state.otp.length !== 4}
                        className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        {state.verifyingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify'
                        )}
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
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, roleDropdownOpen: !prev.roleDropdownOpen }))}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 hover:bg-white transition-all outline-none text-left flex items-center justify-between"
                    >
                      <span className={state.selectedRole ? 'text-gray-900' : 'text-gray-400'}>
                        {state.selectedRole ? getRoleDisplayName(state.selectedRole) : 'Select your role'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${state.roleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {state.roleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 max-h-80 overflow-y-auto">
                        {allRoles.map(role => {
                          const isAvailable = true; // All roles are now available
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                if (isAvailable) {
                                  setState(prev => ({
                                    ...prev,
                                    selectedRole: role,
                                    roleDropdownOpen: false,
                                    error: ''
                                  }));
                                }
                              }}
                              disabled={!isAvailable}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isAvailable
                                ? 'hover:bg-blue-50 cursor-pointer text-gray-900'
                                : 'cursor-not-allowed text-gray-400 bg-gray-50'
                                } ${state.selectedRole === role ? 'bg-blue-50 text-blue-700' : ''}`}
                            >
                              <span className="font-medium">{getRoleDisplayName(role)}</span>
                              {!isAvailable && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-200 text-gray-600">
                                  Coming Soon
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                    {state.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>{state.selectedRole === 'recruitment_admin' ? 'Create Company Account' : 'Create Account'}</span>
                    )}
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
