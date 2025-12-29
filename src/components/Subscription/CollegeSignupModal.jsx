import { Calendar, Eye, EyeOff, Globe, GraduationCap, Mail, MapPin, Phone, User, X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import userApiService from '../../services/userApiService';

function CollegeSignupModal({ isOpen, onClose, selectedPlan, onSignupSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        collegeName: '',
        collegeCode: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        otp: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        establishedYear: '',
        collegeType: '',
        affiliation: '',
        accreditation: '',
        deanName: '',
        deanEmail: '',
        deanPhone: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Account, 2: College Details, 3: Contact & Dean
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        // Format phone numbers
        if (name === 'phone' || name === 'deanPhone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }
        // Format OTP
        if (name === 'otp') {
            processedValue = value.replace(/\D/g, '').slice(0, 6);
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: processedValue
        }));
        if (error) setError('');
    };

    const handleSendOtp = async () => {
        if (!formData.phone || formData.phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        setSendingOtp(true);
        try {
            const result = await sendOtp(formData.phone);
            if (result.success) {
                setOtpSent(true);
                setError('');
            } else {
                setError(result.error || 'Failed to send OTP');
            }
        } catch {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!formData.otp || formData.otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        setVerifyingOtp(true);
        try {
            const result = await verifyOtpApi(formData.phone, formData.otp);
            if (result.success) {
                setOtpVerified(true);
                setError('');
            } else {
                setError(result.error || 'Invalid OTP');
            }
        } catch {
            setError('Failed to verify OTP. Please try again.');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const validateStep1 = async () => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all required fields');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        // Check if email already exists via API
        setLoading(true);
        try {
            const result = await userApiService.checkEmail(formData.email);
            if (result.exists) {
                setError('An account with this email already exists');
                setLoading(false);
                return false;
            }
        } catch (err) {
            console.error('Email check error:', err);
            // Continue if check fails - server will validate again
        }
        setLoading(false);
        return true;
    };

    const validateStep2 = async () => {
        if (!formData.collegeName || !formData.collegeCode || !formData.establishedYear || !formData.collegeType) {
            setError('Please fill in all required fields');
            return false;
        }

        // Check college code uniqueness via API
        setLoading(true);
        try {
            const result = await userApiService.checkCollegeCode(formData.collegeCode);
            if (!result.isUnique) {
                setError('College code already exists');
                setLoading(false);
                return false;
            }
        } catch (err) {
            console.error('College code check error:', err);
            setError('Error checking college code');
            setLoading(false);
            return false;
        }
        setLoading(false);

        return true;
    };

    const validateStep3 = () => {
        if (!formData.address || !formData.city || !formData.state || !formData.pincode || !formData.deanName) {
            setError('Please fill in all required fields');
            return false;
        }
        return true;
    };

    const handleNext = async () => {
        setError('');
        if (step === 1) {
            const isValid = await validateStep1();
            if (isValid) setStep(2);
        } else if (step === 2) {
            const isValid = await validateStep2();
            if (isValid) setStep(3);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep3()) return;

        setLoading(true);
        setError('');

        try {
            // Call Cloudflare Worker API for college admin signup
            const result = await userApiService.signupCollegeAdmin({
                email: formData.email,
                password: formData.password,
                collegeName: formData.collegeName,
                collegeCode: formData.collegeCode,
                phone: formData.phone,
                website: formData.website,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
                collegeType: formData.collegeType,
                affiliation: formData.affiliation || undefined,
                accreditation: formData.accreditation || undefined,
                deanName: formData.deanName,
                deanEmail: formData.deanEmail || formData.email,
                deanPhone: formData.deanPhone || formData.phone
            });

            if (result.success) {
                console.log('✅ College account created:', result.data);
                
                // Auto-login the user after successful signup
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });
                
                if (signInError) {
                    console.warn('Auto-login failed, user may need to login manually:', signInError);
                    // Still call success - account was created, user can login manually
                }
                
                onSignupSuccess();
            } else {
                throw new Error(result.error || 'Failed to create college account');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message || 'An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="h-6 w-6 text-blue-600" />
                                College Registration
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Progress Steps */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between relative">
                                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className={`flex flex-col items-center bg-white px-2`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {s}
                                        </div>
                                        <span className="text-xs mt-1 font-medium text-gray-600">
                                            {s === 1 ? 'Account' : s === 2 ? 'College' : 'Details'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Account Details */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="admin@college.edu"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: College Basic Details */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <GraduationCap className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="collegeName"
                                                required
                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Excellence College of Engineering"
                                                value={formData.collegeName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">College Code (Unique)</label>
                                            <input
                                                type="text"
                                                name="collegeCode"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="ECE2024"
                                                value={formData.collegeCode}
                                                onChange={handleChange}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Unique identifier for your college</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Calendar className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    name="establishedYear"
                                                    required
                                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="1995"
                                                    value={formData.establishedYear}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">College Type</label>
                                        <select
                                            name="collegeType"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.collegeType}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select College Type</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Medical">Medical</option>
                                            <option value="Arts & Science">Arts & Science</option>
                                            <option value="Management">Management</option>
                                            <option value="Law">Law</option>
                                            <option value="Pharmacy">Pharmacy</option>
                                            <option value="Agriculture">Agriculture</option>
                                            <option value="Architecture">Architecture</option>
                                            <option value="Education">Education</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Affiliation (Optional)</label>
                                            <input
                                                type="text"
                                                name="affiliation"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., UGC, AICTE"
                                                value={formData.affiliation}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Accreditation (Optional)</label>
                                            <input
                                                type="text"
                                                name="accreditation"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g., NAAC A++"
                                                value={formData.accreditation}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Contact & Dean Details */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dean Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="deanName"
                                                    required
                                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Dr. John Doe"
                                                    value={formData.deanName}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">College Phone *</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Phone className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        className={`pl-10 w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${otpVerified ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                                        placeholder="10-digit phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        disabled={otpVerified}
                                                    />
                                                    {otpVerified && (
                                                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                                                    )}
                                                </div>
                                                {!otpVerified && (
                                                    <button
                                                        type="button"
                                                        onClick={handleSendOtp}
                                                        disabled={sendingOtp || formData.phone.length !== 10}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                    >
                                                        {sendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}
                                                    </button>
                                                )}
                                            </div>
                                            {otpVerified && (
                                                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Phone verified
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* OTP Input */}
                                    {otpSent && !otpVerified && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="otp"
                                                    value={formData.otp}
                                                    onChange={handleChange}
                                                    placeholder="Enter 6-digit OTP"
                                                    maxLength={6}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyOtp}
                                                    disabled={verifyingOtp || formData.otp.length !== 6}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {verifyingOtp ? 'Verifying...' : 'Verify'}
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">OTP sent to +91 {formData.phone}. Valid for 5 minutes.</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                                                <MapPin className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <textarea
                                                name="address"
                                                required
                                                rows="2"
                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Street Address"
                                                value={formData.address}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.city}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                            <input
                                                type="text"
                                                name="state"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.state}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                value={formData.pincode}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="url"
                                                    name="website"
                                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="https://college.edu"
                                                    value={formData.website}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-between">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        Next Step
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Creating Account...
                                            </>
                                        ) : (
                                            'Create College Account'
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have a college account?{' '}
                                <button
                                    onClick={onSwitchToLogin}
                                    className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Log in
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CollegeSignupModal;
