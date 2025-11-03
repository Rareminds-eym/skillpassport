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

import FeatureCard from "./components/ui/FeatureCard";
import { getStudentByEmail } from "../../services/studentServiceProfile";

export default function LoginStudent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const primary = "#3261A5";
  const secondary = "#3392D0";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔍 Validate student email from backend
      const result = await getStudentByEmail(email);

      if (!result?.success || !result?.data) {
        setError(
          "No student account found with this email. Please check your email or contact support."
        );
        setLoading(false);
        return;
      }

      // proceed with login - include student ID
      login({ 
        id: result.data.id,  // Add student ID!
        name: result.data.profile.name, 
        email, 
        role: "student" 
      });
      navigate("/student/dashboard");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (isLg) => {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className={`block text-sm font-medium ${
              isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"
            }`}
          >
            Email ID
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              autoComplete="username"
              aria-label="Email ID"
              // frosted on mobile/tablet, solid on lg
              className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition border-gray-300/90 hover:border-gray-400/90 placeholder:text-white/60 lg:placeholder:text-gray-400 ${
                isLg
                  ? "bg-white/90"
                  : "bg-white/15 border-2 border-white/15 backdrop-blur-sm"
              }`}
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 lg:text-gray-400" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className={`block text-sm font-medium ${
              isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"
            }`}
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
              autoComplete="current-password"
              aria-label="Password"
              className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition border-gray-300/90 hover:border-gray-400/90 placeholder:text-white/60 lg:placeholder:text-gray-400 ${
                isLg
                  ? "bg-white/90"
                  : "bg-white/15 border-2 border-white/15 backdrop-blur-sm"
              }`}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 lg:text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-white/60 lg:text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-white/60 lg:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {isLg ? (
            // LG button — IDENTICAL to your original lg styling (kept exactly)
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 shadow-sm"
              style={{
                background: `linear-gradient(90deg, ${primary}, ${secondary})`,
              }}
            >
              {loading ? "Validating..." : "Login"}
            </button>
          ) : (
            // Mobile/tablet button with glass-friendly gradient
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-3 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-60"
              style={{
                background: `linear-gradient(90deg, ${primary}, ${secondary})`,
              }}
            >
              {loading ? "Validating..." : "Login"}
            </button>
          )}
        </div>

        {/* Links */}
        <div className="flex justify-between mt-4 text-sm">
          {/* forgot password: white on mobile, original red on lg */}
          <a
            href="/resetpassword"
            className={
              isLg
                ? "text-[#e32a18] font-semibold hover:text-[#000000]"
                : "text-white/90 font-semibold hover:opacity-90"
            }
          >
            Forgot password?
          </a>

          {/* preserve existing commented register link on lg */}
          {isLg ? <></> : <></>}
        </div>
      </form>
    );
  };

  return (
    <div className="flex items-center lg:py-10 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
        {/* LEFT SIDE with Background Image (UNCHANGED for lg) */}
        <div
          className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-cover bg-center"
          style={{
            backgroundImage: `url(${studentIllustration})`,
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Text content */}
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
        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-8">
          {/* Background image for mobile & tablet only */}
          <img
            src={studentIllustration}
            alt=""
            className="absolute inset-0 h-full w-full object-cover lg:hidden opacity-90 pointer-events-none"
          />

          {/* Dark overlay for mobile/tablet so inputs/buttons stand out */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(rgba(8,18,32,0.55), rgba(8,18,32,0.35))",
            }}
            aria-hidden
          />

          {/* Clean white bg for desktop (unchanged) */}
          <div className="hidden lg:block absolute inset-0 bg-white" />

          {/* -------- MOBILE / TABLET: clean wrapper (no glass) -------- */}
          <div className="relative w-full max-w-md lg:hidden">
            {/* header (mobile colors) */}
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">Student Login</h3>
              <p className="text-sm text-white/80 mt-2">
                Use your university email or registered phone number.
              </p>
            </div>

            {/* simple clean wrapper */}
            <div className="rounded-2xl p-5 sm:p-6 bg-transparent">
              {/* inline error */}
              {error && (
                <div className="bg-red-50/90 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 break-words">{error}</p>
                </div>
              )}

              {renderForm(false)}
            </div>
          </div>

          {/* -------- DESKTOP (lg): keep original layout & styling EXACTLY as you had -------- */}
          <div className="relative w-full max-w-md hidden lg:block">
            {/* header (lg colors unchanged) */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#000000]">
                Student Login
              </h3>
              <p className="text-sm text-gray-700/90 lg:text-gray-500 mt-2">
                Use your university email or registered phone number.
              </p>
            </div>

            {/* original desktop card styling */}
            <div className="rounded-2xl bg-white/95 shadow-xl lg:shadow-none lg:bg-white ring-1 lg:ring-0 ring-black/5 p-6 sm:p-8">
              {/* inline error */}
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
