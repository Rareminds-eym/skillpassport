/**
 * Profile Completion Page
 * 
 * Shown to users who signed up via invitation and need to complete their profile.
 * Collects additional information:
 * - Phone number (optional)
 * - Date of birth
 * - Location (Country, State, City)
 * - Preferred language
 */

import { City, Country, State } from 'country-state-city';
import { AlertCircle, ArrowRight, CheckCircle, ChevronDown, Loader2, UserCircle } from 'lucide-react';
import { ChangeEvent, FormEvent, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/shared/model/authStore';
import { supabase } from '@/shared/api';
import { getLogger } from '@/shared/config/logging';
import { DatePicker } from '@/features/subscription';
import { sendOtp, verifyOtp as verifyOtpApi } from '@/features/auth/api/otpService';
import { OtpInput } from '@/shared/ui';

const logger = getLogger('complete-profile');

const ALL_COUNTRIES = Country.getAllCountries();

const COUNTRY_CODES = [
    { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
    { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: 'AE', dialCode: '+971', name: 'UAE', flag: '🇦🇪' },
];

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ar', name: 'العربية (Arabic)' },
];

interface ProfileState {
    phone: string;
    countryCode: string;
    dateOfBirth: string;
    country: string;
    state: string;
    city: string;
    preferredLanguage: string;
    otp: string;
    otpSent: boolean;
    otpVerified: boolean;
    verificationId: string;
    loading: boolean;
    sendingOtp: boolean;
    verifyingOtp: boolean;
    error: string;
}

export default function CompleteProfile() {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);

    const [state, setState] = useState<ProfileState>({
        phone: '',
        countryCode: '+91',
        dateOfBirth: '',
        country: 'IN',
        state: '',
        city: '',
        preferredLanguage: 'en',
        otp: '',
        otpSent: false,
        otpVerified: false,
        verificationId: '',
        loading: false,
        sendingOtp: false,
        verifyingOtp: false,
        error: '',
    });

    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [countryCodeDropdownOpen, setCountryCodeDropdownOpen] = useState(false);
    const countryCodeRef = useRef<HTMLDivElement>(null);
    const verifyingOtpRef = useRef(false);
    const stateRef = useRef(state);
    stateRef.current = state;

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
        const { name, value } = e.target;
        let processedValue: string = value;

        if (name === 'phone') processedValue = value.replace(/\D/g, '').slice(0, 15);
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
            const result = await sendOtp(phone, countryCode);

            if (result.success && result.data?.verificationId) {
                setState(prev => ({
                    ...prev,
                    otpSent: true,
                    sendingOtp: false,
                    verificationId: result.data?.verificationId || ''
                }));
                toast.success('OTP sent successfully');
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
        const otpToVerify = otpValue ?? otp;

        if (!otpToVerify || otpToVerify.length !== 4) {
            setState(prev => ({ ...prev, error: 'Please enter a valid 4 digit OTP' }));
            return;
        }

        if (!verificationId?.trim()) {
            setState(prev => ({ ...prev, error: 'Verification session expired. Please request a new OTP.' }));
            return;
        }

        if (verifyingOtpRef.current) return;
        verifyingOtpRef.current = true;

        setState(prev => ({ ...prev, verifyingOtp: true, error: '' }));

        try {
            const result = await verifyOtpApi({
                phone,
                otp: otpToVerify,
                countryCode,
                verificationId,
            });

            if (result.success) {
                setState(prev => ({ ...prev, otpVerified: true, verifyingOtp: false }));
                toast.success('Phone verified successfully');
            } else {
                setState(prev => ({ ...prev, error: result.error || 'Invalid OTP', verifyingOtp: false }));
            }
        } catch {
            setState(prev => ({
                ...prev,
                error: 'Failed to verify OTP. Please try again.',
                verifyingOtp: false
            }));
        } finally {
            verifyingOtpRef.current = false;
        }
    }, []);

    const validateForm = (): boolean => {
        if (!state.dateOfBirth) {
            setState(prev => ({ ...prev, error: 'Please enter your date of birth' }));
            return false;
        }
        if (!state.country) {
            setState(prev => ({ ...prev, error: 'Please select your country' }));
            return false;
        }
        if (!state.state) {
            setState(prev => ({ ...prev, error: 'Please select your state' }));
            return false;
        }
        if (!state.city) {
            setState(prev => ({ ...prev, error: 'Please select your city' }));
            return false;
        }
        if (!state.preferredLanguage) {
            setState(prev => ({ ...prev, error: 'Please select your preferred language' }));
            return false;
        }
        // Phone is optional, but if provided, must be verified
        if (state.phone && !state.otpVerified) {
            setState(prev => ({ ...prev, error: 'Please verify your phone number' }));
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm() || !user) return;

        setState(prev => ({ ...prev, loading: true, error: '' }));

        try {
            // Update user profile in database
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    phone: state.phone || null,
                    metadata: {
                        dateOfBirth: state.dateOfBirth,
                        country: state.country,
                        state: state.state,
                        city: state.city,
                        preferredLanguage: state.preferredLanguage,
                        profileCompleted: true,
                        profileCompletedAt: new Date().toISOString(),
                    }
                })
                .eq('id', user.id);

            if (updateError) {
                throw new Error(updateError.message);
            }

            toast.success('Profile completed successfully!');

            // Redirect to dashboard based on role
            const dashboardPath = user.role === 'recruiter'
                ? '/recruitment/overview'
                : '/learner/dashboard';

            setTimeout(() => {
                navigate(dashboardPath);
            }, 1000);

        } catch (error) {
            logger.error('Failed to complete profile', error as Error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Failed to update profile'
            }));
        }
    };

    const handleSkip = () => {
        const dashboardPath = user?.role === 'recruiter'
            ? '/recruitment/overview'
            : '/learner/dashboard';
        navigate(dashboardPath);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h1>
                    <p className="text-blue-100">Help us personalize your experience</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {state.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{state.error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone Number (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Mobile Number <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 flex items-center border rounded-xl bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all border-gray-200">
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

                                    <div className="h-6 w-px bg-gray-300"></div>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={state.phone}
                                        onChange={handleInputChange}
                                        placeholder="Phone number"
                                        className="block w-full px-3 py-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                                    />
                                </div>

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

                                {state.otpVerified && (
                                    <div className="px-4 py-3 bg-green-50 text-green-700 font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap border border-green-200">
                                        <CheckCircle className="w-4 h-4" />
                                        Verified
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OTP Input */}
                        {state.otpSent && !state.otpVerified && (
                            <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code (4 digits)</label>
                                <OtpInput
                                    length={4}
                                    value={state.otp}
                                    onChange={(value) => setState(prev => ({ ...prev, otp: value }))}
                                    onComplete={(completedOtp) => handleVerifyOtp(completedOtp)}
                                    disabled={state.verifyingOtp}
                                    autoFocus={true}
                                    error={state.error && state.error.toLowerCase().includes('otp')}
                                />
                            </div>
                        )}

                        {/* Date of Birth */}
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

                        {/* Country and State */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="country"
                                    value={state.country}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none"
                                >
                                    <option value="">Select Country</option>
                                    {ALL_COUNTRIES.map(c => (
                                        <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="state"
                                    value={state.state}
                                    onChange={handleInputChange}
                                    disabled={!state.country}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Select State</option>
                                    {states.map(s => (
                                        <option key={s.isoCode} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* City and Language */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="city"
                                    value={state.city}
                                    onChange={handleInputChange}
                                    disabled={!state.state}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Select City</option>
                                    {cities.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Language <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="preferredLanguage"
                                    value={state.preferredLanguage}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={state.loading}
                                className="px-6 py-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                Skip for Now
                            </button>
                            <button
                                type="submit"
                                disabled={state.loading}
                                className="flex-1 py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {state.loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Complete Profile
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
