import { motion } from "framer-motion";
import { AlertCircle, BarChart3, CheckCircle, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginIllustration from "../../../../../assets/images/auth/Recruiter-illustration.png";
import SignupFormFields from "../../../../../components/Subscription/shared/SignupFormFields";
import { capitalizeFirstLetter, formatOtp, formatPhoneNumber, getInitialFormData, validateSignupFields } from "../../../../../components/Subscription/shared/signupValidation";
import { supabase } from "../../../../../lib/supabaseClient";
import FeatureCard from "../../ui/FeatureCard";

export default function SignupRecruiter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ...getInitialFormData(),
    workspaceId: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const primary = "#0a6aba";
  const secondary = "#09277f";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;
    
    if (name === 'phone') {
      processedValue = formatPhoneNumber(value);
    } else if (name === 'otp') {
      processedValue = formatOtp(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) return;
    setSendingOtp(true);
    try {
      const result = await sendOtp(formData.phone);
      if (result.success) {
        setOtpSent(true);
        setErrors(prev => ({ ...prev, phone: '' }));
      } else {
        setErrors(prev => ({ ...prev, phone: result.error || 'Failed to send OTP.' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, phone: 'Failed to send OTP.' }));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) return;
    setVerifyingOtp(true);
    try {
      const result = await verifyOtpApi(formData.phone, formData.otp);
      if (result.success) {
        setOtpVerified(true);
        setFormData(prev => ({ ...prev, otpVerified: true }));
        setErrors(prev => ({ ...prev, otp: '' }));
      } else {
        setErrors(prev => ({ ...prev, otp: result.error || 'Invalid OTP.' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, otp: 'Invalid OTP.' }));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validateForm = () => {
    const validationErrors = validateSignupFields(formData, {
      requirePhone: true,
      requireOtp: false,
      requireLocation: true
    });

    if (!formData.workspaceId || formData.workspaceId.length < 6) {
      validationErrors.workspaceId = 'Workspace ID must be at least 6 characters';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const firstName = capitalizeFirstLetter(formData.firstName);
      const lastName = capitalizeFirstLetter(formData.lastName);
      const fullName = `${firstName} ${lastName}`.trim();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role: 'recruiter'
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Failed to create user account');

      const { error: recruiterError } = await supabase
        .from('recruiters')
        .insert({
          user_id: authData.user.id,
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          preferred_language: formData.preferredLanguage,
          referral_code: formData.referralCode || null,
          verificationstatus: 'pending',
          isactive: true,
          approval_status: 'pending',
          account_status: 'active'
        });

      if (recruiterError) throw new Error(recruiterError.message);

      // Create user record in public.users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          firstName: firstName,
          lastName: lastName,
          role: 'recruiter',
          isActive: true,
          dob: formData.dateOfBirth || null
        });

      if (userError) console.error('Error creating user record:', userError);

      alert('Account created successfully! Please check your email to verify your account.');
      navigate('/login/recruiter');
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // Workspace ID field component
  const workspaceIdField = (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Workspace ID <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="workspaceId"
        value={formData.workspaceId}
        onChange={handleChange}
        placeholder="Enter workspace ID from your admin"
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
          errors.workspaceId ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {errors.workspaceId && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors.workspaceId}
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">Enter the Workspace ID provided by your admin</p>
    </div>
  );

  return (
    <div className="flex items-center lg:py-10 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-auto overflow-hidden">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f]">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">Join Your Team. Start Hiring Smarter.</h2>
            <p className="mt-4 max-w-xl text-[#edf2f9]">Access verified Skill Passports and connect with top talent across India & beyond.</p>
          </div>
          <div className="relative z-10 flex justify-start items-end h-full mt-12">
            <img src={loginIllustration} alt="Recruiter illustration" className="w-80 lg:w-[24rem] object-contain drop-shadow-xl -ml-10" />
            <motion.div className="absolute top-1 lg:left-[8rem] xl:left-[12rem]" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
              <FeatureCard title="Verified Skills" Icon={CheckCircle} />
            </motion.div>
            <motion.div className="absolute top-40 lg:-right-8 xl:-right-4" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}>
              <FeatureCard title="Faster Hiring" Icon={Zap} />
            </motion.div>
            <motion.div className="absolute bottom-8 lg:left-[8rem] xl:left-[12rem]" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <FeatureCard title="AI Recommendations" Icon={BarChart3} />
            </motion.div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-8">
          <div className="absolute inset-0 lg:hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} aria-hidden />
          <img src={loginIllustration} alt="" className="absolute inset-0 h-full w-full object-contain lg:hidden opacity-60 pointer-events-none" />
          <div className="hidden lg:block absolute inset-0 bg-white" />

          <div className="relative w-full max-w-md">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-gray-900 lg:text-gray-900">Join Workspace</h3>
              <p className="text-sm text-gray-600 mt-2">Create your recruiter account to join your team</p>
            </div>

            <div className="rounded-2xl bg-white shadow-xl p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {workspaceIdField}
                
                <SignupFormFields
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  onLoginRedirect={() => navigate('/login/recruiter')}
                  otpSent={otpSent}
                  otpVerified={otpVerified}
                  onSendOtp={handleSendOtp}
                  onVerifyOtp={handleVerifyOtp}
                  sendingOtp={sendingOtp}
                  verifyingOtp={verifyingOtp}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-60"
                  style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                >
                  {loading ? "Creating Account..." : "Join Workspace"}
                </button>

                <div className="text-center mt-4 text-sm">
                  <span className="text-gray-600">Already have an account? </span>
                  <a href="/login/recruiter" className="text-blue-600 font-semibold hover:text-blue-700">
                    Login here
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
