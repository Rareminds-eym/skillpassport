import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  BookOpen,
  Users,
  Star,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import educatorIllustration from "../../../public/login/yyu.png";
import FeatureCard from "./components/ui/FeatureCard";

export default function LoginEducator() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const primary = "#4f46e5"; // Indigo
  const secondary = "#312e81"; // Deep Indigo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate email format
      if (!email.includes("@")) {
        setError("Invalid email address");
        setLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Failed to sign in. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Authentication failed. Please try again.");
        setLoading(false);
        return;
      }

      // Fetch educator profile from school_educators table
      const { data: educatorData, error: educatorError } = await supabase
        .from("school_educators")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (educatorError) {
        console.error("Error fetching educator profile:", educatorError);
      }

      // Update AuthContext with user data
      const userData = {
        id: authData.user.id,
        email: authData.user.email,
        role: "educator",
        full_name: educatorData?.first_name && educatorData?.last_name
          ? `${educatorData.first_name} ${educatorData.last_name}`
          : educatorData?.first_name || authData.user.email?.split("@")[0] || "Educator",
        educator_id: educatorData?.id,
        school_id: educatorData?.school_id,
      };

      login(userData);

      // Redirect to educator dashboard
      navigate("/educator/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = (isLg: boolean) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"
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
            className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition border-gray-300/90 hover:border-gray-400/90 placeholder:text-white/70 lg:placeholder:text-gray-400 ${isLg
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
          className={`block text-sm font-medium ${isLg ? "text-gray-800 lg:text-gray-700" : "text-white/90"
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
            className={`w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition border-gray-300/90 hover:border-gray-400/90 placeholder:text-white/80 lg:placeholder:text-gray-400 ${isLg
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
              background: `linear-gradient(90deg, #f59e0b, #d97706)`,
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
              background: `linear-gradient(90deg, #f59e0b, #d97706)`,
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        )}
      </div>

      {/* Links */}
      <div className="flex justify-between mt-4 text-sm">
        <a
          href="/educator/forgot-password"
          className={
            isLg
              ? "text-[#4f46e5] font-semibold hover:text-[#1e1b4b]"
              : "text-white/90 font-semibold hover:opacity-90"
          }
        >
          Forgot password?
        </a>
        {isLg ? (
          <a
            href="/educator/signup"
            className="text-[#4f46e5] font-semibold hover:text-[#312e81]"
          >
            Sign up
          </a>
        ) : null}
      </div>
    </form>
  );

  return (
    <div className="flex items-center lg:py-10 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#f1c744] to-[#b8860b]">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Empower Learning. Guide Students to Success.
            </h2>
            <p className="mt-4 max-w-xl text-indigo-100">
              Manage student skills, progress, and verified achievements in one place.
            </p>
          </div>

          <div className="relative z-10 flex justify-start items-end h-full">
            <img
              src={educatorIllustration}
              alt="Educator illustration"
              className="w-80 lg:w-[24rem] object-contain drop-shadow-xl "
              style={{
                alignSelf: 'flex-end',
                marginBottom: '-30px',
                transform: 'translateY(20px)'
              }}
            />

            <motion.div
              className="absolute top-1 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <FeatureCard title="Track Progress" Icon={BookOpen} />
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
              <FeatureCard title="Manage Students" Icon={Users} />
            </motion.div>

            <motion.div
              className="absolute bottom-8 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <FeatureCard title="Recognize Excellence" Icon={Star} />
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
            src={educatorIllustration}
            alt=""
            className="absolute inset-0 h-full w-full object-contain lg:hidden opacity-60 pointer-events-none"
          />

          {/* White bg for lg */}
          <div className="hidden lg:block absolute inset-0 bg-white" />

          {/* MOBILE/TABLET */}
          <div className="relative w-full max-w-md lg:hidden">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">Educator Login</h3>
              <p className="text-sm text-white/80 mt-2">
                Access your educator dashboard to manage student skills and progress.
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
                Educator Login
              </h3>
              <p className="text-sm text-gray-700/90 lg:text-gray-500 mt-2">
                Access your educator dashboard with verified student data.
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
