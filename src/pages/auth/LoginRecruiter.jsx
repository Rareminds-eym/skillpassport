import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import loginIllustration from "../../assets/images/auth/Recruiter-illustration.png";

import {
  CheckCircle,
  Zap,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import FeatureCard from "./components/ui/FeatureCard";
import { loginRecruiter } from "../../services/recruiterProfile";

export default function LoginRecruiter() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // ignored, can be random
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const primary = "#0a6aba";
  const secondary = "#09277f";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { success, data, error: errMsg } = await loginRecruiter(email, password);

    if (!success) {
      setError(errMsg || "Login failed");
      setLoading(false);
      return;
    }

    // ✅ Save recruiter session in context
    login({
      id: data.id,
      name: data.name,
      email: data.email,
      role: "recruiter",
    });

    navigate("/recruitment");
    setLoading(false);
  };

  const renderForm = (isLg) => (
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
            placeholder="Enter email ID"
            autoComplete="username"
            className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition border-gray-300/90 hover:border-gray-400/90 placeholder:text-white/70 lg:placeholder:text-gray-400 ${
              isLg
                ? "bg-white/90"
                : "bg-white/20 border-2 border-white/15 backdrop-blur-sm"
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
            className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-[#5378f1] focus:outline-none transition border-gray-300/90 hover:border-gray-400/90 placeholder:text-white/80 lg:placeholder:text-gray-400 ${
              isLg
                ? "bg-white/90"
                : "bg-white/20 border-2 border-white/15 backdrop-blur-sm"
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-60"
            style={{
              background: `linear-gradient(90deg, ${primary}, ${secondary})`,
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-60"
            style={{
              background: `linear-gradient(90deg, #1d8ad1, #0a6aba)`,
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        )}
      </div>

      {/* Links */}
      <div className="flex justify-between mt-4 text-sm">
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
        {isLg ? (
          <a
            href="/request-demo"
            className="text-[#1d8ad1] font-semibold hover:text-[#5378f1]"
          >
            Request Demo
          </a>
        ) : null}
      </div>
    </form>
  );

  return (
    <div className="flex items-center lg:py-10 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f]">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Hire Smarter. Trust Skills, Not Just Resumes.
            </h2>
            <p className="mt-4 max-w-xl text-[#edf2f9]">
              Access verified Skill Passports of students across India & beyond.
            </p>
          </div>

          <div className="relative z-10 flex justify-start items-end h-full mt-12">
            <img
              src={loginIllustration}
              alt="Recruiter illustration"
              className="w-80 lg:w-[24rem] object-contain drop-shadow-xl -ml-10"
            />

            <motion.div
              className="absolute top-1 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <FeatureCard title="Verified skills" Icon={CheckCircle} />
            </motion.div>

            <motion.div
              className="absolute top-40 lg:-right-8 xl:-right-4"
              animate={{ y: [0, -12, 0] }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
              }}
            >
              <FeatureCard title="Faster hiring" Icon={Zap} />
            </motion.div>

            <motion.div
              className="absolute bottom-8 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <FeatureCard title="AI recommendations" Icon={BarChart3} />
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-8">
          {/* Gradient bg for mobile/tablet */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            }}
            aria-hidden
          />

          {/* Illustration overlay (mobile/tablet only) */}
          <img
            src={loginIllustration}
            alt=""
            className="absolute inset-0 h-full w-full object-contain lg:hidden opacity-60 pointer-events-none"
          />

          {/* White bg for lg */}
          <div className="hidden lg:block absolute inset-0 bg-white" />

          {/* MOBILE/TABLET */}
          <div className="relative w-full max-w-md lg:hidden">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">Recruiter Login</h3>
              <p className="text-sm text-white/80 mt-2">
                Access your recruiter dashboard with verified student profiles.
              </p>
            </div>
            <div className="rounded-2xl p-5 sm:p-6 bg-transparent">
              {error && (
                <div className="bg-red-50/90 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4 max-w-full">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 break-words">{error}</p>
                </div>
              )}
              {renderForm(false)}
            </div>
          </div>

          {/* DESKTOP */}
          <div className="relative w-full max-w-md hidden lg:block">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#000000]">
                Recruiter Login
              </h3>
              <p className="text-sm text-gray-700/90 lg:text-gray-500 mt-2">
                Access your recruiter dashboard with verified student profiles.
              </p>
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
