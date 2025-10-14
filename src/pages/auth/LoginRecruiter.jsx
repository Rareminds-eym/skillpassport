import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext"; // ✅ make sure this is correct path
import { useNavigate } from "react-router-dom";
import loginIllustration from "../../assets/images/auth/Recruiter-illustration.png";

// Lucide icons
import {
  CheckCircle,
  Zap,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import FeatureCard from "./components/FeatureCard";

export default function LoginRecruiter() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Simulate API / validation
    setTimeout(() => {
      login({ name: "Recruiter User", email, role: "recruiter" });
      navigate("/recruitment");
      setLoading(false);
    }, 700);
  }

  return (
    <div className="flex items-center py-10 bg-white">
      <div className="w-full mx-4 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-[700px] my-8">
        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative p-10 bg-gradient-to-br from-[#0a6aba] to-[#09277f] text-white flex-col justify-between rounded-3xl shadow-lg">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Hire Smarter. Trust Skills, Not Just Resumes.
            </h2>

            <p className="mt-4 text-[#edf2f9] max-w-xl">
              Access verified Skill Passports of students across India & beyond.
            </p>
          </div>

          {/* Illustration + Floating Features */}
          <div className="relative flex justify-start items-end h-full mt-12">
            <img
              src={loginIllustration}
              alt="Recruiter illustration"
              className="w-80 lg:w-[24rem] object-contain drop-shadow-xl -ml-10"
            />

            {/* Feature Cards */}
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

        {/* RIGHT SIDE (LOGIN BOX) */}
        <div className="flex items-center justify-center px-4 sm:px-8 md:px-12 py-8 bg-white rounded-none">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#000000]">
                Recruiter Login
              </h3>
            </div>

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
                    placeholder="Enter email ID"
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
                  {loading ? "Signing in..." : "Login"}
                </button>

                {/* <button
                  type="button"
                  className="w-full py-3 bg-white text-[#5378f1] border border-[#5378f1] text-sm font-medium rounded-lg 
               hover:bg-[#5378f1] hover:text-white transition"
                >
                  Login with OTP
                </button> */}
              </div>

              {/* Links */}
              <div className="flex justify-between mt-4 text-sm">
                <a
                  href="/resetpassword"
                  className="text-[#e32a18] font-semibold hover:text-[#000000]"
                >
                  Forgot password?
                </a>
                <a
                  href="/request-demo"
                  className="text-[#1d8ad1] font-semibold hover:text-[#5378f1]"
                >
                  Request Demo
                </a>
              </div>

              {/* CTA */}
              {/* <div className="text-center mt-6 text-sm">
                Not a partner yet?{" "}
                <a
                  href="/register-recruiter"
                  className="text-[#1d8ad1] font-semibold hover:text-[#5378f1]"
                >
                  Register as Recruiter
                </a>
              </div> */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
