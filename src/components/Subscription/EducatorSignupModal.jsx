import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, Info, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signUpWithRole } from '../../services/authService';
import { createUserRecord, createEducatorProfile, getEducatorByEmail, getSchools, getColleges } from '../../services/educatorAuthService';

// Cache for email checks to avoid repeated queries
const emailCheckCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Helper function to extract entity type from studentType prop
 * @param {string} studentType - The type from URL (e.g., "college-educator", "school-educator", "educator")
 * @returns {'school' | 'college'} - The entity type, defaults to 'school'
 */
const parseEntityType = (studentType) => {
    if (!studentType || typeof studentType !== 'string') {
        return 'school';
    }
    
    const normalized = studentType.toLowerCase().trim();
    
    if (normalized.includes('college')) {
        return 'college';
    }
    
    // Default to 'school' for 'school-educator', 'educator', or any other value
    return 'school';
};

export default function EducatorSignupModal({ isOpen, onClose, selectedPlan, onSignupSuccess, onSwitchToLogin, studentType }) {
    // Derive entity type from studentType prop
    const entityType = parseEntityType(studentType);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        schoolId: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState(false);
    const [existingEducatorInfo, setExistingEducatorInfo] = useState(null);
    const [institutions, setInstitutions] = useState([]);
    const [loadingInstitutions, setLoadingInstitutions] = useState(true);
    const navigate = useNavigate();

    // Fetch institutions (schools or colleges) based on entity type
    useEffect(() => {
        const fetchInstitutions = async () => {
            setLoadingInstitutions(true);
            
            let result;
            if (entityType === 'college') {
                result = await getColleges();
            } else {
                result = await getSchools();
            }
            
            if (result.success) {
                setInstitutions(result.data);
            } else {
                console.error(`Failed to fetch ${entityType}s:`, result.error);
            }
            
            setLoadingInstitutions(false);
        };

        if (isOpen) {
            fetchInstitutions();
        }
    }, [isOpen, entityType]);

    // Check if email already exists in the database
    useEffect(() => {
        const checkEmailExists = async () => {
            const email = formData.email.trim().toLowerCase();

            // Only check if email is valid format
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setEmailExists(false);
                setExistingEducatorInfo(null);
                return;
            }

            // Check cache first
            const cached = emailCheckCache.get(email);
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                setEmailExists(cached.exists);
                setExistingEducatorInfo(cached.info);
                return;
            }

            setCheckingEmail(true);

            try {
                const { exists, data } = await getEducatorByEmail(email);

                const info = exists ? {
                    email: email,
                    name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim() || 'User',
                    hasAuthAccount: true
                } : null;

                // Cache the result
                emailCheckCache.set(email, {
                    exists,
                    info,
                    timestamp: Date.now()
                });

                setEmailExists(exists);
                setExistingEducatorInfo(info);
            } catch (error) {
                console.error('Error checking email:', error);
                setEmailExists(false);
                setExistingEducatorInfo(null);
            } finally {
                setCheckingEmail(false);
            }
        };

        // Debounce for better performance (1 second)
        const timeoutId = setTimeout(() => {
            checkEmailExists();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [formData.email]);

    const validateForm = () => {
        const newErrors = {};

        // First Name validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (formData.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }

        // Last Name validation
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (formData.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        } else if (emailExists) {
            newErrors.email = 'This email is already registered. Please sign in instead.';
        }

        // Phone validation (optional but if provided should be valid)
        if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        // Institution validation - required for both schools and colleges
        // if (!formData.schoolId || formData.schoolId.trim() === '') {
        //     const institutionLabel = entityType === 'college' ? 'college' : 'school';
        //     newErrors.schoolId = `Please select a ${institutionLabel}`;
        // }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm Password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Determine user_role and institution IDs based on entityType
            // Convert empty strings to null to avoid UUID validation errors
            const isCollege = entityType === 'college';
            const selectedInstitutionId = formData.schoolId?.trim() || null;
            const institutionData = {
                user_role: isCollege ? 'college_educator' : 'school_educator',  // Maps to 'role' column in DB
                schoolId: isCollege ? null : selectedInstitutionId,
                collegeId: isCollege ? selectedInstitutionId : null
            };

            // Step 1: Create auth user with role 'educator'
            const authResult = await signUpWithRole(
                formData.email,
                formData.password,
                {
                    role: 'educator',
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    schoolId: institutionData.schoolId,
                    collegeId: institutionData.collegeId
                }
            );

            if (!authResult.success) {
                setErrors({ submit: authResult.error || 'Registration failed. Please try again.' });
                setLoading(false);
                return;
            }

            // Step 2: Create user record in users table (required for foreign key constraint)
            const userRecordResult = await createUserRecord(authResult.user.id, {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                user_role: institutionData.user_role
            });

            if (!userRecordResult.success) {
                setErrors({ submit: 'Account created but user setup failed. Please contact support.' });
                setLoading(false);
                return;
            }

            // Step 3: Create educator profile in school_educators table
            const profileResult = await createEducatorProfile(authResult.user.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                schoolId: institutionData.schoolId,
                collegeId: institutionData.collegeId,
                user_role: institutionData.user_role
            });

            if (!profileResult.success) {
                setErrors({ submit: 'Account created but profile setup failed. Please contact support.' });
                setLoading(false);
                return;
            }

            // Store user data temporarily for payment flow
            const userData = {
                id: authResult.user.id,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                user_role: institutionData.user_role,
                schoolId: institutionData.schoolId,
                collegeId: institutionData.collegeId,
                isNewUser: true
            };

            // Store in localStorage temporarily
            localStorage.setItem('pendingUser', JSON.stringify(userData));

            // Call success callback to proceed to payment
            if (onSignupSuccess) {
                onSignupSuccess(userData);
            }

        } catch (error) {
            console.error('❌ Registration error:', error);
            setErrors({ submit: error.message || 'Registration failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleLoginRedirect = () => {
        if (onSwitchToLogin) {
            onSwitchToLogin();
        } else {
            onClose();
            navigate('/signin/educator');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Create {entityType === 'college' ? 'College' : 'School'} Educator Account
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Sign up to purchase the {selectedPlan?.name} plan
                                </p>
                                {selectedPlan && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">
                                            {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Name Fields - Two columns */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* First Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            First Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="John"
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.firstName ? 'border-red-500' : 'border-gray-300'
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

                                    {/* Last Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Last Name *
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Doe"
                                                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.lastName ? 'border-red-500' : 'border-gray-300'
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

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="your.email@school.edu"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {checkingEmail && (
                                        <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                            Checking email...
                                        </p>
                                    )}
                                    {emailExists && existingEducatorInfo && !checkingEmail && (
                                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-amber-800 font-medium">
                                                        This email is already registered!
                                                    </p>
                                                    <p className="text-xs text-amber-700 mt-1">
                                                        An account exists for <span className="font-semibold">{existingEducatorInfo.name}</span>.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={handleLoginRedirect}
                                                        className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-900 underline"
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

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="10-digit mobile number"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.phone}
                                        </p>
                                    )}
                                </div>

                                {/* Institution Selection */}
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {entityType === 'college' ? 'Select Your College' : 'Select Your School'} {entityType !== 'college' && '*'}
                                        {entityType === 'college' && <span className="text-gray-500 text-xs ml-1">(Optional)</span>}
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            name="schoolId"
                                            value={formData.schoolId}
                                            onChange={handleInputChange}
                                            disabled={loadingInstitutions}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.schoolId ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">
                                                {loadingInstitutions
                                                    ? `Loading ${entityType}s...`
                                                    : `Select your ${entityType}`}
                                            </option>
                                            {institutions.map(institution => (
                                                <option key={institution.id} value={institution.id}>
                                                    {institution.name} - {institution.city}, {institution.state}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.schoolId && (
                                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.schoolId}
                                        </p>
                                    )}
                                </div> */}

                                {/* Password Fields - Two columns */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password *
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Min. 8 characters"
                                                className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
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
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password *
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Re-enter password"
                                                className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                </div>

                                {/* Submit Error */}
                                {errors.submit && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.submit}
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || emailExists || checkingEmail || loadingInstitutions}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating Account...' : emailExists ? 'Email Already Registered' : 'Sign Up & Continue'}
                                </button>

                                {/* Login Link */}
                                <div className="text-center pt-2 pb-2">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={handleLoginRedirect}
                                            className="text-blue-600 hover:text-blue-700 font-semibold underline"
                                        >
                                            Login here
                                        </button>
                                    </p>
                                </div>
                            </form>

                            {/* Bottom padding for scrollability */}
                            <div className="h-4"></div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
