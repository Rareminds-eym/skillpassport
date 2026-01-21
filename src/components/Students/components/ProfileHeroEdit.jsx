import {
    AcademicCapIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    ClockIcon,
    Cog6ToothIcon,
    DocumentDuplicateIcon,
    EllipsisVerticalIcon,
    GlobeAltIcon,
    MapPinIcon,
    PlusIcon,
    ShareIcon,
    TrophyIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import {
    IconBrandFacebook,
    IconBrandGithub,
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandTwitter,
    IconBrandYoutube,
    IconWorld,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Rocket, Sprout, Star, Wrench } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import { supabase } from "../../../lib/supabaseClient";
import { generateBadges } from "../../../services/badgeService";
import {
    calculateEmployabilityScore,
    getDefaultEmployabilityScore,
} from "../../../utils/employabilityCalculator";
import { capitalizeName } from "../../../utils/helpers";
import EmployabilityScoreCard from "./EmployabilityScoreCard";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { FloatingDock } from "./ui/floating-dock";

// Helper to get level display with icon
const getLevelDisplay = (level, label) => {
  const iconClass = "w-4 h-4 inline-block mr-1";
  switch (level) {
    case "Excellent":
      return <span className="flex items-center gap-1"><Star className={iconClass} /> {label}</span>;
    case "Good":
      return <span className="flex items-center gap-1"><Rocket className={iconClass} /> {label}</span>;
    case "Moderate":
      return <span className="flex items-center gap-1"><Sprout className={iconClass} /> {label}</span>;
    case "Needs Support":
      return <span className="flex items-center gap-1"><Wrench className={iconClass} /> {label}</span>;
    default:
      return <span className="flex items-center gap-1"><FileText className={iconClass} /> {label}</span>;
  }
};

// ================= ANIMATED ACHIEVEMENT BUTTON =================
const AchievementButton = ({ onClick }) => {
  return (
    <>
      <style>
        {`
          .achievement-btn {
            width: 150px;
            height: 40px;
            background: linear-gradient(to right, rgb(234, 179, 8), rgb(249, 115, 22));
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: visible;
          }
          .achievement-btn:hover {
            background: linear-gradient(to right, rgb(202, 138, 4), rgb(234, 88, 12));
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            transform: scale(1.05);
          }
          .trophy-container {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .trophy-container svg {
            width: 16px;
            height: 16px;
            z-index: 3;
            color: white;
            transition: all 0.3s;
          }
          .achievement-btn:hover .trophy-container svg {
            transform: translateY(-3px) scale(1.1);
          }
          .achievement-text {
            font-size: 14px;
            color: white;
            font-weight: 600;
          }
          .confetti {
            width: 6px;
            height: 6px;
            position: absolute;
            border-radius: 50%;
            transition: all 0.4s;
            z-index: 1;
            opacity: 0;
          }
          .confetti-1 {
            background-color: #fbbf24;
            top: 50%;
            left: 15px;
          }
          .confetti-2 {
            background-color: #fb923c;
            top: 50%;
            left: 20px;
          }
          .confetti-3 {
            background-color: #fde047;
            top: 50%;
            left: 25px;
          }
          .achievement-btn:hover .confetti-1 {
            transform: translateY(-25px) translateX(-5px);
            opacity: 1;
            transition-delay: 0.1s;
          }
          .achievement-btn:hover .confetti-2 {
            transform: translateY(-30px) translateX(0px);
            opacity: 1;
            transition-delay: 0.15s;
          }
          .achievement-btn:hover .confetti-3 {
            transform: translateY(-25px) translateX(5px);
            opacity: 1;
            transition-delay: 0.2s;
          }
          .hover-tooltip {
            position: absolute;
            bottom: -35px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            z-index: 10;
          }
          .achievement-btn:hover .hover-tooltip {
            opacity: 1;
          }
        `}
      </style>
      <button onClick={onClick} className="achievement-btn">
        <div className="hover-tooltip">Click to view</div>
        <div className="confetti confetti-1"></div>
        <div className="confetti confetti-2"></div>
        <div className="confetti confetti-3"></div>
        <div className="trophy-container">
          <TrophyIcon />
        </div>
        <span className="achievement-text">Achievements</span>
      </button>
    </>
  );
};

// ================= REUSABLE DETAIL ITEM =================
const DetailItem = ({ label, value, highlight }) => (
  <div className="flex flex-col bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-all shadow-sm">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span
      className={`text-sm mt-1 ${highlight ? "text-purple-600 font-semibold" : "text-gray-900"
        }`}
    >
      {value}
    </span>
  </div>
);

const ProfileHeroEdit = ({ onEditClick }) => {
  // Add custom animations for scroll button
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .animate-spin-slow {
        animation: spin-slow 10s linear infinite;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Navigation hook
  const navigate = useNavigate();

  // Get logged-in user's email from localStorage
  const userEmail = localStorage.getItem("userEmail");

  // State for copy/share functionality
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // State for employability score
  const [employabilityData, setEmployabilityData] = useState(
    getDefaultEmployabilityScore()
  );

  // State for badges
  const [earnedBadges, setEarnedBadges] = useState([]);

  // State for hover card visibility
  const [hoveredBadgeData, setHoveredBadgeData] = useState(null);

  // State for details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // State for badge modal
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // State for achievements panel
  const [showAchievementsPanel, setShowAchievementsPanel] = useState(false);

  // State for institution name and location
  const [fetchedInstitutionName, setFetchedInstitutionName] = useState(null);
  const [fetchedInstitutionLocation, setFetchedInstitutionLocation] = useState(null);

  // Fetch real student data
  const {
    studentData: realStudentData,
    loading,
    error,
  } = useStudentDataByEmail(userEmail);

  // Calculate employability score and generate badges when student data changes
  useEffect(() => {
    if (realStudentData) {
      // Pass the entire realStudentData object which contains profile, technicalSkills, softSkills, etc.
      const scoreData = calculateEmployabilityScore(realStudentData);
      setEmployabilityData(scoreData);

      // Generate badges based on student data
      const badges = generateBadges(realStudentData);
      setEarnedBadges(badges);
    } else {
      // Use default score when no data available
      setEmployabilityData(getDefaultEmployabilityScore());
      setEarnedBadges([]);
    }
  }, [realStudentData]);

  // Calculate graduation year for school students
  const getGraduationYear = () => {
    if (!realStudentData) return null;
    
    // For college students, check profile.classYear first
    if (realStudentData.university_college_id && realStudentData.profile?.classYear) {
      return realStudentData.profile.classYear;
    }
    
    // For university/college students, use expectedGraduationDate
    if (realStudentData.expectedGraduationDate) {
      return new Date(realStudentData.expectedGraduationDate).getFullYear();
    }
    
    // For school students, calculate based on current grade
    if (realStudentData.school_id && realStudentData.grade) {
      const currentYear = new Date().getFullYear();
      const grade = parseInt(realStudentData.grade);
      
      // Assuming Grade 10 graduates in current academic year
      if (grade === 10) return currentYear;
      if (grade === 9) return currentYear + 1;
      if (grade === 8) return currentYear + 2;
      if (grade === 7) return currentYear + 3;
      if (grade === 6) return currentYear + 4;
    }
    
    return null;
  };

  const graduationYear = getGraduationYear();

  // Use individual columns instead of profile JSONB
  const displayData = realStudentData ? {
    name: realStudentData.name,
    email: realStudentData.email,
    department: realStudentData.branch_field,
    university: realStudentData.university,
    classYear: graduationYear || realStudentData.profile?.classYear || null,
    github_link: realStudentData.github_link || realStudentData.profile?.github_link,
    portfolio_link: realStudentData.portfolio_link || realStudentData.profile?.portfolio_link,
    linkedin_link: realStudentData.linkedin_link || realStudentData.profile?.linkedin_link,
    twitter_link: realStudentData.twitter_link || realStudentData.profile?.twitter_link,
    instagram_link: realStudentData.instagram_link || realStudentData.profile?.instagram_link,
    facebook_link: realStudentData.facebook_link || realStudentData.profile?.facebook_link,
    youtube_link: realStudentData.youtube_link || realStudentData.profile?.youtube_link,
    degree: realStudentData.branch_field,
    // Fallback to profile JSONB for any missing data
    ...realStudentData.profile
  } : null;
  
  // Debug logging for student type detection
  // console.log('DEBUG: student_type =', realStudentData?.student_type, '| school_id =', realStudentData?.school_id, '| isSchool =', (realStudentData?.student_type === 'school' || realStudentData?.school_id) ? 'YES' : 'NO');
  
  // Fetch institution name and location if not in relationship data
  useEffect(() => {
    const fetchInstitutionName = async () => {
      if (!realStudentData) return;

      // If school student and no school relationship data
      if (realStudentData.school_id && !realStudentData.schools?.name) {
        try {
          const { data, error } = await supabase
            .from('organizations')
            .select('name, city, state')
            .eq('id', realStudentData.school_id)
            .single();

          if (data && !error) {
            setFetchedInstitutionName(data.name);
            // Set location if city or state exists
            if (data.city || data.state) {
              const locationParts = [data.city, data.state].filter(Boolean);
              setFetchedInstitutionLocation(locationParts.join(', '));
            }
          }
        } catch (err) {
          console.error('Error fetching school name:', err);
        }
      }

      // If college student and no college relationship data
      if (realStudentData.university_college_id && !realStudentData.university_colleges) {
        try {
          const { data, error } = await supabase
            .from('university_colleges')
            .select(`
              name,
              university:organizations!university_colleges_university_id_fkey (
                name,
                city,
                state,
                organization_type
              )
            `)
            .eq('id', realStudentData.university_college_id)
            .single();

          if (data && !error) {
            const collegeName = data.name;
            const universityName = data.university?.name;
            setFetchedInstitutionName(
              universityName ? `${collegeName} - ${universityName}` : collegeName
            );
            // Set location if city or state exists
            const city = data.university?.city;
            const state = data.university?.state;
            if (city || state) {
              const locationParts = [city, state].filter(Boolean);
              setFetchedInstitutionLocation(locationParts.join(', '));
            }
          }
        } catch (err) {
          console.error('Error fetching college name:', err);
        }
      }
    };

    fetchInstitutionName();
  }, [realStudentData]);

  // Determine institution from relationships (school_id or university_college_id)
  const institutionName = React.useMemo(() => {
    if (!realStudentData) return "Institution";

    // For school students - check schools relationship first, then fallback to university field
    if (realStudentData.school_id) {
      if (realStudentData.schools?.name) {
        return realStudentData.schools.name;
      }
      // Use fetched name if available
      if (fetchedInstitutionName) {
        return fetchedInstitutionName;
      }
      // Fallback to university field (which might contain school name)
      if (realStudentData.university) {
        return realStudentData.university;
      }
      if (realStudentData.profile?.university) {
        return realStudentData.profile.university;
      }
      return "School";
    }

    // For college students - check university_colleges relationship
    if (realStudentData.university_college_id) {
      if (realStudentData.university_colleges) {
        const college = realStudentData.university_colleges;
        const university = college.universities;
        return university?.name ? `${college.name} - ${university.name}` : college.name;
      }
      // Use fetched name if available
      if (fetchedInstitutionName) {
        return fetchedInstitutionName;
      }
      // Fallback to university field
      if (realStudentData.university) {
        return realStudentData.university;
      }
      if (realStudentData.profile?.university) {
        return realStudentData.profile.university;
      }
      return "College";
    }

    // For students without school_id or university_college_id
    return realStudentData.university || realStudentData.profile?.university || "Institution";
  }, [realStudentData, fetchedInstitutionName]);

  // Determine institution location from relationships or fetched data
  const institutionLocation = React.useMemo(() => {
    if (!realStudentData) return null;

    // For school students - check schools relationship first
    if (realStudentData.school_id) {
      if (realStudentData.schools?.city || realStudentData.schools?.state) {
        const locationParts = [
          realStudentData.schools.city,
          realStudentData.schools.state
        ].filter(Boolean);
        return locationParts.join(', ');
      }
      // Use fetched location if available
      if (fetchedInstitutionLocation) {
        return fetchedInstitutionLocation;
      }
    }

    // For college students - check university_colleges relationship
    if (realStudentData.university_college_id) {
      if (realStudentData.university_colleges?.universities) {
        const university = realStudentData.university_colleges.universities;
        const locationParts = [
          university.district,
          university.state
        ].filter(Boolean);
        if (locationParts.length > 0) {
          return locationParts.join(', ');
        }
      }
      // Use fetched location if available
      if (fetchedInstitutionLocation) {
        return fetchedInstitutionLocation;
      }
    }

    return null;
  }, [realStudentData, fetchedInstitutionLocation]);



  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const studentId = realStudentData?.id || "student";
    return `${window.location.origin}/student/profile/${studentId}`;
  }, [realStudentData?.id]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle native share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "My Skill Passport",
          text: "Check out my Skill Passport!",
          url: qrCodeValue,
        })
        .catch(() => {
          // If native share fails, open modal
          setShowShareModal(true);
        });
    } else {
      // Fallback to modal for desktop
      setShowShareModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
            <img
              src="/assets/HomePage/RMLogo.webp"
              alt="RareMinds Logo"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 object-contain"
            />
          </div>
          <div className="mt-6">
            <p className="text-xl font-semibold text-gray-800 mb-2">Loading Profile...</p>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              Powered by <span className="font-semibold text-indigo-600">RareMinds</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-center">
        No student data found. Please check your email or contact support.
      </div>
    );
  }
  const quickEditSections = [
    {
      id: "education",
      label: "Education",
      icon: TrophyIcon,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      id: "training",
      label: "Training",
      icon: AcademicCapIcon,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      id: "experience",
      label: "Experience",
      icon: BriefcaseIcon,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
    {
      id: "softSkills",
      label: "Soft Skills",
      icon: PlusIcon,
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    },
    {
      id: "technicalSkills",
      label: "Technical",
      icon: PlusIcon,
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
  ];

  return (
    <div className="bg-[#f6f7fd] py-8 px-4 sm:px-6 lg:px-8">
      {/* Debug Component - Temporarily hidden */}
      {/* {process.env.NODE_ENV === 'development' && <EmployabilityDebugger />} */}

      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-3xl shadow-2xl border border-blue-300/70 overflow-hidden relative bg-blue-200/70 backdrop-blur-2xl"
          style={{
            boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
          }}
        >
          {/* Three-dot menu button - Top Right Corner */}
          <button
            onClick={() => navigate('/student/settings')}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-white/50 rounded-lg transition-colors group"
            title="Edit Profile Settings"
          >
            <EllipsisVerticalIcon className="w-6 h-6 text-gray-700 group-hover:text-blue-700" />
          </button>
          
          {/* <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 z-10" /> */}
          <CardContent className="py-4 relative z-10">
            {/* Sidebar Layout: Flex on Desktop, Stack on Mobile */}
            <div className="flex flex-col lg:flex-row gap-12 items-start mt-5 md:mt-10">
              {/* LEFT SIDEBAR - QR Code + Score (Fixed width on desktop) */}
              <div className="w-full lg:w-64 flex-shrink-0 space-y-4 order-2 lg:order-1 pl-6">
                {/* QR Code Card */}
                <Card variant="blue" className="bg-blue-50/60 backdrop-blur-xl border border-blue-200/60 rounded-2xl shadow-2xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-full bg-white rounded-xl flex items-center justify-center shadow-md p-2 mb-2">
                      {/* Student QR Code */}
                      <QRCodeSVG
                        value={qrCodeValue}
                        size={140}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <button
                      onClick={() => setShowDetailsModal(true)}
                      className="text-xs text-gray-900 font-bold mb-3 hover:text-blue-600 transition-colors cursor-pointer block w-full"
                    >
                      SKILL PASSPORT-ID : {
                        realStudentData?.student_id ||
                        (realStudentData?.registration_number ? `SP-${realStudentData.registration_number}` : null) ||
                        displayData?.passportId ||
                        (userEmail ? `SP-${userEmail.split("@")[0].toUpperCase().slice(0, 5)}` : "SP-2024-8421")
                      }
                    </button>

                    {/* Copy and Share Buttons - Icon Only */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white text-blue-600 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105"
                        title="Copy Link"
                      >
                        {copied ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <DocumentDuplicateIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105"
                        title="Share"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links - FloatingDock with Expansion */}
                {(displayData?.github_link ||
                  displayData?.portfolio_link ||
                  displayData?.linkedin_link ||
                  displayData?.twitter_link ||
                  displayData?.instagram_link ||
                  displayData?.facebook_link ||
                  displayData?.youtube_link) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-900">
                          Connect:
                        </span>
                      </div>
                      
                      {/* Custom expandable FloatingDock */}
                      <div className="group relative">
                        {(() => {
                          const allItems = [
                            displayData.github_link && {
                              title: "GitHub",
                              icon: <IconBrandGithub className="h-full w-full text-gray-700" />,
                              href: displayData.github_link.startsWith("http") ? displayData.github_link : `https://${displayData.github_link}`,
                            },
                            displayData.portfolio_link && {
                              title: "Portfolio",
                              icon: <IconWorld className="h-full w-full text-blue-600" />,
                              href: displayData.portfolio_link.startsWith("http") ? displayData.portfolio_link : `https://${displayData.portfolio_link}`,
                            },
                            displayData.linkedin_link && {
                              title: "LinkedIn",
                              icon: <IconBrandLinkedin className="h-full w-full text-blue-700" />,
                              href: displayData.linkedin_link.startsWith("http") ? displayData.linkedin_link : `https://${displayData.linkedin_link}`,
                            },
                            displayData.twitter_link && {
                              title: "Twitter",
                              icon: <IconBrandTwitter className="h-full w-full text-black" />,
                              href: displayData.twitter_link.startsWith("http") ? displayData.twitter_link : `https://${displayData.twitter_link}`,
                            },
                            displayData.instagram_link && {
                              title: "Instagram",
                              icon: <IconBrandInstagram className="h-full w-full text-pink-600" />,
                              href: displayData.instagram_link.startsWith("http") ? displayData.instagram_link : `https://${displayData.instagram_link}`,
                            },
                            displayData.facebook_link && {
                              title: "Facebook",
                              icon: <IconBrandFacebook className="h-full w-full text-blue-800" />,
                              href: displayData.facebook_link.startsWith("http") ? displayData.facebook_link : `https://${displayData.facebook_link}`,
                            },
                            displayData.youtube_link && {
                              title: "YouTube",
                              icon: <IconBrandYoutube className="h-full w-full text-red-600" />,
                              href: displayData.youtube_link.startsWith("http") ? displayData.youtube_link : `https://${displayData.youtube_link}`,
                            },
                          ].filter(Boolean);
                          
                          if (allItems.length <= 3) {
                            // If 3 or fewer items, show normal FloatingDock
                            return (
                              <FloatingDock
                                items={allItems}
                                desktopClassName="bg-white/80 backdrop-blur-sm border border-gray-200 transition-all duration-300 group-hover:bg-white group-hover:shadow-lg"
                              />
                            );
                          }
                          
                          // If more than 3 items, show expandable version
                          const visibleItems = allItems.slice(0, 3);
                          const hiddenItems = allItems.slice(3);
                          
                          return (
                            <div className="relative">
                              {/* Default state - show first 3 + indicator */}
                              <div className="group-hover:opacity-0 group-hover:pointer-events-none transition-all duration-300">
                                <FloatingDock
                                  items={[
                                    ...visibleItems,
                                    {
                                      title: `+${hiddenItems.length} more`,
                                      icon: <span className="text-xs font-semibold text-gray-600">+{hiddenItems.length}</span>,
                                      href: "#",
                                      onClick: (e) => e.preventDefault(),
                                    }
                                  ]}
                                  desktopClassName="bg-white/80 backdrop-blur-sm border border-gray-200"
                                />
                              </div>
                              
                              {/* Hover state - show all items vertically */}
                              <div className="absolute top-0 left-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300">
                                <div className="flex flex-col gap-2">
                                  {/* First row - original 3 items */}
                                  <FloatingDock
                                    items={visibleItems}
                                    desktopClassName="bg-white backdrop-blur-sm border border-gray-200 shadow-lg"
                                  />
                                  {/* Additional rows for remaining items */}
                                  {hiddenItems.length > 0 && (
                                    <FloatingDock
                                      items={hiddenItems}
                                      desktopClassName="bg-white backdrop-blur-sm border border-gray-200 shadow-lg"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
              </div>

              {/* RIGHT CONTENT AREA - Profile Info */}
              <div className="flex-1 space-y-6 order-1 lg:order-2 pr-6">
                {/* Profile Icon with Badge */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg border-2 border-white">
                      <AcademicCapIcon className="w-8 h-8 text-white" />
                    </div>
                    {/* Verification Status Badge */}
                    <div 
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md cursor-help ${
                        realStudentData?.approval_status === 'approved' 
                          ? 'bg-green-500' 
                          : realStudentData?.approval_status === 'pending'
                          ? 'bg-yellow-500'
                          : 'bg-red-400'
                      }`}
                      title={
                        realStudentData?.approval_status === 'approved' 
                          ? 'Verified Student - Profile has been Verified' 
                          : realStudentData?.approval_status === 'pending'
                          ? 'Pending Verification - Profile is under review'
                          : 'Unverified - Profile needs verification'
                      }
                    >
                      {realStudentData?.approval_status === 'approved' ? (
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      ) : realStudentData?.approval_status === 'pending' ? (
                        <ClockIcon className="w-4 h-4 text-white" />
                      ) : (
                        <XMarkIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-gray-900 drop-shadow-sm">
                        {capitalizeName(displayData.name) || "Student Name"}
                      </h1>
                      {/* Approval Status Badge */}
                      {/* {(realStudentData?.approval_status === 'approved') ? (
                        <Badge className="bg-green-500 text-white border-0 px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in duration-300">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-yellow-400 border-blue-300 border px-3 py-1.5 text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in duration-300">
                          <ClockIcon className="w-3.5 h-3.5" />
                          Pending
                        </Badge>
                      )} */}
                    </div>
                    {/* Institution Name and Location - Below Name */}
                    <div className="flex items-start gap-12 text-gray-800 mt-2">
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">
                          {institutionName}
                        </span>
                      </div>
                      {institutionLocation && (
                        <div className="flex items-center gap-1.5 text-gray-800">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">
                            {institutionLocation}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student ID (commented out) */}
                <div className="space-y-2 ml-1" style={{ display: 'none' }}>
                  {/* <div className="flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      Student ID:{" "}
                      {realStudentData?.student_id || "Not Assigned"}
                    </span>
                  </div> */}
                </div>

                {/* School-specific fields - Display when school_id is not null AND has actual data - COMPACT HORIZONTAL */}
                {realStudentData?.school_id && (realStudentData?.grade || realStudentData?.section || realStudentData?.roll_number || realStudentData?.admission_number) && (
                  <div className="bg-blue-50/60 backdrop-blur-md rounded-xl p-3 border border-blue-200/60 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AcademicCapIcon className="w-4 h-4 text-blue-700" />
                      <h3 className="text-gray-900 font-semibold text-xs">School Info</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {realStudentData.grade && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-slate-900 shadow-sm">
                          <span className="text-gray-900">Grade:</span> {realStudentData.grade}
                        </span>
                      )}
                      {realStudentData.section && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-slate-900 shadow-sm">
                          <span className="text-gray-900">Sec:</span> {realStudentData.section}
                        </span>
                      )}
                      {realStudentData.roll_number && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-slate-900 shadow-sm">
                          <span className="text-gray-900">Roll:</span> {realStudentData.roll_number}
                        </span>
                      )}
                      {realStudentData.admission_number && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-slate-900 shadow-sm">
                          <span className="text-gray-900">Adm:</span> {realStudentData.admission_number}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* College-specific fields - Display when university_college_id is not null AND has actual data - COMPACT HORIZONTAL */}
                {realStudentData?.university_college_id && (realStudentData?.registration_number || realStudentData?.admission_number || realStudentData?.student_id) && (
                  <div className="bg-indigo-50/60 backdrop-blur-md rounded-xl p-3 border border-indigo-200/60 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <TrophyIcon className="w-4 h-4 text-indigo-700" />
                      <h3 className="text-gray-900 font-semibold text-xs">College Info</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {realStudentData.registration_number && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <span className="text-gray-500">Reg:</span> {realStudentData.registration_number}
                        </span>
                      )}
                      {realStudentData.admission_number && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <span className="text-gray-500">Adm:</span> {realStudentData.admission_number}
                        </span>
                      )}
                      {realStudentData.student_id && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <span className="text-gray-500">ID:</span> {realStudentData.student_id}
                        </span>
                      )}
                      {realStudentData.roll_number && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <span className="text-gray-500">Roll:</span> {realStudentData.roll_number}
                        </span>
                      )}
                      {realStudentData.branch_field && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <span className="text-gray-500">Program:</span> {realStudentData.branch_field}
                        </span>
                      )}
                      {realStudentData.section && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                          <span className="text-gray-500">Sec:</span> {realStudentData.section}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                 {/* Tags */}
                {(displayData.classYear || displayData.department || displayData.degree) && (
                  <div className="flex flex-wrap gap-3">
                  {/* Only show department/degree badge if NOT already shown in College Info section */}
                  {(displayData.department || displayData.degree) && !realStudentData?.branch_field && (
                    <Badge className="bg-white text-indigo-700 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                      {displayData.department || displayData.degree}
                    </Badge>
                  )}
                  {displayData.classYear && (
                    <Badge className="bg-white text-blue-600 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                      {displayData.classYear}
                    </Badge>
                  )}
                </div>
                )}

                {/* Employability Score - New Circular Gauge with Radar Chart */}
                <EmployabilityScoreCard employabilityData={employabilityData} />

                {/* Achievements - Inline Slider */}
                {earnedBadges.length > 0 && (
                  <div className="flex items-center gap-3 overflow-x-visible">
                    <AchievementButton
                      onClick={() => setShowAchievementsPanel(!showAchievementsPanel)}
                    />

                    <AnimatePresence>
                      {showAchievementsPanel && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ type: "spring", damping: 20, stiffness: 150 }}
                          className="flex gap-2 overflow-hidden"
                        >
                          {earnedBadges.slice(0, 8).map((badge, index) => (
                            <motion.div
                              key={index}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex-shrink-0"
                            >
                              <button
                                onClick={() => {
                                  setSelectedBadge(badge);
                                  setShowBadgeModal(true);
                                }}
                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                                style={{
                                  backgroundColor: `${badge.color}20`,
                                  color: badge.color
                                }}
                                title={badge.name}
                              >
                                {badge.icon}
                              </button>
                            </motion.div>
                          ))}
                          {earnedBadges.length > 8 && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ delay: 0.4 }}
                              className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700"
                            >
                              +{earnedBadges.length - 8}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Social Media Links - Moved to Sidebar */}
                {false && (displayData.github_link ||
                  displayData.portfolio_link ||
                  displayData.linkedin_link ||
                  displayData.twitter_link ||
                  displayData.instagram_link ||
                  displayData.facebook_link) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">
                          Connect:
                        </span>
                      </div>
                      <FloatingDock
                        items={[
                          displayData.github_link && {
                            title: "GitHub",
                            icon: <IconBrandGithub className="h-full w-full text-gray-700" />,
                            href: displayData.github_link.startsWith("http") ? displayData.github_link : `https://${displayData.github_link}`,
                          },
                          displayData.portfolio_link && {
                            title: "Portfolio",
                            icon: <IconWorld className="h-full w-full text-blue-600" />,
                            href: displayData.portfolio_link.startsWith("http") ? displayData.portfolio_link : `https://${displayData.portfolio_link}`,
                          },
                          displayData.linkedin_link && {
                            title: "LinkedIn",
                            icon: <IconBrandLinkedin className="h-full w-full text-blue-700" />,
                            href: displayData.linkedin_link.startsWith("http") ? displayData.linkedin_link : `https://${displayData.linkedin_link}`,
                          },
                          displayData.twitter_link && {
                            title: "Twitter",
                            icon: <IconBrandTwitter className="h-full w-full text-black" />,
                            href: displayData.twitter_link.startsWith("http") ? displayData.twitter_link : `https://${displayData.twitter_link}`,
                          },
                          displayData.instagram_link && {
                            title: "Instagram",
                            icon: <IconBrandInstagram className="h-full w-full text-pink-600" />,
                            href: displayData.instagram_link.startsWith("http") ? displayData.instagram_link : `https://${displayData.instagram_link}`,
                          },
                          displayData.facebook_link && {
                            title: "Facebook",
                            icon: <IconBrandFacebook className="h-full w-full text-blue-800" />,
                            href: displayData.facebook_link.startsWith("http") ? displayData.facebook_link : `https://${displayData.facebook_link}`,
                          },
                        ].filter(Boolean)}
                        desktopClassName="bg-white/80 backdrop-blur-sm border border-gray-200"
                      />
                      <div className="hidden flex-wrap gap-2">
                        {displayData.github_link && (
                          <div className="relative group">
                            <a
                              href={
                                displayData.github_link.startsWith("http")
                                  ? displayData.github_link
                                  : `https://${displayData.github_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-700 hover:border-gray-600"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              GitHub Profile
                            </div>
                          </div>
                        )}

                        {displayData.portfolio_link && (
                          <div className="relative group">
                            <a
                              href={
                                displayData.portfolio_link.startsWith("http")
                                  ? displayData.portfolio_link
                                  : `https://${displayData.portfolio_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 border border-blue-400"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <GlobeAltIcon className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Portfolio Website
                            </div>
                          </div>
                        )}

                        {displayData.linkedin_link && (
                          <div className="relative group">
                            <a
                              href={
                                displayData.linkedin_link.startsWith("http")
                                  ? displayData.linkedin_link
                                  : `https://${displayData.linkedin_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 border border-blue-500"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              LinkedIn Profile
                            </div>
                          </div>
                        )}

                        {displayData.twitter_link && (
                          <div className="relative group">
                            <a
                              href={
                                displayData.twitter_link.startsWith("http")
                                  ? displayData.twitter_link
                                  : `https://${displayData.twitter_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 border border-gray-700"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Twitter/X Profile
                            </div>
                          </div>
                        )}

                        {displayData.instagram_link && (
                          <div className="relative group">
                            <a
                              href={
                                displayData.instagram_link.startsWith("http")
                                  ? displayData.instagram_link
                                  : `https://${displayData.instagram_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-600 hover:via-purple-600 hover:to-orange-600 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-pink-500/50 hover:scale-105 border border-pink-400"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Instagram Profile
                            </div>
                          </div>
                        )}

                        {displayData.facebook_link && (
                          <div className="relative group">
                            <a
                              href={
                                displayData.facebook_link.startsWith("http")
                                  ? displayData.facebook_link
                                  : `https://${displayData.facebook_link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-700/50 hover:scale-105 border border-blue-600"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <svg className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              Facebook Profile
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Removed Quick Edit Buttons Section */}
              </div>
            </div>

            {/* Scroll Down Button */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // Scroll to the dashboard section below
                  window.scrollBy({
                    top: window.innerHeight * 0.8,
                    behavior: 'smooth'
                  });
                }}
                className="relative group cursor-pointer"
                aria-label="Scroll to dashboard"
              >
                {/* Rotating text circle */}
                <svg className="w-24 h-24 animate-spin-slow" viewBox="0 0 100 100">
                  <defs>
                    <path
                      id="circlePath"
                      d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    />
                  </defs>
                  <text className="text-[9.4px] fill-gray-600 font-medium tracking-wide">
                    <textPath href="#circlePath" startOffset="0%">
                      SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •
                    </textPath>
                  </text>
                </svg>

                {/* Center arrow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <ChevronDownIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </button>
            </div>
          </CardContent>

          {/* Badge Hover Cards - Positioned below the hovered badge */}
          {hoveredBadgeData && earnedBadges[hoveredBadgeData.index] && (
            <div
              className="fixed z-[9999] transition-all duration-200"
              style={{
                top: hoveredBadgeData.rect.top-80, // Position below the badge
                left: hoveredBadgeData.rect.left + hoveredBadgeData.rect.width / 2 , // Center horizontally on the badge
                transform: 'translateX(-40%)', // Center the card
              }}
            >
              <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-64 max-w-xs relative">
                {/* Badge Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
                    style={{
                      backgroundColor: `${earnedBadges[hoveredBadgeData.index].color}20`,
                      color: earnedBadges[hoveredBadgeData.index].color
                    }}
                  >
                    {earnedBadges[hoveredBadgeData.index].icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{earnedBadges[hoveredBadgeData.index].name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{earnedBadges[hoveredBadgeData.index].category}</p>
                  </div>
                </div>

                {/* Badge Description */}
                <p className="text-xs text-gray-600 leading-relaxed mb-3">{earnedBadges[hoveredBadgeData.index].description}</p>

                {/* Earned Date */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                  Earned {new Date(earnedBadges[hoveredBadgeData.index].earnedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 relative animate-fade-in-up">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              Share Your Skill Passport
            </h2>

            <div className="space-y-4">
              {/* Social Media Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    "Check out my Skill Passport: " + qrCodeValue
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    qrCodeValue
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    "Check out my Skill Passport!"
                  )}&url=${encodeURIComponent(qrCodeValue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Twitter</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    "Check out my Skill Passport"
                  )}&body=${encodeURIComponent(
                    "Here is my Skill Passport: " + qrCodeValue
                  )}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email</span>
                </a>
              </div>

              {/* Copy Link */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Or copy link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCodeValue}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STUDENT DETAILS MODAL ================= */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-lg mx-4 relative max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Close Button */}
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-light transition-all"
              onClick={() => setShowDetailsModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🎓 Student Details</h2>
              <p className="text-sm text-gray-500">Overview of student profile and progress</p>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg border-2 border-white">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {capitalizeName(displayData.name) || "Student Name"}
                </h3>
                <p className="text-sm text-gray-600">{institutionName}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="Student ID" value={
                realStudentData?.student_id || 
                (realStudentData?.registration_number ? `SP-${realStudentData.registration_number}` : null) ||
                displayData?.passportId || 
                displayData?.studentId || 
                "N/A"
              } />
              <DetailItem 
                label={(realStudentData?.student_type === 'school' || realStudentData?.school_id) ? 'Grade/Section' : 'Department'} 
                value={
                  (realStudentData?.student_type === 'school' || realStudentData?.school_id)
                    ? (realStudentData?.grade 
                        ? `Grade ${realStudentData.grade}${realStudentData?.section ? ` - ${realStudentData.section}` : ''}` 
                        : 'N/A')
                    : (displayData.department || displayData.degree || 'N/A')
                } 
              />
              <DetailItem 
                label="Class Year" 
                value={displayData.classYear || 'N/A'} 
              />
              <DetailItem label="Employability Score" value={`${employabilityData.employabilityScore}%`} highlight />
              <DetailItem label="Level" value={getLevelDisplay(employabilityData.level, employabilityData.label)} />
            </div>

            {/* Badges Info */}
            {earnedBadges.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrophyIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">Achievements Earned</span>
                </div>
                <p className="text-sm text-gray-600">
                  {earnedBadges.length} badge{earnedBadges.length !== 1 ? "s" : ""} earned
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= BADGE DETAILS MODAL ================= */}
      {showBadgeModal && selectedBadge && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-xl relative overflow-hidden border border-gray-100">
            {/* Header */}
            <div
              className="relative px-4 sm:px-8 py-4 sm:py-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${selectedBadge.color} 0%, ${selectedBadge.color}cc 100%)`,
              }}
            >
              <button
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-light transition-all"
                onClick={() => setShowBadgeModal(false)}
                aria-label="Close"
              >
                ×
              </button>

              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg border border-white/30">
                  {selectedBadge.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedBadge.name}</h2>
                  <p className="text-white/90 text-sm uppercase tracking-wide font-medium">
                    {selectedBadge.category} Achievement
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Achievement Overview</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedBadge.description}</p>
              </div>

              {/* Earned Date */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Earned On</p>
                    <p className="text-xs text-gray-600">Achievement Date</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedBadge.earnedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Criteria (if any) */}
              {selectedBadge.criteriaText && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Achievement Criteria</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">{selectedBadge.criteriaText}</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowBadgeModal(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeroEdit;
