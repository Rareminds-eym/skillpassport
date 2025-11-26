import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import loginIllustration from "../../../../../assets/images/auth/Recruiter-illustration.png";
import { supabase } from "../../../../../lib/supabaseClient";

import {
  CheckCircle,
  Zap,
  BarChart3,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import FeatureCard from "../../ui/FeatureCard";

export default function SignupRecruiter() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    workspaceId: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const primary = "#0a6aba";
  const secondary = "#09277f";

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newSuccess = { ...success };

    switch (name) {
      case 'workspaceId':
        if (!value) {
          newErrors.workspaceId = 'Workspace ID is required';
          newSuccess.workspaceId = false;
        } else if (value.length < 6) {
          newErrors.workspaceId = 'Workspace ID must be at least 6 characters';
          newSuccess.workspaceId = false;
        } else {
          newErrors.workspaceId = '';
          newSuccess.workspaceId = true;
        }
        break;

      case 'fullName':
        if (!value) {
          newErrors.fullName = 'Full name is required';
          newSuccess.fullName = false;
        } else if (value.length < 2) {
          newErrors.fullName = 'Full name must be at least 2 characters';
          newSuccess.fullName = false;
        } else {
          newErrors.fullName = '';
          newSuccess.fullName = true;
        }
        break;

      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
          newSuccess.email = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
          newSuccess.email = false;
        } else {
          newErrors.email = '';
          newSuccess.email = true;
        }
        break;

      case 'phone':
        if (!value) {
          newErrors.phone = 'Phone number is required';
          newSuccess.phone = false;
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
          newSuccess.phone = false;
        } else {
          newErrors.phone = '';
          newSuccess.phone = true;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
          newSuccess.password = false;
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
          newSuccess.password = false;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
          newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
          newSuccess.password = false;
        } else {
          newErrors.password = '';
          newSuccess.password = true;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
          newSuccess.confirmPassword = false;
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
          newSuccess.confirmPassword = false;
        } else {
          newErrors.confirmPassword = '';
          newSuccess.confirmPassword = true;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setSuccess(newSuccess);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    validateField(name, processedValue);
  };

  const validateForm = () => {
    const fields = ['workspaceId', 'fullName', 'email', 'phone', 'password', 'confirmPassword'];
    let isValid = true;

    fields.forEach(field => {
      validateField(field, formData[field]);
      if (errors[field] || !formData[field]) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
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
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          verificationstatus: 'pending',
          isactive: true,
          approval_status: 'pending',
          account_status: 'active'
        });

      if (recruiterError) throw new Error(recruiterError.message);

      alert('Account created successfully! Please check your email to verify your account.');
      navigate('/login/recruiter');
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (isLg) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="workspaceId" className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"}`}>
          Workspace ID
        </label>
        <input
          type="text"
          id="workspaceId"
          name="workspaceId"
          required
          value={formData.workspaceId}
          onChange={handleChange}
          placeholder="Enter workspace ID"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition ${
            isLg ? "bg-white/90 border-gray-300" : "bg-white/20 border-2 border-white/15 backdrop-blur-sm placeholder:text-white/70"
          } lg:placeholder:text-gray-400`}
        />
        {errors.workspaceId && <p className={`text-sm ${isLg ? 'text-red-600' : 'text-red-200'}`}>{errors.workspaceId}</p>}
        <p className={`text-xs ${isLg ? 'text-gray-500' : 'text-white/70'}`}>Enter the Workspace ID provided by your admin</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="fullName" className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"}`}>
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          required
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition ${
            isLg ? "bg-white/90 border-gray-300" : "bg-white/20 border-2 border-white/15 backdrop-blur-sm placeholder:text-white/70"
          } lg:placeholder:text-gray-400`}
        />
        {errors.fullName && <p className={`text-sm ${isLg ? 'text-red-600' : 'text-red-200'}`}>{errors.fullName}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"}`}>
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition ${
            isLg ? "bg-white/90 border-gray-300" : "bg-white/20 border-2 border-white/15 backdrop-blur-sm placeholder:text-white/70"
          } lg:placeholder:text-gray-400`}
        />
        {errors.email && <p className={`text-sm ${isLg ? 'text-red-600' : 'text-red-200'}`}>{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"}`}>
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your phone number"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition ${
            isLg ? "bg-white/90 border-gray-300" : "bg-white/20 border-2 border-white/15 backdrop-blur-sm placeholder:text-white/70"
          } lg:placeholder:text-gray-400`}
        />
        {errors.phone && <p className={`text-sm ${isLg ? 'text-red-600' : 'text-red-200'}`}>{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"}`}>
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="new-password"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition ${
              isLg ? "bg-white/90 border-gray-300" : "bg-white/20 border-2 border-white/15 backdrop-blur-sm placeholder:text-white/80"
            } lg:placeholder:text-gray-400`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            {showPassword ? <EyeOff className="w-5 h-5 text-white/60 lg:text-gray-400" /> : <Eye className="w-5 h-5 text-white/60 lg:text-gray-400" />}
          </button>
        </div>
        {errors.password && <p className={`text-sm ${isLg ? 'text-red-600' : 'text-red-200'}`}>{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"}`}>
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            autoComplete="new-password"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition ${
              isLg ? "bg-white/90 border-gray-300" : "bg-white/20 border-2 border-white/15 backdrop-blur-sm placeholder:text-white/80"
            } lg:placeholder:text-gray-400`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5 text-white/60 lg:text-gray-400" /> : <Eye className="w-5 h-5 text-white/60 lg:text-gray-400" />}
          </button>
        </div>
        {errors.confirmPassword && <p className={`text-sm ${isLg ? 'text-red-600' : 'text-red-200'}`}>{errors.confirmPassword}</p>}
      </div>

      <div className="space-y-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-60"
          style={{ background: `linear-gradient(90deg, ${isLg ? primary : '#1d8ad1'}, ${isLg ? secondary : '#0a6aba'})` }}
        >
          {loading ? "Creating Account..." : "Join Workspace"}
        </button>
      </div>

      <div className="text-center mt-4 text-sm">
        <span className={isLg ? "text-gray-600" : "text-white/90"}>Already have an account? </span>
        <a href="/login/recruiter" className={isLg ? "text-[#1d8ad1] font-semibold hover:text-[#5378f1]" : "text-white/90 font-semibold hover:opacity-90 underline"}>
          Login here
        </a>
      </div>
    </form>
  );

  return (
    <div className="flex items-center lg:py-10 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
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

        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-8">
          <div className="absolute inset-0 lg:hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} aria-hidden />
          <img src={loginIllustration} alt="" className="absolute inset-0 h-full w-full object-contain lg:hidden opacity-60 pointer-events-none" />
          <div className="hidden lg:block absolute inset-0 bg-white" />

          <div className="relative w-full max-w-md lg:hidden">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">Join Workspace</h3>
              <p className="text-sm text-white/80 mt-2">Create your recruiter account to join your team</p>
            </div>
            <div className="rounded-2xl p-5 sm:p-6 bg-transparent">
              {error && (
                <div className="bg-red-50/90 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 break-words">{error}</p>
                </div>
              )}
              {renderForm(false)}
            </div>
          </div>

          <div className="relative w-full max-w-md hidden lg:block">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#000000]">Join Workspace</h3>
              <p className="text-sm text-gray-700/90 lg:text-gray-500 mt-2">Create your recruiter account to join your team</p>
            </div>
            <div className="rounded-2xl bg-white/95 shadow-xl lg:shadow-none lg:bg-white ring-1 lg:ring-0 ring-black/5 p-6 sm:p-8">
              {error && (
                <div className="bg-red-50/90 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 break-words">{error}</p>
                </div>
              )}
              {renderForm(true)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
