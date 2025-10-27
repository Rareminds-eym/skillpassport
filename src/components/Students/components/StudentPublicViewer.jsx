import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircle,
  Award,
  Mail,
  Phone,
  MapPin,
  User,
  Download,
  Copy,
  MessageSquare,
  MoreHorizontal,
  Star,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Share2,
  ArrowLeftIcon,
} from "lucide-react";
import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../context/AuthContext";

function safeParse(jsonLike) {
  if (!jsonLike) return {};
  if (typeof jsonLike === "object") return jsonLike;
  try {
    return JSON.parse(jsonLike);
  } catch (e) {
    try {
      return JSON.parse(
        String(jsonLike)
          .replace(/(\r\n|\n|\r)/g, " ")
          .replace(/'/g, '"')
      );
    } catch (e2) {
      return {};
    }
  }
}

function Avatar({ src, name, size = 88 }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 shadow-sm"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name || "avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="w-10 h-10 text-indigo-400" />
      )}
    </div>
  );
}

function SkillBadge({ skill, type = "technical" }) {
  const verified = skill.verified;
  const level = skill.level || 0;
  const isProcessing = skill.processing;
  const isEnabled = skill.enabled !== false;

  if (!isEnabled) return null;

  return (
    <div
      className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 
      bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-300 
      p-4 sm:p-5 w-full h-full"
    >
      {/* Title + Status */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h3 className="text-base sm:text-[17px] font-semibold text-gray-900 leading-tight break-words flex-1">
          {skill.name}
        </h3>

        {verified && (
          <span className="inline-flex items-center gap-1 px-2 py-[2px] text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            Verified
          </span>
        )}

        {isProcessing && (
          <span className="inline-flex items-center gap-1 px-2 py-[2px] text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            Pending
          </span>
        )}
      </div>
      {/* Category */}
      <p className="text-sm text-gray-500 truncate">
        {skill.category ||
          (skill.type && skill.type.replace(/_/g, " ")) ||
          (type === "soft" ? "Soft Skill" : "Technical Skill")}
      </p>
      {/* Stars */}
      <div className="flex items-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              i <= level ? "text-[#FFD700] fill-[#FFD700]" : "text-gray-300"
            } transition-colors duration-200`}
          />
        ))}
      </div>
    </div>
  );
}

// 📊 Donut (Circular Progress)
function Donut({ value }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  const ACCENT_COLOR = "#4f46e5"; // Indigo-600 or your brand color

  return (
    <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden>
      <circle
        cx="45"
        cy="45"
        r={radius}
        stroke="#e5e7eb"
        strokeWidth="10" // ⬆ Increased width for background circle
        fill="none"
      />
      <circle
        cx="45"
        cy="45"
        r={radius}
        stroke={ACCENT_COLOR}
        strokeWidth="10" // ⬆ Increased width for progress ring
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform="rotate(-90 45 45)"
        fill="none"
      />
      <text
        x="45"
        y="50"
        textAnchor="middle"
        fontSize="16"
        fill="#111827"
        fontWeight="700"
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export default function StudentPublicViewerModern() {
  const { user } = useAuth();
  // const navigate = useNavigate();
  const { toast } = useToast();
  const { email } = useParams();
  const { studentData, loading, error } = useStudentDataByEmail(email);
  const qrCodeValue = window.location.href;
  const [copied, setCopied] = useState(false);
  const raw = studentData;
  const parsedProfile = safeParse(raw?.profile);
  const profile = { ...(raw || {}), ...(parsedProfile || {}) };
  const [showShareModal, setShowShareModal] = useState(false);
  const technicalSkills = (
    raw?.technicalSkills ||
    parsedProfile.technicalSkills ||
    raw?.profile?.technicalSkills ||
    []
  ).filter((s) => s && s.enabled !== false);
  const softSkills = (
    raw?.softSkills ||
    parsedProfile.softSkills ||
    raw?.profile?.softSkills ||
    []
  ).filter((s) => s && s.enabled !== false);
  const education = (
    raw?.education ||
    parsedProfile.education ||
    raw?.profile?.education ||
    []
  ).filter((e) => e && e.enabled !== false);
  const training = (
    raw?.training ||
    parsedProfile.training ||
    raw?.profile?.training ||
    []
  ).filter((t) => t && t.enabled !== false);
  const experience = (
    raw?.experience ||
    parsedProfile.experience ||
    raw?.profile?.experience ||
    []
  ).filter((x) => x && x.enabled !== false);
  const certificates =
    raw?.certificates ||
    parsedProfile.certificates ||
    raw?.profile?.certificates ||
    [];

  useEffect(() => {
    document.title = `${
      profile.name || profile.fullName || "Student"
    } • Profile`;
  }, [profile.name, profile.fullName]);

  const phone =
    profile.contact_number ||
    profile.phone ||
    profile.contactNumber ||
    raw?.contact_number ||
    raw?.contact;
  const emailAddr = profile.email || raw?.email;
  const location = [
    profile.district_name || profile.district,
    profile.state_name || profile.state,
  ]
    .filter(Boolean)
    .join(", ");
  const university =
    profile.university ||
    profile.college_school_name ||
    raw?.college_school_name ||
    "";
  const registration_number =
    raw?.registrationNumber || profile.registrationNumber || "N/A";
  const employability = Math.max(
    0,
    Math.min(100, Number(profile?.employabilityScore || 0))
  );

  const tabs = [
    "Overview",
    "Experience",
    "Education",
    "Certificates",
    "Training",
  ];
  const [activeTab, setActiveTab] = useState("Overview");
  const tabRefs = useRef([]);

  function focusNextTab(i) {
    const n = (i + 1) % tabs.length;
    tabRefs.current[n]?.focus();
    setActiveTab(tabs[n]);
  }
  function focusPrevTab(i) {
    const p = (i - 1 + tabs.length) % tabs.length;
    tabRefs.current[p]?.focus();
    setActiveTab(tabs[p]);
  }
  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeValue);
    setCopied(true);
    toast({
      title: "Link copied",
      description: "Profile link copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Skill Passport",
          text: "Check out this student’s Skill Passport!",
          url: qrCodeValue,
        });
      } else {
        setShowShareModal(true);
      }
    } catch (err) {
      console.warn("Share failed:", err);
      setShowShareModal(true);
    }
  };

  if (
    !user ||
    (user.role?.toLowerCase() === "student" && user.email !== email) ||
    (user.role?.toLowerCase() !== "student" &&
      user.role?.toLowerCase() !== "recruiter")
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 max-w-md text-center border border-gray-200">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600">
            Only authorized recruiters can view student profiles.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 py-10 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-xl bg-gray-200"></div>

            {/* Info */}
            <div className="flex-1 space-y-3 w-full">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="flex gap-3 mt-4">
                <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
                <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
              </div>
            </div>

            {/* Donut Placeholder */}
            <div className="hidden sm:block w-28 h-28 bg-gray-100 rounded-full border border-gray-200"></div>
          </div>

          {/* Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Skeleton */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content Skeleton */}
            <section className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              {/* Tabs */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((t) => (
                  <div
                    key={t}
                    className="h-9 w-20 bg-gray-200 rounded-xl"
                  ></div>
                ))}
              </div>

              {/* Content Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 h-32 rounded-2xl border border-gray-200"
                  ></div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  if (error || !raw) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center border border-gray-200">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Unavailable
          </h2>
          <p className="text-gray-600">
            This profile could not be loaded. Please try again or verify the
            record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 py-8 px-4 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center lg:items-start justify-between">
              {/* Left: Avatar + Info */}
              <div className="flex flex-col md:flex-row items-start gap-5 flex-1 min-w-0">
                <Avatar src={profile.photo} name={profile.name} size={120} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 truncate">
                      {profile.name || profile.fullName || "Student Name"}
                    </h1>
                    {profile.verified && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-base text-indigo-600 font-medium mt-2">
                    {profile.skill ||
                      profile.course ||
                      profile.branch_field ||
                      university}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 w-full">
                    {/* Message button — full width on mobile */}
                    <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all duration-200 hover:scale-105">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>

                    {/* Wrapper for next two buttons on mobile */}
                    <div className="mt-2 flex w-full sm:w-auto gap-3 justify-between sm:mt-0">
                      <button
                        onClick={() => {
                          if (profile.resumeUrl) {
                            window.open(profile.resumeUrl, "_blank");
                            toast({
                              title: "Resume opened",
                              description:
                                "The student’s resume has been opened in a new tab.",
                            });
                          } else {
                            toast({
                              title: "No Resume Found",
                              description:
                                "This student has not uploaded a resume yet.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          profile.resumeUrl
                            ? "bg-white hover:bg-gray-50 border-2 border-gray-200"
                            : "opacity-50 cursor-not-allowed bg-gray-100 border-2 border-gray-200"
                        }`}
                        disabled={!profile.resumeUrl}
                      >
                        <Download className="w-4 h-4" />
                        Resume
                      </button>

                      <button
                        onClick={handleShare}
                        title="Share"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-200 text-sm font-medium transition-all duration-200"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center border shadow-sm">
                    <Donut value={employability} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Employability
                  </div>
                </div>
              </div>
              <div className="hidden sm:block border-l-2 border-gray-200 pl-6 space-y-4">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    Location
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {location || "Not specified"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    University
                  </div>
                  <div
                    className="text-sm font-semibold text-gray-900 truncate max-w-[200px]"
                    title={university}
                  >
                    {university || "Not specified"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    Registration
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {registration_number}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-28 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-7">
                {/* Header */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                    Contact Information
                  </h3>
                </div>

                {/* Contact List */}
                <dl className="divide-y divide-gray-100 space-y-1">
                  {/* Email */}
                  <div className="flex items-start gap-3 py-4 group">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0">
                      <Mail className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Email
                      </dt>
                      <div className="flex items-center justify-between gap-2">
                        <dd className="text-sm font-semibold text-gray-900 truncate">
                          {emailAddr || "—"}
                        </dd>
                        {emailAddr && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(emailAddr);
                              toast({
                                title: "Email copied",
                                description: `${emailAddr} has been copied to clipboard.`,
                              });
                            }}
                            id="copy-email"
                            title="Copy email"
                            className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3 py-4 group">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0">
                      <Phone className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Phone
                      </dt>
                      <div className="flex items-center justify-between gap-2">
                        <dd className="text-sm font-semibold text-gray-900">
                          {phone || "—"}
                        </dd>
                        {phone && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(phone);
                              toast({
                                title: "Phone number copied",
                                description: `${phone} has been copied to clipboard.`,
                              });
                            }}
                            id="copy-phone"
                            title="Copy phone number"
                            className="text-gray-400 hover:text-indigo-600 transition-colors duration-200"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 py-4">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0">
                      <MapPin className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Location
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {location || "—"}
                      </dd>
                    </div>
                  </div>

                  {/* Registration */}
                  <div className="flex items-start gap-3 py-4">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0">
                      <Star className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs font-medium text-gray-500 mb-1">
                        Registration Number
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {registration_number || "—"}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </aside>

            {/* Main Content */}
            <main className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-200 w-full max-w-full lg:col-span-8 xl:col-span-9 space-y-5 sm:space-y-6">
              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Profile sections"
                className="bg-white rounded-2xl p-2 flex gap-2 overflow-x-auto border-2 border-gray-100 scrollbar-hide"
              >
                {tabs.map((t, idx) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={activeTab === t}
                    ref={(el) => (tabRefs.current[idx] = el)}
                    onClick={() => setActiveTab(t)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight") focusNextTab(idx);
                      if (e.key === "ArrowLeft") focusPrevTab(idx);
                    }}
                    className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl text-sm sm:text-base font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === t
                        ? "bg-indigo-600 text-white shadow-sm" // 🟦 flat indigo, no gradient
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === "Overview" && (
                <div className="space-y-5 sm:space-y-6">
                  {/* About Section */}
                  <section className="p-2 sm:p-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        About
                      </h2>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-snug max-w-3xl">
                      {profile.summary ||
                        profile.bio ||
                        "This student hasn’t added a summary yet."}
                    </p>
                  </section>

                  {/* Technical Skills */}
                  <section className="p-2 sm:p-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Technical Skills
                      </h2>
                    </div>

                    {technicalSkills.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-3">
                        {technicalSkills.map((s, i) => (
                          <SkillBadge
                            key={s.id || i}
                            skill={s}
                            type="technical"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">
                          No technical skills added yet
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Soft Skills */}
                  <section className="p-2 sm:p-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                        <Award className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Soft Skills
                      </h2>
                    </div>

                    {softSkills.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                        {softSkills.map((s, i) => (
                          <SkillBadge key={s.id || i} skill={s} type="soft" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">
                          No soft skills added yet
                        </p>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* Experience Tab */}
              {activeTab === "Experience" && (
                <section className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                      Professional Experience
                    </h2>
                  </div>

                  {/* Empty State */}
                  {experience.length === 0 ? (
                    <div className="text-sm text-gray-500 italic">
                      No professional experience added yet.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {experience.map((exp, index) => (
                        <div
                          key={index}
                          className="group relative pl-8 py-5 hover:bg-indigo-50/40 transition-all duration-300 rounded-xl"
                        >
                          {/* Vertical Accent Line */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full group-hover:w-1.5 transition-all duration-300"></div>

                          {/* Header Row */}
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
                              {exp.role}
                            </h3>
                            {exp.verified && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            )}
                          </div>

                          {/* Organization + Duration */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="text-indigo-600 font-medium text-sm sm:text-base">
                              {exp.organization}
                            </p>
                            <p className="text-gray-500 font-medium text-sm">
                              {exp.duration}
                            </p>
                          </div>

                          {/* Summary */}
                          {exp.summary && (
                            <p className="text-sm text-gray-700 leading-relaxed mt-3">
                              {exp.summary}
                            </p>
                          )}

                          {/* Skills */}
                          {exp.skills?.length > 0 && (
                            <div className="mt-4">
                              <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
                                Skills Applied
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {exp.skills.map((sk, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 
                      text-xs font-medium hover:bg-indigo-100 transition-all duration-200"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Education Tab */}
              {activeTab === "Education" && (
                <section className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                      Education
                    </h2>
                  </div>

                  {/* Education List */}
                  <div className="space-y-5">
                    {education.length ? (
                      education.map((ed, i) => (
                        <div
                          key={ed.id || i}
                          className="group relative pl-8 py-4 hover:bg-indigo-50/40 transition-all duration-300 rounded-xl"
                        >
                          {/* Vertical Accent Line */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full group-hover:w-1.5 transition-all"></div>

                          {/* Degree & Institution */}
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-0.5">
                            {ed.degree || "Degree Not Specified"}
                          </h3>
                          <p className="text-sm text-indigo-600 font-medium">
                            {ed.university ||
                              ed.institution ||
                              "Institution Not Specified"}
                          </p>

                          {/* Department */}
                          {ed.department && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Department: {ed.department}
                            </p>
                          )}

                          {/* Footer (Year + CGPA + Status) */}
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            {/* Year */}
                            {ed.yearOfPassing && (
                              <span className="text-sm text-gray-600 font-medium">
                                {ed.yearOfPassing}
                              </span>
                            )}

                            {/* CGPA */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                              <span className="text-xs font-medium text-gray-600">
                                CGPA:
                              </span>
                              <span className="text-sm font-bold text-indigo-700">
                                {ed.cgpa || "N/A"}
                              </span>
                            </div>

                            {/* Status */}
                            {ed.status && (
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                  ed.status === "completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {ed.status === "completed"
                                  ? "Completed"
                                  : "Ongoing"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <GraduationCap className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">
                          No education records added yet
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Certificates Tab */}
              {activeTab === "Certificates" && (
                <section className="p-2 sm:p-3">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Certificates
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {certificates.length ? (
                      certificates.map((c, i) => (
                        <div
                          key={i}
                          className="group relative pl-4 sm:pl-6 py-3 border-l-2 border-amber-100 hover:border-amber-300 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            {/* Left - Certificate Info */}
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base font-semibold text-gray-900 leading-snug">
                                {c.title ||
                                  c.name ||
                                  c.cert ||
                                  "Untitled Certificate"}
                              </h3>
                              <p className="text-sm text-amber-700 font-medium mt-0.5">
                                {c.issuer ||
                                  c.issuer_name ||
                                  c.institution ||
                                  "Unknown Issuer"}
                              </p>
                            </div>

                            {/* Right - Date */}
                            {(c.year || c.date) && (
                              <div className="text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">
                                {c.year || c.date}
                              </div>
                            )}
                          </div>

                          {/* Additional Info (optional display for clarity) */}
                          {c.category || c.level ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {c.category || c.level}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">
                          No certificates uploaded yet
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Training Tab */}
              {activeTab === "Training" && (
                <section className="p-2 sm:p-3">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Training & Courses
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {training.length ? (
                      training.map((t, i) => {
                        const progress = t.progress || 0;
                        const segmentCount = 10;
                        const filledSegments = Math.round(
                          (progress / 100) * segmentCount
                        );

                        return (
                          <div
                            key={t.id || i}
                            className="group relative pl-4 sm:pl-6 py-3 border-l-2 border-indigo-100 hover:border-indigo-300 transition-all"
                          >
                            {/* Top Row */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                                  {t.course || t.name || "Untitled Course"}
                                </h3>
                                <p className="text-sm text-indigo-600 font-medium">
                                  {t.trainer || t.instructor || "Self-paced"}
                                </p>
                              </div>

                              {/* Status Badge */}
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-semibold text-center whitespace-nowrap ${
                                  t.status === "completed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : t.status === "ongoing"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-gray-50 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {t.status || "Enrolled"}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {typeof t.progress !== "undefined" && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    Progress
                                  </span>
                                  <span className="text-sm font-semibold text-indigo-600">
                                    {progress}%
                                  </span>
                                </div>
                                <div className="flex gap-1.5">
                                  {Array.from({ length: segmentCount }).map(
                                    (_, idx) => (
                                      <div
                                        key={idx}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                          idx < filledSegments
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                                            : "bg-gray-200"
                                        }`}
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">
                          No training courses recorded yet
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </main>
          </div>

          {/* Footer Note */}
          <div className="text-sm text-gray-500 text-center mt-8">
            Read-only preview — verify details before contacting
          </div>
        </div>
      </main>
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
              Share Student Skill Passport
            </h2>

            <div className="space-y-4">
              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    "Check out this Skill Passport: " + qrCodeValue
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
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967..." />
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
                    <path d="M20.447 20.452h-3.554v-5.569..." />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    "Check out this Skill Passport!"
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
                    <path d="M18.244 2.25h3.308l-7.227..." />
                  </svg>
                  <span>Twitter</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    "Check out this Skill Passport"
                  )}&body=${encodeURIComponent(
                    "Here is the Skill Passport link: " + qrCodeValue
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
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8..." />
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
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
