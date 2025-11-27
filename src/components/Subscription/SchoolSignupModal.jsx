import { useState, useCallback } from 'react';
import { X, Eye, EyeOff, School, MapPin, Phone, Mail, Globe, Calendar, User } from 'lucide-react';
import { signUpWithRole } from '../../services/authService';
import { createUserRecord } from '../../services/educatorAuthService';
import { createSchool, checkSchoolCode } from '../../services/schoolService';

function SchoolSignupModal({ isOpen, onClose, selectedPlan, onSignupSuccess, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolCode: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        establishedYear: '',
        board: '',
        principalName: '',
        principalEmail: '',
        principalPhone: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Account, 2: School Details, 3: Contact & Principal

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const validateStep1 = () => {
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
        return true;
    };

    const validateStep2 = async () => {
        if (!formData.schoolName || !formData.schoolCode || !formData.establishedYear || !formData.board) {
            setError('Please fill in all required fields');
            return false;
        }

        // Check school code uniqueness
        setLoading(true);
        const { isUnique, error: checkError } = await checkSchoolCode(formData.schoolCode);
        setLoading(false);

        if (checkError) {
            setError('Error checking school code');
            return false;
        }
        if (!isUnique) {
            setError('School code already exists');
            return false;
        }

        return true;
    };

    const validateStep3 = () => {
        if (!formData.address || !formData.city || !formData.state || !formData.pincode || !formData.principalName) {
            setError('Please fill in all required fields');
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
                name: formData.principalName,
                phone: formData.principalPhone
            });

            if (!authResult.success) {
                throw new Error(authResult.error || 'Signup failed');
            }

            const userId = authResult.user.id;

            // 2. Create User Record (Required for FK)
            const userRecordResult = await createUserRecord(userId, {
                email: formData.email,
                firstName: formData.principalName.split(' ')[0],
                lastName: formData.principalName.split(' ').slice(1).join(' ') || '',
                role: 'admin',
                entity_type: 'school'
            });

            if (!userRecordResult.success) {
                throw new Error(userRecordResult.error || 'Failed to create user record');
            }

            // 3. Create School Profile
            const schoolData = {
                name: formData.schoolName,
                code: formData.schoolCode,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                pincode: formData.pincode,
                established_year: parseInt(formData.establishedYear),
                board: formData.board,
                principal_name: formData.principalName,
                principal_email: formData.principalEmail || formData.email,
                principal_phone: formData.principalPhone || formData.phone,
                account_status: 'pending',
                approval_status: 'pending'
            };

            const schoolResult = await createSchool(schoolData, userId);

            if (!schoolResult.success) {
                throw new Error(schoolResult.error || 'Failed to create school profile');
            }

            onSignupSuccess();
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
                                <School className="h-6 w-6 text-blue-600" />
                                School Registration
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
                                            {s === 1 ? 'Account' : s === 2 ? 'School' : 'Details'}
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
                                                placeholder="admin@school.com"
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

                            {/* Step 2: School Basic Details */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <School className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="schoolName"
                                                required
                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Excellence High School"
                                                value={formData.schoolName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">School Code (Unique)</label>
                                            <input
                                                type="text"
                                                name="schoolCode"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="EHS2024"
                                                value={formData.schoolCode}
                                                onChange={handleChange}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Unique identifier for your school</p>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Board / Affiliation</label>
                                        <select
                                            name="board"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.board}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Board</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="State Board">State Board</option>
                                            <option value="IB">IB</option>
                                            <option value="IGCSE">IGCSE</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Contact & Principal Details */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="principalName"
                                                    required
                                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Dr. John Doe"
                                                    value={formData.principalName}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">School Phone</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="+91 9876543210"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                                    placeholder="https://school.com"
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
                                            'Create School Account'
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have a school account?{' '}
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

export default SchoolSignupModal;
