import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import educatorIllustration from "../../../../assets/images/auth/Educator-illustration.jpg";
import loginIllustration from "../../../../assets/images/auth/Recruiter-illustration.png";
import studentIllustration from "../../../../assets/images/auth/Student-illustration.jpg";
import LoginModal from '../../../../components/Subscription/LoginModal';

import {
    Activity,
    BadgeCheck,
    BarChart3,
    Briefcase,
    CheckCircle,
    Info,
    Share2,
    User,
    X,
    Zap
} from "lucide-react";
import FeatureCard from "../ui/FeatureCard";

export default function UnifiedSignup() {
  const { type } = useParams();
  const [activeTab, setActiveTab] = useState(type || "school");
  const [studentType, setStudentType] = useState(null);
  const [recruitmentType, setRecruitmentType] = useState(null);
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [showRecruiterInfo, setShowRecruiterInfo] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  // Sync URL with active tab
  useEffect(() => {
    if (type && ["school", "college", "university", "recruitment"].includes(type)) {
      setActiveTab(type);
    }
  }, [type]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/register/${tabId}`);
    setStudentType(null);
    setRecruitmentType(null);
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

  // Helper function to map student type to entity-specific type
  const getEntitySpecificType = (type, tab) => {
    // For admin, student, and educator, map to entity-specific types
    if (type === "admin") {
      if (tab === "college") return "college-admin";
      if (tab === "university") return "university-admin";
      return "admin"; // school
    } else if (type === "student") {
      if (tab === "college") return "college-student";
      if (tab === "university") return "university-student";
      return "school-student"; // school
    } else if (type === "educator") {
      if (tab === "college") return "college-educator";
      if (tab === "university") return "university-educator";
      return "school-educator"; // school
    }
    return type; // fallback for other types
  };

  const handleGetStarted = () => {
    if (activeTab === "school" || activeTab === "college" || activeTab === "university") {
      if (!studentType) return;
      const entityType = getEntitySpecificType(studentType, activeTab);
      navigate(`/subscription/plans/${entityType}/purchase`);
    } else if (activeTab === "recruitment") {
      if (!recruitmentType) return;
      const entityType = recruitmentType === "admin" ? "recruitment-admin" : "recruitment-recruiter";
      navigate(`/subscription/plans/${entityType}/purchase`);
    }
  };

  // Function to handle info button clicks
  const handleInfoClick = (type) => {
    if (type === "admin") {
      setShowRecruiterInfo(false);
      setShowAdminInfo(!showAdminInfo);
    } else {
      setShowAdminInfo(false);
      setShowRecruiterInfo(!showRecruiterInfo);
    }
  };

  // Reset selection when user type changes
  const handleStudentTypeChange = (type) => {
    setStudentType(type);
  };

  // Handle recruitment type change
  const handleRecruitmentTypeChange = (type) => {
    setRecruitmentType(type);
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
            <div className="flex space-x-2 mb-6 bg-white/20 backdrop-blur-sm rounded-xl p-1">
              {[
                { id: "school", label: "School", Icon: User },
                { id: "college", label: "College", Icon: User },
                { id: "university", label: "University", Icon: User },
                { id: "recruitment", label: "Recruitment", Icon: Briefcase },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all ${activeTab === id
                    ? "bg-white/20 backdrop-blur-sm text-white"
                    : "text-white/70 hover:text-white"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>

            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-white">
                {titles[activeTab].login}
              </h3>
              <p className="text-sm text-white/80 mt-2">
                {titles[activeTab].subtitle}
              </p>
            </div>
            <div className="rounded-2xl p-5 sm:p-6 bg-transparent">
              {/* School/College Section for Mobile */}
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
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Educator</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="student"
                        checked={studentType === "student"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">
                        {activeTab === "school" ? "School Student" : "College Student"}
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="admin"
                        checked={studentType === "admin"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Admin</span>
                    </label>
                  </div>
                </div>
              )}

              {/* University Section for Mobile */}
              {activeTab === "university" && (
                <div className="mb-6">
                  <p className="text-white mb-3 font-medium">I am a:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="educator"
                        checked={studentType === "educator"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Educator</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="student"
                        checked={studentType === "student"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">University Student</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentTypeMobile"
                        value="admin"
                        checked={studentType === "admin"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-white">Admin</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Recruitment Section for Mobile */}
              {activeTab === "recruitment" && (
                <div className="mb-6">
                  <p className="text-white mb-3 font-medium">
                    I am {recruitmentType === "admin" ? "an" : "a"}:
                  </p>
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

              {/* Mobile Buy Now button */}
              <button
                onClick={handleGetStarted}
                disabled={(activeTab === "recruitment" && !recruitmentType) || (activeTab !== "recruitment" && !studentType)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* DESKTOP */}
          <div className="relative w-full max-w-md hidden lg:block">
            {/* Tabs */}
            <div className="flex space-x-4 mb-16 sticky top-[40px] bg-white z-20 py-4 shadow-sm -ml-4">
              {[
                { id: "school", label: "School", Icon: User },
                { id: "college", label: "College", Icon: User },
                { id: "university", label: "University", Icon: User },
                { id: "recruitment", label: "Recruitment", Icon: Briefcase },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${activeTab === id
                    ? "bg-blue-50 text-[#0a6aba] font-semibold shadow-sm"
                    : "text-gray-600 hover:text-[#0a6aba]"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`tab-link ${activeTab === id ? "text-[#0a6aba]" : ""}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900">
                {titles[activeTab].login}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {titles[activeTab].subtitle}
              </p>
            </div>
            <div className="rounded-2xl bg-white/95 shadow-xl ring-1 ring-black/5 p-6 sm:p-8">
              {/* School/College Section for Desktop */}
              {(activeTab === "school" || activeTab === "college") && (
                <div className="mb-6">
                  <p className="text-gray-700 mb-3 font-medium">I am a:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentType"
                        value="educator"
                        checked={studentType === "educator"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Educator</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentType"
                        value="student"
                        checked={studentType === "student"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">
                        {activeTab === "school" ? "School Student" : "College Student"}
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentType"
                        value="admin"
                        checked={studentType === "admin"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Admin</span>
                    </label>
                  </div>
                </div>
              )}

              {/* University Section for Desktop */}
              {activeTab === "university" && (
                <div className="mb-6">
                  <p className="text-gray-700 mb-3 font-medium">I am a:</p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentType"
                        value="educator"
                        checked={studentType === "educator"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Educator</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentType"
                        value="student"
                        checked={studentType === "student"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">University Student</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="studentType"
                        value="admin"
                        checked={studentType === "admin"}
                        onChange={(e) => handleStudentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Admin</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Recruitment Section for Desktop */}
              {activeTab === "recruitment" && (
                <div className="mb-6">
                  <p className="text-gray-700 mb-3 font-medium">
                    I am {recruitmentType === "admin" ? "an" : "a"}:
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer group ">
                      <input
                        type="radio"
                        name="recruitmentType"
                        value="admin"
                        checked={recruitmentType === "admin"}
                        onChange={(e) => handleRecruitmentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Admin</span>
                      <button
                        type="button"
                        onClick={() => handleInfoClick("admin")}
                        className="text-blue-500 hover:text-blue-600 ml-auto transition-all duration-200 hover:scale-110 hover:drop-shadow-lg pl-4"
                        title="Learn more about Admin signup"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="recruitmentType"
                        value="recruiter"
                        checked={recruitmentType === "recruiter"}
                        onChange={(e) => handleRecruitmentTypeChange(e.target.value)}
                        className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-gray-700">Recruiter</span>
                      <button
                        type="button"
                        onClick={() => handleInfoClick("recruiter")}
                        className="text-blue-500 hover:text-blue-600 ml-auto transition-all duration-200 hover:scale-110 hover:drop-shadow-lg"
                        title="Learn more about Recruiter signup"
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
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-gray-700 text-sm">
                          <div className="flex justify-between items-start">
                            <p>
                              You're creating your company's workspace to generate Workspace ID.
                            </p>
                            <button
                              onClick={() => setShowAdminInfo(false)}
                              className="text-gray-400 hover:text-gray-600 ml-6 flex-shrink-0 transition-colors"
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
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-gray-700 text-sm">
                          <div className="flex justify-between items-start">
                            <p>
                              Enter the Workspace ID given by your admin to join your company's workspace.
                            </p>
                            <button
                              onClick={() => setShowRecruiterInfo(false)}
                              className="text-gray-400 hover:text-gray-600 ml-3 flex-shrink-0 transition-colors"
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

              {/* Buy Now button for all sections */}
              <button
                onClick={handleGetStarted}
                disabled={(activeTab === "recruitment" && !recruitmentType) || (activeTab !== "recruitment" && !studentType)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal for existing subscription users */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        selectedPlan={null}
        studentType={activeTab}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          navigate('/my-subscription');
        }}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          navigate('/signup');
        }}
      />
    </div>
  );
}
