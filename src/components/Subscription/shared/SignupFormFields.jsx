import { City, Country, State } from 'country-state-city';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Gift,
  Globe,
  Languages,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DatePicker from './DatePicker';

// Get all countries from the library
const ALL_COUNTRIES = Country.getAllCountries();

// Preferred languages - comprehensive list
const LANGUAGES = [
  { code: 'en', name: 'English' },
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
  { code: 'sa', name: 'संस्कृतम् (Sanskrit)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
];

/**
 * Shared signup form fields component
 * Provides standardized fields across all signup forms
 */
export default function SignupFormFields({
  formData,
  errors,
  onChange,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  checkingEmail = false,
  emailExists = false,
  existingUserInfo = null,
  onLoginRedirect,
  showInstitutionField = false,
  institutionComponent = null,
  otpSent = false,
  otpVerified = false,
  onSendOtp,
  onVerifyOtp,
  sendingOtp = false,
  verifyingOtp = false,
}) {
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  // Load states when country changes
  useEffect(() => {
    if (formData.country) {
      setLoadingStates(true);
      const stateList = State.getStatesOfCountry(formData.country);
      setStates(stateList || []);
      setLoadingStates(false);
    } else {
      setStates([]);
    }
  }, [formData.country]);

  // Load cities when state changes
  useEffect(() => {
    if (formData.state && formData.country) {
      setLoadingCities(true);
      const stateObj = states.find((s) => s.name === formData.state);
      if (stateObj) {
        const cityList = City.getCitiesOfState(formData.country, stateObj.isoCode);
        setCities(cityList || []);
      } else {
        setCities([]);
      }
      setLoadingCities(false);
    } else {
      setCities([]);
    }
  }, [formData.state, formData.country, states]);

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    onChange({
      target: {
        name: 'country',
        value: selectedCountry,
      },
    });
    // Reset state and city when country changes
    onChange({
      target: {
        name: 'state',
        value: '',
      },
    });
    onChange({
      target: {
        name: 'city',
        value: '',
      },
    });
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    onChange({
      target: {
        name: 'state',
        value: selectedState,
      },
    });
    // Reset city when state changes
    onChange({
      target: {
        name: 'city',
        value: '',
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* First Name and Last Name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName || ''}
              onChange={onChange}
              placeholder="First name"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.firstName}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName || ''}
              onChange={onChange}
              placeholder="Last name"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Date of Birth */}
      <DatePicker
        name="dateOfBirth"
        label="Date of Birth"
        required
        value={formData.dateOfBirth || ''}
        onChange={onChange}
        error={errors.dateOfBirth}
        placeholder="Select your date of birth"
        maxDate={new Date().toISOString().split('T')[0]}
      />

      {/* Email Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={onChange}
            placeholder="your.email@example.com"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {checkingEmail && (
          <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Checking email...
          </div>
        )}
        {emailExists && existingUserInfo && !checkingEmail && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                  This email is already registered!
                </p>
                <button
                  type="button"
                  onClick={onLoginRedirect}
                  className="mt-1 text-xs font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  Click here to login instead →
                </button>
              </div>
            </div>
          </div>
        )}
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Mobile Number with OTP */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={onChange}
              placeholder="10-digit mobile number"
              maxLength={10}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {onSendOtp && !otpVerified && (
            <button
              type="button"
              onClick={onSendOtp}
              disabled={sendingOtp || !formData.phone || formData.phone.length !== 10}
              className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          )}
          {otpVerified && (
            <div className="flex items-center px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          )}
        </div>
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* OTP Input (shown after OTP is sent) */}
      {otpSent && !otpVerified && onVerifyOtp && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enter OTP <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="otp"
              value={formData.otp || ''}
              onChange={onChange}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.otp ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={onVerifyOtp}
              disabled={verifyingOtp || !formData.otp || formData.otp.length !== 6}
              className="px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifyingOtp ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {errors.otp && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.otp}
            </p>
          )}
        </div>
      )}

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password || ''}
            onChange={onChange}
            placeholder="Min. 8 characters"
            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.password}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">Must contain uppercase, lowercase, and number</p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword || ''}
            onChange={onChange}
            placeholder="Re-enter your password"
            className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={onToggleConfirmPassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            name="country"
            value={formData.country || 'IN'}
            onChange={handleCountryChange}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white ${
              errors.country ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Country</option>
            {ALL_COUNTRIES.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        {errors.country && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.country}
          </p>
        )}
      </div>

      {/* State / Province */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          State / Province <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            name="state"
            value={formData.state || ''}
            onChange={handleStateChange}
            disabled={!formData.country || loadingStates}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white disabled:bg-gray-100 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">
              {loadingStates
                ? 'Loading...'
                : !formData.country
                  ? 'Select country first'
                  : 'Select State / Province'}
            </option>
            {states.map((state) => (
              <option key={state.isoCode} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        {errors.state && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.state}
          </p>
        )}
      </div>

      {/* City / District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City / District <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            name="city"
            value={formData.city || ''}
            onChange={onChange}
            disabled={!formData.state || loadingCities}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white disabled:bg-gray-100 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">
              {loadingCities
                ? 'Loading cities...'
                : !formData.state
                  ? 'Select state first'
                  : 'Select City / District'}
            </option>
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        {errors.city && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.city}
          </p>
        )}
      </div>

      {/* Preferred Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
        <div className="relative">
          <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            name="preferredLanguage"
            value={formData.preferredLanguage || 'en'}
            onChange={onChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Referral Code / Partner ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Referral Code / Partner ID
        </label>
        <div className="relative">
          <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="referralCode"
            value={formData.referralCode || ''}
            onChange={onChange}
            placeholder="Enter referral code (optional)"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Have a referral code? Enter it here for special benefits
        </p>
      </div>

      {/* Institution Field (if provided) */}
      {showInstitutionField && institutionComponent}

      {/* Terms & Privacy Policy */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms || false}
            onChange={onChange}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            <span className="text-red-500"> *</span>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1 ml-7">
            <AlertCircle className="w-3 h-3" />
            {errors.agreeToTerms}
          </p>
        )}
      </div>
    </div>
  );
}

// Export constants for use in other components
export { ALL_COUNTRIES, LANGUAGES };
