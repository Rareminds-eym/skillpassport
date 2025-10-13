import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import studentIllustration from "../../assets/images/auth/Student-illustration.jpg";

// Lucide icons
import {
  BadgeCheck,
  Share2,
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

import FeatureCard from "./components/FeatureCard";
import { getStudentByEmail } from "../../services/studentServiceProfile";

export default function LoginStudent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔍 Validate student email from backend
      console.log("🔍 Validating student email:", email);
      const result = await getStudentByEmail(email);

      if (!result.success || !result.data) {
        setError(
          "No student account found with this email. Please check your email or contact support."
        );
        setLoading(false);
        return;
      }

      console.log("✅ Student found, logging in...");
      // Proceed with login
      login({ name: result.data.profile.name, email, role: "student" });
      navigate("/student/dashboard");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center py-10 bg-white">
      <div className="w-full mx-4 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-[700px] my-8">
        {/* LEFT SIDE with Background Image */}
        <div
          className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-cover bg-center"
          style={{
            backgroundImage: `url(${studentIllustration})`,
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Content on top */}
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Your Skills. Your Passport. Your Future.
            </h2>
            <p className="mt-4 max-w-xl">
              Unlock opportunities with your verified Skill Passport.
            </p>
          </div>

          {/* Floating Feature Cards */}
          <div className="relative z-10 flex justify-start items-end h-full mt-12">
            <motion.div
              className="absolute top-4 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <FeatureCard title="Showcase verified skills" Icon={BadgeCheck} />
            </motion.div>

            <motion.div
              className="absolute top-44 lg:-right-8 xl:-right-4"
              animate={{ y: [0, -12, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
              }}
            >
              <FeatureCard
                title="Share with recruiters worldwide"
                Icon={Share2}
              />
            </motion.div>

            <motion.div
              className="absolute bottom-16 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <FeatureCard title="Track employability score" Icon={Activity} />
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE (LOGIN BOX) */}
        <div className="flex items-center justify-center px-4 sm:px-8 md:px-12 py-8 bg-white rounded-none">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#000000]">
                Student Login
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Use your university email or registered phone number.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition border-gray-300 hover:border-gray-400"
                    autoComplete="username"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full p-3 pl-10 pr-10 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition border-gray-300 hover:border-gray-400"
                    autoComplete="current-password"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#5378f1] text-white text-sm font-medium rounded-lg 
                 hover:bg-[#4364d9] transition disabled:opacity-60"
                >
                  {loading ? "Validating..." : "Login"}
                </button>
              </div>

              {/* Links */}
              <div className="flex justify-between mt-4 text-sm">
                <a
                  href="/resetpassword"
                  className="text-[#e32a18] font-semibold hover:text-[#000000]"
                >
                  Forgot password?
                </a>
                {/* <a
                  href="/register-student"
                  className="text-[#1d8ad1] font-semibold hover:text-[#5378f1]"
                >
                  Don’t have a Skill Passport? Register Now
                </a> */}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
