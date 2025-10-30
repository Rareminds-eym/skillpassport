import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import loginIllustration from "../../assets/images/auth/Recruiter-illustration.png";
import studentIllustration from "../../assets/images/auth/Student-illustration.jpg"; 
import educatorIllustration from "../../assets/images/auth/Educator-illustration.jpg";

import {
  CheckCircle,
  Zap,
  BarChart3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  GraduationCap,
  Briefcase,
  BadgeCheck,
  Share2,
  Activity,
} from "lucide-react";
import FeatureCard from "./components/FeatureCard";

export default function UnifiedSignup() {
  const [activeTab, setActiveTab] = useState("school");
  const [studentType, setStudentType] = useState("school");
  const [currentStep, setCurrentStep] = useState(1);
  const [subscriptionType, setSubscriptionType] = useState(null);
  const navigate = useNavigate();

  const totalSteps = 2;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Color schemes for different user types
  const primary = "#0a6aba";
  const secondary = "#09277f";



  // Feature cards data for each user type
  const featureCards = {
    school: [
      { title: "Skill Verification", Icon: CheckCircle, description: "Verify and endorse student skills" },
      { title: "Analytics", Icon: BarChart3, description: "Track student progress and outcomes" },
      { title: "Industry Connect", Icon: Zap, description: "Connect students with opportunities" },
    ],
    college: [
      { title: "Skill Verification", Icon: CheckCircle, description: "Verify and endorse student skills" },
      { title: "Analytics", Icon: BarChart3, description: "Track student progress and outcomes" },
      { title: "Industry Connect", Icon: Zap, description: "Connect students with opportunities" },
    ],
    university: [
      { title: "Research Opportunities", Icon: CheckCircle, description: "Collaborate on research projects" },
      { title: "Student Exchange", Icon: BarChart3, description: "Facilitate student exchange programs" },
      { title: "Global Networking", Icon: Zap, description: "Build international partnerships" },
    ],
    recruitment: [
      { title: "Verified Skills", Icon: CheckCircle, description: "Access verified student profiles" },
      { title: "Faster Hiring", Icon: Zap, description: "Reduce hiring time by 60%" },
      { title: "AI Recommendations", Icon: BarChart3, description: "Smart candidate matching" },
    ],
  };

  const illustrations = {
    school: educatorIllustration,
    college: educatorIllustration,
    university: educatorIllustration,
    recruitment: loginIllustration,
  };

  const titles = {
    school: {
      main: "Empower Students. Verify Real Skills.",
      subtitle: "Guide students and verify their skills for better opportunities.",
      login: "School Login",
    },
    college: {
      main: "Empower Students. Verify Real Skills.",
      subtitle: "Guide students and verify their skills for better opportunities.",
      login: "College Login",
    },
    university: {
      main: "Expand Horizons. Foster Excellence.",
      subtitle: "Collaborate globally and enhance academic excellence.",
      login: "University Login",
    },
    recruitment: {
      main: "Hire Smarter. Trust Skills, Not Just Resumes.",
      subtitle: "Access verified Skill Passports of students across India & beyond.",
      login: "Recruiter Login",
    },
  };

  const handleGetStarted = () => {
    if (activeTab === "school" || activeTab === "college") {
      if (!subscriptionType) {
        return; // Don't proceed without subscription selection
      }
      
      if (subscriptionType === "have") {
        // If they have a subscription, direct them to the appropriate sign-in page
        if (studentType === "university") {
          navigate(`/signup/university`);
        } else if (studentType === "school") {
          navigate(`/signup/school`);
        }
      } else if (subscriptionType === "purchase" || subscriptionType === "view") {
        // Redirect to subscription page with student type and mode as query parameters
        navigate(`/subscription?type=${studentType}&mode=${subscriptionType}`);
      }
    } else {
      navigate(`/signup/${activeTab}`);
    }
  };

  return (
    <div className="flex items-center lg:py-8 bg-white">
      <div className="w-full lg:mx-4 lg:my-8 xl:mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 h-screen lg:h-[700px] overflow-hidden">
        {/* LEFT SIDE */}
        {activeTab === "recruitment" ? (
          <div className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-gradient-to-br from-[#0a6aba] to-[#09277f]">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {titles.recruitment.main}
              </h2>
              <p className="mt-4 max-w-xl text-[#edf2f9]">
                {titles.recruitment.subtitle}
              </p>
            </div>

            <div className="relative z-10 flex justify-start items-end h-full mt-12">
              <img
                src={illustrations.recruitment}
                alt="recruitment illustration"
                className="w-80 lg:w-[24rem] object-contain drop-shadow-xl -ml-10"
              />

              {/* Animated Feature Cards */}
              <motion.div
                className="absolute top-1 lg:left-[8rem] xl:left-[12rem]"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <FeatureCard
                  title={featureCards.recruitment[0].title}
                  Icon={featureCards.recruitment[0].Icon}
                  description={featureCards.recruitment[0].description}
                />
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
                <FeatureCard
                  title={featureCards.recruitment[1].title}
                  Icon={featureCards.recruitment[1].Icon}
                  description={featureCards.recruitment[1].description}
                />
              </motion.div>

              <motion.div
                className="absolute bottom-8 lg:left-[8rem] xl:left-[12rem]"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <FeatureCard
                  title={featureCards.recruitment[2].title}
                  Icon={featureCards.recruitment[2].Icon}
                  description={featureCards.recruitment[2].description}
                />
              </motion.div>
            </div>
          </div>
        ) : (
          <div
            className="hidden lg:flex relative p-10 text-white flex-col justify-between rounded-3xl shadow-lg bg-cover bg-center"
            style={{
              backgroundImage: `url(${studentIllustration})`,
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {titles[activeTab].main}
              </h2>
              <p className="mt-4 max-w-xl">{titles[activeTab].subtitle}</p>
            </div>

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
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              >
                <FeatureCard title="Share with recruiters worldwide" Icon={Share2} />
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
        )}

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
            src={illustrations[activeTab]}
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
                  { id: "college", label: "College", Icon: User },
                  { id: "university", label: "University", Icon: User },
                  { id: "recruitment", label: "Recruitment", Icon: Briefcase },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
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

            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">
                {titles[activeTab].login}
              </h3>
              <p className="text-sm text-white/80 mt-2">
                {titles[activeTab].subtitle}
              </p>
            </div>
            <div className="rounded-2xl p-5 sm:p-6 bg-transparent">
              {(activeTab === "school" || activeTab === "college") && (
                <div className="mb-6">
                  <p className="text-white mb-3 font-medium">I am a:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="educator"
                        checked={studentType === "educator"}
                        onChange={(e) => setStudentType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Educator</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="school"
                        checked={studentType === "school"}
                        onChange={(e) => setStudentType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">School Student</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="admin"
                        checked={studentType === "admin"}
                        onChange={(e) => setStudentType(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Admin</span>
                    </label>
                  </div>
                </div>
              )}
              <button
                onClick={handleGetStarted}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* DESKTOP */}
          <div className="relative w-full max-w-md hidden lg:block">
            {/* Tabs */}
            {currentStep === 1 && (
              <div className="flex space-x-4 mb-16 sticky top-[40px] bg-white z-20 py-4 shadow-sm">
                {[
                  { id: "school", label: "School", Icon: User },
                  { id: "college", label: "College", Icon: User },
                  { id: "university", label: "University", Icon: User },
                  { id: "recruitment", label: "Recruitment", Icon: Briefcase },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === id
                        ? "bg-blue-50 text-[#0a6aba] font-semibold shadow-sm"
                        : "text-gray-600 hover:text-[#0a6aba]"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className={`tab-link ${activeTab === id ? "text-[#0a6aba]" : ""}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {(activeTab === "school" || activeTab === "college") && (
              /* Step indicator */
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900">
                {(activeTab === "school" || activeTab === "college") 
                  ? (currentStep === 1 ? titles[activeTab].login : "Subscription")
                  : titles[activeTab].login}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {(activeTab === "school" || activeTab === "college")
                  ? (currentStep === 1 ? titles[activeTab].subtitle : "Choose your subscription option")
                  : titles[activeTab].subtitle}
              </p>
            </div>
            <div className="rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 p-6 sm:p-8">
              {(activeTab === "school" || activeTab === "college") && (
                <>
                  {currentStep === 1 && (
                    <div className="mb-6">
                      <p className="text-gray-700 mb-3 font-medium">I am a:</p>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="studentType"
                            value="educator"
                            checked={studentType === "educator"}
                            onChange={(e) => setStudentType(e.target.value)}
                            className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-gray-700">Educator</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="studentType"
                            value="school"
                            checked={studentType === "school"}
                            onChange={(e) => setStudentType(e.target.value)}
                            className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-gray-700">
                            {activeTab === "school" ? "School Student" : "University Student"}
                          </span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="studentType"
                            value="admin"
                            checked={studentType === "admin"}
                            onChange={(e) => setStudentType(e.target.value)}
                            className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-gray-700">Admin</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div className="mb-6">
                      <p className="text-gray-700 mb-3 font-medium">Subscription:</p>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="subscriptionType"
                            value="have"
                            checked={subscriptionType === "have"}
                            onChange={(e) => setSubscriptionType(e.target.value)}
                            className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-gray-700">I already have a subscription</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="subscriptionType"
                            value="purchase"
                            checked={subscriptionType === "purchase"}
                            onChange={(e) => setSubscriptionType(e.target.value)}
                            className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-gray-700">Purchase subscription</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="subscriptionType"
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
                </>
              )}
              
              {(activeTab === "school" || activeTab === "college") ? (
                <div className="flex space-x-4">
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={currentStep < totalSteps ? handleNext : handleGetStarted}
                    disabled={currentStep === 2 && !subscriptionType}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep < totalSteps ? "Next" : 
                      subscriptionType === "have" ? "Sign In" :
                      subscriptionType === "purchase" ? "Buy Now" :
                      subscriptionType === "view" ? "See Plan" : "Get Started"
                    }
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div> 
  );
}