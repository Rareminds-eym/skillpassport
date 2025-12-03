import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Building, MapPin, Phone, Mail, Calendar, User, ChevronDown, AlertCircle } from 'lucide-react';
import { signUpWithRole } from '../../services/authService';
import { createUserRecord } from '../../services/educatorAuthService';
import { getUniversities, checkUniversityCollegeCode, createUniversityCollege } from '../../services/universityService';

function UniversityAdminSignupModal({ isOpen, onClose, selectedPlan, onSignupSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        // Step 1: Select University & Account
        universityId: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Step 2: College Details
        collegeName: '',
        collegeCode: '',
        establishedYear: '',
        // Step 3: Dean & Contact
        deanName: '',
        deanEmail: '',
        deanPhone: ''
    });

    const [universities, setUniversities] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingUniversities, setLoadingUniversities] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    // Fetch universities on mount
    useEffect(() => {
        if (isOpen) {
            fetchUniversities();
        }
    }, [isOpen]);

    const fetchUniversities = async () => {
        setLoadingUniversities(true);
        const result = await getUniversities();
        if (result.success) {
            setUniversities(result.data);
        } else {
            setError('Failed to load universities');
        }
        setLoadingUniversities(false);
    };

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setError('');
            setFormData({
                universityId: '', email: '', password: '', confirmPassword: '',
                collegeName: '', collegeCode: '', establishedYear: '',
                deanName: '', deanEmail: '', deanPhone: ''
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Format phone number
        if (name === 'deanPhone') {
            processedValue = value.replace(/\D/g, '').slice(0, 10);
        }
        // Format college code
        if (name === 'collegeCode') {
            processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
        if (error) setError('');
    };

    const validateStep1 = () => {
        if (!formData.universityId || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all required fields');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const validateStep2 = async () => {
        if (!formData.collegeName || !formData.collegeCode) {
            setError('Please fill in all required fields');
            return false;
        }
        if (formData.collegeCode.length < 2) {
            setError('College code must be at least 2 characters');
            return false;
        }

        // Check college code uniqueness within university
        setLoading(true);
        const { isUnique, error: checkError } = await checkUniversityCollegeCode(formData.universityId, formData.collegeCode);
        setLoading(false);

        if (checkError) {
            setError('Error checking college code');
            return false;
        }
        if (!isUnique) {
            setError('This college code already exists in this university');
            return false;
        }

        return true;
    };

    const validateStep3 = () => {
        if (!formData.deanName) {
            setError('Please enter the dean name');
            return false;
        }
        if (formData.deanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.deanEmail)) {
            setError('Please enter a valid dean email');
            return false;
        }
        return true;
    };

    const handleNext = async () => {
        setError('');
        if (step === 1 && validateStep1()) {
            setStep(2);
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
            // 1. Create Auth User
            const authResult = await signUpWithRole(formData.email, formData.password, {
                role: 'admin',
                name: formData.deanName,
                phone: formData.deanPhone
            });

            if (!authResult.success) {
                throw new Error(authResult.error || 'Signup failed');
            }

            const userId = authResult.user.id;

            // 2. Create User Record
            const nameParts = formData.deanName.trim().split(' ');
            const userRecordResult = await createUserRecord(userId, {
                email: formData.email,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                role: 'university_admin'
            });

            if (!userRecordResult.success) {
                throw new Error(userRecordResult.error || 'Failed to create user record');
            }

            // 3. Create University College Record
            const collegeData = {
                university_id: formData.universityId,
                name: formData.collegeName,
                code: formData.collegeCode,
                dean_name: formData.deanName,
                dean_email: formData.deanEmail || formData.email,
                dean_phone: formData.deanPhone || null,
                established_year: formData.establishedYear ? parseInt(formData.establishedYear) : null,
                account_status: 'pending'
            };

            const collegeResult = await createUniversityCollege(collegeData, userId);

            if (!collegeResult.success) {
                throw new Error(collegeResult.error || 'Failed to create college profile');
            }

            onSignupSuccess();
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message || 'An error occurred during signup');
        } finally {
            setLoading(false);
        }
    };

    const selectedUniversity = universities.find(u => u.id === formData.universityId);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full max-h-[90vh] overflow-y-auto">
                    <div className="bg-white px-6 pt-6 pb-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Building className="h-6 w-6 text-purple-600" />
                                University Admin Registration
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Selected Plan */}
                        {selectedPlan && (
                            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-sm font-medium text-purple-900">
                                    {selectedPlan.name} Plan - ₹{selectedPlan.price}/{selectedPlan.duration}
                                </p>
                            </div>
                        )}

                        {/* Progress Steps */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between relative">
                                <div className="absolute left-0 top-4 w-full h-0.5 bg-gray-200 -z-10"></div>
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex flex-col items-center bg-white px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                            step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {s}
                                        </div>
                                        <span className="text-xs mt-1 font-medium text-gray-600">
                                            {s === 1 ? 'Account' : s === 2 ? 'College' : 'Dean'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Step 1: University & Account */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select University *</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select
                                                name="universityId"
                                                required
                                                disabled={loadingUniversities}
                                                className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                                                value={formData.universityId}
                                                onChange={handleChange}
                                            >
                                                <option value="">
                                                    {loadingUniversities ? 'Loading universities...' : 'Select your university'}
                                                </option>
                                                {universities.map(uni => (
                                                    <option key={uni.id} value={uni.id}>
                                                        {uni.name} ({uni.code})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                        </div>
                                        {universities.length === 0 && !loadingUniversities && (
                                            <p className="text-xs text-orange-600 mt-1">No universities available. Please contact support.</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="admin@university.edu"
                                                value={formData.email}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    required
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                required
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: College Details */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    {selectedUniversity && (
                                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 mb-4">
                                            <p className="text-sm text-purple-800">
                                                <span className="font-medium">University:</span> {selectedUniversity.name}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">College Name *</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="collegeName"
                                                required
                                                className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="College of Engineering"
                                                value={formData.collegeName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">College Code *</label>
                                            <input
                                                type="text"
                                                name="collegeCode"
                                                required
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                                                placeholder="COE2024"
                                                value={formData.collegeCode}
                                                onChange={handleChange}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Unique code within university</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="number"
                                                    name="establishedYear"
                                                    className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="1995"
                                                    min="1800"
                                                    max={new Date().getFullYear()}
                                                    value={formData.establishedYear}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Dean Details */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dean Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="deanName"
                                                required
                                                className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Dr. John Smith"
                                                value={formData.deanName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dean Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="deanEmail"
                                                    className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="dean@university.edu"
                                                    value={formData.deanEmail}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dean Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    name="deanPhone"
                                                    className="pl-10 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    placeholder="10-digit phone"
                                                    value={formData.deanPhone}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="mt-8 flex justify-between">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
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
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Checking...' : 'Next Step'}
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Switch to Login */}
                        <div className="mt-6 text-center border-t pt-4">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={onSwitchToLogin}
                                    className="text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    Login here
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UniversityAdminSignupModal;
