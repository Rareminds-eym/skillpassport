import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import loginIllustration from "../../assets/images/auth/Recruiter-illustration.png";

import {
  CheckCircle,
  Zap,
  BarChart3,
  Info,
  X,
  User,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import FeatureCard from "./components/ui/FeatureCard";

export default function RecruitmentRegister() {
  const [activeTab, setActiveTab] = useState("recruitment");
  const [recruitmentType, setRecruitmentType] = useState("admin");
  const [currentStep, setCurrentStep] = useState(1);
  const [subscriptionType, setSubscriptionType] = useState(null);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [showRecruiterInfo, setShowRecruiterInfo] = useState(false);
  const navigate = useNavigate();

  const primary = "#0a6aba";
  const secondary = "#09277f";
  const totalSteps = 2;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "school") {
      navigate("/register/school");
    } else if (tabId === "college") {
      navigate("/register/college");
    } else if (tabId === "university") {
      navigate("/register/university");
    }
  };

  const handleRecruitmentTypeChange = (type) => {
    setRecruitmentType(type);
    setSubscriptionType(null);
    // Don't auto-advance, let user click button
  };

  const handleNext = () => {
    // If admin is selected, go directly to signup
    if (recruitmentType === "admin") {
      navigate("/signup/recruitment-admin");
    } 
    // If recruiter is selected, go directly to signup
    else if (recruitmentType === "recruiter") {
      navigate("/signup/recruitment-recruiter");
    }
    // Otherwise continue to next step
    else if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSubscriptionType(null);
    }
  };

  const handleGetStarted = () => {
    if (!subscriptionType) return;

    if (subscriptionType === "have") {
      // Navigate to login
      navigate("/login/recruiter");
    } else if (subscriptionType === "purchase") {
      // Navigate directly to signup form
      if (recruitmentType === "admin") {
        navigate("/signup/recruitment-admin");
      } else {
        navigate("/signup/recruitment-recruiter");
      }
    } else if (subscriptionType === "view") {
      // Navigate to view plans
      const entityType = recruitmentType === "admin" ? "recruitment-admin" : "recruitment-recruiter";
      navigate(`/subscription/plans/${entityType}/view`);
    }
  };

  const handleInfoClick = (type) => {
    if (type === "admin") {
      setShowRecruiterInfo(false);
      setShowAdminInfo(!showAdminInfo);
    } else {
      setShowAdminInfo(false);
      setShowRecruiterInfo(!showRecruiterInfo);
    }
  };

  return (
    <div className="flex items-center lg:py-8 bg-white">
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
              <FeatureCard title="Verified Skills" Icon={CheckCircle} />
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
              <FeatureCard title="Faster Hiring" Icon={Zap} />
            </motion.div>

            <motion.div
              className="absolute bottom-8 lg:left-[8rem] xl:left-[12rem]"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <FeatureCard title="AI Recommendations" Icon={BarChart3} />
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-8 lg:py-8">
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
            {/* Mobile Tabs */}
            {currentStep === 1 && (
              <div className="flex space-x-2 mb-6 bg-white/20 backdrop-blur-sm rounded-xl p-1">
                {[
                  { id: "school", label: "School", Icon: User },
                  { id: "college", label: "College", Icon: GraduationCap },
                  { id: "university", label: "University", Icon: GraduationCap },
                  { id: "recruitment", label: "Recruitment", Icon: Briefcase },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all ${
                      activeTab === id
                        ? "bg-white/20 backdrop-blur-sm text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step indicator - Always visible */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-white text-blue-600' : 'bg-white/20 text-white/60'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-white' : 'bg-white/20'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 2 ? 'bg-white text-blue-600' : 'bg-white/20 text-white/60'
                }`}>
                  2
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">
                {currentStep === 1 ? "Recruiter Login" : "Subscription"}
              </h3>
              <p className="text-sm text-white/80 mt-2">
                {currentStep === 1 
                  ? "Access verified Skill Passports of students across India & beyond."
                  : "Choose your subscription option"}
              </p>
            </div>

            <div className="rounded-2xl p-5 sm:p-6 bg-transparent">
              {/* Step 1: Role Selection */}
              {currentStep === 1 && (
                <div className="mb-6">
                  <p className="text-white mb-3 font-medium">I am an:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="recruitmentTypeMobile"
                        value="admin"
                        checked={recruitmentType === "admin"}
                        onChange={(e) => handleRecruitmentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Admin</span>
                      <button
                        type="button"
                        onClick={() => handleInfoClick("admin")}
                        className="text-blue-300 hover:text-blue-100 ml-auto transition-all duration-200 hover:scale-110 hover:drop-shadow-lg"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="recruitmentTypeMobile"
                        value="recruiter"
                        checked={recruitmentType === "recruiter"}
                        onChange={(e) => handleRecruitmentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Recruiter</span>
                      <button
                        type="button"
                        onClick={() => handleInfoClick("recruiter")}
                        className="text-blue-300 hover:text-blue-100 ml-auto transition-all duration-200 hover:scale-110 hover:drop-shadow-lg"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </label>
                  </div>

                  {/* Info modals for mobile */}
                  <AnimatePresence>
                    {showAdminInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs">
                          <div className="flex justify-between items-start">
                            <p>
                              You're creating your company's workspace to generate Workspace ID
                            </p>
                            <button
                              onClick={() => setShowAdminInfo(false)}
                              className="text-white/70 hover:text-white ml-2 flex-shrink-0 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {showRecruiterInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs">
                          <div className="flex justify-between items-start">
                            <p>
                              Enter the Workspace ID given by your admin to join your company's workspace.
                            </p>
                            <button
                              onClick={() => setShowRecruiterInfo(false)}
                              className="text-white/70 hover:text-white ml-2 flex-shrink-0 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Step 2: Subscription Selection */}
              {currentStep === 2 && (
                <div className="mb-6">
                  <p className="text-white mb-3 font-medium">Subscription:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="subscriptionTypeMobile"
                        value="have"
                        checked={subscriptionType === "have"}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">I already have a subscription</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="subscriptionTypeMobile"
                        value="purchase"
                        checked={subscriptionType === "purchase"}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Purchase subscription</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="subscriptionTypeMobile"
                        value="view"
                        checked={subscriptionType === "view"}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">View My Plan</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                {currentStep === 2 && (
                  <button
                    onClick={handleBack}
                    className="w-full bg-white/20 backdrop-blur-sm text-white py-3 px-6 rounded-lg font-medium hover:bg-white/30 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={currentStep === 1 ? handleNext : handleGetStarted}
                  disabled={currentStep === 2 && !subscriptionType}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === 1 
                    ? (recruitmentType === "admin" ? "Create Workspace" : "Join Workspace")
                    : "Get Started"}
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP */}
          <div className="relative w-full max-w-md hidden lg:block">
            {/* Tabs */}
            {currentStep === 1 && (
              <div className="flex space-x-4 mb-8 bg-gray-100 rounded-xl p-1">
                {[
                  { id: "school", label: "School", Icon: User },
                  { id: "college", label: "College", Icon: GraduationCap },
                  { id: "university", label: "University", Icon: GraduationCap },
                  { id: "recruitment", label: "Recruitment", Icon: Briefcase },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all ${
                      activeTab === id
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step indicator - Always visible */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  2
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[#000000]">
                {currentStep === 1 ? "Recruiter Login" : "Subscription"}
              </h3>
              <p className="text-sm text-gray-700/90 lg:text-gray-500 mt-2">
                {currentStep === 1 
                  ? "Access verified Skill Passports of students across India & beyond."
                  : "Choose your subscription option"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/95 shadow-xl lg:shadow-none lg:bg-white ring-1 lg:ring-0 ring-black/5 p-6 sm:p-8">
              {/* Step 1: Role Selection */}
              {currentStep === 1 && (
                <div className="mb-6">
                  <p className="text-gray-700 mb-4 font-medium">I am an:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="recruitmentTypeDesktop"
                        value="admin"
                        checked={recruitmentType === "admin"}
                        onChange={(e) => handleRecruitmentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700 flex-1">Admin</span>
                      <button
                        type="button"
                        onClick={() => handleInfoClick("admin")}
                        className="text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-110"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="recruitmentTypeDesktop"
                        value="recruiter"
                        checked={recruitmentType === "recruiter"}
                        onChange={(e) => handleRecruitmentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700 flex-1">Recruiter</span>
                      <button
                        type="button"
                        onClick={() => handleInfoClick("recruiter")}
                        className="text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-110"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </label>
                  </div>

                  {/* Info modals for desktop */}
                  <AnimatePresence>
                    {showAdminInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="p-3 bg-blue-50 rounded-lg text-gray-700 text-sm">
                          <div className="flex justify-between items-start">
                            <p>
                              You're creating your company's workspace to generate Workspace ID
                            </p>
                            <button
                              onClick={() => setShowAdminInfo(false)}
                              className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {showRecruiterInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="p-3 bg-blue-50 rounded-lg text-gray-700 text-sm">
                          <div className="flex justify-between items-start">
                            <p>
                              Enter the Workspace ID given by your admin to join your company's workspace.
                            </p>
                            <button
                              onClick={() => setShowRecruiterInfo(false)}
                              className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Step 2: Subscription Selection */}
              {currentStep === 2 && (
                <div className="mb-6">
                  <p className="text-gray-700 mb-4 font-medium">Subscription:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="subscriptionTypeDesktop"
                        value="have"
                        checked={subscriptionType === "have"}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">I already have a subscription</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="subscriptionTypeDesktop"
                        value="purchase"
                        checked={subscriptionType === "purchase"}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Purchase subscription</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="subscriptionTypeDesktop"
                        value="view"
                        checked={subscriptionType === "view"}
                        onChange={(e) => setSubscriptionType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">View My Plan</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                {currentStep === 2 && (
                  <button
                    onClick={handleBack}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={currentStep === 1 ? handleNext : handleGetStarted}
                  disabled={currentStep === 2 && !subscriptionType}
                  className="w-full py-3 text-white text-sm font-medium rounded-lg shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                  }}
                >
                  {currentStep === 1 
                    ? (recruitmentType === "admin" ? "Create Workspace" : "Join Workspace")
                    : "Get Started"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
